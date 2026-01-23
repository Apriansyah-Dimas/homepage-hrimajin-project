import Background from "@/components/Background";
import Hero from "@/components/Hero";
import Particles from "@/components/Particles";
import LoginLogoutButton from "@/components/LoginLogoutButton";

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
        <LoginLogoutButton />
      </div>

      {/* Goo filter for blob button */}
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id="login-goo">
            <feGaussianBlur in="SourceGraphic" result="login-blur" stdDeviation="10" />
            <feColorMatrix
              in="login-blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7"
              result="login-goo"
            />
            <feBlend in="SourceGraphic" in2="login-goo" result="mix" />
          </filter>
        </defs>
      </svg>
    </main>
  );
}
