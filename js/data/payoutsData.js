// Data engine for Payouts & Withdrawals Center (Egyptian Mobile Wallets ONLY)

const WALLETS_STORAGE_KEY = "lms_teacher_wallets_v1";
const PAYOUTS_STORAGE_KEY = "lms_teacher_payouts_v1";

export const ALLOWED_WALLETS = [
  { id: "vodafone_cash", name: "فودافون كاش", code: "010", icon: "🔴", provider: "Vodafone Cash" },
  { id: "orange_cash", name: "أورنج كاش", code: "012", icon: "🟠", provider: "Orange Cash" },
  { id: "etisalat_cash", name: "اتصالات كاش", code: "011", icon: "🟢", provider: "Etisalat Cash" },
  { id: "we_pay", name: "وي باي (WE Pay)", code: "015", icon: "💜", provider: "WE Pay" }
];

const initialWallets = [
  {
    id: "WLT-01",
    walletType: "vodafone_cash",
    walletTypeName: "فودافون كاش",
    number: "01012345678",
    ownerName: "أحمد محمود علي",
    isDefault: true,
    isVerified: true,
    createdDate: "2026-01-15T10:00:00"
  },
  {
    id: "WLT-02",
    walletType: "we_pay",
    walletTypeName: "وي باي (WE Pay)",
    number: "01555443322",
    ownerName: "أحمد محمود علي",
    isDefault: false,
    isVerified: true,
    createdDate: "2026-03-20T14:30:00"
  }
];

const initialPayouts = [
  {
    id: "WDR-2026-901",
    transactionNo: "TXN-EGP-883921",
    teacherName: "د. أحمد محمود علي",
    teacherId: "TCH-101",
    amount: 3500,
    fees: 0,
    netAmount: 3500,
    walletType: "vodafone_cash",
    walletTypeName: "فودافون كاش",
    walletNumber: "01012345678",
    walletOwner: "أحمد محمود علي",
    status: "Paid", // Pending, Under Review, Approved, Paid, Rejected, Cancelled
    createdDate: "2026-07-28T09:30:00",
    approvedDate: "2026-07-28T11:15:00",
    paidDate: "2026-07-28T14:20:00",
    notes: "تم تحويل المبلغ بنجاح عبر فودافون كاش بواسطة إدارة المنصة",
    timeline: [
      { status: "Created", label: "تم إنشاء الطلب", time: "2026-07-28 09:30 AM" },
      { status: "Submitted", label: "تم تقديم الطلب للنظام", time: "2026-07-28 09:30 AM" },
      { status: "Reviewed", label: "تمت مراجعة الطلب مالياً", time: "2026-07-28 10:45 AM" },
      { status: "Approved", label: "تمت الموافقة على تحويل المبلغ", time: "2026-07-28 11:15 AM" },
      { status: "Paid", label: "تم التحويل بنجاح على المحفظة", time: "2026-07-28 02:20 PM" }
    ]
  },
  {
    id: "WDR-2026-902",
    transactionNo: "TXN-EGP-884102",
    teacherName: "م. سارة خالد أحمد",
    teacherId: "TCH-102",
    amount: 1800,
    fees: 0,
    netAmount: 1800,
    walletType: "we_pay",
    walletTypeName: "وي باي (WE Pay)",
    walletNumber: "01555443322",
    walletOwner: "سارة خالد أحمد",
    status: "Approved",
    createdDate: "2026-08-01T16:00:00",
    approvedDate: "2026-08-02T10:00:00",
    paidDate: null,
    notes: "تمت موافقة المالك، والطلب قيد التنفيذ والتحويل الفعلي على شبكة المحفظة",
    timeline: [
      { status: "Created", label: "تم إنشاء الطلب", time: "2026-08-01 04:00 PM" },
      { status: "Submitted", label: "تم تقديم الطلب", time: "2026-08-01 04:00 PM" },
      { status: "Reviewed", label: "تمت المراجعة والتحقق", time: "2026-08-02 09:30 AM" },
      { status: "Approved", label: "تمت الموافقة وفي انتظار ضخ السيولة", time: "2026-08-02 10:00 AM" }
    ]
  },
  {
    id: "WDR-2026-903",
    transactionNo: "TXN-EGP-884219",
    teacherName: "د. عمرو عبد الفتاح",
    teacherId: "TCH-103",
    amount: 2500,
    fees: 0,
    netAmount: 2500,
    walletType: "vodafone_cash",
    walletTypeName: "فودافون كاش",
    walletNumber: "01098765432",
    walletOwner: "عمرو عبد الفتاح",
    status: "Pending",
    createdDate: "2026-08-03T02:15:00",
    approvedDate: null,
    paidDate: null,
    notes: "طلب جديد بانتظار مراجعة وقرار مالك المنصة",
    timeline: [
      { status: "Created", label: "تم إرسال طلب السحب", time: "2026-08-03 02:15 AM" },
      { status: "Submitted", label: "قيد الانتظار لمراجعة الإدارة المالية", time: "2026-08-03 02:15 AM" }
    ]
  },
  {
    id: "WDR-2026-904",
    transactionNo: "TXN-EGP-884350",
    teacherName: "أ. مريم حسن القاضي",
    teacherId: "TCH-104",
    amount: 4200,
    fees: 0,
    netAmount: 4200,
    walletType: "orange_cash",
    walletTypeName: "أورنج كاش",
    walletNumber: "01234567890",
    walletOwner: "مريم حسن القاضي",
    status: "Pending",
    createdDate: "2026-08-05T11:45:00",
    approvedDate: null,
    paidDate: null,
    notes: "طلب سحب جديد بانتظار الاعتماد من مالك المنصة",
    timeline: [
      { status: "Created", label: "تم تقديم طلب السحب", time: "2026-08-05 11:45 AM" },
      { status: "Submitted", label: "قيد المراجعة المالية", time: "2026-08-05 11:45 AM" }
    ]
  }
];

