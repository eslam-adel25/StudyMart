// =========================================================
// STUDYMART - FAVORITES (WISHLIST) SERVICE
// Dynamic state management & persistence via localStorage
// =========================================================

import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";

const FAVORITES_STORAGE_KEY = "studymart_favorites";
const FAVORITES_VIEW_MODE_KEY = "studymart_favorites_view_mode";

function getStoredViewMode() {
  try {
    const stored = localStorage.getItem(FAVORITES_VIEW_MODE_KEY);
    return stored === "list" ? "list" : "grid";
  } catch (e) {
    return "grid";
  }
}

// Current view state
let currentCategoryFilter = "all";
let currentSearchQuery = "";
let currentSortMode = "newest";
let currentViewMode = getStoredViewMode(); // 'grid' | 'list'
let currentPage = 1;
const ITEMS_PER_PAGE = 8;

// Default initial state (10 items matching the reference design: 5 courses & 5 books)
const DEFAULT_INITIAL_FAVORITES = [
  {
    id: 2,
    type: "course",
    title: "دورة Python للمبتدئين",
    author: "محمد علي",
    rating: 4.9,
    ratingCount: 1240,
    studentsCount: 1850,
    lessonsCount: 42,
    price: 49.99,
    thumbStyle: "python-bg",
    addedAt: "2024-01-10T10:00:00.000Z"
  },
  {
    id: 202,
    type: "book",
    title: "كتاب العادات السبع للناس الأكثر فعالية",
    author: "ستيفن كوفي",
    rating: 4.8,
    ratingCount: 890,
    pagesCount: 380,
    price: 18.00,
    coverClass: "book-cover-1",
    coverTitle: "THE 7 HABITS",
    coverAuthor: "Stephen R. Covey",
    addedAt: "2024-01-11T10:00:00.000Z"
  },
  {
    id: 3,
    type: "course",
    title: "تصميم UI/UX المتقدم",
    author: "سارة أحمد",
    rating: 4.7,
    ratingCount: 650,
    studentsCount: 940,
    lessonsCount: 35,
    price: 39.99,
    thumbStyle: "uiux-bg",
    addedAt: "2024-01-12T10:00:00.000Z"
  },
  {
    id: 203,
    type: "book",
    title: "كتاب الأب الغني والأب الفقير",
    author: "روبرت كيوساكي",
    rating: 4.9,
    ratingCount: 2100,
    pagesCount: 336,
    price: 15.00,
    coverClass: "book-cover-2",
    coverTitle: "RICH DAD",
    coverAuthor: "POOR DAD",
    addedAt: "2024-01-13T10:00:00.000Z"
  },
  {
    id: 1,
    type: "course",
    title: "بناء تطبيقات الويب مع React",
    author: "أحمد محمود",
    rating: 4.8,
    ratingCount: 1520,
    studentsCount: 2100,
    lessonsCount: 56,
    price: 54.99,
    thumbStyle: "react-bg",
    addedAt: "2024-01-14T10:00:00.000Z"
  },
  {
    id: 204,
    type: "book",
    title: "كتاب كيف تكسب الأصدقاء وتؤثر في الناس",
    author: "ديل كارنيجي",
    rating: 4.7,
    ratingCount: 720,
    pagesCount: 290,
    price: 14.00,
    coverClass: "book-cover-3",
    coverTitle: "HOW TO WIN",
    coverAuthor: "FRIENDS",
    addedAt: "2024-01-15T10:00:00.000Z"
  },
  {
    id: 7,
    type: "course",
    title: "احتراف TypeScript",
    author: "عمر حسن",
    rating: 4.9,
    ratingCount: 980,
    studentsCount: 1400,
    lessonsCount: 38,
    price: 44.99,
    thumbStyle: "ts-bg",
    addedAt: "2024-01-16T10:00:00.000Z"
  },
  {
    id: 205,
    type: "book",
    title: "كتاب Clean Code - الكود النظيف",
    author: "روبرت مارتن",
    rating: 4.9,
    ratingCount: 1840,
    pagesCount: 464,
    price: 22.00,
    coverClass: "book-cover-4",
    coverTitle: "CLEAN CODE",
    coverAuthor: "Robert C. Martin",
    addedAt: "2024-01-17T10:00:00.000Z"
  },
  {
    id: 9,
    type: "course",
    title: "تطوير الخلفيات مع Node.js",
    author: "خالد عبد الرحمن",
    rating: 4.7,
    ratingCount: 510,
    studentsCount: 820,
    lessonsCount: 40,
    price: 49.99,
    thumbStyle: "node-bg",
    addedAt: "2024-01-18T10:00:00.000Z"
  },
  {
    id: 206,
    type: "book",
    title: "كتاب فكّر وازدد ثراءً",
    author: "نابليون هيل",
    rating: 4.8,
    ratingCount: 1120,
    pagesCount: 320,
    price: 16.00,
    coverClass: "book-cover-5",
    coverTitle: "THINK & GROW",
    coverAuthor: "RICH",
    addedAt: "2024-01-19T10:00:00.000Z"
  }
];

