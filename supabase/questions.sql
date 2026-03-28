create extension if not exists "pgcrypto";

create table if not exists public.questions (
  id text primary key,
  display_order integer not null unique,
  category text not null,
  plain_text_question text not null check (char_length(plain_text_question) > 0),
  risk_weight numeric not null check (risk_weight >= 0),
  effort_level numeric not null check (effort_level >= 0),
  framework_name text not null,
  framework_reference text not null,
  framework_excerpt text not null check (char_length(framework_excerpt) > 0),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_score numeric not null check (total_score >= 0),
  score_percent numeric not null check (score_percent >= 0 and score_percent <= 100),
  high_priority_flags integer not null default 0 check (high_priority_flags >= 0),
  raw_responses jsonb not null,
  failed_question_ids text[] not null default '{}'::text[],
  ai_recommendations text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.questions enable row level security;
alter table public.assessments enable row level security;

drop policy if exists "questions are viewable by authenticated users" on public.questions;
create policy "questions are viewable by authenticated users"
  on public.questions
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "assessments are viewable by owner" on public.assessments;
create policy "assessments are viewable by owner"
  on public.assessments
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "assessments are insertable by owner" on public.assessments;
create policy "assessments are insertable by owner"
  on public.assessments
  for insert
  with check ((select auth.uid()) = user_id);

insert into public.questions (
  id,
  display_order,
  category,
  plain_text_question,
  risk_weight,
  effort_level,
  framework_name,
  framework_reference,
  framework_excerpt
) values
  (
    'q1',
    1,
    'Identify',
    'Do you have an accurate, up-to-date list of all computers, servers, and devices used by your organization?',
    2.0,
    2.0,
    'CIS Controls',
    'CIS Control 1',
    'Actively manage (inventory, track, and correct) all enterprise assets connected to the infrastructure physically, virtually, or remotely. Without knowing exactly what devices are touching your network, you cannot secure them, leaving blind spots where attackers can hide unmonitored.'
  ),
  (
    'q2',
    2,
    'Identify',
    'Are former employees and volunteers locked out of all digital accounts on the exact day they leave?',
    3.0,
    1.0,
    'ISO 27001',
    'ISO/IEC 27001 A.5.18',
    'Formal procedures must be implemented to manage the allocation, review, and revocation of access rights. When personnel leave, their access to all information processing facilities and services must be terminated immediately. Orphaned accounts are a primary vector for insider threats and unauthorized external access.'
  ),
  (
    'q3',
    3,
    'Protect',
    'Do you require two-step verification (MFA) to log into critical systems like email and banking?',
    3.0,
    1.0,
    'CIS Controls',
    'CIS Control 6',
    'Use secure authentication credentials, such as Multi-Factor Authentication (MFA), for all administrative access, remote access, and enterprise-facing applications. MFA adds a critical layer of security by requiring two or more independent credentials, neutralizing the threat of compromised, reused, or easily guessed passwords.'
  ),
  (
    'q4',
    4,
    'Protect',
    'Are your computers and servers set to automatically install software and security updates?',
    3.0,
    1.0,
    'CIS Controls',
    'CIS Control 7',
    'Develop a plan to continuously assess and track vulnerabilities on all enterprise assets. Ensure software, operating systems, and applications are updated with the latest security patches. Unpatched software contains known, public exploits that attackers actively scan for and use to compromise systems automatically.'
  ),
  (
    'q5',
    5,
    'Protect',
    'Do you restrict access to sensitive data only to the specific people who absolutely need it?',
    2.0,
    1.0,
    'NIST CSF',
    'PR.AA-01',
    'Access permissions, entitlements, and authorizations are managed, incorporating the principles of least privilege and separation of duties. Users should only have access to the specific data and systems necessary for their role. Over-permissioning allows a single compromised user account to grant an attacker access to the entire organization''s sensitive data.'
  ),
  (
    'q6',
    6,
    'Protect',
    'Do you require the use of a secure password manager or unique, complex passwords for all company accounts?',
    3.0,
    2.0,
    'CIS Controls',
    'CIS Control 5',
    'Establish and manage an inventory of accounts, including the requirement for complex, unique passwords across all systems. Utilizing enterprise password managers ensures employees do not resort to weak or reused passwords across personal and business accounts, significantly lowering the risk of credential stuffing attacks.'
  ),
  (
    'q7',
    7,
    'Protect',
    'Do your employees receive regular training on how to spot phishing emails and online scams?',
    2.0,
    2.0,
    'NIST CSF',
    'PR.AT-01',
    'Personnel are trained and tested on their cybersecurity responsibilities and are aware of the organization''s security policies. Human error is a leading cause of security breaches. Regular training on recognizing phishing emails, social engineering, and safe web browsing transforms employees from the weakest link into a strong line of defense.'
  ),
  (
    'q8',
    8,
    'Detect & Respond',
    'Do you have active antivirus or anti-malware software running on every company device?',
    3.0,
    1.0,
    'CIS Controls',
    'CIS Control 10',
    'Prevent or control the installation, spread, and execution of malicious applications, code, or scripts on enterprise assets. Centrally managed anti-malware software must be active, continuously updated, and configured to alert administrators of infections to stop ransomware or spyware before it can execute or exfiltrate data.'
  ),
  (
    'q9',
    9,
    'Detect & Respond',
    'If a laptop is stolen or a system is hacked, do you have a written, step-by-step emergency plan on what to do?',
    3.0,
    3.0,
    'NIST CSF',
    'RS.RP-01',
    'An incident response plan is executed during or after an event. Organizations must have a documented and tested playbook detailing who to contact, how to contain a breach, and how to preserve evidence. Without a clear plan, response times drag out, causing increased data loss, operational downtime, and panic.'
  ),
  (
    'q10',
    10,
    'Recover',
    'Is your most important business data backed up automatically to a separate, offline location at least once a week?',
    3.0,
    3.0,
    'NIST CSF',
    'RC.RP-01',
    'Recovery processes and procedures are maintained and tested to ensure timely restoration of systems and assets affected by cybersecurity events. Backups must be automated, encrypted, and physically or logically isolated (offline/immutable) from the primary network to ensure they cannot be corrupted or encrypted by ransomware.'
  )
on conflict (id) do update
set
  display_order = excluded.display_order,
  category = excluded.category,
  plain_text_question = excluded.plain_text_question,
  risk_weight = excluded.risk_weight,
  effort_level = excluded.effort_level,
  framework_name = excluded.framework_name,
  framework_reference = excluded.framework_reference,
  framework_excerpt = excluded.framework_excerpt;

comment on table public.questions is 'Cybersecurity assessment questions with scoring metadata and framework excerpts for retrieval.';
comment on table public.assessments is 'Saved assessment results and AI-generated recommendations for authenticated users.';
