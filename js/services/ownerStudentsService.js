import { 
  getStudentsList, 
  getStudentById, 
  addPrivateNoteToStudent, 
  toggleStudentBlock 
} from "../data/studentsData.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { reviewsData } from "../data/reviewsData.js";
import { showCustomAlert } from "../utils/helpers.js";
import { showToast, showConfirmDialog } from "./notificationService.js";
import { hideAllMainSections } from "./layoutService.js";
import { isOwner } from "./permissionService.js";
import { setAccountStatus } from "./accountStatusService.js";

// Owner Students State
let state = {
  searchQuery: "",
  statusFilter: "all",
  courseFilter: "all",
  bookFilter: "all",
  countryFilter: "all",
  sortBy: "newest",
  currentPage: 1,
  pageSize: 10
};

/**
 * Filter students for Platform Owner view
 */
export function getFilteredOwnerStudents() {
  let list = [...getStudentsList()];

  // 1. Search Query
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const email = (s.email || "").toLowerCase();
      const phone = (s.phone || "").toLowerCase();
      const id = (s.id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    });
  }

  // 2. Status Filter
  if (state.statusFilter !== "all") {
    if (state.statusFilter === "active") {
      list = list.filter((s) => s.status === "Active" && !s.isBlocked);
    } else if (state.statusFilter === "blocked") {
      list = list.filter((s) => s.status === "Blocked" || s.isBlocked);
    }
  }

  // 3. Course Filter
  if (state.courseFilter !== "all") {
    list = list.filter((s) => {
      const pCourses = s.purchasedCourses || [];
      return pCourses.some((c) => String(c.id) === String(state.courseFilter) || c.title === state.courseFilter);
    });
  }

  // 4. Book Filter
  if (state.bookFilter !== "all") {
    list = list.filter((s) => {
      const pBooks = s.purchasedBooks || [];
      return pBooks.some((b) => String(b.id) === String(state.bookFilter) || b.title === state.bookFilter);
    });
  }

  // 5. Country Filter
  if (state.countryFilter !== "all") {
    list = list.filter((s) => (s.country || "").trim().toLowerCase() === state.countryFilter.toLowerCase());
  }

  // 6. Sorting
  if (state.sortBy === "newest") {
    list.sort((a, b) => new Date(b.registrationDate || b.purchaseDate || "2026-01-01") - new Date(a.registrationDate || a.purchaseDate || "2026-01-01"));
  } else if (state.sortBy === "oldest") {
    list.sort((a, b) => new Date(a.registrationDate || a.purchaseDate || "2026-01-01") - new Date(b.registrationDate || b.purchaseDate || "2026-01-01"));
  } else if (state.sortBy === "most_spent") {
    list.sort((a, b) => (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0));
  } else if (state.sortBy === "name_asc") {
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
  }

  return list;
}

/**
 * Open Owner Students Management Page
 */
export function openOwnerStudentsManagement() {
  const userRole = window.appState?.userRole || "student";
  if (!isOwner(userRole)) {
    showCustomAlert("عذراً، صفحة إدارة الطلاب مخصصة فقط لمالك المنصة (Platform Owner).");
    window.location.hash = "#teacher/dashboard";
    return;
  }

  if (!window.location.hash.includes("owner/students") || window.location.hash.includes("owner/student-details")) {
    window.location.hash = "#owner/students";
  }

  hideAllMainSections();

  let page = document.getElementById("ownerStudentsPage");
  if (!page) {
    page = document.createElement("div");
    page.id = "ownerStudentsPage";
    page.className = "owner-students-page";
    document.body.appendChild(page);
  }

  page.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Render Page Shell
  renderOwnerStudentsPageStructure(page);
}

/**
 * Render outer layout once so search/filters maintain input focus
 */
