'use client';

import { useState, useEffect, Suspense } from 'react';
import toast from 'react-hot-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSendTransaction } from 'wagmi';
import { Interface } from 'ethers';
import { parseEther } from 'viem';
import Header from '@/app/components/Header';
import { useRef } from 'react';

interface ActionMetadata {
  title: string;
  icon: string;
  description: string;
  label: string;
}

function ActionComponent({ params }: { params: { data: string } }) {
  const { data: encodedData } = params;

  const [metadata, setMetadata] = useState<ActionMetadata | null>(null);
  const [actionParams, setActionParams] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>('Loading...');
  const [txnHash, setTxnHash] = useState<`0x${string}` | undefined>(undefined);
  const loadingToastId = useRef<string | undefined>(undefined);

  const { isConnected } = useAccount();
  const { data: hashWrite, writeContract, error: writeError } = useWriteContract();
  const { data: hashSend, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txnHash });

  useEffect(() => {
    if (!encodedData) {
      setIsLoading(false);
      setStatus('Error: Invalid action link.');
      return;
    };

    try {
      // Decode the Base64 data from the URL to get the JSON string
      const jsonString = atob(encodedData);
      // Parse the JSON string to get the action object
      const decodedParams = JSON.parse(jsonString);
      setActionParams(decodedParams);

      let meta: ActionMetadata;
      if (decodedParams.type === 'tip') {
        meta = {
          title: 'Send a Tip',
          icon: '/tip_icon.png',
          description: decodedParams.desc || `You are about to send a ${decodedParams.amount} ETH tip.`,
          label: 'Send Tip',
        };
      } else if (decodedParams.type === 'nft_sale') {
        meta = {
          title: 'Buy an NFT',
          icon: '/tip_icon.png', // Dynamic metadata is not possible without a backend
          description: decodedParams.desc || `You are about to buy NFT #${decodedParams.tokenId} for ${decodedParams.price} ETH.`,
          label: 'Buy NFT',
        };
      } else {
        throw new Error('Unsupported action type in link.');
      }
      setMetadata(meta);
      setStatus('Ready to proceed.');
    } catch (error: any) {
      toast.error('Invalid or corrupt action link.');
      setStatus('Error: Invalid Link');
    } finally {
      setIsLoading(false);
    }
  }, [encodedData]);
  
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
    if (!actionParams || !isConnected) return;

    try {
      if (actionParams.type === 'tip') {
        loadingToastId.current = toast.loading('Confirming transaction...');
        sendTransaction({
          to: actionParams.recipient,
          value: parseEther(actionParams.amount),
        });
      } else if (actionParams.type === 'nft_sale') {
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
          address: actionParams.contract,
          functionName: 'buy',
          args: [actionParams.tokenId],
          value: parseEther(actionParams.price),
        });
      }
    } catch (error: any) {
      if (loadingToastId.current) toast.dismiss(loadingToastId.current);
      toast.error(error.message);
      setStatus(`Error: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div className="text-center">Loading Action...</div>;
  }

  if (!metadata) {
    return <div className="text-center text-red-500">Could not load this action. Invalid Link.</div>;
  }
  return (
    <div className="min-h-screen w-full bg-black flex flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center w-full min-h-screen">
        <div className="w-full max-w-md bg-gray-800/90 shadow-2xl rounded-2xl p-10 border border-cyan-700 flex flex-col items-center">
          {/* RainbowKit ConnectButton at the top of the card */}
          <div className="flex items-center justify-center mb-6 w-full">
            <ConnectButton showBalance={false} accountStatus="address" />
          </div>
          <div className="flex flex-col items-center w-full">
            <img src={metadata.icon} alt={metadata.title} className="w-32 h-32 mb-6 rounded-2xl object-cover border-4 border-cyan-400 shadow-lg bg-gray-900" />
            <h1 className="text-3xl font-extrabold mb-2 text-cyan-400 drop-shadow text-center w-full">{metadata.title}</h1>
            <p className="text-gray-300 mb-8 text-center whitespace-pre-wrap text-lg w-full break-words">{metadata.description}</p>
          </div>
          <div className="space-y-4 mt-2 w-full">
            {isConnected && (
              <button
                onClick={handleAction}
                className={`w-full py-4 px-4 rounded-xl font-bold text-xl transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 ${isConfirming ? 'bg-gray-500 cursor-not-allowed' : isConfirmed ? 'bg-green-600' : 'bg-cyan-500 hover:bg-cyan-600 text-white'}`}
                disabled={isConfirming || isConfirmed}
              >
                {isConfirming ? 'Confirming...' : isConfirmed ? 'Action Complete!' : `${metadata.label} Now`}
              </button>
            )}
          </div>
          <p className="mt-8 text-base font-mono text-gray-400 text-center w-full">Status: {status}</p>
          {isConfirmed && txnHash && (
            <div className="mt-6 text-center w-full">
              <a
                href={`https://testnet.explorer.etherlink.com/tx/${txnHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-300 hover:text-cyan-200 underline break-all text-lg font-semibold"
              >
                View Transaction on Explorer
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Page({ params }: { params: { data: string } }) {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <ActionComponent params={params} />
    </Suspense>
  );
}