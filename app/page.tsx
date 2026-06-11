"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ServicesSection from "@/components/ServicesSection";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";

export default function Home() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Preloader onComplete={() => setLoaded(true)} />
      {loaded && (
        <main className="pt-[72px]">
          <Navbar />
          <HeroSection />
          <div className="h-32" style={{ background: "linear-gradient(to bottom, transparent, #0a0a1f)" }} />
          <FeaturesSection />
          <ServicesSection />
          <Footer />
        </main>
      )}
    </>
  );
}
