// Research Scholar Tracking System - Printable Report View
import { DOM, state } from './config.js';
import {
  escapeHtml,
  formatDate,
  formatMonth,
  getStatusBadgeClass,
  calculateRemainingTenure
} from './utils.js';

let currentActiveReport = null;

export function closeReportModal() {
  if (DOM.viewReportModal) {
    DOM.viewReportModal.classList.remove('active');
  }
}

/**
 * Generate formatted filename for saving PDF
 * Example: "Koteswara Rao Ch_september 2026_work_report"
 */
export function getReportFileName(scholarName, currentMonth) {
  let monthStr = 'monthly';
  if (currentMonth) {
    const raw = String(currentMonth).trim();
    const parts = raw.split('-');
    if (parts.length === 2 && !isNaN(parseInt(parts[0], 10)) && !isNaN(parseInt(parts[1], 10))) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const standardMonthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        monthStr = `${standardMonthNames[monthIndex]} ${year}`;
      } else {
        monthStr = raw.toLowerCase();
      }
    } else {
      monthStr = raw.toLowerCase();
    }
  }

  const cleanScholar = (scholarName || 'Scholar')
    .replace(/[<>:"/\\|?*.]/g, '')
    .trim();
  const cleanMonth = monthStr
    .replace(/[<>:"/\\|?*.]/g, '')
    .trim();

  return `${cleanScholar}_${cleanMonth}_work_report`;
}

/**
 * Handle printing and saving as PDF with dynamic custom filename
 */
export function printCurrentReport() {
  const origTitle = document.title;
  if (currentActiveReport) {
    const pdfFileName = getReportFileName(
      currentActiveReport.scholarName,
      currentActiveReport.currentMonth
    );
    document.title = pdfFileName;
  }

  window.print();

  const restore = () => {
    document.title = origTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  setTimeout(restore, 2500);
}

export function viewReport(id) {
  const record = state.scholars.find(s => s.id === id);
  if (!record || !DOM.reportModalContent) return;

  currentActiveReport = record;

  const monthFormatted = formatMonth(record.currentMonth);
  const totalJournals = record.journalPapers?.length || 0;
  const totalConfs = record.conferencePapers?.length || 0;
  const events = record.events || record.fdps || [];
  const totalEvents = events.length;
  const courseList = record.courseDetails || [];
  const dcList = record.dcMeetings || [];
  const totalDcs = dcList.length;
  const raType = record.raType || 'ERA';
  const remainingTenure = calculateRemainingTenure(record.endOfRA);

  // 2. Courses Table / List
  let coursesHtml = '<p class="report-val" style="text-align: left; color: var(--text-muted); font-size: 0.78rem; padding: 0.15rem 0;">None completed for this month</p>';
  if (courseList.length > 0) {
    coursesHtml = `
      <div style="overflow-x: auto; margin-top: 0.25rem;">
        <table class="report-courses-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid var(--border-color); text-align: left;">
              <th style="padding: 0.35rem 0.5rem; font-weight: 700; width: 25px;">#</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Course Name / Title</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Type</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Credits</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Marks (F/S)</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Score</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Result</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Completed</th>
            </tr>
          </thead>
          <tbody>
            ${courseList.map((c, idx) => {
              let cgpaVal = c.cgpa || '';
              let resultText = c.result || '';
              if (!cgpaVal && c.grade) {
                const m = String(c.grade).match(/^([\d.]+)/);
                if (m) cgpaVal = m[1];
                else if (!isNaN(parseFloat(c.grade))) cgpaVal = String(parseFloat(c.grade));
              }
              if (cgpaVal && !resultText) {
                const num = parseFloat(cgpaVal);
                resultText = (!isNaN(num) && num >= 5.5) ? 'Pass' : 'Fail';
              }
              if (!resultText && c.grade) {
                resultText = c.grade;
              }
              const isPass = resultText === 'Pass' || resultText.includes('Pass');
              const isFail = resultText === 'Fail';
              const badgeClass = isPass ? 'badge-green' : (isFail ? 'badge-rose' : 'badge-blue');

              return `
                <tr style="border-bottom: 1px solid var(--border-color); vertical-align: middle;">
                  <td style="padding: 0.3rem 0.5rem; font-weight: 600;">${idx + 1}</td>
                  <td style="padding: 0.3rem 0.5rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(c.courseName || 'Course')}</td>
                  <td style="padding: 0.3rem 0.5rem;"><span class="badge ${c.courseType === 'NPTEL' ? 'badge-purple' : 'badge-blue'}" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(c.courseType || 'Internal')}</span></td>
                  <td style="padding: 0.3rem 0.5rem; font-weight: 600;">${escapeHtml(c.credits || '—')}</td>
                  <td style="padding: 0.3rem 0.5rem; color: var(--text-secondary);">${(c.formativeMarks || c.summativeMarks) ? `${escapeHtml(c.formativeMarks || '0')}/${escapeHtml(c.summativeMarks || '0')}` : '—'}</td>
                  <td style="padding: 0.3rem 0.5rem; font-weight: 700;">${escapeHtml(cgpaVal || c.grade || '—')}</td>
                  <td style="padding: 0.3rem 0.5rem;"><span class="badge ${badgeClass}" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(resultText || 'Completed')}</span></td>
                  <td style="padding: 0.3rem 0.5rem; white-space: nowrap;">${c.completionDate ? formatDate(c.completionDate) : '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. Journal Papers
  let journalsHtml = '<p class="report-val" style="text-align: left; color: var(--text-muted); font-size: 0.78rem; padding: 0.15rem 0;">None reported for this month</p>';
  if (totalJournals > 0) {
    journalsHtml = `
      <div style="overflow-x: auto; margin-top: 0.25rem;">
        <table class="report-publications-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid var(--border-color); text-align: left;">
              <th style="padding: 0.35rem 0.5rem; font-weight: 700; width: 25px;">#</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Paper Title</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Journal Name</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Publication Status</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Date of Status</th>
            </tr>
          </thead>
          <tbody>
            ${record.journalPapers.map((j, idx) => `
              <tr style="border-bottom: 1px solid var(--border-color); vertical-align: top;">
                <td style="padding: 0.3rem 0.5rem; font-weight: 600;">${idx + 1}</td>
                <td style="padding: 0.3rem 0.5rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(j.title || 'Untitled Paper')}</td>
                <td style="padding: 0.3rem 0.5rem;">${escapeHtml(j.journalName)}</td>
                <td style="padding: 0.3rem 0.5rem;"><span class="badge ${getStatusBadgeClass(j.status)}" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(j.status)}</span></td>
                <td style="padding: 0.3rem 0.5rem; white-space: nowrap;">${j.statusDate ? formatDate(j.statusDate) : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 4. Conference Papers
  let confHtml = '<p class="report-val" style="text-align: left; color: var(--text-muted); font-size: 0.78rem; padding: 0.15rem 0;">None reported for this month</p>';
  if (totalConfs > 0) {
    confHtml = `
      <div style="overflow-x: auto; margin-top: 0.25rem;">
        <table class="report-publications-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid var(--border-color); text-align: left;">
              <th style="padding: 0.35rem 0.5rem; font-weight: 700; width: 25px;">#</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Conference Paper Title</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Conference Name</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Status</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Date of Status</th>
            </tr>
          </thead>
          <tbody>
            ${record.conferencePapers.map((c, idx) => `
              <tr style="border-bottom: 1px solid var(--border-color); vertical-align: top;">
                <td style="padding: 0.3rem 0.5rem; font-weight: 600;">${idx + 1}</td>
                <td style="padding: 0.3rem 0.5rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(c.title || 'Untitled Paper')}</td>
                <td style="padding: 0.3rem 0.5rem;">${escapeHtml(c.conferenceName)}</td>
                <td style="padding: 0.3rem 0.5rem;"><span class="badge ${getStatusBadgeClass(c.status)}" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(c.status)}</span></td>
                <td style="padding: 0.3rem 0.5rem; white-space: nowrap;">${c.statusDate ? formatDate(c.statusDate) : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 5. Events / Conferences / Workshops / Synopsis / ODEC
  let eventsHtml = '<p class="report-val" style="text-align: left; color: var(--text-muted); font-size: 0.78rem; padding: 0.15rem 0;">None attended this month</p>';
  if (totalEvents > 0) {
    eventsHtml = `
      <div style="overflow-x: auto; margin-top: 0.25rem;">
        <table class="report-publications-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid var(--border-color); text-align: left;">
              <th style="padding: 0.35rem 0.5rem; font-weight: 700; width: 25px;">#</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Event Title / Activity</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Category</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Institution & Duration</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Date / Period</th>
            </tr>
          </thead>
          <tbody>
            ${events.map((ev, idx) => `
              <tr style="border-bottom: 1px solid var(--border-color); vertical-align: top;">
                <td style="padding: 0.3rem 0.5rem; font-weight: 600;">${idx + 1}</td>
                <td style="padding: 0.3rem 0.5rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(ev.name)}</td>
                <td style="padding: 0.3rem 0.5rem;"><span class="badge ${['ODEC', 'Synopsis', 'PreSynopsis'].includes(ev.category) ? 'badge-purple' : (ev.category === 'Conference' ? 'badge-blue' : 'badge-amber')}" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(ev.category || 'Workshop')}</span></td>
                <td style="padding: 0.3rem 0.5rem; color: var(--text-secondary);">${escapeHtml(ev.organizer || '—')}</td>
                <td style="padding: 0.3rem 0.5rem; white-space: nowrap;">${ev.eventDate ? formatDate(ev.eventDate) : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // 6. Doctoral Committee (DC) Meetings Attended
  let dcHtml = '<p class="report-val" style="text-align: left; color: var(--text-muted); font-size: 0.78rem; padding: 0.15rem 0;">None attended this month</p>';
  if (totalDcs > 0) {
    dcHtml = `
      <div style="overflow-x: auto; margin-top: 0.25rem;">
        <table class="report-dc-table" style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid var(--border-color); text-align: left;">
              <th style="padding: 0.35rem 0.5rem; font-weight: 700; width: 25px;">#</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">DC Meeting</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">DC Attended Date</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Regulation</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Rating / CRP</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Recommendations</th>
              <th style="padding: 0.35rem 0.5rem; font-weight: 700;">Comments Received</th>
            </tr>
          </thead>
          <tbody>
            ${dcList.map((dc, idx) => {
              const reg = dc.regulation || 'R22';
              const ratingDisplay = reg === 'R18'
                ? (dc.rating ? `Rating: ${escapeHtml(dc.rating)}` : 'N/A')
                : (dc.rating !== undefined && dc.rating !== null && String(dc.rating).trim() !== '' ? `CRP: ${escapeHtml(dc.rating)} / 12` : 'N/A');
              const ratingBadgeClass = reg === 'R18'
                ? (dc.rating === 'Good' ? 'badge-green' : (dc.rating === 'Unsatisfactory' ? 'badge-rose' : 'badge-blue'))
                : (parseInt(dc.rating, 10) >= 9 ? 'badge-green' : (parseInt(dc.rating, 10) >= 6 ? 'badge-blue' : 'badge-amber'));

              return `
                <tr style="border-bottom: 1px solid var(--border-color); vertical-align: top;">
                  <td style="padding: 0.3rem 0.5rem; font-weight: 600;">${idx + 1}</td>
                  <td style="padding: 0.3rem 0.5rem; font-weight: 600; color: var(--primary);">${escapeHtml(dc.dcName ? (String(dc.dcName).toLowerCase().includes('dc') ? dc.dcName : `DC Meeting ${dc.dcName}`) : `DC Meeting #${idx + 1}`)}</td>
                  <td style="padding: 0.3rem 0.5rem; white-space: nowrap;">${dc.lastDcDate ? formatDate(dc.lastDcDate) : 'N/A'}</td>
                  <td style="padding: 0.3rem 0.5rem;"><span class="badge badge-blue" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(reg)}</span></td>
                  <td style="padding: 0.3rem 0.5rem;"><span class="badge ${ratingBadgeClass}" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${ratingDisplay}</span></td>
                  <td style="padding: 0.3rem 0.5rem;"><span class="badge badge-amber" style="font-size: 0.7rem; padding: 0.1rem 0.3rem;">${escapeHtml(dc.recommendations || 'Pre-synopsis')}</span></td>
                  <td style="padding: 0.3rem 0.5rem; color: var(--text-primary); line-height: 1.3;">${escapeHtml(dc.comments || '—')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  DOM.reportModalContent.innerHTML = `
    <!-- Institutional University Header with ERA and Report Month in Same Line -->
    <div class="report-header" style="margin-bottom: 0.25rem; border-bottom: 1.5px solid #0f172a; padding-bottom: 0.2rem;">
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <img src="vignan-logo.png" alt="Vignan's University" class="report-vignan-logo" style="max-height: 38px; width: auto;">
        <div>
          <h2 style="font-size: 0.92rem; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1.2;">Vignan's Foundation for Science, Technology & Research</h2>
          <p style="font-size: 0.72rem; color: #475569; margin: 0.04rem 0 0 0; font-weight: 600; line-height: 1.2;">(Deemed to be University) &bull; Office of the Dean, Research & Development (R&D)</p>
          <p style="font-size: 0.74rem; color: var(--primary); margin: 0.04rem 0 0 0; font-weight: 700; text-transform: uppercase; line-height: 1.2;">Part-Time Scholar Monthly Progress Report</p>
        </div>
      </div>
      <!-- Part-Time on Left, Report Month on Right in the EXACT SAME LINE -->
      <div class="report-header-badges" style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 0.2rem;">
        <div>
          <span class="badge badge-blue" style="font-size: 0.74rem; padding: 0.12rem 0.5rem; font-weight: 700;">
            Part-Time Research Scholar (${raType === 'Academic' ? 'Academic' : 'Industry'})
          </span>
        </div>
        <div>
          <span class="badge badge-blue" style="font-size: 0.74rem; padding: 0.12rem 0.5rem; font-weight: 700;">
            Report Month: ${monthFormatted}
          </span>
        </div>
      </div>
    </div>

    <!-- Scholar Key Header Information -->
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0.2rem 0.5rem; margin-bottom: 0.25rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
      <div>
        <span style="font-size: 0.9rem; font-weight: 800; color: #0f172a;">${escapeHtml(record.scholarName)}</span>
        <span style="font-size: 0.74rem; color: #475569; margin-left: 0.5rem;">
          Reg. No: <strong style="color: #0f172a; font-family: monospace;">${escapeHtml(record.regNo)}</strong> &bull; 
          Dept: <strong>${escapeHtml(record.department)}</strong>
        </span>
      </div>
      <div style="font-size: 0.74rem; color: #475569; white-space: nowrap;">
        Guide: <strong style="color: #0f172a;">${escapeHtml(record.guideName)}</strong> &bull;
        Employement: <strong>${raType === 'Academic' ? 'Academic' : 'Industry'}</strong>
      </div>
    </div>

    <!-- SECTION 1: Scholar Permanent Profile -->
    <div class="report-section-box" style="margin-bottom: 0.25rem; padding: 0.25rem 0.5rem;">
      <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.15rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.1rem;">
        Scholar Permanent Profile
      </h4>
      <div class="report-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
        <div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Scholar Name:</span>
            <span class="report-val" style="font-weight: 700;">${escapeHtml(record.scholarName)}</span>
          </div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Research Guide / Supervisor:</span>
            <span class="report-val">${escapeHtml(record.guideName)}</span>
          </div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Department:</span>
            <span class="report-val">${escapeHtml(record.department)}</span>
          </div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Employement:</span>
            <span class="report-val"><span class="badge ${raType === 'Academic' ? 'badge-purple' : 'badge-blue'}" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">${raType === 'Academic' ? 'Academic' : 'Industry'}</span></span>
          </div>
        </div>
        <div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Date of Joining:</span>
            <span class="report-val">${formatDate(record.dateOfJoining)}</span>
          </div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Contact No of Scholar:</span>
            <span class="report-val">${escapeHtml(record.scholarContact)}</span>
          </div>
          <div class="report-key-value" style="padding: 0.08rem 0; font-size: 0.74rem;">
            <span class="report-key">Contact No of Supervisor:</span>
            <span class="report-val">${escapeHtml(record.supervisorContact)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: Monthly Progress -->
    <div class="report-section-box" style="margin-bottom: 0.25rem; padding: 0.25rem 0.5rem;">
      <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.15rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.1rem; display: flex; justify-content: space-between; align-items: center;">
        <span>2. Monthly Progress</span>
        <span style="font-size: 0.72rem; color: #475569; font-weight: 600;">Report Month: <strong>${monthFormatted}</strong> &bull; Courses Completed: <strong>${record.coursesCompleted || courseList.length}</strong></span>
      </h4>

      <!-- Completed Courses Breakdown Inside Section 2 -->
      <div style="margin-top: 0.1rem;">
        <div style="font-size: 0.74rem; font-weight: 700; color: #334155; margin-bottom: 0.05rem;">
          Completed Courses Breakdown (${courseList.length || record.coursesCompleted || 0}):
        </div>
        ${coursesHtml}
      </div>
    </div>

    <!-- SECTION 3: Journal Papers Progress -->
    <div class="report-section-box" style="margin-bottom: 0.25rem; padding: 0.25rem 0.5rem;">
      <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.15rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.1rem;">
        3. Journal Papers Progress (${totalJournals})
      </h4>
      ${journalsHtml}
    </div>

    <!-- SECTION 4: Conference Papers Progress -->
    <div class="report-section-box" style="margin-bottom: 0.25rem; padding: 0.25rem 0.5rem;">
      <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.15rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.1rem;">
        4. Conference Papers Progress (${totalConfs})
      </h4>
      ${confHtml}
    </div>

    <!-- SECTION 5: Conferences / Workshops / Guest Lectures / Synopsis / Pre-Synopsis / ODEC Attended -->
    <div class="report-section-box" style="margin-bottom: 0.25rem; padding: 0.25rem 0.5rem;">
      <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.15rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.1rem;">
        5. Conferences / Workshops / Guest Lectures / Synopsis / Pre-Synopsis / ODEC Attended (${totalEvents})
      </h4>
      ${eventsHtml}
    </div>

    <!-- SECTION 6: Doctoral Committee (DC) Meetings Attended -->
    <div class="report-section-box" style="margin-bottom: 0.25rem; padding: 0.25rem 0.5rem;">
      <h4 style="font-size: 0.78rem; font-weight: 700; color: var(--primary); margin-bottom: 0.15rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.1rem;">
        6. Doctoral Committee (DC) Meetings Attended (${totalDcs})
      </h4>
      ${dcHtml}
    </div>

    <!-- Official University Signatures & Approval Footer -->
    <div class="report-signatures-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-top: 1.75rem; padding-top: 0.4rem; border-top: 1.5px solid #94a3b8; text-align: center;">
      <div>
        <div class="report-signature-space" style="height: 38px;"></div>
        <div style="border-top: 1px dashed #475569; padding-top: 0.25rem; font-size: 0.74rem; font-weight: 700; color: #0f172a;">Scholar's Signature</div>
      </div>
      <div>
        <div class="report-signature-space" style="height: 38px;"></div>
        <div style="border-top: 1px dashed #475569; padding-top: 0.25rem; font-size: 0.74rem; font-weight: 700; color: #0f172a;">Research Supervisor / Guide</div>
      </div>
      <div>
        <div class="report-signature-space" style="height: 38px;"></div>
        <div style="border-top: 1px dashed #475569; padding-top: 0.25rem; font-size: 0.74rem; font-weight: 700; color: #0f172a;">Head of Department (HOD)</div>
      </div>
      <div>
        <div class="report-signature-space" style="height: 38px;"></div>
        <div style="border-top: 1px dashed #475569; padding-top: 0.25rem; font-size: 0.74rem; font-weight: 700; color: #0f172a;">Dean, Research & Development</div>
      </div>
    </div>
  `;

  DOM.viewReportModal.classList.add('active');
}
