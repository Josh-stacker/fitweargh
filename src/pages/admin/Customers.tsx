import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { MagnifyingGlassIcon, UserIcon, EnvelopeIcon, PhoneIcon } from "@phosphor-icons/react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) setCustomers(data as Customer[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const fmt = (n: number) =>
    `gh₵ ${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  const fmtDate = (isoString: string) =>
    isoString ? new Date(isoString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) : "—";

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="raleway-bold text-2xl text-[#533113]">Customers</h2>
        <p className="raleway-regular text-base text-[#533113]/50 mt-1">
          {customers.length} registered customers
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#533113]/40"
        />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 pl-9 pr-4 py-2.5 border border-[#DEDEDE] raleway-regular text-base text-[#533113] outline-none focus:border-[#533113] bg-white transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DEDEDE] overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <UserIcon size={40} className="text-[#533113]/20" />
            <p className="raleway-regular text-base text-[#533113]/40">
              {search ? "No customers match your search." : "No customers yet."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                {["Customer", "Contact", "Orders", "Total Spent", "Joined"].map((h) => (
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
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#533113]/10 flex items-center justify-center shrink-0">
                        <span className="raleway-bold text-xs text-[#533113]">
                          {c.name?.charAt(0).toUpperCase() ?? "?"}
                        </span>
                      </div>
                      <p className="raleway-bold text-[#533113] text-sm">{c.name ?? "—"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 raleway-regular text-sm text-[#533113]/70">
                        <EnvelopeIcon size={12} />
                        {c.email ?? "—"}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 raleway-regular text-sm text-[#533113]/50">
                          <PhoneIcon size={12} />
                          {c.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 raleway-regular text-[#533113]/70 text-center">
                    {c.order_count ?? 0}
                  </td>
                  <td className="px-5 py-3 raleway-bold text-[#533113]">
                    {fmt(c.total_spent ?? 0)}
                  </td>
                  <td className="px-5 py-3 raleway-regular text-[#533113]/60 text-sm">
                    {fmtDate(c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
