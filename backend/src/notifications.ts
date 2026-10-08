import type { EmergencyContact } from "../../frontend/src/types";
import { buildEmergencyDispatchOrder } from "../../frontend/src/lib/riskEngine";

export type NotificationStatus = "sent" | "not_configured" | "no_contacts" | "failed";

export async function notifyCareCircle(
  patientId: string,
  contacts: EmergencyContact[],
): Promise<NotificationStatus> {
  if (contacts.length === 0) return "no_contacts";

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMERGENCY_FROM_EMAIL;
  if (!apiKey || !from) return "not_configured";

  const orderedContacts = buildEmergencyDispatchOrder(patientId, contacts);
  const recipients = orderedContacts.map(({ email }) => email);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: "A care-circle member has logged an event",
      text: "A member of your EpiSafe care circle has recorded an event. Please reach out to check in with them. EpiSafe AI does not contact emergency services.",
    }),
  });

  if (!response.ok) {
    console.error("Resend could not deliver the care-circle notification.", response.status);
    return "failed";
  }
  return "sent";
}
