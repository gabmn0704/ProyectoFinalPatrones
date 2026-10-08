import { describe, expect, it } from "vitest";
import type { DailyLog, EmergencyContact, SeizureEvent } from "../types";
import { buildEmergencyDispatchOrder, assessDailyRisk, discoverPatterns } from "./riskEngine";
import { BinarySearchTree, CareNetworkGraph, DoublyLinkedList, HashMap, PriorityQueue, Queue, Stack } from "./dataStructures";

const dailyLog = (date: string, overrides: Partial<DailyLog> = {}): DailyLog => ({
  id: date,
  user_id: "patient",
  date,
  sleep_hours: 8,
  stress_level: 2,
  caffeine_cups: 1,
  exercise_minutes: 20,
  medication_taken: true,
  notes: "",
  ...overrides,
});

describe("personalized risk engine", () => {
  it("flags short sleep, missed medication, and elevated stress", () => {
    const report = assessDailyRisk([
      dailyLog("2026-10-07", { sleep_hours: 4, medication_taken: false, stress_level: 5 }),
    ], new Date("2026-10-07T12:00:00Z"));

    expect(report.level).toBe("high");
    expect(report.score).toBe(94);
    expect(report.factors.map(({ label }) => label)).toEqual([
      "Short sleep",
      "Medication not logged",
      "Elevated stress",
    ]);
  });

  it("does not claim a pattern when no seizure history exists", () => {
    const insights = discoverPatterns([
      dailyLog("2026-10-01", { sleep_hours: 4 }),
      dailyLog("2026-10-02", { sleep_hours: 4 }),
      dailyLog("2026-10-03", { sleep_hours: 8 }),
    ], []);
    expect(insights[0].id).toBe("no-patterns-yet");
  });

  it("describes observed associations with a transparent sample size", () => {
    const logs = [
      dailyLog("2026-10-01", { sleep_hours: 4 }),
      dailyLog("2026-10-02", { sleep_hours: 4 }),
      dailyLog("2026-10-03", { sleep_hours: 8 }),
    ];
    const events: SeizureEvent[] = [{
      id: "event-1",
      user_id: "patient",
      occurred_at: "2026-10-01T11:00:00.000Z",
      severity: "mild",
      duration_minutes: 1,
      notes: "",
    }];
    const insights = discoverPatterns(logs, events);
    expect(insights[0].description).toContain("1 of 2");
    expect(insights[0].description).toContain("not proof of cause");
  });

  it("orders emergency contacts by priority", () => {
    const contacts: EmergencyContact[] = [
      { id: "c2", user_id: "patient", name: "Second", email: "b@example.com", phone: "", priority: 2 },
      { id: "c1", user_id: "patient", name: "First", email: "a@example.com", phone: "", priority: 1 },
    ];
    expect(buildEmergencyDispatchOrder("patient", contacts).map(({ id }) => id)).toEqual(["c1", "c2"]);
  });
});

describe("core data structures", () => {
  it("handles hash collisions and replaces values", () => {
    const map = new HashMap<number>(1);
    map.set("a", 1);
    map.set("b", 2);
    map.set("a", 3);
    expect(map.get("a")).toBe(3);
    expect(map.get("b")).toBe(2);
    expect(map.size).toBe(2);
  });

  it("preserves FIFO queue ordering", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(2);
    expect(queue.dequeue()).toBeUndefined();
  });

  it("preserves LIFO stack ordering", () => {
    const stack = new Stack<number>();
    stack.push(1);
    stack.push(2);
    expect(stack.pop()).toBe(2);
    expect(stack.pop()).toBe(1);
    expect(stack.pop()).toBeUndefined();
  });

  it("traverses a linked list in insertion order", () => {
    const list = new DoublyLinkedList<string>();
    list.append("a");
    list.append("b");
    expect([...list]).toEqual(["a", "b"]);
  });

  it("traverses the binary search tree in sorted order", () => {
    const tree = new BinarySearchTree<string>();
    tree.insert(5, "five");
    tree.insert(2, "two");
    tree.insert(8, "eight");
    expect(tree.inOrder()).toEqual(["two", "five", "eight"]);
  });

  it("removes priority queue entries from highest priority first", () => {
    const queue = new PriorityQueue<string>();
    queue.enqueue("later", 3);
    queue.enqueue("first", 1);
    expect(queue.dequeue()).toBe("first");
  });

  it("finds all care network contacts reachable from the patient", () => {
    const graph = new CareNetworkGraph();
    graph.connect("patient", "caregiver");
    graph.connect("caregiver", "clinician");
    expect(graph.reachableFrom("patient")).toEqual(["caregiver", "clinician"]);
  });
});
