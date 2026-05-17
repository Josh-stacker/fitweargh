import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { PlusIcon, PencilSimpleIcon, TrashIcon, XIcon, TagIcon } from "@phosphor-icons/react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
}

const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export default function Categories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchCats = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "categories"), orderBy("name")));
    setCats(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
    setLoading(false);
  };

  useEffect(() => { fetchCats(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "" });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        name: form.name,
        slug: toSlug(form.name),
        description: form.description,
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(doc(db, "categories", editing.id), data);
      } else {
        await addDoc(collection(db, "categories"), { ...data, productCount: 0, createdAt: serverTimestamp() });
      }
      setModalOpen(false);
      fetchCats();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await deleteDoc(doc(db, "categories", id));
      setCats((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Categories</h2>
          <p className="raleway-light text-sm text-[#533113]/50 mt-1">{cats.length} categories</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#533113] text-white px-5 py-2.5 raleway-bold text-sm uppercase tracking-widest hover:bg-[#3d2409] transition-colors self-start sm:self-auto"
        >
          <PlusIcon size={16} weight="bold" />
          Add Category
        </button>
      </div>

      <div className="bg-white border border-[#DEDEDE]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <TagIcon size={40} className="text-[#533113]/20" />
            <p className="raleway-light text-sm text-[#533113]/40">No categories yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                {["Name", "Slug", "Description", "Products", "Actions"].map((h) => (
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
              {cats.map((c) => (
                <tr key={c.id} className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors">
                  <td className="px-5 py-3 raleway-bold text-[#533113]">{c.name}</td>
                  <td className="px-5 py-3 font-mono raleway-light text-xs text-[#533113]/60">
                    {c.slug}
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/70 max-w-[200px] truncate">
                    {c.description || "—"}
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/70 text-center">
                    {c.productCount ?? 0}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 hover:bg-[#533113]/10 transition-colors text-[#533113]"
                      >
                        <PencilSimpleIcon size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleteId === c.id}
                        className="p-2 hover:bg-red-50 transition-colors text-red-500 disabled:opacity-40"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md border border-[#DEDEDE]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE]">
              <h3 className="raleway-bold text-base text-[#533113]">
                {editing ? "Edit Category" : "Add Category"}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <XIcon size={20} className="text-[#533113]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Body Shapers"
                  className="input-base"
                />
                {form.name && (
                  <p className="raleway-light text-xs text-[#533113]/50">
                    Slug: <span className="font-mono">{toSlug(form.name)}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Short description…"
                  className="input-base resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="raleway-light text-sm text-[#533113] px-5 py-2.5 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="raleway-bold text-sm text-white bg-[#533113] px-6 py-2.5 uppercase tracking-widest hover:bg-[#3d2409] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
