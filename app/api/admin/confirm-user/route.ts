import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// TEMP ADMIN ROUTE — confirm a user's email via service role key
// Usage: GET /api/admin/confirm-user?email=user@example.com
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email param" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // List users and find by email
  const { data: listData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const user = listData.users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
  }

  // Confirm the email
  const { data, error } = await admin.auth.admin.updateUser(user.id, {
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    userId: data.user.id,
    email: data.user.email,
    confirmed: data.user.email_confirmed_at,
  });
}
