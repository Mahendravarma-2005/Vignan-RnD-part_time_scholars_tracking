// Research Scholar Tracking System - Main Application Orchestrator
import { DOM, AUTH_KEY, STORAGE_KEY, PROFILES_KEY, state } from './js/config.js';
import { updateRemainingTenureDisplay, showToast } from './js/utils.js';
import { fetchAllScholars, fetchProfileByRegNo, adminLoginAPI, fetchAllProfilesAPI } from './js/api.js';
import { updateDynamicCards } from './js/dynamicCards.js';
import { handleRegNoLookup, handlePortalFormSubmit, resetPortalForm, setPortalStaticFieldsReadOnly, initScholarAuth } from './js/portal.js';
import {
  render,
  openModalForNew,
  openModalForEdit,
  closeModal,
  handleAdminFormSubmit,
  deleteRecord,
  populateMonthFilterOptions,
  exportToCSV,
  exportDefaultersToCSV,
  computeMonthlyTracking
} from './js/admin.js';
import { viewReport, closeReportModal, printCurrentReport } from './js/report.js';

// Admin Modal & Authentication Handling (Unified Central Super Admin SSO)
export function isAdminAuthenticated() {
  // Directly authenticated via Central Landing Portal Super Admin SSO
  return true;
}

export function openAdminLoginModal() {
  // No separate login page required - directly access admin dashboard
  showAdminDashboardPage();
}

export function closeAdminLoginModal() {
  if (!DOM.adminLoginModal) return;
  DOM.adminLoginModal.classList.remove('active');
  if (!document.querySelector('.modal-overlay.active')) {
    document.body.classList.remove('modal-open');
  }
}

export function handleAdminLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem('pt_rs_admin_user');
  showToast('Returning to Central R&D Portal...', 'info');
  setTimeout(() => {
    window.location.href = '/';
  }, 400);
}

