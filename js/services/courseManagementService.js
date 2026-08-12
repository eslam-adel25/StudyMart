import { coursesData } from "../data/courses.js";
import { openCourseBuilder } from "./courseBuilderService.js";
import { showCustomAlert } from "../utils/helpers.js";
import { hideAllMainSections } from "./layoutService.js";
import { isTeacher } from "./permissionService.js";

let filterQuery = "";
let selectedStatusFilter = "all";

function getCourseStatus(c) {
  if (!c) return "published";
  return c.publishedStatus || "published";
}

/**
 * Main Teacher Course Management Dashboard View
 */
export function openCourseManagementDashboard() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه اللوحة مخصصة للمعلمين والمالك فقط.");
    return;
  }

  // Close any modal overlay
  const modal = document.getElementById("dashboardModal");
  if (modal) modal.classList.remove("show");

  // Hide other sections and show full page teacherManagementPage
  hideAllMainSections();
  const page = document.getElementById("teacherManagementPage");
  if (page) page.classList.remove("hidden");

  if (!window.location.hash.includes("teacher")) {
    window.location.hash = "#teacher/dashboard";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderManagementDashboardUI();
}

export function renderManagementDashboardUI() {
  const container = document.getElementById("teacherManagementContent") || document.getElementById("dashboardContent");
  if (!container) return;

  // Filter courses belonging to teacher or all initial demo courses
  const teacherCourses = coursesData.filter((c) => {
    const matchesSearch = !filterQuery || c.title.toLowerCase().includes(filterQuery.toLowerCase());
    const status = getCourseStatus(c);
    const matchesStatus =
      selectedStatusFilter === "all" ||
      (selectedStatusFilter === "published" && status === "published") ||
      (selectedStatusFilter === "draft" && status === "draft") ||
      (selectedStatusFilter === "archived" && status === "archived");
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalCourses = coursesData.length;
  const publishedCount = coursesData.filter((c) => getCourseStatus(c) === "published").length;
  const totalStudents = coursesData.reduce((acc, c) => acc + (Number(c.students) || 0), 0);
  const totalRev = coursesData.reduce((acc, c) => acc + ((Number(c.students) || 0) * (Number(c.price) || 0)), 0);

  container.innerHTML = `
    <div class="course-builder-container">
      
      <!-- MANAGEMENT HEADER -->
      <div class="management-header">
        <div class="management-title-group">
          <h2>🎓 لوحة إدارة الدورات التعليمية (Course Management)</h2>
          <p>قم بإنشاء وتعديل وإدارة جميع دوراتك التعليمية ومتابعة الإحصائيات والأداء.</p>
        </div>

        <button type="button" class="btn-create-course" onclick="openCourseBuilder(null)">
          <span>➕</span> إنشاء دورة جديدة (Course Builder)
        </button>
      </div>

      <!-- STATS CARDS GRID -->
      <div class="builder-stats-grid">
        <div class="builder-stat-card">
          <div class="builder-stat-icon">📚</div>
          <span class="builder-stat-val">${totalCourses}</span>
          <span class="builder-stat-lbl">إجمالي الدورات</span>
        </div>

        <div class="builder-stat-card">
          <div class="builder-stat-icon">🚀</div>
          <span class="builder-stat-val">${publishedCount}</span>
          <span class="builder-stat-lbl">الدورات المنشورة</span>
        </div>

        <div class="builder-stat-card">
          <div class="builder-stat-icon">👥</div>
          <span class="builder-stat-val">${totalStudents.toLocaleString()}</span>
          <span class="builder-stat-lbl">إجمالي الطلاب</span>
        </div>

        <div class="builder-stat-card">
          <div class="builder-stat-icon">💰</div>
          <span class="builder-stat-val">$${totalRev.toLocaleString()}</span>
          <span class="builder-stat-lbl">إجمالي الإيرادات</span>
        </div>
      </div>

      <!-- TABLE CONTROLS -->
      <div class="courses-table-controls">
        <div class="search-filter-group">
          <input type="text" class="builder-search-input" placeholder="🔍 ابحث عن دورة..." value="${filterQuery}" oninput="handleDashboardSearch(this.value)" />
          
          <select class="builder-select" onchange="handleDashboardStatusFilter(this.value)">
            <option value="all" ${selectedStatusFilter === 'all' ? 'selected' : ''}>جميع الحالات</option>
            <option value="published" ${selectedStatusFilter === 'published' ? 'selected' : ''}>منشورة فقط</option>
            <option value="draft" ${selectedStatusFilter === 'draft' ? 'selected' : ''}>مسودات فقط</option>
            <option value="archived" ${selectedStatusFilter === 'archived' ? 'selected' : ''}>مؤرشفة</option>
          </select>
        </div>
      </div>

      <!-- MANAGEMENT COURSES LIST -->
      <div class="courses-management-list">
        ${teacherCourses.length === 0 ? `<div style="text-align: center; padding: 40px; color: #64748b; background: var(--card-bg); border-radius: 14px;">لا توجد دورات تطابق البحث.</div>` : ''}
        
        ${teacherCourses.map((c) => {
          const status = getCourseStatus(c);
          const sectionsCount = c.sections ? c.sections.length : 1;
          const lessonsCount = c.lessons || (c.sections ? c.sections.reduce((acc, s) => acc + (s.lessons ? s.lessons.length : 0), 0) : 20);
          const revenue = (Number(c.students) || 0) * (Number(c.price) || 0);

          return `
            <div class="mgmt-course-card">
              <div class="mgmt-course-main">
                <img src="${c.image}" alt="${escapeHtml(c.title)}" class="mgmt-course-img" />
                <div class="mgmt-course-details">
                  <h4>${escapeHtml(c.title)}</h4>
                  <div class="mgmt-course-meta">
                    <span class="status-badge ${status}">${status === 'published' ? 'منشورة' : (status === 'archived' ? 'مؤرشفة' : 'مسودة')}</span>
                    <span>📂 ${c.category}</span>
                    <span>⏱️ ${c.duration || 10} ساعة</span>
                    <span>💰 $${c.price}</span>
                  </div>
                </div>
              </div>

              <div class="mgmt-course-stats">
                <div class="mgmt-stat-item">
                  <strong>${c.students || 0}</strong>
                  <span>طالب</span>
                </div>
                <div class="mgmt-stat-item">
                  <strong>${sectionsCount}</strong>
                  <span>أقسام</span>
                </div>
                <div class="mgmt-stat-item">
                  <strong>${lessonsCount}</strong>
                  <span>درس</span>
                </div>
                <div class="mgmt-stat-item">
                  <strong>⭐ ${c.rating || '5.0'}</strong>
                  <span>تقييم</span>
                </div>
                <div class="mgmt-stat-item">
                  <strong style="color: #16a34a;">$${revenue.toLocaleString()}</strong>
                  <span>أرباح</span>
                </div>
              </div>

              <div class="mgmt-course-actions">
                <button type="button" class="action-icon-btn action-more" onclick="showCourseMoreMenu(${c.id})" aria-label="المزيد من الخيارات" title="المزيد من الخيارات" data-tooltip="المزيد">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>

                <button type="button" class="action-icon-btn action-delete" onclick="deleteCourseFromMgmt(${c.id})" aria-label="حذف الدورة" title="حذف الدورة" data-tooltip="حذف الدورة">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>

                <button type="button" class="action-icon-btn action-stats" onclick="showCourseStatsModal(${c.id})" aria-label="إحصائيات الدورة" title="إحصائيات الدورة" data-tooltip="إحصائيات الدورة">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><rect x="18" y="8" width="3" height="10" rx="1"/><rect x="12" y="12" width="3" height="6" rx="1"/><rect x="6" y="15" width="3" height="3" rx="1"/></svg>
                </button>

                <button type="button" class="action-icon-btn action-preview" onclick="if(window.showCourseDetails) window.showCourseDetails(${c.id})" aria-label="معاينة الدورة كما يراها الطالب" title="معاينة الدورة كما يراها الطالب" data-tooltip="معاينة الدورة كما يراها الطالب">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                <button type="button" class="action-icon-btn action-edit" onclick="openCourseBuilder(${c.id})" aria-label="تعديل الدورة" title="تعديل الدورة" data-tooltip="تعديل الدورة">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

// Global Handlers
window.openCourseManagementDashboard = openCourseManagementDashboard;

window.showCourseMoreMenu = function (courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;

  // Ensure only one options modal exists at a time
  const oldMenu = document.getElementById("courseMoreMenuModal");
  if (oldMenu) oldMenu.remove();

  const isPublished = getCourseStatus(course) === "published";

  const overlay = document.createElement("div");
  overlay.id = "courseMoreMenuModal";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 360px; text-align: right; padding: 22px; border-radius: 18px; position: relative; background: var(--card-bg, #ffffff); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 12px; margin-bottom: 14px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a); display: flex; align-items: center; gap: 8px;">
          ⚙️ خيارات الدورة
        </h4>
        <button type="button" class="btn-close-modal" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#e2e8f0'; this.style.color='#0f172a';" onmouseout="this.style.background='var(--bg-muted, #f1f5f9)'; this.style.color='var(--text-secondary, #64748b)';" onclick="this.closest('.floating-modal-overlay').remove();">✕</button>
      </div>

      <div style="margin-bottom: 14px; padding: 10px 14px; background: var(--bg-subtle, #f8fafc); border-radius: 12px; border: 1px solid var(--border-color, #f1f5f9);">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary, #1e293b); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(course.title)}</div>
        <div style="font-size: 11px; color: var(--text-secondary, #64748b); margin-top: 4px;">الحالة الحالية: <span style="font-weight: 700; color: ${isPublished ? '#16a34a' : '#d97706'};">${isPublished ? 'منشورة' : 'مسودة'}</span></div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button type="button" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px;" onclick="toggleCoursePublish(${course.id}); this.closest('.floating-modal-overlay').remove();">
          🔄 ${isPublished ? 'إلغاء نشر الدورة (تحويل لمسودة)' : 'نشر الدورة الآن'}
        </button>

        <button type="button" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px;" onclick="duplicateCourse(${course.id}); this.closest('.floating-modal-overlay').remove();">
          📋 تكرار الدورة (إنشاء نسخة)
        </button>

        <button type="button" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px;" onclick="openCourseBuilder(${course.id}); this.closest('.floating-modal-overlay').remove();">
          ✏️ تعديل الدورة
        </button>

        <button type="button" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px;" onclick="showCourseStatsModal(${course.id}); this.closest('.floating-modal-overlay').remove();">
          📊 إحصائيات الدورة
        </button>

        <button type="button" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px;" onclick="if(window.showCourseDetails) window.showCourseDetails(${course.id}); this.closest('.floating-modal-overlay').remove();">
          👁️ معاينة الدورة
        </button>

        <button type="button" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px;" onclick="copyCourseLink(${course.id}); this.closest('.floating-modal-overlay').remove();">
          🔗 نسخ رابط الدورة
        </button>

        <button type="button" class="btn" style="justify-content: flex-start; gap: 10px; width: 100%; text-align: right; font-size: 13px; border-radius: 10px; padding: 10px 14px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" onclick="deleteCourseFromMgmt(${course.id}); this.closest('.floating-modal-overlay').remove();">
          🗑️ حذف الدورة
        </button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  const handleEsc = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);

  document.body.appendChild(overlay);
};

window.copyCourseLink = function (courseId) {
  const url = `${window.location.origin}${window.location.pathname}#course/${courseId}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      showCustomAlert("✅ تم نسخ رابط الدورة بنجاح!");
    }).catch(() => {
      showCustomAlert("✅ تم نسخ رابط الدورة: " + url);
    });
  } else {
    showCustomAlert("✅ تم نسخ رابط الدورة: " + url);
  }
};

window.handleDashboardSearch = function (val) {
  filterQuery = val;
  renderManagementDashboardUI();
};

window.handleDashboardStatusFilter = function (val) {
  selectedStatusFilter = val;
  renderManagementDashboardUI();
};

window.duplicateCourse = function (courseId) {
  const original = coursesData.find((c) => String(c.id) === String(courseId));
  if (!original) return;

  const clone = JSON.parse(JSON.stringify(original));
  clone.id = Date.now();
  clone.title = original.title + " (نسخة)";
  clone.students = 0;
  clone.publishedStatus = "draft";

  coursesData.unshift(clone);
  showCustomAlert("✅ تم تكرار الدورة بنجاح كمسودة جديدة!");
  renderManagementDashboardUI();
};

window.toggleCoursePublish = function (courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;

  const currentStatus = getCourseStatus(course);
  if (currentStatus === "published") {
    course.publishedStatus = "draft";
    showCustomAlert("تم تحويل الدورة إلى مسودة.");
  } else {
    course.publishedStatus = "published";
    showCustomAlert("🎉 تم نشر الدورة بنجاح!");
  }

  renderManagementDashboardUI();
};

window.deleteCourseFromMgmt = function (courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;

  if (confirm(`هل أنت تأكد من حذف الدورة "${course.title}"؟`)) {
    const idx = coursesData.findIndex((c) => String(c.id) === String(courseId));
    if (idx >= 0) {
      coursesData.splice(idx, 1);
      showCustomAlert("تم حذف الدورة بنجاح.");
      renderManagementDashboardUI();
    }
  }
};

window.showCourseStatsModal = function (courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;

  const oldStats = document.getElementById("courseStatsModalOverlay");
  if (oldStats) oldStats.remove();

  const stats = course.stats || {
    studentsCount: course.students || 120,
    viewsCount: 1450,
    totalRevenue: (course.students || 120) * (course.price || 50),
    completionRate: 85,
    avgRating: course.rating || "4.8",
    reviewsCount: 24,
    questionsCount: 8
  };

  const overlay = document.createElement("div");
  overlay.id = "courseStatsModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 650px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="margin: 0; color: var(--primary-color);">📊 إحصائيات الدورة: ${escapeHtml(course.title)}</h3>
        <button type="button" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#e2e8f0'; this.style.color='#0f172a';" onmouseout="this.style.background='var(--bg-muted, #f1f5f9)'; this.style.color='var(--text-secondary, #64748b)';" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>

      <div class="builder-stats-grid" style="margin-bottom: 20px;">
        <div class="builder-stat-card">
          <span class="builder-stat-val">${stats.studentsCount}</span>
          <span class="builder-stat-lbl">إجمالي الطلاب</span>
        </div>
        <div class="builder-stat-card">
          <span class="builder-stat-val">${stats.viewsCount}</span>
          <span class="builder-stat-lbl">المشاهدات</span>
        </div>
        <div class="builder-stat-card">
          <span class="builder-stat-val">$${stats.totalRevenue.toLocaleString()}</span>
          <span class="builder-stat-lbl">الإيرادات</span>
        </div>
        <div class="builder-stat-card">
          <span class="builder-stat-val">${stats.completionRate}%</span>
          <span class="builder-stat-lbl">نسبة الإكمال</span>
        </div>
      </div>

      <div style="padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 8px 0; font-size: 15px;">⭐ متوسط التقييمات: ${stats.avgRating} / 5</h4>
        <p style="margin: 0; font-size: 13px; color: #64748b;">إجمالي المراجعين: ${stats.reviewsCount} طالب | الأسئلة المفتوحة: ${stats.questionsCount}</p>
      </div>

      <div style="margin-top: 20px; text-align: left;">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  const handleEsc = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);

  document.body.appendChild(overlay);
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

