# EpiSafe AI - Architecture & Data Structures

## System Architecture

EpiSafe AI is built as a modern, cloud-native application with three main layers:

### 1. Frontend (React + TypeScript)
- **Location:** `frontend/src/`
- **Framework:** React 18 with Vite
- **UI Library:** Lucide icons, custom CSS
- **Authentication:** Supabase Auth (email/password, Google OAuth)
- **State Management:** React hooks + local component state
- **Theme Support:** Light and dark modes with CSS variables

### 2. Backend (Node.js + Supabase)
- **Location:** `backend/supabase/`
- **Type:** Serverless Functions + PostgreSQL
- **Authentication:** Supabase Auth with Row Level Security (RLS)
- **API:** Supabase REST API (auto-generated from schema)
- **Database:** PostgreSQL with full-text search and JSONB support

### 3. Deployment
- **Frontend Hosting:** Netlify (CDN, auto-deploy from Git)
- **Backend Hosting:** Supabase Cloud (PostgreSQL managed database)
- **CI/CD:** GitHub Actions (automatic builds and deploys)
- **Environment:** Production URL: https://episafe-ai-gabmn0704.netlify.app

## Data Structures & Algorithms

The EpiSafe AI system uses several data structures to efficiently process and analyze user health data:

### 1. Stack (Last-In-First-Out)

**Purpose:** Implement the "undo" functionality and manage recent events.

**Location:** `frontend/src/lib/dataStructures.ts`

```typescript
export class Stack<T> {
  private items: T[] = [];

  push(element: T): void { this.items.push(element); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
  clear(): void { this.items = []; }
  print(): void { console.log(this.items.toString()); }
}
```

**Use Cases:**
- Store navigation history (back button)
- Undo recent actions in daily log form
- Manage temporary alert stack (multiple notifications)

**Time Complexity:**
- Push: O(1)
- Pop: O(1)
- Peek: O(1)

### 2. Queue (First-In-First-Out)

**Purpose:** (Extensible) Process events in order, manage alert queue.

**Potential Implementation:** `frontend/src/lib/dataStructures.ts`

**Use Cases:**
- Queue emergency notifications to contacts
- Process health check-ins in chronological order
- Manage batch operations (e.g., batch email notifications)

### 3. Array/List (Dynamic)

**Purpose:** Store collections of daily logs, events, and contacts.

**Used Throughout:**
- `DailyLog[]` — user's daily check-ins
- `SeizureEvent[]` — seizure episodes (history)
- `EmergencyContact[]` — trusted people to notify

**Operations:**
- **Add:** O(1) amortized (push to array)
- **Remove:** O(n) (find and splice)
- **Search:** O(n) linear search, O(log n) if sorted and using binary search
- **Update:** O(1) if index known

### 4. Hash Map (Dictionary)

**Purpose:** Fast lookups of user data by key.

**Implemented as:**
```typescript
// Type-safe object literals used throughout
const userDataMap: Record<string, DashboardData> = {};
userDataMap[userId] = dashboardData;
```

**Use Cases:**
- Store user profiles indexed by `user_id`
- Cache daily logs indexed by date
- Quick lookup of emergency contacts by contact ID

**Operations:**
- **Get:** O(1) average
- **Set:** O(1) average
- **Delete:** O(1) average

### 5. Binary Search (Sorted List Search)

**Purpose:** Efficiently find data within sorted time ranges.

**Potential Use:**
```typescript
// Find seizures in a date range efficiently
const seizuresInRange = (
  events: SeizureEvent[],
  startDate: Date,
  endDate: Date
): SeizureEvent[] => {
  const sorted = events.sort((a, b) => 
    new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
  
  // Could use binary search on timestamps to find range
  return sorted.filter(e => {
    const d = new Date(e.occurred_at);
    return d >= startDate && d <= endDate;
  });
};
```

**Time Complexity:** O(log n) lookup + O(k) for k results

### 6. Pattern Recognition (AI Analysis)

**Purpose:** Identify triggers and predict risk using data analysis.

**Algorithm:** Statistical correlation analysis

**Example: Sleep Pattern Analysis**
```typescript
const analyzeSleepPatterns = (logs: DailyLog[], events: SeizureEvent[]) => {
  // Group seizures by sleep hours buckets
  const seizuresBySleep = new Map<number, number>();
  
  events.forEach(event => {
    const eventDate = event.occurred_at.split('T')[0];
    const log = logs.find(l => l.date === eventDate);
    if (log) {
      const bucket = Math.floor(log.sleep_hours);
      seizuresByleep.set(bucket, (seizuresByleep.get(bucket) ?? 0) + 1);
    }
  });
  
  // Find correlation: "80% of seizures after <5 hours sleep"
  return analyzeTriggerCorrelation(seizuresByleep);
};
```

### 7. Graph (Relationships)

**Purpose:** Model relationships between triggers, symptoms, and seizures.

**Conceptual Structure:**
```
┌─────────────┐
│ Sleep Hours │ ──→ High Seizure Risk
│  < 5 hours  │
└─────────────┘

┌──────────────┐
│  High Stress │ ──→ Medium Seizure Risk
│   Level 8+   │
└──────────────┘

┌────────────────┐
│ Missed Meds    │ ──→ Very High Seizure Risk
│ Today          │
└────────────────┘
```

