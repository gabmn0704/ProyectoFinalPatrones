import { describe, expect, it } from "vitest";
import { buildAssistantPrompt } from "./assistantApi";
import type { AssistantChatMessage } from "./assistantMemory";

function message(role: AssistantChatMessage["role"], content: string): AssistantChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}

describe("on-device assistant prompt", () => {
  it("adds safety instructions and retains recent conversation context", () => {
    const prompt = buildAssistantPrompt([
      message("user", "Older message"),
      message("assistant", "Older reply"),
      message("user", "What should I ask my neurologist?"),
    ]);

    expect(prompt).toContain("Reply in the same language");
    expect(prompt).toContain("Never diagnose");
    expect(prompt).toContain("local emergency services now");
    expect(prompt).toContain("What should I ask my neurologist?");
    expect(prompt).toContain("Older message");
  });

  it("limits the context window to the latest eight messages", () => {
    const conversation = Array.from({ length: 10 }, (_, index) =>
      message(index % 2 === 0 ? "user" : "assistant", `Message ${index}`),
    );

    const prompt = buildAssistantPrompt(conversation);

    expect(prompt).not.toContain("Message 0");
    expect(prompt).not.toContain("Message 1");
    expect(prompt).toContain("Message 2");
    expect(prompt).toContain("Message 9");
  });
});
