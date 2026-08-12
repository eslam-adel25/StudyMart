// .featured-config.js - Data source for Homepage Featured Courses & Books

const STORAGE_KEY = "studymart_featured_config";
const DRAFT_STORAGE_KEY = "studymart_featured_draft";

let activeDraft = null;

const defaultConfig = {
  featuredCourses: [1, 2, 3, 4],
  featuredBooks: [201, 202, 203, 204],
  featuredTeachers: ["teacher-1", "teacher-2", "teacher-3", "teacher-4", "teacher-5"],
  featuredReviews: ["REV-501", "REV-502", "REV-503"],
  courseMetadata: {
    1: { isFeatured: true, isBestSeller: true, isNew: false, isTopRated: true, isOffer: true },
    2: { isFeatured: true, isBestSeller: true, isNew: true, isTopRated: true, isOffer: false },
    3: { isFeatured: true, isBestSeller: false, isNew: false, isTopRated: false, isOffer: true },
    4: { isFeatured: true, isBestSeller: true, isNew: true, isTopRated: true, isOffer: true },
    5: { isFeatured: false, isBestSeller: false, isNew: true, isTopRated: false, isOffer: false },
    6: { isFeatured: false, isBestSeller: true, isNew: false, isTopRated: true, isOffer: true }
  },
  bookMetadata: {
    201: { isFeatured: true, isBestSeller: true, isNew: false, isTopRated: true, isOffer: true },
    202: { isFeatured: true, isBestSeller: true, isNew: true, isTopRated: true, isOffer: true },
    203: { isFeatured: true, isBestSeller: false, isNew: false, isTopRated: false, isOffer: false },
    204: { isFeatured: true, isBestSeller: true, isNew: true, isTopRated: true, isOffer: true },
    205: { isFeatured: false, isBestSeller: false, isNew: true, isTopRated: false, isOffer: true }
  }
};

function loadStoredConfig() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.featuredCourses) && Array.isArray(parsed.featuredBooks)) {
        return {
          featuredCourses: parsed.featuredCourses,
          featuredBooks: parsed.featuredBooks,
          featuredTeachers: Array.isArray(parsed.featuredTeachers) ? parsed.featuredTeachers : defaultConfig.featuredTeachers,
          featuredReviews: Array.isArray(parsed.featuredReviews) ? parsed.featuredReviews : defaultConfig.featuredReviews,
          courseMetadata: parsed.courseMetadata || defaultConfig.courseMetadata,
          bookMetadata: parsed.bookMetadata || defaultConfig.bookMetadata
        };
      }
    }
  } catch (e) {
    console.warn("Unable to read featured config from storage:", e);
  }
  return defaultConfig;
}

const initialConfig = loadStoredConfig();

export let featuredCourses = [...initialConfig.featuredCourses];
export let featuredBooks = [...initialConfig.featuredBooks];
export let featuredTeachers = [...initialConfig.featuredTeachers];
export let featuredReviews = [...initialConfig.featuredReviews];

export function getSavedConfig() {
  const cfg = loadStoredConfig();
  return {
    featuredCourses: [...cfg.featuredCourses],
    featuredBooks: [...cfg.featuredBooks],
    featuredTeachers: [...cfg.featuredTeachers],
    featuredReviews: [...cfg.featuredReviews],
    courseMetadata: { ...(cfg.courseMetadata || {}) },
    bookMetadata: { ...(cfg.bookMetadata || {}) }
  };
}

export function getDraftConfig() {
  if (activeDraft) {
    return {
      featuredCourses: [...(activeDraft.featuredCourses || [])],
      featuredBooks: [...(activeDraft.featuredBooks || [])],
      featuredTeachers: [...(activeDraft.featuredTeachers || [])],
      featuredReviews: [...(activeDraft.featuredReviews || [])],
      courseMetadata: { ...(activeDraft.courseMetadata || {}) },
      bookMetadata: { ...(activeDraft.bookMetadata || {}) }
    };
  }
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      activeDraft = {
        featuredCourses: parsed.featuredCourses || [],
        featuredBooks: parsed.featuredBooks || [],
        featuredTeachers: parsed.featuredTeachers || [],
        featuredReviews: parsed.featuredReviews || [],
        courseMetadata: parsed.courseMetadata || {},
        bookMetadata: parsed.bookMetadata || {}
      };
      return getDraftConfig();
    }
  } catch (e) {
    console.warn("Unable to read featured draft from session storage:", e);
  }
  return null;
}

