// Part-Time Research Scholar Tracking System - Configuration, Keys & Shared State
export const STORAGE_KEY = 'pt_rs_scholar_tracking_data';
export const PROFILES_KEY = 'pt_rs_scholar_master_profiles';
export const AUTH_KEY = 'pt_rs_admin_logged_in';

// API Base URL (empty for same-origin HTTP/Express/Vercel serverless, null for local file fallback)
export const API_BASE = window.location.protocol.startsWith('http') ? '' : null;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: window.__SUPABASE_URL__ || localStorage.getItem('pt_supabase_url') || '',
  anonKey: window.__SUPABASE_ANON_KEY__ || localStorage.getItem('pt_supabase_anon_key') || ''
};

// Reactive Shared App State
export const state = {
  scholars: [],
  masterProfiles: {},
  masterProfilesList: [],
  activeTrackingView: 'submitted', // 'submitted' | 'defaulters' | 'profiles'
  activeTrackingMonth: '',
  defaultersList: []
};

// DOM References Cache
export const DOM = {
  // Routing, Header & Admin Login Modal
  headerMainTitle: document.getElementById('headerMainTitle'),
  headerSubTitle: document.getElementById('headerSubTitle'),
  btnOpenAdminPortal: document.getElementById('btnOpenAdminPortal'),
  adminLoginModal: document.getElementById('adminLoginModal'),
  btnCloseAdminLogin: document.getElementById('btnCloseAdminLogin'),
  btnCancelAdminLogin: document.getElementById('btnCancelAdminLogin'),
  routeScholarForm: document.getElementById('routeScholarForm'),
  routeAdminDashboard: document.getElementById('routeAdminDashboard'),

  // Admin Authentication
  adminLoginForm: document.getElementById('adminLoginForm'),
  adminUsernameInput: document.getElementById('adminUsername'),
  adminPasswordInput: document.getElementById('adminPassword'),
  loginErrorMessage: document.getElementById('loginErrorMessage'),

  // Admin Dashboard Key Metrics
  statTotalScholars: document.getElementById('statTotalScholars'),
  statRATypeSubtext: document.getElementById('statRATypeSubtext'),
  statTotalJournals: document.getElementById('statTotalJournals'),
  statJournalSubtext: document.getElementById('statJournalSubtext'),
  statTotalConferences: document.getElementById('statTotalConferences'),
  statConfSubtext: document.getElementById('statConfSubtext'),
  statTotalForgetThumbs: document.getElementById('statTotalForgetThumbs'),
  statTotalFDPs: document.getElementById('statTotalFDPs'),
  statTotalLeaves: document.getElementById('statTotalLeaves'),
  statPreSynopsisAttended: document.getElementById('statPreSynopsisAttended'),
  statPreThesisColloquium: document.getElementById('statPreThesisColloquium'),
  statRecPreSynopsis: document.getElementById('statRecPreSynopsis'),

  // Central Tracking & Defaulter Monitor
  centralTrackingCard: document.getElementById('centralTrackingCard'),
  trackingMonthSelect: document.getElementById('trackingMonthSelect'),
  metricTotalEnrolled: document.getElementById('metricTotalEnrolled'),
  metricSubmittedCount: document.getElementById('metricSubmittedCount'),
  metricSubmittedRate: document.getElementById('metricSubmittedRate'),
  metricDefaultersCount: document.getElementById('metricDefaultersCount'),
  metricDefaultersRate: document.getElementById('metricDefaultersRate'),
  tabViewSubmitted: document.getElementById('tabViewSubmitted'),
  tabViewDefaulters: document.getElementById('tabViewDefaulters'),
  tabViewAllProfiles: document.getElementById('tabViewAllProfiles'),
  badgeSubmittedCount: document.getElementById('badgeSubmittedCount'),
  badgeDefaultersCount: document.getElementById('badgeDefaultersCount'),
  badgeAllProfilesCount: document.getElementById('badgeAllProfilesCount'),
  btnExportDefaultersCSV: document.getElementById('btnExportDefaultersCSV'),

  // Records Table
  recordsTableHead: document.getElementById('recordsTableHead'),
  recordsTableBody: document.getElementById('recordsTableBody'),
  emptyState: document.getElementById('emptyState'),
  emptyStateTitle: document.getElementById('emptyStateTitle'),
  emptyStateMessage: document.getElementById('emptyStateMessage'),

  // Filters & Search
  searchInput: document.getElementById('searchInput'),
  filterRAType: document.getElementById('filterRAType'),
  filterDepartment: document.getElementById('filterDepartment'),
  filterMonth: document.getElementById('filterMonth'),
  btnResetFilters: document.getElementById('btnResetFilters'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnExportCSV: document.getElementById('btnExportCSV'),

  // Admin Add/Edit Modal
  scholarModal: document.getElementById('scholarModal'),
  scholarForm: document.getElementById('scholarForm'),
  modalTitle: document.getElementById('modalTitle'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),

  recordIdInput: document.getElementById('recordId'),
  regNoInput: document.getElementById('regNo'),
  scholarNameInput: document.getElementById('scholarName'),
  guideNameInput: document.getElementById('guideName'),
  departmentInput: document.getElementById('department'),
  raTypeInput: document.getElementById('raType'),
  bankNameInput: document.getElementById('bankName'),
  bankAccountNoInput: document.getElementById('bankAccountNo'),
  ifscCodeInput: document.getElementById('ifscCode'),
  dateOfJoiningInput: document.getElementById('dateOfJoining'),
  endOfRAInput: document.getElementById('endOfRA'),
  adminRemainingTenureText: document.getElementById('adminRemainingTenureText'),
  scholarContactInput: document.getElementById('scholarContact'),
  supervisorContactInput: document.getElementById('supervisorContact'),

  currentMonthInput: document.getElementById('currentMonth'),
  forgetThumbsInput: document.getElementById('forgetThumbs'),
  coursesCompletedInput: document.getElementById('coursesCompleted'),
  courseItemsContainer: document.getElementById('courseItemsContainer'),
  leavesTakenInput: document.getElementById('leavesTaken'),
  avgSpentStayedInput: document.getElementById('avgSpentStayed'),
  academicLoadInput: document.getElementById('academicLoad'),

  journalCountInput: document.getElementById('journalCount'),
  journalItemsContainer: document.getElementById('journalItemsContainer'),
  conferenceCountInput: document.getElementById('conferenceCount'),
  conferenceItemsContainer: document.getElementById('conferenceItemsContainer'),
  fdpCountInput: document.getElementById('fdpCount'),
  fdpItemsContainer: document.getElementById('fdpItemsContainer'),
  dcCountInput: document.getElementById('dcCount'),
  dcItemsContainer: document.getElementById('dcItemsContainer'),

  // Public Scholar Submission Portal
  publicScholarForm: document.getElementById('publicScholarForm'),
  portalRegNo: document.getElementById('portalRegNo'),
  btnCheckRegNo: document.getElementById('btnCheckRegNo'),
  portalLookupBanner: document.getElementById('portalLookupBanner'),
  portalLookupBannerText: document.getElementById('portalLookupBannerText'),
  portalFormBody: document.getElementById('portalFormBody'),

  // Scholar Registration Lookup & Mobile OTP Verification
  scholarVerifiedBanner: document.getElementById('scholarVerifiedBanner'),
  bannerScholarName: document.getElementById('bannerScholarName'),
  bannerScholarRegNo: document.getElementById('bannerScholarRegNo'),
  bannerScholarDept: document.getElementById('bannerScholarDept'),
  bannerScholarEmail: document.getElementById('bannerScholarEmail'),
  bannerScholarMobile: document.getElementById('bannerScholarMobile'),
  btnScholarLogout: document.getElementById('btnScholarLogout'),
  scholarRegGatekeeper: document.getElementById('scholarRegGatekeeper'),
  scholarOtpGatekeeper: document.getElementById('scholarRegGatekeeper'),
  portalRegNo: document.getElementById('portalRegNo'),
  portalMobile: document.getElementById('portalMobile'),
  btnSendScholarOtp: document.getElementById('btnSendScholarOtp'),
  scholarRegLookupMsg: document.getElementById('scholarRegLookupMsg'),
  scholarOtpStep1: document.getElementById('scholarOtpStep1'),
  scholarOtpStep2: document.getElementById('scholarOtpStep2'),
  scholarSentPhoneDisplay: document.getElementById('scholarSentPhoneDisplay'),
  inputScholarOtpCode: document.getElementById('inputScholarOtpCode'),
  scholarOtpTimerText: document.getElementById('scholarOtpTimerText'),
  scholarOtpVerifyErrorMsg: document.getElementById('scholarOtpVerifyErrorMsg'),
  btnVerifyScholarOtp: document.getElementById('btnVerifyScholarOtp'),
  btnResendScholarOtp: document.getElementById('btnResendScholarOtp'),
  btnChangeScholarCreds: document.getElementById('btnChangeScholarCreds'),
  portalStaticCardHeading: document.getElementById('portalStaticCardHeading'),
  btnToggleEditStatic: document.getElementById('btnToggleEditStatic'), // Deprecated/fallback
  btnContactRnd: document.getElementById('btnContactRnd'),
  btnContactRndText: document.getElementById('btnContactRndText'),
  portalLockStatusNotice: document.getElementById('portalLockStatusNotice'),

  portalScholarName: document.getElementById('portalScholarName'),
  portalGuideName: document.getElementById('portalGuideName'),
  portalDepartment: document.getElementById('portalDepartment'),
  portalRAType: document.getElementById('portalRAType'),
  portalBankName: document.getElementById('portalBankName'),
  portalBankAccountNo: document.getElementById('portalBankAccountNo'),
  portalIfscCode: document.getElementById('portalIfscCode'),
  portalDateOfJoining: document.getElementById('portalDateOfJoining'),
  portalEndOfRA: document.getElementById('portalEndOfRA'),
  portalRemainingTenureText: document.getElementById('portalRemainingTenureText'),
  portalScholarContact: document.getElementById('portalScholarContact'),
  portalSupervisorContact: document.getElementById('portalSupervisorContact'),

  badgeBankName: document.getElementById('badgeBankName'),
  badgeBankAccountNo: document.getElementById('badgeBankAccountNo'),
  badgeIfscCode: document.getElementById('badgeIfscCode'),
  badgeSupervisorContact: document.getElementById('badgeSupervisorContact'),

  // R&D Support Modal
  rndContactModal: document.getElementById('rndContactModal'),
  btnCloseRndModal: document.getElementById('btnCloseRndModal'),
  btnCloseRndFooter: document.getElementById('btnCloseRndFooter'),

  portalCurrentMonth: document.getElementById('portalCurrentMonth'),
  portalForgetThumbs: document.getElementById('portalForgetThumbs'),
  portalLeavesTaken: document.getElementById('portalLeavesTaken'),
  portalAvgSpentStayed: document.getElementById('portalAvgSpentStayed'),
  portalAcademicLoad: document.getElementById('portalAcademicLoad'),
  portalCoursesCompleted: document.getElementById('portalCoursesCompleted'),
  portalCoursesContainer: document.getElementById('portalCoursesContainer'),

  portalJournalCount: document.getElementById('portalJournalCount'),
  portalJournalContainer: document.getElementById('portalJournalContainer'),
  portalConferenceCount: document.getElementById('portalConferenceCount'),
  portalConferenceContainer: document.getElementById('portalConferenceContainer'),
  portalFdpCount: document.getElementById('portalFdpCount'),
  portalFdpContainer: document.getElementById('portalFdpContainer'),
  portalDcCount: document.getElementById('portalDcCount'),
  portalDcContainer: document.getElementById('portalDcContainer'),
  btnResetPortalForm: document.getElementById('btnResetPortalForm'),

  // Report Modal
  viewReportModal: document.getElementById('viewReportModal'),
  reportModalContent: document.getElementById('reportModalContent'),
  btnCloseReportModal: document.getElementById('btnCloseReportModal'),
  btnCloseReportFooter: document.getElementById('btnCloseReportFooter'),
  btnPrintReport: document.getElementById('btnPrintReport'),

  // Scholar History & Duplicate Alert Elements
  btnScholarHistory: document.getElementById('btnScholarHistory'),
  scholarHistoryBadge: document.getElementById('scholarHistoryBadge'),
  scholarHistoryModal: document.getElementById('scholarHistoryModal'),
  scholarHistoryTitle: document.getElementById('scholarHistoryTitle'),
  scholarHistorySubtitle: document.getElementById('scholarHistorySubtitle'),
  btnCloseScholarHistory: document.getElementById('btnCloseScholarHistory'),
  btnCloseScholarHistoryFooter: document.getElementById('btnCloseScholarHistoryFooter'),
  scholarHistoryEmpty: document.getElementById('scholarHistoryEmpty'),
  scholarHistoryList: document.getElementById('scholarHistoryList'),

  toastContainer: document.getElementById('toastContainer')
};
