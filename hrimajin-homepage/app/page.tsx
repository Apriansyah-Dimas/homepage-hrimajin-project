import Background from "@/components/Background";
import Hero from "@/components/Hero";
import Particles from "@/components/Particles";

export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden">
      {/* Animated background */}
      <Background />

      {/* Floating particles */}
      <Particles />

      {/* Hero section with integrated cards */}
      <Hero />

    </main>
  );
}
