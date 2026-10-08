import type { AssistantChatMessage } from "./assistantMemory";

export async function askEpiSafeAssistant(
  messages: AssistantChatMessage[],
  healthSummary?: string,
): Promise<string> {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      ...(healthSummary ? { healthSummary } : {}),
    }),
  });

  const result: unknown = await response.json();
  if (!result || typeof result !== "object") {
    throw new Error("The assistant returned an unexpected response.");
  }
  if (!response.ok) {
    const message = "error" in result && typeof result.error === "string"
      ? result.error
      : "The assistant could not respond. Please try again.";
    throw new Error(message);
  }
  if (!("reply" in result) || typeof result.reply !== "string" || !result.reply.trim()) {
    throw new Error("The assistant returned an empty response. Please try again.");
  }
  return result.reply.trim();
}
