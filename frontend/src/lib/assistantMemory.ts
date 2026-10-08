import { getDemoUserId } from "../data/demoData";

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const MESSAGE_LIMIT = 40;

function storageKey(): string {
  return `episafe.assistant.memory.${getDemoUserId()}`;
}

export function loadAssistantMemory(): AssistantChatMessage[] {
  const stored = window.localStorage.getItem(storageKey());
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Saved assistant memory must be a list.");
    return parsed.filter((item): item is AssistantChatMessage =>
      Boolean(item)
      && typeof item === "object"
      && typeof item.id === "string"
      && (item.role === "user" || item.role === "assistant")
      && typeof item.content === "string"
      && typeof item.createdAt === "string",
    ).slice(-MESSAGE_LIMIT);
  } catch (error) {
    console.error("Unable to read saved assistant memory.", error);
    return [];
  }
}

export function saveAssistantMemory(messages: AssistantChatMessage[]): void {
  window.localStorage.setItem(storageKey(), JSON.stringify(messages.slice(-MESSAGE_LIMIT)));
}

export function clearAssistantMemory(): void {
  window.localStorage.removeItem(storageKey());
}
