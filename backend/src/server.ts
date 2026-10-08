import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonResponse(statusCode: number, payload: unknown): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": process.env.APP_BASE_URL ?? "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}

export async function authenticatedClient(event: HandlerEvent) {
  const authorization = event.headers.authorization ?? event.headers.Authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new ApiError(401, "Sign in to access your personal health information.");

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError(503, "Cloud storage is not configured. Add the Supabase server environment variables.");
  }

  const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new ApiError(401, "Your sign-in is invalid or has expired.");
  return { client, userId: data.user.id };
}

export function readRequestBody(event: HandlerEvent): Record<string, unknown> {
  if (!event.body) throw new ApiError(400, "A JSON request body is required.");
  try {
    const body: unknown = JSON.parse(event.body);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "The request body must be a JSON object.");
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "The request body is not valid JSON.");
  }
}

export function assertNumber(value: unknown, label: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new ApiError(400, `${label} must be a number between ${minimum} and ${maximum}.`);
  }
  return value;
}

export function assertText(value: unknown, label: string, maximum: number, required = true): string {
  if (typeof value !== "string" || value.length > maximum || (required && value.trim().length === 0)) {
    throw new ApiError(400, `${label} must be ${required ? "a non-empty string" : "text"} no longer than ${maximum} characters.`);
  }
  return value.trim();
}
