import { supabase } from "../supabase";

const PRIMARY_ADMIN_EMAIL = "fitweargh1@gmail.com";

export async function getOrderAdminEmails() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "order_notifications")
    .maybeSingle();

  const extra: string[] = [];
  if (!error) {
    const value = data?.value as { emails?: string[] } | null;
    extra.push(
      ...(value?.emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean)
    );
  }

  return Array.from(new Set([PRIMARY_ADMIN_EMAIL, ...extra]));
}

export async function syncOrderAdminEmails(emails: string[]) {
  const cleanEmails = Array.from(
    new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)),
  );

  const { error } = await supabase.from("site_settings").upsert({
    key: "order_notifications",
    value: { emails: cleanEmails },
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}
