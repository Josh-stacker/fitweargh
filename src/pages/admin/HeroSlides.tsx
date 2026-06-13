import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
  ImageIcon,
  InfoIcon,
} from "@phosphor-icons/react";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../lib/cropImage";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  cta_text: string;
  bg_image_url: string;
  bg_image_path: string;
  image1_url: string;
  image1_path: string;
  image2_url: string;
  image2_path: string;
  bg_position: string;
  display_order: number;
  active: boolean;
  page: string;
  created_at: string;
}

const PAGES = [
  "Homepage",
  "New Arrivals",
  "Clothing",
  "Body Shapers",
  "Accessories",
  "Sales",
];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  badge: "",
  cta_text: "Shop Now",
  bg_position: "50% 40%",
  display_order: 0,
  active: true,
  page: "Homepage",
};

type SlideForm = typeof EMPTY_FORM;

export default function HeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<SlideForm>(EMPTY_FORM);

  // Image state
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [originalBgFile, setOriginalBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState("");
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img1Preview, setImg1Preview] = useState("");
  const [img2File, setImg2File] = useState<File | null>(null);
  const [img2Preview, setImg2Preview] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Cropper state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"bg" | "img1" | "img2" | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const bgRef = useRef<HTMLInputElement>(null);
  const img1Ref = useRef<HTMLInputElement>(null);
  const img2Ref = useRef<HTMLInputElement>(null);

  const fetchSlides = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hero_slides")
      .select("*")
      .order("page", { ascending: true })
      .order("display_order", { ascending: true });
    if (data) setSlides(data as HeroSlide[]);
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  // Auto-set display_order to next available for the page
  const getNextOrder = (page: string) => {
    const pageSlides = slides.filter((s) => s.page === page);
    return pageSlides.length > 0
      ? Math.max(...pageSlides.map((s) => s.display_order ?? 0)) + 1
      : 1;
  };

  const openCreate = () => {
    setEditing(null);
    const nextOrder = getNextOrder(EMPTY_FORM.page);
    setForm({ ...EMPTY_FORM, display_order: nextOrder });
    setBgFile(null); setOriginalBgFile(null); setBgPreview("");
    setImg1File(null); setImg1Preview("");
    setImg2File(null); setImg2Preview("");
    setModalOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      badge: s.badge ?? "",
      cta_text: s.cta_text ?? "Shop Now",
      bg_position: s.bg_position ?? "50% 40%",
      display_order: s.display_order ?? 0,
      active: s.active ?? true,
      page: s.page ?? "Homepage",
    });
    setBgFile(null); setOriginalBgFile(null); setBgPreview(s.bg_image_url ?? "");
    setImg1File(null); setImg1Preview(s.image1_url ?? "");
    setImg2File(null); setImg2Preview(s.image2_url ?? "");
    setModalOpen(true);
  };

  const uploadIfNew = async (
    file: File | null,
    existing: string,
    existingPath: string,
    folder: string
  ): Promise<{ url: string; path: string }> => {
    if (!file) return { url: existing, path: existingPath };
    const path = `heroSlides/${folder}/${Date.now()}_${file.name}`;
    await supabase.storage.from("public-assets").upload(path, file);
    const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
    if (existingPath) {
      try { await supabase.storage.from("public-assets").remove([existingPath]); } catch {}
    }
    return { url: data.publicUrl, path };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isHome = form.page === "Homepage";
      const [bg, img1, img2] = await Promise.all([
        uploadIfNew(bgFile, editing?.bg_image_url ?? "", editing?.bg_image_path ?? "", "bg"),
        uploadIfNew(isHome ? originalBgFile : img1File, editing?.image1_url ?? "", editing?.image1_path ?? "", "img1"),
        uploadIfNew(img2File, editing?.image2_url ?? "", editing?.image2_path ?? "", "img2"),
      ]);

      const data = {
        title: form.title,
        subtitle: form.subtitle,
        badge: form.badge,
        cta_text: form.cta_text,
        bg_position: form.bg_position,
        display_order: Number(form.display_order),
        active: form.active,
        page: form.page,
        bg_image_url: bg.url,
        bg_image_path: bg.path,
        image1_url: img1.url,
        image1_path: img1.path,
        image2_url: img2.url,
        image2_path: img2.path,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        await supabase.from("hero_slides").update(data).eq("id", editing.id);
      } else {
        await supabase.from("hero_slides").insert(data);
      }

      setModalOpen(false);
      fetchSlides();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: HeroSlide) => {
    setDeleteId(s.id);
    try {
      await supabase.from("hero_slides").delete().eq("id", s.id);
      for (const path of [s.bg_image_path, s.image1_path, s.image2_path]) {
        if (path) { try { await supabase.storage.from("public-assets").remove([path]); } catch {} }
      }
      setSlides((prev) => prev.filter((x) => x.id !== s.id));
    } finally {
      setDeleteId(null);
    }
  };

  const makeFileHandler = (
    target: "bg" | "img1" | "img2"
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (target === "bg") setOriginalBgFile(file);
    setCropImageUrl(URL.createObjectURL(file));
    setCropTarget(target);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropModalOpen(true);
    e.target.value = "";
  };

  const handleCropSave = async () => {
    if (!cropTarget || !cropImageUrl || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageUrl, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Cropping failed");
      const file = new File([croppedBlob], "cropped.webp", { type: "image/webp" });
      const previewUrl = URL.createObjectURL(croppedBlob);
      if (cropTarget === "bg") { setBgFile(file); setBgPreview(previewUrl); }
      else if (cropTarget === "img1") { setImg1File(file); setImg1Preview(previewUrl); }
      else if (cropTarget === "img2") { setImg2File(file); setImg2Preview(previewUrl); }
    } catch (err) { console.error(err); }
    setCropModalOpen(false);
  };

  // Group slides by page for display
  const slidesByPage = PAGES.reduce<Record<string, HeroSlide[]>>((acc, p) => {
    acc[p] = slides.filter((s) => s.page === p);
    return acc;
  }, {});

  const isHomepage = form.page === "Homepage";
  const cropAspect = cropTarget === "bg" ? 16 / 9 : 3 / 4;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Hero Slides</h2>
          <p className="raleway-regular text-base text-[#533113]/50 mt-1">
            Manage hero banners per page
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#533113] text-white px-5 py-2.5 raleway-bold text-sm uppercase tracking-widest hover:bg-[#3d2409] transition-colors self-start sm:self-auto"
        >
          <PlusIcon size={16} weight="bold" />
          Add Slide
        </button>
      </div>

      {/* How it works info */}
      <div className="flex items-start gap-3 bg-[#FFFBF6] border border-[#DEDEDE] px-4 py-3">
        <InfoIcon size={18} className="text-[#533113]/50 shrink-0 mt-0.5" />
        <p className="raleway-regular text-sm text-[#533113]/60 leading-relaxed">
          <strong className="raleway-bold text-[#533113]">How to add multiple slides:</strong>{" "}
          Click <em>Add Slide</em> once for each slide you want (Slide 1, Slide 2, Slide 3…). Each slide gets its own image. The Display Order controls the sequence. For <strong className="raleway-bold">Homepage</strong> slides, upload one image — it will be cropped to 16:9 for desktop and fill the screen on mobile automatically.
        </p>
      </div>

      {/* Slides list */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white border border-[#DEDEDE]">
          <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border border-[#DEDEDE]">
          <ImageIcon size={48} className="text-[#533113]/20" />
          <p className="raleway-regular text-base text-[#533113]/40">No hero slides yet.</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#533113] text-white px-5 py-2.5 raleway-bold text-sm uppercase tracking-widest hover:bg-[#3d2409] transition-colors"
          >
            <PlusIcon size={16} weight="bold" />
            Add Your First Slide
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {PAGES.map((page) => {
            const pageSlides = slidesByPage[page] ?? [];
            if (pageSlides.length === 0) return null;
            return (
              <div key={page} className="bg-white border border-[#DEDEDE]">
                <div className="px-5 py-3 bg-[#FFFBF6] border-b border-[#DEDEDE] flex items-center gap-2">
                  <span className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">{page}</span>
                  <span className="raleway-regular text-xs text-[#533113]/40">
                    — {pageSlides.length} slide{pageSlides.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#DEDEDE]">
                        {["Slide", "Preview", "Title", "Badge", "CTA", "Order", "Status", "Actions"].map((h) => (
                          <th key={h} className="raleway-bold text-xs text-[#533113]/60 uppercase tracking-widest text-left px-5 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageSlides.map((s, idx) => (
                        <tr key={s.id} className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors">
                          {/* Slide number badge */}
                          <td className="px-5 py-3">
                            <span className="raleway-bold text-sm text-[#533113] bg-[#F5EDE1] px-2.5 py-1">
                              Slide {idx + 1}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {s.bg_image_url ? (
                              <img src={s.bg_image_url} alt={s.title} className="w-20 h-12 object-cover border border-[#DEDEDE]" />
                            ) : (
                              <div className="w-20 h-12 bg-[#F5EDE1] flex items-center justify-center">
                                <ImageIcon size={18} className="text-[#533113]/30" />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 raleway-bold text-[#533113] max-w-[160px] truncate">
                            {s.title || <span className="text-[#533113]/30 italic raleway-regular font-normal">No title</span>}
                          </td>
                          <td className="px-5 py-3 raleway-regular text-[#533113]/60 text-sm">{s.badge || "—"}</td>
                          <td className="px-5 py-3 raleway-regular text-[#533113]/60 text-sm">{s.cta_text || "—"}</td>
                          <td className="px-5 py-3 raleway-regular text-[#533113]/70 text-center">{s.display_order ?? 0}</td>
                          <td className="px-5 py-3">
                            <span className={`raleway-regular text-sm px-2.5 py-1 ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {s.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(s)} className="p-2 hover:bg-[#533113]/10 transition-colors text-[#533113]" title="Edit">
                                <PencilSimpleIcon size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(s)}
                                disabled={deleteId === s.id}
                                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white raleway-bold text-xs uppercase tracking-widest px-4 py-2 transition-colors disabled:opacity-40"
                              >
                                <TrashIcon size={14} weight="bold" />
                                {deleteId === s.id ? "Deleting…" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl border border-[#DEDEDE] flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
              <div>
                <h3 className="raleway-bold text-base text-[#533113]">
                  {editing ? "Edit Hero Slide" : "Add Hero Slide"}
                </h3>
                {!editing && (
                  <p className="raleway-regular text-xs text-[#533113]/50 mt-0.5">
                    This will be{" "}
                    <span className="raleway-bold text-[#533113]">
                      Slide {getNextOrder(form.page)}
                    </span>{" "}
                    for <span className="raleway-bold text-[#533113]">{form.page}</span>
                  </p>
                )}
              </div>
              <button onClick={() => setModalOpen(false)}>
                <XIcon size={20} className="text-[#533113]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

              {/* Page selector — first so slide number label updates */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Page / Location">
                  <select
                    value={form.page}
                    onChange={(e) => {
                      const newPage = e.target.value;
                      setForm((f) => ({ ...f, page: newPage, display_order: getNextOrder(newPage) }));
                    }}
                    className="input-base cursor-pointer"
                  >
                    {PAGES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Display Order (1 = first)">
                  <input
                    type="number"
                    min="0"
                    value={form.display_order}
                    onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                    placeholder="1"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* Background / slide image */}
              <div className="flex flex-col gap-2">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Slide Image <span className="text-[#533113]/40 normal-case">(required — crops to 16:9 for desktop)</span>
                </label>
                {isHomepage && (
                  <p className="raleway-regular text-xs text-[#533113]/50">
                    On mobile, the same image is used and fills the screen automatically — no separate upload needed.
                  </p>
                )}
                <div
                  onClick={() => bgRef.current?.click()}
                  className="border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors cursor-pointer flex items-center justify-center h-40 overflow-hidden"
                >
                  {bgPreview ? (
                    <img src={bgPreview} alt="bg preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#533113]/40">
                      <ImageIcon size={36} />
                      <span className="raleway-regular text-sm">Click to upload &amp; crop image</span>
                    </div>
                  )}
                </div>
                <input ref={bgRef} type="file" accept="image/*" onChange={makeFileHandler("bg")} className="hidden" />
              </div>

              {/* Portrait images — only for non-homepage pages */}
              {!isHomepage && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Portrait Image 1</label>
                    <div
                      onClick={() => img1Ref.current?.click()}
                      className="border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors cursor-pointer flex items-center justify-center h-28 overflow-hidden"
                    >
                      {img1Preview ? (
                        <img src={img1Preview} alt="img1" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-[#533113]/40">
                          <ImageIcon size={24} />
                          <span className="raleway-regular text-xs">Upload</span>
                        </div>
                      )}
                    </div>
                    <input ref={img1Ref} type="file" accept="image/*" onChange={makeFileHandler("img1")} className="hidden" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Portrait Image 2</label>
                    <div
                      onClick={() => img2Ref.current?.click()}
                      className="border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors cursor-pointer flex items-center justify-center h-28 overflow-hidden"
                    >
                      {img2Preview ? (
                        <img src={img2Preview} alt="img2" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-[#533113]/40">
                          <ImageIcon size={24} />
                          <span className="raleway-regular text-xs">Upload</span>
                        </div>
                      )}
                    </div>
                    <input ref={img2Ref} type="file" accept="image/*" onChange={makeFileHandler("img2")} className="hidden" />
                  </div>
                </div>
              )}

              {/* Title */}
              <Field label="Headline Title">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Elevate Your Active Style"
                  className="input-base"
                />
              </Field>

              {/* Subtitle */}
              <Field label="Subtitle">
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Premium sportswear for every body."
                  className="input-base"
                />
              </Field>

              {/* Badge + CTA */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Badge Text">
                  <input
                    value={form.badge}
                    onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                    placeholder="New Collection"
                    className="input-base"
                  />
                </Field>
                <Field label="CTA Button Text">
                  <input
                    value={form.cta_text}
                    onChange={(e) => setForm((f) => ({ ...f, cta_text: e.target.value }))}
                    placeholder="Shop Now"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* BG Position */}
              <Field label="Image Focus Position (CSS e.g. 50% 30%)">
                <input
                  value={form.bg_position}
                  onChange={(e) => setForm((f) => ({ ...f, bg_position: e.target.value }))}
                  placeholder="50% 40%"
                  className="input-base"
                />
              </Field>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.active ? "bg-[#533113]" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.active ? "translate-x-5" : "translate-x-1"}`} />
                </button>
                <span className="raleway-regular text-base text-[#533113]">
                  {form.active ? "Active — visible to visitors" : "Inactive — hidden from visitors"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
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
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-black text-white shrink-0">
            <div>
              <h3 className="raleway-bold text-base">
                {cropTarget === "bg" ? "Crop Slide Image (16:9 desktop)" : "Crop Portrait Image (3:4)"}
              </h3>
              <p className="raleway-regular text-xs text-white/50 mt-0.5">
                Drag to reposition · Scroll or use slider to zoom
              </p>
            </div>
            <button onClick={() => setCropModalOpen(false)} className="hover:text-gray-300">
              <XIcon size={24} />
            </button>
          </div>
          <div className="flex-1 relative bg-black">
            <Cropper
              image={cropImageUrl}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <div className="p-6 bg-black flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="flex-1 flex items-center gap-4 w-full text-white raleway-bold text-sm">
              <span>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full sm:w-64"
              />
            </div>
            <button
              onClick={handleCropSave}
              className="w-full sm:w-auto bg-[#533113] text-white raleway-bold text-sm uppercase tracking-widest px-8 py-3 hover:bg-[#3d2409] transition-colors"
            >
              Crop &amp; Save
            </button>
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
