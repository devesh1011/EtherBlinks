import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseClient } from "@/lib/supabaseClient";

function generateShortId() {
  return crypto.randomBytes(8).toString("base64url").slice(0, 12);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const shortId = generateShortId();

    const payload = {
      ...body,
      short_id: shortId,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("actions")
      .insert([payload])
      .select("id, short_id, action_type")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const shortUrl = `${request.nextUrl.origin}/a/${data.action_type}-${data.short_id}`;

    return NextResponse.json(
      {
        id: data.id,
        short_id: data.short_id,
        short_url: shortUrl,
      },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create action";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
