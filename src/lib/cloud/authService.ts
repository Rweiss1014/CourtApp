/**
 * Authentication Service
 * Handles user signup, login, and session management
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
}

class AuthService {
  /**
   * Check if cloud sync is available
   */
  isAvailable(): boolean {
    return isSupabaseConfigured;
  }

  /**
   * Sign up new user
   */
  async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!supabase) {
      return { user: null, error: 'Cloud sync not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to create user' };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
        },
        error: null,
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: 'Signup failed. Please try again.' };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!supabase) {
      return { user: null, error: 'Cloud sync not configured' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to sign in' };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
        },
        error: null,
      };
    } catch (error) {
      console.error('Signin error:', error);
      return { user: null, error: 'Sign in failed. Please try again.' };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: string | null }> {
    if (!supabase) {
      return { error: 'Cloud sync not configured' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      console.error('Signout error:', error);
      return { error: 'Sign out failed' };
    }
  }

  /**
   * Get current user session
   */
  async getSession(): Promise<{ user: AuthUser | null; session: Session | null }> {
    if (!supabase) {
      return { user: null, session: null };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return { user: null, session: null };
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        session,
      };
    } catch (error) {
      console.error('Get session error:', error);
      return { user: null, session: null };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { user } = await this.getSession();
    return user;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: string | null }> {
    if (!supabase) {
      return { error: 'Cloud sync not configured' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error: 'Password reset failed' };
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) return () => {};

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || '',
        });
      } else {
        callback(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const authService = new AuthService();
