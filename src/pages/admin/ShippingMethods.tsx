import { useEffect, useState } from "react";
import { adminSupabase } from "../../supabase";
import { PlusIcon, TrashIcon, PencilSimpleIcon, CheckIcon } from "@phosphor-icons/react";
import ConfirmModal from "../../components/admin/ConfirmModal";
import DistrictPicker from "../../components/admin/DistrictPicker";

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  is_international?: boolean;
  region?: string | null;
  districts?: string[] | null;
  towns?: string[] | null;
  covers_whole_region?: boolean | null;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  enabled: true,
  is_international: false,
  region: "",
  districts: [] as string[],
  towns: [] as string[],
  covers_whole_region: false,
};

export default function ShippingMethods() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<ShippingMethod | null>(null);

  const fetchMethods = async () => {
    setLoading(true);
    const { data } = await adminSupabase.from("shipping_methods").select("*").order("created_at", { ascending: true });
    if (data) setMethods(data as ShippingMethod[]);
    setLoading(false);
  };

  useEffect(() => { fetchMethods(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError("Enter a valid price."); return; }
    // A whole-region area needs no name of its own — the region is the name.
    const name = form.name.trim() || (form.covers_whole_region ? form.region : "");
    if (!name) { setError("Enter an area name."); return; }
    setSaving(true);
    try {
      const { data, error } = await adminSupabase.from("shipping_methods").insert({
        name,
        description: form.description.trim(),
        price,
        enabled: form.enabled,
        is_international: form.is_international,
        region: form.region || null,
        districts: form.districts.length ? form.districts : null,
        towns: form.towns.length ? form.towns : null,
        covers_whole_region: form.covers_whole_region,
      }).select().single();
      
      if (error) throw error;

      setMethods((prev) => [
        ...prev,
        data as ShippingMethod,
      ]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: ShippingMethod) => {
    setEditingId(m.id);
    setEditForm({
      name: m.name,
      description: m.description,
      price: String(m.price),
      enabled: m.enabled,
      is_international: m.is_international ?? false,
      region: m.region ?? "",
      districts: m.districts ?? [],
      towns: m.towns ?? [],
      covers_whole_region: m.covers_whole_region ?? false,
    });
  };

  const saveEdit = async (id: string) => {
    const price = parseFloat(editForm.price);
    if (isNaN(price) || price < 0) return;
    const name = editForm.name.trim() || (editForm.covers_whole_region ? editForm.region : "");
    if (!name) return;
    setSaving(true);
    try {
      await adminSupabase.from("shipping_methods").update({
        name,
        description: editForm.description.trim(),
        price,
        enabled: editForm.enabled,
        is_international: editForm.is_international,
        region: editForm.region || null,
        districts: editForm.districts.length ? editForm.districts : null,
        towns: editForm.towns.length ? editForm.towns : null,
        covers_whole_region: editForm.covers_whole_region,
      }).eq("id", id);

      setMethods((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                name,
                description: editForm.description.trim(),
                price,
                enabled: editForm.enabled,
                is_international: editForm.is_international,
                region: editForm.region || null,
                districts: editForm.districts.length ? editForm.districts : null,
                towns: editForm.towns.length ? editForm.towns : null,
                covers_whole_region: editForm.covers_whole_region,
              }
            : m
        )
      );
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (m: ShippingMethod) => {
    await adminSupabase.from("shipping_methods").update({ enabled: !m.enabled }).eq("id", m.id);
    setMethods((prev) => prev.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)));
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await adminSupabase.from("shipping_methods").delete().eq("id", id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setRemovingId(null);
      setConfirmTarget(null);
    }
  };

  const fmt = (n: number) =>
    `GH₵ ${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="raleway-bold text-2xl text-[#533113]">Delivery Areas</h2>
          <p className="raleway-regular text-base text-[#533113]/50 mt-1">
            Set delivery areas and the fee customers pay at checkout.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setError(""); }}
          className="flex items-center gap-2 bg-[#533113] text-white raleway-bold text-xs uppercase tracking-widest px-4 py-2.5 hover:bg-[#3d2409] transition-colors"
        >
          <PlusIcon size={15} />
          Add Area
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white border border-[#DEDEDE] p-6 flex flex-col gap-4"
        >
          <h3 className="raleway-bold text-sm text-[#533113] uppercase tracking-widest">New Delivery Area</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
                Area {form.covers_whole_region && <span className="text-[#533113]/40">(optional)</span>}
              </label>
              <input
                required={!form.covers_whole_region}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={form.covers_whole_region ? form.region || "Defaults to the region name" : "East Legon"}
                className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Delivery Fee (GH₵)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="15.00"
                className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional notes for this area"
              className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
            />
          </div>

          {!form.is_international && (
            <DistrictPicker
              region={form.region}
              coversWholeRegion={form.covers_whole_region}
              towns={form.towns}
              districts={form.districts}
              onRegionChange={(region) => setForm((f) => ({ ...f, region }))}
              onCoversWholeRegionChange={(covers_whole_region) => setForm((f) => ({ ...f, covers_whole_region }))}
              onTownsChange={(towns) => setForm((f) => ({ ...f, towns }))}
              onDistrictsChange={(districts) => setForm((f) => ({ ...f, districts }))}
            />
          )}

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="accent-[#533113]"
            />
            <span className="raleway-regular text-base text-[#533113]">Enabled (visible to customers)</span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_international}
              onChange={(e) => setForm((f) => ({ ...f, is_international: e.target.checked }))}
              className="accent-[#533113] mt-1"
            />
            <span className="raleway-regular text-base text-[#533113]">
              International delivery
              <span className="block raleway-regular text-sm text-[#533113]/50">
                Customers get street/apartment/town/state/postcode fields, pay for items only, and are
                asked to email us to arrange shipping. The fee above is not charged.
              </span>
            </span>
          </label>

          {error && <p className="raleway-regular text-base text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#533113] text-white raleway-bold text-xs uppercase tracking-widest px-5 py-2.5 hover:bg-[#3d2409] transition-colors disabled:opacity-50"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon size={14} />}
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(""); }}
              className="raleway-regular text-base text-[#533113] px-4 py-2.5 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Methods list */}
      <div className="bg-white border border-[#DEDEDE]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : methods.length === 0 ? (
          <div className="py-14 text-center raleway-regular text-base text-[#533113]/40">
            No delivery areas yet. Add one above.
          </div>
        ) : (
          <div className="divide-y divide-[#DEDEDE]">
            {methods.map((m) => (
              <div key={m.id} className="px-5 py-4">
                {editingId === m.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="border border-[#533113] raleway-regular text-base text-[#533113] px-3 py-2 outline-none bg-white"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.price}
                        onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                        className="border border-[#533113] raleway-regular text-base text-[#533113] px-3 py-2 outline-none bg-white"
                      />
                    </div>
                    <input
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      className="border border-[#533113] raleway-regular text-base text-[#533113] px-3 py-2 outline-none bg-white"
                    />
                    {!editForm.is_international && (
                      <DistrictPicker
                        region={editForm.region}
                        coversWholeRegion={editForm.covers_whole_region}
                        towns={editForm.towns}
                        districts={editForm.districts}
                        onRegionChange={(region) => setEditForm((f) => ({ ...f, region }))}
                        onCoversWholeRegionChange={(covers_whole_region) => setEditForm((f) => ({ ...f, covers_whole_region }))}
                        onTownsChange={(towns) => setEditForm((f) => ({ ...f, towns }))}
                        onDistrictsChange={(districts) => setEditForm((f) => ({ ...f, districts }))}
                      />
                    )}

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.checked }))}
                        className="accent-[#533113]"
                      />
                      <span className="raleway-regular text-base text-[#533113]">Enabled</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editForm.is_international}
                        onChange={(e) => setEditForm((f) => ({ ...f, is_international: e.target.checked }))}
                        className="accent-[#533113]"
                      />
                      <span className="raleway-regular text-base text-[#533113]">International delivery</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(m.id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 bg-[#533113] text-white raleway-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-[#3d2409] transition-colors disabled:opacity-50"
                      >
                        <CheckIcon size={13} /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="raleway-regular text-sm text-[#533113] px-3 py-2 border border-[#DEDEDE] hover:bg-[#533113]/5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleEnabled(m)}
                        className={`w-10 h-5 rounded-full transition-colors shrink-0 relative flex items-center ${m.enabled ? "bg-[#533113]" : "bg-[#DEDEDE]"}`}
                        title={m.enabled ? "Disable" : "Enable"}
                      >
                        <span
                          className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${m.enabled ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                      <div className="min-w-0">
                        <p className={`raleway-bold text-sm flex items-center gap-2 ${m.enabled ? "text-[#533113]" : "text-[#533113]/40"}`}>
                          {m.name}
                          {m.is_international && (
                            <span className="raleway-bold text-[10px] uppercase tracking-widest border border-[#533113]/30 text-[#533113]/60 px-1.5 py-0.5">
                              International
                            </span>
                          )}
                        </p>
                        {m.region && (
                          <p className="raleway-regular text-sm text-[#533113]/50 truncate">
                            {m.region}
                            {m.districts?.length ? ` · ${m.districts.join(", ")}` : " · no districts set"}
                          </p>
                        )}
                        {m.description && (
                          <p className="raleway-regular text-sm text-[#533113]/50 truncate">{m.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="raleway-bold text-sm text-[#533113]">{fmt(m.price)}</span>
                      <button
                        onClick={() => startEdit(m)}
                        className="p-1.5 text-[#533113]/50 hover:text-[#533113] hover:bg-[#533113]/10 transition-colors"
                        title="Edit"
                      >
                        <PencilSimpleIcon size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmTarget(m)}
                        disabled={removingId === m.id}
                        className="p-1.5 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {removingId === m.id ? (
                          <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <TrashIcon size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="raleway-regular text-sm text-[#533113]/40">
        Only enabled areas appear at checkout. Disable rather than delete to preserve order history.
      </p>

      <ConfirmModal
        open={confirmTarget !== null}
        title="Delete Delivery Area"
        message={`Are you sure you want to delete "${confirmTarget?.name}"? This cannot be undone.`}
        loading={removingId === confirmTarget?.id}
        onConfirm={() => confirmTarget && handleRemove(confirmTarget.id)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
