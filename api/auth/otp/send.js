// Vercel Serverless Function: Send Mobile OTP
const { supabase, isConfigured } = require('../../../_supabase');

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

  try {
    const { empId, regNo, mobile, mobileNumber, phone, portal } = req.body || {};
    const cleanReg = String(empId || regNo || '').trim().toUpperCase();
    let cleanMobile = String(mobile || mobileNumber || phone || '').replace(/[\s\-\(\)\+]/g, '');

    if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
      cleanMobile = cleanMobile.substring(2);
    }

    if (!cleanReg) {
      return res.status(400).json({ success: false, message: 'Registration Number is required.' });
    }

    if (!cleanMobile || !/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number.' });
    }

    if (isConfigured()) {
      // 1. Check if scholar profile exists in Supabase
      const { data: profile, error: profErr } = await supabase
        .from('part_time_scholar_profiles')
        .select('reg_no, scholar_name, scholar_contact')
        .ilike('reg_no', cleanReg)
        .limit(1)
        .maybeSingle();

      if (profErr || !profile) {
        return res.status(404).json({
          success: false,
          message: `Scholar Registration Number "${cleanReg}" was not found in the database. Please check your registration number.`
        });
      }

      // 2. Generate 6-digit OTP code
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: otpErr } = await supabase.from('portal_otps').insert({
        emp_id: cleanReg,
        mobile: cleanMobile,
        portal: 'part-time-phd',
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false
      });

      if (otpErr) {
        console.error('Supabase OTP insert error:', otpErr);
        throw new Error('Failed to record OTP in database');
      }

      console.log(`🔐 [VERCEL OTP] Scholar: ${cleanReg} | Mobile: +91 ${cleanMobile} | OTP: ${otpCode}`);

      const masked = `${cleanMobile.substring(0, 2)}******${cleanMobile.substring(8)}`;
      return res.json({
        success: true,
        message: `Verification code generated for +91 ${masked}.`,
        mobile: cleanMobile,
        maskedMobile: masked,
        expiresInMinutes: 10,
        devOtp: process.env.NODE_ENV !== 'production' ? otpCode : undefined
      });
    }

    // Offline / Demo mode fallback
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    console.log(`🔐 [DEMO OTP] Scholar: ${cleanReg} | Mobile: +91 ${cleanMobile} | OTP: ${otpCode}`);

    return res.json({
      success: true,
      message: `Demo OTP generated for +91 ${cleanMobile}.`,
      mobile: cleanMobile,
      maskedMobile: `+91 ${cleanMobile.substring(0, 2)}******${cleanMobile.substring(8)}`,
      expiresInMinutes: 10,
      devOtp: otpCode
    });
  } catch (err) {
    console.error('OTP Send error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error while generating OTP' });
  }
};
