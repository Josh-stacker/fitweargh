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

interface SizeChartRow {
  size: string;
  [col: string]: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  category: string;
  categories: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  colorSizeStock: Record<string, number>;
  imageUrl: string;
  imagePath: string;
  images: string[];
  imagePaths: string[];
  description: string;
  sizeChartMode: "standard" | "custom" | "none";
  customSizeChartColumns: string[];
  customSizeChartRows: SizeChartRow[];
  createdAt: unknown;
}

// One slot in the multi-image editor
interface ImageSlot {
  preview: string;       // object URL (new file) or existing URL
  file: File | null;     // null = unchanged existing image
  existingUrl: string;   // original url from Firestore (empty for new)
  existingPath: string;  // original storage path (empty for new)
}

const CATEGORIES = [
  "New Arrivals",
  "Fast Selling",
  "Shop By Category",
  "Clothing",
  "Body Shapers",
  "Accessories",
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS: { name: string; hex: string }[] = [
  { name: "Black",  hex: "#000000" },
  { name: "White",  hex: "#FFFFFF" },
  { name: "Red",    hex: "#ef4444" },
  { name: "Green",  hex: "#00864A" },
  { name: "Brown",  hex: "#533113" },
  { name: "Blue",   hex: "#3b82f6" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink",   hex: "#ec4899" },
  { name: "Navy",   hex: "#1e3a5f" },
  { name: "Grey",   hex: "#6b7280" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Purple", hex: "#a855f7" },
];

// Map color name → hex for rendering swatches
const COLOR_HEX: Record<string, string> = Object.fromEntries(
  COLORS.map((c) => [c.name, c.hex])
);

const DEFAULT_CHART_COLS = ["Chest (in)", "Waist (in)", "Hips (in)"];
const DEFAULT_CHART_ROWS: SizeChartRow[] = [
  { size: "XS", "Chest (in)": "30–32", "Waist (in)": "24–26", "Hips (in)": "34–36" },
  { size: "S",  "Chest (in)": "32–34", "Waist (in)": "26–28", "Hips (in)": "36–38" },
  { size: "M",  "Chest (in)": "34–36", "Waist (in)": "28–30", "Hips (in)": "38–40" },
  { size: "L",  "Chest (in)": "36–38", "Waist (in)": "30–32", "Hips (in)": "40–42" },
  { size: "XL", "Chest (in)": "38–40", "Waist (in)": "32–34", "Hips (in)": "42–44" },
  { size: "XXL","Chest (in)": "40–42", "Waist (in)": "34–36", "Hips (in)": "44–46" },
];

const EMPTY_FORM = {
  name: "",
  price: "",
  discountPrice: "",
  categories: [] as string[],
  sizes: [] as string[],
  colors: [] as string[],           // stored as color names e.g. ["Black", "White"]
  colorSizeStock: {} as Record<string, number>,  // key: "ColorName_Size"
  description: "",
  sizeChartMode: "standard" as "standard" | "custom" | "none",
  customSizeChartColumns: DEFAULT_CHART_COLS as string[],
  customSizeChartRows: DEFAULT_CHART_ROWS as SizeChartRow[],
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
      discountPrice: p.discountPrice != null ? String(p.discountPrice) : "",
      categories: p.categories?.length ? p.categories : (p.category ? [p.category] : []),
      sizes: p.sizes ?? [],
      colors: p.colors ?? [],
      colorSizeStock: p.colorSizeStock ?? {},
      description: p.description ?? "",
      sizeChartMode: p.sizeChartMode ?? "standard",
      customSizeChartColumns: p.customSizeChartColumns?.length ? p.customSizeChartColumns : DEFAULT_CHART_COLS,
      customSizeChartRows: p.customSizeChartRows?.length ? p.customSizeChartRows : DEFAULT_CHART_ROWS,
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

  const toggleCategory = (cat: string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((x) => x !== cat)
        : [...f.categories, cat],
    }));

  const toggleSize = (s: string) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s],
    }));

  const toggleColor = (name: string) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(name) ? f.colors.filter((x) => x !== name) : [...f.colors, name],
    }));

  const setColorSizeStock = (color: string, size: string, qty: number) => {
    const key = `${color}_${size}`;
    setForm((f) => ({
      ...f,
      colorSizeStock: { ...f.colorSizeStock, [key]: qty },
    }));
  };

  const totalStock = Object.values(form.colorSizeStock).reduce((a, b) => a + (b || 0), 0);

  // Custom size chart helpers
  const [newChartCol, setNewChartCol] = useState("");

  const addCustomCol = () => {
    const name = newChartCol.trim();
    if (!name || form.customSizeChartColumns.includes(name)) return;
    setForm((f) => ({
      ...f,
      customSizeChartColumns: [...f.customSizeChartColumns, name],
      customSizeChartRows: f.customSizeChartRows.map((r) => ({ ...r, [name]: "" })),
    }));
    setNewChartCol("");
  };

  const removeCustomCol = (col: string) => {
    setForm((f) => ({
      ...f,
      customSizeChartColumns: f.customSizeChartColumns.filter((c) => c !== col),
      customSizeChartRows: f.customSizeChartRows.map((r) => {
        const { [col]: _, ...rest } = r; return rest as SizeChartRow;
      }),
    }));
  };

  const removeCustomRow = (i: number) =>
    setForm((f) => ({ ...f, customSizeChartRows: f.customSizeChartRows.filter((_, idx) => idx !== i) }));

  const updateCustomCell = (rowIdx: number, col: string, val: string) =>
    setForm((f) => ({
      ...f,
      customSizeChartRows: f.customSizeChartRows.map((r, i) =>
        i === rowIdx ? { ...r, [col]: val } : r
      ),
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

      const computedStock = Object.values(form.colorSizeStock).reduce((a, b) => a + (b || 0), 0);

      const data = {
        name: form.name,
        price: Number(form.price),
        discountPrice: form.discountPrice !== "" ? Number(form.discountPrice) : null,
        categories: form.categories,
        category: form.categories[0] ?? "",
        sizes: form.sizes,
        colors: form.colors,
        colorSizeStock: form.colorSizeStock,
        stock: computedStock,
        description: form.description,
        sizeChartMode: form.sizeChartMode,
        customSizeChartColumns: form.sizeChartMode === "custom" ? form.customSizeChartColumns : [],
        customSizeChartRows: form.sizeChartMode === "custom" ? form.customSizeChartRows : [],
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

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const cats = p.categories?.length ? p.categories : p.category ? [p.category] : [];
    return (
      p.name.toLowerCase().includes(q) ||
      cats.some((c) => c.toLowerCase().includes(q))
    );
  });

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
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.categories?.length ? p.categories : p.category ? [p.category] : []).map((cat) => (
                        <span key={cat} className="raleway-light text-[10px] px-1.5 py-0.5 bg-[#F5EDE1] text-[#533113] border border-[#DEDEDE]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {p.discountPrice != null ? (
                      <div className="flex flex-col">
                        <span className="raleway-bold text-[#533113]">gh₵ {Number(p.discountPrice).toFixed(2)}</span>
                        <span className="raleway-light text-xs text-[#533113]/40 line-through">gh₵ {Number(p.price).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="raleway-bold text-[#533113]">gh₵ {Number(p.price).toFixed(2)}</span>
                    )}
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
                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white raleway-bold text-xs uppercase tracking-widest px-4 py-2 transition-colors disabled:opacity-40"
                      >
                        <TrashIcon size={14} weight="bold" />
                        {deleteId === p.id ? "Deleting…" : "Delete"}
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

              {/* Price + Discount row */}
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
                <Field label="Discount Price (gh₵) — optional">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountPrice}
                    onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                    placeholder="Leave blank for no discount"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* Categories */}
              <div className="flex flex-col gap-2">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Categories <span className="raleway-light normal-case tracking-normal text-[#533113]/40">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`border px-3 py-1.5 raleway-light text-xs transition-colors ${
                        form.categories.includes(cat)
                          ? "bg-[#533113] text-white border-[#533113]"
                          : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {form.categories.length === 0 && (
                  <p className="raleway-light text-xs text-red-400">Select at least one category.</p>
                )}
              </div>

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
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(({ name, hex }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleColor(name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border raleway-light text-xs transition-all ${
                        form.colors.includes(name)
                          ? "bg-[#533113] text-white border-[#533113]"
                          : "text-[#533113] border-[#DEDEDE] hover:border-[#533113]"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock by Color × Size */}
              {form.colors.length > 0 && form.sizes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                      Stock by Color &amp; Size
                    </label>
                    <span className="raleway-light text-xs text-[#533113]/50">
                      Total: {totalStock} pcs
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-[#DEDEDE]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#FFFBF6] border-b border-[#DEDEDE]">
                          <th className="raleway-bold text-[#533113]/60 text-left px-3 py-3 uppercase tracking-widest">
                            Color
                          </th>
                          {form.sizes.map((s) => (
                            <th key={s} className="raleway-bold text-[#533113]/60 px-3 py-3 uppercase tracking-widest text-center min-w-[80px]">
                              {s}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.colors.map((colorName) => (
                          <tr key={colorName} className="border-b border-[#DEDEDE]/60">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: COLOR_HEX[colorName] ?? "#ccc" }}
                                />
                                <span className="raleway-bold text-sm text-[#533113]">{colorName}</span>
                              </div>
                            </td>
                            {form.sizes.map((s) => {
                              const key = `${colorName}_${s}`;
                              return (
                                <td key={s} className="px-2 py-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={form.colorSizeStock[key] ?? ""}
                                    onChange={(e) => setColorSizeStock(colorName, s, Number(e.target.value))}
                                    placeholder="0"
                                    className="w-16 text-center border border-[#DEDEDE] raleway-light text-sm text-[#533113] py-2 px-2 outline-none focus:border-[#533113] bg-white"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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

              {/* Size Chart */}
              <div className="flex flex-col gap-3">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Size Chart
                </label>
                <div className="flex gap-2">
                  {(["standard", "custom", "none"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, sizeChartMode: mode }))}
                      className={`flex-1 py-2 raleway-bold text-xs uppercase tracking-widest border transition-colors ${
                        form.sizeChartMode === mode
                          ? "bg-[#533113] text-white border-[#533113]"
                          : "text-[#533113] border-[#DEDEDE] hover:bg-[#533113]/5"
                      }`}
                    >
                      {mode === "standard" ? "Standard" : mode === "custom" ? "Custom" : "None"}
                    </button>
                  ))}
                </div>
                <p className="raleway-light text-xs text-[#533113]/50">
                  {form.sizeChartMode === "standard"
                    ? "Uses the standard chart set in Homepage Settings."
                    : form.sizeChartMode === "custom"
                    ? "This product has its own size chart."
                    : "No size chart shown on this product page."}
                </p>

                {form.sizeChartMode === "custom" && (
                  <div className="flex flex-col gap-4 border border-[#DEDEDE] p-4">

                    {/* Row sizes — toggle chips */}
                    <div className="flex flex-col gap-2">
                      <span className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Sizes (rows)</span>
                      <div className="flex flex-wrap gap-2">
                        {SIZES.map((s) => {
                          const active = form.customSizeChartRows.some((r) => r.size === s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                if (active) {
                                  removeCustomRow(form.customSizeChartRows.findIndex((r) => r.size === s));
                                } else {
                                  const blank: SizeChartRow = { size: s };
                                  form.customSizeChartColumns.forEach((c) => { blank[c] = ""; });
                                  setForm((f) => ({
                                    ...f,
                                    customSizeChartRows: [...f.customSizeChartRows, blank].sort(
                                      (a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size)
                                    ),
                                  }));
                                }
                              }}
                              className={`border px-3 py-1 raleway-light text-xs transition-colors ${
                                active
                                  ? "bg-[#533113] text-white border-[#533113]"
                                  : "text-[#533113] border-[#533113] hover:bg-[#533113]/10"
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Columns — add/remove chips */}
                    <div className="flex flex-col gap-2">
                      <span className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Measurements (columns)</span>
                      <div className="flex flex-wrap gap-2">
                        {form.customSizeChartColumns.map((col) => (
                          <span
                            key={col}
                            className="flex items-center gap-1.5 bg-[#533113] text-white raleway-light text-xs px-3 py-1 border border-[#533113]"
                          >
                            {col}
                            <button type="button" onClick={() => removeCustomCol(col)} className="opacity-70 hover:opacity-100">
                              <XIcon size={10} />
                            </button>
                          </span>
                        ))}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newChartCol}
                            onChange={(e) => setNewChartCol(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCol())}
                            placeholder="e.g. Chest (in)"
                            className="border border-[#533113] raleway-light text-xs text-[#533113] px-2.5 py-1 outline-none focus:border-[#533113] w-36"
                          />
                          <button
                            type="button"
                            onClick={addCustomCol}
                            className="border border-[#533113] text-[#533113] raleway-bold text-xs uppercase tracking-widest px-3 py-1 hover:bg-[#533113]/10 transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Measurement table — only shown when both rows and columns exist */}
                    {form.customSizeChartRows.length > 0 && form.customSizeChartColumns.length > 0 && (
                      <div className="overflow-x-auto border border-[#DEDEDE]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#FFFBF6] border-b border-[#DEDEDE]">
                              <th className="raleway-bold text-[#533113]/60 text-left px-3 py-2 uppercase tracking-widest">Size</th>
                              {form.customSizeChartColumns.map((col) => (
                                <th key={col} className="raleway-bold text-[#533113]/60 px-3 py-2 text-left uppercase tracking-widest whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {form.customSizeChartRows.map((row, i) => (
                              <tr key={row.size} className="border-b border-[#DEDEDE]/60">
                                <td className="px-3 py-2">
                                  <span className="raleway-bold text-[#533113]">{row.size}</span>
                                </td>
                                {form.customSizeChartColumns.map((col) => (
                                  <td key={col} className="px-2 py-1.5">
                                    <input
                                      value={row[col] ?? ""}
                                      onChange={(e) => updateCustomCell(i, col, e.target.value)}
                                      placeholder="—"
                                      className="w-24 border border-[#DEDEDE] raleway-light text-[#533113] py-1 px-2 outline-none focus:border-[#533113] text-xs bg-white"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
