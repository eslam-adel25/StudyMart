import { 
  getReviewsList, 
  getReviewById, 
  addTeacherReplyToReview, 
  deleteTeacherReplyFromReview, 
  togglePinReview, 
  deleteReviewFromList 
} from "../data/reviewsData.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { getStudentById } from "../data/studentsData.js";
import { showCustomAlert } from "../utils/helpers.js";
import { showInputDialog, showSuccessToast, showErrorToast } from "./notificationService.js";
import { hideAllMainSections } from "./layoutService.js";
import { isTeacher } from "./permissionService.js";
import { normalizeSearchString } from "../components/search.js";

// Active State
let reviewState = {
  searchQuery: "",
  courseFilter: "all",
  bookFilter: "all",
  starsFilter: "all",
  replyFilter: "all", // "all" | "replied" | "pending"
  sortBy: "date_desc",
  currentPage: 1,
  pageSize: 8
};

/**
 * Filter reviews list
 */
export function getFilteredReviews() {
  let list = [...getReviewsList()];

  // Search
  if (reviewState.searchQuery && reviewState.searchQuery.trim()) {
    const normQuery = normalizeSearchString(reviewState.searchQuery);
    if (normQuery) {
      const tokens = normQuery.split(" ").filter(Boolean);
      list = list.filter(r => {
        let teacherName = "";
        let category = "";
        if (r.type === "Course" && r.purchasedItemId) {
          const course = coursesData.find(c => String(c.id) === String(r.purchasedItemId));
          if (course) {
            teacherName = course.instructor || course.instructorName || "";
            category = course.category || course.series || "";
          }
        } else if (r.type === "Book" && r.purchasedItemId) {
          const book = booksData.find(b => String(b.id) === String(r.purchasedItemId));
          if (book) {
            teacherName = book.author || "";
            category = book.category || book.subCategory || "";
          }
        }

        const rawText = [
          r.studentName || "",
          r.reviewTitle || "",
          r.reviewText || "",
          r.courseOrBookName || "",
          r.teacherReply || "",
          teacherName,
          category,
          r.type === "Course" ? "دورة دورات course courses" : "كتاب كتب book books"
        ].join(" ");

        const searchableText = normalizeSearchString(rawText);
        return tokens.every(token => searchableText.includes(token));
      });
    }
  }

  // Course Filter
  if (reviewState.courseFilter !== "all") {
    list = list.filter(r => r.type === "Course" && String(r.purchasedItemId) === String(reviewState.courseFilter));
  }

  // Book Filter
  if (reviewState.bookFilter !== "all") {
    list = list.filter(r => r.type === "Book" && String(r.purchasedItemId) === String(reviewState.bookFilter));
  }

  // Stars Filter
  if (reviewState.starsFilter !== "all") {
    list = list.filter(r => Number(r.stars) === Number(reviewState.starsFilter));
  }

  // Reply Filter
  if (reviewState.replyFilter !== "all") {
    if (reviewState.replyFilter === "replied") list = list.filter(r => r.replyStatus === "Replied");
    else if (reviewState.replyFilter === "pending") list = list.filter(r => r.replyStatus === "Pending");
  }

  // Pinned items first, then sort by selected criteria
  list.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (reviewState.sortBy === "date_desc") return new Date(b.createdDate) - new Date(a.createdDate);
    if (reviewState.sortBy === "date_asc") return new Date(a.createdDate) - new Date(b.createdDate);
    if (reviewState.sortBy === "stars_desc") return b.stars - a.stars;
    if (reviewState.sortBy === "stars_asc") return a.stars - b.stars;

    return 0;
  });

  return list;
}

/**
 * Open Main Student Reviews Page
 */
export function openStudentReviewsPage() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين والمالك فقط.");
    return;
  }

  hideAllMainSections();
  const page = document.getElementById("studentReviewsPage");
  if (page) page.classList.remove("hidden");

  if (!window.location.hash.includes("teacher/reviews")) {
    window.location.hash = "#teacher/reviews";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderStudentReviewsUI();
}

/**
 * Render Student Reviews UI
 */
