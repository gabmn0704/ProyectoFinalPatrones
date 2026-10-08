import type { EmergencyContact, SeizureEvent } from "../types";

export function normalizePhoneNumber(phone: string): string | undefined {
  const normalized = phone.trim().replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) return undefined;
  return normalized;
}

export function buildEmergencyWhatsAppLink(
  contacts: EmergencyContact[],
  event: SeizureEvent,
): { contactId: string; contactName: string; url: string }[] {
  const eligibleContacts = [...contacts]
    .sort((first, second) => first.priority - second.priority)
    .flatMap((contact) => {
      const phone = normalizePhoneNumber(contact.phone);
      return phone ? [{ contact, phone }] : [];
    });
  if (eligibleContacts.length === 0) return [];

  const occurredAt = new Date(event.occurred_at);
  const time = Number.isNaN(occurredAt.getTime())
    ? event.occurred_at
    : new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(occurredAt);
  const message = `Se registró una emergencia en EpiSafe el ${time}. Por favor, contacta ahora a la persona que usa la aplicación. EpiSafe no llama a los servicios de emergencia.`;
  return eligibleContacts.map(({ contact, phone }) => ({
    contactId: contact.id,
    contactName: contact.name,
    url: `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`,
  }));
}
