import { getAdminSession } from "@/lib/session";
import { searchPatientChoices } from "@/lib/patients";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  if (!await getAdminSession()) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401, headers });
  const query = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 100);
  try {
    return Response.json(await searchPatientChoices(query), { headers });
  } catch {
    return Response.json({ error: "ค้นหาผู้ป่วยไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500, headers });
  }
}
