import Link from "next/link";
import { ClipboardList, FilePenLine, FolderKanban, Gauge, LayoutDashboard, NotebookText } from "lucide-react";
import { addNoteAction, saveProjectAction, updateProfileAction } from "@/lib/actions";
import type { createServerClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import type { NoteRow, ProfileRow, ProjectRow } from "@/types/database";
import { SubmitButton } from "@/components/client";
import { Badge, Card, Container, EmptyState, Input, Label, SectionHeader, Textarea } from "@/components/ui";

type DashboardSupabaseClient = Awaited<ReturnType<typeof createServerClient>>;

const storyBlocks = [
  { title: "Executive Summary", body: "Summarize the opportunity in one sentence, then anchor the story with measurable traction or a clear wedge into the market." },
  { title: "Problem / Solution", body: "Define the pain precisely, then explain why your approach wins on speed, cost, usability, or defensibility." },
  { title: "Market Insight", body: "Capture TAM, key trends, customer willingness to pay, and the market shift that makes this moment attractive." },
  { title: "Next Steps", body: "Use this block to frame the next experiment, pilot plan, or ask for judges, mentors, or investors." },
];

const navLinks = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Project", href: "/dashboard#project", icon: ClipboardList },
  { label: "Notes", href: "/dashboard#notes", icon: NotebookText },
];

export async function getDashboardData(supabase: DashboardSupabaseClient, userId: string) {
  const [{ data: profile }, { data: project }, { data: notes }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("projects").select("*").eq("owner_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("notes").select("*").eq("author_id", userId).order("created_at", { ascending: false }),
  ]);

  return {
    profile: (profile as ProfileRow | null) ?? null,
    project: (project as ProjectRow | null) ?? null,
    notes: (notes as NoteRow[] | null) ?? [],
  };
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="py-8 sm:py-10">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Card className="h-fit p-4 lg:sticky lg:top-24">
            <div className="mb-4 px-3 pt-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Demo control room</p>
            </div>
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return <Link key={link.label} href={link.href} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"><Icon className="size-4" />{link.label}</Link>;
              })}
            </nav>
          </Card>
          <div>{children}</div>
        </div>
      </Container>
    </main>
  );
}

export function DashboardIntro({ profile, project }: { profile: ProfileRow | null; project: ProjectRow | null }) {
  return (
    <Card className="overflow-hidden border-white/50 bg-[linear-gradient(135deg,rgba(15,118,110,0.1),rgba(255,255,255,0.9))] p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Badge>Dashboard</Badge>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 [font-family:var(--font-display)] sm:text-4xl">{project?.title ?? "Build your first project narrative"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{project?.summary ?? "Create a project, capture notes, and turn loose ideas into a clean judge-facing story."}</p>
          </div>
        </div>
        <div className="grid gap-3 rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
          <div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Team</p><p className="mt-2 text-lg font-semibold text-slate-900">{profile?.team_name ?? "Set your team name"}</p></div>
          <div><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Stage</p><p className="mt-2 text-sm font-medium text-slate-700">{project?.stage ?? "Discovery"}</p></div>
        </div>
      </div>
    </Card>
  );
}

export function DashboardStats({ notesCount, hasProject }: { notesCount: number; hasProject: boolean }) {
  const stats = [
    { label: "Project status", value: hasProject ? "Active" : "Not started", icon: FolderKanban },
    { label: "Notes captured", value: `${notesCount}`, icon: FilePenLine },
    { label: "Demo readiness", value: hasProject ? "Pitchable" : "Set up", icon: Gauge },
  ];

  return <div className="grid gap-4 md:grid-cols-3">{stats.map((item) => { const Icon = item.icon; return <Card key={item.label} className="p-5"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p></div><div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><Icon className="size-5" /></div></div></Card>; })}</div>;
}

export function ProjectOverviewCard({ project }: { project: ProjectRow | null }) {
  if (!project) return <Card id="project" className="p-6"><EmptyState title="No project yet" description="Create a project profile on the right to unlock notes, activity, and a stronger live-demo story." /></Card>;
  return (
    <Card id="project" className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-sm text-slate-500">My Project</p><h2 className="mt-2 text-2xl font-semibold text-slate-950">{project.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{project.summary}</p></div>
        <div className="flex flex-wrap gap-2"><Badge variant="soft">{project.industry || "General"}</Badge><Badge variant="outline">{project.stage || "Discovery"}</Badge></div>
      </div>
    </Card>
  );
}

export function ProjectSections() {
  return (
    <Card className="p-6">
      <SectionHeader eyebrow="Story blocks" title="Keep the pitch narrative visible while the team builds" description="These placeholders are intentionally simple so the team can align on the message fast." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">{storyBlocks.map((block) => <div key={block.title} className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5"><h3 className="text-base font-semibold text-slate-950">{block.title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{block.body}</p></div>)}</div>
    </Card>
  );
}

