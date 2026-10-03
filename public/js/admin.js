// Research Scholar Tracking System - Admin Portal & Dashboard
import { DOM, STORAGE_KEY, state } from './config.js';
import {
  escapeHtml,
  formatDate,
  formatMonth,
  calculateRemainingTenure,
  updateRemainingTenureDisplay,
  cleanCSV,
  showToast,
  getCurrentYearMonth,
  evaluateCourseResult
} from './utils.js';
import { saveScholarSubmission, deleteSubmissionAPI } from './api.js';
import { updateDynamicCards } from './dynamicCards.js';
import { viewReport } from './report.js';

export function openModalForNew() {
  DOM.modalTitle.textContent = 'New Scholar Tracking Entry';
  DOM.scholarForm.reset();
  DOM.recordIdInput.value = '';

  DOM.currentMonthInput.value = getCurrentYearMonth();
  DOM.raTypeInput.value = 'ERA';
  DOM.bankNameInput.value = '';
  DOM.bankAccountNoInput.value = '';
  DOM.ifscCodeInput.value = '';

  DOM.coursesCompletedInput.value = '0';
  updateDynamicCards(DOM.courseItemsContainer, 0, 'course');
  updateRemainingTenureDisplay(DOM.adminRemainingTenureText, '');

  DOM.journalCountInput.value = '0';
  DOM.conferenceCountInput.value = '0';
  DOM.fdpCountInput.value = '0';
  if (DOM.dcCountInput) DOM.dcCountInput.value = '0';

  updateDynamicCards(DOM.journalItemsContainer, 0, 'journal');
  updateDynamicCards(DOM.conferenceItemsContainer, 0, 'conf');
  updateDynamicCards(DOM.fdpItemsContainer, 0, 'event');
  if (DOM.dcItemsContainer) updateDynamicCards(DOM.dcItemsContainer, 0, 'dc');

  DOM.scholarModal.classList.add('active');
  DOM.regNoInput.focus();
}

export function openModalForEdit(id) {
  const record = state.scholars.find(s => s.id === id);
  if (!record) return;

  DOM.modalTitle.textContent = `Edit Scholar Record: ${record.scholarName}`;
  DOM.recordIdInput.value = record.id;
  DOM.regNoInput.value = record.regNo;
  DOM.scholarNameInput.value = record.scholarName;
  DOM.guideNameInput.value = record.guideName;
  DOM.departmentInput.value = record.department;
  DOM.raTypeInput.value = record.raType || 'ERA';
  DOM.bankNameInput.value = record.bankName || 'State Bank of India';
  DOM.bankAccountNoInput.value = record.bankAccountNo || '';
  DOM.ifscCodeInput.value = record.ifscCode || 'SBIN0001234';
  DOM.dateOfJoiningInput.value = record.dateOfJoining;
  DOM.endOfRAInput.value = record.endOfRA;
  updateRemainingTenureDisplay(DOM.adminRemainingTenureText, record.endOfRA);
  DOM.scholarContactInput.value = record.scholarContact;
  DOM.supervisorContactInput.value = record.supervisorContact;
  DOM.currentMonthInput.value = record.currentMonth || getCurrentYearMonth();
  DOM.forgetThumbsInput.value = record.forgetThumbs;

  const courses = record.courseDetails || [];
  DOM.coursesCompletedInput.value = record.coursesCompleted || courses.length;
  updateDynamicCards(DOM.courseItemsContainer, DOM.coursesCompletedInput.value, 'course', courses);

  DOM.leavesTakenInput.value = record.leavesTaken;
  DOM.avgSpentStayedInput.value = record.avgSpentStayed;
  DOM.academicLoadInput.value = record.academicLoad;

  const journals = record.journalPapers || [];
  const conferences = record.conferencePapers || [];
  const events = record.events || record.fdps || [];
  const dcs = record.dcMeetings || [];

  DOM.journalCountInput.value = journals.length;
  DOM.conferenceCountInput.value = conferences.length;
  DOM.fdpCountInput.value = events.length;
  if (DOM.dcCountInput) DOM.dcCountInput.value = dcs.length;

  updateDynamicCards(DOM.journalItemsContainer, journals.length, 'journal', journals);
  updateDynamicCards(DOM.conferenceItemsContainer, conferences.length, 'conf', conferences);
  updateDynamicCards(DOM.fdpItemsContainer, events.length, 'event', events);
  if (DOM.dcItemsContainer) updateDynamicCards(DOM.dcItemsContainer, dcs.length, 'dc', dcs);

  DOM.scholarModal.classList.add('active');
}

export function closeModal() {
  DOM.scholarModal.classList.remove('active');
}

