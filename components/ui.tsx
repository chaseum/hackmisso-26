import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[2rem] border border-[var(--border)] bg-white/90 shadow-[0_20px_60px_rgba(15,23,32,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: "default" | "soft" | "outline";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" && "bg-slate-950 text-white",
        variant === "soft" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        variant === "outline" && "border border-slate-200 text-slate-700",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className="text-sm font-medium text-slate-800" {...props}>
      {children}
    </label>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent)]">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 [font-family:var(--font-display)]">{title}</h2>
      {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <Inbox className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[2rem] bg-slate-200/70", className)} />;
}

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("overflow-hidden rounded-3xl border border-white/10 bg-white/5", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold text-white transition hover:bg-white/[0.04]",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-slate-400 transition duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-cyan-400" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-sm text-slate-300",
        className,
      )}
      {...props}
    >
      <div className="px-6 pb-5 pt-1">{children}</div>
    </AccordionPrimitive.Content>
  );
}
