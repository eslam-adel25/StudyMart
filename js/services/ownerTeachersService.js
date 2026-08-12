import { teachersData, getTeacherById } from "../data/teachers.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { reviewsData } from "../data/reviewsData.js";
import { showCustomAlert } from "../utils/helpers.js";
import { showToast, showConfirmDialog } from "./notificationService.js";
import { hideAllMainSections } from "./layoutService.js";
import { isOwner } from "./permissionService.js";
import { setAccountStatus, getAccountStatus, isAccountBlocked } from "./accountStatusService.js";

const TEACHERS_STORAGE_KEY = "lms_owner_teachers_v1";

// State
let state = {
  searchQuery: "",
  specializationFilter: "all",
  statusFilter: "all",
  sortBy: "most_students",
  currentPage: 1,
  pageSize: 10
};

/**
 * Get all teachers combined with persistent overrides (Status, Notes) and calculated course/book metrics
 */
export function getOwnerTeachersList() {
  let overrides = {};
  try {
    const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (raw) overrides = JSON.parse(raw);
  } catch (e) {}

  let mergedTeachers = [...teachersData];

  // Merge registered teacher users from studymart_users
  if (typeof window !== "undefined") {
    try {
      const rawUsers = localStorage.getItem("studymart_users");
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const registeredTeachers = users.filter((u) => {
          const role = (u.accountType || u.role || "").toLowerCase();
          return role === "teacher";
        });

        registeredTeachers.forEach((rt) => {
          const rtEmail = (rt.email || "").toLowerCase();
          const exists = mergedTeachers.some((t) => 
            (t.id && rt.id && String(t.id) === String(rt.id)) || 
            (t.email && rtEmail && t.email.toLowerCase() === rtEmail)
          );
          if (!exists && rtEmail) {
            mergedTeachers.push({
              id: rt.id || `teacher-reg-${Date.now()}`,
              name: rt.fullName || rt.name || "معلم جديد",
              nameEn: rt.fullName || rt.name || "New Teacher",
              email: rt.email,
              gender: rt.gender || "male",
              avatar: rt.avatar || rt.image || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
              role: "معلم في المنصة",
              bio: "معلم مسجل جديد في المنصة.",
              experience: "جديد",
              company: "StudyMart",
              specialization: "تعليم إلكتروني",
              rating: "5.0",
              studentsCount: "0",
              coursesCount: 0,
              phone: rt.phone || ""
            });
          }
        });
      }
    } catch (e) {
      console.error("Error merging registered teachers from studymart_users", e);
    }
  }

  return mergedTeachers.map((t) => {
    const ov = overrides[t.id] || {};
    
    // Dynamic match with coursesData and booksData
    const teacherCourses = coursesData.filter((c) => {
      const inst = (c.instructor || c.instructorName || c.author || "").toLowerCase();
      const tName = (t.name || "").toLowerCase();
      return inst.includes(tName) || tName.includes(inst);
    });

    const teacherBooks = booksData.filter((b) => {
      const auth = (b.author || "").toLowerCase();
      const tName = (t.name || "").toLowerCase();
      return auth.includes(tName) || tName.includes(auth);
    });

    let calculatedStudents = 0;
    let calculatedRevenue = 0;

    teacherCourses.forEach((c) => {
      const count = Number(c.students || c.studentsCount || 120);
      const price = Number(c.price || 99);
      calculatedStudents += count;
      calculatedRevenue += count * price * 0.7; // 70% share
    });

    const accStatus = getAccountStatus(t.id) || (t.email ? getAccountStatus(t.email) : "ACTIVE");
    const isSusp = accStatus === "SUSPENDED" || accStatus === "BLOCKED" || ov.status === "Suspended" || ov.status === "Blocked" || isAccountBlocked(t.id) || (t.email && isAccountBlocked(t.email));
    const teacherStatus = isSusp ? "Suspended" : "Active";

    return {
      ...t,
      status: teacherStatus,
      notes: ov.notes || t.notes || [],
      authoredCourses: teacherCourses,
      authoredBooks: teacherBooks,
      calculatedStudents: calculatedStudents || (parseInt(t.studentsCount) * 1000) || 0,
      calculatedRevenue: Math.round(calculatedRevenue) || 0
    };
  });
}

function saveTeacherOverride(teacherId, updateData) {
  try {
    let overrides = {};
    const raw = localStorage.getItem(TEACHERS_STORAGE_KEY);
    if (raw) overrides = JSON.parse(raw);

    overrides[teacherId] = {
      ...(overrides[teacherId] || {}),
      ...updateData
    };

    localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error("Error saving teacher override", e);
  }
}

/**
 * Filter teachers list according to active search/filters
 */
