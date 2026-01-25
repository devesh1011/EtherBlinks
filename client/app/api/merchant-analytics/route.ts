import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchant = searchParams.get("merchant");

    if (!merchant) {
      return NextResponse.json(
        { error: "Missing merchant address" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const merchantLower = merchant.toLowerCase();

    // Fetch all policies for this merchant
    const { data: policies, error: policiesError } = await supabase
      .from("policies")
      .select("*")
      .eq("merchant", merchantLower)
      .order("created_at", { ascending: false });

    if (policiesError) throw new Error(policiesError.message);

    // Fetch all charges for this merchant's policies
    const policyIds = (policies || []).map((p: any) => p.id);

    let charges: any[] = [];
    if (policyIds.length > 0) {
      const { data: chargesData, error: chargesError } = await supabase
        .from("charges")
        .select("*")
        .in("policy_id", policyIds)
        .order("created_at", { ascending: false });

      if (chargesError) throw new Error(chargesError.message);
      charges = chargesData || [];
    }

    // Compute analytics
    const totalPolicies = policies?.length || 0;
    const activePolicies = policies?.filter((p: any) => p.active).length || 0;
    const cancelledPolicies =
      policies?.filter((p: any) => !p.active && p.ended_at).length || 0;
    const uniquePayers = new Set(policies?.map((p: any) => p.payer)).size;

    // Revenue calculations
    const successfulCharges = charges.filter(
      (c: any) => c.status === "success"
    );
    const totalRevenue = successfulCharges.reduce(
      (sum: bigint, c: any) => sum + BigInt(c.amount || "0"),
      BigInt(0)
    );
    const totalFees = successfulCharges.reduce(
      (sum: bigint, c: any) => sum + BigInt(c.protocol_fee || "0"),
      BigInt(0)
    );
    const netRevenue = totalRevenue - totalFees;

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; revenue: string; charges: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

      const monthCharges = successfulCharges.filter((c: any) => {
        const d = new Date(c.completed_at || c.created_at);
        return d >= monthStart && d <= monthEnd;
      });

      const rev = monthCharges.reduce(
        (sum: bigint, c: any) => sum + BigInt(c.amount || "0"),
        BigInt(0)
      );

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: rev.toString(),
        charges: monthCharges.length,
      });
    }

    // Churn rate: cancelled / total policies
    const churnRate =
      totalPolicies > 0
        ? ((cancelledPolicies / totalPolicies) * 100).toFixed(1)
        : "0.0";

    // Retention rate
    const retentionRate =
      totalPolicies > 0
        ? (((totalPolicies - cancelledPolicies) / totalPolicies) * 100).toFixed(
            1
          )
        : "100.0";

    // Average revenue per user (ARPU)
    const arpu =
      uniquePayers > 0 ? (totalRevenue / BigInt(uniquePayers)).toString() : "0";

    // Failed charges
    const failedCharges = charges.filter(
      (c: any) => c.status === "failed"
    ).length;

    // Recent subscribers
    const recentSubscribers = (policies || [])
      .slice(0, 5)
      .map((p: any) => ({
        payer: p.payer,
        chargeAmount: p.charge_amount,
        interval: p.interval_seconds,
        active: p.active,
        createdAt: p.created_at,
      }));

    return NextResponse.json(
      {
        overview: {
          totalPolicies,
          activePolicies,
          cancelledPolicies,
          uniquePayers,
          totalRevenue: totalRevenue.toString(),
          netRevenue: netRevenue.toString(),
          totalFees: totalFees.toString(),
          totalCharges: charges.length,
          successfulCharges: successfulCharges.length,
          failedCharges,
          churnRate,
          retentionRate,
          arpu,
        },
        monthlyRevenue,
        recentSubscribers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching merchant analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
