import { useEffect, useRef, useState } from "react";
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
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../firebase";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
  ImageIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sizes: string[];
  colors: string[];
  stock: number;
  imageUrl: string;
  imagePath: string;
  images: string[];
  imagePaths: string[];
  description: string;
  createdAt: unknown;
}

// One slot in the multi-image editor
interface ImageSlot {
  preview: string;       // object URL (new file) or existing URL
  file: File | null;     // null = unchanged existing image
  existingUrl: string;   // original url from Firestore (empty for new)
  existingPath: string;  // original storage path (empty for new)
}

const CATEGORIES = ["Women's", "Men's", "Sports", "Body Shapers", "Accessories"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = ["#000000", "#FFFFFF", "#ef4444", "#00864A", "#533113", "#3b82f6", "#f97316", "#ec4899"];

const EMPTY_FORM = {
  name: "",
  price: "",
  category: "Women's",
  sizes: [] as string[],
  colors: [] as string[],
  stock: "",
  description: "",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // We use a single hidden file input and track which slot index triggered it
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSlotIdx = useRef<number | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const buildSlots = (p: Product): ImageSlot[] => {
    const urls = [p.imageUrl, ...(p.images ?? [])].filter(Boolean);
    const paths = [p.imagePath, ...(p.imagePaths ?? [])].filter(Boolean);
    return urls.map((url, i) => ({
      preview: url,
      file: null,
      existingUrl: url,
      existingPath: paths[i] ?? "",
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageSlots([]);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      category: p.category,
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      stock: String(p.stock),
      description: p.description ?? "",
    });
    setImageSlots(buildSlots(p));
    setModalOpen(true);
  };

  // Click a slot or the add-new tile
  const triggerFileInput = (slotIdx: number | null) => {
    pendingSlotIdx.current = slotIdx;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const idx = pendingSlotIdx.current;

    if (idx === null) {
      // Add new slot
      setImageSlots((prev) => [
        ...prev,
        { preview, file, existingUrl: "", existingPath: "" },
      ]);
    } else {
      // Replace existing slot
      setImageSlots((prev) =>
        prev.map((s, i) =>
          i === idx ? { ...s, preview, file } : s
        )
      );
    }
  };

  const removeSlot = (idx: number) => {
    setImageSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSize = (s: string) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));

  const toggleColor = (c: string) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(c) ? f.colors.filter((x) => x !== c) : [...f.colors, c],
    }));

  const uploadSlot = async (slot: ImageSlot, index: number): Promise<{ url: string; path: string }> => {
    if (slot.file) {
      const path = `products/${Date.now()}_${index}_${slot.file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, slot.file);
      const url = await getDownloadURL(storageRef);
      // Remove the old image if it was replaced
      if (slot.existingPath) {
        try { await deleteObject(ref(storage, slot.existingPath)); } catch {}
      }
      return { url, path };
    }
    // Unchanged existing image
    return { url: slot.existingUrl, path: slot.existingPath };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload all slots in parallel
      const uploaded = await Promise.all(imageSlots.map((s, i) => uploadSlot(s, i)));

      // Delete any images that were removed from the editing product
      if (editing) {
        const oldPaths = [editing.imagePath, ...(editing.imagePaths ?? [])].filter(Boolean);
        const keptPaths = new Set(uploaded.map((u) => u.path));
        for (const oldPath of oldPaths) {
          if (oldPath && !keptPaths.has(oldPath)) {
            try { await deleteObject(ref(storage, oldPath)); } catch {}
          }
        }
      }

      const [primary, ...extras] = uploaded;

      const data = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        sizes: form.sizes,
        colors: form.colors,
        stock: Number(form.stock),
        description: form.description,
        imageUrl: primary?.url ?? "",
        imagePath: primary?.path ?? "",
        images: extras.map((u) => u.url),
        imagePaths: extras.map((u) => u.path),
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "products", editing.id), data);
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    setDeleteId(p.id);
    try {
      await deleteDoc(doc(db, "products", p.id));
      const allPaths = [p.imagePath, ...(p.imagePaths ?? [])].filter(Boolean);
      for (const path of allPaths) {
        try { await deleteObject(ref(storage, path)); } catch {}
      }
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Products</h2>
          <p className="raleway-light text-sm text-[#533113]/50 mt-1">
            {products.length} total listings
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#533113] text-white px-5 py-2.5 raleway-bold text-sm uppercase tracking-widest hover:bg-[#3d2409] transition-colors self-start sm:self-auto"
        >
          <PlusIcon size={16} weight="bold" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#533113]/40" />
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-[#DEDEDE] raleway-light text-sm text-[#533113] outline-none focus:border-[#533113] bg-white transition-colors"
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
            <PackageEmpty />
            <p className="raleway-light text-sm text-[#533113]/40">
              {search ? "No products match your search." : "No products yet. Add your first one!"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                {["Image", "Name", "Category", "Price", "Stock", "Sizes", "Actions"].map((h) => (
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
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors">
                  <td className="px-5 py-3">
                    <div className="relative">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-12 h-14 object-cover border border-[#DEDEDE]"
                        />
                      ) : (
                        <div className="w-12 h-14 bg-[#F5EDE1] flex items-center justify-center">
                          <ImageIcon size={18} className="text-[#533113]/30" />
                        </div>
                      )}
                      {/* Badge showing extra image count */}
                      {(p.images?.length ?? 0) > 0 && (
                        <span className="absolute -bottom-1 -right-1 bg-[#533113] text-white raleway-bold text-[9px] px-1 leading-4">
                          +{p.images.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 raleway-bold text-[#533113] max-w-[180px] truncate">
                    {p.name}
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/70">{p.category}</td>
                  <td className="px-5 py-3 raleway-bold text-[#533113]">
                    gh₵ {Number(p.price).toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`raleway-light text-xs px-2.5 py-1 ${
                        p.stock > 10
                          ? "bg-green-100 text-green-700"
                          : p.stock > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/60 text-xs">
                    {p.sizes?.join(", ") || "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 hover:bg-[#533113]/10 transition-colors text-[#533113]"
                        title="Edit"
                      >
                        <PencilSimpleIcon size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deleteId === p.id}
                        className="p-2 hover:bg-red-50 transition-colors text-red-500 disabled:opacity-40"
                        title="Delete"
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

      {/* Hidden file input shared by all image slots */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChosen}
        className="hidden"
      />

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl border border-[#DEDEDE] flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
              <h3 className="raleway-bold text-base text-[#533113]">
                {editing ? "Edit Product" : "Add Product"}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <XIcon size={20} className="text-[#533113]" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

              {/* Multi-image upload */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                    Product Images
                  </label>
                  <span className="raleway-light text-xs text-[#533113]/40">
                    First image is the primary · drag to reorder
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* Existing + new slots */}
                  {imageSlots.map((slot, i) => (
                    <div
                      key={i}
                      className="relative group w-24 h-28 border border-[#DEDEDE] overflow-hidden bg-[#F5EDE0] cursor-pointer"
                      onClick={() => triggerFileInput(i)}
                    >
                      <img src={slot.preview} alt={`img ${i + 1}`} className="w-full h-full object-cover" />

                      {/* Primary badge */}
                      {i === 0 && (
                        <span className="absolute top-1 left-1 bg-[#533113] text-white raleway-bold text-[9px] px-1.5 py-0.5 leading-tight">
                          Primary
                        </span>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="raleway-light text-white text-[10px]">Replace</span>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XIcon size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Add-new tile */}
                  <button
                    type="button"
                    onClick={() => triggerFileInput(null)}
                    className="w-24 h-28 border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors flex flex-col items-center justify-center gap-1.5 text-[#533113]/40 hover:text-[#533113]"
                  >
                    <PlusIcon size={20} />
                    <span className="raleway-light text-[10px]">Add image</span>
                  </button>
                </div>

                {imageSlots.length === 0 && (
                  <p className="raleway-light text-xs text-[#533113]/40">
                    No images yet — click "Add image" to upload.
                  </p>
                )}
              </div>

              {/* Name */}
              <Field label="Product Name">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Women's Sports Bra"
                  className="input-base"
                />
              </Field>

              {/* Price + Stock row */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (gh₵)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="120.00"
                    className="input-base"
                  />
                </Field>
                <Field label="Stock Quantity">
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="50"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* Category */}
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="input-base cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              {/* Sizes */}
              <div className="flex flex-col gap-2">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`border px-3 py-1 raleway-light text-xs transition-colors ${
                        form.sizes.includes(s)
                          ? "bg-[#533113] text-white border-[#533113]"
                          : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="flex flex-col gap-2">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Available Colors
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.colors.includes(c)
                          ? "ring-2 ring-[#533113] ring-offset-2 scale-110"
                          : "border border-[#DEDEDE] hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Product description…"
                  className="input-base resize-none"
                />
              </Field>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 shrink-0">
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
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function PackageEmpty() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#533113]/20">
      <rect x="8" y="16" width="32" height="26" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16V12a8 8 0 0116 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 22h32" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
