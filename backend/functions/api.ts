import type { Handler } from "@netlify/functions";
import { assessDailyRisk, discoverPatterns } from "../../frontend/src/lib/riskEngine";
import type { DailyLog, EmergencyContact, SeizureEvent, Severity } from "../../frontend/src/types";
import { notifyCareCircle } from "../src/notifications";
import {
  ApiError,
  assertNumber,
  assertText,
  authenticatedClient,
  jsonResponse,
  readRequestBody,
} from "../src/server";

function assertDatabaseSuccess(error: { message: string } | null): void {
  if (error) {
    console.error("Supabase request failed.", error.message);
    throw new ApiError(500, "Your information could not be saved. Please try again.");
  }
}

const requireMethod = (actual: string, expected: string): void => {
  if (actual !== expected) throw new ApiError(405, `Use ${expected} for this endpoint.`);
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse(204, {});

  try {
    const { client, userId } = await authenticatedClient(event);
    const endpoint = event.path.split("/").filter(Boolean).at(-1);

    if (endpoint === "dashboard") {
      requireMethod(event.httpMethod, "GET");
      const [logsResult, eventsResult, contactsResult] = await Promise.all([
        client.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(90),
        client.from("seizure_events").select("*").eq("user_id", userId).order("occurred_at", { ascending: false }).limit(200),
        client.from("emergency_contacts").select("*").eq("user_id", userId).order("priority", { ascending: true }).limit(20),
      ]);
      assertDatabaseSuccess(logsResult.error);
      assertDatabaseSuccess(eventsResult.error);
      assertDatabaseSuccess(contactsResult.error);

      const logs = (logsResult.data ?? []) as DailyLog[];
      const events = (eventsResult.data ?? []) as SeizureEvent[];
      return jsonResponse(200, {
        data: {
          logs,
          events,
          contacts: (contactsResult.data ?? []) as EmergencyContact[],
          risk: assessDailyRisk(logs),
          insights: discoverPatterns(logs, events),
        },
      });
    }

    if (endpoint === "logs") {
      if (event.httpMethod === "GET") {
        const { data, error } = await client.from("daily_logs").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(90);
        assertDatabaseSuccess(error);
        return jsonResponse(200, { data });
      }
      requireMethod(event.httpMethod, "POST");
      const body = readRequestBody(event);
      const date = assertText(body.date, "date", 10);
      const parsedDate = new Date(`${date}T00:00:00.000Z`);
      const latestAllowedDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date > latestAllowedDate) {
        throw new ApiError(400, "date must be a valid day no more than one day ahead of UTC.");
      }
      if (typeof body.medication_taken !== "boolean") {
        throw new ApiError(400, "medication_taken must be true or false.");
      }
      const values = {
        user_id: userId,
        date,
        sleep_hours: assertNumber(body.sleep_hours, "sleep_hours", 0, 12),
        stress_level: assertNumber(body.stress_level, "stress_level", 1, 5),
        caffeine_cups: assertNumber(body.caffeine_cups, "caffeine_cups", 0, 20),
        exercise_minutes: assertNumber(body.exercise_minutes, "exercise_minutes", 0, 600),
        medication_taken: body.medication_taken,
        notes: assertText(body.notes ?? "", "notes", 500, false),
      };
      const { data, error } = await client.from("daily_logs").upsert(values, { onConflict: "user_id,date" }).select().single();
      assertDatabaseSuccess(error);
      return jsonResponse(200, { data });
    }

    if (endpoint === "events") {
      requireMethod(event.httpMethod, "POST");
      const body = readRequestBody(event);
      const severity = body.severity;
      if (severity !== "mild" && severity !== "moderate" && severity !== "severe") {
        throw new ApiError(400, "severity must be mild, moderate, or severe.");
      }
      const values = {
        user_id: userId,
        occurred_at: new Date().toISOString(),
        severity: severity as Severity,
        duration_minutes: assertNumber(body.duration_minutes, "duration_minutes", 1, 180),
        notes: assertText(body.notes ?? "", "notes", 1000, false),
      };
      const { data, error } = await client.from("seizure_events").insert(values).select().single();
      assertDatabaseSuccess(error);

      const { data: contacts, error: contactsError } = await client
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", userId)
        .order("priority", { ascending: true })
        .limit(20);
      assertDatabaseSuccess(contactsError);
      const notificationStatus = await notifyCareCircle(userId, (contacts ?? []) as EmergencyContact[]);
      return jsonResponse(201, { data: { event: data, notificationStatus } });
    }

    if (endpoint === "contacts") {
      if (event.httpMethod === "GET") {
        const { data, error } = await client.from("emergency_contacts").select("*").eq("user_id", userId).order("priority", { ascending: true }).limit(20);
        assertDatabaseSuccess(error);
        return jsonResponse(200, { data });
      }
      requireMethod(event.httpMethod, "POST");
      const body = readRequestBody(event);
      const email = assertText(body.email, "email", 254);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "email must be a valid email address.");
      const { count, error: countError } = await client.from("emergency_contacts")
        .select("id", { count: "exact", head: true }).eq("user_id", userId);
      assertDatabaseSuccess(countError);
      if ((count ?? 0) >= 20) throw new ApiError(400, "A care circle can have up to 20 contacts.");

      const { data, error } = await client.from("emergency_contacts").insert({
        user_id: userId,
        name: assertText(body.name, "name", 80),
        email,
        phone: assertText(body.phone ?? "", "phone", 30, false),
        priority: assertNumber(body.priority, "priority", 1, 20),
      }).select().single();
      assertDatabaseSuccess(error);
      return jsonResponse(201, { data });
    }

    throw new ApiError(404, "This EpiSafe API endpoint does not exist.");
  } catch (error) {
    if (error instanceof ApiError) return jsonResponse(error.statusCode, { error: error.message });
    console.error("Unexpected EpiSafe API error.", error);
    return jsonResponse(500, { error: "An unexpected server error occurred. Please try again." });
  }
};
