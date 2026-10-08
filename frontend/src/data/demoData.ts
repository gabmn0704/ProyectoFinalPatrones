import type { DailyLog, DashboardData, EmergencyContact, SeizureEvent } from "../types";
import { assessDailyRisk, discoverPatterns } from "../lib/riskEngine";
import { localDateString } from "../lib/dates";

const dayString = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return localDateString(date);
};

const demoUserKey = "episafe.demo.name";

export function getDemoUserName(): string {
  return window.localStorage.getItem(demoUserKey) ?? "";
}

export function saveDemoUserName(name: string): void {
  window.localStorage.setItem(demoUserKey, name.trim());
}

export function getDemoUserId(): string {
  return `demo-${encodeURIComponent(getDemoUserName().trim().toLowerCase()) || "guest"}`;
}

function scopedKey(key: string): string {
  return `${key}.${getDemoUserId()}`;
}

export const demoLogs: DailyLog[] = Array.from({ length: 14 }, (_, index) => ({
  id: `demo-log-${index}`,
  user_id: "demo-template",
  date: dayString(13 - index),
  sleep_hours: [7.5, 6.5, 4.5, 7, 8, 5, 6.5, 4, 7.5, 6, 5.5, 8, 4.5, 6.5][index],
  stress_level: [2, 3, 4, 2, 1, 3, 5, 4, 2, 3, 4, 2, 5, 3][index],
  caffeine_cups: [1, 2, 3, 1, 0, 2, 2, 3, 1, 2, 3, 1, 4, 2][index],
  exercise_minutes: [30, 15, 0, 20, 40, 10, 0, 15, 25, 0, 20, 30, 10, 20][index],
  medication_taken: index !== 6 && index !== 11,
  notes: "",
}));

export const demoEvents: SeizureEvent[] = [
  {
    id: "demo-event-1",
    user_id: "demo-template",
    occurred_at: new Date(`${dayString(11)}T08:45:00`).toISOString(),
    severity: "moderate",
    duration_minutes: 2,
    notes: "Recovered after resting with a family member.",
  },
  {
    id: "demo-event-2",
    user_id: "demo-template",
    occurred_at: new Date(`${dayString(6)}T17:20:00`).toISOString(),
    severity: "mild",
    duration_minutes: 1,
    notes: "Brief episode; no injury reported.",
  },
];

export const demoContacts: EmergencyContact[] = [
  { id: "demo-contact-1", user_id: "demo-template", name: "Alex Morgan", email: "alex@example.com", phone: "", priority: 1 },
  { id: "demo-contact-2", user_id: "demo-template", name: "Care team", email: "care@example.com", phone: "", priority: 2 },
];

export function createDemoDashboard(): DashboardData {
  const userId = getDemoUserId();
  const logs = readLocal<DailyLog[]>("episafe.logs", demoLogs.map((log) => ({ ...log, user_id: userId })));
  const events = readLocal<SeizureEvent[]>("episafe.events", demoEvents.map((event) => ({ ...event, user_id: userId })));
  const contacts = readLocal<EmergencyContact[]>("episafe.contacts", demoContacts.map((contact) => ({ ...contact, user_id: userId })))
    .map((contact) => ({
      ...contact,
      phone: ["+1 (555) 014-2201", "+1 (555) 014-2202"].includes(contact.phone) ? "" : contact.phone,
    }));
  return {
    logs,
    events: [...events].sort((first, second) => second.occurred_at.localeCompare(first.occurred_at)),
    contacts,
    risk: assessDailyRisk(logs, events),
    insights: discoverPatterns(logs, events),
  };
}

export function writeLocal<T>(key: string, value: T): void {
  window.localStorage.setItem(scopedKey(key), JSON.stringify(value));
}

function readLocal<T>(key: string, fallback: T): T {
  const saved = window.localStorage.getItem(scopedKey(key));
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch (error) {
    console.error(`Unable to read saved demo data for "${key}".`, error);
    return fallback;
  }
}
