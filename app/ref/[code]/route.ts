import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params;
  const { origin } = new URL(request.url);

  // Set affiliate cookie (30 days)
  const response = NextResponse.redirect(`${origin}/signup`);
  response.cookies.set("ref_code", code, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    httpOnly: false, // readable by client JS in signup page
    sameSite: "lax",
  });

  return response;
}
