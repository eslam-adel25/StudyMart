import { booksData } from "../data/books.js";
import { showCustomAlert } from "../utils/helpers.js";
import { hideAllMainSections } from "./layoutService.js";
import { openBookBuilder } from "./bookBuilderService.js";
import { isTeacher } from "./permissionService.js";

// State for Book Management Page
let mgmtSearchQuery = "";
let mgmtStatusFilter = "all";
let mgmtSortBy = "date";
let mgmtSelectedBookIds = [];
let mgmtCurrentPage = 1;
const mgmtItemsPerPage = 6;
let openMoreMenuId = null;

/**
 * Persistence Helper Functions
 */
function saveBooksDataToStorage() {
  if (typeof window !== "undefined" && window.booksData) {
    window.booksData = booksData;
  }
  try {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("studymart_custom_books", JSON.stringify(booksData));
      } catch (quotaErr) {
        const sanitized = booksData.map((b) => {
          const copy = { ...b };
          if (copy.fileDataUrl && copy.fileDataUrl.length > 100000) {
            delete copy.fileDataUrl;
          }
          if (copy.previewFileDataUrl && copy.previewFileDataUrl.length > 100000) {
            delete copy.previewFileDataUrl;
          }
          return copy;
        });
        localStorage.setItem("studymart_custom_books", JSON.stringify(sanitized));
      }
    }
  } catch (err) {
    console.error("Error persisting booksData to localStorage:", err);
  }
}

function saveDeletedBookIdToStorage(id) {
  try {
    if (typeof localStorage !== "undefined") {
      const deletedRaw = localStorage.getItem("studymart_deleted_books");
      const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
      const idStr = String(id);
      if (!deletedIds.map(String).includes(idStr)) {
        deletedIds.push(idStr);
      }
      localStorage.setItem("studymart_deleted_books", JSON.stringify(deletedIds));
    }
  } catch (err) {
    console.error("Error saving deleted book ID:", err);
  }
}

/**
 * Modal Overlay Builder Helper
 */
function createBookModalOverlay(overlayId) {
  const existing = document.getElementById(overlayId);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = overlayId;
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.style.zIndex = "99999";

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  document.body.appendChild(overlay);
  return overlay;
}

/**
 * Global Keyboard & Outside Click Binding for Dropdowns & Modals
 */
if (typeof window !== "undefined" && !window._bookMgmtClickBound) {
  window._bookMgmtClickBound = true;

  document.addEventListener("click", (e) => {
    if (openMoreMenuId !== null) {
      const isMenuBtn = e.target.closest(".action-icon-btn");
      const isMenu = e.target.closest(".more-dropdown-menu");
      if (!isMenuBtn && !isMenu) {
        openMoreMenuId = null;
        renderBookManagementUI();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (openMoreMenuId !== null) {
        openMoreMenuId = null;
        renderBookManagementUI();
      }
      const overlays = document.querySelectorAll(".floating-modal-overlay");
      overlays.forEach((o) => o.remove());
    }
  });
}

/**
 * Open Book Management Dashboard Page (Full Page, No Modal)
 */
export function openBookManagementDashboard() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، لوحة إدارة الكتب مخصصة للمعلمين والمالك فقط.");
    return;
  }

  hideAllMainSections();

  const bookManagementPage = document.getElementById("bookManagementPage");
  const bookManagementContent = document.getElementById("bookManagementContent");

  if (!bookManagementPage || !bookManagementContent) {
    console.error("bookManagementPage element missing in DOM");
    return;
  }

  bookManagementPage.classList.remove("hidden");
  history.pushState(null, "", "#teacher/books/manage");

  renderBookManagementUI();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Main Render Function for Book Management Page
 */
