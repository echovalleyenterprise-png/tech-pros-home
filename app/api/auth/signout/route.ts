import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"));
}
