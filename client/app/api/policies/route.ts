import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const payer = searchParams.get("payer");

    if (!payer) {
      return NextResponse.json(
        { error: "Missing payer address" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();

    // Query all policies for this payer from Supabase (active + inactive for history)
    const { data: policies, error } = await supabase
      .from("policies")
      .select("*")
      .eq("payer", payer.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(policies || [], { status: 200 });
  } catch (error: any) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch policies" },
      { status: 500 },
    );
  }
}
