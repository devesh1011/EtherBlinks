import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { ETHERLINK_SHADOWNET } from "@/lib/x402";

/**
 * GET /api/x402/endpoints — List x402 endpoints for a merchant
 * Query: ?merchant=0x...&active=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchant = searchParams.get("merchant");
    const activeOnly = searchParams.get("active") !== "false";

    const supabase = getSupabaseClient();

    let query = supabase
      .from("x402_endpoints")
      .select("*")
      .order("created_at", { ascending: false });

    if (merchant) {
      query = query.eq("merchant_address", merchant.toLowerCase());
    }
    if (activeOnly) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ endpoints: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/x402/endpoints — Create a new paywalled endpoint
 * Body: { merchant, path, method?, price_usdc, description?, response_body? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      merchant,
      path,
      method = "GET",
      price_usdc,
      description,
      response_body,
    } = body;

    if (!merchant || !path || !price_usdc) {
      return NextResponse.json(
        { error: "merchant, path, and price_usdc are required" },
        { status: 400 }
      );
    }

    if (price_usdc <= 0) {
      return NextResponse.json(
        { error: "price_usdc must be positive" },
        { status: 400 }
      );
    }

    // Normalize path to start with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("x402_endpoints")
      .insert({
        merchant_address: merchant.toLowerCase(),
        path: normalizedPath,
        method: method.toUpperCase(),
        price_usdc,
        description: description || null,
        network: ETHERLINK_SHADOWNET.network,
        token_address: ETHERLINK_SHADOWNET.usdc,
        response_body: response_body || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An endpoint with this path and method already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ endpoint: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/x402/endpoints — Update an existing endpoint
 * Body: { id, price_usdc?, description?, active?, response_body? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Endpoint id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.price_usdc !== undefined) updateData.price_usdc = updates.price_usdc;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.response_body !== undefined) updateData.response_body = updates.response_body;

    const { data, error } = await supabase
      .from("x402_endpoints")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ endpoint: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/x402/endpoints — Delete an endpoint
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Endpoint id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("x402_endpoints")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
