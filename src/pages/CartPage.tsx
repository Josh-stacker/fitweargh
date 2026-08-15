import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { GHANA_REGIONS, districtsInRegion } from "../data/ghanaDistricts";
import { quoteDelivery } from "../lib/deliveryPricing";

const COLOR_HEX: Record<string, string> = {
  Black: "#000000", White: "#FFFFFF", Red: "#ef4444", Green: "#00864A",
  "Olive Green": "#808000", "Army Green": "#4B5320",
  Brown: "#533113", Blue: "#3b82f6", Orange: "#f97316", "Pure Orange": "#FFA500", Pink: "#ec4899",
  Navy: "#1e3a5f", Grey: "#6b7280", Yellow: "#eab308", "Curry Yellow": "#D4A017", Purple: "#800080",
  Nude: "#E3BC9A", "Hot Pink": "#FF69B4", "Dark Purple": "#4A0E4E",
  "Sea Blue": "#006994", "Butter Yellow": "#FFF099", Lilac: "#C8A2C8",
  "Mint Green": "#98FF98", Burgundy: "#800020", "Baby Pink": "#F4C2C2",
  "Pigeon Blue": "#7BA0B4", "Burnt Orange": "#CC5500",
  "Turquoise Green": "#00E5C0", Cream: "#FFFDD0",
};
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ShoppingCartIcon,
  ArrowLineUpRightIcon,
  ImageIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  // International-only fields. These are composed into `address` / `city` on
  // submit so international orders need no extra columns on `orders`.
  street: "",
  apartment: "",
  intlTown: "",
  state: "",
  postcode: "",
};

const ADMIN_DELIVERY_EMAIL = "fitweargh1@gmail.com";

// Sentinel values for the region/town selects — kept distinct from real
// region names so they can never collide with the GADM data.
const OTHER_REGION = "__other__";
const OTHER_DISTRICT = "__other__";
const INTERNATIONAL_REGION = "__international__";

