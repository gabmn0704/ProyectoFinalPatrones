import { useState, type FormEvent } from "react";
import { Check, Pill, Save, Sparkles } from "lucide-react";
import { localDateString } from "../lib/dates";

export interface LogFormValues {
  date: string;
  sleep_hours: number;
  stress_level: number;
  caffeine_cups: number;
  exercise_minutes: number;
  medication_taken: boolean;
  notes: string;
}

interface LogFormProps {
  onSave: (values: LogFormValues) => Promise<void>;
}

export function LogForm({ onSave }: LogFormProps) {
  const [values, setValues] = useState<LogFormValues>({
    date: localDateString(),
    sleep_hours: 7,
    stress_level: 2,
    caffeine_cups: 1,
    exercise_minutes: 20,
    medication_taken: true,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof LogFormValues>(key: K, value: LogFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(values);
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your check-in could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel log-form-panel">
      <div className="panel-heading">
        <div><div className="eyebrow">A MOMENT FOR YOU</div><h2>Your daily check-in</h2></div>
        <span className="panel-heading-icon"><Sparkles size={19} /></span>
      </div>
      <p className="panel-description">A few small details help you understand your personal patterns over time.</p>
      <form onSubmit={submit} className="checkin-form">
        <label className="field-label">Date
          <input type="date" max={localDateString()} value={values.date} onChange={(event) => update("date", event.target.value)} required />
        </label>
        <div className="field-row">
          <label className="field-label">Hours of sleep <strong>{values.sleep_hours}h</strong>
            <input type="range" min="0" max="12" step="0.5" value={values.sleep_hours} onChange={(event) => update("sleep_hours", Number(event.target.value))} />
          </label>
          <label className="field-label">Stress level <strong>{values.stress_level} / 5</strong>
            <input type="range" min="1" max="5" value={values.stress_level} onChange={(event) => update("stress_level", Number(event.target.value))} />
          </label>
        </div>
        <div className="field-row">
          <label className="field-label">Caffeine <strong>{values.caffeine_cups} cups</strong>
            <input type="number" min="0" max="20" value={values.caffeine_cups} onChange={(event) => update("caffeine_cups", Number(event.target.value))} />
          </label>
          <label className="field-label">Exercise <strong>{values.exercise_minutes} min</strong>
            <input type="number" min="0" max="600" step="5" value={values.exercise_minutes} onChange={(event) => update("exercise_minutes", Number(event.target.value))} />
          </label>
        </div>
        <button className={`medication-toggle${values.medication_taken ? " is-taken" : ""}`} onClick={() => update("medication_taken", !values.medication_taken)} type="button" aria-pressed={values.medication_taken}>
          <span className="toggle-icon"><Pill size={18} /></span>
          <span><strong>Medication taken</strong><small>Today's prescribed medication</small></span>
          <span className="toggle-check">{values.medication_taken && <Check size={14} />}</span>
        </button>
        <label className="field-label">Anything else you’d like to note?
          <textarea maxLength={500} rows={3} placeholder="How are you feeling today?" value={values.notes} onChange={(event) => update("notes", event.target.value)} />
        </label>
        {error && <p className="form-message error-message" role="alert">{error}</p>}
        {saved && <p className="form-message success-message"><Check size={15} /> Check-in saved to your personal timeline.</p>}
        <button className="primary-button save-checkin" type="submit" disabled={saving}>
          <Save size={17} />{saving ? "Saving…" : "Save check-in"}
        </button>
      </form>
    </section>
  );
}
