// الملف الرئيسي لإدارة حالة التطبيق وربط الخدمات والمسارات (App Entry Point).
import { initHomePage } from "./pages/home.js";
import * as AuthService from "./services/authService.js";
import * as CourseService from "./services/courseService.js";
import * as BookService from "./services/bookService.js";
import * as CartService from "./services/cartService.js";
import * as DashboardService from "./services/dashboardService.js";
import * as LayoutService from "./services/layoutService.js";
import * as ProfileService from "./services/profileService.js";
import * as PurchasesService from "./services/purchasesService.js";
import * as FavoritesService from "./services/favoritesService.js";
import * as SeoService from "./services/seoService.js";
import {
  openCourseBuilder,
  renderCourseBuilderUI,
} from "./services/courseBuilderService.js";
import { openCourseManagementDashboard } from "./services/courseManagementService.js";
import {
  openBookBuilder,
  renderBookBuilderUI,
} from "./services/bookBuilderService.js";
import { openBookManagementDashboard } from "./services/bookManagementService.js";
import {
  renderQuestionBankPage,
  renderImportQuestionsPage,
  getQuestionBank,
} from "./services/questionBankService.js";
import {
  openAdvancedQuestionEditorModal,
  closeQuestionEditorOverlay,
} from "./services/advancedQuestionEditorService.js";
import * as RevenueTransactionService from "./services/revenueTransactionService.js";
import * as EnrolledStudentsService from "./services/enrolledStudentsService.js";
import * as StudentReviewsService from "./services/studentReviewsService.js";
import * as MessageCenterService from "./services/messageCenterService.js";
import * as PayoutsService from "./services/payoutsService.js";
import { openHomepageManagement } from "./services/homepageManagementService.js";
import {
  openOwnerStudentsManagement,
  openOwnerStudentDetailPage,
} from "./services/ownerStudentsService.js";
import {
  openOwnerTeachersManagement,
  openOwnerTeacherDetailPage,
} from "./services/ownerTeachersService.js";
import { openOwnerFreeAccess } from "./services/ownerFreeAccessService.js";
import { showCustomAlert } from "./utils/helpers.js";
import {
  setupBooks,
  renderBooks,
  filterStandaloneBooks,
} from "./components/books.js";
import { booksData } from "./data/books.js";
import { isOwner, isTeacher, isStudent } from "./services/permissionService.js";
import {
  initSidebarManager,
  updateSidebarActiveNavigation,
} from "./services/sidebarService.js";
import {
  initNavigationHistory,
  handleGlobalBack,
  updateGlobalBackUI,
} from "./services/navigationHistoryService.js";

// وحدة خدمة الدفع المحملة ديناميكياً عند الحاجة
let paymentServiceModule = null;

// التحقق من تحميل وحدة خدمة الدفع ديناميكياً
async function ensurePaymentService() {
  if (paymentServiceModule) return paymentServiceModule;

  try {
    paymentServiceModule = await import("./services/paymentService.js");
  } catch (error) {
    console.error("فشل في تحميل وحدة الدفع", error);
    paymentServiceModule = null;
  }

  return paymentServiceModule;
}

// الحالة العامة للتطبيق (Global App State)
window.appState = {
  cart: [],
  isLoggedIn: false,
  userRole: "student",
  userData: {
    name: "Eslam Adel",
    email: "student@gmail.com",
    image: "",
    courses: [],
  },
  userPurchasedBooks: [],
  userCourses: [],
  userTeacherCourses: [],
  selectedCourseVideo: null,
  selectedCourseImage: null,
  selectedCourseDescription: null,
  selectedCourseLevel: null,
  newBookFile: null,
  newBookCover: null,
};

// ربط خدمات المصادقة بالواجهة العالمية
window.showLogin = AuthService.showLogin;
window.showRegister = AuthService.showRegister;
window.switchToLogin = AuthService.switchToLogin;
window.switchToRegister = AuthService.switchToRegister;
window.handleLogin = AuthService.handleLogin;
window.handleOAuth = AuthService.handleGoogleSignIn;
window.handleGoogleSignIn = AuthService.handleGoogleSignIn;
window.handleGoogleEmailSelectionForRegistration =
  AuthService.handleGoogleEmailSelectionForRegistration;
