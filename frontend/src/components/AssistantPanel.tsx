import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bot, Check, CircleHelp, HeartHandshake, LoaderCircle, MessageCircle, Send,
  ShieldAlert, Sparkles, Trash2, UserRound,
} from "lucide-react";
import type { DashboardData } from "../types";
import { askEpiSafeAssistant } from "../lib/assistantApi";
import {
  clearAssistantMemory, loadAssistantMemory, saveAssistantMemory,
  type AssistantChatMessage,
} from "../lib/assistantMemory";

const consentKey = "episafe.assistant.openai-consent";

const suggestedQuestions = [
  { icon: HeartHandshake, text: "Help me prepare questions for my next neurology appointment." },
  { icon: Sparkles, text: "Suggest a gentle routine to help me remember my daily check-in." },
  { icon: CircleHelp, text: "What information is useful to track between appointments?" },
];

function buildHealthSummary(dashboard: DashboardData): string {
  const recentLogs = [...dashboard.logs]
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 14);
  const average = (values: number[]) => values.length
    ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
    : "not available";
  const severities = dashboard.events.reduce<Record<string, number>>((totals, event) => {
    totals[event.severity] = (totals[event.severity] ?? 0) + 1;
    return totals;
  }, {});
  const patternSummary = dashboard.insights
    .filter((insight) => insight.id !== "building-baseline" && insight.id !== "no-patterns-yet")
    .map((insight) => `${insight.title}: ${insight.description}`)
    .join("\n");

  return [
    `Recent check-ins included: ${recentLogs.length}.`,
    `Average sleep hours: ${average(recentLogs.map((log) => log.sleep_hours))}.`,
    `Average self-reported stress (scale 1-5): ${average(recentLogs.map((log) => log.stress_level))}.`,
    `Medication marked missed: ${recentLogs.filter((log) => !log.medication_taken).length} of ${recentLogs.length} check-ins.`,
    `Check-ins with 3 or more caffeine cups: ${recentLogs.filter((log) => log.caffeine_cups >= 3).length}.`,
    `Recorded seizure events in this browser history: ${dashboard.events.length}.`,
    `Recorded event severity counts: ${Object.entries(severities).map(([severity, count]) => `${severity}=${count}`).join(", ") || "none"}.`,
    patternSummary ? `Observed app associations (not causal findings):\n${patternSummary}` : "The app has not found a recurring association in this history.",
    "The interactive demo may contain fictional sample entries.",
  ].join("\n");
}

function newMessage(role: AssistantChatMessage["role"], content: string): AssistantChatMessage {
  return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}

export function AssistantPanel({ dashboard }: { dashboard: DashboardData }) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>(() => loadAssistantMemory());
  const [input, setInput] = useState("");
  const [consented, setConsented] = useState(() => window.localStorage.getItem(consentKey) === "yes");
  const [includeHealthSummary, setIncludeHealthSummary] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const endOfMessages = useRef<HTMLDivElement>(null);
  const healthSummary = useMemo(() => buildHealthSummary(dashboard), [dashboard]);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const sendMessage = async (text: string, retry = false) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!consented) {
      setError("Please read and accept the privacy notice before sending a message.");
      return;
    }
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
      const reply = await askEpiSafeAssistant(
        conversation,
        includeHealthSummary ? healthSummary : undefined,
      );
      const updated = [...conversation, newMessage("assistant", reply)];
      setMessages(updated);
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

  return (
    <section className="assistant-layout" aria-label="EpiSafe AI assistant">
      <div className="assistant-panel panel">
        <div className="assistant-heading">
          <span className="assistant-avatar"><Bot size={22} /></span>
          <div><div className="eyebrow"><Sparkles size={14} /> OPENAI · GPT-4.1 MINI</div><h2>Your care companion</h2><p>Thoughtful support for reflection and conversations with your care team.</p></div>
          <div className="assistant-online">Server API</div>
        </div>

        {!consented && (
          <div className="assistant-consent">
            <div className="assistant-consent-title"><ShieldAlert size={18} /><strong>Before you chat</strong></div>
            <p>Your messages are sent securely to OpenAI to generate replies. Chat memory stays in this browser and is not saved to an EpiSafe account. Please avoid names and identifying details. The assistant is not a clinician or emergency service.</p>
            <label className="assistant-check"><input type="checkbox" checked={consented} onChange={(event) => {
              try {
                window.localStorage.setItem(consentKey, event.target.checked ? "yes" : "no");
                setConsented(event.target.checked);
              } catch (reason) {
                console.error("Unable to save assistant consent.", reason);
                setError("Your browser could not save this consent choice. Check its local storage settings.");
              }
            }} /><span>I understand and agree to send my messages to OpenAI for a reply.</span></label>
          </div>
        )}

        {consented && (
          <label className="assistant-health-toggle">
            <input type="checkbox" checked={includeHealthSummary} onChange={(event) => setIncludeHealthSummary(event.target.checked)} />
            <span><strong>Use my EpiSafe check-in summary for more personal suggestions</strong><small>If enabled, a short summary of recent structured check-ins and recorded events is sent with your message. Notes, name, email, and contacts are never included.</small></span>
          </label>
        )}

        <div className="assistant-messages" aria-live="polite" aria-relevant="additions text">
          {messages.length === 0 ? (
            <div className="assistant-welcome">
              <span className="assistant-welcome-icon"><MessageCircle size={24} /></span>
              <h3>A thoughtful place to start.</h3>
              <p>Ask a question, explore a routine, or get help preparing for a conversation with your clinician.</p>
              <div className="assistant-suggestions">
                {suggestedQuestions.map(({ icon: Icon, text }) => <button key={text} type="button" disabled={sending || !consented} onClick={() => void sendMessage(text)}><Icon size={16} /><span>{text}</span></button>)}
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

        {error && <div className="assistant-error" role="alert"><ShieldAlert size={16} /><span>{error}</span>{messages.at(-1)?.role === "user" && consented && <button type="button" disabled={sending} onClick={() => void sendMessage(messages.at(-1)!.content, true)}>Retry</button>}</div>}

        <form className="assistant-composer" onSubmit={submit}>
          <textarea aria-label="Message EpiSafe Guide" maxLength={1200} rows={2} placeholder={consented ? "Ask your care companion…" : "Accept the privacy notice to start chatting"} value={input} disabled={!consented || sending} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(input);
            }
          }} />
          <button className="assistant-send" type="submit" aria-label="Send message" disabled={!consented || sending || !input.trim()}>{sending ? <LoaderCircle size={18} className="assistant-spinner" /> : <Send size={18} />}</button>
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
