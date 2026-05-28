import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, orderBy, doc, getDoc, updateDoc, type Timestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  ShoppingCartIcon,
  UserIcon,
  SignOutIcon,
  PackageIcon,
  MapPinIcon,
  ClockIcon,
} from "@phosphor-icons/react";

type Tab = "orders" | "profile";

interface Order {
  id: string;
  total: number;
  status: string;
  itemCount: number;
  items: { name: string; qty: number; price: number }[];
  createdAt: Timestamp;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AccountDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Profile state
  const [name, setName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch orders for this customer
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const snap = await getDocs(
          query(
            collection(db, "orders"),
            where("customerId", "==", user.uid),
            orderBy("createdAt", "desc")
          )
        );
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } catch {
        // Index may not exist yet; fallback without orderBy
        const snap = await getDocs(
          query(collection(db, "orders"), where("customerId", "==", user.uid))
        );
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } finally {
        setLoadingOrders(false);
      }
    };

    // Fetch customer profile extras
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "customers", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setPhone(data.phone ?? "");
        setAddress(data.address ?? "");
        if (data.name) setName(data.name);
      }
    };

    fetchOrders();
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "customers", user.uid), { name, phone, address });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const fmt = (n: number) =>
    `gh₵ ${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  const fmtDate = (ts: Timestamp) =>
    ts?.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "—";

  const totalSpent = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#FFFBF6] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="raleway-bold text-2xl md:text-3xl text-[#533113]">
              My Account
            </h1>
            <p className="raleway-regular text-lg text-[#533113]/70 mt-1">
              {user?.displayName ?? user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 raleway-regular text-base text-[#533113] border border-[#533113] px-4 py-2.5 hover:bg-[#533113] hover:text-white transition-colors self-start sm:self-auto"
          >
            <SignOutIcon size={16} />
            Sign out
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <SummaryCard
            icon={ShoppingCartIcon}
            label="Total Orders"
            value={String(orders.length)}
          />
          <SummaryCard
            icon={PackageIcon}
            label="Total Spent"
            value={fmt(totalSpent)}
          />
          <SummaryCard
            icon={ClockIcon}
            label="Last Order"
            value={orders[0] ? fmtDate(orders[0].createdAt) : "—"}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#DEDEDE] mb-6 gap-0">
          {(["orders", "profile"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`raleway-bold text-sm uppercase tracking-widest px-5 py-3 border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-[#533113] text-[#533113]"
                  : "border-transparent text-[#533113]/40 hover:text-[#533113]/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="flex flex-col gap-3">
            {loadingOrders ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <ShoppingCartIcon size={48} className="text-[#533113]/20" />
                <p className="raleway-regular text-lg text-[#533113]/50">No orders yet.</p>
                <Link
                  to="/new-arrivals"
                  className="raleway-bold text-sm text-white bg-[#533113] px-6 py-3 uppercase tracking-widest hover:bg-[#3d2409] transition-colors"
                >
                  Shop Now
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-[#DEDEDE]">
                  {/* Order summary row */}
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-2 text-left hover:bg-[#FFFBF6] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="font-mono raleway-regular text-sm text-[#533113]/60">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span
                        className={`raleway-regular text-sm px-2.5 py-1 capitalize self-start ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status ?? "pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="raleway-regular text-base text-[#533113]/60">
                        {fmtDate(order.createdAt)}
                      </span>
                      <span className="raleway-bold text-base text-[#533113]">
                        {fmt(order.total ?? 0)}
                      </span>
                    </div>
                  </button>

                  {/* Expanded items */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-[#DEDEDE] px-5 py-4 flex flex-col gap-3">
                      {order.items?.length > 0 ? (
                        order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div>
                              <p className="raleway-bold text-sm text-[#533113]">{item.name}</p>
                              <p className="raleway-regular text-sm text-[#533113]/50">Qty: {item.qty}</p>
                            </div>
                            <p className="raleway-bold text-sm text-[#533113]">
                              {fmt(item.price * item.qty)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="raleway-regular text-base text-[#533113]/40">No item details available.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === "profile" && (
          <div className="bg-white border border-[#DEDEDE] p-6 md:p-8 flex flex-col gap-6 max-w-lg">
            <div className="flex items-center gap-4 pb-4 border-b border-[#DEDEDE]">
              <div className="w-14 h-14 rounded-full bg-[#533113]/10 flex items-center justify-center shrink-0">
                <UserIcon size={28} className="text-[#533113]" />
              </div>
              <div>
                <p className="raleway-bold text-base text-[#533113]">{name || user?.displayName || "—"}</p>
                <p className="raleway-regular text-base text-[#533113]/60">{user?.email}</p>
              </div>
            </div>

            {profileSaved && (
              <div className="bg-green-50 border border-green-200 text-green-700 raleway-regular text-base px-4 py-3">
                Profile updated successfully.
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Email
              </label>
              <input
                value={user?.email ?? ""}
                disabled
                className="input-base opacity-50 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  Phone number
                </span>
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-base"
                placeholder="+233 XX XXX XXXX"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <MapPinIcon size={13} />
                  Delivery address
                </span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="input-base resize-none"
                placeholder="House no., street, city, region…"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest py-3.5 hover:bg-[#3d2409] transition-colors disabled:opacity-60 self-start px-8"
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[#DEDEDE] px-5 py-4 flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2 text-[#533113]/50 mb-1">
        <Icon size={16} />
        <span className="raleway-regular text-sm uppercase tracking-widest">{label}</span>
      </div>
      <p className="raleway-bold text-xl text-[#533113] break-all">{value}</p>
    </div>
  );
}
