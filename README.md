# SeKeyity

SeKeyity is a Next.js application for running lightweight cybersecurity assessments for nonprofits, student organizations, startups, and small businesses. It combines authenticated assessment workflows, framework-backed recommendations, reporting, and follow-up action surfaces in a single demo-ready product.

## Overview

The current product flow is:

1. A user creates an account.
2. The app redirects to a pre-questionnaire that captures organization name, type, and size.
3. The user completes the cybersecurity questionnaire.
4. The API scores the responses, stores the assessment, and generates AI-assisted recommendations grounded in the seeded CIS/NIST control excerpts.
5. The user can review results across the dashboard, report, alerts, and related support pages.

## Core Capabilities

- Email/password authentication with Supabase SSR session handling
- Guided onboarding with a dedicated pre-questionnaire step
- Questionnaire submission and assessment persistence
- AI-generated remediation recommendations with fallback behavior when model calls fail
- Dashboard, report, alerts, and policy support surfaces derived from the latest assessment
- PDF report export and mitigation tracking
- Lightweight test harness route for validating assessment request/response behavior

## Technology Stack

- Next.js App Router
- React 19
- TypeScript
- Supabase Auth and Postgres
- Tailwind CSS
- Motion for React
- OpenAI API
- Recharts
- pdf-lib

## Application Structure

```text
app/
  alerts/
  api/
  dashboard/
  knowledge-base/
  mission-control/
  prequestionnaire/
  questionnaire/
  report/
  settings/
  sign-in/
  sign-up/
  test-harness/
components/
lib/
supabase/
types/
```

## Key Runtime Paths

- [app/sign-up/page.tsx](/Users/chase/code/hackmisso-26/app/sign-up/page.tsx): account creation
- [app/prequestionnaire/page.tsx](/Users/chase/code/hackmisso-26/app/prequestionnaire/page.tsx): organization profile capture
- [app/questionnaire/page.tsx](/Users/chase/code/hackmisso-26/app/questionnaire/page.tsx): primary assessment flow
- [app/api/assessment/route.ts](/Users/chase/code/hackmisso-26/app/api/assessment/route.ts): question fetch and assessment submission
- [lib/ai.ts](/Users/chase/code/hackmisso-26/lib/ai.ts): recommendation generation and fallback logic
- [lib/assessment-dal.ts](/Users/chase/code/hackmisso-26/lib/assessment-dal.ts): database access for questions and assessments
- [app/test-harness/page.tsx](/Users/chase/code/hackmisso-26/app/test-harness/page.tsx): minimal end-to-end assessment validation route

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY`
  Required only for server-side administrative operations such as account deletion.

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Populate `.env.local` with the required variables.

3. Run the development server.

```bash
npm run dev
```

4. Open the URL printed by Next.js. If `3000` is unavailable, Next.js will automatically choose another port.

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password authentication in `Authentication -> Providers`.
3. Add the project URL and anon key to your local environment.
4. Run the migrations below in order using the Supabase SQL editor:
   - [supabase/migrations/202603271300_initial_schema.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271300_initial_schema.sql)
   - [supabase/migrations/202603271830_assessment_schema.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271830_assessment_schema.sql)
   - [supabase/migrations/202603271945_add_org_profile_to_assessments.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271945_add_org_profile_to_assessments.sql)
   - [supabase/migrations/202603281030_add_mitigated_alert_titles.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603281030_add_mitigated_alert_titles.sql)

Optional data:

- [supabase/seed.sql](/Users/chase/code/hackmisso-26/supabase/seed.sql): demo project/profile seed data
- [supabase/questions.sql](/Users/chase/code/hackmisso-26/supabase/questions.sql): question refresh script

## Data Model

Primary tables:

- `profiles`
- `projects`
- `notes`
- `questions`
- `assessments`

Assessment-specific notes:

- `questions` stores the assessment prompts, weighting data, and framework metadata including `framework_name`, `framework_reference`, and `framework_excerpt`
- `assessments` stores raw responses, failed controls, organization profile, generated recommendations, mitigation tracking, and computed scores

## Security Model

- Middleware refreshes Supabase sessions and guards protected routes
- Row-level security restricts records to the authenticated owner where applicable
- Assessment question data is available to authenticated users
- Assessment records are readable and writable only by the owning user

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Notes for Contributors

- The active AI recommendation path is centralized in [lib/ai.ts](/Users/chase/code/hackmisso-26/lib/ai.ts)
- The assessment API is the single submission path for the questionnaire and test harness
- Organization name, type, and size belong in the pre-questionnaire step, not sign-up
- When updating schema-dependent behavior, keep the Supabase migrations and README aligned

## Deployment

- Configure the same environment variables in the deployment target
- Apply the same migrations to the target Supabase project before release
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser
