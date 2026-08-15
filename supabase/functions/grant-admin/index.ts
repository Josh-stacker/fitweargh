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
      return json({ error: "Only admins can grant admin access." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email) {
      return json({ error: "Email is required." }, 400);
    }

    let profile = await admin.from("profiles").select("*").eq("email", email).maybeSingle();
    if (profile.error) throw profile.error;

    let userId: string;
    let fullName: string;

    if (profile.data) {
      userId = profile.data.id;
      fullName = profile.data.full_name ?? "";
    } else {
      if (!password || password.length < 6) {
        return json({ error: "Password must be at least 6 characters." }, 400);
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !created.user) {
        return json({ error: createError?.message ?? "Could not create user account." }, 500);
      }

      userId = created.user.id;
      fullName = "";

      const { error: insertProfileError } = await admin.from("profiles").insert({
        id: userId,
        full_name: fullName,
        email,
        phone: "",
      });

      if (insertProfileError && insertProfileError.code !== "23505") {
        throw insertProfileError;
      }
    }

    const { error: insertAdminError } = await admin.from("admin_users").insert({
      user_id: userId,
      email,
      name: fullName,
    });

    if (insertAdminError) {
      if (insertAdminError.code === "23505") {
        return json({ error: "User is already an admin." }, 409);
      }
      throw insertAdminError;
    }

    return json({ uid: userId, email, name: fullName });
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
