import { booksData } from "../data/books.js";
import { isFavorite, toggleFavorite } from "./favoritesService.js";
import { saveBookFileToIDB, getBookFileFromIDB } from "../utils/pdfStorage.js";

// Dedicated Service for My Books ("كتبي") Full Page

export function renderBookDetailsUI(book, containerElement) {
  if (!book || !containerElement) return;

  const userRole = (window.appState && window.appState.userRole) || (window.getCurrentUserRole ? window.getCurrentUserRole() : "student");
  const isOwnerUser = userRole === "owner" || userRole === "admin";
  const ownedBooks = (typeof getUserPurchasedBooks === "function") ? getUserPurchasedBooks() : [];
  const isPurchased = ownedBooks.some((b) => String(b.id) === String(book.id));
  const hasAccess = isOwnerUser || userRole === "teacher" || isPurchased;

  const favState = isFavorite("book", book.id);
  const oldPrice = book.discountPrice ? book.price : Math.round((book.price || 30) * 1.3);
  const finalPrice = book.discountPrice || book.price || 30;

  const displayReviews = (book.reviews && book.reviews.length > 0) ? book.reviews : [
    { studentName: "محمود حسن", rating: 5, date: "2026-02-10", comment: "كتاب رائع جداً وأسلوب الشرح مبسط وعملي ونافع." },
    { studentName: "عبدالله العتيبي", rating: 5, date: "2026-03-01", comment: "من أروع الكتب القيمة والمفيدة للغاية، شكراً للمؤلف." }
  ];

  containerElement.innerHTML = `
    <div class="official-book-details-wrapper" dir="rtl" style="max-width: 1200px; margin: 0 auto; padding: 24px 20px;">
      
      <!-- 1. Breadcrumb -->
      <div class="book-details-breadcrumb-bar" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary, #64748b); margin-bottom: 20px;">
        <a href="#home" onclick="event.preventDefault(); window.location.hash='#home'; if(window.showHomePage) window.showHomePage();" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 600;">الرئيسية</a>
        <span>&gt;</span>
        <a href="#books" onclick="event.preventDefault(); window.location.hash='#books'; if(window.showBooksPage) window.showBooksPage();" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 600;">الكتب الإلكترونية</a>
        <span>&gt;</span>
        <span style="color: var(--text-primary, #0f172a); font-weight: 700;">${book.title}</span>
      </div>

      <!-- 2. Back Button -->
      <div style="margin-bottom: 24px;">
        <button type="button" class="btn btn-secondary" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else if(window.showBooksPage) window.showBooksPage(); else window.history.back();" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 10px 18px; border-radius: 10px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer; transition: all 0.2s ease;">
          ← العودة إلى قائمة الكتب
        </button>
      </div>

      <!-- Main Layout Grid -->
      <div class="book-details-main-grid" style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;">
        
        <!-- RIGHT COLUMN: Book Primary Content -->
        <div class="book-details-primary-col" style="display: flex; flex-direction: column; gap: 32px;">
          
          <!-- Hero Banner -->
          <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 20px; overflow: hidden; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); display: flex; gap: 28px; flex-wrap: wrap;">
            <div style="width: 200px; height: 280px; flex-shrink: 0; border-radius: 12px; overflow: hidden; background-image: url('${book.image || book.cover}'); background-size: cover; background-position: center; border: 1px solid var(--border-color, #e2e8f0); box-shadow: 0 10px 25px rgba(0,0,0,0.15); position: relative;">
            </div>

            <div style="flex: 1; min-width: 260px; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
                  <span style="background: #f3e8ff; color: #7c3aed; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">📚 كتاب إلكتروني</span>
                  <span style="background: #f1f5f9; color: #475569; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">${book.category || 'عام'}</span>
                  ${book.subCategory ? `<span style="background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">${book.subCategory}</span>` : ''}
                </div>

                <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 12px 0; line-height: 1.4;">${book.title}</h1>
                
                <div style="font-size: 15px; color: var(--text-secondary, #64748b); font-weight: 700; margin-bottom: 16px;">
                  <span>المؤلف: </span>
                  <span style="color: var(--text-primary, #0f172a);">${book.author}</span>
                  ${book.publisher ? `<span style="margin: 0 8px;">•</span><span>دار النشر: ${book.publisher}</span>` : ''}
                </div>

                <p style="font-size: 14px; color: var(--text-secondary, #475569); line-height: 1.7; margin-bottom: 20px;">
                  ${book.shortDescription || book.fullDescription || 'كتاب إلكتروني شامل يقدم رؤية عميقة وعملية في مجاله.'}
                </p>
              </div>

              <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 20px; font-size: 14px; color: var(--text-secondary, #64748b); border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 16px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #f59e0b; font-weight: 800; font-size: 16px;">⭐ ${book.rating || '4.9'}</span>
                  <span style="font-size: 12px; color: var(--text-secondary, #64748b);">(${book.reviewsCount || displayReviews.length} تقييم)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
                  <span>📥</span>
                  <span>${(book.downloads || book.purchases || 450).toLocaleString("ar-EG")} تحميلة</span>
                </div>
                ${book.language ? `<div style="display: flex; align-items: center; gap: 6px; font-weight: 600;"><span>🌐</span><span>${book.language}</span></div>` : ''}
              </div>
            </div>
          </div>

          <!-- Book Metadata Specifications Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px;">
            <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">📄</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">${book.pages || 250}</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">عدد الصفحات</div>
            </div>
            <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">⏱️</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">${book.readingTime || '6 ساعات'}</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">وقت القراءة المتوقع</div>
            </div>
            <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">📖</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">${book.edition || '2024'}</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">الطبعة / الإصدار</div>
            </div>
            <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">🔖</div>
              <div style="font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a); word-break: break-all;">${book.isbn || '978-3-16'}</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">رقم المعيار الدولي (ISBN)</div>
            </div>
          </div>

          <!-- Description Section -->
          <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 16px 0; display: flex; align-items: center; gap: 10px;">
              <span>📖</span> نبذة عن الكتاب
            </h2>
            <p style="font-size: 15px; color: var(--text-secondary, #475569); line-height: 1.8; margin: 0;">
              ${book.fullDescription || book.shortDescription || 'يقدم هذا الكتاب دراسة شاملة ومفصلة في مجاله، مع أمثلة وتطبيقات عملية قابلة للتنفيذ المباشر.'}
            </p>
          </div>

          <!-- Reviews Section -->
          <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
              <span>💬</span> تقييمات القراء (${displayReviews.length})
            </h2>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              ${displayReviews.map(r => `
                <div style="padding: 16px; border-radius: 12px; background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #f1f5f9);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 700; font-size: 14px; color: var(--text-primary, #0f172a);">${r.studentName || 'قارئ'}</div>
                    <div style="color: #f59e0b; font-size: 14px;">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
                  </div>
                  <p style="font-size: 13px; color: var(--text-secondary, #475569); margin: 0; line-height: 1.6;">${r.comment || r.reviewText || ''}</p>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- LEFT COLUMN: Sidebar Actions -->
        <div class="book-details-sidebar-col" style="position: sticky; top: 90px;">
          <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
            
            <div style="margin-bottom: 20px; text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color, #e2e8f0);">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
                <span style="font-size: 32px; font-weight: 900; color: var(--primary-color, #7c3aed);">$${finalPrice}</span>
                ${book.discountPrice ? `<span style="font-size: 18px; text-decoration: line-through; color: var(--text-secondary, #94a3b8); font-weight: 600;">$${book.price}</span>` : ''}
              </div>
              <div style="font-size: 12px; color: #059669; font-weight: 700;">⚡ تحميل فوري بتنسيق PDF وقراءة سلسة</div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
              ${hasAccess ? `
                <button type="button" class="btn btn-primary" onclick="if(window.openBookReader) window.openBookReader('${book.id}');" style="width: 100%; padding: 14px; font-weight: 800; font-size: 16px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                  📖 قراءة الكتاب الآن ${isOwnerUser ? '(وصول المالك)' : ''}
                </button>
              ` : `
                <button type="button" class="btn btn-primary" onclick="if(window.addBookToCart) window.addBookToCart(${book.id}); else if(window.addToCart) window.addToCart(${book.id});" style="width: 100%; padding: 14px; font-weight: 800; font-size: 16px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
                  🛒 إضافة الكتاب إلى السلة ($${finalPrice})
                </button>
              `}

              <div style="display: flex; gap: 8px;">
                <button type="button" onclick="if(window.toggleFavorite) window.toggleFavorite('book', { id: ${book.id}, title: '${(book.title || '').replace(/'/g, "\\'")}', author: '${(book.author || '').replace(/'/g, "\\'")}', price: ${finalPrice}, image: '${book.image || ''}' });" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; font-weight: 700; font-size: 13px; border-radius: 10px; background: transparent; border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${favState ? '#ef4444' : 'none'}" stroke="${favState ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  <span>${favState ? 'في المفضلة' : 'إضافة للمفضلة'}</span>
                </button>
              </div>

              <button type="button" id="bookDetailsPreviewBtn" onclick="if(window.openBookPreview) window.openBookPreview('${book.id}');" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; font-weight: 700; font-size: 14px; border-radius: 10px; background: var(--bg-secondary, #f8fafc); border: 1px solid var(--primary-color, #7c3aed); color: var(--primary-color, #7c3aed); cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.08);" onmouseover="this.style.background='#f3e8ff'" onmouseout="this.style.background='var(--bg-secondary, #f8fafc)'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>معاينة الكتاب</span>
              </button>
            </div>

            <div>
              <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 12px 0;">مميزات شراء هذا الكتاب:</h4>
              <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary, #475569);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>📱</span> <span>ملف PDF متوافق مع كافة الأجهزة</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>📥</span> <span>تحميل مباشر بعد الشراء فوراً</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>♾️</span> <span>ملكية وحفظ دائم مدى الحياة</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>🔖</span> <span>طباعة شخصية مرخصة</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;
}

export function showBookDetails(bookId) {
  const targetId = String(bookId);
  const baseList = window.booksData || booksData || [];
  let customBooks = [];
  try {
    const storedCustom = localStorage.getItem("studymart_custom_books");
    if (storedCustom) customBooks = JSON.parse(storedCustom);
  } catch (e) {}
  const list = [...baseList, ...(Array.isArray(customBooks) ? customBooks : [])];
  const book = list.find((b) => String(b.id) === targetId);

  if (!book) {
    if (typeof window !== "undefined" && typeof window.showCustomAlert === "function") {
      window.showCustomAlert("لم يتم العثور على الكتاب المطلوب");
    }
    return;
  }

  if (typeof window !== "undefined" && typeof window.hideAllMainSections === "function") {
    window.hideAllMainSections();
  }

  const page = document.getElementById("bookDetailsPage");
  const detailsContainer = document.getElementById("bookDetailsContent") || document.getElementById("bookDetails");
  if (!page || !detailsContainer) return;

  page.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (!window.location.hash.includes(`book-details/${book.id}`)) {
    window.location.hash = `#book-details/${book.id}`;
  }

  renderBookDetailsUI(book, detailsContainer);
}

// Dedicated Service for My Books ("كتبي") Full Page

let currentMyBooksFilter = "all";
let currentMyBooksSearchQuery = "";
let currentMyBooksSortMode = "recently_read";
let activeBookDetailsId = "202";

/**
 * Get current student identity string
 */
export function getStudentId() {
  if (typeof window !== "undefined") {
    if (window.appState?.userData?.email && String(window.appState.userData.email).trim() !== "") {
      return String(window.appState.userData.email).trim().toLowerCase();
    }
    if (window.appState?.user?.id) {
      return String(window.appState.user.id).trim();
    }
    if (window.appState?.userData?.name && String(window.appState.userData.name).trim() !== "") {
      return String(window.appState.userData.name).trim().toLowerCase().replace(/\s+/g, "_");
    }
    try {
      const stored = localStorage.getItem("currentUser") || localStorage.getItem("studymart_current_user") || localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) return String(u.email).trim().toLowerCase();
        if (u.id) return String(u.id).trim();
      }
    } catch (e) {}
  }
  return "student_default";
}

/**
 * Bookmark Management
 */
export function getBookBookmarks(bookId) {
  const studentId = getStudentId();
  const bId = String(bookId);

  try {
    const raw = localStorage.getItem("studymart_bookmarks");
    if (raw) {
      const map = JSON.parse(raw);
      if (map[studentId] && typeof map[studentId] === "object" && Array.isArray(map[studentId][bId])) {
        return map[studentId][bId];
      }
      if (studentId !== "student_default" && map["student_default"] && typeof map["student_default"] === "object" && Array.isArray(map["student_default"][bId])) {
        return map["student_default"][bId];
      }
      if (Array.isArray(map[bId])) {
        return map[bId];
      }
    }
  } catch (e) {
    console.error("Error reading bookmarks:", e);
  }

  return [];
}

