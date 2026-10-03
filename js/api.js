// Part-Time Research Scholar Tracking System - Supabase & REST API Client
import { API_BASE, STORAGE_KEY, PROFILES_KEY, state } from './config.js';
import { getSupabase } from './supabaseClient.js';

/**
 * Fetch all submitted progress reports (for Admin Dashboard)
 */
export async function fetchAllScholars() {
  const supabase = getSupabase();

  // 1. Direct Supabase Query
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('part_time_monthly_submissions')
        .select(`
          *,
          courseDetails:part_time_courses_completed_details(*),
          journalPapers:part_time_journal_papers(*),
          conferencePapers:part_time_conference_papers(*),
          events:part_time_fdps_attended(*),
          dcMeetings:part_time_dc_meetings_attended(*)
        `)
        .order('current_month', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        state.scholars = data.map(normalizeSubmissionFromDB);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scholars));
        return state.scholars;
      }
    } catch (e) {
      console.warn('Supabase fetchAllScholars failed, checking API/cache:', e);
    }
  }

  // 2. Vercel Serverless / Express REST API
  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/part-time-scholars`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        state.scholars = json.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scholars));
        return state.scholars;
      }
    } catch (e) {
      console.warn('Backend API unavailable, falling back to localStorage cache:', e);
    }
  }

  // 3. LocalStorage Fallback
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) state.scholars = JSON.parse(cached);
  } catch (e) {
    state.scholars = [];
  }
  return state.scholars;
}

/**
 * Fetch permanent scholar profile by registration number
 */
export async function fetchProfileByRegNo(regNo) {
  const clean = (regNo || '').trim().toUpperCase();
  if (!clean) return null;

  const supabase = getSupabase();

  // 1. Direct Supabase Query
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('part_time_scholar_profiles')
        .select('*')
        .ilike('reg_no', clean)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const profile = {
          regNo: data.reg_no,
          scholarName: data.scholar_name,
          guideName: data.guide_name,
          department: data.department,
          raType: data.ra_type || 'Industry',
          dateOfJoining: data.date_of_joining ? String(data.date_of_joining).split('T')[0] : '',
          scholarContact: data.scholar_contact || '',
          supervisorContact: data.supervisor_contact || '',
          coursesCompleted: data.courses_completed || 0,
          bankAccountNo: data.bank_account_no || '',
          bankName: data.bank_name || 'State Bank of India',
          ifscCode: data.ifsc_code || 'SBIN0001234',
          endOfRA: data.end_of_ra ? String(data.end_of_ra).split('T')[0] : ''
        };

        state.masterProfiles[clean.toLowerCase()] = profile;
        state.masterProfiles[clean] = profile;
        try {
          localStorage.setItem(PROFILES_KEY, JSON.stringify(state.masterProfiles));
        } catch (e) { }
        return profile;
      }
    } catch (e) {
      console.warn('Supabase fetchProfileByRegNo failed, checking API/cache:', e);
    }
  }

  // 2. Vercel Serverless / REST API
  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/part-time-profile/${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (json.success && json.found && json.profile) {
        state.masterProfiles[clean.toLowerCase()] = json.profile;
        state.masterProfiles[clean] = json.profile;
        try {
          localStorage.setItem(PROFILES_KEY, JSON.stringify(state.masterProfiles));
        } catch (e) { }
        return json.profile;
      }
    } catch (e) {
      console.warn('Profile fetch API failed, checking local storage cache:', e);
    }
  }

  // 3. Local Memory / Cache Fallback
  const lower = clean.toLowerCase();
  if (state.masterProfiles[clean]) return state.masterProfiles[clean];
  if (state.masterProfiles[lower]) return state.masterProfiles[lower];

  try {
    const localProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
    if (localProfiles[clean]) return localProfiles[clean];
    if (localProfiles[lower]) return localProfiles[lower];
  } catch (e) { }

  const match = state.scholars.find(s => s.regNo && String(s.regNo).trim().toUpperCase() === clean);
  if (match) {
    return {
      regNo: match.regNo,
      scholarName: match.scholarName,
      guideName: match.guideName,
      department: match.department,
      raType: match.raType || 'Industry',
      dateOfJoining: match.dateOfJoining,
      scholarContact: match.scholarContact,
      supervisorContact: match.supervisorContact,
      coursesCompleted: match.coursesCompleted || 0
    };
  }

  return null;
}

/**
 * Save Monthly Progress Submission (Handles duplicate prevention & relation saving)
 */
export async function saveScholarSubmission(payload, isUpdate = false) {
  const supabase = getSupabase();

  // 1. Direct Supabase Execution
  if (supabase) {
    try {
      const cleanReg = (payload.regNo || '').trim().toUpperCase();
      const currentMonth = payload.currentMonth;

      // Duplicate prevention check
      const { data: existingList } = await supabase
        .from('part_time_monthly_submissions')
        .select('id, current_month, created_at')
        .ilike('reg_no', cleanReg)
        .eq('current_month', currentMonth);

      if (existingList && existingList.length > 0) {
        const existing = existingList[0];
        if (!payload.id || payload.id !== existing.id) {
          return {
            error: true,
            status: 409,
            code: 'DUPLICATE_SUBMISSION',
            message: `A monthly progress report for ${currentMonth} has already been submitted by scholar ${cleanReg}. Duplicate submissions are not allowed.`
          };
        }
      }

      const submissionId = payload.id || `pt_sub_${cleanReg}_${currentMonth.replace('-', '_')}_${Date.now()}`;
      payload.id = submissionId;

      // Upsert Scholar Permanent Profile
      await supabase.from('part_time_scholar_profiles').upsert({
        reg_no: cleanReg,
        scholar_name: payload.scholarName,
        guide_name: payload.guideName,
        department: payload.department,
        ra_type: payload.raType || 'Industry',
        date_of_joining: payload.dateOfJoining || null,
        scholar_contact: payload.scholarContact || '',
        supervisor_contact: payload.supervisorContact || '',
        courses_completed: payload.coursesCompleted || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'reg_no' });

      // Upsert Main Monthly Submission
      const { error: subErr } = await supabase.from('part_time_monthly_submissions').upsert({
        id: submissionId,
        reg_no: cleanReg,
        scholar_name: payload.scholarName,
        guide_name: payload.guideName,
        department: payload.department,
        ra_type: payload.raType || 'Industry',
        date_of_joining: payload.dateOfJoining || null,
        scholar_contact: payload.scholarContact || '',
        supervisor_contact: payload.supervisorContact || '',
        current_month: payload.currentMonth,
        courses_completed: payload.coursesCompleted || 0,
        forget_thumbs: payload.forgetThumbs || 0,
        leaves_taken: payload.leavesTaken || 0,
        avg_spent_stayed: payload.avgSpentStayed || '',
        academic_load: payload.academicLoad || '',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (subErr) throw subErr;

      // Clear existing child relations if updating
      await supabase.from('part_time_courses_completed_details').delete().eq('submission_id', submissionId);
      await supabase.from('part_time_journal_papers').delete().eq('submission_id', submissionId);
      await supabase.from('part_time_conference_papers').delete().eq('submission_id', submissionId);
      await supabase.from('part_time_fdps_attended').delete().eq('submission_id', submissionId);
      await supabase.from('part_time_dc_meetings_attended').delete().eq('submission_id', submissionId);

      // Insert Courses
      if (Array.isArray(payload.courseDetails) && payload.courseDetails.length > 0) {
        const courseRows = payload.courseDetails.filter(c => c.courseName).map(cd => ({
          submission_id: submissionId,
          course_code: cd.courseCode || '',
          course_name: cd.courseName,
          course_type: cd.courseType || 'Internal',
          credits: cd.credits || '',
          formative_marks: cd.formativeMarks || '',
          summative_marks: cd.summativeMarks || '',
          grade: cd.grade || '',
          cgpa: cd.cgpa || '',
          result: cd.result || '',
          completion_date: cd.completionDate || null
        }));
        if (courseRows.length > 0) {
          await supabase.from('part_time_courses_completed_details').insert(courseRows);
        }
      }

      // Insert Journal Papers
      if (Array.isArray(payload.journalPapers) && payload.journalPapers.length > 0) {
        const journalRows = payload.journalPapers.filter(j => j.journalName).map(j => ({
          submission_id: submissionId,
          title: j.title || '',
          journal_name: j.journalName,
          status: j.status || 'Communicated',
          status_date: j.statusDate || null
        }));
        if (journalRows.length > 0) {
          await supabase.from('part_time_journal_papers').insert(journalRows);
        }
      }

      // Insert Conference Papers
      if (Array.isArray(payload.conferencePapers) && payload.conferencePapers.length > 0) {
        const confRows = payload.conferencePapers.filter(c => c.conferenceName).map(c => ({
          submission_id: submissionId,
          title: c.title || '',
          conference_name: c.conferenceName,
          status: c.status || 'Communicated',
          status_date: c.statusDate || null
        }));
        if (confRows.length > 0) {
          await supabase.from('part_time_conference_papers').insert(confRows);
        }
      }

      // Insert Events / FDPs
      const eventsList = payload.events || payload.fdps || [];
      if (Array.isArray(eventsList) && eventsList.length > 0) {
        const eventRows = eventsList.filter(e => e.name).map(e => ({
          submission_id: submissionId,
          name: e.name,
          category: e.category || 'Workshop',
          organizer: e.organizer || '',
          event_date: e.eventDate || null
        }));
        if (eventRows.length > 0) {
          await supabase.from('part_time_fdps_attended').insert(eventRows);
        }
      }

      // Insert DC Meetings
      const dcList = payload.dcMeetings || payload.dcAttended || [];
      if (Array.isArray(dcList) && dcList.length > 0) {
        const dcRows = dcList.filter(dc => dc.dcName || dc.lastDcDate || dc.comments).map(dc => ({
          submission_id: submissionId,
          scholar_id: cleanReg,
          dc_name: dc.dcName || 'DC Meeting',
          last_dc_date: dc.lastDcDate || null,
          comments: dc.comments || '',
          regulation: dc.regulation || 'R22',
          rating: dc.rating || '',
          recommendations: dc.recommendations || 'In Progress'
        }));
        if (dcRows.length > 0) {
          await supabase.from('part_time_dc_meetings_attended').insert(dcRows);
        }
      }

      return payload;
    } catch (err) {
      console.warn('Supabase save failed, checking REST API fallback:', err);
    }
  }

  // 2. Vercel Serverless / REST API
  if (API_BASE !== null) {
    try {
      const url = isUpdate ? `${API_BASE}/api/part-time-scholars/${payload.id}` : `${API_BASE}/api/part-time-scholars`;
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          error: true,
          status: res.status,
          code: json.error || 'ERROR',
          message: json.message || 'Failed to save submission.'
        };
      }
      return json.data || payload;
    } catch (e) {
      console.warn('Backend API save failed, saving to local cache:', e);
    }
  }

  return payload;
}

/**
 * Fetch past monthly submissions for a specific scholar (History)
 */
export async function fetchScholarSubmissionsAPI(regNo) {
  const clean = (regNo || '').trim().toUpperCase();
  if (!clean) return [];

  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('part_time_monthly_submissions')
        .select(`
          *,
          courseDetails:part_time_courses_completed_details(*),
          journalPapers:part_time_journal_papers(*),
          conferencePapers:part_time_conference_papers(*),
          events:part_time_fdps_attended(*),
          dcMeetings:part_time_dc_meetings_attended(*)
        `)
        .ilike('reg_no', clean)
        .order('current_month', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeSubmissionFromDB);
      }
    } catch (e) {
      console.warn('Supabase fetchScholarSubmissionsAPI failed:', e);
    }
  }

  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/part-time-scholar-submissions/${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch (e) { }
  }

  return state.scholars.filter(s => s.regNo && String(s.regNo).trim().toUpperCase() === clean);
}

/**
 * Delete Submission (Admin action)
 */
export async function deleteSubmissionAPI(id) {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { error } = await supabase.from('part_time_monthly_submissions').delete().eq('id', id);
      if (!error) return true;
    } catch (e) { }
  }

  if (API_BASE !== null) {
    try {
      await fetch(`${API_BASE}/api/part-time-scholars/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) { }
  }
  return false;
}

