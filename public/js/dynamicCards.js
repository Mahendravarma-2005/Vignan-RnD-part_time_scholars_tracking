// Research Scholar Tracking System - Dynamic Card Components
import { escapeHtml, getStatusBadgeClass, evaluateCourseResult } from './utils.js';

export function updateDynamicCards(container, countVal, type, existingData = null) {
  if (!container) return;
  const count = parseInt(countVal, 10) || 0;
  const currentItems = [];

  const existingCards = container.querySelectorAll('.dynamic-card');
  existingCards.forEach(card => {
    if (type === 'course') {
      const courseType = card.querySelector('.course-type-input')?.value || 'Internal';
      const cgpaVal = card.querySelector('.course-cgpa-input')?.value.trim() || '';
      const evalRes = evaluateCourseResult(courseType, cgpaVal);
      const resText = evalRes.text;
      currentItems.push({
        courseCode: '',
        courseType: courseType,
        courseName: card.querySelector('.course-name-input')?.value || '',
        credits: card.querySelector('.course-credits-input')?.value || '',
        formativeMarks: card.querySelector('.course-formative-input')?.value || '',
        summativeMarks: card.querySelector('.course-summative-input')?.value || '',
        cgpa: cgpaVal,
        result: resText,
        grade: cgpaVal ? `${cgpaVal} (${resText})` : '',
        completionDate: card.querySelector('.course-date-input')?.value || ''
      });
    } else if (type === 'journal') {
      currentItems.push({
        title: card.querySelector('.journal-title-input')?.value || '',
        journalName: card.querySelector('.journal-name-input')?.value || '',
        status: card.querySelector('.journal-status-input')?.value || 'Communicated',
        statusDate: card.querySelector('.journal-date-input')?.value || ''
      });
    } else if (type === 'conf') {
      currentItems.push({
        title: card.querySelector('.conf-title-input')?.value || '',
        conferenceName: card.querySelector('.conf-name-input')?.value || '',
        status: card.querySelector('.conf-status-input')?.value || 'Communicated',
        statusDate: card.querySelector('.conf-date-input')?.value || ''
      });
    } else if (type === 'fdp' || type === 'event') {
      currentItems.push({
        name: card.querySelector('.event-name-input, .fdp-name-input')?.value || '',
        category: card.querySelector('.event-category-input')?.value || 'Workshop',
        organizer: card.querySelector('.event-org-input, .fdp-org-input')?.value || '',
        eventDate: card.querySelector('.event-date-input')?.value || ''
      });
    } else if (type === 'dc') {
      currentItems.push({
        dcName: card.querySelector('.dc-name-input')?.value || '',
        lastDcDate: card.querySelector('.dc-date-input')?.value || '',
        comments: card.querySelector('.dc-comments-input')?.value || '',
        regulation: card.querySelector('.dc-regulation-input')?.value || 'R22',
        rating: card.querySelector('.dc-rating-input')?.value || '',
        recommendations: card.querySelector('.dc-recommendations-input')?.value || 'Pre-synopsis'
      });
    }
  });

  const sourceData = existingData || currentItems;
  container.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');

    if (type === 'course') {
      const item = sourceData[i] || { courseCode: '', courseType: 'Internal', courseName: '', credits: '', formativeMarks: '', summativeMarks: '', grade: '', cgpa: '', result: '', completionDate: '' };
      const courseType = item.courseType || 'Internal';

      // Determine initial score and result from existing record
      let initialCgpa = item.cgpa || '';
      if (!initialCgpa && item.grade) {
        const m = String(item.grade).match(/^([\d.]+)/);
        if (m) {
          initialCgpa = m[1];
        } else if (!isNaN(parseFloat(item.grade))) {
          initialCgpa = String(parseFloat(item.grade));
        }
      }

      const evalInitial = evaluateCourseResult(courseType, initialCgpa);
      let initialResult = item.result || evalInitial.text;
      const isPass = initialResult === 'Pass';
      const badgeClass = isPass ? 'badge-green' : (initialResult === 'Fail' ? 'badge-rose' : 'badge-blue');

      card.className = 'dynamic-card course-card';
      card.innerHTML = `
        <div class="dynamic-card-title">
          <span>Completed Course #${i + 1}</span>
          <span class="badge ${courseType === 'NPTEL' ? 'badge-purple' : 'badge-blue'} course-type-badge">${escapeHtml(courseType)}</span>
          ${initialResult ? `<span class="badge ${badgeClass} course-result-badge">${escapeHtml(courseType)}: ${escapeHtml(initialCgpa)} (${escapeHtml(initialResult)})</span>` : ''}
        </div>
        <div class="card-inner-grid">
          <div class="form-group">
            <label>Course Name / Title <span class="required">*</span></label>
            <input type="text" class="course-name-input" required placeholder="e.g. Advanced Machine Learning" value="${escapeHtml(item.courseName || '')}">
          </div>
          <div class="form-group">
            <label>Course Type <span class="required">*</span></label>
            <select class="course-type-input">
              <option value="Internal" ${courseType === 'Internal' ? 'selected' : ''}>Internal (Pass: ≥60%)</option>
              <option value="NPTEL" ${courseType === 'NPTEL' ? 'selected' : ''}>NPTEL (Pass: ≥55%)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Credits <span class="required">*</span></label>
            <input type="number" class="course-credits-input" step="0.5" min="0" max="20" required placeholder="e.g. 4" value="${escapeHtml(item.credits || '')}">
          </div>
          <div class="form-group formative-group">
            <label>Formative Marks</label>
            <input type="number" class="course-formative-input" min="0" max="100" placeholder="e.g. 35" value="${escapeHtml(item.formativeMarks || '')}">
          </div>
          <div class="form-group summative-group">
            <label>Summative Marks</label>
            <input type="number" class="course-summative-input" min="0" max="100" placeholder="e.g. 45" value="${escapeHtml(item.summativeMarks || '')}">
          </div>
          <div class="form-group">
            <label class="course-score-label">${courseType === 'NPTEL' ? 'NPTEL Score / %' : 'Score / CGPA / %'} <span class="required">*</span></label>
            <input type="number" class="course-cgpa-input" step="0.01" min="0" max="100" required placeholder="${courseType === 'NPTEL' ? 'e.g. 65% (Pass: ≥55%)' : 'e.g. 70% or 7.0 (Pass: ≥60%)'}" value="${escapeHtml(initialCgpa)}">
          </div>
          <div class="form-group">
            <label>Result</label>
            <div class="course-result-display" style="padding: 0.55rem 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; border: 1px solid ${initialResult ? (isPass ? '#bbf7d0' : '#fecdd3') : 'var(--border-color)'}; background: ${initialResult ? (isPass ? '#f0fdf4' : '#fef2f2') : '#f8fafc'}; color: ${initialResult ? (isPass ? '#166534' : '#991b1b') : 'var(--text-muted)'};">
              ${initialResult ? (isPass ? '✓ Pass' : '✗ Fail') : 'Enter Score'}
            </div>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label>Date of Completion</label>
            <input type="date" class="course-date-input" value="${item.completionDate ? String(item.completionDate).slice(0, 10) : ''}">
          </div>
        </div>
      `;

      const typeSelect = card.querySelector('.course-type-input');
      const typeBadge = card.querySelector('.course-type-badge');
      const cgpaInput = card.querySelector('.course-cgpa-input');
      const scoreLabel = card.querySelector('.course-score-label');
      const resultDisplay = card.querySelector('.course-result-display');
      const formativeInput = card.querySelector('.course-formative-input');
      const summativeInput = card.querySelector('.course-summative-input');

      function updateEvaluation() {
        const curType = typeSelect.value;
        const val = cgpaInput.value.trim();
        typeBadge.textContent = curType;
        typeBadge.className = `badge ${curType === 'NPTEL' ? 'badge-purple' : 'badge-blue'} course-type-badge`;
        scoreLabel.innerHTML = `${curType === 'NPTEL' ? 'NPTEL Score / %' : 'Score / CGPA / %'} <span class="required">*</span>`;
        cgpaInput.placeholder = curType === 'NPTEL' ? 'e.g. 65% (Pass: ≥55%)' : 'e.g. 70% or 7.0 (Pass: ≥60%)';

        const formativeGroup = card.querySelector('.formative-group');
        const summativeGroup = card.querySelector('.summative-group');
        if (formativeGroup) formativeGroup.style.display = 'block';
        if (summativeGroup) summativeGroup.style.display = 'block';

        let resBadge = card.querySelector('.course-result-badge');
        if (val !== '') {
          const evalRes = evaluateCourseResult(curType, val);
          const passed = evalRes.passed;
          const resText = evalRes.text;

          resultDisplay.textContent = passed ? '✓ Pass' : '✗ Fail';
          resultDisplay.style.background = passed ? '#f0fdf4' : '#fef2f2';
          resultDisplay.style.borderColor = passed ? '#bbf7d0' : '#fecdd3';
          resultDisplay.style.color = passed ? '#166534' : '#991b1b';

          if (!resBadge) {
            resBadge = document.createElement('span');
            resBadge.className = 'badge course-result-badge';
            card.querySelector('.dynamic-card-title').appendChild(resBadge);
          }
          resBadge.className = `badge ${passed ? 'badge-green' : 'badge-rose'} course-result-badge`;
          resBadge.textContent = `${curType}: ${val} (${resText})`;
        } else {
          resultDisplay.textContent = 'Enter Score';
          resultDisplay.style.background = '#f8fafc';
          resultDisplay.style.borderColor = 'var(--border-color)';
          resultDisplay.style.color = 'var(--text-muted)';
          if (resBadge) resBadge.remove();
        }
      }

      cgpaInput.addEventListener('input', updateEvaluation);
      typeSelect.addEventListener('change', updateEvaluation);

      function tryAutoScore() {
        const f = parseFloat(formativeInput.value);
        const s = parseFloat(summativeInput.value);
        if (!isNaN(f) && !isNaN(s) && f >= 0 && s >= 0 && !cgpaInput.dataset.manual) {
          cgpaInput.value = f + s;
          updateEvaluation();
        }
      }
      cgpaInput.addEventListener('keydown', () => { cgpaInput.dataset.manual = 'true'; });
      formativeInput.addEventListener('input', tryAutoScore);
      summativeInput.addEventListener('input', tryAutoScore);
    } else if (type === 'journal') {
      const item = sourceData[i] || { title: '', journalName: '', status: 'Communicated', statusDate: '' };
      let currentStatus = item.status || 'Communicated';
      if (currentStatus === 'Received') currentStatus = 'Revised';

      card.className = 'dynamic-card';
      card.innerHTML = `
        <div class="dynamic-card-title">
          <span>Journal Paper #${i + 1}</span>
          <span class="badge ${getStatusBadgeClass(currentStatus)}">${escapeHtml(currentStatus)}</span>
        </div>
        <div class="card-inner-grid">
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Paper Title</label>
            <input type="text" class="journal-title-input" placeholder="e.g. Deep Learning Optimization in Distributed Edge Networks" value="${escapeHtml(item.title || '')}">
          </div>
          <div class="form-group">
            <label>Journal Name <span class="required">*</span></label>
            <input type="text" class="journal-name-input" required placeholder="e.g. IEEE Transactions on Systems" value="${escapeHtml(item.journalName || '')}">
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label style="margin-bottom: 0;">Publication Status <span class="required">*</span></label>
              <button type="button" class="journal-accepted-btn" style="padding: 2px 10px; font-size: 0.75rem; border-radius: 9999px; border: 1px solid #16a34a; background: ${currentStatus === 'Accepted' ? '#16a34a' : 'transparent'}; color: ${currentStatus === 'Accepted' ? '#ffffff' : '#16a34a'}; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                ✓ Accepted
              </button>
            </div>
            <select class="journal-status-input">
              <option value="Communicated" ${currentStatus === 'Communicated' ? 'selected' : ''}>Communicated</option>
              <option value="Under Review" ${currentStatus === 'Under Review' ? 'selected' : ''}>Under Review</option>
              <option value="Revised" ${currentStatus === 'Revised' ? 'selected' : ''}>Revised</option>
              <option value="Accepted" ${currentStatus === 'Accepted' ? 'selected' : ''}>Accepted</option>
              <option value="Published" ${currentStatus === 'Published' ? 'selected' : ''}>Published</option>
            </select>
          </div>
          <div class="form-group">
            <label class="journal-date-label">Date of ${escapeHtml(currentStatus)} <span class="required">*</span></label>
            <input type="date" class="journal-date-input" required value="${item.statusDate ? String(item.statusDate).slice(0, 10) : ''}">
          </div>
        </div>
      `;
      const select = card.querySelector('.journal-status-input');
      const badge = card.querySelector('.badge');
      const dateLabel = card.querySelector('.journal-date-label');
      const acceptBtn = card.querySelector('.journal-accepted-btn');

      acceptBtn.addEventListener('click', () => {
        select.value = 'Accepted';
        select.dispatchEvent(new Event('change'));
      });

      select.addEventListener('change', (e) => {
        badge.textContent = e.target.value;
        badge.className = `badge ${getStatusBadgeClass(e.target.value)}`;
        dateLabel.innerHTML = `Date of ${escapeHtml(e.target.value)} <span class="required">*</span>`;
        if (e.target.value === 'Accepted') {
          acceptBtn.style.background = '#16a34a';
          acceptBtn.style.color = '#ffffff';
        } else {
          acceptBtn.style.background = 'transparent';
          acceptBtn.style.color = '#16a34a';
        }
      });
    } else if (type === 'conf') {
      const item = sourceData[i] || { title: '', conferenceName: '', status: 'Communicated', statusDate: '' };
      let currentStatus = item.status || 'Communicated';
      if (currentStatus === 'Received') currentStatus = 'Revised';

      card.className = 'dynamic-card conf-card';
      card.innerHTML = `
        <div class="dynamic-card-title">
          <span>Conference Paper #${i + 1}</span>
          <span class="badge ${getStatusBadgeClass(currentStatus)}">${escapeHtml(currentStatus)}</span>
        </div>
        <div class="card-inner-grid">
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Conference Paper Title</label>
            <input type="text" class="conf-title-input" placeholder="e.g. Adaptive Latency Optimization" value="${escapeHtml(item.title || '')}">
          </div>
          <div class="form-group">
            <label>Conference Name <span class="required">*</span></label>
            <input type="text" class="conf-name-input" required placeholder="e.g. IEEE INFOCOM 2026" value="${escapeHtml(item.conferenceName || '')}">
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label style="margin-bottom: 0;">Status <span class="required">*</span></label>
              <button type="button" class="conf-accepted-btn" style="padding: 2px 10px; font-size: 0.75rem; border-radius: 9999px; border: 1px solid #16a34a; background: ${currentStatus === 'Accepted' ? '#16a34a' : 'transparent'}; color: ${currentStatus === 'Accepted' ? '#ffffff' : '#16a34a'}; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                ✓ Accepted
              </button>
            </div>
            <select class="conf-status-input">
              <option value="Communicated" ${currentStatus === 'Communicated' ? 'selected' : ''}>Communicated</option>
              <option value="Under Review" ${currentStatus === 'Under Review' ? 'selected' : ''}>Under Review</option>
              <option value="Revised" ${currentStatus === 'Revised' ? 'selected' : ''}>Revised</option>
              <option value="Accepted" ${currentStatus === 'Accepted' ? 'selected' : ''}>Accepted</option>
              <option value="Published" ${currentStatus === 'Published' ? 'selected' : ''}>Published</option>
            </select>
          </div>
          <div class="form-group">
            <label class="conf-date-label">Date of ${escapeHtml(currentStatus)} <span class="required">*</span></label>
            <input type="date" class="conf-date-input" required value="${item.statusDate ? String(item.statusDate).slice(0, 10) : ''}">
          </div>
        </div>
      `;
      const select = card.querySelector('.conf-status-input');
      const badge = card.querySelector('.badge');
      const dateLabel = card.querySelector('.conf-date-label');
      const acceptBtn = card.querySelector('.conf-accepted-btn');

      acceptBtn.addEventListener('click', () => {
        select.value = 'Accepted';
        select.dispatchEvent(new Event('change'));
      });

      select.addEventListener('change', (e) => {
        badge.textContent = e.target.value;
        badge.className = `badge ${getStatusBadgeClass(e.target.value)}`;
        dateLabel.innerHTML = `Date of ${escapeHtml(e.target.value)} <span class="required">*</span>`;
        if (e.target.value === 'Accepted') {
          acceptBtn.style.background = '#16a34a';
          acceptBtn.style.color = '#ffffff';
        } else {
          acceptBtn.style.background = 'transparent';
          acceptBtn.style.color = '#16a34a';
        }
      });
    } else if (type === 'fdp' || type === 'event') {
      const item = sourceData[i] || { name: '', category: 'Workshop', organizer: '', eventDate: '' };
      const category = item.category || 'Workshop';
      let badgeColor = 'badge-amber';
      if (['ODEC', 'Synopsis', 'PreSynopsis'].includes(category)) badgeColor = 'badge-purple';
      else if (category === 'Conference') badgeColor = 'badge-blue';

      card.className = 'dynamic-card event-card';
      card.innerHTML = `
        <div class="dynamic-card-title">
          <span>Event / Workshop / Activity #${i + 1}</span>
          <span class="badge ${badgeColor} event-category-badge">${escapeHtml(category)}</span>
        </div>
        <div class="card-inner-grid">
          <div class="form-group" style="grid-column: span 2;">
            <label>Event Title <span class="required">*</span></label>
            <input type="text" class="event-name-input" required placeholder="e.g. National Workshop on Quantum AI / ODEC Review / Synopsis Presentation" value="${escapeHtml(item.name || '')}">
          </div>
          <div class="form-group">
            <label>Category <span class="required">*</span></label>
            <select class="event-category-input">
              <option value="Workshop" ${category === 'Workshop' ? 'selected' : ''}>Workshop</option>
              <option value="Guest Lecture" ${category === 'Guest Lecture' ? 'selected' : ''}>Guest Lecture</option>
              <option value="Conference" ${category === 'Conference' ? 'selected' : ''}>Conference Attended</option>
              <option value="ODEC" ${category === 'ODEC' ? 'selected' : ''}>ODEC</option>
              <option value="Synopsis" ${category === 'Synopsis' ? 'selected' : ''}>Synopsis</option>
              <option value="PreSynopsis" ${category === 'PreSynopsis' ? 'selected' : ''}>PreSynopsis</option>
              <option value="FDP" ${category === 'FDP' ? 'selected' : ''}>FDP (Faculty Dev)</option>
              <option value="Seminar / Symposia" ${category === 'Seminar / Symposia' ? 'selected' : ''}>Seminar / Symposia</option>
              <option value="Short Term Course" ${category === 'Short Term Course' ? 'selected' : ''}>Short Term Course</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label>Institution & Duration</label>
            <input type="text" class="event-org-input" placeholder="e.g. IIT Madras (3 Days) or University Research Committee" value="${escapeHtml(item.organizer || '')}">
          </div>
          <div class="form-group">
            <label>Date / Period</label>
            <input type="date" class="event-date-input" value="${item.eventDate ? String(item.eventDate).slice(0, 10) : ''}">
          </div>
        </div>
      `;
      const catSelect = card.querySelector('.event-category-input');
      const catBadge = card.querySelector('.event-category-badge');
      catSelect.addEventListener('change', (e) => {
        catBadge.textContent = e.target.value;
        if (['ODEC', 'Synopsis', 'PreSynopsis'].includes(e.target.value)) {
          catBadge.className = 'badge badge-purple event-category-badge';
        } else if (e.target.value === 'Conference') {
          catBadge.className = 'badge badge-blue event-category-badge';
        } else {
          catBadge.className = 'badge badge-amber event-category-badge';
        }
      });
    } else if (type === 'dc') {
      const item = sourceData[i] || {
        dcName: '',
        lastDcDate: '',
        comments: '',
        regulation: 'R22',
        rating: '10',
        recommendations: 'Pre-synopsis'
      };

      const curReg = item.regulation || 'R22';
      const curRec = item.recommendations || 'Pre-synopsis';
      const curRating = item.rating || (curReg === 'R18' ? 'Satisfactory' : '10');
      let curDcName = String(i + 1);
      if (item.dcName !== undefined && item.dcName !== null && String(item.dcName).trim() !== '') {
        const raw = String(item.dcName).trim();
        const match = raw.match(/\d+/);
        curDcName = match ? match[0] : raw;
      }
      const displayTitle = curDcName ? (isNaN(curDcName) ? curDcName : `DC Meeting ${curDcName}`) : `DC Meeting #${i + 1}`;

      card.className = 'dynamic-card dc-card';
      card.innerHTML = `
        <div class="dynamic-card-title">
          <span>${escapeHtml(displayTitle)}</span>
          <span class="badge badge-blue dc-reg-badge">${escapeHtml(curReg)}</span>
          <span class="badge badge-purple dc-rating-badge">${curReg === 'R18' ? 'Rating: ' + escapeHtml(curRating) : 'CRP: ' + escapeHtml(curRating) + ' / 12'}</span>
          <span class="badge badge-amber dc-rec-badge">${escapeHtml(curRec === 'Final-DC' ? 'Pre-synopsis' : curRec)}</span>
        </div>
        <div class="card-inner-grid">
          <div class="form-group">
            <label>DC Meeting <span class="required">*</span></label>
            <input type="text" class="dc-name-input" required placeholder="e.g. ${i + 1}" value="${escapeHtml(curDcName)}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label>DC Attended Date <span class="required">*</span></label>
            <input type="date" class="dc-date-input" required value="${item.lastDcDate ? String(item.lastDcDate).slice(0, 10) : ''}">
          </div>
          <div class="form-group">
            <label>Regulation <span class="required">*</span></label>
            <select class="dc-regulation-input">
              <option value="R18" ${curReg === 'R18' ? 'selected' : ''}>R18</option>
              <option value="R22" ${curReg === 'R22' ? 'selected' : ''}>R22</option>
              <option value="R25" ${curReg === 'R25' ? 'selected' : ''}>R25</option>
            </select>
          </div>
          <div class="form-group">
            <label class="dc-rating-label">${curReg === 'R18' ? 'Rating' : 'CRP (0 - 12)'} <span class="required">*</span></label>
            <select class="dc-rating-input" required>
              <!-- Populated dynamically based on regulation -->
            </select>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Recommendations <span class="required">*</span></label>
            <select class="dc-recommendations-input" required>
              <option value="Pre-thesis colloquium" ${curRec === 'Pre-thesis colloquium' ? 'selected' : ''}>Pre-thesis colloquium</option>
              <option value="Pre-synopsis" ${curRec === 'Pre-synopsis' || curRec === 'Final-DC' ? 'selected' : ''}>Pre-synopsis</option>
              <option value="Synopsis" ${curRec === 'Synopsis' ? 'selected' : ''}>Synopsis</option>
              <option value="In Progress" ${curRec === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Thesis Submission" ${curRec === 'Thesis Submission' ? 'selected' : ''}>Thesis Submission</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Comments Received <span class="required">*</span></label>
            <textarea class="dc-comments-input" rows="2" required placeholder="Enter comments and observations received from Doctoral Committee...">${escapeHtml(item.comments || '')}</textarea>
          </div>
        </div>
      `;

      const regSelect = card.querySelector('.dc-regulation-input');
      const ratingLabel = card.querySelector('.dc-rating-label');
      const ratingSelect = card.querySelector('.dc-rating-input');
      const recSelect = card.querySelector('.dc-recommendations-input');
      const dcNameInput = card.querySelector('.dc-name-input');

      const titleSpan = card.querySelector('.dynamic-card-title span');
      const regBadge = card.querySelector('.dc-reg-badge');
      const ratingBadge = card.querySelector('.dc-rating-badge');
      const recBadge = card.querySelector('.dc-rec-badge');

      function syncBadges() {
        const r = regSelect.value;
        const rate = ratingSelect.value;
        const rec = recSelect.value;
        const nameVal = dcNameInput.value.trim() || String(i + 1);

        titleSpan.textContent = isNaN(nameVal) ? nameVal : `DC Meeting ${nameVal}`;
        regBadge.textContent = r;
        ratingBadge.textContent = r === 'R18' ? `Rating: ${rate}` : `CRP: ${rate} / 12`;
        recBadge.textContent = rec;
      }

      function rebuildRatingDropdown(regulation, targetRating) {
        ratingSelect.innerHTML = '';
        if (regulation === 'R18') {
          ratingLabel.innerHTML = `Rating <span class="required">*</span>`;
          const opts = ['Satisfactory', 'Unsatisfactory', 'Good'];
          opts.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            if (targetRating && targetRating.toLowerCase() === opt.toLowerCase()) {
              el.selected = true;
            }
            ratingSelect.appendChild(el);
          });
          if (!targetRating || !opts.some(o => o.toLowerCase() === (targetRating || '').toLowerCase())) {
            ratingSelect.value = 'Satisfactory';
          }
        } else {
          // R22 or R25
          ratingLabel.innerHTML = `CRP (0 - 12) <span class="required">*</span>`;
          for (let n = 0; n <= 12; n++) {
            const el = document.createElement('option');
            el.value = String(n);
            el.textContent = `${n} / 12`;
            if (String(targetRating) === String(n)) {
              el.selected = true;
            }
            ratingSelect.appendChild(el);
          }
          const num = parseInt(targetRating, 10);
          if (isNaN(num) || num < 0 || num > 12) {
            ratingSelect.value = '10';
          }
        }
        syncBadges();
      }

      // Initial populate
      rebuildRatingDropdown(curReg, curRating);

      // React to regulation change
      regSelect.addEventListener('change', () => {
        rebuildRatingDropdown(regSelect.value, ratingSelect.value);
      });

      ratingSelect.addEventListener('change', syncBadges);
      recSelect.addEventListener('change', syncBadges);
      dcNameInput.addEventListener('input', syncBadges);
    }

    container.appendChild(card);
  }
}
