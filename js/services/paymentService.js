import { completePayment, saveCart, updateCartUI } from "./cartService.js";
import { showCustomAlert, showSuccessToast, showConfirmDialog } from "../utils/helpers.js";
import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { toggleFavorite } from "./favoritesService.js";

let activeCoupon = null;

export function setupPaymentBindings() {
  document.addEventListener("openPaymentMethods", () => {
    renderPaymentOptions();
  });
}

export function openPaymentMethods() {
  renderPaymentOptions();
}

/**
 * Resolve complete details for any cart item (course or book)
 */
function resolveCartItemDetails(item) {
  const booksList = window.booksData || booksData || [];
  const isBook = item.type === "book" || (item.type !== "course" && booksList.some((b) => String(b.id) === String(item.id)));
  let courseMatch = null;
  let bookMatch = null;

  if (isBook) {
    bookMatch = booksList.find((b) => String(b.id) === String(item.id));
  } else {
    const teacherCourses = (() => {
      try {
        return JSON.parse(localStorage.getItem("lms_teacher_courses_v1") || "[]");
      } catch {
        return [];
      }
    })();
    const allCourses = [...(coursesData || []), ...teacherCourses];
    courseMatch = allCourses.find((c) => String(c.id) === String(item.id));
  }

  const type = isBook ? "book" : "course";
  const typeLabel = isBook ? "كتاب إلكتروني" : "دورة تدريبية";

  const title = item.title || courseMatch?.title || bookMatch?.title || "عنصر غير محدد";

  const image = item.image || courseMatch?.image || bookMatch?.image || bookMatch?.cover || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop";

  const instructor = isBook
    ? (item.author || bookMatch?.author || "مؤلف متميز")
    : (item.instructor || courseMatch?.instructor || "محاضر متميز");

  const categoryRaw = item.category || courseMatch?.category || bookMatch?.category || (isBook ? "كتب رقمية" : "برمجة وتطوير");
  const categoryMap = {
    programming: "البرمجة والتطوير",
    design: "التصميم والواجهات",
    business: "إدارة الأعمال",
    marketing: "التسويق الرقمي",
    language: "اللغات والترجمة"
  };
  const category = categoryMap[categoryRaw] || categoryRaw;

  let level = null;
  let levelLabel = null;
  if (!isBook) {
    const rawLevel = item.level || courseMatch?.level || "intermediate";
    const levelMap = {
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم"
    };
    level = rawLevel;
    levelLabel = levelMap[rawLevel] || rawLevel;
  }

  const quantity = item.quantity || 1;
  const price = parseFloat(item.price) || 0;
  const rawOrigPrice = parseFloat(item.originalPrice || courseMatch?.originalPrice || (bookMatch?.price ? bookMatch.price * 1.25 : price * 1.25) || price * 1.25);
  const originalPrice = Math.max(price, Math.round(rawOrigPrice * 100) / 100);
  const discount = Math.max(0, Math.round((originalPrice - price) * 100) / 100);

  return {
    id: item.id,
    title,
    type,
    typeLabel,
    image,
    instructor,
    category,
    level,
    levelLabel,
    quantity,
    originalPrice,
    price,
    discount,
    rawItem: item
  };
}

/**
 * Apply a promotional coupon code
 */
export function applyCouponCode(codeStr) {
  if (!codeStr || !codeStr.trim()) {
    showCustomAlert("يرجى إدخال كود الخصم أولاً");
    return;
  }
  const code = codeStr.trim().toUpperCase();
  if (code === "STUDY10" || code === "WELCOME10") {
    activeCoupon = { code, discountPercent: 10 };
    showSuccessToast({ title: "تم تطبيق الكود", message: "حصلت على خصم 10% إضافي!" });
  } else if (code === "STUDYMART" || code === "SAVE20") {
    activeCoupon = { code, discountPercent: 20 };
    showSuccessToast({ title: "تم تطبيق الكود", message: "حصلت على خصم 20% إضافي!" });
  } else if (code === "SUPER50" || code === "FREE50") {
    activeCoupon = { code, discountPercent: 50 };
    showSuccessToast({ title: "تم تطبيق الكود", message: "حصلت على خصم 50% إضافي!" });
  } else {
    showCustomAlert("كود الخصم غير صحيح أو منتهي الصلاحية (جرب: STUDY10 أو STUDYMART)");
    return;
  }
  renderPaymentOptions();
}

