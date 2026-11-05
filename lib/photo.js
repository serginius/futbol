// Recorta al centro, achica a 400x400 y sube a Supabase Storage. Devuelve la URL pública.
export async function uploadPhoto(supabase, playerId, file) {
  const bitmap = await createImageBitmap(file);
  const size = 400, k = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  canvas.getContext("2d").drawImage(bitmap, (bitmap.width - k) / 2, (bitmap.height - k) / 2, k, k, 0, 0, size, size);
  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  const path = `${playerId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}