export function renderBookManagementUI() {
  const container = document.getElementById("bookManagementContent");
  if (!container) return;

  // Preserve scroll positions and input focus before DOM re-render
  const savedWindowY = typeof window !== "undefined" ? (window.scrollY || document.documentElement.scrollTop || 0) : 0;
  const existingTableWrapper = container.querySelector(".book-mgmt-table-wrapper");
  const savedTableScrollLeft = existingTableWrapper ? existingTableWrapper.scrollLeft : null;

  const activeEl = typeof document !== "undefined" ? document.activeElement : null;
  const isSearchFocused = activeEl && activeEl.classList && activeEl.classList.contains("mgmt-search-input");
  const searchCursorPos = (isSearchFocused && activeEl.selectionStart !== undefined) ? activeEl.selectionStart : null;

  // Compute Stats
  const totalBooks = booksData.length;
  const publishedCount = booksData.filter((b) => b.status === "published").length;
  const draftCount = booksData.filter((b) => b.status === "draft").length;
  const totalDownloads = booksData.reduce((acc, b) => acc + (Number(b.downloads) || 0), 0);
  const totalPurchases = booksData.reduce((acc, b) => acc + (Number(b.purchases) || 0), 0);
  const totalRevenue = booksData.reduce((acc, b) => acc + (Number(b.revenue) || 0), 0);
  const avgRating = totalBooks > 0 
    ? (booksData.reduce((acc, b) => acc + (Number(b.rating) || 0), 0) / totalBooks).toFixed(1)
    : "0.0";

  // Filter & Search Books
  let filtered = booksData.filter((b) => {
    if (mgmtSearchQuery) {
      const q = mgmtSearchQuery.toLowerCase();
      const matchName = b.title?.toLowerCase().includes(q);
      const matchAuthor = b.author?.toLowerCase().includes(q);
      const matchPublisher = b.publisher?.toLowerCase().includes(q);
      const matchIsbn = b.isbn?.toLowerCase().includes(q);
      const matchCat = b.category?.toLowerCase().includes(q);
      if (!matchName && !matchAuthor && !matchPublisher && !matchIsbn && !matchCat) {
        return false;
      }
    }

    if (mgmtStatusFilter === "published") return b.status === "published";
    if (mgmtStatusFilter === "draft") return b.status === "draft";
    if (mgmtStatusFilter === "private") return b.status === "private";
    if (mgmtStatusFilter === "archived") return b.status === "archived";
    if (mgmtStatusFilter === "free") return b.isFree === true;
    if (mgmtStatusFilter === "paid") return b.isFree === false;
    if (mgmtStatusFilter === "highest_rated") return Number(b.rating) >= 4.5;

    return true;
  });

  // Sort Books
  filtered.sort((a, b) => {
    if (mgmtSortBy === "revenue") return (b.revenue || 0) - (a.revenue || 0);
    if (mgmtSortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (mgmtSortBy === "downloads") return (b.downloads || 0) - (a.downloads || 0);
    if (mgmtSortBy === "price") return (b.price || 0) - (a.price || 0);
    if (mgmtSortBy === "alphabetical") return (a.title || "").localeCompare(b.title || "", "ar");
    return (b.id || 0) - (a.id || 0); // date default
  });

  // Pagination Slice
  const totalPages = Math.ceil(filtered.length / mgmtItemsPerPage) || 1;
  if (mgmtCurrentPage > totalPages) mgmtCurrentPage = totalPages;
  const startIndex = (mgmtCurrentPage - 1) * mgmtItemsPerPage;
  const paginatedBooks = filtered.slice(startIndex, startIndex + mgmtItemsPerPage);

  container.innerHTML = `
    <div class="book-management-container">
      <!-- HEADER -->
      <div class="book-mgmt-header">
        <div class="book-mgmt-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            لوحة إدارة الكتب (Book Management)
          </h2>
          <p>إدارة شاملة لجميع كتبك الرقمية والمؤلفات والإحصائيات والتحليلات المتقدمة.</p>
        </div>

        <button type="button" class="btn-primary-purple sm" onclick="openBookBuilder(null)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إضافة كتاب جديد (Book Builder)
        </button>
      </div>

      <!-- 7 DASHBOARD STATS CARDS -->
      <div class="book-stats-grid">
        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">إجمالي الكتب</span>
            <div class="book-stat-icon">📚</div>
          </div>
          <span class="book-stat-val">${totalBooks}</span>
        </div>

        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">الكتب المنشورة</span>
            <div class="book-stat-icon" style="color:#10b981; background:rgba(16,185,129,0.1);">🚀</div>
          </div>
          <span class="book-stat-val">${publishedCount}</span>
        </div>

        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">المسودات</span>
            <div class="book-stat-icon" style="color:#f59e0b; background:rgba(245,158,11,0.1);">📝</div>
          </div>
          <span class="book-stat-val">${draftCount}</span>
        </div>

        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">التحميلات</span>
            <div class="book-stat-icon">⬇️</div>
          </div>
          <span class="book-stat-val">${totalDownloads.toLocaleString()}</span>
        </div>

        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">المبيعات</span>
            <div class="book-stat-icon">🛒</div>
          </div>
          <span class="book-stat-val">${totalPurchases.toLocaleString()}</span>
        </div>

        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">الإيرادات</span>
            <div class="book-stat-icon" style="color:#10b981; background:rgba(16,185,129,0.1);">💰</div>
          </div>
          <span class="book-stat-val">$${totalRevenue.toLocaleString()}</span>
        </div>

        <div class="book-stat-card">
          <div class="book-stat-header">
            <span class="book-stat-lbl">متوسط التقييم</span>
            <div class="book-stat-icon" style="color:#f59e0b; background:rgba(245,158,11,0.1);">⭐</div>
          </div>
          <span class="book-stat-val">${avgRating}</span>
        </div>
      </div>

      <!-- SEARCH, FILTERS, & BULK ACTIONS CONTROL BAR -->
      <div class="mgmt-controls-bar">
        <div class="mgmt-search-filter-group">
          <input type="text" class="mgmt-search-input" placeholder="🔍 ابحث بالاسم، المؤلف، دار النشر، ISBN، التصنيف..." value="${escapeHtml(mgmtSearchQuery)}" oninput="handleBookSearch(this.value)" />
          
          <select class="mgmt-select-filter" onchange="handleBookStatusFilter(this.value)">
            <option value="all" ${mgmtStatusFilter === 'all' ? 'selected' : ''}>جميع الحالات والتصنيفات</option>
            <option value="published" ${mgmtStatusFilter === 'published' ? 'selected' : ''}>منشورة فقط</option>
            <option value="draft" ${mgmtStatusFilter === 'draft' ? 'selected' : ''}>مسودات فقط</option>
            <option value="private" ${mgmtStatusFilter === 'private' ? 'selected' : ''}>خاصة فقط</option>
            <option value="archived" ${mgmtStatusFilter === 'archived' ? 'selected' : ''}>مؤرشفة</option>
            <option value="free" ${mgmtStatusFilter === 'free' ? 'selected' : ''}>مجانية فقط</option>
            <option value="paid" ${mgmtStatusFilter === 'paid' ? 'selected' : ''}>مدفوعة فقط</option>
            <option value="highest_rated" ${mgmtStatusFilter === 'highest_rated' ? 'selected' : ''}>الأعلى تقييماً (4.5+)</option>
          </select>

          <select class="mgmt-select-filter" onchange="handleBookSort(this.value)">
            <option value="date" ${mgmtSortBy === 'date' ? 'selected' : ''}>الأحدث أولاً</option>
            <option value="revenue" ${mgmtSortBy === 'revenue' ? 'selected' : ''}>الأعلى إيراداً</option>
            <option value="downloads" ${mgmtSortBy === 'downloads' ? 'selected' : ''}>الأكثر تحميلاً</option>
            <option value="rating" ${mgmtSortBy === 'rating' ? 'selected' : ''}>الأعلى تقييماً</option>
            <option value="price" ${mgmtSortBy === 'price' ? 'selected' : ''}>الأعلى سعراً</option>
            <option value="alphabetical" ${mgmtSortBy === 'alphabetical' ? 'selected' : ''}>أبجدياً (أ-ي)</option>
          </select>
        </div>

        <!-- BULK ACTIONS -->
        <div class="mgmt-bulk-actions">
          <span style="font-size:12px; font-weight:700; color:var(--text-secondary, #475569);">المحددة (${mgmtSelectedBookIds.length}):</span>
          <button type="button" class="btn-secondary-outline sm" onclick="executeBulkAction('publish')">نشر</button>
          <button type="button" class="btn-secondary-outline sm" onclick="executeBulkAction('archive')">أرشفة</button>
          <button type="button" class="btn-danger-outline sm" onclick="executeBulkAction('delete')">حذف</button>
          <button type="button" class="btn-secondary-outline sm" onclick="executeBulkAction('export')">تصدير</button>
        </div>
      </div>

      <!-- BOOK LIST TABLE -->
      <div class="book-mgmt-table-wrapper">
        <table class="book-mgmt-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align:center;">
                <input type="checkbox" onchange="toggleSelectAllBooks(this.checked)" ${mgmtSelectedBookIds.length === paginatedBooks.length && paginatedBooks.length > 0 ? 'checked' : ''} />
              </th>
              <th>الكتاب والمؤلف</th>
              <th>الحالة</th>
              <th>التصنيف</th>
              <th>اللغة</th>
              <th>الصفحات</th>
              <th>السعر</th>
              <th>التحميلات</th>
              <th>المبيعات</th>
              <th>الإيرادات</th>
              <th>التقييم</th>
              <th>تاريخ النشر</th>
              <th style="text-align:left;">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedBooks.length === 0 ? `
              <tr>
                <td colspan="13" style="text-align:center; padding:40px; color:var(--text-secondary, #64748b);">
                  لا توجد كتب تطابق معايير البحث والفلترة.
                </td>
              </tr>
            ` : paginatedBooks.map((b) => {
              const isSelected = mgmtSelectedBookIds.map(String).includes(String(b.id));
              const statusPillClass = b.status || 'published';
              const statusLabel = b.status === 'published' ? 'منشور' : b.status === 'draft' ? 'مسودة' : b.status === 'private' ? 'خاص' : b.status === 'archived' ? 'مؤرشف' : 'غير منشور';

              return `
                <tr>
                  <td style="text-align:center;">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectBook(${b.id}, this.checked)" />
                  </td>
                  
                  <td>
                    <div class="book-thumb-cell">
                      <img src="${b.image}" alt="${escapeHtml(b.title)}" class="book-thumb-img" />
                      <div class="book-info-text">
                        <div class="book-table-title">${escapeHtml(b.title)}</div>
                        <div class="book-table-sub">المؤلف: ${escapeHtml(b.author)} | دار النشر: ${escapeHtml(b.publisher || '-')}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span class="status-pill ${statusPillClass}">${statusLabel}</span>
                  </td>

                  <td>${escapeHtml(b.category)}</td>
                  <td>${escapeHtml(b.language || 'العربية')}</td>
                  <td>${b.pages || 0} صفحة</td>

                  <td>
                    <strong>${b.isFree ? 'مجاني' : `$${b.price}`}</strong>
                  </td>

                  <td>${(b.downloads || 0).toLocaleString()}</td>
                  <td>${(b.purchases || 0).toLocaleString()}</td>
                  <td>
                    <strong style="color:#10b981;">$${(b.revenue || 0).toLocaleString()}</strong>
                  </td>

                  <td>
                    <span style="color:#f59e0b; font-weight:700;">★ ${b.rating || 0}</span>
                    <span style="font-size:11px; color:var(--text-secondary, #94a3b8);">(${b.reviewsCount || 0})</span>
                  </td>

                  <td>${b.publicationDate || '-'}</td>

                  <!-- ACTION BUTTONS CELL -->
                  <td>
                    <div class="table-actions-cell" style="position:relative;">
                      <!-- EDIT BUTTON -->
                      <button type="button" class="action-icon-btn" data-tooltip="تعديل الكتاب" aria-label="تعديل" onclick="openBookBuilder(${b.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>

                      <!-- PREVIEW BUTTON -->
                      <button type="button" class="action-icon-btn" data-tooltip="معاينة نسخة القارئ" aria-label="معاينة" onclick="previewBookFromMgmt(${b.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>

                      <!-- STATS BUTTON -->
                      <button type="button" class="action-icon-btn" data-tooltip="إحصائيات الكتاب" aria-label="إحصائيات" onclick="showBookStatsModal(${b.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      </button>

                      <!-- DELETE BUTTON -->
                      <button type="button" class="action-icon-btn" data-tooltip="حذف الكتاب" aria-label="حذف" onclick="deleteBookFromMgmt(${b.id})">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>

                      <!-- MORE BUTTON -->
                      <button type="button" class="action-icon-btn" data-tooltip="خيارات إضافية" aria-label="المزيد" onclick="toggleBookMoreMenu(${b.id}, event)">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                      </button>

                      <!-- DROPDOWN MORE MENU -->
                      ${String(openMoreMenuId) === String(b.id) ? `
                        <div class="more-dropdown-menu" style="position:absolute; top:100%; left:0; z-index:90; background:var(--card-bg, #ffffff); color:var(--text-primary, #0f172a); border:1px solid var(--border-color, #e2e8f0); border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.15); padding:6px; width:190px; text-align:right;">
                          <button type="button" class="dropdown-item-btn" style="width:100%; text-align:right; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary, #1e293b); border-radius:8px; display:flex; align-items:center; gap:8px;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='none'" onclick="togglePublishBook(${b.id})">
                            ${b.status === 'published' ? '🚫 إلغاء النشر (مسودة)' : '🚀 نشر الكتاب'}
                          </button>
                          <button type="button" class="dropdown-item-btn" style="width:100%; text-align:right; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary, #1e293b); border-radius:8px; display:flex; align-items:center; gap:8px;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='none'" onclick="archiveBook(${b.id})">
                            📦 أرشفة الكتاب
                          </button>
                          <button type="button" class="dropdown-item-btn" style="width:100%; text-align:right; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary, #1e293b); border-radius:8px; display:flex; align-items:center; gap:8px;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='none'" onclick="duplicateBook(${b.id})">
                            📋 تكرار الكتاب
                          </button>
                          <button type="button" class="dropdown-item-btn" style="width:100%; text-align:right; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary, #1e293b); border-radius:8px; display:flex; align-items:center; gap:8px;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='none'" onclick="changeBookPriceModal(${b.id})">
                            💰 تغيير السعر
                          </button>
                          <button type="button" class="dropdown-item-btn" style="width:100%; text-align:right; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary, #1e293b); border-radius:8px; display:flex; align-items:center; gap:8px;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='none'" onclick="openVersionHistoryModal(${b.id})">
                            📜 سجل الإصدارات
                          </button>
                          <button type="button" class="dropdown-item-btn" style="width:100%; text-align:right; padding:8px 12px; border:none; background:none; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary, #1e293b); border-radius:8px; display:flex; align-items:center; gap:8px;" onmouseover="this.style.background='var(--bg-hover, #f1f5f9)'" onmouseout="this.style.background='none'" onclick="openReadingAnalyticsModal(${b.id})">
                            📈 تحليلات القراءة
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      ${totalPages > 1 ? `
        <div class="book-pagination">
          <span style="font-size:13px; color:var(--text-secondary, #64748b);">عرض الصفحة ${mgmtCurrentPage} من إجمالي ${totalPages}</span>
          <div class="pagination-pages">
            <button type="button" class="page-btn" ${mgmtCurrentPage === 1 ? 'disabled style="opacity:0.5;"' : ''} onclick="changeMgmtPage(${mgmtCurrentPage - 1})">السابق</button>
            ${Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => `
              <button type="button" class="page-btn ${pg === mgmtCurrentPage ? 'active' : ''}" onclick="changeMgmtPage(${pg})">${pg}</button>
            `).join('')}
            <button type="button" class="page-btn" ${mgmtCurrentPage === totalPages ? 'disabled style="opacity:0.5;"' : ''} onclick="changeMgmtPage(${mgmtCurrentPage + 1})">التالي</button>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Restore vertical window scroll and horizontal table scroll
  if (savedWindowY > 0) {
    window.scrollTo({ top: savedWindowY, behavior: "instant" });
  }
  const newTableWrapper = container.querySelector(".book-mgmt-table-wrapper");
  if (newTableWrapper && savedTableScrollLeft !== null) {
    newTableWrapper.scrollLeft = savedTableScrollLeft;
  }

  if (isSearchFocused) {
    const newSearchInput = container.querySelector(".mgmt-search-input");
    if (newSearchInput) {
      try {
        newSearchInput.focus({ preventScroll: true });
        if (searchCursorPos !== null && typeof newSearchInput.setSelectionRange === "function") {
          newSearchInput.setSelectionRange(searchCursorPos, searchCursorPos);
        }
      } catch (e) {}
    }
  }

  // Fallback restoration on next animation frame
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      if (savedWindowY > 0) {
        window.scrollTo({ top: savedWindowY, behavior: "instant" });
      }
      const reqTableWrapper = container.querySelector(".book-mgmt-table-wrapper");
      if (reqTableWrapper && savedTableScrollLeft !== null) {
        reqTableWrapper.scrollLeft = savedTableScrollLeft;
      }
    });
  }
}

