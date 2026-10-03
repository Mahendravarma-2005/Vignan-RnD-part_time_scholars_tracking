// Vercel Serverless Function: Verify Mobile OTP
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
    const { empId, regNo, mobile, mobileNumber, phone, otp, otpCode } = req.body || {};
    const cleanReg = String(empId || regNo || '').trim().toUpperCase();
    let cleanMobile = String(mobile || mobileNumber || phone || '').replace(/[\s\-\(\)\+]/g, '');
    const cleanOtp = String(otp || otpCode || '').trim();

    if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
      cleanMobile = cleanMobile.substring(2);
    }

    if (!cleanReg || !cleanOtp) {
      return res.status(400).json({ success: false, message: 'Registration Number and OTP code are required.' });
    }

    if (isConfigured()) {
      const nowIso = new Date().toISOString();
      const { data: records, error } = await supabase
        .from('portal_otps')
        .select('*')
        .ilike('emp_id', cleanReg)
        .eq('otp_code', cleanOtp)
        .eq('is_verified', false)
        .gt('expires_at', nowIso)
        .order('id', { ascending: false })
        .limit(1);

      if (error || !records || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP code. Please enter the latest 6-digit code or request a new one.'
        });
      }

      // Mark OTP as verified
      await supabase.from('portal_otps').update({ is_verified: true }).eq('id', records[0].id);

      // Fetch scholar profile for instant UI lock-in
      const { data: profile } = await supabase
        .from('part_time_scholar_profiles')
        .select('*')
        .ilike('reg_no', cleanReg)
        .limit(1)
        .maybeSingle();

      return res.json({
        success: true,
        message: 'OTP verified successfully.',
        profile: profile ? {
          regNo: profile.reg_no,
          scholarName: profile.scholar_name,
          guideName: profile.guide_name,
          department: profile.department,
          raType: profile.ra_type || 'Industry',
          dateOfJoining: profile.date_of_joining ? String(profile.date_of_joining).split('T')[0] : '',
          scholarContact: profile.scholar_contact || '',
          supervisorContact: profile.supervisor_contact || '',
          coursesCompleted: profile.courses_completed || 0
        } : null
      });
    }

    // Demo fallback: accept any 6-digit code or '123456'
    if (cleanOtp.length === 6) {
      return res.json({
        success: true,
        message: 'OTP verified successfully (Demo Mode).'
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid OTP code. Please enter 6 digits.' });
  } catch (err) {
    console.error('OTP Verify error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error while verifying OTP' });
  }
};
