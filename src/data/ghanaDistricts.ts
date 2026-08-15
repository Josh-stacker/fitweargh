// Generated from public/ghana_towns.json (GADM level-2 boundaries).
// Only the district name and its polygon centroid are kept — the source file is
// 2.2MB of polygon geometry and must never be shipped to the browser.
// Regenerate with the script in scripts/build-districts.mjs.

import { TOWN_ALIASES } from "./ghanaTownAliases";

export interface GhanaDistrict {
  region: string;
  district: string;
  lat: number;
  lng: number;
}

export const GHANA_DISTRICTS: GhanaDistrict[] = [
  { region: "Ashanti", district: "Adansi North", lat: 6.1926, lng: -1.5783 },
  { region: "Ashanti", district: "Adansi South", lat: 6.05, lng: -1.3972 },
  { region: "Ashanti", district: "Afigya Sekyere", lat: 6.9719, lng: -1.5632 },
  { region: "Ashanti", district: "Ahafo Ano North", lat: 6.8947, lng: -2.227 },
  { region: "Ashanti", district: "Ahafo Ano South", lat: 6.8964, lng: -1.9434 },
  { region: "Ashanti", district: "Amansie Central", lat: 6.2416, lng: -1.7561 },
  { region: "Ashanti", district: "Amansie East", lat: 6.3304, lng: -1.3613 },
  { region: "Ashanti", district: "Amansie West", lat: 6.3739, lng: -1.8983 },
  { region: "Ashanti", district: "Asante Akim North", lat: 6.7723, lng: -1.0499 },
  { region: "Ashanti", district: "Asante Akim South", lat: 6.4749, lng: -1.1113 },
  { region: "Ashanti", district: "Atwima", lat: 6.7614, lng: -1.8033 },
  { region: "Ashanti", district: "Atwima Mponua", lat: 6.5357, lng: -2.2009 },
  { region: "Ashanti", district: "Bosomtwe-Kwanwoma", lat: 6.5655, lng: -1.5761 },
  { region: "Ashanti", district: "Ejisu-Juabeng", lat: 6.6506, lng: -1.3646 },
  { region: "Ashanti", district: "Ejura Sekyedumase", lat: 7.389, lng: -1.4175 },
  { region: "Ashanti", district: "Kumasi", lat: 6.6884, lng: -1.604 },
  { region: "Ashanti", district: "Kwabre", lat: 6.8073, lng: -1.5294 },
  { region: "Ashanti", district: "Obuasi Municipal", lat: 5.9951, lng: -1.6828 },
  { region: "Ashanti", district: "Offinso", lat: 7.2462, lng: -1.8455 },
  { region: "Ashanti", district: "Sekyere East", lat: 7.097, lng: -0.8758 },
  { region: "Ashanti", district: "Sekyere West", lat: 7.2197, lng: -1.1759 },
  { region: "Brong Ahafo", district: "Asunafo North", lat: 6.8311, lng: -2.6831 },
  { region: "Brong Ahafo", district: "Asunafo South", lat: 6.6012, lng: -2.5279 },
  { region: "Brong Ahafo", district: "Asutifi", lat: 6.9562, lng: -2.4586 },
  { region: "Brong Ahafo", district: "Atebubu-Amantin", lat: 7.6643, lng: -1.0301 },
  { region: "Brong Ahafo", district: "Berekum", lat: 7.4983, lng: -2.6277 },
  { region: "Brong Ahafo", district: "Dormaa", lat: 7.1571, lng: -2.744 },
  { region: "Brong Ahafo", district: "Jaman North", lat: 7.9045, lng: -2.6274 },
  { region: "Brong Ahafo", district: "Jaman South", lat: 7.6616, lng: -2.7563 },
  { region: "Brong Ahafo", district: "Kintampo North", lat: 8.413, lng: -1.5957 },
  { region: "Brong Ahafo", district: "Kintampo South", lat: 7.9677, lng: -1.7794 },
  { region: "Brong Ahafo", district: "Nkoranza", lat: 7.6122, lng: -1.5447 },
  { region: "Brong Ahafo", district: "Pru", lat: 8.06, lng: -1.0407 },
  { region: "Brong Ahafo", district: "Sene", lat: 7.664, lng: -0.3775 },
  { region: "Brong Ahafo", district: "Sunyani", lat: 7.3378, lng: -2.3303 },
  { region: "Brong Ahafo", district: "Tain", lat: 8.0101, lng: -2.3116 },
  { region: "Brong Ahafo", district: "Tano North", lat: 7.2015, lng: -2.1849 },
  { region: "Brong Ahafo", district: "Tano South", lat: 7.1801, lng: -2.0162 },
  { region: "Brong Ahafo", district: "Techiman", lat: 7.662, lng: -1.9571 },
  { region: "Central", district: "Abura-Asebu-Kwamankese", lat: 5.1838, lng: -1.2033 },
  { region: "Central", district: "Agona", lat: 5.6342, lng: -0.7535 },
  { region: "Central", district: "Ajumako-Enyan-Esiam", lat: 5.4053, lng: -1.0049 },
  { region: "Central", district: "Asikuma Odoben Brakwa", lat: 5.646, lng: -1.0156 },
  { region: "Central", district: "Assin North", lat: 5.7988, lng: -1.3868 },
  { region: "Central", district: "Assin South", lat: 5.5189, lng: -1.2548 },
  { region: "Central", district: "Awutu Efutu Senya", lat: 5.422, lng: -0.5061 },
  { region: "Central", district: "Cape Coast", lat: 5.1239, lng: -1.2816 },
  { region: "Central", district: "Gomoa", lat: 5.306, lng: -0.7232 },
  { region: "Central", district: "Komenda-Edina-Eguafo-Abirem", lat: 5.0733, lng: -1.4444 },
  { region: "Central", district: "Lower Denkyira", lat: 5.5302, lng: -1.5445 },
  { region: "Central", district: "Mfantsiman", lat: 5.2008, lng: -1.0411 },
  { region: "Central", district: "Upper Denkyira", lat: 5.9618, lng: -1.8701 },
  { region: "Eastern", district: "Afram Plains", lat: 6.8604, lng: -0.1972 },
  { region: "Eastern", district: "Akwapim North", lat: 5.9721, lng: -0.1448 },
  { region: "Eastern", district: "Akwapim South", lat: 5.8061, lng: -0.259 },
  { region: "Eastern", district: "Asuogyaman", lat: 6.3671, lng: 0.0727 },
  { region: "Eastern", district: "Atiwa", lat: 6.3484, lng: -0.6687 },
  { region: "Eastern", district: "Birim North", lat: 6.2223, lng: -1.046 },
  { region: "Eastern", district: "Birim South", lat: 5.879, lng: -0.9737 },
  { region: "Eastern", district: "East Akim", lat: 6.1825, lng: -0.4812 },
  { region: "Eastern", district: "Fanteakwa", lat: 6.4539, lng: -0.3604 },
  { region: "Eastern", district: "Kwabibirem", lat: 6.1421, lng: -0.8245 },
  { region: "Eastern", district: "Kwahu South", lat: 6.6413, lng: -0.6139 },
  { region: "Eastern", district: "Kwahu West", lat: 6.4965, lng: -0.7732 },
  { region: "Eastern", district: "Manya Krobo", lat: 6.3653, lng: -0.1091 },
  { region: "Eastern", district: "New Juaben", lat: 6.0984, lng: -0.2945 },
  { region: "Eastern", district: "Suhum Kraboa Coaltar", lat: 5.9611, lng: -0.47 },
  { region: "Eastern", district: "West Akim", lat: 5.8569, lng: -0.6193 },
  { region: "Eastern", district: "Yilo Krobo", lat: 6.1568, lng: -0.1511 },
  { region: "Greater Accra", district: "Accra", lat: 5.558, lng: -0.1758 },
  { region: "Greater Accra", district: "Dangbe East", lat: 5.7894, lng: 0.1747 },
  { region: "Greater Accra", district: "Dangbe West", lat: 5.8167, lng: 0.5059 },
  { region: "Greater Accra", district: "Ga East", lat: 5.7202, lng: -0.2395 },
  { region: "Greater Accra", district: "Ga West", lat: 5.5691, lng: -0.3542 },
  { region: "Greater Accra", district: "Tema", lat: 5.6617, lng: 0.0116 },
  { region: "Northern", district: "Bole", lat: 8.6248, lng: -2.2318 },
  { region: "Northern", district: "Bunkpurugu Yunyoo", lat: 10.4677, lng: -0.1081 },
  { region: "Northern", district: "Central Gonja", lat: 8.8811, lng: -1.3568 },
  { region: "Northern", district: "East Gonja", lat: 8.5866, lng: -0.538 },
  { region: "Northern", district: "East Mamprusi", lat: 10.4504, lng: -0.4133 },
  { region: "Northern", district: "Gushiegu", lat: 10.0254, lng: -0.1427 },
  { region: "Northern", district: "Karaga", lat: 9.8906, lng: -0.5334 },
  { region: "Northern", district: "Nanumba North", lat: 8.8328, lng: -0.1705 },
  { region: "Northern", district: "Nanumba South", lat: 8.7838, lng: 0.1542 },
  { region: "Northern", district: "Saboba Chereponi", lat: 9.902, lng: 0.1839 },
  { region: "Northern", district: "Savelugu Nanton", lat: 9.7896, lng: -0.8327 },
  { region: "Northern", district: "Sawa-Tuna-Kalba", lat: 9.4243, lng: -2.349 },
  { region: "Northern", district: "Tamale", lat: 9.3799, lng: -0.7998 },
  { region: "Northern", district: "Tolon-Kumbungu", lat: 9.7234, lng: -1.1047 },
  { region: "Northern", district: "West Gonja", lat: 9.5541, lng: -1.6158 },
  { region: "Northern", district: "West Mamprusi", lat: 10.2962, lng: -1.0825 },
  { region: "Northern", district: "Yendi", lat: 9.3877, lng: -0.1238 },
  { region: "Northern", district: "Zabzugu Tatale", lat: 9.1205, lng: 0.3321 },
  { region: "Upper East", district: "Bawku Municipal", lat: 11.0053, lng: -0.2459 },
  { region: "Upper East", district: "Bawku West", lat: 10.8481, lng: -0.4615 },
  { region: "Upper East", district: "Bolgatanga", lat: 10.7554, lng: -0.8808 },
  { region: "Upper East", district: "Bongo", lat: 10.9195, lng: -0.773 },
  { region: "Upper East", district: "Builsa", lat: 10.5848, lng: -1.3041 },
  { region: "Upper East", district: "Garu Tempane", lat: 10.8477, lng: -0.1771 },
  { region: "Upper East", district: "Kassena Nankana", lat: 10.7804, lng: -1.17 },
  { region: "Upper East", district: "Talensi Nabdam", lat: 10.6715, lng: -0.7366 },
  { region: "Upper West", district: "Jirapa Lambussie", lat: 10.6766, lng: -2.6204 },
  { region: "Upper West", district: "Lawra", lat: 10.7297, lng: -2.8075 },
  { region: "Upper West", district: "Nadowli", lat: 10.3259, lng: -2.4221 },
  { region: "Upper West", district: "Sissala East", lat: 10.5837, lng: -1.7372 },
  { region: "Upper West", district: "Sissala West", lat: 10.6675, lng: -2.2187 },
  { region: "Upper West", district: "Wa", lat: 9.9724, lng: -2.2683 },
  { region: "Upper West", district: "Wa East", lat: 10.0111, lng: -1.8589 },
  { region: "Upper West", district: "Wa West", lat: 9.9145, lng: -2.6705 },
  { region: "Volta", district: "Adaklu Anyigbe", lat: 6.3932, lng: 0.4791 },
  { region: "Volta", district: "Akatsi", lat: 6.1584, lng: 0.8007 },
  { region: "Volta", district: "Ho", lat: 6.6977, lng: 0.5197 },
  { region: "Volta", district: "Hohoe", lat: 6.9666, lng: 0.4329 },
  { region: "Volta", district: "Jasikan", lat: 7.3781, lng: 0.3949 },
  { region: "Volta", district: "Kadjebi", lat: 7.7041, lng: 0.4743 },
  { region: "Volta", district: "Keta", lat: 5.8917, lng: 0.9007 },
  { region: "Volta", district: "Ketu", lat: 6.0215, lng: 1.0281 },
  { region: "Volta", district: "Kpandu", lat: 6.9119, lng: 0.2668 },
  { region: "Volta", district: "Krachi", lat: 8.0498, lng: -0.0774 },
  { region: "Volta", district: "Krachi East", lat: 7.7354, lng: 0.2205 },
  { region: "Volta", district: "Nkwanta", lat: 8.3872, lng: 0.3056 },
  { region: "Volta", district: "North Tongu", lat: 6.1445, lng: 0.3954 },
  { region: "Volta", district: "South Dayi", lat: 6.5189, lng: 0.2138 },
  { region: "Volta", district: "South Tongu", lat: 5.9204, lng: 0.6839 },
  { region: "Western", district: "Ahanta West", lat: 4.8019, lng: -2.0179 },
  { region: "Western", district: "Aowin-Suaman", lat: 5.7793, lng: -2.7222 },
  { region: "Western", district: "Bia", lat: 6.73, lng: -3.0161 },
  { region: "Western", district: "Bibiani Anhwiaso Bekwai", lat: 6.3045, lng: -2.2548 },
  { region: "Western", district: "Jomoro", lat: 5.0699, lng: -2.7805 },
  { region: "Western", district: "Juabeso", lat: 6.3871, lng: -2.8659 },
  { region: "Western", district: "Mpohor Wassa East", lat: 5.2564, lng: -1.7212 },
  { region: "Western", district: "Nzema East", lat: 4.9752, lng: -2.3402 },
  { region: "Western", district: "Sefwi Wiawso", lat: 6.1985, lng: -2.6342 },
  { region: "Western", district: "Shama Ahanta East", lat: 4.9618, lng: -1.6853 },
  { region: "Western", district: "Wasa Amenfi East", lat: 5.7689, lng: -2.0054 },
  { region: "Western", district: "Wasa Amenfi West", lat: 5.7041, lng: -2.3242 },
  { region: "Western", district: "Wassa West", lat: 5.3456, lng: -1.9995 },
];

