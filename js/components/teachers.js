import { teachersData } from "../data/teachers.js";
import { getFeaturedConfig } from "../.featured-config.js";

export function renderHomeTeachers() {
  const teachersSection = document.querySelector(".top-teachers-section");
  if (!teachersSection) return;

  const teachersGrid = teachersSection.querySelector(".teachers-grid");
  if (!teachersGrid) return;

  const { featuredTeachers } = getFeaturedConfig();
  let displayTeachers = [];

  if (Array.isArray(featuredTeachers) && featuredTeachers.length > 0) {
    featuredTeachers.forEach((id) => {
      const t = teachersData.find((item) => String(item.id) === String(id));
      if (t) displayTeachers.push(t);
    });
  }

  // Fallback if none configured
  if (displayTeachers.length === 0) {
    displayTeachers = teachersData.slice(0, 5);
  }

  teachersGrid.innerHTML = displayTeachers.map((t) => `
    <div class="teacher-card" onclick="if(window.navigateToTeacherProfile) window.navigateToTeacherProfile('${t.id}');" style="cursor: pointer;" title="عرض الملف الشخصي للمعلم ${t.name}">
      <img src="${t.avatar}" alt="${t.name}" class="teacher-avatar-circle" />
      <h3 class="teacher-name">${t.name}</h3>
      <span class="teacher-role">${t.role}</span>
      <p style="font-size: 12px; color: var(--sm-text-light, #64748b); line-height: 1.5; margin: 6px 0 10px; text-align: center;">
        ${t.bio || ""}
      </p>
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; font-size: 11px; margin-bottom: 12px;">
        ${t.experience ? `<span style="background: rgba(124, 58, 237, 0.08); color: #7c3aed; padding: 3px 8px; border-radius: 6px; font-weight: 700;">⏳ ${t.experience}</span>` : ""}
        ${t.company ? `<span style="background: rgba(16, 185, 129, 0.08); color: #059669; padding: 3px 8px; border-radius: 6px; font-weight: 700;">🏢 ${t.company}</span>` : ""}
      </div>
      <div class="teacher-stats-row">
        <span>⭐ ${t.rating || "5.0"}</span>
        <span>👥 ${t.studentsCount || "1K"}</span>
        <span>📚 ${t.coursesCount || 0} دورة</span>
      </div>
    </div>
  `).join("");
}

window.renderHomeTeachers = renderHomeTeachers;
