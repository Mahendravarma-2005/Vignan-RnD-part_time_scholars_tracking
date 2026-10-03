// Vercel Serverless Function: Get All Scholar Master Profiles
const { supabase, isConfigured } = require('../_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (isConfigured()) {
    try {
      const { data, error } = await supabase
        .from('part_time_scholar_profiles')
        .select('*')
        .order('reg_no', { ascending: true });

      if (error) throw error;

      const list = (data || []).map(p => ({
        regNo: p.reg_no,
        scholarName: p.scholar_name,
        guideName: p.guide_name,
        department: p.department,
        raType: p.ra_type || 'Industry',
        dateOfJoining: p.date_of_joining ? String(p.date_of_joining).split('T')[0] : '',
        scholarContact: p.scholar_contact || '',
        supervisorContact: p.supervisor_contact || '',
        coursesCompleted: p.courses_completed || 0
      }));

      return res.json({ success: true, data: list, count: list.length, source: 'supabase' });
    } catch (err) {
      console.error('Supabase all profiles fetch error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // Fallback demo array
  const DEMO_PROFILES = [
    { regNo: '231PT01004', scholarName: 'Mrs. T. Lakshmi Prasanna', guideName: 'Dr. S. Anil Kumar', department: 'Bio-Tech', raType: 'Academic', dateOfJoining: '2023-07-08', scholarContact: '9846342281', supervisorContact: '9440556677', coursesCompleted: 4 },
    { regNo: '231PT06012', scholarName: 'Mr. P. Srinivasa Rao', guideName: 'Dr. N. Usha Rani', department: 'ECE', raType: 'Industry', dateOfJoining: '2023-08-15', scholarContact: '9988776655', supervisorContact: '9440234567', coursesCompleted: 4 },
    { regNo: '241PT03001', scholarName: 'Mr. G. Ravindra Babu', guideName: 'Dr. P. Sundara Kumar', department: 'Civil', raType: 'Industry', dateOfJoining: '2024-08-01', scholarContact: '9346299591', supervisorContact: '9848554433', coursesCompleted: 4 },
    { regNo: '241PT04005', scholarName: 'Ms. K. Srilatha', guideName: 'Dr. Jyosthna Devi Bodapati', department: 'ACSE', raType: 'Academic', dateOfJoining: '2024-09-04', scholarContact: '9876543210', supervisorContact: '9849123456', coursesCompleted: 3 },
    { regNo: '241PT12002', scholarName: 'Ms. Ch. Hymavathi Devi', guideName: 'Dr. K. Kalpana', department: 'MBA', raType: 'Academic', dateOfJoining: '2024-08-01', scholarContact: '9652794187', supervisorContact: '9988112233', coursesCompleted: 4 },
    { regNo: '251PT01001', scholarName: 'Dr. / Mr. V. Ramesh Kumar', guideName: 'Dr. K. Phani Kumar', department: 'CSE', raType: 'Industry', dateOfJoining: '2024-07-31', scholarContact: '9848012345', supervisorContact: '9440154321', coursesCompleted: 1 },
    { regNo: '251PT08003', scholarName: 'Mr. M. Venkat Reddy', guideName: 'Dr. Sanjay Kumar Gupta', department: 'Mechanical', raType: 'Industry', dateOfJoining: '2025-07-10', scholarContact: '9177994914', supervisorContact: '9876543210', coursesCompleted: 2 },
    { regNo: '251PT36001', scholarName: 'Mr. B. Koteswara Rao', guideName: 'Dr. M. Sabareesh', department: 'Pharmacy', raType: 'Industry', dateOfJoining: '2025-04-07', scholarContact: '9948399412', supervisorContact: '9876501234', coursesCompleted: 3 }
  ];

  return res.json({ success: true, data: DEMO_PROFILES, count: DEMO_PROFILES.length, source: 'demo' });
};
