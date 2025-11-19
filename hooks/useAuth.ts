
import { useEffect, useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      // Create couple profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('couple_profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw here - profile can be created later
        }
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
