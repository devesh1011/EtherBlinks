import { Zap, Users, Wallet, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">
          Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center justify-center rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300">
            Create Blink
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Revenue",
            value: "$45,231.89",
            change: "+20.1% from last month",
            icon: Wallet,
          },
          {
            title: "Active Users",
            value: "+2350",
            change: "+180.1% from last month",
            icon: Users,
          },
          {
            title: "Micropayments",
            value: "+12,234",
            change: "+19% from last month",
            icon: Zap,
          },
          {
            title: "Success Rate",
            value: "99.9%",
            change: "+0.1% since last hour",
            icon: Zap,
          },
        ].map((item, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm"
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">{item.title}</p>
              <item.icon className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="pt-2">
              <div className="text-2xl font-bold text-zinc-100">
                {item.value}
              </div>
              <p className="text-xs text-zinc-500">{item.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <p className="text-lg font-semibold text-zinc-100 leading-none">
              Overview
            </p>
            <p className="text-sm text-zinc-400">
              Transaction volume across all gateways.
            </p>
          </div>
          <div className="h-[200px] flex items-end gap-2 pt-4">
            {[40, 60, 45, 90, 65, 80, 50, 70, 95, 85, 40, 100].map(
              (height, i) => (
                <div
                  key={i}
                  className="bg-zinc-100/10 hover:bg-zinc-100/20 transition-all rounded-t w-full"
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>
        </div>
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex flex-col space-y-1.5 pb-4">
            <p className="text-lg font-semibold text-zinc-100 leading-none">
              Recent Activities
            </p>
            <p className="text-sm text-zinc-400">
              Total 456 transactions this week.
            </p>
          </div>
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-zinc-100 leading-none">
                    Micropayment from Agent #402
                  </p>
                  <p className="text-xs text-zinc-500">2 minutes ago</p>
                </div>
                <div className="ml-auto font-medium text-zinc-100">+$0.05</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
