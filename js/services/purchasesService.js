// Dedicated Service for My Purchases ("مشترياتي") Full Page
// Simulates a backend service layer with LocalStorage persistence

const STORAGE_KEY_PURCHASES = "studymart_purchases_v1";
const STORAGE_KEY_PAYMENT_METHODS = "studymart_payment_methods_v1";

const DEFAULT_PURCHASES = [
  {
    id: "ORD-2024-1548",
    orderNumber: "#ORD-2024-1548",
    type: "course",
    itemId: "1",
    title: "دورة React من الصفر حتى الاحتراف",
    author: "أحمد محمد",
    date: "24 مايو 2024",
    time: "10:30 ص",
    timestamp: new Date("2024-05-24T10:30:00").getTime(),
    price: 299.00,
    priceFormatted: "299.00 ج.م",
    status: "completed",
    thumbBg: "#0f172a",
    thumbType: "react",
    categoryName: "تطوير البرمجيات",
    paymentMethod: "Visa **** 4242"
  },
  {
    id: "ORD-2024-1547",
    orderNumber: "#ORD-2024-1547",
    type: "book",
    itemId: "201",
    title: "كتاب التفكير السريع والبطيء",
    author: "دانيال كانيمان",
    date: "20 مايو 2024",
    time: "04:15 م",
    timestamp: new Date("2024-05-20T16:15:00").getTime(),
    price: 180.00,
    priceFormatted: "180.00 ج.م",
    status: "completed",
    thumbBg: "#fef3c7",
    thumbType: "book",
    categoryName: "علم النفس والتفكير",
    paymentMethod: "Mastercard **** 8888"
  },
  {
    id: "ORD-2024-1523",
    orderNumber: "#ORD-2024-1523",
    type: "course",
    itemId: "2",
    title: "دورة Python للمبتدئين",
    author: "محمد علي",
    date: "15 مايو 2024",
    time: "11:20 ص",
    timestamp: new Date("2024-05-15T11:20:00").getTime(),
    price: 349.00,
    priceFormatted: "349.00 ج.م",
    status: "completed",
    thumbBg: "#0f172a",
    thumbType: "python",
    categoryName: "البرمجة",
    paymentMethod: "Visa **** 4242"
  },
  {
    id: "ORD-2024-1511",
    orderNumber: "#ORD-2024-1511",
    type: "book",
    itemId: "202",
    title: "كتاب بناء العادات الذرية",
    author: "جيمس كلير",
    date: "10 مايو 2024",
    time: "06:40 م",
    timestamp: new Date("2024-05-10T18:40:00").getTime(),
    price: 150.00,
    priceFormatted: "150.00 ج.م",
    status: "completed",
    thumbBg: "#fef3c7",
    thumbType: "book",
    categoryName: "تطوير الذات",
    paymentMethod: "Visa **** 4242"
  },
  {
    id: "ORD-2024-1490",
    orderNumber: "#ORD-2024-1490",
    type: "course",
    itemId: "3",
    title: "دورة الأمن السيبراني وحماية الشبكات",
    author: "د. خالد السعيد",
    date: "02 مايو 2024",
    time: "02:10 م",
    timestamp: new Date("2024-05-02T14:10:00").getTime(),
    price: 450.00,
    priceFormatted: "450.00 ج.م",
    status: "completed",
    thumbBg: "#0f172a",
    thumbType: "security",
    categoryName: "الأمن السيبراني",
    paymentMethod: "Visa **** 4242"
  },
  {
    id: "ORD-2024-1475",
    orderNumber: "#ORD-2024-1475",
    type: "book",
    itemId: "203",
    title: "كتاب الأب الغني والأب الفقير",
    author: "روبيرت كيوساكي",
    date: "28 أبريل 2024",
    time: "09:15 ص",
    timestamp: new Date("2024-04-28T09:15:00").getTime(),
    price: 120.00,
    priceFormatted: "120.00 ج.م",
    status: "completed",
    thumbBg: "#fef3c7",
    thumbType: "book",
    categoryName: "إدارة الأعمال والمال",
    paymentMethod: "Mastercard **** 8888"
  },
  {
    id: "ORD-2024-1430",
    orderNumber: "#ORD-2024-1430",
    type: "course",
    itemId: "4",
    title: "دورة تصميم واجهات المستخدم UI/UX",
    author: "سارة إبراهيم",
    date: "18 أبريل 2024",
    time: "01:00 م",
    timestamp: new Date("2024-04-18T13:00:00").getTime(),
    price: 399.00,
    priceFormatted: "399.00 ج.م",
    status: "completed",
    thumbBg: "#0f172a",
    thumbType: "design",
    categoryName: "التصميم",
    paymentMethod: "Visa **** 4242"
  },
  {
    id: "ORD-2024-1402",
    orderNumber: "#ORD-2024-1402",
    type: "book",
    itemId: "204",
    title: "كتاب فن الحرب وقيادة الأفكار",
    author: "سون تزو",
    date: "05 أبريل 2024",
    time: "08:30 م",
    timestamp: new Date("2024-04-05T20:30:00").getTime(),
    price: 110.00,
    priceFormatted: "110.00 ج.م",
    status: "completed",
    thumbBg: "#fef3c7",
    thumbType: "book",
    categoryName: "القيادة والتكتيك",
    paymentMethod: "Visa **** 4242"
  },
  {
    id: "ORD-2024-1380",
    orderNumber: "#ORD-2024-1380",
    type: "course",
    itemId: "5",
    title: "دورة الذكاء الاصطناعي وتطبيقاته",
    author: "د. طارق محمود",
    date: "22 مارس 2024",
    time: "03:45 م",
    timestamp: new Date("2024-03-22T15:45:00").getTime(),
    price: 500.00,
    priceFormatted: "500.00 ج.م",
    status: "refunded",
    thumbBg: "#0f172a",
    thumbType: "ai",
    categoryName: "الذكاء الاصطناعي",
    paymentMethod: "Mastercard **** 8888"
  },
  {
    id: "ORD-2024-1350",
    orderNumber: "#ORD-2024-1350",
    type: "book",
    itemId: "205",
    title: "كتاب أساسيات خوارزميات الحاسوب",
    author: "د. محمود شريف",
    date: "12 مارس 2024",
    time: "12:10 م",
    timestamp: new Date("2024-03-12T12:10:00").getTime(),
    price: 160.00,
    priceFormatted: "160.00 ج.م",
    status: "completed",
    thumbBg: "#fef3c7",
    thumbType: "book",
    categoryName: "علوم الحاسوب",
    paymentMethod: "Visa **** 4242"
  }
];

