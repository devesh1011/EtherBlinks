import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  verifyPayment,
  parsePaymentHeader,
  usdToUsdcRaw,
  ETHERLINK_SHADOWNET,
  X402_HEADERS,
  type PaymentRequirement,
} from "@/lib/x402";

/**
 * Dynamic x402 paywall catch-all route
 *
 * Any request to /api/x402/pay/[...path] will:
 * 1. Look up the path in x402_endpoints
 * 2. If no X-PAYMENT header → return 402 with payment requirements
 * 3. If X-PAYMENT header present → verify on-chain, record payment, return resource
 *
 * x402 Protocol Flow:
 *   GET /api/x402/pay/weather → 402 + PaymentRequired
 *   GET /api/x402/pay/weather (+ X-PAYMENT header) → 200 + resource
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleRequest(request, await params, "POST");
}

async function handleRequest(
  request: NextRequest,
  pathParams: { path: string[] },
  method: string
) {
  try {
    const path = `/${pathParams.path.join("/")}`;
    const supabase = getSupabaseClient();

    // 1. Look up the endpoint
    const { data: endpoint, error: lookupError } = await supabase
      .from("x402_endpoints")
      .select("*")
      .eq("path", path)
      .eq("method", method)
      .eq("active", true)
      .single();

    if (lookupError || !endpoint) {
      return NextResponse.json(
        { error: `No x402 endpoint found for ${method} ${path}` },
        { status: 404 }
      );
    }

    // 2. Build payment requirement
    const requirement: PaymentRequirement = {
      scheme: "exact",
      network: ETHERLINK_SHADOWNET.network,
      maxAmountRequired: usdToUsdcRaw(endpoint.price_usdc),
      resource: path,
      description: endpoint.description || `Access to ${method} ${path}`,
      payTo: endpoint.merchant_address as `0x${string}`,
      asset: ETHERLINK_SHADOWNET.usdc,
      maxTimeoutSeconds: 300, // 5 minutes
    };

    // 3. Check for payment header
    const paymentHeader =
      request.headers.get(X402_HEADERS.PAYMENT) ||
      request.headers.get("payment-signature") ||
      request.headers.get("x-payment");

    if (!paymentHeader) {
      // Return 402 Payment Required
      const paymentRequired = {
        x402Version: 2,
        accepts: [requirement],
      };

      const encoded = Buffer.from(JSON.stringify(paymentRequired)).toString(
        "base64"
      );

      return new NextResponse(JSON.stringify(paymentRequired), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          [X402_HEADERS.PAYMENT_REQUIRED]: encoded,
          "Access-Control-Expose-Headers": `${X402_HEADERS.PAYMENT_REQUIRED}, ${X402_HEADERS.PAYMENT_RESPONSE}`,
        },
      });
    }

    // 4. Parse and verify payment
    const payload = parsePaymentHeader(paymentHeader);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid payment header format" },
        { status: 400 }
      );
    }

    // 5. Check for replay — has this tx already been used?
    const { data: existingPayment } = await supabase
      .from("x402_payments")
      .select("id")
      .eq("tx_hash", payload.txHash)
      .eq("status", "settled")
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already used (replay detected)" },
        { status: 409 }
      );
    }

    // 6. Record pending payment
    const { data: payment, error: insertError } = await supabase
      .from("x402_payments")
      .insert({
        endpoint_id: endpoint.id,
        payer_address: payload.payer.toLowerCase(),
        merchant_address: endpoint.merchant_address,
        amount: requirement.maxAmountRequired,
        tx_hash: payload.txHash,
        status: "pending",
        chain_id: ETHERLINK_SHADOWNET.chainId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to record payment:", insertError);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    // 7. Verify on-chain
    const result = await verifyPayment(payload, requirement);

    if (!result.valid) {
      // Mark as failed
      await supabase
        .from("x402_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);

      return NextResponse.json(
        {
          error: "Payment verification failed",
          details: result.error,
        },
        { status: 402 }
      );
    }

    // 8. Mark as settled
    await supabase
      .from("x402_payments")
      .update({
        status: "settled",
        verified_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // 9. Build response
    const receipt = {
      success: true,
      txHash: result.txHash,
      amount: result.amount,
      from: result.from,
      to: result.to,
      settledAt: new Date().toISOString(),
    };

    const receiptEncoded = Buffer.from(JSON.stringify(receipt)).toString(
      "base64"
    );

    // If the endpoint has a custom response_body, return it
    const responseData = endpoint.response_body || {
      message: `Access granted to ${method} ${path}`,
      paidAmount: `${endpoint.price_usdc} USDC`,
      receipt,
    };

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        [X402_HEADERS.PAYMENT_RESPONSE]: receiptEncoded,
        "Access-Control-Expose-Headers": X402_HEADERS.PAYMENT_RESPONSE,
      },
    });
  } catch (err: any) {
    console.error("x402 paywall error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Handle CORS preflight for x402 payment headers
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": `Content-Type, ${X402_HEADERS.PAYMENT}, payment-signature, x-payment`,
      "Access-Control-Expose-Headers": `${X402_HEADERS.PAYMENT_REQUIRED}, ${X402_HEADERS.PAYMENT_RESPONSE}`,
    },
  });
}
