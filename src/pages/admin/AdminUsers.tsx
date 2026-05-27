import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase";
import { TrashIcon, UserPlusIcon, ShieldCheckIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

interface AdminUser {
  uid: string;
  email: string;
  name: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    const adminSnap = await getDocs(collection(db, "admins"));
    const uids = adminSnap.docs.map((d) => d.id);

    if (uids.length === 0) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    // Look up customer records to get names/emails for each uid
    const customerSnap = await getDocs(collection(db, "customers"));
    const customerMap: Record<string, { email: string; name: string }> = {};
    customerSnap.docs.forEach((d) => {
      const data = d.data();
      customerMap[d.id] = { email: data.email ?? "", name: data.name ?? "" };
    });

    setAdmins(
      uids.map((uid) => ({
        uid,
        email: customerMap[uid]?.email ?? adminSnap.docs.find((d) => d.id === uid)?.data().email ?? "—",
        name: customerMap[uid]?.name ?? adminSnap.docs.find((d) => d.id === uid)?.data().name ?? "—",
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    setAdding(true);
    try {
      // Find the uid in the customers collection
      const snap = await getDocs(
        query(collection(db, "customers"), where("email", "==", email), limit(1))
      );

      if (snap.empty) {
        setError("No registered customer account found with that email. The user must sign up first.");
        setAdding(false);
        return;
      }

      const customerDoc = snap.docs[0];
      const uid = customerDoc.id;

      if (admins.some((a) => a.uid === uid)) {
        setError("That user is already an admin.");
        setAdding(false);
        return;
      }

      const data = customerDoc.data();
      await setDoc(doc(db, "admins", uid), {
        email: data.email,
        name: data.name ?? "",
        grantedAt: new Date().toISOString(),
      });

      setAdmins((prev) => [
        ...prev,
        { uid, email: data.email, name: data.name ?? "—" },
      ]);
      setEmailInput("");
      setSuccess(`${data.name ?? email} has been added as an admin.`);
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
        <p className="raleway-light text-sm text-[#533113]/50 mt-1">
          Manage who has access to this admin panel.
        </p>
      </div>

      {/* Add admin form */}
      <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-4">
        <h3 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">
          Add Admin
        </h3>
        <p className="raleway-light text-sm text-[#533113]/60">
          The user must already have a customer account. Enter their email address below.
        </p>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="email"
            required
            placeholder="customer@email.com"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setError(""); setSuccess(""); }}
            className="flex-1 border border-[#DEDEDE] raleway-light text-sm text-[#533113] px-4 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !emailInput.trim()}
            className="flex items-center gap-2 bg-[#533113] text-white raleway-bold text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-[#3d2409] transition-colors disabled:opacity-50"
          >
            {adding ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlusIcon size={16} />
            )}
            Add
          </button>
        </form>

        {error && (
          <div className="flex items-start gap-2 text-red-600 raleway-light text-sm">
            <WarningIcon size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <p className="text-green-700 raleway-light text-sm">{success}</p>
        )}
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
            <p className="raleway-light text-sm text-[#533113]/40">No admins found.</p>
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
                    <p className="raleway-light text-xs text-[#533113]/50">{a.email}</p>
                  </td>
                  <td className="px-5 py-3 font-mono raleway-light text-xs text-[#533113]/40 max-w-[140px] truncate">
                    {a.uid}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {a.uid === user?.uid ? (
                      <span className="raleway-light text-xs text-[#533113]/30 italic">you</span>
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
