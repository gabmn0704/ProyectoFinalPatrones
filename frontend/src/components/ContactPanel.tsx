import { useState, type FormEvent } from "react";
import { HeartHandshake, Mail, Phone, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import type { EmergencyContact } from "../types";

interface ContactPanelProps {
  contacts: EmergencyContact[];
  onAdd: (contact: Omit<EmergencyContact, "id" | "user_id">) => Promise<void>;
}

export function ContactPanel({ contacts, onAdd }: ContactPanelProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onAdd({ name, email, phone, priority: contacts.length + 1 });
      setName("");
      setEmail("");
      setPhone("");
      setAdding(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The contact could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel contacts-panel">
      <div className="panel-heading">
        <div><div className="eyebrow"><HeartHandshake size={14} /> YOUR SUPPORT NETWORK</div><h2>Care circle</h2></div>
        <button className="text-button" type="button" onClick={() => setAdding((current) => !current)}>{adding ? <X size={16} /> : <Plus size={16} />}{adding ? "Cancel" : "Add a person"}</button>
      </div>
      <p className="panel-description">People you trust, close when you need them most.</p>
      {adding && (
        <form className="contact-form" onSubmit={submit}>
          <label className="field-label">Name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" /></label>
          <label className="field-label">Email<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="alex@example.com" /></label>
          <label className="field-label">Phone (optional)<input type="tel" maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 (555) 010-0100" /></label>
          {error && <p className="form-message error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving…" : "Save trusted contact"}</button>
        </form>
      )}
      <div className="contact-list">
        {contacts.map((contact, index) => (
          <article className="contact-row" key={contact.id}>
            <span className={`contact-avatar contact-color-${index % 3}`}><UserRound size={19} /></span>
            <div className="contact-info"><strong>{contact.name}</strong><span><Mail size={13} />{contact.email}</span>{contact.phone && <span><Phone size={13} />{contact.phone}</span>}</div>
            <span className="contact-order">#{contact.priority}</span>
          </article>
        ))}
        {contacts.length === 0 && <div className="empty-state">Add someone you trust to your care circle.</div>}
      </div>
      <div className="contact-privacy"><ShieldCheck size={15} /> Email notifications need the Resend service configured.</div>
    </section>
  );
}