export function NotesPanel({ notes, projectId }: { notes: NoteRow[]; projectId: string | null }) {
  const action = addNoteAction.bind(null, projectId);
  return (
    <Card id="notes" className="p-6">
      <SectionHeader eyebrow="Team Notes" title="Capture insights while the team iterates" description="Use notes for quotes, sizing assumptions, risks, and talking points before the final pitch." />
      <form action={action} className="mt-6 space-y-4">
        <Textarea name="content" placeholder={projectId ? "Add a concise note your team can use in the next stand-up..." : "Create a project first to start saving notes."} disabled={!projectId} rows={4} required />
        <SubmitButton disabled={!projectId}>Add note</SubmitButton>
      </form>
      {notes.length === 0 ? <div className="mt-6"><EmptyState title="No notes yet" description="Use this section to capture customer quotes, assumptions, and talking points as the story comes together." /></div> : <div className="mt-6 space-y-3">{notes.map((note) => <div key={note.id} className="rounded-2xl border border-slate-200/80 p-4"><p className="text-sm leading-7 text-slate-700">{note.content}</p><p className="mt-2 text-xs text-slate-400">{formatDateTime(note.created_at)}</p></div>)}</div>}
    </Card>
  );
}

export function ProjectSettingsCard({ profile, project }: { profile: ProfileRow | null; project: ProjectRow | null }) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader eyebrow="Team Profile" title="Keep the workspace identity current" description="These fields personalize the dashboard and make the starter feel ready for a live review." />
        <form action={updateProfileAction} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Jordan Lee" /></div>
          <div className="space-y-2"><Label htmlFor="team_name">Team name</Label><Input id="team_name" name="team_name" defaultValue={profile?.team_name ?? ""} placeholder="Apex Strategy" /></div>
          <div className="space-y-2"><Label htmlFor="avatar_url">Avatar URL</Label><Input id="avatar_url" name="avatar_url" defaultValue={profile?.avatar_url ?? ""} placeholder="https://images.example.com/avatar.png" /></div>
          <SubmitButton>Save profile</SubmitButton>
        </form>
      </Card>
      <Card className="p-6">
        <SectionHeader eyebrow="Project Settings" title={project ? "Edit project" : "Create project"} description="Keep the domain model minimal: one core project, clear summary, and a stage that communicates maturity." />
        <form action={saveProjectAction} className="mt-6 space-y-4">
          <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={project?.title ?? ""} placeholder="Northstar Health" required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="industry">Industry</Label><Input id="industry" name="industry" defaultValue={project?.industry ?? ""} placeholder="Healthcare" /></div><div className="space-y-2"><Label htmlFor="stage">Stage</Label><Input id="stage" name="stage" defaultValue={project?.stage ?? ""} placeholder="Validation" /></div></div>
          <div className="space-y-2"><Label htmlFor="summary">Summary</Label><Textarea id="summary" name="summary" rows={6} defaultValue={project?.summary ?? ""} placeholder="Describe the venture, problem space, and why your solution matters." required /></div>
          <SubmitButton>{project ? "Update project" : "Create project"}</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
