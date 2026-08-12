import { updateNavbarPadding } from "./layoutService.js";

/**
 * Global Sidebar & Navigation Drawer Service
 * Manages outside click closing, smooth backdrop overlay, and background scroll locking.
 */

function getBackdropOverlay() {
  let overlay = document.getElementById("sidebarBackdropOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sidebarBackdropOverlay";
    overlay.className = "sidebar-backdrop-overlay";
    document.body.appendChild(overlay);
  }
  return overlay;
}

export function isAnySidebarOpen() {
  const sidebars = document.querySelectorAll(".profile-sidebar, .cart-sidebar, .sidebar-drawer, aside.show");
  for (const sb of sidebars) {
    if (sb.classList.contains("show")) return true;
  }
  return false;
}

export function closeAllSidebars() {
  const sidebars = document.querySelectorAll(".profile-sidebar, .cart-sidebar, .sidebar-drawer, aside.show");
  sidebars.forEach((sb) => {
    sb.classList.remove("show");
  });
  syncSidebarOverlayAndScroll();
}

export function syncSidebarOverlayAndScroll() {
  updateNavbarPadding();
  const overlay = getBackdropOverlay();
  const isOpen = isAnySidebarOpen();

  if (isOpen) {
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  } else {
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  }
}

export function initSidebarManager() {
  const overlay = getBackdropOverlay();

  // Click on backdrop overlay closes all open sidebars
  overlay.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAllSidebars();
  });

  // Global click listener to handle clicks outside open sidebars
  document.addEventListener("click", (e) => {
    if (!isAnySidebarOpen()) return;

    const target = e.target;
    const openSidebars = document.querySelectorAll(
      ".profile-sidebar.show, .cart-sidebar.show, .sidebar-drawer.show, aside.show"
    );

    let isInsideSidebar = false;
    openSidebars.forEach((sb) => {
      if (sb.contains(target)) {
        isInsideSidebar = true;
      }
    });

    // Check if click was on a toggle button triggering sidebar toggle
    const isToggleBtn = target.closest(
      "#profileToggle, #cartToggle, .sidebar-close-btn, [onclick*='toggleProfile'], [onclick*='toggleCart']"
    );

    // Check if click was inside a modal, confirmation dialog, alert, or toast
    const isModalOrDialog = target.closest(
      ".sm-dialog-overlay, .sm-dialog-card, .modal, .custom-alert, .toast, .swal2-container, [role='dialog'], [role='alertdialog']"
    );

    if (!isInsideSidebar && !isToggleBtn && !isModalOrDialog) {
      closeAllSidebars();
    }
  });

  // Handle ESC key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isAnySidebarOpen()) {
      closeAllSidebars();
    }
  });

  // Handle route/hash change
  window.addEventListener("hashchange", () => {
    updateSidebarActiveNavigation();
    if (isAnySidebarOpen()) {
      closeAllSidebars();
    }
  });

  window.addEventListener("popstate", () => {
    updateSidebarActiveNavigation();
  });

  // Initial sync on startup
  updateSidebarActiveNavigation();
}

export function toggleOwnerMenu(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const submenu = document.getElementById("ownerSubmenu");
  const chevron = document.getElementById("ownerMenuChevron");
  const toggleBtn = document.getElementById("ownerMenuToggleBtn");

  if (!submenu) return;

  const isHidden = submenu.style.display === "none" || getComputedStyle(submenu).display === "none";
  if (isHidden) {
    submenu.style.display = "flex";
    if (chevron) chevron.style.transform = "rotate(180deg)";
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
  } else {
    submenu.style.display = "none";
    if (chevron) chevron.style.transform = "rotate(0deg)";
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
  }
}

/**
 * Update active navigation state for sidebar buttons based on current location hash.
 * Guarantees that ONLY ONE item is highlighted at any given time based on the active route.
 */
