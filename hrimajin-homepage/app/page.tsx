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
          className="login-fancy-button"
        >
          <span className="login-fancy-fold" />
          <div className="login-fancy-points">
            {Array.from({ length: 10 }).map((_, idx) => (
              <i key={idx} className="login-fancy-point" />
            ))}
          </div>
          <span className="login-fancy-inner">
            <svg
              className="login-fancy-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            >
              <polyline points="13.18 1.37 13.18 9.64 21.45 9.64 10.82 22.63 10.82 14.36 2.55 14.36 13.18 1.37" />
            </svg>
            Login
          </span>
        </Link>
      </div>
    </main>
  );
}
