import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRow {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  address: string | null;
  city: string | null;
  total: number | string | null;
  delivery_area?: string | null;
  delivery_fee?: number | string | null;
  status: string | null;
  line_items: unknown[];
  items: number | null;
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

    const { order_id, reference } = await req.json().catch(() => ({}));
    if (!order_id || !reference) {
      return json({ error: "order_id and reference are required." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error } = await supabase
      .from("orders")
      .select("id,customer_name,customer_email,customer_phone,address,city,total,delivery_area,delivery_fee,status,line_items,items,payment_status")
      .eq("id", order_id)
      .eq("payment_reference", reference)
      .maybeSingle();

    if (error) throw error;
    if (!order) return json({ error: "Order not found for this payment reference." }, 404);

    const row = order as OrderRow;
    const wasAlreadyPaid = row.payment_status === "paid";
    if (wasAlreadyPaid) {
      return json({ paid: true, was_already_paid: true, order: row });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecretKey}` },
    });
    const payload = await response.json().catch(async () => ({ message: await response.text() }));
    if (!response.ok || payload.status !== true) {
      return json({ error: payload.message ?? "Could not verify Paystack transaction." }, 502);
    }

    const transaction = payload.data;
    const expectedAmount = Math.round(Number(row.total ?? 0) * 100);
    if (transaction.status !== "success") {
      await supabase
        .from("orders")
        .update({ payment_status: transaction.status ?? "failed" })
        .eq("id", row.id);
      return json({ paid: false, status: transaction.status ?? "failed" }, 400);
    }

    if (Number(transaction.amount) !== expectedAmount) {
      await supabase
        .from("orders")
        .update({ payment_status: "amount_mismatch" })
        .eq("id", row.id);
      return json({ error: "Payment amount does not match order total." }, 400);
    }

    const paidAt = transaction.paid_at ?? new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "pending",
        paid_at: paidAt,
      })
      .eq("id", row.id)
      .select("id,customer_name,customer_email,customer_phone,address,city,total,delivery_area,delivery_fee,status,line_items,items,payment_status")
      .single();

    if (updateError) throw updateError;

    return json({ paid: true, was_already_paid: false, order: updated });
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
