export type RiskLevel = "low" | "moderate" | "high";
export type Severity = "mild" | "moderate" | "severe";

export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number;
  stress_level: number;
  caffeine_cups: number;
  exercise_minutes: number;
  medication_taken: boolean;
  notes: string;
}

export interface SeizureEvent {
  id: string;
  user_id: string;
  occurred_at: string;
  severity: Severity;
  duration_minutes: number;
  notes: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  priority: number;
}

export interface RiskFactor {
  label: string;
  detail: string;
  weight: number;
}

export interface RiskReport {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  updatedAt: string;
}

export interface PatternInsight {
  id: string;
  title: string;
  description: string;
  metric: string;
  confidence: "early" | "emerging" | "strong";
  icon: "moon" | "pill" | "activity" | "coffee";
}

export interface DashboardData {
  logs: DailyLog[];
  events: SeizureEvent[];
  contacts: EmergencyContact[];
  risk: RiskReport;
  insights: PatternInsight[];
}

export interface EmergencyReportResult {
  event: SeizureEvent;
  notificationStatus: "sent" | "not_configured" | "no_contacts" | "failed";
}

export type AppSection = "overview" | "daily-log" | "history" | "insights" | "care-team";