export function getTeacherWallets() {
  const saved = localStorage.getItem(WALLETS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse wallets", e);
    }
  }
  localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(initialWallets));
  return initialWallets;
}

export function saveTeacherWallets(wallets) {
  localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(wallets));
}

export function getPayoutRequests() {
  const saved = localStorage.getItem(PAYOUTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse payout requests", e);
    }
  }
  localStorage.setItem(PAYOUTS_STORAGE_KEY, JSON.stringify(initialPayouts));
  return initialPayouts;
}

export function savePayoutRequests(payouts) {
  localStorage.setItem(PAYOUTS_STORAGE_KEY, JSON.stringify(payouts));
}

/**
 * Calculate Overview Metrics
 */
export function getPayoutsSummary() {
  const payouts = getPayoutRequests();
  const wallets = getTeacherWallets();

  const totalEarnings = 18500; // Total platform earnings for teacher
  const totalWithdrawn = payouts
    .filter((p) => p.status === "Paid")
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingAmount = payouts
    .filter((p) => ["Pending", "Under Review", "Approved"].includes(p.status))
    .reduce((acc, p) => acc + p.amount, 0);

  const availableBalance = totalEarnings - totalWithdrawn - pendingAmount;

  const lastWithdrawal = payouts.find((p) => p.status === "Paid");
  const defaultWallet = wallets.find((w) => w.isDefault) || wallets[0] || null;
  const pendingRequestsCount = payouts.filter((p) => ["Pending", "Under Review"].includes(p.status)).length;

  return {
    totalEarnings,
    totalWithdrawn,
    pendingBalance: pendingAmount,
    availableBalance: availableBalance > 0 ? availableBalance : 0,
    minWithdrawal: 500, // EGP
    lastWithdrawalAmount: lastWithdrawal ? lastWithdrawal.amount : 0,
    lastWithdrawalDate: lastWithdrawal ? lastWithdrawal.paidDate : null,
    defaultWallet,
    pendingRequestsCount,
    walletsCount: wallets.length
  };
}

/**
 * Egyptian Mobile Wallet Phone Validator
 * Validates 11-digit mobile numbers starting with 010, 011, 012, 015
 */
export function validateEgyptianMobileWallet(number) {
  if (!number) return false;
  const cleanNum = number.replace(/\s+/g, "").trim();
  const egWalletRegex = /^01[0125][0-9]{8}$/;
  return egWalletRegex.test(cleanNum);
}

/**
 * Calculate Financial Metrics for Platform Owner
 */
export function getOwnerPayoutsSummary() {
  const payouts = getPayoutRequests();
  const wallets = getTeacherWallets();

  // Total Gross Platform Revenue
  const grossRevenue = 58500;
  const platformFeeShare = Math.round(grossRevenue * 0.10); // 10% Platform fee = 5,850
  const teacherGrossEarnings = grossRevenue - platformFeeShare; // 90% Teacher share = 52,650

  const totalPaid = payouts
    .filter((p) => p.status === "Paid")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalPending = payouts
    .filter((p) => ["Pending", "Under Review"].includes(p.status))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalApproved = payouts
    .filter((p) => p.status === "Approved")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalRejected = payouts
    .filter((p) => p.status === "Rejected")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const totalCancelled = payouts
    .filter((p) => p.status === "Cancelled")
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const treasuryReserves = grossRevenue - totalPaid;

  const teacherNames = new Set();
  payouts.forEach((p) => {
    if (p.teacherName) teacherNames.add(p.teacherName);
    if (p.walletOwner) teacherNames.add(p.walletOwner);
  });
  wallets.forEach((w) => {
    if (w.ownerName) teacherNames.add(w.ownerName);
  });

  const pendingRequestsCount = payouts.filter((p) =>
    ["Pending", "Under Review"].includes(p.status)
  ).length;

  const activeActionableRequestsCount = payouts.filter((p) =>
    ["Pending", "Under Review", "Approved"].includes(p.status)
  ).length;

  return {
    grossRevenue,
    platformFeeShare,
    teacherGrossEarnings,
    totalPaid,
    totalPending,
    totalApproved,
    totalRejected,
    totalCancelled,
    treasuryReserves,
    activeTeachersCount: Math.max(teacherNames.size, 4),
    pendingRequestsCount,
    activeActionableRequestsCount,
    totalRequestsCount: payouts.length
  };
}

