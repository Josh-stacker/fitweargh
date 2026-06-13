import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
  ImageIcon,
  MagnifyingGlassIcon,
  ArrowsOutIcon,
} from "@phosphor-icons/react";

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
  displayImageIndex: number;
  colorImageMap: Record<string, number>;
  description: string;
  createdAt: unknown;
}

interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  discount_price: number | string | null;
  category: string;
  categories: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  stock: number;
  color_size_stock: Record<string, number> | null;
  image_url: string;
  image_path: string;
  images: string[] | null;
  image_paths: string[] | null;
  display_image_index: number | null;
  color_image_map: Record<string, number> | null;
  description: string;
  created_at: string;
}

// One slot in the multi-image editor
interface ImageSlot {
  preview: string;       // object URL (new file) or existing URL
  file: File | null;     // null = unchanged existing image
  existingUrl: string;   // original url from Firestore (empty for new)
  existingPath: string;  // original storage path (empty for new)
}

// Compress an image File to a JPEG under ~1 MB using Canvas
async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

const CATEGORIES = [
  "New Arrivals",
  "Fast Selling",
  "Shop By Category",
  "Clothing",
  "Body Shapers",
  "Accessories",
  "Sales",
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const UK_SIZE_LABELS: Record<string, string> = {
  S: "8–10", M: "10–12", L: "14–16", XL: "16–18", XXL: "20",
};
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
  { name: "Purple", hex: "#800080" },
  { name: "Nude",   hex: "#E3BC9A" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Dark Purple", hex: "#4A0E4E" },
  { name: "Sea Blue", hex: "#a9edff" },
  { name: "Butter Yellow", hex: "#FFF099" },
  { name: "Lilac",  hex: "#C8A2C8" },
  { name: "Mint Green", hex: "#98FF98" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Baby Pink", hex: "#F4C2C2" },
  { name: "Pigeon Blue", hex: "#7BA0B4" },
  { name: "Burnt Orange", hex: "#CC5500" },
];

// Map color name → hex for rendering swatches
const COLOR_HEX: Record<string, string> = Object.fromEntries(
  COLORS.map((c) => [c.name, c.hex])
);

const EMPTY_FORM = {
  name: "",
  price: "",
  discountPrice: "",
  categories: [] as string[],
  sizes: [] as string[],
  colors: [] as string[],
  colorSizeStock: {} as Record<string, number>,
  colorImageMap: {} as Record<string, number>,
  description: "",
};

const PRODUCT_IMAGE_BUCKET = "public-assets";

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price ?? 0),
    discountPrice: row.discount_price == null ? null : Number(row.discount_price),
    category: row.category ?? "",
    categories: row.categories ?? [],
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: row.stock ?? 0,
    colorSizeStock: row.color_size_stock ?? {},
    imageUrl: row.image_url ?? "",
    imagePath: row.image_path ?? "",
    images: row.images ?? [],
    imagePaths: row.image_paths ?? [],
    displayImageIndex: row.display_image_index ?? 0,
    colorImageMap: row.color_image_map ?? {},
    description: row.description ?? "",
    createdAt: row.created_at,
  };
}

