import { describe, expect, it } from "vitest";
import type { EmergencyContact, SeizureEvent } from "../types";
import { buildEmergencyWhatsAppLink, normalizePhoneNumber } from "./emergencyMessage";

const event: SeizureEvent = {
  id: "event-1",
  user_id: "user-1",
  occurred_at: "2026-10-08T08:00:00.000Z",
  severity: "moderate",
  duration_minutes: 2,
  notes: "Private notes are not included.",
};

function contact(id: string, phone: string, priority: number): EmergencyContact {
  return {
    id,
    user_id: "user-1",
    name: `Contact ${id}`,
    email: `${id}@example.com`,
    phone,
    priority,
  };
}

describe("emergency WhatsApp alert", () => {
  it("normalizes international phone numbers and rejects local or malformed numbers", () => {
    expect(normalizePhoneNumber("+52 (55) 1234-5678")).toBe("+525512345678");
    expect(normalizePhoneNumber("5551234567")).toBeUndefined();
    expect(normalizePhoneNumber("+012345678")).toBeUndefined();
  });

  it("creates a ready-to-send WhatsApp message for the highest-priority contact with a phone", () => {
    const result = buildEmergencyWhatsAppLink([
      contact("2", "+1 202 555 0198", 2),
      contact("1", "", 1),
    ], event);

    expect(result?.contactName).toBe("Contact 2");
    expect(result?.url).toMatch(/^https:\/\/wa\.me\/12025550198\?text=/);
    const message = decodeURIComponent(result?.url.split("?text=")[1] ?? "");
    expect(message).toContain("Se registró una emergencia en EpiSafe");
    expect(message).toContain("EpiSafe no llama a los servicios de emergencia");
    expect(message).not.toContain("Private notes");
  });

  it("returns no link when no contact has an international phone number", () => {
    expect(buildEmergencyWhatsAppLink([contact("1", "", 1)], event)).toBeUndefined();
  });
});
