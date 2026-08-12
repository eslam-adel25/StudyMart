import { 
  getStudentsList, 
  getStudentById, 
  addPrivateNoteToStudent, 
  toggleStudentBlock, 
  deleteStudentFromList, 
  generateStudentCertificate, 
  sendStudentMessage,
  editStudentMessage,
  togglePinStudentMessage,
  deleteStudentMessage,
  ensureStudentMessageIds
} from "../data/studentsData.js";
import { getConversations, saveConversations } from "../data/messagesData.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { showCustomAlert } from "../utils/helpers.js";
import { showConfirmDialog, showInputDialog, showSuccessToast, showErrorToast } from "./notificationService.js";
import { hideAllMainSections } from "./layoutService.js";
import { isTeacher } from "./permissionService.js";

// Active State
let studentState = {
  searchQuery: "",
  courseFilter: "all",
  bookFilter: "all",
  countryFilter: "all",
  purchaseDateFilter: "all",
  registrationDateFilter: "all",
  progressFilter: "all",
  statusFilter: "all",
  sortBy: "name_asc",
  currentPage: 1,
  pageSize: 8
};

/**
 * Global document event listeners for 3-dots action menu dropdowns
 */
if (typeof window !== "undefined" && !window._studentActionMenuListenersAttached) {
  window._studentActionMenuListenersAttached = true;
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".crm-action-dropdown-wrapper")) {
      closeAllStudentActionMenus();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllStudentActionMenus();
    }
  });
}

/**
 * Filter students list according to active state
 */
export function getFilteredStudents() {
  let list = [...getStudentsList()];

  // Search
  if (studentState.searchQuery.trim()) {
    const q = studentState.searchQuery.toLowerCase().trim();
    list = list.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.purchasedItem.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q))
    );
  }

  // Course Filter
  if (studentState.courseFilter !== "all") {
    list = list.filter(s => 
      (s.type === "Course" && String(s.purchasedItemId) === String(studentState.courseFilter)) ||
      (s.purchasedCourses && s.purchasedCourses.some(c => String(c.id) === String(studentState.courseFilter)))
    );
  }

  // Book Filter
  if (studentState.bookFilter !== "all") {
    list = list.filter(s => 
      (s.type === "Book" && String(s.purchasedItemId) === String(studentState.bookFilter)) ||
      (s.purchasedBooks && s.purchasedBooks.some(b => String(b.id) === String(studentState.bookFilter)))
    );
  }

  // Country Filter
  if (studentState.countryFilter !== "all") {
    list = list.filter(s => s.country === studentState.countryFilter);
  }

  // Status Filter
  if (studentState.statusFilter !== "all") {
    list = list.filter(s => s.status === studentState.statusFilter);
  }

  // Progress Filter
  if (studentState.progressFilter !== "all") {
    if (studentState.progressFilter === "p0_25") list = list.filter(s => s.progress >= 0 && s.progress <= 25);
    else if (studentState.progressFilter === "p26_50") list = list.filter(s => s.progress >= 26 && s.progress <= 50);
    else if (studentState.progressFilter === "p51_75") list = list.filter(s => s.progress >= 51 && s.progress <= 75);
    else if (studentState.progressFilter === "p76_100") list = list.filter(s => s.progress >= 76 && s.progress <= 100);
  }

  // Sorting
  if (studentState.sortBy === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  else if (studentState.sortBy === "name_desc") list.sort((a, b) => b.name.localeCompare(a.name, "ar"));
  else if (studentState.sortBy === "progress_desc") list.sort((a, b) => b.progress - a.progress);
  else if (studentState.sortBy === "progress_asc") list.sort((a, b) => a.progress - b.progress);
  else if (studentState.sortBy === "date_desc") list.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

  return list;
}

/**
 * Open Main Enrolled Students Page
 */
export function openEnrolledStudentsPage(forceFull = false) {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين والمالك فقط.");
    return;
  }

  hideAllMainSections();
  const page = document.getElementById("enrolledStudentsPage");
  if (page) page.classList.remove("hidden");

  if (!window.location.hash.includes("teacher/students")) {
    window.location.hash = "#teacher/students";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderEnrolledStudentsUI(forceFull);
}

/**
 * Action Menu Handlers for 3-Dots Compact Menu
 */
export function toggleStudentActionMenu(e, studentId) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const targetMenu = document.getElementById(`studentActionMenu-${studentId}`);
  if (!targetMenu) return;

  const isAlreadyOpen = !targetMenu.classList.contains("hidden");

  closeAllStudentActionMenus();

  if (!isAlreadyOpen) {
    targetMenu.classList.remove("hidden");
    const wrapper = targetMenu.closest(".crm-action-dropdown-wrapper");
    const btn = wrapper ? wrapper.querySelector(".crm-action-dots-btn") : null;
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
}

export function closeAllStudentActionMenus() {
  const openMenus = document.querySelectorAll(".crm-action-menu:not(.hidden)");
  openMenus.forEach(menu => {
    menu.classList.add("hidden");
    const wrapper = menu.closest(".crm-action-dropdown-wrapper");
    const btn = wrapper ? wrapper.querySelector(".crm-action-dots-btn") : null;
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
}

export function handleStudentMenuAction(e, studentId, action) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  closeAllStudentActionMenus();

  if (action === "profile") {
    openStudentDetailPage(studentId);
  } else if (action === "note") {
    promptAddNote(studentId);
  } else if (action === "message") {
    promptSendMessage(studentId);
  } else if (action === "cert") {
    handleGenerateCert(studentId);
  } else if (action === "block") {
    handleToggleBlock(studentId);
  }
}

export function toggleStudentMessageMenu(e, studentId, messageId) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const targetMenu = document.getElementById(`studentMsgMenu-${messageId}`);
  if (!targetMenu) return;

  const isAlreadyOpen = !targetMenu.classList.contains("hidden");

  closeAllStudentActionMenus();

  if (!isAlreadyOpen) {
    targetMenu.classList.remove("hidden");
  }
}