export async function handleAdminFormSubmit(e) {
  e.preventDefault();

  const courseDetails = [];
  DOM.courseItemsContainer.querySelectorAll('.dynamic-card').forEach(card => {
    const name = card.querySelector('.course-name-input')?.value.trim();
    if (name) {
      const courseType = card.querySelector('.course-type-input')?.value || 'Internal';
      const cgpa = card.querySelector('.course-cgpa-input')?.value.trim() || '';
      const evalRes = evaluateCourseResult(courseType, cgpa);
      const result = evalRes.text;
      courseDetails.push({
        courseCode: '',
        courseType: courseType,
        courseName: name,
        credits: card.querySelector('.course-credits-input')?.value.trim() || '',
        formativeMarks: card.querySelector('.course-formative-input')?.value.trim() || '',
        summativeMarks: card.querySelector('.course-summative-input')?.value.trim() || '',
        cgpa: cgpa,
        result: result,
        grade: cgpa ? `${cgpa} (${result})` : '',
        completionDate: card.querySelector('.course-date-input')?.value || null
      });
    }
  });

  const journalPapers = [];
  DOM.journalItemsContainer.querySelectorAll('.dynamic-card').forEach(card => {
    const name = card.querySelector('.journal-name-input')?.value.trim();
    if (name) {
      journalPapers.push({
        title: card.querySelector('.journal-title-input')?.value.trim() || 'Untitled Paper',
        journalName: name,
        status: card.querySelector('.journal-status-input')?.value || 'Communicated',
        statusDate: card.querySelector('.journal-date-input')?.value || null
      });
    }
  });

  const conferencePapers = [];
  DOM.conferenceItemsContainer.querySelectorAll('.dynamic-card').forEach(card => {
    const name = card.querySelector('.conf-name-input')?.value.trim();
    if (name) {
      conferencePapers.push({
        title: card.querySelector('.conf-title-input')?.value.trim() || 'Untitled Paper',
        conferenceName: name,
        status: card.querySelector('.conf-status-input')?.value || 'Communicated',
        statusDate: card.querySelector('.conf-date-input')?.value || null
      });
    }
  });

  const events = [];
  DOM.fdpItemsContainer.querySelectorAll('.dynamic-card').forEach(card => {
    const name = card.querySelector('.event-name-input, .fdp-name-input')?.value.trim();
    if (name) {
      events.push({
        name: name,
        category: card.querySelector('.event-category-input')?.value || 'Workshop',
        organizer: card.querySelector('.event-org-input, .fdp-org-input')?.value.trim() || '',
        eventDate: card.querySelector('.event-date-input')?.value || null
      });
    }
  });

  const dcMeetings = [];
  if (DOM.dcItemsContainer) {
    DOM.dcItemsContainer.querySelectorAll('.dynamic-card').forEach(card => {
      const dcName = card.querySelector('.dc-name-input')?.value.trim();
      const lastDcDate = card.querySelector('.dc-date-input')?.value || null;
      const regulation = card.querySelector('.dc-regulation-input')?.value || 'R22';
      const rating = card.querySelector('.dc-rating-input')?.value || '';
      const recommendations = card.querySelector('.dc-recommendations-input')?.value || 'Pre-synopsis';
      const comments = card.querySelector('.dc-comments-input')?.value.trim() || '';

      if (dcName || lastDcDate || comments) {
        dcMeetings.push({
          dcName: dcName || 'DC Meeting',
          lastDcDate,
          regulation,
          rating,
          recommendations,
          comments
        });
      }
    });
  }

  const recordId = DOM.recordIdInput.value.trim();
  const regNo = DOM.regNoInput.value.trim();
  const scholarName = DOM.scholarNameInput.value.trim();
  const guideName = DOM.guideNameInput.value.trim();
  const department = DOM.departmentInput.value.trim();
  const raType = DOM.raTypeInput.value || 'ERA';
  const bankName = DOM.bankNameInput.value.trim();
  const bankAccountNo = DOM.bankAccountNoInput.value.trim();
  const ifscCode = DOM.ifscCodeInput.value.trim().toUpperCase();
  const dateOfJoining = DOM.dateOfJoiningInput.value;
  const endOfRA = DOM.endOfRAInput.value;
  const scholarContact = DOM.scholarContactInput.value.trim();
  const supervisorContact = DOM.supervisorContactInput.value.trim();

  const payload = {
    id: recordId || 'rec_' + Date.now(),
    regNo,
    scholarName,
    guideName,
    department,
    raType,
    bankName,
    bankAccountNo,
    ifscCode,
    dateOfJoining,
    endOfRA,
    scholarContact,
    supervisorContact,
    currentMonth: DOM.currentMonthInput.value || getCurrentYearMonth(),
    forgetThumbs: parseInt(DOM.forgetThumbsInput.value, 10) || 0,
    coursesCompleted: parseInt(DOM.coursesCompletedInput.value, 10) || courseDetails.length,
    courseDetails: courseDetails,
    leavesTaken: parseInt(DOM.leavesTakenInput.value, 10) || 0,
    avgSpentStayed: DOM.avgSpentStayedInput.value.trim(),
    academicLoad: DOM.academicLoadInput.value.trim(),
    journalPapers: journalPapers,
    conferencePapers: conferencePapers,
    events: events,
    fdps: events, // Backward compatibility
    dcMeetings: dcMeetings
  };

  if (recordId) {
    await saveScholarSubmission(payload, true);
    const index = state.scholars.findIndex(s => s.id === recordId);
    if (index !== -1) state.scholars[index] = { ...state.scholars[index], ...payload };
    showToast(`Record for ${payload.scholarName} updated!`);
  } else {
    const saved = await saveScholarSubmission(payload, false);
    if (saved && saved.id) payload.id = saved.id;
    state.scholars.unshift(payload);
    showToast(`New record for ${payload.scholarName} (${payload.raType}) added!`);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scholars));
  closeModal();
  populateMonthFilterOptions();
  render();
}

