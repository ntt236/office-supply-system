'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  // Prevent double-redirect when signIn() and onAuthStateChange both fire
  const signingIn = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(*)')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('fetchProfile error:', error.message);
      return null;
    }
    return data as User;
  }, [supabase]);

  useEffect(() => {
    // onAuthStateChange is the single source of truth.
    // It fires immediately on mount with INITIAL_SESSION event (replaces getSession).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: { user?: { id: string } } | null) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);

          // Redirect only if this is NOT triggered by a manual signIn call
          if (!signingIn.current) {
            if (profile?.role === 'admin') {
              router.push('/dashboard');
            } else if (profile) {
              router.push('/requests/new');
            }
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    signingIn.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('Vui lòng xác nhận email trước khi đăng nhập.');
      }

      const profile = await fetchProfile(data.user.id);
      if (!profile) throw new Error('Không tìm thấy hồ sơ người dùng.');

      setUser(profile);

      if (profile.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/requests/new');
      }

      return profile;
    } finally {
      // Reset after a short delay so onAuthStateChange won't double-redirect
      setTimeout(() => { signingIn.current = false; }, 500);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
