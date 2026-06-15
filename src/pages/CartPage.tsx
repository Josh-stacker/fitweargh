import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { orderConfirmHtml } from "../emails/orderConfirmEmail";
import { orderAdminHtml } from "../emails/orderAdminEmail";
import { queueAndSendMail } from "../lib/mail";
import { getOrderAdminEmails } from "../lib/adminEmails";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const COLOR_HEX: Record<string, string> = {
  Black: "#000000", White: "#FFFFFF", Red: "#ef4444", Green: "#00864A",
  "Olive Green": "#808000", "Army Green": "#4B5320",
  Brown: "#533113", Blue: "#3b82f6", Orange: "#f97316", "Pure Orange": "#FFA500", Pink: "#ec4899",
  Navy: "#1e3a5f", Grey: "#6b7280", Yellow: "#eab308", "Curry Yellow": "#D4A017", Purple: "#800080",
  Nude: "#E3BC9A", "Hot Pink": "#FF69B4", "Dark Purple": "#4A0E4E",
  "Sea Blue": "#006994", "Butter Yellow": "#FFF099", Lilac: "#C8A2C8",
  "Mint Green": "#98FF98", Burgundy: "#800020", "Baby Pink": "#F4C2C2",
  "Pigeon Blue": "#7BA0B4", "Burnt Orange": "#CC5500",
};
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  ShoppingCartIcon,
  ArrowLineUpRightIcon,
  ImageIcon,
} from "@phosphor-icons/react";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

type FormData = typeof EMPTY_FORM;

interface VerifiedOrderItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface VerifiedOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  total: number;
  delivery_area?: string | null;
  delivery_fee?: number | null;
  line_items: VerifiedOrderItem[];
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
}

