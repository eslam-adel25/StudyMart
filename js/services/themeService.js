import { loadLocalStorage, saveLocalStorage } from "../utils/helpers.js";

function syncThemeButton() {
  const button = document.querySelector(".theme-toggle");
  if (!button) return;
  const isDark = document.body.classList.contains("dark-mode");
  if (isDark) {
    button.innerHTML = `<svg class="theme-sun-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    button.setAttribute("aria-label", "تفعيل المظهر الفاتح");
    button.setAttribute("data-tooltip", "المظهر الفاتح");
    button.setAttribute("title", "المظهر الفاتح");
  } else {
    button.innerHTML = `<svg class="theme-moon-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    button.setAttribute("aria-label", "تفعيل المظهر الداكن");
    button.setAttribute("data-tooltip", "المظهر الداكن");
    button.setAttribute("title", "المظهر الداكن");
  }
}

export function setupThemeToggle() {
  const savedTheme = loadLocalStorage("theme", "light");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  syncThemeButton();
}

export function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  saveLocalStorage("theme", isDark ? "dark" : "light");
  syncThemeButton();
}