window.togglePasswordVisibility = AuthService.togglePasswordVisibility;
window.handleForgotPassword = AuthService.handleForgotPassword;
window.redirectToLoginWithEmail = AuthService.redirectToLoginWithEmail;
window.resetRegisterFlow = AuthService.resetRegisterFlow;
window.selectRoleCard = AuthService.selectRoleCard;
window.validateRegistrationForm = AuthService.validateRegistrationForm;
window.sanitizePhoneInput = AuthService.sanitizePhoneInput;
window.handleRegisterSubmit = AuthService.handleRegisterSubmit;
window.toggleProfile = AuthService.toggleProfile;
window.showUserProfile = ProfileService.renderProfilePage;
window.renderProfilePage = ProfileService.renderProfilePage;
window.triggerEditProfileImageUpload =
  ProfileService.triggerEditProfileImageUpload;
window.handleEditProfileImageChange =
  ProfileService.handleEditProfileImageChange;
window.cancelEditProfile = ProfileService.cancelEditProfile;
window.saveEditProfile = ProfileService.saveEditProfile;
window.handleChangePassword = ProfileService.handleChangePassword;
window.handleNewPasswordInput = ProfileService.handleNewPasswordInput;
window.handleConfirmPasswordInput = ProfileService.handleConfirmPasswordInput;
window.saveProfile = AuthService.saveProfile;
window.closeUserProfile = AuthService.closeUserProfile;
window.handleLogout = AuthService.handleLogout;

// ربط لوحة التحكم بالواجهة العالمية
window.showDashboard = DashboardService.showDashboard;
window.openStudentPurchasesChoice = PurchasesService.renderPurchasesPage;
window.renderPurchasesPage = PurchasesService.renderPurchasesPage;
window.renderFavoritesPage = FavoritesService.renderFavoritesPage;
window.openMyBooks = BookService.renderMyBooksPage;
window.renderMyBooksPage = BookService.renderMyBooksPage;
window.renderBookReaderPage = BookService.renderBookReaderPage;
window.openBookReader = BookService.openBookReader;
window.showBookDetails = BookService.showBookDetails;
window.openBookPreview = BookService.openBookPreview;
window.closeMyBooksModal = DashboardService.closeMyBooksModal;
window.openBook = DashboardService.openBook;
window.saveBook = DashboardService.saveBook;
window.closeStudentPurchasesChoice =
  DashboardService.closeStudentPurchasesChoice;
window.openMyCourses = CourseService.openMyCourses;
window.renderMyCoursesPage = CourseService.renderMyCoursesPage;
window.openAddCourse = DashboardService.openAddCourse;
window.openTeacherChoice = DashboardService.openTeacherChoice;
window.openCourseBuilder = openCourseBuilder;
window.renderCourseBuilderUI = renderCourseBuilderUI;
window.openCourseManagementDashboard = openCourseManagementDashboard;
window.openBookBuilder = openBookBuilder;
window.renderBookBuilderUI = renderBookBuilderUI;
window.openBookManagementDashboard = openBookManagementDashboard;
window.renderQuestionBankPage = renderQuestionBankPage;
window.getQuestionBank = getQuestionBank;
window.openQuestionBankModal = renderQuestionBankPage;
window.renderImportQuestionsPage = renderImportQuestionsPage;
window.openAdvancedQuestionEditorModal = openAdvancedQuestionEditorModal;
window.openAddBook = DashboardService.openAddBook;
window.handleAddBook = DashboardService.handleAddBook;
window.addNewCourse = DashboardService.addNewCourse;
window.closeDashboard = DashboardService.closeDashboard;

// ربط خدمات الدورات والسلة والمفضلة
window.showCourseDetails = CourseService.showCourseDetails;
window.returnToCourseList = CourseService.returnToCourseList;
window.restoreCourseListState = CourseService.restoreCourseListState;
window.navigateToHome = CourseService.navigateToHome;
window.addToCart = CourseService.addToCart;
window.addBookToCart = CourseService.addBookToCart;
window.closeCourseModal = CourseService.closeCourseModal;
window.rateCourse = CourseService.rateCourse;
window.toggleWishlist = CourseService.toggleWishlist;
window.shareCourse = CourseService.shareCourse;
window.toggleAccordion = CourseService.toggleAccordion;
window.showPurchases = CourseService.showPurchases;
window.closePurchases = CourseService.closePurchases;
window.continueCourse = CourseService.continueCourse;
window.filterMyCoursesTab = CourseService.filterMyCoursesTab;
window.searchMyCourses = CourseService.searchMyCourses;
window.resetMyCoursesSearch = CourseService.resetMyCoursesSearch;
window.handleMyCoursesSearchKeydown =
  CourseService.handleMyCoursesSearchKeydown;