export function saveBookBookmarks(bookId, bookmarks) {
  const studentId = getStudentId();
  const bId = String(bookId);

  try {
    const raw = localStorage.getItem("studymart_bookmarks");
    const map = raw ? JSON.parse(raw) : {};

    if (!map[studentId] || typeof map[studentId] !== "object") {
      map[studentId] = {};
    }

    const formatted = (Array.isArray(bookmarks) ? bookmarks : []).map((bm) => ({
      id: bm.id || ("bm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6)),
      bookId: bId,
      studentId: studentId,
      page: Number(bm.page) || 1,
      title: bm.title || `علامة - صفحة ${bm.page || 1}`,
      date: bm.date || new Date().toISOString().split("T")[0]
    }));

    map[studentId][bId] = formatted;
    localStorage.setItem("studymart_bookmarks", JSON.stringify(map));
  } catch (e) {
    console.error("Error saving bookmarks:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bookmarksUpdated"));
  }
}

export function addBookmark(bookId, page, title) {
  const studentId = getStudentId();
  const bId = String(bookId);
  const pNum = Number(page) || 1;
  const list = getBookBookmarks(bId);

  const existingIdx = list.findIndex((b) => Number(b.page) === pNum);

  if (existingIdx !== -1) {
    const existingBm = list[existingIdx];
    const isDefaultTitle = !title || title.startsWith("علامة مرجعية - صفحة") || title.startsWith("علامة - صفحة");

    if (!isDefaultTitle && title !== existingBm.title) {
      list[existingIdx].title = title;
      list[existingIdx].date = new Date().toISOString().split("T")[0];
      saveBookBookmarks(bId, list);
      if (window.showSuccessToast) {
        window.showSuccessToast({ title: "علامة مرجعية", message: "تم تحديث العنوان المرجعي بنجاح" });
      }
      return { action: "updated", item: list[existingIdx] };
    } else {
      list.splice(existingIdx, 1);
      saveBookBookmarks(bId, list);
      if (window.showSuccessToast) {
        window.showSuccessToast({ title: "علامة مرجعية", message: "تمت إزالة العلامة المرجعية من الصفحة" });
      }
      return { action: "removed" };
    }
  } else {
    const newItem = {
      id: "bm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      bookId: bId,
      studentId: studentId,
      page: pNum,
      title: title || `علامة مرجعية - صفحة ${pNum}`,
      date: new Date().toISOString().split("T")[0]
    };
    list.unshift(newItem);
    saveBookBookmarks(bId, list);
    if (window.showSuccessToast) {
      window.showSuccessToast({ title: "علامة مرجعية", message: "تمت إضافة العلامة المرجعية بنجاح" });
    }
    return { action: "added", item: newItem };
  }
}

export function deleteBookmark(bookId, bookmarkId) {
  const bId = String(bookId);
  let list = getBookBookmarks(bId);
  list = list.filter((b) => String(b.id) !== String(bookmarkId));
  saveBookBookmarks(bId, list);
  if (window.showSuccessToast) {
    window.showSuccessToast({ title: "علامة مرجعية", message: "تمت إزالة العلامة المرجعية بنجاح" });
  }
}

/**
 * Notes Management
 */
export function getBookNotes(bookId) {
  const studentId = getStudentId();
  const bId = String(bookId);

  try {
    const raw = localStorage.getItem("studymart_notes");
    if (raw) {
      const map = JSON.parse(raw);
      if (map[studentId] && typeof map[studentId] === "object" && map[studentId][bId] !== undefined) {
        if (Array.isArray(map[studentId][bId])) {
          return map[studentId][bId];
        }
      }
      if (map[bId] !== undefined && Array.isArray(map[bId])) {
        return map[bId];
      }
    }
  } catch (e) {
    console.error("Error reading notes:", e);
  }

  const defaultMap = {
    "201": [
      { id: "nt_1", page: 15, text: "مفهوم الـ Scope في ES6 يختلف تماماً عن var التقليدية.", date: "2026-02-15", bookId: "201", studentId }
    ],
    "202": [
      { id: "nt_1", page: 12, text: "الرغبة هي المحرك الأساسي لكل إنجاز كبير يسعى له العقل البشري.", date: "2026-03-01", bookId: "202", studentId },
      { id: "nt_2", page: 45, text: "اكتب هدفك المالي بدقة وحدد تاريخاً واضحاً لتحقيقه يومياً.", date: "2026-03-05", bookId: "202", studentId },
      { id: "nt_3", page: 128, text: "ملاحظة تطبيقية: التكرار اليومي يعزز القناعة في العقل الباطن.", date: "2026-03-10", bookId: "202", studentId }
    ],
    "203": [
      { id: "nt_1", page: 30, text: "الفرق بين الأصول والالتزامات هو أهم قاعدة مالية لبناء الثروة.", date: "2026-03-02", bookId: "203", studentId }
    ],
    "204": [
      { id: "nt_1", page: 20, text: "لا تنتقد أو تدن أو تشتكِ عند التعامل مع الآخرين لكسب محبتهم.", date: "2026-03-04", bookId: "204", studentId }
    ]
  };

  return defaultMap[bId] || [];
}

export function saveBookNotes(bookId, notes) {
  const studentId = getStudentId();
  const bId = String(bookId);

  try {
    const raw = localStorage.getItem("studymart_notes");
    const map = raw ? JSON.parse(raw) : {};

    if (!map[studentId] || typeof map[studentId] !== "object") {
      map[studentId] = {};
    }

    const formatted = (Array.isArray(notes) ? notes : []).map((nt) => ({
      ...nt,
      bookId: bId,
      studentId: studentId
    }));

    map[studentId][bId] = formatted;
    localStorage.setItem("studymart_notes", JSON.stringify(map));
  } catch (e) {
    console.error("Error saving notes:", e);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notesUpdated"));
  }
}

export function addNote(bookId, page, text) {
  const studentId = getStudentId();
  const bId = String(bookId);
  const pNum = Number(page) || 1;
  const list = getBookNotes(bId);

  const newItem = {
    id: "nt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    bookId: bId,
    studentId: studentId,
    page: pNum,
    text: text || "ملاحظة جديدة",
    date: new Date().toISOString().split("T")[0]
  };

  list.unshift(newItem);
  saveBookNotes(bId, list);

  if (window.showSuccessToast) {
    window.showSuccessToast({ title: "ملاحظات الكتاب", message: "تمت إضافة الملاحظة بنجاح" });
  }

  return newItem;
}

export function deleteNote(bookId, noteId) {
  const bId = String(bookId);
  let list = getBookNotes(bId);
  list = list.filter((n) => String(n.id) !== String(noteId));
  saveBookNotes(bId, list);
}

/**
 * Sanitize a book object for storing in userPurchasedBooks or localStorage,
 * stripping heavy properties (like large base64 data URLs) to prevent QuotaExceededError.
 */
export function sanitizeBookForStorage(book) {
  if (!book) return null;
  if (typeof book !== "object") return book;

  const { fileDataUrl, previewFileDataUrl, fileBlob, pdfData, content, ...clean } = book;

  if (clean.image && typeof clean.image === "string" && clean.image.length > 2000 && clean.image.startsWith("data:")) {
    delete clean.image;
  }
  if (clean.coverUrl && typeof clean.coverUrl === "string" && clean.coverUrl.length > 2000 && clean.coverUrl.startsWith("data:")) {
    delete clean.coverUrl;
  }

  return clean;
}

/**
 * Safely save userPurchasedBooks array to localStorage without exceeding quota.
 */
export function saveUserPurchasedBooks(raw) {
  if (!Array.isArray(raw)) return;
  const sanitized = raw.map(sanitizeBookForStorage).filter(Boolean);

  if (typeof window !== "undefined" && window.appState) {
    window.appState.userPurchasedBooks = sanitized;
  }

  try {
    localStorage.setItem("userPurchasedBooks", JSON.stringify(sanitized));
  } catch (quotaErr) {
    console.warn("Storage quota exceeded in saveUserPurchasedBooks, saving IDs only...", quotaErr);
    try {
      const idList = sanitized.map((b) => (typeof b === "object" ? b.id : b)).filter(Boolean);
      localStorage.setItem("userPurchasedBooks", JSON.stringify(idList));
    } catch (e2) {
      console.error("Critical storage error for userPurchasedBooks:", e2);
    }
  }
}

/**
 * Fetch list of books owned by the user
 */
export function getUserPurchasedBooks() {
  const booksList = window.booksData || booksData || [];
  let customBooks = [];
  try {
    const storedCustom = localStorage.getItem("studymart_custom_books");
    if (storedCustom) customBooks = JSON.parse(storedCustom);
  } catch (e) {}

  const allBooks = [...booksList, ...(Array.isArray(customBooks) ? customBooks : [])];
  let raw = [];

  if (typeof window !== "undefined" && window.appState && Array.isArray(window.appState.userPurchasedBooks) && window.appState.userPurchasedBooks.length > 0) {
    raw = window.appState.userPurchasedBooks;
  } else {
    try {
      const stored = localStorage.getItem("userPurchasedBooks");
      if (stored !== null) {
        raw = JSON.parse(stored);
      } else {
        // First load initialization: seed with default books for student
        raw = booksList.slice(0, 4);
      }
    } catch (e) {
      console.error("Error reading userPurchasedBooks", e);
    }
  }

  if (!Array.isArray(raw)) raw = [];

  // Always sanitize and re-save to keep localStorage clean & compact
  saveUserPurchasedBooks(raw);

  return raw.map((item) => {
    const id = typeof item === "object" ? item.id : item;
    const fullBook = allBooks.find((b) => String(b.id) === String(id));
    if (fullBook) {
      const itemObj = typeof item === "object" ? item : {};
      const merged = { ...fullBook, ...itemObj };
      if (fullBook.fileDataUrl) merged.fileDataUrl = fullBook.fileDataUrl;
      if (fullBook.fileUrl) merged.fileUrl = fullBook.fileUrl;
      if (fullBook.previewFileDataUrl) merged.previewFileDataUrl = fullBook.previewFileDataUrl;
      if (fullBook.previewFileUrl) merged.previewFileUrl = fullBook.previewFileUrl;
      return merged;
    }
    return typeof item === "object" ? item : { id: item, title: `كتاب ${item}`, author: "غير معروف", pages: 200, category: "عام" };
  });
}

/**
 * Get reading progress map from localStorage
 */