export default function CartPage() {
  const { items, count, total, removeItem, updateQty, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    name: user?.displayName ?? "",
    email: user?.email ?? "",
  });
  const [placing, setPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [orderId, setOrderId] = useState("");

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const verifyingPaymentRef = useRef("");
  const initializingPaymentRef = useRef(false);
  const clearCartRef = useRef(clearCart);

  useEffect(() => {
    clearCartRef.current = clearCart;
  }, [clearCart]);

  useEffect(() => {
    supabase.from("shipping_methods").select("*").eq("enabled", true).then(({ data }) => {
      if (data) {
        const methods = data as ShippingMethod[];
        methods.sort((a, b) => a.price - b.price);
        setShippingMethods(methods);
      }
    });
  }, []);

  const deliveryFee = selectedShipping?.price ?? 0;
  const grandTotal = total + deliveryFee;
  const fmt = (n: number) =>
    `gh₵ ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sendOrderEmails = async (order: VerifiedOrder) => {
    const orderItems = order.line_items ?? [];
    const subtotal = orderItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const orderTotal = Number(order.total ?? 0);
    const orderDeliveryFee = Number(order.delivery_fee ?? Math.max(0, orderTotal - subtotal));
    const orderForm = {
      name: order.customer_name ?? "",
      email: order.customer_email ?? "",
      phone: order.customer_phone ?? "",
      address: order.address ?? "",
      city: order.city ?? "",
      notes: "",
    };
    const adminEmails = await getOrderAdminEmails();

    await queueAndSendMail([
      {
        to: orderForm.email,
        subject: `FitwearGH — Order Confirmed #${order.id.slice(0, 8).toUpperCase()}`,
        html: orderConfirmHtml({
          orderId: order.id,
          form: orderForm,
          items: orderItems,
          total: subtotal,
          deliveryFee: orderDeliveryFee,
          grandTotal: orderTotal,
          shippingMethod: order.delivery_area ?? undefined,
        }),
      },
      ...adminEmails.map((email) => ({
        to: email,
        subject: `New Paid Order #${order.id.slice(0, 8).toUpperCase()} — ${orderForm.name} (GH₵${orderTotal.toFixed(2)})`,
        html: orderAdminHtml({
          orderId: order.id,
          form: orderForm,
          items: orderItems,
          total: subtotal,
          deliveryFee: orderDeliveryFee,
          grandTotal: orderTotal,
          shippingMethod: order.delivery_area ?? undefined,
        }),
      })),
    ]);
  };

  useEffect(() => {
    const shouldVerify = searchParams.get("paystack") === "verify";
    const reference = searchParams.get("reference");
    const callbackOrderId = searchParams.get("order_id");
    if (!shouldVerify || !reference || !callbackOrderId) return;

    const verificationKey = `${callbackOrderId}:${reference}`;
    if (verifyingPaymentRef.current === verificationKey) return;
    verifyingPaymentRef.current = verificationKey;

    let active = true;
    const verifyPayment = async () => {
      setPlacing(true);
      setPaymentError("");
      setStep("checkout");
      setSearchParams({}, { replace: true });

      try {
        const { data, error } = await supabase.functions.invoke("verify-paystack", {
          body: { order_id: callbackOrderId, reference },
        });
        if (error) throw error;
        if (!data?.paid || !data?.order) {
          throw new Error(data?.status ? `Payment ${data.status}.` : "Payment could not be verified.");
        }

        const verifiedOrder = data.order as VerifiedOrder;
        if (!data.was_already_paid) {
          await sendOrderEmails(verifiedOrder);
        }

        if (!active) return;
        setOrderId(verifiedOrder.id);
        clearCartRef.current();
        setStep("success");
      } catch (err) {
        console.error("Paystack verification error:", err);
        if (!active) return;
        verifyingPaymentRef.current = "";
        setPaymentError(err instanceof Error ? err.message : "Payment could not be verified.");
        setStep("checkout");
      } finally {
        if (active) setPlacing(false);
      }
    };

    verifyPayment();
    return () => {
      active = false;
    };
  }, [searchParams, setSearchParams]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initializingPaymentRef.current || placing) return;
    if (items.length === 0) {
      setPaymentError("Your cart is empty.");
      return;
    }
    if (!selectedShipping) {
      setPaymentError("Select a delivery area to continue.");
      return;
    }

    initializingPaymentRef.current = true;
    setPlacing(true);
    setPaymentError("");
    try {
      const { data: ref, error } = await supabase.from("orders").insert({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        address: form.address,
        city: form.city,
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
        delivery_area: selectedShipping.name,
        delivery_fee: deliveryFee,
        status: "payment_pending",
        payment_provider: "paystack",
        payment_status: "unpaid",
        items: count,
      }).select("id").single();
      
      if (error) throw error;
      
      const orderId = ref.id;
      setOrderId(orderId);

      const callbackUrl = `${window.location.origin}/cart?paystack=verify&order_id=${orderId}`;
      const { data: payment, error: paymentError } = await supabase.functions.invoke("initialize-paystack", {
        body: { order_id: orderId, callback_url: callbackUrl },
      });
      if (paymentError) throw paymentError;
      if (!payment?.authorization_url) throw new Error("Paystack did not return a checkout URL.");

      window.location.href = payment.authorization_url;
    } catch (err) {
      console.error("Order error:", err);
      setPaymentError(err instanceof Error ? err.message : "Could not start Paystack payment.");
      initializingPaymentRef.current = false;
    } finally {
      setPlacing(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#FFFBF6]">
        <Navbar />
        <div className="max-w-[600px] mx-auto px-4 py-20 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-green-100 flex items-center justify-center">
            <ShoppingCartIcon size={32} className="text-green-600" weight="fill" />
          </div>
          <h1 className="raleway-bold text-3xl text-[#533113]">Order Placed!</h1>
          <p className="raleway-regular text-[#533113]/70 text-lg">
            Thank you for your order. We'll contact you shortly to confirm delivery.
          </p>
          <p className="raleway-regular text-sm text-[#533113]/40 font-mono">
            Order #{orderId.slice(0, 10).toUpperCase()}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest px-8 py-3 hover:bg-[#3d2409] transition-colors"
          >
            Continue Shopping
          </button>
        </div>
        <Footer />
      </div>
    );
  }

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
            <div className="w-full lg:w-80 shrink-0">
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
                    <span>{selectedShipping ? `Delivery (${selectedShipping.name})` : "Delivery"}</span>
                    <span>{selectedShipping ? fmt(deliveryFee) : "Select at checkout"}</span>
                  </div>

                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-xl">
                    <span>Total</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-[#533113] text-white raleway-bold text-base uppercase tracking-widest py-3 hover:bg-[#3d2409] transition-colors flex items-center justify-between px-4"
                >
                  Proceed to Checkout
                  <ArrowLineUpRightIcon size={16} />
                </button>
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

                <Field label="Delivery Address">
                  <input
                    required
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="House no. / Street name"
                    className="input-base"
                  />
                </Field>

                <Field label="City / Town">
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="Accra"
                    className="input-base"
                  />
                </Field>

                <Field label="Delivery Area">
                  <select
                    required
                    value={selectedShipping?.id ?? ""}
                    onChange={(e) => {
                      const area = shippingMethods.find((method) => method.id === e.target.value) ?? null;
                      setSelectedShipping(area);
                      setPaymentError("");
                    }}
                    className="input-base"
                  >
                    <option value="">Select delivery area</option>
                    {shippingMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name} — {fmt(method.price)}
                      </option>
                    ))}
                  </select>
                  {selectedShipping?.description && (
                    <p className="raleway-regular text-sm text-[#533113]/50">{selectedShipping.description}</p>
                  )}
                  {!shippingMethods.length && (
                    <p className="raleway-regular text-sm text-red-500">No delivery areas are available yet.</p>
                  )}
                </Field>

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
                    Pay securely with Paystack. Test mode is enabled by the Paystack test secret key on the server.
                  </p>
                  <p className="raleway-regular text-sm text-[#533113]/50">
                    You will be redirected to Paystack, then returned here once payment is complete.
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
                  disabled={placing || !selectedShipping || shippingMethods.length === 0}
                  className="flex-1 bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3 hover:bg-[#3d2409] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {searchParams.get("paystack") === "verify" ? "Verifying Payment…" : "Starting Payment…"}
                    </span>
                  ) : (
                    <>Pay with Paystack <ArrowLineUpRightIcon size={16} /></>
                  )}
                </button>
              </div>
            </form>

            {/* Mini order summary */}
            <div className="w-full lg:w-80 shrink-0">
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
                  <div className="flex justify-between">
                    <span>{selectedShipping ? `Delivery (${selectedShipping.name})` : "Delivery"}</span>
                    <span>{selectedShipping ? fmt(deliveryFee) : "Select area"}</span>
                  </div>
                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-base">
                    <span>Total</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>
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
