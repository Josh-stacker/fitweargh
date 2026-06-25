import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailQueueRow {
  id: string;
  to_email: string;
  subject: string;
  html: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const mailFrom = Deno.env.get("MAIL_FROM");
    const replyTo = Deno.env.get("MAIL_REPLY_TO");

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !mailFrom) {
      return json(
        { error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, or MAIL_FROM." },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
    if (ids.length === 0) {
      return json({ error: "No mail queue IDs provided." }, 400);
    }

    const query = supabase
      .from("mail_queue")
      .select("id,to_email,subject,html")
      .eq("status", "pending")
      .in("id", ids)
      .order("created_at", { ascending: true })
      .limit(20);

    const { data: rows, error } = await query;
    if (error) throw error;

    const results = [];
    for (const row of (rows ?? []) as MailQueueRow[]) {
      const result = await sendWithResend({
        apiKey: resendApiKey,
        from: mailFrom,
        replyTo,
        to: row.to_email,
        subject: row.subject,
        html: row.html,
      });

      if (result.ok) {
        await supabase
          .from("mail_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", row.id);
      } else {
        await supabase
          .from("mail_queue")
          .update({
            status: "failed",
            error: result.error,
          })
          .eq("id", row.id);
      }

      results.push({ id: row.id, ok: result.ok, error: result.error });
    }

    return json({ sent: results.filter((r) => r.ok).length, results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

async function sendWithResend({
  apiKey,
  from,
  replyTo,
  to,
  subject,
  html,
}: {
  apiKey: string;
  from: string;
  replyTo?: string;
  to: string;
  subject: string;
  html: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (response.ok) {
    return { ok: true as const };
  }

  const text = await response.text();
  return { ok: false as const, error: text };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
