import { setupSearch } from "../components/search.js";
import { setupFilters } from "../components/filter.js";
import {
  loadCourses,
  filterCourses,
  initializeCourseInteractions,
} from "../services/courseService.js";
import { setupThemeToggle } from "../services/themeService.js";
import { setupAuth } from "../services/authService.js";
import { setupCart } from "../services/cartService.js";
import { renderBooksSection } from "../components/books.js";
import { renderHomeTestimonials } from "../components/testimonials.js";
import { renderHomeTeachers } from "../components/teachers.js";
import { loadLocalStorage } from "../utils/helpers.js";

export function initHomePage() {
  setupSearch();
  setupFilters();
  setupThemeToggle();
  setupAuth();
  setupCart();

  loadCourses();
  renderBooksSection();
  renderHomeTeachers();
  renderHomeTestimonials();
  initializeCourseInteractions();

  const savedTheme = loadLocalStorage("theme", "light");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const toggleBtn = document.querySelector(".theme-toggle");
    if (toggleBtn) toggleBtn.textContent = "☀️";
  }
}
