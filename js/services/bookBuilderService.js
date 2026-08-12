import { booksData } from "../data/books.js";
import { showCustomAlert } from "../utils/helpers.js";
import { hideAllMainSections } from "./layoutService.js";
import { openBookManagementDashboard } from "./bookManagementService.js";
import { isTeacher } from "./permissionService.js";
import { saveBookFileToIDB, getBookFileFromIDB } from "../utils/pdfStorage.js";

// Active Book Builder State
let activeBookState = null;
let activeBuilderTab = "info"; // "info" | "content" | "publishing"
let autoSaveTimer = null;
let autoSaveStatus = "saved"; // saved | saving | unsaved

const BUILDER_STEPS = [
  { key: "info", title: "1. الأساسية", icon: "📝", label: "الأساسية" },
  { key: "content", title: "2. المحتوى والملفات", icon: "📁", label: "المحتوى والملفات" },
  { key: "publishing", title: "3. البيع والنشر", icon: "💰", label: "البيع والنشر" }
];

/**
 * Validate Book Requirements for Publishing
 */
export function validateBookForPublish(book) {
  if (!book) {
    return {
      isValid: false,
      missing: ["بيانات الكتاب غير موجودة"],
      hasTitle: false,
      hasCover: false,
      hasFile: false,
      hasCategory: false,
      hasPrice: false
    };
  }

  const missing = [];

  const hasTitle = Boolean(book.title && book.title.trim().length > 0 && book.title.trim() !== "كتاب جديد بدون عنوان");
  if (!hasTitle) {
    missing.push("عنوان الكتاب الرئيسي (في قسم الأساسية)");
  }

  const hasCover = Boolean(book.image && book.image.trim().length > 0);
  if (!hasCover) {
    missing.push("صورة غلاف الكتاب (في قسم المحتوى والملفات)");
  }

  const hasFile = Boolean(book.fileUrl && book.fileUrl.trim().length > 0);
  if (!hasFile) {
    missing.push("ملف الكتاب الرئيسي (في قسم المحتوى والملفات)");
  }

  const hasCategory = Boolean(book.category && book.category.trim().length > 0);
  if (!hasCategory) {
    missing.push("تصنيف الكتاب الرئيسي (في قسم الأساسية)");
  }

  const hasPrice = book.isFree || (Number(book.price) >= 0 && book.price !== "" && book.price !== null && !isNaN(book.price));
  if (!hasPrice) {
    missing.push("سعر الكتاب أو التأشير ككتاب مجاني (في قسم البيع والنشر)");
  }

  return {
    isValid: missing.length === 0,
    missing,
    hasTitle,
    hasCover,
    hasFile,
    hasCategory,
    hasPrice
  };
}

const PDFJS_CMAP_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/";
const PDFJS_CMAP_PACKED = true;
const PDFJS_STANDARD_FONT_DATA_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/";
const PDFJS_WORKER_SRC = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

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

async function detectPdfPageCount(fileOrUrl) {
  if (!fileOrUrl) return null;

  try {
    const pdfjs = await ensurePdfJs();
    let loadParam = null;

    if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      const arrayBuffer = await fileOrUrl.arrayBuffer();
      loadParam = { data: arrayBuffer };
    } else if (typeof fileOrUrl === "string") {
      const clean = fileOrUrl.trim();
      if (clean.startsWith("data:")) {
        const base64Idx = clean.indexOf(";base64,");
        if (base64Idx !== -1) {
          const base64 = clean.substring(base64Idx + 8);
          const binary = window.atob(base64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          loadParam = { data: bytes };
        }
      } else if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("blob:")) {
        loadParam = { url: clean };
      }
    }

    if (!loadParam) return null;

    const loadingTask = pdfjs.getDocument({
      ...loadParam,
      cMapUrl: PDFJS_CMAP_URL,
      cMapPacked: PDFJS_CMAP_PACKED,
      standardFontDataUrl: PDFJS_STANDARD_FONT_DATA_URL,
      disableFontFace: true,
      verbosity: 0,
    });
    const pdfDoc = await loadingTask.promise;
    if (pdfDoc && pdfDoc.numPages > 0) {
      return pdfDoc.numPages;
    }
  } catch (err) {
    console.warn("Could not detect PDF page count:", err);
  }
  return null;
}

async function recalculateAndSyncBookPages(bookState) {
  if (!bookState) return;
  const fileSource = bookState.fileDataUrl || bookState.fileUrl;
  if (!fileSource) return;

  const count = await detectPdfPageCount(fileSource);
  if (count && count > 0) {
    bookState.pages = count;
    renderBookBuilderUI();
  }
}

/**
 * Open Book Builder Page
 */
export async function openBookBuilder(bookId = null) {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، لوحة إنتاج الكتب مخصصة للمعلمين والمالك فقط.");
    return;
  }

  hideAllMainSections();

  const bookBuilderPage = document.getElementById("bookBuilderPage");
  const bookBuilderContent = document.getElementById("bookBuilderContent");

  if (!bookBuilderPage || !bookBuilderContent) {
    console.error("Book Builder container element missing in DOM");
    return;
  }

  bookBuilderPage.classList.remove("hidden");

  // Load existing book or initialize new draft book
  if (bookId) {
    let customBooks = [];
    try {
      const storedCustom = localStorage.getItem("studymart_custom_books");
      if (storedCustom) customBooks = JSON.parse(storedCustom);
    } catch (e) {}
    const all = [...booksData, ...(Array.isArray(customBooks) ? customBooks : [])];
    const existing = all.find((b) => b.id == bookId || String(b.id) === String(bookId));
    if (existing) {
      activeBookState = JSON.parse(JSON.stringify(existing));
      if (!activeBookState.fileDataUrl && activeBookState.id) {
        const idbFile = await getBookFileFromIDB(activeBookState.id, "main");
        if (idbFile) {
          activeBookState.fileDataUrl = idbFile;
          activeBookState.fileUrl = idbFile;
        }
      }
      if (!activeBookState.previewFileDataUrl && activeBookState.id) {
        const idbPrev = await getBookFileFromIDB(activeBookState.id, "preview");
        if (idbPrev) {
          activeBookState.previewFileDataUrl = idbPrev;
          activeBookState.previewFileUrl = idbPrev;
        }
      }
      recalculateAndSyncBookPages(activeBookState);
    } else {
      activeBookState = createDefaultBook();
    }
    history.pushState(null, "", `#teacher/books/edit?id=${activeBookState.id}`);
  } else {
    activeBookState = createDefaultBook();
    history.pushState(null, "", `#teacher/books/new`);
  }

  window.activeBookState = activeBookState;

  activeBuilderTab = "info";
  autoSaveStatus = "saved";
  renderBookBuilderUI();
  window.scrollTo({ top: 0, behavior: "smooth" });

  setupAutoSaveListener();
}

