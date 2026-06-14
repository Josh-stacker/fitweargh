import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRow {
  id: string;
  customer_email: string | null;
  total: number | string | null;
  payment_status?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!supabaseUrl || !serviceRoleKey || !paystackSecretKey) {
      return json({ error: "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or PAYSTACK_SECRET_KEY." }, 500);
    }

    const { order_id, callback_url } = await req.json().catch(() => ({}));
    if (!order_id || !callback_url) {
      return json({ error: "order_id and callback_url are required." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id,customer_email,total,payment_status")
      .eq("id", order_id)
      .maybeSingle();

    if (error) throw error;
    if (!order) return json({ error: "Order not found." }, 404);

    const row = order as OrderRow;
    const email = row.customer_email;
    const amount = Math.round(Number(row.total ?? 0) * 100);
    if (!email || amount <= 0) {
      return json({ error: "Order needs a valid customer email and total." }, 400);
    }

    const reference = `FWG-${row.id.replace(/-/g, "")}-${Date.now()}`;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount,
        currency: "GHS",
        reference,
        callback_url,
        metadata: JSON.stringify({ order_id: row.id }),
      }),
    });

    const payload = await response.json().catch(async () => ({ message: await response.text() }));
    if (!response.ok || payload.status !== true) {
      return json({ error: payload.message ?? "Could not initialize Paystack transaction." }, 502);
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_provider: "paystack",
        payment_reference: payload.data.reference,
        payment_status: "initialized",
      })
      .eq("id", row.id);

    if (updateError) throw updateError;

    return json({
      authorization_url: payload.data.authorization_url,
      access_code: payload.data.access_code,
      reference: payload.data.reference,
    });
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
