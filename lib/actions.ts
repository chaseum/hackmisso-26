"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createServerClient, hasSupabaseServiceRoleEnv } from "@/lib/supabase";

type ActionState = { error: string; success: string };

async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return { supabase, userId: user.id, email: user.email ?? "" };
}

export async function authenticateWithPassword(mode: "sign-in" | "sign-up", _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Email and password are required.", success: "" };

  const supabase = await createServerClient();
  if (mode === "sign-up") {
    const fullName = String(formData.get("full_name") || "").trim();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message, success: "" };
    revalidatePath("/", "layout");
    redirect("/prequestionnaire");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes("invalid login credentials")) {
      return { error: "Account not found.", success: "" };
    }
    return { error: error.message, success: "" };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileAction(formData: FormData) {
  const { supabase, userId, email } = await getCurrentUser();
  const full_name = String(formData.get("full_name") || "").trim();
  const team_name = String(formData.get("team_name") || "").trim();
  const org_focus = String(formData.get("org_focus") || "").trim();
  const avatar_url = String(formData.get("avatar_url") || "").trim();
  const { error } = await supabase.from("profiles").upsert({ id: userId, email, full_name, team_name, org_focus, avatar_url });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateAccountProfileAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, userId, email } = await getCurrentUser();
    const full_name = String(formData.get("full_name") || "").trim();
    const team_name = String(formData.get("team_name") || "").trim();
    const org_focus = String(formData.get("org_focus") || "").trim();
    const { error: profileError } = await supabase.from("profiles").upsert({ id: userId, email, full_name, team_name, org_focus });
    if (profileError) return { error: profileError.message, success: "" };

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name,
        team_name,
        org_focus,
      },
    });
    if (authError) return { error: authError.message, success: "" };

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { error: "", success: "Account profile updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update account profile.", success: "" };
  }
}

export async function updateAccountEmailAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await getCurrentUser();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email) return { error: "Email is required.", success: "" };

    const { error } = await supabase.auth.updateUser({ email });
    if (error) return { error: error.message, success: "" };

    revalidatePath("/settings");
    return {
      error: "",
      success: "Email update requested. If confirmation is enabled, check your inbox to complete the change.",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update email.", success: "" };
  }
}

export async function updateAccountPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await getCurrentUser();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");
    if (!password) return { error: "New password is required.", success: "" };
    if (password.length < 8) return { error: "Password must be at least 8 characters.", success: "" };
    if (password !== confirmPassword) return { error: "Passwords do not match.", success: "" };

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message, success: "" };

    revalidatePath("/settings");
    return { error: "", success: "Password updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to update password.", success: "" };
  }
}

export async function deleteAccountAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!hasSupabaseServiceRoleEnv()) {
      return {
        error: "Account deletion is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY on the server to enable it.",
        success: "",
      };
    }

    const confirmation = String(formData.get("confirmation") || "").trim();
    if (confirmation !== "DELETE") {
      return { error: 'Type "DELETE" to confirm account deletion.', success: "" };
    }

    const { supabase, userId } = await getCurrentUser();
    const admin = createAdminClient();

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId, true);
    if (deleteError) return { error: deleteError.message, success: "" };

    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete account.", success: "" };
  }
}

export async function saveProjectAction(formData: FormData) {
  const { supabase, userId } = await getCurrentUser();
  const title = String(formData.get("title") || "").trim();
  const summary = String(formData.get("summary") || "").trim();
  const industry = String(formData.get("industry") || "").trim();
  const stage = String(formData.get("stage") || "").trim();
  if (!title || !summary) throw new Error("Title and summary are required.");

  const { data: existingProject } = await supabase.from("projects").select("id").eq("owner_id", userId).maybeSingle();
  const payload = { owner_id: userId, title, summary, industry, stage };
  const query = existingProject ? supabase.from("projects").update(payload).eq("id", existingProject.id) : supabase.from("projects").insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function addNoteAction(projectId: string | null, formData: FormData) {
  if (!projectId) throw new Error("Create a project before adding notes.");
  const { supabase, userId } = await getCurrentUser();
  const content = String(formData.get("content") || "").trim();
  if (!content) throw new Error("Note content is required.");
  const { error } = await supabase.from("notes").insert({ project_id: projectId, author_id: userId, content });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
