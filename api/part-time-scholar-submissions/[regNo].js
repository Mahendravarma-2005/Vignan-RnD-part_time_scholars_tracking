// Vercel Serverless Function: Scholar Monthly Submissions History
const { supabase, isConfigured } = require('../../_supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { regNo } = req.query;
  const cleanReg = (regNo || '').trim().toUpperCase();

  if (!cleanReg) {
    return res.status(400).json({ success: false, message: 'Registration number is required' });
  }

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
        .ilike('reg_no', cleanReg)
        .order('current_month', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map(s => ({
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
      }));

      return res.json({ success: true, data: normalized, count: normalized.length, source: 'supabase' });
    } catch (err) {
      console.error('Supabase scholar history error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  return res.json({ success: true, data: [], count: 0, source: 'demo' });
};