function createDefaultBook() {
  const newId = Date.now();
  return {
    id: newId,
    title: "كتاب جديد بدون عنوان",
    shortTitle: "",
    author: window.appState?.userData?.name || "اسم المؤلف",
    publisher: "دار النشر الخاصة",
    language: "العربية",
    category: "برمجة",
    subCategory: "عام",
    tags: "",
    price: 0,
    discountPrice: 0,
    currency: "USD",
    isFree: true,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=250&fit=crop&auto=format",
    fileUrl: "",
    sourceType: "upload",
    previewPagesCount: 10,
    previewFileUrl: "",
    status: "draft",
    pages: "",
    edition: "الطبعة الأولى",
    isbn: "978-0-00-000000-0",
    publicationDate: new Date().toISOString().split("T")[0],
    readingTime: "2 ساعة",
    shortDescription: "",
    fullDescription: "",
    seoTitle: "",
    seoDescription: "",
    slug: `book-${newId}`,
    downloads: 0,
    purchases: 0,
    revenue: 0,
    rating: 0,
    reviewsCount: 0,
    purchaseSuccessMessage: "شكراً لشرائك الكتاب! أتمنى لك قراءة ممتعة ومفيدة.",
    welcomeMessage: "مرحباً بك عزيزي القارئ.",
    firstOpenMessage: "يمكنك متابعة قراءة الصفحة الأخيرة تلقائياً.",
    attachments: [],
    versionHistory: [{ version: "v1.0", date: new Date().toISOString().split("T")[0], notes: "إنشاء المسودة الأولى" }]
  };
}

/**
 * Render Main Book Builder Interface
 */
export function renderBookBuilderUI(options = {}) {
  const bookBuilderContent = document.getElementById("bookBuilderContent");
  if (!bookBuilderContent || !activeBookState) return;

  const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;

  const validation = validateBookForPublish(activeBookState);
  const currentStepIndex = Math.max(0, BUILDER_STEPS.findIndex(s => s.key === activeBuilderTab));
  const progressPercent = Math.round(((currentStepIndex + 1) / BUILDER_STEPS.length) * 100);

  bookBuilderContent.innerHTML = `
    <div class="book-builder-container">
      <!-- BREADCRUMB -->
      <div class="book-breadcrumb-bar">
        <a onclick="if(window.openBookManagementDashboard) window.openBookManagementDashboard()">إدارة الكتب</a> &gt; 
        <span>${activeBookState.title ? escapeHtml(activeBookState.title) : 'إنشاء كتاب جديد'}</span>
      </div>

      <!-- HEADER BAR -->
      <div class="book-builder-header">
        <div class="book-builder-title-group">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            ${activeBookState.title ? escapeHtml(activeBookState.title) : 'منشئ الكتب (Book Builder)'}
          </h2>
          <p>أدخل بيانات وتأليف وإعدادات كتابك الإلكتروني بدقة للنشر المتكامل.</p>
        </div>

        <div class="book-header-actions">
          <!-- AUTO SAVE STATUS BADGE -->
          <div class="auto-save-indicator ${autoSaveStatus}" id="autoSaveBadge">
            <span class="save-dot"></span>
            <span id="autoSaveText">
              ${autoSaveStatus === 'saved' ? 'تم الحفظ' : autoSaveStatus === 'saving' ? 'جاري الحفظ...' : 'تغييرات غير محفوظة'}
            </span>
          </div>

          <!-- SAVE DRAFT BUTTON -->
          <button type="button" class="btn-secondary-outline sm" onclick="saveBookDraft()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            حفظ كمسودة
          </button>

          <!-- PREVIEW BUTTON -->
          <button type="button" class="btn-secondary-outline sm" onclick="previewBookAsStudent()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            معاينة الكتاب
          </button>

          <!-- SAVE & PUBLISH BUTTON -->
          <button type="button" class="btn-primary-purple sm" onclick="saveAndPublishBook()" ${!validation.isValid ? 'style="opacity:0.8;"' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            حفظ ونشر الكتاب
          </button>
        </div>
      </div>

      <!-- PROGRESS INDICATOR BAR -->
      <div class="book-builder-progress-wrapper">
        <div class="book-progress-info">
          <span>الخطوة ${currentStepIndex + 1} من ${BUILDER_STEPS.length}: <strong>${BUILDER_STEPS[currentStepIndex].label}</strong></span>
          <span class="progress-percentage">${progressPercent}% مكتمل</span>
        </div>
        <div class="book-progress-track">
          <div class="book-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
      </div>

      <!-- VALIDATION WARNING PANEL (If Invalid) -->
      <div id="validationSummaryContainer">
        ${renderValidationSummary(validation)}
      </div>

      <!-- STRICT 3 TABS NAVIGATION -->
      <div class="book-builder-tabs">
        ${BUILDER_STEPS.map(step => `
          <button type="button" class="book-builder-tab ${activeBuilderTab === step.key ? 'active' : ''}" onclick="switchBookBuilderTab('${step.key}')">
            <span>${step.icon}</span> ${step.title}
          </button>
        `).join('')}
      </div>

      <!-- TAB CONTENT PANELS -->
      <div class="book-tab-panels">
        ${renderTabContent(activeBuilderTab)}
      </div>

      <!-- FOOTER STEP NAVIGATION -->
      <div class="book-builder-footer-nav">
        ${currentStepIndex > 0 ? `
          <button type="button" class="btn-secondary-outline sm" onclick="switchBuilderStepIndex(${currentStepIndex - 1})">
            ← السابق: ${BUILDER_STEPS[currentStepIndex - 1].label}
          </button>
        ` : `<div></div>`}

        ${currentStepIndex < BUILDER_STEPS.length - 1 ? `
          <button type="button" class="btn-primary-purple sm" onclick="switchBuilderStepIndex(${currentStepIndex + 1})">
            التالي: ${BUILDER_STEPS[currentStepIndex + 1].label} →
          </button>
        ` : `
          <button type="button" class="btn-primary-purple sm" onclick="saveAndPublishBook()">
            🚀 حفظ ونشر الكتاب
          </button>
        `}
      </div>
    </div>
  `;

  if (options.resetScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (currentScrollY > 0) {
    window.scrollTo({ top: currentScrollY, behavior: "instant" });
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: "instant" });
    });
  }

  // Horizontally center active tab button in scrollable container without scrolling the window vertically
  requestAnimationFrame(() => {
    const navContainer = bookBuilderContent.querySelector(".book-builder-tabs");
    const activeBtn = navContainer?.querySelector(".book-builder-tab.active");
    if (navContainer && activeBtn) {
      const cRect = navContainer.getBoundingClientRect();
      const bRect = activeBtn.getBoundingClientRect();
      if (bRect.left < cRect.left || bRect.right > cRect.right) {
        navContainer.scrollLeft += (bRect.left - cRect.left) - (cRect.width / 2) + (bRect.width / 2);
      }
    }
  });
}

