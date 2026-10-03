// Vercel Serverless Function: Monthly Submissions Management
const { supabase, isConfigured } = require('../_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==========================================
  // GET: Fetch All Monthly Submissions
  // ==========================================
  if (req.method === 'GET') {
    if (isConfigured()) {
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

        if (error) throw error;

        const normalized = (data || []).map(normalizeSubmission);
        return res.json({ success: true, data: normalized, source: 'supabase' });
      } catch (err) {
        console.error('Supabase fetch submissions error:', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.json({ success: true, data: [], source: 'demo' });
  }

  // ==========================================
  // POST / PUT: Save Monthly Progress Report
  // ==========================================
  if (req.method === 'POST' || req.method === 'PUT') {
    const payload = req.body || {};
    const cleanReg = String(payload.regNo || '').trim().toUpperCase();
    const currentMonth = payload.currentMonth;

    if (!cleanReg || !currentMonth) {
      return res.status(400).json({
        success: false,
        message: 'Registration Number and Current Month are required.'
      });
    }

    if (isConfigured()) {
      try {
        // 1. Prevent duplicate submission for same month
        const { data: existingList } = await supabase
          .from('part_time_monthly_submissions')
          .select('id, current_month, created_at')
          .ilike('reg_no', cleanReg)
          .eq('current_month', currentMonth);

        if (existingList && existingList.length > 0) {
          const existing = existingList[0];
          if (!payload.id || payload.id !== existing.id) {
            return res.status(409).json({
              success: false,
              error: 'DUPLICATE_SUBMISSION',
              message: `A monthly progress report for ${currentMonth} has already been submitted by scholar ${cleanReg}. Duplicate submissions are not allowed.`,
              existingId: existing.id,
              createdAt: existing.created_at
            });
          }
        }

        const submissionId = payload.id || `pt_sub_${cleanReg}_${currentMonth.replace('-', '_')}_${Date.now()}`;
        payload.id = submissionId;

        // 2. Upsert Scholar Permanent Profile
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

        // 3. Upsert Main Monthly Submission
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

        // 4. Reset child relations if updating
        await supabase.from('part_time_courses_completed_details').delete().eq('submission_id', submissionId);
        await supabase.from('part_time_journal_papers').delete().eq('submission_id', submissionId);
        await supabase.from('part_time_conference_papers').delete().eq('submission_id', submissionId);
        await supabase.from('part_time_fdps_attended').delete().eq('submission_id', submissionId);
        await supabase.from('part_time_dc_meetings_attended').delete().eq('submission_id', submissionId);

        // 5. Insert Courses
        if (Array.isArray(payload.courseDetails) && payload.courseDetails.length > 0) {
          const courses = payload.courseDetails.filter(c => c.courseName).map(cd => ({
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
          if (courses.length > 0) await supabase.from('part_time_courses_completed_details').insert(courses);
        }

        // 6. Insert Journals
        if (Array.isArray(payload.journalPapers) && payload.journalPapers.length > 0) {
          const journals = payload.journalPapers.filter(j => j.journalName).map(j => ({
            submission_id: submissionId,
            title: j.title || '',
            journal_name: j.journalName,
            status: j.status || 'Communicated',
            status_date: j.statusDate || null
          }));
          if (journals.length > 0) await supabase.from('part_time_journal_papers').insert(journals);
        }

        // 7. Insert Conferences
        if (Array.isArray(payload.conferencePapers) && payload.conferencePapers.length > 0) {
          const confs = payload.conferencePapers.filter(c => c.conferenceName).map(c => ({
            submission_id: submissionId,
            title: c.title || '',
            conference_name: c.conferenceName,
            status: c.status || 'Communicated',
            status_date: c.statusDate || null
          }));
          if (confs.length > 0) await supabase.from('part_time_conference_papers').insert(confs);
        }

        // 8. Insert Events / FDPs
        const eventsList = payload.events || payload.fdps || [];
        if (Array.isArray(eventsList) && eventsList.length > 0) {
          const events = eventsList.filter(e => e.name).map(e => ({
            submission_id: submissionId,
            name: e.name,
            category: e.category || 'Workshop',
            organizer: e.organizer || '',
            event_date: e.eventDate || null
          }));
          if (events.length > 0) await supabase.from('part_time_fdps_attended').insert(events);
        }

        // 9. Insert DC Meetings
        const dcList = payload.dcMeetings || payload.dcAttended || [];
        if (Array.isArray(dcList) && dcList.length > 0) {
          const dcs = dcList.filter(dc => dc.dcName || dc.lastDcDate || dc.comments).map(dc => ({
            submission_id: submissionId,
            scholar_id: cleanReg,
            dc_name: dc.dcName || 'DC Meeting',
            last_dc_date: dc.lastDcDate || null,
            comments: dc.comments || '',
            regulation: dc.regulation || 'R22',
            rating: dc.rating || '',
            recommendations: dc.recommendations || 'In Progress'
          }));
          if (dcs.length > 0) await supabase.from('part_time_dc_meetings_attended').insert(dcs);
        }

        return res.json({ success: true, data: payload, source: 'supabase' });
      } catch (err) {
        console.error('Supabase save submission error:', err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    return res.json({ success: true, data: payload, source: 'demo' });
  }

  // ==========================================
  // DELETE: Delete Submission by ID
  // ==========================================
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (isConfigured() && id) {
      await supabase.from('part_time_monthly_submissions').delete().eq('id', id);
    }
    return res.json({ success: true, message: 'Record deleted successfully' });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
};

function normalizeSubmission(s) {
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
