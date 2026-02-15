import { HeroSection } from "@/components/blocks/hero-section-dark";
import { Feature } from "@/components/ui/feature-section-with-bento-grid";
import { StackedCircularFooter } from "@/components/ui/stacked-circular-footer";

export default function Home() {
  return (
    <>
      <HeroSection
        title="EtherBlinks — Built for Etherlink"
        subtitle={{
          regular: "Programmable Micropayments for ",
          gradient: "the AI Economy",
        }}
        description="Accept one-time payments, recurring subscriptions, and machine-to-machine micropayments — settled instantly in USDC on Etherlink. Built for AI agents and the next generation of digital commerce."
        ctaText="Get Started"
        ctaHref="/dashboard"
        bottomImage={{
          light: "https://www.launchuicomponents.com/app-light.png",
          dark: "image.png",
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
          lightLineColor: "#4a4a4a",
          darkLineColor: "#2a2a2a",
        }}
      />
      <Feature />
      <StackedCircularFooter />
    </>
  );
}
