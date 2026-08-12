// Service Engine for Withdrawals & Payouts Center (Egyptian Mobile Wallets)
import {
  getPayoutsSummary,
  getOwnerPayoutsSummary,
  getTeacherWallets,
  saveTeacherWallets,
  getPayoutRequests,
  savePayoutRequests,
  ALLOWED_WALLETS,
  validateEgyptianMobileWallet
} from "../data/payoutsData.js";

import { hideAllMainSections } from "./layoutService.js";
import { showCustomAlert } from "../utils/helpers.js";
import html2pdf from "html2pdf.js";

// History Filters State
let historySearch = "";
let historyStatusFilter = "all";
let historyWalletFilter = "all";

/**
 * 1. Open Payouts Main Dashboard (/teacher/payouts)
 */
export function openPayoutsDashboard() {
  hideAllMainSections();
  const page = document.getElementById("payoutsDashboardPage");
  if (page) page.classList.remove("hidden");
  window.scrollTo(0, 0);
  window.location.hash = "#teacher/payouts";

  renderPayoutsDashboard();
}

/**
 * 2. Open My Wallet Page (/teacher/payouts/wallet)
 */
export function openPayoutsWallet() {
  hideAllMainSections();
  const page = document.getElementById("payoutsWalletPage");
  if (page) page.classList.remove("hidden");
  window.scrollTo(0, 0);
  window.location.hash = "#teacher/payouts/wallet";

  renderPayoutsWallet();
}

/**
 * 3. Open New Withdrawal Request Page (/teacher/payouts/request)
 */
export function openPayoutsRequest() {
  hideAllMainSections();
  const page = document.getElementById("payoutsRequestPage");
  if (page) page.classList.remove("hidden");
  window.scrollTo(0, 0);
  window.location.hash = "#teacher/payouts/request";

  renderPayoutsRequest();
}

/**
 * 4. Open Withdrawal History Page (/teacher/payouts/history)
 */
export function openPayoutsHistory() {
  hideAllMainSections();
  const page = document.getElementById("payoutsHistoryPage");
  if (page) page.classList.remove("hidden");
  window.scrollTo(0, 0);
  window.location.hash = "#teacher/payouts/history";

  renderPayoutsHistory(true);
}

/**
 * 5. Open Withdrawal Details Page (/teacher/payouts/details/:id)
 */
export function openPayoutsDetails(requestId) {
  hideAllMainSections();
  const page = document.getElementById("payoutsDetailsPage");
  if (page) page.classList.remove("hidden");
  window.scrollTo(0, 0);
  window.location.hash = `#teacher/payouts/details/${requestId}`;

  renderPayoutsDetails(requestId);
}

/* =========================================================
   RENDER FUNCTIONS
   ========================================================= */

let ownerSearchQuery = "";
let ownerStatusFilter = "all";

function renderPayoutsDashboard() {
  const container = document.getElementById("payoutsDashboardContent");
  if (!container) return;

  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  if (isOwnerUser) {
    renderOwnerPayoutsDashboard(container);
  } else {
    renderTeacherPayoutsDashboard(container);
  }
}