export function getFilteredOwnerTeachers() {
  let list = getOwnerTeachersList();

  // 1. Search Query
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const nameEn = (t.nameEn || "").toLowerCase();
      const role = (t.role || "").toLowerCase();
      const spec = (t.specialization || "").toLowerCase();
      const comp = (t.company || "").toLowerCase();
      return name.includes(q) || nameEn.includes(q) || role.includes(q) || spec.includes(q) || comp.includes(q);
    });
  }

  // 2. Specialization Filter
  if (state.specializationFilter !== "all") {
    const filterKey = state.specializationFilter.toLowerCase();
    list = list.filter((t) => {
      const spec = (t.specialization || t.role || "").toLowerCase();
      return spec.includes(filterKey);
    });
  }

  // 3. Status Filter
  if (state.statusFilter !== "all") {
    list = list.filter((t) => t.status.toLowerCase() === state.statusFilter.toLowerCase());
  }

  // 4. Sorting
  if (state.sortBy === "most_students") {
    list.sort((a, b) => (b.calculatedStudents || 0) - (a.calculatedStudents || 0));
  } else if (state.sortBy === "highest_rating") {
    list.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
  } else if (state.sortBy === "most_courses") {
    list.sort((a, b) => (b.authoredCourses.length || b.coursesCount || 0) - (a.authoredCourses.length || a.coursesCount || 0));
  } else if (state.sortBy === "name_asc") {
    list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
  }

  return list;
}

/**
 * Open Owner Teachers Management Page
 */
export function openOwnerTeachersManagement() {
  const userRole = window.appState?.userRole || "student";
  if (!isOwner(userRole)) {
    showCustomAlert("عذراً، صفحة إدارة المعلمين مخصصة فقط لمالك المنصة (Platform Owner).");
    window.location.hash = "#teacher/dashboard";
    return;
  }

  if (!window.location.hash.includes("owner/teachers") || window.location.hash.includes("owner/teacher-details")) {
    window.location.hash = "#owner/teachers";
  }

  hideAllMainSections();

  let page = document.getElementById("ownerTeachersPage");
  if (!page) {
    page = document.createElement("div");
    page.id = "ownerTeachersPage";
    page.className = "owner-teachers-page";
    document.body.appendChild(page);
  }

  page.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderOwnerTeachersPageStructure(page);
}

/**
 * Render outer layout once so search inputs maintain focus
 */
