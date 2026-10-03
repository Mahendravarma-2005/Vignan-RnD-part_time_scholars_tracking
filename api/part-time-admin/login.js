// Vercel Serverless Function: Admin Authentication
const { supabase, isConfigured } = require('../../_supabase');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const cleanEmail = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // Environment-level admin override
  const adminEmail = (process.env.ADMIN_EMAIL || 'dean_rd@vignan.ac.in').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'passowrd123';

  if (cleanEmail === adminEmail && cleanPass === adminPass) {
    return res.json({
      success: true,
      message: 'Authentication successful',
      user: { email: adminEmail, role: 'Dean R&D' }
    });
  }

  if (isConfigured()) {
    try {
      const { data: users, error } = await supabase
        .from('part_time_admin_users')
        .select('*')
        .ilike('email', cleanEmail)
        .limit(1);

      if (!error && users && users.length > 0) {
        const user = users[0];
        let isValid = false;
        try {
          isValid = await bcrypt.compare(cleanPass, user.password_hash);
        } catch (e) {
          isValid = (cleanPass === user.password_hash);
        }

        if (isValid) {
          return res.json({
            success: true,
            message: 'Authentication successful',
            user: { email: user.email, role: user.role || 'Dean R&D' }
          });
        }
      }
    } catch (err) {
      console.warn('Supabase admin check error:', err);
    }
  }

  // Fallback demo credentials
  if (
    (cleanEmail === 'dean_rd@vignan.ac.in' || cleanEmail === 'admin') &&
    (cleanPass === 'passowrd123' || cleanPass === 'password123' || cleanPass === 'admin123')
  ) {
    return res.json({
      success: true,
      message: 'Authentication successful',
      user: { email: 'dean_rd@vignan.ac.in', role: 'Dean R&D' }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid administrative email address or password'
  });
};
