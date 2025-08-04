'use client';
import { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { Interface } from 'ethers';
import { parseEther } from 'viem';
import Header from '@/app/components/Header';
import { useRef } from 'react';
import { ExternalLink, CheckCircle, Loader2, Zap, Image, AlertCircle } from 'lucide-react';

interface ActionMetadata {
  title: string;
  icon: string;
  description: string;
  label: string;
}

interface ActionData {
  id: string;
  action_type: 'tip' | 'nft_sale';
  short_id: string;
  recipient_address?: string;
  tip_amount_eth?: string;
  contract_address?: string;
  token_id?: string;
  price?: string;
  description?: string;
}

function ActionComponent({ params }: { params: { data: string } }) {
  const { data: urlData } = params;
  const [metadata, setMetadata] = useState<ActionMetadata | null>(null);
  const [actionData, setActionData] = useState<ActionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>('Loading...');
  const [txnHash, setTxnHash] = useState<`0x${string}` | undefined>(undefined);
  const loadingToastId = useRef<string | undefined>(undefined);

  const { isConnected } = useAccount();
  const { data: hashWrite, writeContract, error: writeError } = useWriteContract();
  const { data: hashSend, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txnHash });

  useEffect(() => {
    if (!urlData) {
      setIsLoading(false);
      setStatus('Error: Invalid action link.');
      return;
    }

    const fetchActionData = async () => {
      try {
        // Parse the URL data: "action_type-short_id"
        const [actionType, shortId] = urlData.split('-', 2);
        
        if (!actionType || !shortId) {
          throw new Error('Invalid URL format');
        }

        // Fetch action data from the API
        const response = await fetch(`/api/execute/${shortId}`);
        if (!response.ok) {
          throw new Error('Action not found');
        }

        const actionData: ActionData = await response.json();
        setActionData(actionData);

        // Create metadata based on action type
        let meta: ActionMetadata;
        if (actionData.action_type === 'tip') {
          meta = {
            title: 'Send a Tip',
            icon: '/tip_icon.png',
            description: actionData.description || `You are about to send a ${actionData.tip_amount_eth} XTZ tip.`,
            label: 'Send Tip',
          };
        } else if (actionData.action_type === 'nft_sale') {
          meta = {
            title: 'Buy an NFT',
            icon: '/tip_icon.png',
            description: actionData.description || `You are about to buy NFT #${actionData.token_id} for ${actionData.price} XTZ.`,
            label: 'Buy NFT',
          };
        } else {
          throw new Error('Unsupported action type');
        }
        
        setMetadata(meta);
        setStatus('Ready to proceed.');
      } catch (error: any) {
        toast.error('Invalid or corrupt action link.');
        setStatus('Error: Invalid Link');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActionData();
  }, [urlData]);
  
  useEffect(() => {
    if (hashWrite) setTxnHash(hashWrite);
  }, [hashWrite]);
  useEffect(() => {
    if (hashSend) setTxnHash(hashSend);
  }, [hashSend]);
  useEffect(() => {
    if (isConfirming) setStatus('Confirming transaction...');
    if (isConfirmed) {
      setStatus('Success! Action complete.');
      if (loadingToastId.current) toast.dismiss(loadingToastId.current);
      toast.success('Transaction Confirmed!');
    }
    if (writeError) {
      const message = writeError.message.split('\n')[0];
      setStatus(`Error: ${message}`);
      if (loadingToastId.current) toast.dismiss(loadingToastId.current);
      toast.error(message);
    }
  }, [isConfirming, isConfirmed, writeError]);

  const handleAction = () => {
    if (!actionData || !isConnected) return;
    try {
      if (actionData.action_type === 'tip') {
        loadingToastId.current = toast.loading('Confirming transaction...');
        sendTransaction({
          to: actionData.recipient_address as `0x${string}`,
          value: parseEther(actionData.tip_amount_eth!),
        });
      } else if (actionData.action_type === 'nft_sale') {
        const nftSaleAbi = [
          {
            "type": "function",
            "name": "buy",
            "stateMutability": "payable",
            "inputs": [{ "name": "tokenId", "type": "uint256" }],
            "outputs": []
          }
        ] as const;
        writeContract({
          abi: nftSaleAbi,
          address: actionData.contract_address as `0x${string}`,
          functionName: 'buy',
          args: [BigInt(actionData.token_id!)],
          value: parseEther(actionData.price!),
        });
      }
    } catch (error: any) {
      if (loadingToastId.current) toast.dismiss(loadingToastId.current);
      toast.error(error.message);
      setStatus(`Error: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-white text-lg font-medium">Loading Action...</p>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-red-400 text-xl font-semibold mb-2">Invalid Action Link</h2>
          <p className="text-gray-300">Could not load this action. The link appears to be corrupted or invalid.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (isConfirmed) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (isConfirming) return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
    if (status.includes('Error')) return <AlertCircle className="w-5 h-5 text-red-400" />;
    return actionData?.action_type === 'tip' ? <Zap className="w-5 h-5 text-cyan-400" /> : <Image className="w-5 h-5 text-cyan-400" />;
  };

  const getStatusColor = () => {
    if (isConfirmed) return 'text-green-400';
    if (isConfirming) return 'text-cyan-400';
    if (status.includes('Error')) return 'text-red-400';
    return 'text-gray-300';
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center w-full min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Main Action Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 shadow-2xl rounded-3xl p-8 mb-6">
            {/* Connect Button Section */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gray-700/30 rounded-2xl p-4 border border-gray-600/30">
                <ConnectButton showBalance={false} accountStatus="address" />
              </div>
            </div>

            {/* Action Content */}
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-xl opacity-30"></div>
                <img 
                  src={metadata.icon} 
                  alt={metadata.title} 
                  className="relative w-32 h-32 rounded-3xl object-cover border-2 border-gray-600/50 shadow-2xl bg-gray-900" 
                />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-2 shadow-lg">
                  {actionData?.action_type === 'tip' ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : (
                    <Image className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white mb-2">
                {metadata.title}
              </h1>

              {/* Description */}
              <div className="bg-gray-700/30 rounded-2xl p-6 border border-gray-600/30 max-w-md">
                <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap break-words">
                  {metadata.description}
                </p>
              </div>

              {/* Action Button */}
              {isConnected && (
                <button
                  onClick={handleAction}
                  disabled={isConfirming || isConfirmed}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${
                    isConfirming 
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                      : isConfirmed 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/25'
                  }`}
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Confirming...
                    </>
                  ) : isConfirmed ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Action Complete!
                    </>
                  ) : (
                    <>
                      {actionData?.action_type === 'tip' ? <Zap className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                      {metadata.label} Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-3">
              {getStatusIcon()}
              <p className={`text-base font-medium ${getStatusColor()}`}>
                {status}
              </p>
            </div>
          </div>

          {/* Transaction Link */}
          {isConfirmed && txnHash && (
            <div className="mt-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-6">
              <div className="text-center">
                <p className="text-gray-300 mb-3 font-medium">Transaction Confirmed</p>
                <a
                  href={`https://testnet.explorer.etherlink.com/tx/${txnHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-200 font-medium break-all bg-gray-700/30 px-4 py-2 rounded-xl border border-gray-600/30 hover:border-cyan-500/30"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">View on Explorer</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page({ params }: { params: { data: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    }>
      <ActionComponent params={params} />
    </Suspense>
  );
}