/**
 * Remove applied coupon
 */
export function removeCouponCode() {
  activeCoupon = null;
  showSuccessToast({ title: "إلغاء الخصم", message: "تمت إزالة كود الخصم." });
  renderPaymentOptions();
}

/**
 * Remove an item from the order
 */
export async function removeOrderItem(index) {
  const cartItems = window.appState?.cart || [];
  if (index < 0 || index >= cartItems.length) return;
  const item = cartItems[index];

  const confirmed = await (showConfirmDialog
    ? showConfirmDialog({
        title: "تأكيد حذف العنصر",
        message: `هل أنت تأكد من إزالة "${item.title || 'هذا العنصر'}" من طلب الشراء؟`,
        confirmText: "حذف من الطلب",
        cancelText: "إلغاء",
        danger: true
      })
    : Promise.resolve(true));

  if (!confirmed) return;

  window.appState.cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showSuccessToast({ title: "تمت الإزالة", message: "تم حذف العنصر من الطلب وتحديث الإجمالي بنجاح." });
  renderPaymentOptions();
}

/**
 * Move item from order to Wishlist
 */
export function moveOrderItemToWishlist(index) {
  const cartItems = window.appState?.cart || [];
  if (index < 0 || index >= cartItems.length) return;
  const item = cartItems[index];
  const booksList = window.booksData || booksData || [];
  const isBook = item.type === "book" || (item.type !== "course" && booksList.some((b) => String(b.id) === String(item.id)));

  toggleFavorite(isBook ? "book" : "course", item);
  window.appState.cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showSuccessToast({ title: "نقل للمفضلة", message: "تم نقل العنصر إلى قائمة المفضلة بنجاح." });
  renderPaymentOptions();
}

/**
 * View item details
 */
export function viewOrderItemDetails(index) {
  const cartItems = window.appState?.cart || [];
  if (index < 0 || index >= cartItems.length) return;
  const item = cartItems[index];
  const booksList = window.booksData || booksData || [];
  const isBook = item.type === "book" || (item.type !== "course" && booksList.some((b) => String(b.id) === String(item.id)));

  if (!isBook && window.showCourseDetails) {
    window.showCourseDetails(item.id);
  } else if (isBook && window.showBookDetails) {
    window.showBookDetails(item.id);
  } else if (window.showSuccessToast) {
    window.showSuccessToast({
      title: isBook ? "تفاصيل الكتاب" : "تفاصيل الدورة",
      message: `عرض ${isBook ? "كتاب" : "دورة"}: ${item.title}`
    });
  }
}

/**
 * Main Order Review & Checkout renderer
 */
