"use client";

import { Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function DemoPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Example URLs
  const exampleUrls = [
    {
      name: "Pro Plan ($9.99/month)",
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/demo/checkout?merchant=0x2B8b9182c1c3A9bEf4a60951D9B7F49420D12B9B&amount=9.99&interval=2592000&spendingCap=119.88&metadataUrl=${typeof window !== "undefined" ? window.location.origin : ""}/examples/pro-plan.json&successUrl=https://myapp.com/success&cancelUrl=https://myapp.com/cancel`,
    },
    {
      name: "Starter Plan ($4.99/month)",
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/demo/checkout?merchant=0x2B8b9182c1c3A9bEf4a60951D9B7F49420D12B9B&amount=4.99&interval=2592000&spendingCap=59.88&metadataUrl=${typeof window !== "undefined" ? window.location.origin : ""}/examples/starter-plan.json&successUrl=https://myapp.com/success&cancelUrl=https://myapp.com/cancel`,
    },
    {
      name: "AI Compute ($99/month)",
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/demo/checkout?merchant=0x2B8b9182c1c3A9bEf4a60951D9B7F49420D12B9B&amount=99.00&interval=2592000&spendingCap=1188.00&metadataUrl=${typeof window !== "undefined" ? window.location.origin : ""}/examples/ai-compute.json&successUrl=https://myapp.com/success&cancelUrl=https://myapp.com/cancel`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-zinc-100 mb-2">
            Checkout Demo & Integration Guide
          </h1>
          <p className="text-zinc-400">
            Reference implementation for building subscription checkout flows
            with EtherBlinks
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Try Demo Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            Try the Demo
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {exampleUrls.map((example, i) => (
              <Link
                key={i}
                href={example.url}
                className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors group"
              >
                <h3 className="font-semibold text-zinc-100 mb-2 group-hover:text-emerald-400 transition-colors">
                  {example.name}
                </h3>
                <p className="text-sm text-zinc-500 mb-3">
                  Click to see live checkout flow
                </p>
                <div className="flex items-center text-xs text-emerald-500">
                  View demo <ExternalLink className="ml-1 h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* URL Parameters Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            URL Parameters
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/50 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 text-left text-zinc-400 font-medium">
                    Parameter
                  </th>
                  <th className="px-6 py-4 text-left text-zinc-400 font-medium">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-zinc-400 font-medium">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-zinc-400 font-medium">
                    Required
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {[
                  {
                    param: "merchant",
                    type: "address",
                    desc: "Merchant's wallet address (receives payments)",
                    required: "Yes",
                  },
                  {
                    param: "amount",
                    type: "string",
                    desc: "Charge amount in USDC (e.g., '9.99')",
                    required: "Yes",
                  },
                  {
                    param: "interval",
                    type: "string",
                    desc: "Billing interval in seconds (2592000 = 30 days)",
                    required: "Yes",
                  },
                  {
                    param: "spendingCap",
                    type: "string",
                    desc: "Maximum total spending in USDC",
                    required: "Yes",
                  },
                  {
                    param: "metadataUrl",
                    type: "url",
                    desc: "URL to plan metadata JSON",
                    required: "Yes",
                  },
                  {
                    param: "successUrl",
                    type: "url",
                    desc: "Redirect URL after successful subscription",
                    required: "Yes",
                  },
                  {
                    param: "cancelUrl",
                    type: "url",
                    desc: "Redirect URL if user cancels",
                    required: "Yes",
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      {row.param}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{row.type}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.desc}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          row.required === "Yes"
                            ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {row.required}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Metadata Format Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            Plan Metadata Format
          </h2>
          <p className="text-zinc-400 mb-4">
            Host a JSON file at{" "}
            <code className="px-2 py-1 bg-zinc-800 rounded text-emerald-400 text-sm">
              metadataUrl
            </code>{" "}
            with your plan details:
          </p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
              <span className="text-sm text-zinc-400 font-mono">
                plan-metadata.json
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(
                      {
                        name: "Pro Plan",
                        description: "Full access to premium features",
                        icon: "https://example.com/icon.png",
                        features: [
                          "Unlimited API calls",
                          "Priority support",
                          "Advanced analytics",
                        ],
                      },
                      null,
                      2,
                    ),
                    "metadata",
                  )
                }
                className="p-1.5 rounded hover:bg-zinc-700 transition-colors"
              >
                {copiedSection === "metadata" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            </div>
            <pre className="p-6 overflow-x-auto text-sm">
              <code className="text-zinc-300">
                {`{
  "name": "Pro Plan",
  "description": "Full access to premium features",
  "icon": "https://example.com/icon.png",
  "features": [
    "Unlimited API calls",
    "Priority support",
    "Advanced analytics"
  ]
}`}
              </code>
            </pre>
          </div>
        </section>

        {/* SDK Usage Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            Using the SDK
          </h2>
          <p className="text-zinc-400 mb-4">
            Merchants should use the{" "}
            <code className="px-2 py-1 bg-zinc-800 rounded text-emerald-400 text-sm">
              @etherblinks/sdk
            </code>{" "}
            to generate checkout URLs:
          </p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
              <span className="text-sm text-zinc-400 font-mono">
                merchant-server.js
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    `import { createCheckoutUrl } from '@etherblinks/sdk';

const url = createCheckoutUrl({
  merchant: '0x...',
  amount: 9.99,
  interval: 'monthly',
  metadataUrl: 'https://myapp.com/plans/pro.json',
  successUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  spendingCap: 119.88, // 12 months
});

// Redirect user to the checkout URL
res.redirect(url);`,
                    "sdk",
                  )
                }
                className="p-1.5 rounded hover:bg-zinc-700 transition-colors"
              >
                {copiedSection === "sdk" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4 text-zinc-400" />
                )}
              </button>
            </div>
            <pre className="p-6 overflow-x-auto text-sm">
              <code className="text-zinc-300">
                {`import { createCheckoutUrl } from '@etherblinks/sdk';

const url = createCheckoutUrl({
  merchant: '0x...',
  amount: 9.99,
  interval: 'monthly',
  metadataUrl: 'https://myapp.com/plans/pro.json',
  successUrl: 'https://myapp.com/success',
  cancelUrl: 'https://myapp.com/cancel',
  spendingCap: 119.88, // 12 months
});

// Redirect user to the checkout URL
res.redirect(url);`}
              </code>
            </pre>
          </div>
        </section>

        {/* Flow Overview */}
        <section>
          <h2 className="text-2xl font-bold text-zinc-100 mb-6">
            Checkout Flow
          </h2>
          <div className="grid gap-4">
            {[
              {
                step: "1",
                title: "Connect Wallet",
                desc: "User connects their wallet via RainbowKit/WalletConnect",
              },
              {
                step: "2",
                title: "Approve USDC",
                desc: "User approves PolicyManager contract to spend up to spendingCap amount",
              },
              {
                step: "3",
                title: "Create Policy",
                desc: "User signs transaction to create subscription policy on-chain",
              },
              {
                step: "4",
                title: "Success",
                desc: "Redirect to successUrl - Relayer will execute charges automatically",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 p-6 rounded-xl border border-zinc-800 bg-zinc-900/50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            For more information, check the{" "}
            <a
              href="https://github.com/etherblinks/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300"
            >
              SDK documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