function getReadingProgressMap() {
  const studentId = getStudentId();
  try {
    const raw = localStorage.getItem("studymart_reading_progress");
    if (raw) {
      const map = JSON.parse(raw);
      if (map[studentId] && typeof map[studentId] === "object") {
        return map[studentId];
      }
      if (!map[studentId] && (map["201"] || map["202"])) {
        return map;
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Initial seed reading progress
  const defaultProgress = {
    "201": { currentPage: 156, totalPages: 240, lastRead: new Date(Date.now() - 3 * 86400000).toISOString() },
    "202": { currentPage: 124, totalPages: 310, lastRead: new Date(Date.now() - 7 * 86400000).toISOString() },
    "203": { currentPage: 345, totalPages: 432, lastRead: new Date(Date.now() - 2 * 86400000).toISOString() },
    "204": { currentPage: 58, totalPages: 288, lastRead: new Date(Date.now() - 5 * 86400000).toISOString() }
  };
  return defaultProgress;
}

/**
 * Get reading progress for a specific book
 */
export function getBookProgress(book) {
  const map = getReadingProgressMap();
  const idStr = String(book.id);
  const data = map[idStr] || {
    currentPage: 0,
    totalPages: book.pages || 250,
    lastRead: null
  };

  const totalPages = data.totalPages || book.pages || 250;
  const currentPage = Math.min(data.currentPage || 0, totalPages);
  const percentage = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return {
    currentPage,
    totalPages,
    percentage,
    lastRead: data.lastRead || null
  };
}

/**
 * Save reading progress for a book
 */
export function saveReadingProgress(bookId, currentPage, totalPages) {
  const studentId = getStudentId();
  try {
    const raw = localStorage.getItem("studymart_reading_progress");
    const fullMap = raw ? JSON.parse(raw) : {};

    if (!fullMap[studentId] || typeof fullMap[studentId] !== "object") {
      fullMap[studentId] = getReadingProgressMap();
    }

    fullMap[studentId][String(bookId)] = {
      currentPage: Number(currentPage),
      totalPages: Number(totalPages),
      lastRead: new Date().toISOString()
    };

    localStorage.setItem("studymart_reading_progress", JSON.stringify(fullMap));
  } catch (e) {
    console.error(e);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("readingProgressUpdated"));
  }
}

/**
 * Format relative time in Arabic
 */
function formatTimeAgo(isoString) {
  if (!isoString) return "لم تبدأ بعد";
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "منذ لحظات";
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return "منذ يوم واحد";
  if (diffDays === 2) return "منذ يومين";
  if (diffDays <= 10) return `منذ ${diffDays} أيام`;
  if (diffDays <= 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  return `منذ ${Math.floor(diffDays / 30)} شهر`;
}

/**
 * Render the dynamic book cards grid on the My Books page
 */
export function renderMyBooksGrid() {
  const container = document.querySelector(".my-books-grid-container");
  if (!container) return;

  const ownedBooks = getUserPurchasedBooks();
  const query = currentMyBooksSearchQuery.toLowerCase().trim();

  const coverClasses = ["navy-cover", "cream-cover", "purple-dark-cover", "beige-cover"];

  // Filter books
  const filteredBooks = ownedBooks.filter((book) => {
    const progress = getBookProgress(book);
    const fav = isFavorite("book", book.id);

    // Search query check
    if (query) {
      const title = (book.title || "").toLowerCase();
      const author = (book.author || "").toLowerCase();
      const category = (book.category || "").toLowerCase();
      const tags = Array.isArray(book.tags) ? book.tags.join(" ").toLowerCase() : (book.tags || "").toLowerCase();

      const matches = title.includes(query) || author.includes(query) || category.includes(query) || tags.includes(query);
      if (!matches) return false;
    }

    // Category filter tab check
    if (currentMyBooksFilter === "reading") {
      return progress.percentage > 0 && progress.percentage < 100;
    } else if (currentMyBooksFilter === "not_started") {
      return progress.percentage === 0;
    } else if (currentMyBooksFilter === "completed") {
      return progress.percentage === 100;
    } else if (currentMyBooksFilter === "favorites") {
      return fav;
    } else if (currentMyBooksFilter === "last_read") {
      return progress.percentage > 0;
    }

    return true;
  });

  // Sort books
  filteredBooks.sort((a, b) => {
    const progA = getBookProgress(a);
    const progB = getBookProgress(b);

    if (currentMyBooksSortMode === "recently_read" || currentMyBooksFilter === "last_read") {
      const timeA = progA.lastRead ? new Date(progA.lastRead).getTime() : 0;
      const timeB = progB.lastRead ? new Date(progB.lastRead).getTime() : 0;
      return timeB - timeA;
    } else if (currentMyBooksSortMode === "alphabetical") {
      return (a.title || "").localeCompare(b.title || "", "ar");
    } else if (currentMyBooksSortMode === "progress") {
      return progB.percentage - progA.percentage;
    }
    return 0; // default order
  });

  if (filteredBooks.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--card-bg, #ffffff); border-radius: 16px; border: 1px solid var(--border-color, #e2e8f0); margin: 20px 0;">
        <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a); margin-bottom: 8px;">لا توجد كتب مطابقة</h3>
        <p style="font-size: 14px; color: var(--text-secondary, #64748b); margin-bottom: 20px;">
          ${ownedBooks.length === 0 ? "لم تقم بشراء أي كتب بعد. تصفح مكتبة الكتب المتاحة وأضف كتبك الأولى!" : "لم يتم العثور على أي كتاب يطابق معايير البحث أو التصفية الحالية."}
        </p>
        <button type="button" class="btn-primary-purple sm" onclick="if(window.showBooksPage) window.showBooksPage(); else window.location.hash='#books';" style="padding: 10px 20px; font-weight: 700;">
          🔍 تصفح الكتب الإلكترونية
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredBooks
    .map((book, index) => {
      const progress = getBookProgress(book);
      const fav = isFavorite("book", book.id);
      const categorySlug = progress.percentage === 100 ? "completed" : progress.percentage > 0 ? "reading" : "not_started";
      const coverClass = book.coverClass || coverClasses[(book.id || index) % coverClasses.length];

      let coverHtml = "";
      if (book.image || book.cover) {
        coverHtml = `<div class="book-cover-placeholder" style="background-image: url('${book.image || book.cover}'); background-size: cover; background-position: center; height: 100%; width: 100%;"></div>`;
      } else {
        coverHtml = `
          <div class="book-cover-placeholder ${coverClass}">
            <div class="cover-content">
              <span class="cover-tag">${book.category || "كتاب"}</span>
              <h3 class="cover-title">${book.title}</h3>
              <p class="cover-author">${book.author}</p>
            </div>
            <div class="cover-decoration"></div>
          </div>
        `;
      }

      return `
        <div class="book-card-item" data-id="${book.id}" data-category="${categorySlug}" data-title="${book.title}">
          <div class="book-cover-wrapper">
            ${coverHtml}
          </div>
          <div class="book-card-info">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; width: 100%; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <h4 class="book-card-title">
                  <span>${book.title}</span>
                  <span class="desktop-category-inline"> • ${book.category || "كتاب إلكتروني"}</span>
                </h4>
                <div class="book-card-author">${book.author}</div>
              </div>
              <button class="book-fav-btn" type="button" title="${fav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}" onclick="toggleFavoriteBook('${book.id}')" style="background: none; border: none; padding: 2px 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s ease;" aria-label="المفضلة">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${fav ? '#ef4444' : 'none'}" stroke="${fav ? '#ef4444' : '#64748b'}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </button>
            </div>
            <span class="book-card-category">${book.category || "كتاب إلكتروني"}</span>
            <div class="book-card-meta">
              <span class="meta-pages">الصفحة ${progress.currentPage} من ${progress.totalPages}</span>
              <span class="meta-separator"> | </span>
              <span class="meta-last-read"><span class="meta-last-read-label">آخر فتح: </span>${formatTimeAgo(progress.lastRead)}</span>
            </div>
            <div class="book-card-progress">
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width: ${progress.percentage}%;"></div>
              </div>
              <span class="progress-percentage">${progress.percentage}%</span>
            </div>
            <div class="book-card-actions">
              <button class="btn-primary-purple sm" onclick="openBookReader('${book.id}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                متابعة القراءة
              </button>
              <button class="btn-secondary-outline sm" onclick="showBookDetails('${book.id}')">عرض التفاصيل</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

export function renderMyBooksPage() {
  if (typeof window !== "undefined" && typeof window.closeAllSidebars === "function") {
    window.closeAllSidebars();
  }

  // Hide any open modals
  const purchasesModal = document.getElementById("purchasesModal");
  if (purchasesModal) purchasesModal.classList.remove("show");

  const oldModal = document.getElementById("myBooksModal");
  if (oldModal) oldModal.remove();

  if (typeof window !== "undefined" && typeof window.hideAllMainSections === "function") {
    window.hideAllMainSections();
  } else {
    const hero = document.querySelector(".hero");
    const features = document.querySelector(".features");
    const coursesSection = document.getElementById("coursesSection") || document.querySelector(".courses");
    const booksSection = document.getElementById("books");
    const editProfilePage = document.getElementById("editProfilePage");
    const myCoursesPage = document.getElementById("myCoursesPage");

    if (hero) hero.classList.add("hidden");
    if (features) features.classList.add("hidden");
    if (coursesSection) coursesSection.classList.add("hidden");
    if (booksSection) booksSection.classList.add("hidden");
    if (editProfilePage) editProfilePage.classList.add("hidden");
    if (myCoursesPage) myCoursesPage.classList.add("hidden");
  }

  // Show My Books page
  const myBooksPage = document.getElementById("myBooksPage");
  if (myBooksPage) {
    myBooksPage.classList.remove("hidden");
  }

  if (!window.location.hash.includes("my-books")) {
    window.location.hash = "#student/my-books";
  }

  // Bind search input real-time handler
  const searchInput = document.getElementById("myBooksSearchInput");
  if (searchInput) {
    searchInput.oninput = (e) => searchMyBooks(e.target.value);
    searchInput.onkeyup = (e) => searchMyBooks(e.target.value);
  }

  // Render the grid and book details section dynamically
  renderMyBooksGrid();
  renderBookDetailsSection();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function filterMyBooksTab(btn, category) {
  const pills = document.querySelectorAll(".filter-pills-group .filter-pill");
  pills.forEach((p) => p.classList.remove("active"));
  if (btn) btn.classList.add("active");

  currentMyBooksFilter = category;
  renderMyBooksGrid();
}

export function searchMyBooks(query) {
  currentMyBooksSearchQuery = query || "";
  renderMyBooksGrid();
}

export function toggleFavoriteBook(bookIdOrTitle) {
  const booksList = window.booksData || booksData || [];
  const owned = getUserPurchasedBooks();
  const book =
    owned.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle) ||
    booksList.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle);

  if (book) {
    toggleFavorite("book", {
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.discountPrice || book.price || 0,
      image: book.image || book.cover || ""
    });
    renderMyBooksGrid();
    renderBookDetailsSection(book.id);
  }
}

export function downloadBookFile(bookIdOrTitle) {
  const booksList = window.booksData || booksData || [];
  const owned = getUserPurchasedBooks();
  const book =
    owned.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle) ||
    booksList.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle);

  const title = book ? book.title : bookIdOrTitle;
  const fileUrl = book && book.fileUrl ? book.fileUrl : "Books/css.pdf";

  try {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = `${title}.pdf`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    console.error("Download error", e);
  }

  if (window.showSuccessToast) {
    window.showSuccessToast({ title: "تحميل الكتاب", message: `جاري تحميل ملف كتاب: ${title}` });
  } else if (window.showCustomAlert) {
    window.showCustomAlert(`جاري تحميل كتاب: ${title}`);
  }
}

function getSimulatedPageText(book, pageNum) {
  const sampleTexts = [
    `إن المفتاح الأساسي للنجاح والوصول إلى أهدافك يكمن في فهم المبادئ الجوهرية والعمل بها بشكل يومي مستمر. في هذا الجزء من الكتاب، نناقش كيفية تنظيم أفكارك وأولوياتك لتحقيق أقصى إنتاجية ممكنة.`,
    `تؤكد الدراسات والتجارب العملية أن الالتزام بالعادات الايجابية يبدأ بالتغييرات الصغيرة المستمرة التي تتراكم مع الوقت لتصنع فارقاً هائلاً في جودة حياتك ونتائجك المهنية والتعليمية.`,
    `المرونة والتفكير المستقبلي هما المهاراتان الأهم في العصر الحديث. عند تطبيق المفاهيم الواردة في هذا الفصل، ستتمكن من تحليل التحديات وتحويلها إلى فرص حقيقية للنمو والابتكار.`,
    `التواصل الفعال وبناء العلاقات الإنسانية القائمة على الثقة المتبادلة يشكلان الحجر الأساس لكل إنجاز كبير. خذ وقتك في تطبيق الممارسات والتطبيقات المرفقة بنهاية هذا الفصل.`
  ];
  return sampleTexts[(pageNum - 1) % sampleTexts.length] + ` (من كتاب: ${book.title} - المؤلف: ${book.author})`;
}

export function openBookReader(bookIdOrTitle, startPage) {
  const booksList = window.booksData || booksData || [];
  let customBooks = [];
  try {
    const storedCustom = localStorage.getItem("studymart_custom_books");
    if (storedCustom) customBooks = JSON.parse(storedCustom);
  } catch (e) {}
  const allBooks = [...booksList, ...(Array.isArray(customBooks) ? customBooks : [])];
  const owned = getUserPurchasedBooks();

  let book =
    owned.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle) ||
    allBooks.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle);

  if (!book && bookIdOrTitle) {
    book = allBooks.find((b) => String(b.id) === String(bookIdOrTitle));
  }

  if (!book) {
    const alertFn = typeof showCustomAlert === "function" ? showCustomAlert : window.showCustomAlert;
    if (alertFn) alertFn("⚠️ لم يتم العثور على الكتاب المطلوب.");
    return;
  }

  const targetHash = `#reader/${book.id}${startPage ? `?page=${startPage}` : ''}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  } else {
    renderBookReaderPage(book.id, startPage);
  }
}

export async function renderBookReaderPage(bookIdOrTitle, startPage) {
  const oldModal = document.getElementById("myBooksReaderModal");
  if (oldModal) oldModal.remove();

  if (typeof window !== "undefined" && window.hideAllMainSections) {
    window.hideAllMainSections();
  }

  const readerSection = document.getElementById("bookReaderPage");
  if (!readerSection) return;

  readerSection.classList.remove("hidden");
  readerSection.classList.remove("section-hidden");

  const booksList = window.booksData || booksData || [];
  let customBooks = [];
  try {
    const storedCustom = localStorage.getItem("studymart_custom_books");
    if (storedCustom) customBooks = JSON.parse(storedCustom);
  } catch (e) {}
  const allBooks = [...booksList, ...(Array.isArray(customBooks) ? customBooks : [])];
  const owned = getUserPurchasedBooks();

  let book =
    owned.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle) ||
    allBooks.find((b) => String(b.id) === String(bookIdOrTitle) || b.title === bookIdOrTitle);

  if (!book && bookIdOrTitle) {
    book = allBooks.find((b) => String(b.id) === String(bookIdOrTitle));
  }

  if (!book) {
    let container = document.getElementById("bookReaderContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "bookReaderContainer";
      container.className = "book-reader-container";
      readerSection.appendChild(container);
    }
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #ef4444; font-weight: 700;">
        ⚠️ الكتاب المطلوب غير موجود أو تعذر الوصول إليه.
      </div>
    `;
    return;
  }

  activeBookDetailsId = String(book.id);

  // Sync latest custom file data if present in allBooks
  const fullMatch = allBooks.find((b) => String(b.id) === String(book.id));
  if (fullMatch) {
    if (fullMatch.fileDataUrl) book.fileDataUrl = fullMatch.fileDataUrl;
    if (fullMatch.fileUrl) book.fileUrl = fullMatch.fileUrl;
    if (fullMatch.pages) book.pages = fullMatch.pages;
  }

  // Access Permission Check (Platform Owner Free Access & Teacher / Purchased checks)
  const userRole = (window.appState && window.appState.userRole) || (window.getCurrentUserRole ? window.getCurrentUserRole() : "student");
  const isOwnerUser = userRole === "owner" || userRole === "admin";
  const isTeacherUser = userRole === "teacher";
  const isPurchased = owned.some((b) => String(b.id) === String(book.id));

  if (!isOwnerUser && !isTeacherUser && !isPurchased) {
    const alertFn = typeof showCustomAlert === "function" ? showCustomAlert : window.showCustomAlert;
    if (alertFn) alertFn("🔒 يجب شراء هذا الكتاب أولاً للوصول إلى القارئ الكامل.");
    window.location.hash = `#student/book-details?id=${book.id}`;
    return;
  }

  let container = document.getElementById("bookReaderContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "bookReaderContainer";
    container.className = "book-reader-container";
    readerSection.appendChild(container);
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: #64748b; font-weight: 700;">
      ⏳ جاري فتح واستخراج ملف الكتاب الأصلي...
    </div>
  `;

  // Raw file source
  let rawSource =
    (book.fileDataUrl && String(book.fileDataUrl).trim()) ||
    (book.fileUrl && String(book.fileUrl).trim());

  if (!rawSource && book.id) {
    const idbFile = await getBookFileFromIDB(book.id, "main");
    if (idbFile) rawSource = idbFile;
  }

  let pdfDoc = null;
  if (rawSource) {
    try {
      const pdfjs = await ensurePdfJs();
      let loadParam = null;

      if (rawSource.startsWith("data:")) {
        const uint8Bytes = getPdfUint8ArrayFromDataUrl(rawSource);
        if (uint8Bytes) loadParam = { data: uint8Bytes };
      } else {
        loadParam = { url: rawSource };
      }

      if (loadParam) {
        try {
          const loadingTask = pdfjs.getDocument(createPdfLoadingParams(loadParam));
          pdfDoc = await loadingTask.promise;
        } catch (e) {
          console.warn("Could not load PDF from rawSource:", e);
          pdfDoc = null;
        }
      }
    } catch (err) {
      console.warn("Could not load PDF file for reader:", err);
      pdfDoc = null;
    }
  }

  const progress = getBookProgress(book);
  let currentPage = Number(startPage) || progress.currentPage || 1;
  if (currentPage < 1) currentPage = 1;

  let totalPages = pdfDoc ? pdfDoc.numPages : (book.pages || 1);
  if (currentPage > totalPages) currentPage = totalPages;
  book.pages = totalPages;

  let readerZoomScale = 0.80; // Default sensible zoom level (80%)

  const percentage = Math.round((currentPage / totalPages) * 100);
  saveReadingProgress(book.id, currentPage, totalPages);

  container.innerHTML = `
    <!-- Navigation Bar -->
    <div class="reader-top-nav-bar" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 8px;">
      <div class="reader-breadcrumb" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary, #64748b); font-weight: 600;">
        <a href="#student/my-books" onclick="event.preventDefault(); window.location.hash='#student/my-books';" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 700;">كتبي</a>
        <span>&gt;</span>
        <span style="color: var(--text-primary, #0f172a); font-weight: 700;">${escapeHtml(book.title)}</span>
        <span>&gt;</span>
        <span>قارئ الكتاب</span>
      </div>
      <button type="button" class="btn-return-mybooks reader-back-btn" onclick="event.preventDefault(); window.location.hash='#student/my-books'; if(typeof window.renderMyBooksPage==='function'){window.renderMyBooksPage();}" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 10px 18px; border-radius: 12px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>الرجوع إلى كتبي</span>
      </button>
    </div>

    <!-- Main Reader Card -->
    <div class="reader-main-card" style="background: var(--card-bg, #ffffff); border-radius: 20px; border: 1px solid var(--border-color, #e2e8f0); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); color: var(--text-primary, #0f172a); display: flex; flex-direction: column;">
      
      <!-- Header Controls Bar -->
      <div class="reader-header-bar" style="padding: 20px 28px; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary, #f8fafc); flex-wrap: wrap; gap: 16px;">
        <div class="reader-header-info">
          <h2 class="reader-book-title" style="font-size: 20px; font-weight: 800; margin: 0 0 6px 0; color: var(--text-primary, #0f172a);">${escapeHtml(book.title)}</h2>
          <div class="reader-book-meta" style="font-size: 14px; color: var(--text-secondary, #64748b); font-weight: 600;">المؤلف: ${escapeHtml(book.author)} | الصفحة ${currentPage} من ${totalPages} (${percentage}%)</div>
        </div>
        <div class="reader-action-buttons" style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button type="button" id="readerQuickBmBtn" class="reader-action-btn" style="padding: 8px 16px; border-radius: 10px; background: #2563eb; color: #fff; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">🔖 إضافة علامة</button>
          <button type="button" id="readerQuickNoteBtn" class="reader-action-btn" style="padding: 8px 16px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">📝 تدوين ملاحظة</button>
          <button type="button" id="readerDownloadBtn" class="reader-action-btn" style="padding: 8px 16px; border-radius: 10px; background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">📥 تحميل</button>
        </div>
      </div>

      <!-- Progress Track -->
      <div class="reader-progress-track" style="width: 100%; height: 6px; background: #e2e8f0;">
        <div id="readerProgressBarInner" style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #7c3aed, #9333ea); transition: width 0.3s ease;"></div>
      </div>

      <!-- Content Area (Fixed Viewport) -->
      ${pdfDoc ? `
        <div class="reader-content-outer" style="padding: 24px 16px; background: var(--bg-primary, #ffffff); height: 520px; max-height: 60vh; min-height: 380px; overflow: auto; display: block; text-align: center; box-sizing: border-box; position: relative;">
          <div id="readerPdfCanvasWrapper" style="display: inline-block; min-width: 100%; text-align: center; vertical-align: top;">
            <div style="text-align: center; padding: 50px 20px; color: #64748b; font-weight: 700;">
              ⏳ جاري عرض الصفحة ${currentPage}...
            </div>
          </div>
        </div>
      ` : `
        <div class="reader-content-outer" style="padding: 40px 28px; background: var(--bg-primary, #ffffff); min-height: 420px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="text-align: center; padding: 40px 24px; color: #ef4444; font-weight: 700; background: #fef2f2; border: 1px dashed #fca5a5; border-radius: 16px; max-width: 600px; width: 100%;">
            <div style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
            <div style="font-size: 18px; color: #991b1b; margin-bottom: 8px; font-weight: 800;">تعذر تحميل ملف الكتاب الأصلي</div>
            <div style="font-size: 14px; color: #7f1d1d; font-weight: 500; line-height: 1.6;">
              لم يتم العثور على ملف PDF صالِح لهذا الكتاب أو تعذر فتح الملف المرفوع. يُرجى التأكد من اختيار ورفع ملف PDF صالِح للكتاب في منشئ الكتب.
            </div>
          </div>
        </div>
      `}

      <!-- Footer Reading Controls -->
      <div class="reader-footer-controls" style="padding: 16px 28px; border-top: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary, #f8fafc); flex-wrap: wrap; gap: 14px;">
        <div class="reader-nav-buttons" style="display: flex; align-items: center; gap: 10px;">
          <button type="button" id="prevPageBtn" class="reader-nav-btn" style="padding:10px 20px; border-radius:12px; background:var(--card-bg, #fff); border:1px solid #cbd5e1; font-weight:700; cursor:pointer; color:inherit;">
            ← الصفحة السابقة
          </button>
          <button type="button" id="nextPageBtn" class="reader-nav-btn" style="padding:10px 20px; border-radius:12px; background:#7c3aed; color:#fff; border:none; font-weight:700; cursor:pointer;">
            الصفحة التالية →
          </button>
        </div>

        <!-- Zoom Controls -->
        <div class="reader-zoom-group" style="display: flex; align-items: center; gap: 6px; background: var(--card-bg, #ffffff); padding: 4px 10px; border-radius: 10px; border: 1px solid #cbd5e1;">
          <span style="font-size: 12px; font-weight: 700; color: #64748b; margin-left: 2px;">التكبير:</span>
          <button type="button" id="readerZoomOutBtn" title="تصغير" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 800; font-size: 16px; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">−</button>
          <span id="readerZoomVal" style="font-size: 13px; font-weight: 800; color: #0f172a; min-width: 42px; text-align: center;">80%</span>
          <button type="button" id="readerZoomInBtn" title="تكبير" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 800; font-size: 16px; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">+</button>
        </div>

        <div class="reader-jump-group" style="display: flex; align-items: center; gap: 10px;">
          <span class="reader-jump-label" style="font-size: 14px; font-weight: 700;">الانتقال إلى صفحة:</span>
          <input type="number" id="jumpPageInput" class="reader-jump-input" min="1" max="${totalPages}" value="${currentPage}" style="width: 80px; padding: 8px; border-radius: 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; font-size: 15px; background: var(--card-bg, #fff); color: inherit;" />
          <button type="button" id="jumpPageBtn" class="reader-jump-btn" style="padding: 8px 16px; border-radius: 10px; background: #0f172a; color: #fff; border: none; font-weight: 700; cursor: pointer; font-size: 14px;">انتقال</button>
        </div>

        <button type="button" id="saveAndReturnBtn" class="reader-save-btn" style="padding: 10px 22px; border-radius: 12px; background: #059669; color: #fff; border: none; font-weight: 800; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
          ✓ حفظ التقدم والخروج
        </button>
      </div>

    </div>
  `;

  // Helper to update bookmark button appearance
  function updateQuickBmBtnState() {
    const quickBmBtn = container.querySelector("#readerQuickBmBtn");
    if (!quickBmBtn) return;
    const bookmarks = getBookBookmarks(book.id);
    const isBookmarked = bookmarks.some((bm) => Number(bm.page) === Number(currentPage));
    if (isBookmarked) {
      quickBmBtn.style.background = "#15803d";
      quickBmBtn.innerHTML = "🔖 علامة محفوظة";
    } else {
      quickBmBtn.style.background = "#2563eb";
      quickBmBtn.innerHTML = "🔖 إضافة علامة";
    }
  }

  // Helper to render single canvas page
  async function renderPageCanvas() {
    if (!pdfDoc) return;
    const wrapper = container.querySelector("#readerPdfCanvasWrapper");
    if (!wrapper) return;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    saveReadingProgress(book.id, currentPage, totalPages);
    updateQuickBmBtnState();

    const perc = Math.round((currentPage / totalPages) * 100);

    const metaEl = container.querySelector(".reader-book-meta");
    if (metaEl) {
      metaEl.textContent = `المؤلف: ${book.author} | الصفحة ${currentPage} من ${totalPages} (${perc}%)`;
    }

    const progressEl = container.querySelector("#readerProgressBarInner");
    if (progressEl) {
      progressEl.style.width = `${perc}%`;
    }

    const jumpInp = container.querySelector("#jumpPageInput");
    if (jumpInp) jumpInp.value = currentPage;

    const prevBtnEl = container.querySelector("#prevPageBtn");
    if (prevBtnEl) {
      if (currentPage <= 1) {
        prevBtnEl.disabled = true;
        prevBtnEl.style.opacity = "0.5";
        prevBtnEl.style.cursor = "not-allowed";
      } else {
        prevBtnEl.disabled = false;
        prevBtnEl.style.opacity = "1";
        prevBtnEl.style.cursor = "pointer";
      }
    }

    const nextBtnEl = container.querySelector("#nextPageBtn");
    if (nextBtnEl) {
      if (currentPage >= totalPages) {
        nextBtnEl.disabled = true;
        nextBtnEl.style.opacity = "0.5";
        nextBtnEl.style.cursor = "not-allowed";
      } else {
        nextBtnEl.disabled = false;
        nextBtnEl.style.opacity = "1";
        nextBtnEl.style.cursor = "pointer";
      }
    }

    wrapper.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b; font-weight:700;">⏳ جاري عرض الصفحة ${currentPage}...</div>`;

    try {
      const page = await pdfDoc.getPage(currentPage);
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) {}
      }

      const parentBox = wrapper.parentElement || wrapper;
      const containerWidth = parentBox.clientWidth > 0 ? Math.max(parentBox.clientWidth - 32, 300) : 760;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const fitScale = (containerWidth / unscaledViewport.width) * readerZoomScale;
      const baseScale = Math.min(Math.max(fitScale, 0.3), 3.0);
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: baseScale });

      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
      canvas.style.maxWidth = "none";
      canvas.style.height = "auto";
      canvas.style.boxShadow = "0 8px 28px rgba(0,0,0,0.1)";
      canvas.style.borderRadius = "12px";
      canvas.style.background = "#ffffff";

      const ctx = canvas.getContext("2d");
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";

      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

      wrapper.innerHTML = "";
      wrapper.appendChild(canvas);

      await page.render({ canvasContext: ctx, transform: transform, viewport: viewport }).promise;
    } catch (err) {
      console.error("Error rendering page canvas in reader:", err);
      wrapper.innerHTML = `<div style="text-align:center; padding:40px; color:#ef4444; font-weight:700;">❌ تعذر عرض الصفحة ${currentPage} من ملف PDF.</div>`;
    }
  }

  // Attach Event Listeners
  const btnReturnMyBooks = container.querySelector(".btn-return-mybooks");
  if (btnReturnMyBooks) {
    btnReturnMyBooks.onclick = (e) => {
      if (e) e.preventDefault();
      window.location.hash = "#student/my-books";
      if (typeof window.renderMyBooksPage === "function") {
        window.renderMyBooksPage();
      }
    };
  }

  const saveReturnBtn = container.querySelector("#saveAndReturnBtn");
  if (saveReturnBtn) {
    saveReturnBtn.onclick = () => {
      saveReadingProgress(book.id, currentPage, totalPages);
      window.location.hash = "#student/my-books";
      if (typeof window.renderMyBooksPage === "function") {
        window.renderMyBooksPage();
      }
    };
  }

  const quickBmBtn = container.querySelector("#readerQuickBmBtn");
  if (quickBmBtn) {
    quickBmBtn.onclick = () => {
      addBookmark(book.id, currentPage, `علامة مرجعية - صفحة ${currentPage}`);
      updateQuickBmBtnState();
    };
  }

  const quickNoteBtn = container.querySelector("#readerQuickNoteBtn");
  if (quickNoteBtn) {
    quickNoteBtn.onclick = () => {
      openNotesModal(book.id, currentPage);
    };
  }

  const downloadBtn = container.querySelector("#readerDownloadBtn");
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      downloadBookFile(book.id);
    };
  }

  const rZoomInBtn = container.querySelector("#readerZoomInBtn");
  const rZoomOutBtn = container.querySelector("#readerZoomOutBtn");
  const rZoomVal = container.querySelector("#readerZoomVal");

  if (rZoomInBtn) {
    rZoomInBtn.onclick = () => {
      if (readerZoomScale < 1.60) {
        readerZoomScale = Math.min(1.60, Math.round((readerZoomScale + 0.15) * 100) / 100);
        if (rZoomVal) rZoomVal.textContent = `${Math.round(readerZoomScale * 100)}%`;
        renderPageCanvas();
      }
    };
  }

  if (rZoomOutBtn) {
    rZoomOutBtn.onclick = () => {
      if (readerZoomScale > 0.45) {
        readerZoomScale = Math.max(0.45, Math.round((readerZoomScale - 0.15) * 100) / 100);
        if (rZoomVal) rZoomVal.textContent = `${Math.round(readerZoomScale * 100)}%`;
        renderPageCanvas();
      }
    };
  }

  const prevBtn = container.querySelector("#prevPageBtn");
  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderPageCanvas();
      }
    };
  }

  const nextBtn = container.querySelector("#nextPageBtn");
  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPageCanvas();
      }
    };
  }

  const jumpBtn = container.querySelector("#jumpPageBtn");
  const jumpInput = container.querySelector("#jumpPageInput");
  if (jumpBtn && jumpInput) {
    jumpBtn.onclick = () => {
      let p = parseInt(jumpInput.value, 10);
      if (isNaN(p) || p < 1) p = 1;
      if (p > totalPages) p = totalPages;
      currentPage = p;
      renderPageCanvas();
    };
    jumpInput.onkeydown = (e) => {
      if (e.key === "Enter") {
        let p = parseInt(jumpInput.value, 10);
        if (isNaN(p) || p < 1) p = 1;
        if (p > totalPages) p = totalPages;
        currentPage = p;
        renderPageCanvas();
      }
    };
  }

  if (pdfDoc) {
    renderPageCanvas();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function openBookmarksModal(bookId, initialPage = null) {
  const booksList = window.booksData || booksData || [];
  const owned = getUserPurchasedBooks();
  const book = owned.find((b) => String(b.id) === String(bookId)) || booksList.find((b) => String(b.id) === String(bookId)) || { id: bookId, title: "الكتاب" };
  const progress = getBookProgress(book);
  const defaultPage = initialPage !== null && initialPage !== undefined ? initialPage : (progress.currentPage || 1);

  let modal = document.getElementById("bookBookmarksModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bookBookmarksModal";
    document.body.appendChild(modal);
  }

  modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 16px;";

  function renderModalContent() {
    const bookmarks = getBookBookmarks(book.id);
    modal.innerHTML = `
      <div style="background: var(--card-bg, #ffffff); width: 100%; max-width: 520px; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); color: var(--text-primary, #0f172a); border: 1px solid var(--border-color, #e2e8f0);" dir="rtl">
        <div style="padding: 18px 22px; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary, #f8fafc);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">🔖</span>
            <h3 style="font-size: 16px; font-weight: 800; margin: 0;">الإشارات المرجعية (${bookmarks.length})</h3>
          </div>
          <button type="button" id="closeBookmarksModalBtn" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: #64748b; font-weight: 700;">✕</button>
        </div>

        <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
          <!-- Add Bookmark Form -->
          <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #475569;">إضافة علامة مرجعية جديدة:</div>
            <div style="display: flex; gap: 8px; margin-bottom: 10px;">
              <input type="number" id="bmPageInput" min="1" max="${progress.totalPages}" value="${defaultPage}" placeholder="رقم الصفحة" style="width: 100px; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; background: var(--card-bg, #fff); color: inherit;" />
              <input type="text" id="bmTitleInput" placeholder="عنوان العلامة المرجعية (اختياري)" style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; background: var(--card-bg, #fff); color: inherit;" />
            </div>
            <button type="button" id="submitAddBmBtn" style="width: 100%; padding: 9px; border-radius: 8px; background: #2563eb; color: #fff; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>+</span> <span>إضافة إلى قائمة العلامات</span>
            </button>
          </div>

          <!-- Bookmarks List -->
          ${
            bookmarks.length === 0
              ? `<div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 14px;">لا توجد علامات مرجعية محفوظة لهذا الكتاب بعد.</div>`
              : `<div style="display: flex; flex-direction: column; gap: 10px;">
                  ${bookmarks
                    .map(
                      (bm) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 10px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); gap: 10px;">
                      <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                          <span style="background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 12px;">صفحة ${bm.page}</span>
                          <span style="font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${bm.title}</span>
                        </div>
                        <div style="font-size: 11px; color: #94a3b8;">${bm.date || ""}</div>
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <button type="button" class="jump-bm-btn" data-page="${bm.page}" style="padding: 6px 10px; border-radius: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 700; cursor: pointer; color: #334155;">انتقال</button>
                        <button type="button" class="del-bm-btn" data-id="${bm.id}" style="padding: 6px 8px; border-radius: 6px; background: #fee2e2; border: none; font-size: 12px; font-weight: 700; cursor: pointer; color: #dc2626;">حذف</button>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>`
          }
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector("#closeBookmarksModalBtn");
    if (closeBtn) closeBtn.onclick = () => modal.remove();

    const addBtn = modal.querySelector("#submitAddBmBtn");
    if (addBtn) {
      addBtn.onclick = () => {
        const pageInput = modal.querySelector("#bmPageInput");
        const titleInput = modal.querySelector("#bmTitleInput");
        const pageVal = parseInt(pageInput ? pageInput.value : "1", 10) || 1;
        const titleVal = titleInput && titleInput.value.trim() ? titleInput.value.trim() : `علامة - صفحة ${pageVal}`;
        addBookmark(book.id, pageVal, titleVal);
        renderModalContent();
      };
    }

    modal.querySelectorAll(".jump-bm-btn").forEach((btn) => {
      btn.onclick = () => {
        const p = parseInt(btn.getAttribute("data-page"), 10);
        modal.remove();
        openBookReader(book.id, p);
      };
    });

    modal.querySelectorAll(".del-bm-btn").forEach((btn) => {
      btn.onclick = () => {
        const bmId = btn.getAttribute("data-id");
        deleteBookmark(book.id, bmId);
        renderModalContent();
      };
    });
  }

  renderModalContent();
}

