'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Zap, Image, Wallet, Hash, DollarSign, FileText, Link } from 'lucide-react';

export default function CreateLinkPage() {
  const [actionType, setActionType] = useState<'tip' | 'nft_sale'>('tip');
  const [copied, setCopied] = useState(false);
  
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

  const handleGenerateLink = async () => {
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
      actionData = { 
        action_type: 'tip', 
        recipient_address: recipientAddress, 
        tip_amount_eth: tipAmount, 
        description: description 
      };
    } else {
      if (!contractAddress || !tokenId || !price) {
        toast.error('Please fill out all required fields for the NFT sale.', { id: toastId });
        setIsLoading(false);
        return;
      }
      actionData = { 
        action_type: 'nft_sale', 
        contract_address: contractAddress, 
        token_id: tokenId, 
        price: price, 
        description: description 
      };
    }

    try {
      // Call the API to create the action and get the short URL
      const response = await fetch('/api/create-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create action');
      }

      const result = await response.json();
      setGeneratedLink(result.short_url);
      toast.success('Link generated successfully!', { id: toastId });
    } catch (error: any) {
      toast.error('Failed to generate link: ' + error.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-4">
            <Link className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Create Action Link</h1>
          <p className="text-gray-400">Generate shareable links for tips and NFT sales</p>
        </div>

        {/* Action Type Selector */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-2 mb-8">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActionType('tip')}
              className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl transition-all duration-200 ${
                actionType === 'tip'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className="font-medium">Send Tip</span>
            </button>
            <button
              onClick={() => setActionType('nft_sale')}
              className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl transition-all duration-200 ${
                actionType === 'nft_sale'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Image className="w-5 h-5" />
              <span className="font-medium">Sell NFT</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            {actionType === 'tip' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Wallet className="w-4 h-4" />
                    Recipient Wallet Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0xaY34.."
                    required
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <DollarSign className="w-4 h-4" />
                    Tip Amount (XTZ)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="0.01"
                    required
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Hash className="w-4 h-4" />
                    NFT Contract Address
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0xD4te..."
                    required
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Hash className="w-4 h-4" />
                      Token ID
                    </label>
                    <input
                      type="text"
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      placeholder="42"
                      required
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <DollarSign className="w-4 h-4" />
                      Price (XTZ)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1.5"
                      required
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2 mt-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <FileText className="w-4 h-4" />
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={actionType === 'tip' ? "Thank you for your support!" : "A special NFT from my collection!"}
                rows={3}
                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateLink}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/25 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link className="w-5 h-5" />
                Generate Action Link
              </>
            )}
          </button>
        </div>

        {/* Generated Link Result */}
        {generatedLink && (
          <div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Your Action Link is Ready!</h3>
              <p className="text-gray-400">Share this link or scan the QR code</p>
            </div>
            
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <QRCodeSVG value={generatedLink} size={200} />
              </div>
              
              {/* Link Input */}
              <div className="w-full space-y-3">
                <label className="block text-sm font-medium text-gray-300">Generated Link:</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-gray-200 text-sm font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyToClipboard}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 min-w-[100px] justify-center"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}