// Regenerates src/data/ghanaDistricts.ts from public/ghana_towns.json.
//
// The source GeoJSON is ~2.2MB of GADM level-2 polygon geometry. The app only
// needs each district's name, its region, and a representative point for
// proximity pricing, so we reduce it to a ~12KB module at build time rather
// than fetching the polygons in the browser.
//
//   node scripts/build-districts.mjs

import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "public/ghana_towns.json";
const TARGET = "src/data/ghanaDistricts.ts";

function coordsOf(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates.flat(1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

const featureCollection = JSON.parse(readFileSync(SOURCE, "utf8"));

const rows = featureCollection.features
  .map((feature) => {
    const coords = coordsOf(feature.geometry);
    let sumLng = 0;
    let sumLat = 0;
    for (const [lng, lat] of coords) {
      sumLng += lng;
      sumLat += lat;
    }
    return {
      region: feature.properties.NAME_1,
      district: feature.properties.NAME_2,
      lat: Number((sumLat / coords.length).toFixed(4)),
      lng: Number((sumLng / coords.length).toFixed(4)),
    };
  })
  .sort((a, b) => a.region.localeCompare(b.region) || a.district.localeCompare(b.district));

console.log(`Reduced ${rows.length} districts from ${SOURCE}`);
console.log(`Write the result into ${TARGET} using the same template as the committed file.`);
console.log(JSON.stringify(rows));