window.sortMyCourses = CourseService.sortMyCourses;
window.playCurrentCourse = CourseService.playCurrentCourse;
window.scrollToCourseDetails = CourseService.scrollToCourseDetails;
window.toggleLessonAccordion = CourseService.toggleLessonAccordion;
window.toggleCart = CartService.toggleCart;
window.checkout = CartService.checkout;
window.closeCheckout = CartService.closeCheckout;

// ربط طريقة الدفع الديناميكية
window.openPaymentMethods = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.openPaymentMethods?.(...args),
  );
};
window.payByCard = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.payByCard?.(...args),
  );
};
window.payByVodafone = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.payByVodafone?.(...args),
  );
};
window.finalizeCardPayment = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.finalizeCardPayment?.(...args),
  );
};
window.finalizeVodafonePayment = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.finalizeVodafonePayment?.(...args),
  );
};
window.clearFakeCardNumber = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.clearFakeCardNumber?.(...args),
  );
};
window.restoreFakeCardNumber = function (...args) {
  return ensurePaymentService().then((service) =>
    service?.restoreFakeCardNumber?.(...args),
  );
};

// أدوات التصفح والمظهر العام
window.updateProfileImage = AuthService.updateProfileImage;
window.updateUserState = AuthService.updateUserState;
window.setupAuth = AuthService.setupAuth;
window.showCustomAlert = showCustomAlert;
window.filterCourses = CourseService.filterCourses;
window.filterStandaloneCourses =
  CourseService.filterStandaloneCourses || window.filterStandaloneCourses;
window.filterStandaloneBooks =
  filterStandaloneBooks || window.filterStandaloneBooks;
window.filterByCategory = LayoutService.filterByCategory;
window.filterByLevel = LayoutService.filterByLevel;
window.handleHeroSearch = LayoutService.handleHeroSearch;
window.handleHeroSearchSubmit = LayoutService.handleHeroSearchSubmit;
window.searchByTeacher = LayoutService.searchByTeacher;
window.handleNewsletterSubmit = LayoutService.handleNewsletterSubmit;
window.toggleTheme = LayoutService.toggleTheme;
window.showHomePage = LayoutService.showHomePage;
window.showCoursesPage = LayoutService.showCoursesPage;
window.showBooksPage = LayoutService.showBooksPage;
window.scrollToSection = LayoutService.scrollToSection;
window.showHomeSection = LayoutService.showHomeSection;
window.closeAuth = AuthService.closeAuth;
window.renderFavoritesPage = FavoritesService.renderFavoritesPage;
window.filterFavoritesTab = FavoritesService.filterFavoritesTab;
window.renderBooks = renderBooks;
window.booksData = booksData;

// Enrolled Students Module Window Bindings
window.openEnrolledStudentsPage =
  EnrolledStudentsService.openEnrolledStudentsPage;
window.openStudentDetailPage = EnrolledStudentsService.openStudentDetailPage;
window.handleStudentSearch = EnrolledStudentsService.handleStudentSearch;
window.handleStudentCourseFilter =
  EnrolledStudentsService.handleStudentCourseFilter;
window.handleStudentBookFilter =
  EnrolledStudentsService.handleStudentBookFilter;
window.handleStudentCountryFilter =
  EnrolledStudentsService.handleStudentCountryFilter;
window.handleStudentProgressFilter =
  EnrolledStudentsService.handleStudentProgressFilter;
window.handleStudentStatusFilter =
  EnrolledStudentsService.handleStudentStatusFilter;
