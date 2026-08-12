import { booksData } from "../data/books.js";
import { showCustomAlert } from "../utils/helpers.js";
import { isFavorite, toggleFavorite } from "../services/favoritesService.js";
import { getFeaturedConfig, applyFeaturedMetadata } from "../.featured-config.js";

const bookSectionId = "books";
const booksGridId = "booksGrid";

let activeBookTab = "bestseller";

export function handleBookTabClick(btn, tab) {
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll(".tab-pill").forEach((el) => el.classList.remove("active"));
    btn.classList.add("active");
  } else if (typeof btn === "string") {
    tab = btn;
  }
  if (tab) {
    activeBookTab = tab;
  }
  renderBooks();
}
if (typeof window !== "undefined") {
  window.handleBookTabClick = handleBookTabClick;
}

export function setupBooks() {
  renderBooksSection();
}

export function renderBooksSection() {
  let section = document.getElementById(bookSectionId);
  if (section && section.dataset.initialized) return;
  if (section) {
    section.dataset.initialized = "true";
  } else {
    section = document.createElement("section");
    section.id = bookSectionId;
    section.className = "books-section";
    section.dataset.initialized = "true";

    section.innerHTML = `
      <div class="books-container">
        <h2 class="books-title">جميع الكتب</h2>
        <p class="books-subtitle">اكتشف مجموعة واسعة من الكتب التعليمية</p>

        <!-- البحث -->
        <div class="books-filter-bar">
          <input
            id="bookSearch"
            class="books-search-input"
            placeholder="ابحث عن كتاب..."
          />

          <select id="bookCategory" class="books-category-select">
            <option value="all">جميع الفئات</option>
            <option value="برمجة">برمجة</option>
            <option value="لغات">لغات</option>
            <option value="تداول">تداول</option>
            <option value="تنمية ذاتية">تنمية ذاتية</option>
            <option value="ريادة أعمال">ريادة أعمال</option>
            <option value="تصميم جرافيك">تصميم جرافيك</option>
          </select>
        </div>

        <!-- الكتب -->
        <div id="booksGrid" class="books-grid"></div>
      </div>
    `;

    const container = document.querySelector(".site-footer") || document.querySelector(".courses") || document.body;
    if (container && container.parentNode) {
      container.parentNode.insertBefore(section, container.nextSibling);
    } else {
      document.body.appendChild(section);
    }
  }

  const bookSearch = document.getElementById("bookSearch");
  const bookCategoryFilter = document.getElementById("bookCategory");

  if (bookSearch && !bookSearch.dataset.bound) {
    bookSearch.dataset.bound = "true";
    bookSearch.addEventListener("input", renderBooks);
  }
  if (bookCategoryFilter && !bookCategoryFilter.dataset.bound) {
    bookCategoryFilter.dataset.bound = "true";
    bookCategoryFilter.addEventListener("change", renderBooks);
  }

  renderBooks();
}