const DEFAULT_PAYMENT_METHODS = [
  {
    id: "pm-1",
    brand: "VISA",
    badgeText: "VISA",
    badgeBg: "#1e3a8a",
    label: "Visa **** 4242",
    cardNumber: "**** **** **** 4242",
    last4: "4242",
    cardHolder: "أحمد محمود",
    expDate: "12/26",
    isDefault: true
  },
  {
    id: "pm-2",
    brand: "MC",
    badgeText: "MC",
    badgeBg: "#ea580c",
    label: "Mastercard **** 8888",
    cardNumber: "**** **** **** 8888",
    last4: "8888",
    cardHolder: "أحمد محمود",
    expDate: "09/25",
    isDefault: false
  },
  {
    id: "pm-3",
    brand: "StudyMart",
    badgeText: "📁",
    badgeBg: "#f59e0b",
    label: "محفظة StudyMart",
    cardNumber: "رصيد المحفظة (500.00 ج.م)",
    last4: "500",
    cardHolder: "أحمد محمود",
    expDate: "-",
    isDefault: false
  }
];

// Active State
let currentCategory = "all";
let currentSort = "latest";
let currentSearch = "";
let currentPage = 1;
const PAGE_SIZE = 5;

// Storage layer internal methods
function _loadPurchases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PURCHASES);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(DEFAULT_PURCHASES));
      return DEFAULT_PURCHASES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(DEFAULT_PURCHASES));
      return DEFAULT_PURCHASES;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_PURCHASES;
  }
}

function _savePurchases(data) {
  try {
    localStorage.setItem(STORAGE_KEY_PURCHASES, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving purchases:", e);
  }
}

function _loadPaymentMethods() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAYMENT_METHODS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PAYMENT_METHODS, JSON.stringify(DEFAULT_PAYMENT_METHODS));
      return DEFAULT_PAYMENT_METHODS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY_PAYMENT_METHODS, JSON.stringify(DEFAULT_PAYMENT_METHODS));
      return DEFAULT_PAYMENT_METHODS;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_PAYMENT_METHODS;
  }
}