export const GHANA_REGIONS: string[] = Array.from(
  new Set(GHANA_DISTRICTS.map((d) => d.region)),
).sort();

export function districtsInRegion(region: string): GhanaDistrict[] {
  return GHANA_DISTRICTS.filter((d) => d.region === region);
}

export function findDistrict(region: string, district: string): GhanaDistrict | undefined {
  return GHANA_DISTRICTS.find((d) => d.region === region && d.district === district);
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Loose name match for free-typed towns: case/punctuation insensitive substring. */
export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ALIAS_BY_NORMALIZED = new Map(
  Object.entries(TOWN_ALIASES).map(([town, district]) => [normalizeName(town), district]),
);

/**
 * Resolve a free-typed town to a district. Never shown to the customer — it
 * only exists so a typed town can be priced. When a region is given we look
 * there first, so "Accra" in Greater Accra doesn't match a similarly named
 * place in another region.
 */
export function matchDistrictByName(typed: string, region?: string | null): GhanaDistrict | undefined {
  const needle = normalizeName(typed);
  if (needle.length < 3) return undefined;

  // Neighbourhoods first: customers type "Osu" or "Madina", which are not
  // districts but sit inside one.
  const aliasDistrict = ALIAS_BY_NORMALIZED.get(needle);
  if (aliasDistrict) {
    const match = GHANA_DISTRICTS.find((d) => d.district === aliasDistrict);
    // Only trust the alias if it agrees with the region the customer picked.
    if (match && (!region || match.region === region)) return match;
  }

  const search = (pool: GhanaDistrict[]) =>
    pool.find((d) => normalizeName(d.district) === needle) ??
    pool.find((d) => normalizeName(d.district).includes(needle)) ??
    pool.find((d) => needle.includes(normalizeName(d.district)));

  if (region) {
    const inRegion = search(districtsInRegion(region));
    if (inRegion) return inRegion;
  }
  return search(GHANA_DISTRICTS);
}
