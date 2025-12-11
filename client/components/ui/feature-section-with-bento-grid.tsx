import { Link2, Shield, Zap, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start">
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                The Micropayment Layer for AI
              </h2>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground  text-left">
                EtherBlinks provides the infrastructure for blink-fast, sub-cent
                transactions that power autonomous agents and modern web apps.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="relative rounded-md p-[1px] h-full lg:col-span-2 overflow-hidden">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <div className="bg-zinc-900 rounded-md h-full p-6 aspect-square lg:aspect-auto flex justify-between flex-col relative z-10">
                <Link2 className="w-8 h-8 stroke-1" />
                <div className="flex flex-col">
                  <h3 className="text-xl tracking-tight text-white">
                    Direct Blink Links
                  </h3>
                  <p className="text-zinc-400 max-w-xs text-base">
                    Generate instant micropayment links for digital assets.
                    Perfect for pay-per-prompt AI services and content
                    micro-monetization.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-md p-[1px] aspect-square overflow-hidden">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <div className="bg-zinc-900 rounded-md h-full p-6 flex justify-between flex-col relative z-10">
                <Shield className="w-8 h-8 stroke-1 text-white" />
                <div className="flex flex-col">
                  <h3 className="text-xl tracking-tight text-white">
                    Blockchain Security
                  </h3>
                  <p className="text-zinc-400 max-w-xs text-base">
                    Built on Etherlink, ensuring your transactions are secure,
                    transparent, and immutable on-chain.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-md p-[1px] aspect-square overflow-hidden">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <div className="bg-zinc-900 rounded-md h-full p-6 flex justify-between flex-col relative z-10">
                <Zap className="w-8 h-8 stroke-1 text-white" />
                <div className="flex flex-col">
                  <h3 className="text-xl tracking-tight text-white">
                    Instant Settlement
                  </h3>
                  <p className="text-zinc-400 max-w-xs text-base">
                    Fast transaction finality on Etherlink means your payments
                    settle in seconds, not hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-md p-[1px] h-full lg:col-span-2 overflow-hidden">
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <div className="bg-zinc-900 rounded-md h-full p-6 aspect-square lg:aspect-auto flex justify-between flex-col relative z-10">
                <Bot className="w-8 h-8 stroke-1 text-white" />
                <div className="flex flex-col">
                  <h3 className="text-xl tracking-tight text-white">
                    AI Agent Payments
                  </h3>
                  <p className="text-zinc-400 max-w-xs text-base">
                    Enable autonomous agents to send and receive payments
                    seamlessly with x402 protocol integration for the future of
                    automated transactions.
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
