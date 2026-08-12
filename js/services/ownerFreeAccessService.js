import { getStudentsList, getStudentById, saveStudentsData } from "../data/studentsData.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { hideAllMainSections } from "./layoutService.js";
import { showCustomAlert, showSuccessToast, showConfirmDialog } from "../utils/helpers.js";

const STORAGE_KEY_ACTIVATIONS = "lms_owner_free_activations_v1";

function isOwner(role) {
  return role === "owner" || role === "admin";
}

/**
 * Get all owner free activation records from localStorage
 */
export function getActivationsList() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACTIVATIONS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading free access activations", e);
  }
  return [];
}

/**
 * Save owner free activation records to localStorage
 */
export function saveActivationsList(list) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVATIONS, JSON.stringify(list));
  } catch (e) {
    console.error("Error saving free access activations", e);
  }
}

// Module State
let state = {
  selectedStudentId: null,
  contentType: "course", // "course" | "book"
  selectedContentId: null,
  studentSearchQuery: "",
  contentSearchQuery: "",
  historySearchQuery: "",
  historyStatusFilter: "all"
};

/**
 * Get all available courses (combining static data + custom courses)
 */
function getAllAvailableCourses() {
  let custom = [];
  try {
    const stored = localStorage.getItem("studymart_custom_courses");
    if (stored) custom = JSON.parse(stored);
  } catch (e) {}
  const list = [...(coursesData || []), ...(Array.isArray(custom) ? custom : [])];
  
  // Deduplicate by ID
  const uniqueMap = new Map();
  list.forEach(c => {
    if (c && c.id) uniqueMap.set(String(c.id), c);
  });
  return Array.from(uniqueMap.values());
}

/**
 * Get all available books (combining static data + custom books)
 */
function getAllAvailableBooks() {
  let custom = [];
  try {
    const stored = localStorage.getItem("studymart_custom_books");
    if (stored) custom = JSON.parse(stored);
  } catch (e) {}
  const list = [...(booksData || []), ...(Array.isArray(custom) ? custom : [])];

  const uniqueMap = new Map();
  list.forEach(b => {
    if (b && b.id) uniqueMap.set(String(b.id), b);
  });
  return Array.from(uniqueMap.values());
}

/**
 * Open Platform Owner Free Access Activation Page
 */
export function openOwnerFreeAccess() {
  const userRole = window.appState?.userRole || "student";
  if (!isOwner(userRole)) {
    showCustomAlert("عذراً، صفحة تفعيل المحتوى مخصصة فقط لمالك المنصة (Platform Owner).");
    window.location.hash = "#teacher/dashboard";
    return;
  }

  if (!window.location.hash.includes("owner/free-access")) {
    window.location.hash = "#owner/free-access";
  }

  hideAllMainSections();

  let page = document.getElementById("ownerFreeAccessPage");
  if (!page) {
    page = document.createElement("section");
    page.id = "ownerFreeAccessPage";
    page.className = "owner-free-access-page";
    document.body.appendChild(page);
  }

  page.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderOwnerFreeAccessPageStructure(page);
}

/**
 * Render complete page layout once
 */
