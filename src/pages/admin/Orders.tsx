import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CaretDownIcon,
  XIcon,
} from "@phosphor-icons/react";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  items: OrderItem[];
  itemCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
    setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status } : prev);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (n: number) =>
    `gh₵ ${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  const fmtDate = (ts: Timestamp) =>
    ts?.toDate().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) ?? "—";

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="raleway-bold text-2xl text-[#533113]">Orders</h2>
        <p className="raleway-light text-sm text-[#533113]/50 mt-1">
          {orders.length} total orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <MagnifyingGlassIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#533113]/40" />
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 pl-9 pr-4 py-2.5 border border-[#DEDEDE] raleway-light text-sm text-[#533113] outline-none focus:border-[#533113] bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon size={16} className="text-[#533113]/50 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-[#DEDEDE] raleway-light text-sm text-[#533113] px-3 py-2.5 outline-none bg-white cursor-pointer focus:border-[#533113] transition-colors"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DEDEDE] overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center raleway-light text-sm text-[#533113]/40">
            No orders found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                {["Order ID", "Customer", "Items", "Total", "Status", "Date", ""].map((h) => (
                  <th
                    key={h}
                    className="raleway-bold text-xs text-[#533113]/60 uppercase tracking-widest text-left px-5 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors"
                >
                  <td className="px-5 py-3 font-mono raleway-light text-xs text-[#533113]">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="raleway-bold text-[#533113] text-sm">{order.customerName ?? "—"}</p>
                    <p className="raleway-light text-xs text-[#533113]/50">{order.customerEmail ?? ""}</p>
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/70 text-center">
                    {order.itemCount ?? order.items?.length ?? "—"}
                  </td>
                  <td className="px-5 py-3 raleway-bold text-[#533113]">{fmt(order.total ?? 0)}</td>
                  <td className="px-5 py-3">
                    <StatusSelect
                      value={order.status}
                      onChange={(s) => updateStatus(order.id, s)}
                      loading={updatingId === order.id}
                    />
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/60 text-xs">
                    {fmtDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="raleway-light text-xs text-[#533113] underline underline-offset-2 hover:text-[#533113]/70 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order detail drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
              <h3 className="raleway-bold text-base text-[#533113]">
                Order #{selectedOrder.id.slice(0, 8)}
              </h3>
              <button onClick={() => setSelectedOrder(null)}>
                <XIcon size={20} className="text-[#533113]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
              {/* Status */}
              <div className="flex flex-col gap-2">
                <p className="raleway-bold text-xs text-[#533113]/60 uppercase tracking-widest">Status</p>
                <StatusSelect
                  value={selectedOrder.status}
                  onChange={(s) => updateStatus(selectedOrder.id, s)}
                  loading={updatingId === selectedOrder.id}
                />
              </div>

              {/* Customer */}
              <div className="flex flex-col gap-1.5 bg-[#FFFBF6] px-4 py-4 border border-[#DEDEDE]">
                <p className="raleway-bold text-xs text-[#533113]/60 uppercase tracking-widest mb-1">Customer</p>
                <p className="raleway-bold text-sm text-[#533113]">{selectedOrder.customerName ?? "—"}</p>
                <p className="raleway-light text-sm text-[#533113]/70">{selectedOrder.customerEmail ?? "—"}</p>
                <p className="raleway-light text-sm text-[#533113]/70">{selectedOrder.phone ?? "—"}</p>
                <p className="raleway-light text-xs text-[#533113]/50 mt-1">{selectedOrder.address ?? "—"}</p>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2">
                <p className="raleway-bold text-xs text-[#533113]/60 uppercase tracking-widest">Items</p>
                {selectedOrder.items?.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 border border-[#DEDEDE] bg-white"
                      >
                        <div>
                          <p className="raleway-bold text-sm text-[#533113]">{item.name}</p>
                          <p className="raleway-light text-xs text-[#533113]/50">Qty: {item.qty}</p>
                        </div>
                        <p className="raleway-bold text-sm text-[#533113]">
                          {fmt(item.price * item.qty)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="raleway-light text-sm text-[#533113]/40">No item details available.</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-[#DEDEDE] pt-4">
                <p className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">Total</p>
                <p className="raleway-bold text-lg text-[#533113]">{fmt(selectedOrder.total ?? 0)}</p>
              </div>

              {/* Date */}
              <p className="raleway-light text-xs text-[#533113]/40">
                Placed on {fmtDate(selectedOrder.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  loading,
}: {
  value: string;
  onChange: (s: string) => void;
  loading: boolean;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className={`appearance-none raleway-light text-xs px-2.5 py-1 pr-6 border capitalize cursor-pointer outline-none transition-colors ${
          STATUS_COLORS[value] ?? "bg-gray-100 text-gray-600 border-gray-200"
        } disabled:opacity-50`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize bg-white text-gray-800">
            {s}
          </option>
        ))}
      </select>
      <CaretDownIcon size={10} className="absolute right-2 pointer-events-none opacity-60" />
    </div>
  );
}

