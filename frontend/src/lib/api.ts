import type { DashboardData, DailyLog, EmergencyContact, EmergencyReportResult } from "../types";
import { createDemoDashboard, getDemoUserId, writeLocal } from "../data/demoData";
import { isCloudConfigured, supabase } from "./supabase";

async function cloudRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const { data: { session } } = await supabase!.auth.getSession();
  if (!session) throw new Error("Your session has expired. Please sign in again.");

  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json() as { data?: T; error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  if (result.data === undefined) throw new Error("The server returned an unexpected response.");
  return result.data;
}

export async function loadDashboard(): Promise<DashboardData> {
  if (isCloudConfigured) return cloudRequest<DashboardData>("/api/dashboard");
  return createDemoDashboard();
}

export async function saveDailyLog(input: Omit<DailyLog, "id" | "user_id">): Promise<void> {
  if (isCloudConfigured) {
    await cloudRequest<DailyLog>("/api/logs", "POST", input);
    return;
  }
  const current = createDemoDashboard();
  const updated: DailyLog = { ...input, id: crypto.randomUUID(), user_id: getDemoUserId() };
  const logs = [updated, ...current.logs.filter((log) => log.date !== input.date)];
  writeLocal("episafe.logs", logs);
}

export async function reportSeizure(input: { severity: "mild" | "moderate" | "severe"; duration_minutes: number; notes: string }): Promise<EmergencyReportResult> {
  if (isCloudConfigured) return cloudRequest<EmergencyReportResult>("/api/events", "POST", input);
  const event = {
    ...input,
    id: crypto.randomUUID(),
    user_id: getDemoUserId(),
    occurred_at: new Date().toISOString(),
  };
  const current = createDemoDashboard();
  writeLocal("episafe.events", [event, ...current.events]);
  return { event, notificationStatus: current.contacts.length ? "not_configured" : "no_contacts" };
}

export async function saveContact(input: Omit<EmergencyContact, "id" | "user_id">): Promise<void> {
  if (isCloudConfigured) {
    await cloudRequest<EmergencyContact>("/api/contacts", "POST", input);
    return;
  }
  const current = createDemoDashboard();
  writeLocal("episafe.contacts", [
    ...current.contacts,
    { ...input, id: crypto.randomUUID(), user_id: getDemoUserId() },
  ]);
}