function renderOwnerFreeAccessPageStructure(page) {
  page.innerHTML = `
    <style>
      .owner-free-access-wrapper {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        padding: 24px clamp(16px, 2.5vw, 32px);
        font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
        color: #0f172a;
      }
      .owner-free-access-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 32px;
        align-items: start;
      }
      @media (min-width: 768px) {
        .owner-free-access-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1100px) {
        .owner-free-access-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
    </style>
    <div dir="rtl" class="owner-free-access-wrapper">
      
      <!-- Top Breadcrumb & Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 6px;">
            <a href="#home" onclick="event.preventDefault(); if(typeof window.showHomePage === 'function') { window.showHomePage(); } else if(typeof window.showHomeSection === 'function') { window.showHomeSection('home'); } window.location.hash='#home';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">الرئيسية</a>
            <span>&gt;</span>
            <a href="#owner/homepage-management" onclick="event.preventDefault(); if(typeof window.openHomepageManagement === 'function') { window.openHomepageManagement(); } window.location.hash='#owner/homepage-management';" style="color: #7c3aed; text-decoration: none; font-weight: 600;">إدارة المنصة</a>
            <span>&gt;</span>
            <span style="color: #7c3aed; font-weight: 700;">تفعيل المحتوى للطلاب 🎁</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 10px;">
            <span>تفعيل المحتوى للطلاب 🎁</span>
            <span style="background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 20px; box-shadow: 0 2px 8px rgba(124,58,237,0.25);">👑 مالك المنصة</span>
          </h1>
          <p style="font-size: 14px; color: #64748b; margin: 6px 0 0 0;">يمكن لمالك المنصة منح أي طالب وصولاً مجانياً كاملاً لأي دورة تعليمية أو كتاب إلكتروني بدون أي رسوم.</p>
        </div>
      </div>

      <!-- Main Creation Grid -->
      <div class="owner-free-access-grid">
        
        <!-- STEP 1: Student Selector Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #f3e8ff; color: #7c3aed; width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">1</span>
              <h2 style="font-size: 16px; font-weight: 800; margin: 0; color: #0f172a;">اختيار الطالب</h2>
            </div>
            <span style="font-size: 12px; color: #64748b;" id="freeAccessStudentCount"></span>
          </div>

          <!-- Search Input -->
          <div style="margin-bottom: 16px;">
            <div style="position: relative;">
              <input type="text" id="freeAccessStudentSearchInput" placeholder="بحث باسم الطالب، البريد، الهاتف، أو ID..." style="width: 100%; padding: 10px 38px 10px 14px; font-size: 13.5px; border: 1.5px solid #cbd5e1; border-radius: 10px; outline: none; transition: border-color 0.2s; box-sizing: border-box;" oninput="window.handleFreeAccessStudentSearch(this.value)">
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 16px;">🔍</span>
            </div>
          </div>

          <!-- Selected Student Details or List -->
          <div id="freeAccessStudentContainer">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- STEP 2: Content Selector Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #f3e8ff; color: #7c3aed; width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">2</span>
              <h2 style="font-size: 16px; font-weight: 800; margin: 0; color: #0f172a;">اختيار المحتوى (دورة أو كتاب)</h2>
            </div>
          </div>

          <!-- Content Type Selector Pills -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px; background: #f8fafc; padding: 4px; border-radius: 12px; border: 1px solid #f1f5f9;">
            <button type="button" id="typeBtnCourse" onclick="window.setFreeAccessContentType('course')" style="flex: 1; padding: 8px; border: none; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: #7c3aed; color: #ffffff; box-shadow: 0 2px 6px rgba(124,58,237,0.2);">
              🎓 دورة تعليمية
            </button>
            <button type="button" id="typeBtnBook" onclick="window.setFreeAccessContentType('book')" style="flex: 1; padding: 8px; border: none; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b;">
              📚 كتاب إلكتروني
            </button>
          </div>

          <!-- Product Search Input -->
          <div style="margin-bottom: 16px;">
            <div style="position: relative;">
              <input type="text" id="freeAccessContentSearchInput" placeholder="بحث بالعنوان، المعلم/المؤلف، أو ID..." style="width: 100%; padding: 10px 38px 10px 14px; font-size: 13.5px; border: 1.5px solid #cbd5e1; border-radius: 10px; outline: none; transition: border-color 0.2s; box-sizing: border-box;" oninput="window.handleFreeAccessContentSearch(this.value)">
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 16px;">🔍</span>
            </div>
          </div>

          <!-- Content List Container -->
          <div id="freeAccessContentContainer" style="max-height: 380px; overflow-y: auto; padding-left: 4px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- STEP 3: Summary & Activation Action Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #f3e8ff; color: #7c3aed; width: 32px; height: 32px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px;">3</span>
              <h2 style="font-size: 16px; font-weight: 800; margin: 0; color: #0f172a;">تأكيد وتفعيل الصلاحية</h2>
            </div>
          </div>

          <div id="freeAccessSummaryContainer">
            <!-- Rendered dynamically -->
          </div>
        </div>

      </div>

      <!-- SECTION: Activation History -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>📋 سجل التفعيلات المجانية</span>
              <span id="freeAccessHistoryCountBadge" style="background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 12px;">0</span>
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">سجل بكافة عمليات منح الوصول المجاني التي تمت بواسطة مالك المنصة.</p>
          </div>

          <!-- Filters & Search for History -->
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <!-- Status Filter Pills -->
            <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; border: 1px solid #e2e8f0; align-items: center;">
              <button type="button" onclick="window.setFreeAccessHistoryFilter('all')" class="history-filter-btn" data-filter="all" style="padding: 6px 14px; border: none; border-radius: 7px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: #7c3aed; color: #ffffff;">الكل</button>
              <button type="button" onclick="window.setFreeAccessHistoryFilter('Active')" class="history-filter-btn" data-filter="Active" style="padding: 6px 14px; border: none; border-radius: 7px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b;">نشط ✅</button>
              <button type="button" onclick="window.setFreeAccessHistoryFilter('Revoked')" class="history-filter-btn" data-filter="Revoked" style="padding: 6px 14px; border: none; border-radius: 7px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b;">ملغى 🚫</button>
            </div>

            <!-- Search input -->
            <div style="position: relative; min-width: 240px; flex: 1;">
              <input type="text" id="freeAccessHistorySearchInput" placeholder="بحث بالاسم، البريد، أو عنوان المحتوى..." style="width: 100%; height: 38px; padding: 0 38px 0 14px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 10px; outline: none; background: #ffffff; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;" oninput="window.handleFreeAccessHistorySearch(this.value)" onfocus="this.style.borderColor='#7c3aed'; this.style.boxShadow='0 0 0 3px rgba(124,58,237,0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none';">
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 15px; pointer-events: none;">🔍</span>
            </div>
          </div>
        </div>

        <!-- History Table Container -->
        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <table style="width: 100%; min-width: 980px; border-collapse: separate; border-spacing: 0; text-align: right; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; color: #475569; font-weight: 800; font-size: 12.5px;">
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">معرف التفعيل</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">الطالب</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">المحتوى المفعل</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">النوع</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">السعر الأصلي</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">المبلغ المطلوب</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">تاريخ التفعيل</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">بواسطة</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; white-space: nowrap;">الحالة</th>
                <th style="padding: 14px 16px; border-bottom: 2px solid #e2e8f0; text-align: center; white-space: nowrap;">الإجراءات</th>
              </tr>
            </thead>
            <tbody id="freeAccessHistoryTbody">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  // Initial rendering of sections
  renderStudentSection();
  renderContentSection();
  renderSummarySection();
  renderHistorySection();
}

/**
 * Render Student Selection Section
 */
function renderStudentSection() {
  const container = document.getElementById("freeAccessStudentContainer");
  const countBadge = document.getElementById("freeAccessStudentCount");
  if (!container) return;

  const allStudents = getStudentsList();
  if (countBadge) countBadge.textContent = `إجمالي الطلاب: ${allStudents.length}`;

  if (state.selectedStudentId) {
    const student = getStudentById(state.selectedStudentId) || allStudents.find(s => String(s.id) === String(state.selectedStudentId));
    if (student) {
      const pCoursesCount = (student.purchasedCourses || []).length;
      const pBooksCount = (student.purchasedBooks || []).length;
      const isBlk = student.status === "Blocked" || student.isBlocked;

      container.innerHTML = `
        <div style="background: #f8fafc; border: 2px solid #7c3aed; border-radius: 12px; padding: 16px; position: relative;">
          <div style="position: absolute; top: -10px; left: 16px; background: #7c3aed; color: #ffffff; font-size: 11px; font-weight: 800; padding: 2px 10px; border-radius: 10px;">
            ✓ الطالب المحدد
          </div>

          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
            <img src="${student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${student.name}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid #cbd5e1; flex-shrink: 0;">
            <div style="flex: 1; min-width: 0;">
              <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${student.name}</h3>
              <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0; dir: ltr; text-align: right;">${student.email}</p>
              <p style="font-size: 11.5px; color: #94a3b8; margin: 2px 0 0 0;">📱 ${student.phone || 'بدون هاتف'} • ID: ${student.id}</p>
            </div>
          </div>

          <div style="display: flex; items-center; justify-content: space-between; gap: 8px; font-size: 11.5px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px;">
            <div>🎓 <strong>${pCoursesCount}</strong> دورة</div>
            <div>📚 <strong>${pBooksCount}</strong> كتاب</div>
            <div>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 10px; font-weight: 800; font-size: 10.5px; background: ${isBlk ? '#fef2f2' : '#dcfce7'}; color: ${isBlk ? '#ef4444' : '#15803d'};">
                ${isBlk ? 'محظور ⛔' : 'نشط ✅'}
              </span>
            </div>
          </div>

          <button type="button" onclick="window.deselectFreeAccessStudent()" style="width: 100%; padding: 8px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #ffffff; color: #64748b; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'; this.style.color='#0f172a';" onmouseout="this.style.background='#ffffff'; this.style.color='#64748b';">
            🔄 تغيير الطالب المحدد
          </button>
        </div>
      `;
      return;
    }
  }

  // If no student is selected, list searchable students
  const query = (state.studentSearchQuery || "").toLowerCase().trim();
  const filtered = allStudents.filter(s => {
    if (!query) return true;
    return (s.name || "").toLowerCase().includes(query) ||
           (s.email || "").toLowerCase().includes(query) ||
           (s.phone || "").toLowerCase().includes(query) ||
           (String(s.id) || "").toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px 12px; color: #64748b; font-size: 13px;">
        <span style="font-size: 28px; display: block; margin-bottom: 8px;">🔍</span>
        لم يتم العثور على طالب يطابق ("${state.studentSearchQuery}")
      </div>
    `;
    return;
  }

  // Display list of up to 6 students
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto;">
      ${filtered.slice(0, 8).map(s => `
        <div onclick="window.selectFreeAccessStudent('${s.id}')" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.15s ease; background: #ffffff;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#7c3aed';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#e2e8f0';">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
            <img src="${s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" alt="${s.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; flex-shrink: 0;">
            <div style="min-width: 0;">
              <div style="font-size: 13px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}</div>
              <div style="font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.email}</div>
            </div>
          </div>
          <button type="button" style="padding: 4px 10px; border-radius: 6px; background: #f3e8ff; color: #7c3aed; border: none; font-size: 11.5px; font-weight: 800; pointer-events: none;">
            اختيار ➔
          </button>
        </div>
      `).join("")}
    </div>
  `;
}

/**
 * Render Content Selection Section (Courses or Books)
 */
function renderContentSection() {
  const container = document.getElementById("freeAccessContentContainer");
  const typeBtnCourse = document.getElementById("typeBtnCourse");
  const typeBtnBook = document.getElementById("typeBtnBook");

  if (typeBtnCourse && typeBtnBook) {
    if (state.contentType === "course") {
      typeBtnCourse.style.background = "#7c3aed";
      typeBtnCourse.style.color = "#ffffff";
      typeBtnCourse.style.boxShadow = "0 2px 6px rgba(124,58,237,0.2)";
      typeBtnBook.style.background = "transparent";
      typeBtnBook.style.color = "#64748b";
      typeBtnBook.style.boxShadow = "none";
    } else {
      typeBtnBook.style.background = "#7c3aed";
      typeBtnBook.style.color = "#ffffff";
      typeBtnBook.style.boxShadow = "0 2px 6px rgba(124,58,237,0.2)";
      typeBtnCourse.style.background = "transparent";
      typeBtnCourse.style.color = "#64748b";
      typeBtnCourse.style.boxShadow = "none";
    }
  }

  if (!container) return;

  const query = (state.contentSearchQuery || "").toLowerCase().trim();

  if (state.contentType === "course") {
    const courses = getAllAvailableCourses().filter(c => {
      if (!query) return true;
      return (c.title || "").toLowerCase().includes(query) ||
             (c.instructor || c.teacherName || "").toLowerCase().includes(query) ||
             (c.category || "").toLowerCase().includes(query) ||
             (String(c.id) || "").toLowerCase().includes(query);
    });

    if (courses.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 12px; color: #64748b; font-size: 13px;">
          <span style="font-size: 28px; display: block; margin-bottom: 8px;">🔍</span>
          لم يتم العثور على دورة تعليمية تطابق ("${state.contentSearchQuery}")
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${courses.map(c => {
          const isSelected = String(state.selectedContentId) === String(c.id);
          const price = typeof c.price === "number" ? c.price : parseFloat(c.price) || 0;
          return `
            <div onclick="window.selectFreeAccessContent('${c.id}')" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.15s ease; background: ${isSelected ? '#faf5ff' : '#ffffff'};" onmouseover="if(!${isSelected}) this.style.borderColor='#a855f7';" onmouseout="if(!${isSelected}) this.style.borderColor='#e2e8f0';">
              <img src="${c.image || c.thumbnail || c.cover || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100'}" alt="${c.title}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1; flex-shrink: 0;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.title}</div>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">👨‍🏫 ${c.instructor || c.teacherName || 'معلم الدراسة'} • 🏷️ ${c.category || 'عام'}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">👥 ${c.students || 0} طالب • السعر الأصلي: <span style="text-decoration: line-through;">${price.toLocaleString('ar-EG')} ج.م</span></div>
              </div>
              <div style="flex-shrink: 0; text-align: left;">
                ${isSelected ? `
                  <span style="background: #7c3aed; color: #ffffff; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px;">✓</span>
                ` : `
                  <span style="border: 2px solid #cbd5e1; width: 22px; height: 22px; border-radius: 50%; display: inline-block;"></span>
                `}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

  } else {
    // Book Content Type
    const books = getAllAvailableBooks().filter(b => {
      if (!query) return true;
      return (b.title || "").toLowerCase().includes(query) ||
             (b.author || b.instructor || "").toLowerCase().includes(query) ||
             (b.category || "").toLowerCase().includes(query) ||
             (String(b.id) || "").toLowerCase().includes(query);
    });

    if (books.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px 12px; color: #64748b; font-size: 13px;">
          <span style="font-size: 28px; display: block; margin-bottom: 8px;">🔍</span>
          لم يتم العثور على كتاب يطابق ("${state.contentSearchQuery}")
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${books.map(b => {
          const isSelected = String(state.selectedContentId) === String(b.id);
          const price = typeof b.price === "number" ? b.price : parseFloat(b.price) || 0;
          return `
            <div onclick="window.selectFreeAccessContent('${b.id}')" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}; border-radius: 12px; cursor: pointer; transition: all 0.15s ease; background: ${isSelected ? '#faf5ff' : '#ffffff'};" onmouseover="if(!${isSelected}) this.style.borderColor='#a855f7';" onmouseout="if(!${isSelected}) this.style.borderColor='#e2e8f0';">
              <img src="${b.image || b.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100'}" alt="${b.title}" style="width: 42px; height: 56px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1; flex-shrink: 0;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${b.title}</div>
                <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">✍️ ${b.author || 'مؤلف الكتاب'} • 🏷️ ${b.category || 'عام'}</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">السعر الأصلي: <span style="text-decoration: line-through;">${price.toLocaleString('ar-EG')} ج.م</span></div>
              </div>
              <div style="flex-shrink: 0; text-align: left;">
                ${isSelected ? `
                  <span style="background: #7c3aed; color: #ffffff; width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px;">✓</span>
                ` : `
                  <span style="border: 2px solid #cbd5e1; width: 22px; height: 22px; border-radius: 50%; display: inline-block;"></span>
                `}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}

/**
 * Render Confirmation & Summary Section
 */
function renderSummarySection() {
  const container = document.getElementById("freeAccessSummaryContainer");
  if (!container) return;

  const student = state.selectedStudentId ? getStudentById(state.selectedStudentId) : null;
  const contentList = state.contentType === "course" ? getAllAvailableCourses() : getAllAvailableBooks();
  const content = state.selectedContentId ? contentList.find(c => String(c.id) === String(state.selectedContentId)) : null;

  if (!student || !content) {
    container.innerHTML = `
      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px 16px; text-align: center; color: #64748b;">
        <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎁</span>
        <p style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">يرجى اختيار الطالب والمحتوى</p>
        <p style="font-size: 12px; margin: 0;">قم باختيار طالب من القائمة (الخطوة 1) واختيار ${state.contentType === "course" ? "دورة تعليمية" : "كتاب إلكتروني"} (الخطوة 2) لتفعيل الوصول المجاني.</p>
      </div>
    `;
    return;
  }

  // Check if student ALREADY HAS access to this content
  let alreadyHasAccess = false;
  if (state.contentType === "course") {
    alreadyHasAccess = (student.purchasedCourses || []).some(c => String(c.id || c) === String(content.id));
  } else {
    alreadyHasAccess = (student.purchasedBooks || []).some(b => String(b.id || b) === String(content.id));
  }

  const origPrice = typeof content.price === "number" ? content.price : parseFloat(content.price) || 0;

  container.innerHTML = `
    <div style="background: #ffffff; border: 1.5px solid #7c3aed; border-radius: 12px; padding: 18px;">
      
      <div style="font-size: 12px; font-weight: 800; color: #7c3aed; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <span>تفاصيل التفعيل المجاني</span>
        <span style="background: #f3e8ff; padding: 2px 8px; border-radius: 6px;">${state.contentType === "course" ? "دورة تعليمية" : "كتاب إلكتروني"}</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">👤 الطالب:</span>
          <span style="font-weight: 800; color: #0f172a;">${student.name}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">📧 البريد الإلكتروني:</span>
          <span style="font-weight: 600; color: #334155;">${student.email}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">📖 المحتوى:</span>
          <span style="font-weight: 800; color: #7c3aed; text-align: left; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${content.title}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">💵 السعر الأصلي:</span>
          <span style="font-weight: 700; color: #94a3b8; text-decoration: line-through;">${origPrice.toLocaleString('ar-EG')} ج.م</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
          <span style="color: #0f172a; font-weight: 800;">🎁 المبلغ المطلـوب:</span>
          <span style="background: #dcfce7; color: #15803d; font-size: 13px; font-weight: 900; padding: 4px 12px; border-radius: 20px;">0.00 ج.م (مجاني كاملاً)</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b;">👑 نوع الصلاحية:</span>
          <span style="font-weight: 700; color: #4338ca;">منح مالك المنصة (FREE_OWNER_GRANT)</span>
        </div>
      </div>

      ${alreadyHasAccess ? `
        <div style="background: #fffbebf7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px; margin-bottom: 12px; color: #b45309; font-size: 12.5px; font-weight: 700; text-align: center;">
          ⚠️ هذا الطالب لديه صلاحية الوصول إلى هذا المحتوى بالفعل! لا يمكن إنشاء تفعيل مكرر.
        </div>
        <button type="button" disabled style="width: 100%; padding: 12px; border: none; border-radius: 10px; background: #e2e8f0; color: #94a3b8; font-size: 14px; font-weight: 800; cursor: not-allowed;">
          تفعيل المحتوى الآن 🎁 (لديه وصول بالفعل)
        </button>
      ` : `
        <button type="button" onclick="window.executeFreeAccessGrant()" style="width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; font-size: 14px; font-weight: 900; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(124,58,237,0.35);" onmouseover="this.style.transform='translateY(-1px)';" onmouseout="this.style.transform='none';">
          تفعيل المحتوى الآن مجاناً 🎁
        </button>
      `}

    </div>
  `;
}

/**
 * Render Activation History Section
 */
function renderHistorySection() {
  const tbody = document.getElementById("freeAccessHistoryTbody");
  const countBadge = document.getElementById("freeAccessHistoryCountBadge");
  if (!tbody) return;

  const activations = getActivationsList();
  if (countBadge) countBadge.textContent = activations.length;

  const query = (state.historySearchQuery || "").toLowerCase().trim();
  const filter = state.historyStatusFilter;

  const filtered = activations.filter(act => {
    if (filter !== "all" && act.status !== filter) return false;
    if (!query) return true;
    return (act.studentName || "").toLowerCase().includes(query) ||
           (act.studentEmail || "").toLowerCase().includes(query) ||
           (act.contentTitle || "").toLowerCase().includes(query) ||
           (act.id || "").toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 32px 16px; color: #64748b; font-size: 13.5px;">
          <span style="font-size: 32px; display: block; margin-bottom: 8px;">📋</span>
          لا توجد تفعيلات مجانية مسجلة حتى الآن.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(act => {
    const isRev = act.status === "Revoked";
    const typeLabel = act.contentType === "course" ? "🎓 دورة" : "📚 كتاب";
    const origPriceFormatted = (typeof act.originalPrice === "number" ? act.originalPrice : parseFloat(act.originalPrice) || 0).toLocaleString('ar-EG') + " ج.م";

    const studentObj = getStudentById(act.studentId);
    const avatarUrl = act.studentAvatar || studentObj?.avatar || "";
    const studentInitial = (act.studentName || "ط").trim().charAt(0).toUpperCase();

    let dateStr = "";
    let timeStr = "";
    if (act.activatedAt) {
      try {
        const d = new Date(act.activatedAt);
        if (!isNaN(d.getTime())) {
          dateStr = d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
          timeStr = d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true });
        }
      } catch (e) {}
    }
    if (!dateStr) {
      dateStr = act.formattedDate || "—";
    }

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <!-- Activation ID -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="background: #f1f5f9; color: #4338ca; border: 1px solid #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 11.5px; display: inline-block; white-space: nowrap; letter-spacing: 0.2px;">
            ${act.id}
          </span>
        </td>

        <!-- Student Details -->
        <td style="padding: 14px 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${avatarUrl ? `
              <img src="${avatarUrl}" alt="${act.studentName}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1.5px solid #cbd5e1; flex-shrink: 0;">
            ` : `
              <div style="width: 34px; height: 34px; border-radius: 50%; background: #f3e8ff; color: #7c3aed; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1.5px solid #e9d5ff;">
                ${studentInitial}
              </div>
            `}
            <div style="min-width: 0;">
              <div style="font-weight: 800; color: #0f172a; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${act.studentName}</div>
              <div style="font-size: 11.5px; color: #64748b; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; dir: ltr; text-align: right;">${act.studentEmail}</div>
            </div>
          </div>
        </td>

        <!-- Activated Content -->
        <td style="padding: 14px 16px;">
          <div title="${act.contentTitle}" style="font-weight: 700; color: #0f172a; font-size: 13px; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${act.contentTitle}
          </div>
        </td>

        <!-- Content Type -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="background: ${act.contentType === 'course' ? '#f3e8ff' : '#fef3c7'}; color: ${act.contentType === 'course' ? '#7c3aed' : '#b45309'}; border: 1px solid ${act.contentType === 'course' ? '#e9d5ff' : '#fde68a'}; font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 8px; display: inline-block;">
            ${typeLabel}
          </span>
        </td>

        <!-- Original Price -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="color: #94a3b8; text-decoration: line-through; font-size: 12px; font-weight: 600;">${origPriceFormatted}</span>
        </td>

        <!-- Amount Requested -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-weight: 800; font-size: 11.5px; padding: 4px 10px; border-radius: 12px; display: inline-block;">
            0.00 ج.م (مجاني)
          </span>
        </td>

        <!-- Activation Date & Time -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <div style="font-size: 12.5px; font-weight: 700; color: #1e293b;">${dateStr}</div>
          ${timeStr ? `<div style="font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px;">${timeStr}</div>` : ''}
        </td>

        <!-- Activated By -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="font-weight: 700; color: #4338ca; font-size: 12px; background: #eef2ff; border: 1px solid #e0e7ff; padding: 3px 8px; border-radius: 6px;">
            ${act.activatedBy || 'مالك المنصة'}
          </span>
        </td>

        <!-- Status Badge -->
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="background: ${isRev ? '#fef2f2' : '#dcfce7'}; color: ${isRev ? '#b91c1c' : '#15803d'}; border: 1px solid ${isRev ? '#fecaca' : '#bbf7d0'}; font-size: 11.5px; font-weight: 800; padding: 4px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
            ${isRev ? 'ملغى 🚫' : 'نشط ✅'}
          </span>
        </td>

        <!-- Actions -->
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">
          ${!isRev ? `
            <button type="button" onclick="window.revokeFreeAccess('${act.id}')" style="padding: 6px 12px; border: 1px solid #fca5a5; border-radius: 8px; background: #fff5f5; color: #dc2626; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(220,38,38,0.05);" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='#f87171';" onmouseout="this.style.background='#fff5f5'; this.style.borderColor='#fca5a5';">
              إلغاء التفعيل 🚫
            </button>
          ` : `
            <span style="color: #94a3b8; font-size: 11.5px; font-weight: 600;">تم الإلغاء</span>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

// Handler functions bound to window for inline onclick/oninput
window.selectFreeAccessStudent = function(studentId) {
  state.selectedStudentId = studentId;
  renderStudentSection();
  renderSummarySection();
};

window.deselectFreeAccessStudent = function() {
  state.selectedStudentId = null;
  renderStudentSection();
  renderSummarySection();
};

window.handleFreeAccessStudentSearch = function(query) {
  state.studentSearchQuery = query;
  renderStudentSection();
};

window.setFreeAccessContentType = function(type) {
  state.contentType = type;
  state.selectedContentId = null;
  renderContentSection();
  renderSummarySection();
};

window.selectFreeAccessContent = function(contentId) {
  state.selectedContentId = contentId;
  renderContentSection();
  renderSummarySection();
};

window.handleFreeAccessContentSearch = function(query) {
  state.contentSearchQuery = query;
  renderContentSection();
};

window.handleFreeAccessHistorySearch = function(query) {
  state.historySearchQuery = query;
  renderHistorySection();
};

window.setFreeAccessHistoryFilter = function(filter) {
  state.historyStatusFilter = filter;
  const btns = document.querySelectorAll(".history-filter-btn");
  btns.forEach(btn => {
    if (btn.getAttribute("data-filter") === filter) {
      btn.style.background = "#7c3aed";
      btn.style.color = "#ffffff";
    } else {
      btn.style.background = "transparent";
      btn.style.color = "#64748b";
    }
  });
  renderHistorySection();
};

/**
 * Execute Free Access Grant
 */
window.executeFreeAccessGrant = function() {
  if (!state.selectedStudentId || !state.selectedContentId) {
    showCustomAlert("يرجى تحديد الطالب والمحتوى قبل التفعيل.");
    return;
  }

  const student = getStudentById(state.selectedStudentId);
  if (!student) {
    showCustomAlert("تعذر العثور على الطالب المحدد.");
    return;
  }

  const contentList = state.contentType === "course" ? getAllAvailableCourses() : getAllAvailableBooks();
  const content = contentList.find(c => String(c.id) === String(state.selectedContentId));
  if (!content) {
    showCustomAlert("تعذر العثور على المحتوى المحدد.");
    return;
  }

  // 1. Double check duplicate
  const pCourses = student.purchasedCourses || [];
  const pBooks = student.purchasedBooks || [];

  if (state.contentType === "course" && pCourses.some(c => String(c.id || c) === String(content.id))) {
    showCustomAlert("هذا الطالب لديه صلاحية الوصول إلى هذه الدورة بالفعل.");
    return;
  }

  if (state.contentType === "book" && pBooks.some(b => String(b.id || b) === String(content.id))) {
    showCustomAlert("هذا الطالب لديه صلاحية الوصول إلى هذا الكتاب بالفعل.");
    return;
  }

  // 2. Grant Access in Student Record
  const grantDate = new Date().toISOString().split("T")[0];
  const originalPriceVal = typeof content.price === "number" ? content.price : parseFloat(content.price) || 0;

  if (state.contentType === "course") {
    if (!student.purchasedCourses) student.purchasedCourses = [];
    student.purchasedCourses.push({
      id: String(content.id),
      title: content.title,
      instructor: content.instructor || content.teacherName || "المعلم",
      purchaseDate: grantDate,
      price: 0,
      originalPrice: originalPriceVal,
      paymentMethod: "تفعيل مجاني (مالك المنصة)",
      accessType: "FREE_OWNER_GRANT"
    });
  } else {
    if (!student.purchasedBooks) student.purchasedBooks = [];
    student.purchasedBooks.push({
      id: String(content.id),
      title: content.title,
      author: content.author || "المؤلف",
      purchaseDate: grantDate,
      price: 0,
      originalPrice: originalPriceVal,
      paymentMethod: "تفعيل مجاني (مالك المنصة)",
      accessType: "FREE_OWNER_GRANT"
    });
  }

  // Add timeline entry
  if (!student.timeline) student.timeline = [];
  student.timeline.unshift({
    date: new Date().toLocaleString("ar-EG"),
    title: "تفعيل محتوى مجاني 🎁",
    description: `تم منح الوصول المجاني إلى (${state.contentType === "course" ? "دورة" : "كتاب"}: ${content.title}) بواسطة مالك المنصة.`
  });

  // Save student data to lms_enrolled_students_v1
  saveStudentsData();

  // 3. Save Order into studymart_purchases_v1
  try {
    const rawPurchases = localStorage.getItem("studymart_purchases_v1");
    let purchases = rawPurchases ? JSON.parse(rawPurchases) : [];
    purchases.unshift({
      id: `ORD-GRANT-${Date.now()}`,
      orderNumber: `#ORD-GRANT-${Math.floor(1000 + Math.random() * 9000)}`,
      type: state.contentType,
      itemId: String(content.id),
      title: content.title,
      author: content.instructor || content.teacherName || content.author || "إدارة المنصة",
      date: new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      price: 0,
      originalPrice: originalPriceVal,
      priceFormatted: "0.00 ج.م",
      status: "completed",
      paymentMethod: "تفعيل مجاني (مالك المنصة)",
      accessType: "FREE_OWNER_GRANT",
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email
    });
    localStorage.setItem("studymart_purchases_v1", JSON.stringify(purchases));
  } catch (e) {
    console.error("Error saving purchase grant record", e);
  }

  // 4. Update Logged In Student User Session if current user is this student
  try {
    const userSessionRaw = localStorage.getItem("lms_user_session");
    if (userSessionRaw) {
      const session = JSON.parse(userSessionRaw);
      if (session && (String(session.id) === String(student.id) || session.email?.toLowerCase() === student.email?.toLowerCase())) {
        if (state.contentType === "course") {
          if (!session.purchasedCourses) session.purchasedCourses = [];
          session.purchasedCourses.push(String(content.id));
          if (!session.userCourses) session.userCourses = [];
          session.userCourses.push(String(content.id));
          localStorage.setItem("userCourses", JSON.stringify(session.userCourses));
        } else {
          if (!session.userPurchasedBooks) session.userPurchasedBooks = [];
          session.userPurchasedBooks.push(String(content.id));
          localStorage.setItem("userPurchasedBooks", JSON.stringify(session.userPurchasedBooks));
        }
        localStorage.setItem("lms_user_session", JSON.stringify(session));
      }
    }
  } catch (e) {
    console.error("Error updating user session", e);
  }

  // 5. Save Activation Record
  const activations = getActivationsList();
  const newActivation = {
    id: `ACT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email,
    studentPhone: student.phone || "—",
    studentAvatar: student.avatar || "",
    contentType: state.contentType,
    contentId: String(content.id),
    contentTitle: content.title,
    originalPrice: originalPriceVal,
    grantedPrice: 0,
    accessType: "FREE_OWNER_GRANT",
    activatedBy: "مالك المنصة (Platform Owner)",
    activatedAt: new Date().toISOString(),
    formattedDate: new Date().toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }),
    status: "Active"
  };
  activations.unshift(newActivation);
  saveActivationsList(activations);

  // 6. Notify
  if (window.addNotification) {
    window.addNotification({
      title: "تفعيل محتوى مجاني 🎁",
      message: `تم منح الطالب (${student.name}) وصولاً مجانياً إلى ${state.contentType === "course" ? "الدورة" : "الكتاب"}: ${content.title}`,
      type: "system",
      link: `#owner/free-access`
    });
  }

  if (window.showSuccessToast) {
    window.showSuccessToast({
      title: "تم التفعيل بنجاح! 🎁",
      message: `تم تفعيل (${content.title}) مجاناً للطالب ${student.name}`
    });
  } else {
    showCustomAlert(`تم منح الطالب (${student.name}) صلاحية الوصول المجاني إلى (${content.title}) بنجاح! 🎁`);
  }

  // Reset selections & update UI
  state.selectedContentId = null;
  renderStudentSection();
  renderContentSection();
  renderSummarySection();
  renderHistorySection();
};

/**
 * Revoke Free Access
 */
window.revokeFreeAccess = async function(activationId) {
  const activations = getActivationsList();
  const act = activations.find(a => a.id === activationId);
  if (!act) return;

  let confirmed = false;
  if (window.showConfirmDialog) {
    confirmed = await window.showConfirmDialog({
      title: "إلغاء تفعيل المحتوى؟",
      message: `هل أنت تأكد من رغبتك في إلغاء التفعيل المجاني لـ (${act.contentTitle}) للطالب (${act.studentName})؟`,
      confirmText: "إلغاء التفعيل",
      cancelText: "تراجع",
      danger: true
    });
  } else {
    confirmed = confirm(`هل أنت تأكد من إلغاء تفعيل ${act.contentTitle} للطالب ${act.studentName}؟`);
  }

  if (!confirmed) return;

  // Remove from student
  const student = getStudentById(act.studentId);
  if (student) {
    if (act.contentType === "course" && student.purchasedCourses) {
      student.purchasedCourses = student.purchasedCourses.filter(c => String(c.id || c) !== String(act.contentId));
    } else if (act.contentType === "book" && student.purchasedBooks) {
      student.purchasedBooks = student.purchasedBooks.filter(b => String(b.id || b) !== String(act.contentId));
    }
    if (!student.timeline) student.timeline = [];
    student.timeline.unshift({
      date: new Date().toLocaleString("ar-EG"),
      title: "إلغاء تفعيل محتوى 🚫",
      description: `تم إلغاء التفعيل المجاني لـ (${act.contentTitle}) بواسطة مالك المنصة.`
    });
    saveStudentsData();
  }

  // Update activation status
  act.status = "Revoked";
  act.revokedAt = new Date().toISOString();
  saveActivationsList(activations);

  showCustomAlert(`تم إلغاء تفعيل المحتوى (${act.contentTitle}) للطالب بنجاح.`);
  renderHistorySection();
  renderSummarySection();
};
