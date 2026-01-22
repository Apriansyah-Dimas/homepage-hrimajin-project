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
          className="inline-flex items-center gap-2 rounded-full bg-[#6365b9] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6365b9]/40 transition hover:-translate-y-0.5 hover:bg-[#4a4c91] focus:outline-none focus:ring-2 focus:ring-[#8a8cd1] focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
