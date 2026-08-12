import { booksData } from "../data/books.js";
import { coursesData } from "../data/courses.js";
import { transactionsData } from "../data/transactions.js";
import { showCustomAlert } from "../utils/helpers.js";
import { hideAllMainSections } from "./layoutService.js";
import { isTeacher } from "./permissionService.js";
import { 
  openInvoiceModal, 
  printInvoiceDocument, 
  downloadInvoicePDFDocument, 
  exportTransactionsPDFReport 
} from "./invoicePdfService.js";

// Active State for Revenue Dashboard
let revenueState = {
  productTypeFilter: "all", // "all" | "Course" | "Book"
  dateRange: "all", // "all" | "today" | "week" | "month_30" | "month" | "year" | "custom"
  customStartDate: "",
  customEndDate: "",
  currency: "USD",
  searchQuery: "",
  categoryFilter: "all",
  sortBy: "revenue_desc",
  currentPage: 1,
  pageSize: 8,
  isLoading: false,
  error: null
};

// Active State for Transaction History Page
let transactionState = {
  searchQuery: "",
  typeFilter: "all",
  statusFilter: "all",
  methodFilter: "all",
  dateRange: "all",
  bookFilter: "all",
  sortBy: "date_desc",
  currentPage: 1,
  pageSize: 10
};

// Currency Rates (Base: USD)
const CURRENCY_RATES = {
  USD: { symbol: "$", rate: 1, name: "USD ($)" },
  SAR: { symbol: "ر.س", rate: 3.75, name: "SAR (ر.س)" },
  EGP: { symbol: "ج.م", rate: 48.0, name: "EGP (ج.م)" },
  EUR: { symbol: "€", rate: 0.92, name: "EUR (€)" }
};

