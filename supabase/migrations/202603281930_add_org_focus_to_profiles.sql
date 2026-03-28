alter table public.profiles
add column if not exists org_focus text;

comment on column public.profiles.org_focus is 'Primary operating focus used to tailor organization-facing guidance.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, team_name, org_focus)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'team_name',
    new.raw_user_meta_data ->> 'org_focus'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    team_name = coalesce(excluded.team_name, public.profiles.team_name),
    org_focus = coalesce(excluded.org_focus, public.profiles.org_focus);

  return new;
end;
$$;
