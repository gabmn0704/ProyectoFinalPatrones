import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Bot, Check, CircleHelp, HeartHandshake, LoaderCircle, MessageCircle, Send,
  ShieldAlert, Sparkles, Trash2, UserRound,
} from "lucide-react";
import { askEpiSafeAssistant, type AssistantProgress } from "../lib/assistantApi";
import {
  clearAssistantMemory, loadAssistantMemory, saveAssistantMemory,
  type AssistantChatMessage,
} from "../lib/assistantMemory";

const suggestedQuestions = [
  { icon: HeartHandshake, text: "Help me prepare questions for my next neurology appointment." },
  { icon: Sparkles, text: "Suggest a gentle routine to help me remember my daily check-in." },
  { icon: CircleHelp, text: "What information is useful to track between appointments?" },
];

function newMessage(role: AssistantChatMessage["role"], content: string): AssistantChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}

export function AssistantPanel() {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => loadAssistantMemory());
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiProgress, setAiProgress] = useState<AssistantProgress>({ phase: "idle" });
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendMessage = async (text: string, retry = false) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError("");
    setInput("");
    setSending(true);
    const conversation = retry ? messages : [...messages, newMessage("user", trimmed)];
    setMessages(conversation);
    try {
      saveAssistantMemory(conversation);
    } catch (storageError) {
      console.error("Unable to save assistant conversation.", storageError);
      setError("Your browser could not save this conversation. Check its local storage settings and try again.");
      setSending(false);
      return;
    }

    try {
      const reply = await askEpiSafeAssistant(conversation, setAiProgress);
      const updated = [...conversation, newMessage("assistant", reply)];
      setMessages(updated);
      setAiProgress({ phase: "ready" });
      try {
        saveAssistantMemory(updated);
      } catch (storageError) {
        console.error("Unable to save assistant reply.", storageError);
        setError("Your reply arrived, but this browser could not save it to conversation memory.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The assistant could not respond. Please try again.");
      try {
        saveAssistantMemory(conversation);
      } catch (storageError) {
        console.error("Unable to save assistant conversation.", storageError);
      }
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const clearMemory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    try {
      clearAssistantMemory();
      setMessages([]);
      setError("");
      setConfirmClear(false);
    } catch (reason) {
      console.error("Unable to clear assistant memory.", reason);
      setError("Your browser could not clear saved memory. Please clear this site's data in your browser settings.");
    }
  };

  const progressLabel = aiProgress.phase === "downloading"
    ? `Downloading the AI model${aiProgress.progress === undefined ? "…" : `… ${Math.round(aiProgress.progress)}%`}`
    : aiProgress.phase === "loading"
      ? "Preparing the local AI model…"
      : aiProgress.phase === "generating"
        ? "Generating a reply on this device…"
        : "";

  return (
    <section className="assistant-layout" aria-label="EpiSafe AI assistant">
      <div className="assistant-panel panel">
        <div className="assistant-heading">
          <span className="assistant-avatar"><Bot size={22} /></span>
          <div><div className="eyebrow"><Sparkles size={14} /> QWEN 2.5 · 0.5B</div><h2>Your care companion</h2><p>Thoughtful support for reflection and conversations with your care team.</p></div>
          <div className="assistant-online">On this device</div>
        </div>

        <div className="assistant-consent">
          <div className="assistant-consent-title"><ShieldAlert size={18} /><strong>Private, on-device AI</strong></div>
          <p>Your conversation is processed on this device and is not sent to an AI service or stored in EpiSafe's cloud. The first use downloads the Qwen 2.5 0.5B model from Hugging Face (roughly 500–800 MB); your browser caches it for later use. A modern browser and a reliable connection are recommended. This small model may be slower or less capable than paid cloud AI.</p>
          {progressLabel && (
            <div className="assistant-model-progress" role="status">
              <span>{progressLabel}</span>
              {aiProgress.phase === "downloading" && aiProgress.progress !== undefined && (
                <progress max="100" value={aiProgress.progress} aria-label="AI model download progress" />
              )}
            </div>
          )}
        </div>

        <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <span className="assistant-welcome-icon"><MessageCircle size={24} /></span>
              <h3>A thoughtful place to start.</h3>
              <p>Ask a question, explore a routine, or get help preparing for a conversation with your clinician.</p>
              <div className="assistant-suggestions">
                {suggestedQuestions.map(({ icon: Icon, text }) => <button key={text} type="button" disabled={sending} onClick={() => void sendMessage(text)}><Icon size={16} /><span>{text}</span></button>)}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article className={`assistant-message ${message.role}`} key={message.id}>
                <span className="assistant-message-avatar">{message.role === "assistant" ? <Bot size={16} /> : <UserRound size={16} />}</span>
                <div><div className="assistant-message-label">{message.role === "assistant" ? "EpiSafe Guide" : "You"}</div><p>{message.content}</p></div>
              </article>
            ))
          )}
          {sending && <div className="assistant-typing"><LoaderCircle size={16} className="assistant-spinner" /> EpiSafe Guide is thinking…</div>}
          <div ref={endOfMessages} />
        </div>

        {error && (
          <div className="assistant-error" role="alert">
            <ShieldAlert size={16} /><span>{error}</span>
            {messages.at(-1)?.role === "user" && <button type="button" disabled={sending} onClick={() => void sendMessage(messages.at(-1)!.content, true)}>Retry</button>}
          </div>
        )}

        <form className="assistant-composer" onSubmit={submit}>
          <textarea aria-label="Message EpiSafe Guide" maxLength={1200} rows={2} placeholder="Ask your care companion…" value={input} disabled={sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(input);
            }
          }} />
          <button className="assistant-send" type="submit" aria-label="Send message" disabled={sending || !input.trim()}>{sending ? <LoaderCircle size={18} className="assistant-spinner" /> : <Send size={18} />}</button>
          <span className="assistant-composer-hint">Enter to send · Shift+Enter for a new line</span>
        </form>

        <div className="assistant-footer">
          <span><ShieldAlert size={14} /> Not medical advice. For emergencies, contact local emergency services.</span>
          <button type="button" onClick={clearMemory} disabled={sending || messages.length === 0}>{confirmClear ? <><Check size={14} /> Confirm clear</> : <><Trash2 size={14} /> Clear memory</>}</button>
        </div>
      </div>
      <aside className="assistant-side">
        <section className="panel assistant-side-card"><span className="assistant-side-icon"><Sparkles size={18} /></span><div className="eyebrow">A COMPANION, NOT A CLINICIAN</div><h3>Support between appointments.</h3><p>Use EpiSafe Guide to organize your thoughts, build gentle routines, and prepare questions for your healthcare professional.</p></section>
        <section className="panel assistant-side-card assistant-memory-card"><span className="assistant-side-icon"><MessageCircle size={18} /></span><div className="eyebrow">YOUR CONVERSATION MEMORY</div><h3>{messages.length ? `${messages.length} saved messages` : "Private to this browser"}</h3><p>Your conversation is remembered on this device to provide context in the chat. It is not stored in Supabase. Clear it any time, or clear this browser's site data.</p><span className="assistant-memory-note"><Check size={14} /> You control what gets shared.</span></section>
      </aside>
    </section>
  );
}
