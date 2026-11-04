import { getAuth } from "@/lib/auth";

async function handler(request: Request) {
  try {
    return await getAuth().handler(request);
  } catch {
    console.error("Authentication service failed.");
    return Response.json(
      { message: "Authentication is temporarily unavailable." },
      { status: 503 },
    );
  }
}
export const GET = handler;
export const POST = handler;
