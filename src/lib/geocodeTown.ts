import {
  GHANA_DISTRICTS,
  distanceKm,
  matchDistrictByName,
  type GhanaDistrict,
} from "../data/ghanaDistricts";

/**
 * Resolves an admin-typed town to the district used for pricing.
 *
 * Two stages, best accuracy first:
 *   1. Nominatim (OpenStreetMap) geocodes the town to coordinates, which we
 *      snap to the nearest district centroid. This knows far more Ghanaian
 *      place names than any list we could maintain by hand.
 *   2. If that fails (offline, rate-limited, unknown place), fall back to the
 *      static alias list in data/ghanaTownAliases.ts.
 *
 * Nominatim's usage policy caps this at ~1 request/second and asks for an
 * identifying User-Agent/Referer. That is fine here because only the admin
 * triggers it, once, while creating a delivery area — the resolved district is
 * then stored on the row, so the storefront never calls out to anything.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface GeocodeResult {
  district: GhanaDistrict;
  /** How we got there — surfaced to the admin so they can sanity-check it. */
  source: "geocoded" | "alias";
  /** Distance from the geocoded point to the district centre, when geocoded. */
  km?: number;
}

/**
 * Snap a point to the closest district centre. Constrained to the admin's
 * chosen region when there is one — district centroids near a regional border
 * can otherwise sit closer to a neighbour, e.g. Kasoa is in Central but its
 * nearest centroid overall is Ga West in Greater Accra.
 */
function nearestDistrict(
  lat: number,
  lng: number,
  region?: string | null,
): { district: GhanaDistrict; km: number } | null {
  const pool = region ? GHANA_DISTRICTS.filter((d) => d.region === region) : GHANA_DISTRICTS;
  let best: { district: GhanaDistrict; km: number } | null = null;
  for (const district of pool.length ? pool : GHANA_DISTRICTS) {
    const km = distanceKm({ lat, lng }, district);
    if (!best || km < best.km) best = { district, km };
  }
  return best;
}

export async function geocodeTown(
  town: string,
  region?: string | null,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const query = [town.trim(), region, "Ghana"].filter(Boolean).join(", ");
  if (!town.trim()) return null;

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=gh&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const results = await res.json();
      const hit = Array.isArray(results) ? results[0] : null;
      const lat = Number(hit?.lat);
      const lng = Number(hit?.lon);
      if (isFinite(lat) && isFinite(lng)) {
        const nearest = nearestDistrict(lat, lng, region);
        if (nearest) {
          return { district: nearest.district, source: "geocoded", km: Math.round(nearest.km) };
        }
      }
    }
  } catch {
    // Fall through to the offline list below.
  }

  const alias = matchDistrictByName(town, region);
  return alias ? { district: alias, source: "alias" } : null;
}
