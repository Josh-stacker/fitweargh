import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { orderConfirmHtml } from "../emails/orderConfirmEmail";
import { orderAdminHtml } from "../emails/orderAdminEmail";
import { queueAndSendMail } from "../lib/mail";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";

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

async function sendOrderEmails(order: VerifiedOrder) {
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
    {
      to: "fitweargh1@gmail.com",
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
    },
  ]);
}

export default function OrderProcessing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");
  const ranRef = useRef(false);

  // Kept current so the post-success redirect can be decided when it actually
  // fires, not when the effect closed over `user` — auth resolves async, so at
  // verify time a signed-in customer can still look like a guest.
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const reference = searchParams.get("reference");
    const orderIdParam = searchParams.get("order_id");

    if (!reference || !orderIdParam) {
      setStatus("error");
      setErrorMsg("Missing payment reference. If you were charged, please contact us with your order details.");
      return;
    }

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-paystack", {
          body: { order_id: orderIdParam, reference },
        });
        if (error) throw error;
        if (!data?.paid || !data?.order) {
          throw new Error(data?.status ? `Payment ${data.status}.` : "Payment could not be verified.");
        }

        const verifiedOrder = data.order as VerifiedOrder;
        if (!data.was_already_paid) {
          // Payment already succeeded at this point. A mail failure must never
          // turn a paid order into a "payment not confirmed" screen.
          try {
            await sendOrderEmails(verifiedOrder);
          } catch (mailErr) {
            console.error("Order email failed:", mailErr);
          }
        }

        setOrderId(verifiedOrder.id);
        clearCart();
        setStatus("success");
        // Guests have no account page to land on — leave them on the receipt.
        setTimeout(() => {
          if (userRef.current) navigate("/account");
        }, 2500);
      } catch (err) {
        console.error("Paystack verification error:", err);
        const msg = err instanceof Error ? err.message : "";
        setErrorMsg(
          msg && !msg.toLowerCase().includes("edge function") && !msg.toLowerCase().includes("non-2xx")
            ? msg
            : "We could not verify your payment. If you were charged, please contact us with your order reference and we'll sort it out."
        );
        setStatus("error");
      }
    };

    verify();
  }, [searchParams, navigate, clearCart]);

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-[600px] mx-auto px-4 py-24 text-center flex flex-col items-center gap-6">
        {status === "verifying" && (
          <>
            <div className="w-14 h-14 border-4 border-[#533113] border-t-transparent rounded-full animate-spin" />
            <h1 className="raleway-bold text-2xl text-[#533113]">Confirming your payment…</h1>
            <p className="raleway-regular text-[#533113]/70 text-lg">
              Please wait, do not close this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 flex items-center justify-center rounded-full">
              <CheckCircleIcon size={36} className="text-green-600" weight="fill" />
            </div>
            <h1 className="raleway-bold text-3xl text-[#533113]">Payment Confirmed!</h1>
            <p className="raleway-regular text-[#533113]/70 text-lg">
              Thank you for your order. We'll contact you shortly to confirm delivery.
            </p>
            <p className="raleway-regular text-sm text-[#533113]/40 font-mono">
              Order #{orderId.slice(0, 10).toUpperCase()}
            </p>
            {user ? (
              <p className="raleway-regular text-sm text-[#533113]/50">Redirecting to your account…</p>
            ) : (
              <>
                <p className="raleway-regular text-sm text-[#533113]/50">
                  A confirmation email is on its way. Keep your order number for reference.
                </p>
                <Link
                  to="/new-arrivals"
                  className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest px-6 py-3 hover:bg-[#3d2409] transition-colors mt-2"
                >
                  Continue Shopping
                </Link>
              </>
            )}
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 flex items-center justify-center rounded-full">
              <XCircleIcon size={36} className="text-red-600" weight="fill" />
            </div>
            <h1 className="raleway-bold text-3xl text-[#533113]">Payment Not Confirmed</h1>
            <p className="raleway-regular text-[#533113]/70 text-lg">{errorMsg}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              {/* Cart is untouched on failure, so retrying just means going
                  back to the checkout form they already filled in. */}
              <Link
                to="/cart?step=checkout"
                className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest px-6 py-3 hover:bg-[#3d2409] transition-colors"
              >
                Try Payment Again
              </Link>
              {user && (
                <Link
                  to="/account"
                  className="border border-[#533113] text-[#533113] raleway-bold text-sm uppercase tracking-widest px-6 py-3 hover:bg-[#533113]/5 transition-colors"
                >
                  My Account
                </Link>
              )}
              <Link
                to="/contact-us"
                className="border border-[#533113] text-[#533113] raleway-bold text-sm uppercase tracking-widest px-6 py-3 hover:bg-[#533113]/5 transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
