import { createHmac } from "node:crypto";
import type { Handler } from "@netlify/functions";
import { ApiError, jsonResponse } from "../src/server";
import { buildAssistantInstructions, validateAssistantRequest } from "../src/assistant";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 8;
const requestWindows = new Map<string, number[]>();

function allowRequest(ipAddress: string, key: string): boolean {
  const now = Date.now();
  const fingerprint = createHmac("sha256", key).update(ipAddress || "unknown").digest("hex");
  const activeRequests = (requestWindows.get(fingerprint) ?? [])
    .filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (activeRequests.length >= RATE_LIMIT_REQUESTS) {
    requestWindows.set(fingerprint, activeRequests);
    return false;
  }

  activeRequests.push(now);
  requestWindows.set(fingerprint, activeRequests);
  if (requestWindows.size > 2000) {
    for (const [storedFingerprint, timestamps] of requestWindows) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_LIMIT_WINDOW_MS)) {
        requestWindows.delete(storedFingerprint);
      }
    }
  }
  return true;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(204, {});
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Use POST for the assistant." });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(503, {
      error: "The AI assistant is not connected yet. The site administrator must configure OPENAI_API_KEY in Netlify.",
    });
  }

  try {
    if (!event.body || event.body.length > 18000) {
      throw new ApiError(413, "The conversation request is too large.");
    }
    const requestOrigin = event.headers.origin;
    let configuredOrigin: string | undefined;
    if (process.env.APP_BASE_URL) {
      try {
        configuredOrigin = new URL(process.env.APP_BASE_URL).origin;
      } catch {
        throw new ApiError(503, "APP_BASE_URL must be a valid site URL to enable the assistant.");
      }
    }
    if (requestOrigin && (!configuredOrigin || requestOrigin !== configuredOrigin)) {
      return jsonResponse(403, { error: "This site is not allowed to use the assistant." });
    }
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(event.body);
    } catch {
      throw new ApiError(400, "The request body is not valid JSON.");
    }

    const request = validateAssistantRequest(rawBody);
    const ipAddress = event.headers["x-nf-client-connection-ip"]
      ?? event.headers["x-forwarded-for"]?.split(",")[0]?.trim()
      ?? "unknown";
    if (!allowRequest(ipAddress, apiKey)) {
      return jsonResponse(429, { error: "You have reached the assistant's short-term usage limit. Please try again later." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [
          { role: "system", content: buildAssistantInstructions(request.healthSummary) },
          ...request.messages,
        ],
        max_completion_tokens: 500,
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error("OpenAI assistant request failed.", response.status);
      if (response.status === 429) {
        return jsonResponse(429, { error: "The AI service is busy right now. Please wait a moment and try again." });
      }
      return jsonResponse(502, { error: "The AI service could not answer right now. Please try again shortly." });
    }

    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("choices" in result) || !Array.isArray(result.choices)) {
      throw new ApiError(502, "The AI service returned an unexpected response.");
    }
    const firstChoice = result.choices[0];
    const reply = firstChoice?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new ApiError(502, "The AI service returned an empty response. Please try again.");
    }

    return jsonResponse(200, { reply: reply.trim() });
  } catch (error) {
    if (error instanceof ApiError) return jsonResponse(error.statusCode, { error: error.message });
    if (error instanceof Error && error.name === "TimeoutError") {
      return jsonResponse(504, { error: "The AI took too long to respond. Please try again." });
    }
    console.error("Unexpected EpiSafe assistant error.", error);
    return jsonResponse(500, { error: "The assistant could not respond. Please try again." });
  }
};