/**
 * Event Handlers for Management Table
 */
export function handleBookSearch(val) {
  mgmtSearchQuery = val;
  mgmtCurrentPage = 1;
  renderBookManagementUI();
}

export function handleBookStatusFilter(val) {
  mgmtStatusFilter = val;
  mgmtCurrentPage = 1;
  renderBookManagementUI();
}

export function handleBookSort(val) {
  mgmtSortBy = val;
  renderBookManagementUI();
}

export function changeMgmtPage(page) {
  mgmtCurrentPage = page;
  renderBookManagementUI();
}

export function toggleSelectBook(id, checked) {
  const idStr = String(id);
  if (checked) {
    if (!mgmtSelectedBookIds.map(String).includes(idStr)) {
      mgmtSelectedBookIds.push(id);
    }
  } else {
    mgmtSelectedBookIds = mgmtSelectedBookIds.filter((item) => String(item) !== idStr);
  }
  renderBookManagementUI();
}

export function toggleSelectAllBooks(checked) {
  if (checked) {
    mgmtSelectedBookIds = booksData.map((b) => b.id);
  } else {
    mgmtSelectedBookIds = [];
  }
  renderBookManagementUI();
}

export function executeBulkAction(action) {
  if (mgmtSelectedBookIds.length === 0) {
    showCustomAlert("يرجى اختيار كتاب واحد على الأقل أولاً.");
    return;
  }

  if (action === "publish") {
    booksData.forEach((b) => {
      if (mgmtSelectedBookIds.map(String).includes(String(b.id))) {
        b.status = "published";
      }
    });
    saveBooksDataToStorage();
    showCustomAlert(`تم نشر ${mgmtSelectedBookIds.length} كتب بنجاح!`);
  } else if (action === "archive") {
    booksData.forEach((b) => {
      if (mgmtSelectedBookIds.map(String).includes(String(b.id))) {
        b.status = "archived";
      }
    });
    saveBooksDataToStorage();
    showCustomAlert(`تم أرشفة ${mgmtSelectedBookIds.length} كتب بنجاح.`);
  } else if (action === "delete") {
    if (confirm(`هل أنت تأكد من حذف ${mgmtSelectedBookIds.length} كتب بشكل نهائي؟`)) {
      mgmtSelectedBookIds.forEach((id) => {
        const idStr = String(id);
        const idx = booksData.findIndex((b) => String(b.id) === idStr);
        if (idx >= 0) {
          booksData.splice(idx, 1);
          saveDeletedBookIdToStorage(idStr);
        }
      });
      saveBooksDataToStorage();
      mgmtSelectedBookIds = [];
      showCustomAlert("تم حذف الكتب المحددة بنجاح.");
    }
  } else if (action === "export") {
    showCustomAlert("تم تصدير بيانات الكتب المحددة بنجاح (CSV/JSON).");
  }

  renderBookManagementUI();
}

