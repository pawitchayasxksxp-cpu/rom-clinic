import "server-only";
import { requireAdmin } from "./session";
import { masterImageUrl, type ImageAsset } from "./master-images";
import { getDatabase } from "./db";
export type Course = { id: string; name: string; price: string; description: string; archived: boolean; image_url?: string | null };
export async function listCourses() {
  await requireAdmin();
  const result = await getDatabase().query<Course & { image_asset: ImageAsset | null }>("SELECT id, name, price::text, description, image_asset, (archived_at IS NOT NULL) AS archived FROM rom_course WHERE archived_at IS NULL ORDER BY name, id");
  return result.rows.map(({ image_asset, ...course }) => ({ ...course, image_url: masterImageUrl(image_asset) }));
}
export async function getCourse(id: string) {
  await requireAdmin();
  const result = await getDatabase().query<Course & { image_asset: ImageAsset | null }>("SELECT id, name, price::text, description, image_asset, (archived_at IS NOT NULL) AS archived FROM rom_course WHERE id = $1", [id]);
  const course = result.rows[0]; return course ? { ...course, image_url: masterImageUrl(course.image_asset) } : null;
}
