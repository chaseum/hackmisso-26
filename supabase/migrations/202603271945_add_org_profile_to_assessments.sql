alter table public.assessments
add column if not exists org_profile jsonb not null
default '{"name":"","type":"Nonprofit","size":"1-10"}'::jsonb;

comment on column public.assessments.org_profile is 'Organization profile captured from the pre-questionnaire and used to tailor AI recommendations.';