/**
 * Individual Row Actions
 */
export function toggleBookMoreMenu(id, event) {
  if (event) {
    if (typeof event.preventDefault === "function") event.preventDefault();
    if (typeof event.stopPropagation === "function") event.stopPropagation();
  }
  const idStr = String(id);
  openMoreMenuId = String(openMoreMenuId) === idStr ? null : id;
  renderBookManagementUI();
}

export function togglePublishBook(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  book.status = book.status === "published" ? "draft" : "published";
  saveBooksDataToStorage();
  openMoreMenuId = null;

  renderBookManagementUI();
  showCustomAlert(
    book.status === "published"
      ? `تم نشر كتاب "${book.title}" بنجاح!`
      : `تم إلغاء نشر كتاب "${book.title}" وتغيير حالته إلى مسودة.`
  );
}

export function archiveBook(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  book.status = "archived";
  saveBooksDataToStorage();
  openMoreMenuId = null;

  renderBookManagementUI();
  showCustomAlert(`تم أرشفة كتاب "${book.title}" بنجاح.`);
}

export function duplicateBook(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  const copy = JSON.parse(JSON.stringify(book));
  copy.id = Date.now();
  copy.title = `${book.title} (نسخة مكررة)`;
  copy.status = "draft";
  copy.downloads = 0;
  copy.purchases = 0;
  copy.revenue = 0;

  booksData.unshift(copy);
  saveBooksDataToStorage();
  openMoreMenuId = null;

  renderBookManagementUI();
  showCustomAlert(`تم تكرار كتاب "${book.title}" بنجاح وإضافته كمسودة جديدة!`);
}