function formatCurrency(amountUSD, currencyCode = revenueState.currency) {
  const curr = CURRENCY_RATES[currencyCode] || CURRENCY_RATES["USD"];
  const val = Math.round(amountUSD * curr.rate * 100) / 100;
  return `${curr.symbol} ${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function isDateInFilter(dateStr, filterKey, customStart = "", customEnd = "") {
  if (!dateStr) return true;
  if (filterKey === "all") return true;
  const txDate = new Date(dateStr);
  const now = new Date();
  
  if (filterKey === "today") {
    return txDate.toDateString() === now.toDateString();
  }
  if (filterKey === "week") {
    const diffDays = (now - txDate) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  }
  if (filterKey === "month_30") {
    const diffDays = (now - txDate) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 30;
  }
  if (filterKey === "month") {
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  }
  if (filterKey === "year") {
    return txDate.getFullYear() === now.getFullYear();
  }
  if (filterKey === "custom") {
    if (customStart) {
      const s = new Date(customStart);
      if (txDate < s) return false;
    }
    if (customEnd) {
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      if (txDate > e) return false;
    }
    return true;
  }
  return true;
}

/**
 * Combine Courses and Books into a unified real products list with dynamic statistics
 */
function getCombinedProducts() {
  const books = booksData.map(b => {
    const txs = transactionsData.filter(t => (t.productType === "Book" || !t.productType) && (t.bookId === b.id || t.bookName === b.title));
    const completedTxs = txs.filter(t => t.type === "Purchase" && t.status === "Completed");
    const salesCount = completedTxs.length > 0 ? completedTxs.length : (b.purchases || 10);
    const rev = completedTxs.length > 0 
      ? completedTxs.reduce((sum, t) => sum + (t.netRevenue || 0), 0) 
      : (b.revenue || Math.round(b.price * salesCount * 0.85));
    const latestTx = txs.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    
    return {
      id: `book-${b.id}`,
      originalId: b.id,
      title: b.title,
      productType: "Book",
      productTypeLabel: "كتاب",
      category: b.category || "عام",
      image: b.image,
      price: b.price || 0,
      sales: salesCount,
      revenue: rev,
      rating: parseFloat(b.rating) || 4.8,
      reviewsCount: b.reviewsCount || salesCount,
      lastSale: latestTx ? latestTx.date : (b.publicationDate || "2024-02-01")
    };
  });

  const courses = coursesData.map(c => {
    const txs = transactionsData.filter(t => t.productType === "Course" && (t.bookId === c.id || t.bookName === c.title));
    const completedTxs = txs.filter(t => t.type === "Purchase" && t.status === "Completed");
    const salesCount = completedTxs.length > 0 ? completedTxs.length : Math.floor((c.students || 100) / 10);
    const rev = completedTxs.length > 0 
      ? completedTxs.reduce((sum, t) => sum + (t.netRevenue || 0), 0) 
      : Math.round(c.price * salesCount * 0.85);
    const latestTx = txs.sort((a,b) => new Date(b.date) - new Date(a.date))[0];

    return {
      id: `course-${c.id}`,
      originalId: c.id,
      title: c.title,
      productType: "Course",
      productTypeLabel: "دورة",
      category: c.category || "برمجة",
      image: c.image,
      price: c.price || 0,
      sales: salesCount,
      revenue: rev,
      rating: parseFloat(c.rating) || 4.9,
      reviewsCount: c.lessons ? c.lessons * 4 : 35,
      lastSale: latestTx ? latestTx.date : "2024-02-15"
    };
  });

  return [...courses, ...books];
}

/* ==========================================================================
   SECTION 1: REVENUE DASHBOARD (الإيرادات)
   ========================================================================== */

export function openRevenueDashboard() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، صفحة الإيرادات مخصصة للمعلمين والمالك فقط.");
    return;
  }

  hideAllMainSections();

  const page = document.getElementById("revenueDashboardPage");
  const content = document.getElementById("revenueDashboardContent");

  if (!page || !content) {
    console.error("Revenue container missing in DOM");
    return;
  }

  page.classList.remove("hidden");
  history.pushState(null, "", "#teacher/revenue");
  renderRevenueDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function renderRevenueDashboard() {
  const content = document.getElementById("revenueDashboardContent");
  if (!content) return;

  // Render loading state if active
  if (revenueState.isLoading) {
    content.innerHTML = renderRevenueSkeletonHTML();
    return;
  }

  // Render error state if present
  if (revenueState.error) {
    content.innerHTML = renderRevenueErrorHTML(revenueState.error);
    return;
  }

  try {
    // 1. Filter Transactions by product type & date range
    let filteredTx = transactionsData.filter(tx => {
      // Date filter
      if (!isDateInFilter(tx.date, revenueState.dateRange, revenueState.customStartDate, revenueState.customEndDate)) {
        return false;
      }
      // Product type filter
      if (revenueState.productTypeFilter !== "all") {
        if (tx.productType && tx.productType !== "System" && tx.productType !== revenueState.productTypeFilter) {
          return false;
        }
      }
      return true;
    });

    // 2. Compute 11 Summary Metrics dynamically from BOTH Courses & Books
    const completedSalesTx = filteredTx.filter(t => t.type === "Purchase" && t.status === "Completed");
    const pendingTx = filteredTx.filter(t => t.status === "Pending" && t.type === "Purchase");
    const refundsTx = filteredTx.filter(t => t.type === "Refund" || t.status === "Refunded");
    const completedWithdrawals = transactionsData.filter(t => t.type === "Withdrawal" && t.status === "Completed");

    const grossSalesUSD = completedSalesTx.reduce((sum, t) => sum + (t.price || 0), 0);
    const refundsTotalUSD = refundsTx.reduce((sum, t) => sum + Math.abs(t.netRevenue || t.price || 0), 0);
    const totalRevenueUSD = Math.max(0, completedSalesTx.reduce((sum, t) => sum + (t.netRevenue || 0), 0) - refundsTotalUSD);

    // Filtered date metrics
    const todayRevenueUSD = transactionsData
      .filter(t => t.type === "Purchase" && t.status === "Completed" && 
        (revenueState.productTypeFilter === "all" || t.productType === revenueState.productTypeFilter) &&
        isDateInFilter(t.date, "today"))
      .reduce((sum, t) => sum + (t.netRevenue || 0), 0);

    const weekRevenueUSD = transactionsData
      .filter(t => t.type === "Purchase" && t.status === "Completed" && 
        (revenueState.productTypeFilter === "all" || t.productType === revenueState.productTypeFilter) &&
        isDateInFilter(t.date, "week"))
      .reduce((sum, t) => sum + (t.netRevenue || 0), 0);

    const monthRevenueUSD = transactionsData
      .filter(t => t.type === "Purchase" && t.status === "Completed" && 
        (revenueState.productTypeFilter === "all" || t.productType === revenueState.productTypeFilter) &&
        isDateInFilter(t.date, "month"))
      .reduce((sum, t) => sum + (t.netRevenue || 0), 0);

    const yearRevenueUSD = transactionsData
      .filter(t => t.type === "Purchase" && t.status === "Completed" && 
        (revenueState.productTypeFilter === "all" || t.productType === revenueState.productTypeFilter) &&
        isDateInFilter(t.date, "year"))
      .reduce((sum, t) => sum + (t.netRevenue || 0), 0);

    const pendingRevenueUSD = pendingTx.reduce((sum, t) => sum + (t.netRevenue || 0), 0);
    const withdrawnRevenueUSD = Math.abs(completedWithdrawals.reduce((sum, t) => sum + (t.netRevenue || 0), 0));
    const availableBalanceUSD = Math.max(0, totalRevenueUSD - withdrawnRevenueUSD - pendingRevenueUSD);

    const totalSalesCount = completedSalesTx.length;
    const avgOrderValueUSD = totalSalesCount > 0 ? (grossSalesUSD / totalSalesCount) : 0;

    const allProducts = getCombinedProducts().filter(p => 
      revenueState.productTypeFilter === "all" || p.productType === revenueState.productTypeFilter
    );
    const avgRevenuePerProductUSD = allProducts.length > 0 ? (totalRevenueUSD / allProducts.length) : 0;

    // 3. Product Breakdown (Courses vs Books)
    const courseSalesTx = completedSalesTx.filter(t => t.productType === "Course");
    const bookSalesTx = completedSalesTx.filter(t => t.productType === "Book");

    const courseRevenueUSD = courseSalesTx.reduce((sum, t) => sum + (t.netRevenue || 0), 0);
    const bookRevenueUSD = bookSalesTx.reduce((sum, t) => sum + (t.netRevenue || 0), 0);
    const totalProdRevUSD = courseRevenueUSD + bookRevenueUSD || 1;

    const coursePct = Math.round((courseRevenueUSD / totalProdRevUSD) * 100);
    const bookPct = 100 - coursePct;

    const activeEl = document.activeElement;
    let activeInputId = null;
    let selStart = null;
    let selEnd = null;
    if (activeEl && (activeEl.id === "revenueSearchInput" || activeEl.id === "transactionSearchInput")) {
      activeInputId = activeEl.id;
      selStart = activeEl.selectionStart;
      selEnd = activeEl.selectionEnd;
    }

    content.innerHTML = `
      <div class="revenue-container">
        <!-- BREADCRUMB -->
        <div class="rt-breadcrumb">
          <a href="#teacher/dashboard" onclick="event.preventDefault(); window.location.hash='#teacher/dashboard'; if(window.showDashboard) window.showDashboard();">لوحة المعلم</a> &gt;
          <span>لوحة الإيرادات والأرباح الشاملة (الدورات والكتب)</span>
        </div>

        <!-- HEADER BANNER -->
        <div class="rt-header-banner">
          <div class="rt-header-info">
            <h1>📈 لوحة إحصائيات الأرباح والمبيعات الشاملة</h1>
            <p>تحليل مالي تراكمي يجمع إيرادات الدورات التدريبية والكتب الرقمية معاً</p>
          </div>

          <div class="rt-header-controls">
            <!-- Currency selector -->
            <div class="rt-currency-wrapper" style="display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.15); padding:4px 10px; border-radius:10px;">
              <span style="font-size:12px; color:#e0e7ff; font-weight:700;">العملة:</span>
              <select class="rt-select" style="background:#ffffff; color:#0f172a; padding:5px 10px; font-weight:700;" onchange="changeRevenueCurrency(this.value)">
                ${Object.keys(CURRENCY_RATES).map(code => `
                  <option value="${code}" ${revenueState.currency === code ? 'selected' : ''}>${CURRENCY_RATES[code].name}</option>
                `).join('')}
              </select>
            </div>

            <!-- Product Type Filter -->
            <select class="rt-select" style="background:#ffffff; color:#0f172a; font-weight:700;" onchange="changeRevenueProductType(this.value)">
              <option value="all" ${revenueState.productTypeFilter === 'all' ? 'selected' : ''}>🎓 كل المنتجات (دورات وكتب)</option>
              <option value="Course" ${revenueState.productTypeFilter === 'Course' ? 'selected' : ''}>🎥 الدورات فقط (Courses)</option>
              <option value="Book" ${revenueState.productTypeFilter === 'Book' ? 'selected' : ''}>📚 الكتب فقط (Books)</option>
            </select>

            <!-- Date Filter -->
            <select class="rt-select" style="background:#ffffff; color:#0f172a; font-weight:700;" onchange="changeRevenueDateRange(this.value)">
              <option value="all" ${revenueState.dateRange === 'all' ? 'selected' : ''}>كل الأوقات</option>
              <option value="today" ${revenueState.dateRange === 'today' ? 'selected' : ''}>اليوم (Today)</option>
              <option value="week" ${revenueState.dateRange === 'week' ? 'selected' : ''}>آخر 7 أيام (Last 7 Days)</option>
              <option value="month_30" ${revenueState.dateRange === 'month_30' ? 'selected' : ''}>آخر 30 يوم (Last 30 Days)</option>
              <option value="month" ${revenueState.dateRange === 'month' ? 'selected' : ''}>هذا الشهر (This Month)</option>
              <option value="year" ${revenueState.dateRange === 'year' ? 'selected' : ''}>هذه السنة (This Year)</option>
              <option value="custom" ${revenueState.dateRange === 'custom' ? 'selected' : ''}>📅 نطاق تاريخ مخصص</option>
            </select>

            <!-- Export Actions -->
            <button type="button" class="rt-btn rt-btn-pdf" onclick="exportRevenuePDF()">📄 PDF</button>
            <button type="button" class="rt-btn rt-btn-excel" onclick="exportRevenueExcel()">📊 Excel</button>
            <button type="button" class="rt-btn rt-btn-csv" onclick="exportRevenueCSV()">💾 CSV</button>
          </div>
        </div>

        <!-- CUSTOM DATE PICKERS (IF SELECTED) -->
        ${revenueState.dateRange === 'custom' ? `
          <div class="rt-custom-dates-bar" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:20px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
            <span style="font-weight:700; font-size:13px; color:#334155;">من تاريخ:</span>
            <input type="date" class="rt-input" value="${revenueState.customStartDate}" onchange="updateRevenueCustomDate('start', this.value)" />
            <span style="font-weight:700; font-size:13px; color:#334155;">إلى تاريخ:</span>
            <input type="date" class="rt-input" value="${revenueState.customEndDate}" onchange="updateRevenueCustomDate('end', this.value)" />
          </div>
        ` : ''}

        <!-- PRODUCT REVENUE BREAKDOWN CARD (COURSES VS BOOKS) -->
        <div class="rt-breakdown-card" style="background:linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border:1px solid #e2e8f0; border-radius:18px; padding:20px; margin-bottom:24px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
          <div class="rt-breakdown-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
            <div>
              <h3 style="margin:0 0 4px 0; font-size:17px; font-weight:800; color:#0f172a;">📊 توزيع الإيرادات حسب نوع المنتج (Product Revenue Breakdown)</h3>
              <p style="margin:0; font-size:13px; color:#64748b;">مقارنة بين مساهمة الدورات التدريبية والكتب الرقمية في المبيعات</p>
            </div>
            <div class="rt-breakdown-legend" style="display:flex; gap:16px;">
              <span style="font-size:13px; font-weight:700; color:#6d28d9;">🎥 الدورات: ${coursePct}% (${formatCurrency(courseRevenueUSD)})</span>
              <span style="font-size:13px; font-weight:700; color:#059669;">📚 الكتب: ${bookPct}% (${formatCurrency(bookRevenueUSD)})</span>
            </div>
          </div>

          <!-- Progress bar visual -->
          <div class="rt-breakdown-bar" style="width:100%; height:16px; background:#e2e8f0; border-radius:12px; overflow:hidden; display:flex;">
            <div style="width:${coursePct}%; height:100%; background:linear-gradient(90deg, #6d28d9, #8b5cf6); transition:width 0.5s ease;" title="الدورات: ${coursePct}%"></div>
            <div style="width:${bookPct}%; height:100%; background:linear-gradient(90deg, #10b981, #34d399); transition:width 0.5s ease;" title="الكتب: ${bookPct}%"></div>
          </div>
        </div>

        <!-- 11 SUMMARY CARDS FROM BOTH COURSES & BOOKS -->
        <div class="rt-summary-grid">
          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">إجمالي الأرباح الصافية</span>
              <div class="rt-card-icon rt-icon-purple">💰</div>
            </div>
            <div class="rt-card-val">${formatCurrency(totalRevenueUSD)}</div>
            <div class="rt-card-sub positive">دورات وكتب مكتملة</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">أرباح اليوم</span>
              <div class="rt-card-icon rt-icon-green">☀️</div>
            </div>
            <div class="rt-card-val">${formatCurrency(todayRevenueUSD)}</div>
            <div class="rt-card-sub">أرباح آخر 24 ساعة</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">أرباح هذا الأسبوع</span>
              <div class="rt-card-icon rt-icon-blue">📅</div>
            </div>
            <div class="rt-card-val">${formatCurrency(weekRevenueUSD)}</div>
            <div class="rt-card-sub">آخر 7 أيام</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">أرباح هذا الشهر</span>
              <div class="rt-card-icon rt-icon-orange">📆</div>
            </div>
            <div class="rt-card-val">${formatCurrency(monthRevenueUSD)}</div>
            <div class="rt-card-sub positive">إيراد الشهر الحالي</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">أرباح هذه السنة</span>
              <div class="rt-card-icon rt-icon-amber">🏆</div>
            </div>
            <div class="rt-card-val">${formatCurrency(yearRevenueUSD)}</div>
            <div class="rt-card-sub">إجمالي العام الحالي</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">الأرباح المعلقة</span>
              <div class="rt-card-icon rt-icon-rose">⏳</div>
            </div>
            <div class="rt-card-val">${formatCurrency(pendingRevenueUSD)}</div>
            <div class="rt-card-sub">معاملات قيد المعالجة</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">الأرباح المسحوبة</span>
              <div class="rt-card-icon rt-icon-purple">🏦</div>
            </div>
            <div class="rt-card-val">${formatCurrency(withdrawnRevenueUSD)}</div>
            <div class="rt-card-sub">مبالغ تم تحويلها لبنكك</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">الرصيد المتاح للسحب</span>
              <div class="rt-card-icon rt-icon-green">💳</div>
            </div>
            <div class="rt-card-val" style="color:#16a34a;">${formatCurrency(availableBalanceUSD)}</div>
            <div class="rt-card-sub positive">جاهز للتحويل الفوري</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">إجمالي المبيعات</span>
              <div class="rt-card-icon rt-icon-blue">📦</div>
            </div>
            <div class="rt-card-val">${totalSalesCount} <span style="font-size:14px; font-weight:600; color:#64748b;">طلب بيع</span></div>
            <div class="rt-card-sub">دورات وكتب مباعة</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">متوسط قيمة الطلب (AOV)</span>
              <div class="rt-card-icon rt-icon-amber">🏷️</div>
            </div>
            <div class="rt-card-val">${formatCurrency(avgOrderValueUSD)}</div>
            <div class="rt-card-sub">لكل طلب شراء</div>
          </div>

          <div class="rt-card">
            <div class="rt-card-top">
              <span class="rt-card-title">متوسط الربح لكل منتج</span>
              <div class="rt-card-icon rt-icon-orange">📑</div>
            </div>
            <div class="rt-card-val">${formatCurrency(avgRevenuePerProductUSD)}</div>
            <div class="rt-card-sub">عائد متوسط لكل عنوان</div>
          </div>
        </div>

        <!-- ANALYTICS CHARTS GRID (SVG REAL DATA) -->
        <div class="rt-charts-grid">
          <!-- Daily Revenue Trend Chart -->
          <div class="rt-chart-card">
            <div class="rt-chart-header">
              <h3 class="rt-chart-title">📊 منحنى الأرباح اليومية (Daily Revenue)</h3>
              <span style="font-size:12px; color:#64748b; font-weight:600;">مباشر</span>
            </div>
            <div class="rt-svg-chart-container">
              ${renderDailyRevenueSVGChart(completedSalesTx)}
            </div>
          </div>

          <!-- Monthly Revenue Chart -->
          <div class="rt-chart-card">
            <div class="rt-chart-header">
              <h3 class="rt-chart-title">🗓️ توزيع الأرباح الشهرية (Monthly Revenue)</h3>
              <span style="font-size:12px; color:#64748b; font-weight:600;">العام الحالي</span>
            </div>
            <div class="rt-svg-chart-container">
              ${renderMonthlyRevenueSVGChart(completedSalesTx)}
            </div>
          </div>

          <!-- Combined Top Selling Courses -->
          <div class="rt-chart-card">
            <div class="rt-chart-header">
              <h3 class="rt-chart-title">🥇 الدورات الأكثر مبيعاً (Top Courses)</h3>
              <span style="font-size:12px; color:#64748b; font-weight:600;">الدورات التدريبية</span>
            </div>
            <div class="rt-svg-chart-container">
              ${renderTopProductsBarChart(getCombinedProducts().filter(p => p.productType === "Course"))}
            </div>
          </div>

          <!-- Combined Top Selling Books -->
          <div class="rt-chart-card">
            <div class="rt-chart-header">
              <h3 class="rt-chart-title">📚 الكتب الأكثر مبيعاً (Top Books)</h3>
              <span style="font-size:12px; color:#64748b; font-weight:600;">الكتب الرقمية</span>
            </div>
            <div class="rt-svg-chart-container">
              ${renderTopProductsBarChart(getCombinedProducts().filter(p => p.productType === "Book"))}
            </div>
          </div>
        </div>

        <!-- COMBINED PRODUCTS TABLE SECTION (COURSES AND BOOKS) -->
        <div class="rt-table-card">
          <div class="rt-table-card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
            <div>
              <h3 style="margin:0 0 4px 0; font-size:18px; font-weight:800; color:#0f172a;">🎓📚 جدول أداء وإيرادات المنتجات (الدورات والكتب)</h3>
              <p style="margin:0; font-size:13px; color:#64748b;">عرض شامل لجميع المنتجات المنشورة مع مبيعاتها وإيراداتها الصافية وتقييماتها</p>
            </div>

            <div class="rt-table-card-controls" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
              <!-- Search -->
              <input type="text" id="revenueSearchInput" class="rt-input" placeholder="🔍 ابحث باسم المنتج أو التصنيف..." value="${escapeHtml(revenueState.searchQuery)}" oninput="updateRevenueSearch(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();}" style="width:230px;" />
              
              <div class="rt-filter-selects-group" style="display:flex; gap:8px; align-items:center;">
                <!-- Filter Category -->
                <select class="rt-select" onchange="updateRevenueCategory(this.value)">
                  <option value="all">كل التصنيفات</option>
                  <option value="برمجة" ${revenueState.categoryFilter === 'برمجة' ? 'selected' : ''}>برمجة</option>
                  <option value="تداول" ${revenueState.categoryFilter === 'تداول' ? 'selected' : ''}>تداول</option>
                  <option value="تصميم" ${revenueState.categoryFilter === 'تصميم' ? 'selected' : ''}>تصميم</option>
                  <option value="لغات" ${revenueState.categoryFilter === 'لغات' ? 'selected' : ''}>لغات</option>
                  <option value="عام" ${revenueState.categoryFilter === 'عام' ? 'selected' : ''}>عام</option>
                </select>

                <!-- Sorting -->
                <select class="rt-select" onchange="updateRevenueSort(this.value)">
                  <option value="revenue_desc" ${revenueState.sortBy === 'revenue_desc' ? 'selected' : ''}>الأعلى إيراداً</option>
                  <option value="sales_desc" ${revenueState.sortBy === 'sales_desc' ? 'selected' : ''}>الأكثر مبيعاً</option>
                  <option value="rating_desc" ${revenueState.sortBy === 'rating_desc' ? 'selected' : ''}>الأعلى تقييماً</option>
                  <option value="title_asc" ${revenueState.sortBy === 'title_asc' ? 'selected' : ''}>اسم المنتج أ-ي</option>
                </select>
              </div>
            </div>
          </div>

          <div id="revenueProductsTableContainer">
            ${renderCombinedProductsTableHTML()}
          </div>
        </div>
      </div>
    `;

    if (activeInputId) {
      const restoredEl = document.getElementById(activeInputId);
      if (restoredEl) {
        restoredEl.focus();
        if (selStart !== null && selEnd !== null) {
          try { restoredEl.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error("Error rendering revenue dashboard:", err);
    revenueState.error = err.message || "حدث خطأ غير متوقع أثناء تحميل بيانات الإيرادات.";
    content.innerHTML = renderRevenueErrorHTML(revenueState.error);
  }
}

/**
 * Skeleton Loader HTML for Revenue Dashboard
 */
function renderRevenueSkeletonHTML() {
  return `
    <div class="revenue-container" style="opacity:0.7;">
      <div style="height:40px; background:#e2e8f0; border-radius:8px; width:200px; margin-bottom:16px;"></div>
      <div style="height:100px; background:#cbd5e1; border-radius:16px; margin-bottom:24px;"></div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
        ${Array.from({ length: 8 }).map(() => `
          <div style="height:110px; background:#e2e8f0; border-radius:14px;"></div>
        `).join('')}
      </div>
      <div style="height:300px; background:#e2e8f0; border-radius:16px;"></div>
    </div>
  `;
}

/**
 * Error HTML for Revenue Dashboard
 */
function renderRevenueErrorHTML(errMsg) {
  return `
    <div class="revenue-container" style="text-align:center; padding:60px 20px;">
      <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
      <h2 style="color:#0f172a; font-weight:800; margin:0 0 10px 0;">تعذر تحميل بيانات الإيرادات</h2>
      <p style="color:#64748b; font-size:14px; max-width:500px; margin:0 auto 20px auto;">${escapeHtml(errMsg)}</p>
      <button type="button" class="rt-btn rt-btn-primary" onclick="retryRevenueLoad()">
        🔄 إعادة المحاولة
      </button>
    </div>
  `;
}

export function retryRevenueLoad() {
  revenueState.isLoading = true;
  revenueState.error = null;
  renderRevenueDashboard();
  setTimeout(() => {
    revenueState.isLoading = false;
    renderRevenueDashboard();
  }, 300);
}

/**
 * SVG Chart Generators for Revenue Dashboard
 */

function renderDailyRevenueSVGChart(completedSalesTx) {
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  // Group actual sales by day of week or create realistic distribution from transactions
  const daySums = [0, 0, 0, 0, 0, 0, 0];
  completedSalesTx.forEach(tx => {
    const d = new Date(tx.date).getDay();
    daySums[d] += (tx.netRevenue || 0);
  });

  // Fallback defaults if sums are empty
  const values = daySums.map((v, idx) => v > 0 ? v : [1200, 1900, 1500, 2800, 2200, 3100, 2600][idx]);

  const width = 450;
  const height = 200;
  const maxVal = Math.max(...values, 3500);

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * (width - 60) + 40;
    const y = height - 30 - (val / maxVal) * (height - 60);
    return { x, y, val, label: days[idx] };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - 30} L ${points[0].x} ${height - 30} Z`;

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <line x1="30" y1="30" x2="${width}" y2="30" stroke="#f1f5f9" stroke-width="1"/>
      <line x1="30" y1="90" x2="${width}" y2="90" stroke="#f1f5f9" stroke-width="1"/>
      <line x1="30" y1="150" x2="${width}" y2="150" stroke="#f1f5f9" stroke-width="1"/>

      <path d="${areaD}" fill="url(#revenueGrad)"/>
      <path d="${pathD}" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round"/>

      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/>
        <text x="${p.x}" y="${height - 10}" font-size="11" fill="#64748b" text-anchor="middle" font-weight="600">${p.label}</text>
        <text x="${p.x}" y="${p.y - 10}" font-size="10" fill="#4c1d95" text-anchor="middle" font-weight="700">${formatCurrency(p.val)}</text>
      `).join('')}
    </svg>
  `;
}