export async function handleStudentMessageAction(e, studentId, messageId, action) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  closeAllStudentActionMenus();

  const student = getStudentById(studentId);
  if (!student || !student.messages) return;

  ensureStudentMessageIds(student);
  const msg = student.messages.find(m => String(m.id) === String(messageId));
  if (!msg) return;

  if (action === "edit") {
    const isTeacher = msg.sender === 'Teacher' || msg.sender === 'teacher';
    if (!isTeacher) {
      showErrorToast({ title: "غير مسموح", message: "يمكنك فقط تعديل الرسائل المرسلة بواسطتك." });
      return;
    }
    const inputFn = window.showInputDialog || showInputDialog;
    let newText = null;
    if (typeof inputFn === "function") {
      newText = await inputFn({
        title: "تعديل الرسالة",
        message: "قم بتعديل نص الرسالة:",
        defaultValue: msg.text,
        placeholder: "اكتب النص الجديد...",
        confirmText: "حفظ التعديل",
        cancelText: "إلغاء",
        icon: "✏️",
        isMultiline: true
      });
    } else {
      newText = prompt("تعديل نص الرسالة:", msg.text);
    }

    if (newText !== null && newText.trim() !== "") {
      const trimmedText = newText.trim();
      if (trimmedText !== msg.text) {
        editStudentMessage(student.id, msg.id, trimmedText);
        showSuccessToast({
          title: "تم تعديل الرسالة",
          message: "تم حفظ التعديلات على الرسالة بنجاح"
        });
        openStudentDetailPage(student.id, { preserveScroll: true });
      }
    }
  } else if (action === "pin") {
    const isNowPinned = togglePinStudentMessage(student.id, msg.id);
    showSuccessToast({
      title: isNowPinned ? "تم تثبيت الرسالة" : "تم إلغاء التثبيت",
      message: isNowPinned ? "تم تثبيت الرسالة بنجاح." : "تم إلغاء تثبيت الرسالة بنجاح."
    });
    openStudentDetailPage(student.id, { preserveScroll: true });
  } else if (action === "delete") {
    const confirmFn = window.showConfirmDialog || showConfirmDialog;
    let confirmed = false;
    if (typeof confirmFn === "function") {
      confirmed = await confirmFn({
        title: "حذف الرسالة",
        message: "هل أنت تأكد من رغبتك في حذف هذه الرسالة؟ لا يمكن التراجع عن هذه الخطوة.",
        confirmText: "حذف الرسالة",
        cancelText: "إلغاء",
        type: "danger"
      });
    } else {
      confirmed = confirm("هل أنت تأكد من رغبتك في حذف هذه الرسالة؟");
    }

    if (confirmed) {
      deleteStudentMessage(student.id, msg.id);
      showSuccessToast({
        title: "تم حذف الرسالة",
        message: "تم حذف الرسالة بنجاح"
      });
      openStudentDetailPage(student.id, { preserveScroll: true });
    }
  }
}

/**
 * Render Enrolled Students UI
 */
