import { NextRequest, NextResponse } from "next/server";
import { Interface, JsonRpcProvider, Contract, ethers } from "ethers";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function resolveIpfsUrl(url: string) {
  if (!url.startsWith("ipfs://")) return url;
  return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(_: NextRequest, context: RouteParams) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("actions")
      .select("*")
      .eq("short_id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Action configuration not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(data, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch action";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await context.params;

    const { data: action, error } = await supabase
      .from("actions")
      .select("*")
      .eq("short_id", id)
      .single();

    if (error || !action) {
      return NextResponse.json(
        { error: "Action configuration not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    let title = "Unknown Action";
    let description = "An action on Etherlink testnet.";
    let label = "Confirm";
    let icon = `${request.nextUrl.origin}/favicon.ico`;

    if (action.action_type === "tip") {
      title = "Send a Tip";
      description =
        action.description ||
        `You are about to send ${action.tip_amount_eth} XTZ.`;
      label = "Send Tip";
    }

    if (action.action_type === "nft_sale") {
      try {
        const provider = new JsonRpcProvider(
          "https://node.shadownet.etherlink.com",
        );
        const nftContract = new Contract(
          action.contract_address,
          ["function tokenURI(uint256) view returns (string)"],
          provider,
        );
        const metadataUrl: string = await nftContract.tokenURI(action.token_id);
        const response = await fetch(resolveIpfsUrl(metadataUrl));
        const metadata = await response.json();

        title = metadata.name || "Buy NFT";
        description =
          metadata.description ||
          action.description ||
          `Buy NFT #${action.token_id}`;
        icon = resolveIpfsUrl(metadata.image || icon);
        label = "Buy NFT";
      } catch {
        title = "Buy NFT";
        description =
          action.description ||
          `You are about to buy NFT #${action.token_id} for ${action.price} XTZ.`;
        label = "Buy NFT";
      }
    }

    return NextResponse.json(
      { title, description, label, icon },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build metadata";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await context.params;
    const { userAddress } = await request.json();

    if (!userAddress) {
      return NextResponse.json(
        { error: "Missing user address" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { data: action, error } = await supabase
      .from("actions")
      .select("*")
      .eq("short_id", id)
      .single();

    if (error || !action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (action.action_type === "tip") {
      return NextResponse.json(
        {
          to: action.recipient_address,
          from: userAddress,
          value: ethers.parseEther(action.tip_amount_eth).toString(),
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    if (action.action_type === "nft_sale") {
      const iface = new Interface(["function buy(uint256 tokenId) payable"]);
      const data = iface.encodeFunctionData("buy", [action.token_id]);

      return NextResponse.json(
        {
          to: action.contract_address,
          from: userAddress,
          value: ethers.parseEther(action.price).toString(),
          data,
        },
        { status: 200, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { error: "Unsupported action type" },
      { status: 400, headers: CORS_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build transaction";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
