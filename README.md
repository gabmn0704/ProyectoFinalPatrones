# EpiSafe AI

EpiSafe AI is a TypeScript-only, full-stack epilepsy self-care project. It brings daily wellbeing check-ins, a personal seizure timeline, transparent pattern analysis, and emergency-care-circle preparation into one calm, privacy-minded experience.

> **Safety first:** EpiSafe is an educational self-tracking tool. It does not diagnose epilepsy, predict or prevent seizures, recommend treatment, or contact emergency services. A risk signal is not a medical risk score. For an emergency, contact local emergency services and follow the person's clinician-provided care plan.

## Project structure

```text
frontend/                  React + TypeScript web application
  src/components/          Accessible dashboard and care tools
  src/data/                Local demo data
  src/lib/                 API client, data structures, and insight engine
backend/
  functions/               Netlify serverless API
  src/                     API validation, database types, notifications
  supabase/schema.sql      PostgreSQL schema, indexes, and row-level security
docs/                      Deployment runbook and presentation outline
netlify.toml               Netlify build, functions, and route configuration
```

## Technology and AI

- **Frontend:** React and TypeScript, built with Vite.
- **API/backend:** TypeScript Netlify Functions; each private endpoint validates the Supabase user and scopes database operations to that authenticated user.
- **Database and accounts:** Supabase Auth and PostgreSQL with row-level security.
- **Hosting/CI:** The application and serverless API are deployed to Netlify. GitHub Actions runs typechecking, tests, and the production build; it deploys subsequent pushes to `main` once the Netlify credentials are configured. Supabase hosts the database.
- **Care-circle email:** Optional Resend integration. An event is still saved if email delivery is not configured or fails; delivery status is shown.
- **Personalized insights:** A transparent, deterministic pattern-analysis engine written in TypeScript. It compares logged factors with recorded event days and displays the sample size and a non-causation notice. The daily wellness signal explains which same-day inputs changed its illustrative score. It is **not** a trained clinical AI model and is **not** a seizure prediction.

If Supabase is not configured, EpiSafe asks for a display name before opening the interactive demo. Each demo name gets a separate set of entries in that browser's local storage; this preview is not a secure login. Add Supabase configuration to enable individual email/password accounts and persistent, user-isolated cloud data.

The dashboard includes a remembered **light/dark appearance toggle**; the selected theme is saved locally and respected on subsequent visits.

## Run locally

Requirements: Node.js 20 or later and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL shown by Vite. Without environment variables, the app runs using demo data. To develop the API against a configured Supabase project, install the Netlify CLI with `npm.cmd install --global netlify-cli` and run `npm.cmd run netlify:dev`; the local Netlify server provides both the Vite frontend and Functions.

## Quality checks

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

## Configure cloud services

Follow [the deployment runbook](docs/deployment.md) for Supabase setup, GitHub Actions variables and secrets, Netlify configuration, server-only secrets, optional notification delivery, and production verification. Never publish the Supabase service-role key or Resend API key to browser code.

## Data structures demonstrated

The assignment calls for applying data structures. The implementation includes and tests a hash map (factor aggregation), queue (breadth-first care-network traversal), stack (newest-first event history), doubly linked list (ordered check-in analysis), binary search tree (event-day index), priority queue/heap (contact ordering), and graph (care circle). Each structure is implemented in TypeScript and connected to actual application logic.

## Presentation

The Spanish-language [presentation outline](docs/presentation.md) covers the real-world problem, solution, AI approach, data structures, architecture, privacy, limitations, and demonstration flow.
