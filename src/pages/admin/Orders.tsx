import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CaretDownIcon,
  XIcon,
} from "@phosphor-icons/react";
import { orderStatusHtml } from "../../emails/orderStatusEmail";
import { shippingEmailHtml } from "../../emails/shippingEmail";
import { cancellationEmailHtml } from "../../emails/cancellationEmail";
import { queueAndSendMail } from "../../lib/mail";

interface LineItem {
  name: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address: string;
  city: string;
  total: number;
  status: string;
  line_items: LineItem[];
  items: number;
  created_at: string;
  updated_at: string;
}

const STATUSES = ["payment_pending", "pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  payment_pending: "bg-orange-100 text-orange-700 border-orange-200",
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
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await supabase.from("orders").update({ status }).eq("id", orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status } : prev);
      }

      const order = orders.find((o) => o.id === orderId);
      if (!order?.customer_email) return;

      const lineItems = order.line_items ?? [];

      if (status === "shipped") {
        await queueAndSendMail([
          {
            to: order.customer_email,
            subject: `Your FitwearGH order #${orderId.slice(0, 8).toUpperCase()} has shipped!`,
            html: shippingEmailHtml({
              orderId,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              address: order.address,
              city: order.city,
              total: order.total,
              lineItems,
            }),
          },
        ]);
      } else if (status === "cancelled") {
        await queueAndSendMail([
          {
            to: order.customer_email,
            subject: `Your FitwearGH order #${orderId.slice(0, 8).toUpperCase()} has been cancelled`,
            html: cancellationEmailHtml({
              orderId,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              lineItems,
              total: order.total,
            }),
          },
        ]);
      } else if (status === "processing" || status === "delivered") {
        await queueAndSendMail([
          {
            to: order.customer_email,
            subject: `FitwearGH — Order #${orderId.slice(0, 8).toUpperCase()} update: ${status}`,
            html: orderStatusHtml({
              orderId,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              status: status as "processing" | "delivered",
              total: order.total,
            }),
          },
        ]);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (n: number) =>
    `gh₵ ${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  const fmtDate = (isoString: string) =>
    isoString ? new Date(isoString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) : "—";

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="raleway-bold text-2xl text-[#533113]">Orders</h2>
        <p className="raleway-regular text-base text-[#533113]/50 mt-1">
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
            className="w-full sm:w-80 pl-9 pr-4 py-2.5 border border-[#DEDEDE] raleway-regular text-base text-[#533113] outline-none focus:border-[#533113] bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon size={16} className="text-[#533113]/50 shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none bg-white cursor-pointer focus:border-[#533113] transition-colors"
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
          <div className="py-16 text-center raleway-regular text-base text-[#533113]/40">
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
                  <td className="px-5 py-3 font-mono raleway-regular text-sm text-[#533113]">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="raleway-bold text-[#533113] text-sm">{order.customer_name ?? "—"}</p>
                    <p className="raleway-regular text-sm text-[#533113]/50">{order.customer_email ?? ""}</p>
                  </td>
                  <td className="px-5 py-3 raleway-regular text-[#533113]/70 text-center">
                    {order.items ?? order.line_items?.length ?? "—"}
                  </td>
                  <td className="px-5 py-3 raleway-bold text-[#533113]">{fmt(order.total ?? 0)}</td>
                  <td className="px-5 py-3">
                    <StatusSelect
                      value={order.status}
                      onChange={(s) => updateStatus(order.id, s)}
                      loading={updatingId === order.id}
                    />
                  </td>
                  <td className="px-5 py-3 raleway-regular text-[#533113]/60 text-sm">
                    {fmtDate(order.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="raleway-regular text-sm text-[#533113] underline underline-offset-2 hover:text-[#533113]/70 transition-colors"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="raleway-regular text-xs text-[#533113]/50 uppercase tracking-widest mb-1">Customer</p>
                  <p className="raleway-bold text-base text-[#533113]">{selectedOrder.customer_name}</p>
                  <p className="raleway-regular text-sm text-[#533113]/70">{selectedOrder.customer_email}</p>
                  <p className="raleway-regular text-sm text-[#533113]/70">{selectedOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="raleway-regular text-xs text-[#533113]/50 uppercase tracking-widest mb-1">Shipping Address</p>
                  <p className="raleway-regular text-sm text-[#533113]/70">{selectedOrder.address}</p>
                  <p className="raleway-regular text-sm text-[#533113]/70">{selectedOrder.city}</p>
                </div>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2">
                <p className="raleway-regular text-xs text-[#533113]/50 uppercase tracking-widest mb-2">Order Items ({selectedOrder.line_items?.length})</p>
                {selectedOrder.line_items?.length > 0 ? (
                  <div className="bg-[#FFFBF6] border border-[#DEDEDE]/60 divide-y divide-[#DEDEDE]/60">
                    {selectedOrder.line_items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div>
                          <p className="raleway-bold text-sm text-[#533113]">{item.name}</p>
                          <p className="raleway-regular text-sm text-[#533113]/50">
                            {item.size && `${item.size} · `}
                            {item.color && `${item.color} · `}
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="raleway-bold text-sm text-[#533113]">
                          {fmt(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="raleway-regular text-base text-[#533113]/40">No item details available.</p>
                )}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between border-t border-[#DEDEDE] pt-4">
                <p className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">Total</p>
                <p className="raleway-bold text-lg text-[#533113]">{fmt(selectedOrder.total ?? 0)}</p>
              </div>

              {/* Date */}
              <p className="raleway-regular text-sm text-[#533113]/40">
                Placed on {fmtDate(selectedOrder.created_at)}
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
        className={`appearance-none raleway-regular text-sm px-2.5 py-1 pr-6 border capitalize cursor-pointer outline-none transition-colors ${
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
