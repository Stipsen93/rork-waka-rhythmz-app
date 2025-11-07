import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { Role } from './AppState';

export interface UserProfile {
  id: string;
  username: string;
  role: Role;
  passwordChangedByUser: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (username: string, password: string, role: Role) => Promise<{ success: boolean; error?: string; password?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<{ password: string }>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthProvider] Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          role: data.role as Role,
          passwordChangedByUser: data.password_changed_by_user,
        });
        console.log('[AuthProvider] Profile loaded:', data.username, data.role);
      }
    } catch (error) {
      console.error('[AuthProvider] Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthProvider] Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[AuthProvider] Auth state changed:', _event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthProvider] Signing in user:', username);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !profileData) {
        console.error('[AuthProvider] Profile not found:', username);
        return { success: false, error: 'Gebruiker niet gevonden' };
      }

      const email = `${username}@wakarythmz.local`;
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthProvider] Sign in error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('[AuthProvider] Sign in successful');
      return { success: true };
    } catch (error) {
      console.error('[AuthProvider] Sign in exception:', error);
      return { success: false, error: 'Er is een fout opgetreden' };
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string, role: Role): Promise<{ success: boolean; error?: string; password?: string }> => {
    try {
      console.log('[AuthProvider] Signing up user:', username, role);
      
      const email = `${username}@wakarythmz.local`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role,
          }
        }
      });

      if (authError || !authData.user) {
        console.error('[AuthProvider] Auth sign up error:', authError);
        return { success: false, error: authError?.message || 'Fout bij aanmaken account' };
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          role,
          password_changed_by_user: false,
        });

      if (profileError) {
        console.error('[AuthProvider] Profile creation error:', profileError);
        return { success: false, error: 'Fout bij aanmaken profiel' };
      }

      console.log('[AuthProvider] Sign up successful');
      return { success: true, password };
    } catch (error) {
      console.error('[AuthProvider] Sign up exception:', error);
      return { success: false, error: 'Er is een fout opgetreden' };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[AuthProvider] Signing out');
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      console.log('[AuthProvider] Updating profile:', updates);
      const { error } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          role: updates.role,
          password_changed_by_user: updates.passwordChangedByUser,
        })
        .eq('id', user.id);

      if (error) throw error;

      if (profile) {
        setProfile({ ...profile, ...updates });
      }
      console.log('[AuthProvider] Profile updated');
    } catch (error) {
      console.error('[AuthProvider] Error updating profile:', error);
    }
  }, [user, profile]);

  const resetUserPassword = useCallback(async (userId: string): Promise<{ password: string }> => {
    try {
      console.log('[AuthProvider] Resetting password for user:', userId);
      
      const newPassword = generatePassword();
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (!profileData) {
        throw new Error('User not found');
      }

      const email = `${profileData.username}@wakarythmz.local`;
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('[AuthProvider] Password reset error:', updateError);
        throw updateError;
      }

      await supabase
        .from('profiles')
        .update({ password_changed_by_user: false })
        .eq('id', userId);

      console.log('[AuthProvider] Password reset successful');
      return { password: newPassword };
    } catch (error) {
      console.error('[AuthProvider] Password reset exception:', error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetUserPassword,
  }), [session, user, profile, loading, signIn, signUp, signOut, updateProfile, resetUserPassword]);

  return value;
});

function generatePassword(): string {
  const base = Math.random().toString(36).slice(2, 8);
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${base}${suffix}`;
}
