/**
 * Fetch oversized images, compress with sips, upload to Cloudinary.
 * Usage: node migrate/compress-upload.mjs
 */

import { createHash } from "crypto";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, ".env.migrate");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv();

const CLD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLD_KEY  = process.env.CLOUDINARY_API_KEY;
const CLD_SEC  = process.env.CLOUDINARY_API_SECRET;

// Images that failed due to size — add more here if needed
const OVERSIZED = [
  {
    url: "https://jbjedcmmtoffkodwtpwm.supabase.co/storage/v1/object/public/public-assets/heroSlides/img1/1781386307397_IMG_2692.JPG",
    folder: "fitweargh/hero",
    publicId: "1781386307397_IMG_2692",
  },
];

async function cloudinaryUploadFile(filePath, folder, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, public_id: publicId, timestamp };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + CLD_SEC;
  const signature = createHash("sha1").update(toSign).digest("hex");

  const { FormData, Blob } = await import("node:buffer").catch(() => ({}));
  // Use node 18+ native FormData
  const formData = new globalThis.FormData();
  const fileBytes = readFileSync(filePath);
  const blob = new Blob([fileBytes], { type: "image/jpeg" });
  formData.append("file", blob, publicId + ".jpg");
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", CLD_KEY);
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json.error));
  return json.secure_url;
}

async function main() {
  for (const { url, folder, publicId } of OVERSIZED) {
    console.log(`\nProcessing: ${publicId}`);

    // 1. Download
    const tmpIn = resolve(tmpdir(), `cld_in_${publicId}.jpg`);
    const tmpOut = resolve(tmpdir(), `cld_out_${publicId}.jpg`);
    console.log("  Downloading…");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(tmpIn, buf);
    console.log(`  Downloaded: ${(buf.length / 1024 / 1024).toFixed(1)} MB`);

    // 2. Compress with sips (macOS built-in) — resize max 2400px wide, JPEG quality 80
    console.log("  Compressing with sips…");
    execSync(
      `sips --resampleWidth 2400 --setProperty formatOptions 80 "${tmpIn}" --out "${tmpOut}"`,
      { stdio: "inherit" }
    );
    const outSize = readFileSync(tmpOut).length;
    console.log(`  Compressed: ${(outSize / 1024 / 1024).toFixed(1)} MB`);

    if (outSize > 10 * 1024 * 1024) {
      // Still too large — try smaller
      console.log("  Still >10MB, trying 1600px…");
      execSync(
        `sips --resampleWidth 1600 --setProperty formatOptions 70 "${tmpIn}" --out "${tmpOut}"`,
        { stdio: "inherit" }
      );
      console.log(`  Re-compressed: ${(readFileSync(tmpOut).length / 1024 / 1024).toFixed(1)} MB`);
    }

    // 3. Upload to Cloudinary
    console.log("  Uploading to Cloudinary…");
    const newUrl = await cloudinaryUploadFile(tmpOut, folder, publicId);
    console.log(`  ✓ ${newUrl}`);

    // Cleanup
    unlinkSync(tmpIn);
    unlinkSync(tmpOut);

    console.log(`\nUpdate hero_slides in new Supabase — set image1_url/image1_path to:`);
    console.log(`  ${newUrl}`);
    console.log(`for any slide that still references the old Supabase URL.`);
  }
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
