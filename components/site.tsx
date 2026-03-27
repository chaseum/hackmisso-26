import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { LogOut, PanelTop } from "lucide-react";
import { signOutAction } from "@/lib/actions";
import { Button } from "@/components/client";
import { Card, Container } from "@/components/ui";

export function Navbar({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/75 backdrop-blur-xl">
      <Container className="flex h-18 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm"><PanelTop className="size-5" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Hackathon Starter</p>
            <p className="text-xs text-slate-500">Next.js + Supabase demo kit</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/">Home</Link></Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/dashboard">Dashboard</Link></Button>
              <form action={signOutAction}><Button type="submit" variant="secondary" size="sm"><LogOut className="size-4" />Sign out</Button></form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link href="/sign-in">Sign in</Link></Button>
              <Button asChild size="sm"><Link href="/sign-up">Get started</Link></Button>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <main className="py-8 sm:py-12"><Container>{children}</Container></main>;
}

export function SetupNotice() {
  return (
    <Card className="p-8">
      <h1 className="text-2xl font-semibold text-slate-950 [font-family:var(--font-display)]">Connect Supabase to continue</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your environment, then run the SQL migration in the Supabase dashboard. The landing page works without Supabase, but auth and the dashboard require it.</p>
      <div className="mt-6"><Button asChild><Link href="/sign-up">Go to auth setup</Link></Button></div>
    </Card>
  );
}

export function AuthCard({ title, description, footer, children }: { title: string; description: string; footer?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="glass-panel border-white/50 p-8 sm:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 [font-family:var(--font-display)]">{title}</h1>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-6 border-t border-slate-200/80 pt-5">{footer}</div> : null}
    </Card>
  );
}
