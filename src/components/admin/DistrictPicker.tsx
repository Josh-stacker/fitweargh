import { useMemo, useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { GHANA_REGIONS, districtsInRegion } from "../../data/ghanaDistricts";
import { MAX_PROXIMITY_KM } from "../../lib/deliveryPricing";

interface DistrictPickerProps {
  region: string;
  districts: string[];
  onRegionChange: (region: string) => void;
  onDistrictsChange: (districts: string[]) => void;
}

/**
 * Region select plus a type-to-filter district multi-select. The chosen
 * districts are the "range" a single delivery price covers.
 */
export default function DistrictPicker({
  region,
  districts,
  onRegionChange,
  onDistrictsChange,
}: DistrictPickerProps) {
  const [query, setQuery] = useState("");

  const available = useMemo(() => {
    if (!region) return [];
    const all = districtsInRegion(region).map((d) => d.district);
    const needle = query.trim().toLowerCase();
    return needle ? all.filter((d) => d.toLowerCase().includes(needle)) : all;
  }, [region, query]);

  const toggle = (district: string) => {
    onDistrictsChange(
      districts.includes(district)
        ? districts.filter((d) => d !== district)
        : [...districts, district],
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Region</label>
        <select
          value={region}
          onChange={(e) => {
            onRegionChange(e.target.value);
            onDistrictsChange([]);
            setQuery("");
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
        <div className="flex flex-col gap-1.5">
          <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">
            Districts covered by this price
          </label>

          {districts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {districts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  className="flex items-center gap-1 bg-[#533113] text-white raleway-regular text-sm px-2.5 py-1 hover:bg-[#3d2409] transition-colors"
                >
                  {d}
                  <XIcon size={12} />
                </button>
              ))}
            </div>
          )}

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to filter districts…"
            className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
          />

          <div className="border border-[#DEDEDE] max-h-44 overflow-y-auto divide-y divide-[#DEDEDE]/60">
            {available.length === 0 ? (
              <p className="raleway-regular text-sm text-[#533113]/40 px-3 py-2">No matching districts.</p>
            ) : (
              available.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(d)}
                  className={`w-full text-left raleway-regular text-base px-3 py-2 transition-colors ${
                    districts.includes(d)
                      ? "bg-[#533113]/10 text-[#533113]"
                      : "text-[#533113]/70 hover:bg-[#533113]/5"
                  }`}
                >
                  {districts.includes(d) ? "✓ " : ""}{d}
                </button>
              ))
            )}
          </div>
          <p className="raleway-regular text-sm text-[#533113]/50">
            Customers in these districts pay this price. Nearby districts within {MAX_PROXIMITY_KM}km of
            one of them get the same price automatically; anywhere further is asked to contact you.
          </p>
        </div>
      )}
    </div>
  );
}
