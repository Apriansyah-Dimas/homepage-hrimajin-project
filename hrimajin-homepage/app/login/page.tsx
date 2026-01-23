'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

const greetings = [
  'Good to see you',
  'Hey, welcome',
  'Ready to start?',
  "Oh, it's you",
  'You again?',
  'Ready to dive in?',
];

class TextScramble {
  el: HTMLElement;
  chars: string;
  queue: Array<{ from: string; to: string; start: number; end: number; char?: string }>;
  frame: number;
  frameRequest?: number;
  resolve?: () => void;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.queue = [];
    this.frame = 0;
    this.update = this.update.bind(this);
  }

  setText(newText: string) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
    this.queue = [];

    for (let i = 0; i < length; i += 1) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest ?? 0);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i += 1) {
      const { from, to, start, end } = this.queue[i]!;
      let { char } = this.queue[i]!;

      if (this.frame >= end) {
        complete += 1;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i]!.char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve?.();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame += 1;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)]!;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const headerRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!headerRef.current) return;
    const fx = new TextScramble(headerRef.current);
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]!;
    const timeout = setTimeout(() => {
      fx.setText(randomGreeting);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validatePassword = (value: string) => value.length >= 8;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setErrorEmail('');
    setErrorPassword('');

    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password);

    if (!emailValid) setErrorEmail('Please enter a valid email address.');
    if (!passwordValid) setErrorPassword('Password must be at least 8 characters.');
    if (!emailValid || !passwordValid) return;

    setIsLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        window.localStorage.setItem('hr_admin', 'true');
        router.push('/');
      } else {
        setErrorPassword('Password salah.');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <main className="login-page">
      <div className="login-wrapper">
        <section className="card">
          <header className="header">
            <h1 className="scramble-text" ref={headerRef} data-text="Login">
              Login
            </h1>
            <p>Enter your credentials to access your account.</p>
          </header>

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorEmail) setErrorEmail('');
                  }}
                  onBlur={() => {
                    if (!validateEmail(email)) {
                      setErrorEmail('Please enter a valid email address.');
                    }
                  }}
                  className={errorEmail ? 'input-error' : ''}
                  disabled={isLoading}
                />
              </div>
              <span className={`error-message ${errorEmail ? 'visible' : ''}`}>
                {errorEmail}
              </span>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorPassword) setErrorPassword('');
                  }}
                  onBlur={() => {
                    if (!validatePassword(password)) {
                      setErrorPassword('Password must be at least 8 characters.');
                    }
                  }}
                  className={errorPassword ? 'input-error' : ''}
                  disabled={isLoading}
                />
              </div>
              <span className={`error-message ${errorPassword ? 'visible' : ''}`}>
                {errorPassword}
              </span>
            </div>

            <div className="actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => router.push('/')}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button type="submit" className={isLoading ? 'loading' : ''} disabled={isLoading}>
                <div className="spinner" />
                <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
              </button>
            </div>
          </form>

          <footer className="footer">
            Contact your administrator to request access.
          </footer>
        </section>
      </div>

      <svg className="login-hidden-filter" aria-hidden="true">
        <defs>
          <filter id="login-goo">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" result="mix" />
          </filter>
        </defs>
      </svg>

      <style jsx global>{`
        :root {
          --bg-color: #0a0a0a;
          --card-bg: rgba(255, 255, 255, 0.02);
          --card-border: rgba(255, 255, 255, 0.08);
          --accent-primary: #6365b9;
          --accent-hover: #7577c4;
          --accent-focus-ring: rgba(99, 101, 185, 0.4);
          --text-main: #ffffff;
          --text-muted: #a1a1aa;
          --text-error: #f87171;
          --input-bg: #141414;
          --input-border: #27272a;
          --input-border-hover: #3f3f46;
          --radius-card: 16px;
          --radius-input: 8px;
          --shadow-card: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
        }

        .login-page {
          min-height: 100vh;
          background-color: var(--bg-color);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }

        .login-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .card {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-card);
          padding: 36px;
          width: 100%;
          max-width: 420px;
          box-shadow: var(--shadow-card);
          display: flex;
          flex-direction: column;
          gap: 22px;
          opacity: 0;
          transform: translateY(20px);
          animation: login-fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes login-fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header {
          text-align: center;
          margin-bottom: 8px;
        }

        .header h1 {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          display: inline-block;
        }

        .scramble-text .dud {
          color: var(--accent-primary);
          opacity: 0.8;
          display: inline-block;
        }

        .header p {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 400;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .input-wrapper {
          position: relative;
        }

        input {
          width: 100%;
          background-color: var(--input-bg);
          border: 1px solid var(--input-border);
          border-radius: var(--radius-input);
          padding: 12px 14px;
          font-size: 15px;
          color: var(--text-main);
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
        }

        input::placeholder {
          color: #52525b;
        }

        input:hover {
          border-color: var(--input-border-hover);
        }

        input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-focus-ring);
        }

        input.input-error {
          border-color: var(--text-error);
        }

        input.input-error:focus {
          box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.2);
        }

        .error-message {
          font-size: 12px;
          color: var(--text-error);
          min-height: 18px;
          opacity: 0;
          transform: translateY(-5px);
          transition: all 0.2s ease;
          margin-left: 2px;
        }

        .error-message.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .actions {
          margin-top: 4px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        button[type='submit'] {
          flex: 1;
          background-color: var(--accent-primary);
          color: white;
          border: none;
          border-radius: var(--radius-input);
          padding: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        button[type='submit']:hover {
          background-color: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 101, 185, 0.3);
        }

        button[type='submit']:active {
          transform: translateY(0);
        }

        button[type='submit']:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .footer {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .spinner {
          display: none;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: login-spin 0.8s linear infinite;
          margin-right: 4px;
          vertical-align: middle;
        }

        @keyframes login-spin {
          to {
            transform: rotate(360deg);
          }
        }

        button.loading {
          opacity: 0.9;
        }

        button.loading .spinner {
          display: inline-block;
        }

        .secondary-action {
          flex: 1;
          background: transparent;
          border: 1px solid var(--input-border);
          border-radius: var(--radius-input);
          color: var(--text-main);
          padding: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
        }

        .secondary-action:hover {
          border-color: var(--input-border-hover);
          background-color: rgba(255, 255, 255, 0.02);
        }

        .secondary-action:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-hidden-filter {
          position: absolute;
          width: 0;
          height: 0;
          overflow: hidden;
          opacity: 0;
        }

        @media (max-width: 480px) {
          .card {
            padding: 28px;
          }

          button[type='submit'] {
            font-size: 14px;
          }
        }
      `}</style>
    </main>
  );
}
