export const $ = (selector, parent = document) =>
  parent.querySelector(selector);
export const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));

export function formatCourseCategory(category) {
  const mapping = {
    programming: "برمجة",
    design: "تصميم",
    languages: "لغات",
    development: "تنمية ذاتية",
    trading: "تداول",
  };
  return mapping[category] || category;
}

export function formatCourseLevel(level) {
  const mapping = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
  };
  return mapping[level] || level;
}

export function createElementFromHTML(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

import {
  showCustomAlert as newCustomAlert,
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  showConfirmDialog,
  showInputDialog,
  showLoadingDialog,
  notify
} from "../services/notificationService.js";

export {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showLoadingToast,
  showConfirmDialog,
  showInputDialog,
  showLoadingDialog,
  notify
};

export function showCustomAlert(message, title, options) {
  return newCustomAlert(message, title, options);
}

export function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

export function loadLocalStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalStorage(key, value) {
  try {
    let sanitizedValue = value;
    if (key === "userPurchasedBooks" && Array.isArray(value)) {
      sanitizedValue = value.map((b) => {
        if (!b || typeof b !== "object") return b;
        const { fileDataUrl, previewFileDataUrl, fileBlob, pdfData, content, ...clean } = b;
        if (clean.image && typeof clean.image === "string" && clean.image.length > 2000 && clean.image.startsWith("data:")) {
          delete clean.image;
        }
        if (clean.coverUrl && typeof clean.coverUrl === "string" && clean.coverUrl.length > 2000 && clean.coverUrl.startsWith("data:")) {
          delete clean.coverUrl;
        }
        return clean;
      });
    }
    localStorage.setItem(key, JSON.stringify(sanitizedValue));
  } catch (err) {
    console.warn(`Error saving item '${key}' to localStorage:`, err);
    if (key === "userPurchasedBooks" && Array.isArray(value)) {
      try {
        const idList = value.map((b) => (typeof b === "object" ? b.id : b)).filter(Boolean);
        localStorage.setItem(key, JSON.stringify(idList));
      } catch (e2) {
        console.error("Critical storage error for userPurchasedBooks:", e2);
      }
    }
  }
}

export function clampNumber(value, min = 0, max = 100) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
