/**
 * Crops/resizes an image file to a target resolution using "cover" behavior.
 * - Centralizes content
 * - Never distorts (preserves aspect ratio)
 * - Crops excess from the longer side
 * Returns a new File (JPEG) ready for upload.
 */
export async function cropImageToResolution(
  file: File,
  targetW = 1920,
  targetH = 1080,
  quality = 0.9,
): Promise<File> {
  // Skip non-images defensively
  if (!file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  // Object-fit: cover math
  const targetRatio = targetW / targetH;
  const srcRatio = img.width / img.height;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;

  if (srcRatio > targetRatio) {
    // source is wider → crop sides
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    // source is taller → crop top/bottom
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + "_1920x1080.jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}
