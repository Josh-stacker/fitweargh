import { createClient } from "@supabase/supabase-js";

/**
 * Daily ping so the free-tier Supabase project never sits idle long enough
 * to be paused (it pauses after ~7 days without activity). Triggered by the
 * Vercel Cron in `vercel.json`, which sends `Authorization: Bearer
 * ${CRON_SECRET}` automatically when CRON_SECRET is set in the project env.
 *
 * Runs a real (cheap) query against a publicly readable table rather than
 * just hitting the REST root, so it registers as database activity.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return Response.json(
      { ok: false, error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await client
    .from("categories")
    .select("id", { count: "exact", head: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, at: new Date().toISOString() });
}