export function renderPaymentOptions() {
  const checkoutContent = document.getElementById("checkoutContent");
  if (!checkoutContent) return null;

  const cartItems = window.appState?.cart || [];

  // Handle Empty Cart State
  if (cartItems.length === 0) {
    checkoutContent.innerHTML = `
      <div class="checkout-modal-container" dir="rtl" style="text-align: center; padding: 20px 10px;">
        <div class="checkout-header-section">
          <div style="font-size: 48px; margin-bottom: 12px;">🛒</div>
          <h3 class="checkout-main-title">طلب الشراء فارغ</h3>
          <p class="checkout-main-subtitle">لا توجد منتجات أو دورات في طلبك حالياً.</p>
        </div>
        <button class="checkout-pay-submit-btn" type="button" onclick="document.getElementById('checkoutModal')?.classList.remove('show'); if(window.scrollToSection) window.scrollToSection('courses');" style="max-width: 280px; margin: 20px auto 0 auto;">
          <span>استكشف الدورات والكتب</span>
        </button>
      </div>
    `;
    return checkoutContent;
  }

  // Resolve item details
  const resolvedItems = cartItems.map((item) => resolveCartItemDetails(item));

  let totalOriginalPrice = 0;
  let totalItemDiscount = 0;
  let netSubtotal = 0;

  resolvedItems.forEach((it) => {
    totalOriginalPrice += it.originalPrice * it.quantity;
    totalItemDiscount += it.discount * it.quantity;
    netSubtotal += it.price * it.quantity;
  });

  let couponDiscountAmount = 0;
  if (activeCoupon) {
    couponDiscountAmount = Math.round((netSubtotal * activeCoupon.discountPercent / 100) * 100) / 100;
  }

  const netAfterCoupon = Math.max(0, netSubtotal - couponDiscountAmount);
  const tax = Math.round(netAfterCoupon * 0.15 * 100) / 100;
  const shipping = 0;
  const grandTotal = Math.round((netAfterCoupon + tax + shipping) * 100) / 100;

  const totalItemCount = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);

  // Build HTML for purchased items
  const itemsListHTML = resolvedItems.map((it, idx) => {
    const isBook = it.type === "book";
    const tagClass = isBook ? "tag-book" : "tag-course";

    return `
      <div class="order-review-item-card" data-index="${idx}">
        <img src="${it.image}" alt="${it.title}" class="review-item-thumb" />
        
        <div class="review-item-body">
          <div class="review-item-header">
            <span class="review-item-type-tag ${tagClass}">${it.typeLabel}</span>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">الكمية: ${it.quantity}</span>
          </div>

          <h4 class="review-item-title">${it.title}</h4>

          <div class="review-item-details-grid">
            <span><strong>المعلم / المؤلف:</strong> ${it.instructor}</span>
            <span><strong>القسم:</strong> ${it.category}</span>
            ${it.levelLabel ? `<span><strong>المستوى:</strong> ${it.levelLabel}</span>` : ""}
          </div>

          <div class="review-item-pricing-row">
            ${it.discount > 0 ? `<span class="review-orig-price">$${it.originalPrice.toFixed(2)}</span>` : ""}
            ${it.discount > 0 ? `<span class="review-discount-badge">وفر $${it.discount.toFixed(2)}</span>` : ""}
            <span class="review-final-price">$${it.price.toFixed(2)}</span>
          </div>

          <div class="review-item-actions-row">
            <button type="button" class="btn-item-action btn-item-remove" onclick="removeOrderItem(${idx})" title="حذف من الطلب">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>حذف</span>
            </button>

            <button type="button" class="btn-item-action btn-item-wishlist" onclick="moveOrderItemToWishlist(${idx})" title="نقل إلى المفضلة">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              <span>نقل للمفضلة</span>
            </button>

            <button type="button" class="btn-item-action btn-item-details" onclick="viewOrderItemDetails(${idx})" title="عرض التفاصيل">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>التفاصيل</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  checkoutContent.innerHTML = `
    <div class="checkout-modal-container" dir="rtl">
      <!-- Header Bar with Print Button -->
      <div class="checkout-top-bar">
        <div class="checkout-header-section" style="text-align: right; margin-bottom: 0;">
          <h3 class="checkout-main-title">مراجعة الطلب وإتمام الشراء</h3>
          <p class="checkout-main-subtitle">قم بمراجعة كافة عناصر الطلب والأسعار قبل إتمام عملية الدفع</p>
        </div>

        <button type="button" class="btn-print-receipt" onclick="printOrderSummary()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>طباعة ملخص الطلب</span>
        </button>
      </div>

      <!-- Order Purchased Items Section -->
      <div class="order-review-items-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <h4 class="card-section-title" style="margin: 0;">عناصر الطلب (${totalItemCount} عناصر)</h4>
          <span style="font-size: 13px; color: #64748b; font-weight: 600;">مراجعة سريعة قبل الشراء</span>
        </div>

        <div class="review-items-list">
          ${itemsListHTML}
        </div>
      </div>

      <!-- Order Summary Card -->
      <div class="checkout-card order-summary-card">
        <h4 class="card-section-title">ملخص الحساب والأسعار</h4>
        
        <div class="summary-line-item">
          <div class="summary-line-label">
            <span class="summary-icon">🏷️</span>
            <span>المجموع الأساسي (قبل الخصم)</span>
          </div>
          <span class="summary-line-val">$${totalOriginalPrice.toFixed(2)}</span>
        </div>

        <div class="summary-line-item">
          <div class="summary-line-label">
            <span class="summary-icon">🎁</span>
            <span>خصم العروض والتخفيضات</span>
          </div>
          <span class="summary-line-val discount-val">-$${totalItemDiscount.toFixed(2)}</span>
        </div>

        <!-- Coupon Code Section -->
        <div class="coupon-section-box">
          ${activeCoupon ? `
            <div class="active-coupon-badge">
              <span>✔ تم تطبيق كود الخصم <strong>${activeCoupon.code}</strong> (${activeCoupon.discountPercent}%)</span>
              <button type="button" class="btn-remove-coupon" onclick="removeCouponCode()">إلغاء الكود</button>
            </div>
          ` : `
            <div class="coupon-input-group">
              <input type="text" id="couponCodeInput" class="coupon-input" placeholder="أدخل كود الخصم (مثال: STUDY10)" />
              <button type="button" class="btn-apply-coupon" onclick="applyCouponCode(document.getElementById('couponCodeInput').value)">تطبيق الخصم</button>
            </div>
          `}
        </div>

        ${activeCoupon ? `
          <div class="summary-line-item">
            <div class="summary-line-label">
              <span class="summary-icon">⚡</span>
              <span>خصم الكوبون الإضافي (${activeCoupon.code})</span>
            </div>
            <span class="summary-line-val discount-val">-$${couponDiscountAmount.toFixed(2)}</span>
          </div>
        ` : ""}

        <div class="summary-line-item">
          <div class="summary-line-label">
            <span class="summary-icon">🏛️</span>
            <span>ضريبة القيمة المضافة (15%)</span>
          </div>
          <span class="summary-line-val">$${tax.toFixed(2)}</span>
        </div>

        <div class="summary-line-item">
          <div class="summary-line-label">
            <span class="summary-icon">🚚</span>
            <span>رسوم التوصيل الشحن</span>
          </div>
          <span class="summary-line-val" style="color: #16a34a; font-weight: 700;">مجاني (تسليم رقمي)</span>
        </div>

        <div class="summary-divider"></div>

        <div class="summary-line-item total-line-item">
          <span class="total-line-label">الإجمالي النهائي المطلوب دعه</span>
          <span class="total-line-val">$${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <!-- Payment Methods Section -->
      <div class="checkout-card payment-methods-card">
        <h4 class="card-section-title centered-title">اختر طريقة الدفع</h4>

        <div class="payment-options-grid">
          <div class="payment-option-card active" id="paymentTabCard" data-method="card">
            <span class="option-label">Visa / MasterCard</span>
            <div class="option-logos">
              <span class="visa-text-logo">VISA</span>
              <span class="mc-circles-logo">
                <svg width="26" height="16" viewBox="0 0 36 24">
                  <circle cx="13" cy="12" r="11" fill="#EB001B"/>
                  <circle cx="23" cy="12" r="11" fill="#F79E1B" fill-opacity="0.85"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="payment-option-card" id="paymentTabVodafone" data-method="vodafone">
            <span class="option-label">فودافون كاش</span>
            <div class="option-logos">
              <span class="vodafone-circle-badge">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="11" fill="#e60000"/>
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z" fill="#fff"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div class="payment-form-box">
          <div class="payment-panel payment-panel-card active">
            ${renderCreditCardForm()}
          </div>
          <div class="payment-panel payment-panel-vodafone">
            ${renderVodafoneForm()}
          </div>
        </div>
      </div>

      <!-- Pay Button -->
      <button class="checkout-pay-submit-btn" type="button" id="mainPayButton">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>إكمال الدفع ($${grandTotal.toFixed(2)})</span>
      </button>

      <!-- Security Footer -->
      <div class="checkout-security-footer">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>جميع عمليات الدفع مشفرة وآمنة 100% مع ضمان استرجاع الأموال</span>
      </div>
    </div>
  `;

  // Bind Payment Tab Switchers & Listeners
  const cardTab = document.getElementById("paymentTabCard");
  const vodafoneTab = document.getElementById("paymentTabVodafone");
  const cardPanel = document.querySelector(".payment-panel-card");
  const vodafonePanel = document.querySelector(".payment-panel-vodafone");

  const setActiveMethod = (method) => {
    const isCard = method === "card";
    cardTab?.classList.toggle("active", isCard);
    vodafoneTab?.classList.toggle("active", !isCard);
    cardPanel?.classList.toggle("active", isCard);
    vodafonePanel?.classList.toggle("active", !isCard);
  };

  cardTab?.addEventListener("click", () => setActiveMethod("card"));
  vodafoneTab?.addEventListener("click", () => setActiveMethod("vodafone"));

  const mainPayBtn = document.getElementById("mainPayButton");
  mainPayBtn?.addEventListener("click", () => {
    if (cardTab?.classList.contains("active")) {
      finalizeCardPayment();
    } else {
      finalizeVodafonePayment();
    }
  });

  const cardInput = document.getElementById("cardNumber");
  cardInput?.addEventListener("focus", clearFakeCardNumber);
  cardInput?.addEventListener("blur", restoreFakeCardNumber);

  const uploadBtn = document.getElementById("uploadVodafoneBtn");
  const dropzone = document.getElementById("vodafoneDropzone");
  const fileInput = document.getElementById("vodafoneReceipt");
  const fileName = document.getElementById("vodafoneFileName");

  uploadBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  dropzone?.addEventListener("click", () => {
    fileInput?.click();
  });

  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (dropzone) dropzone.style.borderColor = "#2563eb";
  });

  dropzone?.addEventListener("dragleave", () => {
    if (dropzone) dropzone.style.borderColor = "#cbd5e1";
  });

  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    if (dropzone) dropzone.style.borderColor = "#cbd5e1";
    if (e.dataTransfer.files.length > 0) {
      if (fileInput) fileInput.files = e.dataTransfer.files;
      if (fileName) {
        fileName.textContent = `✔ تم رفع الإثبات بنجاح: ${e.dataTransfer.files[0].name}`;
      }
      showCustomAlert("تم رفع إثبات الدفع بنجاح");
    }
  });

  fileInput?.addEventListener("change", () => {
    if (fileInput.files.length > 0 && fileName) {
      fileName.textContent = `✔ تم رفع الإثبات بنجاح: ${fileInput.files[0].name}`;
      showCustomAlert("تم رفع إثبات الدفع بنجاح");
    }
  });

  return checkoutContent;
}

export function openPaymentMethod(method) {
  renderPaymentOptions();
  const tabId = method === "vodafone" ? "paymentTabVodafone" : "paymentTabCard";
  document.getElementById(tabId)?.click();
}

export function payByCard() {
  openPaymentMethod("card");
}

export function payByVodafone() {
  openPaymentMethod("vodafone");
}

function renderCreditCardForm() {
  return `
    <div class="form-group-payment">
      <label for="cardNumber">رقم البطاقة</label>
      <div class="input-with-icon">
        <input
          id="cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          value="1234 5678 9012 3456"
          dir="ltr"
          class="payment-input-light"
        >
        <span class="input-icon-light">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
        </span>
      </div>
    </div>

    <div class="form-row-2col">
      <div class="form-group-payment">
        <label for="cardExpiry">تاريخ الانتهاء</label>
        <div class="input-with-icon">
          <input
            id="cardExpiry"
            type="text"
            placeholder="MM / YY"
            value="12/28"
            dir="ltr"
            class="payment-input-light"
          >
          <span class="input-icon-light">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
        </div>
      </div>

      <div class="form-group-payment">
        <label for="cardPassword">رمز الأمان (CVV)</label>
        <div class="input-with-icon">
          <input
            id="cardPassword"
            type="password"
            placeholder="123"
            value="123"
            maxlength="4"
            dir="ltr"
            class="payment-input-light"
          >
          <span class="input-icon-light">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
        </div>
      </div>
    </div>

    <div class="form-group-payment">
      <label for="cardHolder">اسم صاحب البطاقة</label>
      <input
        id="cardHolder"
        type="text"
        placeholder="الاسم كما هو على البطاقة"
        value="Sarah Khaled"
        class="payment-input-light"
        style="padding-left: 14px; padding-right: 14px;"
      >
    </div>

    <label class="save-card-label-light">
      <input type="checkbox" id="saveCardCheck" checked>
      <span>حفظ البطاقة للاستخدام السريع</span>
    </label>
  `;
}

function renderVodafoneForm() {
  return `
    <div class="form-group-payment">
      <label for="fromVodafoneNumber">رقم فودافون كاش</label>
      <div class="input-with-icon">
        <input
          id="fromVodafoneNumber"
          type="text"
          placeholder="01xxxxxxxxx"
          value="01012345678"
          dir="ltr"
          class="payment-input-light"
        >
        <span class="input-icon-light">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
      </div>
    </div>

    <div class="form-group-payment">
      <label for="vodafoneTransactionNo">رقم العملية (اختياري)</label>
      <div class="input-with-icon">
        <input
          id="vodafoneTransactionNo"
          type="text"
          placeholder="أدخل رقم العملية إن وجد"
          dir="ltr"
          class="payment-input-light"
        >
        <span class="input-icon-light">#</span>
      </div>
    </div>

    <div class="upload-dropzone-light" id="vodafoneDropzone">
      <input type="file" accept="image/*" id="vodafoneReceipt" style="display:none">
      
      <p class="dropzone-text-bold-light">اسحب صورة إثبات الدفع هنا</p>
      <p class="dropzone-text-sub-light">أو اضغط للاختيار من جهازك</p>

      <button id="uploadVodafoneBtn" class="btn-choose-image-light" type="button">اختيار صورة</button>
      <p id="vodafoneFileName" class="upload-status-text" style="margin-top: 6px;"></p>
    </div>
  `;
}

export function finalizeCardPayment() {
  const cardInput = document.getElementById("cardNumber");
  const passInput = document.getElementById("cardPassword");
  const card = cardInput ? cardInput.value.trim() : "";
  const pass = passInput ? passInput.value.trim() : "";

  if (!card || !pass) {
    showCustomAlert("من فضلك أدخل بيانات البطاقة بشكل صحيح");
    return;
  }

  const cartItems = window.appState?.cart || [];
  let subtotal = 0;
  cartItems.forEach(it => { subtotal += (it.price || 0); });
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const grandTotal = subtotal + tax;

  completePayment();
  showCustomAlert(`تم خصم مبلغ $${grandTotal.toFixed(2)} من بطاقتك الائتمانية بنجاح`);
  document.getElementById("checkoutModal")?.classList.remove("show");
}

export function finalizeVodafonePayment() {
  const vNumInput = document.getElementById("fromVodafoneNumber");
  const vNum = vNumInput ? vNumInput.value.trim() : "";

  if (!vNum) {
    showCustomAlert("من فضلك أدخل رقم فودافون كاش الذي تم التحويل منه");
    return;
  }

  const cartItems = window.appState?.cart || [];
  let subtotal = 0;
  cartItems.forEach(it => { subtotal += (it.price || 0); });
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const grandTotal = subtotal + tax;

  completePayment();
  showCustomAlert(`تم الدفع بنجاح عن طريق فودافون كاش بقيمة $${grandTotal.toFixed(2)}`);
  document.getElementById("checkoutModal")?.classList.remove("show");
}

export function clearFakeCardNumber() {
  const input = document.getElementById("cardNumber");
  if (
    input &&
    (input.value === "1234 5678 9012 3456" || input.value === "4111 1111 1111 1111")
  ) {
    input.value = "";
    input.style.color = "#0f172a";
  }
}

export function restoreFakeCardNumber() {
  const input = document.getElementById("cardNumber");
  if (input && input.value.trim() === "") {
    input.value = "1234 5678 9012 3456";
    input.style.color = "#0f172a";
  }
}

/**
 * Print order summary receipt using the unified Teacher Invoice system
 */
export function printOrderSummary() {
  const cartItems = window.appState?.cart || [];
  if (cartItems.length === 0) {
    showCustomAlert("لا يوجد عناصر في الطلب للطباعة.");
    return;
  }

  const resolvedItems = cartItems.map((item) => resolveCartItemDetails(item));

  let totalOriginalPrice = 0;
  let totalItemDiscount = 0;
  let netSubtotal = 0;

  resolvedItems.forEach((it) => {
    totalOriginalPrice += (it.originalPrice || it.price || 0) * (it.quantity || 1);
    totalItemDiscount += (it.discount || 0) * (it.quantity || 1);
    netSubtotal += (it.price || 0) * (it.quantity || 1);
  });

  let couponDiscountAmount = 0;
  if (activeCoupon) {
    couponDiscountAmount = Math.round((netSubtotal * activeCoupon.discountPercent / 100) * 100) / 100;
  }

  const netAfterCoupon = Math.max(0, netSubtotal - couponDiscountAmount);
  const tax = Math.round(netAfterCoupon * 0.15 * 100) / 100;
  const platformFee = Math.round(netAfterCoupon * 0.10 * 100) / 100;
  const grandTotal = Math.round((netAfterCoupon + tax) * 100) / 100;

  const cardTabActive = document.getElementById("paymentTabCard")?.classList.contains("active") ?? true;
  const paymentMethodLabel = cardTabActive ? "بطاقة ائتمانية (Visa / MasterCard)" : "محفظة فودافون كاش (Vodafone Cash)";

  const now = new Date();
  const dateStr = now.toISOString();

  const receiptNum = Math.floor(100000 + Math.random() * 900000);
  const orderNum = Math.floor(100000 + Math.random() * 900000);
  const txnNum = "TXN-" + Math.floor(10000000 + Math.random() * 90000000);

  const userName = window.appState?.userData?.name || "إسلام عادل";
  const userEmail = window.appState?.userData?.email || "student@gmail.com";
  const userPhone = window.appState?.userData?.phone || "+966 50 123 4567";
  const userCountry = window.appState?.userData?.country || "السعودية";
  const userCity = window.appState?.userData?.city || "الرياض";

  const invoiceObj = {
    id: txnNum,
    invoiceNo: `INV-${receiptNum}`,
    orderId: `ORD-${orderNum}`,
    status: "Pending",
    date: dateStr,
    studentName: userName,
    studentEmail: userEmail,
    studentPhone: userPhone,
    country: userCountry,
    studentCity: userCity,
    billingAddress: "شارع العليا العام - المجمع المالي",
    accountID: `STD-9012`,
    teacherName: "StudyMart Academic Platform",
    teacherEmail: "support@studymart.com",
    teacherId: "TCH-2024-88",
    paymentMethod: paymentMethodLabel,
    couponCode: activeCoupon ? activeCoupon.code : "",
    price: totalOriginalPrice,
    discount: totalItemDiscount + couponDiscountAmount,
    tax: tax,
    platformFee: platformFee,
    netRevenue: Math.max(0, netAfterCoupon - platformFee),
    total: grandTotal,
    items: resolvedItems.map(it => ({
      id: it.id,
      title: it.title,
      bookName: it.title,
      productType: it.type === "course" ? "Course" : "Book",
      productCategory: it.category || "عام",
      price: it.originalPrice || it.price,
      discount: it.discount || 0,
      tax: Math.round((it.price * 0.15) * 100) / 100,
      finalPrice: it.price,
      image: it.image,
      bookImage: it.image,
      instructor: it.instructor || "الدعم الأكاديمي"
    }))
  };

  if (typeof window.openInvoiceModal === "function") {
    window.openInvoiceModal(invoiceObj);
  }
}

export function confirmAndPrintReceipt() {
  window.print();
}

export function cancelReceiptConfirmPrompt() {
  // Confirmation prompt removed
}

export function triggerActualPrint() {
  window.print();
}

export function closeReceiptPreview() {
  const previewModal = document.getElementById("receiptPreviewModal");
  if (previewModal) {
    previewModal.style.display = "none";
  }
}

// Bind handlers to window object
if (typeof window !== "undefined") {
  window.removeOrderItem = removeOrderItem;
  window.moveOrderItemToWishlist = moveOrderItemToWishlist;
  window.viewOrderItemDetails = viewOrderItemDetails;
  window.applyCouponCode = applyCouponCode;
  window.removeCouponCode = removeCouponCode;
  window.printOrderSummary = printOrderSummary;
  window.confirmAndPrintReceipt = confirmAndPrintReceipt;
  window.cancelReceiptConfirmPrompt = cancelReceiptConfirmPrompt;
  window.triggerActualPrint = triggerActualPrint;
  window.closeReceiptPreview = closeReceiptPreview;
}
