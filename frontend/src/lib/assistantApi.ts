import type { AssistantChatMessage } from "./assistantMemory";

export interface AssistantProgress {
  phase: "idle" | "downloading" | "loading" | "generating" | "ready";
  progress?: number;
  file?: string;
}

type WorkerResponse =
  | { type: "progress"; progress: AssistantProgress }
  | { type: "success"; requestId: string; reply: string }
  | { type: "failure"; requestId: string; message: string };

interface PendingRequest {
  requestId: string;
  resolve: (reply: string) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: AssistantProgress) => void;
}

let assistantWorker: Worker | undefined;
let pendingRequest: PendingRequest | undefined;

export function buildAssistantPrompt(messages: AssistantChatMessage[]): string {
  const instructions = `You are EpiSafe Guide, a supportive educational companion for people affected by epilepsy. Reply in the same language as the user's latest message. Be warm, concise, practical, non-judgmental, and ask at most one relevant follow-up question.

Safety rules:
- You are not a doctor, clinician, or emergency service. Never diagnose, predict or rule out a seizure, prescribe, recommend a dose, or suggest starting, stopping, or changing treatment.
- Do not describe EpiSafe wellness scores or user observations as clinically validated. Correlation does not prove causation.
- For treatment questions or changing symptoms, encourage the user to contact their neurologist or healthcare professional and follow their existing care plan.
- If the user describes an ongoing seizure, immediate danger, serious injury, breathing difficulty, repeated seizures without recovery, or another urgent emergency, tell them to contact local emergency services now and follow their clinician-provided emergency plan. Do not rely on this chat.
- Do not request identifying details. Do not claim access to EpiSafe logs unless the user includes information in the conversation.
- Do not provide dangerous medical instructions. Be clear when you are uncertain.

Conversation:`;
  const history = messages.slice(-8).map(({ role, content }) =>
    `<|im_start|>${role}\n${content}<|im_end|>`,
  ).join("\n");

  return `<|im_start|>system\n${instructions}<|im_end|>\n${history}\n<|im_start|>assistant\n`;
}

function getWorker(): Worker {
  if (!assistantWorker) {
    assistantWorker = new Worker(
      new URL("./assistantModel.worker.ts", import.meta.url),
      { type: "module" },
    );
    assistantWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.type === "progress") {
        pendingRequest?.onProgress?.(response.progress);
      } else if (pendingRequest?.requestId === response.requestId) {
        const request = pendingRequest;
        pendingRequest = undefined;
        if (response.type === "success") request.resolve(response.reply);
        else request.reject(new Error(response.message));
      }
    };
    assistantWorker.onerror = (event) => {
      const request = pendingRequest;
      pendingRequest = undefined;
      assistantWorker?.terminate();
      assistantWorker = undefined;
      request?.reject(new Error("The local AI worker stopped unexpectedly. Refresh the page and try again."));
      console.error("The local assistant worker failed.", event.message);
    };
  }
  return assistantWorker;
}

export function askEpiSafeAssistant(
  messages: AssistantChatMessage[],
  onProgress?: (progress: AssistantProgress) => void,
): Promise<string> {
  if (pendingRequest) {
    return Promise.reject(new Error("The local assistant is already processing a message."));
  }
  const requestId = crypto.randomUUID();
  const worker = getWorker();

  return new Promise((resolve, reject) => {
    pendingRequest = { requestId, resolve, reject, onProgress };
    worker.postMessage({
      type: "generate",
      requestId,
      prompt: buildAssistantPrompt(messages),
    });
  });
}
