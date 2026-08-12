import { saveLocalStorage, showCustomAlert } from "../utils/helpers.js";
import { filterCourses, restoreCourseListState } from "./courseService.js";

export function updateNavbarPadding() {
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const height = navbar.offsetHeight;
    if (height > 0) {
      document.documentElement.style.setProperty("--navbar-height", `${height}px`);
      document.body.style.paddingTop = `${height}px`;
    }

    if (typeof window !== "undefined" && window.ResizeObserver && !navbar.dataset.resizeObserved) {
      navbar.dataset.resizeObserved = "true";
      const ro = new ResizeObserver(() => {
        updateNavbarPadding();
      });
      ro.observe(navbar);
    }
  }
}

export function setupLayout() {
  const splash = document.getElementById("splash-screen");
  const modalOverlay = document.getElementById("modal-overlay");

  updateNavbarPadding();
  window.addEventListener("resize", updateNavbarPadding);
  window.addEventListener("orientationchange", updateNavbarPadding);
  setTimeout(updateNavbarPadding, 100);
  setTimeout(updateNavbarPadding, 500);

  if (splash) {
    const SPLASH_DURATION = 2555;
    setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => {
        splash.remove();
      }, 1000);
    }, SPLASH_DURATION);
  }

  if (modalOverlay && !modalOverlay.dataset.bound) {
    modalOverlay.dataset.bound = "true";
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) {
        modalOverlay.style.display = "none";
        const content = document.getElementById("modal-content");
        if (content) content.innerHTML = "";
      }
    });
  }

  // Initial layout state: Home view (Courses shown, Books hidden)
  showHomeSection("home");
}

export function hideAllMainSections() {
  document.querySelectorAll(".home-section").forEach((sec) => sec.classList.add("hidden"));

  const sectionsToHide = [
    document.querySelector(".hero"),
    document.querySelector(".features"),
    document.getElementById("coursesSection") || document.querySelector(".courses"),
    document.getElementById("books"),
    document.getElementById("standaloneCoursesPage"),
    document.getElementById("standaloneBooksPage"),
    document.getElementById("contactFooter"),
    document.getElementById("editProfilePage"),
    document.getElementById("myCoursesPage"),
    document.getElementById("myBooksPage"),
    document.getElementById("bookReaderPage"),
    document.getElementById("purchasesPage"),
    document.getElementById("favoritesPage"),
    document.getElementById("homepageManagementPage"),
    document.getElementById("teacherManagementPage"),
    document.getElementById("courseBuilderPage"),
    document.getElementById("teacherProfilePage"),
    document.getElementById("courseDetailsPage"),
    document.getElementById("bookDetailsPage"),
    document.getElementById("bookEditorPage"),
    document.getElementById("bookManagementPage"),
    document.getElementById("bookBuilderPage"),
    document.getElementById("questionBankPage"),
    document.getElementById("questionEditorPage"),
    document.getElementById("quizQuestionSelectorPage"),
    document.getElementById("importQuestionsPage"),
    document.getElementById("quizStatsPage"),
    document.getElementById("assignmentRubricPage"),
    document.getElementById("assignmentSubmissionsPage"),
    document.getElementById("assignmentStatsPage"),
    document.getElementById("studentQuizPage"),
    document.getElementById("studentAssignmentPage"),
    document.getElementById("checkoutPage"),
    document.getElementById("seoArticlesPage"),
    document.getElementById("studentDashboardPage"),
    document.getElementById("revenueDashboardPage"),
    document.getElementById("transactionHistoryPage"),
    document.getElementById("transactionDetailPage"),
    document.getElementById("enrolledStudentsPage"),
    document.getElementById("studentDetailPage"),
    document.getElementById("publicReviewsPage"),
    document.getElementById("studentReviewsPage"),
    document.getElementById("reviewDetailPage"),
    document.getElementById("messageCenterPage"),
    document.getElementById("payoutsDashboardPage"),
    document.getElementById("payoutsWalletPage"),
    document.getElementById("payoutsRequestPage"),
    document.getElementById("payoutsHistoryPage"),
    document.getElementById("payoutsDetailsPage"),
    document.getElementById("ownerStudentsPage"),
    document.getElementById("ownerTeachersPage"),
    document.getElementById("ownerStudentDetailsPage"),
    document.getElementById("ownerTeacherDetailsPage"),
    document.getElementById("ownerFreeAccessPage")
  ];

  sectionsToHide.forEach((sec) => {
    if (sec) sec.classList.add("hidden");
  });
}

