import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, policyId, txHash, merchantId } = body;

    console.log(`[AutoPay Webhook] Received ${event} for policy ${policyId}`);

    // In a real app, you would:
    // 1. Verify a signature to ensure it came from your relayer
    // 2. Update your database with the performance (e.g., successful payment)
    // 3. Trigger notifications (email, slack, etc.)

    switch (event) {
      case "ChargeSucceeded":
        console.log(
          `Successfully charged policy ${policyId} on hash ${txHash}`,
        );
        break;
      case "ChargeFailed":
        console.log(`Failed to charge policy ${policyId}`);
        break;
      case "PolicyCreated":
        console.log(
          `New policy ${policyId} created for merchant ${merchantId}`,
        );
        break;
      default:
        console.warn(`Unhandled AutoPay event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AutoPay Webhook Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