export async function deleteRecord(id) {
  const record = state.scholars.find(s => s.id === id);
  if (!record) return;

  if (confirm(`Delete tracking record for ${record.scholarName} (${record.regNo})?`)) {
    await deleteSubmissionAPI(id);
    state.scholars = state.scholars.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scholars));
    render();
    showToast('Record deleted.', 'info');
  }
}
export function populateTrackingMonths() {
  if (!DOM.trackingMonthSelect) return;
  const currentYM = getCurrentYearMonth();
  const monthSet = new Set(state.scholars.map(s => s.currentMonth).filter(Boolean));
  monthSet.add(currentYM);

  // Provide trailing 6 months
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const prev = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(ym);
  }

  const months = [...monthSet].sort().reverse();
  const currentVal = state.activeTrackingMonth || DOM.trackingMonthSelect.value || currentYM;

  DOM.trackingMonthSelect.innerHTML = '';
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = `${formatMonth(m)} (${m})`;
    DOM.trackingMonthSelect.appendChild(opt);
  });

  if (months.includes(currentVal)) {
    DOM.trackingMonthSelect.value = currentVal;
    state.activeTrackingMonth = currentVal;
  } else if (months.length > 0) {
    DOM.trackingMonthSelect.value = months[0];
    state.activeTrackingMonth = months[0];
  }
}

export function computeMonthlyTracking(targetMonth) {
  const month = targetMonth || state.activeTrackingMonth || DOM.trackingMonthSelect?.value || getCurrentYearMonth();
  state.activeTrackingMonth = month;

  // Build unified master profiles map
  const masterMap = new Map();
  (state.masterProfilesList || []).forEach(p => {
    if (p && p.regNo) masterMap.set(String(p.regNo).trim().toUpperCase(), { ...p });
  });

  // Supplement with any scholar who has ever submitted
  state.scholars.forEach(s => {
    const r = String(s.regNo || '').trim().toUpperCase();
    if (r && !masterMap.has(r)) {
      masterMap.set(r, {
        regNo: s.regNo,
        scholarName: s.scholarName,
        guideName: s.guideName,
        department: s.department,
        raType: s.raType || 'ERA',
        scholarContact: s.scholarContact || '',
        supervisorContact: s.supervisorContact || '',
        dateOfJoining: s.dateOfJoining || '',
        endOfRA: s.endOfRA || '',
        bankName: s.bankName || 'State Bank of India',
        bankAccountNo: s.bankAccountNo || '',
        ifscCode: s.ifscCode || 'SBIN0001234'
      });
    }
  });

  const totalEnrolled = masterMap.size;
  const submittedForMonth = state.scholars.filter(s => s.currentMonth === month);
  const submittedRegNos = new Set(submittedForMonth.map(s => String(s.regNo || '').trim().toUpperCase()));

  const defaulters = [];
  masterMap.forEach((profile, regUpper) => {
    if (!submittedRegNos.has(regUpper)) {
      // Find prior submissions across all months
      const prior = state.scholars
        .filter(s => String(s.regNo || '').trim().toUpperCase() === regUpper)
        .sort((a, b) => (b.currentMonth || '').localeCompare(a.currentMonth || ''));

      let lastNote = 'Never submitted';
      let hasPrior = false;
      if (prior.length > 0) {
        hasPrior = true;
        const lastM = prior[0].currentMonth;
        lastNote = `Submitted in ${formatMonth(lastM)} (${lastM})`;
      }

      defaulters.push({
        ...profile,
        hasPrior,
        lastSubmittedMonth: prior.length > 0 ? prior[0].currentMonth : null,
        lastSubmissionNote: lastNote
      });
    }
  });

  // Prior submitters who missed this month come first!
  defaulters.sort((a, b) => {
    if (a.hasPrior && !b.hasPrior) return -1;
    if (!a.hasPrior && b.hasPrior) return 1;
    return (a.regNo || '').localeCompare(b.regNo || '');
  });

  state.defaultersList = defaulters;

  // Update UI indicators
  if (DOM.metricTotalEnrolled) DOM.metricTotalEnrolled.textContent = totalEnrolled;
  if (DOM.metricSubmittedCount) DOM.metricSubmittedCount.textContent = submittedForMonth.length;
  if (DOM.badgeSubmittedCount) DOM.badgeSubmittedCount.textContent = submittedForMonth.length;
  if (DOM.metricDefaultersCount) DOM.metricDefaultersCount.textContent = defaulters.length;
  if (DOM.badgeDefaultersCount) DOM.badgeDefaultersCount.textContent = defaulters.length;
  if (DOM.badgeAllProfilesCount) DOM.badgeAllProfilesCount.textContent = totalEnrolled;

  const compPct = totalEnrolled > 0 ? Math.round((submittedForMonth.length / totalEnrolled) * 100) : 0;
  if (DOM.metricSubmittedRate) DOM.metricSubmittedRate.textContent = `${compPct}% Compliance (${submittedForMonth.length}/${totalEnrolled})`;
  if (DOM.metricDefaultersRate) DOM.metricDefaultersRate.textContent = `${defaulters.length} pending for ${formatMonth(month)}`;

  return { totalEnrolled, submitted: submittedForMonth.length, defaulters: defaulters.length };
}

export function render() {
  populateTrackingMonths();
  computeMonthlyTracking();
  renderMetrics();
  renderTable();
}

