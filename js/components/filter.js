import { filterCourses } from "../services/courseService.js";

export function setupFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const levelFilter = document.getElementById("levelFilter");

  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterCourses);
  }
  if (levelFilter) {
    levelFilter.addEventListener("change", filterCourses);
  }
}

export function getFilterValues() {
  return {
    category: document.getElementById("categoryFilter")?.value || "",
    level: document.getElementById("levelFilter")?.value || "",
  };
}