function _savePaymentMethods(data) {
  try {
    localStorage.setItem(STORAGE_KEY_PAYMENT_METHODS, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving payment methods:", e);
  }
}

// ==========================================
// EXPOSED SERVICE API METHODS
// ==========================================

export function getPurchases() {
  return _loadPurchases();
}

export function getPurchaseById(orderId) {
  const purchases = getPurchases();
  const query = String(orderId).replace('#', '').trim().toLowerCase();
  return purchases.find(p => p.id.toLowerCase().replace('#', '') === query || (p.orderNumber && p.orderNumber.toLowerCase().replace('#', '') === query));
}

export function searchPurchases(query) {
  currentSearch = (query || "").trim().toLowerCase();
  currentPage = 1;
  _renderUI();
}

export function filterPurchases(category) {
  if (category) {
    currentCategory = category;
  }
  const all = getPurchases();
  let filtered = [...all];

  if (currentCategory === "courses") {
    filtered = filtered.filter(p => p.type === "course");
  } else if (currentCategory === "books") {
    filtered = filtered.filter(p => p.type === "book");
  } else if (currentCategory === "completed") {
    filtered = filtered.filter(p => p.status === "completed");
  } else if (currentCategory === "refunded") {
    filtered = filtered.filter(p => p.status === "refunded");
  }

  if (currentSearch) {
    filtered = filtered.filter(p => 
      (p.title && p.title.toLowerCase().includes(currentSearch)) ||
      (p.author && p.author.toLowerCase().includes(currentSearch)) ||
      (p.id && p.id.toLowerCase().includes(currentSearch)) ||
      (p.orderNumber && p.orderNumber.toLowerCase().includes(currentSearch)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(currentSearch))
    );
  }

  return sortPurchases(filtered, currentSort);
}

export function sortPurchases(list, sortBy) {
  const sorted = [...list];
  if (sortBy === "latest") {
    sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } else if (sortBy === "oldest") {
    sorted.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } else if (sortBy === "price_desc") {
    sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (sortBy === "price_asc") {
    sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }
  return sorted;
}

export function handlePurchasesSort(sortBy) {
  currentSort = sortBy || "latest";
  currentPage = 1;
  _renderUI();
}

export function getStats() {
  const purchases = getPurchases();
  const completed = purchases.filter(p => p.status === "completed");
  
  const purchasedBooks = completed.filter(p => p.type === "book").length;
  const purchasedCourses = completed.filter(p => p.type === "course").length;
  const totalSpending = completed.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const totalOrders = purchases.length;

  return {
    purchasedBooks,
    purchasedCourses,
    totalSpending,
    totalOrders
  };
}

export function openCourse(courseTitleOrId) {
  const purchase = getPurchaseById(courseTitleOrId) || getPurchases().find(p => p.title === courseTitleOrId || p.itemId === courseTitleOrId);
  const targetId = purchase?.itemId || courseTitleOrId || "1";

  if (window.CourseService && typeof window.CourseService.showCourseDetails === "function") {
    window.CourseService.showCourseDetails(targetId);
  } else {
    window.location.hash = `#course-details/${targetId}`;
  }
}

export function openBook(bookTitleOrId) {
  const purchase = getPurchaseById(bookTitleOrId) || getPurchases().find(p => p.title === bookTitleOrId || p.itemId === bookTitleOrId);
  const targetId = purchase?.itemId || bookTitleOrId || "201";

  if (typeof window.openBookReader === "function") {
    window.openBookReader(targetId);
  } else if (window.BookService && typeof window.BookService.showBookDetails === "function") {
    window.BookService.showBookDetails(targetId);
  } else {
    window.location.hash = `#book-reader?id=${targetId}`;
  }
}

export function getInvoice(orderId) {
  const purchase = getPurchaseById(orderId) || {
    id: orderId || "ORD-2024-1548",
    orderNumber: orderId || "#ORD-2024-1548",
    title: "منتج تعليمي من منصة ستادي مارت",
    type: "course",
    price: 299,
    author: "أحمد محمد",
    date: "24 مايو 2024"
  };

  const tx = {
    id: `TXN-${String(purchase.id).replace(/\D/g, '') || '20241548'}`,
    invoiceNo: String(purchase.orderNumber || purchase.id).replace('#', ''),
    status: purchase.status === "completed" ? "Completed" : "Refunded",
    date: new Date(purchase.timestamp || Date.now()).toISOString(),
    studentName: window.appState?.userData?.name || 'إسلام عادل',
    studentEmail: window.appState?.userData?.email || 'student@gmail.com',
    studentPhone: '+966 50 123 4567',
    country: 'السعودية',
    studentCity: 'الرياض',
    billingAddress: 'شارع العليا العام - المجمع المالي',
    accountID: 'STD-9012',
    teacherName: purchase.author || 'د. محمد أحمد العتيبي',
    teacherEmail: 'instructor@studymart.com',
    paymentMethod: purchase.paymentMethod || 'بطاقة ائتمانية (Visa / MasterCard)',
    price: Number(purchase.price) || 0,
    discount: 0,
    tax: Number((purchase.price * 0.14).toFixed(2)) || 0,
    platformFee: 0,
    netRevenue: Number(purchase.price) || 0,
    total: Number(purchase.price) || 0,
    items: [
      {
        id: purchase.itemId || 1,
        title: purchase.title,
        productType: purchase.type === "course" ? "Course" : "Book",
        productCategory: purchase.categoryName || "التعليم الإلكتروني",
        price: Number(purchase.price) || 0,
        discount: 0,
        tax: Number((purchase.price * 0.14).toFixed(2)) || 0,
        finalPrice: Number(purchase.price) || 0,
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300',
        instructor: purchase.author
      }
    ]
  };

  return tx;
}

export function viewInvoice(orderId) {
  const tx = getInvoice(orderId);
  if (typeof window.openInvoiceModal === "function") {
    window.openInvoiceModal(tx);
  }
}

export function exploreProducts() {
  if (typeof window.showHomeSection === "function") {
    window.showHomeSection('courses');
    window.location.hash = '#courses';
  } else {
    window.location.hash = '#courses';
  }
}

export function getPaymentMethods() {
  return _loadPaymentMethods();
}

export function savePaymentMethod(methodData) {
  const methods = _loadPaymentMethods();
  if (methodData.id) {
    const idx = methods.findIndex(m => m.id === methodData.id);
    if (idx !== -1) {
      methods[idx] = { ...methods[idx], ...methodData };
    }
  } else {
    const newId = "pm-" + Date.now();
    const last4 = (methodData.cardNumber || "").replace(/\D/g, "").slice(-4) || "4242";
    const brand = methodData.brand || (methodData.cardNumber?.startsWith("5") ? "MC" : "VISA");
    const newMethod = {
      id: newId,
      brand,
      badgeText: brand === "MC" ? "MC" : "VISA",
      badgeBg: brand === "MC" ? "#ea580c" : "#1e3a8a",
      label: `${brand} **** ${last4}`,
      cardNumber: `**** **** **** ${last4}`,
      last4,
      cardHolder: methodData.cardHolder || "أحمد محمود",
      expDate: methodData.expDate || "12/28",
      isDefault: methods.length === 0 || !!methodData.isDefault
    };
    if (newMethod.isDefault) {
      methods.forEach(m => m.isDefault = false);
    }
    methods.push(newMethod);
  }
  _savePaymentMethods(methods);
  _renderUI();
}

export function deletePaymentMethod(id) {
  let methods = _loadPaymentMethods();
  methods = methods.filter(m => m.id !== id);
  if (methods.length > 0 && !methods.some(m => m.isDefault)) {
    methods[0].isDefault = true;
  }
  _savePaymentMethods(methods);
  _renderUI();
}

export function setDefaultPaymentMethod(id) {
  const methods = _loadPaymentMethods();
  methods.forEach(m => {
    m.isDefault = (m.id === id);
  });
  _savePaymentMethods(methods);
  _renderUI();
}

export function addPurchase(purchaseData) {
  const purchases = _loadPurchases();
  const newOrderNum = `#ORD-2024-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours % 12 || 12}:${mins} ${hours >= 12 ? 'م' : 'ص'}`;

  const newPurchase = {
    id: newOrderNum.replace('#', ''),
    orderNumber: newOrderNum,
    type: purchaseData.type || "course",
    itemId: String(purchaseData.itemId || Date.now()),
    title: purchaseData.title || "منتج جديد",
    author: purchaseData.author || "مدرب أسرار",
    date: dateStr,
    time: timeStr,
    timestamp: now.getTime(),
    price: Number(purchaseData.price) || 199.00,
    priceFormatted: `${Number(purchaseData.price || 199).toFixed(2)} ج.م`,
    status: "completed",
    thumbBg: purchaseData.type === "book" ? "#fef3c7" : "#0f172a",
    thumbType: purchaseData.type === "book" ? "book" : "react",
    categoryName: purchaseData.categoryName || "تطوير الذات",
    paymentMethod: purchaseData.paymentMethod || "Visa **** 4242"
  };

  purchases.unshift(newPurchase);
  _savePurchases(purchases);
  _renderUI();
  return newPurchase;
}

// UI Binding & Render Helpers

export function setPurchasesPage(pageNum) {
  currentPage = pageNum;
  _renderUI();
}

export function filterPurchasesTab(btn, category) {
  const pills = document.querySelectorAll("#purchasesPage .filter-pills-group .filter-pill");
  pills.forEach((p) => p.classList.remove("active"));
  if (btn) btn.classList.add("active");

  currentCategory = category || "all";
  currentPage = 1;
  _renderUI();
}

export function managePaymentMethods() {
  _openPaymentMethodsModal();
}

function _openPaymentMethodsModal() {
  let modal = document.getElementById("purchasesPaymentModal");
  if (modal) modal.remove();

  const methods = getPaymentMethods();

  const modalHTML = `
    <div id="purchasesPaymentModal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;" dir="rtl">
      <div style="background:#ffffff;border-radius:16px;width:100%;max-width:520px;box-shadow:0 20px 40px rgba(0,0,0,0.2);overflow:hidden;animation:fadeIn 0.2s ease;">
        
        <!-- Header -->
        <div style="padding:18px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;">
          <h3 style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">إدارة طرق الدفع</h3>
          <button type="button" onclick="document.getElementById('purchasesPaymentModal').remove()" style="background:none;border:none;color:#64748b;font-size:20px;cursor:pointer;line-height:1;padding:4px;">✕</button>
        </div>

        <!-- Body -->
        <div style="padding:24px;max-height:75vh;overflow-y:auto;">
          
          <div style="margin-bottom:20px;">
            <h4 style="margin:0 0 12px 0;font-size:13px;color:#64748b;font-weight:600;">البطاقات المحفوظة</h4>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${methods.map(m => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid ${m.isDefault ? '#7c3aed' : '#e2e8f0'};border-radius:10px;background:${m.isDefault ? '#f5f3ff' : '#ffffff'};">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <span style="background:${m.badgeBg};color:#ffffff;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:bold;">${m.badgeText}</span>
                    <div>
                      <div style="font-size:13px;font-weight:700;color:#1e293b;">${m.label} ${m.isDefault ? '<span style="background:#7c3aed;color:#fff;font-size:10px;padding:2px 6px;border-radius:12px;margin-right:6px;">الافتراضي</span>' : ''}</div>
                      <div style="font-size:11px;color:#64748b;">${m.cardHolder} • ${m.expDate}</div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    ${!m.isDefault ? `<button type="button" onclick="window.setDefaultPaymentMethod('${m.id}'); window.managePaymentMethods();" style="border:none;background:#f1f5f9;color:#334155;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">تعيين كافتراضي</button>` : ''}
                    <button type="button" onclick="window.deletePaymentMethod('${m.id}'); window.managePaymentMethods();" style="border:none;background:#fef2f2;color:#dc2626;padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">حذف</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <hr style="border:none;border-top:1px solid #f1f5f9;margin:20px 0;" />

          <!-- Add Form -->
          <div>
            <h4 style="margin:0 0 12px 0;font-size:14px;color:#0f172a;font-weight:700;">إضافة طريقة دفع جديدة</h4>
            <form onsubmit="event.preventDefault(); handleAddPaymentSubmit(this);" style="display:flex;flex-direction:column;gap:12px;">
              <div>
                <label style="display:block;font-size:12px;color:#475569;margin-bottom:4px;font-weight:600;">اسم صاحب البطاقة</label>
                <input type="text" name="cardHolder" placeholder="مثال: أحمد محمود" required style="width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;outline:none;" />
              </div>
              <div>
                <label style="display:block;font-size:12px;color:#475569;margin-bottom:4px;font-weight:600;">رقم البطاقة</label>
                <input type="text" name="cardNumber" placeholder="4242 **** **** ****" required style="width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;outline:none;" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div>
                  <label style="display:block;font-size:12px;color:#475569;margin-bottom:4px;font-weight:600;">تاريخ الانتهاء</label>
                  <input type="text" name="expDate" placeholder="MM/YY" required style="width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;outline:none;" />
                </div>
                <div>
                  <label style="display:block;font-size:12px;color:#475569;margin-bottom:4px;font-weight:600;">نوع البطاقة</label>
                  <select name="brand" style="width:100%;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;outline:none;background:#fff;">
                    <option value="VISA">Visa</option>
                    <option value="MC">Mastercard</option>
                  </select>
                </div>
              </div>
              <button type="submit" style="margin-top:8px;background:#7c3aed;color:#ffffff;border:none;padding:10px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">حفظ طريقة الدفع</button>
            </form>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function handleAddPaymentSubmit(form) {
  const cardHolder = form.cardHolder.value;
  const cardNumber = form.cardNumber.value;
  const expDate = form.expDate.value;
  const brand = form.brand.value;

  savePaymentMethod({
    cardHolder,
    cardNumber,
    expDate,
    brand,
    isDefault: false
  });

  const modal = document.getElementById("purchasesPaymentModal");
  if (modal) modal.remove();
}

function _renderUI() {
  const purchasesPage = document.getElementById("purchasesPage");
  if (!purchasesPage || purchasesPage.classList.contains("hidden")) return;

  // Real purchases data source
  const allPurchases = getPurchases();

  // Handle Empty State Card visibility dynamically based ONLY on real purchases count (0 vs >0)
  const emptyStateCard = document.getElementById("purchasesEmptyStateCard");
  const sidebarContainer = document.getElementById("purchasesSidebarSide") || document.querySelector("#purchasesPage .purchases-sidebar-side");

  if (allPurchases.length === 0) {
    // Show Empty State Card if not currently rendered in DOM
    if (!emptyStateCard && sidebarContainer) {
      const cardHTML = `
        <div class="purchases-side-card explore-card" id="purchasesEmptyStateCard" style="background:#f5f3ff;border:1px solid #ede9fe;padding:24px 20px;">
          <div class="explore-icon-box" style="width:64px;height:64px;background:#f3e8ff;border:none;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h3 class="side-card-title" style="font-size:16px;margin-bottom:6px;">لا توجد مشتريات حتى الآن</h3>
          <p class="side-card-desc" style="font-size:12px;color:#64748b;margin-bottom:16px;">
            ابدأ رحلتك التعليمية باكتشاف أفضل الدورات والكتب.
          </p>
          <button type="button" class="btn-explore-products" onclick="exploreProducts()" style="background:#5b21b6;">
            استكشف المنتجات
          </button>
        </div>
      `;
      sidebarContainer.insertAdjacentHTML("afterbegin", cardHTML);
    }
  } else {
    // Hide Empty State Card completely by removing it from the DOM
    if (emptyStateCard) {
      emptyStateCard.remove();
    }
  }

  // 1. Render Stats
  const stats = getStats();
  const statBooks = document.getElementById("purchasesStatBooks");
  const statCourses = document.getElementById("purchasesStatCourses");
  const statSpending = document.getElementById("purchasesStatSpending");
  const statOrders = document.getElementById("purchasesStatOrders");

  if (statBooks) statBooks.textContent = stats.purchasedBooks;
  if (statCourses) statCourses.textContent = stats.purchasedCourses;
  if (statSpending) statSpending.textContent = `${stats.totalSpending.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`;
  if (statOrders) statOrders.textContent = stats.totalOrders;

  // 2. Render Payment Methods List in Sidebar
  const pmContainer = document.getElementById("purchasesPaymentMethodsList");
  if (pmContainer) {
    const methods = getPaymentMethods();
    pmContainer.innerHTML = methods.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;color:#334155;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="background:${m.badgeBg};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">${m.badgeText}</span>
          <span>${m.label}</span>
        </div>
        ${m.isDefault ? `<span style="font-size:10px;color:#7c3aed;font-weight:700;background:#f3e8ff;padding:1px 6px;border-radius:10px;">افتراضي</span>` : ''}
      </div>
    `).join('');
  }

  // 3. Filter & Sort Purchases
  const filtered = filterPurchases();

  // 4. Render Table
  const tbody = document.getElementById("purchasesTableBody");
  if (tbody) {
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:48px 20px;color:#64748b;">
            <div style="font-size:24px;margin-bottom:8px;">🔍</div>
            <div style="font-size:14px;font-weight:600;">لا توجد مشتريات مطابقة لعملية البحث والتصفية</div>
            <div style="font-size:12px;margin-top:4px;">جرب البحث بكلمات مختلفة أو اختر تصفية أخرى.</div>
          </td>
        </tr>
      `;
    } else {
      const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;

      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

      tbody.innerHTML = paginated.map(p => `
        <tr data-type="${p.type}" data-title="${p.title}" data-author="${p.author}">
          <td class="product-col">
            <div class="product-cell">
              <div class="thumb-box" style="background:${p.thumbBg || '#0f172a'};display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:8px;flex-shrink:0;">
                ${_getThumbSvg(p.type, p.thumbType)}
              </div>
              <div class="product-info">
                <h4 class="product-title">${_escapeHtml(p.title)}</h4>
                <span class="product-author" style="display:flex;align-items:center;gap:4px;">
                  <span style="width:16px;height:16px;border-radius:50%;background:#cbd5e1;display:inline-block;"></span>
                  ${_escapeHtml(p.author)}
                </span>
              </div>
            </div>
          </td>
          <td class="order-details-col">
            <span class="order-number">${p.orderNumber || '#' + p.id}</span>
          </td>
          <td class="date-col">
            <div class="date-box">
              <span class="date-text">${p.date}</span>
              <span class="time-text">${p.time}</span>
            </div>
          </td>
          <td class="price-col">${Number(p.price).toFixed(2)} ج.م</td>
          <td class="status-col">
            <span class="status-badge ${p.status === 'completed' ? 'status-completed' : 'status-refunded'}">
              <span style="width:6px;height:6px;border-radius:50%;background:${p.status === 'completed' ? '#16a34a' : '#dc2626'};display:inline-block;"></span>
              ${p.status === 'completed' ? 'مدفوع' : 'مسترد'}
            </span>
          </td>
          <td class="actions-col">
            <div class="action-buttons-group" style="flex-direction:column;align-items:stretch;gap:6px;">
              <button type="button" class="btn-action-secondary" onclick="viewInvoice('${p.id}')" style="justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                عرض الفاتورة
              </button>
              ${p.type === 'course' ? `
              <button type="button" class="btn-action-primary" onclick="openPurchasedCourse('${p.itemId || p.id}')" style="justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                فتح الدورة
              </button>
              ` : `
              <button type="button" class="btn-action-primary" onclick="openPurchasedBook('${p.itemId || p.id}')" style="justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                فتح الكتاب
              </button>
              `}
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  // 5. Render Pagination
  const paginationElem = document.getElementById("purchasesPagination");
  if (paginationElem) {
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    if (totalPages <= 1) {
      paginationElem.innerHTML = '';
    } else {
      let pagesHTML = `
        <button type="button" class="page-btn ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''} onclick="setPurchasesPage(${currentPage - 1})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      `;

      for (let i = 1; i <= totalPages; i++) {
        pagesHTML += `
          <button type="button" class="page-num ${i === currentPage ? 'active' : ''}" onclick="setPurchasesPage(${i})">${i}</button>
        `;
      }

      pagesHTML += `
        <button type="button" class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''} onclick="setPurchasesPage(${currentPage + 1})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      `;

      paginationElem.innerHTML = pagesHTML;
    }
  }
}

function _getThumbSvg(type, thumbType) {
  if (type === "book" || thumbType === "book") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
  }
  if (thumbType === "react") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"/></svg>`;
  }
  if (thumbType === "python") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
  }
  if (thumbType === "security") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  }
  if (thumbType === "design") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.71 1.7-1.63 0-.43-.17-.83-.45-1.13-.27-.3-.43-.7-.43-1.13 0-.92.78-1.64 1.7-1.64h2.48c2.95 0 5.5-2.45 5.5-5.5 0-5.05-4.5-9-10.5-9z"/></svg>`;
  }
  if (thumbType === "ai") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><rect width="12" height="12" x="6" y="6" rx="2"/><path d="M15 2v4"/><path d="M15 18v4"/><path d="M9 2v4"/><path d="M9 18v4"/><path d="M2 15h4"/><path d="M18 15h4"/><path d="M2 9h4"/><path d="M18 9h4"/></svg>`;
  }
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>`;
}

