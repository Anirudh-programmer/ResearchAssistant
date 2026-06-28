import { ExampleReport } from "@/components/landing/ExampleReport";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <PublicNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ExampleReport />
      <FinalCta />
      <Footer />
    </div>
  );
}