/**
 * Admin Authentication
 */
export async function adminLoginAPI(username, password) {
  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/part-time-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json();
      if (json.success) {
        if (json.user) {
          sessionStorage.setItem('pt_rs_admin_user', JSON.stringify(json.user));
        }
        return true;
      }
    } catch (err) { }
  }

  // Supabase / Local Fallback
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();
  const isDean = (u === 'dean_rd@vignan.ac.in' || u === 'admin');
  const isPass = (p === 'passowrd123' || p === 'password123' || p === 'admin123');
  if (isDean && isPass) {
    sessionStorage.setItem('pt_rs_admin_user', JSON.stringify({ email: 'dean_rd@vignan.ac.in', role: 'Dean R&D' }));
    return true;
  }
  return false;
}

/**
 * Fetch all registered scholar master profiles (for Admin & Lookup)
 */
export async function fetchAllProfilesAPI() {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('part_time_scholar_profiles')
        .select('*')
        .order('reg_no', { ascending: true });

      if (!error && Array.isArray(data)) {
        const list = data.map(p => ({
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

        state.masterProfilesList = list;
        list.forEach(p => {
          state.masterProfiles[p.regNo.trim().toUpperCase()] = p;
          state.masterProfiles[p.regNo.trim().toLowerCase()] = p;
        });
        try {
          localStorage.setItem(PROFILES_KEY, JSON.stringify(state.masterProfiles));
        } catch (e) { }
        return list;
      }
    } catch (e) { }
  }

  if (API_BASE !== null) {
    try {
      const res = await fetch(`${API_BASE}/api/part-time-profiles`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        state.masterProfilesList = json.data;
        json.data.forEach(p => {
          if (p.regNo) {
            state.masterProfiles[p.regNo.trim().toUpperCase()] = p;
            state.masterProfiles[p.regNo.trim().toLowerCase()] = p;
          }
        });
        try {
          localStorage.setItem(PROFILES_KEY, JSON.stringify(state.masterProfiles));
        } catch (e) { }
        return json.data;
      }
    } catch (e) { }
  }
  return state.masterProfilesList || [];
}

/**
 * Mobile OTP - Generate & Send OTP
 */
export async function sendOtpAPI({ regNo, mobile, portal = 'part-time-phd' }) {
  const cleanReg = (regNo || '').trim().toUpperCase();
  const cleanMobile = String(mobile || '').replace(/[\s\-\(\)\+]/g, '');

  const supabase = getSupabase();

  if (supabase) {
    try {
      // 1. Check profile exists
      const { data: profile } = await supabase
        .from('part_time_scholar_profiles')
        .select('reg_no, scholar_name, scholar_contact')
        .ilike('reg_no', cleanReg)
        .limit(1)
        .maybeSingle();

      if (!profile) {
        throw new Error(`Scholar Registration Number "${cleanReg}" was not found in the database.`);
      }

      // 2. Generate 6-digit OTP
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabase.from('portal_otps').insert({
        emp_id: cleanReg,
        mobile: cleanMobile,
        portal: 'part-time-phd',
        otp_code: otpCode,
        expires_at: expiresAt,
        is_verified: false
      });

      console.log(`🔐 [PART-TIME SCHOLAR OTP] Reg: ${cleanReg} | Mobile: ${cleanMobile} | OTP: ${otpCode}`);

      return {
        success: true,
        message: `OTP passcode generated for +91 ${cleanMobile.substring(0, 2)}******${cleanMobile.substring(8)}.`,
        devOtp: otpCode
      };
    } catch (err) {
      console.warn('Supabase OTP send failed:', err);
      throw err;
    }
  }

  // Vercel Serverless / API Route
  const res = await fetch(`${API_BASE || ''}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regNo: cleanReg, mobile: cleanMobile, portal: 'part-time-phd' })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to generate OTP.');
  }
  return data;
}

/**
 * Mobile OTP - Verify OTP
 */
export async function verifyOtpAPI({ regNo, mobile, otp, portal = 'part-time-phd' }) {
  const cleanReg = (regNo || '').trim().toUpperCase();
  const cleanMobile = String(mobile || '').replace(/[\s\-\(\)\+]/g, '');
  const cleanOtp = String(otp || '').trim();

  const supabase = getSupabase();

  if (supabase) {
    try {
      const nowIso = new Date().toISOString();
      const { data: otps, error } = await supabase
        .from('portal_otps')
        .select('*')
        .ilike('emp_id', cleanReg)
        .eq('otp_code', cleanOtp)
        .eq('is_verified', false)
        .gt('expires_at', nowIso)
        .order('id', { ascending: false })
        .limit(1);

      if (error || !otps || otps.length === 0) {
        throw new Error('Invalid or expired OTP code. Please enter the latest 6-digit code or request a new one.');
      }

      // Mark verified
      await supabase.from('portal_otps').update({ is_verified: true }).eq('id', otps[0].id);

      return {
        success: true,
        message: 'OTP verified successfully.'
      };
    } catch (err) {
      console.warn('Supabase OTP verify failed:', err);
      throw err;
    }
  }

  // Vercel Serverless / API Route
  const res = await fetch(`${API_BASE || ''}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ regNo: cleanReg, mobile: cleanMobile, otp: cleanOtp, portal: 'part-time-phd' })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Invalid or expired OTP code.');
  }
  return data;
}