function renderOwnerTeachersPageStructure(page) {
  const allTeachers = getOwnerTeachersList();
  const activeCount = allTeachers.filter((t) => t.status === "Active").length;

  let totalPublishedCourses = 0;
  let totalTeacherSales = 0;
  allTeachers.forEach((t) => {
    totalPublishedCourses += t.authoredCourses.length || t.coursesCount || 0;
    totalTeacherSales += t.calculatedRevenue || 0;
  });

  page.innerHTML = `
    <div dir="rtl" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 24px clamp(16px, 2.5vw, 32px);">
      
      <!-- Top Navigation / Breadcrumb -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <a href="#home" onclick="event.preventDefault(); if(typeof window.showHomePage === 'function') { window.showHomePage(); } else if(typeof window.showHomeSection === 'function') { window.showHomeSection('home'); } window.location.hash='#home';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">الرئيسية</a>
            <span>&gt;</span>
            <span style="color: #0f172a; font-weight: 700;">إدارة المعلمين والمدربين</span>
          </div>
          <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
            <span>👨‍🏫</span> إدارة المعلمين والخبراء (Platform Owner)
          </h1>
          <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">إدارة شاملة لطاقم التدريس بالمنصة، متابعة الدورات المنشورة، المبيعات، والتحكم بحالات الحسابات.</p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <button type="button" onclick="if(window.exportOwnerTeachersPDF) window.exportOwnerTeachersPDF();" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; border: none; font-weight: 800; font-size: 13.5px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); transition: all 0.2s ease;">
            <span>📄</span> تصدير قائمة المعلمين (PDF)
          </button>
        </div>
      </div>

      <!-- Statistics Cards Summary Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 28px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">إجمالي المعلمين</span>
            <span style="font-size: 20px; background: #f3e8ff; padding: 6px 12px; border-radius: 10px;">👨‍🏫</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #0f172a;">${allTeachers.length}</div>
          <div style="font-size: 12px; color: #7c3aed; font-weight: 600; margin-top: 4px;">معلم مدرب بالمنصة</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">المعلمون النشطون</span>
            <span style="font-size: 20px; background: #dcfce7; padding: 6px 12px; border-radius: 10px;">✅</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #15803d;">${activeCount}</div>
          <div style="font-size: 12px; color: #16a34a; font-weight: 600; margin-top: 4px;">حسابات نشطة ومفعلة</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">إجمالي الدورات المنشورة</span>
            <span style="font-size: 20px; background: #e0f2fe; padding: 6px 12px; border-radius: 10px;">📚</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #0369a1;">${totalPublishedCourses}</div>
          <div style="font-size: 12px; color: #0284c7; font-weight: 600; margin-top: 4px;">دورة تدريبية مفعلة</div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 13px; color: #64748b; font-weight: 700;">إجمالي إيرادات المعلمين</span>
            <span style="font-size: 20px; background: #fef3c7; padding: 6px 12px; border-radius: 10px;">💵</span>
          </div>
          <div style="font-size: 28px; font-weight: 900; color: #d97706;">$${totalTeacherSales.toLocaleString("ar-EG")}</div>
          <div style="font-size: 12px; color: #b45309; font-weight: 600; margin-top: 4px;">مستحقات ومبيعات موثقة</div>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; align-items: center;">
          
          <!-- Search Input -->
          <div style="grid-column: span 2;">
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">البحث بالاسم، التخصص، أو الشركة:</label>
            <input type="text" id="ownerTeachersSearchInput" value="${state.searchQuery}" placeholder="🔍 اكتب اسم المعلم، التخصص، أو الشركة (مثال: Flutter, Google)..." style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 14px; outline: none;" />
          </div>

          <!-- Specialization Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">التخصص / المجال:</label>
            <select id="ownerTeachersSpecSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="all" ${state.specializationFilter === "all" ? "selected" : ""}>جميع التخصصات</option>
              <option value="flutter" ${state.specializationFilter === "flutter" ? "selected" : ""}>تطوير الجوال (Flutter)</option>
              <option value="marketing" ${state.specializationFilter === "marketing" ? "selected" : ""}>التسويق الرقمي</option>
              <option value="design" ${state.specializationFilter === "design" ? "selected" : ""}>تصميم UI/UX</option>
              <option value="python" ${state.specializationFilter === "python" ? "selected" : ""}>الذكاء الاصطناعي & Python</option>
              <option value=".net" ${state.specializationFilter === ".net" ? "selected" : ""}>تطوير الويب المتكامل</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">حالة الحساب:</label>
            <select id="ownerTeachersStatusSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="all" ${state.statusFilter === "all" ? "selected" : ""}>جميع الحالات</option>
              <option value="active" ${state.statusFilter === "active" ? "selected" : ""}>نشط فقط</option>
              <option value="suspended" ${state.statusFilter === "suspended" ? "selected" : ""}>موقوف / معلق</option>
            </select>
          </div>

          <!-- Sorting Filter -->
          <div>
            <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 6px;">الترتيب حسب:</label>
            <select id="ownerTeachersSortSelect" style="width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #ffffff;">
              <option value="most_students" ${state.sortBy === "most_students" ? "selected" : ""}>الأكثر طلاباً</option>
              <option value="highest_rating" ${state.sortBy === "highest_rating" ? "selected" : ""}>الأعلى تقييماً</option>
              <option value="most_courses" ${state.sortBy === "most_courses" ? "selected" : ""}>الأكثر دورات</option>
              <option value="name_asc" ${state.sortBy === "name_asc" ? "selected" : ""}>الاسم (أ - ي)</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Teachers Table Container -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 14px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 800; font-size: 13px;">
                <th style="padding: 16px;">المعلم / الخبير</th>
                <th style="padding: 16px;">التخصص والتاريخ المهني</th>
                <th style="padding: 16px;">الدورات المنشورة</th>
                <th style="padding: 16px;">إجمالي الطلاب</th>
                <th style="padding: 16px;">التقييم ⭐</th>
                <th style="padding: 16px;">الحالة</th>
                <th style="padding: 16px; text-align: center;">الإجراءات الإدارية</th>
              </tr>
            </thead>
            <tbody id="ownerTeachersTableBody">
              <!-- Dynamic content -->
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // Bind Event Listeners
  const searchInput = document.getElementById("ownerTeachersSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      updateOwnerTeachersTableBodyOnly();
    });
  }

  const specSelect = document.getElementById("ownerTeachersSpecSelect");
  if (specSelect) {
    specSelect.addEventListener("change", (e) => {
      state.specializationFilter = e.target.value;
      updateOwnerTeachersTableBodyOnly();
    });
  }

  const statusSelect = document.getElementById("ownerTeachersStatusSelect");
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      state.statusFilter = e.target.value;
      updateOwnerTeachersTableBodyOnly();
    });
  }

  const sortSelect = document.getElementById("ownerTeachersSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      updateOwnerTeachersTableBodyOnly();
    });
  }

  updateOwnerTeachersTableBodyOnly();
}

/**
 * Updates ONLY the tbody content dynamically
 */
export function updateOwnerTeachersTableBodyOnly() {
  const tbody = document.getElementById("ownerTeachersTableBody");
  if (!tbody) return;

  const filtered = getFilteredOwnerTeachers();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 20px; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <div style="font-weight: 700; font-size: 16px; color: #0f172a;">لا يوجد معلمون يطابقون خيارات البحث الحالية.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((t) => {
    const isSuspended = t.status === "Suspended";
    const coursesCount = t.authoredCourses.length || t.coursesCount || 0;
    const booksCount = t.authoredBooks.length || 0;
    const studentsCountFormatted = t.calculatedStudents ? t.calculatedStudents.toLocaleString("ar-EG") : (t.studentsCount || "0");
    const avatar = t.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80";

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s ease;" onclick="window.location.hash='#owner/teacher-details?id=${t.id}';" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
        <!-- Teacher Info -->
        <td style="padding: 14px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${avatar}" alt="${t.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #7c3aed;" />
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 14px;">
                ${t.name}
              </div>
              <div style="font-size: 12px; color: #64748b;">${t.role}</div>
            </div>
          </div>
        </td>

        <!-- Specialization & Experience -->
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #334155; font-size: 13px;">🎯 ${t.specialization}</div>
          <div style="font-size: 12px; color: #64748b;">💼 ${t.company} • ${t.experience}</div>
        </td>

        <!-- Courses & Books -->
        <td style="padding: 14px 16px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-weight: 800; color: #7c3aed; background: #f3e8ff; padding: 2px 8px; border-radius: 6px; font-size: 12px; display: inline-block; width: max-content;">
              🎓 ${coursesCount} دورة
            </span>
            ${booksCount > 0 ? `<span style="font-weight: 700; color: #0284c7; font-size: 11px;">📚 ${booksCount} كتاب</span>` : ''}
          </div>
        </td>

        <!-- Students Count -->
        <td style="padding: 14px 16px;">
          <span style="font-weight: 900; color: #0f172a; font-size: 14px;">
            👥 ${studentsCountFormatted}
          </span>
        </td>

        <!-- Rating -->
        <td style="padding: 14px 16px;">
          <span style="color: #d97706; font-weight: 800; font-size: 14px;">
            ⭐ ${t.rating || '4.9'}
          </span>
        </td>

        <!-- Status -->
        <td style="padding: 14px 16px;">
          ${isSuspended ? `
            <span style="background: #fee2e2; color: #dc2626; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
              🚫 موقوف
            </span>
          ` : `
            <span style="background: #dcfce7; color: #15803d; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
              ✅ نشط
            </span>
          `}
        </td>

        <!-- Action Column with ⋮ Three-Dot Dropdown Menu -->
        <td style="padding: 14px 16px; text-align: center; position: relative;" onclick="event.stopPropagation();">
          <button type="button" class="owner-three-dots-btn" onclick="event.stopPropagation(); window.toggleOwnerTeacherMenu('${t.id}', event, this);" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; width: 36px; height: 36px; border-radius: 10px; font-weight: 900; font-size: 18px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" title="خيارات التحكم">
            ⋮
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

/**
 * Toggle Action Dropdown Menu for Teacher
 */
export function toggleOwnerTeacherMenu(teacherId, event, buttonElem) {
  if (event) event.stopPropagation();

  closeAllOwnerTeacherMenus();

  const teacher = getTeacherById(teacherId) || getOwnerTeachersList().find((t) => String(t.id) === String(teacherId));
  if (!teacher) return;

  const isSuspended = teacher.status === "Suspended" || teacher.status === "Blocked";

  const dropdown = document.createElement("div");
  dropdown.className = "owner-teacher-dropdown-menu";

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
    <button type="button" onclick="event.stopPropagation(); window.closeAllOwnerTeacherMenus(); window.location.hash='#owner/teacher-details?id=${teacher.id}';" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: transparent; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; color: #0f172a; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
      <span>👁️</span> عرض الملف التفصيلي
    </button>
    <button type="button" onclick="event.stopPropagation(); window.closeAllOwnerTeacherMenus(); window.toggleOwnerTeacherStatus('${teacher.id}');" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: transparent; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; color: ${isSuspended ? '#15803d' : '#b91c1c'}; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
      <span>${isSuspended ? '✅' : '🚫'}</span> ${isSuspended ? 'إعادة الحساب للعمل' : 'إيقاف حساب المعلم'}
    </button>
    <button type="button" onclick="event.stopPropagation(); window.closeAllOwnerTeacherMenus(); window.promptOwnerAddTeacherNote('${teacher.id}');" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; background: transparent; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
      <span>📝</span> إضافة ملاحظة إدارية
    </button>
  `;

  document.body.appendChild(dropdown);

  const handleDismiss = (e) => {
    if (e && e.target && dropdown.contains(e.target)) return;
    closeAllOwnerTeacherMenus();
  };

  setTimeout(() => {
    document.addEventListener("click", handleDismiss, { once: true });
    window.addEventListener("scroll", closeAllOwnerTeacherMenus, { once: true, capture: true });
    window.addEventListener("resize", closeAllOwnerTeacherMenus, { once: true });
  }, 10);
}

