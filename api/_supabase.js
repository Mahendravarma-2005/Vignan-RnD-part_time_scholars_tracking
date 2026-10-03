// Vercel Serverless Function - Supabase Server Client
try { require('dotenv').config(); } catch (e) {}
const { createClient } = require('@supabase/supabase-js');

let SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
SUPABASE_URL = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    let wsTransport = null;
    try {
      wsTransport = require('ws');
    } catch (e) {}

    const options = {
      auth: { persistSession: false }
    };
    if (wsTransport) {
      options.realtime = { transport: wsTransport };
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, options);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err.message);
  }
}

module.exports = {
  supabase,
  isConfigured: () => Boolean(supabase)
};