/**
 * Get all favorites from localStorage
 */
export function getFavorites() {
  try {
    const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!data) {
      // Initialize with default initial favorites on first load
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_FAVORITES));
      return DEFAULT_INITIAL_FAVORITES;
    }
    return JSON.parse(data) || [];
  } catch (e) {
    console.error("Error reading favorites from localStorage", e);
    return DEFAULT_INITIAL_FAVORITES;
  }
}

/**
 * Save favorites array to localStorage
 */
export function saveFavorites(items) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
    updateAllHeartButtonsUI();
    updateFavoritesStats();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("favoritesUpdated", { detail: items }));
    }
  } catch (e) {
    console.error("Error saving favorites to localStorage", e);
  }
}

/**
 * Check if item is in favorites
 */
export function isFavorite(type, id) {
  const favorites = getFavorites();
  return favorites.some((item) => item.type === type && String(item.id) === String(id));
}

/**
 * Toggle favorite status of a course or book
 */
export function toggleFavorite(type, itemOrId) {
  let favorites = getFavorites();
  const id = typeof itemOrId === "object" ? itemOrId.id : itemOrId;
  const existingIndex = favorites.findIndex(
    (item) => item.type === type && String(item.id) === String(id)
  );

  let isAdded = false;

  if (existingIndex > -1) {
    // Remove
    favorites.splice(existingIndex, 1);
    saveFavorites(favorites);
    if (window.showSuccessToast) {
      window.showSuccessToast({ title: "تمت الإزالة", message: "تم إزالة العنصر من قائمة المفضلة" });
    }
  } else {
    // Add
    let newItem = null;
    if (typeof itemOrId === "object" && itemOrId.title) {
      newItem = { ...itemOrId, type, addedAt: new Date().toISOString() };
    } else if (type === "course") {
      const course = coursesData.find((c) => String(c.id) === String(id));
      if (course) {
        newItem = {
          id: course.id,
          type: "course",
          title: course.title,
          author: course.instructor || "محاضر",
          rating: parseFloat(course.rating) || 4.8,
          ratingCount: course.students ? Math.round(course.students * 0.4) : 500,
          studentsCount: course.students || 1000,
          lessonsCount: course.lessons || 30,
          price: course.price || 49.99,
          image: course.image,
          thumbStyle: course.id === 2 ? "python-bg" : course.id === 1 ? "react-bg" : course.id === 3 ? "uiux-bg" : "python-bg",
          addedAt: new Date().toISOString()
        };
      }
    } else if (type === "book") {
      const book = booksData.find((b) => String(b.id) === String(id));
      if (book) {
        newItem = {
          id: book.id,
          type: "book",
          title: book.title,
          author: book.author || "مؤلف",
          rating: parseFloat(book.rating) || 4.8,
          ratingCount: book.reviewsCount || 100,
          pagesCount: book.pages || 250,
          price: book.price || 15.00,
          image: book.image,
          coverClass: "book-cover-1",
          coverTitle: book.shortTitle || book.title,
          coverAuthor: book.author,
          addedAt: new Date().toISOString()
        };
      }
    }

    if (!newItem) {
      newItem = {
        id,
        type,
        title: type === "course" ? `دورة تعليمية #${id}` : `كتاب إلكتروني #${id}`,
        author: "المدرس",
        rating: 4.8,
        ratingCount: 300,
        price: 29.99,
        addedAt: new Date().toISOString()
      };
    }

    favorites.unshift(newItem);
    saveFavorites(favorites);
    isAdded = true;

    if (window.showSuccessToast) {
      window.showSuccessToast({ title: "تمت الإضافة", message: "تم إضافته بنجاح إلى قائمة المفضلة" });
    }
  }

  // Update Favorites page if open
  const favPage = document.getElementById("favoritesPage");
  if (favPage && !favPage.classList.contains("hidden")) {
    renderFavoritesPage();
  }

  return isAdded;
}

