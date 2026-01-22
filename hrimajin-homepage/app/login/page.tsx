'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        window.localStorage.setItem('hr_admin', 'true');
        router.push('/');
      } else {
        setError('Password salah.');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,101,185,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(138,140,209,0.08),transparent_20%)]" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8a8cd1]">
            Admin Access
          </p>
          <h1 className="mt-2 text-3xl font-bold">Login</h1>
          <p className="mt-2 text-sm text-gray-400">
            Masuk untuk mengaktifkan mode edit dan mengelola card.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-[#6365b9] focus:ring-[#6365b9]/30"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0f0f1a] px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-[#6365b9] focus:ring-[#6365b9]/30"
              placeholder="********"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#6365b9] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6365b9]/40 transition hover:-translate-y-0.5 hover:bg-[#4a4c91] focus:outline-none focus:ring-2 focus:ring-[#8a8cd1] focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Default password: admin123 (atur via NEXT_PUBLIC_ADMIN_PASSWORD).
        </p>
      </div>
    </main>
  );
}