**Implementation:** Could use adjacency list for complex trigger graphs:
```typescript
interface TriggerGraph {
  triggers: Map<string, Set<string>>; // trigger → outcomes
  weights: Map<string, number>;        // correlation strength
}
```

## Database Schema

The Supabase PostgreSQL database includes:

### Core Tables

**users** (managed by Supabase Auth)
- `id` (UUID, primary key)
- `email` (string, unique)
- `user_metadata` (JSONB, includes `full_name`, `avatar_url`, etc.)
- `created_at`, `updated_at` (timestamps)

**daily_logs**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `date` (date)
- `sleep_hours` (integer)
- `stress_level` (integer, 1-10)
- `caffeine_cups` (integer)
- `exercise_minutes` (integer)
- `medication_taken` (boolean)
- `notes` (text)
- `created_at`, `updated_at` (timestamps)

**seizure_events**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `occurred_at` (timestamp)
- `severity` (enum: mild, moderate, severe)
- `duration_minutes` (integer)
- `notes` (text)
- `created_at` (timestamp)

**emergency_contacts**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `name` (string)
- `phone` (string)
- `email` (string)
- `relationship` (string)
- `created_at`, `updated_at` (timestamps)

**risk_assessments** (future table)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `date` (date)
- `risk_score` (integer, 0-100)
- `risk_level` (enum: low, medium, high)
- `factors` (JSONB, array of contributing factors)
- `created_at` (timestamp)

### Row Level Security (RLS) Policies

All tables use RLS to ensure data isolation:

```sql
-- Example: Users can only view their own daily logs
CREATE POLICY "Users can view their own daily logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own logs
CREATE POLICY "Users can insert their own daily logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own logs
CREATE POLICY "Users can update their own daily logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own logs
CREATE POLICY "Users can delete their own daily logs"
  ON daily_logs FOR DELETE
  USING (auth.uid() = user_id);
```

## API Endpoints

Auto-generated by Supabase (REST interface):

```
GET    /rest/v1/daily_logs?user_id=eq.<user_id>
POST   /rest/v1/daily_logs
PATCH  /rest/v1/daily_logs?id=eq.<id>
DELETE /rest/v1/daily_logs?id=eq.<id>

GET    /rest/v1/seizure_events?user_id=eq.<user_id>
POST   /rest/v1/seizure_events
DELETE /rest/v1/seizure_events?id=eq.<id>

GET    /rest/v1/emergency_contacts?user_id=eq.<user_id>
POST   /rest/v1/emergency_contacts
PATCH  /rest/v1/emergency_contacts?id=eq.<id>
DELETE /rest/v1/emergency_contacts?id=eq.<id>
```

### Custom Backend Functions (Future)

```
POST   /functions/v1/send-emergency-alert (notify contacts)
POST   /functions/v1/calculate-risk-score (AI analysis)
POST   /functions/v1/export-health-records (generate CSV)
```

## Authentication Flow

### Email/Password Sign-Up
1. User enters name, email, password
2. Frontend calls `supabase.auth.signUp()`
3. Supabase sends confirmation email
4. User clicks confirmation link
5. User can now sign in
6. Session token stored in browser storage
7. RLS policies automatically limit data access

### Google OAuth Sign-In
1. User clicks "Continue with Google"
2. Frontend calls `supabase.auth.signInWithOAuth('google')`
3. Browser redirects to Google's login page
4. User logs in with Google account
5. User grants permission to EpiSafe
6. Google redirects to Supabase callback
7. Supabase creates auth user from Google profile
8. Browser redirected to dashboard (authenticated)
9. Session token stored, RLS activated

## Performance Optimizations

1. **Pagination:** Daily logs paginated (7-30 days at a time)
2. **Caching:** Recent logs cached in React state
3. **Lazy Loading:** Charts and detailed views load on demand
4. **Database Indexes:** `user_id`, `date` indexed for fast queries
5. **Compression:** Supabase gzip compression enabled
6. **CDN:** Netlify CDN caches static assets globally

## Security Considerations

1. **RLS Policies:** Enforced at database level (not in application code)
2. **HTTPS:** All traffic encrypted (Netlify + Supabase both HTTPS)
3. **Token Management:** Auth tokens stored in secure cookie (Supabase default)
4. **Environment Variables:** Secrets stored in Netlify/Supabase, not in Git
5. **Input Validation:** Frontend validates inputs before sending to backend
6. **CORS:** Supabase handles CORS for secure cross-origin requests

## Scalability

- **Database:** Supabase scales to millions of records with indexing
- **Frontend:** Netlify CDN scales globally with automatic replicas
- **Auth:** Supabase handles millions of concurrent auth requests
- **Real-time:** WebSocket subscriptions available for live updates (future enhancement)

## Testing

- **Unit Tests:** Vitest in `frontend/src/**/*.test.ts`
- **Integration Tests:** API testing via Supabase client in tests
- **E2E Tests:** Manual testing + GitHub Actions workflow

## Related Documentation

- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
- [Deployment Guide](./deployment.md)
- [Database Schema](../backend/supabase/schema.sql)
- [Project Setup](./PROJECT_SETUP.md)
