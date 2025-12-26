"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import { clearSupabaseAuth, isAuthError } from '@/lib/auth-cleanup';

interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  birth_date: string | null;
  wordpress_user_id: number | null;
  blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  cancelled_orders_count: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, birthDate?: string | null) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);

          if (isAuthError(error)) {
            console.log('Auth error detected, clearing localStorage');
            clearSupabaseAuth();
          }

          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setProfile(null);
        } else if (event === 'USER_UPDATED') {
          if (session?.user) {
            setUser(session.user);
            await loadProfile(session.user.id);
          }
        }

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const claimPendingPrize = async (userId: string) => {
    const sessionId = localStorage.getItem('scratch_game_session_id');
    const pendingPrize = localStorage.getItem('pending_prize');

    if (!sessionId || !pendingPrize) return;

    try {
      const { prize } = JSON.parse(pendingPrize);

      const { data: pendingPrizeData } = await supabase
        .from('pending_prizes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('claimed', false)
        .maybeSingle();

      if (pendingPrizeData && pendingPrizeData.result === 'win' && pendingPrizeData.prize_type_id) {
        const uniqueCode = `${prize.code}-${userId.substring(0, 8)}-${Date.now()}`;

        await supabase
          .from('user_coupons')
          .insert({
            user_id: userId,
            coupon_type_id: pendingPrizeData.prize_type_id,
            code: uniqueCode,
            source: 'scratch_game',
            valid_until: prize.valid_until || '2026-02-01 23:59:59+00',
          });

        await supabase
          .from('pending_prizes')
          .update({
            claimed: true,
            claimed_by: userId,
            claimed_at: new Date().toISOString(),
          })
          .eq('id', pendingPrizeData.id);

        localStorage.removeItem('pending_prize');
      }
    } catch (error) {
      console.error('Error claiming pending prize:', error);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, birthDate?: string | null) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          birth_date: birthDate || null,
        },
      },
    });

    if (!error && data.user) {
      let wordpressUserId = null;

      try {
        const wpUserResponse = await fetch('/api/wordpress/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.user.email,
            firstName: firstName,
            lastName: lastName,
            password: password,
          }),
        });

        const wpUserResult = await wpUserResponse.json();

        if (wpUserResult.success && wpUserResult.userId) {
          wordpressUserId = wpUserResult.userId;
        } else {
          console.error('Failed to create WordPress user:', wpUserResult.error);
        }
      } catch (wpError) {
        console.error('Error creating WordPress user:', wpError);
      }

      // Only update wordpress_user_id if we successfully created a WordPress user
      if (wordpressUserId) {
        try {
          await supabase.from('profiles').update({
            wordpress_user_id: wordpressUserId,
          }).eq('id', data.user.id);
        } catch (updateError) {
          console.error('Error updating WordPress user ID:', updateError);
        }
      }

      await claimPendingPrize(data.user.id);

      try {
        const response = await fetch('/api/woocommerce/sync-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          console.error('Failed to sync with WooCommerce:', result.error);
        }
      } catch (syncError) {
        console.error('Error syncing with WooCommerce:', syncError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      await claimPendingPrize(data.user.id);

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', data.user.id)
        .maybeSingle();

      if (userProfile?.phone && userProfile.phone.trim() !== '') {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          await fetch(`${supabaseUrl}/functions/v1/send-login-sms`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber: userProfile.phone,
              firstName: userProfile.first_name || 'Client',
              lastName: userProfile.last_name || '',
            }),
          });
        } catch (smsError) {
          console.error('Erreur lors de l\'envoi du SMS de connexion:', smsError);
        }
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!error) {
      await loadProfile(user.id);

      if (profile?.wordpress_user_id) {
        try {
          await fetch('/api/wordpress/update-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wordpressUserId: profile.wordpress_user_id,
              firstName: data.first_name,
              lastName: data.last_name,
              phone: data.phone,
            }),
          });
        } catch (wpError) {
          console.error('Error updating WordPress user:', wpError);
        }
      }
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, resetPassword, updatePassword }}>
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
