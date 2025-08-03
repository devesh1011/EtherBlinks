import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { ethers, Interface, JsonRpcProvider } from 'ethers';

interface RouteParams {
  params: { id: string };
}

// Helper function to resolve IPFS links using a preferred gateway
const resolveIpfsUrl = (url: string) => {
  if (!url || !url.startsWith('ipfs://')) {
    return url;
  }
  // Use a reliable public gateway like Pinata
  const gateway = 'https://gateway.pinata.cloud/ipfs/';
  return url.replace('ipfs://', gateway);
};


export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing action ID' }, { status: 400 });
    }

    const { data: action, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !action) {
      throw new Error('Action configuration not found.');
    }

    let title = "Unknown Action";
    let description = "An action on the Etherlink blockchain.";
    let label = "Confirm";
    let icon = `${new URL(request.url).origin}/tip_icon.png`; // Default icon

    // Customize metadata based on action type
    switch (action.action_type) {
      case 'tip':
        title = "Send a Tip";
        description = action.description || `You are about to send a ${action.tip_amount_eth} XTZ tip.`;
        label = "Send Tip";
        break;

      case 'nft_sale':
        try {
          // Use a public RPC provider for read-only calls to the blockchain
          const provider = new JsonRpcProvider('https://node.mainnet.etherlink.com');
          // Minimal ABI for the ERC721 tokenURI function
          const abi = ['function tokenURI(uint256 tokenId) view returns (string)'];
          const contract = new ethers.Contract(action.contract_address!, abi, provider);

          // 1. Get the metadata URL from the smart contract
          const metadataUrl: string = await contract.tokenURI(action.token_id);
          
          // 2. Fetch the JSON metadata from that URL, using our IPFS helper
          const formattedUrl = resolveIpfsUrl(metadataUrl);
          const metadataResponse = await fetch(formattedUrl);
          const nftMetadata = await metadataResponse.json();

          // 3. Use the dynamic data from the metadata file
          title = nftMetadata.name || "Buy an NFT";
          description = nftMetadata.description || `You are about to buy NFT #${action.token_id}`;
          // Use the NFT's image as the icon, using our IPFS helper
          icon = resolveIpfsUrl(nftMetadata.image || icon);
          label = "Buy NFT";

        } catch (e) {
          console.error("Could not fetch dynamic NFT metadata:", e);
          // Fallback to static text if metadata fetching fails
          title = "Buy an NFT";
          description = `You are about to buy NFT #${action.token_id} for ${action.price} ETH.`;
          label = "Buy NFT";
        }
        break;
    }

    const metadata = {
      title,
      icon,
      description,
      label,
    };

    return NextResponse.json(metadata, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { userAddress } = await request.json();

    if (!id || !userAddress) {
      return NextResponse.json({ error: 'Missing action ID or user address' }, { status: 400 });
    }

    const { data: action, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !action) {
      throw new Error('Action not found.');
    }

    let txObject;

    switch (action.action_type) {
      case 'tip':
        txObject = {
          to: action.recipient_address,
          from: userAddress,
          value: ethers.parseEther(action.tip_amount_eth!).toString(),
        };
        break;
      
      case 'nft_sale':
        // This assumes the NFT contract has a `buy(uint256 tokenId)` function
        // that is `payable`. You would need to deploy such a contract to test this flow.
        const nftContractInterface = new Interface(['function buy(uint256 tokenId) payable']);
        const calldata = nftContractInterface.encodeFunctionData('buy', [action.token_id]);

        txObject = {
          to: action.contract_address,
          from: userAddress,
          value: ethers.parseEther(action.price!).toString(),
          data: calldata,
        };
        break;

      default:
        throw new Error('Unsupported action type');
    }

    return NextResponse.json(txObject, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}