function renderTeacherPayoutsDashboard(container) {
  const summary = getPayoutsSummary();
  const payouts = getPayoutRequests();

  container.innerHTML = `
    <div class="po-container">
      <!-- HEADER -->
      <div class="po-header">
        <div class="po-title-group">
          <h1>💰 المستحقات والسحب المالي <span style="font-size: 13px; background: #10b981; color: #fff; padding: 3px 10px; border-radius: 20px; font-weight: 700;">محافظ إلكترونية مصرية</span></h1>
          <div class="po-breadcrumb">
            <span>لوحة المعلم</span>
            <span class="sep">‹</span>
            <span style="color: #10b981; font-weight: 700;">المستحقات والسحب</span>
          </div>
        </div>

        <div class="po-actions">
          <button type="button" class="po-btn po-btn-outline" onclick="window.toggleUserRoleForTesting()">
            👑 عاين كمالك المنصة
          </button>
          <button type="button" class="po-btn po-btn-outline" onclick="window.openPayoutsWallet()">
            📱 إشعار وتعديل المحفظة
          </button>
          <button type="button" class="po-btn po-btn-outline" onclick="window.openPayoutsHistory()">
            📜 سجل السحوبات
          </button>
          <button type="button" class="po-btn po-btn-primary" onclick="window.openPayoutsRequest()">
            💸 طلب سحب جديد
          </button>
        </div>
      </div>

      <!-- EGYPTIAN WALLETS NOTICE BANNER -->
      <div class="po-wallet-notice-card">
        <div>
          <div class="po-wallet-notice-title" style="font-size: 18px; font-weight: 900; margin-bottom: 6px;">
            🇪🇬 الدعم المعتمد: المحافظ الإلكترونية للهواتف المحمولة في مصر فقط
          </div>
          <div class="po-wallet-notice-sub" style="font-size: 13px; opacity: 0.9;">
            يتم تحويل الأرباح والمستحقات مباشرة وحصرياً إلى رقمك المسجل في إحدى الشبكات المصرية فور الموافقة على الطلب خلال 24-48 ساعة.
          </div>
        </div>
        <div class="po-wallet-brands">
          <span class="po-brand-chip">🔴 فودافون كاش</span>
          <span class="po-brand-chip">🟠 أورنج كاش</span>
          <span class="po-brand-chip">🟢 اتصالات كاش</span>
          <span class="po-brand-chip">💜 وي باي (WE Pay)</span>
        </div>
      </div>

      <!-- METRICS GRID -->
      <div class="po-metrics-grid">
        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">الرصيد المتاح للسحب</span>
            <div class="po-metric-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">💵</div>
          </div>
          <div class="po-metric-value" style="color: #10b981;">${summary.availableBalance.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">الحد الأدنى للسحب: ${summary.minWithdrawal} ج.م</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">رصيد قيد المراجعة</span>
            <div class="po-metric-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">⏳</div>
          </div>
          <div class="po-metric-value" style="color: #f59e0b;">${summary.pendingBalance.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">عدد الطلبات النشطة: ${summary.pendingRequestsCount} طلب</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">إجمالي الأرباح المحققة</span>
            <div class="po-metric-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">📈</div>
          </div>
          <div class="po-metric-value">${summary.totalEarnings.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">عبر منصة StudyMart</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">إجمالي المسحوبات المكتملة</span>
            <div class="po-metric-icon" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9;">🏦</div>
          </div>
          <div class="po-metric-value">${summary.totalWithdrawn.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">حولات ناجحة على المحفظة</div>
        </div>
      </div>

      <!-- ACTIVE WALLET & QUICK ACTIONS ROW -->
      <div class="po-two-col-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px;">
        <!-- DEFAULT WALLET CARD -->
        <div class="po-card" style="margin-bottom: 0;">
          <div class="po-card-title">
            <span>📱 المحفظة الافتراضية للسحب</span>
            <button type="button" class="po-btn po-btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="window.openPayoutsWallet()">
              تغيير أو إضافة محفظة
            </button>
          </div>

          ${
            summary.defaultWallet
              ? `<div class="po-wallet-card-inner" style="background: var(--card-header-bg, #f8fafc); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                  <div>
                    <div style="font-size: 16px; font-weight: 800; color: #10b981; margin-bottom: 4px;">
                      ${getWalletIcon(summary.defaultWallet.walletType)} ${summary.defaultWallet.walletTypeName}
                    </div>
                    <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px;" dir="ltr">
                      ${summary.defaultWallet.number}
                    </div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                      صاحب المحفظة: <strong>${summary.defaultWallet.ownerName}</strong>
                    </div>
                  </div>
                  <span class="po-wallet-verified-badge">
                    ✓ موثقة وافتراضية
                  </span>
                </div>`
              : `<div style="text-align: center; padding: 20px; color: #ef4444; font-weight: 700;">
                  لم تقم بإضافة محفظة إلكترونية بعد! يرجى إضافة محفظة لتتمكن من السحب.
                  <div style="margin-top: 10px;">
                    <button type="button" class="po-btn po-btn-primary" onclick="window.openPayoutsWallet()">➕ إضافة محفظة الآن</button>
                  </div>
                </div>`
          }
        </div>

        <!-- QUICK WITHDRAWAL CTA -->
        <div class="po-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
          <div class="po-card-title">⚡ السحب السريع</div>
          <div style="font-size: 14px; color: #64748b; line-height: 1.6;">
            يمكنك طلب سحب أرباحك في أي وقت طالما يتجاوز رصيدك المتاح <strong>${summary.minWithdrawal} ج.م</strong>.
            يتم تحويل الأرباح مباشرة عبر شبكات المحافظ الرقمية في مصر دون أي عمولات إضافية.
          </div>
          <div style="margin-top: 16px;">
            <button type="button" class="po-btn po-btn-primary" style="width: 100%; justify-content: center; padding: 12px;" onclick="window.openPayoutsRequest()">
              🚀 تقديم طلب سحب جديد الآن
            </button>
          </div>
        </div>
      </div>

      <!-- RECENT WITHDRAWAL REQUESTS TABLE -->
      <div class="po-card">
        <div class="po-card-title">
          <span>📜 أحدث طلبات السحب</span>
          <button type="button" class="po-btn po-btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="window.openPayoutsHistory()">
            عرض كافة السحوبات ↗
          </button>
        </div>

        <div class="po-table-container">
          <table class="po-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المحفظة</th>
                <th>المبلغ المطلوب</th>
                <th>العمولة</th>
                <th>الصافي</th>
                <th>الحالة</th>
                <th>تاريخ الطلب</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${
                payouts.length === 0
                  ? `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">لا توجد طلبات سحب سابقة</td></tr>`
                  : payouts.slice(0, 5).map((p) => renderPayoutRow(p)).join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderOwnerPayoutsDashboard(container) {
  const summary = getOwnerPayoutsSummary();
  const payouts = getPayoutRequests();

  const filteredPayouts = payouts.filter((p) => {
    if (ownerStatusFilter !== "all" && p.status !== ownerStatusFilter) return false;
    if (ownerSearchQuery) {
      const q = ownerSearchQuery.toLowerCase().trim();
      const matchId = (p.id || "").toLowerCase().includes(q);
      const matchTxn = (p.transactionNo || "").toLowerCase().includes(q);
      const matchTeacher = (p.teacherName || "").toLowerCase().includes(q);
      const matchTeacherId = (p.teacherId || "").toLowerCase().includes(q);
      const matchTeacherEmail = (p.teacherEmail || "").toLowerCase().includes(q);
      const matchOwner = (p.walletOwner || "").toLowerCase().includes(q);
      const matchPhone = (p.walletNumber || "").toLowerCase().includes(q);
      const matchType = (p.walletTypeName || "").toLowerCase().includes(q);
      const matchTypeCode = (p.walletType || "").toLowerCase().includes(q);
      const matchNotes = (p.notes || "").toLowerCase().includes(q);
      if (!matchId && !matchTxn && !matchTeacher && !matchTeacherId && !matchTeacherEmail && !matchOwner && !matchPhone && !matchType && !matchTypeCode && !matchNotes) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="po-container">
      <!-- OWNER HEADER -->
      <div class="po-header">
        <div class="po-title-group">
          <h1>👑 إدارة المستحقات والسحوبات المالية <span style="font-size: 13px; background: #6366f1; color: #fff; padding: 3px 10px; border-radius: 20px; font-weight: 700;">مالك المنصة</span></h1>
          <div class="po-breadcrumb">
            <span>لوحة المالك</span>
            <span class="sep">‹</span>
            <span style="color: #6366f1; font-weight: 700;">الإدارة المالية والتسويات النقدية</span>
          </div>
        </div>

        <div class="po-actions">
          <button type="button" class="po-btn po-btn-outline" onclick="window.exportPayoutsPDF()">
            📄 تصدير تقرير PDF
          </button>
          <button type="button" class="po-btn po-btn-primary" onclick="window.openPayoutsHistory()">
            📜 سجل السحوبات الكامل
          </button>
        </div>
      </div>

      <!-- ROLE ACTIVE NOTICE BANNER -->
      <div class="po-wallet-notice-card" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-color: #4338ca;">
        <div>
          <div class="po-wallet-notice-title" style="font-size: 18px; font-weight: 900; margin-bottom: 6px; color: #ffffff;">
            🏛️ التحكم المالي المركزي لمالك منصة StudyMart
          </div>
          <div class="po-wallet-notice-sub" style="font-size: 13px; color: #e2e8f0; line-height: 1.6;">
            بصفتك مالك المنصة، يمكنك التحكم الكامل بكافة العمليات والطلبات المالية المقدمة من المعلمين: المراجعة، الموافقة، الرفض مع توضيح السبب، وتأكيد التحويل على شبكات المحافظ الرقمية في مصر.
          </div>
        </div>
        <div class="po-wallet-brands">
          <span class="po-brand-chip" style="background: rgba(255,255,255,0.15); color: #fff;">👥 المعلمين النشطين: ${summary.activeTeachersCount}</span>
          <span class="po-brand-chip" style="background: rgba(16, 185, 129, 0.25); color: #34d399;">⚡ الطلبات النشطة: ${summary.activeActionableRequestsCount}</span>
        </div>
      </div>

      <!-- 11 OWNER FINANCIAL METRICS GRID -->
      <div class="po-metrics-grid" style="grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">1. إجمالي إيرادات المنصة</span>
            <div class="po-metric-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">💰</div>
          </div>
          <div class="po-metric-value">${summary.grossRevenue.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">إجمالي مبيعات الدورات والكتب</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">2. عمولة المنصة الصافية (10%)</span>
            <div class="po-metric-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">🏛️</div>
          </div>
          <div class="po-metric-value" style="color: #10b981;">${summary.platformFeeShare.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">حصة المنصة من الإيرادات الكلية</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">3. مستحقات المعلمين (90%)</span>
            <div class="po-metric-icon" style="background: rgba(14, 165, 233, 0.1); color: #0ea5e9;">👨‍🏫</div>
          </div>
          <div class="po-metric-value">${summary.teacherGrossEarnings.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">إجمالي أرباح المستحقين</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">4. المسحوبات المدفوعة</span>
            <div class="po-metric-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">✅</div>
          </div>
          <div class="po-metric-value" style="color: #10b981;">${summary.totalPaid.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">تم تحويلها للمحافظ بالفعل</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">5. الطلبات قيد الانتظار</span>
            <div class="po-metric-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">⏳</div>
          </div>
          <div class="po-metric-value" style="color: #f59e0b;">${summary.totalPending.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">تنتظر المراجعة والاعتماد</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">6. المقبولة قيد التحويل</span>
            <div class="po-metric-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">👍</div>
          </div>
          <div class="po-metric-value" style="color: #6366f1;">${summary.totalApproved.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">مقبولة بانتظار ضخ السيولة</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">7. الطلبات المرفوضة</span>
            <div class="po-metric-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">❌</div>
          </div>
          <div class="po-metric-value" style="color: #ef4444;">${summary.totalRejected.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">مرفوضة مع تسجيل السبب</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">8. الطلبات الملغاة</span>
            <div class="po-metric-icon" style="background: rgba(100, 116, 139, 0.1); color: #64748b;">🚫</div>
          </div>
          <div class="po-metric-value" style="color: #64748b;">${summary.totalCancelled.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">ألغاها المعلم قبل التنفيذ</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">9. احتياطي وسيولة الخزينة</span>
            <div class="po-metric-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">🏦</div>
          </div>
          <div class="po-metric-value" style="color: #10b981;">${summary.treasuryReserves.toLocaleString()} ج.م</div>
          <div class="po-metric-sub">سيولة المنصة المتبقية بالخزينة</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">10. المعلمون المعتمدون</span>
            <div class="po-metric-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">👨‍🏫</div>
          </div>
          <div class="po-metric-value">${summary.activeTeachersCount} معلم</div>
          <div class="po-metric-sub">معلمون مسجلون لديهم محفظة</div>
        </div>

        <div class="po-metric-card">
          <div class="po-metric-top">
            <span class="po-metric-label">11. الطلبات المعلقة للقرار</span>
            <div class="po-metric-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">⚡</div>
          </div>
          <div class="po-metric-value" style="color: #f59e0b;">${summary.activeActionableRequestsCount} طلب</div>
          <div class="po-metric-sub">تتطلب قرار مالك المنصة</div>
        </div>
      </div>

      <!-- FILTER TOOLBAR & WITHDRAWAL REQUESTS TABLE -->
      <div class="po-card">
        <div class="po-card-title" style="flex-wrap: wrap; gap: 12px; justify-content: space-between;">
          <span id="ownerPayoutsCountBadge">📋 جدول إدارة طلبات السحب والمستحقات (${filteredPayouts.length})</span>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input
              type="text"
              id="ownerPayoutsSearchInput"
              class="po-input"
              style="width: 260px; padding: 6px 12px; font-size: 13px;"
              placeholder="🔍 بحث باسم المعلم، المحفظة، رقم الطلب..."
              value="${ownerSearchQuery}"
              oninput="window.handleOwnerSearch(this.value)"
            />
            <select
              id="ownerPayoutsStatusSelect"
              class="po-select"
              style="padding: 6px 12px; font-size: 13px; width: auto;"
              onchange="window.handleOwnerStatusFilter(this.value)"
            >
              <option value="all" ${ownerStatusFilter === "all" ? "selected" : ""}>جميع الحالات</option>
              <option value="Pending" ${ownerStatusFilter === "Pending" ? "selected" : ""}>⏳ قيد الانتظار</option>
              <option value="Approved" ${ownerStatusFilter === "Approved" ? "selected" : ""}>👍 مقبول (قيد التحويل)</option>
              <option value="Paid" ${ownerStatusFilter === "Paid" ? "selected" : ""}>✅ مدفوع وتم التحويل</option>
              <option value="Rejected" ${ownerStatusFilter === "Rejected" ? "selected" : ""}>❌ مرفوض</option>
              <option value="Cancelled" ${ownerStatusFilter === "Cancelled" ? "selected" : ""}>🚫 ملغي</option>
            </select>
          </div>
        </div>

        <div class="po-table-container">
          <table class="po-table">
            <thead>
              <tr>
                <th>رقم الطلب والمعاملة</th>
                <th>المعلم المستفيد</th>
                <th>المحفظة الإلكترونية</th>
                <th>المبلغ المطلوب</th>
                <th>الصافي</th>
                <th>الحالة الحالية</th>
                <th>تاريخ الطلب</th>
                <th>قرارات وإجراءات المالك</th>
              </tr>
            </thead>
            <tbody id="ownerPayoutsTableBody">
              ${
                filteredPayouts.length === 0
                  ? `<tr><td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">لا توجد طلبات سحب تنطبق عليها معايير البحث والفلترة</td></tr>`
                  : filteredPayouts.map((p) => renderOwnerPayoutRow(p)).join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderOwnerPayoutRow(p) {
  const isPending = p.status === "Pending" || p.status === "Under Review";
  const isApproved = p.status === "Approved";
  const isPaid = p.status === "Paid";

  return `
    <tr>
      <td>
        <strong dir="ltr" style="font-family: monospace; font-size: 13px;">${p.id}</strong>
        <div style="font-size: 11px; color: #64748b;" dir="ltr">${p.transactionNo || "—"}</div>
      </td>
      <td>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${p.teacherName || p.walletOwner || "د. أحمد محمود"}</div>
        <div style="font-size: 11px; color: #64748b;">معلم معتمد • ${p.teacherId || "TCH-101"}</div>
      </td>
      <td>
        <div style="font-size: 13px; font-weight: 700;">
          ${getWalletIcon(p.walletType)} ${p.walletTypeName}
        </div>
        <div style="font-size: 12px; font-weight: 800; color: #475569;" dir="ltr">
          ${p.walletNumber}
        </div>
        <div style="font-size: 10px; color: #94a3b8;">صاحب المحفظة: ${p.walletOwner}</div>
      </td>
      <td>
        <div style="font-size: 14px; font-weight: 800;">${(p.amount || 0).toLocaleString()} ج.م</div>
      </td>
      <td>
        <div style="font-size: 14px; font-weight: 900; color: #10b981;">${(p.netAmount || p.amount || 0).toLocaleString()} ج.م</div>
      </td>
      <td>
        ${renderStatusBadge(p.status)}
      </td>
      <td>
        <div style="font-size: 12px; color: #64748b;">${formatDateShort(p.createdDate)}</div>
      </td>
      <td>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          ${
            isPending
              ? `<button type="button" class="po-btn po-btn-primary" style="padding: 4px 8px; font-size: 11px; background: #4f46e5;" onclick="window.approveWithdrawalRequest('${p.id}')">👍 موافقة</button>`
              : ""
          }
          ${
            isApproved || isPending
              ? `<button type="button" class="po-btn po-btn-primary" style="padding: 4px 8px; font-size: 11px; background: #059669;" onclick="window.markWithdrawalAsPaid('${p.id}')">✅ تحويل</button>`
              : ""
          }
          ${
            !isPaid && p.status !== "Rejected" && p.status !== "Cancelled"
              ? `<button type="button" class="po-btn po-btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="window.rejectWithdrawalRequest('${p.id}')">❌ رفض</button>`
              : ""
          }
          <button type="button" class="po-btn po-btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.openPayoutsDetails('${p.id}')">👁️ التفاصيل</button>
        </div>
      </td>
    </tr>
  `;
}

function updateOwnerPayoutsTableOnly() {
  const payouts = getPayoutRequests();
  const filteredPayouts = payouts.filter((p) => {
    if (ownerStatusFilter !== "all" && p.status !== ownerStatusFilter) return false;
    if (ownerSearchQuery) {
      const q = ownerSearchQuery.toLowerCase().trim();
      const matchId = (p.id || "").toLowerCase().includes(q);
      const matchTxn = (p.transactionNo || "").toLowerCase().includes(q);
      const matchTeacher = (p.teacherName || "").toLowerCase().includes(q);
      const matchTeacherId = (p.teacherId || "").toLowerCase().includes(q);
      const matchTeacherEmail = (p.teacherEmail || "").toLowerCase().includes(q);
      const matchOwner = (p.walletOwner || "").toLowerCase().includes(q);
      const matchPhone = (p.walletNumber || "").toLowerCase().includes(q);
      const matchType = (p.walletTypeName || "").toLowerCase().includes(q);
      const matchTypeCode = (p.walletType || "").toLowerCase().includes(q);
      const matchNotes = (p.notes || "").toLowerCase().includes(q);
      if (!matchId && !matchTxn && !matchTeacher && !matchTeacherId && !matchTeacherEmail && !matchOwner && !matchPhone && !matchType && !matchTypeCode && !matchNotes) return false;
    }
    return true;
  });

  const tbody = document.getElementById("ownerPayoutsTableBody");
  if (tbody) {
    tbody.innerHTML =
      filteredPayouts.length === 0
        ? `<tr><td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">لا توجد طلبات سحب تنطبق عليها معايير البحث والفلترة</td></tr>`
        : filteredPayouts.map((p) => renderOwnerPayoutRow(p)).join("");
  }

  const countBadge = document.getElementById("ownerPayoutsCountBadge");
  if (countBadge) {
    countBadge.textContent = `📋 جدول إدارة طلبات السحب والمستحقات (${filteredPayouts.length})`;
  }
}

window.handleOwnerSearch = function (val) {
  ownerSearchQuery = val || "";
  const tbody = document.getElementById("ownerPayoutsTableBody");
  if (tbody) {
    updateOwnerPayoutsTableOnly();
  } else {
    renderPayoutsDashboard();
  }
};

window.handleOwnerStatusFilter = function (val) {
  ownerStatusFilter = val || "all";
  const tbody = document.getElementById("ownerPayoutsTableBody");
  if (tbody) {
    updateOwnerPayoutsTableOnly();
  } else {
    renderPayoutsDashboard();
  }
};

window.exportPayoutsPDF = async function () {
  const summary = getOwnerPayoutsSummary();
  const payouts = getPayoutRequests();

  if (!payouts || payouts.length === 0) {
    showCustomAlert("لا توجد بيانات سحوبات لتصديرها!");
    return;
  }

  try {
    const reportDate = new Date().toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const reportTime = new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const reportHTML = `
      <div id="payoutsReportPdfContent" style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; padding: 24px; color: #0f172a; background: #ffffff;">
        <!-- REPORT HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 22px; color: #1e1b4b; font-weight: 900;">🏛️ منصة StudyMart — تقرير المستحقات والتسويات المالية</h1>
            <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">تقرير مالك المنصة الشامل لحركات المسحوبات والمستحقات المعتمدة</p>
          </div>
          <div style="text-align: left; font-size: 11px; color: #475569;">
            <div><strong>تاريخ التقرير:</strong> ${reportDate}</div>
            <div><strong>توقيت الإصدار:</strong> ${reportTime}</div>
            <div style="color: #6366f1; font-weight: 700;">مالك المنصة (Central Financial Report)</div>
          </div>
        </div>

        <!-- SUMMARY METRICS GRID -->
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 14px; color: #1e1b4b; border-right: 4px solid #6366f1; padding-right: 8px;">📊 ملخص المؤشرات المالية الكلية</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px;">
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; width: 33%;">
                <div style="color: #64748b;">إجمالي إيرادات المنصة</div>
                <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${summary.grossRevenue.toLocaleString("ar-EG")} ج.م</div>
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; width: 33%;">
                <div style="color: #64748b;">عمولة المنصة الصافية (10%)</div>
                <div style="font-size: 14px; font-weight: 800; color: #10b981;">${summary.platformFeeShare.toLocaleString("ar-EG")} ج.م</div>
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; width: 33%;">
                <div style="color: #64748b;">مستحقات المعلمين الكلية (90%)</div>
                <div style="font-size: 14px; font-weight: 800; color: #0ea5e9;">${summary.teacherGrossEarnings.toLocaleString("ar-EG")} ج.م</div>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b;">المسحوبات المدفوعة والمحولة</div>
                <div style="font-size: 14px; font-weight: 800; color: #10b981;">${summary.totalPaid.toLocaleString("ar-EG")} ج.م</div>
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b;">الطلبات قيد الانتظار</div>
                <div style="font-size: 14px; font-weight: 800; color: #f59e0b;">${summary.totalPending.toLocaleString("ar-EG")} ج.م</div>
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b;">المقبولة قيد التحويل</div>
                <div style="font-size: 14px; font-weight: 800; color: #6366f1;">${summary.totalApproved.toLocaleString("ar-EG")} ج.م</div>
              </td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b;">الطلبات المرفوضة</div>
                <div style="font-size: 14px; font-weight: 800; color: #ef4444;">${summary.totalRejected.toLocaleString("ar-EG")} ج.م</div>
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b;">الطلبات الملغاة</div>
                <div style="font-size: 14px; font-weight: 800; color: #64748b;">${summary.totalCancelled.toLocaleString("ar-EG")} ج.م</div>
              </td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b;">احتياطي وسيولة الخزينة</div>
                <div style="font-size: 14px; font-weight: 800; color: #10b981;">${summary.treasuryReserves.toLocaleString("ar-EG")} ج.م</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- TRANSACTIONS & WITHDRAWALS TABLE -->
        <div>
          <h3 style="margin: 0 0 12px; font-size: 14px; color: #1e1b4b; border-right: 4px solid #6366f1; padding-right: 8px;">📋 تفاصيل عمليات وطلبات السحب المالي (${payouts.length})</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: right;">
            <thead>
              <tr style="background: #1e1b4b; color: #ffffff;">
                <th style="padding: 6px; border: 1px solid #312e81;">رقم الطلب</th>
                <th style="padding: 6px; border: 1px solid #312e81;">رقم المعاملة</th>
                <th style="padding: 6px; border: 1px solid #312e81;">المعلم المستفيد</th>
                <th style="padding: 6px; border: 1px solid #312e81;">المحفظة الإلكترونية</th>
                <th style="padding: 6px; border: 1px solid #312e81;">المبلغ</th>
                <th style="padding: 6px; border: 1px solid #312e81;">الصافي</th>
                <th style="padding: 6px; border: 1px solid #312e81;">الحالة</th>
                <th style="padding: 6px; border: 1px solid #312e81;">تاريخ الطلب</th>
              </tr>
            </thead>
            <tbody>
              ${payouts.map((p, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${p.id}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: monospace;">${p.transactionNo || '—'}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: 700;">${p.teacherName || p.walletOwner || '—'}</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${p.walletTypeName} (${p.walletNumber})</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: 700;">${(p.amount || 0).toLocaleString('ar-EG')} ج.م</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: 800; color: #10b981;">${(p.netAmount || p.amount || 0).toLocaleString('ar-EG')} ج.م</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: 700;">${
                    p.status === 'Paid' ? '✅ مدفوع' :
                    p.status === 'Approved' ? '👍 مقبول' :
                    p.status === 'Pending' ? '⏳ معلق' :
                    p.status === 'Rejected' ? '❌ مرفوض' : '🚫 ملغي'
                  }</td>
                  <td style="padding: 6px; border: 1px solid #e2e8f0;">${p.createdDate ? p.createdDate.split('T')[0] : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <div style="margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between;">
          <div>مستخرج رسمياً من منصة StudyMart التعليمية — وحدة الإدارة المالية والمالك.</div>
          <div>صفحة 1 من 1</div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "900px";
    tempDiv.innerHTML = reportHTML;
    document.body.appendChild(tempDiv);

    const reportElem = tempDiv.querySelector("#payoutsReportPdfContent") || tempDiv;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `studymart_financial_report_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    await html2pdf().from(reportElem).set(opt).save();

    document.body.removeChild(tempDiv);
    showCustomAlert("تم تصدير التقرير المالي صيغة PDF بنجاح 📄");
  } catch (err) {
    console.error("Export Payouts PDF Error:", err);
    showCustomAlert("حدث خطأ أثناء إنشاء تقرير PDF. يرجى المحاولة مرة أخرى.");
  }
};


/**
 * Render Wallet Management Page
 */
function renderPayoutsWallet() {
  const container = document.getElementById("payoutsWalletContent");
  if (!container) return;

  const wallets = getTeacherWallets();

  container.innerHTML = `
    <div class="po-container">
      <div class="po-header">
        <div class="po-title-group">
          <h1>📱 إدارة المحفظة الإلكترونية <span style="font-size: 13px; background: #6366f1; color: #fff; padding: 3px 10px; border-radius: 20px; font-weight: 700;">مصر</span></h1>
          <div class="po-breadcrumb">
            <span>لوحة المعلم</span>
            <span class="sep">‹</span>
            <span style="cursor: pointer;" onclick="window.openPayoutsDashboard()">المستحقات والسحب</span>
            <span class="sep">‹</span>
            <span style="color: #6366f1; font-weight: 700;">إدارة المحفظة</span>
          </div>
        </div>

        <div class="po-actions">
          <button type="button" class="po-btn po-btn-outline" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else window.openPayoutsDashboard();">
            ← العودة للوحة المستحقات
          </button>
        </div>
      </div>

      <div class="po-two-col-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- ADD / EDIT WALLET FORM -->
        <div class="po-card">
          <div class="po-card-title">➕ إضافة محفظة إلكترونية جديدة</div>

          <form onsubmit="window.handleSaveWalletForm(event)">
            <div class="po-form-group">
              <label>نوع المحفظة الإلكترونية *</label>
              <select id="wltTypeSelect" required>
                ${ALLOWED_WALLETS.map(
                  (w) => `<option value="${w.id}">${w.icon} ${w.name} (${w.provider})</option>`
                ).join("")}
              </select>
              <span class="po-input-hint">اختر مزود خدمة المحفظة الخاص بك في مصر.</span>
            </div>

            <div class="po-form-group">
              <label>رقم المحفظة (رقم الهاتف) *</label>
              <input type="text" id="wltNumberInput" placeholder="01012345678" maxlength="11" dir="ltr" required />
              <span class="po-input-hint">يجب أن يكون رقم محفظة مصري مكون من 11 رقم يبدأ بـ (010، 011، 012، 015).</span>
            </div>

            <div class="po-form-group">
              <label>اسم صاحب المحفظة الثلاثي *</label>
              <input type="text" id="wltOwnerInput" placeholder="أحمد محمود علي" required />
              <span class="po-input-hint">الاسم المسجل رسمياً لدى شركة الاتصالات صاحب المحفظة.</span>
            </div>

            <div class="po-form-group" style="flex-direction: row; align-items: center; gap: 10px; margin-top: 10px;">
              <input type="checkbox" id="wltDefaultCheck" style="width: auto; cursor: pointer;" checked />
              <label for="wltDefaultCheck" style="cursor: pointer; font-size: 14px; margin: 0;">تعيين هذه المحفظة كمحفظة افتراضية لاستلام السحوبات</label>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="po-btn po-btn-primary" style="width: 100%; justify-content: center;">
                💾 حفظ وتوثيق المحفظة
              </button>
            </div>
          </form>
        </div>

        <!-- SAVED WALLETS LIST -->
        <div class="po-card">
          <div class="po-card-title">📋 المحافظ المسجلة حالياً (${wallets.length})</div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${
              wallets.length === 0
                ? `<div style="text-align: center; padding: 30px; color: #94a3b8;">لا توجد محافظ مسجلة حالياً</div>`
                : wallets.map((w) => renderWalletItemCard(w)).join("")
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWalletItemCard(w) {
  return `
    <div class="po-wallet-item-card" style="background: var(--card-header-bg, #f8fafc); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 15px; font-weight: 800; color: #10b981; margin-bottom: 2px;">
          ${getWalletIcon(w.walletType)} ${w.walletTypeName}
          ${w.isDefault ? '<span style="font-size: 10px; background: #10b981; color: #fff; padding: 2px 6px; border-radius: 10px; margin-right: 6px;">افتراضية</span>' : ''}
        </div>
        <div style="font-size: 16px; font-weight: 900; letter-spacing: 1px;" dir="ltr">
          ${w.number}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          صاحب المحفظة: ${w.ownerName}
        </div>
      </div>

      <div class="po-wallet-item-actions" style="display: flex; gap: 8px;">
        ${
          !w.isDefault
            ? `<button type="button" class="po-btn po-btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.setDefaultWallet('${w.id}')">تعيين كافتراضية</button>`
            : ''
        }
        <button type="button" class="po-btn po-btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="window.deleteWallet('${w.id}')">حذف</button>
      </div>
    </div>
  `;
}

/**
 * Render New Withdrawal Request Page
 */
function renderPayoutsRequest() {
  const container = document.getElementById("payoutsRequestContent");
  if (!container) return;

  const summary = getPayoutsSummary();
  const wallets = getTeacherWallets();

  container.innerHTML = `
    <div class="po-container">
      <div class="po-header">
        <div class="po-title-group">
          <h1>💸 تقديم طلب سحب جديد <span style="font-size: 13px; background: #10b981; color: #fff; padding: 3px 10px; border-radius: 20px; font-weight: 700;">فورياً</span></h1>
          <div class="po-breadcrumb">
            <span>لوحة المعلم</span>
            <span class="sep">‹</span>
            <span style="cursor: pointer;" onclick="window.openPayoutsDashboard()">المستحقات والسحب</span>
            <span class="sep">‹</span>
            <span style="color: #10b981; font-weight: 700;">طلب سحب جديد</span>
          </div>
        </div>

        <div class="po-actions">
          <button type="button" class="po-btn po-btn-outline" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else window.openPayoutsDashboard();">
            ← العودة للوحة المستحقات
          </button>
        </div>
      </div>

      <div class="po-req-grid" style="display: grid; grid-template-columns: 1fr 380px; gap: 24px;">
        <!-- REQUEST FORM -->
        <div class="po-card">
          <div class="po-card-title">📝 تفاصيل طلب السحب</div>

          <form onsubmit="window.handleSubmitWithdrawalForm(event)">
            <!-- SELECT WALLET -->
            <div class="po-form-group">
              <label>المحفظة الإلكترونية المستهدفة للتحويل *</label>
              ${
                wallets.length === 0
                  ? `<div style="color: #ef4444; font-weight: 700; padding: 10px; border: 1px solid #fee2e2; border-radius: 8px; background: #fff5f5;">
                      عفواً، لا توجد أي محفظة مسجلة في حسابك! <a href="javascript:void(0)" onclick="window.openPayoutsWallet()" style="color: #6366f1; text-decoration: underline;">اضغط هنا لإضافة محفظة أولاً</a>.
                     </div>`
                  : `<select id="reqWalletSelect" onchange="window.updateReqFormCalculations()" required>
                      ${wallets
                        .map(
                          (w) => `<option value="${w.id}" ${w.isDefault ? 'selected' : ''}>${getWalletIcon(w.walletType)} ${w.walletTypeName} - (${w.number}) - ${w.ownerName}</option>`
                        )
                        .join("")}
                     </select>`
              }
            </div>

            <!-- WITHDRAWAL AMOUNT INPUT -->
            <div class="po-form-group">
              <label>مبلغ السحب المطلوب (بالجنيه المصري EGP) *</label>
              <input
                type="number"
                id="reqAmountInput"
                placeholder="مثال: 1000"
                min="${summary.minWithdrawal}"
                max="${summary.availableBalance}"
                step="100"
                oninput="window.updateReqFormCalculations()"
                required
              />
              <span class="po-input-hint">الحد الأدنى للسحب: ${summary.minWithdrawal} ج.م | الرصيد المتاح: ${summary.availableBalance.toLocaleString()} ج.م</span>
            </div>

            <!-- CALCULATION PREVIEW BOX -->
            <div style="background: var(--card-header-bg, #f8fafc); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color, #e2e8f0); margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span>المبلغ المطلوب:</span>
                <span id="calcReqAmount" style="font-weight: 800;">0 ج.م</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                <span>رسوم التحويل والمعالجة:</span>
                <span style="font-weight: 800; color: #10b981;">0 ج.م (مجاناً)</span>
              </div>
              <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #10b981;">
                <span>الصافي المحول للمحفظة:</span>
                <span id="calcNetAmount">0 ج.م</span>
              </div>
            </div>

            <!-- SUBMIT BUTTON -->
            <button
              type="submit"
              class="po-btn po-btn-primary"
              style="width: 100%; justify-content: center; padding: 14px; font-size: 16px;"
              ${wallets.length === 0 || summary.availableBalance < summary.minWithdrawal ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}
            >
              🚀 إرسال طلب السحب للنظام
            </button>
          </form>
        </div>

        <!-- SUMMARY SIDEBAR -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div class="po-card">
            <div class="po-card-title">📊 ملخص الرصيد الحسابي</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px;">
                <span style="color: #64748b;">الرصيد المتاح للسحب:</span>
                <strong style="color: #10b981; font-size: 16px;">${summary.availableBalance.toLocaleString()} ج.م</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px;">
                <span style="color: #64748b;">رصيد قيد السحب:</span>
                <strong style="color: #f59e0b;">${summary.pendingBalance.toLocaleString()} ج.م</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px;">
                <span style="color: #64748b;">الحد الأدنى المسموح:</span>
                <strong>${summary.minWithdrawal} ج.م</strong>
              </div>
            </div>
          </div>

          <div class="po-card" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div style="font-size: 14px; font-weight: 800; color: #065f46; margin-bottom: 6px;">⏱️ زمن المعالجة المتوقع</div>
            <div style="font-size: 13px; color: #047857; line-height: 1.6;">
              تستغرق عملية المراجعة وتحويل الأموال للمحفظة الإلكترونية من <strong>12 إلى 48 ساعة كحد أقصى</strong> خلال أيام العمل الرسمية.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Withdrawal History Page
 */
function renderPayoutsHistory(forceFullRender = false) {
  const container = document.getElementById("payoutsHistoryContent");
  if (!container) return;

  const payouts = getPayoutRequests();

  // Filter history
  const filtered = payouts.filter((p) => {
    if (historySearch && historySearch.trim()) {
      const q = historySearch.trim().toLowerCase();

      const matchId = (p.id || "").toLowerCase().includes(q);
      const matchTxn = (p.transactionNo || "").toLowerCase().includes(q);
      const matchNum = (p.walletNumber || p.number || "").toLowerCase().includes(q);
      const matchTypeName = (p.walletTypeName || "").toLowerCase().includes(q);
      const matchType = (p.walletType || "").toLowerCase().includes(q);
      const matchOwner = (p.walletOwner || p.ownerName || p.teacherName || "").toLowerCase().includes(q);
      const matchAmount = String(p.amount || "").includes(q) || String(p.netAmount || "").includes(q);
      const matchNotes = (p.notes || "").toLowerCase().includes(q) || (p.rejectionReason || "").toLowerCase().includes(q);
      const matchDate = (p.createdDate || "").toLowerCase().includes(q);

      let matchStatus = (p.status || "").toLowerCase().includes(q);
      if (!matchStatus) {
        const statusLower = (p.status || "").toLowerCase();
        if ((statusLower === "pending" || statusLower === "under review") && ("قيد الانتظار".includes(q) || "معلق".includes(q) || "مراجعة".includes(q))) matchStatus = true;
        if (statusLower === "approved" && ("مقبول".includes(q) || "موافقة".includes(q))) matchStatus = true;
        if (statusLower === "paid" && ("تم التحويل".includes(q) || "مدفوع".includes(q) || "دفع".includes(q))) matchStatus = true;
        if (statusLower === "rejected" && ("مرفوض".includes(q) || "رفض".includes(q))) matchStatus = true;
        if (statusLower === "cancelled" && ("ملغي".includes(q) || "إلغاء".includes(q))) matchStatus = true;
      }

      if (!matchId && !matchTxn && !matchNum && !matchTypeName && !matchType && !matchOwner && !matchAmount && !matchNotes && !matchDate && !matchStatus) {
        return false;
      }
    }
    if (historyStatusFilter !== "all" && p.status !== historyStatusFilter) return false;
    if (historyWalletFilter !== "all" && p.walletType !== historyWalletFilter) return false;
    return true;
  });

  const tbody = document.getElementById("payoutsHistoryTbody");

  // If tbody already exists in the DOM and we don't force a full re-render, update only tbody
  if (tbody && !forceFullRender) {
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">لا توجد سجلات تطابق البحث أو الفلتر المحدد</td></tr>`;
    } else {
      tbody.innerHTML = filtered.map((p) => renderPayoutRow(p)).join("");
    }
    return;
  }

  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  container.innerHTML = `
    <div class="po-container">
      <div class="po-header">
        <div class="po-title-group">
          <h1>📜 سجل سحوبات الأرباح <span style="font-size: 13px; background: #6366f1; color: #fff; padding: 3px 10px; border-radius: 20px; font-weight: 700;">كامل</span></h1>
          <div class="po-breadcrumb">
            <span>لوحة المعلم</span>
            <span class="sep">‹</span>
            <span style="cursor: pointer;" onclick="window.openPayoutsDashboard()">المستحقات والسحب</span>
            <span class="sep">‹</span>
            <span style="color: #6366f1; font-weight: 700;">سجل السحوبات</span>
          </div>
        </div>

        <div class="po-actions">
          <button type="button" class="po-btn po-btn-primary" onclick="window.openPayoutsRequest()">
            💸 طلب سحب جديد
          </button>
        </div>
      </div>

      <!-- SEARCH & FILTERS TOOLBAR -->
      <div class="po-card" style="padding: 16px; margin-bottom: 20px;">
        <div class="po-toolbar-flex" style="display: flex; gap: 12px; flex-wrap: wrap;">
          <!-- SEARCH -->
          <div style="flex: 1; min-width: 220px;">
            <input
              id="payoutsHistorySearchInput"
              type="text"
              placeholder="بحث برقم الطلب، المعاملة، المحفظة، الاسم، المبلغ..."
              value="${historySearch || ''}"
              oninput="window.handleHistorySearch(this.value)"
              onkeydown="if(event.key==='Enter') event.preventDefault()"
              style="width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 13px;"
            />
          </div>

          <!-- STATUS FILTER -->
          <select onchange="window.handleHistoryStatusFilter(this.value)" style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 13px;">
            <option value="all" ${historyStatusFilter === 'all' ? 'selected' : ''}>كافة الحالات</option>
            <option value="Pending" ${historyStatusFilter === 'Pending' ? 'selected' : ''}>قيد الانتظار</option>
            <option value="Approved" ${historyStatusFilter === 'Approved' ? 'selected' : ''}>مقبول</option>
            <option value="Paid" ${historyStatusFilter === 'Paid' ? 'selected' : ''}>تم التحويل (مدفوع)</option>
            <option value="Rejected" ${historyStatusFilter === 'Rejected' ? 'selected' : ''}>مرفوض</option>
            <option value="Cancelled" ${historyStatusFilter === 'Cancelled' ? 'selected' : ''}>ملغي</option>
          </select>

          <!-- WALLET TYPE FILTER -->
          <select onchange="window.handleHistoryWalletFilter(this.value)" style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color, #cbd5e1); font-size: 13px;">
            <option value="all" ${historyWalletFilter === 'all' ? 'selected' : ''}>كافة شبكات المحافظ</option>
            ${ALLOWED_WALLETS.map((w) => `<option value="${w.id}" ${historyWalletFilter === w.id ? 'selected' : ''}>${w.name}</option>`).join("")}
          </select>
        </div>
      </div>

      <!-- HISTORY TABLE -->
      <div class="po-card">
        <div class="po-table-container">
          <table class="po-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>رقم المعاملة</th>
                <th>المحفظة الرقمية</th>
                <th>المبلغ المطلوب</th>
                <th>الصافي</th>
                <th>الحالة</th>
                <th>تاريخ الطلب</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody id="payoutsHistoryTbody">
              ${
                filtered.length === 0
                  ? `<tr><td colspan="8" style="text-align: center; padding: 30px; color: #94a3b8;">لا توجد سجلات تطابق البحث أو الفلتر المحدد</td></tr>`
                  : filtered.map((p) => renderPayoutRow(p)).join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPayoutRow(p) {
  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  return `
    <tr>
      <td style="font-weight: 800; color: #6366f1;">${p.id}</td>
      <td style="font-family: monospace; font-size: 12px; color: #64748b;" dir="ltr">${p.transactionNo || '—'}</td>
      <td>
        <div style="font-weight: 700;">${getWalletIcon(p.walletType)} ${p.walletTypeName}</div>
        <div style="font-size: 12px; color: #64748b;" dir="ltr">${p.walletNumber} (${p.walletOwner || '—'})</div>
      </td>
      <td style="font-weight: 800;">${p.amount.toLocaleString()} ج.م</td>
      <td style="font-weight: 800; color: #10b981;">${p.netAmount.toLocaleString()} ج.م</td>
      <td>${renderStatusBadge(p.status)}</td>
      <td style="font-size: 12px; color: #64748b;">${formatDateShort(p.createdDate)}</td>
      <td>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
          <button type="button" class="po-btn po-btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="window.openPayoutsDetails('${p.id}')">
            عرض التفاصيل 👁️
          </button>
          ${
            p.status === "Pending" && !isOwnerUser
              ? `<button type="button" class="po-btn po-btn-danger" style="padding: 4px 8px; font-size: 11px;" onclick="window.cancelWithdrawalRequest('${p.id}')">إلغاء</button>`
              : ''
          }
          ${
            isOwnerUser && (p.status === "Pending" || p.status === "Under Review")
              ? `<button type="button" class="po-btn" style="padding: 4px 8px; font-size: 11px; background: #10b981; color: #fff;" onclick="window.approveWithdrawalRequest('${p.id}')">👍 موافقة</button>
                 <button type="button" class="po-btn" style="padding: 4px 8px; font-size: 11px; background: #ef4444; color: #fff;" onclick="window.rejectWithdrawalRequest('${p.id}')">❌ رفض</button>`
              : ''
          }
          ${
            isOwnerUser && p.status === "Approved"
              ? `<button type="button" class="po-btn" style="padding: 4px 8px; font-size: 11px; background: #059669; color: #fff;" onclick="window.markWithdrawalAsPaid('${p.id}')">✅ تحويل</button>
                 <button type="button" class="po-btn" style="padding: 4px 8px; font-size: 11px; background: #ef4444; color: #fff;" onclick="window.rejectWithdrawalRequest('${p.id}')">❌ رفض</button>`
              : ''
          }
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render Withdrawal Details & Printable Receipt Page
 */
function renderPayoutsDetails(requestId) {
  const container = document.getElementById("payoutsDetailsContent");
  if (!container) return;

  const payouts = getPayoutRequests();
  const req = payouts.find((p) => p.id === requestId);

  if (!req) {
    container.innerHTML = `
      <div class="po-container" style="text-align: center; padding: 60px;">
        <h2>عفواً، طلب السحب غير موجود!</h2>
        <button type="button" class="po-btn po-btn-primary" onclick="window.openPayoutsHistory()">العودة للسجل</button>
      </div>
    `;
    return;
  }

  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  container.innerHTML = `
    <div class="po-container">
      <div class="po-header no-print">
        <div class="po-title-group">
          <h1>تفاصيل طلب السحب (${req.id})</h1>
          <div class="po-breadcrumb">
            <span>لوحة المعلم</span>
            <span class="sep">‹</span>
            <span style="cursor: pointer;" onclick="window.openPayoutsDashboard()">المستحقات والسحب</span>
            <span class="sep">‹</span>
            <span style="cursor: pointer;" onclick="window.openPayoutsHistory()">السجل</span>
            <span class="sep">‹</span>
            <span style="color: #6366f1; font-weight: 700;">تفاصيل الطلب</span>
          </div>
        </div>

        <div class="po-actions">
          <button type="button" class="po-btn po-btn-outline" onclick="window.printPayoutReceipt('${req.id}')">
            🖨️ طباعة الإيصال
          </button>
          <button type="button" id="downloadPdfBtn_${req.id}" class="po-btn po-btn-indigo" onclick="window.downloadPayoutPDF('${req.id}')">
            📄 تحميل PDF
          </button>
          <button type="button" class="po-btn po-btn-outline" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else window.openPayoutsHistory();">
            ← العودة للسجل
          </button>
        </div>
      </div>

      <!-- MAIN RECEIPT & DETAILS WRAPPER -->
      <div id="printablePayoutReceipt">
        <!-- PRINT HEADER BRAND -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #10b981;">StudyMart LMS</div>
            <div style="font-size: 13px; color: #64748b;">إيصال معالجة وتحويل مستحقات معلم</div>
          </div>
          <div style="text-align: left;" dir="ltr">
            <div style="font-size: 16px; font-weight: 900; color: #1e293b;">${req.id}</div>
            <div style="font-size: 12px; color: #64748b;">التاريخ: ${formatDateShort(req.createdDate)}</div>
          </div>
        </div>

        <div class="po-two-col-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          <!-- LEFT CARD: AMOUNT & WALLET DETAILS -->
          <div class="po-card" style="margin-bottom: 0;">
            <div class="po-card-title">💰 بيانات المبلغ والجهة المحول إليها</div>

            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <span style="color: #64748b;">رقم المعاملة البنكية / الفنية:</span>
                <strong dir="ltr" style="font-family: monospace;">${req.transactionNo || 'قيد الإصدار'}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <span style="color: #64748b;">المحفظة الإلكترونية:</span>
                <strong>${getWalletIcon(req.walletType)} ${req.walletTypeName}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <span style="color: #64748b;">رقم المحفظة:</span>
                <strong dir="ltr">${req.walletNumber}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <span style="color: #64748b;">صاحب المحفظة:</span>
                <strong>${req.walletOwner}</strong>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <span style="color: #64748b;">المبلغ المطلوب:</span>
                <strong>${req.amount.toLocaleString()} ج.م</strong>
              </div>

              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                <span style="color: #64748b;">رسوم المعالجة:</span>
                <strong style="color: #10b981;">0 ج.م (مجاناً)</strong>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #10b981; padding-top: 8px;">
                <span>الصافي المحول:</span>
                <span>${req.netAmount.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>

          <!-- RIGHT CARD: STATUS & TIMELINE -->
          <div class="po-card" style="margin-bottom: 0;">
            <div class="po-card-title">
              <span>📊 حالة الطلب والمخطط الزمني</span>
              ${renderStatusBadge(req.status)}
            </div>

            <!-- TIMELINE -->
            <div class="po-timeline">
              ${(req.timeline || [])
                .map(
                  (step) => `
                <div class="po-timeline-item">
                  <div class="po-timeline-dot"></div>
                  <div class="po-timeline-title">${step.label}</div>
                  <div class="po-timeline-time">${step.time}</div>
                </div>
              `
                )
                .join("")}
            </div>

            ${
              req.notes
                ? `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; color: #475569; margin-top: 14px;">
                    <strong>ملاحظات النظام:</strong> ${req.notes}
                   </div>`
                : ''
            }
          </div>
        </div>

        <!-- PRINT FOOTER WITH QR CODE SIMULATION -->
        <div class="po-details-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          <div>
            منصة StudyMart للتعليم الإلكتروني • كافة الحقوق محفوظة © 2026<br />
            إيصال رسمي معتمد إلكترونياً ولا يحتاج توقيعاً خطياً.
          </div>
          <div style="text-align: center;">
            <div style="width: 60px; height: 60px; border: 2px solid #000; padding: 4px; font-size: 8px; text-align: center; line-height: 1.1; margin: 0 auto;">
              [ QR CODE ]<br />${req.id}
            </div>
          </div>
        </div>
      </div>

      <!-- OWNER / ADMIN ACTION PANEL -->
      ${
        isOwnerUser
          ? `
        <div class="po-card no-print" style="margin-top: 24px; border: 2px solid #6366f1; background: var(--card-bg, #ffffff);">
          <div class="po-card-title" style="color: #4f46e5; display: flex; align-items: center; justify-content: space-between;">
            <span>👑 إجراءات واعتمادات مالك القناة / إدارة المنصة</span>
            <span style="font-size: 11px; background: #6366f1; color: #ffffff; padding: 2px 8px; border-radius: 6px;">OWNER CONTROL</span>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
            بصفتك مالك القناة المسؤول عن السحوبات المالية، يمكنك اتخاذ القرار المناسب بشأن طلب السحب رقم (<strong>${req.id}</strong>):
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            ${(req.status === "Pending" || req.status === "Under Review") ? `
              <button type="button" class="po-btn" style="background: #10b981; color: #ffffff; font-weight: 700; padding: 10px 18px;" onclick="window.approveWithdrawalRequest('${req.id}')">
                👍 الموافقة على الطلب
              </button>
            ` : ''}
            ${req.status !== "Paid" && req.status !== "Rejected" && req.status !== "Cancelled" ? `
              <button type="button" class="po-btn" style="background: #059669; color: #ffffff; font-weight: 700; padding: 10px 18px;" onclick="window.markWithdrawalAsPaid('${req.id}')">
                ✅ التأكيد وتحويل المبلغ (تم الدفع)
              </button>
              <button type="button" class="po-btn" style="background: #dc2626; color: #ffffff; font-weight: 700; padding: 10px 18px;" onclick="window.rejectWithdrawalRequest('${req.id}')">
                ❌ رفض طلب السحب
              </button>
            ` : ''}
            ${(req.status === "Paid" || req.status === "Rejected" || req.status === "Cancelled") ? `
              <div style="font-size: 13px; color: #64748b; font-weight: 600;">
                الطلب مكتمل بحالة [${renderStatusBadge(req.status)}]. لا تتوفر إجراءات إضافية.
              </div>
            ` : ''}
          </div>
        </div>
      ` : `
        ${req.status === "Pending" ? `
          <div class="po-card no-print" style="margin-top: 20px; text-align: left; background: var(--card-bg, #ffffff);">
            <button type="button" class="po-btn po-btn-danger" onclick="window.cancelWithdrawalRequest('${req.id}')">
              🚫 إلغاء طلب السحب
            </button>
          </div>
        ` : ''}
      `
      }
    </div>
  `;
}

/* =========================================================
   EVENT HANDLERS & ACTIONS
   ========================================================= */

window.handleSaveWalletForm = function (e) {
  e.preventDefault();

  const type = document.getElementById("wltTypeSelect").value;
  const number = document.getElementById("wltNumberInput").value.trim();
  const owner = document.getElementById("wltOwnerInput").value.trim();
  const isDefault = document.getElementById("wltDefaultCheck").checked;

  if (!validateEgyptianMobileWallet(number)) {
    showCustomAlert("عفواً، يجب أدخال رقم محفظة مصري صحيح يبدأ بـ (010، 011، 012، 015) ومكون من 11 رقم بالضبط!");
    return;
  }

  if (!owner) {
    showCustomAlert("يرجى إدخال اسم صاحب المحفظة!");
    return;
  }

  const wallets = getTeacherWallets();

  if (isDefault) {
    wallets.forEach((w) => (w.isDefault = false));
  }

  const walletInfo = ALLOWED_WALLETS.find((w) => w.id === type);

  const newWallet = {
    id: "WLT-" + Date.now(),
    walletType: type,
    walletTypeName: walletInfo ? walletInfo.name : type,
    number: number,
    ownerName: owner,
    isDefault: isDefault || wallets.length === 0,
    isVerified: true,
    createdDate: new Date().toISOString()
  };

  wallets.push(newWallet);
  saveTeacherWallets(wallets);

  showCustomAlert("تم حفظ وتوثيق المحفظة بنجاح ✅");
  renderPayoutsWallet();
};

window.setDefaultWallet = function (id) {
  const wallets = getTeacherWallets();
  wallets.forEach((w) => {
    w.isDefault = w.id === id;
  });
  saveTeacherWallets(wallets);
  renderPayoutsWallet();
  showCustomAlert("تم تعيين المحفظة كمحفظة افتراضية للسحب ✅");
};

window.deleteWallet = async function (id) {
  const confirmFn = window.showConfirmDialog || window.confirm;
  let confirmed = false;

  if (window.showConfirmDialog) {
    confirmed = await window.showConfirmDialog({
      title: "تأكيد حذف المحفظة؟",
      message: "هل أنت تأكد من رغبتك في حذف هذه المحفظة الإلكترونية؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "حذف المحفظة",
      cancelText: "إلغاء",
      danger: true
    });
  } else {
    confirmed = confirm("هل أنت تأكد من رغبتك في حذف هذه المحفظة؟");
  }

  if (confirmed) {
    let wallets = getTeacherWallets();
    wallets = wallets.filter((w) => w.id !== id);
    if (wallets.length > 0 && !wallets.some((w) => w.isDefault)) {
      wallets[0].isDefault = true;
    }
    saveTeacherWallets(wallets);
    renderPayoutsWallet();
    showCustomAlert("تم حذف المحفظة بنجاح ✅");
  }
};

window.updateReqFormCalculations = function () {
  const amountInput = document.getElementById("reqAmountInput");
  const amount = amountInput ? parseFloat(amountInput.value) || 0 : 0;

  const reqAmountEl = document.getElementById("calcReqAmount");
  const netAmountEl = document.getElementById("calcNetAmount");

  if (reqAmountEl) reqAmountEl.textContent = amount.toLocaleString() + " ج.م";
  if (netAmountEl) netAmountEl.textContent = amount.toLocaleString() + " ج.م";
};

window.handleSubmitWithdrawalForm = function (e) {
  e.preventDefault();

  const summary = getPayoutsSummary();
  const wallets = getTeacherWallets();

  if (wallets.length === 0) {
    showCustomAlert("يرجى إضافة محفظة إلكترونية أولاً قبل تقديم طلب السحب!");
    return;
  }

  const walletSelect = document.getElementById("reqWalletSelect");
  const walletId = walletSelect.value;
  const targetWallet = wallets.find((w) => w.id === walletId);

  const amountInput = document.getElementById("reqAmountInput");
  const amount = parseFloat(amountInput.value) || 0;

  if (amount < summary.minWithdrawal) {
    showCustomAlert(`الحد الأدنى المسموح به للسحب هو ${summary.minWithdrawal} ج.م!`);
    return;
  }

  if (amount > summary.availableBalance) {
    showCustomAlert(`مبلغ السحب أفقر من الرصيد المتاح لك حالياً (${summary.availableBalance.toLocaleString()} ج.م)!`);
    return;
  }

  // Check if active pending request exists
  const payouts = getPayoutRequests();
  const hasPending = payouts.some((p) => p.status === "Pending");
  if (hasPending) {
    showCustomAlert("لديك بالفعل طلب سحب نشط قيد المراجعة! لا يمكن إنشاء أكثر من طلب معلق في نفس الوقت.");
    return;
  }

  const userData = (window.appState && window.appState.userData) || {};
  const newPayout = {
    id: "WDR-2026-" + Math.floor(900 + Math.random() * 100),
    transactionNo: "TXN-EGP-" + Math.floor(100000 + Math.random() * 900000),
    teacherName: userData.name || targetWallet.ownerName || "د. أحمد محمود علي",
    teacherId: userData.id || "TCH-101",
    teacherEmail: userData.email || "ahmed.ali@studymart.com",
    amount: amount,
    fees: 0,
    netAmount: amount,
    walletType: targetWallet.walletType,
    walletTypeName: targetWallet.walletTypeName,
    walletNumber: targetWallet.number,
    walletOwner: targetWallet.ownerName,
    status: "Pending",
    createdDate: new Date().toISOString(),
    approvedDate: null,
    paidDate: null,
    notes: "تم استلام الطلب وتوجيهه لقسم الحسابات للمراجعة والتحويل",
    timeline: [
      { status: "Created", label: "تم تقديم طلب السحب", time: new Date().toLocaleString("ar-EG") },
      { status: "Submitted", label: "بانتظار مراجعة السيولة والتحويل", time: new Date().toLocaleString("ar-EG") }
    ]
  };

  payouts.unshift(newPayout);
  savePayoutRequests(payouts);

  showCustomAlert("تم تقديم طلب السحب بنجاح! 🚀");
  openPayoutsDetails(newPayout.id);
};

window.cancelWithdrawalRequest = async function (id) {
  let confirmed = false;
  if (window.showConfirmDialog) {
    confirmed = await window.showConfirmDialog({
      title: "إلغاء طلب السحب؟",
      message: "هل أنت تأكد من رغبتك في إلغاء طلب السحب هذا؟ سيعود المبلغ تلقائياً إلى رصيدك المتاح.",
      confirmText: "تأكيد الإلغاء",
      cancelText: "تراجع",
      danger: true
    });
  } else {
    confirmed = confirm("هل أنت تأكد من رغبتك في إلغاء طلب السحب هذا؟");
  }

  if (confirmed) {
    const payouts = getPayoutRequests();
    const req = payouts.find((p) => p.id === id);
    if (req && req.status === "Pending") {
      req.status = "Cancelled";
      req.timeline.push({
        status: "Cancelled",
        label: "تم إلغاء الطلب بناءً على رغبة المعلم",
        time: new Date().toLocaleString("ar-EG")
      });
      savePayoutRequests(payouts);
      showCustomAlert("تم إلغاء طلب السحب بنجاح ✅");
      const currentHash = window.location.hash;
      if (currentHash.includes("details")) {
        renderPayoutsDetails(id);
      } else {
        renderPayoutsHistory();
      }
    }
  }
};

/* =========================================================
   OWNER APPROVAL / REJECTION WORKFLOW HANDLERS
   ========================================================= */

window.approveWithdrawalRequest = function (id) {
  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  if (!isOwnerUser) {
    showCustomAlert("عفواً، هذه الصلاحية مقتصرة حصرياً على مالك القناة / إدارة المنصة!");
    return;
  }

  const payouts = getPayoutRequests();
  const req = payouts.find((p) => p.id === id);

  if (!req) {
    showCustomAlert("عفواً، طلب السحب غير موجود!");
    return;
  }

  if (req.status === "Approved" || req.status === "Paid") {
    showCustomAlert("طلب السحب معتمد أو مدفوع بالفعل!");
    return;
  }

  if (req.status === "Rejected" || req.status === "Cancelled") {
    showCustomAlert("لا يمكن الموافقة على طلب مرفوض أو ملغي!");
    return;
  }

  req.status = "Approved";
  req.approvedDate = new Date().toISOString();
  if (!req.timeline) req.timeline = [];
  req.timeline.push({
    status: "Approved",
    label: "تمت الموافقة على تحويل المبلغ من قِبل مالك القناة",
    time: new Date().toLocaleString("ar-EG")
  });

  savePayoutRequests(payouts);

  if (window.addNotification) {
    window.addNotification({
      title: "تمت الموافقة على طلب السحب",
      message: `وافقت إدارة المنصة على طلب السحب رقم ${req.id} بمبلغ ${req.amount.toLocaleString()} ج.م`,
      type: "payout",
      link: `#teacher/payouts/details/${req.id}`
    });
  }

  showCustomAlert("تمت الموافقة على طلب السحب بنجاح 👍");

  const currentHash = window.location.hash;
  if (currentHash.includes("details")) {
    renderPayoutsDetails(id);
  } else if (currentHash.includes("history")) {
    renderPayoutsHistory();
  } else {
    renderPayoutsDashboard();
  }
};

window.markWithdrawalAsPaid = function (id) {
  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  if (!isOwnerUser) {
    showCustomAlert("عفواً، هذه الصلاحية مقتصرة حصرياً على مالك القناة / إدارة المنصة!");
    return;
  }

  const payouts = getPayoutRequests();
  const req = payouts.find((p) => p.id === id);

  if (!req) {
    showCustomAlert("عفواً، طلب السحب غير موجود!");
    return;
  }

  if (req.status === "Paid") {
    showCustomAlert("طلب السحب مدفوع بالفعل!");
    return;
  }

  if (req.status === "Rejected" || req.status === "Cancelled") {
    showCustomAlert("لا يمكن تحويل طلب مرفوض أو ملغي!");
    return;
  }

  req.status = "Paid";
  if (!req.approvedDate) req.approvedDate = new Date().toISOString();
  req.paidDate = new Date().toISOString();
  if (!req.timeline) req.timeline = [];
  req.timeline.push({
    status: "Paid",
    label: "تم تحويل المبلغ بنجاح لحساب المحفظة الإلكترونية",
    time: new Date().toLocaleString("ar-EG")
  });

  savePayoutRequests(payouts);

  if (window.addNotification) {
    window.addNotification({
      title: "تم تحويل المستحقات بنجاح",
      message: `تم تحويل مبلغ ${req.amount.toLocaleString()} ج.م إلى محفظتك ${req.walletTypeName} (${req.walletNumber})`,
      type: "payout",
      link: `#teacher/payouts/details/${req.id}`
    });
  }

  showCustomAlert("تم تأكيد تحويل المبلغ ودفع المستحقات بنجاح ✅");

  const currentHash = window.location.hash;
  if (currentHash.includes("details")) {
    renderPayoutsDetails(id);
  } else if (currentHash.includes("history")) {
    renderPayoutsHistory();
  } else {
    renderPayoutsDashboard();
  }
};

window.rejectWithdrawalRequest = async function (id, explicitReason) {
  const isOwnerUser = Boolean(
    (window.PermissionService && window.PermissionService.hasPermission("APPROVE_REJECT_WITHDRAWALS")) ||
    (window.appState && window.appState.userRole === "owner")
  );

  if (!isOwnerUser) {
    showCustomAlert("عفواً، هذه الصلاحية مقتصرة حصرياً على مالك القناة / إدارة المنصة!");
    return;
  }

  const payouts = getPayoutRequests();
  const req = payouts.find((p) => p.id === id);

  if (!req) {
    showCustomAlert("عفواً، طلب السحب غير موجود!");
    return;
  }

  if (req.status === "Paid") {
    showCustomAlert("لا يمكن رفض طلب تم تحويل مبلغه بنجاح!");
    return;
  }

  if (req.status === "Rejected" || req.status === "Cancelled") {
    showCustomAlert("الطلب مرفوض أو ملغي بالفعل!");
    return;
  }

  let reason = explicitReason;
  if (!reason && window.showInputDialog) {
    reason = await window.showInputDialog({
      title: "رفض طلب السحب",
      message: `يرجى تحديد سبب رفض طلب السحب رقم (${req.id}) لتوضيحه للمعلم:`,
      placeholder: "مثال: عدم تطابق اسم صاحب المحفظة مع البيانات المسجلة بالمنصة...",
      confirmText: "تأكيد الرفض",
      cancelText: "تراجع",
      isMultiline: true,
      icon: "❌"
    });
  }

  if (reason === null) {
    return;
  }

  const finalReason = (reason && reason.trim()) ? reason.trim() : "عدم استيفاء شروط السحب";

  req.status = "Rejected";
  req.rejectionReason = finalReason;
  req.notes = `مرفوض من إدارة المنصة: ${finalReason}`;
  if (!req.timeline) req.timeline = [];
  req.timeline.push({
    status: "Rejected",
    label: `تم رفض الطلب من إدارة المنصة (السبب: ${finalReason})`,
    time: new Date().toLocaleString("ar-EG")
  });

  savePayoutRequests(payouts);

  if (window.addNotification) {
    window.addNotification({
      title: "تم رفض طلب السحب",
      message: `تم رفض طلب السحب رقم ${req.id}. السبب: ${finalReason}`,
      type: "payout",
      link: `#teacher/payouts/details/${req.id}`
    });
  }

  showCustomAlert("تم رفض طلب السحب وإعادة المبلغ لرصيد المعلم المتاح");

  const currentHash = window.location.hash;
  if (currentHash.includes("details")) {
    renderPayoutsDetails(id);
  } else if (currentHash.includes("history")) {
    renderPayoutsHistory();
  } else {
    renderPayoutsDashboard();
  }
};

window.toggleUserRoleForTesting = function () {
  if (!window.appState) window.appState = {};
  const currentRole = window.appState.userRole || "teacher";
  const newRole = currentRole === "owner" ? "teacher" : "owner";
  window.appState.userRole = newRole;
  if (window.updateUserState) window.updateUserState();

  const roleName = newRole === "owner" ? "مالك القناة (Owner)" : "المعلم (Teacher)";
  if (window.showSuccessToast) {
    window.showSuccessToast({
      title: "تغيير صلاحية المعاينة",
      message: `أنت تتصفح الصفحة الآن بصفة: ${roleName}`
    });
  } else if (window.showCustomAlert) {
    window.showCustomAlert(`تم التبديل إلى: ${roleName}`);
  }

  const currentHash = window.location.hash;
  if (currentHash.includes("payouts/details")) {
    const parts = currentHash.split("payouts/details/");
    if (parts[1]) openPayoutsDetails(parts[1].split("?")[0].trim());
  } else if (currentHash.includes("payouts/history")) {
    renderPayoutsHistory();
  } else if (currentHash.includes("payouts/wallet")) {
    renderPayoutsWallet();
  } else if (currentHash.includes("payouts/request")) {
    renderPayoutsRequest();
  } else {
    renderPayoutsDashboard();
  }
};

window.handleHistorySearch = function (val) {
  historySearch = val;
  renderPayoutsHistory();
};

window.handleHistoryStatusFilter = function (val) {
  historyStatusFilter = val;
  renderPayoutsHistory();
};

window.handleHistoryWalletFilter = function (val) {
  historyWalletFilter = val;
  renderPayoutsHistory();
};

/**
 * Build clean, self-contained printable receipt HTML string for a payout request
 */
function buildPayoutReceiptHTML(req) {
  if (!req) return "";

  const createdDateStr = req.createdDate ? formatDateShort(req.createdDate) : new Date().toLocaleDateString("ar-EG");
  const txnNo = req.transactionNo || "قيد الإصدار";
  const walletTypeName = req.walletTypeName || "محفظة إلكترونية";
  const walletNumber = req.walletNumber || "—";
  const walletOwner = req.walletOwner || "—";
  const amountStr = (typeof req.amount === "number" ? req.amount : parseFloat(req.amount) || 0).toLocaleString("ar-EG") + " ج.م";
  const netAmountStr = (typeof req.netAmount === "number" ? req.netAmount : parseFloat(req.netAmount) || 0).toLocaleString("ar-EG") + " ج.م";
  const notes = req.notes || req.rejectionReason || "";

  const statusBadgeHTML = renderStatusBadge(req.status);

  const timelineItems = (req.timeline || [])
    .map(
      (step) => `
      <div style="display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-top: 5px; flex-shrink: 0;"></div>
        <div>
          <div style="font-size: 12px; font-weight: 700; color: #1e293b;">${step.label}</div>
          <div style="font-size: 10px; color: #64748b;">${step.time}</div>
        </div>
      </div>
    `
    )
    .join("");

  return `
    <div id="payoutReceiptContainer" dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #ffffff; color: #0f172a; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; width: 100%; max-width: 780px; margin: 0 auto; box-sizing: border-box;">
      <!-- PRINT HEADER BRAND -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 14px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 22px; font-weight: 900; color: #10b981; margin-bottom: 2px;">StudyMart LMS</div>
          <div style="font-size: 12px; color: #64748b;">إيصال معالجة وتحويل مستحقات معلم</div>
        </div>
        <div style="text-align: left;" dir="ltr">
          <div style="font-size: 15px; font-weight: 900; color: #0f172a;">${req.id}</div>
          <div style="font-size: 11px; color: #64748b;">التاريخ: ${createdDateStr}</div>
        </div>
      </div>

      <!-- MAIN CONTENT 2 COLUMNS -->
      <div style="display: flex; gap: 16px; margin-bottom: 20px;">
        <!-- LEFT: AMOUNT & WALLET DETAILS -->
        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px;">
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            💰 بيانات المبلغ والجهة المحول إليها
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b;">رقم المعاملة البنكية / الفنية:</span>
              <strong dir="ltr" style="font-family: monospace;">${txnNo}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b;">المحفظة الإلكترونية:</span>
              <strong>${getWalletIcon(req.walletType)} ${walletTypeName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b;">رقم المحفظة:</span>
              <strong dir="ltr">${walletNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b;">صاحب المحفظة:</span>
              <strong>${walletOwner}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b;">المبلغ المطلوب:</span>
              <strong>${amountStr}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b;">رسوم المعالجة:</span>
              <strong style="color: #10b981;">0 ج.م (مجاناً)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #10b981; padding-top: 6px;">
              <span>الصافي المحول:</span>
              <span>${netAmountStr}</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: STATUS & TIMELINE -->
        <div style="flex: 1; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            <span>📊 حالة الطلب والمخطط الزمني</span>
            <div>${statusBadgeHTML}</div>
          </div>
          <div style="padding-top: 4px;">${timelineItems}</div>
          ${
            notes
              ? `<div style="background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569; margin-top: 10px;">
                  <strong>ملاحظات النظام:</strong> ${notes}
                 </div>`
              : ""
          }
        </div>
      </div>

      <!-- PRINT FOOTER WITH QR CODE SIMULATION -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #64748b;">
        <div>
          منصة StudyMart للتعليم الإلكتروني • كافة الحقوق محفوظة © 2026<br />
          إيصال رسمي معتمد إلكترونياً ولا يحتاج توقيعاً خطياً.
        </div>
        <div style="text-align: center;">
          <div style="width: 50px; height: 50px; border: 1.5px solid #0f172a; padding: 2px; font-size: 8px; text-align: center; line-height: 1.1; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #ffffff;">
            <strong>QR CODE</strong>
            <span style="font-size: 7px; margin-top: 1px;">${req.id}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.printPayoutReceipt = function (requestId) {
  const payouts = getPayoutRequests();
  const req = payouts.find((p) => p.id === requestId);

  if (!req) {
    showCustomAlert("عفواً، لم يتم العثور على طلب السحب المحدد!");
    return;
  }

  const receiptHTML = buildPayoutReceiptHTML(req);

  try {
    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) {
      // If popup window is blocked by browser, fallback to in-page window.print()
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>إيصال سحب مستحقات - ${req.id}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { margin: 0; padding: 20px; background: #ffffff; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .po-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
            .po-badge-pending { background: #fef3c7; color: #d97706; }
            .po-badge-review { background: #e0f2fe; color: #0284c7; }
            .po-badge-approved { background: #e0e7ff; color: #4338ca; }
            .po-badge-paid { background: #d1fae5; color: #059669; }
            .po-badge-rejected { background: #fee2e2; color: #dc2626; }
            .po-badge-cancelled { background: #f1f5f9; color: #64748b; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.error("Print Error:", err);
    window.print();
  }
};

window.downloadPayoutPDF = async function (requestId) {
  const payouts = getPayoutRequests();
  const req = payouts.find((p) => p.id === requestId);

  if (!req) {
    showCustomAlert("عفواً، لم يتم العثور على طلب السحب المحدد!");
    return;
  }

  const btn = document.getElementById(`downloadPdfBtn_${req.id}`) || document.querySelector(`.po-actions button[onclick*="downloadPayoutPDF"]`);
  let originalBtnText = "";
  if (btn) {
    originalBtnText = btn.innerHTML;
    btn.innerHTML = "⏳ جاري تحضير PDF...";
    btn.disabled = true;
  }

  try {
    const receiptHTML = buildPayoutReceiptHTML(req);

    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "780px";
    tempDiv.style.background = "#ffffff";
    tempDiv.innerHTML = `
      <style>
        .po-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
        .po-badge-pending { background: #fef3c7; color: #d97706; }
        .po-badge-review { background: #e0f2fe; color: #0284c7; }
        .po-badge-approved { background: #e0e7ff; color: #4338ca; }
        .po-badge-paid { background: #d1fae5; color: #059669; }
        .po-badge-rejected { background: #fee2e2; color: #dc2626; }
        .po-badge-cancelled { background: #f1f5f9; color: #64748b; }
      </style>
      ${receiptHTML}
    `;
    document.body.appendChild(tempDiv);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `withdrawal-${req.id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    const targetElem = tempDiv.querySelector("#payoutReceiptContainer") || tempDiv;
    await html2pdf().from(targetElem).set(opt).save();

    document.body.removeChild(tempDiv);
    showCustomAlert(`تم تحميل إيصال السحب (${req.id}) بصيغة PDF بنجاح ✅`);
  } catch (err) {
    console.error("PDF Download Error:", err);
    showCustomAlert("حدث خطأ أثناء تحميل ملف PDF. جاري تحويلك لطباعة الإيصال...");
    window.printPayoutReceipt(requestId);
  } finally {
    if (btn) {
      btn.innerHTML = originalBtnText;
      btn.disabled = false;
    }
  }
};

/* =========================================================
   UTILITY HELPERS
   ========================================================= */

function getWalletIcon(type) {
  switch (type) {
    case "vodafone_cash": return "🔴";
    case "orange_cash": return "🟠";
    case "etisalat_cash": return "🟢";
    case "we_pay": return "💜";
    default: return "📱";
  }
}

function renderStatusBadge(status) {
  switch (status) {
    case "Pending":
      return `<span class="po-badge po-badge-pending">⏳ قيد الانتظار</span>`;
    case "Under Review":
      return `<span class="po-badge po-badge-review">🔍 قيد المراجعة</span>`;
    case "Approved":
      return `<span class="po-badge po-badge-approved">👍 مقبول (قيد التحويل)</span>`;
    case "Paid":
      return `<span class="po-badge po-badge-paid">✅ مدفوع وتم التحويل</span>`;
    case "Rejected":
      return `<span class="po-badge po-badge-rejected">❌ مرفوض</span>`;
    case "Cancelled":
      return `<span class="po-badge po-badge-cancelled">🚫 ملغي</span>`;
    default:
      return `<span class="po-badge po-badge-cancelled">${status}</span>`;
  }
}

function formatDateShort(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  } catch (e) {
    return isoString;
  }
}

if (typeof window !== "undefined") {
  window.openPayoutsDashboard = openPayoutsDashboard;
  window.openPayoutsWallet = openPayoutsWallet;
  window.openPayoutsRequest = openPayoutsRequest;
  window.openPayoutsHistory = openPayoutsHistory;
  window.openPayoutsDetails = openPayoutsDetails;
  window.renderPayoutsDashboard = renderPayoutsDashboard;
}