export function createBookCard(book) {
  const favState = isFavorite("book", book.id);
  const heartFill = favState ? "#ef4444" : "none";
  const heartStroke = favState ? "#ef4444" : "#ffffff";

  const rawPrice = Number(book.price) || 0;
  const rawDiscount = Number(book.discountPrice) || 0;
  const rawOrig = Number(book.originalPrice || book.oldPrice) || 0;

  let currentPrice = rawPrice;
  let originalPrice = null;

  if (rawDiscount > 0 && rawDiscount < rawPrice) {
    currentPrice = rawDiscount;
    originalPrice = rawPrice;
  } else if (rawOrig > rawPrice) {
    currentPrice = rawPrice;
    originalPrice = rawOrig;
  }

  const hasDiscount = originalPrice !== null && originalPrice > currentPrice;

  const priceHtml = hasDiscount ? `
    <div class="book-price-box">
      <span class="book-orig-price">$${originalPrice}</span>
      <span class="book-curr-price">$${currentPrice}</span>
    </div>
  ` : `
    <div class="book-price-box">
      <span class="book-curr-price">${book.isFree || currentPrice === 0 ? "مجاني" : "$" + currentPrice}</span>
    </div>
  `;

  const detailLine = book.shortDescription || (book.pages ? `${book.pages} صفحة` : "") || (book.subCategory || "");

  const card = document.createElement("div");
  card.className = "course-card book-card";
  card.innerHTML = `
    <div class="course-image" onclick="if(window.showBookDetails) window.showBookDetails(${book.id});" style="background-image: url('${book.image}'); background-size:cover; background-position:center; position:relative; cursor:pointer;">
      <button type="button" class="course-fav-btn ${favState ? "active" : ""}" title="${favState ? "إزالة من المفضلة" : "إضافة للمفضلة"}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </button>
    </div>
    <div class="course-content">
      <span class="course-category-tag">📚 كتاب إلكتروني • ${book.category}</span>
      <h3 class="book-title" onclick="if(window.showBookDetails) window.showBookDetails(${book.id});" style="cursor:pointer;">${book.title}</h3>
      <p class="book-author">المؤلف: ${book.author}</p>
      ${detailLine ? `<p class="book-short-desc">${detailLine}</p>` : ""}
      <div class="book-card-footer">
        ${priceHtml}
        <div class="book-actions-group">
          <button type="button" class="book-btn-details" onclick="if(window.showBookDetails) window.showBookDetails(${book.id});">
            التفاصيل
          </button>
          <button type="button" class="book-btn-cart" title="إضافة للسلة" aria-label="إضافة للسلة" onclick="if(window.addBookToCart) window.addBookToCart(${book.id}); else if(typeof addBookToCart === 'function') addBookToCart(${book.id});">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><span class="btn-cart-text">إضافة للسلة</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const favBtn = card.querySelector(".course-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const added = toggleFavorite("book", book);
      const svg = favBtn.querySelector("svg");
      if (added) {
        favBtn.classList.add("active");
        favBtn.title = "إزالة من المفضلة";
        if (svg) {
          svg.setAttribute("fill", "#ef4444");
          svg.setAttribute("stroke", "#ef4444");
        }
      } else {
        favBtn.classList.remove("active");
        favBtn.title = "إضافة للمفضلة";
        if (svg) {
          svg.setAttribute("fill", "none");
          svg.setAttribute("stroke", "#ffffff");
        }
      }
    });
  }

  return card;
}

export function renderBooks(specifiedTab) {
  if (typeof specifiedTab === "string" && specifiedTab.trim()) {
    activeBookTab = specifiedTab.trim();
  }

  applyFeaturedMetadata([], booksData);

  const grid = document.getElementById(booksGridId);
  if (!grid) return;

  let candidateData = booksData;
  let list = [];

  if (activeBookTab === "bestseller") {
    list = candidateData.filter((b) => b.isBestSeller);
    if (list.length < 4) {
      const sorted = [...candidateData].sort((a, b) => (Number(b.purchases || b.downloads) || 0) - (Number(a.purchases || a.downloads) || 0));
      sorted.forEach((b) => {
        if (!list.some((item) => String(item.id) === String(b.id))) list.push(b);
      });
    }
  } else if (activeBookTab === "featured") {
    const { featuredBooks } = getFeaturedConfig();
    const featuredList = [];
    (featuredBooks || []).forEach((id) => {
      const found = candidateData.find((b) => String(b.id) === String(id));
      if (found) featuredList.push(found);
    });
    candidateData.forEach((b) => {
      if (b.isFeatured && !featuredList.some((item) => String(item.id) === String(b.id))) {
        featuredList.push(b);
      }
    });
    list = featuredList;
    if (list.length < 4) {
      candidateData.forEach((b) => {
        if (!list.some((item) => String(item.id) === String(b.id))) list.push(b);
      });
    }
  } else if (activeBookTab === "toprated") {
    list = candidateData.filter((b) => b.isTopRated);
    if (list.length < 4) {
      const sorted = [...candidateData].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
      sorted.forEach((b) => {
        if (!list.some((item) => String(item.id) === String(b.id))) list.push(b);
      });
    }
  } else if (activeBookTab === "new") {
    list = candidateData.filter((b) => b.isNew);
    if (list.length < 4) {
      const sorted = [...candidateData].sort((a, b) => Number(b.id) - Number(a.id));
      sorted.forEach((b) => {
        if (!list.some((item) => String(item.id) === String(b.id))) list.push(b);
      });
    }
  } else if (activeBookTab === "offers") {
    list = candidateData.filter((b) => b.isOffer);
    if (list.length < 4) {
      candidateData.forEach((b) => {
        if (!list.some((item) => String(item.id) === String(b.id))) list.push(b);
      });
    }
  } else {
    list = candidateData;
  }

  if (list.length < 4 && booksData.length > 0) {
    booksData.forEach((b) => {
      if (!list.some((item) => String(item.id) === String(b.id))) list.push(b);
    });
  }

  const listToRender = list.slice(0, Math.min(4, booksData.length));

  if (!listToRender || listToRender.length === 0) {
    grid.innerHTML =
      "<p style='grid-column:1/-1;text-align:center;color:var(--text-secondary)'>لا توجد كتب</p>";
    return;
  }

  const fragment = document.createDocumentFragment();
  listToRender.forEach((book) => {
    const card = createBookCard(book);
    fragment.appendChild(card);
  });

  grid.replaceChildren(fragment);
}

export function addBookToCart(bookId, cartState) {
  const book = booksData.find((entry) => entry.id === bookId);
  if (!book) return;

  if (cartState && cartState.items && cartState.items.some((item) => item.id === bookId)) {
    showCustomAlert("هذا الكتاب موجود بالفعل في السلة");
    return;
  }

  if (cartState && cartState.items) {
    cartState.items.push({
      id: book.id,
      title: book.title,
      price: book.price,
      type: "book",
    });
  }

  const event = new CustomEvent("cartUpdated", {
    detail: { cart: cartState ? cartState.items : [] },
  });
  document.dispatchEvent(event);
  showCustomAlert("تمت إضافة الكتاب إلى السلة");
}

export function filterStandaloneBooks() {
  const searchInput = document.getElementById("standaloneBookSearch");
  const categorySelect = document.getElementById("standaloneBookCategory");
  const grid = document.getElementById("standaloneBooksGrid");

  if (!grid) return;

  const query = searchInput ? searchInput.value : "";
  const cat = categorySelect ? categorySelect.value : "all";

  const filtered = booksData.filter((book) => {
    const matchesSearch = typeof window.matchBook === "function" ? window.matchBook(book, query) : true;

    const matchesCategory =
      cat === "all" ||
      book.category === cat ||
      (cat === "ذكاء اصطناعي" && (book.title.includes("ذكاء") || book.category.includes("ذكاء")));

    return matchesSearch && matchesCategory;
  });

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 45px 20px; background: var(--card-bg, #ffffff); border-radius: 12px; border: 1px dashed var(--border-color, #e2e8f0); margin: 20px 0;">
        <p style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">لا توجد كتب مطابقة للبحث</p>
        <p style="font-size: 14px; color: var(--text-secondary);">لم نجد أي كتب تطابق الفئة أو بحثك الحالي. جرب اختيار فئة أخرى.</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((book) => {
    const card = createBookCard(book);
    fragment.appendChild(card);
  });

  grid.replaceChildren(fragment);
}

if (typeof window !== "undefined") {
  window.renderBooks = renderBooks;
  window.filterStandaloneBooks = filterStandaloneBooks;
  window.addBookToCart = addBookToCart;
}