/**
 * Remove favorite with optional confirmation
 */
export async function removeFromFavorites(type, id, itemTitle = "العنصر") {
  const confirmed = await (window.showConfirmDialog
    ? window.showConfirmDialog({
        title: "تأكيد الحذف من المفضلة",
        message: `هل أنت متأكد من رغبتك في حذف "${itemTitle}" من قائمة المفضلة؟`,
        confirmText: "حذف",
        cancelText: "إلغاء",
        danger: true
      })
    : Promise.resolve(
        typeof window.confirm === "function"
          ? window.confirm(`هل أنت متأكد من رغبتك في حذف "${itemTitle}" من قائمة المفضلة؟`)
          : true
      ));

  if (!confirmed) return;

  let favorites = getFavorites();
  favorites = favorites.filter((item) => !(item.type === type && String(item.id) === String(id)));
  saveFavorites(favorites);

  if (window.showSuccessToast) {
    window.showSuccessToast({ title: "تمت الإزالة", message: "تم حذف العنصر من المفضلة" });
  }

  renderFavoritesPage();
}

/**
 * Update stats counters at top of Favorites page
 */
export function updateFavoritesStats() {
  const favorites = getFavorites();
  const totalCount = favorites.length;
  const coursesCount = favorites.filter((i) => i.type === "course").length;
  const booksCount = favorites.filter((i) => i.type === "book").length;
  const totalPrice = favorites.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const favTotalCountEl = document.getElementById("favTotalCount");
  const favCoursesCountEl = document.getElementById("favCoursesCount");
  const favBooksCountEl = document.getElementById("favBooksCount");
  const favTotalPriceEl = document.getElementById("favTotalPrice");

  if (favTotalCountEl) favTotalCountEl.textContent = totalCount;
  if (favCoursesCountEl) favCoursesCountEl.textContent = coursesCount;
  if (favBooksCountEl) favBooksCountEl.textContent = booksCount;
  if (favTotalPriceEl) favTotalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;
}

/**
 * Update View Mode Toggle Buttons UI
 */
export function updateViewModeButtonsUI() {
  const gridBtn = document.getElementById("favViewGridBtn");
  const listBtn = document.getElementById("favViewListBtn");

  if (gridBtn) {
    if (currentViewMode === "grid") {
      gridBtn.classList.add("active");
      gridBtn.setAttribute("aria-pressed", "true");
    } else {
      gridBtn.classList.remove("active");
      gridBtn.setAttribute("aria-pressed", "false");
    }
  }

  if (listBtn) {
    if (currentViewMode === "list") {
      listBtn.classList.add("active");
      listBtn.setAttribute("aria-pressed", "true");
    } else {
      listBtn.classList.remove("active");
      listBtn.setAttribute("aria-pressed", "false");
    }
  }
}

/**
 * Render complete Favorites page
 */
