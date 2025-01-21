import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .single();

    if (error) throw error;
    return settings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .select()
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

export async function updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings | null> {
  try {
    const { data: settings, error } = await supabase
      .from('user_settings')
      .update(updates)
      .select()
      .single();

    if (error) throw error;
    return settings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    return null;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}