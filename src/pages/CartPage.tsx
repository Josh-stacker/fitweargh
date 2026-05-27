import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { orderConfirmHtml } from "../emails/orderConfirmEmail";
import { orderAdminHtml } from "../emails/orderAdminEmail";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const COLOR_HEX: Record<string, string> = {
  Black: "#000000", White: "#FFFFFF", Red: "#ef4444", Green: "#00864A",
  Brown: "#533113", Blue: "#3b82f6", Orange: "#f97316", Pink: "#ec4899",
  Navy: "#1e3a5f", Grey: "#6b7280", Yellow: "#eab308", Purple: "#a855f7",
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

  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    name: user?.displayName ?? "",
    email: user?.email ?? "",
  });
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, "shippingMethods"), where("enabled", "==", true))).then((snap) => {
      const methods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShippingMethod));
      // Sort by price ascending
      methods.sort((a, b) => a.price - b.price);
      setShippingMethods(methods);
      if (methods.length > 0) setSelectedShipping(methods[0]);
    });
  }, []);

  // Fall back to GH₵15 if no shipping methods are configured yet
  const deliveryFee = selectedShipping?.price ?? 15;
  const grandTotal = total + deliveryFee;
  const fmt = (n: number) =>
    `gh₵ ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const ref = await addDoc(collection(db, "orders"), {
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        address: form.address,
        city: form.city,
        notes: form.notes,
        customerId: user?.uid ?? null,
        lineItems: items.map((i) => ({
          productId: i.id,
          name: i.name,
          price: i.price,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          imageUrl: i.imageUrl,
        })),
        subtotal: total,
        deliveryFee,
        shippingMethod: selectedShipping?.name ?? "Standard Delivery",
        total: grandTotal,
        status: "pending",
        items: count,
        createdAt: serverTimestamp(),
      });
      setOrderId(ref.id);

      // Order confirmation to customer
      await setDoc(doc(db, "mail", `order_confirm_${ref.id}`), {
        to: form.email,
        message: {
          subject: `FitwearGH — Order Confirmed #${ref.id.slice(0, 8).toUpperCase()}`,
          html: orderConfirmHtml({ orderId: ref.id, form, items, total, deliveryFee, grandTotal, shippingMethod: selectedShipping?.name }),
        },
      });

      // New order alert to admin
      await setDoc(doc(db, "mail", `order_admin_${ref.id}`), {
        to: "nerdosey@gmail.com",
        message: {
          subject: `New Order #${ref.id.slice(0, 8).toUpperCase()} — ${form.name} (GH₵${grandTotal.toFixed(2)})`,
          html: orderAdminHtml({ orderId: ref.id, form, items, total, deliveryFee, grandTotal, shippingMethod: selectedShipping?.name }),
        },
      });

      clearCart();
      setStep("success");
    } catch (err) {
      console.error("Order error:", err);
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
          <p className="raleway-light text-[#533113]/70 text-base">
            Thank you for your order. We'll contact you shortly to confirm delivery.
          </p>
          <p className="raleway-light text-xs text-[#533113]/40 font-mono">
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
        <div className="flex items-center gap-2 raleway-light text-sm text-[#533113]/60 mb-6">
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
            <p className="raleway-light text-[#533113]/50">Your cart is empty.</p>
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
                  className="bg-white border border-[#DEDEDE] flex gap-4 p-4"
                >
                  <div className="w-20 h-24 shrink-0 bg-[#F5EDE0] overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={24} className="text-[#533113]/20" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <p className="raleway-bold text-sm text-[#533113] leading-snug">{item.name}</p>
                    <div className="flex items-center gap-3 raleway-light text-xs text-[#533113]/60">
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
                    <p className="raleway-bold text-sm text-[#533113]">{fmt(item.price)}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-stretch border border-[#533113]">
                        <button
                          onClick={() => updateQty(item.id, item.size, item.color, item.quantity - 1)}
                          className="px-2 py-1.5 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        >
                          <MinusIcon size={13} />
                        </button>
                        <span className="raleway-bold text-xs w-8 flex items-center justify-center text-[#533113] border-l border-r border-[#533113]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.size, item.color, item.quantity + 1)}
                          className="px-2 py-1.5 text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        >
                          <PlusIcon size={13} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.size, item.color)}
                        className="p-2 text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:block shrink-0 raleway-bold text-sm text-[#533113] pt-1">
                    {fmt(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-4 sticky top-4">
                <h2 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
                  Order Summary
                </h2>
                <div className="flex flex-col gap-2 raleway-light text-sm text-[#533113]">
                  <div className="flex justify-between">
                    <span>Subtotal ({count} items)</span>
                    <span>{fmt(total)}</span>
                  </div>

                  {shippingMethods.length > 1 ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[#533113]/60">Delivery</span>
                      <div className="flex flex-col gap-1">
                        {shippingMethods.map((m) => (
                          <label key={m.id} className="flex items-center justify-between cursor-pointer gap-2 px-3 py-2 border border-[#DEDEDE] hover:border-[#533113]/40 transition-colors">
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="shipping"
                                checked={selectedShipping?.id === m.id}
                                onChange={() => setSelectedShipping(m)}
                                className="accent-[#533113]"
                              />
                              <span>
                                <span className="raleway-bold text-xs">{m.name}</span>
                                {m.description && <span className="block raleway-light text-xs text-[#533113]/50">{m.description}</span>}
                              </span>
                            </span>
                            <span className="raleway-bold text-xs shrink-0">{fmt(m.price)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>{selectedShipping?.name ?? "Delivery"}</span>
                      <span>{fmt(deliveryFee)}</span>
                    </div>
                  )}

                  <hr className="border-[#DEDEDE] my-1" />
                  <div className="flex justify-between raleway-bold text-base">
                    <span>Total</span>
                    <span>{fmt(grandTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep("checkout")}
                  className="w-full bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3 hover:bg-[#3d2409] transition-colors flex items-center justify-between px-4"
                >
                  Proceed to Checkout
                  <ArrowLineUpRightIcon size={16} />
                </button>
                <Link
                  to="/new-arrivals"
                  className="text-center raleway-light text-xs text-[#533113]/60 hover:text-[#533113] transition-colors"
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
                <p className="raleway-light text-sm text-[#533113]/70">
                  Pay on delivery — our team will contact you to confirm and arrange payment.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="raleway-light text-sm text-[#533113] px-5 py-3 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={placing}
                  className="flex-1 bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3 hover:bg-[#3d2409] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order…
                    </span>
                  ) : (
                    <>Place Order <ArrowLineUpRightIcon size={16} /></>
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
                        <p className="raleway-light text-xs text-[#533113]/60">
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
                <div className="flex flex-col gap-2 raleway-light text-sm text-[#533113]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{selectedShipping?.name ?? "Delivery"}</span>
                    <span>{fmt(deliveryFee)}</span>
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