export function openNotesModal(bookId, initialPage = null) {
  const booksList = window.booksData || booksData || [];
  const owned = getUserPurchasedBooks();
  const book = owned.find((b) => String(b.id) === String(bookId)) || booksList.find((b) => String(b.id) === String(bookId)) || { id: bookId, title: "الكتاب" };
  const progress = getBookProgress(book);
  const defaultPage = initialPage !== null && initialPage !== undefined ? initialPage : (progress.currentPage || 1);

  let modal = document.getElementById("bookNotesModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "bookNotesModal";
    document.body.appendChild(modal);
  }

  modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; padding: 16px;";

  function renderModalContent() {
    const notes = getBookNotes(book.id);
    modal.innerHTML = `
      <div style="background: var(--card-bg, #ffffff); width: 100%; max-width: 540px; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); color: var(--text-primary, #0f172a); border: 1px solid var(--border-color, #e2e8f0);" dir="rtl">
        <div style="padding: 18px 22px; border-bottom: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary, #f8fafc);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">📝</span>
            <h3 style="font-size: 16px; font-weight: 800; margin: 0;">ملاحظاتي (${notes.length})</h3>
          </div>
          <button type="button" id="closeNotesModalBtn" style="background: transparent; border: none; font-size: 20px; cursor: pointer; color: #64748b; font-weight: 700;">✕</button>
        </div>

        <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
          <!-- Add Note Form -->
          <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 14px; margin-bottom: 18px;">
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #475569;">تدوين ملاحظة جديدة:</div>
            <div style="margin-bottom: 10px;">
              <input type="number" id="notePageInput" min="1" max="${progress.totalPages}" value="${defaultPage}" placeholder="رقم الصفحة" style="width: 110px; padding: 8px 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; margin-bottom: 8px; background: var(--card-bg, #fff); color: inherit;" />
              <textarea id="noteTextInput" rows="3" placeholder="اكتب ملاحظتك الفكرية أو الاستنتاج هنا..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; background: var(--card-bg, #fff); color: inherit;"></textarea>
            </div>
            <button type="button" id="submitAddNoteBtn" style="width: 100%; padding: 9px; border-radius: 8px; background: #7c3aed; color: #fff; border: none; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>+</span> <span>حفظ الملاحظة</span>
            </button>
          </div>

          <!-- Notes List -->
          ${
            notes.length === 0
              ? `<div style="text-align: center; padding: 24px; color: #94a3b8; font-size: 14px;">لا توجد ملاحظات مدونة لهذا الكتاب بعد.</div>`
              : `<div style="display: flex; flex-direction: column; gap: 12px;">
                  ${notes
                    .map(
                      (nt) => `
                    <div style="padding: 14px; border-radius: 12px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0);">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="background: #f3e8ff; color: #7c3aed; font-size: 11px; font-weight: 800; padding: 2px 10px; border-radius: 12px;">صفحة ${nt.page}</span>
                        <span style="font-size: 11px; color: #94a3b8;">${nt.date || ""}</span>
                      </div>
                      <p style="font-size: 13px; color: var(--text-primary, #1e293b); margin: 0 0 10px 0; line-height: 1.6; white-space: pre-wrap;">${nt.text}</p>
                      <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="jump-note-btn" data-page="${nt.page}" style="padding: 5px 10px; border-radius: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 700; cursor: pointer; color: #334155;">انتقال للصفحة</button>
                        <button type="button" class="del-note-btn" data-id="${nt.id}" style="padding: 5px 8px; border-radius: 6px; background: #fee2e2; border: none; font-size: 12px; font-weight: 700; cursor: pointer; color: #dc2626;">حذف</button>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>`
          }
        </div>
      </div>
    `;

    const closeBtn = modal.querySelector("#closeNotesModalBtn");
    if (closeBtn) closeBtn.onclick = () => modal.remove();

    const addBtn = modal.querySelector("#submitAddNoteBtn");
    if (addBtn) {
      addBtn.onclick = () => {
        const pageInput = modal.querySelector("#notePageInput");
        const textInput = modal.querySelector("#noteTextInput");
        const pageVal = parseInt(pageInput ? pageInput.value : "1", 10) || 1;
        const textVal = textInput ? textInput.value.trim() : "";
        if (!textVal) {
          if (window.showCustomAlert) window.showCustomAlert("يرجى كتابة نص الملاحظة أولاً.");
          return;
        }
        addNote(book.id, pageVal, textVal);
        renderModalContent();
      };
    }

    modal.querySelectorAll(".jump-note-btn").forEach((btn) => {
      btn.onclick = () => {
        const p = parseInt(btn.getAttribute("data-page"), 10);
        modal.remove();
        openBookReader(book.id, p);
      };
    });

    modal.querySelectorAll(".del-note-btn").forEach((btn) => {
      btn.onclick = () => {
        const noteId = btn.getAttribute("data-id");
        deleteNote(book.id, noteId);
        renderModalContent();
      };
    });
  }

  renderModalContent();
}

export function scrollToBookDetails() {
  const anchor = document.getElementById("bookDetailsAnchor");
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth" });
  }
}

export function toggleChapterAccordion(header) {
  if (!header) return;
  const group = header.parentElement;
  if (!group) return;
  const body = group.querySelector(".chapter-group-body");
  if (!body) return;

  const isOpen = group.classList.contains("open");
  if (isOpen) {
    group.classList.remove("open");
    body.style.display = "none";
  } else {
    group.classList.add("open");
    body.style.display = "flex";
  }
}

export function toggleAllChaptersAccordion() {
  const accordion = document.querySelector(".book-chapters-accordion");
  if (!accordion) return;
  const groups = accordion.querySelectorAll(".chapter-group");
  const anyClosed = Array.from(groups).some((g) => !g.classList.contains("open"));
  groups.forEach((g) => {
    const body = g.querySelector(".chapter-group-body");
    if (anyClosed) {
      g.classList.add("open");
      if (body) body.style.display = "flex";
    } else {
      g.classList.remove("open");
      if (body) body.style.display = "none";
    }
  });
}

export function goToLastReadPage() {
  const owned = getUserPurchasedBooks();
  const targetId = activeBookDetailsId || (owned.length > 0 ? owned[0].id : "202");
  openBookReader(targetId);
}

/**
 * Dynamic Render function for the 3-column Book Details section inside "My Books"
 */
export function renderBookDetailsSection(targetBookId) {
  const anchor = document.getElementById("bookDetailsAnchor");
  if (!anchor) return;

  const owned = getUserPurchasedBooks();
  const booksList = window.booksData || booksData || [];

  const idToUse = targetBookId || activeBookDetailsId || (owned.length > 0 ? owned[0].id : "202");
  activeBookDetailsId = String(idToUse);

  let book =
    owned.find((b) => String(b.id) === String(idToUse)) ||
    booksList.find((b) => String(b.id) === String(idToUse));

  if (!book && owned.length > 0) book = owned[0];
  if (!book && booksList.length > 0) book = booksList[0];
  if (!book) return;

  const progress = getBookProgress(book);
  const fav = isFavorite("book", book.id);
  const bookmarks = getBookBookmarks(book.id);
  const notes = getBookNotes(book.id);

  const currentPage = progress.currentPage;
  const totalPages = progress.totalPages || book.pages || 250;
  const percentage = progress.percentage;
  const remainingPages = Math.max(0, totalPages - currentPage);
  const estimatedHours = Math.max(1, Math.ceil((remainingPages * 1.5) / 60));

  // Structured Parts & Chapters
  const chaptersData = [
    {
      partTitle: "الجزء الأول: أساسيات المفاهيم والتفكير",
      chapters: [
        { num: 1, title: "مقدمة الكتاب والتمهيد", page: 1 },
        { num: 2, title: "الرغبة والانطلاقة الأولى", page: Math.max(1, Math.round(totalPages * 0.1)) },
        { num: 3, title: "بناء اليقين والتصوير الإيجابي", page: Math.max(1, Math.round(totalPages * 0.2)) }
      ]
    },
    {
      partTitle: "الجزء الثاني: التطبيق واستراتيجيات النجاح",
      chapters: [
        { num: 4, title: "التنظيم وإدارة الأولويات", page: Math.max(1, Math.round(totalPages * 0.35)) },
        { num: 5, title: "اتخاذ القرار الحاسم والعمل الفعلي", page: Math.max(1, Math.round(totalPages * 0.5)) },
        { num: 6, title: "المثابرة وتجاوز العقبات", page: Math.max(1, Math.round(totalPages * 0.65)) }
      ]
    },
    {
      partTitle: "الجزء الثالث: الإنجاز والاستدامة",
      chapters: [
        { num: 7, title: "تحويل الأفكار إلى نتائج ملموسة", page: Math.max(1, Math.round(totalPages * 0.8)) },
        { num: 8, title: "الخاتمة والتوصيات المستقبلية", page: Math.max(1, Math.round(totalPages * 0.95)) }
      ]
    }
  ];

  let coverContentHtml = "";
  if (book.image || book.cover) {
    coverContentHtml = `<div class="book-cover-placeholder" style="background-image: url('${book.image || book.cover}'); background-size: cover; background-position: center; height: 100%; width: 100%; border-radius: 12px;"></div>`;
  } else {
    coverContentHtml = `
      <div class="book-cover-placeholder cream-cover lg">
        <div class="book-cover-title">${book.title}</div>
        <div class="book-cover-author">${book.author}</div>
      </div>
    `;
  }

  anchor.innerHTML = `
    <!-- LEFT COLUMN: فهرس الكتاب Accordion -->
    <div class="book-index-panel">
      <div class="book-index-header">
        <div class="title-with-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <h4>فهرس الكتاب</h4>
        </div>
        <button class="icon-toggle-btn" type="button" onclick="toggleAllChaptersAccordion()" title="توسيع / طي كافة الفصول">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 19l-7-7 7-7M19 19l-7-7 7-7"/></svg>
        </button>
      </div>

      <div class="book-chapters-accordion">
        ${chaptersData
          .map((part, pIdx) => {
            return `
            <div class="chapter-group ${pIdx === 0 ? "open" : ""}">
              <div class="chapter-group-header" onclick="toggleChapterAccordion(this)">
                <span>${part.partTitle}</span>
                <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              <div class="chapter-group-body" style="${pIdx === 0 ? "display: flex;" : "display: none;"}">
                ${part.chapters
                  .map((ch) => {
                    let statusClass = "locked";
                    let iconChar = "🔒";
                    let iconType = "lock";

                    if (ch.page <= currentPage) {
                      statusClass = "completed";
                      iconChar = "✓";
                      iconType = "check";
                    } else if (currentPage > 0 && ch.page <= currentPage + 30) {
                      statusClass = "active";
                      iconChar = "●";
                      iconType = "dot";
                    }

                    return `
                    <div class="chapter-item ${statusClass}" onclick="openBookReader('${book.id}', ${ch.page})" style="cursor: pointer;" title="انتقال إلى الفصل في صفحة ${ch.page}">
                      <span class="ch-num">${ch.num}</span>
                      <span class="ch-title">${ch.title}</span>
                      <span class="ch-status ${iconType}">${iconChar}</span>
                    </div>
                  `;
                  })
                  .join("")}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>

      <button type="button" class="download-book-btn" onclick="downloadBookFile('${book.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        تحميل الكتاب
      </button>
    </div>

    <!-- CENTER COLUMN: Book Info & Details -->
    <div class="book-main-details-panel">
      <div class="book-details-inner-card">
        <div class="book-details-layout">
          <div class="book-details-cover-box">
            ${coverContentHtml}
          </div>

          <div class="book-details-info-box">
            <div class="book-breadcrumb">
              <span>كتبي</span> &gt; <span class="active">${book.title}</span>
            </div>
            <h2 class="book-main-title">${book.title}</h2>
            <div class="book-author-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>${book.author}</span>
            </div>
            <div class="book-rating-row">
              <div class="stars">⭐⭐⭐⭐⭐</div>
              <span class="rating-num">${book.rating || "4.8"}</span>
              <span class="reviews-count">(${book.reviewsCount || 1250} تقييم)</span>
            </div>
            <p class="book-description">
              ${book.fullDescription || book.shortDescription || "يقدم هذا الكتاب مرجعاً متكاملاً ورؤية عملية شاملة في مجاله مع تطبيقات تفاعلية."}
            </p>

            <!-- 4 Specs Grid -->
            <div class="book-specs-grid">
              <div class="spec-card">
                <span class="spec-label">حجم الملف</span>
                <span class="spec-value">${book.fileSize || "2.4 MB"}</span>
              </div>
              <div class="spec-card">
                <span class="spec-label">تاريخ النشر</span>
                <span class="spec-value">${book.publicationDate ? book.publicationDate.split("-")[0] : book.edition || "2024"}</span>
              </div>
              <div class="spec-card">
                <span class="spec-label">عدد الصفحات</span>
                <span class="spec-value">${totalPages}</span>
              </div>
              <div class="spec-card">
                <span class="spec-label">اللغة</span>
                <span class="spec-value">${book.language || "العربية"}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Section -->
        <div class="book-reading-progress-section">
          <div class="progress-status-line">
            <span>آخر قراءة: الصفحة ${currentPage} من ${totalPages}</span>
            <span class="pct-text">${percentage}%</span>
          </div>
          <div class="progress-bar-track lg">
            <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>

        <!-- Actions Row -->
        <div class="book-actions-row">
          <button class="btn-primary-purple lg-btn" onclick="openBookReader('${book.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            متابعة القراءة
          </button>
          <button class="btn-secondary-outline lg-btn" onclick="downloadBookFile('${book.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            تحميل الكتاب
          </button>
          <button class="btn-secondary-outline lg-btn" onclick="toggleFavoriteBook('${book.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${fav ? "#ef4444" : "none"}" stroke="${fav ? "#ef4444" : "currentColor"}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>${fav ? "في المفضلة" : "إضافة إلى المفضلة"}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- RIGHT COLUMN: Progress & Notes Stats -->
    <div class="book-stats-side-panel">
      <!-- Top Card: تقدمك في الكتاب -->
      <div class="side-card progress-donut-card">
        <h4 class="side-card-title">تقدمك في الكتاب</h4>
        <div class="donut-and-list">
          <div class="circular-progress-wrapper">
            <svg class="donut-svg" viewBox="0 0 36 36">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" stroke-width="3.5" />
              <path class="circle-fill" stroke-dasharray="${percentage}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round" />
            </svg>
            <div class="donut-center-text">
              <span class="pct-num">${percentage}%</span>
              <span class="pct-label">تم القراءة</span>
            </div>
          </div>

          <div class="progress-stats-list">
            <div class="stat-line">
              <span class="label">تم قراءة</span>
              <span class="val">${currentPage} صفحة</span>
            </div>
            <div class="stat-line">
              <span class="label">الصفحات المتبقية</span>
              <span class="val">${remainingPages} صفحة</span>
            </div>
            <div class="stat-line">
              <span class="label">الوقت المتوقع للانتهاء</span>
              <span class="val">${estimatedHours} ساعات</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Row: 2 Small Cards -->
      <div class="side-two-cards-row">
        <!-- Card 1: الإشارات المرجعية -->
        <div class="side-card mini-stat-card" onclick="openBookmarksModal('${book.id}')" style="cursor: pointer;" title="عرض وإدارة الإشارات المرجعية">
          <div class="mini-icon-box blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="mini-info">
            <span class="label">الإشارات المرجعية</span>
            <span class="count">${bookmarks.length} علامة</span>
          </div>
        </div>

        <!-- Card 2: ملاحظاتي -->
        <div class="side-card mini-stat-card" onclick="openNotesModal('${book.id}')" style="cursor: pointer;" title="عرض وإدارة الملاحظات">
          <div class="mini-icon-box purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div class="mini-info">
            <span class="label">ملاحظاتي</span>
            <span class="count">${notes.length} ملاحظة</span>
          </div>
        </div>
      </div>

      <!-- Bottom Card: آخر صفحة تمت قراءتها -->
      <div class="side-card last-read-yellow-card">
        <h4 class="yellow-card-title">آخر صفحة تمت قراءتها</h4>
        <p class="yellow-card-subtitle">${currentPage > 0 ? `لقد توقفت عند: الصفحة ${currentPage} من ${totalPages}` : "لم تبدأ القراءة بعد"}</p>
        <button type="button" class="btn-yellow-jump" onclick="openBookReader('${book.id}')">
          الانتقال إلى آخر صفحة
        </button>
      </div>
    </div>
  `;
}

// Global Event Listeners for Real-time Synchronization
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (
      e.key === "userPurchasedBooks" ||
      e.key === "studymart_favorites" ||
      e.key === "studymart_reading_progress" ||
      e.key === "studymart_bookmarks" ||
      e.key === "studymart_notes"
    ) {
      renderMyBooksGrid();
      renderBookDetailsSection();
    }
  });

  window.addEventListener("readingProgressUpdated", () => {
    renderMyBooksGrid();
    renderBookDetailsSection();
  });
  window.addEventListener("userPurchasedBooksUpdated", () => {
    renderMyBooksGrid();
    renderBookDetailsSection();
  });
  window.addEventListener("favoritesUpdated", () => {
    renderMyBooksGrid();
    renderBookDetailsSection();
  });
  window.addEventListener("bookmarksUpdated", () => {
    renderBookDetailsSection();
  });
  window.addEventListener("notesUpdated", () => {
    renderBookDetailsSection();
  });

  window.showBookDetails = showBookDetails;
  window.renderBookDetailsUI = renderBookDetailsUI;
  window.renderBookDetailsSection = renderBookDetailsSection;
  window.renderMyBooksPage = renderMyBooksPage;
  window.renderMyBooksGrid = renderMyBooksGrid;
  window.filterMyBooksTab = filterMyBooksTab;
  window.searchMyBooks = searchMyBooks;
  window.openBookReader = openBookReader;
  window.renderBookReaderPage = renderBookReaderPage;
  window.scrollToBookDetails = scrollToBookDetails;
  window.toggleChapterAccordion = toggleChapterAccordion;
  window.toggleAllChaptersAccordion = toggleAllChaptersAccordion;
  window.downloadBookFile = downloadBookFile;
  window.toggleFavoriteBook = toggleFavoriteBook;
  window.goToLastReadPage = goToLastReadPage;
  window.getStudentId = getStudentId;
  window.openBookmarksModal = openBookmarksModal;
  window.openNotesModal = openNotesModal;
  window.addBookmark = addBookmark;
  window.deleteBookmark = deleteBookmark;
  window.addNote = addNote;
  window.deleteNote = deleteNote;
  window.openBookPreview = openBookPreview;
  window.sanitizeBookForStorage = sanitizeBookForStorage;
  window.saveUserPurchasedBooks = saveUserPurchasedBooks;
}

/**
 * Convert base64 data URL to Uint8Array for PDF.js
 */
function getPdfUint8ArrayFromDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return null;
  const clean = dataUrl.trim();
  if (!clean.startsWith("data:")) return null;

  const base64Idx = clean.indexOf(";base64,");
  if (base64Idx !== -1) {
    try {
      const base64 = clean.substring(base64Idx + 8);
      const binary = window.atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error("Failed to decode base64 PDF data URL:", e);
      return null;
    }
  }
  return null;
}

/**
 * Generate in-memory PDF Uint8Array using jsPDF for sample seed books without an uploaded file
 */
function generateSamplePdfBytes(title, author, totalPagesCount) {
  try {
    const jsPdfLib = window.jspdf ? window.jspdf.jsPDF : (typeof jsPDF !== "undefined" ? jsPDF : null);
    if (!jsPdfLib) return null;

    const doc = new jsPdfLib({ unit: "pt", format: "a4" });
    const count = Math.max(Number(totalPagesCount) || 10, 10);

    for (let i = 1; i <= count; i++) {
      if (i > 1) doc.addPage();

      // Page background
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 595, 842, "F");

      // Top purple header bar
      doc.setFillColor(124, 58, 237);
      doc.rect(0, 0, 595, 60, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`StudyMart - Book Preview`, 30, 36);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(22);
      doc.text(`Page ${i}`, 40, 110);

      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105);
      doc.text(`Book Title: ${title || 'Sample Book'}`, 40, 145);
      doc.text(`Author: ${author || 'StudyMart Author'}`, 40, 170);

      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Sample PDF Content - Page ${i} of ${count}`, 40, 220);
      doc.text(`This sample document represents pages when no custom PDF file has been uploaded yet.`, 40, 245);
      doc.text(`Upload a real PDF file in the Book Builder to render your actual book pages.`, 40, 270);

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${count}`, 270, 810);
    }

    const buf = doc.output("arraybuffer");
    return new Uint8Array(buf);
  } catch (err) {
    console.error("Error generating sample PDF bytes:", err);
    return null;
  }
}

