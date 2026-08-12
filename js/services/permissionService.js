/**
 * Centralized Permission System
 * Temporary implementation reading platform owner configuration from .env.
 * Designed for clean, modular, and easy replacement with a real backend RBAC system.
 */

// Reads environment configuration for Platform Owner
export function getPlatformOwnerCredentials() {
  const email =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.PLATFORM_OWNER_EMAIL) ||
    "2005eaja@gmail.com";
  const password =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.PLATFORM_OWNER_PASSWORD) ||
    "Eslam@50";
  return {
    email: email.trim().toLowerCase(),
    password: password.trim()
  };
}

// Validates credentials against Platform Owner configuration
export function isPlatformOwnerCredentials(email, password) {
  const creds = getPlatformOwnerCredentials();
  if (!creds.email || !creds.password) return false;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = (password || "").trim();
  const isMatchEmail = cleanEmail === creds.email || cleanEmail === "owner@gmail.com";
  return isMatchEmail && cleanPassword === creds.password;
}

// Reads environment configuration for Teacher Test account
export function getTeacherTestCredentials() {
  const email =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.TEACHER_TEST_EMAIL) ||
    "evip4158@gmail.com";
  const password =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.TEACHER_TEST_PASSWORD) ||
    "Eslam@401";
  return {
    email: email.trim().toLowerCase(),
    password: password.trim()
  };
}

// Validates credentials against Teacher Test configuration
export function isTeacherTestCredentials(email, password) {
  const creds = getTeacherTestCredentials();
  if (!creds.email || !creds.password) return false;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = (password || "").trim();
  const isMatchEmail = cleanEmail === creds.email || cleanEmail === "teacher@gmail.com";
  return isMatchEmail && cleanPassword === creds.password;
}

// Reads environment configuration for Student Test account
export function getStudentTestCredentials() {
  const email =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.STUDENT_TEST_EMAIL) ||
    "etak5806@gmail.com";
  const password =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.STUDENT_TEST_PASSWORD) ||
    "Eslam@301";
  return {
    email: email.trim().toLowerCase(),
    password: password.trim()
  };
}

// Validates credentials against Student Test configuration
export function isStudentTestCredentials(email, password) {
  const creds = getStudentTestCredentials();
  if (!creds.email || !creds.password) return false;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = (password || "").trim();
  const isMatchEmail = cleanEmail === creds.email || cleanEmail === "student@gmail.com";
  return isMatchEmail && cleanPassword === creds.password;
}

// Get current role from global state
export function getCurrentUserRole() {
  return window.appState?.userRole || "student";
}

// Role checks
export function isOwner(role = getCurrentUserRole()) {
  return role === "owner";
}

export function isTeacher(role = getCurrentUserRole()) {
  return role === "teacher" || role === "owner";
}

export function isStudent(role = getCurrentUserRole()) {
  return role === "student" || role === "owner";
}

// Standard Permission Constants
export const PERMISSIONS = {
  // User Management
  MANAGE_USERS: "MANAGE_USERS",
  DELETE_ACCOUNT: "DELETE_ACCOUNT",
  SUSPEND_ACCOUNT: "SUSPEND_ACCOUNT",
  ACTIVATE_ACCOUNT: "ACTIVATE_ACCOUNT",
  PROMOTE_DEMOTE_ACCOUNTS: "PROMOTE_DEMOTE_ACCOUNTS",
  MANAGE_TEACHERS: "MANAGE_TEACHERS",
  MANAGE_STUDENTS: "MANAGE_STUDENTS",

  // Analytics & Reports
  VIEW_REPORTS: "VIEW_REPORTS",
  VIEW_ANALYTICS: "VIEW_ANALYTICS",

  // Content Management
  MANAGE_BOOKS: "MANAGE_BOOKS",
  MANAGE_COURSES: "MANAGE_COURSES",
  PUBLISH_UNPUBLISH_COURSE: "PUBLISH_UNPUBLISH_COURSE",
  PUBLISH_UNPUBLISH_BOOK: "PUBLISH_UNPUBLISH_BOOK",
  EDIT_COURSE: "EDIT_COURSE",
  EDIT_BOOK: "EDIT_BOOK",
  DELETE_COURSE: "DELETE_COURSE",
  DELETE_BOOK: "DELETE_BOOK",

  // Finance & Payouts
  APPROVE_REJECT_WITHDRAWALS: "APPROVE_REJECT_WITHDRAWALS",
  VIEW_TRANSACTIONS: "VIEW_TRANSACTIONS",
  MANAGE_REVENUES: "MANAGE_REVENUES",

  // Navigation & Access
  ACCESS_EVERY_DASHBOARD: "ACCESS_EVERY_DASHBOARD",
  ACCESS_EVERY_PAGE: "ACCESS_EVERY_PAGE",
  ACCESS_EVERY_MANAGEMENT_SCREEN: "ACCESS_EVERY_MANAGEMENT_SCREEN",
  ACCESS_ALL_SETTINGS: "ACCESS_ALL_SETTINGS",

  // Premium & Paid Restrictions Bypass
  BYPASS_PAID_RESTRICTIONS: "BYPASS_PAID_RESTRICTIONS",
  OPEN_EVERY_PAID_COURSE: "OPEN_EVERY_PAID_COURSE",
  OPEN_EVERY_PAID_BOOK: "OPEN_EVERY_PAID_BOOK",
  DOWNLOAD_EVERY_RESOURCE: "DOWNLOAD_EVERY_RESOURCE",
  USE_EVERY_PREMIUM_FEATURE: "USE_EVERY_PREMIUM_FEATURE"
};

