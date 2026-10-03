// Research Scholar Tracking System - Utility Functions
import { DOM } from './config.js';

// Calculate remaining service period / tenure from End of Research Assistantship
export function calculateRemainingTenure(endOfRAStr, dateOfJoiningStr) {
  if (!endOfRAStr) {
    if (dateOfJoiningStr) {
      const d = new Date(dateOfJoiningStr);
      d.setFullYear(d.getFullYear() + 3);
      d.setDate(d.getDate() - 1);
      endOfRAStr = d.toISOString().split('T')[0];
    } else {
      return '3 yrs remaining';
    }
  }
  const end = new Date(endOfRAStr);
  if (isNaN(end.getTime())) return 'Invalid date';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  if (endDate < today) {
    const diffTime = today - endDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `Service Completed (${diffDays} days ago)`;
  }

  let years = endDate.getFullYear() - today.getFullYear();
  let months = endDate.getMonth() - today.getMonth();
  let days = endDate.getDate() - today.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);

  return `${parts.join(', ')} remaining`;
}

export function updateRemainingTenureDisplay(textEl, dateStr) {
  if (!textEl) return;
  const tenureText = calculateRemainingTenure(dateStr);
  textEl.textContent = tenureText;
  const parentBox = textEl.closest('#portalRemainingTenure, #adminRemainingTenure');
  if (parentBox) {
    if (tenureText.includes('Completed')) {
      parentBox.style.background = '#fef2f2';
      parentBox.style.borderColor = '#fecdd3';
      parentBox.style.color = '#991b1b';
    } else {
      parentBox.style.background = '#f0fdf4';
      parentBox.style.borderColor = '#bbf7d0';
      parentBox.style.color = '#166534';
    }
  }
}

export function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonth(ymString) {
  if (!ymString) return '-';
  const parts = ymString.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[monthIndex] || parts[1]} ${year}`;
  }
  return ymString;
}

export function formatDate(dString) {
  if (!dString) return '-';
  const d = new Date(dString);
  if (isNaN(d.getTime())) return dString;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function evaluateCourseResult(courseType, scoreVal) {
  if (scoreVal === '' || scoreVal === null || scoreVal === undefined) return { passed: false, text: '' };
  const num = parseFloat(scoreVal);
  if (isNaN(num)) return { passed: false, text: '' };

  const isNptel = String(courseType || '').toUpperCase() === 'NPTEL';
  // If entered as percentage (0-100) or 10-point scale (0-10)
  // NPTEL: more than 55% (>= 55% or >= 5.5) -> Pass
  // Internal: more than 60% (>= 60% or >= 6.0) -> Pass
  const threshold = isNptel ? 55 : 60;
  const thresholdScale10 = isNptel ? 5.5 : 6.0;
  const passed = num > 10 ? num >= threshold : num >= thresholdScale10;
  return { passed, text: passed ? 'Pass' : 'Fail' };
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'Published':
    case 'Accepted':
      return 'badge-green';
    case 'Communicated':
      return 'badge-blue';
    case 'Revised':
    case 'Received':
      return 'badge-purple';
    case 'Under Review':
      return 'badge-amber';
    default:
      return 'badge-blue';
  }
}

export function cleanCSV(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
}

export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function showToast(message, type = 'success') {
  if (!DOM.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') {
    toast.style.borderLeftColor = 'var(--accent-rose)';
  } else if (type === 'info') {
    toast.style.borderLeftColor = 'var(--primary)';
  }

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${type === 'error' ? '#e11d48' : '#059669'}" stroke-width="2">
      ${type === 'error'
      ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
      : '<polyline points="20 6 9 17 4 12"></polyline>'}
    </svg>
    <span>${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
