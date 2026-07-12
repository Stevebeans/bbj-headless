/**
 * Downscale/re-encode an image File to a web-friendly JPEG before upload.
 * Returns the original file when it is already small, or when the browser
 * cannot decode it (the server will then report a clear error instead of
 * silently dropping it).
 */
const MAX_DIM = 1600;
const MAX_BYTES = 1024 * 1024; // 1MB: under this, JPEG/PNG/GIF/WebP pass through untouched
const PASSTHROUGH_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function downscaleImage(file) {
  if (!file || !file.type?.startsWith("image/")) return file;
  if (PASSTHROUGH_TYPES.includes(file.type) && file.size <= MAX_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    const base = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // undecodable (e.g. HEIC on Chrome): send original, server now reports why
  }
}
