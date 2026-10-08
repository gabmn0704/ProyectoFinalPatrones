import { afterEach, describe, expect, it } from "vitest";
import { createDemoDashboard, saveDemoUserName, writeLocal } from "./demoData";

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("personalized demo profiles", () => {
  it("keeps preview history separate for each display name", () => {
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

    saveDemoUserName("Taylor Lee");
    const firstProfile = createDemoDashboard();
    writeLocal("episafe.logs", []);

    saveDemoUserName("Morgan Reed");
    const secondProfile = createDemoDashboard();

    expect(firstProfile.logs[0].user_id).not.toBe(secondProfile.logs[0].user_id);
    expect(secondProfile.logs).toHaveLength(14);

    saveDemoUserName("Taylor Lee");
    expect(createDemoDashboard().logs).toEqual([]);
  });
});
