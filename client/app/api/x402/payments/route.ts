import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * GET /api/x402/payments — List x402 payment records
 * Query: ?merchant=0x...&payer=0x...&endpoint_id=...&status=...&limit=50&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchant = searchParams.get("merchant");
    const payer = searchParams.get("payer");
    const endpointId = searchParams.get("endpoint_id");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseClient();

    let query = supabase
      .from("x402_payments")
      .select(
        `
        *,
        x402_endpoints (
          path,
          method,
          price_usdc,
          description
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (merchant) {
      query = query.eq("merchant_address", merchant.toLowerCase());
    }
    if (payer) {
      query = query.eq("payer_address", payer.toLowerCase());
    }
    if (endpointId) {
      query = query.eq("endpoint_id", endpointId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ payments: data || [], total: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
