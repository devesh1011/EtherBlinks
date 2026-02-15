"use client";

import Link from "next/link";
import {
  Zap,
  LayoutDashboard,
  Link2,
  Wallet,
  Settings,
  History,
  BarChart3,
  TrendingUp,
  Code2,
  ShieldCheck,
  Cpu,
  RefreshCcw,
  BookOpen,
  Bot,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NavGroup } from "@/lib/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Main",
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Links",
        url: "/dashboard/links",
        icon: Link2,
      },
      {
        title: "Subscriptions",
        url: "/dashboard/subscriptions",
        icon: RefreshCcw,
      },
      {
        title: "x402 Payments",
        url: "/dashboard/x402",
        icon: Bot,
        isNew: true,
      },
      {
        title: "x402 Demo",
        url: "/demo/x402",
        icon: Zap,
      },
      {
        title: "Wallet",
        url: "/dashboard/wallet",
        icon: Wallet,
      },
    ],
  },
  {
    id: 2,
    label: "Analytics",
    items: [
      {
        title: "Statistics",
        url: "/dashboard/stats",
        icon: BarChart3,
      },
      {
        title: "Merchant Analytics",
        url: "/dashboard/merchant-analytics",
        icon: TrendingUp,
      },
      {
        title: "History",
        url: "/dashboard/history",
        icon: History,
      },
    ],
  },
  {
    id: 3,
    label: "Developer",
    items: [
      {
        title: "API Keys",
        url: "/dashboard/api",
        icon: Code2,
      },
      {
        title: "Webhooks",
        url: "/dashboard/webhooks",
        icon: ShieldCheck,
      },
      {
        title: "AI Agents",
        url: "/dashboard/agents",
        icon: Cpu,
        comingSoon: true,
      },
    ],
  },
  {
    id: 4,
    label: "Resources",
    items: [
      {
        title: "Merchant Demo",
        url: "/demo",
        icon: BookOpen,
      },
    ],
  },
];

const mockUser = {
  name: "Devesh",
  email: "devesh@etherblinks.com",
  avatar: "https://github.com/shadcn.png",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-4 fill-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-zinc-100">
                    EtherBlinks
                  </span>
                  <span className="truncate text-xs text-zinc-400">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 px-4 py-4">
          <ConnectButton
            accountStatus="avatar"
            chainStatus="icon"
            showBalance={false}
          />
        </div>
        <NavUser user={mockUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