export function closeAllOwnerTeacherMenus() {
  const dropdowns = document.querySelectorAll(".owner-teacher-dropdown-menu");
  dropdowns.forEach((d) => d.remove());
}

/**
 * Open Detailed Teacher Profile Standalone Page (Not Modal)
 */
export function openOwnerTeacherDetailPage(teacherId, options = {}) {
  const userRole = window.appState?.userRole || "student";
  if (!isOwner(userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة لمالك المنصة فقط.");
    window.location.hash = "#teacher/dashboard";
    return;
  }

  const allTeachers = getOwnerTeachersList();
  const teacher = allTeachers.find((t) => String(t.id) === String(teacherId)) || getTeacherById(teacherId);

  if (!teacher) {
    showCustomAlert("لم يتم العثور على بيانات المعلم المطلوب.");
    window.location.hash = "#owner/teachers";
    return;
  }

  if (!window.location.hash.includes(`owner/teacher-details?id=${teacherId}`)) {
    window.location.hash = `#owner/teacher-details?id=${teacherId}`;
  }

  hideAllMainSections();

  let page = document.getElementById("ownerTeacherDetailsPage");
  if (!page) {
    page = document.createElement("div");
    page.id = "ownerTeacherDetailsPage";
    page.className = "owner-teacher-details-page";
    document.body.appendChild(page);
  }

  const currentScrollY = window.scrollY;
  page.classList.remove("hidden");

  const isSuspended = teacher.status === "Suspended";
  const courses = teacher.authoredCourses || [];
  const books = teacher.authoredBooks || [];
  const notes = teacher.notes || [];

  // Filter reviews for teacher's courses
  const teacherReviews = reviewsData.filter((r) => {
    const courseMatch = courses.some((c) => String(c.id) === String(r.courseId) || c.title === r.courseOrBookName);
    return courseMatch || (r.teacherName && r.teacherName.includes(teacher.name));
  });

  page.innerHTML = `
    <div dir="rtl" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 28px clamp(16px, 2.5vw, 32px);">
      
      <!-- Top Navigation Header / Breadcrumbs -->
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <a href="#home" onclick="event.preventDefault(); window.location.hash='#home';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">الرئيسية</a>
            <span>&gt;</span>
            <a href="#owner/teachers" onclick="event.preventDefault(); window.location.hash='#owner/teachers';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">إدارة المعلمين</a>
            <span>&gt;</span>
            <span style="color: #0f172a; font-weight: 700;">الملف التفصيلي للمعلم</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
            <span>👨‍🏫</span> الملف الشخصي والتنفيذي للمعلم: ${teacher.name}
          </h1>
        </div>

        <button type="button" onclick="window.location.hash='#owner/teachers';" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; font-weight: 800; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease;">
          ⬅️ العودة لقائمة المعلمين
        </button>
      </div>

      <!-- Main Profile Executive Summary Card -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
          
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="${teacher.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80'}" alt="${teacher.name}" style="width: 84px; height: 84px; border-radius: 50%; object-fit: cover; border: 4px solid #7c3aed; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.2);" />
            <div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
                <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">${teacher.name}</h2>
                <span style="background: ${isSuspended ? '#fee2e2' : '#dcfce7'}; color: ${isSuspended ? '#dc2626' : '#15803d'}; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 16px;">
                  ${isSuspended ? '🚫 حساب موقوف' : '✅ حساب نشط ومفعل'}
                </span>
              </div>
              <div style="font-size: 14px; color: #475569; font-weight: 700; margin-bottom: 6px;">
                ${teacher.role} • 🎯 ${teacher.specialization}
              </div>
              <div style="font-size: 13px; color: #64748b; display: flex; flex-wrap: wrap; gap: 16px;">
                <span>💼 جهة العمل: <strong style="color: #0f172a;">${teacher.company || 'مستقل'}</strong></span>
                <span>⭐ التقييم العام: <strong style="color: #d97706;">${teacher.rating || '4.9'}</strong></span>
                <span>⌛ الخبرة: <strong style="color: #0f172a;">${teacher.experience || '8+ سنوات'}</strong></span>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <button type="button" onclick="window.toggleOwnerTeacherStatus('${teacher.id}');" style="padding: 10px 18px; border-radius: 12px; background: ${isSuspended ? '#10b981' : '#ef4444'}; color: #ffffff; border: none; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
              ${isSuspended ? '✅ إعادة الحساب للعمل' : '🚫 إيقاف حساب المعلم'}
            </button>
            <button type="button" onclick="window.promptOwnerAddTeacherNote('${teacher.id}');" style="padding: 10px 18px; border-radius: 12px; background: #7c3aed; color: #ffffff; border: none; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);">
              📝 إضافة ملاحظة إدارية
            </button>
          </div>

        </div>

        ${teacher.bio ? `
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 13.5px; color: #475569; line-height: 1.6;">
            <strong style="color: #0f172a;">نبذة عن المعلم:</strong> ${teacher.bio}
          </div>
        ` : ''}
      </div>

      <!-- Key Performance Metrics Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; margin-bottom: 28px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">الدورات المنشورة</div>
          <div style="font-size: 26px; font-weight: 900; color: #7c3aed;">🎓 ${courses.length} دورة</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">الكتب والترجمات</div>
          <div style="font-size: 26px; font-weight: 900; color: #0284c7;">📚 ${books.length} كتاب</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">إجمالي الطلاب المتعلمين</div>
          <div style="font-size: 26px; font-weight: 900; color: #0f172a;">👥 ${(teacher.calculatedStudents || 0).toLocaleString('ar-EG')}</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;">
          <div style="font-size: 13px; color: #64748b; font-weight: 700; margin-bottom: 6px;">إجمالي إيرادات المبيعات</div>
          <div style="font-size: 26px; font-weight: 900; color: #d97706;">💵 $${(teacher.calculatedRevenue || 0).toLocaleString('ar-EG')}</div>
        </div>
      </div>

      <!-- Published Courses Section -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
          <span>🎓</span> الدورات التدريبية المنشورة بواسطة المعلم (${courses.length})
        </h3>
        ${courses.length === 0 ? `
          <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد دورات منشورة لهذا المعلم.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${courses.map((c) => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="font-weight: 800; font-size: 15px; color: #0f172a;">${c.title}</div>
                  <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">السعر: $${c.price || 99} • التقييم: ⭐ ${c.rating || 4.9} • المسجلون: ${c.students || c.studentsCount || 120} طالب</div>
                </div>
                <button type="button" onclick="window.location.hash='#course-details?id=${c.id}';" style="padding: 8px 16px; border-radius: 10px; background: #7c3aed; color: #ffffff; border: none; font-weight: 800; font-size: 12.5px; cursor: pointer;">
                  👁️ معاينة الدورة
                </button>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Published Books Section -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
          <span>📚</span> الكتب الإلكترونية المنشورة (${books.length})
        </h3>
        ${books.length === 0 ? `
          <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد كتب منشورة لهذا المعلم.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${books.map((b) => `
              <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="font-weight: 800; font-size: 15px; color: #0f172a;">${b.title}</div>
                  <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">السعر: $${b.price || 29} • التقييم: ⭐ ${b.rating || 4.8}</div>
                </div>
                <button type="button" onclick="window.location.hash='#book-reader?id=${b.id}';" style="padding: 8px 16px; border-radius: 10px; background: #0284c7; color: #ffffff; border: none; font-weight: 800; font-size: 12.5px; cursor: pointer;">
                  📖 قراءة / معاينة الكتاب
                </button>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Student Reviews on Teacher Content -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin-bottom: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
          <span>⭐</span> آراء وتقييمات الطلاب على دورات المعلم (${teacherReviews.length})
        </h3>
        ${teacherReviews.length === 0 ? `
          <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد آراء مسجلة حتى الآن.</div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${teacherReviews.map((r) => `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 800; color: #0f172a; font-size: 14px;">🎓 ${r.courseOrBookName || 'دورة تعليمية'}</span>
                  <span style="color: #f59e0b; font-weight: 800;">${'⭐'.repeat(r.stars || 5)}</span>
                </div>
                <div style="font-size: 12.5px; color: #7c3aed; font-weight: 700; margin-bottom: 6px;">بواسطة الطالب: ${r.studentName}</div>
                <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">${r.reviewText || r.comment || ''}</p>
              </div>
            `).join("")}
          </div>
        `}
      </div>

      <!-- Administrative Notes Section -->
      <div id="ownerTeacherNotesSection" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        ${getTeacherNotesSectionHTML(notes, teacher.id)}
      </div>

    </div>
  `;

  if (!options.preserveScroll) {
    window.scrollTo({ top: 0 });
  } else {
    window.scrollTo({ top: currentScrollY });
  }
}

export function getTeacherNotesSectionHTML(notes, teacherId) {
  return `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h3 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
        <span>📝</span> الملاحظات الإدارية الموثقة (${notes.length})
      </h3>
      <button type="button" onclick="window.promptOwnerAddTeacherNote('${teacherId}');" style="padding: 8px 16px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-weight: 700; font-size: 12.5px; cursor: pointer;">
        إضافة ملاحظة إدارية جديدة +
      </button>
    </div>
    ${notes.length === 0 ? `
      <div style="font-size: 14px; color: #64748b; background: #f8fafc; padding: 18px; border-radius: 12px; text-align: center;">لا توجد ملاحظات إدارية مدونة لهذا الحساب.</div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${notes.map((n) => `
          <div style="background: #fffbebfb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; font-size: 13.5px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #92400e; font-weight: 800; margin-bottom: 6px;">
              <span>${n.author || '👑 مالك المنصة'}</span>
              <span>${n.date || "اليوم"}</span>
            </div>
            <div style="color: #78350f; line-height: 1.5; white-space: pre-wrap;">${n.text}</div>
          </div>
        `).join("")}
      </div>
    `}
  `;
}

export function updateTeacherNotesSectionUI(teacherId) {
  const container = document.getElementById("ownerTeacherNotesSection");
  if (!container) return false;
  const allTeachers = getOwnerTeachersList();
  const teacher = allTeachers.find((t) => String(t.id) === String(teacherId)) || getTeacherById(teacherId);
  const notes = teacher ? (teacher.notes || []) : [];
  container.innerHTML = getTeacherNotesSectionHTML(notes, teacherId);
  return true;
}

/**
 * Toggle Teacher Account Active/Suspended Status
 */
export function toggleOwnerTeacherStatus(teacherId) {
  const allTeachers = getOwnerTeachersList();
  const teacher = allTeachers.find((t) => String(t.id) === String(teacherId)) || getTeacherById(teacherId);
  if (!teacher) return;

  const currentStatus = teacher.status || "Active";
  const isSuspended = currentStatus === "Suspended" || currentStatus === "Blocked";
  const newStatus = isSuspended ? "Active" : "Suspended";

  const dialogTitle = !isSuspended
    ? `هل أنت متأكد من إيقاف حساب المعلم؟`
    : `هل تريد إعادة الحساب للعمل؟`;
  const dialogMsg = !isSuspended
    ? `سيتم إيقاف حساب المعلم (${teacher.name}). لن يتمكن المعلم من تسجيل الدخول إلى المنصة حتى إعادة تفعيل الحساب.`
    : `سيتم إعادة تفعيل حساب المعلم (${teacher.name}) وتوفير إمكانية تسجيل الدخول كالمعتاد.`;
  const confirmText = !isSuspended ? "إيقاف الحساب" : "إعادة الحساب للعمل";
  const cancelText = "إلغاء";

  const currentScrollY = window.scrollY;

  showConfirmDialog({
    title: dialogTitle,
    message: dialogMsg,
    confirmText: confirmText,
    cancelText: cancelText,
    danger: !isSuspended,
    icon: !isSuspended ? "🚫" : "✅",
    onConfirm: () => {
      saveTeacherOverride(teacherId, { status: newStatus });
      setAccountStatus(teacherId, newStatus === "Suspended" ? "SUSPENDED" : "ACTIVE", { email: teacher ? teacher.email : null, id: teacherId });
      
      if (typeof showToast === "function") {
        showToast({
          type: isSuspended ? "success" : "warning",
          title: "تم تحديث حالة الحساب",
          message: !isSuspended ? `تم إيقاف حساب المعلم ${teacher.name} بنجاح.` : `تم إعادة تفعيل حساب المعلم ${teacher.name} بنجاح.`
        });
      }

      updateOwnerTeachersTableBodyOnly();

      const page = document.getElementById("ownerTeacherDetailsPage");
      if (page && !page.classList.contains("hidden")) {
        openOwnerTeacherDetailPage(teacherId, { preserveScroll: true });
      } else {
        window.scrollTo({ top: currentScrollY });
      }
    }
  });
}

/**
 * Prompt to add admin note to teacher using custom modal dialog
 */
export function promptOwnerAddTeacherNote(teacherId) {
  if (!teacherId) return;
  const allTeachers = getOwnerTeachersList();
  const teacher = allTeachers.find((t) => String(t.id) === String(teacherId)) || getTeacherById(teacherId);
  const teacherName = teacher ? teacher.name : "المعلم";

  // Remove any existing note modal
  const existingModal = document.getElementById("ownerTeacherNoteModal");
  if (existingModal) existingModal.remove();

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "ownerTeacherNoteModal";
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
            <p style="font-size: 12.5px; color: #64748b; margin: 2px 0 0 0;">المعلم: <strong style="color: #7c3aed;">${teacherName}</strong></p>
          </div>
        </div>
        <button type="button" id="closeTeacherNoteModalBtn" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;" aria-label="إغلاق">✕</button>
      </div>

      <!-- Error Message Container (Hidden by default) -->
      <div id="teacherNoteErrorMsg" style="display: none; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 700; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px;">
        ⚠️ يرجى كتابة نص الملاحظة الإدارية أولاً (لا يمكن حفظ ملاحظة فارغة).
      </div>

      <!-- Form Body -->
      <div style="margin-bottom: 20px;">
        <label for="teacherNoteTextarea" style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">
          نص الملاحظة الإدارية <span style="color: #ef4444;">*</span>
        </label>
        <textarea id="teacherNoteTextarea" rows="4" style="width: 100%; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #cbd5e1; outline: none; font-size: 13.5px; font-family: inherit; color: #0f172a; line-height: 1.6; resize: vertical; box-sizing: border-box; transition: border-color 0.2s ease;" placeholder="اكتب الملاحظة الإدارية الموثقة هنا..."></textarea>
      </div>

      <!-- Form Actions -->
      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
        <button type="button" id="cancelTeacherNoteBtn" style="padding: 10px 20px; border-radius: 12px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">
          إلغاء
        </button>
        <button type="button" id="saveTeacherNoteBtn" style="padding: 10px 24px; border-radius: 12px; background: #7c3aed; color: #ffffff; border: none; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); transition: all 0.2s ease;">
          حفظ الملاحظة
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modalOverlay);

  const textarea = modalOverlay.querySelector("#teacherNoteTextarea");
  const saveBtn = modalOverlay.querySelector("#saveTeacherNoteBtn");
  const cancelBtn = modalOverlay.querySelector("#cancelTeacherNoteBtn");
  const closeBtn = modalOverlay.querySelector("#closeTeacherNoteModalBtn");
  const errorMsg = modalOverlay.querySelector("#teacherNoteErrorMsg");

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

    const currentTeacher = getOwnerTeachersList().find((t) => String(t.id) === String(teacherId));
    const currentNotes = currentTeacher ? (currentTeacher.notes || []) : [];

    const newNote = {
      id: `note-${Date.now()}`,
      text: text,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      author: "👑 مالك المنصة"
    };

    saveTeacherOverride(teacherId, { notes: [newNote, ...currentNotes] });

    if (typeof showToast === "function") {
      showToast({ type: "success", title: "تم الحفظ", message: "تمت إضافة الملاحظة الإدارية بنجاح." });
    }

    closeModal();

    // Refresh teacher notes section in-place without resetting scroll position
    const updatedInPlace = updateTeacherNotesSectionUI(teacherId);
    if (!updatedInPlace) {
      const page = document.getElementById("ownerTeacherDetailsPage");
      if (page && !page.classList.contains("hidden")) {
        openOwnerTeacherDetailPage(teacherId, { preserveScroll: true });
      }
    }
  });
}

/**
 * Export Teachers List as formatted Printable PDF
 */
export function exportOwnerTeachersPDF() {
  const teachers = getFilteredOwnerTeachers();
  if (teachers.length === 0) {
    showCustomAlert("لا توجد بيانات معلمين لتصديرها.");
    return;
  }

  const oldContainer = document.getElementById("ownerTeachersPdfPrintContainer");
  if (oldContainer) oldContainer.remove();

  const printContainer = document.createElement("div");
  printContainer.id = "ownerTeachersPdfPrintContainer";
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

  let totalSalesSum = 0;
  teachers.forEach((t) => totalSalesSum += t.calculatedRevenue || 0);

  printContainer.innerHTML = `
    <style>
      @media print {
        body > *:not(#ownerTeachersPdfPrintContainer) { display: none !important; }
        #ownerTeachersPdfPrintContainer { position: absolute !important; inset: 0 !important; padding: 15mm !important; }
      }
    </style>
    <div dir="rtl" style="max-width: 1000px; margin: 0 auto; background: #ffffff;">
      
      <!-- Report Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0;">👨‍🏫 منصة StudyMart التعليمية - تقرير المعلمين والخبراء</h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">تقرير رسمي لمالك المنصة • تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style="text-align: left;">
          <div style="font-weight: 800; font-size: 14px; color: #7c3aed;">إجمالي المعلمين: ${teachers.length} معلم</div>
          <div style="font-size: 12px; color: #d97706; font-weight: 700; margin-top: 2px;">إجمالي المبيعات: $${totalSalesSum.toLocaleString('ar-EG')}</div>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 12px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-weight: 800;">
            <th style="padding: 10px; border: 1px solid #cbd5e1;">اسم المعلم</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">المجال والتخصص</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">الدورات</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">إجمالي الطلاب</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">التقييم ⭐</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">الإيرادات</th>
            <th style="padding: 10px; border: 1px solid #cbd5e1;">الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${teachers.map((t) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #0f172a;">${t.name}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${t.specialization} (${t.role})</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">🎓 ${(t.authoredCourses || []).length} دورة</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 700;">👥 ${(t.calculatedStudents || 0).toLocaleString('ar-EG')}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #d97706; font-weight: 800;">⭐ ${t.rating || '4.9'}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800; color: #059669;">$${(t.calculatedRevenue || 0).toLocaleString('ar-EG')}</td>
              <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 800;">${t.status === 'Suspended' ? 'موقوف' : 'نشط'}</td>
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
  window.openOwnerTeachersManagement = openOwnerTeachersManagement;
  window.openOwnerTeacherDetailPage = openOwnerTeacherDetailPage;
  window.toggleOwnerTeacherStatus = toggleOwnerTeacherStatus;
  window.promptOwnerAddTeacherNote = promptOwnerAddTeacherNote;
  window.exportOwnerTeachersPDF = exportOwnerTeachersPDF;
  window.updateOwnerTeachersTableBodyOnly = updateOwnerTeachersTableBodyOnly;
  window.toggleOwnerTeacherMenu = toggleOwnerTeacherMenu;
  window.closeAllOwnerTeacherMenus = closeAllOwnerTeacherMenus;
}
