import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { TrashIcon, UserPlusIcon, ShieldCheckIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

interface AdminUser {
  uid: string;
  email: string;
  name: string;
}

const EMPTY_FORM = { email: "" };

export default function AdminUsers() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_users").select("*");
    if (data) {
      setAdmins(data.map((d: any) => ({
        uid: d.user_id,
        email: d.email ?? "—",
        name: d.name ?? "—",
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = form.email.trim().toLowerCase();
    if (!email) return;

    setAdding(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        setError("No user found with that email. They must register an account first.");
        return;
      }

      const { error: insertError } = await supabase.from("admin_users").insert({
        user_id: profile.id,
        email: profile.email,
        name: profile.name,
      });

      if (insertError) {
        if (insertError.code === "23505") setError("User is already an admin.");
        else setError("Failed to grant admin access.");
        return;
      }

      setAdmins((prev) => [...prev, { uid: profile.id, email: profile.email, name: profile.name }]);
      setForm(EMPTY_FORM);
      setSuccess(`Admin access granted to ${profile.email}.`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (uid: string) => {
    if (uid === user?.uid) {
      setError("You cannot remove your own admin access.");
      return;
    }
    setError("");
    setSuccess("");
    setRemovingUid(uid);
    try {
      await supabase.from("admin_users").delete().eq("user_id", uid);
      setAdmins((prev) => prev.filter((a) => a.uid !== uid));
      setSuccess("Admin removed.");
    } catch {
      setError("Failed to remove admin.");
    } finally {
      setRemovingUid(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="raleway-bold text-2xl text-[#533113]">Admin Users</h2>
        <p className="raleway-regular text-base text-[#533113]/50 mt-1">
          Invite new admins and manage existing access.
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-5">
        <h3 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
          Grant Admin Access
        </h3>

        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Email Address</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => { setForm({ email: e.target.value }); setError(""); setSuccess(""); }}
                placeholder="user@example.com"
                className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-4 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
              />
              <span className="raleway-regular text-xs text-[#533113]/50">
                The user must already have an account with this email address.
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 raleway-regular text-base">
              <WarningIcon size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <p className="text-green-700 raleway-regular text-base">{success}</p>
          )}

          <button
            type="submit"
            disabled={adding || !form.email.trim()}
            className="flex items-center gap-2 self-start bg-[#533113] text-white raleway-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-[#3d2409] transition-colors disabled:opacity-50"
          >
            {adding ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlusIcon size={16} />
            )}
            {adding ? "Granting…" : "Grant Access"}
          </button>
        </form>
      </div>

      {/* Admin list */}
      <div className="bg-white border border-[#DEDEDE]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <ShieldCheckIcon size={40} className="text-[#533113]/20" />
            <p className="raleway-regular text-base text-[#533113]/40">No admins found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                {["User", "UID", ""].map((h) => (
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
              {admins.map((a) => (
                <tr
                  key={a.uid}
                  className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="raleway-bold text-sm text-[#533113]">{a.name}</p>
                    <p className="raleway-regular text-sm text-[#533113]/50">{a.email}</p>
                  </td>
                  <td className="px-5 py-3 font-mono raleway-regular text-sm text-[#533113]/40 max-w-[140px] truncate">
                    {a.uid}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {a.uid === user?.uid ? (
                      <span className="raleway-regular text-sm text-[#533113]/30 italic">you</span>
                    ) : (
                      <button
                        onClick={() => handleRemove(a.uid)}
                        disabled={removingUid === a.uid}
                        className="p-1.5 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Remove admin"
                      >
                        {removingUid === a.uid ? (
                          <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <TrashIcon size={15} />
                        )}
                      </button>
                    )}
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