function renderOwnerStudentsPageStructure(page) {
  const allStudents = getStudentsList();
  const activeCount = allStudents.filter((s) => s.status === "Active" && !s.isBlocked).length;
  const blockedCount = allStudents.filter((s) => s.status === "Blocked" || s.isBlocked).length;
  
  let totalEnrollments = 0;
  allStudents.forEach((s) => {
    totalEnrollments += (s.purchasedCourses || []).length + (s.purchasedBooks || []).length;
  });

  const countries = Array.from(new Set(allStudents.map((s) => s.country).filter(Boolean)));

  page.innerHTML = `
    <div dir="rtl" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 24px clamp(16px, 2.5vw, 32px);">
      
      <!-- Top Navigation / Breadcrumb -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <a href="#home" onclick="event.preventDefault(); if(typeof window.showHomePage === 'function') { window.showHomePage(); } else if(typeof window.showHomeSection === 'function') { window.showHomeSection('home'); } window.location.hash='#home';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">الرئيسية</a>
            <span>&gt;</span>
            <span style="color: #0f172a; font-weight: 700;">إدارة الطلاب المشتركين</span>
          </div>
          <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
            <span>👥</span> إدارة الطلاب الحصري لمالك المنصة
          </h1>
          <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">عرض شامل لجميع حسابات الطلاب، اشتراكاتهم، حالاتهم، وتفاصيل مدفوعاتهم.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <button type="button" onclick="if(window.exportOwnerStudentsPDF) window.exportOwnerStudentsPDF();" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; border: none; font-weight: 800; font-size: 13.5px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); transition: all 0.2s ease;">
            <span>📄</span> تصدير قائمة الطلاب (PDF)
          </button>
        </div>
      </div>

      <!-- Statistics Cards Summary Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">إجمالي الطلاب</span>
            <span style="font-size: 20px; background: #f3e8ff; padding: 6px 12px; border-radius: 10px;">👥</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #0f172a;">${allStudents.length}</div>
          <div style="font-size: 12px; color: #7c3aed; font-weight: 600; margin-top: 4px;">طالب مسجل بالمنصة</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">الطلاب النشطون</span>
            <span style="font-size: 20px; background: #dcfce7; padding: 6px 12px; border-radius: 10px;">✅</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #15803d;">${activeCount}</div>
          <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 4px;">حسابات فعالة</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">الطلاب الموقوفون</span>
            <span style="font-size: 20px; background: #fee2e2; padding: 6px 12px; border-radius: 10px;">🚫</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #b91c1c;">${blockedCount}</div>
          <div style="font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 4px;">حسابات مجمّدة / محظورة</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">إجمالي الاشتراكات</span>
            <span style="font-size: 20px; background: #e0f2fe; padding: 6px 12px; border-radius: 10px;">📚</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #0369a1;">${totalEnrollments}</div>
          <div style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 4px;">دورة وكتاب مُشتراه</div>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; align-items: center;">
          
          <!-- Search Input -->
          <div style="grid-column: span 2;">
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">البحث برقم، اسم، بريد أو هاتف الطالب:</label>
            <input type="text" id="ownerStudentsSearchInput" value="${state.searchQuery}" placeholder="🔍 اكتب اسم الطالب، البريد الإلكتروني، أو الهاتف..." style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none;" />
          </div>

          <!-- Status Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">حالة الحساب:</label>
            <select id="ownerStudentsStatusSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="all" ${state.statusFilter === "all" ? "selected" : ""}>جميع الحالات</option>
              <option value="active" ${state.statusFilter === "active" ? "selected" : ""}>نشط فقط</option>
              <option value="blocked" ${state.statusFilter === "blocked" ? "selected" : ""}>موقوف / محظور فقط</option>
            </select>
          </div>

          <!-- Course Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">حسب الدورة:</label>
            <select id="ownerStudentsCourseSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="all" ${state.courseFilter === "all" ? "selected" : ""}>جميع الدورات</option>
              ${coursesData.map((c) => `<option value="${c.id}" ${String(state.courseFilter) === String(c.id) ? "selected" : ""}>${c.title}</option>`).join("")}
            </select>
          </div>

          <!-- Book Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">حسب الكتاب:</label>
            <select id="ownerStudentsBookSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="all" ${state.bookFilter === "all" ? "selected" : ""}>جميع الكتب</option>
              ${booksData.map((b) => `<option value="${b.id}" ${String(state.bookFilter) === String(b.id) ? "selected" : ""}>${b.title}</option>`).join("")}
            </select>
          </div>

          <!-- Country Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">حسب الدولة:</label>
            <select id="ownerStudentsCountrySelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="all" ${state.countryFilter === "all" ? "selected" : ""}>جميع الدول</option>
              ${countries.map((c) => `<option value="${c.toLowerCase()}" ${state.countryFilter === c.toLowerCase() ? "selected" : ""}>${c}</option>`).join("")}
            </select>
          </div>

          <!-- Sorting Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">الترتيب حسب:</label>
            <select id="ownerStudentsSortSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="newest" ${state.sortBy === "newest" ? "selected" : ""}>الأحدث تسجيلأً</option>
              <option value="oldest" ${state.sortBy === "oldest" ? "selected" : ""}>الأقدم تسجيلأً</option>
              <option value="most_spent" ${state.sortBy === "most_spent" ? "selected" : ""}>الأعلى إنفاقاً</option>
              <option value="name_asc" ${state.sortBy === "name_asc" ? "selected" : ""}>الاسم (أ - ي)</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Students Table Container -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 14px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 800; font-size: 13px;">
                <th style="padding: 16px;">الطالب</th>
                <th style="padding: 16px;">البلد / التواصل</th>
                <th style="padding: 16px;">الدورات</th>
                <th style="padding: 16px;">الكتب</th>
                <th style="padding: 16px;">إجمالي الإنفاق</th>
                <th style="padding: 16px;">حالة الحساب</th>
                <th style="padding: 16px; text-align: center;">الإجراءات الإدارية</th>
              </tr>
            </thead>
            <tbody id="ownerStudentsTableBody">
              <!-- Dynamic content -->
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // Bind Event Listeners without full page re-render
  const searchInput = document.getElementById("ownerStudentsSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      updateOwnerStudentsTableBodyOnly();
    });
  }

  const statusSelect = document.getElementById("ownerStudentsStatusSelect");
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      state.statusFilter = e.target.value;
      updateOwnerStudentsTableBodyOnly();
    });
  }

  const courseSelect = document.getElementById("ownerStudentsCourseSelect");
  if (courseSelect) {
    courseSelect.addEventListener("change", (e) => {
      state.courseFilter = e.target.value;
      updateOwnerStudentsTableBodyOnly();
    });
  }

  const bookSelect = document.getElementById("ownerStudentsBookSelect");
  if (bookSelect) {
    bookSelect.addEventListener("change", (e) => {
      state.bookFilter = e.target.value;
      updateOwnerStudentsTableBodyOnly();
    });
  }

  const countrySelect = document.getElementById("ownerStudentsCountrySelect");
  if (countrySelect) {
    countrySelect.addEventListener("change", (e) => {
      state.countryFilter = e.target.value;
      updateOwnerStudentsTableBodyOnly();
    });
  }

  const sortSelect = document.getElementById("ownerStudentsSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      updateOwnerStudentsTableBodyOnly();
    });
  }

  updateOwnerStudentsTableBodyOnly();
}

/**
 * Updates ONLY the tbody content dynamically so focus/scroll is never lost
 */
export function updateOwnerStudentsTableBodyOnly() {
  const tbody = document.getElementById("ownerStudentsTableBody");
  if (!tbody) return;

  const filtered = getFilteredOwnerStudents();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 20px; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 700; font-size: 16px; color: #0f172a;">لا يوجد طلاب يطابقون خيارات البحث الحالية.</div>
          <p style="font-size: 13px; margin-top: 4px;">جرب تغيير كلمة البحث أو إعادة ضبط الفلاتر.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((st) => {
    const isBlocked = st.status === "Blocked" || st.isBlocked;
    const coursesCount = (st.purchasedCourses || []).length;
    const booksCount = (st.purchasedBooks || []).length;
    const totalSpent = st.totalSpent ? `$${st.totalSpent}` : "$0";
    const avatar = st.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s ease;" onclick="window.location.hash='#owner/student-details?id=${st.id}';" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
        <!-- Student Info -->
        <td style="padding: 14px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${avatar}" alt="${st.name}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;" />
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 14px;">
                ${st.name}
              </div>
              <div style="font-size: 12px; color: #64748b;">${st.email}</div>
            </div>
          </div>
        </td>

        <!-- Country & Phone -->
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #334155; font-size: 13px;">🌍 ${st.country || "غير محدد"}</div>
          <div style="font-size: 12px; color: #64748b;">📞 ${st.phone || "بدون هاتف"}</div>
        </td>

        <!-- Courses -->
        <td style="padding: 14px 16px;">
          <span style="font-weight: 800; color: #7c3aed; background: #f3e8ff; padding: 4px 10px; border-radius: 8px; font-size: 12px;">
            🎓 ${coursesCount} دورة
          </span>
        </td>

        <!-- Books -->
        <td style="padding: 14px 16px;">
          <span style="font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 4px 10px; border-radius: 8px; font-size: 12px;">
            📚 ${booksCount} كتاب
          </span>
        </td>

        <!-- Total Spent -->
        <td style="padding: 14px 16px;">
          <span style="font-weight: 900; color: #059669; font-size: 15px;">
            ${totalSpent}
          </span>
        </td>

        <!-- Status -->
        <td style="padding: 14px 16px;">
          ${isBlocked ? `
            <span style="background: #fee2e2; color: #dc2626; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
              🚫 موقوف / محظور
            </span>
          ` : `
            <span style="background: #dcfce7; color: #15803d; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
              ✅ نشط
            </span>
          `}
        </td>

        <!-- Action Column with ⋮ Three-Dot Dropdown Menu -->
        <td style="padding: 14px 16px; text-align: center; position: relative;" onclick="event.stopPropagation();">
          <button type="button" class="owner-three-dots-btn" onclick="event.stopPropagation(); window.toggleOwnerStudentMenu('${st.id}', event, this);" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; width: 36px; height: 36px; border-radius: 10px; font-weight: 900; font-size: 18px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" title="خيارات التحكم">
            ⋮
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Toggle Action Dropdown Menu for Student
 */
export function toggleOwnerStudentMenu(studentId, event, buttonElem) {
  if (event) event.stopPropagation();

  // Remove existing dropdowns
  closeAllOwnerMenus();

  const student = getStudentById(studentId);
  if (!student) return;

  const isBlocked = student.status === "Blocked" || student.isBlocked;

  const dropdown = document.createElement("div");
  dropdown.className = "owner-dropdown-menu";

  const rect = buttonElem.getBoundingClientRect();
  const menuWidth = 185;
  let top = rect.bottom + 4;
  if (top + 150 > window.innerHeight) {
    top = Math.max(10, rect.top - 150);
  }
  let left = rect.left - menuWidth + rect.width;
  if (left < 10) left = 10;
  if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10;

  dropdown.style.cssText = `
    position: fixed;
    top: ${top}px;
    left: ${left}px;
    z-index: 999999;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.18), 0 4px 10px -2px rgba(0,0,0,0.08);
    padding: 6px;
    width: ${menuWidth}px;
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  dropdown.innerHTML = `
    <button type="button" onclick="event.stopPropagation(); window.closeAllOwnerMenus(); window.location.hash='#owner/student-details?id=${student.id}';" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: transparent; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; color: #0f172a; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
      <span>👁️</span> عرض الملف الشخصي
    </button>
    <button type="button" onclick="event.stopPropagation(); window.closeAllOwnerMenus(); window.toggleOwnerStudentStatus('${student.id}');" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: transparent; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; color: ${isBlocked ? '#15803d' : '#b91c1c'}; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
      <span>${isBlocked ? '✅' : '🚫'}</span> ${isBlocked ? 'رفع الحظر' : 'حظر الحساب'}
    </button>
    <button type="button" onclick="event.stopPropagation(); window.closeAllOwnerMenus(); window.promptOwnerAddStudentNote('${student.id}');" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: transparent; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
      <span>📝</span> إضافة ملاحظة إدارية
    </button>
  `;

  document.body.appendChild(dropdown);

  const handleDismiss = (e) => {
    if (e && e.target && dropdown.contains(e.target)) return;
    closeAllOwnerMenus();
  };

  setTimeout(() => {
    document.addEventListener("click", handleDismiss, { once: true });
    window.addEventListener("scroll", closeAllOwnerMenus, { once: true, capture: true });
    window.addEventListener("resize", closeAllOwnerMenus, { once: true });
  }, 10);
}

