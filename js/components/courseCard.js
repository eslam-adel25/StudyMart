import { formatCourseCategory, formatCourseLevel } from "../utils/helpers.js";
import { isFavorite, toggleFavorite } from "../services/favoritesService.js";

export function createCourseCard(course, onDetails) {
  const card = document.createElement("div");
  card.className = "course-card";
  const favState = isFavorite("course", course.id);
  const heartFill = favState ? "#ef4444" : "none";
  const heartStroke = favState ? "#ef4444" : "#ffffff";

  card.innerHTML = `
    <div class="course-image" style="background-image: url('${course.image}'); background-size: cover; background-position: center; position: relative;">
      <div class="course-badge ${course.level}">${formatCourseLevel(course.level)}</div>
      <button type="button" class="course-fav-btn ${favState ? "active" : ""}" title="${favState ? "إزالة من المفضلة" : "إضافة للمفضلة"}" style="position: absolute; top: 12px; left: 12px; width: 36px; height: 36px; border-radius: 50%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease; z-index: 5;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
      </button>
    </div>
    <div class="course-content">
      <span class="course-category-tag">${formatCourseCategory(course.category)}</span>
      <h3>${course.title}</h3>
      <p class="course-description">${course.description}</p>
      <div class="course-meta">
        <span>📚 ${course.lessons} درس</span>
        <span>⏱️ ${course.duration} ساعة</span>
      </div>
      <p class="course-instructor">المدرس: ${course.instructor}</p>
      <div class="course-footer">
        <span class="course-price">$${course.price}</span>
        <span class="course-rating">⭐ ${course.rating}</span>
      </div>
      <button type="button" class="view-details-btn">عرض التفاصيل</button>
    </div>
  `;

  const favBtn = card.querySelector(".course-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const added = toggleFavorite("course", course);
      const svg = favBtn.querySelector("svg");
      if (added) {
        favBtn.classList.add("active");
        favBtn.title = "إزالة من المفضلة";
        if (svg) {
          svg.setAttribute("fill", "#ef4444");
          svg.setAttribute("stroke", "#ef4444");
        }
      } else {
        favBtn.classList.remove("active");
        favBtn.title = "إضافة للمفضلة";
        if (svg) {
          svg.setAttribute("fill", "none");
          svg.setAttribute("stroke", "#ffffff");
        }
      }
    });
  }

  const detailsButton = card.querySelector(".view-details-btn");
  if (detailsButton) {
    detailsButton.addEventListener("click", () => onDetails(course.id));
  }

  return card;
}