window.handleStudentSort = EnrolledStudentsService.handleStudentSort;
window.changeStudentPage = EnrolledStudentsService.changeStudentPage;
window.promptAddNote = EnrolledStudentsService.promptAddNote;
window.promptSendMessage = EnrolledStudentsService.promptSendMessage;
window.handleGenerateCert = EnrolledStudentsService.handleGenerateCert;
window.handleToggleBlock = EnrolledStudentsService.handleToggleBlock;
window.exportStudentsCSV = EnrolledStudentsService.exportStudentsCSV;
window.exportStudentsExcel = EnrolledStudentsService.exportStudentsExcel;
window.printStudentReport = EnrolledStudentsService.printStudentReport;
window.toggleStudentActionMenu =
  EnrolledStudentsService.toggleStudentActionMenu;
window.closeAllStudentActionMenus =
  EnrolledStudentsService.closeAllStudentActionMenus;
window.handleStudentMenuAction =
  EnrolledStudentsService.handleStudentMenuAction;
window.toggleStudentMessageMenu =
  EnrolledStudentsService.toggleStudentMessageMenu;
window.handleStudentMessageAction =
  EnrolledStudentsService.handleStudentMessageAction;

// Student Reviews Module Window Bindings
window.openStudentReviewsPage = StudentReviewsService.openStudentReviewsPage;
window.openReviewDetailPage = StudentReviewsService.openReviewDetailPage;
window.handleReviewSearch = StudentReviewsService.handleReviewSearch;
window.handleReviewCourseFilter =
  StudentReviewsService.handleReviewCourseFilter;
window.handleReviewBookFilter = StudentReviewsService.handleReviewBookFilter;
window.handleReviewStarsFilter = StudentReviewsService.handleReviewStarsFilter;
window.handleReviewReplyFilter = StudentReviewsService.handleReviewReplyFilter;
window.handleReviewSort = StudentReviewsService.handleReviewSort;
window.changeReviewPage = StudentReviewsService.changeReviewPage;
window.promptReplyToReview = StudentReviewsService.promptReplyToReview;
window.handleTogglePinReview = StudentReviewsService.handleTogglePinReview;
window.handleDeleteReview = StudentReviewsService.handleDeleteReview;
window.exportReviewsCSV = StudentReviewsService.exportReviewsCSV;
window.exportReviewsExcel = StudentReviewsService.exportReviewsExcel;
window.toggleReviewActionMenu = StudentReviewsService.toggleReviewActionMenu;
window.closeAllReviewActionMenus =
  StudentReviewsService.closeAllReviewActionMenus;
window.handleReviewMenuAction = StudentReviewsService.handleReviewMenuAction;
window.printReviewDocument = StudentReviewsService.printReviewDocument;

// Message Center Module Window Bindings
window.openMessageCenterPage = MessageCenterService.openMessageCenterPage;

// Payouts & Withdrawals Center Module Window Bindings
window.openPayoutsDashboard = PayoutsService.openPayoutsDashboard;
window.openPayoutsWallet = PayoutsService.openPayoutsWallet;
window.openPayoutsRequest = PayoutsService.openPayoutsRequest;
window.openPayoutsHistory = PayoutsService.openPayoutsHistory;
window.openPayoutsDetails = PayoutsService.openPayoutsDetails;

