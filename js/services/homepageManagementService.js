import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { teachersData } from "../data/teachers.js";
import { getReviewsList } from "../data/reviewsData.js";
import {
  getFeaturedConfig,
  getSavedConfig,
  getDraftConfig,
  setDraftConfig,
  saveFeaturedConfig,
  applyFeaturedMetadata
} from "../.featured-config.js";
import { isOwner } from "./permissionService.js";
import { showCustomAlert } from "../utils/helpers.js";
import { showToast } from "./notificationService.js";
import { hideAllMainSections } from "./layoutService.js";
import { renderHomeTeachers } from "../components/teachers.js";
import { renderHomeTestimonials } from "../components/testimonials.js";

let state = {
  activeTab: "all", // "all", "courses", "books", "teachers", "reviews", "order"
  featuredCourses: [],
  featuredBooks: [],
  featuredTeachers: [],
  featuredReviews: [],
  courseMetadata: {},
  bookMetadata: {},
  searchQueries: {
    courses: "",
    books: "",
    teachers: "",
    reviews: ""
  },
  categoryFilters: {
    courses: "all",
    books: "all"
  }
};

function syncStateToDraft() {
  setDraftConfig({
    featuredCourses: state.featuredCourses,
    featuredBooks: state.featuredBooks,
    featuredTeachers: state.featuredTeachers,
    featuredReviews: state.featuredReviews,
    courseMetadata: state.courseMetadata,
    bookMetadata: state.bookMetadata
  });
}

export function openHomepageManagement() {
  const userRole = window.appState?.userRole || (window.getCurrentUserRole ? window.getCurrentUserRole() : "student");
  
  if (!isOwner(userRole)) {
    const alertMsg = "عذراً، صفحة إدارة الصفحة الرئيسية مخصصة فقط لمالك المنصة (Platform Owner).";
    if (typeof showToast === "function") {
      showToast({ type: "error", title: "صلاحية غير كافية", message: alertMsg });
    } else {
      showCustomAlert(alertMsg);
    }
    window.location.hash = "#teacher/dashboard";
    return;
  }

  if (window.location.hash !== "#owner/homepage-management") {
    window.location.hash = "#owner/homepage-management";
  }

  const draft = getDraftConfig();
  const currentCfg = draft || getSavedConfig();
  state.featuredCourses = [...(currentCfg.featuredCourses || [])];
  state.featuredBooks = [...(currentCfg.featuredBooks || [])];
  state.featuredTeachers = [...(currentCfg.featuredTeachers || [])];
  state.featuredReviews = [...(currentCfg.featuredReviews || [])];
  state.courseMetadata = { ...(currentCfg.courseMetadata || {}) };
  state.bookMetadata = { ...(currentCfg.bookMetadata || {}) };

  applyFeaturedMetadata(coursesData, booksData);

  hideAllMainSections();

  const container = document.getElementById("homepageManagementContent") || document.getElementById("dashboardContent");
  const parentPage = document.getElementById("homepageManagementPage");

  if (parentPage) {
    parentPage.classList.remove("hidden");
  }

  if (!container) return;

  renderHomepageManagementUI(container);
}

