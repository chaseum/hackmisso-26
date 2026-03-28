# Hackathon Starter

Production-quality starter for hackathons, case competitions, and pitch demos using Next.js App Router, TypeScript, Supabase SSR auth, Tailwind CSS, and Motion for React.

## Stack

- Next.js App Router with TypeScript
- Supabase for auth and Postgres
- Tailwind CSS for styling
- Motion for React for transitions and interaction polish
- ESLint and strict TypeScript for fast iteration with guardrails

## What You Get

- Responsive landing page with a polished marketing feel
- Supabase email/password auth
- Protected dashboard route with session-aware navbar
- Barebones `/test-harness` client page for end-to-end cyber assessment testing
- Minimal project/profile/notes data model with RLS
- `GET/POST /api/assessment` flow for question fetch, scoring, persistence, and AI recommendations
- Reusable UI components for buttons, cards, inputs, empty states, and layout
- Dashboard sections tailored for case competition workflows
- Clear setup docs and environment template

## Project Structure

```text
app/
components/
lib/
supabase/
types/
public/
```

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
  Only for future server-side admin scripts. This starter does not use it by default.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Add your Supabase project URL, anon key, and OpenAI API key to `.env.local`.

3. Start the development server:

```bash
npm run dev
```

4. Open the URL printed by Next.js. If port `3000` is busy, Next.js will use another port such as `3001`.
5. Use the navbar link or open `/test-harness` to exercise the assessment flow.

## Supabase Setup

1. Create a new Supabase project.
2. In Supabase, enable Email auth under `Authentication -> Providers`.
3. Copy the project URL and anon key into `.env.local`.
4. Open the SQL editor and run the migrations in order:
   - [supabase/migrations/202603271300_initial_schema.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271300_initial_schema.sql)
   - [supabase/migrations/202603271830_assessment_schema.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271830_assessment_schema.sql)
   - [supabase/migrations/202603271945_add_org_profile_to_assessments.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271945_add_org_profile_to_assessments.sql)
   - [supabase/migrations/202603281030_add_mitigated_alert_titles.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603281030_add_mitigated_alert_titles.sql)
5. Optional:
   - update the UUID in [supabase/seed.sql](/Users/chase/code/hackmisso-26/supabase/seed.sql) and run it for demo project data
   - run [supabase/questions.sql](/Users/chase/code/hackmisso-26/supabase/questions.sql) to create or refresh the assessment question set manually

## Auth Architecture

- Middleware refreshes the Supabase session and protects `/dashboard`.
- Server components use SSR-compatible Supabase clients.
- Auth forms use server actions for sign-in, sign-up, and sign-out.
- A trigger creates or updates `profiles` records when new auth users are created.

## Database Schema

Tables:

- `profiles`
- `projects`
- `notes`
- `questions`
- `assessments`

Security:

- Profiles are only visible and editable by the owning user.
- Projects are only accessible to their owner.
- Notes are scoped to the author and the owner of the related project.
- Questions are readable by authenticated users.
- Assessments are readable and insertable only by the owning authenticated user.

Assessment schema:

- `questions` stores questionnaire text, scoring fields, and framework excerpts for RAG-style retrieval.
- `assessments` stores finalized scores, failed question ids, raw responses, and AI recommendations.
- Assessment recommendations are generated in [`lib/ai.ts`](/Users/chase/code/hackmisso-26/lib/ai.ts) and served through [`app/api/assessment/route.ts`](/Users/chase/code/hackmisso-26/app/api/assessment/route.ts).

## Deployment Notes

- Works on Vercel with environment variables set in the project settings.
- Run the same SQL migration against the production Supabase project before launch.
- Keep the anon key in client-facing env vars only. Do not expose the service role key to the browser.

## What To Customize First

1. Replace the landing page copy and brand styling.
2. Adjust the `projects` schema to match your competition or demo workflow.
3. Add your real dashboard sections, metrics, and project narrative blocks.
4. Decide whether to add Supabase Storage uploads or a public share page.

## Manual SQL To Run

Run:

- [supabase/migrations/202603271300_initial_schema.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271300_initial_schema.sql)
- [supabase/migrations/202603271830_assessment_schema.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271830_assessment_schema.sql)
- [supabase/migrations/202603271945_add_org_profile_to_assessments.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603271945_add_org_profile_to_assessments.sql)
- [supabase/migrations/202603281030_add_mitigated_alert_titles.sql](/Users/chase/code/hackmisso-26/supabase/migrations/202603281030_add_mitigated_alert_titles.sql)

Optional:

- [supabase/seed.sql](/Users/chase/code/hackmisso-26/supabase/seed.sql)
- [supabase/questions.sql](/Users/chase/code/hackmisso-26/supabase/questions.sql)

## Commands

Install:

```bash
npm install
```

Develop:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Build:

```bash
npm run build
```

## Optional Next Enhancements

- Dark mode toggle
- Supabase Storage file uploads for pitch assets
- Toast notifications for form success and error states
- Public read-only share page for project demos
- Demo data generator for onboarding judges quickly