function renderValidationSummary(validation) {
  if (validation.isValid) return "";
  return `
    <div class="validation-summary-box">
      <h4>⚠️ ينقص هذا الكتاب بعض البيانات الأساسية لتتمكن من النشر:</h4>
      <ul>
        ${validation.missing.map(m => `<li>${m}</li>`).join('')}
      </ul>
    </div>
  `;
}

/**
 * Switch Active Builder Step Index
 */
export function switchBuilderStepIndex(idx) {
  if (idx >= 0 && idx < BUILDER_STEPS.length) {
    activeBuilderTab = BUILDER_STEPS[idx].key;
    renderBookBuilderUI({ resetScroll: true });
  }
}

/**
 * Switch Active Builder Tab
 */
export function switchBookBuilderTab(tabKey) {
  activeBuilderTab = tabKey;
  renderBookBuilderUI();
}

/**
 * Render Content per Tab (3 STRICT SECTIONS ONLY)
 */
function renderTabContent(tabKey) {
  const b = activeBookState;

  switch (tabKey) {
    case "info":
      return `
        <!-- SECTION 1: الأساسية (Basic Information) -->
        <div class="book-section-card">
          <h3 class="book-section-title">📝 القسم الأول: المعلومات الأساسية</h3>
          
          <div class="book-form-grid">
            <div class="book-form-group full-width">
              <label>عنوان الكتاب <span class="required">*</span></label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.title || '')}" placeholder="أدخل اسم الكتاب الرئيسي" oninput="updateBookField('title', this.value)" />
            </div>

            <div class="book-form-group">
              <label>العنوان الفرعي/المختصر</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.shortTitle || '')}" placeholder="مثال: دليل المحترفين في JS" oninput="updateBookField('shortTitle', this.value)" />
            </div>

            <div class="book-form-group">
              <label>اسم المؤلف</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.author || '')}" placeholder="اسم الكاتب أو المؤلف" oninput="updateBookField('author', this.value)" />
            </div>

            <div class="book-form-group">
              <label>دار النشر</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.publisher || '')}" placeholder="اسم دار النشر أو المنصة" oninput="updateBookField('publisher', this.value)" />
            </div>

            <div class="book-form-group">
              <label>لغة الكتاب</label>
              <select class="book-form-control" onchange="updateBookField('language', this.value)">
                <option value="العربية" ${b.language === 'العربية' ? 'selected' : ''}>العربية</option>
                <option value="English" ${b.language === 'English' ? 'selected' : ''}>English</option>
                <option value="Français" ${b.language === 'Français' ? 'selected' : ''}>Français</option>
                <option value="Español" ${b.language === 'Español' ? 'selected' : ''}>Español</option>
              </select>
            </div>

            <div class="book-form-group">
              <label>التصنيف الرئيسي <span class="required">*</span></label>
              <select class="book-form-control" onchange="updateBookField('category', this.value)">
                <option value="برمجة" ${b.category === 'برمجة' ? 'selected' : ''}>برمجة وتطوير</option>
                <option value="لغات" ${b.category === 'لغات' ? 'selected' : ''}>لغات وترجمة</option>
                <option value="تداول" ${b.category === 'تداول' ? 'selected' : ''}>تداول واقتصاد</option>
                <option value="تنمية ذاتية" ${b.category === 'تنمية ذاتية' ? 'selected' : ''}>تنمية ذاتية</option>
                <option value="ريادة أعمال" ${b.category === 'ريادة أعمال' ? 'selected' : ''}>ريادة أعمال</option>
                <option value="تصميم جرافيك" ${b.category === 'تصميم جرافيك' ? 'selected' : ''}>تصميم جرافيك</option>
              </select>
            </div>

            <div class="book-form-group">
              <label>التصنيف الفرعي</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.subCategory || '')}" placeholder="مثال: تطوير الويب" oninput="updateBookField('subCategory', this.value)" />
            </div>

            <div class="book-form-group full-width">
              <label>الوسوم / الكلمات المفتاحية (Tags)</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.tags || '')}" placeholder="تفصل بينها بفواصل (مثال: Javascript, React, Frontend)" oninput="updateBookField('tags', this.value)" />
            </div>

            <div class="book-form-group full-width">
              <label>الوصف المختصر</label>
              <textarea class="book-form-control" placeholder="اكتب نبذة مختصرة تظهر في نتائج البحث وبطاقة الكتاب..." oninput="updateBookField('shortDescription', this.value)">${escapeHtml(b.shortDescription || '')}</textarea>
            </div>

            <!-- RICH TEXT EDITOR FOR FULL DESCRIPTION -->
            <div class="book-form-group full-width">
              <label>الوصف الشامل (Rich Text Editor)</label>
              <div class="rich-text-toolbar">
                <button type="button" class="rich-btn" onclick="execEditorCommand('bold')"><b>B</b></button>
                <button type="button" class="rich-btn" onclick="execEditorCommand('italic')"><i>I</i></button>
                <button type="button" class="rich-btn" onclick="execEditorCommand('insertUnorderedList')">• قائمة</button>
                <button type="button" class="rich-btn" onclick="execEditorCommand('insertOrderedList')">1. رقمية</button>
                <button type="button" class="rich-btn" onclick="execEditorCommand('formatBlock', 'h3')">عنوان H3</button>
                <button type="button" class="rich-btn" onclick="execEditorCommand('removeFormat')">مسح التنسيق</button>
              </div>
              <div id="bookRichEditor" class="rich-text-editor-box" contenteditable="true" oninput="updateBookField('fullDescription', this.innerHTML)">
                ${b.fullDescription || ''}
              </div>
            </div>

            <div class="book-form-group">
              <label>عنوان SEO (Title)</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.seoTitle || '')}" placeholder="عنوان محسن لمحركات البحث" oninput="updateBookField('seoTitle', this.value)" />
            </div>

            <div class="book-form-group">
              <label>وصف SEO (Description)</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.seoDescription || '')}" placeholder="وصف محركات البحث" oninput="updateBookField('seoDescription', this.value)" />
            </div>

            <div class="book-form-group">
              <label>الرابط الدائم (Slug)</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.slug || '')}" placeholder="javascript-modern-book" oninput="updateBookField('slug', this.value)" />
            </div>
          </div>
        </div>
      `;

    case "content":
      return `
        <!-- SECTION 2: المحتوى والملفات (Content & Files) -->
        
        <!-- COVER CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">🖼️ غلاف الكتاب (Book Cover)</h3>
          
          <div class="cover-upload-wrapper">
            <div class="cover-preview-box">
              ${b.image ? `
                <img src="${b.image}" alt="Book Cover" class="cover-preview-img" />
              ` : `
                <div style="text-align:center; padding:10px; color:#94a3b8; font-size:12px;">
                  <span>📐 لا يوجد غلاف</span>
                </div>
              `}
            </div>

            <div class="cover-actions">
              <p style="margin:0 0 10px 0; font-size:13px; color:#64748b;">
                الصيغ المدعومة: PNG, JPG, WEBP (النسبة المقترحة 3:4).
              </p>

              <label class="btn-primary-purple sm" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                رفع غلاف من الجهاز
                <input type="file" accept="image/png, image/jpeg, image/webp" style="display:none;" onchange="handleCoverUpload(event)" />
              </label>

              <button type="button" class="btn-secondary-outline sm" onclick="openCropCoverModal()">
                ✂️ قص وتعديل الغلاف (Crop Tool)
              </button>

              <button type="button" class="btn-secondary-outline sm" onclick="previewCoverModal()">
                🔍 معاينة الغلاف بالحجم الكامل
              </button>

              ${b.image ? `
                <button type="button" class="btn-danger-outline sm" style="color:#ef4444; border-color:#fca5a5;" onclick="deleteCoverImage()">
                  🗑️ حذف الغلاف الحالي
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- FILES CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">📁 ملفات الكتاب الرئيسية (Book Files)</h3>
          
          <div class="source-type-selector">
            <button type="button" class="source-type-btn ${b.sourceType === 'upload' ? 'active' : ''}" onclick="updateBookField('sourceType', 'upload'); renderBookBuilderUI();">
              💻 رفع مباشر من الجهاز
            </button>
            <button type="button" class="source-type-btn ${b.sourceType === 'external' ? 'active' : ''}" onclick="updateBookField('sourceType', 'external'); renderBookBuilderUI();">
              🔗 رابط خارجي (Google Drive / Dropbox / Cloud)
            </button>
          </div>

          <div class="book-form-grid">
            ${b.sourceType === 'upload' ? `
              <div class="book-form-group full-width">
                <label>رفع ملف الكتاب الأصلي (PDF, EPUB, MOBI, DOCX, ZIP)</label>
                <input type="file" class="book-form-control" accept=".pdf,.epub,.mobi,.docx,.zip" onchange="handleBookFileUpload(event)" />
                ${b.fileUrl ? `<div style="margin-top:8px; font-size:13px; color:#15803d; font-weight:700;">✓ الملف المرفوع حالياً: <span>${escapeHtml(b.fileName || (b.fileUrl.startsWith("data:") ? "ملف PDF مرفوع بنجاح" : b.fileUrl))}</span></div>` : ''}
              </div>
            ` : `
              <div class="book-form-group full-width">
                <label>رابط تحميل الكتاب الخارجي</label>
                <input type="url" class="book-form-control" value="${escapeHtml(b.fileUrl || '')}" placeholder="https://drive.google.com/file/d/... أو رابط مباشر" oninput="updateBookField('fileUrl', this.value)" />
                <span style="font-size:12px; color:#64748b;">يدعم Google Drive, Dropbox, OneDrive, GitHub Release أو سيرفر خارجي.</span>
              </div>
            `}
          </div>
        </div>

        <!-- PREVIEW VERSION CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">📖 نسخة المعاينة (Preview Version)</h3>
          
          <div class="book-form-grid">
            <div class="book-form-group">
              <label>عدد صفحات المعاينة من البداية</label>
              <input type="number" min="1" class="book-form-control" value="${b.previewPagesCount || 10}" oninput="updateBookField('previewPagesCount', Number(this.value))" />
              <span style="font-size:12px; color:#64748b;">يستطيع القارئ تصفح أول X صفحة مجاناً قبل الشراء.</span>
            </div>

            <div class="book-form-group">
              <label>أو رفع ملف PDF منفصل خاص بالمعاينة</label>
              <input type="file" class="book-form-control" accept=".pdf" onchange="handlePreviewFileUpload(event)" />
              ${b.previewFileUrl ? `<div style="margin-top:6px; font-size:12px; color:#15803d; font-weight:700;">✓ ملف المعاينة: ${escapeHtml(b.previewFileName || (b.previewFileUrl.startsWith("data:") ? "ملف PDF مرفوع للمعاينة" : b.previewFileUrl))}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- SPECIFICATIONS CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">📊 مواصفات الكتاب (Specifications)</h3>
          
          <div class="book-form-grid">
            <div class="book-form-group">
              <label>عدد الصفحات الإجمالي (مكتشف تلقائياً)</label>
              <input type="number" min="1" class="book-form-control" value="${b.pages || ''}" placeholder="سيتم اكتشافه تلقائياً عند رفع ملف الكتاب" readonly style="background-color: var(--bg-muted, #f1f5f9); cursor: not-allowed;" />
              ${b.pages ? `<span style="font-size:12px; color:#15803d; font-weight:700;">✓ عدد الصفحات المستخرج من الملف: ${b.pages} صفحة</span>` : `<span style="font-size:12px; color:#64748b;">يرجى رفع ملف الكتاب (PDF) لاستخراج عدد الصفحات تلقائياً.</span>`}
            </div>

            <div class="book-form-group">
              <label>رقم الطبعة / الإصدار</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.edition || '')}" placeholder="مثال: الطبعة الأولى 2024" oninput="updateBookField('edition', this.value)" />
            </div>

            <div class="book-form-group">
              <label>الرقم الدولي المعياري (ISBN)</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.isbn || '')}" placeholder="978-3-16-148410-0" oninput="updateBookField('isbn', this.value)" />
            </div>

            <div class="book-form-group">
              <label>تاريخ النشر</label>
              <input type="date" class="book-form-control" value="${b.publicationDate || ''}" oninput="updateBookField('publicationDate', this.value)" />
            </div>

            <div class="book-form-group">
              <label>الوقت المقدر للقراءة</label>
              <input type="text" class="book-form-control" value="${escapeHtml(b.readingTime || '')}" placeholder="مثال: 5 ساعات" oninput="updateBookField('readingTime', this.value)" />
            </div>
          </div>
        </div>

        <!-- ATTACHMENTS CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">📎 المرفقات والمصادر الكودية (Attachments & Resources)</h3>
          
          <button type="button" class="btn-primary-purple sm" onclick="addNewAttachmentItem()">
            ➕ إضافة مرفق جديد
          </button>

          <div class="attachment-list">
            ${(!b.attachments || b.attachments.length === 0) ? `
              <div style="padding:20px; text-align:center; color:#94a3b8; font-size:13px;">لا توجد مرفقات مضافة حالياً.</div>
            ` : b.attachments.map((att, index) => `
              <div class="attachment-item-row">
                <div class="attachment-info">
                  <span class="attachment-type-badge">${escapeHtml(att.type || 'FILE')}</span>
                  <div>
                    <div style="font-weight:700; font-size:13px; color:#0f172a;">${escapeHtml(att.title || 'مرفق')}</div>
                    <div style="font-size:12px; color:#64748b;">${escapeHtml(att.url || '')}</div>
                  </div>
                </div>
                <button type="button" class="btn-danger-outline sm" style="padding:4px 10px; color:#ef4444; border-color:#fca5a5;" onclick="removeAttachmentItem(${index})">حذف</button>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case "publishing":
      return `
        <!-- SECTION 3: البيع والنشر (Pricing & Publishing) -->
        
        <!-- PRICING CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">💰 التسعير والخصم (Pricing & Discount)</h3>
          
          <div class="book-form-grid">
            <div class="book-form-group full-width" style="flex-direction:row; align-items:center; gap:10px;">
              <input type="checkbox" id="isFreeCheck" ${b.isFree ? 'checked' : ''} onchange="updateBookField('isFree', this.checked); renderBookBuilderUI();" style="width:18px; height:18px; cursor:pointer;" />
              <label for="isFreeCheck" style="cursor:pointer; font-size:14px; font-weight:700;">🎁 كتاب مجاني للجميع (Free Book)</label>
            </div>

            ${!b.isFree ? `
              <div class="book-form-group">
                <label>السعر الأساسي <span class="required">*</span></label>
                <input type="number" min="0" step="0.5" class="book-form-control" value="${b.price !== undefined ? b.price : 0}" oninput="updateBookField('price', Number(this.value))" />
              </div>

              <div class="book-form-group">
                <label>سعر الخصم (إن وجد)</label>
                <input type="number" min="0" step="0.5" class="book-form-control" value="${b.discountPrice !== undefined ? b.discountPrice : 0}" oninput="updateBookField('discountPrice', Number(this.value))" />
              </div>

              <div class="book-form-group">
                <label>العملة</label>
                <select class="book-form-control" onchange="updateBookField('currency', this.value)">
                  <option value="USD" ${b.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                  <option value="EGP" ${b.currency === 'EGP' ? 'selected' : ''}>EGP (ج.م)</option>
                  <option value="SAR" ${b.currency === 'SAR' ? 'selected' : ''}>SAR (ر.س)</option>
                  <option value="EUR" ${b.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                </select>
              </div>

              <div class="book-form-group">
                <label>تاريخ بداية الخصم</label>
                <input type="date" class="book-form-control" value="${b.discountStart || ''}" oninput="updateBookField('discountStart', this.value)" />
              </div>

              <div class="book-form-group">
                <label>تاريخ نهاية الخصم</label>
                <input type="date" class="book-form-control" value="${b.discountEnd || ''}" oninput="updateBookField('discountEnd', this.value)" />
              </div>
            ` : ''}
          </div>
        </div>

        <!-- STATUS CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">🌐 حالة النشر (Publishing Status)</h3>
          
          <div class="book-form-grid">
            <div class="book-form-group full-width">
              <label>حالة الكتاب الرئيسية</label>
              <select class="book-form-control" onchange="updateBookField('status', this.value)">
                <option value="draft" ${b.status === 'draft' ? 'selected' : ''}>📝 مسودة (Draft)</option>
                <option value="published" ${b.status === 'published' ? 'selected' : ''}>🚀 منشور للجميع (Published)</option>
                <option value="private" ${b.status === 'private' ? 'selected' : ''}>🔒 خاص (Private)</option>
                <option value="archived" ${b.status === 'archived' ? 'selected' : ''}>📦 مؤرشف (Archived)</option>
                <option value="unlisted" ${b.status === 'unlisted' ? 'selected' : ''}>🔗 غير مدرج (Unlisted)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- MESSAGES CARD -->
        <div class="book-section-card">
          <h3 class="book-section-title">💬 الرسائل والتنبيهات الترحيبية (Welcome Messages)</h3>
          
          <div class="book-form-grid">
            <div class="book-form-group full-width">
              <label>رسالة إتمام الشراء (تظهر بعد الدفع مباشرة)</label>
              <textarea class="book-form-control" oninput="updateBookField('purchaseSuccessMessage', this.value)">${escapeHtml(b.purchaseSuccessMessage || '')}</textarea>
            </div>

            <div class="book-form-group full-width">
              <label>رسالة الترحيب بالقارئ في المكتبة</label>
              <textarea class="book-form-control" oninput="updateBookField('welcomeMessage', this.value)">${escapeHtml(b.welcomeMessage || '')}</textarea>
            </div>

            <div class="book-form-group full-width">
              <label>رسالة أول فتح للكتاب</label>
              <textarea class="book-form-control" oninput="updateBookField('firstOpenMessage', this.value)">${escapeHtml(b.firstOpenMessage || '')}</textarea>
            </div>
          </div>
        </div>
      `;

    default:
      return ``;
  }
}

/**
 * Update active book data field and trigger auto save
 */
export function updateBookField(key, value) {
  if (!activeBookState) return;
  activeBookState[key] = value;
  triggerAutoSaveState();

  // Dynamically update header title and breadcrumb if title field changes
  if (key === "title") {
    const titleHeader = document.querySelector(".book-builder-title-group h2");
    const breadcrumbSpan = document.querySelector(".book-breadcrumb-bar span");
    if (titleHeader) {
      titleHeader.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        ${escapeHtml(value.trim() || 'منشئ الكتب (Book Builder)')}
      `;
    }
    if (breadcrumbSpan) {
      breadcrumbSpan.textContent = value.trim() || "إنشاء كتاب جديد";
    }
  }

  // Update validation box in real-time
  updateValidationSummaryUI();
}

function updateValidationSummaryUI() {
  const container = document.getElementById("validationSummaryContainer");
  if (!container || !activeBookState) return;
  const validation = validateBookForPublish(activeBookState);
  container.innerHTML = renderValidationSummary(validation);
}

/**
 * Rich Text Editor Commands
 */
export function execEditorCommand(cmd, val = null) {
  document.execCommand(cmd, false, val);
  const editor = document.getElementById("bookRichEditor");
  if (editor && activeBookState) {
    activeBookState.fullDescription = editor.innerHTML;
    triggerAutoSaveState();
  }
}

/**
 * Auto Save Mechanism
 */
function setupAutoSaveListener() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(() => {
    if (autoSaveStatus === "unsaved") {
      performAutoSave();
    }
  }, 4000);
}

function triggerAutoSaveState() {
  autoSaveStatus = "unsaved";
  const badge = document.getElementById("autoSaveBadge");
  const text = document.getElementById("autoSaveText");
  if (badge && text) {
    badge.className = "auto-save-indicator unsaved";
    text.textContent = "تغييرات غير محفوظة";
  }
}

export function performAutoSave() {
  if (!activeBookState) return;

  autoSaveStatus = "saving";
  const badge = document.getElementById("autoSaveBadge");
  const text = document.getElementById("autoSaveText");
  if (badge && text) {
    badge.className = "auto-save-indicator saving";
    text.textContent = "جاري الحفظ...";
  }

  window.activeBookState = activeBookState;

  // Persist changes synchronously to global booksData array
  const index = booksData.findIndex((b) => String(b.id) === String(activeBookState.id));
  if (index >= 0) {
    booksData[index] = JSON.parse(JSON.stringify(activeBookState));
  } else {
    booksData.push(JSON.parse(JSON.stringify(activeBookState)));
  }

  if (window.booksData) {
    window.booksData = booksData;
  }

  if (activeBookState.id) {
    if (activeBookState.fileDataUrl) {
      saveBookFileToIDB(activeBookState.id, "main", activeBookState.fileDataUrl);
    }
    if (activeBookState.previewFileDataUrl) {
      saveBookFileToIDB(activeBookState.id, "preview", activeBookState.previewFileDataUrl);
    }
  }

  try {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("studymart_custom_books", JSON.stringify(booksData));
      } catch (quotaErr) {
        // Fallback if base64 dataUrls exceed localStorage quota
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

  autoSaveStatus = "saved";
  if (badge && text) {
    badge.className = "auto-save-indicator saved";
    text.textContent = "تم الحفظ";
  }
}

export function saveBookDraft() {
  if (!activeBookState) return;
  activeBookState.status = "draft";
  performAutoSave();
  showCustomAlert("💾 تم حفظ مسودة الكتاب بنجاح!");
}

/**
 * Cover upload & actions
 */
export function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    updateBookField("image", evt.target.result);
    renderBookBuilderUI();
    showCustomAlert("✅ تم رفع غلاف الكتاب بنجاح!");
  };
  reader.readAsDataURL(file);
}

export function openCropCoverModal() {
  if (!activeBookState?.image) {
    showCustomAlert("يرجى رفع صورة الغلاف أولاً قبل استخدام أداة القص.");
    return;
  }

  const oldModal = document.getElementById("cropCoverModalOverlay");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "cropCoverModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 480px; position: relative; text-align: center;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 12px; margin-bottom: 16px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a);">✂️ ضبط وقص غلاف الكتاب</h4>
        <button type="button" class="btn-close-modal" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>

      <div style="position: relative; width: 220px; height: 300px; margin: 0 auto 16px auto; border: 2px dashed #7c3aed; border-radius: 12px; overflow: hidden; background: #000;">
        <img src="${activeBookState.image}" alt="Crop Preview" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; inset: 0; border: 2px solid rgba(255,255,255,0.8); pointer-events: none; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-size: 12px; font-weight: 700;">
          نسبة القياس (3:4)
        </div>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">تم تطبيق الأبعاد الموصى بها للغلاف بنجاح.</p>

      <div style="display: flex; justify-content: center; gap: 10px;">
        <button type="button" class="btn-primary-purple sm" onclick="showCustomAlert('تم حفظ تعديلات الغلاف!'); this.closest('.floating-modal-overlay').remove();">
          حفظ التعديلات
        </button>
        <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">
          إلغاء
        </button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  triggerAutoSaveState();
}

export function previewCoverModal() {
  if (!activeBookState?.image) {
    showCustomAlert("لا يوجد غلاف للعرض حالياً");
    return;
  }
  const oldModal = document.getElementById("coverPreviewModalOverlay");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "coverPreviewModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 450px; text-align: center; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 10px; margin-bottom: 14px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a);">🖼️ معاينة الغلاف بالحجم الكامل</h4>
        <button type="button" class="btn-close-modal" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>
      <img src="${activeBookState.image}" alt="Book Cover Full" style="max-width: 100%; max-height: 480px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.15);" />
      <div style="margin-top: 16px;">
        <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

export function deleteCoverImage() {
  updateBookField("image", "");
  renderBookBuilderUI();
  showCustomAlert("تم حذف غلاف الكتاب.");
}

/**
 * Book files upload handlers
 */
export async function handleBookFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = file.name;
  const alertFn = typeof showCustomAlert === "function" ? showCustomAlert : window.showCustomAlert;

  let detectedPageCount = null;
  if (file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    detectedPageCount = await detectPdfPageCount(file);
    if (!detectedPageCount) {
      if (alertFn) alertFn("⚠️ تعذر استخراج عدد صفحات ملف PDF المرفوع تلقائياً.");
    }
  } else {
    if (alertFn) alertFn("⚠️ الملف المرفوع ليس بصيغة PDF. الخاصية تدعم حساب عدد الصفحات تلقائياً لملفات PDF.");
  }

  const reader = new FileReader();
  reader.onload = function (evt) {
    const dataUrl = evt.target.result;
    updateBookField("fileDataUrl", dataUrl);
    updateBookField("fileUrl", dataUrl);
    updateBookField("fileName", fileName);

    if (activeBookState && activeBookState.id) {
      saveBookFileToIDB(activeBookState.id, "main", dataUrl);
    }

    if (detectedPageCount && detectedPageCount > 0) {
      updateBookField("pages", detectedPageCount);
      if (alertFn) alertFn(`✅ تم رفع ملف الكتاب "${fileName}" بنجاح! تم اكتشاف عدد الصفحات تلقائياً: ${detectedPageCount} صفحة.`);
    } else {
      if (alertFn) alertFn(`✅ تم رفع ملف الكتاب "${fileName}" بنجاح!`);
    }

    renderBookBuilderUI();
  };
  reader.readAsDataURL(file);
}

export function handlePreviewFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = file.name;
  const reader = new FileReader();
  reader.onload = function (evt) {
    const dataUrl = evt.target.result;
    updateBookField("previewFileDataUrl", dataUrl);
    updateBookField("previewFileUrl", dataUrl);
    updateBookField("previewFileName", fileName);

    if (activeBookState && activeBookState.id) {
      saveBookFileToIDB(activeBookState.id, "preview", dataUrl);
    }

    renderBookBuilderUI();
    showCustomAlert(`✅ تم رفع ملف المعاينة "${fileName}" بنجاح!`);
  };
  reader.readAsDataURL(file);
}

/**
 * Attachments Handlers
 */
export function addNewAttachmentItem() {
  if (!activeBookState.attachments) activeBookState.attachments = [];

  const oldModal = document.getElementById("addAttachmentModalOverlay");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "addAttachmentModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 460px; text-align: right; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 12px; margin-bottom: 16px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a);">📎 إضافة مرفق أو مصدر كودي جديد</h4>
        <button type="button" class="btn-close-modal" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
        <div class="book-form-group">
          <label>عنوان المرفق <span class="required">*</span></label>
          <input type="text" id="attachmentTitleInput" class="book-form-control" placeholder="مثال: الملفات البرمجية والأمثلة" />
        </div>

        <div class="book-form-group">
          <label>نوع المرفق</label>
          <select id="attachmentTypeInput" class="book-form-control">
            <option value="ZIP">ملف مضغوط (ZIP)</option>
            <option value="PDF">ملخص / PDF</option>
            <option value="CODE">مشروع كود (Code Source)</option>
            <option value="LINK">رابط خارجي (Link)</option>
          </select>
        </div>

        <div class="book-form-group">
          <label>مسار أو رابط المرفق</label>
          <input type="text" id="attachmentUrlInput" class="book-form-control" placeholder="Books/resources.zip" value="Books/resource_file.zip" />
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
        <button type="button" class="btn-primary-purple sm" onclick="confirmAddAttachment()">إضافة المرفق</button>
      </div>
    </div>
  `;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);

  setTimeout(() => {
    document.getElementById("attachmentTitleInput")?.focus();
  }, 100);
}

window.confirmAddAttachment = function () {
  const titleInput = document.getElementById("attachmentTitleInput");
  const typeInput = document.getElementById("attachmentTypeInput");
  const urlInput = document.getElementById("attachmentUrlInput");

  const title = titleInput ? titleInput.value.trim() : "";
  if (!title) {
    showCustomAlert("يرجى إدخال عنوان المرفق.");
    return;
  }

  const type = typeInput ? typeInput.value : "ZIP";
  const url = urlInput ? urlInput.value.trim() : "Books/resource_file.zip";

  if (!activeBookState.attachments) activeBookState.attachments = [];
  activeBookState.attachments.push({
    id: Date.now(),
    title,
    type,
    url: url || "Books/resource_file.zip",
    source: "upload"
  });

  document.getElementById("addAttachmentModalOverlay")?.remove();
  renderBookBuilderUI();
  triggerAutoSaveState();
  showCustomAlert("✅ تم إضافة المرفق بنجاح!");
};

export function removeAttachmentItem(index) {
  if (activeBookState && activeBookState.attachments) {
    activeBookState.attachments.splice(index, 1);
    renderBookBuilderUI();
    triggerAutoSaveState();
  }
}

/**
 * Preview Book as Student
 */
export function previewBookAsStudent() {
  if (!activeBookState) return;

  const oldModal = document.getElementById("bookPreviewModalOverlay");
  if (oldModal) oldModal.remove();

  const overlay = document.createElement("div");
  overlay.id = "bookPreviewModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 750px; position: relative;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--border-color, #f1f5f9); padding-bottom: 12px; margin-bottom: 16px;">
        <h3 style="margin: 0; color: var(--primary-color, #7c3aed); font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
          📖 معاينة صفحة الكتاب كما يراها القارئ
        </h3>
        <button type="button" class="btn-close-modal" aria-label="إغلاق النافذة" title="إغلاق" style="background: var(--bg-muted, #f1f5f9); border: 1px solid var(--border-color, #cbd5e1); font-size: 16px; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; color: var(--text-secondary, #64748b); display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#e2e8f0'; this.style.color='#0f172a';" onmouseout="this.style.background='var(--bg-muted, #f1f5f9)'; this.style.color='var(--text-secondary, #64748b)';" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>

      <div style="display: flex; gap: 20px; flex-wrap: wrap;">
        <div style="width: 180px; flex-shrink: 0;">
          <img src="${activeBookState.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=250&fit=crop&auto=format'}" alt="Book Cover" style="width: 100%; height: 250px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
        </div>
        <div style="flex: 1; min-width: 260px;">
          <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a);">${escapeHtml(activeBookState.title || 'كتاب بدون عنوان')}</h2>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; font-size: 13px; color: var(--text-secondary, #64748b);">
            <span>✍️ المؤلف: <b>${escapeHtml(activeBookState.author || 'المؤلف')}</b></span>
            <span>🏛️ الناشر: <b>${escapeHtml(activeBookState.publisher || 'دار النشر')}</b></span>
            <span>📂 التصنيف: <b>${escapeHtml(activeBookState.category || 'عام')}</b></span>
          </div>

          <div style="margin-bottom: 14px; font-weight: 800; color: #16a34a; font-size: 20px;">
            ${activeBookState.isFree ? 'مجاني 🎉' : `$${activeBookState.price} ${activeBookState.currency || 'USD'}`}
            ${activeBookState.discountPrice && !activeBookState.isFree ? `<span style="font-size: 14px; color: #94a3b8; text-decoration: line-through; margin-right: 8px;">$${activeBookState.discountPrice}</span>` : ''}
          </div>

          <p style="font-size: 13px; color: var(--text-primary, #334155); line-height: 1.6; margin-bottom: 16px; background: var(--bg-subtle, #f8fafc); padding: 12px; border-radius: 10px;">
            ${escapeHtml(activeBookState.shortDescription || 'لا يوجد وصف قصير مضاف لهذا الكتاب بعد.')}
          </p>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn-primary-purple sm" onclick="if(window.openBookPreview) window.openBookPreview(activeBookState);">
              📖 قراءة المعاينة (${activeBookState.previewPagesCount || 10} صفحات)
            </button>
            <button type="button" class="btn-secondary-outline sm" onclick="this.closest('.floating-modal-overlay').remove()">
              إغلاق المعاينة
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

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

  document.body.appendChild(overlay);
}

/**
 * Save and Publish Book
 */
export function saveAndPublishBook() {
  const validation = validateBookForPublish(activeBookState);
  if (!validation.isValid) {
    showCustomAlert(`لا يمكن نشر الكتاب! ينقص التالي:\n• ${validation.missing.join('\n• ')}`);
    return;
  }

  activeBookState.status = "published";
  performAutoSave();

  showCustomAlert("🚀 تم حفظ ونشر الكتاب بنجاح في المنصة!");
  if (window.openBookManagementDashboard) {
    window.openBookManagementDashboard();
  } else {
    openBookManagementDashboard();
  }
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

// Bind functions to window object for inline HTML onclick compatibility
window.renderBookBuilderUI = renderBookBuilderUI;
window.openBookBuilder = openBookBuilder;
window.validateBookForPublish = validateBookForPublish;
window.switchBookBuilderTab = switchBookBuilderTab;
window.switchBuilderStepIndex = switchBuilderStepIndex;
window.execEditorCommand = execEditorCommand;
window.handleCoverUpload = handleCoverUpload;
window.openCropCoverModal = openCropCoverModal;
window.previewCoverModal = previewCoverModal;
window.deleteCoverImage = deleteCoverImage;
window.handleBookFileUpload = handleBookFileUpload;
window.handlePreviewFileUpload = handlePreviewFileUpload;
window.addNewAttachmentItem = addNewAttachmentItem;
window.removeAttachmentItem = removeAttachmentItem;
window.previewBookAsStudent = previewBookAsStudent;
window.saveAndPublishBook = saveAndPublishBook;
window.saveBookDraft = saveBookDraft;
window.updateBookField = updateBookField;
