import { env, pipeline, type ProgressCallback } from "@huggingface/transformers";
import type { AssistantProgress } from "./assistantApi";

const MODEL_ID = "onnx-community/SmolLM2-135M-Instruct-ONNX-GQA";

type WorkerRequest = {
  type: "generate";
  requestId: string;
  prompt: string;
};

type WorkerResponse =
  | { type: "progress"; progress: AssistantProgress }
  | { type: "success"; requestId: string; reply: string }
  | { type: "failure"; requestId: string; message: string };

function send(response: WorkerResponse): void {
  self.postMessage(response);
}

function reportProgress(phase: AssistantProgress["phase"], progress?: number, file?: string): void {
  send({ type: "progress", progress: { phase, progress, file } });
}

env.allowRemoteModels = true;
env.useBrowserCache = true;

const progressCallback: ProgressCallback = (info) => {
  if (info.status === "progress") {
    reportProgress("downloading", info.progress, info.file);
  } else if (info.status === "download") {
    reportProgress("downloading", undefined, info.file);
  } else if (info.status === "initiate") {
    reportProgress("loading", undefined, info.file);
  } else if (info.status === "ready") {
    reportProgress("loading", 100);
  }
};

function createGenerator() {
  const options = {
    dtype: "q4" as const,
    progress_callback: progressCallback,
  };
  return pipeline("text-generation", MODEL_ID, options);
}

type TextGenerator = Awaited<ReturnType<typeof createGenerator>>;
let generatorPromise: Promise<TextGenerator> | undefined;

async function getGenerator(): Promise<TextGenerator> {
  if (!generatorPromise) {
    generatorPromise = createGenerator();
    generatorPromise = generatorPromise.catch((error: unknown) => {
      generatorPromise = undefined;
      throw error;
    });
  }
  return generatorPromise;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { requestId, prompt } = event.data;
  if (event.data.type !== "generate") return;

  try {
    reportProgress("loading");
    const generator = await getGenerator();
    reportProgress("generating");
    const result = await generator(prompt, {
      max_new_tokens: 96,
      do_sample: false,
      return_full_text: false,
    });
    const reply = result[0]?.generated_text.trim();
    if (!reply) throw new Error("The local model returned an empty reply. Please try a different question.");
    send({ type: "success", requestId, reply });
    send({ type: "progress", progress: { phase: "ready" } });
  } catch (error) {
    console.error("Local assistant generation failed.", error);
    send({
      type: "failure",
      requestId,
      message: error instanceof Error
        ? `The on-device AI could not start or respond: ${error.message}`
        : "The on-device AI could not start or respond. Check your connection and available device memory, then try again.",
    });
  }
};
