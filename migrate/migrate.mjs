/**
 * FitwearGH migration script
 *
 * Reads all data from OLD Supabase (anon key — public tables only)
 * Uploads all images to Cloudinary
 * Writes all rows to NEW Supabase with Cloudinary URLs replacing Supabase storage URLs
 *
 * Usage:
 *   node migrate/migrate.mjs
 *
 * Required env vars (copy to migrate/.env.migrate and fill in):
 *   OLD_SUPABASE_URL
 *   OLD_SUPABASE_ANON_KEY
 *   NEW_SUPABASE_URL
 *   NEW_SUPABASE_SERVICE_ROLE_KEY
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync, existsSync, createWriteStream } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Logger (terminal + file) ──────────────────────────────────────────────────
const logStream = createWriteStream(resolve(__dirname, "migration.log"), { flags: "a" });
const logLine = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`;
  process.stdout.write(line + "\n");
  logStream.write(line + "\n");
};
const log   = (...args) => logLine(args.join(" "));
const warn  = (...args) => logLine("WARN  " + args.join(" "));
const error = (...args) => logLine("ERROR " + args.join(" "));

// ── Load env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, ".env.migrate");
  if (!existsSync(envPath)) {
    process.stderr.write("ERROR: migrate/.env.migrate not found. Copy migrate/.env.migrate.example and fill it in.\n");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const OLD_URL   = process.env.OLD_SUPABASE_URL;
const OLD_KEY   = process.env.OLD_SUPABASE_ANON_KEY;
const NEW_URL   = process.env.NEW_SUPABASE_URL;
const NEW_KEY   = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
const CLD_NAME  = process.env.CLOUDINARY_CLOUD_NAME;
const CLD_KEY   = process.env.CLOUDINARY_API_KEY;
const CLD_SEC   = process.env.CLOUDINARY_API_SECRET;

for (const [k, v] of Object.entries({ OLD_URL, OLD_KEY, NEW_URL, NEW_KEY, CLD_NAME, CLD_KEY, CLD_SEC })) {
  if (!v) { process.stderr.write(`ERROR: missing env var ${k}\n`); process.exit(1); }
}

const oldDb = createClient(OLD_URL, OLD_KEY);
const newDb = createClient(NEW_URL, NEW_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { Authorization: `Bearer ${NEW_KEY}` } },
});

// ── Cloudinary upload ─────────────────────────────────────────────────────────
async function cloudinaryUpload(imageUrl, folder, barePublicId) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Signature params must be sorted alphabetically, no API key/secret in string
  const params = { folder, public_id: barePublicId, timestamp };
  const toSign = Object.keys(params).sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&") + CLD_SEC;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const formData = new FormData();
  formData.append("file", imageUrl);
  formData.append("folder", folder);
  formData.append("public_id", barePublicId);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", CLD_KEY);
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloudinary upload failed for ${barePublicId}: ${body}`);
  }
  const json = await res.json();
  return json.secure_url;
}

// ── URL → bare publicId (no folder, no extension) ────────────────────────────
function urlToPublicId(url) {
  if (!url) return `img_${Date.now()}`;
  try {
    const u = new URL(url);
    // e.g. /storage/v1/object/public/public-assets/products/abc_123.jpg → abc_123
    const segs = u.pathname.split("/").filter(Boolean);
    const filename = segs[segs.length - 1] ?? `img_${Date.now()}`;
    // strip extension, sanitise chars Cloudinary dislikes
    return filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_\-]/g, "_");
  } catch {
    return `img_${Date.now()}`;
  }
}

// ── Upload single URL, return Cloudinary URL (or original if blank) ────────────
const uploadCache = new Map();

async function migrateUrl(url, folder = "fitweargh") {
  if (!url) return url;
  if (!url.startsWith("http")) return url;
  if (url.includes("cloudinary.com")) return url;   // already migrated
  if (uploadCache.has(url)) return uploadCache.get(url);

  const publicId = urlToPublicId(url);
  try {
    const newUrl = await cloudinaryUpload(url, folder, publicId);
    uploadCache.set(url, newUrl);
    log(`  IMG OK  ${folder}/${publicId}`);
    return newUrl;
  } catch (err) {
    error(`  IMG FAIL  ${url}\n    ${err.message}`);
    return url;  // keep original on failure so data isn't lost
  }
}

async function migrateUrls(urls, folder) {
  if (!Array.isArray(urls)) return [];
  return Promise.all(urls.map((u) => migrateUrl(u, folder)));
}

// ── Fetch all rows from a table ───────────────────────────────────────────────
async function fetchAll(table) {
  const { data, error: err } = await oldDb.from(table).select("*");
  if (err) {
    warn(`could not read ${table}: ${err.message} (RLS or table missing — skipping)`);
    return [];
  }
  return data ?? [];
}

// Known columns per table — strip extras the old DB may have added
const TABLE_COLS = {
  products:         new Set(["id","name","price","discount_price","category","categories","sizes","colors","stock","color_size_stock","image_url","image_path","images","image_paths","display_image_index","color_image_map","subcategories","size_chart_id","description","created_at"]),
  hero_slides:      new Set(["id","title","subtitle","badge","cta_text","bg_image_url","bg_image_path","image1_url","image1_path","image2_url","image2_path","bg_position","display_order","active","page","created_at"]),
  categories:       new Set(["id","name","slug","image_url","image_path","product_count","created_at"]),
  site_settings:    new Set(["key","value","updated_at"]),
  shipping_methods: new Set(["id","name","description","price","enabled","created_at"]),
  delivery_areas:   new Set(["id","name","price","enabled","created_at"]),
  size_charts:      new Set(["id","name","headers","rows","created_at"]),
  orders:           new Set(["id","user_id","customer_name","customer_email","customer_phone","address","city","delivery_area","delivery_fee","line_items","items","total","status","payment_provider","payment_reference","payment_status","paid_at","created_at"]),
  profiles:         new Set(["id","email","full_name","phone","address","city","created_at"]),
  admin_users:      new Set(["id","user_id","email","role","created_at"]),
  carts:            new Set(["id","user_id","items","updated_at"]),
  mail_queue:       new Set(["id","to_email","subject","html","status","attempts","error","created_at","sent_at"]),
};

function stripCols(table, row) {
  const allowed = TABLE_COLS[table];
  if (!allowed) return row;
  return Object.fromEntries(Object.entries(row).filter(([k]) => allowed.has(k)));
}

// ── Insert rows into new DB, chunked ─────────────────────────────────────────
async function insertAll(table, rows, chunkSize = 50) {
  if (rows.length === 0) { log(`  (no rows)`); return; }
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize).map((r) => stripCols(table, r));
    const { error: err } = await newDb.from(table).upsert(chunk, { onConflict: "id" });
    if (err) throw new Error(`Insert into ${table} failed: ${err.message}`);
    log(`  DB ${table} rows ${i + 1}–${i + chunk.length} inserted`);
  }
}

// ── Migrate products ───────────────────────────────────────────────────────────
async function migrateProducts() {
  log("\n── products ──────────────────────────────────");
  const rows = await fetchAll("products");
  log(`  fetched ${rows.length} rows`);
  if (rows.length === 0) return;

  // Columns present in new schema (schema.sql) — strip anything extra from old DB
  const PRODUCT_COLS = new Set([
    "id","name","price","discount_price","category","categories","sizes","colors",
    "stock","color_size_stock","image_url","image_path","images","image_paths",
    "display_image_index","color_image_map","subcategories","size_chart_id",
    "description","created_at",
  ]);

  const migrated = await Promise.all(rows.map(async (row) => {
    const image_url    = await migrateUrl(row.image_url, "fitweargh/products");
    const images       = await migrateUrls(row.images, "fitweargh/products");
    const full = {
      ...row,
      image_url,
      image_path: image_url,
      images,
      image_paths: images,
    };
    // Drop columns the new schema doesn't have
    return Object.fromEntries(Object.entries(full).filter(([k]) => PRODUCT_COLS.has(k)));
  }));

  await insertAll("products", migrated);
  log(`  ✓ products done`);
}

// ── Migrate hero_slides ────────────────────────────────────────────────────────
async function migrateHeroSlides() {
  log("\n── hero_slides ────────────────────────────────");
  const rows = await fetchAll("hero_slides");
  log(`  fetched ${rows.length} rows`);
  if (rows.length === 0) return;

  const HERO_COLS = new Set([
    "id","title","subtitle","badge","cta_text","bg_image_url","bg_image_path",
    "image1_url","image1_path","image2_url","image2_path","bg_position",
    "display_order","active","page","created_at",
  ]);

  const migrated = await Promise.all(rows.map(async (row) => {
    const full = {
      ...row,
      bg_image_url:  await migrateUrl(row.bg_image_url,  "fitweargh/hero"),
      bg_image_path: await migrateUrl(row.bg_image_url,  "fitweargh/hero"),
      image1_url:    await migrateUrl(row.image1_url,    "fitweargh/hero"),
      image1_path:   await migrateUrl(row.image1_url,    "fitweargh/hero"),
      image2_url:    await migrateUrl(row.image2_url,    "fitweargh/hero"),
      image2_path:   await migrateUrl(row.image2_url,    "fitweargh/hero"),
    };
    return Object.fromEntries(Object.entries(full).filter(([k]) => HERO_COLS.has(k)));
  }));

  await insertAll("hero_slides", migrated);
  log(`  ✓ hero_slides done`);
}

// ── Migrate categories ────────────────────────────────────────────────────────
async function migrateCategories() {
  log("\n── categories ─────────────────────────────────");
  const rows = await fetchAll("categories");
  log(`  fetched ${rows.length} rows`);
  if (rows.length === 0) return;

  const CAT_COLS = new Set([
    "id","name","slug","image_url","image_path","product_count","created_at",
  ]);

  const migrated = await Promise.all(rows.map(async (row) => {
    const full = {
      ...row,
      image_url:  await migrateUrl(row.image_url,  "fitweargh/categories"),
      image_path: await migrateUrl(row.image_url,  "fitweargh/categories"),
    };
    return Object.fromEntries(Object.entries(full).filter(([k]) => CAT_COLS.has(k)));
  }));

  await insertAll("categories", migrated);
  log(`  ✓ categories done`);
}

// ── Migrate site_settings (may contain image URLs in JSON value) ──────────────
async function migrateSiteSettings() {
  log("\n── site_settings ──────────────────────────────");
  const rows = await fetchAll("site_settings");
  log(`  fetched ${rows.length} rows`);
  if (rows.length === 0) return;

  const migrated = await Promise.all(rows.map(async (row) => {
    // Deep-scan value JSON for image URLs and migrate them
    const value = await migrateJsonUrls(row.value, "fitweargh/settings");
    return { ...row, value };
  }));

  // site_settings has text primary key = key
  for (const row of migrated) {
    const { error } = await newDb.from("site_settings").upsert(row, { onConflict: "key" });
    if (error) throw new Error(`Insert site_settings failed: ${error.message}`);
  }
  log(`  ✓ site_settings done`);
}

// Recursively walk a JSON value and migrate any Supabase storage URLs found
async function migrateJsonUrls(val, folder) {
  if (typeof val === "string") {
    return val.includes(OLD_URL) ? await migrateUrl(val, folder) : val;
  }
  if (Array.isArray(val)) {
    return Promise.all(val.map((v) => migrateJsonUrls(v, folder)));
  }
  if (val && typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = await migrateJsonUrls(v, folder);
    }
    return out;
  }
  return val;
}

// ── Migrate plain tables (no images) ─────────────────────────────────────────
async function migratePlain(table, conflictCol = "id") {
  log(`\n── ${table} ${"─".repeat(Math.max(0, 46 - table.length))}`);
  const rows = await fetchAll(table);
  log(`  fetched ${rows.length} rows`);
  if (rows.length === 0) return;
  await insertAll(table, rows);
  log(`  ✓ ${table} done`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log("FitwearGH migration starting…");
  log(`  OLD: ${OLD_URL}`);
  log(`  NEW: ${NEW_URL}`);
  log(`  Cloudinary: ${CLD_NAME}`);

  // Tables with images first
  await migrateProducts();
  await migrateHeroSlides();
  await migrateCategories();
  await migrateSiteSettings();

  // Plain tables (no images — just copy rows)
  await migratePlain("shipping_methods");
  await migratePlain("delivery_areas");
  await migratePlain("size_charts");
  await migratePlain("orders");           // RLS may block — will warn and skip
  await migratePlain("profiles");         // RLS may block — will warn and skip
  await migratePlain("admin_users");      // RLS may block — will warn and skip
  await migratePlain("carts");            // RLS may block — will warn and skip
  await migratePlain("mail_queue");       // RLS may block — will warn and skip

  log("\n✓ Migration complete.");
  log("\nNOTE: orders/profiles/admin_users may show 'skipped' due to RLS.");
  log("      For those tables, export CSVs from old Supabase dashboard and");
  log("      import via new dashboard (Table Editor → Import CSV).");
}

main().catch((err) => {
  error("\nFATAL:", err.message);
  process.exit(1);
});
