'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LoginLogoutButton() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const readAuth = () => {
      try {
        setIsAuthed(window.localStorage.getItem('hr_admin') === 'true');
      } catch (error) {
        setIsAuthed(false);
      }
    };

    readAuth();
    const handler = (event: StorageEvent) => {
      if (event.key === 'hr_admin') readAuth();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem('hr_admin');
    } catch (error) {
      // ignore
    }
    setIsAuthed(false);
    window.location.href = '/login';
  };

  if (!isAuthed) {
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