// إدارة حماية المسارات وحسب دور المستخدم (Student / Teacher)
function handleRoleRouteProtection() {
  let hash = window.location.hash || "";
  const path = window.location.pathname || "";
  const search = window.location.search || "";

  // Normalize route if hash is missing but path is provided
  if (
    (!hash || hash === "#" || hash === "#/") &&
    path &&
    path !== "/" &&
    path !== "/index.html"
  ) {
    hash = "#" + path.replace(/^\//, "") + search;
  }

  // Update active navigation styling in sidebar
  updateSidebarActiveNavigation();

  const isLoggedIn = window.appState?.isLoggedIn;
  const userRole = window.appState?.userRole || "student";

  // 1. Standalone Books Page
  if (
    hash === "#books" ||
    hash === "#/books" ||
    hash === "#standaloneBooksPage"
  ) {
    LayoutService.showBooksPage();
    return;
  }

  // 2. Standalone Courses Page
  if (
    hash === "#courses" ||
    hash === "#/courses" ||
    hash === "#coursesSection" ||
    hash === "#coursesList" ||
    hash === "#standaloneCoursesPage"
  ) {
    LayoutService.showCoursesPage();
    return;
  }

  // Dedicated Public Reviews Page (Accessible to ALL users: Guest, Student, Teacher, Owner, Admin)
  if (
    hash === "#reviews" ||
    hash === "#/reviews" ||
    hash === "#public-reviews" ||
    hash === "#reviewsPage" ||
    hash === "#all-reviews"
  ) {
    LayoutService.showPublicReviewsPage();
    return;
  }

  // 3. Contact Section
  if (
    hash === "#contactFooter" ||
    hash === "#contact" ||
    hash === "#/contact"
  ) {
    LayoutService.scrollToSection("contact");
    return;
  }

  // 4. Course Details
  if (hash.includes("course-details") || hash.includes("course/details")) {
    const parts = hash.split("course-details/");
    if (parts.length > 1 && parts[1].trim()) {
      const courseId = parts[1].split("?")[0].trim();
      CourseService.showCourseDetails(courseId);
    } else {
      const urlParams = new URLSearchParams(hash.split("?")[1] || "");
      const courseId = urlParams.get("id");
      if (courseId) {
        CourseService.showCourseDetails(courseId);
      } else {
        LayoutService.showCoursesPage();
      }
    }
    return;
  }

  // 5. Book Details
  if (hash.includes("book-details") || hash.includes("book/details")) {
    let bookId = "";
    if (hash.includes("book-details/")) {
      bookId = hash.split("book-details/")[1].split("?")[0].trim();
    } else if (hash.includes("book/details/")) {
      bookId = hash.split("book/details/")[1].split("?")[0].trim();
    } else {
      const urlParams = new URLSearchParams(hash.split("?")[1] || "");
      bookId = urlParams.get("id");
    }
    if (bookId) {
      BookService.showBookDetails(bookId);
    } else {
      LayoutService.showBooksPage();
    }
    return;
  }

  // Helper check for teacher dashboard sub-routes
  function isTeacherDashboardSubRoute(h) {
    const after = h
      .replace(/^#\/?teacher\/?/, "")
      .split("?")[0]
      .trim();
    if (!after) return true;
    return [
      "dashboard",
      "profile",
      "courses",
      "course",
      "books",
      "book",
      "management",
      "students",
      "reviews",
      "messages",
      "payouts",
      "revenue",
      "transactions",
      "course-builder",
      "book-builder",
      "question-bank",
      "questions",
      "homepage-management",
    ].some((sub) => after.startsWith(sub));
  }

  // 6. Teacher Profile / Details Page
  if (
    hash.includes("teacher-profile") ||
    hash.includes("teachers/") ||
    (hash.startsWith("#teacher/") && !isTeacherDashboardSubRoute(hash))
  ) {
    let teacherKey = "";
    if (hash.includes("teacher-profile/")) {
      teacherKey = hash.split("teacher-profile/")[1].split("?")[0].trim();
    } else if (hash.includes("teachers/")) {
      teacherKey = hash.split("teachers/")[1].split("?")[0].trim();
    } else if (hash.includes("teacher/")) {
      const after = hash.split("teacher/")[1].split("?")[0].trim();
      if (
        after &&
        ![
          "dashboard",
          "profile",
          "courses",
          "course",
          "books",
          "book",
          "management",
          "students",
          "reviews",
          "messages",
          "payouts",
          "revenue",
          "transactions",
          "course-builder",
          "book-builder",
          "question-bank",
          "questions",
          "homepage-management",
        ].includes(after.split("/")[0])
      ) {
        teacherKey = after;
      }
    }

    if (teacherKey) {
      CourseService.showTeacherProfilePage(decodeURIComponent(teacherKey));
      return;
    }
  }

  // 7. My Books Page (Student)
  if (
    hash.includes("my-books") ||
    hash.includes("mybooks") ||
    hash.includes("student/books")
  ) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
      AuthService.showLogin();
      return;
    }
    BookService.renderMyBooksPage();
    return;
  }

  // 8. Book Reader Page
  if (hash.includes("reader") || hash.includes("book-reader")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
      AuthService.showLogin();
      return;
    }
    const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
    let bookId = "";
    let page = null;
    if (cleanHash.includes("reader/")) {
      const parts = cleanHash.split("reader/");
      if (parts.length > 1 && parts[1].trim()) {
        const pathAndQuery = parts[1].split("?");
        bookId = pathAndQuery[0].trim();
        if (pathAndQuery.length > 1) {
          const urlParams = new URLSearchParams(pathAndQuery[1]);
          page = urlParams.get("page");
        }
      }
    } else {
      const urlParams = new URLSearchParams(cleanHash.split("?")[1] || "");
      bookId = urlParams.get("id");
      page = urlParams.get("page");
    }
    BookService.renderBookReaderPage(bookId, page);
    return;
  }

  // 9. My Courses Page (Student)
  if (
    hash.includes("my-courses") ||
    hash.includes("mycourses") ||
    hash.includes("student/courses")
  ) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
      AuthService.showLogin();
      return;
    }
    CourseService.renderMyCoursesPage();
    return;
  }

  // 10. Favorites / Wishlist Page
  if (hash.includes("favorites") || hash.includes("wishlist")) {
    FavoritesService.renderFavoritesPage();
    return;
  }

  // 11. Purchases / Orders Page
  if (hash.includes("purchases") || hash.includes("orders")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
      AuthService.showLogin();
      return;
    }
    PurchasesService.renderPurchasesPage();
    return;
  }

  // 12. Homepage Management (Owner)
  if (
    hash.includes("homepage-management") ||
    hash.includes("owner/homepage-management")
  ) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى إدارة الصفحة الرئيسية");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      showCustomAlert(
        "عذراً، صفحة إدارة الصفحة الرئيسية مخصصة فقط لمالك المنصة (Platform Owner).",
      );
      window.location.hash = "#teacher/dashboard";
      return;
    }
    openHomepageManagement();
    return;
  }

  // Owner Student Details
  if (
    hash.includes("owner/student-details") ||
    hash.includes("owner/students/details")
  ) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى تفاصيل الطالب");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      showCustomAlert(
        "عذراً، هذه الصفحة مخصصة فقط لمالك المنصة (Platform Owner).",
      );
      window.location.hash = "#teacher/dashboard";
      return;
    }
    const urlParams = new URLSearchParams(hash.split("?")[1] || "");
    const studentId = urlParams.get("id");
    if (studentId) {
      openOwnerStudentDetailPage(studentId);
    } else {
      openOwnerStudentsManagement();
    }
    return;
  }

  // Owner Students Management
  if (hash.includes("owner/students") || hash.includes("owner-students")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى إدارة الطلاب");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      showCustomAlert(
        "عذراً، هذه الصفحة مخصصة فقط لمالك المنصة (Platform Owner).",
      );
      window.location.hash = "#teacher/dashboard";
      return;
    }
    openOwnerStudentsManagement();
    return;
  }

  // Owner Teacher Details
  if (
    hash.includes("owner/teacher-details") ||
    hash.includes("owner/teachers/details")
  ) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى تفاصيل المعلم");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      showCustomAlert(
        "عذراً، هذه الصفحة مخصصة فقط لمالك المنصة (Platform Owner).",
      );
      window.location.hash = "#teacher/dashboard";
      return;
    }
    const urlParams = new URLSearchParams(hash.split("?")[1] || "");
    const teacherId = urlParams.get("id");
    if (teacherId) {
      openOwnerTeacherDetailPage(teacherId);
    } else {
      openOwnerTeachersManagement();
    }
    return;
  }

  // Owner Teachers Management
  if (hash.includes("owner/teachers") || hash.includes("owner-teachers")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى إدارة المعلمين");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      showCustomAlert(
        "عذراً، هذه الصفحة مخصصة فقط لمالك المنصة (Platform Owner).",
      );
      window.location.hash = "#teacher/dashboard";
      return;
    }
    openOwnerTeachersManagement();
    return;
  }

  // Owner Free Access Activation
  if (hash.includes("owner/free-access") || hash.includes("free-access")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى صفحة تفعيل المحتوى للطلاب");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      showCustomAlert(
        "عذراً، هذه الصفحة مخصصة فقط لمالك المنصة (Platform Owner).",
      );
      window.location.hash = "#teacher/dashboard";
      return;
    }
    openOwnerFreeAccess();
    return;
  }

  // 13. Profile / Settings Page
  if (hash.includes("profile") || hash.includes("settings")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
      AuthService.showLogin();
      return;
    }
    if (!isOwner(userRole)) {
      if (hash.includes("teacher") && userRole !== "teacher") {
        showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين فقط.");
        window.location.hash = "#student/profile";
        ProfileService.renderProfilePage();
        return;
      }
      if (hash.includes("student") && userRole !== "student") {
        showCustomAlert("عذراً، هذه الصفحة مخصصة للطلاب فقط.");
        window.location.hash = "#teacher/profile";
        ProfileService.renderProfilePage();
        return;
      }
    }
    ProfileService.renderProfilePage();
    return;
  }

  // 14. Teacher Dashboard Routes
  if (
    hash.includes("teacher") ||
    hash.includes("course-builder") ||
    hash.includes("book-builder") ||
    hash.includes("books/manage") ||
    hash.includes("books/new") ||
    hash.includes("books/edit") ||
    hash.includes("question")
  ) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى لوحة المعلم");
      AuthService.showLogin();
      return;
    }
    if (!isTeacher(userRole)) {
      showCustomAlert("عذراً، هذه الصفحة مخصصة للمعلمين والمالك فقط.");
      window.location.hash = "#home";
      showHomeSection("home");
      return;
    }

    if (hash.includes("question-bank") || hash.includes("questions/bank")) {
      closeQuestionEditorOverlay();
      renderQuestionBankPage();
    } else if (hash.includes("questions/import")) {
      closeQuestionEditorOverlay();
      renderImportQuestionsPage();
    } else if (
      hash.includes("questions/new") ||
      hash.includes("questions/edit")
    ) {
      const urlParams = new URLSearchParams(hash.split("?")[1] || "");
      const qId = urlParams.get("id");
      if (qId) {
        const bank = getQuestionBank();
        const existingQ = bank.find((q) => q.id === qId);
        openAdvancedQuestionEditorModal(existingQ || null);
      } else {
        openAdvancedQuestionEditorModal(null);
      }
    } else if (
      hash.includes("course-builder") ||
      hash.includes("courses/new")
    ) {
      const urlParams = new URLSearchParams(hash.split("?")[1] || "");
      const courseId = urlParams.get("id");
      openCourseBuilder(courseId);
    } else if (
      hash.includes("book-builder") ||
      hash.includes("books/new") ||
      hash.includes("books/edit")
    ) {
      const urlParams = new URLSearchParams(hash.split("?")[1] || "");
      const bookId = urlParams.get("id");
      openBookBuilder(bookId);
    } else if (hash.includes("students")) {
      const parts = hash.split("students/");
      if (parts.length > 1 && parts[1].trim() && !parts[1].startsWith("?")) {
        const studentId = parts[1].split("?")[0].trim();
        const detailPage = document.getElementById("studentDetailPage");
        const isAlreadyOpen =
          detailPage && !detailPage.classList.contains("hidden");
        EnrolledStudentsService.openStudentDetailPage(studentId, {
          preserveScroll: isAlreadyOpen,
        });
      } else {
        const urlParams = new URLSearchParams(hash.split("?")[1] || "");
        const studentId = urlParams.get("id");
        if (studentId) {
          const detailPage = document.getElementById("studentDetailPage");
          const isAlreadyOpen =
            detailPage && !detailPage.classList.contains("hidden");
          EnrolledStudentsService.openStudentDetailPage(studentId, {
            preserveScroll: isAlreadyOpen,
          });
        } else {
          EnrolledStudentsService.openEnrolledStudentsPage();
        }
      }
    } else if (hash.includes("reviews")) {
      const parts = hash.split("reviews/");
      if (parts.length > 1 && parts[1].trim() && !parts[1].startsWith("?")) {
        const reviewId = parts[1].split("?")[0].trim();
        StudentReviewsService.openReviewDetailPage(reviewId);
      } else {
        const urlParams = new URLSearchParams(hash.split("?")[1] || "");
        const reviewId = urlParams.get("id");
        if (reviewId) {
          StudentReviewsService.openReviewDetailPage(reviewId);
        } else {
          StudentReviewsService.openStudentReviewsPage();
        }
      }
    } else if (hash.includes("messages")) {
      const cleanHash = hash.startsWith("#") ? hash.substring(1) : hash;
      const parts = cleanHash.split("messages/");
      if (parts.length > 1 && parts[1].trim()) {
        const routePath = parts[1].split("?")[0];
        const pathTokens = routePath.split("/").filter((t) => t.trim());
        const convId = pathTokens[0] || null;
        const msgId = pathTokens.length > 1 ? pathTokens[1] : null;
        MessageCenterService.openMessageCenterPage(convId, msgId);
      } else {
        const urlParams = new URLSearchParams(cleanHash.split("?")[1] || "");
        const convId = urlParams.get("id");
        const msgId = urlParams.get("msgId");
        MessageCenterService.openMessageCenterPage(convId, msgId);
      }
    } else if (hash.includes("payouts/wallet")) {
      PayoutsService.openPayoutsWallet();
    } else if (hash.includes("payouts/request")) {
      PayoutsService.openPayoutsRequest();
    } else if (hash.includes("payouts/history")) {
      PayoutsService.openPayoutsHistory();
    } else if (hash.includes("payouts/details")) {
      const parts = hash.split("payouts/details/");
      if (parts.length > 1 && parts[1].trim() && !parts[1].startsWith("?")) {
        const reqId = parts[1].split("?")[0].trim();
        PayoutsService.openPayoutsDetails(reqId);
      } else {
        const urlParams = new URLSearchParams(hash.split("?")[1] || "");
        const reqId = urlParams.get("id");
        if (reqId) {
          PayoutsService.openPayoutsDetails(reqId);
        } else {
          PayoutsService.openPayoutsHistory();
        }
      }
    } else if (hash.includes("payouts")) {
      PayoutsService.openPayoutsDashboard();
    } else if (hash.includes("revenue")) {
      RevenueTransactionService.openRevenueDashboard();
    } else if (hash.includes("transactions/detail")) {
      const urlParams = new URLSearchParams(hash.split("?")[1] || "");
      const txId = urlParams.get("id");
      RevenueTransactionService.openTransactionDetailPage(txId);
    } else if (hash.includes("transactions")) {
      RevenueTransactionService.openTransactionHistory();
    } else if (hash.includes("books/manage") || hash.includes("books")) {
      openBookManagementDashboard();
    } else {
      openCourseManagementDashboard();
    }
    return;
  }

  // 15. Student General Route (#student / #student/dashboard)
  if (hash.includes("student")) {
    if (!isLoggedIn) {
      showCustomAlert("يرجى تسجيل الدخول للوصول إلى لوحة الطالب");
      AuthService.showLogin();
      return;
    }
    CourseService.renderMyCoursesPage();
    return;
  }

  // 16. Home Route (Only matched when hash is explicitly #home, #/home, #, or empty string)
  if (
    hash === "#home" ||
    hash === "#/home" ||
    hash === "" ||
    hash === "#" ||
    hash === "#/"
  ) {
    LayoutService.showHomePage();
    return;
  }

  // Default fallback for any unhandled empty hash
  if (!hash || hash === "#") {
    LayoutService.showHomePage();
  }
}

// الاستماع لتغير المسارات
window.addEventListener("hashchange", handleRoleRouteProtection);
window.addEventListener("popstate", handleRoleRouteProtection);

// التهيئة الأولية للتطبيق عند التحميل
const initializeApp = async () => {
  initNavigationHistory();
  initSidebarManager();
  setupBooks();
  LayoutService.setupLayout();
  AuthService.setupAuth();
  DashboardService.setupDashboardBindings();

  try {
    const paymentService = await ensurePaymentService();
    paymentService?.setupPaymentBindings?.();
  } catch (error) {
    console.error("فشل في تهيئة ربط عمليات الدفع", error);
  }

  CourseService.loadUserPurchases();
  CourseService.updateCertificateButtonsInCards?.();
  FavoritesService.updateAllHeartButtonsUI();
  window.openHomepageManagement = openHomepageManagement;
  window.openOwnerFreeAccess = openOwnerFreeAccess;
  await initHomePage();
  SeoService.setupSeoModal();
  handleRoleRouteProtection();
};

// تشغيل التهيئة
void initializeApp().catch((error) => {
  console.error("فشل في تهيئة التطبيق", error);
});
