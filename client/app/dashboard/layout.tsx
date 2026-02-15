"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAccount } from "wagmi";
import { Wallet, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, isConnecting, isReconnecting } = useAccount();

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {!isConnected && !isConnecting && !isReconnecting ? (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800">
                <Wallet className="h-10 w-10 text-zinc-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-zinc-100">
                  Wallet Not Connected
                </h3>
                <p className="text-zinc-400 max-w-xs mx-auto">
                  Please connect your wallet using the button in the bottom left
                  of the sidebar to access your merchant dashboard.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
