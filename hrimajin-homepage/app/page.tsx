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
          className="login-gradient-button"
        >
          <span className="login-gradient-text">Login</span>
        </Link>
      </div>
    </main>
  );
}