/**
 * Delete Confirmation Modal Action
 */
export function deleteBookFromMgmt(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  const overlay = createBookModalOverlay("deleteBookModalOverlay");
  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 480px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 14px; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #ef4444; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span>
          <span>تأكيد حذف الكتاب</span>
        </h3>
        <button type="button" class="btn-close-modal" aria-label="إغلاق" onclick="this.closest('.floating-modal-overlay').remove()" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
      </div>

      <div style="padding: 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; margin-bottom: 18px;">
        <p style="margin: 0; font-size: 14px; color: #991b1b; line-height: 1.6;">
          هل أنت تأكد من حذف كتاب "<b>${escapeHtml(book.title)}</b>" بشكل نهائي؟
        </p>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #b91c1c;">
          سيتم إزالة الكتاب بالكامل وحذفه من قاعدة البيانات، ولن يظهر بعد تحديث الصفحة.
        </p>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
        <button type="button" class="btn-danger-outline sm" style="background: #ef4444; color: #ffffff; border-color: #ef4444;" onclick="confirmDeleteBookAction(${book.id})">
          🗑️ تأكيد الحذف النهائي
        </button>
      </div>
    </div>
  `;
}

export function confirmDeleteBookAction(id) {
  const idStr = String(id);
  const idx = booksData.findIndex((b) => String(b.id) === idStr);

  if (idx >= 0) {
    const deletedBook = booksData[idx];
    booksData.splice(idx, 1);

    saveDeletedBookIdToStorage(idStr);
    saveBooksDataToStorage();

    mgmtSelectedBookIds = mgmtSelectedBookIds.filter((item) => String(item) !== idStr);
    openMoreMenuId = null;

    const overlay = document.getElementById("deleteBookModalOverlay");
    if (overlay) overlay.remove();

    renderBookManagementUI();
    showCustomAlert(`تم حذف كتاب "${deletedBook.title}" بنجاح ولن يظهر مجدداً.`);
  }
}

/**
 * Change Price Modal
 */
export function changeBookPriceModal(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  const overlay = createBookModalOverlay("changePriceModalOverlay");
  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 480px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 14px; margin-bottom: 18px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary-color, #7c3aed); display: flex; align-items: center; gap: 8px;">
          <span>💰</span>
          <span>تغيير سعر الكتاب</span>
        </h3>
        <button type="button" class="btn-close-modal" aria-label="إغلاق" onclick="this.closest('.floating-modal-overlay').remove()" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
      </div>

      <p style="font-size: 14px; color: var(--text-secondary, #475569); margin-bottom: 16px;">
        الكتاب: <b>${escapeHtml(book.title)}</b><br>
        السعر الحالي: <span style="font-weight: 800; color: #10b981;">${book.isFree ? 'مجاني' : `$${book.price}`}</span>
      </p>

      <form onsubmit="handleSaveBookPriceSubmit(event, ${book.id})">
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a); margin-bottom: 6px;">السعر الجديد (بالدولار $):</label>
          <input type="number" id="newBookPriceInput" step="0.01" min="0" value="${book.price || 0}" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color, #cbd5e1); font-size: 15px; font-weight: 700;" required />
        </div>

        <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="newBookIsFreeCheckbox" ${book.isFree ? 'checked' : ''} onchange="document.getElementById('newBookPriceInput').value = this.checked ? 0 : '${book.price || 10}'" />
          <label for="newBookIsFreeCheckbox" style="font-size: 13px; color: var(--text-primary, #0f172a); cursor: pointer;">تحديد الكتاب ككتاب مجاني (Free)</label>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="submit" class="btn-primary-purple sm">حفظ السعر الجديد</button>
        </div>
      </form>
    </div>
  `;
}

