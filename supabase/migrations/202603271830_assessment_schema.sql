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

alter table public.questions
  add column if not exists display_order integer,
  add column if not exists framework_name text,
  add column if not exists framework_reference text,
  add column if not exists framework_excerpt text,
  add column if not exists created_at timestamptz not null default timezone('utc'::text, now());

update public.questions
set
  display_order = case id
    when 'q1' then 1
    when 'q2' then 2
    when 'q3' then 3
    when 'q4' then 4
    when 'q5' then 5
    when 'q6' then 6
    when 'q7' then 7
    when 'q8' then 8
    when 'q9' then 9
    when 'q10' then 10
    else display_order
  end,
  framework_name = case id
    when 'q1' then 'CIS Controls'
    when 'q2' then 'ISO 27001'
    when 'q3' then 'CIS Controls'
    when 'q4' then 'CIS Controls'
    when 'q5' then 'NIST CSF'
    when 'q6' then 'CIS Controls'
    when 'q7' then 'NIST CSF'
    when 'q8' then 'CIS Controls'
    when 'q9' then 'NIST CSF'
    when 'q10' then 'NIST CSF'
    else framework_name
  end,
  framework_reference = case id
    when 'q1' then 'CIS Control 1'
    when 'q2' then 'ISO/IEC 27001 A.5.18'
    when 'q3' then 'CIS Control 6'
    when 'q4' then 'CIS Control 7'
    when 'q5' then 'PR.AA-01'
    when 'q6' then 'CIS Control 5'
    when 'q7' then 'PR.AT-01'
    when 'q8' then 'CIS Control 10'
    when 'q9' then 'RS.RP-01'
    when 'q10' then 'RC.RP-01'
    else framework_reference
  end,
  framework_excerpt = case id
    when 'q1' then 'Maintain an accurate, detailed inventory of enterprise assets so only authorized devices can access systems and untracked devices can be investigated quickly.'
    when 'q2' then 'Access rights should be provisioned, reviewed, and revoked promptly so former personnel cannot retain access to email, SaaS tools, or sensitive business data.'
    when 'q3' then 'Require phishing-resistant or, at minimum, multi-factor authentication for administrative and business-critical systems to reduce account takeover risk.'
    when 'q4' then 'Establish and enforce a vulnerability management process that applies security patches quickly, especially for internet-facing systems and common business software.'
    when 'q5' then 'Define and enforce least-privilege access so sensitive records, shared drives, and financial tools are available only to approved personnel with a business need.'
    when 'q6' then 'Use centralized credential management and strong unique passwords for workforce accounts to reduce credential reuse and improve recovery when accounts are exposed.'
    when 'q7' then 'Provide recurring security awareness training so personnel can identify phishing, business email compromise, and unsafe sharing behavior before incidents escalate.'
    when 'q8' then 'Deploy and maintain anti-malware protections with current signatures and monitoring across endpoints so commodity threats are blocked before spreading.'
    when 'q9' then 'Document response roles, communications, containment steps, and escalation paths so the team can act immediately during a security incident instead of improvising.'
    when 'q10' then 'Maintain protected backups and recovery procedures for critical business data so ransomware, accidental deletion, or infrastructure failure does not become existential.'
    else framework_excerpt
  end
where id in ('q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10');

alter table public.questions
  alter column display_order set not null,
  alter column framework_name set not null,
  alter column framework_reference set not null,
  alter column framework_excerpt set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'questions_display_order_key'
      and conrelid = 'public.questions'::regclass
  ) then
    alter table public.questions add constraint questions_display_order_key unique (display_order);
  end if;
end $$;

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_score numeric not null check (total_score >= 0),
  score_percent numeric not null check (score_percent >= 0 and score_percent <= 100),
  high_priority_flags integer not null default 0 check (high_priority_flags >= 0),
  raw_responses jsonb not null,
  failed_question_ids text[] not null default '{}'::text[],
  ai_recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.assessments
  add column if not exists score_percent numeric,
  add column if not exists failed_question_ids text[] not null default '{}'::text[],
  add column if not exists ai_recommendations jsonb not null default '[]'::jsonb;

update public.assessments
set score_percent = case
  when score_percent is not null then score_percent
  when total_score is null or total_score <= 0 then 0
  else least(100, greatest(0, round((total_score / 28.0) * 100, 2)))
end;

alter table public.assessments
  alter column user_id set not null,
  alter column total_score set not null,
  alter column score_percent set not null,
  alter column high_priority_flags set not null,
  alter column created_at set default timezone('utc'::text, now());

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
    'Maintain an accurate, detailed inventory of enterprise assets so only authorized devices can access systems and untracked devices can be investigated quickly.'
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
    'Access rights should be provisioned, reviewed, and revoked promptly so former personnel cannot retain access to email, SaaS tools, or sensitive business data.'
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
    'Require phishing-resistant or, at minimum, multi-factor authentication for administrative and business-critical systems to reduce account takeover risk.'
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
    'Establish and enforce a vulnerability management process that applies security patches quickly, especially for internet-facing systems and common business software.'
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
    'Define and enforce least-privilege access so sensitive records, shared drives, and financial tools are available only to approved personnel with a business need.'
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
    'Use centralized credential management and strong unique passwords for workforce accounts to reduce credential reuse and improve recovery when accounts are exposed.'
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
    'Provide recurring security awareness training so personnel can identify phishing, business email compromise, and unsafe sharing behavior before incidents escalate.'
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
    'Deploy and maintain anti-malware protections with current signatures and monitoring across endpoints so commodity threats are blocked before spreading.'
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
    'Document response roles, communications, containment steps, and escalation paths so the team can act immediately during a security incident instead of improvising.'
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
    'Maintain protected backups and recovery procedures for critical business data so ransomware, accidental deletion, or infrastructure failure does not become existential.'
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