function storageName(fileName: string) {
  const safeName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `products/${crypto.randomUUID()}-${safeName || "image.jpg"}`;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [displayIdx, setDisplayIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Two hidden file inputs: one for adding new images (multiple), one for replacing a single slot
  const addInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceSlotIdx = useRef<number | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch products error:", error);
      setProducts([]);
    } else {
      setProducts((data as ProductRow[]).map(productFromRow));
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const buildSlots = (p: Product): ImageSlot[] => {
    // New schema: images[] = all slots. Legacy schema (no displayImageIndex): images = slots[1..].
    const isNewSchema = p.displayImageIndex != null;
    const urls = isNewSchema
      ? (p.images ?? []).filter(Boolean)
      : [p.imageUrl, ...(p.images ?? [])].filter(Boolean);
    const paths = isNewSchema
      ? (p.imagePaths ?? []).filter(Boolean)
      : [p.imagePath, ...(p.imagePaths ?? [])].filter(Boolean);
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
    setDisplayIdx(0);
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
      colorImageMap: p.colorImageMap ?? {},
      description: p.description ?? "",
    });
    setImageSlots(buildSlots(p));
    setDisplayIdx(p.displayImageIndex ?? 0);
    setModalOpen(true);
  };

  const triggerAdd = () => {
    if (addInputRef.current) { addInputRef.current.value = ""; addInputRef.current.click(); }
  };

  const triggerReplace = (slotIdx: number) => {
    replaceSlotIdx.current = slotIdx;
    if (replaceInputRef.current) { replaceInputRef.current.value = ""; replaceInputRef.current.click(); }
  };

  // Add multiple new images
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newSlots = await Promise.all(
      files.map(async (raw) => {
        const file = await compressImage(raw);
        return { preview: URL.createObjectURL(file), file, existingUrl: "", existingPath: "" };
      })
    );
    setImageSlots((prev) => [...prev, ...newSlots]);
  };

  // Replace a single existing slot
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    const idx = replaceSlotIdx.current;
    if (idx === null) return;
    const file = await compressImage(raw);
    const preview = URL.createObjectURL(file);
    setImageSlots((prev) => prev.map((s, i) => i === idx ? { ...s, preview, file } : s));
  };

  const removeSlot = (idx: number) => {
    setImageSlots((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setDisplayIdx((d) => Math.min(d, Math.max(0, next.length - 1)));
      setForm((f) => {
        const nextMap = Object.fromEntries(
          Object.entries(f.colorImageMap)
            .map(([color, imageIdx]) => {
              if (imageIdx === idx) return null;
              return [color, imageIdx > idx ? imageIdx - 1 : imageIdx] as const;
            })
            .filter((entry): entry is readonly [string, number] => entry !== null),
        );
        return { ...f, colorImageMap: nextMap };
      });
      return next;
    });
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
    setForm((f) => {
      const isSelected = f.colors.includes(name);
      if (!isSelected) return { ...f, colors: [...f.colors, name] };

      const nextStock = Object.fromEntries(
        Object.entries(f.colorSizeStock).filter(([key]) => !key.startsWith(`${name}_`)),
      );
      const nextColorImageMap = { ...f.colorImageMap };
      delete nextColorImageMap[name];
      return {
        ...f,
        colors: f.colors.filter((x) => x !== name),
        colorSizeStock: nextStock,
        colorImageMap: nextColorImageMap,
      };
    });

  const setColorImageSlot = (colorName: string, slotIdx: number | null) => {
    setForm((f) => {
      const nextMap = { ...f.colorImageMap };
      if (slotIdx === null) {
        delete nextMap[colorName];
      } else {
        nextMap[colorName] = slotIdx;
      }
      return { ...f, colorImageMap: nextMap };
    });
  };

  const setColorSizeStock = (color: string, size: string, qty: number) => {
    const key = `${color}_${size}`;
    setForm((f) => ({
      ...f,
      colorSizeStock: { ...f.colorSizeStock, [key]: qty },
    }));
  };

  const totalStock = Object.values(form.colorSizeStock).reduce((a, b) => a + (b || 0), 0);

  const uploadSlot = async (slot: ImageSlot, index: number): Promise<{ url: string; path: string }> => {
    if (slot.file) {
      const path = storageName(`${index}_${slot.file.name}`);
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, slot.file, {
          contentType: slot.file.type,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(path);

      // Remove the old image if it was replaced
      if (slot.existingPath) {
        try {
          await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([slot.existingPath]);
        } catch (removeError) {
          console.warn("Could not remove replaced product image:", removeError);
        }
      }
      return { url: data.publicUrl, path };
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
        const removedPaths = oldPaths.filter((oldPath) => oldPath && !keptPaths.has(oldPath));
        if (removedPaths.length > 0) {
          try {
            await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(removedPaths);
          } catch (removeError) {
            console.warn("Could not remove old product images:", removeError);
          }
        }
      }

      const safeDisplayIdx = uploaded.length > 0 ? Math.min(displayIdx, uploaded.length - 1) : 0;
      // imageUrl = the chosen display image (used by product cards & product page first view)
      // allUrls / allPaths preserve full ordered list so ProductPage can reconstruct the gallery
      const allUrls = uploaded.map((u) => u.url);
      const allPaths = uploaded.map((u) => u.path);

      const computedStock = Object.values(form.colorSizeStock).reduce((a, b) => a + (b || 0), 0);
      const colorImageMap = Object.fromEntries(
        Object.entries(form.colorImageMap).filter(
          ([color, idx]) => form.colors.includes(color) && idx >= 0 && idx < uploaded.length,
        ),
      );

      const data = {
        name: form.name,
        price: Number(form.price),
        discount_price: form.discountPrice !== "" ? Number(form.discountPrice) : null,
        categories: form.categories,
        category: form.categories[0] ?? "",
        sizes: form.sizes,
        colors: form.colors,
        color_size_stock: form.colorSizeStock,
        color_image_map: colorImageMap,
        stock: computedStock,
        description: form.description,
        display_image_index: safeDisplayIdx,
        image_url: allUrls[safeDisplayIdx] ?? allUrls[0] ?? "",
        image_path: allPaths[0] ?? "",
        // images / imagePaths store ALL slots (0..N) so ProductPage can rebuild the full gallery
        images: allUrls,
        image_paths: allPaths,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from("products")
          .update(data)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert({ ...data, created_at: new Date().toISOString() });
        if (error) throw error;
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
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      const allPaths = [p.imagePath, ...(p.imagePaths ?? [])].filter(Boolean);
      if (allPaths.length > 0) {
        try {
          await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(allPaths);
        } catch (removeError) {
          console.warn("Could not remove deleted product images:", removeError);
        }
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
          <p className="raleway-regular text-base text-[#533113]/50 mt-1">
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
          className="w-full sm:w-72 pl-9 pr-4 py-2.5 border border-[#DEDEDE] raleway-regular text-base text-[#533113] outline-none focus:border-[#533113] bg-white transition-colors"
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
            <p className="raleway-regular text-base text-[#533113]/40">
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
                        <span key={cat} className="raleway-regular text-xs px-1.5 py-0.5 bg-[#F5EDE1] text-[#533113] border border-[#DEDEDE]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {p.discountPrice != null ? (
                      <div className="flex flex-col">
                        <span className="raleway-bold text-[#533113]">gh₵ {Number(p.discountPrice).toFixed(2)}</span>
                        <span className="raleway-regular text-sm text-[#533113]/40 line-through">gh₵ {Number(p.price).toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="raleway-bold text-[#533113]">gh₵ {Number(p.price).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`raleway-regular text-sm px-2.5 py-1 ${
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
                  <td className="px-5 py-3 raleway-regular text-[#533113]/60 text-sm">
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

      {/* Hidden inputs */}
      <input ref={addInputRef} type="file" accept="image/*" multiple onChange={handleAddFiles} className="hidden" />
      <input ref={replaceInputRef} type="file" accept="image/*" onChange={handleReplaceFile} className="hidden" />

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
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                    Product Images
                  </label>
                  <button
                    type="button"
                    onClick={triggerAdd}
                    className="flex items-center gap-1.5 raleway-bold text-xs text-[#533113] border border-[#533113] px-3 py-1.5 hover:bg-[#533113]/10 transition-colors uppercase tracking-widest"
                  >
                    <PlusIcon size={13} weight="bold" />
                    Add Images
                  </button>
                </div>

                {imageSlots.length === 0 ? (
                  <button
                    type="button"
                    onClick={triggerAdd}
                    className="w-full h-32 border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors flex flex-col items-center justify-center gap-2 text-[#533113]/40 hover:text-[#533113]"
                  >
                    <ImageIcon size={28} />
                    <span className="raleway-regular text-sm">Click to upload images (you can select multiple)</span>
                  </button>
                ) : (
                  <>
                    <p className="raleway-regular text-xs text-[#533113]/50">
                      Click an image to set it as the <strong>display photo</strong> (shown first on the product page). Use the pencil to replace, × to remove.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {imageSlots.map((slot, i) => {
                        const isDisplay = i === displayIdx;
                        const assignedColors = Object.entries(form.colorImageMap)
                          .filter(([, imageIdx]) => imageIdx === i)
                          .map(([color]) => color);
                        return (
                          <div key={i} className="flex flex-col items-center gap-1.5">
                            {/* Image tile */}
                            <div
                              onClick={() => setDisplayIdx(i)}
                              className={`relative group w-24 h-28 overflow-hidden bg-[#F5EDE0] cursor-pointer border-2 transition-all ${
                                isDisplay ? "border-[#533113] ring-2 ring-[#533113]/30" : "border-[#DEDEDE] hover:border-[#533113]/50"
                              }`}
                            >
                              <img src={slot.preview} alt={`img ${i + 1}`} className="w-full h-full object-cover" />

                              {/* Lightbox zoom icon on hover */}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setLightboxSrc(slot.preview); }}
                                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all opacity-0 group-hover:opacity-100"
                                title="View full size"
                              >
                                <ArrowsOutIcon size={22} className="text-white drop-shadow" />
                              </button>

                              {/* Selected star overlay */}
                              {isDisplay && (
                                <div className="absolute inset-0 bg-[#533113]/10 flex items-end justify-start p-1 pointer-events-none">
                                  <span className="text-white text-base drop-shadow">★</span>
                                </div>
                              )}

                              {/* Replace / Remove buttons */}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); triggerReplace(i); }}
                                className="absolute top-1 right-6 w-5 h-5 bg-white/80 hover:bg-white text-[#533113] flex items-center justify-center shadow-sm"
                                title="Replace image"
                              >
                                <PencilSimpleIcon size={10} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeSlot(i); }}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                                title="Remove image"
                              >
                                <XIcon size={10} />
                              </button>
                            </div>

                            {/* Label below */}
                            <span className={`raleway-bold text-[9px] uppercase tracking-widest ${isDisplay ? "text-[#533113]" : "text-[#533113]/30"}`}>
                              {isDisplay ? "★ Display" : `Photo ${i + 1}`}
                            </span>
                            <div className="w-24 min-h-5 flex flex-wrap justify-center gap-1">
                              {assignedColors.length > 0 ? (
                                assignedColors.map((colorName) => (
                                  <span
                                    key={colorName}
                                    className="w-3.5 h-3.5 rounded-full border border-black/10"
                                    style={{ backgroundColor: COLOR_HEX[colorName] ?? "#ccc" }}
                                    title={colorName}
                                  />
                                ))
                              ) : (
                                <span className="raleway-regular text-[10px] text-[#533113]/30">No color</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
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
                  Categories <span className="raleway-regular normal-case tracking-normal text-[#533113]/40">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`border px-3 py-1.5 raleway-regular text-sm transition-colors ${
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
                  <p className="raleway-regular text-sm text-red-400">Select at least one category.</p>
                )}
              </div>

              {/* Sizes */}
              <div className="flex flex-col gap-2">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-1.5 bg-[#FFFBF6] border border-[#DEDEDE] px-3 py-2 text-xs raleway-regular text-[#533113]/60">
                  <span className="raleway-bold text-[10px] text-[#533113]/80 mr-1">UK Guide:</span>
                  <span>S = 8–10</span><span className="text-[#DEDEDE]">|</span>
                  <span>M = 10–12</span><span className="text-[#DEDEDE]">|</span>
                  <span>L = 14–16</span><span className="text-[#DEDEDE]">|</span>
                  <span>XL = 16–18</span><span className="text-[#DEDEDE]">|</span>
                  <span>XXL = 20</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`border px-3 py-1 raleway-regular text-sm transition-colors ${
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 border raleway-regular text-sm transition-all ${
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

              {form.colors.length > 0 && imageSlots.length > 0 && (
                <div className="flex flex-col gap-3">
                  <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                    Color Photos
                  </label>
                  <div className="border border-[#DEDEDE] divide-y divide-[#DEDEDE]">
                    {form.colors.map((colorName) => {
                      const selectedSlot = form.colorImageMap[colorName];
                      return (
                        <div key={colorName} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 px-3 py-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: COLOR_HEX[colorName] ?? "#ccc" }}
                            />
                            <span className="raleway-bold text-sm text-[#533113] truncate">{colorName}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setColorImageSlot(colorName, null)}
                              className={`h-14 min-w-16 px-3 border raleway-regular text-xs transition-colors ${
                                selectedSlot == null
                                  ? "border-[#533113] bg-[#533113] text-white"
                                  : "border-[#DEDEDE] text-[#533113] hover:border-[#533113]"
                              }`}
                            >
                              Any
                            </button>
                            {imageSlots.map((slot, i) => (
                              <button
                                key={`${colorName}-${i}`}
                                type="button"
                                onClick={() => setColorImageSlot(colorName, i)}
                                className={`relative w-12 h-14 border-2 overflow-hidden transition-colors ${
                                  selectedSlot === i
                                    ? "border-[#533113] ring-2 ring-[#533113]/30"
                                    : "border-[#DEDEDE] hover:border-[#533113]/60"
                                }`}
                                aria-label={`${colorName} uses photo ${i + 1}`}
                                title={`Photo ${i + 1}`}
                              >
                                <img src={slot.preview} alt="" className="w-full h-full object-cover" />
                                <span className="absolute left-0 bottom-0 bg-[#533113] text-white raleway-bold text-[9px] leading-4 px-1">
                                  {i + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock by Color × Size */}
              {form.colors.length > 0 && form.sizes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                      Stock by Color &amp; Size
                    </label>
                    <span className="raleway-regular text-sm text-[#533113]/50">
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
                              <span className="block">{s}</span>
                              {UK_SIZE_LABELS[s] && (
                                <span className="block raleway-regular normal-case tracking-normal text-[10px] text-[#533113]/40 mt-0.5">
                                  UK {UK_SIZE_LABELS[s]}
                                </span>
                              )}
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
                                    className="w-16 text-center border border-[#DEDEDE] raleway-regular text-base text-[#533113] py-2 px-2 outline-none focus:border-[#533113] bg-white"
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="raleway-regular text-base text-[#533113] px-5 py-2.5 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors"
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

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <XIcon size={28} />
          </button>
          <img
            src={lightboxSrc}
            alt="Full preview"
            className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()}
          />
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
