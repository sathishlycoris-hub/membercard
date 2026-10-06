/** Downscale + compress a photo in the browser so it stays small in the DB (~30-60 KB). */
export async function resizeImage(file: File, maxW = 360, maxH = 450, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

const MAX_PDF_BYTES = 1_500_000;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
}

/** Aadhaar / Voter ID attachment: images are compressed (text stays readable), PDFs are kept as-is. */
export async function prepareDocument(file: File) {
  if (file.type === "application/pdf") {
    if (file.size > MAX_PDF_BYTES) throw new Error("PDF is too large (max 1.5 MB). Attach a smaller file or a photo.");
    return readAsDataUrl(file);
  }
  if (file.type.startsWith("image/")) return resizeImage(file, 1600, 1600, 0.8);
  throw new Error("Attach a JPG, PNG or PDF file.");
}
