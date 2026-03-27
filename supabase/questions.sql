create table if not exists questions(
    id text primary key,
    category text not null,
    plain_text_question text not null,
    risk_weight numeric not null,
    effort_level numeric not null
);

insert into questions (id, category, plain_text_question, risk_weight, effort_level) values
    ('q1', 'Identify', 'Do you have an accurate, up-to-date list of all computers, servers, and devices used by your organization?', 2.0, 2.0),
    ('q2', 'Identify', 'Are former employees and volunteers locked out of all digital accounts on the exact day they leave?', 3.0, 1.0),
    ('q3', 'Protect', 'Do you require two-step verification (MFA) to log into critical systems like email and banking?', 3.0, 1.0),
    ('q4', 'Protect', 'Are your computers and servers set to automatically install software and security updates?', 3.0, 1.0),
    ('q5', 'Protect', 'Do you restrict access to sensitive data only to the specific people who absolutely need it?', 2.0, 1.0),
    ('q6', 'Protect', 'Do you require the use of a secure password manager or unique, complex passwords for all company accounts?', 3.0, 2.0),
    ('q7', 'Protect', 'Do your employees receive regular training on how to spot phishing emails and online scams?', 2.0, 2.0),
    ('q8', 'Detect & Respond', 'Do you have active antivirus or anti-malware software running on every company device?', 3.0, 1.0),
    ('q9', 'Detect & Respond', 'If a laptop is stolen or a system is hacked, do you have a written, step-by-step emergency plan on what to do?', 3.0, 3.0),
    ('q10', 'Recover', 'Is your most important business data backed up automatically to a separate, offline location at least once a week?', 3.0, 3.0);

create table if not exists assessments(
    id uuid primary key defauilt gen_random_uuid(),
    user+id uuid references autho.users(id), -- if we need login
    total_score numeric,
    high_priority_flags integer, --count 3.0 priority items missed
    raw_responses jsonb not null, --store raw frontend submission
    created_at timestamptz default now()
);