export function updateSidebarActiveNavigation() {
  const hash = (window.location.hash || "").toLowerCase();

  // 1. Teacher & Platform Owner Sidebar
  const teacherBtns = document.querySelectorAll(".teacher-dashboard-sidebar .teacher-menu-btn");
  if (teacherBtns.length > 0) {
    // Remove active and highlight classes from ALL buttons
    teacherBtns.forEach((btn) => {
      btn.classList.remove("active", "highlight");
    });

    let targetRoute = "";

    // Derive target route key from current location hash
    if (hash.includes("homepage-management") || hash.includes("owner/homepage-management")) {
      targetRoute = "owner/homepage-management";
    } else if (hash.includes("owner/free-access") || hash.includes("free-access")) {
      targetRoute = "owner/free-access";
    } else if (hash.includes("owner/student") || hash.includes("owner-student")) {
      targetRoute = "owner/students";
    } else if (hash.includes("owner/teacher") || hash.includes("owner-teacher")) {
      targetRoute = "owner/teachers";
    } else if (hash.includes("course-builder") || hash.includes("courses/new")) {
      targetRoute = "teacher/course-builder";
    } else if (hash.includes("book-builder") || hash.includes("books/new")) {
      targetRoute = "teacher/book-builder";
    } else if (hash.includes("teacher/courses") || hash.includes("teacher/dashboard") || hash.includes("teacher/management")) {
      targetRoute = "teacher/courses";
    } else if (hash.includes("teacher/books")) {
      targetRoute = "teacher/books";
    } else if (hash.includes("revenue")) {
      targetRoute = "teacher/revenue";
    } else if (hash.includes("transaction")) {
      targetRoute = "teacher/transactions";
    } else if (hash.includes("teacher/student")) {
      targetRoute = "teacher/students";
    } else if (hash.includes("reviews")) {
      targetRoute = "teacher/reviews";
    } else if (hash.includes("messages")) {
      targetRoute = "teacher/messages";
    } else if (hash.includes("student/courses") || hash.includes("my-courses") || hash.includes("mycourses")) {
      targetRoute = "student/courses";
    } else if (hash.includes("student/books") || hash.includes("my-books") || hash.includes("mybooks")) {
      targetRoute = "student/books";
    } else if (hash.includes("payouts")) {
      targetRoute = "teacher/payouts";
    } else if (hash.includes("profile") || hash.includes("settings")) {
      targetRoute = "profile";
    }

    // List of routes contained inside the Platform Owner collapsible menu
    const ownerSubmenuRoutes = [
      "owner/homepage-management",
      "owner/students",
      "owner/teachers",
      "owner/free-access"
    ];

    // Check if current user is owner and target route is an owner-exclusive menu route
    const userRole = window.appState?.userRole;
    const isOwnerUser = userRole === "owner";

    const isOwnerRoute = isOwnerUser && (
      ownerSubmenuRoutes.includes(targetRoute) ||
      hash.includes("#owner/") ||
      hash.includes("owner/")
    );

    const submenu = document.getElementById("ownerSubmenu");
    const chevron = document.getElementById("ownerMenuChevron");
    const toggleBtn = document.getElementById("ownerMenuToggleBtn");

    if (isOwnerRoute && submenu) {
      submenu.style.display = "flex";
      if (chevron) chevron.style.transform = "rotate(180deg)";
      if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    }

    if (targetRoute) {
      const activeBtn = Array.from(teacherBtns).find((btn) => {
        // Do NOT mark the main container toggle button as active when a child is target
        if (btn.id === "ownerMenuToggleBtn") return false;

        const routeAttr = btn.getAttribute("data-route");
        if (routeAttr && routeAttr === targetRoute) return true;

        // Fallbacks based on text
        const text = btn.textContent || "";
        if (targetRoute === "owner/homepage-management" && text.includes("إدارة الصفحة الرئيسية")) return true;
        if (targetRoute === "owner/students" && text.includes("إدارة الطلاب")) return true;
        if (targetRoute === "owner/teachers" && text.includes("إدارة المعلمين")) return true;
        if (targetRoute === "teacher/course-builder" && text.includes("إضافة دورة جديدة")) return true;
        if (targetRoute === "teacher/courses" && text.includes("إدارة الدورات")) return true;
        if (targetRoute === "teacher/book-builder" && text.includes("إضافة كتاب")) return true;
        if (targetRoute === "teacher/books" && text.includes("إدارة الكتب")) return true;
        if (targetRoute === "teacher/revenue" && text.includes("الإيرادات")) return true;
        if (targetRoute === "teacher/transactions" && text.includes("سجل المعاملات")) return true;
        if (targetRoute === "teacher/students" && text.includes("الطلاب المشتركون")) return true;
        if (targetRoute === "teacher/reviews" && text.includes("تقييمات الطلاب")) return true;
        if (targetRoute === "teacher/messages" && text.includes("مركز الرسائل")) return true;
        if (targetRoute === "student/courses" && text.includes("الدورات التي اشتراها")) return true;
        if (targetRoute === "student/books" && text.includes("الكتب التي اشتراها")) return true;
        if (targetRoute === "teacher/payouts" && text.includes("المستحقات والسحب")) return true;
        if (targetRoute === "profile" && text.includes("تعديل البروفايل")) return true;

        return false;
      });

      if (activeBtn) {
        activeBtn.classList.add("active", "highlight");
      }
    }
  }

  // 2. Student Sidebar
  const studentBtns = document.querySelectorAll(".student-dashboard-sidebar .student-menu-item");
  if (studentBtns.length > 0) {
    studentBtns.forEach((btn) => btn.classList.remove("active"));
    let matchedStudentBtn = null;
    if (hash.includes("profile") || hash.includes("settings")) {
      matchedStudentBtn = Array.from(studentBtns).find((btn) => btn.textContent.includes("تعديل البروفايل"));
    } else if (hash.includes("student/courses") || hash.includes("my-courses") || hash.includes("mycourses")) {
      matchedStudentBtn = Array.from(studentBtns).find((btn) => btn.textContent.includes("دوراتي"));
    } else if (hash.includes("student/books") || hash.includes("my-books") || hash.includes("mybooks")) {
      matchedStudentBtn = Array.from(studentBtns).find((btn) => btn.textContent.includes("كتبي"));
    } else if (hash.includes("purchases") || hash.includes("orders")) {
      matchedStudentBtn = Array.from(studentBtns).find((btn) => btn.textContent.includes("مشترياتي"));
    } else if (hash.includes("favorites") || hash.includes("wishlist")) {
      matchedStudentBtn = Array.from(studentBtns).find((btn) => btn.textContent.includes("المفضلة"));
    }
    if (matchedStudentBtn) {
      matchedStudentBtn.classList.add("active");
    }
  }
}

if (typeof window !== "undefined") {
  window.closeAllSidebars = closeAllSidebars;
  window.syncSidebarOverlayAndScroll = syncSidebarOverlayAndScroll;
  window.updateSidebarActiveNavigation = updateSidebarActiveNavigation;
  window.toggleOwnerMenu = toggleOwnerMenu;
}