export function showScholarPage() {
  closeAdminLoginModal();
  if (DOM.routeScholarForm) DOM.routeScholarForm.style.display = 'block';
  if (DOM.routeAdminDashboard) DOM.routeAdminDashboard.style.display = 'none';
  if (DOM.btnOpenAdminPortal) DOM.btnOpenAdminPortal.style.display = 'inline-flex';
  if (DOM.headerMainTitle) DOM.headerMainTitle.textContent = 'Part Time Research Scholar progress Tracking Portal';
  if (DOM.headerSubTitle) DOM.headerSubTitle.textContent = 'Part-Time Monthly Academic, Attendance & Publication Progress Monitoring';
  if (window.location.hash === '#admin' || window.location.hash === '#/admin') {
    if (window.history && window.history.pushState) {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
  }
}

export function showAdminDashboardPage() {
  closeAdminLoginModal();
  if (DOM.routeScholarForm) DOM.routeScholarForm.style.display = 'none';
  if (DOM.routeAdminDashboard) DOM.routeAdminDashboard.style.display = 'block';
  if (DOM.btnOpenAdminPortal) DOM.btnOpenAdminPortal.style.display = 'none';
  if (DOM.headerMainTitle) DOM.headerMainTitle.textContent = 'Admin Portal: Part-Time Scholar Tracking';
  if (DOM.headerSubTitle) DOM.headerSubTitle.innerHTML = 'Dean R&D Administrative Dashboard &bull; Part-Time Scholars &bull; <span class="admin-badge-indicator">Super Admin SSO Active</span>';
  if (window.location.hash !== '#admin') {
    window.location.hash = '#admin';
  }
  render();
}

export function openAdminPortal() {
  showAdminDashboardPage();
}

function handleRouteChange() {
  const hash = window.location.hash || '';
  if (hash === '#admin' || hash === '#/admin') {
    showAdminDashboardPage();
  } else {
    showScholarPage();
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Admin Portal Trigger (from Header)
  if (DOM.btnOpenAdminPortal) {
    DOM.btnOpenAdminPortal.addEventListener('click', () => {
      openAdminPortal();
    });
  }

  // Admin Login Modal Controls
  if (DOM.btnCloseAdminLogin) {
    DOM.btnCloseAdminLogin.addEventListener('click', () => {
      closeAdminLoginModal();
    });
  }

  if (DOM.btnCancelAdminLogin) {
    DOM.btnCancelAdminLogin.addEventListener('click', () => {
      closeAdminLoginModal();
    });
  }

  if (DOM.adminLoginModal) {
    DOM.adminLoginModal.addEventListener('click', (e) => {
      if (e.target === DOM.adminLoginModal) {
        closeAdminLoginModal();
      }
    });
  }

  // Global Escape key handler for all modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.scholarModal && DOM.scholarModal.classList.contains('active')) {
        closeModal();
      } else if (DOM.viewReportModal && DOM.viewReportModal.classList.contains('active')) {
        closeReportModal();
      } else if (DOM.scholarHistoryModal && DOM.scholarHistoryModal.classList.contains('active')) {
        DOM.scholarHistoryModal.classList.remove('active');
      } else if (DOM.rndContactModal && DOM.rndContactModal.classList.contains('active')) {
        DOM.rndContactModal.classList.remove('active');
        if (!document.querySelector('.modal-overlay.active')) document.body.classList.remove('modal-open');
      } else if (DOM.adminLoginModal && DOM.adminLoginModal.classList.contains('active')) {
        closeAdminLoginModal();
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      if (window.location.hash === '#admin' || window.location.hash === '#/admin') {
        showScholarPage();
      } else {
        showAdminDashboardPage();
      }
    }
  });

  // Admin Login
  if (DOM.adminLoginForm) {
    DOM.adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = DOM.adminUsernameInput.value.trim();
      const password = DOM.adminPasswordInput.value;

      const ok = await adminLoginAPI(username, password);
      if (ok) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        if (DOM.loginErrorMessage) DOM.loginErrorMessage.style.display = 'none';
        showToast('Welcome, Administrator!');
        showAdminDashboardPage();
      } else {
        if (DOM.loginErrorMessage) DOM.loginErrorMessage.style.display = 'block';
        if (DOM.adminPasswordInput) DOM.adminPasswordInput.select();
      }
    });
  }

  // Scholar University Outlook OTP Authentication setup
  initScholarAuth();

  // Admin Modal Reg No Lookup
  DOM.regNoInput.addEventListener('change', async () => {
    const matched = await fetchProfileByRegNo(DOM.regNoInput.value.trim());
    if (matched && !DOM.recordIdInput.value) {
      DOM.scholarNameInput.value = matched.scholarName || '';
      DOM.guideNameInput.value = matched.guideName || '';
      DOM.departmentInput.value = matched.department || '';
      DOM.raTypeInput.value = matched.raType || 'ERA';
      DOM.bankNameInput.value = matched.bankName || 'State Bank of India';
      DOM.bankAccountNoInput.value = matched.bankAccountNo || '';
      DOM.ifscCodeInput.value = matched.ifscCode || 'SBIN0001234';
      DOM.dateOfJoiningInput.value = matched.dateOfJoining || '';
      let finalAdminEnd = matched.endOfRA || '';
      if (!finalAdminEnd) {
        if (matched.dateOfJoining) {
          const d = new Date(matched.dateOfJoining);
          d.setFullYear(d.getFullYear() + 3);
          d.setDate(d.getDate() - 1);
          finalAdminEnd = d.toISOString().split('T')[0];
        } else {
          const m = DOM.regNoInput.value.trim().match(/^(\d{2})/);
          if (m) {
            const yr = 2000 + parseInt(m[1], 10);
            finalAdminEnd = `${yr + 3}-07-31`;
          }
        }
      }
      DOM.endOfRAInput.value = finalAdminEnd;
      updateRemainingTenureDisplay(DOM.adminRemainingTenureText, finalAdminEnd);
      DOM.scholarContactInput.value = matched.scholarContact || '';
      DOM.supervisorContactInput.value = matched.supervisorContact || '';

      const numCourses = matched.coursesCompleted || (matched.courseDetails ? matched.courseDetails.length : 0);
      DOM.coursesCompletedInput.value = numCourses;
      if (matched.courseDetails && matched.courseDetails.length > 0) {
        updateDynamicCards(DOM.courseItemsContainer, numCourses, 'course', matched.courseDetails);
      } else if (numCourses > 0) {
        updateDynamicCards(DOM.courseItemsContainer, numCourses, 'course');
      } else {
        DOM.courseItemsContainer.innerHTML = '';
      }

      showToast(`Loaded existing profile for ${matched.scholarName}`);
    }
  });

  // Remaining Service Period listeners
  if (DOM.portalEndOfRA) {
    DOM.portalEndOfRA.addEventListener('input', () => updateRemainingTenureDisplay(DOM.portalRemainingTenureText, DOM.portalEndOfRA.value));
    DOM.portalEndOfRA.addEventListener('change', () => updateRemainingTenureDisplay(DOM.portalRemainingTenureText, DOM.portalEndOfRA.value));
  }
  if (DOM.endOfRAInput) {
    DOM.endOfRAInput.addEventListener('input', () => updateRemainingTenureDisplay(DOM.adminRemainingTenureText, DOM.endOfRAInput.value));
    DOM.endOfRAInput.addEventListener('change', () => updateRemainingTenureDisplay(DOM.adminRemainingTenureText, DOM.endOfRAInput.value));
  }

  if (DOM.portalDateOfJoining) {
    DOM.portalDateOfJoining.addEventListener('change', () => {
      if (DOM.portalEndOfRA && DOM.portalDateOfJoining.value && !DOM.portalEndOfRA.value) {
        const d = new Date(DOM.portalDateOfJoining.value);
        d.setFullYear(d.getFullYear() + 3);
        d.setDate(d.getDate() - 1);
        DOM.portalEndOfRA.value = d.toISOString().split('T')[0];
        updateRemainingTenureDisplay(DOM.portalRemainingTenureText, DOM.portalEndOfRA.value);
      }
    });
  }

  DOM.dateOfJoiningInput.addEventListener('change', () => {
    if (DOM.dateOfJoiningInput.value && !DOM.endOfRAInput.value) {
      const d = new Date(DOM.dateOfJoiningInput.value);
      d.setFullYear(d.getFullYear() + 3);
      d.setDate(d.getDate() - 1);
      DOM.endOfRAInput.value = d.toISOString().split('T')[0];
      updateRemainingTenureDisplay(DOM.adminRemainingTenureText, DOM.endOfRAInput.value);
    }
  });

  // R&D Contact Support Modal Handlers
  function openRndModal() {
    if (DOM.rndContactModal) DOM.rndContactModal.classList.add('active');
  }
  function closeRndModal() {
    if (DOM.rndContactModal) DOM.rndContactModal.classList.remove('active');
  }

  if (DOM.btnContactRnd) {
    DOM.btnContactRnd.addEventListener('click', openRndModal);
  }
  if (DOM.btnCloseRndModal) {
    DOM.btnCloseRndModal.addEventListener('click', closeRndModal);
  }
  if (DOM.btnCloseRndFooter) {
    DOM.btnCloseRndFooter.addEventListener('click', closeRndModal);
  }
  if (DOM.rndContactModal) {
    DOM.rndContactModal.addEventListener('click', (e) => {
      if (e.target === DOM.rndContactModal) closeRndModal();
    });
  }

  // Delegated click for link inside lock status notice
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'linkOpenRndHelp' || e.target.classList.contains('link-open-rnd'))) {
      e.preventDefault();
      openRndModal();
    }
  });

  if (DOM.btnToggleEditStatic) {
    DOM.btnToggleEditStatic.addEventListener('click', () => {
      showToast('Profile and bank credentials are locked. Contact R&D Office to request changes.', 'info');
      openRndModal();
    });
  }

  // Dynamic field counts for Scholar Portal Form
  DOM.portalCoursesCompleted.addEventListener('input', () => updateDynamicCards(DOM.portalCoursesContainer, DOM.portalCoursesCompleted.value, 'course'));
  DOM.portalCoursesCompleted.addEventListener('change', () => updateDynamicCards(DOM.portalCoursesContainer, DOM.portalCoursesCompleted.value, 'course'));
  DOM.portalJournalCount.addEventListener('input', () => updateDynamicCards(DOM.portalJournalContainer, DOM.portalJournalCount.value, 'journal'));
  DOM.portalConferenceCount.addEventListener('input', () => updateDynamicCards(DOM.portalConferenceContainer, DOM.portalConferenceCount.value, 'conf'));
  DOM.portalFdpCount.addEventListener('input', () => updateDynamicCards(DOM.portalFdpContainer, DOM.portalFdpCount.value, 'event'));
  DOM.portalDcCount.addEventListener('input', () => updateDynamicCards(DOM.portalDcContainer, DOM.portalDcCount.value, 'dc'));

  // Scholar Portal Form Submit & Reset
  DOM.publicScholarForm.addEventListener('submit', handlePortalFormSubmit);
  DOM.btnResetPortalForm.addEventListener('click', resetPortalForm);

  // Admin Modal toggles
  DOM.btnOpenAddModal.addEventListener('click', () => openModalForNew());
  DOM.btnCloseModal.addEventListener('click', closeModal);
  DOM.btnCancelModal.addEventListener('click', closeModal);
  DOM.scholarModal.addEventListener('click', (e) => {
    if (e.target === DOM.scholarModal) closeModal();
  });

  // Dynamic field counts for Admin Modal Form
  DOM.coursesCompletedInput.addEventListener('input', () => updateDynamicCards(DOM.courseItemsContainer, DOM.coursesCompletedInput.value, 'course'));
  DOM.coursesCompletedInput.addEventListener('change', () => updateDynamicCards(DOM.courseItemsContainer, DOM.coursesCompletedInput.value, 'course'));
  DOM.journalCountInput.addEventListener('input', () => updateDynamicCards(DOM.journalItemsContainer, DOM.journalCountInput.value, 'journal'));
  DOM.conferenceCountInput.addEventListener('input', () => updateDynamicCards(DOM.conferenceItemsContainer, DOM.conferenceCountInput.value, 'conf'));
  DOM.fdpCountInput.addEventListener('input', () => updateDynamicCards(DOM.fdpItemsContainer, DOM.fdpCountInput.value, 'event'));
  DOM.dcCountInput.addEventListener('input', () => updateDynamicCards(DOM.dcItemsContainer, DOM.dcCountInput.value, 'dc'));

  // Admin Form submit
  DOM.scholarForm.addEventListener('submit', handleAdminFormSubmit);

  // Report Modal
  DOM.viewReportModal.addEventListener('click', (e) => {
    if (e.target === DOM.viewReportModal) closeReportModal();
  });
  DOM.btnCloseReportModal.addEventListener('click', closeReportModal);
  DOM.btnCloseReportFooter.addEventListener('click', closeReportModal);
  DOM.btnPrintReport.addEventListener('click', printCurrentReport);

  // Search & Filters
  DOM.searchInput.addEventListener('input', () => render());
  DOM.filterRAType.addEventListener('change', () => render());
  DOM.filterDepartment.addEventListener('change', () => render());
  DOM.filterMonth.addEventListener('change', () => render());
  DOM.btnResetFilters.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.filterRAType.value = '';
    DOM.filterDepartment.value = '';
    DOM.filterMonth.value = '';
    render();
  });

  // Export CSV
  DOM.btnExportCSV.addEventListener('click', exportToCSV);

  // Central Monthly Submission & Defaulter Tracking Controls
  if (DOM.tabViewSubmitted) {
    DOM.tabViewSubmitted.addEventListener('click', () => {
      state.activeTrackingView = 'submitted';
      render();
    });
  }

  if (DOM.tabViewDefaulters) {
    DOM.tabViewDefaulters.addEventListener('click', () => {
      state.activeTrackingView = 'defaulters';
      render();
    });
  }

  if (DOM.tabViewAllProfiles) {
    DOM.tabViewAllProfiles.addEventListener('click', () => {
      state.activeTrackingView = 'profiles';
      render();
    });
  }

  if (DOM.trackingMonthSelect) {
    DOM.trackingMonthSelect.addEventListener('change', () => {
      state.activeTrackingMonth = DOM.trackingMonthSelect.value;
      computeMonthlyTracking(state.activeTrackingMonth);
      render();
    });
  }

  if (DOM.btnExportDefaultersCSV) {
    DOM.btnExportDefaultersCSV.addEventListener('click', exportDefaultersToCSV);
  }

  // Routing
  window.addEventListener('hashchange', handleRouteChange);
}

// Global scope bindings for inline HTML handlers if any
window.viewReport = viewReport;
window.openModalForEdit = openModalForEdit;
window.deleteRecord = deleteRecord;
window.openAdminPortal = openAdminPortal;
window.showScholarPage = showScholarPage;
window.showAdminDashboardPage = showAdminDashboardPage;
window.openAdminLoginModal = openAdminLoginModal;
window.closeAdminLoginModal = closeAdminLoginModal;
window.handleAdminLogout = handleAdminLogout;
window.printCurrentReport = printCurrentReport;

// Application Boot
async function initApp() {
  setupEventListeners();
  handleRouteChange();
  await fetchAllProfilesAPI();
  await fetchAllScholars();
  populateMonthFilterOptions();
  if (isAdminAuthenticated()) {
    render();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
