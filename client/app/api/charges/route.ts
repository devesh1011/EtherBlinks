import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const payer = searchParams.get("payer");
    const merchant = searchParams.get("merchant");
    const status = searchParams.get("status"); // "success" | "failed" | "pending"
    const from = searchParams.get("from"); // ISO date string
    const to = searchParams.get("to"); // ISO date string
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseClient();

    // Build query joining charges with policies to get payer/merchant info
    let query = supabase
      .from("charges")
      .select(
        `
        id,
        policy_id,
        chain_id,
        tx_hash,
        status,
        amount,
        protocol_fee,
        error_message,
        attempt_count,
        created_at,
        completed_at,
        policies!inner (
          payer,
          merchant,
          metadata_url,
          interval_seconds
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (payer) {
      query = query.eq("policies.payer", payer.toLowerCase());
    }
    if (merchant) {
      query = query.eq("policies.merchant", merchant.toLowerCase());
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lte("created_at", to);
    }

    const { data: charges, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { charges: charges || [], total: count || 0 },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching charges:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch charges" },
      { status: 500 }
    );
  }
}