export function closeAllOwnerMenus() {
  const dropdowns = document.querySelectorAll(".owner-dropdown-menu");
  dropdowns.forEach((d) => d.remove());
}

/**
 * Open Detailed Student Profile Standalone Page (Not Modal)
 */
export function openOwnerStudentDetailPage(studentId, options = {}) {
  const userRole = window.appState?.userRole || "student";
  if (!isOwner(userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة لمالك المنصة فقط.");
    window.location.hash = "#teacher/dashboard";
    return;
  }

  const student = getStudentById(studentId);
  if (!student) {
    showCustomAlert("لم يتم العثور على بيانات الطالب المطلوب.");
    window.location.hash = "#owner/students";
    return;
  }

  if (!window.location.hash.includes(`owner/student-details?id=${studentId}`)) {
    window.location.hash = `#owner/student-details?id=${studentId}`;
  }

  hideAllMainSections();

  let page = document.getElementById("ownerStudentDetailsPage");
  if (!page) {
    page = document.createElement("div");
    page.id = "ownerStudentDetailsPage";
    page.className = "owner-student-details-page";
    document.body.appendChild(page);
  }

  const currentScrollY = window.scrollY;
  page.classList.remove("hidden");

  const isBlocked = student.status === "Blocked" || student.isBlocked;
  const pCourses = student.purchasedCourses || [];
  const pBooks = student.purchasedBooks || [];
  const notes = student.notes || [];

  // Filter reviews submitted by this student
  const studentReviews = reviewsData.filter(
    (r) => String(r.studentId) === String(student.id) || r.studentName === student.name
  );

  page.innerHTML = `
    <div dir="rtl" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 28px clamp(16px, 2.5vw, 32px);">
      
      <!-- Top Navigation Header / Breadcrumbs -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <a href="#home" onclick="event.preventDefault(); window.location.hash='#home';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">الرئيسية</a>
            <span>&gt;</span>
            <a href="#owner/students" onclick="event.preventDefault(); window.location.hash='#owner/students';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">إدارة الطلاب</a>
            <span>&gt;</span>
            <span style="color: #0f172a; font-weight: 700;">الملف الشخصي للطلب</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
            <span>👤</span> الملف الشخصي الكامل للطالب: ${student.name}
          </h1>
        </div>

        <button type="button" onclick="window.location.hash='#owner/students';" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; font-weight: 800; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease;">
          ⬅️ العودة لقائمة الطلاب
        </button>
      </div>

      <!-- Main Profile Summary Card -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
          
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="${student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop'}" alt="${student.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 4px solid #7c3aed; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.2);" />
            <div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
                <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">${student.name}</h2>
                <span style="background: ${isBlocked ? '#fee2e2' : '#dcfce7'}; color: ${isBlocked ? '#dc2626' : '#15803d'}; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 16px;">
                  ${isBlocked ? '🚫 حساب موقوف' : '✅ حساب نشط'}
                </span>
              </div>
              <div style="font-size: 13.5px; color: #64748b; display: flex; flex-wrap: wrap; gap: 16px; margin-top: 6px;">
                <span>🆔 الرقم المرجعي: <strong style="color: #0f172a;">${student.id}</strong></span>
                <span>📧 البريد الإلكتروني: <strong style="color: #0f172a;">${student.email}</strong></span>
                <span>📞 الهاتف: <strong style="color: #0f172a;">${student.phone || "بدون هاتف"}</strong></span>
                <span>🌍 الدولة: <strong style="color: #0f172a;">${student.country || "غير محدد"}</strong></span>
                <span>📅 تاريخ التسجيل: <strong style="color: #0f172a;">${student.registrationDate || "2026-05-10"}</strong></span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <button type="button" onclick="window.toggleOwnerStudentStatus('${student.id}');" style="padding: 10px 18px; border-radius: 12px; background: ${isBlocked ? '#10b981' : '#ef4444'}; color: #ffffff; border: none; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
              ${isBlocked ? '✅ رفع الحظر' : '🚫 حظر الحساب'}
            </button>
            <button type="button" onclick="window.promptOwnerAddStudentNote('${student.id}');" style="padding: 10px 18px; border-radius: 12px; background: #7c3aed; color: #ffffff; border: none; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);">
              📝 إضافة ملاحظة إدارية
            </button>
          </div>

        </div>
      </div>

      <!-- Quick Numbers / Statistics Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 28px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">الدورات التدريبية</div>
          <div style="font-size: 26px; font-weight: 900; color: #7c3aed;">🎓 ${pCourses.length} دورات</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">الكتب الإلكترونية</div>
          <div style="font-size: 26px; font-weight: 900; color: #0284c7;">📚 ${pBooks.length} كتب</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">التقييمات المكتوبة</div>
          <div style="font-size: 26px; font-weight: 900; color: #d97706;">⭐ ${studentReviews.length} تقييمات</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">إجمالي المدفوعات</div>
          <div style="font-size: 26px; font-weight: 900; color: #059669;">💵 $${student.totalSpent || 0}</div>
        </div>
      </div>

      <!-- Enrolled Courses Section -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
          <span>🎓</span> الدورات التدريبية المشترك فيها (${pCourses.length})
        </h3>
        ${pCourses.length === 0 ? `
          <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد دورات مسجلة لهذا الطالب حتى الآن.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${pCourses.map((c) => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="font-weight: 800; font-size: 15px; color: #0f172a;">${c.title}</div>
                  <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">تاريخ الاشتراك: ${c.purchaseDate || "2026-06-15"} • السعر المدفوع: $${c.price || 299}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="text-align: left;">
                    <div style="font-weight: 800; color: #7c3aed; font-size: 14px;">نسبة الإنجاز: ${c.progress || 0}%</div>
                    <div style="font-size: 12px; color: #059669; font-weight: 700;">حالة الدورة: ${c.status || "جارٍ التعلم"}</div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Purchased Books Section -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
          <span>📚</span> الكتب الإلكترونية المشتراة (${pBooks.length})
        </h3>
        ${pBooks.length === 0 ? `
          <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد كتب مشتراة لهذا الطالب حتى الآن.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${pBooks.map((b) => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="font-weight: 800; font-size: 15px; color: #0f172a;">${b.title}</div>
                  <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">تاريخ الشراء: ${b.purchaseDate || "2026-07-01"}</div>
                </div>
                <div style="font-weight: 900; color: #059669; font-size: 16px;">$${b.price || 29}</div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Reviews & Ratings Submitted by Student -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
          <span>⭐</span> التقييمات والملاحظات المقدمة من الطالب (${studentReviews.length})
        </h3>
        ${studentReviews.length === 0 ? `
          <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد تقييمات منشورة لهذا الطالب حتى الآن.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${studentReviews.map((r) => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 800; color: #0f172a; font-size: 14px;">📖 ${r.courseOrBookName || 'محتوى تعليمي'}</span>
                  <span style="color: #f59e0b; font-weight: 800;">${'⭐'.repeat(r.stars || 5)}</span>
                </div>
                <h4 style="font-size: 14px; font-weight: 800; color: #1e293b; margin: 0 0 4px;">${r.reviewTitle || 'تقييم ممتاز'}</h4>
                <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">${r.reviewText || r.comment || ''}</p>
                <div style="font-size: 11.5px; color: #94a3b8; margin-top: 8px;">تاريخ النشر: ${r.createdDate || '2026-07-28'}</div>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Administrative Notes Section -->
      <div id="ownerStudentNotesSection" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        ${getStudentNotesSectionHTML(notes, student.id)}
      </div>

    </div>
  `;

  if (!options.preserveScroll) {
    window.scrollTo({ top: 0 });
  } else {
    window.scrollTo({ top: currentScrollY });
  }
}

export function getStudentNotesSectionHTML(notes, studentId) {
  return `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
        <span>📝</span> الملاحظات الإدارية الموثقة (${notes.length})
      </h3>
      <button type="button" onclick="window.promptOwnerAddStudentNote('${studentId}');" style="padding: 8px 16px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-weight: 700; font-size: 12.5px; cursor: pointer;">
        إضافة ملاحظة إدارية جديدة +
      </button>
    </div>
    ${notes.length === 0 ? `
      <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد ملاحظات مدونة لهذا الطالب.</div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${notes.map((n) => `
          <div style="background: #fffbebfb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; font-size: 13.5px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #92400e; font-weight: 800; margin-bottom: 6px;">
              <span>👑 مالك المنصة</span>
              <span>${n.date || "اليوم"}</span>
            </div>
            <div style="color: #78350f; line-height: 1.5; white-space: pre-wrap;">${n.text}</div>
          </div>
        `).join("")}
      </div>
    `}
  `;
}

export function updateStudentNotesSectionUI(studentId) {
  const container = document.getElementById("ownerStudentNotesSection");
  if (!container) return false;
  const student = getStudentById(studentId);
  const notes = student ? (student.notes || []) : [];
  container.innerHTML = getStudentNotesSectionHTML(notes, studentId);
  return true;
}

/**
 * Toggle Student Block/Active Status
 */
export function toggleOwnerStudentStatus(studentId) {
  const student = getStudentById(studentId);
  if (!student) return;

  const willBlock = !(student.status === "Blocked" || student.isBlocked);

  const dialogTitle = willBlock
    ? `هل أنت متأكد من حظر حساب الطالب؟`
    : `هل تريد رفع الحظر عن الحساب؟`;
  const dialogMsg = willBlock
    ? `سيتم حظر حساب الطالب (${student.name}). لن يتمكن الطالب من تسجيل الدخول إلى المنصة.`
    : `سيتم رفع الحظر عن حساب الطالب (${student.name}) وإعادة إمكانية الدخول كالمعتاد.`;
  const confirmText = willBlock ? "حظر الحساب" : "رفع الحظر";
  const cancelText = "إلغاء";

  const currentScrollY = window.scrollY;

  showConfirmDialog({
    title: dialogTitle,
    message: dialogMsg,
    confirmText: confirmText,
    cancelText: cancelText,
    danger: willBlock,
    icon: willBlock ? "🚫" : "✅",
    onConfirm: () => {
      toggleStudentBlock(studentId);
      setAccountStatus(studentId, willBlock ? "BLOCKED" : "ACTIVE", { email: student.email, id: student.id });
      
      if (typeof showToast === "function") {
        showToast({
          type: willBlock ? "warning" : "success",
          title: "تم تحديث حالة الحساب",
          message: willBlock ? `تم حظر حساب الطالب ${student.name} بنجاح.` : `تم رفع الحظر عن حساب الطالب ${student.name} بنجاح.`
        });
      }

      updateOwnerStudentsTableBodyOnly();

      const page = document.getElementById("ownerStudentDetailsPage");
      if (page && !page.classList.contains("hidden")) {
        openOwnerStudentDetailPage(studentId, { preserveScroll: true });
      } else {
        window.scrollTo({ top: currentScrollY });
      }
    }
  });
}

/**
 * Prompt to add admin note to student using custom modal dialog
 */
export function promptOwnerAddStudentNote(studentId) {
  if (!studentId) return;
  const allStudents = getStudentsList();
  const student = allStudents.find((s) => String(s.id) === String(studentId));
  const studentName = student ? student.name : "الطالب";

  // Remove any existing note modal
  const existingModal = document.getElementById("ownerStudentNoteModal");
  if (existingModal) existingModal.remove();

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "ownerStudentNoteModal";
  modalOverlay.className = "sm-dialog-overlay";
  modalOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  `;

  modalOverlay.innerHTML = `
    <div class="sm-dialog-card" dir="rtl" style="background: #ffffff; border-radius: 20px; max-width: 520px; width: 100%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; text-align: right; box-sizing: border-box;" role="dialog" aria-modal="true">
      
      <!-- Modal Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 18px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(124, 58, 237, 0.1); color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
            📝
          </div>
          <div>
            <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0;">إضافة ملاحظة إدارية جديدة</h3>
            <p style="font-size: 12.5px; color: #64748b; margin: 2px 0 0 0;">الطالب: <strong style="color: #7c3aed;">${studentName}</strong></p>
          </div>
        </div>
        <button type="button" id="closeStudentNoteModalBtn" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;" aria-label="إغلاق">✕</button>
      </div>

      <!-- Error Message Container (Hidden by default) -->
      <div id="studentNoteErrorMsg" style="display: none; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 700; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px;">
        ⚠️ يرجى كتابة نص الملاحظة الإدارية أولاً (لا يمكن حفظ ملاحظة فارغة).
      </div>

      <!-- Form Body -->
      <div style="margin-bottom: 20px;">
        <label for="studentNoteTextarea" style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">
          نص الملاحظة الإدارية <span style="color: #ef4444;">*</span>
        </label>
        <textarea id="studentNoteTextarea" rows="4" style="width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none; font-size: 13.5px; font-family: inherit; color: #0f172a; line-height: 1.6; resize: vertical; box-sizing: border-box; transition: border-color 0.2s ease;" placeholder="اكتب الملاحظة الإدارية الموثقة هنا..."></textarea>
      </div>

      <!-- Form Actions -->
      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        <button type="button" id="cancelStudentNoteBtn" style="padding: 10px 20px; border-radius: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">
          إلغاء
        </button>
        <button type="button" id="saveStudentNoteBtn" style="padding: 10px 24px; border-radius: 12px; background: #7c3aed; color: #ffffff; border: none; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); transition: all 0.2s ease;">
          حفظ الملاحظة
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modalOverlay);

  const textarea = modalOverlay.querySelector("#studentNoteTextarea");
  const saveBtn = modalOverlay.querySelector("#saveStudentNoteBtn");
  const cancelBtn = modalOverlay.querySelector("#cancelStudentNoteBtn");
  const closeBtn = modalOverlay.querySelector("#closeStudentNoteModalBtn");
  const errorMsg = modalOverlay.querySelector("#studentNoteErrorMsg");

  // Auto focus textarea without resetting page scroll
  setTimeout(() => textarea?.focus({ preventScroll: true }), 60);

  // Close modal handler
  function closeModal() {
    modalOverlay.remove();
  }

  cancelBtn?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  textarea?.addEventListener("input", () => {
    if (errorMsg) errorMsg.style.display = "none";
    if (textarea) textarea.style.borderColor = "#cbd5e1";
  });

  // Save handler
  saveBtn?.addEventListener("click", () => {
    const text = textarea ? textarea.value.trim() : "";
    if (!text) {
      if (errorMsg) errorMsg.style.display = "block";
      if (textarea) {
        textarea.style.borderColor = "#ef4444";
        textarea.focus({ preventScroll: true });
      }
      return;
    }

    addPrivateNoteToStudent(studentId, text);

    if (typeof showToast === "function") {
      showToast({ type: "success", title: "تم الحفظ", message: "تمت إضافة الملاحظة الإدارية بنجاح." });
    }

    closeModal();

    // Refresh student notes section in-place without resetting scroll position
    const updatedInPlace = updateStudentNotesSectionUI(studentId);
    if (!updatedInPlace) {
      const page = document.getElementById("ownerStudentDetailsPage");
      if (page && !page.classList.contains("hidden")) {
        openOwnerStudentDetailPage(studentId, { preserveScroll: true });
      }
    }
  });
}

/**
 * Export Students List as formatted Printable PDF
 */
export function exportOwnerStudentsPDF() {
  const students = getFilteredOwnerStudents();
  if (students.length === 0) {
    showCustomAlert("لا توجد بيانات طلاب لتصديرها.");
    return;
  }

  // Remove existing print container if any
  const oldContainer = document.getElementById("ownerStudentsPdfPrintContainer");
  if (oldContainer) oldContainer.remove();

  const printContainer = document.createElement("div");
  printContainer.id = "ownerStudentsPdfPrintContainer";
  printContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #ffffff;
    z-index: 999999;
    padding: 30px;
    overflow-y: auto;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const totalSpentSum = students.reduce((sum, s) => sum + (Number(s.totalSpent) || 0), 0);

  printContainer.innerHTML = `
    <style>
      @media print {
        body > *:not(#ownerStudentsPdfPrintContainer) { display: none !important; }
        #ownerStudentsPdfPrintContainer { position: absolute !important; inset: 0 !important; padding: 15mm !important; }
      }
    </style>
    <div dir="rtl" style="max-width: 1000px; margin: 0 auto; background: #ffffff;">
      
      <!-- Report Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">🎓 منصة StudyMart التعليمية - تقرير الطلاب</h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">قائمة رسمية مستخرجة لمالك المنصة • تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style="text-align: left;">
          <div style="font-weight: 800; font-size: 14px; color: #7c3aed;">إجمالي السجلات: ${students.length} طالب</div>
          <div style="font-size: 12px; color: #059669; font-weight: 700; margin-top: 2px;">إجمالي المبيعات: $${totalSpentSum}</div>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
            <th style="padding: 10px; border: 1px solid #cbd5e1;">رقم الطالب</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">اسم الطالب</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">البريد الإلكتروني</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">الهاتف / الدولة</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">الدورات والكتب</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">إجمالي الإنفاق</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((s) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">${s.id}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${s.name}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${s.email}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${s.phone || '-'} (${s.country || 'غير محدد'})</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">🎓 ${(s.purchasedCourses || []).length} دورة • 📚 ${(s.purchasedBooks || []).length} كتاب</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #059669;">$${s.totalSpent || 0}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800;">${(s.status === 'Blocked' || s.isBlocked) ? 'محظور' : 'نشط'}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

    </div>
  `;

  document.body.appendChild(printContainer);

  setTimeout(() => {
    window.print();
    printContainer.remove();
  }, 200);
}

// Global Window Bindings
if (typeof window !== "undefined") {
  window.openOwnerStudentsManagement = openOwnerStudentsManagement;
  window.openOwnerStudentDetailPage = openOwnerStudentDetailPage;
  window.toggleOwnerStudentStatus = toggleOwnerStudentStatus;
  window.promptOwnerAddStudentNote = promptOwnerAddStudentNote;
  window.exportOwnerStudentsPDF = exportOwnerStudentsPDF;
  window.updateOwnerStudentsTableBodyOnly = updateOwnerStudentsTableBodyOnly;
  window.toggleOwnerStudentMenu = toggleOwnerStudentMenu;
  window.closeAllOwnerMenus = closeAllOwnerMenus;
}
