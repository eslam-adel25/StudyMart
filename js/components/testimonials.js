import { getReviewsList } from "../data/reviewsData.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { normalizeSearchString } from "./search.js";
import { getFeaturedConfig } from "../.featured-config.js";

/**
 * Format date string into human-readable Arabic relative time
 */
function formatReviewDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const now = new Date("2026-08-07T00:00:00");
  const diffTime = Math.abs(now - d);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays === 2) return "منذ يومين";
  if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
  if (diffDays > 10 && diffDays < 14) return "منذ أسبوع";
  if (diffDays >= 14 && diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  if (diffDays >= 30 && diffDays < 60) return "منذ شهر";
  if (diffDays >= 60 && diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
  return "منذ سنة";
}

/**
 * Lookup product cover image from coursesData or booksData
 */
function getProductThumbnail(type, itemId) {
  if (!itemId) return null;
  if (type === "Course") {
    const course = coursesData.find(c => String(c.id) === String(itemId));
    return course && course.image ? course.image : null;
  }
  if (type === "Book") {
    const book = booksData.find(b => String(b.id) === String(itemId));
    return book && book.image ? book.image : null;
  }
  return null;
}

/**
 * Global navigation helper to redirect to Course Details or Book Details
 */
export function navigateToReviewProduct(type, itemId) {
  if (!itemId) return;
  if (String(type).toLowerCase() === "book") {
    window.location.hash = `#book-details/${itemId}`;
  } else {
    window.location.hash = `#course-details/${itemId}`;
  }
}
window.navigateToReviewProduct = navigateToReviewProduct;

/**
 * Toggle Read More / Show Less for a single review card
 */
window.toggleReviewExpand = function(event, btn, type, itemId) {
  if (event) event.stopPropagation();
  if (!btn) return;
  const wrapper = btn.closest('.review-text-wrapper');
  if (!wrapper) return;
  const textEl = wrapper.querySelector('.review-text');
  if (!textEl) return;

  const isClamped = textEl.classList.contains('clamped');
  if (isClamped) {
    textEl.classList.remove('clamped');
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = 'عرض أقل <span aria-hidden="true">▴</span>';
  } else {
    // If user clicks the button when text is already expanded, navigate to the product page
    if (type && itemId) {
      navigateToReviewProduct(type, itemId);
    } else {
      textEl.classList.add('clamped');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = 'قراءة المزيد <span aria-hidden="true">▾</span>';
    }
  }
};

/**
 * Render single Review Card HTML component
 */
export function renderReviewCard(review) {
  const isVerified = Boolean(review.purchaseDate || review.purchasedItemId);
  const thumbUrl = getProductThumbnail(review.type, review.purchasedItemId);
  const typeLabel = review.type === "Course" ? "🎓 دورة" : "📘 كتاب";
  const stars = Number(review.stars) || 5;
  const starString = "★".repeat(stars) + "☆".repeat(5 - stars);
  const formattedDate = formatReviewDate(review.createdDate);
  const isLongText = (review.reviewText || "").length > 110;

  return `
    <div class="review-card" id="review-card-${review.id}" onclick="navigateToReviewProduct('${review.type}', '${review.purchasedItemId}')" style="cursor: pointer;">
      <!-- Product Associated Bar -->
      <div class="review-product-bar">
        <div class="review-product-info">
          ${thumbUrl ? `<img src="${thumbUrl}" alt="${review.courseOrBookName || ''}" class="review-product-thumb" />` : ''}
          <div class="review-product-meta">
            <span class="review-type-badge">${typeLabel}</span>
            <span class="review-product-name" title="${review.courseOrBookName || ''}">${review.courseOrBookName || ''}</span>
          </div>
        </div>
        <div class="quote-icon" aria-hidden="true">“</div>
      </div>

      <!-- Rating Line & Date -->
      <div class="review-rating-line">
        <span class="review-stars-icons" aria-label="التقييم ${stars} من 5">${starString}</span>
        <span class="review-rating-num">${stars}.0</span>
        <span class="review-rating-sep">•</span>
        <span class="review-date-text">${formattedDate}</span>
      </div>

      <!-- Review Title -->
      <h3 class="review-card-title" title="${review.reviewTitle || ''}">${review.reviewTitle || ''}</h3>

      <!-- Review Body -->
      <div class="review-text-wrapper">
        <p class="review-text ${isLongText ? 'clamped' : ''}">${review.reviewText || ''}</p>
        ${isLongText ? `
          <button type="button" class="read-more-btn" aria-expanded="false" onclick="toggleReviewExpand(event, this, '${review.type}', '${review.purchasedItemId}')">
            قراءة المزيد <span aria-hidden="true">▾</span>
          </button>
        ` : ''}
      </div>

      <!-- Author / Student Info -->
      <div class="review-author-row">
        <div class="review-student-info">
          <img src="${review.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'}" alt="${review.studentName}" class="review-avatar" />
          <div>
            <div class="review-student-name">${review.studentName}</div>
            ${isVerified ? `
              <div class="review-verified-badge" title="طالب مؤكد بطلب شراء">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>طالب مؤكد</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render home page student reviews section
 */
export function renderHomeTestimonials() {
  const reviewsSection = document.querySelector(".student-reviews-section");
  if (!reviewsSection) return;

  const reviewsGrid = reviewsSection.querySelector(".reviews-grid");
  if (!reviewsGrid) return;

  const reviewsList = getReviewsList();
  if (!reviewsList || reviewsList.length === 0) return;

  const { featuredReviews } = getFeaturedConfig();
  let displayReviews = [];

  if (Array.isArray(featuredReviews) && featuredReviews.length > 0) {
    featuredReviews.forEach((id) => {
      const r = reviewsList.find((item) => String(item.id) === String(id));
      if (r) displayReviews.push(r);
    });
  }

  if (displayReviews.length === 0) {
    displayReviews = reviewsList.slice(0, 3);
  }

  reviewsGrid.innerHTML = displayReviews.map(review => renderReviewCard(review)).join("");

  // Remove any existing "View All Reviews" button container before re-adding
  const existingViewAll = reviewsSection.querySelector(".view-all-reviews-wrapper");
  if (existingViewAll) existingViewAll.remove();

  // Add "View All Reviews" button below the reviews grid
  const viewAllContainer = document.createElement("div");
  viewAllContainer.className = "view-all-reviews-wrapper";
  viewAllContainer.innerHTML = `
    <button type="button" class="view-all-reviews-btn" onclick="location.hash='#reviews'" aria-label="عرض جميع التقييمات">
      <span>عرض جميع التقييمات</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: scaleX(-1);"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
    </button>
  `;
  reviewsSection.appendChild(viewAllContainer);
}

window.renderHomeTestimonials = renderHomeTestimonials;

// State management for Public Standalone Reviews Page
const publicReviewState = {
  searchQuery: "",
  typeFilter: "all",
  starsFilter: "all",
  sortBy: "date_desc",
  currentPage: 1,
  pageSize: 6
};

function getReviewSearchableText(review) {
  let teacherName = "";
  let category = "";

  if (review.type === "Course" && review.purchasedItemId) {
    const course = coursesData.find(c => String(c.id) === String(review.purchasedItemId));
    if (course) {
      teacherName = course.instructor || course.instructorName || "";
      category = course.category || course.series || "";
    }
  } else if (review.type === "Book" && review.purchasedItemId) {
    const book = booksData.find(b => String(b.id) === String(review.purchasedItemId));
    if (book) {
      teacherName = book.author || "";
      category = book.category || book.subCategory || "";
    }
  }

  const rawText = [
    review.studentName || "",
    review.reviewTitle || "",
    review.reviewText || "",
    review.courseOrBookName || "",
    review.teacherReply || "",
    teacherName,
    category,
    review.type === "Course" ? "دورة دورات course courses" : "كتاب كتب book books"
  ].join(" ");

  return normalizeSearchString(rawText);
}

function getFilteredPublicReviews() {
  const allReviews = getReviewsList() || [];
  let filtered = [...allReviews];

  if (publicReviewState.searchQuery && publicReviewState.searchQuery.trim()) {
    const normQuery = normalizeSearchString(publicReviewState.searchQuery);
    if (normQuery) {
      const tokens = normQuery.split(" ").filter(Boolean);
      filtered = filtered.filter(r => {
        const searchableText = getReviewSearchableText(r);
        return tokens.every(token => searchableText.includes(token));
      });
    }
  }

  if (publicReviewState.typeFilter !== "all") {
    filtered = filtered.filter(r => r.type === publicReviewState.typeFilter);
  }

  if (publicReviewState.starsFilter !== "all") {
    filtered = filtered.filter(r => String(r.stars) === String(publicReviewState.starsFilter));
  }

  filtered.sort((a, b) => {
    if (publicReviewState.sortBy === "date_desc") {
      return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
    }
    if (publicReviewState.sortBy === "date_asc") {
      return new Date(a.createdDate || 0) - new Date(b.createdDate || 0);
    }
    if (publicReviewState.sortBy === "stars_desc") {
      return (Number(b.stars) || 0) - (Number(a.stars) || 0);
    }
    if (publicReviewState.sortBy === "stars_asc") {
      return (Number(a.stars) || 0) - (Number(b.stars) || 0);
    }
    return 0;
  });

  return filtered;
}

let publicSearchDebounceTimer = null;

window.handlePublicReviewSearch = function(val) {
  publicReviewState.searchQuery = val || "";
  publicReviewState.currentPage = 1;

  if (publicSearchDebounceTimer) {
    clearTimeout(publicSearchDebounceTimer);
  }

  publicSearchDebounceTimer = setTimeout(() => {
    renderPublicReviewsListOnly();
  }, 250);
};

window.handlePublicReviewSearchKeydown = function(e) {
  if (e.key === "Escape") {
    e.preventDefault();
    if (publicSearchDebounceTimer) clearTimeout(publicSearchDebounceTimer);
    publicReviewState.searchQuery = "";
    publicReviewState.currentPage = 1;
    const input = document.getElementById("publicReviewSearchInput");
    if (input) input.value = "";
    renderPublicReviewsListOnly();
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (publicSearchDebounceTimer) clearTimeout(publicSearchDebounceTimer);
    renderPublicReviewsListOnly();
  }
};

window.handlePublicReviewTypeFilter = function(val) {
  publicReviewState.typeFilter = val;
  publicReviewState.currentPage = 1;
  renderPublicReviewsListOnly();
};

window.handlePublicReviewStarsFilter = function(val) {
  publicReviewState.starsFilter = val;
  publicReviewState.currentPage = 1;
  renderPublicReviewsListOnly();
};

window.handlePublicReviewSort = function(val) {
  publicReviewState.sortBy = val;
  publicReviewState.currentPage = 1;
  renderPublicReviewsListOnly();
};

window.changePublicReviewPage = function(page) {
  publicReviewState.currentPage = page;
  renderPublicReviewsListOnly();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export function renderPublicReviewsListOnly() {
  const container = document.getElementById("publicReviewsContent");
  if (!container) return;

  const gridEl = container.querySelector(".reviews-grid");
  const paginationEl = container.querySelector(".public-reviews-pagination-wrapper");

  if (!gridEl) {
    renderPublicReviewsUI();
    return;
  }

  const filtered = getFilteredPublicReviews();
  const totalPages = Math.ceil(filtered.length / publicReviewState.pageSize) || 1;
  if (publicReviewState.currentPage > totalPages) publicReviewState.currentPage = 1;

  const startIndex = (publicReviewState.currentPage - 1) * publicReviewState.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + publicReviewState.pageSize);

  if (paginated.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--sm-card-bg, #ffffff); border: 1px solid var(--sm-border, #e2e8f0); border-radius: 12px; color: var(--sm-text-muted, #64748b);">
        <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
        <div style="font-size: 16px; font-weight: 700; color: var(--sm-text-dark, #0f172a); margin-bottom: 4px;">لم يتم العثور على تقييمات</div>
        <div style="font-size: 13px;">لا توجد تقييمات تطابق خيارات البحث والفلترة الحالية.</div>
      </div>
    `;
  } else {
    gridEl.innerHTML = paginated.map(review => renderReviewCard(review)).join("");
  }

  if (paginationEl) {
    paginationEl.innerHTML = totalPages > 1 ? `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px 0; border-top: 1px solid var(--sm-border, #e2e8f0);">
        <span style="font-size: 13px; color: var(--sm-text-muted, #64748b);">عرض الصفحة ${publicReviewState.currentPage} من ${totalPages} (إجمالي ${filtered.length} تقييم)</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" onclick="changePublicReviewPage(${publicReviewState.currentPage - 1})" ${publicReviewState.currentPage === 1 ? 'disabled' : ''} style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--sm-border, #e2e8f0); background: var(--sm-card-bg, #ffffff); color: var(--sm-text-dark, #0f172a); cursor: pointer; font-size: 13px; font-weight: 600; opacity: ${publicReviewState.currentPage === 1 ? '0.5' : '1'};">السابق</button>
          ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
            <button type="button" onclick="changePublicReviewPage(${p})" style="padding: 6px 12px; border-radius: 6px; border: 1px solid ${p === publicReviewState.currentPage ? 'var(--sm-purple-primary, #7c3aed)' : 'var(--sm-border, #e2e8f0)'}; background: ${p === publicReviewState.currentPage ? 'var(--sm-purple-primary, #7c3aed)' : 'var(--sm-card-bg, #ffffff)'}; color: ${p === publicReviewState.currentPage ? '#ffffff' : 'var(--sm-text-dark, #0f172a)'}; cursor: pointer; font-size: 13px; font-weight: 700;">${p}</button>
          `).join('')}
          <button type="button" onclick="changePublicReviewPage(${publicReviewState.currentPage + 1})" ${publicReviewState.currentPage === totalPages ? 'disabled' : ''} style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--sm-border, #e2e8f0); background: var(--sm-card-bg, #ffffff); color: var(--sm-text-dark, #0f172a); cursor: pointer; font-size: 13px; font-weight: 600; opacity: ${publicReviewState.currentPage === totalPages ? '0.5' : '1'};">التالي</button>
        </div>
      </div>
    ` : '';
  }
}

/**
 * Render Public Reviews Page UI
 */
export function renderPublicReviewsUI() {
  const container = document.getElementById("publicReviewsContent");
  if (!container) return;

  const allReviews = getReviewsList() || [];

  // Summary math
  const totalCount = allReviews.length;
  const avgRating = totalCount ? (allReviews.reduce((sum, r) => sum + (Number(r.stars) || 5), 0) / totalCount).toFixed(1) : "0.0";
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  allReviews.forEach(r => {
    const s = Number(r.stars) || 5;
    if (starCounts[s] !== undefined) starCounts[s]++;
  });

  const filtered = getFilteredPublicReviews();

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / publicReviewState.pageSize) || 1;
  if (publicReviewState.currentPage > totalPages) publicReviewState.currentPage = 1;

  const startIndex = (publicReviewState.currentPage - 1) * publicReviewState.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + publicReviewState.pageSize);

  container.innerHTML = `
    <div class="crm-module-container" style="width: 100%; max-width: 1200px; margin: 0 auto; box-sizing: border-box;">
      <!-- Breadcrumb & Header -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; color: var(--sm-text-muted, #64748b); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          <a href="#home" style="color: var(--sm-purple-primary, #7c3aed); text-decoration: none; font-weight: 600;">الرئيسية</a>
          <span>/</span>
          <span style="color: var(--sm-text-dark, #0f172a); font-weight: 700;">تقييمات وآراء الطلاب</span>
        </div>
        <h1 style="font-size: 26px; font-weight: 800; color: var(--sm-text-dark, #0f172a); margin: 0 0 6px 0;">⭐ تقييمات وآراء الطلاب</h1>
        <p style="font-size: 14px; color: var(--sm-text-muted, #64748b); margin: 0;">اقرأ تجارب طلابنا الحقيقيين وطالع آراءهم في دوراتنا وكتبنا التعليمية</p>
      </div>

      <!-- Rating Summary Bar -->
      <div class="crm-rating-breakdown-card" style="background: var(--sm-card-bg, #ffffff); border: 1px solid var(--sm-border, #e2e8f0); border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: var(--sm-shadow-sm);">
        <div class="crm-rating-header-bar" style="display: flex; align-items: center; gap: 32px; flex-wrap: wrap;">
          <div class="crm-overall-score" style="text-align: center; min-width: 140px;">
            <div class="crm-overall-num" style="font-size: 42px; font-weight: 900; color: var(--sm-text-dark, #0f172a); line-height: 1;">${avgRating}</div>
            <div class="crm-overall-stars" style="color: #f59e0b; font-size: 18px; margin: 6px 0;">${'★'.repeat(Math.round(avgRating))}${'☆'.repeat(5 - Math.round(avgRating))}</div>
            <div class="crm-overall-count" style="font-size: 12px; color: var(--sm-text-muted, #64748b); font-weight: 600;">بناءً على ${totalCount} تقييم</div>
          </div>
          <div class="crm-bars-list" style="flex: 1; min-width: 260px; display: flex; flex-direction: column; gap: 6px;">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = starCounts[star] || 0;
              const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
              return `
                <div class="crm-bar-row" style="display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; color: var(--sm-text-muted, #64748b);">
                  <span style="width: 55px;">${star} نجوم</span>
                  <div style="flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: #f59e0b; border-radius: 4px;"></div>
                  </div>
                  <span style="width: 50px; text-align: left;">${count} (%${pct})</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="public-reviews-toolbar">
        <div class="public-reviews-search-box">
          <input type="text" id="publicReviewSearchInput" placeholder="بحث في تقييمات الطلاب..." value="${publicReviewState.searchQuery}" oninput="handlePublicReviewSearch(this.value)" onkeydown="handlePublicReviewSearchKeydown(event)" />
        </div>
        <div class="public-reviews-selects-group">
          <select class="public-reviews-select" onchange="handlePublicReviewTypeFilter(this.value)">
            <option value="all" ${publicReviewState.typeFilter === 'all' ? 'selected' : ''}>جميع الأنواع</option>
            <option value="Course" ${publicReviewState.typeFilter === 'Course' ? 'selected' : ''}>🎓 الدورات التدريبية</option>
            <option value="Book" ${publicReviewState.typeFilter === 'Book' ? 'selected' : ''}>📘 الكتب الإلكترونية</option>
          </select>
          <select class="public-reviews-select" onchange="handlePublicReviewStarsFilter(this.value)">
            <option value="all" ${publicReviewState.starsFilter === 'all' ? 'selected' : ''}>جميع النجوم</option>
            <option value="5" ${publicReviewState.starsFilter === '5' ? 'selected' : ''}>5 نجوم ⭐⭐⭐⭐⭐</option>
            <option value="4" ${publicReviewState.starsFilter === '4' ? 'selected' : ''}>4 نجوم ⭐⭐⭐⭐</option>
            <option value="3" ${publicReviewState.starsFilter === '3' ? 'selected' : ''}>3 نجوم ⭐⭐⭐</option>
            <option value="2" ${publicReviewState.starsFilter === '2' ? 'selected' : ''}>نجمتان ⭐⭐</option>
            <option value="1" ${publicReviewState.starsFilter === '1' ? 'selected' : ''}>نجمة واحدة ⭐</option>
          </select>
          <select class="public-reviews-select" onchange="handlePublicReviewSort(this.value)">
            <option value="date_desc" ${publicReviewState.sortBy === 'date_desc' ? 'selected' : ''}>الأحدث أولاً</option>
            <option value="date_asc" ${publicReviewState.sortBy === 'date_asc' ? 'selected' : ''}>الأقدم أولاً</option>
            <option value="stars_desc" ${publicReviewState.sortBy === 'stars_desc' ? 'selected' : ''}>التقييم الأعلى</option>
            <option value="stars_asc" ${publicReviewState.sortBy === 'stars_asc' ? 'selected' : ''}>التقييم الأقل</option>
          </select>
        </div>
      </div>

      <!-- Reviews Grid -->
      <div class="reviews-grid" style="margin-bottom: 28px;">
        ${paginated.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--sm-card-bg); border: 1px solid var(--sm-border); border-radius: 12px; color: var(--sm-text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--sm-text-dark, #0f172a); margin-bottom: 4px;">لم يتم العثور على تقييمات</div>
            <div style="font-size: 13px;">لا توجد تقييمات تطابق خيارات البحث والفلترة الحالية.</div>
          </div>
        ` : paginated.map(review => renderReviewCard(review)).join('')}
      </div>

      <!-- Pagination Bar Wrapper -->
      <div class="public-reviews-pagination-wrapper">
        ${totalPages > 1 ? `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px 0; border-top: 1px solid var(--sm-border);">
            <span style="font-size: 13px; color: var(--sm-text-muted);">عرض الصفحة ${publicReviewState.currentPage} من ${totalPages} (إجمالي ${filtered.length} تقييم)</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button type="button" onclick="changePublicReviewPage(${publicReviewState.currentPage - 1})" ${publicReviewState.currentPage === 1 ? 'disabled' : ''} style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--sm-border); background: var(--sm-card-bg); color: var(--sm-text-dark); cursor: pointer; font-size: 13px; font-weight: 600; opacity: ${publicReviewState.currentPage === 1 ? '0.5' : '1'};">السابق</button>
              ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                <button type="button" onclick="changePublicReviewPage(${p})" style="padding: 6px 12px; border-radius: 6px; border: 1px solid ${p === publicReviewState.currentPage ? 'var(--sm-purple-primary)' : 'var(--sm-border)'}; background: ${p === publicReviewState.currentPage ? 'var(--sm-purple-primary)' : 'var(--sm-card-bg)'}; color: ${p === publicReviewState.currentPage ? '#ffffff' : 'var(--sm-text-dark)'}; cursor: pointer; font-size: 13px; font-weight: 700;">${p}</button>
              `).join('')}
              <button type="button" onclick="changePublicReviewPage(${publicReviewState.currentPage + 1})" ${publicReviewState.currentPage === totalPages ? 'disabled' : ''} style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--sm-border); background: var(--sm-card-bg); color: var(--sm-text-dark); cursor: pointer; font-size: 13px; font-weight: 600; opacity: ${publicReviewState.currentPage === totalPages ? '0.5' : '1'};">التالي</button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderPublicReviewsPage() {
  renderPublicReviewsUI();
}
window.renderPublicReviewsPage = renderPublicReviewsPage;

