'use client';

import Link from 'next/link';
import { useAuth } from './AuthContext';

export default function LoginLogoutButton() {
  const { user, signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="login-blob-btn">
        <span className="login-blob-inner">
          <span className="login-blob-blobs">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span key={idx} className="login-blob-blob" />
            ))}
          </span>
        </span>
        <span className="login-blob-label">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="login-blob-btn">
        <span className="login-blob-inner">
          <span className="login-blob-blobs">
            {Array.from({ length: 4 }).map((_, idx) => (
              <span key={idx} className="login-blob-blob" />
            ))}
          </span>
        </span>
        <span className="login-blob-label">Login</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleLogout} className="login-blob-btn">
      <span className="login-blob-inner">
        <span className="login-blob-blobs">
          {Array.from({ length: 4 }).map((_, idx) => (
            <span key={idx} className="login-blob-blob" />
          ))}
        </span>
      </span>
      <span className="login-blob-label">Logout</span>
    </button>
  );
}
