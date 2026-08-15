import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { GHANA_REGIONS } from "../data/ghanaDistricts";
import { quoteDelivery, type DeliveryArea } from "../lib/deliveryPricing";

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

const WHATSAPP_NUMBER = "233559506998";
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

// The shape stored in `shipping_methods` — same rows the pricing rules read,
// so reuse that type rather than keeping a second copy in sync.
type ShippingMethod = DeliveryArea;

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

  // The customer ticks "outside Ghana", or picks a region and types their
  // town. Districts are never surfaced — they exist only so
  // lib/deliveryPricing can resolve a price behind the scenes.
  const [outsideGhana, setOutsideGhana] = useState(false);
  const [deliveryRegion, setDeliveryRegion] = useState("");
  const [typedTown, setTypedTown] = useState("");
  // Held true while the customer is still typing, so we don't tell someone
  // their area isn't covered before they've finished writing its name.
  const [searchingTown, setSearchingTown] = useState(false);

  const internationalArea = shippingMethods.find((m) => m.is_international) ?? null;
  const isInternational = outsideGhana && Boolean(internationalArea);

  // Customers choose from the areas the admin actually created, filtered to
  // the region they picked. Typing narrows the list rather than free-texting.
  const areasInRegion = shippingMethods.filter(
    (m) => !m.is_international && m.region === deliveryRegion,
  );
  const townSuggestions = typedTown.trim()
    ? areasInRegion.filter((m) => m.name.toLowerCase().includes(typedTown.trim().toLowerCase()))
    : areasInRegion;

  const chosenArea =
    areasInRegion.find((m) => m.name.toLowerCase() === typedTown.trim().toLowerCase()) ?? null;

  // An area the admin created is priced outright. Anything else falls back to
  // the proximity rules, and finally to "contact us".
  const quote = isInternational
    ? null
    : chosenArea
    ? ({ mode: "exact", area: chosenArea, fee: Number(chosenArea.price) || 0 } as const)
    : quoteDelivery(shippingMethods, {
        region: deliveryRegion,
        district: null,
        typedTown,
      });

  const hasDeliveryChoice =
    isInternational || Boolean(deliveryRegion && typedTown.trim().length > 0);

  const deliveryAreaLabel = isInternational
    ? internationalArea?.name ?? "Outside Ghana"
    : [typedTown.trim(), deliveryRegion].filter(Boolean).join(", ");

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
        // Only a hint: don't override a customer who already picked a region.
        setOutsideGhana((current) => current || !deliveryRegion);
      })
      .catch(() => { /* stay on the default Ghana flow */ });

    return () => { cancelled = true; };
  }, [shippingMethods]);

  // Debounce the "we don't cover this" verdict behind a short search state.
  useEffect(() => {
    if (!typedTown.trim()) {
      setSearchingTown(false);
      return;
    }
    setSearchingTown(true);
    const timer = setTimeout(() => setSearchingTown(false), 600);
    return () => clearTimeout(timer);
  }, [typedTown, deliveryRegion]);

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
  // Delivery is settled with the rider on arrival, so it is never charged
  // through Paystack — the online total is the goods only.
  const grandTotal = total;
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
      // Domestic orders no longer have a separate town field — the town and
      // region come from the delivery selection above.
      const cityLine = isInternational
        ? [form.intlTown, form.state, form.postcode].filter(Boolean).join(", ")
        : [typedTown.trim(), deliveryRegion].filter(Boolean).join(", ");

      // Record where the customer said they are AND how that produced a price,
      // so fulfilment can see when a fee was inferred or is still outstanding.
      const deliveryAreaRecord = isInternational
        ? internationalArea?.name ?? "Outside Ghana"
        : quote?.mode === "exact"
        ? `${deliveryAreaLabel} (${quote.area.name})`
        : quote?.mode === "nearby"
        ? `${deliveryAreaLabel} — priced via ${quote.viaDistrict}, ~${quote.km}km (${quote.area.name})`
        : `${deliveryAreaLabel} — delivery price to be confirmed`;

      // Send only what is being bought and where — the server prices it from
      // `products` and `shipping_methods`, so a tampered cart cannot set its
      // own total.
      const { data: created, error } = await supabase.functions.invoke("create-order", {
        body: {
          items: items.map((i) => ({
            productId: i.id,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            address: addressLine,
            city: cityLine,
          },
          delivery: {
            area_id: isInternational ? internationalArea?.id ?? null : quote?.mode === "contact" ? null : quote?.area.id ?? null,
            label: deliveryAreaRecord,
          },
        },
      });

      if (error) throw error;
      if (created?.error) throw new Error(created.error);
      if (!created?.order_id) throw new Error("Could not create your order. Please try again.");

      const orderId = created.order_id as string;

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
        <div className="flex items-center gap-2 raleway-regular text-base text-[#533113]/60 mb-6">
          <Link to="/" className="flex items-center gap-1 hover:text-[#533113] transition-colors">
            <ArrowLeftIcon size={14} />
            Home
          </Link>
          <span>/</span>
          <span className="text-[#533113]">
            {step === "cart" ? "Cart" : "Checkout"}
          </span>
        </div>

        <h1 className="raleway-bold text-2xl md:text-3xl text-[#533113] mb-8">
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
                    <p className="raleway-bold text-base md:text-lg text-[#533113] leading-snug">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-3 raleway-regular text-sm md:text-base text-[#533113]/60">
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
                    <p className="raleway-bold text-base md:text-lg text-[#533113] text-right">
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
                <h2 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
                  Order Summary
                </h2>
                <div className="flex flex-col gap-2 raleway-regular text-base text-[#533113]">
                  <div className="flex justify-between">
                    <span>Subtotal ({count} items)</span>
                    <span>{fmt(total)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>Select at checkout</span>
                  </div>

                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-lg">
                    <span>Total</span>
                    <span>{fmt(total)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-4 px-5 hover:bg-[#3d2409] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Buy Now
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
                  className="text-center raleway-regular text-sm text-[#533113]/60 hover:text-[#533113] transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ── Checkout form ── */
          <div className="flex flex-col lg:flex-row gap-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="flex-1 flex flex-col gap-5">
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

                {internationalArea && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={outsideGhana}
                      onChange={(e) => {
                        setOutsideGhana(e.target.checked);
                        setPaymentError("");
                      }}
                      className="accent-[#533113]"
                    />
                    <span className="raleway-regular text-base text-[#533113]">
                      I'm ordering from outside Ghana
                    </span>
                  </label>
                )}

                {!isInternational && (
                  <Field label="Region">
                    <select
                      required
                      value={deliveryRegion}
                      onChange={(e) => {
                        setDeliveryRegion(e.target.value);
                        setPaymentError("");
                      }}
                      className="input-base"
                    >
                      <option value="">Select region</option>
                      {GHANA_REGIONS.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                    {!shippingMethods.length && (
                      <p className="raleway-regular text-sm text-red-500">No delivery areas are available yet.</p>
                    )}
                  </Field>
                )}

                {!isInternational && deliveryRegion && (
                  <Field label="Town or Area">
                    <input
                      required
                      list="delivery-town-options"
                      value={typedTown}
                      onChange={(e) => { setTypedTown(e.target.value); setPaymentError(""); }}
                      placeholder="Start typing to find your area"
                      autoComplete="off"
                      className="input-base"
                    />
                    <datalist id="delivery-town-options">
                      {townSuggestions.map((area) => (
                        <option key={area.id} value={area.name} />
                      ))}
                    </datalist>

                    {typedTown.trim().length > 0 && quote && (
                      <div className="bg-[#FFF9E6] border border-[#EBDCA8] px-4 py-3">
                        {searchingTown ? (
                          <p className="raleway-regular text-sm text-[#533113]/70 flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-[#533113]/40 border-t-transparent rounded-full animate-spin shrink-0" />
                            Searching for your area…
                          </p>
                        ) : quote.mode === "exact" ? (
                          <p className="raleway-regular text-sm text-[#533113]/80">
                            Delivery to {typedTown.trim()}:{" "}
                            <span className="raleway-bold">{fmt(quote.fee)}</span> — paid to the
                            delivery rider, not added to your online payment.
                          </p>
                        ) : quote.mode === "nearby" ? (
                          <p className="raleway-regular text-sm text-[#533113]/80">
                            Delivery: <span className="raleway-bold">{fmt(quote.fee)}</span> (nearest
                            area we cover, about {quote.km}km away) — paid to the delivery rider, not
                            added to your online payment.
                          </p>
                        ) : (
                          <p className="raleway-regular text-sm text-[#533113]/80">
                            After completing your order and payment please contact us via WhatsApp or email to
                            confirm your shipping/delivery fee.
                          </p>
                        )}
                      </div>
                    )}
                  </Field>
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
                  <Field label="Delivery Address">
                    <input
                      required
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="House no. / Street name"
                      className="input-base"
                    />
                  </Field>
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
                    className="flex items-center justify-center gap-2 bg-[#25D366] text-white raleway-bold text-sm uppercase tracking-widest px-5 py-3 mt-2 hover:bg-[#1EBE5A] transition-colors"
                  >
                    <WhatsappLogoIcon size={18} weight="fill" className="shrink-0" />
                    Ask a question on WhatsApp
                  </a>

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
              </div>
            </form>

            {/* Mini order summary */}
            <div className="w-full lg:w-[32rem] shrink-0">
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
                        <p className="raleway-bold text-base text-[#533113] leading-snug">{item.name}</p>
                        <p className="raleway-regular text-sm text-[#533113]/60">
                          {item.size && `${item.size} · `}×{item.quantity}
                        </p>
                      </div>
                      <p className="raleway-bold text-base text-[#533113] shrink-0">
                        {fmt(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <hr className="border-[#DEDEDE] shrink-0" />
                <div className="flex flex-col gap-2 raleway-regular text-base text-[#533113]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[#533113]/70">
                    <span>Delivery{deliveryAreaLabel ? ` (${deliveryAreaLabel})` : ""}</span>
                    <span className="shrink-0 text-right">
                      {!hasDeliveryChoice
                        ? "Select area"
                        : isInternational || quote?.mode === "contact"
                        ? "To be confirmed"
                        : fmt(deliveryFee)}
                    </span>
                  </div>
                  <p className="raleway-regular text-sm text-[#533113]/50">
                    Paid directly to the delivery rider — not included in the amount below.
                  </p>
                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-lg">
                    <span>You pay now</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>
                  {isInternational && fmtUsd(grandTotal) && (
                    <div className="flex justify-between raleway-regular text-sm text-[#533113]/60">
                      <span>Approx. in USD</span>
                      <span>{fmtUsd(grandTotal)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={placing || !hasDeliveryChoice || shippingMethods.length === 0}
                  className="w-full bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-4 px-5 hover:bg-[#3d2409] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                      Starting Payment…
                    </>
                  ) : (
                    <>Pay Securely <ArrowLineUpRightIcon size={16} className="shrink-0" /></>
                  )}
                </button>

                <p className="raleway-regular text-sm text-[#533113]/80 bg-[#FFF9E6] border border-[#EBDCA8] px-4 py-3">
                  Same day delivery within Greater Accra. Next day delivery outside Greater Accra.
                </p>
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