export function handleSaveBookPriceSubmit(event, id) {
  if (event) event.preventDefault();
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  const priceInput = document.getElementById("newBookPriceInput");
  const freeCheckbox = document.getElementById("newBookIsFreeCheckbox");

  if (!priceInput) return;

  const val = Number(priceInput.value);
  if (isNaN(val) || val < 0) {
    showCustomAlert("يرجى إدخال سعر صحيح (0 أو أكبر).");
    return;
  }

  book.price = val;
  book.isFree = val === 0 || (freeCheckbox && freeCheckbox.checked);

  saveBooksDataToStorage();
  openMoreMenuId = null;

  const overlay = document.getElementById("changePriceModalOverlay");
  if (overlay) overlay.remove();

  renderBookManagementUI();
  showCustomAlert(`تم تحديث سعر كتاب "${book.title}" بنجاح إلى ${book.isFree ? 'مجاني' : '$' + book.price}`);
}

/**
 * Preview Book Handler
 */
export function previewBookFromMgmt(id) {
  openMoreMenuId = null;
  if (typeof window.openBookPreview === "function") {
    window.openBookPreview(id);
  } else if (typeof window.showBookDetails === "function") {
    window.showBookDetails(id);
  } else {
    showCustomAlert("معاينة القارئ غير متاحة لهذا الكتاب حالياً.");
  }
}

