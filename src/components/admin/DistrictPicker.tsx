import { useEffect, useRef, useState } from "react";
import { CheckCircleIcon, WarningIcon } from "@phosphor-icons/react";
import { GHANA_REGIONS } from "../../data/ghanaDistricts";
import { geocodeTown } from "../../lib/geocodeTown";

interface DistrictPickerProps {
  /** The town/area name the admin is creating — also what customers pick. */
  town: string;
  region: string;
  districts: string[];
  onRegionChange: (region: string) => void;
  onDistrictsChange: (districts: string[]) => void;
}

/**
 * Region select plus automatic district resolution. The admin only supplies a
 * region and the town name (entered as the area name); the district used for
 * pricing is looked up for them and stored on the row.
 */
export default function DistrictPicker({
  town,
  region,
  districts,
  onRegionChange,
  onDistrictsChange,
}: DistrictPickerProps) {
  const [status, setStatus] = useState<"idle" | "looking" | "found" | "missing">("idle");
  const [detail, setDetail] = useState("");
  const onDistrictsChangeRef = useRef(onDistrictsChange);
  onDistrictsChangeRef.current = onDistrictsChange;

  useEffect(() => {
    const trimmed = town.trim();
    if (!trimmed || !region) {
      setStatus("idle");
      setDetail("");
      return;
    }

    const controller = new AbortController();
    // Debounced so we stay well inside Nominatim's ~1 request/second policy
    // while the admin is still typing.
    const timer = setTimeout(() => {
      setStatus("looking");
      geocodeTown(trimmed, region, controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          if (!result) {
            setStatus("missing");
            setDetail("");
            onDistrictsChangeRef.current([]);
            return;
          }
          setStatus("found");
          setDetail(
            result.source === "geocoded"
              ? `Matched to ${result.district.district} district (${result.district.region})`
              : `Matched to ${result.district.district} district (${result.district.region}) from the offline list`,
          );
          onDistrictsChangeRef.current([result.district.district]);
        })
        .catch(() => {
          if (!controller.signal.aborted) setStatus("missing");
        });
    }, 700);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [town, region]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="raleway-bold text-xs text-[#533113] uppercase tracking-widest">Region</label>
        <select
          value={region}
          onChange={(e) => {
            onRegionChange(e.target.value);
            onDistrictsChange([]);
          }}
          className="border border-[#DEDEDE] raleway-regular text-base text-[#533113] px-3 py-2.5 outline-none focus:border-[#533113] bg-white transition-colors"
        >
          <option value="">Select region</option>
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {region && town.trim() && (
        <div className="bg-[#FFF9E6] border border-[#EBDCA8] px-4 py-3 flex items-start gap-2">
          {status === "looking" && (
            <p className="raleway-regular text-sm text-[#533113]/70">Looking up district…</p>
          )}
          {status === "found" && (
            <>
              <CheckCircleIcon size={16} weight="fill" className="text-green-600 shrink-0 mt-0.5" />
              <p className="raleway-regular text-sm text-[#533113]/70">{detail}</p>
            </>
          )}
          {status === "missing" && (
            <>
              <WarningIcon size={16} weight="fill" className="text-[#B8860B] shrink-0 mt-0.5" />
              <p className="raleway-regular text-sm text-[#533113]/70">
                We couldn't place "{town.trim()}" automatically. The area will still work — customers
                who pick it get this price — but nearby towns won't inherit it.
              </p>
            </>
          )}
        </div>
      )}

      {districts.length > 0 && (
        <p className="raleway-regular text-sm text-[#533113]/50">
          Pricing district: {districts.join(", ")}
        </p>
      )}
    </div>
  );
}
