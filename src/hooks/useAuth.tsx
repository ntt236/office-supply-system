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
    let mounted = true;
    let fallbackTimeout: NodeJS.Timeout;

    const initSession = async () => {
      try {
        // Fallback: If auth takes too long, force loading to stop
        fallbackTimeout = setTimeout(() => {
          if (mounted && loading) {
            console.warn('Auth initialization timed out, forcing load to stop.');
            setLoading(false);
          }
        }, 8000);

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            setUser(profile);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Unexpected auth error:', err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        clearTimeout(fallbackTimeout);
      }
    };

    // Initialize session explicitly
    initSession();

    // Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: { user?: { id: string } } | null) => {
        // Ignore INITIAL_SESSION as we handle it manually above to prevent race conditions
        if (event === 'INITIAL_SESSION') return;

        if (session?.user) {
          // Push to macrotask queue to completely avoid Auth Lock Deadlock
          setTimeout(() => {
            fetchProfile(session.user!.id).then((profile) => {
              if (mounted) {
                setUser(profile);

                // Redirect only if this is NOT triggered by a manual signIn call
                // and they are currently on the login page or root
                if (!signingIn.current && typeof window !== 'undefined') {
                  const path = window.location.pathname;
                  if (path === '/login' || path === '/') {
                    if (profile?.role === 'admin') {
                      router.push('/dashboard');
                    } else if (profile) {
                      router.push('/requests/new');
                    }
                  }
                }
                setLoading(false);
              }
            });
          }, 0);
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
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