function renderHomepageManagementUI(container) {
  const courseCategories = Array.from(new Set(coursesData.map(c => c.category).filter(Boolean)));
  const bookCategories = Array.from(new Set(booksData.map(b => b.category).filter(Boolean)));

  container.innerHTML = `
    <div style="max-width:1280px; margin: 0 auto; padding: 24px 16px; font-family: inherit; direction: rtl;">
      
      <!-- Style for responsive metrics grid -->
      <style>
        .owner-homepage-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 14px 18px;
          border-radius: 12px;
          color: #fff;
          margin-bottom: 14px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .owner-homepage-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        @media (max-width: 860px) {
          .owner-homepage-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .owner-homepage-hero {
            padding: 12px 14px;
          }
        }
        @media (max-width: 480px) {
          .owner-homepage-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
      </style>

      <!-- Top Control Header (Compact Admin Style) -->
      <div class="owner-homepage-hero">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
          <div style="flex: 1; min-width: 260px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <a href="#teacher/dashboard" onclick="event.preventDefault(); if(window.handleGlobalBack) window.handleGlobalBack(event); else window.location.hash='#teacher/dashboard';" style="color: #94a3b8; text-decoration: none; font-size: 12px; font-weight: 600; transition: color 0.2s;" onmouseover="this.style.color='#f8fafc'" onmouseout="this.style.color='#94a3b8'">
                ← العودة للوحة التحكم
              </a>
              <span style="color: #475569; font-size: 12px;">|</span>
              <span style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(248, 113, 113, 0.3); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 12px; white-space: nowrap;">
                Platform Owner Only
              </span>
            </div>
            <h1 style="font-size: 19px; font-weight: 800; color: #f8fafc; margin: 0; letter-spacing: -0.3px; line-height: 1.3;">
              🏠 مركز إدارة ومحتوى الصفحة الرئيسية
            </h1>
            <p style="font-size: 12px; color: #94a3b8; margin: 3px 0 0 0; line-height: 1.4;">
              لوحة التحكم الشاملة لمالك المنصة للتحكم المباشر بالدورات المميزة، الكتب، أفضل المعلمين، وآراء الطلاب المعروضة في الصفحة الرئيسية.
            </p>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button type="button" onclick="previewHomepage()" style="background: rgba(255,255,255,0.1); color: #f8fafc; border: 1px solid rgba(255,255,255,0.2); padding: 7px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; backdrop-filter: blur(8px); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
              <span style="font-size: 13px;">👁️</span> معاينة الصفحة الرئيسية
            </button>
            <button type="button" onclick="handleSaveHomepageConfig()" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 7px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(16,185,129,0.3); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='translateY(0)'">
              <span style="font-size: 13px;">💾</span> حفظ التغييرات الآن
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Metrics Overview Cards (Compact Responsive Grid) -->
      <div class="owner-homepage-metrics-grid">
        <!-- Card 1: Courses -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div>
            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; line-height: 1.2;">الدورات المميزة</span>
            <div style="font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.2;">
              <span id="courseCountBadge">${state.featuredCourses.length}</span> <span style="font-size: 11px; font-weight: 600; color: #64748b;">/ 4 موصى به</span>
            </div>
          </div>
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">🎓</div>
        </div>

        <!-- Card 2: Books -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div>
            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; line-height: 1.2;">الكتب المميزة</span>
            <div style="font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.2;">
              <span id="bookCountBadge">${state.featuredBooks.length}</span> <span style="font-size: 11px; font-weight: 600; color: #64748b;">/ 4 موصى به</span>
            </div>
          </div>
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #f3e8ff; color: #7e22ce; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">📚</div>
        </div>

        <!-- Card 3: Teachers -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div>
            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; line-height: 1.2;">أفضل المعلمين المعروضين</span>
            <div style="font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.2;">
              <span id="teacherCountBadge">${state.featuredTeachers.length}</span> <span style="font-size: 11px; font-weight: 600; color: #64748b;">معلم</span>
            </div>
          </div>
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">👨‍🏫</div>
        </div>

        <!-- Card 4: Reviews -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div>
            <span style="font-size: 11px; color: #64748b; font-weight: 600; display: block; line-height: 1.2;">آراء الطلاب المعروضة</span>
            <div style="font-size: 17px; font-weight: 800; color: #0f172a; margin-top: 2px; line-height: 1.2;">
              <span id="reviewCountBadge">${state.featuredReviews.length}</span> <span style="font-size: 11px; font-weight: 600; color: #64748b;">تقييم</span>
            </div>
          </div>
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #fef3c7; color: #b45309; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">⭐</div>
        </div>
      </div>

      <!-- SECTION 1: COURSES MANAGEMENT -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>🎓</span> إدارة وسحب الدورات التعليمية (Courses Control)
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">ابحث وحدد تصنيفات الدورات التي تظهر في تبويبات الصفحة الرئيسية (المميزة، الأكثر مبيعاً، الجديدة، الأعلى تقييماً، العروض).</p>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input type="text" id="coursesSearchInput" value="${escapeHtml(state.searchQueries.courses)}" oninput="updateHomepageSearch('courses', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();}" autocomplete="off" placeholder="🔍 ابحث بالاسم، المعلم، أو التخصص..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e293b;" />
          </div>
          <div style="min-width: 180px;">
            <select id="coursesCategorySelect" onchange="updateCategoryFilter('courses', this.value)" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e293b; font-weight: 600;">
              <option value="all" ${state.categoryFilters.courses === "all" ? "selected" : ""}>جميع التخصصات</option>
              ${courseCategories.map(cat => `<option value="${escapeHtml(cat)}" ${state.categoryFilters.courses === cat ? "selected" : ""}>${escapeHtml(cat)}</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Table -->
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700;">
                <th style="padding: 12px 16px; min-width: 220px;">الدورة التعليمية</th>
                <th style="padding: 12px 16px; min-width: 150px;">المعلم / المدرب</th>
                <th style="padding: 12px 16px; min-width: 120px;">التصنيف</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 90px;">🌟 المميزة</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 100px;">🔥 الأكثر مبيعاً</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 90px;">✨ الجديدة</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 110px;">⭐ الأعلى تقييماً</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 90px;">🏷️ العروض</th>
              </tr>
            </thead>
            <tbody id="coursesTableBody">
              ${renderCoursesRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 2: BOOKS MANAGEMENT -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>📚</span> إدارة وتصنيف الكتب الرقمية (Books Control)
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">ابحث وحدد حالات الكتب التي تظهر في أقسام الكتب بالصفحة الرئيسية.</p>
          </div>
        </div>

        <!-- Search & Filter Controls -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input type="text" id="booksSearchInput" value="${escapeHtml(state.searchQueries.books)}" oninput="updateHomepageSearch('books', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();}" autocomplete="off" placeholder="🔍 ابحث باسم الكتاب، المؤلف، أو الرقم المعياري ISBN..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e293b;" />
          </div>
          <div style="min-width: 180px;">
            <select id="booksCategorySelect" onchange="updateCategoryFilter('books', this.value)" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e293b; font-weight: 600;">
              <option value="all" ${state.categoryFilters.books === "all" ? "selected" : ""}>جميع تصنيفات الكتب</option>
              ${bookCategories.map(cat => `<option value="${escapeHtml(cat)}" ${state.categoryFilters.books === cat ? "selected" : ""}>${escapeHtml(cat)}</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- Table -->
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700;">
                <th style="padding: 12px 16px; min-width: 220px;">الكتاب الرقمي</th>
                <th style="padding: 12px 16px; min-width: 150px;">المؤلف / الكاتب</th>
                <th style="padding: 12px 16px; min-width: 120px;">التصنيف</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 90px;">🌟 المميزة</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 100px;">🔥 الأكثر مبيعاً</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 90px;">✨ الجديدة</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 110px;">⭐ الأعلى تقييماً</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 90px;">🏷️ العروض</th>
              </tr>
            </thead>
            <tbody id="booksTableBody">
              ${renderBooksRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 3: TEACHERS MANAGEMENT -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>👨‍🏫</span> إدارة قسم "أفضل المعلمين" في الصفحة الرئيسية
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">اختر المعلمين الذين يظهرون في قسم "أفضل المعلمين" برئيسية المنصة وحدد ترتيب ظهورهم.</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div style="margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <input type="text" id="teachersSearchInput" value="${escapeHtml(state.searchQueries.teachers)}" oninput="updateHomepageSearch('teachers', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();}" autocomplete="off" placeholder="🔍 ابحث باسم المعلم، التخصص، أو الخبرة/الشركة..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e293b;" />
        </div>

        <!-- Table -->
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700;">
                <th style="padding: 12px 16px; min-width: 220px;">المعلم</th>
                <th style="padding: 12px 16px; min-width: 180px;">التخصص / الدور</th>
                <th style="padding: 12px 16px; min-width: 150px;">الخبرة / الجهة</th>
                <th style="padding: 12px 16px; min-width: 140px;">الإحصائيات</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 160px;">العرض بالصفحة الرئيسية</th>
              </tr>
            </thead>
            <tbody id="teachersTableBody">
              ${renderTeachersRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 4: STUDENT REVIEWS MANAGEMENT -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span>⭐</span> إدارة قسم "آراء الطلاب" في الصفحة الرئيسية
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">اختر التقييمات وآراء الطلاب التي تظهر في قسم آراء العملاء والطلاب برئيسية المنصة.</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div style="margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <input type="text" id="reviewsSearchInput" value="${escapeHtml(state.searchQueries.reviews)}" oninput="updateHomepageSearch('reviews', this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();}" autocomplete="off" placeholder="🔍 ابحث باسم الطالب، اسم الدورة/الكتاب، أو نص التقييم..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background: #ffffff; color: #1e293b;" />
        </div>

        <!-- Table -->
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 700;">
                <th style="padding: 12px 16px; min-width: 180px;">الطالب</th>
                <th style="padding: 12px 16px; min-width: 200px;">الدورة / الكتاب</th>
                <th style="padding: 12px 16px; min-width: 100px;">التقييم</th>
                <th style="padding: 12px 16px; min-width: 260px;">عنوان ونص التقييم</th>
                <th style="padding: 12px 16px; text-align: center; min-width: 160px;">العرض بالصفحة الرئيسية</th>
              </tr>
            </thead>
            <tbody id="reviewsTableBody">
              ${renderReviewsRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECTION 5: ORDER MANAGEMENT -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px;">
          <span>🔢</span> ترتيب أسبقية الظهور في الصفحة الرئيسية (Featured Order)
        </h2>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0;">استخدم أسهم الترتيب أو السحب والإفلات لضبط الترتيب الدقيق للعناصر المختارة.</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          <!-- Course Order -->
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">🎓 ترتيب الدورات المميزة</h3>
            <div id="courseOrderList" style="display: flex; flex-direction: column; gap: 8px;">
              ${renderCourseOrderItems()}
            </div>
          </div>

          <!-- Book Order -->
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">📚 ترتيب الكتب المميزة</h3>
            <div id="bookOrderList" style="display: flex; flex-direction: column; gap: 8px;">
              ${renderBookOrderItems()}
            </div>
          </div>

          <!-- Teacher Order -->
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">👨‍🏫 ترتيب أفضل المعلمين</h3>
            <div id="teacherOrderList" style="display: flex; flex-direction: column; gap: 8px;">
              ${renderTeacherOrderItems()}
            </div>
          </div>

          <!-- Review Order -->
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 12px 0;">⭐ ترتيب آراء الطلاب</h3>
            <div id="reviewOrderList" style="display: flex; flex-direction: column; gap: 8px;">
              ${renderReviewOrderItems()}
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  bindDragAndDropEvents();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCoursesRows() {
  const query = (state.searchQueries.courses || "").trim().toLowerCase();
  const catFilter = state.categoryFilters.courses;

  const filtered = coursesData.filter(c => {
    const matchesCat = catFilter === "all" || c.category === catFilter;
    if (!matchesCat) return false;
    if (!query) return true;
    return (
      (c.title && c.title.toLowerCase().includes(query)) ||
      (c.instructor && c.instructor.toLowerCase().includes(query)) ||
      (c.category && c.category.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    return `
      <tr>
        <td colspan="8" style="padding: 32px; text-align: center; color: #94a3b8; font-size: 13px;">
          🔍 لم يتم العثور على دورات تطابق البحث "${escapeHtml(query)}"
        </td>
      </tr>
    `;
  }

  return filtered.map((course) => {
    const meta = state.courseMetadata[String(course.id)] || {};
    const isFeatured = state.featuredCourses.some((id) => String(id) === String(course.id));

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${course.image}" alt="${escapeHtml(course.title)}" style="width: 44px; height: 32px; border-radius: 6px; object-fit: cover;" />
            <span style="font-weight: 700; color: #1e293b;">${escapeHtml(course.title)}</span>
          </div>
        </td>
        <td style="padding: 12px 16px; color: #475569;">${escapeHtml(course.instructor)}</td>
        <td style="padding: 12px 16px;">
          <span style="background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
            ${escapeHtml(course.category || "عام")}
          </span>
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleCourseMeta(${course.id}, 'isFeatured', this.checked)" ${isFeatured ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #10b981; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleCourseMeta(${course.id}, 'isBestSeller', this.checked)" ${meta.isBestSeller ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleCourseMeta(${course.id}, 'isNew', this.checked)" ${meta.isNew ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #8b5cf6; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleCourseMeta(${course.id}, 'isTopRated', this.checked)" ${meta.isTopRated ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #f59e0b; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleCourseMeta(${course.id}, 'isOffer', this.checked)" ${meta.isOffer ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #ef4444; cursor: pointer;" />
        </td>
      </tr>
    `;
  }).join("");
}

function renderBooksRows() {
  const query = (state.searchQueries.books || "").trim().toLowerCase();
  const catFilter = state.categoryFilters.books;

  const filtered = booksData.filter(b => {
    const matchesCat = catFilter === "all" || b.category === catFilter;
    if (!matchesCat) return false;
    if (!query) return true;
    return (
      (b.title && b.title.toLowerCase().includes(query)) ||
      (b.author && b.author.toLowerCase().includes(query)) ||
      (b.isbn && b.isbn.toLowerCase().includes(query)) ||
      (b.category && b.category.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    return `
      <tr>
        <td colspan="8" style="padding: 32px; text-align: center; color: #94a3b8; font-size: 13px;">
          🔍 لم يتم العثور على كتب تطابق البحث "${escapeHtml(query)}"
        </td>
      </tr>
    `;
  }

  return filtered.map((book) => {
    const meta = state.bookMetadata[String(book.id)] || {};
    const isFeatured = state.featuredBooks.some((id) => String(id) === String(book.id));

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${book.image}" alt="${escapeHtml(book.title)}" style="width: 36px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid #e2e8f0;" />
            <span style="font-weight: 700; color: #1e293b;">${escapeHtml(book.title)}</span>
          </div>
        </td>
        <td style="padding: 12px 16px; color: #475569;">${escapeHtml(book.author)}</td>
        <td style="padding: 12px 16px;">
          <span style="background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
            ${escapeHtml(book.category || "عام")}
          </span>
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleBookMeta(${book.id}, 'isFeatured', this.checked)" ${isFeatured ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #10b981; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleBookMeta(${book.id}, 'isBestSeller', this.checked)" ${meta.isBestSeller ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleBookMeta(${book.id}, 'isNew', this.checked)" ${meta.isNew ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #8b5cf6; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleBookMeta(${book.id}, 'isTopRated', this.checked)" ${meta.isTopRated ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #f59e0b; cursor: pointer;" />
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <input type="checkbox" onchange="toggleBookMeta(${book.id}, 'isOffer', this.checked)" ${meta.isOffer ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #ef4444; cursor: pointer;" />
        </td>
      </tr>
    `;
  }).join("");
}

function renderTeachersRows() {
  const query = (state.searchQueries.teachers || "").trim().toLowerCase();

  const filtered = teachersData.filter(t => {
    if (!query) return true;
    return (
      (t.name && t.name.toLowerCase().includes(query)) ||
      (t.nameEn && t.nameEn.toLowerCase().includes(query)) ||
      (t.role && t.role.toLowerCase().includes(query)) ||
      (t.company && t.company.toLowerCase().includes(query)) ||
      (t.specialization && t.specialization.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    return `
      <tr>
        <td colspan="5" style="padding: 32px; text-align: center; color: #94a3b8; font-size: 13px;">
          🔍 لم يتم العثور على معلمين يطابقون البحث "${escapeHtml(query)}"
        </td>
      </tr>
    `;
  }

  return filtered.map((teacher) => {
    const isFeatured = state.featuredTeachers.some((id) => String(id) === String(teacher.id));

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${teacher.avatar}" alt="${escapeHtml(teacher.name)}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;" />
            <div>
              <div style="font-weight: 700; color: #1e293b;">${escapeHtml(teacher.name)}</div>
              <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(teacher.nameEn || "")}</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px 16px; color: #475569; font-weight: 600;">${escapeHtml(teacher.role)}</td>
        <td style="padding: 12px 16px; color: #64748b; font-size: 12px;">
          ${teacher.company ? `🏢 ${escapeHtml(teacher.company)}` : ""} ${teacher.experience ? `(${escapeHtml(teacher.experience)})` : ""}
        </td>
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #475569;">
            <span>⭐ ${teacher.rating || "5.0"}</span>
            <span>👥 ${teacher.studentsCount || "0"}</span>
            <span>📚 ${teacher.coursesCount || 0} دورة</span>
          </div>
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: ${isFeatured ? '#15803d' : '#64748b'}; background: ${isFeatured ? '#f0fdf4' : '#f8fafc'}; padding: 6px 12px; border-radius: 8px; border: 1px solid ${isFeatured ? '#bbf7d0' : '#e2e8f0'};">
            <input type="checkbox" onchange="toggleTeacherFeatured('${teacher.id}', this.checked)" ${isFeatured ? "checked" : ""} style="width: 16px; height: 16px; accent-color: #16a34a; cursor: pointer;" />
            <span>${isFeatured ? "معروض بالرئيسية" : "غير معروض"}</span>
          </label>
        </td>
      </tr>
    `;
  }).join("");
}

function renderReviewsRows() {
  const query = (state.searchQueries.reviews || "").trim().toLowerCase();
  const allReviews = getReviewsList();

  const filtered = allReviews.filter(r => {
    if (!query) return true;
    return (
      (r.studentName && r.studentName.toLowerCase().includes(query)) ||
      (r.courseOrBookName && r.courseOrBookName.toLowerCase().includes(query)) ||
      (r.reviewTitle && r.reviewTitle.toLowerCase().includes(query)) ||
      (r.reviewText && r.reviewText.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    return `
      <tr>
        <td colspan="5" style="padding: 32px; text-align: center; color: #94a3b8; font-size: 13px;">
          🔍 لم يتم العثور على تقييمات تطابق البحث "${escapeHtml(query)}"
        </td>
      </tr>
    `;
  }

  return filtered.map((review) => {
    const isFeatured = state.featuredReviews.some((id) => String(id) === String(review.id));
    const starsStr = "⭐".repeat(Number(review.stars) || 5);

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
        <td style="padding: 12px 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="${review.avatar}" alt="${escapeHtml(review.studentName)}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
            <span style="font-weight: 700; color: #1e293b;">${escapeHtml(review.studentName)}</span>
          </div>
        </td>
        <td style="padding: 12px 16px; color: #475569; font-weight: 600;">${escapeHtml(review.courseOrBookName)}</td>
        <td style="padding: 12px 16px; font-size: 13px;">${starsStr}</td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 12px; margin-bottom: 2px;">${escapeHtml(review.reviewTitle || "")}</div>
          <div style="font-size: 12px; color: #64748b; line-height: 1.4; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(review.reviewText)}">
            ${escapeHtml(review.reviewText)}
          </div>
        </td>
        <td style="padding: 12px 16px; text-align: center;">
          <label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 700; color: ${isFeatured ? '#92400e' : '#64748b'}; background: ${isFeatured ? '#fef3c7' : '#f8fafc'}; padding: 6px 12px; border-radius: 8px; border: 1px solid ${isFeatured ? '#fde68a' : '#e2e8f0'};">
            <input type="checkbox" onchange="toggleReviewFeatured('${review.id}', this.checked)" ${isFeatured ? "checked" : ""} style="width: 16px; height: 16px; accent-color: #d97706; cursor: pointer;" />
            <span>${isFeatured ? "معروض بالرئيسية" : "غير معروض"}</span>
          </label>
        </td>
      </tr>
    `;
  }).join("");
}

function renderCourseOrderItems() {
  if (state.featuredCourses.length === 0) {
    return `<div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">لم يتم اختيار أي دورات مميزة بعد</div>`;
  }

  return state.featuredCourses.map((id, index) => {
    const course = coursesData.find((c) => String(c.id) === String(id));
    if (!course) return "";
    return `
      <div class="draggable-order-item" data-type="course" data-id="${course.id}" data-index="${index}" draggable="true" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; cursor: grab; user-select: none;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 800; color: #475569; width: 20px;">${index + 1}.</span>
          <img src="${course.image}" alt="${escapeHtml(course.title)}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover;" />
          <div>
            <div style="font-weight: 700; color: #1e293b; font-size: 12px;">${escapeHtml(course.title)}</div>
            <div style="font-size: 11px; color: #64748b;">${escapeHtml(course.instructor)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button type="button" onclick="moveItem('course', ${index}, -1)" ${index === 0 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↑</button>
          <button type="button" onclick="moveItem('course', ${index}, 1)" ${index === state.featuredCourses.length - 1 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↓</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderBookOrderItems() {
  if (state.featuredBooks.length === 0) {
    return `<div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">لم يتم اختيار أي كتب مميزة بعد</div>`;
  }

  return state.featuredBooks.map((id, index) => {
    const book = booksData.find((b) => String(b.id) === String(id));
    if (!book) return "";
    return `
      <div class="draggable-order-item" data-type="book" data-id="${book.id}" data-index="${index}" draggable="true" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; cursor: grab; user-select: none;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 800; color: #475569; width: 20px;">${index + 1}.</span>
          <img src="${book.image}" alt="${escapeHtml(book.title)}" style="width: 32px; height: 40px; border-radius: 4px; object-fit: cover;" />
          <div>
            <div style="font-weight: 700; color: #1e293b; font-size: 12px;">${escapeHtml(book.title)}</div>
            <div style="font-size: 11px; color: #64748b;">${escapeHtml(book.author)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button type="button" onclick="moveItem('book', ${index}, -1)" ${index === 0 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↑</button>
          <button type="button" onclick="moveItem('book', ${index}, 1)" ${index === state.featuredBooks.length - 1 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↓</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderTeacherOrderItems() {
  if (state.featuredTeachers.length === 0) {
    return `<div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">لم يتم تحديد أي معلمين للعرض بعد</div>`;
  }

  return state.featuredTeachers.map((id, index) => {
    const teacher = teachersData.find((t) => String(t.id) === String(id));
    if (!teacher) return "";
    return `
      <div class="draggable-order-item" data-type="teacher" data-id="${teacher.id}" data-index="${index}" draggable="true" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; cursor: grab; user-select: none;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 800; color: #475569; width: 20px;">${index + 1}.</span>
          <img src="${teacher.avatar}" alt="${escapeHtml(teacher.name)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
          <div>
            <div style="font-weight: 700; color: #1e293b; font-size: 12px;">${escapeHtml(teacher.name)}</div>
            <div style="font-size: 11px; color: #64748b;">${escapeHtml(teacher.role)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button type="button" onclick="moveItem('teacher', ${index}, -1)" ${index === 0 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↑</button>
          <button type="button" onclick="moveItem('teacher', ${index}, 1)" ${index === state.featuredTeachers.length - 1 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↓</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderReviewOrderItems() {
  if (state.featuredReviews.length === 0) {
    return `<div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">لم يتم تحديد أي تقييمات للعرض بعد</div>`;
  }

  const allReviews = getReviewsList();
  return state.featuredReviews.map((id, index) => {
    const review = allReviews.find((r) => String(r.id) === String(id));
    if (!review) return "";
    return `
      <div class="draggable-order-item" data-type="review" data-id="${review.id}" data-index="${index}" draggable="true" style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; cursor: grab; user-select: none;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 800; color: #475569; width: 20px;">${index + 1}.</span>
          <img src="${review.avatar}" alt="${escapeHtml(review.studentName)}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" />
          <div>
            <div style="font-weight: 700; color: #1e293b; font-size: 12px;">${escapeHtml(review.studentName)}</div>
            <div style="font-size: 11px; color: #64748b;">${escapeHtml(review.courseOrBookName)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px;">
          <button type="button" onclick="moveItem('review', ${index}, -1)" ${index === 0 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↑</button>
          <button type="button" onclick="moveItem('review', ${index}, 1)" ${index === state.featuredReviews.length - 1 ? "disabled" : ""} style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-weight: bold; color: #334155;">↓</button>
        </div>
      </div>
    `;
  }).join("");
}

function updateBadgesAndOrderLists() {
  const courseBadge = document.getElementById("courseCountBadge");
  if (courseBadge) courseBadge.textContent = state.featuredCourses.length;

  const bookBadge = document.getElementById("bookCountBadge");
  if (bookBadge) bookBadge.textContent = state.featuredBooks.length;

  const teacherBadge = document.getElementById("teacherCountBadge");
  if (teacherBadge) teacherBadge.textContent = state.featuredTeachers.length;

  const reviewBadge = document.getElementById("reviewCountBadge");
  if (reviewBadge) reviewBadge.textContent = state.featuredReviews.length;

  const courseList = document.getElementById("courseOrderList");
  if (courseList) courseList.innerHTML = renderCourseOrderItems();

  const bookList = document.getElementById("bookOrderList");
  if (bookList) bookList.innerHTML = renderBookOrderItems();

  const teacherList = document.getElementById("teacherOrderList");
  if (teacherList) teacherList.innerHTML = renderTeacherOrderItems();

  const reviewList = document.getElementById("reviewOrderList");
  if (reviewList) reviewList.innerHTML = renderReviewOrderItems();

  bindDragAndDropEvents();
}

window.toggleCourseMeta = function (courseId, flag, checked) {
  const idStr = String(courseId);
  if (!state.courseMetadata[idStr]) {
    state.courseMetadata[idStr] = {};
  }
  state.courseMetadata[idStr][flag] = checked;

  if (flag === "isFeatured") {
    if (checked) {
      if (!state.featuredCourses.some((id) => String(id) === idStr)) {
        state.featuredCourses.push(courseId);
      }
    } else {
      state.featuredCourses = state.featuredCourses.filter((id) => String(id) !== idStr);
    }
  }

  syncStateToDraft();

  const tbody = document.getElementById("coursesTableBody");
  if (tbody) {
    tbody.innerHTML = renderCoursesRows();
  }
  updateBadgesAndOrderLists();
};

window.toggleBookMeta = function (bookId, flag, checked) {
  const idStr = String(bookId);
  if (!state.bookMetadata[idStr]) {
    state.bookMetadata[idStr] = {};
  }
  state.bookMetadata[idStr][flag] = checked;

  if (flag === "isFeatured") {
    if (checked) {
      if (!state.featuredBooks.some((id) => String(id) === idStr)) {
        state.featuredBooks.push(bookId);
      }
    } else {
      state.featuredBooks = state.featuredBooks.filter((id) => String(id) !== idStr);
    }
  }

  syncStateToDraft();

  const tbody = document.getElementById("booksTableBody");
  if (tbody) {
    tbody.innerHTML = renderBooksRows();
  }
  updateBadgesAndOrderLists();
};

window.toggleTeacherFeatured = function (teacherId, checked) {
  const idStr = String(teacherId);
  if (checked) {
    if (!state.featuredTeachers.some((id) => String(id) === idStr)) {
      state.featuredTeachers.push(teacherId);
    }
  } else {
    state.featuredTeachers = state.featuredTeachers.filter((id) => String(id) !== idStr);
  }

  syncStateToDraft();

  const tbody = document.getElementById("teachersTableBody");
  if (tbody) {
    tbody.innerHTML = renderTeachersRows();
  }
  updateBadgesAndOrderLists();
};

window.toggleReviewFeatured = function (reviewId, checked) {
  const idStr = String(reviewId);
  if (checked) {
    if (!state.featuredReviews.some((id) => String(id) === idStr)) {
      state.featuredReviews.push(reviewId);
    }
  } else {
    state.featuredReviews = state.featuredReviews.filter((id) => String(id) !== idStr);
  }

  syncStateToDraft();

  const tbody = document.getElementById("reviewsTableBody");
  if (tbody) {
    tbody.innerHTML = renderReviewsRows();
  }
  updateBadgesAndOrderLists();
};

window.moveItem = function (type, index, direction) {
  let targetArray;
  if (type === "course") targetArray = state.featuredCourses;
  else if (type === "book") targetArray = state.featuredBooks;
  else if (type === "teacher") targetArray = state.featuredTeachers;
  else if (type === "review") targetArray = state.featuredReviews;
  if (!targetArray) return;

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= targetArray.length) return;

  const temp = targetArray[index];
  targetArray[index] = targetArray[newIndex];
  targetArray[newIndex] = temp;

  syncStateToDraft();

  updateBadgesAndOrderLists();
};

window.updateHomepageSearch = function (type, value) {
  state.searchQueries[type] = value || "";

  if (type === "courses") {
    const tbody = document.getElementById("coursesTableBody");
    if (tbody) tbody.innerHTML = renderCoursesRows();
    else refreshUI();
  } else if (type === "books") {
    const tbody = document.getElementById("booksTableBody");
    if (tbody) tbody.innerHTML = renderBooksRows();
    else refreshUI();
  } else if (type === "teachers") {
    const tbody = document.getElementById("teachersTableBody");
    if (tbody) tbody.innerHTML = renderTeachersRows();
    else refreshUI();
  } else if (type === "reviews") {
    const tbody = document.getElementById("reviewsTableBody");
    if (tbody) tbody.innerHTML = renderReviewsRows();
    else refreshUI();
  }
};

window.updateCategoryFilter = function (type, value) {
  state.categoryFilters[type] = value || "all";

  if (type === "courses") {
    const tbody = document.getElementById("coursesTableBody");
    if (tbody) tbody.innerHTML = renderCoursesRows();
    else refreshUI();
  } else if (type === "books") {
    const tbody = document.getElementById("booksTableBody");
    if (tbody) tbody.innerHTML = renderBooksRows();
    else refreshUI();
  }
};

window.previewHomepage = function () {
  syncStateToDraft();
  applyFeaturedMetadata(coursesData, booksData);
  
  if (typeof showToast === "function") {
    showToast({ type: "info", title: "معاينة الرئيسية", message: "جاري الانتقال لمعاينة الصفحة الرئيسية..." });
  }

  window.location.hash = "#";
  setTimeout(() => {
    if (typeof window.filterCourses === "function") window.filterCourses();
    if (typeof window.renderBooksSection === "function") window.renderBooksSection();
    if (typeof window.renderHomeTeachers === "function") window.renderHomeTeachers();
    if (typeof window.renderHomeTestimonials === "function") window.renderHomeTestimonials();
  }, 100);
};

function refreshUI() {
  const container = document.getElementById("homepageManagementContent") || document.getElementById("dashboardContent");
  if (!container) return;

  const coursesBody = document.getElementById("coursesTableBody");
  if (coursesBody) {
    const cBody = document.getElementById("coursesTableBody");
    if (cBody) cBody.innerHTML = renderCoursesRows();

    const bBody = document.getElementById("booksTableBody");
    if (bBody) bBody.innerHTML = renderBooksRows();

    const tBody = document.getElementById("teachersTableBody");
    if (tBody) tBody.innerHTML = renderTeachersRows();

    const rBody = document.getElementById("reviewsTableBody");
    if (rBody) rBody.innerHTML = renderReviewsRows();

    updateBadgesAndOrderLists();
  } else {
    renderHomepageManagementUI(container);
  }
}

function bindDragAndDropEvents() {
  let draggedEl = null;

  document.querySelectorAll(".draggable-order-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      draggedEl = item;
      e.dataTransfer.effectAllowed = "move";
      item.style.opacity = "0.5";
    });

    item.addEventListener("dragend", () => {
      item.style.opacity = "1";
      draggedEl = null;
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!draggedEl || draggedEl === item) return;

      const type = item.getAttribute("data-type");
      const fromType = draggedEl.getAttribute("data-type");

      if (type !== fromType) return;

      const fromIndex = parseInt(draggedEl.getAttribute("data-index"), 10);
      const toIndex = parseInt(item.getAttribute("data-index"), 10);

      let arr;
      if (type === "course") arr = state.featuredCourses;
      else if (type === "book") arr = state.featuredBooks;
      else if (type === "teacher") arr = state.featuredTeachers;
      else if (type === "review") arr = state.featuredReviews;

      if (arr) {
        const [movedItem] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, movedItem);
        syncStateToDraft();
        updateBadgesAndOrderLists();
      }
    });
  });
}

window.handleSaveHomepageConfig = function () {
  try {
    saveFeaturedConfig(
      state.featuredCourses,
      state.featuredBooks,
      state.featuredTeachers,
      state.featuredReviews,
      state.courseMetadata,
      state.bookMetadata
    );

    applyFeaturedMetadata(coursesData, booksData);

    const successMsg = "✅ تم حفظ إعدادات الصفحة الرئيسية وتحديث جميع الأقسام بنجاح!";
    
    if (typeof showToast === "function") {
      showToast({ type: "success", title: "تم الحفظ بنجاح", message: successMsg });
    } else {
      showCustomAlert(successMsg);
    }

    if (typeof window.filterCourses === "function") {
      window.filterCourses();
    }
    if (typeof window.renderBooksSection === "function") {
      window.renderBooksSection();
    }
    if (typeof window.renderBooks === "function") {
      window.renderBooks();
    }
    if (typeof window.renderHomeTeachers === "function") {
      window.renderHomeTeachers();
    }
    if (typeof window.renderHomeTestimonials === "function") {
      window.renderHomeTestimonials();
    }
  } catch (e) {
    console.error("Save failed:", e);
    const errorMsg = "❌ حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.";
    if (typeof showToast === "function") {
      showToast({ type: "error", title: "فشل الحفظ", message: errorMsg });
    } else {
      showCustomAlert(errorMsg);
    }
  }
};

window.openHomepageManagement = openHomepageManagement;
