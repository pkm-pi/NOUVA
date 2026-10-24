/* Upload gambar ke Cloudinary memakai unsigned preset. API Secret tidak diperlukan di browser. */
window.nouvaUploadImage = async function (file, folder = "nouva") {
  const c = window.NOUVA_CONFIG || {};
  if (!file) throw new Error("Pilih file gambar terlebih dahulu.");
  if (!c.CLOUDINARY_CLOUD_NAME || c.CLOUDINARY_CLOUD_NAME.startsWith("ISI_") || !c.CLOUDINARY_UPLOAD_PRESET || c.CLOUDINARY_UPLOAD_PRESET.startsWith("ISI_")) {
    throw new Error("Konfigurasi Cloudinary belum diisi di js/nouva-config.js.");
  }
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  const body = new FormData(); body.append("file", file); body.append("upload_preset", c.CLOUDINARY_UPLOAD_PRESET); body.append("folder", folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.CLOUDINARY_CLOUD_NAME)}/image/upload`, { method: "POST", body });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || "Upload gambar gagal.");
  return { url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height };
};