export function setDraftConfig(draft) {
  if (!draft) return;
  activeDraft = {
    featuredCourses: [...(draft.featuredCourses || [])],
    featuredBooks: [...(draft.featuredBooks || [])],
    featuredTeachers: [...(draft.featuredTeachers || [])],
    featuredReviews: [...(draft.featuredReviews || [])],
    courseMetadata: { ...(draft.courseMetadata || {}) },
    bookMetadata: { ...(draft.bookMetadata || {}) }
  };
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(activeDraft));
  } catch (e) {
    console.warn("Unable to save draft to session storage:", e);
  }
}

export function hasDraftConfig() {
  return getDraftConfig() !== null;
}

export function clearDraftConfig() {
  activeDraft = null;
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    // ignore
  }
}

export function getFeaturedConfig() {
  const draft = getDraftConfig();
  if (draft) {
    return draft;
  }
  return getSavedConfig();
}

export function saveFeaturedConfig(newCourses, newBooks, newTeachers, newReviews, courseMeta, bookMeta) {
  // Support flexible argument signatures
  if (Array.isArray(newCourses)) {
    featuredCourses.length = 0;
    featuredCourses.push(...newCourses);
  }

  if (Array.isArray(newBooks)) {
    featuredBooks.length = 0;
    featuredBooks.push(...newBooks);
  }

  if (Array.isArray(newTeachers)) {
    featuredTeachers.length = 0;
    featuredTeachers.push(...newTeachers);
  }

  if (Array.isArray(newReviews)) {
    featuredReviews.length = 0;
    featuredReviews.push(...newReviews);
  }

  const currentCfg = loadStoredConfig();
  const updatedCourseMeta = courseMeta || currentCfg.courseMetadata || {};
  const updatedBookMeta = bookMeta || currentCfg.bookMetadata || {};
  const updatedTeachers = Array.isArray(newTeachers) ? newTeachers : (currentCfg.featuredTeachers || defaultConfig.featuredTeachers);
  const updatedReviews = Array.isArray(newReviews) ? newReviews : (currentCfg.featuredReviews || defaultConfig.featuredReviews);

  const payload = {
    featuredCourses: featuredCourses,
    featuredBooks: featuredBooks,
    featuredTeachers: updatedTeachers,
    featuredReviews: updatedReviews,
    courseMetadata: updatedCourseMeta,
    bookMetadata: updatedBookMeta
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    clearDraftConfig();
  } catch (e) {
    console.warn("Unable to save featured config to storage:", e);
    throw e;
  }
}

export function applyFeaturedMetadata(courses = [], books = []) {
  const { featuredCourses: fCourses, featuredBooks: fBooks, courseMetadata, bookMetadata } = getFeaturedConfig();

  if (Array.isArray(courses)) {
    courses.forEach((c) => {
      const idStr = String(c.id);
      const meta = courseMetadata[idStr] || courseMetadata[c.id] || {};
      c.isFeatured = meta.isFeatured !== undefined ? meta.isFeatured : fCourses.some((id) => String(id) === idStr);
      c.isBestSeller = meta.isBestSeller !== undefined ? meta.isBestSeller : (Number(c.students || 0) > 1000 || c.id === 1 || c.id === 2);
      c.isNew = meta.isNew !== undefined ? meta.isNew : (c.id === 2 || c.id === 4 || c.id === 5 || c.id === 7);
      c.isTopRated = meta.isTopRated !== undefined ? meta.isTopRated : (Number(c.rating || 0) >= 4.8);
      c.isOffer = meta.isOffer !== undefined ? meta.isOffer : (c.price < 200 || c.id === 1 || c.id === 3 || c.id === 4 || Boolean(c.originalPrice));
    });
  }

  if (Array.isArray(books)) {
    books.forEach((b) => {
      const idStr = String(b.id);
      const meta = bookMetadata[idStr] || bookMetadata[b.id] || {};
      b.isFeatured = meta.isFeatured !== undefined ? meta.isFeatured : fBooks.some((id) => String(id) === idStr);
      b.isBestSeller = meta.isBestSeller !== undefined ? meta.isBestSeller : (Number(b.purchases || 0) > 500 || b.id === 201 || b.id === 202);
      b.isNew = meta.isNew !== undefined ? meta.isNew : (b.id === 202 || b.id === 204 || b.id === 205);
      b.isTopRated = meta.isTopRated !== undefined ? meta.isTopRated : (Number(b.rating || 0) >= 4.8);
      b.isOffer = meta.isOffer !== undefined ? meta.isOffer : (Boolean(b.discountPrice && b.discountPrice < b.price) || b.id === 201 || b.id === 202 || b.id === 204);
    });
  }
}


