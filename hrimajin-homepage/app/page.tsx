import Background from "@/components/Background";
import Hero from "@/components/Hero";
import Particles from "@/components/Particles";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* Animated background */}
      <Background />

      {/* Floating particles */}
      <Particles />

      {/* Hero section with integrated cards */}
      <Hero />

      {/* Floating login button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 backdrop-blur transition hover:-translate-y-1 hover:border-[#8a8cd1]/50 hover:bg-[#1a1a2a]/80 focus:outline-none focus:ring-2 focus:ring-[#8a8cd1] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#6365b9]/30 text-xs text-white transition group-hover:bg-[#6365b9]/50">
            ⨠
          </span>
          <span className="tracking-wide">Login</span>
        </Link>
      </div>
    </main>
  );
}
