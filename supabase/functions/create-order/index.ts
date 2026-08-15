import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IncomingItem {
  productId: string;
  name?: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

/**
 * Creates an order with server-computed pricing.
 *
 * The browser only says WHAT is being bought and WHERE it goes — never how
 * much it costs. Prices come from `products` and the delivery fee from
 * `shipping_methods`, both read here with the service role. This is what stops
 * a tampered cart from being charged a total the customer chose, since
 * verify-paystack compares Paystack's amount against the stored total.
 */
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

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));

    const rawItems: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return json({ error: "Your cart is empty." }, 400);
    if (rawItems.length > 100) return json({ error: "Too many items." }, 400);

    const customer = body.customer ?? {};
    const email = typeof customer.email === "string" ? customer.email.trim() : "";
    const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
    if (!email || !phone) {
      return json({ error: "Email and phone number are required." }, 400);
    }

    // Normalise quantities before they touch any arithmetic.
    const items = rawItems.map((item) => ({
      productId: String(item.productId ?? ""),
      size: item.size ?? null,
      color: item.color ?? null,
      quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 0))),
    }));
    if (items.some((i) => !i.productId)) {
      return json({ error: "Cart contains an unknown product." }, 400);
    }

    const { data: products, error: productError } = await admin
      .from("products")
      .select("id,name,price,discount_price,image_url")
      .in("id", items.map((i) => i.productId));

    if (productError) throw productError;

    const byId = new Map((products ?? []).map((p: any) => [String(p.id), p]));
    if (byId.size !== new Set(items.map((i) => i.productId)).size) {
      return json({ error: "Cart contains a product that is no longer available." }, 400);
    }

    // Same rule the storefront shows: the discount price only counts when it
    // is actually lower than the list price.
    const lineItems = items.map((item) => {
      const product = byId.get(item.productId);
      const listPrice = Number(product.price) || 0;
      const discount = product.discount_price == null ? null : Number(product.discount_price);
      const unitPrice = discount != null && discount < listPrice ? discount : listPrice;
      return {
        productId: item.productId,
        name: product.name,
        price: unitPrice,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        imageUrl: product.image_url ?? null,
      };
    });

    const subtotal = lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Delivery fee comes from the stored area, never from the request.
    let deliveryFee = 0;
    let areaName: string | null = null;
    let isInternational = false;

    const areaId = typeof body.delivery?.area_id === "string" ? body.delivery.area_id : "";
    if (areaId) {
      const { data: area, error: areaError } = await admin
        .from("shipping_methods")
        .select("id,name,price,enabled,is_international")
        .eq("id", areaId)
        .maybeSingle();

      if (areaError) throw areaError;
      if (area?.enabled) {
        areaName = area.name;
        isInternational = area.is_international === true;
        // International delivery is quoted by email after payment.
        deliveryFee = isInternational ? 0 : Number(area.price) || 0;
      }
    }

    const total = subtotal + deliveryFee;
    if (!(total > 0)) return json({ error: "Order total must be greater than zero." }, 400);

    // Trust the caller's JWT for identity, never a user_id in the body.
    let userId: string | null = null;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data: userData } = await admin.auth.getUser(token);
      userId = userData?.user?.id ?? null;
    }

    const orderId = crypto.randomUUID();
    const { error: insertError } = await admin.from("orders").insert({
      id: orderId,
      customer_name: typeof customer.name === "string" ? customer.name : "",
      customer_email: email,
      customer_phone: phone,
      address: typeof customer.address === "string" ? customer.address : "",
      city: typeof customer.city === "string" ? customer.city : "",
      user_id: userId,
      line_items: lineItems,
      total,
      delivery_area:
        typeof body.delivery?.label === "string" && body.delivery.label
          ? body.delivery.label
          : areaName,
      delivery_fee: deliveryFee,
      status: "payment_pending",
      payment_provider: "paystack",
      payment_status: "unpaid",
      items: lineItems.reduce((sum, i) => sum + i.quantity, 0),
    });

    if (insertError) throw insertError;

    return json({ order_id: orderId, total, subtotal, delivery_fee: deliveryFee });
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