export function renderMetrics() {
  DOM.statTotalScholars.textContent = state.scholars.length;

  let totalJournals = 0;
  let publishedJournals = 0;
  let commJournals = 0;
  let revisedJournals = 0;

  let totalConfs = 0;
  let publishedConfs = 0;
  let commConfs = 0;
  let revisedConfs = 0;

  let totalForgetThumbs = 0;
  let totalEvents = 0;
  let totalLeaves = 0;
  let countERA = 0;
  let countTRA = 0;
  let countCAP = 0;

  const preSynopsisAttendedScholars = new Set();
  const preThesisColloquiumScholars = new Set();
  const recPreSynopsisScholars = new Set();

  state.scholars.forEach(s => {
    const scholarKey = (s.regNo || s.scholarName || '').toLowerCase().trim();

    if (s.raType === 'CAP') countCAP++;
    else if (s.raType === 'TRA') countTRA++;
    else countERA++;

    totalForgetThumbs += (parseInt(s.forgetThumbs, 10) || 0);
    totalLeaves += (parseInt(s.leavesTaken, 10) || 0);

    const events = s.events || s.fdps || [];
    totalEvents += events.length;

    // Check if scholar has gone for/attended Pre-Synopsis in events
    const hasPreSynopsisEvent = events.some(e => {
      const cat = (e.category || '').toLowerCase();
      const name = (e.name || '').toLowerCase();
      return cat === 'presynopsis' || cat === 'synopsis' || name.includes('pre-synopsis') || name.includes('presynopsis');
    });

    const dcMeetings = s.dcMeetings || [];
    let hasPreSynopsisDC = false;

    dcMeetings.forEach(dc => {
      const rec = (dc.recommendations || '').toLowerCase();
      const dcName = (dc.dcName || '').toLowerCase();

      // In Pre-Thesis Colloquium
      if (rec.includes('pre-thesis') || rec.includes('colloquium') || dcName.includes('colloquium') || dcName.includes('collocum')) {
        if (scholarKey) preThesisColloquiumScholars.add(scholarKey);
      }

      // Recommended for Pre-Synopsis
      if (rec === 'pre-synopsis' || rec.includes('pre-synopsis') || rec.includes('presynopsis')) {
        if (scholarKey) recPreSynopsisScholars.add(scholarKey);
      }

      // If DC stage attended was Pre-Synopsis
      if (dcName.includes('pre-synopsis') || dcName.includes('presynopsis') || (dc.stage && dc.stage.toLowerCase().includes('presynopsis'))) {
        hasPreSynopsisDC = true;
      }
    });

    if (hasPreSynopsisEvent || hasPreSynopsisDC) {
      if (scholarKey) preSynopsisAttendedScholars.add(scholarKey);
    }

    (s.journalPapers || []).forEach(j => {
      totalJournals++;
      if (j.status === 'Published' || j.status === 'Accepted') publishedJournals++;
      if (j.status === 'Communicated') commJournals++;
      if (j.status === 'Revised' || j.status === 'Received') revisedJournals++;
    });

    (s.conferencePapers || []).forEach(c => {
      totalConfs++;
      if (c.status === 'Published' || c.status === 'Accepted') publishedConfs++;
      if (c.status === 'Communicated') commConfs++;
      if (c.status === 'Revised' || c.status === 'Received') revisedConfs++;
    });
  });

  DOM.statRATypeSubtext.textContent = `${countERA} ERA • ${countTRA} TRA • ${countCAP} CAP`;
  DOM.statTotalJournals.textContent = totalJournals;
  DOM.statJournalSubtext.textContent = `${publishedJournals} Published • ${revisedJournals} Revised`;

  DOM.statTotalConferences.textContent = totalConfs;
  DOM.statConfSubtext.textContent = `${publishedConfs} Published • ${revisedConfs} Revised`;

  DOM.statTotalForgetThumbs.textContent = totalForgetThumbs;
  DOM.statTotalFDPs.textContent = totalEvents;

  if (DOM.statTotalLeaves) DOM.statTotalLeaves.textContent = totalLeaves;
  if (DOM.statPreSynopsisAttended) DOM.statPreSynopsisAttended.textContent = preSynopsisAttendedScholars.size;
  if (DOM.statPreThesisColloquium) DOM.statPreThesisColloquium.textContent = preThesisColloquiumScholars.size;
  if (DOM.statRecPreSynopsis) DOM.statRecPreSynopsis.textContent = recPreSynopsisScholars.size;
}

export function renderTable() {
  const viewMode = state.activeTrackingView || 'submitted';
  const searchTerm = (DOM.searchInput.value || '').toLowerCase().trim();
  const selectedRAType = DOM.filterRAType.value;
  const selectedDept = DOM.filterDepartment.value;
  const selectedMonth = DOM.filterMonth.value;

  // Update tab visual states
  if (DOM.tabViewSubmitted && DOM.tabViewDefaulters && DOM.tabViewAllProfiles) {
    DOM.tabViewSubmitted.className = `btn btn-sm ${viewMode === 'submitted' ? 'btn-primary' : 'btn-secondary'}`;
    DOM.tabViewDefaulters.className = `btn btn-sm ${viewMode === 'defaulters' ? 'btn-primary' : 'btn-secondary'}`;
    if (viewMode === 'defaulters') {
      DOM.tabViewDefaulters.style.background = '#dc2626';
      DOM.tabViewDefaulters.style.color = '#ffffff';
      DOM.tabViewDefaulters.style.borderColor = '#dc2626';
    } else {
      DOM.tabViewDefaulters.style.background = '';
      DOM.tabViewDefaulters.style.color = '#b91c1c';
      DOM.tabViewDefaulters.style.borderColor = '';
    }
    DOM.tabViewAllProfiles.className = `btn btn-sm ${viewMode === 'profiles' ? 'btn-primary' : 'btn-secondary'}`;
  }

  if (viewMode === 'defaulters') {
    renderDefaultersView(searchTerm, selectedRAType, selectedDept);
  } else if (viewMode === 'profiles') {
    renderMasterProfilesView(searchTerm, selectedRAType, selectedDept);
  } else {
    renderSubmittedView(searchTerm, selectedRAType, selectedDept, selectedMonth);
  }
}

