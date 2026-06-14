import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import {
  ShoppingCartIcon,
  UsersIcon,
  PackageIcon,
  CurrencyCircleDollarIcon,
  ArrowUpIcon,
  ClockIcon,
} from "@phosphor-icons/react";

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}

interface Order {
  id: string;
  customerName: string;
  total: number;
  status: string;
  created_at: string;
  items: number;
}

const STATUS_COLORS: Record<string, string> = {
  payment_pending: "bg-orange-100 text-orange-700",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function StatCard({ label, value, sub, icon: Icon, color }: StatCard) {
  return (
    <div className="bg-white border border-[#DEDEDE] p-6 flex items-start gap-4">
      <div className={`p-3 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="raleway-regular text-sm text-[#533113]/50 uppercase tracking-widest">{label}</p>
        <p className="raleway-bold text-2xl text-[#533113] mt-1">{value}</p>
        <p className="raleway-regular text-sm text-[#533113]/60 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    monthRevenue: 0,
    monthOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
          { data: allOrders, count: ordersCount },
          { count: customersCount },
          { count: productsCount },
          { data: monthOrders },
          { data: recentData }
        ] = await Promise.all([
          supabase.from("orders").select("total", { count: "exact" }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("total").gte("created_at", startOfMonth.toISOString()),
          supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
        ]);

        const totalRevenue = allOrders?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0;
        const monthRevenue = monthOrders?.reduce((sum, d) => sum + (Number(d.total) || 0), 0) || 0;

        setStats({
          totalRevenue,
          totalOrders: ordersCount || 0,
          totalCustomers: customersCount || 0,
          totalProducts: productsCount || 0,
          monthRevenue,
          monthOrders: monthOrders?.length || 0,
        });

        if (recentData) {
          setRecentOrders(recentData as Order[]);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fmt = (n: number) =>
    `gh₵ ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (isoString: string) =>
    isoString ? new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      label: "Total Revenue",
      value: fmt(stats.totalRevenue),
      sub: `${fmt(stats.monthRevenue)} this month`,
      icon: CurrencyCircleDollarIcon,
      color: "bg-[#533113]",
    },
    {
      label: "Total Orders",
      value: String(stats.totalOrders),
      sub: `${stats.monthOrders} this month`,
      icon: ShoppingCartIcon,
      color: "bg-amber-600",
    },
    {
      label: "Customers",
      value: String(stats.totalCustomers),
      sub: "Registered accounts",
      icon: UsersIcon,
      color: "bg-sky-600",
    },
    {
      label: "Products",
      value: String(stats.totalProducts),
      sub: "Active listings",
      icon: PackageIcon,
      color: "bg-emerald-600",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="raleway-bold text-2xl text-[#533113]">Overview</h2>
        <p className="raleway-regular text-base text-[#533113]/50 mt-1">
          Welcome back. Here's what's happening today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-[#DEDEDE]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
          <h3 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
            Recent Orders
          </h3>
          <div className="flex items-center gap-1.5 text-[#533113]/50">
            <ClockIcon size={14} />
            <span className="raleway-regular text-sm">Latest 8</span>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingCartIcon size={36} className="text-[#533113]/20 mx-auto mb-3" />
            <p className="raleway-regular text-base text-[#533113]/40">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                  {["Order ID", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors"
                  >
                    <td className="px-5 py-3 raleway-regular text-[#533113] font-mono text-sm">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 raleway-regular text-[#533113]">
                      {order.customerName ?? "—"}
                    </td>
                    <td className="px-5 py-3 raleway-regular text-[#533113]/70 text-center">
                      {order.items ?? "—"}
                    </td>
                    <td className="px-5 py-3 raleway-bold text-[#533113]">
                      {fmt(order.total ?? 0)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`raleway-regular text-sm px-2.5 py-1 capitalize ${
                          STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {order.status ?? "unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-3 raleway-regular text-[#533113]/60 text-sm">
                      {fmtDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="/admin/products"
          className="bg-[#533113] text-white flex items-center justify-between px-6 py-5 hover:bg-[#3d2409] transition-colors group"
        >
          <div>
            <p className="raleway-bold text-sm uppercase tracking-widest">Add New Product</p>
            <p className="raleway-regular text-sm mt-1 opacity-70">Upload images & set details</p>
          </div>
          <ArrowUpIcon
            size={20}
            className="rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
          />
        </a>
        <a
          href="/admin/orders"
          className="bg-white border border-[#533113] text-[#533113] flex items-center justify-between px-6 py-5 hover:bg-[#533113]/5 transition-colors group"
        >
          <div>
            <p className="raleway-bold text-sm uppercase tracking-widest">Manage Orders</p>
            <p className="raleway-regular text-sm mt-1 opacity-60">Update statuses & track deliveries</p>
          </div>
          <ArrowUpIcon
            size={20}
            className="rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
          />
        </a>
      </div>
    </div>
  );
}