function renderMonthlyRevenueSVGChart(completedSalesTx) {
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس"];
  const monthSums = [0, 0, 0, 0, 0, 0, 0, 0];
  completedSalesTx.forEach(tx => {
    const m = new Date(tx.date).getMonth();
    if (m < 8) monthSums[m] += (tx.netRevenue || 0);
  });

  const values = monthSums.map((v, idx) => v > 0 ? v : [8500, 11200, 14300, 12800, 16500, 19200, 21500, 18400][idx]);
  const maxVal = Math.max(...values, 25000);

  const width = 450;
  const height = 200;
  const barWidth = 32;

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      ${values.map((val, idx) => {
        const x = (idx / values.length) * (width - 40) + 25;
        const barH = (val / maxVal) * (height - 60);
        const y = height - 30 - barH;
        return `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="#10b981" opacity="0.85"/>
          <text x="${x + barWidth / 2}" y="${height - 10}" font-size="10" fill="#64748b" text-anchor="middle" font-weight="600">${months[idx]}</text>
          <text x="${x + barWidth / 2}" y="${y - 6}" font-size="9" fill="#047857" text-anchor="middle" font-weight="700">${formatCurrency(val)}</text>
        `;
      }).join('')}
    </svg>
  `;
}

function renderTopProductsBarChart(products) {
  const sorted = [...products].sort((a, b) => b.sales - a.sales).slice(0, 4);
  if (sorted.length === 0) {
    return `<div style="padding:20px; text-align:center; color:#94a3b8; font-size:13px;">لا توجد منتجات مطابقة.</div>`;
  }
  const maxSales = Math.max(...sorted.map(p => p.sales), 10);

  return `
    <div class="rt-top-products-list">
      ${sorted.map(p => {
        const pct = Math.round((p.sales / maxSales) * 100);
        const colorGrad = p.productType === "Course" 
          ? "linear-gradient(90deg, #6d28d9, #9333ea)" 
          : "linear-gradient(90deg, #059669, #10b981)";
        return `
          <div class="rt-top-product-item">
            <div class="rt-top-product-meta">
              <span class="rt-top-product-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</span>
              <span class="rt-top-product-stats" style="color:${p.productType === 'Course' ? '#6d28d9' : '#059669'};">${p.sales} مبيعة (${formatCurrency(p.revenue)})</span>
            </div>
            <div class="rt-top-product-bar-track">
              <div class="rt-top-product-bar-fill" style="width:${pct}%; background:${colorGrad};"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render Combined Products (Courses & Books) Table HTML
 */
function renderCombinedProductsTableHTML() {
  let list = getCombinedProducts();

  // Filter by Product Type
  if (revenueState.productTypeFilter !== "all") {
    list = list.filter(p => p.productType === revenueState.productTypeFilter);
  }

  // Search filter
  if (revenueState.searchQuery.trim()) {
    const q = (revenueState.searchQuery || "").toLowerCase().trim();
    list = list.filter(p => (p.title || "").toLowerCase().includes(q) || (p.category && (p.category || "").toLowerCase().includes(q)));
  }

  // Category filter
  if (revenueState.categoryFilter !== "all") {
    list = list.filter(p => p.category === revenueState.categoryFilter);
  }

  // Sorting
  list.sort((a, b) => {
    if (revenueState.sortBy === "revenue_desc") return b.revenue - a.revenue;
    if (revenueState.sortBy === "sales_desc") return b.sales - a.sales;
    if (revenueState.sortBy === "rating_desc") return b.rating - a.rating;
    if (revenueState.sortBy === "title_asc") return a.title.localeCompare(b.title, "ar");
    return 0;
  });

  // Pagination
  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / revenueState.pageSize) || 1;
  revenueState.currentPage = Math.min(revenueState.currentPage, totalPages);
  const startIndex = (revenueState.currentPage - 1) * revenueState.pageSize;
  const paginatedList = list.slice(startIndex, startIndex + revenueState.pageSize);

  // EMPTY STATE
  if (paginatedList.length === 0) {
    return `
      <div style="padding:50px 20px; text-align:center; color:#64748b;">
        <div style="font-size:42px; margin-bottom:12px;">🔍</div>
        <h4 style="margin:0 0 6px 0; font-size:16px; font-weight:800; color:#0f172a;">لا توجد نتائج مبيعات مطابقة</h4>
        <p style="margin:0; font-size:13px; color:#64748b;">لم نجد أي دورات أو كتب تطابق خيارات التصفية أو كلمة البحث أدناه.</p>
      </div>
    `;
  }

  return `
    <div class="rt-table-wrapper">
      <table class="rt-table">
        <thead>
          <tr>
            <th>صورة المنتج</th>
            <th>اسم المنتج والتصنيف</th>
            <th>نوع المنتج</th>
            <th>السعر</th>
            <th>إجمالي المبيعات</th>
            <th>إجمالي الإيرادات</th>
            <th>التقييم العام</th>
            <th>تاريخ آخر بيع</th>
          </tr>
        </thead>
        <tbody>
          ${paginatedList.map(p => {
            const isCourse = p.productType === "Course";
            return `
              <tr>
                <td>
                  <img src="${p.image}" alt="Cover" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;" />
                </td>
                <td>
                  <div style="font-weight:800; color:#0f172a;">${escapeHtml(p.title)}</div>
                  <div style="font-size:12px; color:#64748b;">${escapeHtml(p.category)}</div>
                </td>
                <td>
                  <span class="rt-badge ${isCourse ? 'rt-badge-completed' : 'rt-badge-pending'}" style="font-weight:700;">
                    ${isCourse ? '🎓 دورة تعليمية' : '📚 كتاب رقمي'}
                  </span>
                </td>
                <td style="font-weight:700;">${formatCurrency(p.price)}</td>
                <td>
                  <span style="font-weight:800; color:#334155;">${p.sales} مبيعة</span>
                </td>
                <td style="font-weight:900; color:#15803d; font-size:15px;">${formatCurrency(p.revenue)}</td>
                <td>
                  <span style="color:#d97706; font-weight:700;">★ ${p.rating}</span>
                  <span style="font-size:11px; color:#64748b;">(${p.reviewsCount})</span>
                </td>
                <td style="font-size:13px; color:#475569;">${p.lastSale ? p.lastSale.split('T')[0] : '2024-02-01'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- PAGINATION BAR -->
    <div class="rt-pagination">
      <div style="font-size:13px; color:#64748b;">
        عرض <b>${startIndex + 1}</b> إلى <b>${Math.min(startIndex + revenueState.pageSize, totalItems)}</b> من إجمالي <b>${totalItems}</b> منتج
      </div>
      <div style="display:flex; gap:6px;">
        <button type="button" class="rt-page-btn" ${revenueState.currentPage === 1 ? 'disabled' : ''} onclick="changeRevenuePage(${revenueState.currentPage - 1})">← السابق</button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button type="button" class="rt-page-btn ${p === revenueState.currentPage ? 'active' : ''}" onclick="changeRevenuePage(${p})">${p}</button>
        `).join('')}
        <button type="button" class="rt-page-btn" ${revenueState.currentPage === totalPages ? 'disabled' : ''} onclick="changeRevenuePage(${revenueState.currentPage + 1})">التالي →</button>
      </div>
    </div>
  `;
}

/**
 * Handlers for Revenue Page Filters & Controls
 */
export function changeRevenueCurrency(code) {
  revenueState.currency = code;
  renderRevenueDashboard();
}

export function changeRevenueProductType(type) {
  revenueState.productTypeFilter = type;
  revenueState.currentPage = 1;
  renderRevenueDashboard();
}

export function changeRevenueDateRange(range) {
  revenueState.dateRange = range;
  revenueState.currentPage = 1;
  renderRevenueDashboard();
}

export function updateRevenueCustomDate(type, val) {
  if (type === 'start') revenueState.customStartDate = val;
  if (type === 'end') revenueState.customEndDate = val;
  revenueState.currentPage = 1;
  renderRevenueDashboard();
}

export function updateRevenueSearch(val) {
  revenueState.searchQuery = val;
  revenueState.currentPage = 1;
  const tableContainer = document.getElementById("revenueProductsTableContainer");
  if (tableContainer) {
    tableContainer.innerHTML = renderCombinedProductsTableHTML();
  } else {
    renderRevenueDashboard();
  }
}

export function updateRevenueCategory(cat) {
  revenueState.categoryFilter = cat;
  revenueState.currentPage = 1;
  const tableContainer = document.getElementById("revenueProductsTableContainer");
  if (tableContainer) {
    tableContainer.innerHTML = renderCombinedProductsTableHTML();
  } else {
    renderRevenueDashboard();
  }
}

export function updateRevenueSort(sort) {
  revenueState.sortBy = sort;
  const tableContainer = document.getElementById("revenueProductsTableContainer");
  if (tableContainer) {
    tableContainer.innerHTML = renderCombinedProductsTableHTML();
  } else {
    renderRevenueDashboard();
  }
}

export function changeRevenuePage(p) {
  revenueState.currentPage = p;
  const tableContainer = document.getElementById("revenueProductsTableContainer");
  if (tableContainer) {
    tableContainer.innerHTML = renderCombinedProductsTableHTML();
  } else {
    renderRevenueDashboard();
  }
}

export function exportRevenuePDF() {
  const filtered = getFilteredTransactionsList();
  const summary = getFilterSummaryText();
  exportTransactionsPDFReport(filtered, summary);
}

export function exportRevenueExcel() {
  let list = getCombinedProducts();

  if (revenueState.productTypeFilter !== "all") {
    list = list.filter(p => p.productType === revenueState.productTypeFilter);
  }
  if (revenueState.searchQuery.trim()) {
    const q = (revenueState.searchQuery || "").toLowerCase().trim();
    list = list.filter(p => (p.title || "").toLowerCase().includes(q) || (p.category && (p.category || "").toLowerCase().includes(q)));
  }
  if (revenueState.categoryFilter !== "all") {
    list = list.filter(p => p.category === revenueState.categoryFilter);
  }

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += "ID,Product Title,Type,Category,Price,Sales,Revenue,Rating,Last Sale\n";
  list.forEach(p => {
    csvContent += `"${p.id}","${p.title.replace(/"/g, '""')}","${p.productTypeLabel}","${p.category}","${p.price}","${p.sales}","${p.revenue}","${p.rating}","${p.lastSale}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `revenue_report_${revenueState.productTypeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showCustomAlert("تم تصدير تقرير الإيرادات إلى ملف Excel/CSV بنجاح!");
}

export function exportRevenueCSV() {
  exportRevenueExcel();
}

/* ==========================================================================
   SECTION 2: TRANSACTION HISTORY (سجل المعاملات)
   ========================================================================== */

export function openTransactionHistory() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، سجل المعاملات مخصص للمعلمين والمالك فقط.");
    return;
  }

  hideAllMainSections();

  const page = document.getElementById("transactionHistoryPage");
  const content = document.getElementById("transactionHistoryContent");

  if (!page || !content) {
    console.error("Transactions container missing in DOM");
    return;
  }

  page.classList.remove("hidden");
  history.pushState(null, "", "#teacher/transactions");
  renderTransactionHistory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTransactionsTableHTML() {
  let filtered = [...transactionsData];

  if (transactionState.searchQuery.trim()) {
    const q = (transactionState.searchQuery || "").toLowerCase().trim();
    filtered = filtered.filter(t => 
      (t.id || "").toLowerCase().includes(q) ||
      (t.invoiceNo || "").toLowerCase().includes(q) ||
      (t.studentName && t.studentName.toLowerCase().includes(q)) ||
      (t.studentEmail && t.studentEmail.toLowerCase().includes(q)) ||
      (t.bookName && t.bookName.toLowerCase().includes(q))
    );
  }

  if (transactionState.typeFilter !== "all") {
    filtered = filtered.filter(t => t.type === transactionState.typeFilter);
  }

  if (transactionState.statusFilter !== "all") {
    filtered = filtered.filter(t => t.status === transactionState.statusFilter);
  }

  if (transactionState.methodFilter !== "all") {
    filtered = filtered.filter(t => t.paymentMethod === transactionState.methodFilter);
  }

  if (transactionState.dateRange !== "all") {
    filtered = filtered.filter(t => isDateInFilter(t.date, transactionState.dateRange));
  }

  if (transactionState.bookFilter !== "all") {
    filtered = filtered.filter(t => t.bookId == transactionState.bookFilter);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / transactionState.pageSize) || 1;
  transactionState.currentPage = Math.min(transactionState.currentPage, totalPages);
  const startIndex = (transactionState.currentPage - 1) * transactionState.pageSize;
  const paginated = filtered.slice(startIndex, startIndex + transactionState.pageSize);

  if (paginated.length === 0) {
    return `<div style="padding:50px; text-align:center; color:#64748b; font-weight:600;">لا توجد معاملات مطابقة لخيارات البحث أو التصفية الحالية.</div>`;
  }

  return `
    <div class="rt-table-wrapper">
      <table class="rt-table">
        <thead>
          <tr>
            <th>معرف المعاملة</th>
            <th>رقم الفاتورة</th>
            <th>التاريخ والوقت</th>
            <th>الطالب</th>
            <th>البريد الإلكتروني</th>
            <th>المنتج / البيان</th>
            <th>النوع</th>
            <th>وسيلة الدفع</th>
            <th>السعر</th>
            <th>الخصم</th>
            <th>العمولة</th>
            <th>الضريبة</th>
            <th>صافي الإيراد</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${paginated.map(tx => `
            <tr style="cursor:pointer;" onclick="openTransactionDetailPage('${tx.id}')">
              <td style="font-weight:800; color:#6d28d9;">${tx.id}</td>
              <td style="font-size:13px; color:#475569;">${tx.invoiceNo}</td>
              <td style="font-size:12px; color:#64748b;">${new Date(tx.date).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</td>
              <td style="font-weight:700;">${escapeHtml(tx.studentName)}</td>
              <td style="font-size:12px; color:#64748b;">${escapeHtml(tx.studentEmail)}</td>
              <td style="font-weight:700; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${tx.productType ? `<span style="font-size:11px; padding:2px 6px; border-radius:4px; background:#f1f5f9; color:#475569; margin-left:4px;">${tx.productType === 'Course' ? 'دورة' : tx.productType === 'Book' ? 'كتاب' : 'نظام'}</span>` : ''}
                ${escapeHtml(tx.bookName)}
              </td>
              <td>
                <span class="rt-badge rt-op-${(tx.type || '').toLowerCase().replace(' ', '_')}">${getTypeLabelArabic(tx.type)}</span>
              </td>
              <td style="font-size:13px; font-weight:600;">${tx.paymentMethod}</td>
              <td style="font-weight:700;">$${tx.price}</td>
              <td style="color:#dc2626;">-$${tx.discount}</td>
              <td style="color:#64748b;">$${tx.platformFee}</td>
              <td style="color:#64748b;">$${tx.tax}</td>
              <td style="font-weight:900; color:${tx.netRevenue >= 0 ? '#15803d' : '#dc2626'}; font-size:15px;">
                $${tx.netRevenue}
              </td>
              <td>
                <span class="rt-badge rt-badge-${(tx.status || '').toLowerCase()}">${getStatusLabelArabic(tx.status)}</span>
              </td>
              <td onclick="event.stopPropagation();">
                <div style="display:flex; gap:6px;">
                  <button type="button" class="rt-btn rt-btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="openTransactionDetailPage('${tx.id}')">
                    👁️ تفاصيل
                  </button>
                  <button type="button" class="rt-btn rt-btn-pdf" style="padding:4px 8px; font-size:12px;" onclick="openInvoiceModal('${tx.id}')">
                    🧾 الفاتورة
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="rt-pagination">
      <div style="font-size:13px; color:#64748b;">
        عرض المعاملات من <b>${startIndex + 1}</b> إلى <b>${Math.min(startIndex + transactionState.pageSize, totalItems)}</b> من إجمالي <b>${totalItems}</b> معاملة
      </div>
      <div style="display:flex; gap:6px;">
        <button type="button" class="rt-page-btn" ${transactionState.currentPage === 1 ? 'disabled' : ''} onclick="changeTransactionPage(${transactionState.currentPage - 1})">← السابق</button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button type="button" class="rt-page-btn ${p === transactionState.currentPage ? 'active' : ''}" onclick="changeTransactionPage(${p})">${p}</button>
        `).join('')}
        <button type="button" class="rt-page-btn" ${transactionState.currentPage === totalPages ? 'disabled' : ''} onclick="changeTransactionPage(${transactionState.currentPage + 1})">التالي →</button>
      </div>
    </div>
  `;
}

export function renderTransactionHistory() {
  const content = document.getElementById("transactionHistoryContent");
  if (!content) return;

  const activeEl = document.activeElement;
  let activeInputId = null;
  let selStart = null;
  let selEnd = null;
  if (activeEl && (activeEl.id === "revenueSearchInput" || activeEl.id === "transactionSearchInput")) {
    activeInputId = activeEl.id;
    selStart = activeEl.selectionStart;
    selEnd = activeEl.selectionEnd;
  }

  content.innerHTML = `
    <div class="transactions-container">
      <!-- BREADCRUMB -->
      <div class="rt-breadcrumb">
        <a href="#teacher/dashboard" onclick="event.preventDefault(); window.location.hash='#teacher/dashboard'; if(window.showDashboard) window.showDashboard();">لوحة المعلم</a> &gt;
        <span>سجل المعاملات المالية الحية</span>
      </div>

      <!-- HEADER BANNER -->
      <div class="rt-header-banner">
        <div class="rt-header-info">
          <h1>🧾 سجل المعاملات والعمليات المالية</h1>
          <p>سجل شفاف يغطي جميع المشتريات، الاستردادات، العمولات، وسحوبات الأرباح</p>
        </div>

        <div class="rt-header-controls">
          <button type="button" class="rt-btn rt-btn-pdf" onclick="exportTransactionsPDF()">📄 PDF</button>
          <button type="button" class="rt-btn rt-btn-excel" onclick="exportTransactionsExcel()">📊 Excel</button>
          <button type="button" class="rt-btn rt-btn-csv" onclick="exportTransactionsCSV()">💾 CSV</button>
        </div>
      </div>

      <!-- SEARCH & FILTERS BAR -->
      <div class="rt-filter-bar">
        <input type="text" id="transactionSearchInput" class="rt-input" style="min-width:240px; flex:1;" placeholder="🔍 ابحث بالاسم، البريد، الفاتورة، أو رقم المعاملة..." value="${escapeHtml(transactionState.searchQuery)}" oninput="updateTransactionSearch(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();}" />

        <div class="rt-filter-group">
          <select class="rt-select" onchange="updateTransactionType(this.value)">
            <option value="all">كل أنواع العمليات</option>
            <option value="Purchase" ${transactionState.typeFilter === 'Purchase' ? 'selected' : ''}>شراء (Purchase)</option>
            <option value="Refund" ${transactionState.typeFilter === 'Refund' ? 'selected' : ''}>استرداد (Refund)</option>
            <option value="Withdrawal" ${transactionState.typeFilter === 'Withdrawal' ? 'selected' : ''}>سحب أرباح (Withdrawal)</option>
            <option value="Withdrawal Cancelled" ${transactionState.typeFilter === 'Withdrawal Cancelled' ? 'selected' : ''}>إلغاء سحب</option>
            <option value="Bonus" ${transactionState.typeFilter === 'Bonus' ? 'selected' : ''}>مكافأة (Bonus)</option>
          </select>

          <select class="rt-select" onchange="updateTransactionStatus(this.value)">
            <option value="all">كل الحالات</option>
            <option value="Completed" ${transactionState.statusFilter === 'Completed' ? 'selected' : ''}>مكتملة (Completed)</option>
            <option value="Pending" ${transactionState.statusFilter === 'Pending' ? 'selected' : ''}>معلقة (Pending)</option>
            <option value="Failed" ${transactionState.statusFilter === 'Failed' ? 'selected' : ''}>فاشلة (Failed)</option>
            <option value="Cancelled" ${transactionState.statusFilter === 'Cancelled' ? 'selected' : ''}>ملغاة (Cancelled)</option>
            <option value="Refunded" ${transactionState.statusFilter === 'Refunded' ? 'selected' : ''}>مستردة (Refunded)</option>
          </select>

          <select class="rt-select" onchange="updateTransactionMethod(this.value)">
            <option value="all">كل وسائل الدفع</option>
            <option value="Visa" ${transactionState.methodFilter === 'Visa' ? 'selected' : ''}>Visa</option>
            <option value="Mastercard" ${transactionState.methodFilter === 'Mastercard' ? 'selected' : ''}>Mastercard</option>
            <option value="PayPal" ${transactionState.methodFilter === 'PayPal' ? 'selected' : ''}>PayPal</option>
            <option value="Apple Pay" ${transactionState.methodFilter === 'Apple Pay' ? 'selected' : ''}>Apple Pay</option>
            <option value="Mada" ${transactionState.methodFilter === 'Mada' ? 'selected' : ''}>Mada</option>
          </select>

          <select class="rt-select" onchange="updateTransactionDateRange(this.value)">
            <option value="all" ${transactionState.dateRange === 'all' ? 'selected' : ''}>كل الفترات</option>
            <option value="today" ${transactionState.dateRange === 'today' ? 'selected' : ''}>اليوم</option>
            <option value="week" ${transactionState.dateRange === 'week' ? 'selected' : ''}>آخر 7 أيام</option>
            <option value="month" ${transactionState.dateRange === 'month' ? 'selected' : ''}>هذا الشهر</option>
            <option value="year" ${transactionState.dateRange === 'year' ? 'selected' : ''}>هذه السنة</option>
          </select>
        </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="rt-table-card" id="transactionsTableCard">
        ${renderTransactionsTableHTML()}
      </div>
    </div>
  `;

  if (activeInputId) {
    const restoredEl = document.getElementById(activeInputId);
    if (restoredEl) {
      restoredEl.focus();
      if (selStart !== null && selEnd !== null) {
        try { restoredEl.setSelectionRange(selStart, selEnd); } catch (e) {}
      }
    }
  }
}

export function updateTransactionSearch(val) {
  transactionState.searchQuery = val;
  transactionState.currentPage = 1;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function updateTransactionType(val) {
  transactionState.typeFilter = val;
  transactionState.currentPage = 1;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function updateTransactionStatus(val) {
  transactionState.statusFilter = val;
  transactionState.currentPage = 1;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function updateTransactionMethod(val) {
  transactionState.methodFilter = val;
  transactionState.currentPage = 1;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function updateTransactionDateRange(val) {
  transactionState.dateRange = val;
  transactionState.currentPage = 1;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function updateTransactionBook(val) {
  transactionState.bookFilter = val;
  transactionState.currentPage = 1;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function changeTransactionPage(p) {
  transactionState.currentPage = p;
  const tableCard = document.getElementById("transactionsTableCard");
  if (tableCard) {
    tableCard.innerHTML = renderTransactionsTableHTML();
  } else {
    renderTransactionHistory();
  }
}

export function getFilteredTransactionsList() {
  let filtered = [...transactionsData];

  if (transactionState.searchQuery.trim()) {
    const q = (transactionState.searchQuery || "").toLowerCase().trim();
    filtered = filtered.filter(t => 
      (t.id || "").toLowerCase().includes(q) ||
      (t.invoiceNo || "").toLowerCase().includes(q) ||
      (t.studentName && t.studentName.toLowerCase().includes(q)) ||
      (t.studentEmail && t.studentEmail.toLowerCase().includes(q)) ||
      (t.bookName && t.bookName.toLowerCase().includes(q))
    );
  }

  if (transactionState.typeFilter !== "all") {
    filtered = filtered.filter(t => t.type === transactionState.typeFilter);
  }

  if (transactionState.statusFilter !== "all") {
    filtered = filtered.filter(t => t.status === transactionState.statusFilter);
  }

  if (transactionState.methodFilter !== "all") {
    filtered = filtered.filter(t => t.paymentMethod === transactionState.methodFilter);
  }

  if (transactionState.dateRange !== "all") {
    filtered = filtered.filter(t => isDateInFilter(t.date, transactionState.dateRange));
  }

  if (transactionState.bookFilter !== "all") {
    filtered = filtered.filter(t => t.bookId == transactionState.bookFilter);
  }

  return filtered;
}

export function getFilterSummaryText() {
  const parts = [];
  if (transactionState.searchQuery.trim()) parts.push(`البحث: "${transactionState.searchQuery.trim()}"`);
  if (transactionState.typeFilter !== "all") parts.push(`النوع: ${getTypeLabelArabic(transactionState.typeFilter)}`);
  if (transactionState.statusFilter !== "all") parts.push(`الحالة: ${getStatusLabelArabic(transactionState.statusFilter)}`);
  if (transactionState.methodFilter !== "all") parts.push(`الدفع: ${transactionState.methodFilter}`);
  if (transactionState.dateRange !== "all") parts.push(`الفترة: ${transactionState.dateRange}`);
  if (transactionState.bookFilter !== "all") parts.push(`المنتج: #${transactionState.bookFilter}`);
  return parts.length > 0 ? parts.join(" | ") : "جميع المعاملات المالية (الكل)";
}

export function exportTransactionsPDF() {
  const filtered = getFilteredTransactionsList();
  const summary = getFilterSummaryText();
  exportTransactionsPDFReport(filtered, summary);
}

export function exportTransactionsExcel() {
  let csvContent = "\uFEFFTransaction ID,Invoice No,Date,Student Name,Student Email,Product Name,Product Type,Type,Payment Method,Price,Discount,Platform Fee,Tax,Net Revenue,Status\n";
  transactionsData.forEach(t => {
    csvContent += `"${t.id}","${t.invoiceNo}","${t.date}","${t.studentName}","${t.studentEmail}","${t.bookName}","${t.productType || 'N/A'}","${t.type}","${t.paymentMethod}","${t.price}","${t.discount}","${t.platformFee}","${t.tax}","${t.netRevenue}","${t.status}"\n`;
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `transaction_history_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showCustomAlert("تم تصدير سجل المعاملات إلى ملف Excel/CSV بنجاح!");
}

export function exportTransactionsCSV() {
  exportTransactionsExcel();
}

/* ==========================================================================
   FULL PAGE TRANSACTION DETAIL VIEW
   ========================================================================== */

export function openTransactionDetailPage(txId) {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين والمالك فقط.");
    return;
  }

  const tx = transactionsData.find(t => t.id === txId || t.id === `TXN-${txId}`);
  if (!tx) {
    showCustomAlert("المعاملة المطلوبة غير موجودة.");
    return;
  }

  hideAllMainSections();

  const page = document.getElementById("transactionDetailPage");
  const content = document.getElementById("transactionDetailContent");

  if (!page || !content) {
    console.error("Transaction detail container missing in DOM");
    return;
  }

  page.classList.remove("hidden");
  history.pushState(null, "", `#teacher/transactions/detail?id=${tx.id}`);
  
  content.innerHTML = `
    <div class="rt-detail-container">
      <div class="rt-breadcrumb">
        <a href="#teacher/transactions" onclick="event.preventDefault(); openTransactionHistory();">سجل المعاملات</a> &gt;
        <span>تفاصيل المعاملة #${tx.id}</span>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
        <button type="button" class="rt-btn rt-btn-secondary" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else openTransactionHistory();">
          ← العودة لسجل المعاملات
        </button>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" class="rt-btn rt-btn-pdf" onclick="openInvoiceModal('${tx.id}')">
            🖨️ طباعة ومعاينة الفاتورة (PDF)
          </button>
          <button type="button" class="rt-btn rt-btn-primary" style="background: linear-gradient(135deg, #059669, #047857); border: none;" onclick="downloadInvoicePDFDocument(transactionsData.find(t => t.id === '${tx.id}'))">
            💾 تنزيل الفاتورة المعتمدة (PDF)
          </button>
        </div>
      </div>

      <div class="rt-detail-card">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:16px; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="margin:0 0 6px 0; font-size:24px; font-weight:800; color:#0f172a;">تفاصيل الفاتورة المعاملة المالية #${tx.id}</h2>
            <span style="font-size:14px; color:#64748b;">رقم مرجع الفاتورة: <b>${tx.invoiceNo}</b></span>
          </div>

          <div>
            <span class="rt-badge rt-badge-${(tx.status || '').toLowerCase()}" style="font-size:14px; padding:6px 16px;">
              ${getStatusLabelArabic(tx.status)}
            </span>
          </div>
        </div>

        <div class="rt-detail-grid">
          <div class="rt-detail-item">
            <label>معرف المعاملة (Transaction ID)</label>
            <val>${tx.id}</val>
          </div>

          <div class="rt-detail-item">
            <label>رقم الفاتورة المرجعي (Invoice No)</label>
            <val>${tx.invoiceNo}</val>
          </div>

          <div class="rt-detail-item">
            <label>التاريخ والوقت</label>
            <val>${new Date(tx.date).toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" })}</val>
          </div>

          <div class="rt-detail-item">
            <label>نوع العملية (Operation Type)</label>
            <val><span class="rt-badge rt-op-${(tx.type || '').toLowerCase().replace(' ', '_')}">${getTypeLabelArabic(tx.type)}</span></val>
          </div>

          <div class="rt-detail-item">
            <label>وسيلة الدفع المستخدمة</label>
            <val>${tx.paymentMethod}</val>
          </div>

          <div class="rt-detail-item">
            <label>الدولة / المنطقة</label>
            <val>${tx.country || 'غير محدد'}</val>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-top:24px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px;">
            <h4 style="margin:0 0 12px 0; color:#475569; font-size:14px; text-transform:uppercase;">👤 بيانات القارئ / الطالب</h4>
            <div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px;">${escapeHtml(tx.studentName)}</div>
            <div style="font-size:14px; color:#6d28d9; font-weight:600; margin-bottom:8px;">${escapeHtml(tx.studentEmail)}</div>
            <div style="font-size:12px; color:#64748b;">الحساب: طالب مسجل مفعل</div>
          </div>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px; display:flex; gap:16px;">
            <img src="${tx.bookImage}" style="width:60px; height:80px; object-fit:cover; border-radius:8px;" />
            <div>
              <h4 style="margin:0 0 4px 0; color:#475569; font-size:12px; text-transform:uppercase;">🎓 / 📚 المنتج موضوع المعاملة</h4>
              <div style="font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px;">${escapeHtml(tx.bookName)}</div>
              <div style="font-size:13px; color:#64748b;">السعر المعلن: <b>$${tx.price}</b></div>
            </div>
          </div>
        </div>

        <div class="rt-financial-breakdown">
          <h3 style="margin:0 0 16px 0; font-size:18px; font-weight:800; color:#4c1d95;">💵 التفصيل المالي وتوزيع المبالغ</h3>

          <div class="rt-breakdown-row">
            <span>السعر الأساسي للمنتج (Gross Price):</span>
            <b>$${tx.price}</b>
          </div>

          <div class="rt-breakdown-row">
            <span>الخصم المطبق (Discount):</span>
            <span style="color:#dc2626;">-$${tx.discount}</span>
          </div>

          <div class="rt-breakdown-row">
            <span>المبلغ الإجمالي المسدد (Paid Amount):</span>
            <b>$${tx.price - tx.discount}</b>
          </div>

          <div class="rt-breakdown-row">
            <span>عمولة المنصة التشغيلية (Platform Commission - 10%):</span>
            <span style="color:#64748b;">-$${tx.platformFee}</span>
          </div>

          <div class="rt-breakdown-row">
            <span>الضريبة المضافة (Tax - 5%):</span>
            <span style="color:#64748b;">-$${tx.tax}</span>
          </div>

          <div class="rt-breakdown-row total">
            <span>صافي المستحق للمعلم (Net Revenue):</span>
            <span>$${tx.netRevenue}</span>
          </div>
        </div>

        <div style="margin-top:24px; padding:16px; background:#f1f5f9; border-radius:12px; font-size:13px; color:#475569;">
          <strong>📝 ملاحظات وسجل النظام:</strong> ${escapeHtml(tx.notes || 'لا توجد ملاحظات إضافية.')}
        </div>
      </div>
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getTypeLabelArabic(type) {
  const map = {
    "Purchase": "شراء",
    "Refund": "استرداد",
    "Withdrawal": "سحب أرباح",
    "Withdrawal Cancelled": "إلغاء سحب",
    "Platform Fee": "عمولة منصة",
    "Coupon": "كوبون",
    "Bonus": "مكافأة",
    "Balance Adjustment": "تعديل رصيد",
    "Tax": "خصم ضريبي"
  };
  return map[type] || type;
}

function getStatusLabelArabic(status) {
  const map = {
    "Completed": "مكتملة",
    "Pending": "معلقة",
    "Failed": "فاشلة",
    "Cancelled": "ملغاة",
    "Refunded": "مستردة"
  };
  return map[status] || status;
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

// Bind handlers to window object for inline triggers
window.openRevenueDashboard = openRevenueDashboard;
window.renderRevenueDashboard = renderRevenueDashboard;
window.changeRevenueCurrency = changeRevenueCurrency;
window.changeRevenueProductType = changeRevenueProductType;
window.changeRevenueDateRange = changeRevenueDateRange;
window.updateRevenueCustomDate = updateRevenueCustomDate;
window.updateRevenueSearch = updateRevenueSearch;
window.updateRevenueCategory = updateRevenueCategory;
window.updateRevenueSort = updateRevenueSort;
window.changeRevenuePage = changeRevenuePage;
window.exportRevenuePDF = exportRevenuePDF;
window.exportRevenueExcel = exportRevenueExcel;
window.exportRevenueCSV = exportRevenueCSV;
window.retryRevenueLoad = retryRevenueLoad;

window.openTransactionHistory = openTransactionHistory;
window.renderTransactionHistory = renderTransactionHistory;
window.updateTransactionSearch = updateTransactionSearch;
window.updateTransactionType = updateTransactionType;
window.updateTransactionStatus = updateTransactionStatus;
window.updateTransactionMethod = updateTransactionMethod;
window.updateTransactionDateRange = updateTransactionDateRange;
window.updateTransactionBook = updateTransactionBook;
window.changeTransactionPage = changeTransactionPage;
window.exportTransactionsPDF = exportTransactionsPDF;
window.exportTransactionsExcel = exportTransactionsExcel;
window.exportTransactionsCSV = exportTransactionsCSV;

window.openTransactionDetailPage = openTransactionDetailPage;
window.openInvoiceModal = openInvoiceModal;
window.downloadInvoicePDFDocument = downloadInvoicePDFDocument;
window.printInvoiceDocument = printInvoiceDocument;
