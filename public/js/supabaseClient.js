/**
 * Supabase Client Initialization & Helper
 * Supports direct client queries as well as serverless /api/ fallback
 */
import { SUPABASE_CONFIG } from './config.js';

let _supabaseClient = null;

export function getSupabase() {
  if (_supabaseClient) return _supabaseClient;

  const url = SUPABASE_CONFIG.url || (typeof window !== 'undefined' && window.__SUPABASE_URL__);
  const key = SUPABASE_CONFIG.anonKey || (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__);

  if (url && key && typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    try {
      _supabaseClient = window.supabase.createClient(url, key);
      return _supabaseClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
    }
  }

  return null;
}

export function isSupabaseConfigured() {
  return !!getSupabase();
}