export function renderFavoritesPage(options = {}) {
  // Close sidebars and drawers if open
  if (typeof window.closeAllSidebars === "function") {
    window.closeAllSidebars();
  } else {
    const profileSidebar = document.getElementById("profileSidebar");
    if (profileSidebar) profileSidebar.classList.remove("show", "active");
  }

  // Hide modals & other sections
  const studentPurchasesModal = document.getElementById("studentPurchasesModal");
  if (studentPurchasesModal) studentPurchasesModal.remove();

  if (typeof window.hideAllMainSections === "function") {
    window.hideAllMainSections();
  } else {
    const hero = document.querySelector(".hero");
    const features = document.querySelector(".features");
    const coursesSection = document.getElementById("coursesSection") || document.querySelector(".courses");
    const booksSection = document.getElementById("books");
    const editProfilePage = document.getElementById("editProfilePage");
    const myCoursesPage = document.getElementById("myCoursesPage");
    const myBooksPage = document.getElementById("myBooksPage");
    const purchasesPage = document.getElementById("purchasesPage");

    if (hero) hero.classList.add("hidden");
    if (features) features.classList.add("hidden");
    if (coursesSection) coursesSection.classList.add("hidden");
    if (booksSection) booksSection.classList.add("hidden");
    if (editProfilePage) editProfilePage.classList.add("hidden");
    if (myCoursesPage) myCoursesPage.classList.add("hidden");
    if (myBooksPage) myBooksPage.classList.add("hidden");
    if (purchasesPage) purchasesPage.classList.add("hidden");
  }

  // Show favorites section
  const favoritesPage = document.getElementById("favoritesPage");
  if (favoritesPage) {
    favoritesPage.classList.remove("hidden");
  }

  if (window.location.hash !== "#student/favorites") {
    window.location.hash = "#student/favorites";
  }

  updateFavoritesStats();
  updateViewModeButtonsUI();

  const favoritesGrid = document.getElementById("favoritesGrid");
  const emptyState = document.getElementById("favoritesEmptyState");
  const paginationContainer = document.getElementById("favoritesPagination");

  if (!favoritesGrid) return;

  let favorites = getFavorites();

  // 1. Filter by category
  if (currentCategoryFilter === "courses") {
    favorites = favorites.filter((item) => item.type === "course");
  } else if (currentCategoryFilter === "books") {
    favorites = favorites.filter((item) => item.type === "book");
  }

  // 2. Filter by search query (Title, Instructor/Author, Category, Type)
  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.toLowerCase().trim();
    favorites = favorites.filter((item) => {
      const titleMatch = item.title && item.title.toLowerCase().includes(q);
      const authorMatch = item.author && item.author.toLowerCase().includes(q);
      const instructorMatch = item.instructor && item.instructor.toLowerCase().includes(q);
      const categoryMatch = item.category && item.category.toLowerCase().includes(q);
      const typeMatch =
        item.type &&
        (item.type.toLowerCase().includes(q) ||
          (item.type === "course" && ("دورة".includes(q) || "دورات".includes(q) || "course".includes(q))) ||
          (item.type === "book" && ("كتاب".includes(q) || "كتب".includes(q) || "book".includes(q))));
      return titleMatch || authorMatch || instructorMatch || categoryMatch || typeMatch;
    });
  }

  // 3. Sort
  favorites.sort((a, b) => {
    if (currentSortMode === "newest") {
      return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
    } else if (currentSortMode === "oldest") {
      return new Date(a.addedAt || 0) - new Date(b.addedAt || 0);
    } else if (currentSortMode === "price-low") {
      return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    } else if (currentSortMode === "price-high") {
      return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    } else if (currentSortMode === "rating-high") {
      return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
    } else if (currentSortMode === "rating-low") {
      return (parseFloat(a.rating) || 0) - (parseFloat(b.rating) || 0);
    } else if (currentSortMode === "alphabetical" || currentSortMode === "a-z") {
      return (a.title || "").localeCompare(b.title || "", "ar");
    } else if (currentSortMode === "alphabetical-reverse" || currentSortMode === "z-a") {
      return (b.title || "").localeCompare(a.title || "", "ar");
    }
    return 0;
  });

  // Apply View Mode
  if (currentViewMode === "list") {
    favoritesGrid.classList.add("favorites-list-view", "list-view");
  } else {
    favoritesGrid.classList.remove("favorites-list-view", "list-view");
  }

  // Handle Empty State
  if (favorites.length === 0) {
    favoritesGrid.innerHTML = "";
    favoritesGrid.style.display = "none";
    if (emptyState) emptyState.classList.remove("hidden");
    if (paginationContainer) paginationContainer.innerHTML = "";
    return;
  } else {
    favoritesGrid.style.display = "";
    if (emptyState) emptyState.classList.add("hidden");
  }

  // Pagination
  const totalPages = Math.ceil(favorites.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = favorites.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Render items
  favoritesGrid.innerHTML = pageItems
    .map((item) => renderFavoriteCardHTML(item))
    .join("");

  // Render pagination controls
  renderPaginationHTML(paginationContainer, totalPages, currentPage);

  if (!options || !options.preserveScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

/**
 * Render single favorite card HTML
 */
function renderFavoriteCardHTML(item) {
  const isCourse = item.type === "course";
  const badgeLabel = isCourse ? "دورة" : "كتاب";
  const badgeClass = isCourse ? "course-badge" : "book-badge";
  const safeTitle = (item.title || "").replace(/'/g, "\\'");
  const detailsFn = isCourse
    ? `if(window.showCourseDetails) window.showCourseDetails('${item.id}'); else window.location.hash='#course/${item.id}';`
    : `if(window.showBookDetails) window.showBookDetails('${item.id}'); else window.location.hash='#book/${item.id}';`;

  // Thumbnail rendering
  let thumbHTML = "";
  if (item.thumbStyle) {
    if (item.thumbStyle === "python-bg") {
      thumbHTML = `<div class="thumb-img python-bg"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`;
    } else if (item.thumbStyle === "uiux-bg") {
      thumbHTML = `<div class="thumb-img uiux-bg"><div class="uiux-cover-text"><h4>UI/UX</h4><p>DESIGN</p></div></div>`;
    } else if (item.thumbStyle === "react-bg") {
      thumbHTML = `<div class="thumb-img react-bg"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#61dafbaa" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"/></svg></div>`;
    } else if (item.thumbStyle === "ts-bg") {
      thumbHTML = `<div class="thumb-img ts-bg"><div class="ts-cover-text"><h4>TYPESCRIPT</h4></div></div>`;
    } else if (item.thumbStyle === "node-bg") {
      thumbHTML = `<div class="thumb-img node-bg"><div class="node-cover-text"><h4>NODE.JS</h4></div></div>`;
    } else {
      thumbHTML = `<div class="thumb-img python-bg"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>`;
    }
  } else if (item.coverClass) {
    thumbHTML = `<div class="thumb-img ${item.coverClass}"><div class="book-cover-text"><h4>${item.coverTitle || "BOOK"}</h4><p>${item.coverAuthor || ""}</p></div></div>`;
  } else if (item.image) {
    thumbHTML = `<div class="thumb-img" style="background-image: url('${item.image}'); background-size: cover; background-position: center;"></div>`;
  } else {
    thumbHTML = `<div class="thumb-img ${isCourse ? "python-bg" : "book-cover-1"}"><div class="book-cover-text"><h4>${item.title}</h4></div></div>`;
  }

  // Meta info
  const metaText = isCourse
    ? `${(item.studentsCount || 1000).toLocaleString("ar-EG")} طالب • ${item.lessonsCount || 30} درس`
    : `كتاب إلكتروني • ${item.pagesCount || 200} صفحة`;

  // Primary action button
  const actionButton = isCourse
    ? `<button type="button" class="btn-primary-action btn-purple" onclick="${detailsFn}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        عرض الدورة
       </button>`
    : `<button type="button" class="btn-primary-action btn-orange" onclick="${detailsFn}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        عرض الكتاب
       </button>`;

  const starsString = "★".repeat(Math.round(item.rating || 4.8)) + "☆".repeat(5 - Math.round(item.rating || 4.8));

  return `
    <div class="favorite-card" data-type="${item.type}" data-id="${item.id}">
      <div class="card-thumb-wrapper" onclick="${detailsFn}" style="cursor: pointer;">
        <span class="type-badge ${badgeClass}">${badgeLabel}</span>
        <button type="button" class="heart-badge-btn" title="حذف من المفضلة" onclick="event.stopPropagation(); removeFromFavorites('${item.type}', '${item.id}', '${safeTitle}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
        ${thumbHTML}
      </div>
      <div class="card-body">
        <h3 class="card-title" onclick="${detailsFn}" style="cursor: pointer;">${item.title}</h3>
        <div class="card-author-line">
          ${isCourse ? '<span class="author-avatar"></span>' : ""}
          <span class="author-name ${isCourse ? "" : "text-gray"}">${isCourse ? (item.author || item.instructor || "محاضر") : `المؤلف: ${item.author || "مؤلف"}`}</span>
        </div>
        <div class="card-rating-line">
          <span class="stars">${starsString}</span>
          <span class="rating-num">${item.rating || "4.8"}</span>
          <span class="rating-count">(${(item.ratingCount || 500).toLocaleString("ar-EG")})</span>
        </div>
        <div class="card-meta">${metaText}</div>
        <div class="card-price">$${(parseFloat(item.price) || 0).toFixed(2)}</div>
        <div class="card-actions">
          <button type="button" class="btn-trash-action" title="حذف من المفضلة" onclick="event.stopPropagation(); removeFromFavorites('${item.type}', '${item.id}', '${safeTitle}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
          ${actionButton}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render pagination controls
 */
function renderPaginationHTML(container, totalPages, page) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<button type="button" class="fav-page-btn" ${page === 1 ? "disabled" : ""} onclick="changeFavoritesPage(${page - 1})">السابق</button>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="fav-page-btn ${i === page ? "active" : ""}" onclick="changeFavoritesPage(${i})">${i}</button>`;
  }

  html += `<button type="button" class="fav-page-btn" ${page === totalPages ? "disabled" : ""} onclick="changeFavoritesPage(${page + 1})">التالي</button>`;

  container.innerHTML = html;
}

/**
 * Controls Handlers
 */
export function filterFavoritesTab(btn, category) {
  const pills = document.querySelectorAll("#favoritesFilterGroup .filter-pill");
  pills.forEach((p) => p.classList.remove("active"));
  if (btn) btn.classList.add("active");

  currentCategoryFilter = category;
  currentPage = 1;
  renderFavoritesPage();
}

export function searchFavorites(query) {
  currentSearchQuery = query || "";
  currentPage = 1;
  renderFavoritesPage();
}

export function sortFavorites(sortMode) {
  currentSortMode = sortMode;
  currentPage = 1;
  renderFavoritesPage();
}

export function setFavoritesViewMode(mode) {
  currentViewMode = mode === "list" ? "list" : "grid";
  try {
    localStorage.setItem(FAVORITES_VIEW_MODE_KEY, currentViewMode);
  } catch (e) {
    console.error("Error saving view mode to localStorage", e);
  }

  updateViewModeButtonsUI();
  renderFavoritesPage({ preserveScroll: true });
}

export function changeFavoritesPage(page) {
  currentPage = page;
  renderFavoritesPage({ preserveScroll: true });
}

/**
 * Update Heart Buttons across course cards and book cards in the app
 */
export function updateAllHeartButtonsUI() {
  const favorites = getFavorites();

  // Update navbar badge counter if exists
  const navFavBadge = document.getElementById("navFavBadge") || document.getElementById("favoritesBadge");
  if (navFavBadge) {
    navFavBadge.textContent = favorites.length;
    navFavBadge.style.display = favorites.length > 0 ? "inline-flex" : "none";
  }
}

// Global scope attachment for HTML inline attributes and event listeners
if (typeof window !== "undefined") {
  window.getFavorites = getFavorites;
  window.isFavorite = isFavorite;
  window.toggleFavorite = toggleFavorite;
  window.removeFromFavorites = removeFromFavorites;
  window.renderFavoritesPage = renderFavoritesPage;
  window.filterFavoritesTab = filterFavoritesTab;
  window.searchFavorites = searchFavorites;
  window.sortFavorites = sortFavorites;
  window.setFavoritesViewMode = setFavoritesViewMode;
  window.changeFavoritesPage = changeFavoritesPage;
  window.updateViewModeButtonsUI = updateViewModeButtonsUI;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateViewModeButtonsUI);
  } else {
    updateViewModeButtonsUI();
  }

  window.addEventListener("favoritesUpdated", () => {
    updateFavoritesStats();
    updateAllHeartButtonsUI();
    const favPage = document.getElementById("favoritesPage");
    if (favPage && !favPage.classList.contains("hidden")) {
      renderFavoritesPage({ preserveScroll: true });
    }
  });

  window.addEventListener("storage", (e) => {
    if (e.key === FAVORITES_VIEW_MODE_KEY) {
      currentViewMode = getStoredViewMode();
      updateViewModeButtonsUI();
      const favPage = document.getElementById("favoritesPage");
      if (favPage && !favPage.classList.contains("hidden")) {
        renderFavoritesPage({ preserveScroll: true });
      }
    } else if (e.key === FAVORITES_STORAGE_KEY) {
      updateFavoritesStats();
      updateAllHeartButtonsUI();
      const favPage = document.getElementById("favoritesPage");
      if (favPage && !favPage.classList.contains("hidden")) {
        renderFavoritesPage({ preserveScroll: true });
      }
    }
  });
}
