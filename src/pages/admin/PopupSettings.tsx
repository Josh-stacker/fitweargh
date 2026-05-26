import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { FloppyDiskIcon, ToggleLeftIcon, ToggleRightIcon } from "@phosphor-icons/react";

interface PopupDoc {
  enabled: boolean;
  title: string;
  body: string;
  ctaText: string;
  ctaLink: string;
}

const DEFAULTS: PopupDoc = {
  enabled: false,
  title: "Big Sale — Up to 50% Off!",
  body: "Shop our latest deals on body shapers, clothing and accessories. Limited time only.",
  ctaText: "Shop the Sale",
  ctaLink: "/sales",
};

export default function PopupSettings() {
  const [form, setForm] = useState<PopupDoc>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "siteSettings", "popup"));
        if (snap.exists()) setForm(snap.data() as PopupDoc);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const set = (field: keyof PopupDoc, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteSettings", "popup"), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Sale Popup</h2>
          <p className="raleway-light text-sm text-[#533113]/50 mt-1">
            Control the promotional popup shown to storefront visitors
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#533113] text-white px-5 py-2.5 raleway-bold text-sm uppercase tracking-widest hover:bg-[#3d2409] transition-colors self-start sm:self-auto disabled:opacity-60"
        >
          <FloppyDiskIcon size={16} weight="bold" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
      </div>

      <div className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-6">

        {/* Enable toggle */}
        <div className="flex items-center justify-between pb-5 border-b border-[#DEDEDE]">
          <div>
            <p className="raleway-bold text-sm text-[#533113]">Popup Enabled</p>
            <p className="raleway-light text-xs text-[#533113]/50 mt-0.5">
              When on, the popup appears once per session for every visitor
            </p>
          </div>
          <button
            onClick={() => set("enabled", !form.enabled)}
            className="flex items-center gap-2 transition-colors"
          >
            {form.enabled ? (
              <ToggleRightIcon size={40} weight="fill" className="text-[#533113]" />
            ) : (
              <ToggleLeftIcon size={40} weight="fill" className="text-[#533113]/30" />
            )}
          </button>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-2">
          <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Big Sale — Up to 50% Off!"
            className="border border-[#DEDEDE] raleway-light text-sm text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113]"
          />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-2">
          <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
            Message
          </label>
          <textarea
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            rows={3}
            placeholder="Short promotional message shown under the title…"
            className="border border-[#DEDEDE] raleway-light text-sm text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] resize-none"
          />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
              Button Text
            </label>
            <input
              type="text"
              value={form.ctaText}
              onChange={(e) => set("ctaText", e.target.value)}
              placeholder="e.g. Shop the Sale"
              className="border border-[#DEDEDE] raleway-light text-sm text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
              Button Link
            </label>
            <input
              type="text"
              value={form.ctaLink}
              onChange={(e) => set("ctaLink", e.target.value)}
              placeholder="e.g. /sales"
              className="border border-[#DEDEDE] raleway-light text-sm text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113]"
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#DEDEDE]">
          <p className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Preview</p>
          <div className="border border-[#DEDEDE] bg-[#FFFBF6] p-6 flex flex-col gap-4 max-w-sm">
            <span className="raleway-light text-xs tracking-[0.3em] uppercase text-[#533113]/50">
              FitwearGH Sale
            </span>
            <p className="raleway-black text-2xl text-[#533113] leading-tight">
              {form.title || "Popup title"}
            </p>
            {form.body && (
              <p className="raleway-light text-xs text-[#533113]/70 leading-relaxed">
                {form.body}
              </p>
            )}
            {form.ctaText && (
              <div className="bg-[#533113] text-white flex items-center justify-between px-4 py-2.5">
                <span className="raleway-light text-xs">{form.ctaText}</span>
                <span className="text-white text-xs">↗</span>
              </div>
            )}
            <span className="raleway-light text-[10px] text-[#533113]/30 underline">No thanks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
