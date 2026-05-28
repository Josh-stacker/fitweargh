import { useEffect, useRef, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import {
  ImageIcon,
  FloppyDiskIcon,
  XIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@phosphor-icons/react";

// Firestore doc: siteSettings/homepage
interface HomepageDoc {
  heroMode: "slider" | "still";
  heroStillImageUrl: string;
  heroStillImagePath: string;
  sections: {
    newArrivals: string[];    // product IDs, empty = auto latest
    fastSelling: string[];
    shopByCategory: string[];
    accessories: string[];
  };
  updatedAt: unknown;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  discountPrice?: number | null;
}

const SECTION_LABELS: Record<string, string> = {
  newArrivals: "New Arrivals",
  fastSelling: "Fast Selling",
  shopByCategory: "Shop By Category",
  accessories: "Accessories",
};

const SECTION_HINTS: Record<string, string> = {
  newArrivals: "Leave empty to auto-show the latest products",
  fastSelling: "Leave empty to auto-show latest products",
  shopByCategory: "Leave empty to auto-show latest products",
  accessories: "Leave empty to auto-show Accessories products",
};

type SectionKey = "newArrivals" | "fastSelling" | "shopByCategory" | "accessories";
const SECTIONS: SectionKey[] = ["newArrivals", "fastSelling", "shopByCategory", "accessories"];

const DEFAULT_SECTIONS = {
  newArrivals: [] as string[],
  fastSelling: [] as string[],
  shopByCategory: [] as string[],
  accessories: [] as string[],
};

export default function HomepageSettings() {
  const [heroMode, setHeroMode] = useState<"slider" | "still">("slider");
  const [stillImageUrl, setStillImageUrl] = useState("");
  const [stillImagePath, setStillImagePath] = useState("");
  const [stillFile, setStillFile] = useState<File | null>(null);
  const [stillPreview, setStillPreview] = useState("");
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>("newArrivals");
  const [pickerOpen, setPickerOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const stillRef = useRef<HTMLInputElement>(null);

  // Load existing settings, size chart, and all products
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [settingsSnap, productsSnap] = await Promise.all([
        getDoc(doc(db, "siteSettings", "homepage")),
        getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"))),
      ]);

      if (settingsSnap.exists()) {
        const d = settingsSnap.data() as HomepageDoc;
        setHeroMode(d.heroMode ?? "slider");
        setStillImageUrl(d.heroStillImageUrl ?? "");
        setStillImagePath(d.heroStillImagePath ?? "");
        setStillPreview(d.heroStillImageUrl ?? "");
        setSections({
          newArrivals: d.sections?.newArrivals ?? [],
          fastSelling: d.sections?.fastSelling ?? [],
          shopByCategory: d.sections?.shopByCategory ?? [],
          accessories: d.sections?.accessories ?? [],
        });
      }

      setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    };
    load();
  }, []);

  const handleStillFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStillFile(file);
    setStillPreview(URL.createObjectURL(file));
  };

  const toggleProduct = (productId: string) => {
    setSections((prev) => {
      const current = prev[activeSection];
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      return { ...prev, [activeSection]: next };
    });
  };

  const clearSection = (key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: [] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = stillImageUrl;
      let imagePath = stillImagePath;

      if (stillFile) {
        const path = `siteSettings/heroStill_${Date.now()}_${stillFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, stillFile);
        imageUrl = await getDownloadURL(storageRef);
        if (stillImagePath) {
          try { await deleteObject(ref(storage, stillImagePath)); } catch {}
        }
        imagePath = path;
        setStillImageUrl(imageUrl);
        setStillImagePath(imagePath);
        setStillFile(null);
      }

      await setDoc(doc(db, "siteSettings", "homepage"), {
        heroMode,
        heroStillImageUrl: imageUrl,
        heroStillImagePath: imagePath,
        sections,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Homepage Settings</h2>
          <p className="raleway-regular text-base text-[#533113]/50 mt-1">
            Control the hero, sections, and which products appear where
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#533113] text-white px-5 py-2.5 raleway-bold text-sm uppercase tracking-widest hover:bg-[#3d2409] transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <FloppyDiskIcon size={16} weight="bold" />
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {/* ── Hero Mode ── */}
      <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-5">
        <h3 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest border-b border-[#DEDEDE] pb-3">
          Hero Section
        </h3>

        {/* Mode toggle */}
        <div className="flex flex-col gap-2">
          <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
            Display Mode
          </label>
          <div className="flex gap-3">
            {(["slider", "still"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setHeroMode(mode)}
                className={`flex-1 py-3 raleway-bold text-sm uppercase tracking-widest border transition-colors ${
                  heroMode === mode
                    ? "bg-[#533113] text-white border-[#533113]"
                    : "text-[#533113] border-[#DEDEDE] hover:bg-[#533113]/5"
                }`}
              >
                {mode === "slider" ? "Slider (multiple slides)" : "Still Image (single photo)"}
              </button>
            ))}
          </div>
          <p className="raleway-regular text-sm text-[#533113]/50">
            {heroMode === "slider"
              ? "Uses slides configured in Hero Slides. Falls back to static image if none are active."
              : "Shows a single static image — no slides."}
          </p>
        </div>

        {/* Still image upload — only shown in still mode */}
        {heroMode === "still" && (
          <div className="flex flex-col gap-2">
            <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
              Still Hero Image
            </label>
            <div
              onClick={() => stillRef.current?.click()}
              className="border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors cursor-pointer flex items-center justify-center h-48 overflow-hidden"
            >
              {stillPreview ? (
                <img src={stillPreview} alt="still hero" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#533113]/40">
                  <ImageIcon size={32} />
                  <span className="raleway-regular text-sm">Click to upload hero image</span>
                </div>
              )}
            </div>
            <input
              ref={stillRef}
              type="file"
              accept="image/*"
              onChange={handleStillFile}
              className="hidden"
            />
            {stillPreview && (
              <button
                type="button"
                onClick={() => { setStillPreview(""); setStillFile(null); setStillImageUrl(""); }}
                className="self-start flex items-center gap-1.5 text-red-500 raleway-regular text-sm hover:text-red-700"
              >
                <XIcon size={12} /> Remove image
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Section Product Manager ── */}
      <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-5">
        <div>
          <h3 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest border-b border-[#DEDEDE] pb-3">
            Homepage Sections
          </h3>
          <p className="raleway-regular text-sm text-[#533113]/50 mt-2">
            Pin specific products to each section. Leave a section empty to auto-populate from Firestore.
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex gap-0 border border-[#DEDEDE] overflow-x-auto">
          {SECTIONS.map((key) => (
            <button
              key={key}
              onClick={() => { setActiveSection(key); setSearch(""); setPickerOpen(true); }}
              className={`flex-1 min-w-max px-4 py-2.5 raleway-bold text-xs uppercase tracking-widest border-r last:border-r-0 border-[#DEDEDE] transition-colors ${
                activeSection === key && pickerOpen
                  ? "bg-[#533113] text-white"
                  : "text-[#533113] hover:bg-[#533113]/5"
              }`}
            >
              {SECTION_LABELS[key]}
              {sections[key].length > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeSection === key && pickerOpen ? "bg-white/20" : "bg-[#533113]/10"
                }`}>
                  {sections[key].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Section summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTIONS.map((key) => {
            const pinned = sections[key];
            const pinnedProducts = products.filter((p) => pinned.includes(p.id));
            return (
              <div key={key} className="border border-[#DEDEDE] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                    {SECTION_LABELS[key]}
                  </span>
                  {pinned.length > 0 && (
                    <button
                      onClick={() => clearSection(key)}
                      className="raleway-regular text-sm text-red-500 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {pinned.length === 0 ? (
                  <p className="raleway-regular text-sm text-[#533113]/40 italic">
                    {SECTION_HINTS[key]}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pinnedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-1.5 bg-[#F5EDE1] px-2 py-1"
                      >
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt={p.name} className="w-6 h-7 object-cover" />
                        )}
                        <span className="raleway-regular text-sm text-[#533113] max-w-[100px] truncate">
                          {p.name}
                        </span>
                        <button
                          onClick={() => toggleProduct(p.id)}
                          className="text-[#533113]/40 hover:text-red-500 ml-0.5"
                        >
                          <XIcon size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { setActiveSection(key); setSearch(""); setPickerOpen(true); }}
                  className="self-start raleway-bold text-xs text-[#533113] underline underline-offset-2 hover:text-[#3d2409]"
                >
                  {pinned.length === 0 ? "Pin products →" : "Edit picks →"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Product picker panel */}
        {pickerOpen && (
          <div className="border border-[#533113] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="raleway-bold text-sm text-[#533113]">
                Picking for: <span className="text-[#533113]">{SECTION_LABELS[activeSection]}</span>
              </span>
              <button onClick={() => setPickerOpen(false)}>
                <XIcon size={18} className="text-[#533113]" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#533113]/40" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-[#DEDEDE] raleway-regular text-sm text-[#533113] outline-none focus:border-[#533113]"
              />
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto">
              {filteredProducts.map((p) => {
                const selected = sections[activeSection].includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`relative flex flex-col border transition-all text-left ${
                      selected
                        ? "border-[#533113] ring-1 ring-[#533113]"
                        : "border-[#DEDEDE] hover:border-[#533113]/50"
                    }`}
                  >
                    <div className="w-full aspect-[3/4] bg-[#F5EDE0] overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={20} className="text-[#533113]/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="raleway-bold text-[10px] text-[#533113] leading-tight truncate">{p.name}</p>
                      <p className="raleway-regular text-xs text-[#533113]/50">{p.category}</p>
                    </div>
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#533113] flex items-center justify-center">
                        <CheckIcon size={12} weight="bold" className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="col-span-full raleway-regular text-sm text-[#533113]/40 text-center py-6">
                  No products found.
                </p>
              )}
            </div>

            <p className="raleway-regular text-sm text-[#533113]/50">
              {sections[activeSection].length} product{sections[activeSection].length !== 1 ? "s" : ""} pinned to {SECTION_LABELS[activeSection]}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
