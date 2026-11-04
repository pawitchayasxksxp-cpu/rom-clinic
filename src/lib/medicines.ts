import "server-only";
import { requireAdmin } from "./session";
import { getDatabase } from "./db";
import { masterImageUrl, type ImageAsset } from "./master-images";
export type Medicine = { id: string; name: string; dosage_form: string; form_other: string; unit: string; unit_other: string; stock: string; price: string; note: string; image_url: string | null };
export async function listMedicines() {
  await requireAdmin();
  const result = await getDatabase().query<Omit<Medicine, "image_url"> & { image_asset: ImageAsset | null }>("SELECT id, name, dosage_form, form_other, unit, unit_other, stock::text, price::text, note, image_asset FROM rom_medicine WHERE archived_at IS NULL ORDER BY name, id");
  return result.rows.map(({ image_asset, ...medicine }) => ({ ...medicine, image_url: masterImageUrl(image_asset) }));
}
