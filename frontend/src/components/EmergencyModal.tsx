import { useState, type FormEvent } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, HeartPulse, X } from "lucide-react";
import type { EmergencyReportResult, Severity } from "../types";

interface EmergencyModalProps {
  onClose: () => void;
  onReport: (event: { severity: Severity; duration_minutes: number; notes: string }) => Promise<EmergencyReportResult>;
}

export function EmergencyModal({ onClose, onReport }: EmergencyModalProps) {
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [duration, setDuration] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [whatsappAlert, setWhatsappAlert] = useState<EmergencyReportResult["whatsappAlert"]>();
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await onReport({ severity, duration_minutes: duration, notes });
      setWhatsappAlert(result.whatsappAlert);
      setCompleted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The event could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="emergency-modal" role="dialog" aria-modal="true" aria-labelledby="emergency-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close emergency form" type="button"><X size={19} /></button>
        {completed ? (
          <div className="emergency-complete">
            <span className="complete-icon"><CheckCircle2 size={28} /></span>
            <div className="eyebrow">EVENT RECORDED</div>
            <h2 id="emergency-title">Your care circle matters.</h2>
            <p>The event was added to your history. This app does not call emergency services or send WhatsApp messages automatically.</p>
            {whatsappAlert ? (
              <a className="primary-button emergency-whatsapp-link" href={whatsappAlert.url} target="_blank" rel="noopener noreferrer">
                Open WhatsApp for {whatsappAlert.contactName} <ArrowUpRight size={16} />
              </a>
            ) : (
              <p>Add a care-circle contact with a phone number in international format (for example, +52 55 1234 5678) to prepare a WhatsApp alert.</p>
            )}
            <p>If someone is in immediate danger, call your local emergency services now.</p>
            <button className="primary-button" type="button" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="emergency-heading">
              <span className="emergency-symbol"><HeartPulse size={24} /></span>
              <div><div className="eyebrow">YOU’RE NOT ALONE</div><h2 id="emergency-title">Record an event</h2></div>
            </div>
            <div className="emergency-safety"><AlertTriangle size={17} /><p><strong>Need immediate help?</strong> Contact your local emergency services now. This tool does not call emergency services.</p></div>
            <form className="checkin-form" onSubmit={submit}>
              <label className="field-label">How would you describe the event?
                <select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)}>
                  <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
                </select>
              </label>
              <label className="field-label"><span><Clock3 size={15} /> Approximate duration (minutes)</span>
                <input type="number" min="1" max="180" value={duration} onChange={(event) => setDuration(Number(event.target.value))} required />
              </label>
              <label className="field-label">Notes for your care history
                <textarea rows={3} maxLength={1000} placeholder="Recovery, support received, or anything to share with your care team…" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
              {error && <p className="form-message error-message" role="alert">{error}</p>}
              <button className="emergency-submit" type="submit" disabled={saving}><HeartPulse size={17} />{saving ? "Recording…" : "Record event & prepare alert"}</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
