'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

export default function CreateLinkPage() {
  const [actionType, setActionType] = useState<'tip' | 'nft_sale'>('tip');

  // State for Tip
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // State for NFT Sale
  const [contractAddress, setContractAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [price, setPrice] = useState<string>('');

  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerateLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedLink('');
    const toastId = toast.loading('Generating link...');

    let actionData = {};
    if (actionType === 'tip') {
      if (!recipientAddress || !tipAmount) {
        toast.error('Please fill out all required fields for the tip.', { id: toastId });
        setIsLoading(false);
        return;
      }
      actionData = { type: 'tip', recipient: recipientAddress, amount: tipAmount, desc: description };
    } else {
      if (!contractAddress || !tokenId || !price) {
        toast.error('Please fill out all required fields for the NFT sale.', { id: toastId });
        setIsLoading(false);
        return;
      }
      actionData = { type: 'nft_sale', contract: contractAddress, tokenId, price, desc: description };
    }

    try {
      const jsonString = JSON.stringify(actionData);
      const encodedData = btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const newLink = `${window.location.origin}/a/${encodedData}`;
      setGeneratedLink(newLink);
      toast.success('Link generated successfully!', { id: toastId });
    } catch (error: any) {
      toast.error('Failed to generate link.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Action Link</h1>

      <div className="flex border-b border-gray-700 mb-6">
        <button onClick={() => setActionType('tip')} className={`py-2 px-4 transition-colors ${actionType === 'tip' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'}`}>
          Send a Tip
        </button>
        <button onClick={() => setActionType('nft_sale')} className={`py-2 px-4 transition-colors ${actionType === 'nft_sale' ? 'border-b-2 border-cyan-400 text-white' : 'text-gray-400'}`}>
          Sell an NFT
        </button>
      </div>

      <form onSubmit={handleGenerateLink} className="space-y-4 bg-gray-800 p-6 rounded-lg">
        {actionType === 'tip' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300">Recipient Wallet Address</label>
              <input type="text" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder="0x..." required className="mt-1 block w-full bg-gray-700 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Tip Amount (in XTZ)</label>
              <input type="text" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} placeholder="0.01" required className="mt-1 block w-full bg-gray-700 rounded-md p-2" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300">NFT Contract Address</label>
              <input type="text" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} placeholder="0x..." required className="mt-1 block w-full bg-gray-700 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Token ID</label>
              <input type="text" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="42" required className="mt-1 block w-full bg-gray-700 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Price (in XTZ)</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1.5" required className="mt-1 block w-full bg-gray-700 rounded-md p-2" />
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-300">Description (Optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., A special NFT from my collection!" rows={3} className="mt-1 block w-full bg-gray-700 rounded-md p-2 resize-none" />
        </div>
        
        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-md">
          Generate Link
        </button>
      </form>

      {generatedLink && (
        <div className="mt-6 bg-gray-800 p-6 rounded-lg flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={generatedLink} size={200} />
          </div>
          <p className="text-sm text-gray-300 mt-6 mb-2">Your generated link:</p>
          <div className="flex items-center space-x-2 w-full">
            <input type="text" readOnly value={generatedLink} className="w-full bg-gray-700 text-gray-200 border-none rounded-md p-2" />
            <button onClick={handleCopyToClipboard} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}