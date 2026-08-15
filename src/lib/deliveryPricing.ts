import {
  GHANA_DISTRICTS,
  distanceKm,
  findDistrict,
  matchDistrictByName,
  type GhanaDistrict,
} from "../data/ghanaDistricts";

export interface DeliveryArea {
  id: string;
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  is_international?: boolean;
  /** Region this area sits in, e.g. "Greater Accra". Null on legacy rows. */
  region?: string | null;
  /** District names this area's price covers — the "range" the admin picked. */
  districts?: string[] | null;
}

/**
 * How far from a priced district we are still willing to infer a price. Beyond
 * this the customer is asked to contact us rather than being quoted a fee that
 * was set for somewhere materially further away.
 */
export const MAX_PROXIMITY_KM = 40;

export type DeliveryQuote =
  | { mode: "exact"; area: DeliveryArea; fee: number }
  | { mode: "nearby"; area: DeliveryArea; fee: number; viaDistrict: string; km: number }
  | { mode: "international"; area: DeliveryArea; fee: 0 }
  | { mode: "contact"; fee: 0 };

function areaDistricts(area: DeliveryArea): string[] {
  return Array.isArray(area.districts) ? area.districts : [];
}

/** Districts an area covers, resolved to points we can measure against. */
function areaPoints(area: DeliveryArea): GhanaDistrict[] {
  const region = area.region ?? undefined;
  return areaDistricts(area)
    .map((name) =>
      region
        ? findDistrict(region, name)
        : GHANA_DISTRICTS.find((d) => d.district === name),
    )
    .filter((d): d is GhanaDistrict => Boolean(d));
}

/**
 * Resolve what a customer pays for delivery.
 *
 * Order of preference:
 *  1. their district is explicitly covered by a priced area  → that price
 *  2. their district is within MAX_PROXIMITY_KM of a covered
 *     district                                               → that area's price
 *  3. anything else (unknown town, too far, international)    → contact us
 */
export function quoteDelivery(
  areas: DeliveryArea[],
  selection: { region?: string | null; district?: string | null; typedTown?: string | null },
): DeliveryQuote {
  const usable = areas.filter((a) => a.enabled && !a.is_international);

  // Where is the customer? Districts are an internal pricing concept only —
  // the customer types a town, and we resolve it to a district behind the
  // scenes, preferring one inside the region they picked.
  let point: GhanaDistrict | undefined;
  if (selection.region && selection.district) {
    point = findDistrict(selection.region, selection.district);
  }
  if (!point && selection.typedTown) {
    point = matchDistrictByName(selection.typedTown, selection.region);
  }
  if (!point) return { mode: "contact", fee: 0 };

  const exact = usable.find((area) => areaDistricts(area).includes(point!.district));
  if (exact) return { mode: "exact", area: exact, fee: Number(exact.price) || 0 };

  let best: { area: DeliveryArea; km: number; viaDistrict: string } | null = null;
  for (const area of usable) {
    for (const covered of areaPoints(area)) {
      const km = distanceKm(point, covered);
      if (km <= MAX_PROXIMITY_KM && (!best || km < best.km)) {
        best = { area, km, viaDistrict: covered.district };
      }
    }
  }

  if (best) {
    return {
      mode: "nearby",
      area: best.area,
      fee: Number(best.area.price) || 0,
      viaDistrict: best.viaDistrict,
      km: Math.round(best.km),
    };
  }

  return { mode: "contact", fee: 0 };
}
