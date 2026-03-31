'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Role = 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (userData) {
          setRole(userData.role as Role);
          localStorage.setItem('hr_role', userData.role);
        } else {
          setRole('user');
          localStorage.setItem('hr_role', 'user');
        }
      }
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          setRole(userData.role as Role);
          localStorage.setItem('hr_role', userData.role);
        } else {
          setRole('user');
          localStorage.setItem('hr_role', 'user');
        }
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem('hr_role');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (userData) {
          setRole(userData.role as Role);
          localStorage.setItem('hr_role', userData.role);
        } else {
          setRole('user');
          localStorage.setItem('hr_role', 'user');
        }
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    localStorage.removeItem('hr_role');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