const PDFJS_CMAP_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/";
const PDFJS_CMAP_PACKED = true;
const PDFJS_STANDARD_FONT_DATA_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/";
const PDFJS_WORKER_SRC = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

/**
 * Ensure PDF.js is loaded and worker is set up
 */
async function ensurePdfJs() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("pdfjsLib not available after script load"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js script"));
    document.head.appendChild(script);
  });
}

function createPdfLoadingParams(loadParam) {
  if (typeof loadParam === "object" && loadParam !== null) {
    return {
      ...loadParam,
      cMapUrl: PDFJS_CMAP_URL,
      cMapPacked: PDFJS_CMAP_PACKED,
      standardFontDataUrl: PDFJS_STANDARD_FONT_DATA_URL,
      disableFontFace: true,
      verbosity: 0,
    };
  }
  return loadParam;
}

/**
 * Production-Grade Book Preview Handler
 */
export async function openBookPreview(bookIdOrObj) {
  const alertFn = typeof showCustomAlert === "function" ? showCustomAlert : window.showCustomAlert;

  // 1. Look up book object
  let book = null;
  if (typeof bookIdOrObj === "object" && bookIdOrObj !== null) {
    book = bookIdOrObj;
  } else if (bookIdOrObj !== undefined && bookIdOrObj !== null) {
    const targetId = String(bookIdOrObj);
    
    // Check activeBookState in window or local scope if available
    if (window.activeBookState && String(window.activeBookState.id) === targetId) {
      book = window.activeBookState;
    }
    
    if (!book) {
      try {
        const stored = localStorage.getItem("studymart_custom_books");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            book = list.find((b) => String(b.id) === targetId);
          }
        }
      } catch (e) {}
    }

    if (!book) {
      const booksList = window.booksData || booksData || [];
      book = booksList.find((b) => String(b.id) === targetId);
    }
  }

  if (!book) {
    if (alertFn) alertFn("عذراً، لم يتم العثور على بيانات الكتاب المطلوب.");
    return;
  }

  // 2. Determine file source
  let rawSource =
    (book.previewFileDataUrl && book.previewFileDataUrl.trim()) ||
    (book.previewFileUrl && String(book.previewFileUrl).trim()) ||
    (book.fileDataUrl && book.fileDataUrl.trim()) ||
    (book.fileUrl && String(book.fileUrl).trim());

  if (!rawSource && book.id) {
    const idbPrev = await getBookFileFromIDB(book.id, "preview");
    const idbMain = await getBookFileFromIDB(book.id, "main");
    rawSource = idbPrev || idbMain || "";
  }

  let pdfBytes = getPdfUint8ArrayFromDataUrl(rawSource);

  const configuredPagesLimit = Number(book.previewPagesCount) > 0 ? Number(book.previewPagesCount) : 10;

  // 3. Setup Modal DOM
  const oldModal = document.getElementById("bookPreviewModalOverlay");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "bookPreviewModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.style.zIndex = "99999";

  let pdfDoc = null;
  let currentPreviewPage = 1;
  let maxAllowedPages = configuredPagesLimit;
  let activeViewMode = "single"; // "single" | "all"
  let previewZoomScale = 0.80; // Default sensible zoom level (80%)

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 860px; width: 94%; position: relative; padding: 24px; border-radius: 20px; text-align: right; max-height: 90vh; display: flex; flex-direction: column;" dir="rtl">
      <!-- Modal Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--border-color, #f1f5f9); padding-bottom: 14px; margin-bottom: 16px; flex-shrink: 0;">
        <div>
          <span id="previewStatusBadge" style="font-size: 12px; font-weight: 800; color: #16a34a; background: #dcfce7; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 6px;">
            🔒 معاينة محدودة بـ ${configuredPagesLimit} صفحات من الكتاب الأصلي
          </span>
          <h3 style="margin: 0; color: var(--text-primary, #0f172a); font-size: 19px; font-weight: 800;">
            معاينة كتاب: ${escapeHtml(book.title)}
          </h3>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <!-- View Mode Switcher -->
          <div style="display: flex; background: #e2e8f0; padding: 3px; border-radius: 10px; font-size: 12px; font-weight: 700;">
            <button type="button" id="btnViewSingle" style="padding: 5px 12px; border-radius: 8px; border: none; background: #7c3aed; color: #ffffff; cursor: pointer;">صفحة بصفحة</button>
            <button type="button" id="btnViewAll" style="padding: 5px 12px; border-radius: 8px; border: none; background: transparent; color: #475569; cursor: pointer;">عرض جميع الصفحات</button>
          </div>
          <button type="button" class="btn-close-modal" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#e2e8f0';" onmouseout="this.style.background='var(--bg-muted, #f1f5f9)';" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>
      </div>

      <!-- PDF Canvas Page Container (Fixed Viewport) -->
      <div id="pdfCanvasContainer" style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 16px; padding: 18px; height: 480px; max-height: 55vh; min-height: 360px; overflow: auto; margin-bottom: 16px; display: block; text-align: center; position: relative; box-sizing: border-box;">
        <div id="pdfCanvasWrapper" style="display: inline-block; min-width: 100%; text-align: center; vertical-align: top;">
          <div style="text-align: center; padding: 50px 20px; color: #64748b; font-weight: 700;">
            ⏳ جاري فتح واستخراج صفحات ملف الكتاب الأصلي...
          </div>
        </div>
      </div>

      <!-- Navigation & Controls Bar -->
      <div id="previewControlsBar" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: #f1f5f9; padding: 12px 18px; border-radius: 14px; flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button type="button" id="previewPrevBtn" style="padding: 8px 16px; border-radius: 10px; background: #ffffff; border: 1px solid #cbd5e1; font-weight: 700; font-size: 13px; color: #0f172a; cursor: pointer;">
            ← الصفحة السابقة
          </button>
          <button type="button" id="previewNextBtn" style="padding: 8px 16px; border-radius: 10px; background: #7c3aed; color: #ffffff; border: none; font-weight: 700; font-size: 13px; cursor: pointer;">
            الصفحة التالية →
          </button>
        </div>

        <!-- Zoom Controls -->
        <div style="display: flex; align-items: center; gap: 6px; background: #ffffff; padding: 4px 10px; border-radius: 10px; border: 1px solid #cbd5e1;">
          <span style="font-size: 12px; font-weight: 700; color: #64748b; margin-left: 2px;">التكبير:</span>
          <button type="button" id="previewZoomOutBtn" title="تصغير" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 800; font-size: 16px; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">−</button>
          <span id="previewZoomVal" style="font-size: 12px; font-weight: 800; color: #0f172a; min-width: 42px; text-align: center;">80%</span>
          <button type="button" id="previewZoomInBtn" title="تكبير" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-weight: 800; font-size: 16px; color: #0f172a; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;">+</button>
        </div>

        <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #334155;">
          <span>الانتقال لصفحة:</span>
          <input type="number" id="previewJumpInput" min="1" max="${configuredPagesLimit}" value="1" style="width: 65px; padding: 6px; border-radius: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 800; font-size: 14px;" />
          <span id="previewPageIndicator">الصفحة 1 من ${configuredPagesLimit}</span>
          <button type="button" id="previewJumpBtn" style="padding: 6px 12px; border-radius: 8px; background: #0f172a; color: #fff; border: none; font-size: 12px; font-weight: 700; cursor: pointer;">انتقال</button>
        </div>

        <button type="button" class="btn-secondary-outline sm" style="padding: 8px 16px; border-radius: 10px; cursor: pointer; font-weight: 700;" onclick="this.closest('.floating-modal-overlay').remove()">
          إغلاق المعاينة
        </button>
      </div>

      <div id="previewFooterIndicator" style="text-align: center; margin-top: 8px; font-size: 11px; color: #94a3b8; font-weight: 600; flex-shrink: 0;">
        معاينة حقيقية مستخرجة من ملف PDF المرفوع
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Function to render single active page
  async function renderSinglePage() {
    const wrapper = overlay.querySelector("#pdfCanvasWrapper");
    if (!wrapper || !pdfDoc) return;

    if (currentPreviewPage < 1) currentPreviewPage = 1;
    if (currentPreviewPage > maxAllowedPages) currentPreviewPage = maxAllowedPages;

    updateControlsUI();

    wrapper.innerHTML = `<div style="text-align:center; padding:40px; color:#64748b; font-weight:700;">⏳ جاري عرض الصفحة ${currentPreviewPage}...</div>`;

    try {
      const page = await pdfDoc.getPage(currentPreviewPage);
      if (document.fonts && document.fonts.ready) {
        try { await document.fonts.ready; } catch (e) {}
      }

      const parentBox = wrapper.parentElement || wrapper;
      const containerWidth = parentBox.clientWidth > 0 ? Math.max(parentBox.clientWidth - 28, 300) : 720;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const fitScale = (containerWidth / unscaledViewport.width) * previewZoomScale;
      const baseScale = Math.min(Math.max(fitScale, 0.3), 3.0);
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: baseScale });

      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.margin = "0 auto";
      canvas.style.maxWidth = "none";
      canvas.style.height = "auto";
      canvas.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)";
      canvas.style.borderRadius = "12px";
      canvas.style.background = "#ffffff";

      const ctx = canvas.getContext("2d");
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = Math.floor(viewport.width) + "px";
      canvas.style.height = Math.floor(viewport.height) + "px";

      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

      wrapper.innerHTML = "";
      wrapper.appendChild(canvas);

      await page.render({ canvasContext: ctx, transform: transform, viewport: viewport }).promise;
    } catch (err) {
      console.error("Error rendering PDF page:", err);
      wrapper.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444; font-weight:700;">❌ تعذر عرض الصفحة ${currentPreviewPage}.</div>`;
    }
  }

  // Function to render all preview pages stacked vertically
  async function renderAllPagesStacked() {
    const wrapper = overlay.querySelector("#pdfCanvasWrapper");
    if (!wrapper || !pdfDoc) return;

    wrapper.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b; font-weight:700;">⏳ جاري استخراج كافة صفحات المعاينة الـ ${maxAllowedPages}...</div>`;

    wrapper.innerHTML = "";
    for (let p = 1; p <= maxAllowedPages; p++) {
      const pageBox = document.createElement("div");
      pageBox.id = `previewPageContainer_${p}`;
      pageBox.style.marginBottom = "24px";
      pageBox.style.display = "flex";
      pageBox.style.flexDirection = "column";
      pageBox.style.alignItems = "center";
      pageBox.style.width = "100%";

      const badge = document.createElement("div");
      badge.style.fontSize = "12px";
      badge.style.fontWeight = "800";
      badge.style.color = "#475569";
      badge.style.background = "#e2e8f0";
      badge.style.padding = "3px 12px";
      badge.style.borderRadius = "12px";
      badge.style.marginBottom = "10px";
      badge.textContent = `الصفحة ${p} من ${maxAllowedPages}`;
      pageBox.appendChild(badge);

      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.maxWidth = "none";
      canvas.style.margin = "0 auto";
      canvas.style.height = "auto";
      canvas.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      canvas.style.borderRadius = "12px";
      canvas.style.background = "#ffffff";
      pageBox.appendChild(canvas);

      wrapper.appendChild(pageBox);

      try {
        const page = await pdfDoc.getPage(p);
        if (document.fonts && document.fonts.ready) {
          try { await document.fonts.ready; } catch (e) {}
        }

        const parentBox = wrapper.parentElement || wrapper;
        const containerWidth = parentBox.clientWidth > 0 ? Math.max(parentBox.clientWidth - 28, 300) : 720;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const fitScale = (containerWidth / unscaledViewport.width) * previewZoomScale;
        const baseScale = Math.min(Math.max(fitScale, 0.3), 3.0);
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: baseScale });

        const ctx = canvas.getContext("2d");
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

        await page.render({ canvasContext: ctx, transform: transform, viewport: viewport }).promise;
      } catch (err) {
        console.error(`Error rendering page ${p}:`, err);
      }
    }

    const endNotice = document.createElement("div");
    endNotice.style.textAlign = "center";
    endNotice.style.padding = "16px";
    endNotice.style.background = "#fef3c7";
    endNotice.style.color = "#92400e";
    endNotice.style.borderRadius = "12px";
    endNotice.style.fontWeight = "800";
    endNotice.style.fontSize = "13px";
    endNotice.style.marginTop = "10px";
    endNotice.style.width = "100%";
    endNotice.textContent = `🔒 وصلت لنهاية المعاينة المتاحة (${maxAllowedPages} صفحات من الكتاب الأصلي). اشترِ الكتاب لقراءة النسخة الكاملة!`;
    wrapper.appendChild(endNotice);
  }

  function updateControlsUI() {
    const prevBtn = overlay.querySelector("#previewPrevBtn");
    const nextBtn = overlay.querySelector("#previewNextBtn");
    const pageIndicator = overlay.querySelector("#previewPageIndicator");
    const statusBadge = overlay.querySelector("#previewStatusBadge");
    const footerIndicator = overlay.querySelector("#previewFooterIndicator");
    const jumpInput = overlay.querySelector("#previewJumpInput");
    const controlsBar = overlay.querySelector("#previewControlsBar");

    if (controlsBar) {
      controlsBar.style.display = activeViewMode === "single" ? "flex" : "none";
    }

    if (statusBadge) {
      statusBadge.textContent = `🔒 معاينة متاحة: ${maxAllowedPages} صفحات من البداية`;
    }
    if (pageIndicator) {
      pageIndicator.textContent = `الصفحة ${currentPreviewPage} من ${maxAllowedPages}`;
    }
    if (footerIndicator) {
      footerIndicator.textContent = `نسخة المعاينة الحقيقية — الصفحة ${currentPreviewPage} من أصل ${maxAllowedPages} صفحات مسموحة`;
    }
    if (jumpInput) {
      jumpInput.value = currentPreviewPage;
      jumpInput.max = maxAllowedPages;
    }

    if (prevBtn) {
      const isFirst = currentPreviewPage <= 1;
      prevBtn.disabled = isFirst;
      prevBtn.style.opacity = isFirst ? "0.5" : "1";
      prevBtn.style.cursor = isFirst ? "not-allowed" : "pointer";
    }

    if (nextBtn) {
      const isLast = currentPreviewPage >= maxAllowedPages;
      nextBtn.disabled = isLast;
      nextBtn.style.opacity = isLast ? "0.5" : "1";
      nextBtn.style.cursor = isLast ? "not-allowed" : "pointer";
    }
  }

  // Load PDF with PDF.js
  let pdfjs = null;
  try {
    pdfjs = await ensurePdfJs();
  } catch (err) {
    console.warn("Failed to initialize PDF.js:", err);
  }

  if (pdfjs) {
    let loadParam = null;

    if (pdfBytes) {
      loadParam = { data: pdfBytes };
    } else if (rawSource) {
      if (rawSource.startsWith("data:")) {
        const uint8Bytes = getPdfUint8ArrayFromDataUrl(rawSource);
        if (uint8Bytes) loadParam = { data: uint8Bytes };
      } else {
        loadParam = { url: rawSource };
      }
    }

    if (loadParam) {
      try {
        const loadingTask = pdfjs.getDocument(createPdfLoadingParams(loadParam));
        pdfDoc = await loadingTask.promise;
      } catch (err) {
        console.warn("Primary PDF loading failed:", err);
        pdfDoc = null;
      }
    }
  }

  if (pdfDoc) {
    maxAllowedPages = Math.min(configuredPagesLimit, pdfDoc.numPages);
    if (maxAllowedPages < 1) maxAllowedPages = 1;
    renderSinglePage();
  } else {
    const wrapper = overlay.querySelector("#pdfCanvasWrapper");
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="text-align: center; padding: 40px 24px; color: #ef4444; font-weight: 700; background: #fef2f2; border: 1px dashed #fca5a5; border-radius: 16px; max-width: 600px; margin: 20px auto;">
          <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
          <div style="font-size: 16px; color: #991b1b; margin-bottom: 6px; font-weight: 800;">تعذر فتح ملف PDF المرفوع</div>
          <div style="font-size: 13px; color: #7f1d1d; font-weight: 500; line-height: 1.6;">
            تعذر معالجة أو فتح ملف PDF المرفوع لهذا الكتاب. يُرجى التأكد من اختيار ورفع ملف PDF صالِح.
          </div>
        </div>
      `;
    }
  }

  // Setup button event listeners
  const btnSingle = overlay.querySelector("#btnViewSingle");
  const btnAll = overlay.querySelector("#btnViewAll");
  const prevBtn = overlay.querySelector("#previewPrevBtn");
  const nextBtn = overlay.querySelector("#previewNextBtn");
  const jumpBtn = overlay.querySelector("#previewJumpBtn");
  const jumpInput = overlay.querySelector("#previewJumpInput");

  if (btnSingle && btnAll) {
    btnSingle.onclick = () => {
      activeViewMode = "single";
      btnSingle.style.background = "#7c3aed";
      btnSingle.style.color = "#ffffff";
      btnAll.style.background = "transparent";
      btnAll.style.color = "#475569";
      renderSinglePage();
    };

    btnAll.onclick = () => {
      activeViewMode = "all";
      btnAll.style.background = "#7c3aed";
      btnAll.style.color = "#ffffff";
      btnSingle.style.background = "transparent";
      btnSingle.style.color = "#475569";
      updateControlsUI();
      renderAllPagesStacked();
    };
  }

  const pZoomInBtn = overlay.querySelector("#previewZoomInBtn");
  const pZoomOutBtn = overlay.querySelector("#previewZoomOutBtn");
  const pZoomVal = overlay.querySelector("#previewZoomVal");

  if (pZoomInBtn) {
    pZoomInBtn.onclick = () => {
      if (previewZoomScale < 1.60) {
        previewZoomScale = Math.min(1.60, Math.round((previewZoomScale + 0.15) * 100) / 100);
        if (pZoomVal) pZoomVal.textContent = `${Math.round(previewZoomScale * 100)}%`;
        if (activeViewMode === "single") renderSinglePage();
        else renderAllPagesStacked();
      }
    };
  }

  if (pZoomOutBtn) {
    pZoomOutBtn.onclick = () => {
      if (previewZoomScale > 0.45) {
        previewZoomScale = Math.max(0.45, Math.round((previewZoomScale - 0.15) * 100) / 100);
        if (pZoomVal) pZoomVal.textContent = `${Math.round(previewZoomScale * 100)}%`;
        if (activeViewMode === "single") renderSinglePage();
        else renderAllPagesStacked();
      }
    };
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      if (currentPreviewPage > 1) {
        currentPreviewPage--;
        renderSinglePage();
      }
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      if (currentPreviewPage < maxAllowedPages) {
        currentPreviewPage++;
        renderSinglePage();
      } else {
        if (alertFn) alertFn(`🔒 وصلتك لنهاية المعاينة المتاحة (${maxAllowedPages} صفحات). يمكنك شراء الكتاب لقراءته كاملاً!`);
      }
    };
  }

  if (jumpBtn && jumpInput) {
    const handleJump = () => {
      let val = Number(jumpInput.value);
      if (isNaN(val) || val < 1) val = 1;
      if (val > maxAllowedPages) {
        val = maxAllowedPages;
        if (alertFn) alertFn(`🔒 أقصى عدد صفحات مسموح في المعاينة هو ${maxAllowedPages} صفحات.`);
      }
      currentPreviewPage = val;
      renderSinglePage();
    };
    jumpBtn.onclick = handleJump;
    jumpInput.onkeydown = (e) => {
      if (e.key === "Enter") handleJump();
    };
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const handleEsc = (e) => {
    if (e.key === "Escape") {
      overlay.remove();
      document.removeEventListener("keydown", handleEsc);
    }
  };
  document.addEventListener("keydown", handleEsc);
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



