const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export async function uploadToCloudinary(file: File, folder = "fitweargh"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let reason = "Upload failed.";
    try {
      const json = await res.json();
      reason = json?.error?.message ?? reason;
    } catch {}
    if (reason.toLowerCase().includes("file size too large")) {
      throw new Error("Image is too large. Please use an image under 10MB.");
    }
    if (reason.toLowerCase().includes("upload preset")) {
      throw new Error("Image upload is misconfigured. Please contact support.");
    }
    throw new Error(`Image upload failed: ${reason}`);
  }

  const json = await res.json();
  return json.secure_url as string;
}