/**
 * Primary Central Permission Checker.
 * Owner role returns TRUE for all permissions without exception.
 */
export function hasPermission(permissionName, role = getCurrentUserRole()) {
  // Owner role bypasses ALL permission checks
  if (isOwner(role)) return true;

  switch (permissionName) {
    case PERMISSIONS.MANAGE_COURSES:
    case PERMISSIONS.MANAGE_BOOKS:
    case PERMISSIONS.PUBLISH_UNPUBLISH_COURSE:
    case PERMISSIONS.PUBLISH_UNPUBLISH_BOOK:
    case PERMISSIONS.EDIT_COURSE:
    case PERMISSIONS.EDIT_BOOK:
    case PERMISSIONS.DELETE_COURSE:
    case PERMISSIONS.DELETE_BOOK:
    case PERMISSIONS.MANAGE_STUDENTS:
    case PERMISSIONS.VIEW_ANALYTICS:
    case PERMISSIONS.VIEW_TRANSACTIONS:
      return role === "teacher";

    case PERMISSIONS.MANAGE_USERS:
    case PERMISSIONS.DELETE_ACCOUNT:
    case PERMISSIONS.SUSPEND_ACCOUNT:
    case PERMISSIONS.ACTIVATE_ACCOUNT:
    case PERMISSIONS.PROMOTE_DEMOTE_ACCOUNTS:
    case PERMISSIONS.MANAGE_TEACHERS:
    case PERMISSIONS.VIEW_REPORTS:
    case PERMISSIONS.APPROVE_REJECT_WITHDRAWALS:
    case PERMISSIONS.MANAGE_REVENUES:
    case PERMISSIONS.ACCESS_EVERY_DASHBOARD:
    case PERMISSIONS.ACCESS_EVERY_PAGE:
    case PERMISSIONS.ACCESS_EVERY_MANAGEMENT_SCREEN:
    case PERMISSIONS.ACCESS_ALL_SETTINGS:
    case PERMISSIONS.BYPASS_PAID_RESTRICTIONS:
    case PERMISSIONS.OPEN_EVERY_PAID_COURSE:
    case PERMISSIONS.OPEN_EVERY_PAID_BOOK:
    case PERMISSIONS.DOWNLOAD_EVERY_RESOURCE:
    case PERMISSIONS.USE_EVERY_PREMIUM_FEATURE:
      return role === "owner";

    default:
      return false;
  }
}

/**
 * Course Access check (bypasses paid restrictions for owner)
 */
export function canAccessCourse(courseId, role = getCurrentUserRole(), userCourses = window.appState?.userCourses || []) {
  if (hasPermission(PERMISSIONS.BYPASS_PAID_RESTRICTIONS, role)) return true;
  return userCourses.includes(courseId) || userCourses.includes(Number(courseId));
}

/**
 * Book Access check (bypasses paid restrictions for owner)
 */
export function canAccessBook(bookId, role = getCurrentUserRole(), userPurchasedBooks = window.appState?.userPurchasedBooks || []) {
  if (hasPermission(PERMISSIONS.BYPASS_PAID_RESTRICTIONS, role)) return true;
  return userPurchasedBooks.some((b) => String(b.id) === String(bookId));
}

/**
 * Route protection check
 */
export function canAccessRoute(routeHash, role = getCurrentUserRole()) {
  if (hasPermission(PERMISSIONS.ACCESS_EVERY_PAGE, role)) return true;
  if (!routeHash) return true;

  if (routeHash.includes("teacher")) return isTeacher(role);
  if (routeHash.includes("student")) return isStudent(role);

  return true;
}

// Global window bindings
if (typeof window !== "undefined") {
  window.PermissionService = {
    getPlatformOwnerCredentials,
    isPlatformOwnerCredentials,
    getTeacherTestCredentials,
    isTeacherTestCredentials,
    getStudentTestCredentials,
    isStudentTestCredentials,
    getCurrentUserRole,
    isOwner,
    isTeacher,
    isStudent,
    hasPermission,
    canAccessCourse,
    canAccessBook,
    canAccessRoute,
    PERMISSIONS
  };
}
