import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { TrashIcon, UserPlusIcon, ShieldCheckIcon, WarningIcon, CopyIcon, EyeIcon, EyeSlashIcon, ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { adminInviteEmailHtml } from "../../emails/adminInviteEmail";

interface AdminUser {
  uid: string;
  email: string;
  name: string;
}

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

const EMPTY_FORM = { name: "", email: "", password: "" };

export default function AdminUsers() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM, password: generatePassword() });
  const [showPassword, setShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    const adminSnap = await getDocs(collection(db, "admins"));
    setAdmins(
      adminSnap.docs.map((d) => ({
        uid: d.id,
        email: d.data().email ?? "—",
        name: d.data().name ?? "—",
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const refreshPassword = () => {
    setForm((f) => ({ ...f, password: generatePassword() }));
    setCopied(false);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();

    if (!name || !email || !password) return;
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setAdding(true);
    try {
      // Create the Firebase Auth user via the Admin SDK is not available client-side,
      // so we use the Firebase Auth REST API to create the account.
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string;
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName: name, returnSecureToken: true }),
        }
      );
      const json = await res.json();

      if (!res.ok) {
        const msg = json?.error?.message ?? "Failed to create account.";
        if (msg === "EMAIL_EXISTS") {
          setError("An account with that email already exists.");
        } else {
          setError(msg);
        }
        return;
      }

      const uid: string = json.localId;

      // Write to admins collection
      await setDoc(doc(db, "admins", uid), {
        email,
        name,
        grantedAt: new Date().toISOString(),
      });

      // Send invite email via Firebase mail extension
      await setDoc(doc(db, "mail", `admin_invite_${uid}`), {
        to: email,
        message: {
          subject: "You've been invited to manage FitwearGH",
          html: adminInviteEmailHtml(name, email, password),
        },
      });

      setAdmins((prev) => [...prev, { uid, email, name }]);
      setForm({ name: "", email: "", password: generatePassword() });
      setSuccess(`Invite sent to ${email}. They can now log in at /admin/login.`);
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
      await deleteDoc(doc(db, "admins", uid));
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
          Invite Admin
        </h3>

        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          {/* Name + Email row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Full Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); setSuccess(""); }}
                placeholder="Jane Doe"
                className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-4 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Email Address</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(""); setSuccess(""); }}
                placeholder="jane@example.com"
                className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-4 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
              />
            </div>
          </div>

          {/* Password row */}
          <div className="flex flex-col gap-1.5">
            <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
              Temporary Password
              <span className="raleway-regular normal-case tracking-normal text-[#533113]/40 ml-2">— will be sent in the invite email</span>
            </label>
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setCopied(false); }}
                  className="w-full border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-4 py-2.5 pr-10 outline-none focus:border-[#533113] bg-white transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#533113]/40 hover:text-[#533113] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={refreshPassword}
                className="border border-[#DEDEDE] px-3 text-[#533113]/60 hover:text-[#533113] hover:border-[#533113] transition-colors"
                title="Generate new password"
              >
                <ArrowsClockwiseIcon size={16} />
              </button>
              <button
                type="button"
                onClick={copyPassword}
                className="border border-[#DEDEDE] px-3 text-[#533113]/60 hover:text-[#533113] hover:border-[#533113] transition-colors"
                title="Copy password"
              >
                {copied ? <span className="raleway-regular text-xs text-green-600">Copied</span> : <CopyIcon size={16} />}
              </button>
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
            disabled={adding || !form.name.trim() || !form.email.trim() || !form.password.trim()}
            className="flex items-center gap-2 self-start bg-[#533113] text-white raleway-bold text-xs uppercase tracking-widest px-6 py-3 hover:bg-[#3d2409] transition-colors disabled:opacity-50"
          >
            {adding ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlusIcon size={16} />
            )}
            {adding ? "Sending Invite…" : "Create & Send Invite"}
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
