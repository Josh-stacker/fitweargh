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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../firebase";
import {
  PlusIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
  ImageIcon,
} from "@phosphor-icons/react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  bgImageUrl: string;
  bgImagePath: string;
  image1Url: string;
  image1Path: string;
  image2Url: string;
  image2Path: string;
  bgPosition: string;
  order: number;
  active: boolean;
  page: string;
  createdAt: unknown;
}

const PAGES = [
  "Homepage",
  "New Arrivals",
  "Clothing",
  "Body Shapers",
  "Accessories",
];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  badge: "",
  ctaText: "Shop Now",
  bgPosition: "50% 40%",
  order: 0,
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

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState("");
  const [img1File, setImg1File] = useState<File | null>(null);
  const [img1Preview, setImg1Preview] = useState("");
  const [img2File, setImg2File] = useState<File | null>(null);
  const [img2Preview, setImg2Preview] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const bgRef = useRef<HTMLInputElement>(null);
  const img1Ref = useRef<HTMLInputElement>(null);
  const img2Ref = useRef<HTMLInputElement>(null);

  const fetchSlides = async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "heroSlides"), orderBy("order", "asc")));
    setSlides(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HeroSlide)));
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setBgFile(null); setBgPreview("");
    setImg1File(null); setImg1Preview("");
    setImg2File(null); setImg2Preview("");
    setModalOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle,
      badge: s.badge,
      ctaText: s.ctaText,
      bgPosition: s.bgPosition ?? "50% 40%",
      order: s.order ?? 0,
      active: s.active ?? true,
      page: s.page ?? "Homepage",
    });
    setBgFile(null); setBgPreview(s.bgImageUrl ?? "");
    setImg1File(null); setImg1Preview(s.image1Url ?? "");
    setImg2File(null); setImg2Preview(s.image2Url ?? "");
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
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    if (existingPath) {
      try { await deleteObject(ref(storage, existingPath)); } catch {}
    }
    return { url, path };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const [bg, img1, img2] = await Promise.all([
        uploadIfNew(bgFile, editing?.bgImageUrl ?? "", editing?.bgImagePath ?? "", "bg"),
        uploadIfNew(img1File, editing?.image1Url ?? "", editing?.image1Path ?? "", "img1"),
        uploadIfNew(img2File, editing?.image2Url ?? "", editing?.image2Path ?? "", "img2"),
      ]);

      const data = {
        title: form.title,
        subtitle: form.subtitle,
        badge: form.badge,
        ctaText: form.ctaText,
        bgPosition: form.bgPosition,
        order: Number(form.order),
        active: form.active,
        page: form.page,
        bgImageUrl: bg.url,
        bgImagePath: bg.path,
        image1Url: img1.url,
        image1Path: img1.path,
        image2Url: img2.url,
        image2Path: img2.path,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "heroSlides", editing.id), data);
      } else {
        await addDoc(collection(db, "heroSlides"), { ...data, createdAt: serverTimestamp() });
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
      await deleteDoc(doc(db, "heroSlides", s.id));
      for (const path of [s.bgImagePath, s.image1Path, s.image2Path]) {
        if (path) { try { await deleteObject(ref(storage, path)); } catch {} }
      }
      setSlides((prev) => prev.filter((x) => x.id !== s.id));
    } finally {
      setDeleteId(null);
    }
  };

  const makeFileHandler = (
    setFile: (f: File) => void,
    setPreview: (s: string) => void
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Hero Slides</h2>
          <p className="raleway-light text-sm text-[#533113]/50 mt-1">
            Manage homepage hero banners
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

      {/* Slides list */}
      <div className="bg-white border border-[#DEDEDE] overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ImageIcon size={48} className="text-[#533113]/20" />
            <p className="raleway-light text-sm text-[#533113]/40">No hero slides yet. Add your first one!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DEDEDE] bg-[#FFFBF6]">
                {["Preview", "Title", "Page", "Badge", "CTA", "Order", "Status", "Actions"].map((h) => (
                  <th key={h} className="raleway-bold text-xs text-[#533113]/60 uppercase tracking-widest text-left px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slides.map((s) => (
                <tr key={s.id} className="border-b border-[#DEDEDE]/60 hover:bg-[#FFFBF6] transition-colors">
                  <td className="px-5 py-3">
                    {s.bgImageUrl ? (
                      <img src={s.bgImageUrl} alt={s.title} className="w-20 h-12 object-cover border border-[#DEDEDE]" />
                    ) : (
                      <div className="w-20 h-12 bg-[#F5EDE1] flex items-center justify-center">
                        <ImageIcon size={18} className="text-[#533113]/30" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 raleway-bold text-[#533113] max-w-[160px] truncate">
                    {s.title || <span className="text-[#533113]/30 italic">No title</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="raleway-light text-xs px-2.5 py-1 bg-[#F5EDE1] text-[#533113]">
                      {s.page || "Homepage"}
                    </span>
                  </td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/60 text-xs">{s.badge || "—"}</td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/60 text-xs">{s.ctaText || "—"}</td>
                  <td className="px-5 py-3 raleway-light text-[#533113]/70 text-center">{s.order ?? 0}</td>
                  <td className="px-5 py-3">
                    <span className={`raleway-light text-xs px-2.5 py-1 ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 hover:bg-[#533113]/10 transition-colors text-[#533113]">
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
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl border border-[#DEDEDE] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DEDEDE] shrink-0">
              <h3 className="raleway-bold text-base text-[#533113]">
                {editing ? "Edit Hero Slide" : "Add Hero Slide"}
              </h3>
              <button onClick={() => setModalOpen(false)}>
                <XIcon size={20} className="text-[#533113]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Background image */}
              <div className="flex flex-col gap-2">
                <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                  Background Image <span className="text-[#533113]/40 normal-case">(required)</span>
                </label>
                <div
                  onClick={() => bgRef.current?.click()}
                  className="border-2 border-dashed border-[#DEDEDE] hover:border-[#533113] transition-colors cursor-pointer flex items-center justify-center h-36 overflow-hidden"
                >
                  {bgPreview ? (
                    <img src={bgPreview} alt="bg preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#533113]/40">
                      <ImageIcon size={32} />
                      <span className="raleway-light text-xs">Click to upload background</span>
                    </div>
                  )}
                </div>
                <input ref={bgRef} type="file" accept="image/*" onChange={makeFileHandler(setBgFile, setBgPreview)} className="hidden" />
              </div>

              {/* Portrait images row */}
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
                        <span className="raleway-light text-[10px]">Upload</span>
                      </div>
                    )}
                  </div>
                  <input ref={img1Ref} type="file" accept="image/*" onChange={makeFileHandler(setImg1File, setImg1Preview)} className="hidden" />
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
                        <span className="raleway-light text-[10px]">Upload</span>
                      </div>
                    )}
                  </div>
                  <input ref={img2Ref} type="file" accept="image/*" onChange={makeFileHandler(setImg2File, setImg2Preview)} className="hidden" />
                </div>
              </div>

              {/* Title */}
              <Field label="Headline Title">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Elevate Your\nActive Style"
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

              {/* Badge + CTA row */}
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
                    value={form.ctaText}
                    onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                    placeholder="Shop Now"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* Page + Order row */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Page / Location">
                  <select
                    value={form.page}
                    onChange={(e) => setForm((f) => ({ ...f, page: e.target.value }))}
                    className="input-base cursor-pointer"
                  >
                    {PAGES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Display Order">
                  <input
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    placeholder="0"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* BG Position */}
              <Field label="BG Position (CSS)">
                <input
                  value={form.bgPosition}
                  onChange={(e) => setForm((f) => ({ ...f, bgPosition: e.target.value }))}
                  placeholder="50% 40%"
                  className="input-base"
                />
              </Field>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    form.active ? "bg-[#533113]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      form.active ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="raleway-light text-sm text-[#533113]">
                  {form.active ? "Active — visible on homepage" : "Inactive — hidden from homepage"}
                </span>
              </div>

              {/* Actions */}
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
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Slide"}
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