function renderSubmittedView(searchTerm, selectedRAType, selectedDept, selectedMonth) {
  if (DOM.recordsTableHead) {
    DOM.recordsTableHead.innerHTML = `
      <tr id="thRowSubmitted">
        <th>Scholar Info</th>
        <th>Guide / Dept</th>
        <th>RA Type</th>
        <th>Month</th>
        <th>Bank Details</th>
        <th>Research Assistantship</th>
        <th>Publications</th>
        <th>Forget Thumbs</th>
        <th>Leaves / Stay</th>
        <th style="text-align: right;">Actions</th>
      </tr>
    `;
  }

  const filtered = state.scholars.filter(s => {
    const matchesSearch = !searchTerm || (
      (s.scholarName && s.scholarName.toLowerCase().includes(searchTerm)) ||
      (s.regNo && String(s.regNo).toLowerCase().includes(searchTerm)) ||
      (s.guideName && s.guideName.toLowerCase().includes(searchTerm)) ||
      (s.department && s.department.toLowerCase().includes(searchTerm))
    );

    const matchesRAType = !selectedRAType || s.raType === selectedRAType;
    const matchesDept = !selectedDept || s.department === selectedDept;
    const matchesMonth = !selectedMonth || s.currentMonth === selectedMonth;

    return matchesSearch && matchesRAType && matchesDept && matchesMonth;
  });

  if (filtered.length === 0) {
    DOM.recordsTableBody.innerHTML = '';
    DOM.emptyState.style.display = 'block';
    if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = 'No Scholar Records Found';
    if (DOM.emptyStateMessage) DOM.emptyStateMessage.textContent = 'Records submitted via the Scholar Portal or added manually will appear here.';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.recordsTableBody.innerHTML = filtered.map(s => {
    const journalCount = s.journalPapers?.length || 0;
    const confCount = s.conferencePapers?.length || 0;
    const events = s.events || s.fdps || [];
    const eventCount = events.length;
    const raType = s.raType || 'ERA';
    const remainingTenure = calculateRemainingTenure(s.endOfRA);

    let pubBadges = '';
    if (journalCount > 0) {
      pubBadges += `<span class="badge badge-green" title="${journalCount} Journal">${journalCount} Journal</span> `;
    }
    if (confCount > 0) {
      pubBadges += `<span class="badge badge-purple" title="${confCount} Conf">${confCount} Conf</span> `;
    }
    if (journalCount === 0 && confCount === 0) {
      pubBadges = '<span class="badge badge-amber">None</span>';
    }

    return `
      <tr>
        <td>
          <div class="scholar-meta">
            <span class="scholar-name">${escapeHtml(s.scholarName)}</span>
            <span class="scholar-reg">${escapeHtml(s.regNo)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(s.scholarContact || '')}</span>
          </div>
        </td>
        <td>
          <div>
            <div style="font-weight: 500; color: var(--text-primary);">${escapeHtml(s.guideName)}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(s.department)}</div>
          </div>
        </td>
        <td>
          <span class="badge ${raType === 'CAP' ? 'badge-cap' : (raType === 'TRA' ? 'badge-tra' : 'badge-era')}">
            ${raType}
          </span>
        </td>
        <td>
          <span class="badge badge-blue">${formatMonth(s.currentMonth)}</span>
        </td>
        <td>
          <div style="font-size: 0.8rem;">
            ${s.bankName ? `<div style="font-weight: 600; color: var(--text-primary); font-size: 0.775rem;">${escapeHtml(s.bankName)}</div>` : ''}
            <div style="font-family: monospace; color: var(--text-secondary);">${escapeHtml(s.bankAccountNo)}</div>
            ${s.ifscCode ? `<div style="font-size: 0.725rem; font-family: monospace; color: var(--text-muted);">IFSC: ${escapeHtml(s.ifscCode)}</div>` : ''}
          </div>
        </td>
        <td>
          <div style="font-size: 0.8rem;">
            <div><strong>Join:</strong> ${formatDate(s.dateOfJoining)}</div>
            <div style="color: var(--text-muted);"><strong>End:</strong> ${formatDate(s.endOfRA)}</div>
            <div style="margin-top: 0.25rem;">
              <span class="badge ${remainingTenure.includes('Completed') ? 'badge-rose' : 'badge-green'}" style="font-size: 0.7rem;" title="Remaining service period">
                ${remainingTenure}
              </span>
            </div>
          </div>
        </td>
        <td>
          <div>${pubBadges}</div>
          ${eventCount > 0 ? `<div style="margin-top: 0.25rem;"><span class="badge badge-amber" style="font-size: 0.7rem;">${eventCount} Event(s)</span></div>` : ''}
        </td>
        <td>
          <span class="badge ${s.forgetThumbs > 0 ? 'badge-rose' : 'badge-green'}">
            ${s.forgetThumbs} Missed
          </span>
        </td>
        <td>
          <div style="font-size: 0.8rem;">
            <div><strong>Courses:</strong> <span class="badge badge-blue" style="font-size: 0.725rem;">${s.coursesCompleted || (s.courseDetails ? s.courseDetails.length : 0)} Done</span></div>
            <div style="margin-top: 0.15rem;"><strong>Leaves:</strong> ${s.leavesTaken} d</div>
            <div style="color: var(--text-muted);"><strong>Spent/Month:</strong> ${escapeHtml(s.avgSpentStayed || '-')}</div>
          </div>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm btn-report-action" data-id="${s.id}" title="View Full Report">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Report
            </button>
            <button class="btn btn-secondary btn-sm btn-edit-action" data-id="${s.id}" title="Edit Record">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-outline-danger btn-sm btn-delete-action" data-id="${s.id}" title="Delete Record">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach button click listeners
  DOM.recordsTableBody.querySelectorAll('.btn-report-action').forEach(btn => {
    btn.addEventListener('click', () => viewReport(btn.getAttribute('data-id')));
  });
  DOM.recordsTableBody.querySelectorAll('.btn-edit-action').forEach(btn => {
    btn.addEventListener('click', () => openModalForEdit(btn.getAttribute('data-id')));
  });
  DOM.recordsTableBody.querySelectorAll('.btn-delete-action').forEach(btn => {
    btn.addEventListener('click', () => deleteRecord(btn.getAttribute('data-id')));
  });
}

function renderDefaultersView(searchTerm, selectedRAType, selectedDept) {
  const targetMonth = state.activeTrackingMonth || DOM.trackingMonthSelect?.value || getCurrentYearMonth();
  if (DOM.recordsTableHead) {
    DOM.recordsTableHead.innerHTML = `
      <tr id="thRowDefaulters">
        <th>Defaulter Scholar</th>
        <th>Guide & Department</th>
        <th>RA Type</th>
        <th>Target Month</th>
        <th>Last Submission History</th>
        <th>Contact Details</th>
        <th style="text-align: right;">Action</th>
      </tr>
    `;
  }

  const filtered = (state.defaultersList || []).filter(d => {
    const matchesSearch = !searchTerm || (
      (d.scholarName && d.scholarName.toLowerCase().includes(searchTerm)) ||
      (d.regNo && String(d.regNo).toLowerCase().includes(searchTerm)) ||
      (d.guideName && d.guideName.toLowerCase().includes(searchTerm)) ||
      (d.department && d.department.toLowerCase().includes(searchTerm))
    );
    const matchesRAType = !selectedRAType || d.raType === selectedRAType;
    const matchesDept = !selectedDept || d.department === selectedDept;
    return matchesSearch && matchesRAType && matchesDept;
  });

  if (filtered.length === 0) {
    DOM.recordsTableBody.innerHTML = '';
    DOM.emptyState.style.display = 'block';
    if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = `All Scholars Submitted for ${formatMonth(targetMonth)}!`;
    if (DOM.emptyStateMessage) DOM.emptyStateMessage.textContent = 'There are zero defaulters matching your filter criteria.';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.recordsTableBody.innerHTML = filtered.map(d => {
    const raType = d.raType || 'ERA';
    return `
      <tr style="background: ${d.hasPrior ? '#fffdfa' : '#fffbfa'};">
        <td>
          <div class="scholar-meta">
            <span class="scholar-name" style="color: #991b1b; font-weight: 700;">${escapeHtml(d.scholarName)}</span>
            <span class="scholar-reg" style="font-weight: 700;">${escapeHtml(d.regNo)}</span>
          </div>
        </td>
        <td>
          <div>
            <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(d.guideName || 'Research Supervisor')}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(d.department || '-')}</div>
          </div>
        </td>
        <td>
          <span class="badge ${raType === 'CAP' ? 'badge-cap' : (raType === 'TRA' ? 'badge-tra' : 'badge-era')}">
            ${raType}
          </span>
        </td>
        <td>
          <span class="badge badge-rose" style="font-weight: 700;">
            ${formatMonth(targetMonth)} (Pending)
          </span>
        </td>
        <td>
          <span class="badge ${d.hasPrior ? 'badge-amber' : 'badge-rose'}" style="font-size: 0.75rem; font-weight: 600;">
            ${escapeHtml(d.lastSubmissionNote)}
          </span>
        </td>
        <td>
          <div style="font-size: 0.8rem; line-height: 1.5;">
            ${d.scholarContact ? `<div><strong>Scholar:</strong> <a href="tel:${escapeHtml(d.scholarContact)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(d.scholarContact)}</a></div>` : '<div style="color: #94a3b8;">Scholar Phone: -</div>'}
            ${d.supervisorContact ? `<div><strong>Guide:</strong> <a href="tel:${escapeHtml(d.supervisorContact)}" style="color: #2563eb; font-weight: 600;">${escapeHtml(d.supervisorContact)}</a></div>` : '<div style="color: #94a3b8;">Guide Phone: -</div>'}
          </div>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-primary btn-sm btn-defaulter-entry" data-reg="${escapeHtml(d.regNo)}" title="Create Entry for this Scholar">
            + Add Entry
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach entry triggers
  DOM.recordsTableBody.querySelectorAll('.btn-defaulter-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      const reg = btn.getAttribute('data-reg');
      openModalForNew();
      if (DOM.regNoInput) {
        DOM.regNoInput.value = reg;
        DOM.regNoInput.dispatchEvent(new Event('change'));
      }
    });
  });
}

