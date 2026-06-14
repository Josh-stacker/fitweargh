import { supabase } from "../supabase";

const FALLBACK_ADMIN_EMAILS = ["nerdosey@gmail.com"];

export async function getOrderAdminEmails() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "order_notifications")
    .maybeSingle();

  if (error) {
    console.error("Could not load order notification emails:", error);
    return FALLBACK_ADMIN_EMAILS;
  }

  const value = data?.value as { emails?: string[] } | null;
  const emails = (value?.emails ?? [])
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return emails.length > 0 ? Array.from(new Set(emails)) : FALLBACK_ADMIN_EMAILS;
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
