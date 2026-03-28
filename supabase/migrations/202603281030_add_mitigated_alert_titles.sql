alter table public.assessments
  add column if not exists mitigated_alert_titles text[] not null default '{}'::text[];

comment on column public.assessments.mitigated_alert_titles is 'Saved quick-win mitigations selected by the authenticated user for the latest assessment.';

drop policy if exists "assessments are updatable by owner" on public.assessments;
create policy "assessments are updatable by owner"
  on public.assessments
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
