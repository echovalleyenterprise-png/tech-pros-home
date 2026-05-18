import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// TEMP ADMIN ROUTE — confirm a user's email via Supabase REST API
// Usage: GET /api/admin/confirm-user?email=user@example.com
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Missing email param" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  // List users via Supabase Auth Admin REST API
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    return NextResponse.json({ error: `listUsers failed: ${err}` }, { status: 500 });
  }

  const listData = (await listRes.json()) as {
    users: Array<{ id: string; email: string }>;
  };

  const user = listData.users.find((u) => u.email === email) ?? null;
  if (!user) {
    return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });
  }

  // Confirm the email via PUT
  const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: "PUT",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_confirm: true }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.text();
    return NextResponse.json({ error: `updateUser failed: ${err}` }, { status: 500 });
  }

  const updated = (await updateRes.json()) as {
    id: string;
    email: string;
    email_confirmed_at: string | null;
  };

  return NextResponse.json({
    ok: true,
    userId: updated.id,
    email: updated.email,
    confirmed: updated.email_confirmed_at,
  });
}