function renderMasterProfilesView(searchTerm, selectedRAType, selectedDept) {
  if (DOM.recordsTableHead) {
    DOM.recordsTableHead.innerHTML = `
      <tr id="thRowProfiles">
        <th>Enrolled Scholar Info</th>
        <th>Guide & Department</th>
        <th>RA Type</th>
        <th>Date of Joining</th>
        <th>3-Yr End of RA</th>
        <th>Bank A/C Details</th>
        <th>Total Submissions</th>
        <th style="text-align: right;">Actions</th>
      </tr>
    `;
  }

  // Combine profiles
  const profiles = state.masterProfilesList && state.masterProfilesList.length > 0
    ? state.masterProfilesList
    : Object.values(state.masterProfiles || {});

  const filtered = profiles.filter(p => {
    const matchesSearch = !searchTerm || (
      (p.scholarName && p.scholarName.toLowerCase().includes(searchTerm)) ||
      (p.regNo && String(p.regNo).toLowerCase().includes(searchTerm)) ||
      (p.guideName && p.guideName.toLowerCase().includes(searchTerm)) ||
      (p.department && p.department.toLowerCase().includes(searchTerm))
    );
    const matchesRAType = !selectedRAType || p.raType === selectedRAType;
    const matchesDept = !selectedDept || p.department === selectedDept;
    return matchesSearch && matchesRAType && matchesDept;
  });

  if (filtered.length === 0) {
    DOM.recordsTableBody.innerHTML = '';
    DOM.emptyState.style.display = 'block';
    if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = 'No Registered Scholars Found';
    if (DOM.emptyStateMessage) DOM.emptyStateMessage.textContent = 'Master profiles loaded from database will appear here.';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.recordsTableBody.innerHTML = filtered.map(p => {
    const raType = p.raType || 'ERA';
    const regUpper = String(p.regNo || '').trim().toUpperCase();
    const subCount = state.scholars.filter(s => String(s.regNo || '').trim().toUpperCase() === regUpper).length;
    const remainingTenure = calculateRemainingTenure(p.endOfRA);

    return `
      <tr>
        <td>
          <div class="scholar-meta">
            <span class="scholar-name">${escapeHtml(p.scholarName)}</span>
            <span class="scholar-reg">${escapeHtml(p.regNo)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(p.scholarContact || '')}</span>
          </div>
        </td>
        <td>
          <div>
            <div style="font-weight: 500; color: var(--text-primary);">${escapeHtml(p.guideName || 'Not Assigned')}</div>
            <div style="font-size: 0.775rem; color: var(--text-muted);">${escapeHtml(p.department || '-')}</div>
          </div>
        </td>
        <td>
          <span class="badge ${raType === 'CAP' ? 'badge-cap' : (raType === 'TRA' ? 'badge-tra' : 'badge-era')}">
            ${raType}
          </span>
        </td>
        <td>
          <div style="font-size: 0.8rem;">
            <div>${formatDate(p.dateOfJoining)}</div>
          </div>
        </td>
        <td>
          <div style="font-size: 0.8rem;">
            <div>${formatDate(p.endOfRA)}</div>
            <span class="badge ${remainingTenure.includes('Completed') ? 'badge-rose' : 'badge-green'}" style="font-size: 0.7rem; margin-top: 0.2rem;">
              ${remainingTenure}
            </span>
          </div>
        </td>
        <td>
          <div style="font-size: 0.8rem;">
            ${p.bankName ? `<div style="font-weight: 600; font-size: 0.75rem;">${escapeHtml(p.bankName)}</div>` : ''}
            <div style="font-family: monospace;">${escapeHtml(p.bankAccountNo || 'Pending')}</div>
          </div>
        </td>
        <td>
          <span class="badge ${subCount > 0 ? 'badge-blue' : 'badge-rose'}" style="font-weight: 700;">
            ${subCount} Report(s)
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-secondary btn-sm btn-master-entry" data-reg="${escapeHtml(p.regNo)}" title="Add Entry for this scholar">
            + New Entry
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach entry triggers
  DOM.recordsTableBody.querySelectorAll('.btn-master-entry').forEach(btn => {
    btn.addEventListener('click', () => {
      const reg = btn.getAttribute('data-reg');
      openModalForNew();
      if (DOM.regNoInput) {
        DOM.regNoInput.value = reg;
        DOM.regNoInput.dispatchEvent(new Event('change'));
      }
    });
  });
}

export function populateMonthFilterOptions() {
  const months = [...new Set(state.scholars.map(s => s.currentMonth).filter(Boolean))].sort().reverse();
  const currentVal = DOM.filterMonth.value;
  DOM.filterMonth.innerHTML = '<option value="">All Months</option>';
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = formatMonth(m);
    DOM.filterMonth.appendChild(opt);
  });
  if (currentVal) DOM.filterMonth.value = currentVal;
}

export function exportToCSV() {
  if (!state.scholars || state.scholars.length === 0) {
    showToast('No records to export!', 'error');
    return;
  }

  const headers = [
    'Registration No',
    'Scholar Name',
    'Guide Name',
    'Department',
    'RA Type',
    'Bank Name',
    'Bank A/C No',
    'IFSC Code',
    'Date of Joining',
    'End of Research Assistantship',
    'Remaining Service Period',
    'Scholar Contact',
    'Supervisor Contact',
    'Current Month',
    'Forget Thumbs',
    'Courses Completed Count',
    'Completed Course Details',
    'Leaves Taken',
    'Average No of Hours Spent/Month',
    'Academic Load',
    'Journal Papers Count',
    'Journal Papers Details',
    'Conference Papers Count',
    'Conference Papers Details',
    'Conferences / Workshops / Guest Lectures / Synopsis / Pre-Synopsis / ODEC Count',
    'Conferences / Workshops / Guest Lectures / Synopsis / Pre-Synopsis / ODEC Details',
    'Doctoral Committee (DC) Meetings Count',
    'Doctoral Committee (DC) Meetings Details'
  ];

  const rows = state.scholars.map(s => {
    const courseDetails = (s.courseDetails || [])
      .map(c => `[${c.courseName || 'Course'} (${c.courseType || 'Internal'}) - Credits: ${c.credits || 'N/A'}, Formative: ${c.formativeMarks || 'N/A'}, Summative: ${c.summativeMarks || 'N/A'}, Score: ${c.cgpa || c.grade || 'N/A'}${c.result ? ' (' + c.result + ')' : ''}${c.completionDate ? ' (' + c.completionDate + ')' : ''}]`)
      .join('; ');

    const journalDetails = (s.journalPapers || [])
      .map(j => `[${j.journalName} (${j.status}${j.statusDate ? ' on ' + j.statusDate : ''}) - ${j.title}]`)
      .join('; ');

    const confDetails = (s.conferencePapers || [])
      .map(c => `[${c.conferenceName} (${c.status}${c.statusDate ? ' on ' + c.statusDate : ''}) - ${c.title}]`)
      .join('; ');

    const events = s.events || s.fdps || [];
    const eventDetails = events
      .map(e => `${e.name} [${e.category || 'Workshop'}] (${e.organizer || 'N/A'})`)
      .join('; ');

    const dcs = s.dcMeetings || [];
    const dcDetails = dcs
      .map(d => `[${d.dcName || 'DC'} (${d.regulation || 'R22'}) - Last Attended: ${d.lastDcDate || 'N/A'}, Rating/CRP: ${d.rating || 'N/A'}, Rec: ${d.recommendations || 'N/A'}, Comments: ${d.comments || 'None'}]`)
      .join('; ');

    return [
      `"${cleanCSV(s.regNo)}"`,
      `"${cleanCSV(s.scholarName)}"`,
      `"${cleanCSV(s.guideName)}"`,
      `"${cleanCSV(s.department)}"`,
      `"${cleanCSV(s.raType || 'ERA')}"`,
      `"${cleanCSV(s.bankName || 'State Bank of India')}"`,
      `"${cleanCSV(s.bankAccountNo)}"`,
      `"${cleanCSV(s.ifscCode || 'SBIN0001234')}"`,
      `"${cleanCSV(s.dateOfJoining)}"`,
      `"${cleanCSV(s.endOfRA)}"`,
      `"${cleanCSV(calculateRemainingTenure(s.endOfRA))}"`,
      `"${cleanCSV(s.scholarContact)}"`,
      `"${cleanCSV(s.supervisorContact)}"`,
      `"${cleanCSV(s.currentMonth)}"`,
      s.forgetThumbs || 0,
      s.coursesCompleted || (s.courseDetails ? s.courseDetails.length : 0),
      `"${cleanCSV(courseDetails)}"`,
      s.leavesTaken || 0,
      `"${cleanCSV(s.avgSpentStayed)}"`,
      `"${cleanCSV(s.academicLoad)}"`,
      s.journalPapers?.length || 0,
      `"${cleanCSV(journalDetails)}"`,
      s.conferencePapers?.length || 0,
      `"${cleanCSV(confDetails)}"`,
      events.length,
      `"${cleanCSV(eventDetails)}"`,
      dcs.length,
      `"${cleanCSV(dcDetails)}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Scholar_Tracking_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Scholar tracking CSV exported successfully!');
}

export function exportDefaultersToCSV() {
  const targetMonth = state.activeTrackingMonth || DOM.trackingMonthSelect?.value || getCurrentYearMonth();
  const defaulters = state.defaultersList || [];
  if (defaulters.length === 0) {
    showToast(`No defaulters found for ${formatMonth(targetMonth)}! All scholars have submitted.`, 'info');
    return;
  }

  const headers = [
    'Registration No',
    'Scholar Name',
    'Department',
    'Research Guide',
    'RA Type',
    'Scholar Contact',
    'Supervisor Contact',
    'Target Missing Month',
    'Last Submission Recorded',
    'Compliance Status'
  ];

  const rows = defaulters.map(d => [
    `"${cleanCSV(d.regNo)}"`,
    `"${cleanCSV(d.scholarName)}"`,
    `"${cleanCSV(d.department)}"`,
    `"${cleanCSV(d.guideName)}"`,
    `"${cleanCSV(d.raType || 'ERA')}"`,
    `"${cleanCSV(d.scholarContact || 'Not Available')}"`,
    `"${cleanCSV(d.supervisorContact || 'Not Available')}"`,
    `"${cleanCSV(targetMonth)}"`,
    `"${cleanCSV(d.lastSubmissionNote)}"`,
    `"Pending / Not Submitted"`
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Defaulters_Roster_${targetMonth}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Defaulters roster for ${formatMonth(targetMonth)} exported (${defaulters.length} scholars)!`);
}
