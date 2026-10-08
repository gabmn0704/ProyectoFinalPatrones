import { BinarySearchTree, CareNetworkGraph, DoublyLinkedList, HashMap, PriorityQueue } from "./dataStructures";
import { localDateString } from "./dates";
import type { DailyLog, EmergencyContact, PatternInsight, RiskFactor, RiskReport, SeizureEvent } from "../types";

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

export function assessDailyRisk(logs: DailyLog[], now = new Date()): RiskReport {
  const today = localDateString(now);
  const log = logs.find((entry) => entry.date === today);
  const factors: RiskFactor[] = [];
  let score = 12;

  if (log) {
    if (log.sleep_hours < 5) {
      score += 32;
      factors.push({ label: "Short sleep", detail: `${log.sleep_hours} hours recorded`, weight: 32 });
    } else if (log.sleep_hours < 7) {
      score += 16;
      factors.push({ label: "Below-target sleep", detail: `${log.sleep_hours} hours recorded`, weight: 16 });
    }
    if (!log.medication_taken) {
      score += 30;
      factors.push({ label: "Medication not logged", detail: "Today's dose is marked as missed", weight: 30 });
    }
    if (log.stress_level >= 4) {
      const weight = log.stress_level === 5 ? 20 : 13;
      score += weight;
      factors.push({ label: "Elevated stress", detail: `Stress level ${log.stress_level} of 5`, weight });
    }
    if (log.caffeine_cups >= 4) {
      score += 8;
      factors.push({ label: "Higher caffeine intake", detail: `${log.caffeine_cups} cups logged`, weight: 8 });
    }
  } else {
    factors.push({ label: "Daily check-in missing", detail: "Add today's check-in for a more relevant estimate", weight: 0 });
  }

  const boundedScore = clamp(score, 0, 100);
  return {
    score: boundedScore,
    level: boundedScore >= 60 ? "high" : boundedScore >= 35 ? "moderate" : "low",
    factors,
    updatedAt: now.toISOString(),
  };
}

export function discoverPatterns(logs: DailyLog[], events: SeizureEvent[]): PatternInsight[] {
  if (logs.length < 3) {
    return [{
      id: "building-baseline",
      title: "Building your personal baseline",
      description: "A few more daily check-ins will help reveal patterns in your own history.",
      metric: `${logs.length} / 7 days`,
      confidence: "early",
      icon: "activity",
    }];
  }

  const sortedLogs = [...logs].sort((first, second) => first.date.localeCompare(second.date));
  const history = new DoublyLinkedList<DailyLog>();
  sortedLogs.forEach((entry) => history.append(entry));

  const seizureDates = new BinarySearchTree<SeizureEvent[]>();
  const eventBuckets = new HashMap<SeizureEvent[]>();
  for (const event of events) {
    const date = event.occurred_at.slice(0, 10);
    const timestamp = new Date(`${date}T00:00:00Z`).getTime();
    const bucket = eventBuckets.get(date) ?? [];
    bucket.push(event);
    eventBuckets.set(date, bucket);
    seizureDates.insert(timestamp, bucket);
  }
  const indexedEventDays = new Set(seizureDates.inOrder().flat().map((event) => event.occurred_at.slice(0, 10)));

  const triggers = [
    { key: "sleep", label: "Short sleep", icon: "moon" as const, matches: (entry: DailyLog) => entry.sleep_hours < 5 },
    { key: "medication", label: "Missed medication", icon: "pill" as const, matches: (entry: DailyLog) => !entry.medication_taken },
    { key: "stress", label: "High stress", icon: "activity" as const, matches: (entry: DailyLog) => entry.stress_level >= 4 },
    { key: "caffeine", label: "Higher caffeine", icon: "coffee" as const, matches: (entry: DailyLog) => entry.caffeine_cups >= 3 },
  ];
  const insights: PatternInsight[] = [];
  const candidates = new PriorityQueue<PatternInsight>();

  for (const trigger of triggers) {
    const exposedDays = new Set<string>();
    let matchingEvents = 0;
    for (const entry of history) {
      if (!trigger.matches(entry)) continue;
      exposedDays.add(entry.date);
      if (indexedEventDays.has(entry.date)) matchingEvents += 1;
    }
    if (exposedDays.size < 2 || events.length === 0) continue;

    const percentage = Math.round((matchingEvents / exposedDays.size) * 100);
    const confidence = exposedDays.size >= 7 ? "strong" : exposedDays.size >= 4 ? "emerging" : "early";
    const insight: PatternInsight = {
      id: trigger.key,
      title: `${trigger.label} and seizure days`,
      description: `${matchingEvents} of ${exposedDays.size} logged ${trigger.label.toLowerCase()} days also had a recorded seizure. This is an association, not proof of cause.`,
      metric: `${percentage}%`,
      confidence,
      icon: trigger.icon,
    };
    candidates.enqueue(insight, -percentage);
  }

  while (candidates.size > 0 && insights.length < 3) {
    const insight = candidates.dequeue();
    if (insight) insights.push(insight);
  }
  return insights.length ? insights : [{
    id: "no-patterns-yet",
    title: "No recurring signal yet",
    description: "Keep logging sleep, medication, stress, and caffeine to build a useful personal history.",
    metric: `${logs.length} days`,
    confidence: "early",
    icon: "activity",
  }];
}

export function buildEmergencyDispatchOrder(
  patientId: string,
  contacts: EmergencyContact[],
): EmergencyContact[] {
  const graph = new CareNetworkGraph();
  contacts.forEach((contact) => graph.connect(patientId, contact.id));

  const pending = new PriorityQueue<EmergencyContact>();
  const reachable = new Set(graph.reachableFrom(patientId));
  contacts.forEach((contact) => {
    if (reachable.has(contact.id)) pending.enqueue(contact, contact.priority);
  });

  const result: EmergencyContact[] = [];
  while (pending.size > 0) {
    const contact = pending.dequeue();
    if (contact) result.push(contact);
  }
  return result;
}