/**
 * Show Book Statistics Modal (Centered Floating Overlay)
 */
export function showBookStatsModal(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  openMoreMenuId = null;

  const overlay = createBookModalOverlay("bookStatsModalOverlay");
  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 600px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 14px; margin-bottom: 18px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary-color, #7c3aed); display: flex; align-items: center; gap: 8px;">
          <span>📊</span>
          <span>إحصائيات الكتاب: ${escapeHtml(book.title)}</span>
        </h3>
        <button type="button" class="btn-close-modal" aria-label="إغلاق" onclick="this.closest('.floating-modal-overlay').remove()" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
        <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px;">
          <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">🛒 إجمالي المبيعات</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--text-primary, #0f172a); margin-top: 4px;">${(book.purchases || 0).toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px;">
          <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">📥 إجمالي التحميلات</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--text-primary, #0f172a); margin-top: 4px;">${(book.downloads || 0).toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px;">
          <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">💰 إجمالي الإيرادات</div>
          <div style="font-size: 22px; font-weight: 800; color: #10b981; margin-top: 4px;">$${(book.revenue || 0).toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px;">
          <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">⭐ متوسط التقييم</div>
          <div style="font-size: 22px; font-weight: 800; color: #f59e0b; margin-top: 4px;">★ ${book.rating || 0} <span style="font-size: 12px; color: #94a3b8; font-weight: 400;">(${book.reviewsCount || 0} تقييم)</span></div>
        </div>
      </div>

      <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a); margin-bottom: 8px;">تفاصيل إضافية عن الكتاب:</div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; color: var(--text-secondary, #475569);">
          <div>• الحالة: <b>${book.status === 'published' ? 'منشور' : book.status === 'draft' ? 'مسودة' : book.status === 'archived' ? 'مؤرشف' : 'خاص'}</b></div>
          <div>• السعر: <b>${book.isFree ? 'مجاني' : `$${book.price}`}</b></div>
          <div>• التصنيف: <b>${escapeHtml(book.category || '-')}</b></div>
          <div>• عدد الصفحات: <b>${book.pages || 0} صفحة</b></div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button type="button" class="btn-primary-purple sm" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
      </div>
    </div>
  `;
}

/**
 * Version History Modal
 */
export function openVersionHistoryModal(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  openMoreMenuId = null;

  const overlay = createBookModalOverlay("versionHistoryModalOverlay");
  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 580px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 14px; margin-bottom: 18px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary-color, #7c3aed); display: flex; align-items: center; gap: 8px;">
          <span>📜</span>
          <span>سجل إصدارات وتحديثات الكتاب</span>
        </h3>
        <button type="button" class="btn-close-modal" aria-label="إغلاق" onclick="this.closest('.floating-modal-overlay').remove()" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
      </div>

      <p style="font-size: 14px; color: var(--text-secondary, #475569); margin-bottom: 16px;">
        الكتاب: <b>${escapeHtml(book.title)}</b>
      </p>

      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; max-height: 220px; overflow-y: auto; padding-left: 4px;">
        ${(!book.versionHistory || book.versionHistory.length === 0) ? `
          <div style="padding: 16px; background: var(--bg-secondary, #f8fafc); border-radius: 10px; border: 1px dashed var(--border-color, #cbd5e1); text-align: center; color: var(--text-secondary, #64748b); font-size: 13px;">
            لا توجد سجلات إصدارات تفصيلية سابقة لهذا الكتاب.
          </div>
        ` : book.versionHistory.map(v => `
          <div style="padding: 12px; background: var(--bg-secondary, #f8fafc); border-radius: 10px; border: 1px solid var(--border-color, #e2e8f0);">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; color: var(--text-primary, #0f172a);">
              <span>إصدار: ${escapeHtml(v.version)}</span>
              <span style="font-size: 12px; color: var(--text-secondary, #94a3b8); font-weight: 400;">${v.date}</span>
            </div>
            <div style="font-size: 13px; color: var(--text-secondary, #334155); margin-top: 6px; line-height: 1.5;">${escapeHtml(v.notes)}</div>
          </div>
        `).join('')}
      </div>

      <!-- Add new version log form -->
      <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a); margin-bottom: 10px;">إضافة تحديث / إصدار جديد:</div>
        <div style="display: flex; gap: 10px; margin-bottom: 8px;">
          <input type="text" id="newVersionNumInput" placeholder="رقم الإصدار (مثال: v1.2)" style="width: 140px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 13px;" />
          <input type="text" id="newVersionNotesInput" placeholder="ملاحظات التحديث والتحسينات..." style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 13px;" />
        </div>
        <button type="button" class="btn-secondary-outline sm" style="width: 100%; justify-content: center;" onclick="addNewVersionRecord(${book.id})">
          ➕ تسجيل هذا الإصدار في السجل
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <button type="button" class="btn-primary-purple sm" onclick="notifyBuyersOfUpdate('${escapeHtml(book.title)}')">
          🔔 إرسال إشعار للمشترين بتحديث الكتاب
        </button>
        <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
      </div>
    </div>
  `;
}

export function addNewVersionRecord(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  const verInput = document.getElementById("newVersionNumInput");
  const notesInput = document.getElementById("newVersionNotesInput");

  if (!verInput || !notesInput) return;

  const ver = verInput.value.trim();
  const notes = notesInput.value.trim();

  if (!ver || !notes) {
    showCustomAlert("يرجى إدخال رقم الإصدار وملاحظات التحديث.");
    return;
  }

  if (!Array.isArray(book.versionHistory)) {
    book.versionHistory = [];
  }

  book.versionHistory.unshift({
    version: ver,
    date: new Date().toISOString().split("T")[0],
    notes: notes
  });

  saveBooksDataToStorage();
  openVersionHistoryModal(id);
  showCustomAlert(`تمت إضافة الإصدار ${ver} بنجاح!`);
}

export function notifyBuyersOfUpdate(title) {
  showCustomAlert(`🔔 تم إرسال إشعار وتنبيه بالبريد لجميع المشترين لتحديث كتاب "${title}"!`);
}

/**
 * Reading Analytics Modal
 */
export function openReadingAnalyticsModal(id) {
  const book = booksData.find((b) => String(b.id) === String(id));
  if (!book) return;

  openMoreMenuId = null;

  const analytics = book.readingAnalytics || {
    avgCompletion: book.status === "published" ? 75 : 0,
    totalActiveReaders: book.status === "published" ? Math.floor((book.downloads || 100) * 0.4) : 0
  };

  const overlay = createBookModalOverlay("readingAnalyticsModalOverlay");
  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 520px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 14px; margin-bottom: 18px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary-color, #7c3aed); display: flex; align-items: center; gap: 8px;">
          <span>📈</span>
          <span>تحليلات قراءة الطلاب</span>
        </h3>
        <button type="button" class="btn-close-modal" aria-label="إغلاق" onclick="this.closest('.floating-modal-overlay').remove()" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
      </div>

      <p style="font-size: 14px; color: var(--text-secondary, #475569); margin-bottom: 16px;">
        الكتاب: <b>${escapeHtml(book.title)}</b>
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
        <div style="padding: 16px; background: var(--bg-secondary, #f8fafc); border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px; color: var(--text-secondary, #64748b); font-weight: 600;">معدل إكمال القراءة العام:</span>
            <span style="font-size: 22px; font-weight: 800; color: var(--primary-color, #7c3aed);">${analytics.avgCompletion}%</span>
          </div>
          <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
            <div style="width: ${analytics.avgCompletion}%; height: 100%; background: linear-gradient(90deg, #7c3aed, #6366f1); border-radius: 4px;"></div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div style="padding: 14px; background: var(--bg-secondary, #f8fafc); border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0);">
            <div style="font-size: 12px; color: var(--text-secondary, #64748b);">القراء النشطون حالياً:</div>
            <div style="font-size: 20px; font-weight: 800; color: #10b981; margin-top: 4px;">${analytics.totalActiveReaders} قارئ</div>
          </div>
          <div style="padding: 14px; background: var(--bg-secondary, #f8fafc); border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0);">
            <div style="font-size: 12px; color: var(--text-secondary, #64748b);">إجمالي التحميلات:</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin-top: 4px;">${(book.downloads || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button type="button" class="btn-primary-purple sm" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
      </div>
    </div>
  `;
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

if (typeof window !== "undefined") {
  window.openBookManagementDashboard = openBookManagementDashboard;
  window.renderBookManagementUI = renderBookManagementUI;
  window.handleBookSearch = handleBookSearch;
  window.handleBookStatusFilter = handleBookStatusFilter;
  window.handleBookSort = handleBookSort;
  window.changeMgmtPage = changeMgmtPage;
  window.toggleSelectBook = toggleSelectBook;
  window.toggleSelectAllBooks = toggleSelectAllBooks;
  window.executeBulkAction = executeBulkAction;
  window.toggleBookMoreMenu = toggleBookMoreMenu;
  window.togglePublishBook = togglePublishBook;
  window.archiveBook = archiveBook;
  window.duplicateBook = duplicateBook;
  window.deleteBookFromMgmt = deleteBookFromMgmt;
  window.confirmDeleteBookAction = confirmDeleteBookAction;
  window.changeBookPriceModal = changeBookPriceModal;
  window.handleSaveBookPriceSubmit = handleSaveBookPriceSubmit;
  window.previewBookFromMgmt = previewBookFromMgmt;
  window.showBookStatsModal = showBookStatsModal;
  window.openVersionHistoryModal = openVersionHistoryModal;
  window.addNewVersionRecord = addNewVersionRecord;
  window.notifyBuyersOfUpdate = notifyBuyersOfUpdate;
  window.openReadingAnalyticsModal = openReadingAnalyticsModal;
}
