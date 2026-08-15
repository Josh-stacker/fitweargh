import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return json({ error: "Only admins can reset admin passwords." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const userId = typeof body.user_id === "string" ? body.user_id : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!userId) {
      return json({ error: "user_id is required." }, 400);
    }
    if (!password || password.length < 6) {
      return json({ error: "Password must be at least 6 characters." }, 400);
    }

    const { data: target, error: targetError } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return json({ error: "That user is not an admin." }, 404);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
    if (updateError) throw updateError;

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
