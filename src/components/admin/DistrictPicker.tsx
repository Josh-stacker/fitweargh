import { useState } from "react";
import { CheckCircleIcon, PlusIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { GHANA_REGIONS, districtsInRegion, townsInRegion } from "../../data/ghanaDistricts";
import { geocodeTown } from "../../lib/geocodeTown";

interface DistrictPickerProps {
  region: string;
  coversWholeRegion: boolean;
  towns: string[];
  districts: string[];
  onRegionChange: (region: string) => void;
  onCoversWholeRegionChange: (value: boolean) => void;
  onTownsChange: (towns: string[]) => void;
  onDistrictsChange: (districts: string[]) => void;
}

/**
 * Defines what a single delivery price covers: either a whole region, or a
 * list of towns. Each town is resolved to its district automatically so the
 * pricing rules can match customers who type a nearby place instead.
 */
export default function DistrictPicker({
  region,
  coversWholeRegion,
  towns,
  districts,
  onRegionChange,
  onCoversWholeRegionChange,
  onTownsChange,
  onDistrictsChange,
}: DistrictPickerProps) {
  const [draftTown, setDraftTown] = useState("");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "warn"; text: string } | null>(null);

  const setWholeRegion = (value: boolean) => {
    onCoversWholeRegionChange(value);
    setNote(null);
    if (value && region) {
      // Load every district and every known town in the region, so the admin
      // sets the region once and customers can still find their own town.
      onDistrictsChange(districtsInRegion(region).map((d) => d.district));
      onTownsChange(townsInRegion(region));
    } else {
      onDistrictsChange([]);
      onTownsChange([]);
    }
  };

  const addTown = async () => {
    const town = draftTown.trim();
    if (!town || !region || adding) return;
    if (towns.some((t) => t.toLowerCase() === town.toLowerCase())) {
      setDraftTown("");
      return;
    }

    setAdding(true);
    setNote(null);
    try {
      const result = await geocodeTown(town, region);
      onTownsChange([...towns, town]);
      if (result) {
        // Districts are a set — several towns often share one.
        if (!districts.includes(result.district.district)) {
          onDistrictsChange([...districts, result.district.district]);
        }
        setNote({ kind: "ok", text: `${town} → ${result.district.district} district` });
      } else {
        setNote({
          kind: "warn",
          text: `Couldn't place "${town}". Customers who pick it still get this price, but nearby towns won't inherit it.`,
        });
      }
      setDraftTown("");
    } finally {
      setAdding(false);
    }
  };

  const removeTown = (town: string) => {
    onTownsChange(towns.filter((t) => t !== town));
    setNote(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Region</label>
        <select
          value={region}
          onChange={(e) => {
            const next = e.target.value;
            onRegionChange(next);
            const wholeRegion = coversWholeRegion && next;
            onDistrictsChange(wholeRegion ? districtsInRegion(next).map((d) => d.district) : []);
            onTownsChange(wholeRegion ? townsInRegion(next) : []);
            setNote(null);
          }}
          className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
        >
          <option value="">Select region</option>
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {region && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
              This price covers
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  checked={coversWholeRegion}
                  onChange={() => setWholeRegion(true)}
                  className="accent-[#533113] mt-1"
                />
                <span className="raleway-regular text-base text-[#533113]">
                  The whole of {region}
                  <span className="block raleway-regular text-sm text-[#533113]/50">
                    {coversWholeRegion && towns.length > 0
                      ? `${towns.length} towns across ${districts.length} districts loaded. Any of them pays this price, unless another area names that town specifically.`
                      : "Every town in the region pays this price, unless another area names that town specifically."}
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  checked={!coversWholeRegion}
                  onChange={() => setWholeRegion(false)}
                  className="accent-[#533113] mt-1"
                />
                <span className="raleway-regular text-base text-[#533113]">
                  Specific towns only
                </span>
              </label>
            </div>
          </div>

          {!coversWholeRegion && (
            <div className="flex flex-col gap-2">
              {towns.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {towns.map((town) => (
                    <button
                      key={town}
                      type="button"
                      onClick={() => removeTown(town)}
                      className="flex items-center gap-1 bg-[#533113] text-white raleway-regular text-sm px-2.5 py-1 hover:bg-[#3d2409] transition-colors"
                    >
                      {town}
                      <XIcon size={12} />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={draftTown}
                  onChange={(e) => setDraftTown(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // The picker sits inside a form — don't submit it.
                      e.preventDefault();
                      void addTown();
                    }
                  }}
                  placeholder="Add a town, e.g. East Legon"
                  className="flex-1 border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => void addTown()}
                  disabled={adding || !draftTown.trim()}
                  className="flex items-center gap-1.5 border border-[#533113] text-[#533113] raleway-bold text-xs uppercase tracking-widest px-4 hover:bg-[#533113]/5 transition-colors disabled:opacity-40"
                >
                  {adding ? (
                    <span className="w-3.5 h-3.5 border-2 border-[#533113] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PlusIcon size={13} />
                  )}
                  Add
                </button>
              </div>
            </div>
          )}

          {note && (
            <div className="bg-[#FFF9E6] border border-[#EBDCA8] px-4 py-3 flex items-start gap-2">
              {note.kind === "ok" ? (
                <CheckCircleIcon size={16} weight="fill" className="text-green-600 shrink-0 mt-0.5" />
              ) : (
                <WarningIcon size={16} weight="fill" className="text-[#B8860B] shrink-0 mt-0.5" />
              )}
              <p className="raleway-regular text-sm text-[#533113]/70">{note.text}</p>
            </div>
          )}

          {districts.length > 0 && !coversWholeRegion && (
            <p className="raleway-regular text-sm text-[#533113]/50">
              Pricing districts: {districts.join(", ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
