"use client";

import Link from "next/link";
import React, { useActionState } from "react";
import { motion } from "motion/react";
import { useFormStatus } from "react-dom";
import { authenticateWithPassword } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Input, Label } from "@/components/ui";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

const initialState = { error: "", success: "" };

export function Button({ className, variant = "primary", size = "md", asChild = false, children, ...props }: ButtonProps) {
  const classNames = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-60",
    variant === "primary" && "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
    variant === "secondary" && "bg-slate-950 text-white hover:bg-slate-800",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
    size === "sm" && "h-10 px-4 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-base",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return (
      <motion.span whileHover={{ y: -1, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="inline-flex">
        {React.cloneElement(child, { className: cn(classNames, child.props.className) })}
      </motion.span>
    );
  }

  return (
    <motion.span whileHover={{ y: -1, scale: 1.01 }} whileTap={{ scale: 0.99 }} className="inline-flex">
      <button className={classNames} {...props}>{children}</button>
    </motion.span>
  );
}

export function AnimatedGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      className={cn(className)}
    >
      {React.Children.toArray(children).map((child, index) => (
        <motion.div key={index} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.28, ease: "easeOut" }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || disabled}>{pending ? "Saving..." : children}</Button>;
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const action = authenticateWithPassword.bind(null, mode);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-5" action={formAction}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="team@demo.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} placeholder="••••••••" minLength={8} required />
      </div>
      {mode === "sign-up" ? (
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" placeholder="John Doe" required />
        </div>
      ) : null}
      {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>{pending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}</Button>
    </form>
  );
}

export function AuthFooter({ mode }: { mode: "sign-in" | "sign-up" }) {
  return mode === "sign-in" ? (
    <p className="text-sm text-slate-500">New here? <Link className="font-medium text-[var(--accent)]" href="/sign-up">Create an account</Link></p>
  ) : (
    <p className="text-sm text-slate-500">Already have an account? <Link className="font-medium text-[var(--accent)]" href="/">Sign in</Link></p>
  );
}
