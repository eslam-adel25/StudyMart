import {
  showCustomAlert,
  showSuccessToast,
  showErrorToast,
  showLoadingDialog,
} from "../utils/helpers.js";
import {
  getStoredUsers,
  findUserByEmail,
  saveUserToStorage,
  getCurrentUser,
  setCurrentUser,
  removeCurrentUser,
} from "./authStorage.js";
import {
  isPlatformOwnerCredentials,
  isTeacherTestCredentials,
  isStudentTestCredentials,
  isOwner,
  isTeacher,
  hasPermission,
  PERMISSIONS,
} from "./permissionService.js";
import {
  syncSidebarOverlayAndScroll,
  updateSidebarActiveNavigation,
} from "./sidebarService.js";
import {
  isAccountBlocked,
  showSuspendedAccountModal,
} from "./accountStatusService.js";

export const DEFAULT_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY0NzQ4YiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgNGMxLjkzIDAgMy41IDEuNTcgMy41IDMuNVMxMy45MyAxMyAxMiAxM3MtMy41LTEuNTctMy41LTMuNVMxMC4wNyA2IDEyIDZ6bTAgMTRjLTIuMDMgMC0zLjgtMS4wNC00LjgzLTIuNjIuMDMtMS42IDMuMjItMi40OCA0LjgzLTIuNDggMS42IDAgNC44Ljg4IDQuODMgMi40OEMxNS44IDE4Ljk2IDE0LjAzIDIwIDEyIDIweiIvPjwvc3ZnPg==`;

export function updateUserState() {
  const isLoggedIn = Boolean(window.appState?.isLoggedIn);
  const userRole = window.appState?.userRole || "student";
  const loginButton = document.querySelector(".btn-login");
  const profileToggle = document.querySelector(".profile-toggle");
  const dashboardLink = document.querySelector(".dashboard-link");
  const navProfileImg = document.getElementById("navProfileImg");
  const navProfileName = document.getElementById("navProfileName");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileImage = document.getElementById("profileImage");
  const profileSidebar = document.getElementById("profileSidebar");

  const userRawImage = window.appState?.userData?.image || DEFAULT_AVATAR;
  let userImage = userRawImage;
  if (
    userImage &&
    typeof userImage === "string" &&
    userImage.startsWith("data:image/svg+xml;utf8,<svg")
  ) {
    try {
      userImage =
        "data:image/svg+xml;base64," +
        btoa(userImage.replace("data:image/svg+xml;utf8,", ""));
    } catch (e) {
      userImage = DEFAULT_AVATAR;
    }
  }
  const safeUserImage =
    userImage && typeof userImage === "string"
      ? userImage.replace(/"/g, "&quot;")
      : DEFAULT_AVATAR;
  const userName =
    window.appState?.userData?.name ||
    (userRole === "owner"
      ? "مالك المنصة"
      : userRole === "teacher"
        ? "د. أحمد خليل"
        : "طالب");
  const userEmail = window.appState?.userData?.email || "";

  if (isLoggedIn) {
    if (loginButton) {
      loginButton.classList.add("hidden");
      loginButton.style.display = "none";
    }
    if (profileToggle) {
      profileToggle.classList.remove("hidden");
      profileToggle.style.display = "";
    }
    if (dashboardLink) {
      if (userRole === "teacher" || userRole === "owner") {
        dashboardLink.classList.remove("hidden");
        if (dashboardLink.parentElement)
          dashboardLink.parentElement.classList.remove("hidden");
        dashboardLink.textContent =
          userRole === "owner" ? "لوحة المالك" : "لوحة المعلم";
        dashboardLink.setAttribute(
          "href",
          userRole === "owner" ? "#teacher/payouts" : "#teacher/dashboard",
        );
      } else {
        dashboardLink.classList.add("hidden");
        if (dashboardLink.parentElement)
          dashboardLink.parentElement.classList.add("hidden");
      }
    }
  } else {
    if (loginButton) {
      loginButton.classList.remove("hidden");
      loginButton.style.display = "";
      loginButton.textContent = "تسجيل الدخول";
      loginButton.onclick = showLogin;
    }
    if (profileToggle) {
      profileToggle.classList.add("hidden");
      profileToggle.style.display = "none";
    }
    if (dashboardLink) {
      dashboardLink.classList.add("hidden");
      if (dashboardLink.parentElement)
        dashboardLink.parentElement.classList.add("hidden");
    }
  }

  if (navProfileImg) {
    navProfileImg.src = userImage;
    navProfileImg.onerror = function () {
      if (this.src !== DEFAULT_AVATAR) {
        this.src = DEFAULT_AVATAR;
      }
    };
  }

  if (navProfileName) {
    navProfileName.textContent = userName;
  }

  // Render Sidebar according to User Role
  if (profileSidebar) {
    if (userRole === "teacher" || userRole === "owner") {
      profileSidebar.className = "profile-sidebar teacher-dashboard-sidebar";
      profileSidebar.setAttribute("dir", "rtl");
      profileSidebar.innerHTML = `
        <div class="sidebar-inner" style="background: #0b1329; color: #cbd5e1; padding: 20px;">
          <button type="button" class="sidebar-close-btn" onclick="toggleProfile(event)" aria-label="إغلاق">✕</button>

          <!-- BRAND HEADER -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: ${userRole === "owner" ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #7c3aed, #4f46e5)"}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px;">🎓</div>
              <div>
                <span style="font-size: 18px; font-weight: 800; color: #fff; display: block; line-height: 1.2;">StudyMart</span>
                <span style="font-size: 10px; color: ${userRole === "owner" ? "#fca5a5" : "#a78bfa"}; font-weight: 600;">${userRole === "owner" ? "مالك المنصة (Platform Owner)" : "لوحة المعلم"}</span>
              </div>
            </div>
            <span style="font-size: 10px; font-weight: 700; background: ${userRole === "owner" ? "rgba(239, 68, 68, 0.25)" : "rgba(124, 58, 237, 0.25)"}; color: ${userRole === "owner" ? "#fca5a5" : "#c4b5fd"}; border: 1px solid ${userRole === "owner" ? "rgba(248, 113, 113, 0.4)" : "rgba(139, 92, 246, 0.4)"}; padding: 2px 8px; border-radius: 6px;">${userRole === "owner" ? "OWNER" : "PRO"}</span>
          </div>

          <!-- TEACHER / OWNER PROFILE CARD -->
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; cursor: pointer;" onclick="showUserProfile()">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="position: relative;">
                <img id="teacherCardImg" src="${safeUserImage}" alt="${userName}" style="width: 46px; height: 46px; border-radius: 50%; object-fit: cover; border: 2px solid ${userRole === "owner" ? "#ef4444" : "#7c3aed"};" onerror="if(this.src!=='${DEFAULT_AVATAR}')this.src='${DEFAULT_AVATAR}'" />
                <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid #0b1329; border-radius: 50%;"></span>
              </div>
              <div style="display: flex; flex-direction: column;">
                <span id="teacherCardName" style="font-size: 14px; font-weight: 700; color: #f8fafc;">${userName}</span>
                <span id="teacherCardEmail" style="font-size: 12px; color: #94a3b8; font-weight: 500;">${userEmail || (userRole === "owner" ? "مالك المنصة" : "معلم")}</span>
              </div>
            </div>
            <span style="color: #94a3b8; font-size: 12px;">▼</span>
          </div>

          <!-- SECTIONS -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- SECTION 1: الحساب -->
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">الحساب</span>
              <button type="button" class="teacher-menu-btn" data-route="profile" onclick="showUserProfile()">
                <span>👤 تعديل البروفايل</span> ‹
              </button>
            </div>

            ${
              userRole === "owner"
                ? `
            <!-- OWNER SECTION: DEDICATED COLLAPSIBLE PLATFORM OWNER MENU -->
            <div class="owner-menu-section">
              <span style="font-size: 11px; font-weight: 700; color: #ef4444; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">إدارة المنصة (Platform Owner)</span>
              
              <button type="button" id="ownerMenuToggleBtn" class="teacher-menu-btn owner-menu-toggle-btn" onclick="if(window.toggleOwnerMenu) window.toggleOwnerMenu(event);">
                <span style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 15px;">👑</span>
                  <span>إدارة المنصة</span>
                </span>
                <span id="ownerMenuChevron" class="owner-menu-chevron">▼</span>
              </button>

              <div id="ownerSubmenu" class="owner-submenu">
                <button type="button" class="teacher-menu-btn" data-route="owner/homepage-management" onclick="if(window.openHomepageManagement) window.openHomepageManagement();">
                  <span>🏠 إدارة الصفحة الرئيسية</span> ‹
                </button>
                <button type="button" class="teacher-menu-btn" data-route="owner/students" onclick="if(window.openOwnerStudentsManagement) window.openOwnerStudentsManagement();">
                  <span>👥 إدارة الطلاب</span> ‹
                </button>
                <button type="button" class="teacher-menu-btn" data-route="owner/teachers" onclick="if(window.openOwnerTeachersManagement) window.openOwnerTeachersManagement();">
                  <span>👨‍🏫 إدارة المعلمين</span> ‹
                </button>
                <button type="button" class="teacher-menu-btn" data-route="owner/free-access" onclick="if(window.openOwnerFreeAccess) window.openOwnerFreeAccess();">
                  <span>🎁 تفعيل المحتوى للطلاب</span> ‹
                </button>
              </div>
            </div>
            `
                : ""
            }

            <!-- SECTION 2: إدارة المحتوى -->
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">إدارة المحتوى</span>
              <button type="button" class="teacher-menu-btn" data-route="teacher/course-builder" onclick="openAddCourse()">
                <span>➕ إضافة دورة جديدة</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="teacher/courses" onclick="openTeacherChoice()">
                <span>📖 إدارة الدورات</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="teacher/book-builder" onclick="openAddBook()">
                <span>➕ إضافة كتاب</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="teacher/books" onclick="openBookManagementDashboard()">
                <span>📚 إدارة الكتب</span> ‹
              </button>
            </div>

            <!-- SECTION 3: المبيعات -->
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">المبيعات</span>
              <button type="button" class="teacher-menu-btn" data-route="teacher/revenue" onclick="if(window.openRevenueDashboard) window.openRevenueDashboard();">
                <span>📈 الإيرادات</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="teacher/transactions" onclick="if(window.openTransactionHistory) window.openTransactionHistory();">
                <span>🧾 سجل المعاملات</span> ‹
              </button>
            </div>

            <!-- SECTION 4: الطلاب -->
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">الطلاب</span>
              <button type="button" class="teacher-menu-btn" data-route="teacher/students" onclick="if(window.openEnrolledStudentsPage) window.openEnrolledStudentsPage();">
                <span>👥 الطلاب المشتركون</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="teacher/reviews" onclick="if(window.openStudentReviewsPage) window.openStudentReviewsPage();">
                <span>⭐ تقييمات الطلاب</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="teacher/messages" onclick="if(window.openMessageCenterPage) window.openMessageCenterPage();">
                <span>💬 مركز الرسائل والمحادثات</span> ‹
              </button>
            </div>

            <!-- SECTION 5: المشتريات -->
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">المشتريات</span>
              <button type="button" class="teacher-menu-btn" data-route="student/courses" onclick="openMyCourses()">
                <span>🎓 الدورات التي اشتراها</span> ‹
              </button>
              <button type="button" class="teacher-menu-btn" data-route="student/books" onclick="openMyBooks()">
                <span>📚 الكتب التي اشتراها</span> ‹
              </button>
            </div>

            <!-- SECTION 6: المستحقات والسحب -->
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 0 4px; display: block; margin-bottom: 6px;">المستحقات والسحب</span>
              <button type="button" class="teacher-menu-btn" data-route="teacher/payouts" onclick="if(window.openPayoutsDashboard) window.openPayoutsDashboard();">
                <span>💰 المستحقات والسحب</span> ‹
              </button>
            </div>
          </div>

          <!-- BOTTOM LOGOUT -->
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.08);">
            <button type="button" class="teacher-logout-btn" onclick="handleLogout()">
              <span>🚪 تسجيل الخروج</span> ‹
            </button>
          </div>
        </div>
      `;
    } else {
      profileSidebar.className = "profile-sidebar student-dashboard-sidebar";
      profileSidebar.setAttribute("dir", "rtl");
      profileSidebar.innerHTML = `
        <div class="sidebar-inner">
          <button type="button" class="sidebar-close-btn" onclick="toggleProfile(event)" aria-label="إغلاق">✕</button>

          <div class="student-profile-header">
            <svg class="header-bg-shapes" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="50" fill="#7c3aed" opacity="0.1" />
              <rect x="190" y="-10" width="80" height="80" rx="18" transform="rotate(25 190 -10)" fill="#8b5cf6" opacity="0.12" />
              <circle cx="240" cy="110" r="35" fill="#6366f1" opacity="0.1" />
              <path d="M-10 110 L40 160 L-60 160 Z" fill="#a855f7" opacity="0.08" />
            </svg>

            <div class="student-avatar-wrapper">
              <img id="profileImage" src="${safeUserImage}" alt="Student Avatar" class="student-avatar-img" onerror="if(this.src!=='${DEFAULT_AVATAR}')this.src='${DEFAULT_AVATAR}'" />
            </div>

            <h3 id="profileName" class="student-name">${userName}</h3>
            <p id="profileEmail" class="student-email" style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${userEmail}</p>
            <span class="student-role-badge">طالب</span>
          </div>

          <nav class="student-menu">
            <button type="button" class="student-menu-item" onclick="showUserProfile()">
              <div class="item-start">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span class="menu-title">تعديل البروفايل</span>
              </div>
              <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="menu-item-divider"></div>

            <button type="button" class="student-menu-item" onclick="openMyCourses()">
              <div class="item-start">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span class="menu-title">دوراتي</span>
              </div>
              <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="menu-item-divider"></div>

            <button type="button" class="student-menu-item" onclick="openMyBooks()">
              <div class="item-start">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 1 3-3h7z"/></svg>
                <span class="menu-title">كتبي</span>
              </div>
              <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="menu-item-divider"></div>

            <button type="button" class="student-menu-item" onclick="openStudentPurchasesChoice()">
              <div class="item-start">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                <span class="menu-title">مشترياتي</span>
              </div>
              <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div class="menu-item-divider"></div>

            <button type="button" class="student-menu-item" onclick="if(window.renderFavoritesPage) window.renderFavoritesPage(); else window.location.hash='#student/favorites';">
              <div class="item-start">
                <svg class="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span class="menu-title">المفضلة</span>
              </div>
              <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <div class="menu-section-separator"></div>

            <button type="button" class="student-menu-item logout-item" onclick="handleLogout()">
              <div class="item-start">
                <svg class="menu-icon logout-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span class="menu-title logout-title">تسجيل الخروج</span>
              </div>
              <svg class="chevron-icon logout-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          </nav>
        </div>
      `;
    }
  }

  // Update target elements across entire document
  const avatarElements = document.querySelectorAll(
    "#navProfileImg, #profileImage, #teacherCardImg, #editProfileAvatarImg, .profile-avatar-img, .student-avatar-img",
  );
  avatarElements.forEach((img) => {
    if (img) {
      img.src = userImage || DEFAULT_AVATAR;
      img.onerror = function () {
        this.onerror = null;
        this.src = DEFAULT_AVATAR;
      };
    }
  });

  const nameElements = document.querySelectorAll(
    "#profileName, #teacherCardName, #navProfileName",
  );
  nameElements.forEach((el) => {
    if (el) el.textContent = userName;
  });

  const emailElements = document.querySelectorAll(
    "#profileEmail, #teacherCardEmail",
  );
  emailElements.forEach((el) => {
    if (el) el.textContent = userEmail;
  });

  updateSidebarActiveNavigation();
}

window.toggleStatsAccordionInDOM = function () {
  const body = document.getElementById("statsAccBody");
  const chev = document.getElementById("statsAccChevron");
  if (body) {
    if (body.style.display === "none" || !body.style.display) {
      body.style.display = "flex";
      if (chev) chev.textContent = "▲";
    } else {
      body.style.display = "none";
      if (chev) chev.textContent = "▼";
    }
  }
};

export function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === "password") {
      input.type = "text";
      btn.innerHTML = `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    } else {
      input.type = "password";
      btn.innerHTML = `<svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
  }
}

export function handleForgotPassword(event) {
  if (event) event.preventDefault();
  showCustomAlert("تم إرسال رابط إعادة ضبط كلمة المرور إلى بريدك الإلكتروني.");
}

export function setupAuth() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    if (isAccountBlocked(currentUser)) {
      removeCurrentUser();
      window.appState.isLoggedIn = false;
      window.appState.userData = null;
      window.appState.userRole = "student";
      updateUserState();
      showSuspendedAccountModal(
        "تم إيقاف حسابك من قبل إدارة المنصة. لا يمكنك الاستمرار في استخدام المنصة حالياً.",
      );
      setupRegisterInputListeners();
      return;
    }
    window.appState.isLoggedIn = true;
    window.appState.userRole =
      currentUser.accountType || currentUser.role || "student";
    window.appState.userData = {
      name: currentUser.fullName || currentUser.name || "مستخدم",
      email: currentUser.email || "",
      image: currentUser.avatar || currentUser.image || DEFAULT_AVATAR,
      phone: currentUser.phone || "",
      gender: currentUser.gender || "",
      birthDate: currentUser.birthDate || "",
      accountType: currentUser.accountType || "student",
      courses: window.appState.userData?.courses || [],
    };
  }
  updateUserState();
  setupRegisterInputListeners();
}

export function setupRegisterInputListeners() {
  const ids = [
    "regFullName",
    "regGender",
    "regBirthDate",
    "regPhone",
    "regEmail",
    "regPassword",
    "regConfirmPassword",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", validateRegistrationForm);
      el.addEventListener("change", validateRegistrationForm);
      el.addEventListener("keyup", validateRegistrationForm);
    }
  });
}

export const registeredEmails = ["student@gmail.com", "teacher@gmail.com"];
let tempSelectedEmail = "";

export const GOOGLE_CLIENT_ID =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID) ||
  "785176204167-qhliiiu5uomft3rqhucvb8q5nq9c7ian.apps.googleusercontent.com";

export function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();
}

/**
 * Initiates the Google Sign-In flow using Google Identity Services (GIS).
 * Immediately triggers Google's Account Chooser popup.
 */
export function handleGoogleSignIn() {
  const clientId = GOOGLE_CLIENT_ID;

  if (!clientId) {
    showErrorToast({
      title: "خطأ في الإعدادات",
      message: "لم يتم العثور على Google Client ID.",
    });
    return;
  }

  // Ensure GIS library is available
  if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
    const loadingToast = showLoadingDialog({
      title: "جاري التحميل...",
      message: "جاري تهيئة خدمة المصادقة من Google.",
      progress: 50,
    });

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loadingToast.close();
      triggerGoogleOAuthPopup(clientId);
    };
    script.onerror = () => {
      loadingToast.close();
      showErrorToast({
        title: "خطأ في التحميل",
        message:
          "تعذر تحميل مكتبة Google Sign-In. يرجى التحقق من اتصال الإنترنت.",
      });
    };
    document.head.appendChild(script);
    return;
  }

  triggerGoogleOAuthPopup(clientId);
}

function triggerGoogleOAuthPopup(clientId) {
  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile openid",
      prompt: "select_account",
      callback: async (response) => {
        if (response.error) {
          if (
            response.error === "access_denied" ||
            response.error === "popup_closed_by_user" ||
            response.error === "popup_closed"
          ) {
            // User closed popup or cancelled gracefully
            return;
          }
          showErrorToast({
            title: "فشل الدخول عبر Google",
            message: `حدث خطأ في المصادقة: ${response.error_description || response.error}`,
          });
          return;
        }

        if (!response.access_token) {
          showErrorToast({
            title: "خطأ في المصادقة",
            message: "لم يتم استلام رمز الوصول من Google.",
          });
          return;
        }

        const loader = showLoadingDialog({
          title: "جاري المصادقة...",
          message: "جاري التحقق من حساب Google الخاص بك...",
          progress: 50,
        });

        try {
          const userInfoRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            },
          );

          loader.setProgress(90);

          if (!userInfoRes.ok) {
            loader.close();
            showErrorToast({
              title: "خطأ في جلب الحساب",
              message: "تعذر الحصول على معلومات الحساب من Google.",
            });
            return;
          }

          const googleProfile = await userInfoRes.json();
          loader.setProgress(100);
          setTimeout(() => loader.close(), 200);

          processGoogleAuthSuccess(googleProfile);
        } catch (err) {
          loader.close();
          console.error("Google userinfo fetch error:", err);
          showErrorToast({
            title: "خطأ في الاتصال",
            message: "حدث خطأ أثناء الحصول على بيانات الحساب من Google.",
          });
        }
      },
      error_callback: (err) => {
        if (
          err &&
          (err.type === "popup_closed" ||
            err.type === "popup_closed_by_user" ||
            (typeof err.message === "string" &&
              err.message.toLowerCase().includes("closed")))
        ) {
          // User intentionally closed the popup window
          return;
        }
        console.error("Google Token Client Error:", err);
        showErrorToast({
          title: "خطأ المصادقة",
          message: "حدث خطأ أثناء فتح نافذة اختيار حساب Google.",
        });
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err) {
    console.error("Error launching Google OAuth:", err);
    showErrorToast({
      title: "خطأ المصادقة",
      message: "لم نتمكن من فتح نافذة Google Account Chooser.",
    });
  }
}

/**
 * Google email selection for REGISTRATION FORM ONLY.
 * Initiates the Google account picker but only extracts email for prefilling the registration form.
 * Does NOT log in the user or create an account.
 */
export function handleGoogleEmailSelectionForRegistration() {
  const clientId = GOOGLE_CLIENT_ID;

  if (!clientId) {
    showErrorToast({
      title: "خطأ في الإعدادات",
      message: "لم يتم العثور على Google Client ID.",
    });
    return;
  }

  // Ensure GIS library is available
  if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
    const loadingToast = showLoadingDialog({
      title: "جاري التحميل...",
      message: "جاري تهيئة خدمة المصادقة من Google.",
      progress: 50,
    });

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loadingToast.close();
      triggerGoogleOAuthPopupForRegistration(clientId);
    };
    script.onerror = () => {
      loadingToast.close();
      showErrorToast({
        title: "خطأ في التحميل",
        message:
          "تعذر تحميل مكتبة Google Sign-In. يرجى التحقق من اتصال الإنترنت.",
      });
    };
    document.head.appendChild(script);
    return;
  }

  triggerGoogleOAuthPopupForRegistration(clientId);
}

/**
 * Triggers Google OAuth popup for registration form only.
 * Callback processes email for registration prefill (NOT login).
 */
function triggerGoogleOAuthPopupForRegistration(clientId) {
  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile openid",
      prompt: "select_account",
      callback: async (response) => {
        if (response.error) {
          if (
            response.error === "access_denied" ||
            response.error === "popup_closed_by_user" ||
            response.error === "popup_closed"
          ) {
            // User closed popup gracefully - do nothing
            return;
          }
          showErrorToast({
            title: "خطأ في اختيار البريد",
            message: `حدث خطأ: ${response.error_description || response.error}`,
          });
          return;
        }

        if (!response.access_token) {
          showErrorToast({
            title: "خطأ في المصادقة",
            message: "لم يتم استلام رمز الوصول من Google.",
          });
          return;
        }

        const loader = showLoadingDialog({
          title: "جاري جلب البريد...",
          message: "جاري الحصول على بريدك من Google...",
          progress: 50,
        });

        try {
          const userInfoRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            },
          );

          loader.setProgress(90);

          if (!userInfoRes.ok) {
            loader.close();
            showErrorToast({
              title: "خطأ في جلب البريد",
              message: "تعذر الحصول على بريدك من Google.",
            });
            return;
          }

          const googleProfile = await userInfoRes.json();
          loader.setProgress(100);
          setTimeout(() => loader.close(), 200);

          // ONLY extract email, do NOT log in
          processGoogleEmailForRegistration(googleProfile);
        } catch (err) {
          loader.close();
          console.error("Google userinfo fetch error:", err);
          showErrorToast({
            title: "خطأ في الاتصال",
            message: "حدث خطأ أثناء الحصول على البريد من Google.",
          });
        }
      },
      error_callback: (err) => {
        if (
          err &&
          (err.type === "popup_closed" ||
            err.type === "popup_closed_by_user" ||
            (typeof err.message === "string" &&
              err.message.toLowerCase().includes("closed")))
        ) {
          // User closed popup - do nothing
          return;
        }
        console.error("Google Token Client Error:", err);
        showErrorToast({
          title: "خطأ",
          message: "حدث خطأ أثناء فتح نافذة اختيار حساب Google.",
        });
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err) {
    console.error("Error launching Google OAuth:", err);
    showErrorToast({
      title: "خطأ",
      message: "لم نتمكن من فتح نافذة Google Account Chooser.",
    });
  }
}

/**
 * Process Google email for REGISTRATION FORM ONLY.
 * Extracts email and populates the registration form field.
 * Does NOT create account, does NOT log in, does NOT redirect.
 */
export function processGoogleEmailForRegistration(googleProfile) {
  const email = (googleProfile.email || "").trim().toLowerCase();

  if (!email) {
    showErrorToast({
      title: "خطأ في البيانات",
      message: "لم يتم العثور على بريد إلكتروني مرتبط بحساب Google هذا.",
    });
    return;
  }

  // Simply populate the email field in the registration form
  const emailInput = document.getElementById("regEmail");
  if (emailInput) {
    // Keep the email field as read-only after Google selection
    emailInput.value = email;
    emailInput.setAttribute("readonly", "readonly");
    emailInput.classList.add("prefilled-readonly");

    // Trigger validation to check form state
    validateRegistrationForm();

    showSuccessToast({
      title: "تم!",
      message: "تم استخدام بريدك من Google. أكمل الحقول المتبقية.",
    });
  } else {
    showErrorToast({
      title: "خطأ",
      message: "لم يتم العثور على حقل البريد في النموذج.",
    });
  }
}

export function processGoogleAuthSuccess(googleProfile) {
  const email = (googleProfile.email || "").trim().toLowerCase();
  const name =
    googleProfile.name ||
    googleProfile.given_name ||
    email.split("@")[0] ||
    "مستخدم Google";
  const avatar = googleProfile.picture || DEFAULT_AVATAR;

  if (!email) {
    showErrorToast({
      title: "خطأ في البيانات",
      message: "لم يتم العثور على بريد إلكتروني مرتبط بحساب Google هذا.",
    });
    return;
  }

  if (isAccountBlocked(email)) {
    showSuspendedAccountModal(
      "تم إيقاف أو تعليق حسابك من قبل إدارة المنصة. تعذر تسجيل الدخول عبر Google.",
    );
    return;
  }

  let existingUser = findUserByEmail(email);
  let role = "student";

  if (existingUser) {
    role = existingUser.accountType || existingUser.role || "student";
    existingUser.fullName = existingUser.fullName || name;
    existingUser.avatar = existingUser.avatar || avatar;
    saveUserToStorage(existingUser);
  } else {
    if (email === "teacher@gmail.com") {
      role = "teacher";
    } else if (email === "student@gmail.com") {
      role = "student";
    } else {
      role = "student";
    }

    existingUser = {
      fullName: name,
      email: email,
      avatar: avatar,
      accountType: role,
      role: role,
      googleId: googleProfile.sub || null,
      authProvider: "google",
      registrationDate: new Date().toISOString(),
    };

    saveUserToStorage(existingUser);
  }

  window.appState.isLoggedIn = true;
  window.appState.userRole = role;
  window.appState.userData = {
    name: existingUser.fullName || name,
    email: email,
    image: existingUser.avatar || avatar,
    phone: existingUser.phone || "",
    gender: existingUser.gender || "",
    birthDate: existingUser.birthDate || "",
    accountType: role,
    role: role,
    courses: [],
  };

  setCurrentUser(existingUser);
  updateUserState();
  closeAuth();

  if (role === "teacher") {
    window.location.hash = "#teacher/dashboard";
    showSuccessToast({
      title: "أهلاً بك!",
      message: `تم تسجيل الدخول بنجاح عبر Google: ${name}`,
    });
    if (window.showDashboard) {
      window.showDashboard();
    }
  } else {
    window.location.hash = "#home";
    showSuccessToast({
      title: "أهلاً بك!",
      message: `تم تسجيل الدخول بنجاح عبر Google: ${name}`,
    });
    if (typeof window.showHomeSection === "function") {
      window.showHomeSection("home");
    }
  }
}

export function redirectToLoginWithEmail() {
  resetRegisterFlow();
  switchToLogin();

  const loginEmail = document.getElementById("loginEmail");
  if (loginEmail && tempSelectedEmail) {
    loginEmail.value = tempSelectedEmail;
    loginEmail.readOnly = true;
    loginEmail.classList.add("prefilled-readonly");

    // Add info note if not present
    let note = document.getElementById("loginEmailNote");
    if (!note) {
      note = document.createElement("small");
      note.id = "loginEmailNote";
      note.className = "prefilled-note";
      note.textContent = "✓ البريد مسجل مسبقاً. أدخل كلمة المرور للدخول.";
      loginEmail.parentNode.appendChild(note);
    }
  }
}

export function resetRegisterFlow() {
  const modalContent = document.querySelector("#authModal .modal-content");
  modalContent?.classList.add("wide-modal");
}

export function selectRoleCard(role) {
  const studentCard = document.getElementById("card-student");
  const teacherCard = document.getElementById("card-teacher");
  const roleInput = document.getElementById("selectedRole");

  if (role === "teacher") {
    studentCard?.classList.remove("active");
    teacherCard?.classList.add("active");
    if (roleInput) roleInput.value = "teacher";
  } else {
    teacherCard?.classList.remove("active");
    studentCard?.classList.add("active");
    if (roleInput) roleInput.value = "student";
  }
  validateRegistrationForm();
}

/**
 * Sanitizes phone input to accept only digits (0-9).
 * Removes all non-numeric characters including letters, special characters, and spaces.
 * This function is called via oninput event on the phone field to prevent invalid input.
 */
export function sanitizePhoneInput(input) {
  if (!input) return;
  // Keep only digits (0-9)
  input.value = input.value.replace(/\D/g, "");
}

export function validateRegistrationForm() {
  const fullName = (document.getElementById("regFullName")?.value || "").trim();
  const phone = (document.getElementById("regPhone")?.value || "").trim();
  const gender = document.getElementById("regGender")?.value || "";
  const birthDateStr = document.getElementById("regBirthDate")?.value || "";
  const password = document.getElementById("regPassword")?.value || "";
  const confirmPassword =
    document.getElementById("regConfirmPassword")?.value || "";
  const emailInput = document.getElementById("regEmail");
  const email = (emailInput?.value || "").trim();
  const role = document.getElementById("selectedRole")?.value || "student";

  // Password rules validation
  const isLength = password.length >= 8;
  const isUpper = /[A-Z]/.test(password);
  const isLower = /[a-z]/.test(password);
  const isNumber = /[0-9]/.test(password);
  const isSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordValid = isLength && isUpper && isLower && isNumber && isSpecial;

  updateRuleBadge("rule-length", isLength);
  updateRuleBadge("rule-upper", isUpper);
  updateRuleBadge("rule-lower", isLower);
  updateRuleBadge("rule-number", isNumber);
  updateRuleBadge("rule-special", isSpecial);
  updateRuleBadge("rule-match", passwordsMatch);

  // Email validation
  const emailValid = Boolean(email && email.includes("@"));

  // Phone validation
  const isPhoneValid =
    phone.length >= 8 &&
    /^[\d+\s\u0660-\u0669\u06f0-\u06f9-]{8,20}$/.test(phone);

  // Birth Date validation
  let isDateValid = false;
  if (birthDateStr) {
    const birthDate = new Date(birthDateStr);
    isDateValid = !isNaN(birthDate.getTime()) && birthDate <= new Date();
  }

  // Gender validation
  const isGenderValid = gender !== "" && gender !== "disabled";

  // Name validation
  const isNameValid = fullName.length >= 2;

  // Role validation
  const accountType = role;
  const isRoleValid = accountType === "student" || accountType === "teacher";

  const isFormValid =
    emailValid &&
    isNameValid &&
    isPhoneValid &&
    isGenderValid &&
    isDateValid &&
    isRoleValid &&
    passwordValid &&
    passwordsMatch;

  const submitBtn = document.getElementById("regSubmitBtn");
  if (submitBtn) {
    submitBtn.disabled = !isFormValid;
  }

  return isFormValid;
}

function updateRuleBadge(ruleId, isValid) {
  const badge = document.getElementById(ruleId);
  if (!badge) return;

  const statusEl = badge.querySelector(".badge-status");
  if (isValid) {
    badge.classList.add("valid");
    if (statusEl) statusEl.textContent = "✓";
  } else {
    badge.classList.remove("valid");
    if (statusEl) statusEl.textContent = "✗";
  }
}

export function handleRegisterSubmit(event) {
  if (event) event.preventDefault();

  if (!validateRegistrationForm()) {
    showCustomAlert("❌ يرجى التأكد من استيفاء جميع الشروط قبل المتابعة");
    return;
  }

  const emailInput = document.getElementById("regEmail");
  const email = (emailInput?.value || "").trim().toLowerCase();
  const fullName = sanitizeInput(
    document.getElementById("regFullName")?.value || "",
  );
  const phone = sanitizeInput(document.getElementById("regPhone")?.value || "");
  const gender = document.getElementById("regGender")?.value || "";
  const birthDateStr = document.getElementById("regBirthDate")?.value || "";
  const role = document.getElementById("selectedRole")?.value || "student";
  const password = document.getElementById("regPassword")?.value || "";
  const avatar = DEFAULT_AVATAR;

  // Requirement 5: Check if email already exists inside localStorage or registered list
  const existingInStorage = findUserByEmail(email);
  const isPreRegistered = registeredEmails
    .map((e) => e.toLowerCase())
    .includes(email);

  if (existingInStorage || isPreRegistered) {
    showCustomAlert("هذا البريد الإلكتروني مسجل بالفعل");
    tempSelectedEmail = email;
    redirectToLoginWithEmail();
    return;
  }

  // Requirement 2: Create temporary user object and save in localStorage
  const newUser = {
    fullName: fullName,
    email: email,
    avatar: avatar,
    phone: phone,
    gender: gender,
    birthDate: birthDateStr,
    accountType: role,
    password: password,
    registrationDate: new Date().toISOString(),
  };

  saveUserToStorage(newUser);
  setCurrentUser(newUser);

  // Requirement 2 & 3: Mark logged in & update state
  window.appState.isLoggedIn = true;
  window.appState.userRole = role;
  window.appState.userData = {
    name: fullName,
    email: email,
    image: avatar,
    phone: phone,
    gender: gender,
    birthDate: birthDateStr,
    accountType: role,
    courses: [],
  };

  // Requirement 3: Close modal, update navbar, show success notification
  closeAuth();
  updateUserState();

  if (role === "teacher") {
    window.location.hash = "#teacher/dashboard";
    showCustomAlert("تم إنشاء حساب معلم بنجاح! مرحباً بك.");
    if (window.showDashboard) {
      window.showDashboard();
    }
  } else {
    window.location.hash = "#home";
    showCustomAlert("تم إنشاء الحساب بنجاح! مرحباً بك.");
    if (typeof window.showHomeSection === "function") {
      window.showHomeSection("home");
    }
  }
}

export function showLogin(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById("authModal");
  const modalContent = document.querySelector("#authModal .modal-content");
  modalContent?.classList.remove("wide-modal");

  document.getElementById("loginForm")?.classList.remove("hidden");
  document.getElementById("registerForm")?.classList.add("hidden");
  modal?.classList.add("show");
}

export function showRegister(event) {
  if (event) event.preventDefault();
  resetRegisterFlow();
  setupRegisterInputListeners();
  const modal = document.getElementById("authModal");
  const modalContent = document.querySelector("#authModal .modal-content");
  modalContent?.classList.add("wide-modal");

  document.getElementById("loginForm")?.classList.add("hidden");
  document.getElementById("registerForm")?.classList.remove("hidden");
  modal?.classList.add("show");
  validateRegistrationForm();
}

export function switchToLogin(event) {
  if (event) event.preventDefault();
  const modalContent = document.querySelector("#authModal .modal-content");
  modalContent?.classList.remove("wide-modal");

  document.getElementById("registerForm")?.classList.add("hidden");
  document.getElementById("loginForm")?.classList.remove("hidden");
}

export function switchToRegister(event) {
  if (event) event.preventDefault();
  resetRegisterFlow();
  setupRegisterInputListeners();
  const modal = document.getElementById("authModal");
  const modalContent = document.querySelector("#authModal .modal-content");
  modalContent?.classList.add("wide-modal");

  document.getElementById("loginForm")?.classList.add("hidden");
  document.getElementById("registerForm")?.classList.remove("hidden");
  modal?.classList.add("show");
  validateRegistrationForm();
}

export function closeAuth() {
  document.getElementById("authModal")?.classList.remove("show");
  const modalContent = document.querySelector("#authModal .modal-content");
  modalContent?.classList.remove("wide-modal");
}

export function handleLogin(event) {
  if (event) event.preventDefault();
  const loginEmailInput = document.getElementById("loginEmail");
  const loginPasswordInput = document.getElementById("loginPassword");
  const email = loginEmailInput
    ? loginEmailInput.value.trim().toLowerCase()
    : "";
  const password = loginPasswordInput ? loginPasswordInput.value : "";

  if (!email || !password) {
    showCustomAlert("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    return;
  }

  // Check Platform Owner Credentials
  if (isPlatformOwnerCredentials(email, password)) {
    const ownerUser = {
      fullName: "Platform Owner (مالك المنصة)",
      email: email,
      avatar: DEFAULT_AVATAR,
      accountType: "owner",
      role: "owner",
      isPlatformOwner: true,
    };
    saveUserToStorage(ownerUser);
    setCurrentUser(ownerUser);

    window.appState.isLoggedIn = true;
    window.appState.userRole = "owner";
    window.appState.userData = {
      name: ownerUser.fullName,
      email: ownerUser.email,
      image: DEFAULT_AVATAR,
      phone: "",
      gender: "",
      birthDate: "",
      accountType: "owner",
      role: "owner",
      courses: [],
    };

    updateUserState();
    closeAuth();

    window.location.hash = "#teacher/payouts";
    showCustomAlert(
      "تم تسجيل الدخول بنجاح بصفتك مالك المنصة (Platform Owner)! تمتلك كافة الصلاحيات.",
    );

    if (window.showDashboard) {
      window.showDashboard();
    }
    return;
  }

  // Check Teacher Test Credentials
  if (isTeacherTestCredentials(email, password)) {
    if (isAccountBlocked(email) || isAccountBlocked("teacher-1")) {
      closeAuth();
      showSuspendedAccountModal(
        "تم إيقاف حسابك مؤقتًا من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.",
        "تم إيقاف حسابك",
      );
      return;
    }

    const teacherUser = {
      fullName: "د. أحمد خليل (معلم تجريبي)",
      email: email,
      avatar: DEFAULT_AVATAR,
      accountType: "teacher",
      role: "teacher",
    };
    saveUserToStorage(teacherUser);
    setCurrentUser(teacherUser);

    window.appState.isLoggedIn = true;
    window.appState.userRole = "teacher";
    window.appState.userData = {
      name: teacherUser.fullName,
      email: teacherUser.email,
      image: DEFAULT_AVATAR,
      phone: "",
      gender: "",
      birthDate: "",
      accountType: "teacher",
      role: "teacher",
      courses: [],
    };

    updateUserState();
    closeAuth();

    window.location.hash = "#teacher/dashboard";
    showCustomAlert("تم تسجيل الدخول بنجاح بصفتك معلم!");

    if (window.showDashboard) {
      window.showDashboard();
    }
    return;
  }

  // Check Student Test Credentials
  if (isStudentTestCredentials(email, password)) {
    if (isAccountBlocked(email) || isAccountBlocked("std-101")) {
      closeAuth();
      showSuspendedAccountModal(
        "تم حظر حسابك من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني لإعادة تفعيل الحساب.",
        "تم حظر حسابك",
      );
      return;
    }

    const studentUser = {
      fullName: "إسلام عادل (طالب تجريبي)",
      email: email,
      avatar: DEFAULT_AVATAR,
      accountType: "student",
      role: "student",
    };
    saveUserToStorage(studentUser);
    setCurrentUser(studentUser);

    window.appState.isLoggedIn = true;
    window.appState.userRole = "student";
    window.appState.userData = {
      name: studentUser.fullName,
      email: studentUser.email,
      image: DEFAULT_AVATAR,
      phone: "",
      gender: "",
      birthDate: "",
      accountType: "student",
      role: "student",
      courses: [],
    };

    updateUserState();
    closeAuth();

    window.location.hash = "#home";
    if (typeof window.showHomeSection === "function") {
      window.showHomeSection("home");
    }
    return;
  }

  let foundUser = findUserByEmail(email);

  if (!foundUser) {
    showCustomAlert("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    return;
  }

  // Validate password for registered/stored user
  const userPassword = foundUser.password || "";
  if (!userPassword || userPassword !== password) {
    showCustomAlert("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    return;
  }

  if (isAccountBlocked(email) || isAccountBlocked(foundUser)) {
    closeAuth();
    const role = (
      foundUser.accountType ||
      foundUser.role ||
      "student"
    ).toLowerCase();
    if (role === "teacher") {
      showSuspendedAccountModal(
        "تم إيقاف حسابك مؤقتًا من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.",
        "تم إيقاف حسابك",
      );
    } else {
      showSuspendedAccountModal(
        "تم حظر حسابك من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني لإعادة تفعيل الحساب.",
        "تم حظر حسابك",
      );
    }
    return;
  }

  const role = foundUser.accountType || foundUser.role || "student";

  window.appState.isLoggedIn = true;
  window.appState.userRole = role;
  window.appState.userData = {
    name: foundUser.fullName || foundUser.name,
    email: foundUser.email,
    image: foundUser.avatar || foundUser.image || DEFAULT_AVATAR,
    phone: foundUser.phone || "",
    gender: foundUser.gender || "",
    birthDate: foundUser.birthDate || "",
    accountType: role,
    role: role,
    courses: [],
  };
  setCurrentUser(foundUser);

  updateUserState();
  closeAuth();

  if (role === "teacher") {
    window.location.hash = "#teacher/dashboard";
    showCustomAlert("تم تسجيل الدخول بنجاح! مرحباً بك في لوحة المعلم");
    if (window.showDashboard) {
      window.showDashboard();
    }
  } else {
    window.location.hash = "#home";
    if (typeof window.showHomeSection === "function") {
      window.showHomeSection("home");
    }
  }
}

export function handleOAuth(provider) {
  handleGoogleSignIn();
}

export function toggleProfile(event) {
  if (event) {
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
  }

  // Check if user is authenticated before opening profile menu
  const isLoggedIn = Boolean(window.appState?.isLoggedIn);
  if (!isLoggedIn) {
    return; // Do not open profile navigation for unauthenticated users
  }

  const sidebar = document.getElementById("profileSidebar");
  if (!sidebar) return;

  const willShow = !sidebar.classList.contains("show");
  document
    .querySelectorAll(".cart-sidebar, .sidebar-drawer")
    .forEach((s) => s.classList.remove("show"));

  if (willShow) {
    sidebar.classList.add("show");
  } else {
    sidebar.classList.remove("show");
  }
  syncSidebarOverlayAndScroll();
}

export function showUserProfile() {
  if (window.renderProfilePage) {
    window.renderProfilePage();
  } else {
    const role = window.appState?.userRole || "student";
    window.location.hash =
      role === "teacher" ? "#teacher/profile" : "#student/profile";
  }
}

export function saveProfile() {
  updateUserState();
  showCustomAlert("تم حفظ التغييرات بنجاح!");
  closeUserProfile();
}

export function closeUserProfile() {
  document.getElementById("userProfileModal")?.classList.remove("show");
}

export function updateProfileImage() {
  const file = document.getElementById("profileImageInput")?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showCustomAlert("من فضلك اختر صورة صحيحة");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const imageData = event.target.result;
    window.appState.userData.image = imageData;
    const previewImage = document.getElementById("previewImage");
    if (previewImage) previewImage.src = imageData;
    updateUserState();
  };
  reader.readAsDataURL(file);
}

export async function handleLogout() {
  const confirmed = await (window.showConfirmDialog
    ? window.showConfirmDialog({
        title: "تأكيد تسجيل الخروج",
        message: "هل أنت تأكد من رغبتك في تسجيل الخروج من حسابك الشخصي؟",
        confirmText: "تسجيل الخروج",
        cancelText: "إلغاء",
        danger: true,
      })
    : Promise.resolve(true));

  if (!confirmed) return;

  window.appState.isLoggedIn = false;
  window.appState.userRole = "student";
  removeCurrentUser();

  updateUserState();

  if (document.getElementById("profileSidebar")?.classList.contains("show")) {
    toggleProfile();
  }

  if (window.showSuccessToast) {
    window.showSuccessToast({
      title: "تم تسجيل الخروج",
      message: "تم تسجيل الخروج من حسابك بنجاح.",
    });
  } else {
    showCustomAlert("تم تسجيل الخروج بنجاح!");
  }
}
