import { afterEach, describe, expect, it } from "vitest";
import { createDemoDashboard, saveDemoUserName } from "../data/demoData";
import { removeContact } from "./api";

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("demo emergency contacts", () => {
  it("removes only the selected contact and persists the care circle", async () => {
    const storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => storedValues.get(key) ?? null,
          setItem: (key: string, value: string) => storedValues.set(key, value),
        },
      },
    });
    saveDemoUserName("Test user");
    const [selected, retained] = createDemoDashboard().contacts;

    await removeContact(selected.id, false);

    expect(createDemoDashboard().contacts.map(({ id }) => id)).toEqual([retained.id]);
  });
});
