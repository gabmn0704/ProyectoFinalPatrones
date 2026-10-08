import type { EmergencyContact, SeizureEvent } from "../types";

export function normalizePhoneNumber(phone: string): string | undefined {
  const normalized = phone.trim().replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) return undefined;
  return normalized;
}

export function buildEmergencyWhatsAppLink(
  contacts: EmergencyContact[],
  event: SeizureEvent,
): { contactName: string; url: string } | undefined {
  const contact = [...contacts]
    .sort((first, second) => first.priority - second.priority)
    .find(({ phone }) => Boolean(normalizePhoneNumber(phone)));
  if (!contact) return undefined;

  const phone = normalizePhoneNumber(contact.phone);
  if (!phone) return undefined;

  const occurredAt = new Date(event.occurred_at);
  const time = Number.isNaN(occurredAt.getTime())
    ? event.occurred_at
    : new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" }).format(occurredAt);
  const message = `Se registró una emergencia en EpiSafe el ${time}. Por favor, contacta ahora a la persona que usa la aplicación. EpiSafe no llama a los servicios de emergencia.`;
  return {
    contactName: contact.name,
    url: `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(message)}`,
  };
}