const WHATSAPP_NUMBER = "233559506998";
const WHATSAPP_DISPLAY = "+233 55 950 6998";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi FitwearGH, I have a question about my order.",
)}`;

type FormData = typeof EMPTY_FORM;

const GUEST_BILLING_KEY = "fitweargh_guest_billing";

function loadGuestBilling(): Partial<FormData> {
  try {
    const raw = localStorage.getItem(GUEST_BILLING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGuestBilling(form: FormData) {
  try {
    localStorage.setItem(GUEST_BILLING_KEY, JSON.stringify({
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
    }));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  is_international?: boolean;
}

// Free, keyless endpoints. Both are best-effort: if either fails the checkout
// still works, it just falls back to Ghana/GHS-only behaviour.
const GEO_URL = "https://ipwho.is/";
const FX_URL = "https://open.er-api.com/v6/latest/GHS";

async function detectOutsideGhana(): Promise<boolean> {
  const res = await fetch(GEO_URL);
  if (!res.ok) throw new Error("geo lookup failed");
  const data = await res.json();
  if (data?.success === false || !data?.country_code) throw new Error("geo lookup unusable");
  return data.country_code !== "GH";
}

async function fetchUsdPerCedi(): Promise<number> {
  const res = await fetch(FX_URL);
  if (!res.ok) throw new Error("fx lookup failed");
  const data = await res.json();
  const rate = Number(data?.rates?.USD);
  if (!rate || !isFinite(rate) || rate <= 0) throw new Error("fx rate unusable");
  return rate;
}

export default function CartPage() {
  const { items, count, total, removeItem, updateQty } = useCart();
  const { user } = useAuth();

  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    ...loadGuestBilling(),
    name: user?.displayName ?? loadGuestBilling().name ?? "",
    email: user?.email ?? loadGuestBilling().email ?? "",
  });
  const [placing, setPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [usdPerCedi, setUsdPerCedi] = useState<number | null>(null);
  const initializingPaymentRef = useRef(false);
  const geoAppliedRef = useRef(false);

  // Customer's location choice drives the price: region → town, or a typed
  // town we try to recognise. See lib/deliveryPricing.
  const [deliveryRegion, setDeliveryRegion] = useState("");
  const [deliveryDistrict, setDeliveryDistrict] = useState("");
  const [typedTown, setTypedTown] = useState("");

  const internationalArea = shippingMethods.find((m) => m.is_international) ?? null;
  const isInternational = deliveryRegion === INTERNATIONAL_REGION;
  const needsTypedTown =
    !isInternational && (deliveryRegion === OTHER_REGION || deliveryDistrict === OTHER_DISTRICT);

  const quote = isInternational
    ? null
    : quoteDelivery(shippingMethods, {
        region: deliveryRegion === OTHER_REGION ? null : deliveryRegion,
        district: deliveryDistrict === OTHER_DISTRICT ? null : deliveryDistrict,
        typedTown: needsTypedTown ? typedTown : null,
      });

  // A location is chosen once we have a recognised district, or the customer
  // has told us where they are in their own words.
  const hasDeliveryChoice =
    isInternational ||
    (needsTypedTown ? typedTown.trim().length > 0 : Boolean(deliveryRegion && deliveryDistrict));

  const deliveryAreaLabel = isInternational
    ? internationalArea?.name ?? "Outside Ghana"
    : needsTypedTown
    ? typedTown.trim()
    : [deliveryDistrict, deliveryRegion].filter(Boolean).join(", ");

  useEffect(() => {
    if (!user) return;
    const loadSavedBilling = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,phone,address,city")
        .eq("id", user.uid)
        .single();
      if (data) {
        setForm((f) => ({
          ...f,
          name: f.name || data.full_name || "",
          phone: f.phone || data.phone || "",
          address: f.address || data.address || "",
          city: f.city || data.city || "",
        }));
      }
    };
    loadSavedBilling();
  }, [user]);

  useEffect(() => {
    supabase.from("shipping_methods").select("*").eq("enabled", true).then(({ data }) => {
      if (data) {
        const methods = data as ShippingMethod[];
        methods.sort((a, b) => a.price - b.price);
        setShippingMethods(methods);
      }
    });
  }, []);

  // Best-effort IP geolocation: pre-selects the international delivery option
  // for visitors outside Ghana. Only ever a hint — the customer can change the
  // delivery area, and any failure leaves the normal Ghana flow untouched.
  useEffect(() => {
    if (geoAppliedRef.current || shippingMethods.length === 0) return;
    const international = shippingMethods.find((m) => m.is_international);
    if (!international) return;

    let cancelled = false;
    detectOutsideGhana()
      .then((outside) => {
        if (cancelled || !outside) return;
        geoAppliedRef.current = true;
        // Only a hint: never overwrite a region the customer already chose.
        setDeliveryRegion((current) => current || INTERNATIONAL_REGION);
      })
      .catch(() => { /* stay on the default Ghana flow */ });

    return () => { cancelled = true; };
  }, [shippingMethods]);

  // USD is display-only — Paystack always charges in GHS.
  useEffect(() => {
    if (!isInternational || usdPerCedi !== null) return;
    let cancelled = false;
    fetchUsdPerCedi()
      .then((rate) => { if (!cancelled) setUsdPerCedi(rate); })
      .catch(() => { /* hide the USD estimate rather than block checkout */ });
    return () => { cancelled = true; };
  }, [isInternational, usdPerCedi]);

  // International orders pay for the goods only — delivery is quoted by email
  // after payment, so no delivery fee is charged at checkout.
  const deliveryFee = isInternational ? 0 : (quote?.fee ?? 0);
  const grandTotal = total + deliveryFee;
  const fmt = (n: number) =>
    `gh₵ ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtUsd = (n: number) =>
    usdPerCedi === null
      ? null
      : `$${(n * usdPerCedi).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initializingPaymentRef.current || placing) return;
    if (items.length === 0) {
      setPaymentError("Your cart is empty.");
      return;
    }
    if (!hasDeliveryChoice) {
      setPaymentError("Tell us where you want the order delivered to continue.");
      return;
    }

    initializingPaymentRef.current = true;
    setPlacing(true);
    setPaymentError("");
    try {
      // No extra columns: fold the structured international address into the
      // same `address` / `city` fields the admin and order emails already read.
      const addressLine = isInternational
        ? [form.street, form.apartment].filter(Boolean).join(", ")
        : form.address;
      const cityLine = isInternational
        ? [form.intlTown, form.state, form.postcode].filter(Boolean).join(", ")
        : form.city;

      // Record where the customer said they are AND how that produced a price,
      // so fulfilment can see when a fee was inferred or is still outstanding.
      const deliveryAreaRecord = isInternational
        ? internationalArea?.name ?? "Outside Ghana"
        : quote?.mode === "exact"
        ? `${deliveryAreaLabel} (${quote.area.name})`
        : quote?.mode === "nearby"
        ? `${deliveryAreaLabel} — priced via ${quote.viaDistrict}, ~${quote.km}km (${quote.area.name})`
        : `${deliveryAreaLabel} — delivery price to be confirmed`;

      const { data: ref, error } = await supabase.from("orders").insert({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        address: addressLine,
        city: cityLine,
        user_id: user?.uid ?? null,
        line_items: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
        total: grandTotal,
        delivery_area: deliveryAreaRecord,
        delivery_fee: deliveryFee,
        status: "payment_pending",
        payment_provider: "paystack",
        payment_status: "unpaid",
        items: count,
      }).select("id").single();
      
      if (error) throw error;

      const orderId = ref.id;

      if (user) {
        await supabase.from("profiles").update({
          full_name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
        }).eq("id", user.uid);
      } else {
        saveGuestBilling(form);
      }

      const callbackUrl = `${window.location.origin}/order/processing?order_id=${orderId}`;
      const { data: payment, error: paymentError } = await supabase.functions.invoke("initialize-paystack", {
        body: { order_id: orderId, callback_url: callbackUrl },
      });
      if (paymentError) throw paymentError;
      if (!payment?.authorization_url) throw new Error("Paystack did not return a checkout URL.");

      window.location.href = payment.authorization_url;
    } catch (err) {
      console.error("Order error:", err);
      const msg = err instanceof Error ? err.message : "";
      setPaymentError(
        msg && !msg.toLowerCase().includes("edge function") && !msg.toLowerCase().includes("non-2xx")
          ? msg
          : "We could not start your payment. Please try again or contact us if the problem persists."
      );
      initializingPaymentRef.current = false;
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF6]">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 md:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 raleway-regular text-lg text-[#533113]/60 mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-[#533113] transition-colors">
            <ArrowLeftIcon size={14} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#533113]">
            {step === "cart" ? "Cart" : "Checkout"}
          </span>
        </div>

        <h1 className="raleway-bold text-3xl md:text-4xl text-[#533113] mb-8">
          {step === "cart" ? `Your Cart (${count})` : "Checkout"}
        </h1>

        {items.length === 0 && step === "cart" ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <ShoppingCartIcon size={56} className="text-[#533113]/20" />
            <p className="raleway-regular text-[#533113]/50">Your cart is empty.</p>
            <Link
              to="/new-arrivals"
              className="flex items-center gap-2 bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest px-6 py-3 hover:bg-[#3d2409] transition-colors"
            >
              Shop Now <ArrowLineUpRightIcon size={16} />
            </Link>
          </div>
        ) : step === "cart" ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Items */}
            <div className="flex-1 flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={`${item.id}_${item.size}_${item.color}`}
                  className="bg-white border border-[#DEDEDE] flex gap-4 p-4 md:p-5"
                >
                  <div className="w-24 h-28 md:w-28 md:h-32 shrink-0 bg-[#F5EDE0] overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={24} className="text-[#533113]/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <p className="raleway-bold text-lg md:text-xl text-[#533113] leading-snug">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-3 raleway-regular text-base md:text-lg text-[#533113]/60">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && (
                        <span className="flex items-center gap-1">
                          Color:
                          <span
                            style={{ backgroundColor: COLOR_HEX[item.color] ?? item.color }}
                            className="w-3 h-3 rounded-full border border-[#DEDEDE] inline-block"
                          />
                          {item.color}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-stretch border border-[#533113]">
                        <button
                          onClick={() => updateQty(item.id, item.size, item.color, item.quantity - 1)}
                          className="px-3 py-2 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        >
                          <MinusIcon size={15} />
                        </button>
                        <span className="raleway-bold text-base w-10 flex items-center justify-center text-[#533113] border-l border-r border-[#533113]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.size, item.color, item.quantity + 1)}
                          className="px-3 py-2 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        >
                          <PlusIcon size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 min-w-[120px] flex flex-col items-end gap-3">
                    <p className="raleway-bold text-lg md:text-xl text-[#533113] text-right">
                      {fmt(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id, item.size, item.color)}
                      className="flex items-center justify-center gap-2 border border-red-200 text-red-600 raleway-bold text-xs md:text-sm uppercase tracking-widest px-4 py-2.5 hover:bg-red-50 transition-colors"
                    >
                      <TrashIcon size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-4 sticky top-4">
                <h2 className="raleway-bold text-base text-[#533113] uppercase tracking-widest">
                  Order Summary
                </h2>
                <div className="flex flex-col gap-2 raleway-regular text-lg text-[#533113]">
                  <div className="flex justify-between">
                    <span>Subtotal ({count} items)</span>
                    <span>{fmt(total)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>Select at checkout</span>
                  </div>

                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-xl">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-[#533113] text-white raleway-bold text-base uppercase tracking-widest py-4 px-5 hover:bg-[#3d2409] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Proceed to Checkout
                  <ArrowLineUpRightIcon size={16} className="shrink-0" />
                </button>
                {!user && (
                  <p className="text-center raleway-regular text-sm text-[#533113]/60">
                    No account needed.{" "}
                    <Link
                      to="/account/login?next=/cart"
                      className="underline hover:text-[#533113] transition-colors"
                    >
                      Sign in
                    </Link>{" "}
                    to save your details.
                  </p>
                )}
                <Link
                  to="/new-arrivals"
                  className="text-center raleway-regular text-base text-[#533113]/60 hover:text-[#533113] transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Checkout form ── */
          <div className="flex flex-col lg:flex-row gap-8">
            <form onSubmit={handlePlaceOrder} className="flex-1 flex flex-col gap-5">
              <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-5">
                <h2 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
                  Delivery Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ama Owusu"
                      className="input-base"
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      required
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+233 XX XXX XXXX"
                      className="input-base"
                    />
                  </Field>
                </div>

                <Field label="Email Address">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="ama@example.com"
                    className="input-base"
                  />
                </Field>

                <Field label="Region">
                  <select
                    required
                    value={deliveryRegion}
                    onChange={(e) => {
                      setDeliveryRegion(e.target.value);
                      setDeliveryDistrict("");
                      setTypedTown("");
                      setPaymentError("");
                    }}
                    className="input-base"
                  >
                    <option value="">Select region</option>
                    {GHANA_REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                    <option value={OTHER_REGION}>Other / not listed</option>
                    {internationalArea && (
                      <option value={INTERNATIONAL_REGION}>Outside Ghana</option>
                    )}
                  </select>
                  {!shippingMethods.length && (
                    <p className="raleway-regular text-sm text-red-500">No delivery areas are available yet.</p>
                  )}
                </Field>

                {deliveryRegion && !isInternational && deliveryRegion !== OTHER_REGION && (
                  <Field label="Town / District">
                    <select
                      required
                      value={deliveryDistrict}
                      onChange={(e) => {
                        setDeliveryDistrict(e.target.value);
                        setTypedTown("");
                        setPaymentError("");
                      }}
                      className="input-base"
                    >
                      <option value="">Select your town</option>
                      {districtsInRegion(deliveryRegion).map((d) => (
                        <option key={d.district} value={d.district}>{d.district}</option>
                      ))}
                      <option value={OTHER_DISTRICT}>Other / not listed</option>
                    </select>
                  </Field>
                )}

                {needsTypedTown && (
                  <Field label="Your Town">
                    <input
                      required
                      value={typedTown}
                      onChange={(e) => { setTypedTown(e.target.value); setPaymentError(""); }}
                      placeholder="Type the name of your town"
                      className="input-base"
                    />
                    <p className="raleway-regular text-sm text-[#533113]/50">
                      We'll match it to the closest area we deliver to. If we can't, we'll contact you
                      with a delivery price.
                    </p>
                  </Field>
                )}

                {!isInternational && hasDeliveryChoice && quote && (
                  <div className="bg-[#FFFBF6] border border-[#DEDEDE] px-4 py-3 flex flex-col gap-1">
                    {quote.mode === "exact" && (
                      <p className="raleway-regular text-sm text-[#533113]/70">
                        Delivery to {deliveryAreaLabel}: <span className="raleway-bold">{fmt(quote.fee)}</span>
                      </p>
                    )}
                    {quote.mode === "nearby" && (
                      <p className="raleway-regular text-sm text-[#533113]/70">
                        Closest area we cover is {quote.viaDistrict} (about {quote.km}km away). Delivery:{" "}
                        <span className="raleway-bold">{fmt(quote.fee)}</span>
                      </p>
                    )}
                    {quote.mode === "contact" && (
                      <p className="raleway-regular text-sm text-[#533113]/70">
                        We don't have a set delivery price for {deliveryAreaLabel || "your area"} yet. Pay for
                        your items now and we'll contact you with a delivery price — or ask us on WhatsApp
                        before paying.
                      </p>
                    )}
                    <p className="raleway-regular text-sm text-[#533113]/50">
                      Same day delivery within Greater Accra. Next day delivery outside Greater Accra.
                    </p>
                  </div>
                )}

                {isInternational ? (
                  <>
                    <Field label="Street Name">
                      <input
                        required
                        value={form.street}
                        onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                        placeholder="123 Example Street"
                        className="input-base"
                      />
                    </Field>

                    <Field label="Apartment / Unit (optional)">
                      <input
                        value={form.apartment}
                        onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
                        placeholder="Apt 4B"
                        className="input-base"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Field label="Town">
                        <input
                          required
                          value={form.intlTown}
                          onChange={(e) => setForm((f) => ({ ...f, intlTown: e.target.value }))}
                          placeholder="Brooklyn"
                          className="input-base"
                        />
                      </Field>
                      <Field label="State">
                        <input
                          required
                          value={form.state}
                          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                          placeholder="New York"
                          className="input-base"
                        />
                      </Field>
                      <Field label="Postcode">
                        <input
                          required
                          value={form.postcode}
                          onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                          placeholder="11201"
                          className="input-base"
                        />
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Delivery Address">
                      <input
                        required
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="House no. / Street name"
                        className="input-base"
                      />
                    </Field>

                    <Field label="Town & Region">
                      <input
                        required
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        placeholder="Osu, Greater Accra"
                        className="input-base"
                      />
                    </Field>
                  </>
                )}

                <Field label="Order Notes (optional)">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    placeholder="Any special instructions for delivery…"
                    className="input-base resize-none"
                  />
                </Field>
              </div>

              <div className="bg-white border border-[#DEDEDE] p-6">
                <h2 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest mb-3">
                  Payment
                </h2>
                <div className="flex flex-col gap-2">
                  <p className="raleway-regular text-base text-[#533113]/70">
                    Pay securely with mobile money or Visa card via Paystack.
                  </p>
                  <p className="raleway-regular text-sm text-[#533113]/50">
                    You will be redirected to Paystack, then returned here once payment is complete.
                  </p>
                  {isInternational && (
                    <div className="bg-[#FFFBF6] border border-[#DEDEDE] px-4 py-3 mt-2 flex flex-col gap-1">
                      <p className="raleway-bold text-sm text-[#533113]">International orders</p>
                      <p className="raleway-regular text-sm text-[#533113]/70">
                        You are paying for the items only. Once payment is confirmed, email{" "}
                        <a href={`mailto:${ADMIN_DELIVERY_EMAIL}`} className="underline">
                          {ADMIN_DELIVERY_EMAIL}
                        </a>{" "}
                        with your order number to arrange delivery and get a shipping quote.
                      </p>
                      <p className="raleway-regular text-sm text-[#533113]/50">
                        Payment is charged in Ghana cedis. Any dollar amount shown is an estimate.
                      </p>
                    </div>
                  )}
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-[#533113] text-[#533113] raleway-bold text-sm uppercase tracking-widest px-5 py-3 mt-2 hover:bg-[#533113]/5 transition-colors"
                  >
                    <WhatsappLogoIcon size={18} className="shrink-0" />
                    Ask a question on WhatsApp
                  </a>
                  <p className="raleway-regular text-sm text-[#533113]/50 text-center">
                    {WHATSAPP_DISPLAY}
                  </p>

                  {paymentError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 raleway-regular text-sm px-4 py-3 mt-2">
                      {paymentError}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="raleway-regular text-base text-[#533113] px-5 py-3 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={placing || !hasDeliveryChoice || shippingMethods.length === 0}
                  className="flex-1 bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3 hover:bg-[#3d2409] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Starting Payment…
                    </span>
                  ) : (
                    <>Pay Securely <ArrowLineUpRightIcon size={16} /></>
                  )}
                </button>
              </div>
            </form>

            {/* Mini order summary */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-4 sticky top-4">
                <h2 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
                  Your Order
                </h2>
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.id}_${item.size}_${item.color}`}
                      className="flex items-center gap-3"
                    >
                      <div className="w-12 h-14 shrink-0 bg-[#F5EDE0] overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={14} className="text-[#533113]/20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="raleway-bold text-xs text-[#533113] truncate">{item.name}</p>
                        <p className="raleway-regular text-sm text-[#533113]/60">
                          {item.size && `${item.size} · `}×{item.quantity}
                        </p>
                      </div>
                      <p className="raleway-bold text-xs text-[#533113] shrink-0">
                        {fmt(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <hr className="border-[#DEDEDE]" />
                <div className="flex flex-col gap-2 raleway-regular text-base text-[#533113]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Delivery{deliveryAreaLabel ? ` (${deliveryAreaLabel})` : ""}</span>
                    <span className="shrink-0 text-right">
                      {!hasDeliveryChoice
                        ? "Select area"
                        : isInternational || quote?.mode === "contact"
                        ? "Quoted after payment"
                        : fmt(deliveryFee)}
                    </span>
                  </div>
                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-base">
                    <span>Total</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>
                  {isInternational && fmtUsd(grandTotal) && (
                    <div className="flex justify-between raleway-regular text-sm text-[#533113]/60">
                      <span>Approx. in USD</span>
                      <span>{fmtUsd(grandTotal)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