export function renderStudentReviewsUI() {
  const container = document.getElementById("studentReviewsContent");
  if (!container) return;

  const allReviews = getReviewsList();
  const filtered = getFilteredReviews();

  // Summary Math
  const totalCount = allReviews.length;
  const avgRating = totalCount ? (allReviews.reduce((sum, r) => sum + r.stars, 0) / totalCount).toFixed(1) : "0.0";

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach(r => {
    if (starCounts[r.stars] !== undefined) starCounts[r.stars]++;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / reviewState.pageSize) || 1;
  if (reviewState.currentPage > totalPages) reviewState.currentPage = 1;

  const startIndex = (reviewState.currentPage - 1) * reviewState.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + reviewState.pageSize);

  container.innerHTML = `
    <div class="crm-module-container">
      
      <!-- HEADER -->
      <div class="crm-header-row">
        <div class="crm-title-area">
          <h1>⭐ تقييمات وآراء الطلاب (Student Reviews)</h1>
          <div class="crm-breadcrumb">
            <span>الرئيسية</span> <span class="sep">/</span>
            <span>لوحة المعلم</span> <span class="sep">/</span>
            <strong style="color: #7c3aed;">إدارة آراء وتقييمات الطلاب</strong>
          </div>
        </div>

        <div class="crm-actions-bar">
          <button type="button" class="crm-btn crm-btn-secondary" onclick="exportReviewsCSV()">
            📥 تصدير CSV
          </button>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="exportReviewsExcel()">
            📊 تصدير Excel
          </button>
          <button type="button" class="crm-btn crm-btn-primary" onclick="window.print()">
            🖨️ طباعة
          </button>
        </div>
      </div>

      <!-- SUMMARY & BREAKDOWN BAR -->
      <div class="crm-rating-breakdown-card">
        <div class="crm-rating-header-bar">
          
          <div class="crm-overall-score">
            <div class="crm-overall-num">${avgRating}</div>
            <div class="crm-overall-stars">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</div>
            <div class="crm-overall-count">بناءً على ${totalCount} تقييم</div>
          </div>

          <div class="crm-bars-list">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = starCounts[star] || 0;
              const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
              return `
                <div class="crm-bar-row">
                  <span class="crm-bar-star-label">${star} نجوم ⭐</span>
                  <div class="crm-bar-track">
                    <div class="crm-bar-fill" style="width: ${pct}%;"></div>
                  </div>
                  <span class="crm-bar-count">${count} (%${pct})</span>
                </div>
              `;
            }).join('')}
          </div>

        </div>
      </div>

      <!-- ANALYTICS CARDS GRID -->
      <div class="crm-analytics-grid">
        <div class="crm-analytics-card">
          <h4>📈 متوسط التقييم عبر الزمن</h4>
          <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
            • شهر أغسطس 2026: <strong style="color:#10b981;">4.9 ⭐</strong> (ارتفاع بنسبة +0.2)<br/>
            • شهر يوليو 2026: <strong style="color:#7c3aed;">4.7 ⭐</strong><br/>
            • إجمالي التقييمات الإيجابية: <strong style="color:#10b981;">92%</strong>
          </div>
        </div>

        <div class="crm-analytics-card">
          <h4>🏆 أفضل وأقل المنتجات تقييماً</h4>
          <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
            • الأعلى تقييماً (دورات): <strong style="color:#7c3aed;">بناء تطبيقات الويب مع React (4.9 ⭐)</strong><br/>
            • الأعلى تقييماً (كتب): <strong style="color:#0284c7;">كتاب React من الصفر (5.0 ⭐)</strong><br/>
            • الكلمات الأكثر تكراراً: <span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:700;">ممتاز</span> <span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:700;">شرح وافي</span> <span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:700;">تطبيقي</span>
          </div>
        </div>
      </div>

      <!-- FILTERS TOOLBAR -->
      <div class="crm-filters-card">
        <div class="crm-filters-row">
          
          <div class="crm-filter-group" style="grid-column: span 2;">
            <label>البحث في آراء وتقييمات الطلاب:</label>
            <input type="text" id="teacherReviewSearchInput" class="crm-input" placeholder="بحث باسم الطالب، العنوان، أو النص..." value="${reviewState.searchQuery}" oninput="handleReviewSearch(this.value)" onkeydown="handleReviewSearchKeydown(event)" />
          </div>

          <div class="crm-filter-group">
            <label>الدورة:</label>
            <select class="crm-select" onchange="handleReviewCourseFilter(this.value)">
              <option value="all">جميع الدورات</option>
              ${coursesData.map(c => `<option value="${c.id}" ${String(reviewState.courseFilter) === String(c.id) ? 'selected' : ''}>${c.title}</option>`).join('')}
            </select>
          </div>

          <div class="crm-filter-group">
            <label>الكتاب:</label>
            <select class="crm-select" onchange="handleReviewBookFilter(this.value)">
              <option value="all">جميع الكتب</option>
              ${booksData.map(b => `<option value="${b.id}" ${String(reviewState.bookFilter) === String(b.id) ? 'selected' : ''}>${b.title}</option>`).join('')}
            </select>
          </div>

          <div class="crm-filter-group">
            <label>عدد النجوم:</label>
            <select class="crm-select" onchange="handleReviewStarsFilter(this.value)">
              <option value="all" ${reviewState.starsFilter === 'all' ? 'selected' : ''}>جميع النجوم</option>
              <option value="5" ${reviewState.starsFilter === '5' ? 'selected' : ''}>5 نجوم ⭐⭐⭐⭐⭐</option>
              <option value="4" ${reviewState.starsFilter === '4' ? 'selected' : ''}>4 نجوم ⭐⭐⭐⭐</option>
              <option value="3" ${reviewState.starsFilter === '3' ? 'selected' : ''}>3 نجوم ⭐⭐⭐</option>
              <option value="2" ${reviewState.starsFilter === '2' ? 'selected' : ''}>نجمتان ⭐⭐</option>
              <option value="1" ${reviewState.starsFilter === '1' ? 'selected' : ''}>نجمة واحدة ⭐</option>
            </select>
          </div>

          <div class="crm-filter-group">
            <label>حالة الرد:</label>
            <select class="crm-select" onchange="handleReviewReplyFilter(this.value)">
              <option value="all" ${reviewState.replyFilter === 'all' ? 'selected' : ''}>جميع التقييمات</option>
              <option value="replied" ${reviewState.replyFilter === 'replied' ? 'selected' : ''}>تم الرد عليه (With Reply)</option>
              <option value="pending" ${reviewState.replyFilter === 'pending' ? 'selected' : ''}>بانتظار الرد (Without Reply)</option>
            </select>
          </div>

          <div class="crm-filter-group">
            <label>الترتيب حسب:</label>
            <select class="crm-select" onchange="handleReviewSort(this.value)">
              <option value="date_desc" ${reviewState.sortBy === 'date_desc' ? 'selected' : ''}>الأحدث أولاً</option>
              <option value="date_asc" ${reviewState.sortBy === 'date_asc' ? 'selected' : ''}>الأقدم أولاً</option>
              <option value="stars_desc" ${reviewState.sortBy === 'stars_desc' ? 'selected' : ''}>التقييم الأعلى</option>
              <option value="stars_asc" ${reviewState.sortBy === 'stars_asc' ? 'selected' : ''}>التقييم الأقل</option>
            </select>
          </div>

        </div>
      </div>

      <!-- REVIEWS TABLE -->
      <div class="crm-table-container">
        <table class="crm-table">
          <thead>
            <tr>
              <th class="crm-col-student">الطالب</th>
              <th class="crm-col-product">المنتج</th>
              <th class="crm-col-type">النوع</th>
              <th class="crm-col-rating">التقييم</th>
              <th class="crm-col-title">عنوان التقييم</th>
              <th class="crm-col-excerpt">مقتطف التقييم</th>
              <th class="crm-col-date">التاريخ</th>
              <th class="crm-col-status">حالة الرد</th>
              <th class="crm-col-actions" style="text-align: center;">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${paginated.length === 0 ? `
              <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">
                  لا توجد تقييمات تطابق خيارات الفلترة المحددة.
                </td>
              </tr>
            ` : paginated.map(r => `
              <tr style="${r.isPinned ? 'background: rgba(124, 58, 237, 0.05);' : ''}">
                <td class="crm-col-student">
                  <div class="crm-user-cell">
                    <img src="${r.avatar}" alt="${r.studentName}" class="crm-avatar" />
                    <div>
                      <strong style="display: block; color: #1e293b;" class="dark-text">${r.studentName}</strong>
                      ${r.isPinned ? '<span style="font-size:10px; color:#7c3aed; font-weight:800;">📌 مثبت في الأعلى</span>' : ''}
                    </div>
                  </div>
                </td>
                <td class="crm-col-product">
                  <strong>${r.courseOrBookName}</strong>
                </td>
                <td class="crm-col-type">
                  <span class="crm-badge ${r.type === 'Course' ? 'crm-badge-course' : 'crm-badge-book'}">
                    ${r.type === 'Course' ? '🎓 دورة' : '📚 كتاب'}
                  </span>
                </td>
                <td class="crm-col-rating">
                  <span style="color: #f59e0b; font-weight: 800;">${'★'.repeat(r.stars)}</span>
                </td>
                <td class="crm-col-title">
                  <strong>${r.reviewTitle}</strong>
                </td>
                <td class="crm-col-excerpt">
                  "${r.reviewText.length > 70 ? r.reviewText.substring(0, 70) + '...' : r.reviewText}"
                </td>
                <td class="crm-col-date">${r.createdDate}</td>
                <td class="crm-col-status">
                  <span class="crm-badge ${r.replyStatus === 'Replied' ? 'crm-badge-active' : 'crm-badge-inactive'}">
                    ${r.replyStatus === 'Replied' ? '✓ تم الرد' : '⏳ بانتظار الرد'}
                  </span>
                </td>
                <td class="crm-col-actions" style="text-align: center;">
                  <div class="crm-action-dropdown-wrapper">
                    <button type="button" class="crm-action-dots-btn" onclick="toggleReviewActionMenu(event, '${r.id}')" title="خيارات التقييم" aria-label="خيارات التقييم" aria-expanded="false">
                      ⋮
                    </button>
                    <div id="reviewActionMenu-${r.id}" class="crm-action-menu hidden" role="menu">
                      <button type="button" class="crm-menu-item" onclick="handleReviewMenuAction(event, '${r.id}', 'view')">
                        👁️ عرض التقييم
                      </button>
                      <button type="button" class="crm-menu-item" onclick="handleReviewMenuAction(event, '${r.id}', 'reply')">
                        💬 ${r.teacherReply ? 'تعديل الرد' : 'إضافة رد'}
                      </button>
                      <button type="button" class="crm-menu-item" onclick="handleReviewMenuAction(event, '${r.id}', 'pin')">
                        📌 ${r.isPinned ? 'إلغاء التثبيت' : 'تثبيت التقييم'}
                      </button>
                      <button type="button" class="crm-menu-item crm-menu-item-danger" onclick="handleReviewMenuAction(event, '${r.id}', 'delete')">
                        🗑️ حذف التقييم
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- PAGINATION BAR -->
        <div class="crm-pagination-bar">
          <span>عرض ${paginated.length} من إجمالي ${filtered.length} تقييم</span>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" ${reviewState.currentPage <= 1 ? 'disabled style="opacity:0.5;"' : ''} onclick="changeReviewPage(${reviewState.currentPage - 1})">
              السابق
            </button>
            <span style="align-self: center; font-weight: 700; padding: 0 8px;">صفحة ${reviewState.currentPage} من ${totalPages}</span>
            <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" ${reviewState.currentPage >= totalPages ? 'disabled style="opacity:0.5;"' : ''} onclick="changeReviewPage(${reviewState.currentPage + 1})">
              التالي
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

export function renderStudentReviewsListOnly() {
  const container = document.getElementById("studentReviewsContent");
  if (!container) return;

  const tbody = container.querySelector(".crm-table tbody");
  const paginationBar = container.querySelector(".crm-pagination-bar");

  if (!tbody) {
    renderStudentReviewsUI();
    return;
  }

  const filtered = getFilteredReviews();
  const totalPages = Math.ceil(filtered.length / reviewState.pageSize) || 1;
  if (reviewState.currentPage > totalPages) reviewState.currentPage = 1;

  const startIndex = (reviewState.currentPage - 1) * reviewState.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + reviewState.pageSize);

  if (paginated.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 28px; margin-bottom: 6px;">🔍</div>
          <strong style="font-size: 15px; color: #1e293b; display: block; margin-bottom: 4px;">لم يتم العثور على تقييمات</strong>
          لا توجد تقييمات تطابق خيارات البحث والفلترة المحددة.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = paginated.map(r => `
      <tr style="${r.isPinned ? 'background: rgba(124, 58, 237, 0.05);' : ''}">
        <td class="crm-col-student">
          <div class="crm-user-cell">
            <img src="${r.avatar}" alt="${r.studentName}" class="crm-avatar" />
            <div>
              <strong style="display: block; color: #1e293b;" class="dark-text">${r.studentName}</strong>
              ${r.isPinned ? '<span style="font-size:10px; color:#7c3aed; font-weight:800;">📌 مثبت في الأعلى</span>' : ''}
            </div>
          </div>
        </td>
        <td class="crm-col-product">
          <strong>${r.courseOrBookName}</strong>
        </td>
        <td class="crm-col-type">
          <span class="crm-badge ${r.type === 'Course' ? 'crm-badge-course' : 'crm-badge-book'}">
            ${r.type === 'Course' ? '🎓 دورة' : '📚 كتاب'}
          </span>
        </td>
        <td class="crm-col-rating">
          <span style="color: #f59e0b; font-weight: 800;">${'★'.repeat(r.stars)}</span>
        </td>
        <td class="crm-col-title">
          <strong>${r.reviewTitle}</strong>
        </td>
        <td class="crm-col-excerpt">
          "${r.reviewText.length > 70 ? r.reviewText.substring(0, 70) + '...' : r.reviewText}"
        </td>
        <td class="crm-col-date">${r.createdDate}</td>
        <td class="crm-col-status">
          <span class="crm-badge ${r.replyStatus === 'Replied' ? 'crm-badge-active' : 'crm-badge-inactive'}">
            ${r.replyStatus === 'Replied' ? '✓ تم الرد' : '⏳ بانتظار الرد'}
          </span>
        </td>
        <td class="crm-col-actions" style="text-align: center;">
          <div class="crm-action-dropdown-wrapper">
            <button type="button" class="crm-action-dots-btn" onclick="toggleReviewActionMenu(event, '${r.id}')" title="خيارات التقييم" aria-label="خيارات التقييم" aria-expanded="false">
              ⋮
            </button>
            <div id="reviewActionMenu-${r.id}" class="crm-action-menu hidden" role="menu">
              <button type="button" class="crm-menu-item" onclick="handleReviewMenuAction(event, '${r.id}', 'view')">
                👁️ عرض التقييم
              </button>
              <button type="button" class="crm-menu-item" onclick="handleReviewMenuAction(event, '${r.id}', 'reply')">
                💬 ${r.teacherReply ? 'تعديل الرد' : 'إضافة رد'}
              </button>
              <button type="button" class="crm-menu-item" onclick="handleReviewMenuAction(event, '${r.id}', 'pin')">
                📌 ${r.isPinned ? 'إلغاء التثبيت' : 'تثبيت التقييم'}
              </button>
              <button type="button" class="crm-menu-item crm-menu-item-danger" onclick="handleReviewMenuAction(event, '${r.id}', 'delete')">
                🗑️ حذف التقييم
              </button>
            </div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (paginationBar) {
    paginationBar.innerHTML = `
      <span>عرض ${paginated.length} من إجمالي ${filtered.length} تقييم</span>
      <div style="display: flex; gap: 8px;">
        <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" ${reviewState.currentPage <= 1 ? 'disabled style="opacity:0.5;"' : ''} onclick="changeReviewPage(${reviewState.currentPage - 1})">
          السابق
        </button>
        <span style="align-self: center; font-weight: 700; padding: 0 8px;">صفحة ${reviewState.currentPage} من ${totalPages}</span>
        <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" ${reviewState.currentPage >= totalPages ? 'disabled style="opacity:0.5;"' : ''} onclick="changeReviewPage(${reviewState.currentPage + 1})">
          التالي
        </button>
      </div>
    `;
  }
}

// Handlers for Student Reviews
let teacherSearchDebounceTimer = null;

export function handleReviewSearch(val) {
  reviewState.searchQuery = val || "";
  reviewState.currentPage = 1;

  if (teacherSearchDebounceTimer) {
    clearTimeout(teacherSearchDebounceTimer);
  }

  teacherSearchDebounceTimer = setTimeout(() => {
    renderStudentReviewsListOnly();
  }, 250);
}

window.handleReviewSearchKeydown = function(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    if (teacherSearchDebounceTimer) clearTimeout(teacherSearchDebounceTimer);
    reviewState.searchQuery = "";
    reviewState.currentPage = 1;
    const input = document.getElementById("teacherReviewSearchInput");
    if (input) input.value = "";
    renderStudentReviewsListOnly();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (teacherSearchDebounceTimer) clearTimeout(teacherSearchDebounceTimer);
    renderStudentReviewsListOnly();
  }
};

export function handleReviewCourseFilter(val) {
  reviewState.courseFilter = val;
  reviewState.currentPage = 1;
  renderStudentReviewsListOnly();
}

export function handleReviewBookFilter(val) {
  reviewState.bookFilter = val;
  reviewState.currentPage = 1;
  renderStudentReviewsListOnly();
}

export function handleReviewStarsFilter(val) {
  reviewState.starsFilter = val;
  reviewState.currentPage = 1;
  renderStudentReviewsListOnly();
}

export function handleReviewReplyFilter(val) {
  reviewState.replyFilter = val;
  reviewState.currentPage = 1;
  renderStudentReviewsListOnly();
}

export function handleReviewSort(val) {
  reviewState.sortBy = val;
  renderStudentReviewsListOnly();
}

export function changeReviewPage(page) {
  reviewState.currentPage = page;
  renderStudentReviewsListOnly();
}

export async function promptReplyToReview(reviewId) {
  const review = getReviewById(reviewId);
  if (!review) return;

  const initial = review.teacherReply || "";
  const inputFn = window.showInputDialog || showInputDialog;
  let text = null;

  if (typeof inputFn === "function") {
    text = await inputFn({
      title: review.teacherReply ? "تعديل رد المعلم" : "إضافة رد معلم على التقييم",
      message: `التقييم من الطالب: ${review.studentName} (${'★'.repeat(review.stars || 5)})`,
      defaultValue: initial,
      placeholder: "اكتب الرد هنا...",
      confirmText: "حفظ الرد",
      cancelText: "إلغاء",
      isMultiline: true,
      icon: "💬"
    });
  } else {
    text = prompt("أدخل رد المعلم على هذا التقييم:", initial);
  }

  if (text !== null) {
    const trimmed = text.trim();
    if (trimmed === "") {
      deleteTeacherReplyFromReview(reviewId);
      if (typeof showSuccessToast === "function") {
        showSuccessToast({ title: "تم الحذف", message: "تم حذف رد المعلم بنجاح." });
      } else {
        showCustomAlert("تم حذف رد المعلم بنجاح");
      }
    } else {
      addTeacherReplyToReview(reviewId, trimmed);
      if (typeof showSuccessToast === "function") {
        showSuccessToast({ title: "تم الرد بنجاح", message: "تم إضافة/تحديث رد المعلم بنجاح." });
      } else {
        showCustomAlert("✅ تم إضافة/تحديث رد المعلم بنجاح");
      }
    }
    
    const scrollY = window.scrollY;
    if (document.getElementById("reviewDetailPage") && !document.getElementById("reviewDetailPage").classList.contains("hidden")) {
      openReviewDetailPage(reviewId);
    } else if (document.getElementById("studentReviewsContent")) {
      renderStudentReviewsListOnly();
    } else {
      renderStudentReviewsUI();
    }
    window.scrollTo(0, scrollY);
  }
}

export function handleTogglePinReview(reviewId) {
  const isPinned = togglePinReview(reviewId);
  showCustomAlert(isPinned ? "📌 تم تثبيت التقييم في أعلى القائمة" : "تم إلغاء تثبيت التقييم");
  const scrollY = window.scrollY;
  if (document.getElementById("studentReviewsContent")) {
    renderStudentReviewsListOnly();
  } else {
    renderStudentReviewsUI();
  }
  window.scrollTo(0, scrollY);
}

export function handleDeleteReview(reviewId) {
  if (confirm("هل أنت تأكد من رغبتك في حذف هذا التقييم؟")) {
    deleteReviewFromList(reviewId);
    showCustomAlert("تم حذف التقييم بنجاح.");
    const scrollY = window.scrollY;
    if (document.getElementById("studentReviewsContent")) {
      renderStudentReviewsListOnly();
    } else {
      renderStudentReviewsUI();
    }
    window.scrollTo(0, scrollY);
  }
}

/**
 * Action Menu Handlers for 3-Dots Compact Review Menu
 */
if (typeof window !== "undefined" && !window._reviewActionMenuListenersAttached) {
  window._reviewActionMenuListenersAttached = true;
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".crm-action-dropdown-wrapper")) {
      closeAllReviewActionMenus();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllReviewActionMenus();
    }
  });
}

export function toggleReviewActionMenu(e, reviewId) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const targetMenu = document.getElementById(`reviewActionMenu-${reviewId}`);
  if (!targetMenu) return;

  const isAlreadyOpen = !targetMenu.classList.contains("hidden");

  closeAllReviewActionMenus();

  if (!isAlreadyOpen) {
    targetMenu.classList.remove("hidden");
    const wrapper = targetMenu.closest(".crm-action-dropdown-wrapper");
    const btn = wrapper ? wrapper.querySelector(".crm-action-dots-btn") : null;
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
}

export function closeAllReviewActionMenus() {
  const openMenus = document.querySelectorAll(".crm-action-menu:not(.hidden)");
  openMenus.forEach(menu => {
    menu.classList.add("hidden");
    const wrapper = menu.closest(".crm-action-dropdown-wrapper");
    const btn = wrapper ? wrapper.querySelector(".crm-action-dots-btn") : null;
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
}

export async function handleReviewMenuAction(e, reviewId, action) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  closeAllReviewActionMenus();

  if (action === "view") {
    openReviewDetailPage(reviewId);
  } else if (action === "reply") {
    await promptReplyToReview(reviewId);
  } else if (action === "pin") {
    handleTogglePinReview(reviewId);
  } else if (action === "delete") {
    handleDeleteReview(reviewId);
  }
}

if (typeof window !== "undefined") {
  window.toggleReviewActionMenu = toggleReviewActionMenu;
  window.closeAllReviewActionMenus = closeAllReviewActionMenus;
  window.handleReviewMenuAction = handleReviewMenuAction;
  window.printReviewDocument = printReviewDocument;
}

export function printReviewDocument(reviewId) {
  const review = getReviewById(reviewId);
  if (!review) {
    showCustomAlert("عذراً، لم يتم العثور على التقييم المراد طباعته.");
    return;
  }

  const student = getStudentById(review.studentId) || {};
  const starsCount = review.stars || 5;
  const starsHtml = '★'.repeat(starsCount) + '☆'.repeat(Math.max(0, 5 - starsCount));

  const reportHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تقرير تقييم طالب - ${review.studentName || ''}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Tajawal', sans-serif;
            margin: 0;
            padding: 30px;
            color: #0f172a;
            background: #ffffff;
            direction: rtl;
            line-height: 1.6;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 22px;
            font-weight: 900;
            color: #7c3aed;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #64748b;
          }
          .doc-title {
            text-align: left;
          }
          .doc-title h2 {
            margin: 0;
            font-size: 18px;
            color: #0f172a;
          }
          .doc-title p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #64748b;
          }
          .section-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 18px;
            margin-bottom: 20px;
            background: #f8fafc;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #475569;
            margin-bottom: 12px;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 6px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 13px;
          }
          .info-item {
            margin-bottom: 6px;
          }
          .info-label {
            font-weight: 700;
            color: #64748b;
          }
          .info-value {
            font-weight: 600;
            color: #0f172a;
          }
          .stars {
            color: #f59e0b;
            font-size: 16px;
            font-weight: bold;
          }
          .review-title {
            font-size: 16px;
            font-weight: 800;
            color: #7c3aed;
            margin: 12px 0 6px 0;
          }
          .review-body {
            font-size: 14px;
            color: #334155;
            white-space: pre-wrap;
            background: #ffffff;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">StudyMart</div>
            <div class="brand-subtitle">منصة التعلم الإلكتروني</div>
          </div>
          <div class="doc-title">
            <h2>تقرير تقييم الطالب</h2>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>

        <!-- STUDENT INFO -->
        <div class="section-card">
          <div class="section-title">👤 معلومات الطالب</div>
          <div class="grid-2">
            <div class="info-item"><span class="info-label">اسم الطالب: </span><span class="info-value">${review.studentName || 'غير محدد'}</span></div>
            <div class="info-item"><span class="info-label">معرف الطالب: </span><span class="info-value">${review.studentId || student.id || 'N/A'}</span></div>
            ${student.email ? `<div class="info-item"><span class="info-label">البريد الإلكتروني: </span><span class="info-value">${student.email}</span></div>` : ''}
            ${student.country ? `<div class="info-item"><span class="info-label">الدولة: </span><span class="info-value">${student.country}</span></div>` : ''}
          </div>
        </div>

        <!-- REVIEW DETAILS -->
        <div class="section-card" style="background: #ffffff;">
          <div class="section-title">⭐ تفاصيل التقييم</div>
          <div class="grid-2">
            <div class="info-item"><span class="info-label">المادة / المنتج: </span><span class="info-value">${review.type === 'Course' ? '🎓 دورة: ' : '📚 كتاب: '}${review.courseOrBookName || ''}</span></div>
            <div class="info-item"><span class="info-label">التقييم: </span><span class="stars">${starsHtml} (${review.stars || 5} / 5)</span></div>
            <div class="info-item"><span class="info-label">تاريخ التقييم: </span><span class="info-value">${review.createdDate || '-'}</span></div>
            <div class="info-item"><span class="info-label">تاريخ الشراء: </span><span class="info-value">${review.purchaseDate || '-'}</span></div>
          </div>

          ${review.reviewTitle ? `<div class="review-title">"${review.reviewTitle}"</div>` : ''}
          <div class="review-body">${review.reviewText || ''}</div>
        </div>

        <!-- TEACHER REPLY -->
        ${review.teacherReply ? `
          <div class="section-card" style="background: #faf5ff;">
            <div class="section-title">💬 رد المعلم الرسمي</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">تاريخ الرد: ${review.replyDate || '-'}</div>
            <div class="review-body" style="background: #ffffff;">"${review.teacherReply}"</div>
          </div>
        ` : `
          <div class="section-card" style="background: #f8fafc;">
            <div class="section-title">💬 رد المعلم</div>
            <div style="font-size: 13px; color: #64748b;">لا يوجد رد معلم على هذا التقييم حتى الآن.</div>
          </div>
        `}

        <div class="footer">
          تقرير تقييم رسمي صادر من منصة StudyMart التعليمية — جميع الحقوق محفوظة
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      showCustomAlert("يرجى السماح بالنوافذ المنبثقة لطباعة تقرير التقييم.");
      return;
    }
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  } catch (err) {
    console.error("Print review error:", err);
    showCustomAlert("حدث خطأ أثناء إعداد طباعة تقرير التقييم.");
  }
}

export function exportReviewsCSV() {
  const list = getFilteredReviews();
  let csv = "ID,StudentName,Item,Type,Stars,ReviewTitle,CreatedDate,ReplyStatus\n";
  list.forEach(r => {
    csv += `"${r.id}","${r.studentName}","${r.courseOrBookName}","${r.type}","${r.stars}","${r.reviewTitle}","${r.createdDate}","${r.replyStatus}"\n`;
  });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Student_Reviews_Report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showCustomAlert("✅ تم تصدير تقرير التقييمات CSV بنجاح");
}

export function exportReviewsExcel() {
  exportReviewsCSV();
}

/**
 * Open Review Detail Page (FULL PAGE - NO MODAL)
 * Route: /teacher/reviews/{id}
 */
export function openReviewDetailPage(reviewId) {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين والمالك فقط.");
    return;
  }

  const review = getReviewById(reviewId);
  if (!review) {
    showCustomAlert("لم يتم العثور على هذا التقييم.");
    openStudentReviewsPage();
    return;
  }

  hideAllMainSections();
  const page = document.getElementById("reviewDetailPage");
  if (page) page.classList.remove("hidden");

  window.location.hash = `#teacher/reviews/${review.id}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderReviewDetailUI(review);
}

/**
 * Render Review Detail UI
 */
export function renderReviewDetailUI(review) {
  const container = document.getElementById("reviewDetailContent");
  if (!container) return;

  container.innerHTML = `
    <div class="crm-module-container">
      
      <!-- BACK BUTTON & HEADER -->
      <div class="crm-header-row">
        <div>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else openStudentReviewsPage();" style="margin-bottom: 10px;">
            ← العودة إلى قائمة التقييمات
          </button>
          <h1 style="font-size: 24px; margin: 0;">تفاصيل تقييم الطالب: ${review.studentName}</h1>
        </div>

        <div class="crm-actions-bar">
          <button type="button" class="crm-btn crm-btn-primary" onclick="promptReplyToReview('${review.id}')">
            💬 ${review.teacherReply ? 'تعديل رد المعلم' : 'إضافة رد معلم'}
          </button>
          <button type="button" class="crm-btn crm-btn-secondary" onclick="printReviewDocument('${review.id}')">
            🖨️ طباعة التقييم
          </button>
        </div>
      </div>

      <!-- REVIEW MAIN CARD -->
      <div class="crm-details-card">
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
          <div class="crm-user-cell">
            <img src="${review.avatar}" alt="${review.studentName}" class="crm-hero-avatar" style="width: 56px; height: 56px;" />
            <div>
              <h2 style="margin: 0; font-size: 18px;">${review.studentName}</h2>
              <div style="font-size: 12px; color: #64748b;">تاريخ التقييم: ${review.createdDate} | تاريخ الشراء: ${review.purchaseDate}</div>
            </div>
          </div>

          <div style="text-align: left;">
            <div style="color: #f59e0b; font-size: 22px; font-weight: 800;">${'★'.repeat(review.stars)} (${review.stars} / 5)</div>
            <span class="crm-badge ${review.type === 'Course' ? 'crm-badge-course' : 'crm-badge-book'}">
              ${review.type === 'Course' ? '🎓 دورة: ' : '📚 كتاب: '} ${review.courseOrBookName}
            </span>
          </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #7c3aed;">"${review.reviewTitle}"</h3>
          <p style="font-size: 15px; line-height: 1.7; color: #334155;" class="dark-text">
            ${review.reviewText}
          </p>
        </div>

        <!-- ATTACHED MEDIA -->
        ${(review.attachedImages && review.attachedImages.length > 0) ? `
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">🖼️ الصور المرفقة من الطالب:</h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              ${review.attachedImages.map(imgUrl => `
                <img src="${imgUrl}" alt="مرفق" style="width: 140px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; cursor: pointer;" onclick="window.open('${imgUrl}', '_blank')" />
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TEACHER REPLY SECTION -->
        <div style="background: rgba(124, 58, 237, 0.06); border-radius: 12px; padding: 18px; margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 15px; color: #7c3aed;">💬 رد المعلم الرسمى:</strong>
            ${review.teacherReply ? `<span style="font-size: 11px; color: #64748b;">تاريخ الرد: ${review.replyDate}</span>` : ''}
          </div>

          ${review.teacherReply ? `
            <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6;">"${review.teacherReply}"</p>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="crm-btn crm-btn-secondary crm-btn-sm" onclick="promptReplyToReview('${review.id}')">✏️ تعديل الرد</button>
              <button type="button" class="crm-btn crm-btn-danger crm-btn-sm" onclick="if(confirm('حذف رد المعلم؟')){ deleteTeacherReplyFromReview('${review.id}'); openReviewDetailPage('${review.id}'); }">🗑️ حذف الرد</button>
            </div>
          ` : `
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">لم تقم بالرد على هذا التقييم حتى الآن.</p>
            <button type="button" class="crm-btn crm-btn-primary crm-btn-sm" onclick="promptReplyToReview('${review.id}')">➕ إدخال رد جديد الآن</button>
          `}
        </div>

        <!-- REPLY HISTORY -->
        ${(review.replyHistory && review.replyHistory.length > 0) ? `
          <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">📜 سجل التعديلات على الرد:</h4>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${review.replyHistory.map(h => `
                <div style="font-size: 12px; color: #475569; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
                  • "${h.text}" <span style="font-size: 10px; color: #94a3b8;">(${h.date})</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>

    </div>
  `;
}