function _escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openPurchasedCourse(courseTitleOrId) {
  openCourse(courseTitleOrId);
}

export function openPurchasedBook(bookTitleOrId) {
  openBook(bookTitleOrId);
}

export function renderPurchasesPage() {
  if (typeof window !== "undefined" && typeof window.closeAllSidebars === "function") {
    window.closeAllSidebars();
  }

  // Hide any open modals
  const studentPurchasesModal = document.getElementById("studentPurchasesModal");
  if (studentPurchasesModal) studentPurchasesModal.remove();

  const purchasesModal = document.getElementById("purchasesModal");
  if (purchasesModal) purchasesModal.classList.remove("show");

  const myBooksModal = document.getElementById("myBooksModal");
  if (myBooksModal) myBooksModal.remove();

  if (typeof window !== "undefined" && typeof window.hideAllMainSections === "function") {
    window.hideAllMainSections();
  } else {
    const hero = document.querySelector(".hero");
    const features = document.querySelector(".features");
    const coursesSection = document.getElementById("coursesSection") || document.querySelector(".courses");
    const booksSection = document.getElementById("books");
    const editProfilePage = document.getElementById("editProfilePage");
    const myCoursesPage = document.getElementById("myCoursesPage");
    const myBooksPage = document.getElementById("myBooksPage");

    if (hero) hero.classList.add("hidden");
    if (features) features.classList.add("hidden");
    if (coursesSection) coursesSection.classList.add("hidden");
    if (booksSection) booksSection.classList.add("hidden");
    if (editProfilePage) editProfilePage.classList.add("hidden");
    if (myCoursesPage) myCoursesPage.classList.add("hidden");
    if (myBooksPage) myBooksPage.classList.add("hidden");
  }

  // Show Purchases page
  const purchasesPage = document.getElementById("purchasesPage");
  if (purchasesPage) {
    purchasesPage.classList.remove("hidden");
  }

  // Update route hash
  if (!window.location.hash.includes("purchases")) {
    window.location.hash = "#student/purchases";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  _renderUI();
}

export function removePurchase(idOrOrderId) {
  let purchases = _loadPurchases();
  const target = String(idOrOrderId).toLowerCase().replace('#', '').trim();
  purchases = purchases.filter(p => {
    const pId = String(p.id || '').toLowerCase().replace('#', '').trim();
    const pNum = String(p.orderNumber || '').toLowerCase().replace('#', '').trim();
    return pId !== target && pNum !== target;
  });
  _savePurchases(purchases);
  _renderUI();
}

export function clearAllPurchases() {
  _savePurchases([]);
  _renderUI();
}

export function resetPurchases() {
  _savePurchases(DEFAULT_PURCHASES);
  _renderUI();
}

// Bind service methods to global window object
if (typeof window !== "undefined") {
  window.renderPurchasesPage = renderPurchasesPage;
  window.filterPurchasesTab = filterPurchasesTab;
  window.searchPurchases = searchPurchases;
  window.handlePurchasesSort = handlePurchasesSort;
  window.setPurchasesPage = setPurchasesPage;
  window.openPurchasedCourse = openPurchasedCourse;
  window.openPurchasedBook = openPurchasedBook;
  window.viewInvoice = viewInvoice;
  window.exploreProducts = exploreProducts;
  window.managePaymentMethods = managePaymentMethods;
  window.handleAddPaymentSubmit = handleAddPaymentSubmit;
  window.savePaymentMethod = savePaymentMethod;
  window.deletePaymentMethod = deletePaymentMethod;
  window.setDefaultPaymentMethod = setDefaultPaymentMethod;
  window.getPurchases = getPurchases;
  window.getPurchaseById = getPurchaseById;
  window.getStats = getStats;
  window.addPurchase = addPurchase;
  window.removePurchase = removePurchase;
  window.deletePurchase = removePurchase;
  window.clearAllPurchases = clearAllPurchases;
  window.resetPurchases = resetPurchases;
}
