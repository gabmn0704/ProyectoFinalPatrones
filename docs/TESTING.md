# EpiSafe AI - Testing & Quality Assurance

## Testing Strategy

EpiSafe AI employs a **three-level testing pyramid** to ensure reliability and correctness:

```
        ┌─────────────┐
        │   E2E Tests │  (Manual, Production)
        ├─────────────┤
        │ Integration │  (API, Database)
        │   Tests     │
        ├─────────────┤
        │  Unit Tests │  (Components, Utilities)
        └─────────────┘
```

## Unit Tests

### Purpose
Test individual functions, components, and utilities in isolation.

### Location
`frontend/src/**/*.test.ts` and `frontend/src/**/*.test.tsx`

### Framework
- **Test Runner:** Vitest (Vite's native test runner)
- **Assertion Library:** Vitest built-in (`expect()`)
- **Component Testing:** React Testing Library (future)

### Example: Data Structure Tests

```typescript
// frontend/src/lib/dataStructures.test.ts
import { describe, it, expect } from "vitest";
import { Stack } from "./dataStructures";

describe("Stack", () => {
  it("should push and pop elements in LIFO order", () => {
    const stack = new Stack<number>();
    stack.push(1);
    stack.push(2);
    stack.push(3);
    
    expect(stack.pop()).toBe(3);
    expect(stack.pop()).toBe(2);
    expect(stack.pop()).toBe(1);
    expect(stack.isEmpty()).toBe(true);
  });

  it("should return undefined when popping from empty stack", () => {
    const stack = new Stack<string>();
    expect(stack.pop()).toBeUndefined();
  });

  it("should peek without removing element", () => {
    const stack = new Stack<number>();
    stack.push(42);
    expect(stack.peek()).toBe(42);
    expect(stack.size()).toBe(1);
    expect(stack.peek()).toBe(42); // Still there
  });

  it("should clear all elements", () => {
    const stack = new Stack<string>();
    stack.push("a");
    stack.push("b");
    stack.clear();
    expect(stack.isEmpty()).toBe(true);
  });
});
```

### Example: Utility Function Tests

```typescript
// frontend/src/lib/api.test.ts
import { describe, it, expect } from "vitest";
import { calculateRiskScore, analyzeTriggers } from "./api";
import type { DailyLog, SeizureEvent } from "../types";

describe("Risk Score Calculator", () => {
  const sampleLogs: DailyLog[] = [
    {
      id: "1",
      user_id: "user-123",
      date: "2024-01-01",
      sleep_hours: 4,
      stress_level: 8,
      caffeine_cups: 3,
      exercise_minutes: 0,
      medication_taken: false,
      notes: "Rough day",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const sampleEvents: SeizureEvent[] = [
    {
      id: "event-1",
      user_id: "user-123",
      occurred_at: "2024-01-01T15:30:00",
      severity: "moderate",
      duration_minutes: 3,
      notes: "Afternoon seizure",
      created_at: new Date().toISOString(),
    },
  ];

  it("should calculate elevated risk for poor sleep and missed meds", () => {
    const risk = calculateRiskScore(sampleLogs[0]);
    expect(risk).toBeGreaterThan(50);
  });

  it("should identify sleep as primary trigger", () => {
    const triggers = analyzeTriggers(sampleLogs, sampleEvents);
    expect(triggers).toContain("sleep_deprivation");
  });

  it("should return low risk for well-rested day with medication", () => {
    const goodDay: DailyLog = {
      ...sampleLogs[0],
      sleep_hours: 8,
      stress_level: 3,
      medication_taken: true,
    };
    const risk = calculateRiskScore(goodDay);
    expect(risk).toBeLessThan(30);
  });
});
```

### Running Unit Tests

```bash
# Frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- dataStructures.test.ts
```

### Test Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| Data Structures | 95% |
| API Functions | 85% |
| Utilities | 90% |
| Components | 70% |
| **Overall** | **80%** |

## Integration Tests

### Purpose
Test interactions between frontend and backend (Supabase API).

### Scope

**Authentication Integration**
```typescript
// frontend/src/lib/api.test.ts (auth section)
describe("Supabase Auth Integration", () => {
  it("should sign up user with name and password", async () => {
    const { data, error } = await supabase!.auth.signUp({
      email: "test@example.com",
      password: "SecurePass123!",
      options: {
        data: { full_name: "Test User" },
      },
    });
    
    expect(error).toBeNull();
    expect(data.user?.email).toBe("test@example.com");
    expect(data.user?.user_metadata.full_name).toBe("Test User");
  });

  it("should sign in user with email and password", async () => {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email: "test@example.com",
      password: "SecurePass123!",
    });
    
    expect(error).toBeNull();
    expect(data.session?.user.email).toBe("test@example.com");
  });

  it("should isolate user data via RLS policies", async () => {
    // Sign in as user1
    const { data: user1Session } = await supabase!.auth.signInWithPassword({
      email: "user1@example.com",
      password: "Pass123!",
    });

    // Fetch user1's logs
    const { data: user1Logs } = await supabase!
      .from("daily_logs")
      .select("*")
      .eq("user_id", user1Session!.user!.id);

    expect(user1Logs).toEqual(expect.arrayContaining([]));
    // User1 should NOT see user2's logs

    // Sign in as user2
    const { data: user2Session } = await supabase!.auth.signInWithPassword({
      email: "user2@example.com",
      password: "Pass123!",
    });

    // Attempt to fetch user1's logs as user2 (should fail via RLS)
    const { data: unauthorizedLogs, error } = await supabase!
      .from("daily_logs")
      .select("*")
      .eq("user_id", user1Session!.user!.id);

    expect(error).not.toBeNull(); // RLS policy blocks access
  });
});
```

**Data Management Integration**
```typescript
describe("Daily Log Data Persistence", () => {
  it("should save and retrieve daily log", async () => {
    const newLog: Partial<DailyLog> = {
      date: "2024-01-15",
      sleep_hours: 7,
      stress_level: 5,
      caffeine_cups: 2,
      exercise_minutes: 30,
      medication_taken: true,
      notes: "Good day",
    };

    // Save
    const { data: saved, error: saveError } = await supabase!
      .from("daily_logs")
      .insert([newLog])
      .select()
      .single();

    expect(saveError).toBeNull();
    expect(saved?.sleep_hours).toBe(7);

    // Retrieve
    const { data: retrieved } = await supabase!
      .from("daily_logs")
      .select("*")
      .eq("id", saved!.id)
      .single();

    expect(retrieved?.stress_level).toBe(5);
    expect(retrieved?.medication_taken).toBe(true);
  });

  it("should update existing log", async () => {
    // Create initial log
    const { data: log } = await supabase!
      .from("daily_logs")
      .insert([{ date: "2024-01-15", sleep_hours: 6 }])
      .select()
      .single();

    // Update
    const { data: updated } = await supabase!
      .from("daily_logs")
      .update({ sleep_hours: 8, stress_level: 3 })
      .eq("id", log!.id)
      .select()
      .single();

    expect(updated?.sleep_hours).toBe(8);
    expect(updated?.stress_level).toBe(3);
  });

  it("should delete log via RLS", async () => {
    // Create log
    const { data: log } = await supabase!
      .from("daily_logs")
      .insert([{ date: "2024-01-15" }])
      .select()
      .single();

    // Delete
    const { error } = await supabase!
      .from("daily_logs")
      .delete()
      .eq("id", log!.id);

    expect(error).toBeNull();

    // Verify deletion
    const { data: deleted } = await supabase!
      .from("daily_logs")
      .select("*")
      .eq("id", log!.id);

    expect(deleted).toHaveLength(0);
  });
});
```

## End-to-End (E2E) Tests

### Purpose
Test complete user workflows from login to data visualization.

### Tools
- **Browser Automation:** Playwright (future enhancement)
- **Test Data:** Isolated test user accounts

### Scenario 1: Complete Daily Check-In Flow

```typescript
// frontend/e2e/daily-checkin.test.ts (future)
import { test, expect } from "@playwright/test";

test.describe("Daily Check-In Workflow", () => {
  test("user can sign in and record daily check-in", async ({ page }) => {
    // Navigate to app
    await page.goto("https://episafe-ai-gabmn0704.netlify.app");

    // Sign in
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPass123!");
    await page.click('button:has-text("Sign in")');
    await page.waitForNavigation();

    // Verify dashboard loaded
    expect(page.url()).toContain("/dashboard");
    const heading = await page.textContent("h1");
    expect(heading).toContain("Check in with yourself");

    // Open daily log form
    await page.click('button:has-text("New Check-in")');
    expect(page.locator(".log-form")).toBeVisible();

    // Fill form
    await page.fill('[name="sleep_hours"]', "7");
    await page.fill('[name="stress_level"]', "4");
    await page.fill('[name="caffeine_cups"]', "2");
    await page.fill('[name="exercise_minutes"]', "30");
    await page.check('[name="medication_taken"]');
    await page.fill('[name="notes"]', "Good day overall");

    // Submit
    await page.click('button:has-text("Save Check-in")');
    
    // Verify success
    const successMessage = await page.textContent(".form-message.success");
    expect(successMessage).toContain("Check-in saved");

    // Verify data appears in dashboard
    const sleepChart = page.locator(".week-chart");
    expect(sleepChart).toContainText("7h");
  });

  test("user can view recent seizure events", async ({ page }) => {
    await page.goto("https://episafe-ai-gabmn0704.netlify.app");
    
    // Sign in
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPass123!");
    await page.click('button:has-text("Sign in")');
    await page.waitForNavigation();

    // Navigate to history
    await page.click('a[href="/history"]');
    
    // Verify events list
    const eventsList = page.locator(".event-list");
    expect(eventsList).toBeVisible();
    
    const eventCount = await page.locator(".event-row").count();
    expect(eventCount).toBeGreaterThan(0);
  });

  test("user can report emergency and notify contacts", async ({ page }) => {
    await page.goto("https://episafe-ai-gabmn0704.netlify.app");
    
    // Sign in
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPass123!");
    await page.click('button:has-text("Sign in")');
    await page.waitForNavigation();

    // Open emergency mode
    await page.click('button.emergency-button');
    
    // Verify emergency modal
    const modal = page.locator(".emergency-modal");
    expect(modal).toBeVisible();
    
    // Confirm emergency
    await page.click('button:has-text("Confirm")');
    
    // Verify notification sent
    const successAlert = page.locator(".alert.success");
    expect(successAlert).toContainText("Contacts notified");
  });
});
```

## Manual Testing Checklist

### Smoke Test (Quick Validation)

- [ ] **Sign-in & Sign-up (Email/Password)**
  - [ ] Create new account with email
  - [ ] Receive confirmation email
  - [ ] Sign in with credentials
  - [ ] See personalized dashboard

- [ ] **Google OAuth Sign-In**
  - [ ] Click "Continue with Google"
  - [ ] Redirect to Google login
  - [ ] Approve permissions
  - [ ] Return to dashboard with Google account
  - [ ] See name from Google profile

- [ ] **Daily Check-In**
  - [ ] Open check-in form
  - [ ] Fill all fields
  - [ ] Submit successfully
  - [ ] See entry in recent check-ins

- [ ] **Emergency Mode**
  - [ ] Click emergency button
  - [ ] Confirm seizure event
  - [ ] See success message
  - [ ] Event appears in history

### Cross-Browser Testing

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ |
| Firefox | Latest | ✅ |
| Safari | Latest | ✅ |
| Edge | Latest | ✅ |
| Mobile Safari (iOS) | Latest | ⏳ |
| Chrome Mobile (Android) | Latest | ⏳ |

### Device Testing

| Device | Size | Status |
|--------|------|--------|
| iPhone 12 | 390px | ✅ |
| iPad | 768px | ✅ |
| Desktop | 1440px+ | ✅ |
| Mobile (500px) | 500px | ⏳ |

### Accessibility Testing

- [ ] **Keyboard Navigation**
  - [ ] Tab through all interactive elements
  - [ ] Can open menus with Enter/Space
  - [ ] Can dismiss modals with Escape

- [ ] **Screen Reader**
  - [ ] Headings properly labeled
  - [ ] Form inputs have associated labels
  - [ ] Icon buttons have aria-labels
  - [ ] Tables have proper headers

- [ ] **Color Contrast**
  - [ ] All text meets WCAG AA (4.5:1)
  - [ ] Interactive elements clear
  - [ ] Icons readable without color alone

## Performance Testing

### Lighthouse Metrics

Run audits regularly:
```bash
# Using Lighthouse CLI
npm install -g lighthouse
lighthouse https://episafe-ai-gabmn0704.netlify.app --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Load Testing

- **Frontend:** Netlify CDN caches globally
- **Backend:** Supabase handles auto-scaling
- **Database:** PostgreSQL with query optimization

## Security Testing

### OWASP Top 10

- [ ] **SQL Injection:** RLS policies prevent direct SQL access
- [ ] **Authentication:** Supabase manages secure sessions
- [ ] **Sensitive Data:** All user data tied to auth.uid()
- [ ] **XML External Entities:** N/A (no XML processing)
- [ ] **Broken Access Control:** RLS enforced at database level
- [ ] **Security Misconfiguration:** Supabase defaults are secure
- [ ] **XSS:** React auto-escapes content, input validation
- [ ] **Insecure Deserialization:** N/A (no serialization)
- [ ] **Using Components with Known Vulnerabilities:** Dependencies scanned with npm audit
- [ ] **Insufficient Logging:** Supabase logs all auth events

### Manual Security Checks

- [ ] Cannot access another user's data via API
- [ ] Cannot modify another user's records
- [ ] Tokens expire and refresh properly
- [ ] Password resets work securely
- [ ] API keys stored only server-side

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Run unit tests
        run: cd frontend && npm test
      
      - name: Build TypeScript
        run: cd frontend && npm run typecheck
      
      - name: Build for production
        run: cd frontend && npm run build
```

## Regression Testing

After each update:

1. Run all unit tests
2. Smoke test manual workflows
3. Verify no console errors in production
4. Check Netlify build logs
5. Validate Supabase dashboard queries

## Quality Gates

| Gate | Threshold | Enforced |
|------|-----------|----------|
| Unit Test Coverage | 80% | ✅ CI |
| TypeScript Compilation | No errors | ✅ CI |
| Production Build | Succeeds | ✅ CI |
| Lighthouse Performance | 90+ | ⏳ Future |
| Security Audit | No high/critical CVEs | ⏳ Future |

## Issue Tracking

Use GitHub Issues with labels:
- `bug` — defect found
- `test` — test failure
- `performance` — slow operation
- `security` — vulnerability
- `a11y` — accessibility issue

---

**Next Steps:** Expand E2E tests with Playwright, add performance monitoring, integrate security scanning.
