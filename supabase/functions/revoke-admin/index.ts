import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROTECTED_ADMIN_EMAIL = "nerdosey@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!callerToken) {
      return json({ error: "Missing Authorization header." }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerData, error: callerError } = await admin.auth.getUser(callerToken);
    if (callerError || !callerData.user) {
      return json({ error: "Invalid session." }, 401);
    }

    const { data: callerIsAdmin } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", callerData.user.id)
      .maybeSingle();

    if (!callerIsAdmin) {
      return json({ error: "Only admins can remove admin access." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.user_id === "string" ? body.user_id : "";
    if (!userId) {
      return json({ error: "user_id is required." }, 400);
    }

    if (userId === callerData.user.id) {
      return json({ error: "You cannot remove your own admin access." }, 400);
    }

    const { data: target, error: targetError } = await admin
      .from("admin_users")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    if (targetError) throw targetError;

    if (target?.email === PROTECTED_ADMIN_EMAIL) {
      return json({ error: "This admin account cannot be removed." }, 403);
    }

    const { error: deleteError } = await admin.from("admin_users").delete().eq("user_id", userId);
    if (deleteError) throw deleteError;

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