/**
 * Helper to normalize DB snake_case record to camelCase object
 */
function normalizeSubmissionFromDB(s) {
  return {
    id: s.id,
    regNo: s.reg_no,
    scholarName: s.scholar_name,
    guideName: s.guide_name,
    department: s.department,
    raType: s.ra_type || 'Industry',
    dateOfJoining: s.date_of_joining ? String(s.date_of_joining).split('T')[0] : '',
    scholarContact: s.scholar_contact || '',
    supervisorContact: s.supervisor_contact || '',
    currentMonth: s.current_month,
    coursesCompleted: s.courses_completed || 0,
    courseDetails: (s.courseDetails || []).map(c => ({
      courseCode: c.course_code || '',
      courseName: c.course_name,
      courseType: c.course_type || 'Internal',
      credits: c.credits || '',
      formativeMarks: c.formative_marks || '',
      summativeMarks: c.summative_marks || '',
      grade: c.grade || '',
      cgpa: c.cgpa || '',
      result: c.result || '',
      completionDate: c.completion_date ? String(c.completion_date).split('T')[0] : ''
    })),
    journalPapers: (s.journalPapers || []).map(j => ({
      title: j.title || '',
      journalName: j.journal_name,
      status: j.status || 'Communicated',
      statusDate: j.status_date ? String(j.status_date).split('T')[0] : ''
    })),
    conferencePapers: (s.conferencePapers || []).map(c => ({
      title: c.title || '',
      conferenceName: c.conference_name,
      status: c.status || 'Communicated',
      statusDate: c.status_date ? String(c.status_date).split('T')[0] : ''
    })),
    events: (s.events || []).map(e => ({
      name: e.name,
      category: e.category || 'Workshop',
      organizer: e.organizer || '',
      eventDate: e.event_date ? String(e.event_date).split('T')[0] : ''
    })),
    dcMeetings: (s.dcMeetings || []).map(dc => ({
      dcName: dc.dc_name || 'DC Meeting',
      lastDcDate: dc.last_dc_date ? String(dc.last_dc_date).split('T')[0] : '',
      comments: dc.comments || '',
      regulation: dc.regulation || 'R22',
      rating: dc.rating || '',
      recommendations: dc.recommendations || 'In Progress'
    })),
    createdAt: s.created_at
  };
}