export function renderEnrolledStudentsUI(fullRender = false) {
  const container = document.getElementById("enrolledStudentsContent");
  if (!container) return;

  const filtered = getFilteredStudents();
  const allStudents = getStudentsList();

  // Summary Metrics
  const totalCount = allStudents.length;
  const activeCount = allStudents.filter(s => s.status === "Active").length;
  const completedCount = allStudents.filter(s => s.status === "Completed").length;
  const newThisMonthCount = allStudents.filter(s => s.purchaseDate && s.purchaseDate.startsWith("2026-08")).length;
  const avgProgress = Math.round(allStudents.reduce((acc, s) => acc + (s.progress || 0), 0) / (totalCount || 1));
  const avgRating = (allStudents.reduce((acc, s) => acc + (s.rating || 5), 0) / (totalCount || 1)).toFixed(1);

  // Pagination
  const totalPages = Math.ceil(filtered.length / studentState.pageSize) || 1;
  if (studentState.currentPage > totalPages) studentState.currentPage = 1;

  const startIndex = (studentState.currentPage - 1) * studentState.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + studentState.pageSize);

  // Countries unique set
  const countries = Array.from(new Set(allStudents.map(s => s.country)));

  const statsHtml = `
    <div class="crm-stat-card">
      <div class="crm-stat-icon-wrapper">👥</div>
      <div class="crm-stat-content">
        <span class="crm-stat-value">${totalCount}</span>
        <span class="crm-stat-label">إجمالي الطلاب</span>
      </div>
    </div>

    <div class="crm-stat-card">
      <div class="crm-stat-icon-wrapper" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">⚡</div>
      <div class="crm-stat-content">
        <span class="crm-stat-value">${activeCount}</span>
        <span class="crm-stat-label">الطلاب النشطون</span>
      </div>
    </div>

    <div class="crm-stat-card">
      <div class="crm-stat-icon-wrapper" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">🎓</div>
      <div class="crm-stat-content">
        <span class="crm-stat-value">${completedCount}</span>
        <span class="crm-stat-label">المكتملون</span>
      </div>
    </div>

    <div class="crm-stat-card">
      <div class="crm-stat-icon-wrapper" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">✨</div>
      <div class="crm-stat-content">
        <span class="crm-stat-value">${newThisMonthCount}</span>
        <span class="crm-stat-label">الجدد هذا الشهر</span>
      </div>
    </div>

    <div class="crm-stat-card">
      <div class="crm-stat-icon-wrapper" style="background: rgba(139, 92, 246, 0.1); color: #8b5cf6;">📈</div>
      <div class="crm-stat-content">
        <span class="crm-stat-value">%${avgProgress}</span>
        <span class="crm-stat-label">متوسط التقدم</span>
      </div>
    </div>

    <div class="crm-stat-card">
      <div class="crm-stat-icon-wrapper" style="background: rgba(236, 72, 153, 0.1); color: #ec4899;">⭐</div>
      <div class="crm-stat-content">
        <span class="crm-stat-value">${avgRating} / 5</span>
        <span class="crm-stat-label">متوسط التقييم</span>
      </div>
    </div>
  `;

  const tbodyHtml = paginated.length === 0 ? `
    <tr>
      <td colspan="12" style="text-align: center; padding: 40px; color: #64748b;">
        لا توجد نتائج تطابق خيارات الفلترة المحددة.
      </td>
    </tr>
  ` : paginated.map(s => `
    <tr>
      <td>
        <div class="crm-user-cell">
          <img src="${s.avatar}" alt="${s.name}" class="crm-avatar" />
          <div>
            <strong style="display: block; color: #1e293b;" class="dark-text">${s.name}</strong>
            <span style="font-size: 11px; color: #64748b;">${s.email}</span>
          </div>
        </div>
      </td>
      <td><strong>${s.country}</strong></td>
      <td style="max-width: 200px; white-space: normal; line-height: 1.3;">
        <strong>${s.purchasedItem}</strong>
      </td>
      <td>
        <span class="crm-badge ${s.type === 'Course' ? 'crm-badge-course' : 'crm-badge-book'}">
          ${s.type === 'Course' ? '🎓 دورة' : '📚 كتاب'}
        </span>
      </td>
      <td>${s.purchaseDate}</td>
      <td>
        <div style="display: flex; align-items: center;">
          <div class="crm-mini-progress">
            <div class="crm-mini-progress-fill" style="width: ${s.progress}%;"></div>
          </div>
          <strong style="font-size: 12px;">%${s.progress}</strong>
        </div>
      </td>
      <td>${s.lessonsCompleted} / ${s.totalLessons}</td>
      <td>${s.watchTime}</td>
      <td><span style="font-size: 11px; color: #64748b;">${s.lastActivity}</span></td>
      <td>
        ${s.hasCertificate ? `<span style="color: #10b981; font-weight: 800;">✓ صادرة</span>` : `<span style="color: #94a3b8;">غير اصدار</span>`}
      </td>
      <td>
        <span class="crm-badge crm-badge-${s.status.toLowerCase()}">
          ${s.status === 'Active' ? 'نشط' : s.status === 'Completed' ? 'مكتمل' : s.status === 'Inactive' ? 'غير نشط' : 'محظور'}
        </span>
      </td>
      <td style="text-align: center; position: relative;">
        <div class="crm-action-dropdown-wrapper">
          <button type="button" 
                  class="crm-action-dots-btn" 
                  title="الإجراءات" 
                  aria-label="الإجراءات" 
                  aria-expanded="false" 
                  onclick="toggleStudentActionMenu(event, '${s.id}')">
            ⋮
          </button>
          <div id="studentActionMenu-${s.id}" class="crm-action-menu hidden" role="menu">
            <button type="button" class="crm-menu-item" onclick="handleStudentMenuAction(event, '${s.id}', 'profile')">
              <span>👁️</span> عرض البروفايل
            </button>
            <button type="button" class="crm-menu-item" onclick="handleStudentMenuAction(event, '${s.id}', 'note')">
              <span>📝</span> إضافة ملاحظة
            </button>
            <button type="button" class="crm-menu-item" onclick="handleStudentMenuAction(event, '${s.id}', 'message')">
              <span>💬</span> إرسال رسالة
            </button>
            <button type="button" class="crm-menu-item" onclick="handleStudentMenuAction(event, '${s.id}', 'cert')">
              <span>🎓</span> إصدار شهادة
            </button>
            <button type="button" class="crm-menu-item ${s.status === 'Blocked' ? 'crm-menu-item-success' : 'crm-menu-item-danger'}" onclick="handleStudentMenuAction(event, '${s.id}', 'block')">
              <span>${s.status === 'Blocked' ? '🔓' : '🚫'}</span> ${s.status === 'Blocked' ? 'إلغاء الحظر' : 'حظر الطالب'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  const paginationHtml = `
    <span>عرض ${paginated.length} من إجمالي ${filtered.length} طالب</span>
    <div style="display: flex; gap: 8px;">
      <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" ${studentState.currentPage <= 1 ? 'disabled style="opacity:0.5;"' : ''} onclick="changeStudentPage(${studentState.currentPage - 1})">
        السابق
      </button>
      <span style="align-self: center; font-weight: 700; padding: 0 8px;">صفحة ${studentState.currentPage} من ${totalPages}</span>
      <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" ${studentState.currentPage >= totalPages ? 'disabled style="opacity:0.5;"' : ''} onclick="changeStudentPage(${studentState.currentPage + 1})">
        التالي
      </button>
    </div>
  `;

  // DOM node checks for selective focus-safe updates
  const existingTableBody = document.getElementById("enrolledStudentsTableBody");
  const existingStatsGrid = document.getElementById("enrolledStudentsStatsGrid");
  const existingPagination = document.getElementById("enrolledStudentsPagination");

  if (!fullRender && existingTableBody && existingStatsGrid && existingPagination) {
    existingStatsGrid.innerHTML = statsHtml;
    existingTableBody.innerHTML = tbodyHtml;
    existingPagination.innerHTML = paginationHtml;
    return;
  }

  // Full template render
  container.innerHTML = `
    <div class="crm-module-container">
      
      <!-- HEADER -->
      <div class="crm-header-row">
        <div class="crm-title-area">
          <h1>👥 الطلاب المشتركون (Enrolled Students)</h1>
          <div class="crm-breadcrumb">
            <span>الرئيسية</span> <span class="sep">/</span>
            <span>لوحة المعلم</span> <span class="sep">/</span>
            <strong style="color: #7c3aed;">إدارة الطلاب المشتركين</strong>
          </div>
        </div>

        <div class="crm-actions-bar">
          <button type="button" class="crm-btn crm-btn-secondary" onclick="openEnrolledStudentsPage(true)">
            🔄 تحديث
          </button>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="exportStudentsCSV()">
            📥 تصدير CSV
          </button>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="exportStudentsExcel()">
            📊 تصدير Excel
          </button>
          <button type="button" class="crm-btn crm-btn-primary" onclick="window.print()">
            🖨️ طباعة
          </button>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="crm-stats-grid" id="enrolledStudentsStatsGrid">
        ${statsHtml}
      </div>

      <!-- FILTERS TOOLBAR -->
      <div class="crm-filters-card">
        <div class="crm-filters-row">
          
          <div class="crm-filter-group" style="grid-column: span 2;">
            <label>البحث باسم الطالب، الإيميل، أو المنتج:</label>
            <input type="text" id="studentSearchInput" class="crm-input" placeholder="اكتب للبحث..." value="${studentState.searchQuery}" oninput="handleStudentSearch(this.value)" />
          </div>

          <div class="crm-filter-group">
            <label>حسب الدورة:</label>
            <select class="crm-select" id="studentCourseSelect" onchange="handleStudentCourseFilter(this.value)">
              <option value="all">جميع الدورات</option>
              ${coursesData.map(c => `<option value="${c.id}" ${String(studentState.courseFilter) === String(c.id) ? 'selected' : ''}>${c.title}</option>`).join('')}
            </select>
          </div>

          <div class="crm-filter-group">
            <label>حسب الكتاب:</label>
            <select class="crm-select" id="studentBookSelect" onchange="handleStudentBookFilter(this.value)">
              <option value="all">جميع الكتب</option>
              ${booksData.map(b => `<option value="${b.id}" ${String(studentState.bookFilter) === String(b.id) ? 'selected' : ''}>${b.title}</option>`).join('')}
            </select>
          </div>

          <div class="crm-filter-group">
            <label>الدولة:</label>
            <select class="crm-select" id="studentCountrySelect" onchange="handleStudentCountryFilter(this.value)">
              <option value="all">جميع الدول</option>
              ${countries.map(c => `<option value="${c}" ${studentState.countryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <div class="crm-filter-group">
            <label>نسبة التقدم:</label>
            <select class="crm-select" id="studentProgressSelect" onchange="handleStudentProgressFilter(this.value)">
              <option value="all" ${studentState.progressFilter === 'all' ? 'selected' : ''}>جميع النسب</option>
              <option value="p0_25" ${studentState.progressFilter === 'p0_25' ? 'selected' : ''}>0% - 25%</option>
              <option value="p26_50" ${studentState.progressFilter === 'p26_50' ? 'selected' : ''}>26% - 50%</option>
              <option value="p51_75" ${studentState.progressFilter === 'p51_75' ? 'selected' : ''}>51% - 75%</option>
              <option value="p76_100" ${studentState.progressFilter === 'p76_100' ? 'selected' : ''}>76% - 100%</option>
            </select>
          </div>

          <div class="crm-filter-group">
            <label>الحالة:</label>
            <select class="crm-select" id="studentStatusSelect" onchange="handleStudentStatusFilter(this.value)">
              <option value="all" ${studentState.statusFilter === 'all' ? 'selected' : ''}>جميع الحالات</option>
              <option value="Active" ${studentState.statusFilter === 'Active' ? 'selected' : ''}>نشط (Active)</option>
              <option value="Completed" ${studentState.statusFilter === 'Completed' ? 'selected' : ''}>مكتمل (Completed)</option>
              <option value="Inactive" ${studentState.statusFilter === 'Inactive' ? 'selected' : ''}>غير نشط (Inactive)</option>
              <option value="Blocked" ${studentState.statusFilter === 'Blocked' ? 'selected' : ''}>محظور (Blocked)</option>
            </select>
          </div>

          <div class="crm-filter-group">
            <label>الترتيب حسب:</label>
            <select class="crm-select" id="studentSortSelect" onchange="handleStudentSort(this.value)">
              <option value="name_asc" ${studentState.sortBy === 'name_asc' ? 'selected' : ''}>الاسم (أ-ي)</option>
              <option value="name_desc" ${studentState.sortBy === 'name_desc' ? 'selected' : ''}>الاسم (ي-أ)</option>
              <option value="progress_desc" ${studentState.sortBy === 'progress_desc' ? 'selected' : ''}>التقدم الأعلى</option>
              <option value="progress_asc" ${studentState.sortBy === 'progress_asc' ? 'selected' : ''}>التقدم الأقل</option>
              <option value="date_desc" ${studentState.sortBy === 'date_desc' ? 'selected' : ''}>الأحدث شراؤها</option>
            </select>
          </div>

        </div>
      </div>

      <!-- STUDENTS TABLE -->
      <div class="crm-table-container">
        <table class="crm-table">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>الدولة</th>
              <th>المنتج المشترى</th>
              <th>النوع</th>
              <th>تاريخ الشراء</th>
              <th>التقدم %</th>
              <th>الدروس</th>
              <th>زمن المشاهدة</th>
              <th>آخر نشاط</th>
              <th>الشهادة</th>
              <th>الحالة</th>
              <th style="text-align: center;">الإجراءات</th>
            </tr>
          </thead>
          <tbody id="enrolledStudentsTableBody">
            ${tbodyHtml}
          </tbody>
        </table>

        <!-- PAGINATION BAR -->
        <div class="crm-pagination-bar" id="enrolledStudentsPagination">
          ${paginationHtml}
        </div>
      </div>

    </div>
  `;
}

// Handler functions for Enrolled Students
export function handleStudentSearch(val) {
  studentState.searchQuery = val;
  studentState.currentPage = 1;
  renderEnrolledStudentsUI();
}

export function handleStudentCourseFilter(val) {
  studentState.courseFilter = val;
  studentState.currentPage = 1;
  renderEnrolledStudentsUI();
}

export function handleStudentBookFilter(val) {
  studentState.bookFilter = val;
  studentState.currentPage = 1;
  renderEnrolledStudentsUI();
}

export function handleStudentCountryFilter(val) {
  studentState.countryFilter = val;
  studentState.currentPage = 1;
  renderEnrolledStudentsUI();
}

export function handleStudentProgressFilter(val) {
  studentState.progressFilter = val;
  studentState.currentPage = 1;
  renderEnrolledStudentsUI();
}

export function handleStudentStatusFilter(val) {
  studentState.statusFilter = val;
  studentState.currentPage = 1;
  renderEnrolledStudentsUI();
}

export function handleStudentSort(val) {
  studentState.sortBy = val;
  renderEnrolledStudentsUI();
}

export function changeStudentPage(page) {
  studentState.currentPage = page;
  renderEnrolledStudentsUI();
}

export async function promptAddNote(studentId) {
  const student = getStudentById(studentId);
  if (!student) {
    showErrorToast({ title: "خطأ", message: "لم يتم العثور على بيانات الطالب المطلوبة" });
    return;
  }

  const inputFn = window.showInputDialog || showInputDialog;
  let text = null;

  if (inputFn) {
    text = await inputFn({
      title: `إضافة ملاحظة خاصة للطالب: ${student.name}`,
      message: `الملاحظات الخاصة مرئية فقط للمعلم وإدارة المنصة.`,
      placeholder: "اكتب الملاحظة هنا...",
      confirmText: "حفظ الملاحظة",
      cancelText: "إلغاء",
      icon: "📝",
      isMultiline: true
    });
  } else {
    text = prompt(`أدخل الملاحظة الخاصة بالمعلم للطالب (${student.name}):`);
  }

  if (text !== null && text.trim() !== "") {
    const newNote = addPrivateNoteToStudent(student.id, text.trim());
    if (newNote) {
      showSuccessToast({
        title: "تم الحفظ بنجاح",
        message: `تمت إضافة الملاحظة الخاصة للطالب ${student.name}`
      });

      const detailPage = document.getElementById("studentDetailPage");
      if (detailPage && !detailPage.classList.contains("hidden")) {
        openStudentDetailPage(student.id, { preserveScroll: true });
      } else {
        renderEnrolledStudentsUI();
      }
    }
  }
}

export async function promptSendMessage(studentId) {
  const student = getStudentById(studentId);
  if (!student) {
    showErrorToast({ title: "خطأ", message: "لم يتم العثور على الطالب المطلوب" });
    return;
  }

  const inputFn = window.showInputDialog || showInputDialog;
  let text = null;

  if (inputFn) {
    text = await inputFn({
      title: `إرسال رسالة مباشرة إلى: ${student.name}`,
      message: `سيتم إرسال الرسالة إلى البريد الإلكتروني: ${student.email}`,
      placeholder: "اكتب نص الرسالة هنا...",
      confirmText: "إرسال الرسالة",
      cancelText: "إلغاء",
      icon: "💬",
      isMultiline: true
    });
  } else {
    text = prompt(`أدخل نص الرسالة المباشرة للطالب (${student.name}):`);
  }

  if (text !== null && text.trim() !== "") {
    const msgText = text.trim();
    // 1. Add message to student record
    sendStudentMessage(student.id, msgText);

    // 2. Sync message to Message Center conversations
    try {
      const conversations = getConversations();
      let conv = conversations.find(c => String(c.studentId) === String(student.id));
      const nowIso = new Date().toISOString();
      const msgObj = {
        id: `M-${student.id}-${Date.now()}`,
        sender: "teacher",
        text: msgText,
        timestamp: nowIso,
        status: "sent",
        attachments: []
      };

      if (conv) {
        if (!conv.messages) conv.messages = [];
        conv.messages.push(msgObj);
        conv.lastUpdated = nowIso;
        conv.status = "Open";
      } else {
        conv = {
          id: `MSG-CONV-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          studentAvatar: student.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
          country: student.country || "مصر",
          isOnline: true,
          lastSeen: "متصل الآن",
          itemType: student.type || "Course",
          itemId: student.purchasedItemId || 1,
          itemTitle: student.purchasedItem || "دورة تعليمية",
          lessonName: "محادثة خاصة مع المعلم",
          lessonNumber: 1,
          status: "Open",
          isPinned: false,
          isStarred: false,
          isMuted: false,
          unreadCount: 0,
          labels: ["مباشر من قائمة الطلاب"],
          lastUpdated: nowIso,
          orderNo: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          messages: [msgObj]
        };
        conversations.unshift(conv);
      }
      saveConversations(conversations);
    } catch (e) {
      console.error("Failed to sync message to MessageCenter", e);
    }

    showSuccessToast({
      title: "تم إرسال الرسالة",
      message: `تم إرسال الرسالة بنجاح إلى الطالب ${student.name}`
    });

    const detailPage = document.getElementById("studentDetailPage");
    if (detailPage && !detailPage.classList.contains("hidden")) {
      openStudentDetailPage(student.id, { preserveScroll: true });
    }
  }
}

export async function handleGenerateCert(studentId) {
  const student = getStudentById(studentId);
  if (!student) {
    showErrorToast({ title: "خطأ", message: "لم يتم العثور على الطالب" });
    return;
  }

  // Verify product type eligibility
  if (student.type !== "Course") {
    showErrorToast({
      title: "تعذر إصدار الشهادة",
      message: `الشهادات المعتمدة تصدر فقط للدورات التدريبية وليس للكتب (${student.purchasedItem})`
    });
    return;
  }

  // Verify existing certificate
  if (student.hasCertificate && student.certificateUrl) {
    const confirmFn = window.showConfirmDialog || showConfirmDialog;
    if (confirmFn) {
      const ok = await confirmFn({
        title: "شهادة صادرة بالفعل",
        message: `الطالب ${student.name} لديه شهادة صادرة بالفعل برقم (${student.certificateUrl}). هل ترغب في إعادة إصدار/تحديث بيانات الشهادة؟`,
        confirmText: "إعادة الإصدار",
        cancelText: "إلغاء",
        danger: false
      });
      if (!ok) return;
    }
  } else if (student.progress < 50) {
    const confirmFn = window.showConfirmDialog || showConfirmDialog;
    if (confirmFn) {
      const ok = await confirmFn({
        title: "تأكيد إصدار شهادة استثنائية",
        message: `نسبة إتمام الطالب ${student.name} هي %${student.progress} فقط. هل أنت تأكد من رغبتك في إصدار الشهادة استثنائياً؟`,
        confirmText: "إصدار الشهادة",
        cancelText: "تراجع",
        danger: false
      });
      if (!ok) return;
    }
  }

  const certNo = generateStudentCertificate(student.id);
  if (certNo) {
    showSuccessToast({
      title: "تم إصدار الشهادة 🎓",
      message: `تم إصدار الشهادة المعتمدة بنجاح للطالب ${student.name} برقم: ${certNo}`
    });

    const detailPage = document.getElementById("studentDetailPage");
    if (detailPage && !detailPage.classList.contains("hidden")) {
      openStudentDetailPage(student.id, { preserveScroll: true });
    } else {
      renderEnrolledStudentsUI();
    }
  }
}

export async function handleToggleBlock(studentId) {
  const student = getStudentById(studentId);
  if (!student) {
    showErrorToast({ title: "خطأ", message: "لم يتم العثور على بيانات الطالب" });
    return;
  }

  const isCurrentlyBlocked = student.status === "Blocked";
  const confirmFn = window.showConfirmDialog || showConfirmDialog;

  if (confirmFn) {
    const ok = await confirmFn({
      title: isCurrentlyBlocked ? "إلغاء حظر الطالب" : "تأكيد حظر الطالب",
      message: isCurrentlyBlocked
        ? `هل أنت تأكد من إلغاء حظر الطالب (${student.name}) وإعادة تفعيل حسابه بالكامل؟`
        : `هل أنت تأكد من حظر الطالب (${student.name})؟ لن يتمكن من الوصول للمحتوى أو تسجيل الدخول.`,
      confirmText: isCurrentlyBlocked ? "إلغاء الحظر" : "حظر الطالب",
      cancelText: "إلغاء",
      danger: !isCurrentlyBlocked
    });
    if (!ok) return;
  }

  const newStatus = toggleStudentBlock(student.id);
  if (newStatus) {
    showSuccessToast({
      title: isCurrentlyBlocked ? "تم إلغاء الحظر" : "تم حظر الطالب",
      message: isCurrentlyBlocked
        ? `تم إلغاء حظر الطالب ${student.name} واستعادة كافة صلاحياته`
        : `تم حظر الطالب ${student.name} بنجاح`
    });

    const detailPage = document.getElementById("studentDetailPage");
    if (detailPage && !detailPage.classList.contains("hidden")) {
      openStudentDetailPage(student.id, { preserveScroll: true });
    } else {
      renderEnrolledStudentsUI();
    }
  }
}

export function exportStudentsCSV() {
  const list = getFilteredStudents();
  let csv = "ID,Name,Email,Country,PurchasedItem,Type,PurchaseDate,Progress,Status\n";
  list.forEach(s => {
    csv += `"${s.id}","${s.name}","${s.email}","${s.country}","${s.purchasedItem}","${s.type}","${s.purchaseDate}","${s.progress}%","${s.status}"\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Enrolled_Students_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showCustomAlert("✅ تم تصدير تقرير الطلاب CSV بنجاح");
}

export function exportStudentsExcel() {
  const list = getFilteredStudents();
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>الطلاب المشتركون</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      table { border-collapse: collapse; font-family: Tahoma, Arial, sans-serif; width: 100%; }
      th { background-color: #7c3aed; color: #ffffff; padding: 10px; font-weight: bold; border: 1px solid #6d28d9; }
      td { padding: 8px; border: 1px solid #cbd5e1; text-align: right; }
    </style>
  </head>
  <body dir="rtl">
    <table>
      <thead>
        <tr>
          <th>المعرف</th>
          <th>اسم الطالب</th>
          <th>البريد الإلكتروني</th>
          <th>الدولة</th>
          <th>المنتج المشترى</th>
          <th>النوع</th>
          <th>تاريخ الشراء</th>
          <th>نسبة التقدم</th>
          <th>الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(s => `
          <tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${s.country}</td>
            <td>${s.purchasedItem}</td>
            <td>${s.type === 'Course' ? 'دورة' : 'كتاب'}</td>
            <td>${s.purchaseDate}</td>
            <td>${s.progress}%</td>
            <td>${s.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Enrolled_Students_Report_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showCustomAlert("📊 تم تصدير تقرير الطلاب Excel بنجاح");
}


/**
 * Print Comprehensive Student Report
 */
export function printStudentReport(studentId) {
  const student = getStudentById(studentId);
  if (!student) {
    showCustomAlert("تعذر العثور على بيانات الطالب للطباعة.");
    return;
  }

  const reportDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const coursesList = (student.purchasedCourses || []).map(c => `
    <tr>
      <td><strong>${c.title}</strong></td>
      <td>$${c.price}</td>
      <td>${c.currentLesson || 'البداية'}</td>
      <td>%${c.progress}</td>
      <td>${c.lessonsCompleted} من ${c.totalLessons}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center; color:#64748b;">لا توجد دورات مشتركة</td></tr>';

  const booksList = (student.purchasedBooks || []).map(b => `
    <tr>
      <td><strong>${b.title}</strong></td>
      <td>$${b.price}</td>
      <td>${b.purchaseDate}</td>
    </tr>
  `).join('') || '<tr><td colspan="3" style="text-align:center; color:#64748b;">لم يتم شراء أي كتب</td></tr>';

  const assignmentsList = (student.assignments || []).map(a => `
    <tr>
      <td><strong>${a.title}</strong></td>
      <td>${a.score}</td>
      <td>${a.status}</td>
      <td>${a.feedback || '-'}</td>
    </tr>
  `).join('');

  const quizzesList = (student.quizResults || []).map(q => `
    <tr>
      <td><strong>${q.quizTitle}</strong></td>
      <td>${q.score}</td>
      <td>${q.passStatus}</td>
    </tr>
  `).join('');

  const timelineList = (student.timeline || []).map(t => `
    <tr>
      <td>${t.date}</td>
      <td>${t.icon} ${t.action}</td>
    </tr>
  `).join('') || '<tr><td colspan="2" style="text-align:center; color:#64748b;">لا توجد أنشطة مسجلة</td></tr>';

  const notesList = (student.privateNotes || []).map(n => `
    <div style="background: #fffbe3; border: 1px solid #fde68a; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
      <div style="font-weight: bold; font-size: 13px;">"${n.text}"</div>
      <div style="font-size: 11px; color: #78350f; margin-top: 4px;">بواسطة: ${n.author} | ${n.date}</div>
    </div>
  `).join('') || '<p style="color:#64748b; font-size: 12px;">لا توجد ملاحظات خاصة</p>';

  const messagesList = (student.messages || []).map(m => `
    <div style="padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">
      <strong>[${m.time}] ${m.sender === 'Teacher' ? 'المعلم' : 'الطالب'}:</strong> ${m.text}
    </div>
  `).join('') || '<p style="color:#64748b; font-size: 12px;">لا توجد رسائل متبادلة</p>';

  const reportHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير الطالب - ${student.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            color: #0f172a;
            direction: rtl;
            background: #ffffff;
            margin: 0;
            padding: 15px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid #7c3aed;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header-title h1 {
            margin: 0 0 4px 0;
            font-size: 22px;
            color: #6d28d9;
          }
          .header-title p {
            margin: 0;
            font-size: 12px;
            color: #64748b;
          }
          .student-card {
            display: flex;
            gap: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
            align-items: center;
          }
          .student-avatar {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #7c3aed;
          }
          .student-info {
            flex: 1;
          }
          .student-name {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 6px 0;
            color: #0f172a;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px 16px;
            font-size: 12px;
            color: #475569;
          }
          .stats-row {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .stat-box {
            flex: 1;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          .stat-label {
            font-size: 11px;
            color: #64748b;
            display: block;
          }
          .stat-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e293b;
          }
          .section-heading {
            font-size: 15px;
            font-weight: bold;
            color: #5b21b6;
            border-bottom: 1.5px solid #ddd6fe;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 7px 10px;
            text-align: right;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">
            <h1>🎓 StudyMart CRM — تقرير أداء طالب</h1>
            <p>تاريخ استخراج التقرير: ${reportDate}</p>
          </div>
          <button class="no-print" onclick="window.print()" style="padding: 8px 16px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🖨️ طباعة الآن
          </button>
        </div>

        <div class="student-card">
          <img src="${student.avatar}" alt="${student.name}" class="student-avatar" />
          <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="info-grid">
              <div>📧 البريد الإلكتروني: ${student.email}</div>
              <div>📞 رقم الهاتف: ${student.phone}</div>
              <div>🌍 الدولة: ${student.country}</div>
              <div>📅 تاريخ الانضمام: ${student.registrationDate}</div>
            </div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-label">إجمالي المدفوعات</span>
            <span class="stat-value" style="color: #10b981;">$${student.totalSpent}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">التقدم العام</span>
            <span class="stat-value" style="color: #7c3aed;">%${student.progress}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">حالة حساب الطالب</span>
            <span class="stat-value">${student.status === 'Active' ? 'نشط' : student.status === 'Completed' ? 'مكتمل' : 'محظور'}</span>
          </div>
        </div>

        <div class="section-heading">🎓 الدورات التعليمية المشتراة</div>
        <table>
          <thead>
            <tr>
              <th>اسم الدورة</th>
              <th>السعر</th>
              <th>الدرس الحالي</th>
              <th>نسبة الإنجاز</th>
              <th>الدروس المكتملة</th>
            </tr>
          </thead>
          <tbody>
            ${coursesList}
          </tbody>
        </table>

        <div class="section-heading">📚 الكتب الرقمية المشتراة</div>
        <table>
          <thead>
            <tr>
              <th>عنوان الكتاب</th>
              <th>السعر</th>
              <th>تاريخ الشراء</th>
            </tr>
          </thead>
          <tbody>
            ${booksList}
          </tbody>
        </table>

        ${(student.assignments || []).length > 0 || (student.quizResults || []).length > 0 ? `
          <div class="section-heading">📝 الواجبات والاختبارات</div>
          ${(student.assignments || []).length > 0 ? `
            <p style="font-weight: bold; margin: 6px 0 4px 0; font-size: 12px;">الواجبات:</p>
            <table>
              <thead>
                <tr>
                  <th>الواجب</th>
                  <th>الدرجة</th>
                  <th>الحالة</th>
                  <th>ملاحظة المعلم</th>
                </tr>
              </thead>
              <tbody>
                ${assignmentsList}
              </tbody>
            </table>
          ` : ''}
          ${(student.quizResults || []).length > 0 ? `
            <p style="font-weight: bold; margin: 6px 0 4px 0; font-size: 12px;">نتائج الاختبارات:</p>
            <table>
              <thead>
                <tr>
                  <th>الاختبار</th>
                  <th>النتيجة</th>
                  <th>حالة الاجتياز</th>
                </tr>
              </thead>
              <tbody>
                ${quizzesList}
              </tbody>
            </table>
          ` : ''}
        ` : ''}

        <div class="section-heading">⏱️ جدول الأنشطة والعمليات</div>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النشاط</th>
            </tr>
          </thead>
          <tbody>
            ${timelineList}
          </tbody>
        </table>

        <div class="section-heading">📌 الملاحظات الخاصة بالمعلم</div>
        ${notesList}

        <div class="section-heading">💬 الرسائل المتبادلة</div>
        <div style="background: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 15px;">
          ${messagesList}
        </div>

        <div class="footer">
          تقرير رسمي صادر من منصة StudyMart التعليمية — جميع الحقوق محفوظة
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      showCustomAlert("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");
      return;
    }
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  } catch (err) {
    console.error("Print student report error:", err);
    showCustomAlert("حدث خطأ أثناء إعداد طباعة التقرير.");
  }
}

/**
 * Open Student Details Page (FULL PAGE - NO MODAL)
 * Route: /teacher/students/{id}
 */
export function openStudentDetailPage(studentId, options = {}) {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين والمالك فقط.");
    return;
  }

  const student = getStudentById(studentId);
  if (!student) {
    showCustomAlert("لم يتم العثور على بيانات هذا الطالب.");
    openEnrolledStudentsPage();
    return;
  }

  const detailPage = document.getElementById("studentDetailPage");
  const isAlreadyOpen = detailPage && !detailPage.classList.contains("hidden");
  const currentScrollY = window.scrollY;

  hideAllMainSections();
  if (detailPage) detailPage.classList.remove("hidden");

  const newHash = `#teacher/students/${student.id}`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }

  const preserve = options.preserveScroll !== undefined ? options.preserveScroll : isAlreadyOpen;

  renderStudentDetailUI(student);

  if (preserve) {
    window.scrollTo({ top: currentScrollY, behavior: "instant" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * Render Student Detail UI
 */
export function renderStudentDetailUI(student) {
  const container = document.getElementById("studentDetailContent");
  if (!container) return;

  ensureStudentMessageIds(student);
  const existingMsgBoxScrollTop = document.getElementById("studentMessagesScrollBox")?.scrollTop;

  container.innerHTML = `
    <div class="crm-module-container">
      
      <!-- BACK BUTTON & HEADER -->
      <div class="crm-header-row">
        <div>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else openEnrolledStudentsPage();" style="margin-bottom: 10px;">
            ← العودة إلى قائمة الطلاب المشتركين
          </button>
          <h1 style="font-size: 24px; margin: 0;">تفاصيل الطالب: ${student.name}</h1>
        </div>

        <div class="crm-actions-bar">
          <button type="button" class="crm-btn crm-btn-secondary" onclick="promptAddNote('${student.id}')">
            📝 إضافة ملاحظة خاصة
          </button>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="promptSendMessage('${student.id}')">
            💬 إرسال رسالة
          </button>
          <button type="button" class="crm-btn crm-btn-primary" onclick="printStudentReport('${student.id}')">
            🖨️ طباعة تقرير الطالب
          </button>
        </div>
      </div>

      <!-- STUDENT HERO CARD -->
      <div class="crm-details-header-card">
        <div class="crm-student-hero">
          <img src="${student.avatar}" alt="${student.name}" class="crm-hero-avatar" />
          <div class="crm-hero-details">
            <h2 class="crm-hero-name" style="margin: 0 0 4px 0; font-size: 22px;">${student.name}</h2>
            <div class="crm-hero-info" style="font-size: 13px; color: #64748b; display: flex; gap: 15px; flex-wrap: wrap;">
              <span>📧 ${student.email}</span>
              <span>📞 ${student.phone}</span>
              <span>🌍 ${student.country}</span>
              <span>📅 انضم في: ${student.registrationDate}</span>
            </div>
          </div>
        </div>

        <div class="crm-hero-stats-row" style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <div class="crm-hero-stat-card" style="text-align: center; background: #ffffff; padding: 10px 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <span style="font-size: 11px; color: #64748b; display: block;">إجمالي المدفوعات</span>
            <strong style="font-size: 18px; color: #10b981;">$${student.totalSpent}</strong>
          </div>

          <div class="crm-hero-stat-card" style="text-align: center; background: #ffffff; padding: 10px 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <span style="font-size: 11px; color: #64748b; display: block;">التقدم العام</span>
            <strong style="font-size: 18px; color: #7c3aed;">%${student.progress}</strong>
          </div>

          <span class="crm-badge crm-badge-${student.status.toLowerCase()} crm-hero-status-badge" style="font-size: 13px; padding: 8px 16px;">
            الحالة: ${student.status === 'Active' ? 'نشط' : student.status === 'Completed' ? 'مكتمل' : 'محظور'}
          </span>
        </div>
      </div>

      <!-- DETAILED SECTIONS GRID -->
      <div class="crm-detail-grid">
        
        <!-- COLUMN 1: COURSES & BOOKS & ASSIGNMENTS -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- COURSES ENROLLED -->
          <div class="crm-details-card">
            <h3 style="margin: 0 0 16px 0; font-size: 16px;">🎓 الدورات التعليمية المشتراة</h3>
            ${(student.purchasedCourses || []).length === 0 ? '<p style="color:#64748b;">لا توجد دورات مشتركة بعد.</p>' : (student.purchasedCourses || []).map(c => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 10px;" class="dark-card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <strong style="font-size: 14px;">${c.title}</strong>
                  <span style="font-size: 12px; color: #7c3aed; font-weight: 700;">$${c.price}</span>
                </div>
                <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
                  الدرس الحالي: <strong>${c.currentLesson || 'البداية'}</strong>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
                  <span>إنجاز: ${c.lessonsCompleted} من ${c.totalLessons} درس</span>
                  <strong style="color: #10b981;">%${c.progress}</strong>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- BOOKS PURCHASED -->
          <div class="crm-details-card">
            <h3 style="margin: 0 0 16px 0; font-size: 16px;">📚 الكتب الرقمية المشتراة</h3>
            ${(student.purchasedBooks || []).length === 0 ? '<p style="color:#64748b;">لم يقم بشراء أي كتب بعد.</p>' : (student.purchasedBooks || []).map(b => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;" class="dark-card">
                <div>
                  <strong style="font-size: 13px;">${b.title}</strong>
                  <div style="font-size: 11px; color: #64748b;">تاريخ الشراء: ${b.purchaseDate}</div>
                </div>
                <span class="crm-badge crm-badge-book">$${b.price}</span>
              </div>
            `).join('')}
          </div>

          <!-- ASSIGNMENTS & QUIZZES -->
          <div class="crm-details-card">
            <h3 style="margin: 0 0 16px 0; font-size: 16px;">📝 الواجبات ونتائج الاختبارات</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${(student.assignments || []).map(a => `
                <div style="border-right: 3px solid #7c3aed; padding-right: 10px; font-size: 13px;">
                  <strong>الواجب: ${a.title}</strong>
                  <div style="font-size: 11px; color: #64748b;">درجة: <strong style="color:#10b981;">${a.score}</strong> | الحالة: ${a.status}</div>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">"${a.feedback}"</div>
                </div>
              `).join('')}

              ${(student.quizResults || []).map(q => `
                <div style="border-right: 3px solid #3b82f6; padding-right: 10px; font-size: 13px;">
                  <strong>الاختبار: ${q.quizTitle}</strong>
                  <div style="font-size: 11px; color: #64748b;">النتيجة: <strong style="color:#3b82f6;">${q.score}</strong> (${q.passStatus})</div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- COLUMN 2: TIMELINE & NOTES & MESSAGES & INVOICES -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          
          <!-- ACTIVITY TIMELINE -->
          <div class="crm-details-card">
            <h3 style="margin: 0 0 16px 0; font-size: 16px;">⏱️ جدول الأنشطة والعمليات (Timeline)</h3>
            <div class="crm-timeline-list">
              ${(student.timeline || []).map(t => `
                <div class="crm-timeline-item">
                  <div style="font-weight: 700;">${t.icon} ${t.action}</div>
                  <div style="font-size: 11px; color: #64748b;">${t.date}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- PRIVATE NOTES -->
          <div class="crm-details-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 16px;">📌 الملاحظات الخاصة بالمعلم</h3>
              <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" onclick="promptAddNote('${student.id}')">➕ ملاحظة</button>
            </div>
            ${(student.privateNotes || []).length === 0 ? '<p style="color:#64748b; font-size:12px;">لا توجد ملاحظات خاصة بعد.</p>' : (student.privateNotes || []).map(n => `
              <div style="background: rgba(245, 158, 11, 0.08); padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 12px;">
                <p style="margin: 0 0 4px 0; font-weight: 600;">"${n.text}"</p>
                <div style="font-size: 10px; color: #64748b;">بواسطة: ${n.author} | ${n.date}</div>
              </div>
            `).join('')}
          </div>

          <!-- MESSAGES -->
          <div class="crm-details-card">
            <h3 style="margin: 0 0 12px 0; font-size: 16px;">💬 الرسائل المتبادلة</h3>
            <div id="studentMessagesScrollBox" style="display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; margin-bottom: 10px; padding-left: 6px; padding-right: 4px;">
              ${(student.messages || []).length === 0 ? '<p style="color:#64748b; font-size:12px;">لا توجد رسائل متبادلة بعد.</p>' : (student.messages || []).map(m => {
                const isTeacher = m.sender === 'Teacher' || m.sender === 'teacher';
                const isPinned = !!m.isPinned;
                const msgId = m.id;
                return `
                  <div style="align-self: ${isTeacher ? 'flex-end' : 'flex-start'}; background: ${isTeacher ? '#7c3aed' : '#f1f5f9'}; color: ${isTeacher ? '#ffffff' : '#0f172a'}; padding: 6px 10px; border-radius: 10px; font-size: 12px; max-width: 80%; width: fit-content; position: relative; border: ${isPinned ? '1.5px solid #f59e0b' : '1px solid transparent'}; box-shadow: ${isPinned ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none'};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                      <div style="flex: 1; word-break: break-word; white-space: pre-wrap; line-height: 1.35;">${m.text}</div>
                      <div class="crm-action-dropdown-wrapper" style="position: relative; display: inline-block; flex-shrink: 0; margin-top: -2px;">
                        <button type="button" class="crm-action-dots-btn" onclick="toggleStudentMessageMenu(event, '${student.id}', '${msgId}')" title="خيارات الرسالة" style="background: transparent; border: none; color: ${isTeacher ? 'rgba(255,255,255,0.85)' : '#64748b'}; cursor: pointer; padding: 0 2px; font-size: 13px; font-weight: bold; line-height: 1;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.85'">
                          ⋮
                        </button>
                        <div id="studentMsgMenu-${msgId}" class="crm-action-menu hidden" style="position: absolute; ${isTeacher ? 'left: 0;' : 'right: 0;'} top: 100%; margin-top: 4px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.18); z-index: 100; min-width: 120px; padding: 4px 0; font-size: 12px; color: #0f172a; text-align: right;">
                          ${isTeacher ? `
                            <button type="button" onclick="handleStudentMessageAction(event, '${student.id}', '${msgId}', 'edit')" style="width: 100%; text-align: right; background: none; border: none; padding: 6px 12px; cursor: pointer; color: #0f172a; font-size: 12px; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                              ✏️ تعديل
                            </button>
                          ` : ''}
                          <button type="button" onclick="handleStudentMessageAction(event, '${student.id}', '${msgId}', 'pin')" style="width: 100%; text-align: right; background: none; border: none; padding: 6px 12px; cursor: pointer; color: #0f172a; font-size: 12px; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                            📌 ${isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                          </button>
                          <button type="button" onclick="handleStudentMessageAction(event, '${student.id}', '${msgId}', 'delete')" style="width: 100%; text-align: right; background: none; border: none; padding: 6px 12px; cursor: pointer; color: #ef4444; font-size: 12px; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'">
                            🗑️ حذف
                          </button>
                        </div>
                      </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 9px; opacity: 0.85; margin-top: 2px;">
                      <span>${m.time || ''}</span>
                      ${isPinned ? `<span style="background: ${isTeacher ? 'rgba(255,255,255,0.25)' : '#fef3c7'}; color: ${isTeacher ? '#ffffff' : '#92400e'}; padding: 1px 4px; border-radius: 3px; font-weight: bold; font-size: 8px;">📌 مثبتة</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <button type="button" class="crm-btn crm-btn-primary crm-btn-sm" style="width: 100%;" onclick="promptSendMessage('${student.id}')">
              ✉️ إرسال رد جديد للطالب
            </button>
          </div>

          <!-- INVOICES & TRANSACTIONS -->
          <div class="crm-details-card">
            <h3 style="margin: 0 0 12px 0; font-size: 16px;">🧾 سجل الفواتير والمشتريات</h3>
            ${(student.invoices || []).map(inv => `
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 8px 0; font-size: 12px;">
                <div>
                  <strong>${inv.invoiceNo}</strong>
                  <div style="color: #64748b; font-size: 10px;">${inv.item} | ${inv.date}</div>
                </div>
                <strong style="color: #10b981;">${inv.amount}</strong>
              </div>
            `).join('')}
          </div>

        </div>

      </div>

    </div>
  `;

  const msgBox = container.querySelector("#studentMessagesScrollBox");
  if (msgBox) {
    if (existingMsgBoxScrollTop !== undefined && existingMsgBoxScrollTop > 0) {
      msgBox.scrollTop = existingMsgBoxScrollTop;
    } else {
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  }
}
