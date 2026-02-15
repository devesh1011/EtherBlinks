import { Link2, Shield, Zap, Bot, RefreshCcw, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start px-4 md:px-8">
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                The Micropayment Layer for AI
              </h2>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground  text-left">
                EtherBlinks provides the infrastructure for one-time links, recurring subscriptions, and agentic payments settled on Etherlink.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-8">
            <div className="relative rounded-xl p-[1px] h-full lg:col-span-2 overflow-hidden group">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="bg-zinc-900 rounded-xl h-full p-8 aspect-square lg:aspect-auto flex justify-between flex-col relative z-10">
                <Link2 className="w-10 h-10 stroke-1 text-purple-400" />
                <div className="flex flex-col">
                  <h3 className="text-2xl tracking-tight text-white mb-2">
                    Shareable Payment Links
                  </h3>
                  <p className="text-zinc-400 max-w-md text-base leading-relaxed">
                    Generate instant USDC payment links for products, tips, or digital assets. 
                    Share them anywhere — Twitter, Discord, or embedded in your app — and get paid without a checkout page.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl p-[1px] aspect-square overflow-hidden group">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="bg-zinc-900 rounded-xl h-full p-8 flex justify-between flex-col relative z-10">
                <RefreshCcw className="w-10 h-10 stroke-1 text-emerald-400" />
                <div className="flex flex-col">
                  <h3 className="text-2xl tracking-tight text-white mb-2">
                    On-Chain Subscriptions
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    Secure recurring charges with spending caps and one-click revocation. Merchants get predictable revenue, users stay in control.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl p-[1px] aspect-square overflow-hidden group">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="bg-zinc-900 rounded-xl h-full p-8 flex justify-between flex-col relative z-10">
                <Bot className="w-10 h-10 stroke-1 text-blue-400" />
                <div className="flex flex-col">
                  <h3 className="text-2xl tracking-tight text-white mb-2">
                    Agentic x402 Payments
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed">
                    The protocol for machines to pay machines. Implement HTTP 402 paywalls that AI agents can satisfy autonomously using USDC.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl p-[1px] h-full lg:col-span-2 overflow-hidden group">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="bg-zinc-900 rounded-xl h-full p-8 aspect-square lg:aspect-auto flex justify-between flex-col relative z-10">
                <Coins className="w-10 h-10 stroke-1 text-amber-400" />
                <div className="flex flex-col">
                  <h3 className="text-2xl tracking-tight text-white mb-2">
                    USDC Settlement on Etherlink
                  </h3>
                  <p className="text-zinc-400 max-w-md text-base leading-relaxed">
                    Experience the speed of Tezos' EVM layer. Transactions settle in seconds with sub-cent fees, ensuring your micropayments are actually micro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