export function updateActiveNavLink(activePage) {
  const navLinks = document.querySelectorAll(".nav-menu a");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const onclickAttr = link.getAttribute("onclick") || "";
    if (
      (activePage === "home" && (href === "#home" || href === "#/home" || onclickAttr.includes("showHomePage"))) ||
      (activePage === "courses" && (href === "#courses" || href === "#/courses" || onclickAttr.includes("showCoursesPage"))) ||
      (activePage === "books" && (href === "#books" || href === "#/books" || onclickAttr.includes("showBooksPage"))) ||
      (activePage === "contact" && (href.includes("contact") || onclickAttr.includes("contact")))
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

export function showHomePage() {
  hideAllMainSections();

  document.querySelectorAll(".home-section").forEach((sec) => {
    sec.classList.remove("hidden");
    sec.classList.remove("section-hidden");
  });

  const footer = document.getElementById("contactFooter");
  if (footer) footer.classList.remove("hidden");

  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value.trim() : "";

  if (!query) {
    if (typeof filterCourses === "function") {
      filterCourses();
    }
    if (typeof window.renderBooks === "function") {
      window.renderBooks();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateActiveNavLink("home");
}

export function showCoursesPage() {
  hideAllMainSections();

  const standaloneCoursesPage = document.getElementById("standaloneCoursesPage");
  if (standaloneCoursesPage) {
    standaloneCoursesPage.classList.remove("hidden");
    standaloneCoursesPage.classList.remove("section-hidden");
  }

  const footer = document.getElementById("contactFooter");
  if (footer) footer.classList.remove("hidden");

  const searchInput = document.getElementById("standaloneCourseSearch");
  const query = searchInput ? searchInput.value.trim() : "";

  if (!query && typeof window.filterStandaloneCourses === "function") {
    window.filterStandaloneCourses();
  }

  updateActiveNavLink("courses");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showBooksPage() {
  hideAllMainSections();

  const standaloneBooksPage = document.getElementById("standaloneBooksPage");
  if (standaloneBooksPage) {
    standaloneBooksPage.classList.remove("hidden");
    standaloneBooksPage.classList.remove("section-hidden");
  }

  const footer = document.getElementById("contactFooter");
  if (footer) footer.classList.remove("hidden");

  const searchInput = document.getElementById("standaloneBookSearch");
  const query = searchInput ? searchInput.value.trim() : "";

  if (!query && typeof window.filterStandaloneBooks === "function") {
    window.filterStandaloneBooks();
  }

  updateActiveNavLink("books");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showHomeSection(sectionName) {
  if (sectionName === "books") {
    showBooksPage();
  } else if (sectionName === "courses") {
    showCoursesPage();
  } else {
    showHomePage();
  }
}

export function filterByCategory(category) {
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.value = category;
  }
  filterCourses();
  showCoursesPage();
}

export function handleHeroSearch() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value : "";
  if (typeof window.performGlobalSearch === "function") {
    window.performGlobalSearch(query);
  }
}

export function handleHeroSearchSubmit() {
  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value : "";
  if (typeof window.performGlobalSearch === "function") {
    window.performGlobalSearch(query);
  }
}

export function searchByTeacher(teacherName) {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = teacherName;
  }
  handleHeroSearchSubmit();
}

export function handleNewsletterSubmit() {
  const input = document.getElementById("newsletterEmailInput");
  const email = input ? input.value.trim() : "";
  if (!email || !email.includes("@")) {
    if (typeof window.showCustomAlert === "function") {
      window.showCustomAlert("يرجى إدخال بريد إلكتروني صحيح");
    } else {
      alert("يرجى إدخال بريد إلكتروني صحيح");
    }
    return;
  }
  if (typeof window.showCustomAlert === "function") {
    window.showCustomAlert("شكراً لاشتراكك في النشرة البريدية لـ StudyMart!");
  } else {
    alert("شكراً لاشتراكك في النشرة البريدية لـ StudyMart!");
  }
  if (input) input.value = "";
}

export function filterByLevel(level) {
  const levelFilter = document.getElementById("levelFilter");
  if (levelFilter) {
    levelFilter.value = level;
  }
  filterCourses();
}

export function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  saveLocalStorage("theme", isDark ? "dark" : "light");
  const toggleBtn = document.querySelector(".theme-toggle");
  if (toggleBtn) toggleBtn.textContent = isDark ? "☀️" : "🌙";
}

export function scrollToSection(sectionId) {
  if (sectionId === "home" || sectionId === "hero") {
    window.location.hash = "#home";
    showHomePage();
    return;
  }

  if (sectionId === "books") {
    window.location.hash = "#books";
    showBooksPage();
    return;
  }

  if (sectionId === "courses" || sectionId === "coursesList" || sectionId === "coursesSection") {
    window.location.hash = "#courses";
    showCoursesPage();
    return;
  }

  if (sectionId === "contactFooter" || sectionId === "contact") {
    const contactTarget = document.getElementById("contactFooter");
    if (contactTarget) {
      contactTarget.classList.remove("hidden");
      contactTarget.scrollIntoView({ behavior: "smooth" });
    }
    updateActiveNavLink("contact");
    return;
  }

  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

export function showPublicReviewsPage() {
  hideAllMainSections();

  const publicReviewsPage = document.getElementById("publicReviewsPage");
  if (publicReviewsPage) {
    publicReviewsPage.classList.remove("hidden");
    publicReviewsPage.classList.remove("section-hidden");
  }

  const footer = document.getElementById("contactFooter");
  if (footer) footer.classList.remove("hidden");

  if (typeof window.renderPublicReviewsPage === "function") {
    window.renderPublicReviewsPage();
  }

  updateActiveNavLink("reviews");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (typeof window !== "undefined") {
  window.hideAllMainSections = hideAllMainSections;
  window.showHomePage = showHomePage;
  window.showCoursesPage = showCoursesPage;
  window.showBooksPage = showBooksPage;
  window.showPublicReviewsPage = showPublicReviewsPage;
  window.showHomeSection = showHomeSection;
  window.scrollToSection = scrollToSection;
  window.navigateToAllCourses = navigateToAllCourses;
  window.navigateToAllBooks = navigateToAllBooks;
}

export function navigateToAllCourses() {
  try {
    sessionStorage.removeItem("lms_course_list_state");
  } catch (e) {}
  window.location.hash = "#courses";
  showCoursesPage();
}

export function navigateToAllBooks() {
  window.location.hash = "#books";
  showBooksPage();
}
