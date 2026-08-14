import { coursesData } from "../data/courses.js";
import { teachersData, getTeacherById } from "../data/teachers.js";
import { reviewsData } from "../data/reviewsData.js";
import { isFavorite, toggleFavorite } from "./favoritesService.js";
import {
  getFeaturedConfig,
  applyFeaturedMetadata,
} from "../featured-config.js";
import { createCourseCard } from "../components/courseCard.js";
import {
  formatCourseCategory,
  formatCourseLevel,
  showCustomAlert,
  loadLocalStorage,
  saveLocalStorage,
} from "../utils/helpers.js";
import {
  updateCartUI,
  saveCart,
  computeCartTotal,
  completePayment,
} from "./cartService.js";
import { isStudent } from "./permissionService.js";
import { getSearchQuery } from "../components/search.js";
import { getFilterValues } from "../components/filter.js";
import { hideAllMainSections, showHomeSection } from "./layoutService.js";
import {
  getCourseQuestions,
  addCourseQuestion,
  answerCourseQuestion,
  deleteCourseQuestion,
  editCourseQuestion,
} from "../data/courseQuestionsData.js";

const coursesListId = "coursesList";

export const courseListState = {
  saved: false,
  scrollPosition: 0,
  searchQuery: "",
  category: "",
  level: "",
  courseId: null,
};

export function saveCourseListState(courseId = null) {
  const coursesSection =
    document.getElementById("coursesSection") ||
    document.querySelector(".courses");
  const isCoursesVisible =
    coursesSection && !coursesSection.classList.contains("hidden");

  let currentScroll = window.scrollY || document.documentElement.scrollTop || 0;

  if (!isCoursesVisible && courseListState.saved) {
    currentScroll = courseListState.scrollPosition;
  }

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const levelFilter = document.getElementById("levelFilter");

  courseListState.scrollPosition = currentScroll;
  courseListState.searchQuery = searchInput ? searchInput.value : "";
  courseListState.category = categoryFilter ? categoryFilter.value : "";
  courseListState.level = levelFilter ? levelFilter.value : "";
  courseListState.courseId = courseId;
  courseListState.saved = true;

  try {
    sessionStorage.setItem(
      "lms_course_list_state",
      JSON.stringify(courseListState),
    );
  } catch (e) {
    console.warn("Could not save course list state to sessionStorage", e);
  }
}

export function restoreCourseListState() {
  let state = courseListState;
  if (!state.saved) {
    try {
      const stored = sessionStorage.getItem("lms_course_list_state");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          state = parsed;
          Object.assign(courseListState, parsed);
        }
      }
    } catch (e) {
      console.warn("Could not read course list state from sessionStorage", e);
    }
  }

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const levelFilter = document.getElementById("levelFilter");

  if (searchInput) searchInput.value = state.searchQuery || "";
  if (categoryFilter) categoryFilter.value = state.category || "";
  if (levelFilter) levelFilter.value = state.level || "";

  filterCourses();
  showHomeSection("courses");

  const targetScroll = state.scrollPosition || 0;

  window.scrollTo({ top: targetScroll, behavior: "instant" });
  requestAnimationFrame(() => {
    window.scrollTo({ top: targetScroll, behavior: "instant" });
  });
}

export function returnToCourseList() {
  if (window.location.hash !== "#courses") {
    window.location.hash = "#courses";
  }
  restoreCourseListState();
}

export function navigateToHome() {
  if (window.location.hash !== "#home") {
    window.location.hash = "#home";
  }
  showHomeSection("home");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function loadCourses() {
  const coursesList = document.getElementById(coursesListId);
  if (!coursesList) return;
  coursesList.innerHTML = "";
  coursesData.forEach((course) => {
    const courseCard = createCourseCard(course, showCourseDetails);
    coursesList.appendChild(courseCard);
  });
}

let activeCourseTab = "bestseller";

export function handleCourseTabClick(btn, tab) {
  if (btn && btn.parentElement) {
    btn.parentElement
      .querySelectorAll(".tab-pill")
      .forEach((el) => el.classList.remove("active"));
    btn.classList.add("active");
  } else if (typeof btn === "string") {
    tab = btn;
  }
  if (tab) {
    activeCourseTab = tab;
  }
  filterCourses();
}
if (typeof window !== "undefined") {
  window.handleCourseTabClick = handleCourseTabClick;
}

export function filterCourses(specifiedTab) {
  if (typeof specifiedTab === "string" && specifiedTab.trim()) {
    activeCourseTab = specifiedTab.trim();
  }

  applyFeaturedMetadata(coursesData, []);

  const searchInput = getSearchQuery();
  const { category, level } = getFilterValues();

  let candidateData = coursesData;

  if (searchInput || category || level) {
    const filtered = coursesData.filter((course) => {
      const matchesSearch =
        !searchInput ||
        (course.title || "").toLowerCase().includes(searchInput) ||
        (course.description || "").toLowerCase().includes(searchInput) ||
        (course.instructor || "").toLowerCase().includes(searchInput);
      const matchesCategory = !category || course.category === category;
      const matchesLevel = !level || course.level === level;
      return matchesSearch && matchesCategory && matchesLevel;
    });

    if (filtered.length > 0) {
      candidateData = filtered;
    }
  }

  let list = [];

  if (activeCourseTab === "bestseller") {
    list = candidateData.filter((c) => c.isBestSeller);
    if (list.length < 4) {
      const sorted = [...candidateData].sort(
        (a, b) => (Number(b.students) || 0) - (Number(a.students) || 0),
      );
      sorted.forEach((c) => {
        if (!list.some((item) => String(item.id) === String(c.id)))
          list.push(c);
      });
    }
  } else if (activeCourseTab === "featured") {
    const { featuredCourses } = getFeaturedConfig();
    const featuredList = [];
    (featuredCourses || []).forEach((id) => {
      const found = candidateData.find((c) => String(c.id) === String(id));
      if (found) featuredList.push(found);
    });
    candidateData.forEach((c) => {
      if (
        c.isFeatured &&
        !featuredList.some((item) => String(item.id) === String(c.id))
      ) {
        featuredList.push(c);
      }
    });
    list = featuredList;
    if (list.length < 4) {
      candidateData.forEach((c) => {
        if (!list.some((item) => String(item.id) === String(c.id)))
          list.push(c);
      });
    }
  } else if (activeCourseTab === "toprated") {
    list = candidateData.filter((c) => c.isTopRated);
    if (list.length < 4) {
      const sorted = [...candidateData].sort(
        (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
      );
      sorted.forEach((c) => {
        if (!list.some((item) => String(item.id) === String(c.id)))
          list.push(c);
      });
    }
  } else if (activeCourseTab === "new") {
    list = candidateData.filter((c) => c.isNew);
    if (list.length < 4) {
      const sorted = [...candidateData].sort(
        (a, b) => Number(b.id) - Number(a.id),
      );
      sorted.forEach((c) => {
        if (!list.some((item) => String(item.id) === String(c.id)))
          list.push(c);
      });
    }
  } else if (activeCourseTab === "offers") {
    list = candidateData.filter((c) => c.isOffer);
    if (list.length < 4) {
      candidateData.forEach((c) => {
        if (!list.some((item) => String(item.id) === String(c.id)))
          list.push(c);
      });
    }
  } else {
    list = candidateData;
  }

  if (list.length < 4 && coursesData.length > 0) {
    coursesData.forEach((c) => {
      if (!list.some((item) => String(item.id) === String(c.id))) list.push(c);
    });
  }

  const featuredList = list.slice(0, Math.min(4, coursesData.length));
  renderCourseList(featuredList);
}

function renderCourseList(courses) {
  const coursesList = document.getElementById(coursesListId);
  if (!coursesList) return;
  coursesList.innerHTML = "";

  if (!courses || courses.length === 0) {
    coursesList.innerHTML = '<p class="no-results">لم نجد دورات</p>';
    return;
  }

  courses.forEach((course) => {
    const courseCard = createCourseCard(course, showCourseDetails);
    coursesList.appendChild(courseCard);
  });
}

export function filterStandaloneCourses() {
  const searchInput = document.getElementById("standaloneCourseSearch");
  const categorySelect = document.getElementById("standaloneCourseCategory");
  const levelSelect = document.getElementById("standaloneCourseLevel");
  const grid = document.getElementById("standaloneCoursesList");

  if (!grid) return;

  const query = searchInput ? searchInput.value : "";
  const cat = categorySelect ? categorySelect.value : "";
  const lvl = levelSelect ? levelSelect.value : "";

  const filtered = coursesData.filter((course) => {
    const matchesSearch =
      typeof window.matchCourse === "function"
        ? window.matchCourse(course, query)
        : true;

    const formattedCat = formatCourseCategory(course.category);
    const matchesCategory =
      !cat ||
      course.category === cat ||
      formattedCat === cat ||
      (cat === "ai" &&
        (course.title.includes("ذكاء") || course.category === "ai")) ||
      (cat === "cybersecurity" &&
        (course.title.includes("أمان") ||
          course.title.includes("حماية") ||
          course.category === "cybersecurity")) ||
      (cat === "marketing" &&
        (course.title.includes("تسويق") || course.category === "marketing")) ||
      (cat === "business" &&
        (course.title.includes("أعمال") || course.category === "business"));

    const matchesLevel =
      !lvl || course.level === lvl || formatCourseLevel(course.level) === lvl;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  grid.innerHTML = "";

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 45px 20px; background: var(--card-bg, #ffffff); border-radius: 12px; border: 1px dashed var(--border-color, #e2e8f0); margin: 20px 0;">
        <p style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">لا توجد دورات مطابقة للبحث</p>
        <p style="font-size: 14px; color: var(--text-secondary);">لم نجد أي دورات تطابق الفلاتر المحددة. جرب اختيار تصنيف آخر أو كلمة بحث مختلفة.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((course) => {
    const courseCard = createCourseCard(course, showCourseDetails);
    grid.appendChild(courseCard);
  });
}

export function initializeCourseInteractions() {
  document.addEventListener("addBookToCart", (event) => {
    const { bookId } = event.detail;
    addBookToCart(bookId);
  });
}

export function loadUserPurchases() {
  if (window.appState) {
    window.appState.userCourses = loadLocalStorage("userCourses", []);
    window.appState.userPurchasedBooks = loadLocalStorage(
      "userPurchasedBooks",
      [],
    );
  }
}

function saveUserPurchases() {
  if (window.appState) {
    saveLocalStorage("userCourses", window.appState.userCourses);
    saveLocalStorage("userPurchasedBooks", window.appState.userPurchasedBooks);
  }
}

export function addToCart(courseId) {
  const targetId = Number(courseId) || courseId;
  const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
  const course =
    coursesData.find(
      (c) => String(c.id) === String(courseId) || c.id === targetId,
    ) ||
    teacherCourses.find(
      (c) => String(c.id) === String(courseId) || c.id === targetId,
    );

  if (!course) {
    showCustomAlert("تعذر العثور على معلومات الدورة");
    return;
  }

  if (!window.appState) {
    window.appState = { cart: [], isLoggedIn: false, userCourses: [] };
  }
  if (!window.appState.cart) {
    window.appState.cart = [];
  }

  const existingItem = window.appState.cart.find(
    (item) =>
      (String(item.id) === String(course.id) || item.id === targetId) &&
      (item.type === "course" || !item.type),
  );

  if (existingItem) {
    showCustomAlert("هذه الدورة موجودة بالفعل في السلة");
    return;
  }

  window.appState.cart.push({
    id: course.id,
    title: course.title,
    price: course.price || 99,
    type: "course",
    image: course.image || "",
    category: course.category || "",
  });

  saveCart();
  updateCartUI();
  showCustomAlert("تمت إضافة الدورة إلى السلة بنجاح! 🛒");
  closeCourseModal();
}

export function addBookToCart(bookId) {
  if (!window.appState?.isLoggedIn) {
    showCustomAlert("يجب تسجيل الدخول أولاً لإضافة كتاب إلى السلة");
    if (window.showLogin) window.showLogin();
    return;
  }

  const bookList = window.booksData || [];
  const book = bookList.find((b) => b.id === bookId);
  if (!book || !window.appState) return;

  const existingItem = window.appState.cart.find(
    (item) => item.id === bookId && item.type === "book",
  );
  if (existingItem) {
    showCustomAlert("هذا الكتاب موجود بالفعل في السلة");
    return;
  }

  window.appState.cart.push({
    id: book.id,
    title: book.title,
    price: book.price,
    type: "book",
  });

  saveCart();
  updateCartUI();
  showCustomAlert("تمت إضافة الكتاب إلى السلة");
}

export function closeCourseModal() {
  const modal = document.getElementById("courseModal");
  modal?.classList.remove("show");
}

export function filterMyCoursesTab(btn, category) {
  const pills = document.querySelectorAll(".filter-pill");
  pills.forEach((p) => p.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const cards = document.querySelectorAll(".my-course-card");
  cards.forEach((card) => {
    if (category === "all") {
      card.style.display = "flex";
    } else {
      const cardCat = card.getAttribute("data-category");
      card.style.display = cardCat === category ? "flex" : "none";
    }
  });
}

export function searchMyCourses(query) {
  const rawQ = (query || "").trim();
  const q = rawQ.toLowerCase();

  const continueCard = document.querySelector(
    "#myCoursesPage .continue-learning-card",
  );
  const cards = document.querySelectorAll("#myCoursesPage .my-course-card");
  let totalMatches = 0;

  if (continueCard) {
    const title = (
      continueCard.getAttribute("data-title") ||
      continueCard.querySelector(".continue-course-title")?.textContent ||
      ""
    ).toLowerCase();
    const instructor = (
      continueCard.getAttribute("data-instructor") ||
      continueCard.querySelector(".instructor-name")?.textContent ||
      ""
    ).toLowerCase();
    const category = (
      continueCard.getAttribute("data-category") || ""
    ).toLowerCase();

    if (
      !q ||
      title.includes(q) ||
      instructor.includes(q) ||
      category.includes(q)
    ) {
      continueCard.style.display = "";
      totalMatches++;
    } else {
      continueCard.style.display = "none";
    }
  }

  cards.forEach((card) => {
    const title = (
      card.getAttribute("data-title") ||
      card.querySelector(".card-title")?.textContent ||
      ""
    ).toLowerCase();
    const instructor = (
      card.getAttribute("data-instructor") ||
      card.querySelector(".instructor-name")?.textContent ||
      ""
    ).toLowerCase();
    const category = (card.getAttribute("data-category") || "").toLowerCase();
    const fullText = (card.textContent || "").toLowerCase();

    if (
      !q ||
      title.includes(q) ||
      instructor.includes(q) ||
      category.includes(q) ||
      fullText.includes(q)
    ) {
      card.style.display = "flex";
      totalMatches++;
    } else {
      card.style.display = "none";
    }
  });

  // Empty state handling
  let emptyState = document.getElementById("myCoursesEmptySearch");
  const gridContainer = document.querySelector(
    "#myCoursesPage .all-courses-grid",
  );

  if (totalMatches === 0 && rawQ !== "") {
    if (!emptyState && gridContainer) {
      emptyState = document.createElement("div");
      emptyState.id = "myCoursesEmptySearch";
      emptyState.className = "empty-search-state";
      emptyState.style.cssText =
        "grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--card-bg, #ffffff); border-radius: 16px; border: 1px dashed var(--border-color, #e2e8f0); margin: 20px 0;";
      gridContainer.parentNode.insertBefore(
        emptyState,
        gridContainer.nextSibling,
      );
    }
    if (emptyState) {
      emptyState.style.display = "block";
      const escaped = rawQ.replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[m],
      );
      emptyState.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.8;">🔍</div>
        <h4 style="font-size: 18px; font-weight: 800; margin-bottom: 8px; color: var(--text-color, #1e293b);">لم يتم العثور على دورات مطابقة</h4>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">لا توجد نتائج تطابق "${escaped}". جرب البحث بكلمات مختلفة.</p>
        <button type="button" class="btn-primary-purple sm" onclick="resetMyCoursesSearch()" style="padding: 10px 22px; border-radius: 10px; font-weight: 700;">إعادة ضبط البحث</button>
      `;
    }
  } else {
    if (emptyState) {
      emptyState.style.display = "none";
    }
  }
}

export function resetMyCoursesSearch() {
  const input = document.getElementById("myCoursesSearchInput");
  if (input) {
    input.value = "";
    input.focus();
  }
  searchMyCourses("");
}

export function handleMyCoursesSearchKeydown(e) {
  if (e.key === "Escape") {
    resetMyCoursesSearch();
  } else if (e.key === "Enter") {
    searchMyCourses(e.target.value);
  }
}

export function sortMyCourses(sortValue) {
  const grid = document.querySelector("#myCoursesPage .all-courses-grid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".my-course-card"));

  cards.sort((a, b) => {
    const titleA = (
      a.getAttribute("data-title") ||
      a.querySelector(".card-title")?.textContent ||
      ""
    ).trim();
    const titleB = (
      b.getAttribute("data-title") ||
      b.querySelector(".card-title")?.textContent ||
      ""
    ).trim();
    const progA = parseInt(a.getAttribute("data-progress") || "0", 10);
    const progB = parseInt(b.getAttribute("data-progress") || "0", 10);
    const dateA = a.getAttribute("data-date") || "";
    const dateB = b.getAttribute("data-date") || "";
    const catA = a.getAttribute("data-category") || "";
    const catB = b.getAttribute("data-category") || "";

    switch (sortValue) {
      case "newest":
        return dateB.localeCompare(dateA);
      case "oldest":
        return dateA.localeCompare(dateB);
      case "title_asc":
        return titleA.localeCompare(titleB, "ar");
      case "title_desc":
        return titleB.localeCompare(titleA, "ar");
      case "completed_first":
        if (catA === "completed" && catB !== "completed") return -1;
        if (catA !== "completed" && catB === "completed") return 1;
        return progB - progA;
      case "in_progress_first":
        if (catA === "in_progress" && catB !== "in_progress") return -1;
        if (catA !== "in_progress" && catB === "in_progress") return 1;
        return progB - progA;
      case "latest_viewed":
      default:
        return 0;
    }
  });

  cards.forEach((card) => grid.appendChild(card));

  const input = document.getElementById("myCoursesSearchInput");
  if (input) {
    searchMyCourses(input.value);
  }
}

export function playCurrentCourse(courseIdentifier) {
  continueCourse(courseIdentifier);
}

export function scrollToCourseDetails(courseIdentifier) {
  if (courseIdentifier) {
    const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
    const course =
      coursesData.find(
        (c) =>
          String(c.id) === String(courseIdentifier) ||
          c.title === courseIdentifier ||
          (c.title &&
            c.title
              .toLowerCase()
              .includes(String(courseIdentifier).toLowerCase())) ||
          String(courseIdentifier)
            .toLowerCase()
            .includes(c.title ? c.title.toLowerCase() : ""),
      ) ||
      teacherCourses.find(
        (c) =>
          String(c.id) === String(courseIdentifier) ||
          c.title === courseIdentifier,
      );

    if (course) {
      showCourseDetails(course.id);
      return;
    }
  }
  showCourseDetails(1);
}

// =========================================================================
// LEARNING SYSTEM & COURSE PLAYER ENGINE (SHARED STATE, NO DATABASE)
// =========================================================================

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

export function generateDefaultCurriculum(course) {
  const cId = course ? course.id : 1;
  const title = course ? course.title : "الدورة التدريبية";
  return [
    {
      id: `sec-${cId}-1`,
      title: "الوحدة 1: الأساسيات وإعداد بيئة العمل",
      isExpanded: true,
      lessons: [
        {
          id: `les-${cId}-101`,
          title: `مقدمة ونظرة عامة على ${title}`,
          duration: "08:20",
          durationSeconds: 500,
          videoUrl: SAMPLE_VIDEOS[0],
          isFreePreview: true,
          description: `نظرة شاملة ومفصلة حول خطة التعلم والمخرجات الرئيسية لدورة ${title}.`,
          resources: [
            { name: "خطة الكورس الشاملة.pdf", type: "pdf", size: "1.4 MB" },
            { name: "ملفات البداية المصدرية.zip", type: "zip", size: "3.2 MB" },
          ],
        },
        {
          id: `les-${cId}-102`,
          title: "إعداد بيئة العمل والتطوير الأدوات المطلوبة",
          duration: "10:15",
          durationSeconds: 615,
          videoUrl: SAMPLE_VIDEOS[1],
          isFreePreview: false,
          description:
            "خطوات التثبيت والإعداد الشامل للأدوات والبرامج الأساسية لبدء التمارين العملية.",
          resources: [
            {
              name: "روابط التثبيت والأوامر البرمجية.docx",
              type: "doc",
              size: "450 KB",
            },
          ],
        },
        {
          id: `les-${cId}-12`,
          title: "الدرس 12: تسليم المشروع العملي الأول",
          duration: "12:00",
          durationSeconds: 720,
          videoUrl: SAMPLE_VIDEOS[1],
          isFreePreview: false,
          description:
            "خطوات وطريقة تسليم المشروع العملي الأول وتلقي التقييم والدرجة.",
          resources: [
            { name: "دليل تسليم المشروع.pdf", type: "pdf", size: "850 KB" },
          ],
        },
      ],
      quiz: {
        id: `quiz-${cId}-1`,
        title: "اختبار تقييمي: المفاهيم الأساسية",
        timeLimit: 10,
        passingGrade: 70,
        questions: [
          {
            id: `q-${cId}-101`,
            question: `ما هي الركيزة الأساسية لمنهجية العمل في ${title}؟`,
            options: [
              "الفهم العملي والتطبيق على مشاريع حقيقية",
              "الحفظ النظري للمفاهيم دون تطبيق",
              "تخطي الدروس التفاعلية",
              "عدم استخدام الأدوات البرمجية",
            ],
            correctAnswer: 0,
          },
          {
            id: `q-${cId}-102`,
            question: "كيف تتم مراجعة الأخطاء البرمجية أثناء التطبيق؟",
            options: [
              "باستخدام أدوات تصحيح الأخطاء والتتبع السريع",
              "بإغلاق الحاسوب فور ظهور الأخطاء",
              "بحذف المكونات مباشرة",
              "بتغيير لغة البرمجة",
            ],
            correctAnswer: 0,
          },
        ],
      },
      assignment: {
        id: `asg-${cId}-1`,
        title: "تطبيق عملي 1: إنشاء المشروع الأولي",
        description:
          "قم بتنفيذ خطوات إعداد البيئة وتطبيق التمرين الأول ثم ارفع الكود المصدري بصيغة ZIP.",
        deadline: "2026-08-30",
        maxGrade: 100,
      },
    },
    {
      id: `sec-${cId}-2`,
      title: "الوحدة 2: التطبيق المتقدم وإدارة البيانات",
      isExpanded: true,
      lessons: [
        {
          id: `les-${cId}-201`,
          title: "بناء المكونات وإدارة حالات البيانات T-State",
          duration: "14:30",
          durationSeconds: 870,
          videoUrl: SAMPLE_VIDEOS[2],
          isFreePreview: false,
          description:
            "شرح معمّق لآلية تمرير البيانات وإدارة الحالة للحصول على أداء سريع وسلس.",
          resources: [
            {
              name: "المشروع التفاعلي المتقدم.zip",
              type: "zip",
              size: "5.8 MB",
            },
          ],
        },
        {
          id: `les-${cId}-202`,
          title: "تكامل الخدمات والـ APIs وبناء الواجهات",
          duration: "18:45",
          durationSeconds: 1125,
          videoUrl: SAMPLE_VIDEOS[3],
          isFreePreview: false,
          description:
            "ربط التطبيق بالخدمات الخارجية ومعالجة الأخطاء والاحتفاظ بالبيانات محلياً.",
          resources: [
            { name: "عروض التقديم والشرائح.pptx", type: "ppt", size: "2.5 MB" },
          ],
        },
        {
          id: `les-${cId}-39`,
          title: "الدرس 39: Context API & Custom Hooks",
          duration: "16:20",
          durationSeconds: 980,
          videoUrl: SAMPLE_VIDEOS[2],
          isFreePreview: false,
          description:
            "شرح مفصل لاستخدام Context API وإنشاء Custom Hooks لإدارة حالة التطبيق بكفاءة عاليية.",
          resources: [
            {
              name: "أمثلة Context API و Custom Hooks.zip",
              type: "zip",
              size: "4.2 MB",
            },
          ],
        },
      ],
      quiz: {
        id: `quiz-${cId}-2`,
        title: "اختبار المستوى المتقدم",
        timeLimit: 15,
        passingGrade: 80,
        questions: [
          {
            id: `q-${cId}-201`,
            question: "ما هي أفضل الطرق لمعالجة البيانات الضخمة في الواجهة؟",
            options: [
              "استخدام التجزئة والتحميل الكسول وتحديث الحالة بكفاءة",
              "تحميل كافة البيانات دفعة واحدة في الصفحة الرئيسية",
              "تعطيل ذاكرة التخزين المؤقت",
              "حذف عناصر التحكم",
            ],
            correctAnswer: 0,
          },
        ],
      },
    },
    {
      id: `sec-${cId}-3`,
      title: "الوحدة 3: المشروع النهائي والتأهيل للاحتراف",
      isExpanded: false,
      lessons: [
        {
          id: `les-${cId}-301`,
          title: "المشروع الختامي الشامل وتأهيل النشر",
          duration: "25:00",
          durationSeconds: 1500,
          videoUrl: SAMPLE_VIDEOS[4],
          isFreePreview: false,
          description:
            "مشروع تطبيقي كامل يجمع بين كافة المهارات التي تعلمتها طوال الكورس.",
          resources: [
            { name: "الكود المصدري النهائي.zip", type: "code", size: "8.4 MB" },
          ],
        },
      ],
      assignment: {
        id: `asg-${cId}-3`,
        title: "المشروع النهائي: تسليم ملفات التقييم والشهادة",
        description:
          "قم برفع المشروع التكاملي النهائي للحصول على درجة التقييم والشهادة الرسمية.",
        deadline: "2026-09-15",
        maxGrade: 100,
      },
    },
  ];
}

export function getCourseCurriculum(course) {
  if (course && Array.isArray(course.sections) && course.sections.length > 0) {
    return course.sections;
  }
  return generateDefaultCurriculum(course);
}

export function getCourseProgress(courseId) {
  const appState = window.appState || {};
  if (!appState.courseProgress) appState.courseProgress = {};
  if (!appState.courseProgress[courseId]) {
    const saved = loadLocalStorage(`lms_course_progress_${courseId}`, {
      completedLessonIds: [],
      lastActiveLessonId: null,
      lessonTimestamps: {},
      quizScores: {},
      assignmentSubmissions: {},
    });
    appState.courseProgress[courseId] = saved;
  }
  return appState.courseProgress[courseId];
}

export function saveCourseProgress(courseId, progressData) {
  const appState = window.appState || {};
  if (!appState.courseProgress) appState.courseProgress = {};
  appState.courseProgress[courseId] = progressData;
  saveLocalStorage(`lms_course_progress_${courseId}`, progressData);
}

export function calculateCourseProgressPercent(course) {
  if (!course) return 0;
  const curriculum = getCourseCurriculum(course);
  let totalLessons = 0;
  curriculum.forEach((sec) => {
    totalLessons += (sec.lessons || []).length;
  });
  if (totalLessons === 0) return 0;

  const progress = getCourseProgress(course.id);
  const completedCount = (progress.completedLessonIds || []).length;
  return Math.min(100, Math.round((completedCount / totalLessons) * 100));
}

export function isCoursePurchased(courseId) {
  const appState = window.appState || {};
  const role = appState.userRole || "student";
  if (role === "owner" || role === "teacher") return true;

  const target = String(courseId);
  if (Array.isArray(appState.userCourses)) {
    if (appState.userCourses.some((id) => String(id) === target)) return true;
  }
  if (appState.userData) {
    const courses = appState.userData.courses || [];
    const purchased = appState.userData.purchasedCourses || [];
    if (
      courses.some((id) => String(id) === target) ||
      purchased.some((id) => String(id) === target)
    ) {
      return true;
    }
  }
  try {
    const localCourses = JSON.parse(
      localStorage.getItem("userCourses") || "[]",
    );
    if (localCourses.some((id) => String(id) === target)) return true;
  } catch (e) {}

  return false;
}

export function notifyCourseSystemUpdated() {
  const currentCourseId = window.activePlayerState?.courseId;
  const courseDetailsPage = document.getElementById("courseDetailsPage");
  if (
    courseDetailsPage &&
    !courseDetailsPage.classList.contains("hidden") &&
    currentCourseId
  ) {
    showCourseDetails(currentCourseId);
  }
  if (window.activePlayerState && window.activePlayerState.courseId) {
    const coursePlayerPage = document.getElementById("coursePlayerPage");
    if (coursePlayerPage && !coursePlayerPage.classList.contains("hidden")) {
      renderCoursePlayerView(window.activePlayerState.courseId);
    }
  }
  const myCoursesPage = document.getElementById("myCoursesPage");
  if (myCoursesPage && !myCoursesPage.classList.contains("hidden")) {
    renderMyCoursesPage();
  }
}

export function getEnrolledCoursesCount() {
  const appState = window.appState || {};
  let currentUser = null;
  try {
    const raw = localStorage.getItem("lms_user_session");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {}

  if (Array.isArray(appState.userCourses) && appState.userCourses.length > 0) {
    return appState.userCourses.length;
  }

  if (appState.userData) {
    if (
      Array.isArray(appState.userData.courses) &&
      appState.userData.courses.length > 0
    ) {
      return appState.userData.courses.length;
    }
    if (
      Array.isArray(appState.userData.purchasedCourses) &&
      appState.userData.purchasedCourses.length > 0
    ) {
      return appState.userData.purchasedCourses.length;
    }
  }

  if (currentUser) {
    if (
      Array.isArray(currentUser.purchasedCourses) &&
      currentUser.purchasedCourses.length > 0
    ) {
      return currentUser.purchasedCourses.length;
    }
    if (
      Array.isArray(currentUser.userCourses) &&
      currentUser.userCourses.length > 0
    ) {
      return currentUser.userCourses.length;
    }
    if (Array.isArray(currentUser.courses) && currentUser.courses.length > 0) {
      return currentUser.courses.length;
    }
  }

  try {
    const localCourses = JSON.parse(
      localStorage.getItem("userCourses") || "[]",
    );
    if (Array.isArray(localCourses) && localCourses.length > 0) {
      return localCourses.length;
    }
  } catch (e) {}

  const cards = document.querySelectorAll("#myCoursesPage .my-course-card");
  const continueCard = document.querySelector(
    "#myCoursesPage .continue-learning-card",
  );
  if (cards.length > 0 || continueCard) {
    return cards.length + (continueCard ? 1 : 0);
  }

  return 0;
}

export function renderMyCoursesPage() {
  if (
    typeof window !== "undefined" &&
    typeof window.closeAllSidebars === "function"
  ) {
    window.closeAllSidebars();
  }

  const modal = document.getElementById("purchasesModal");
  if (modal) modal.classList.remove("show");

  if (
    typeof window !== "undefined" &&
    typeof window.hideAllMainSections === "function"
  ) {
    window.hideAllMainSections();
  } else {
    const hero = document.querySelector(".hero");
    const features = document.querySelector(".features");
    const coursesSection =
      document.getElementById("coursesSection") ||
      document.querySelector(".courses");
    const booksSection = document.getElementById("books");
    const editProfilePage = document.getElementById("editProfilePage");

    if (hero) hero.classList.add("hidden");
    if (features) features.classList.add("hidden");
    if (coursesSection) coursesSection.classList.add("hidden");
    if (booksSection) booksSection.classList.add("hidden");
    if (editProfilePage) editProfilePage.classList.add("hidden");
  }

  const myCoursesPage = document.getElementById("myCoursesPage");
  if (myCoursesPage) {
    myCoursesPage.classList.remove("hidden");
  }

  const enrolledCount = getEnrolledCoursesCount();

  let globalEmptyState = document.getElementById("myCoursesGlobalEmptyState");
  const sectionContainers = document.querySelectorAll(
    "#myCoursesPage .section-container",
  );
  const controlsRow = document.querySelector(
    "#myCoursesPage .my-courses-controls-row",
  );

  if (enrolledCount === 0) {
    sectionContainers.forEach((sec) => (sec.style.display = "none"));
    if (controlsRow) controlsRow.style.display = "none";

    if (!globalEmptyState && myCoursesPage) {
      globalEmptyState = document.createElement("div");
      globalEmptyState.id = "myCoursesGlobalEmptyState";
      globalEmptyState.className = "my-courses-empty-state";
      globalEmptyState.style.cssText =
        "text-align: center; padding: 60px 20px; background: var(--card-bg, #ffffff); border-radius: 20px; border: 1px dashed var(--border-color, #e2e8f0); margin: 30px 20px;";
      globalEmptyState.innerHTML = `
        <div style="width: 80px; height: 80px; background: #f3e8ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #7c3aed;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        </div>
        <h3 style="font-size: 20px; font-weight: 800; color: var(--text-color, #0f172a); margin-bottom: 8px;">لا توجد دورات حتى الآن</h3>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto;">ابدأ رحلتك التعليمية باكتشاف أفضل الدورات المتاحة والتسجيل فيها.</p>
        <button type="button" class="btn-primary-purple lg" onclick="showHomeSection('courses'); if (window.scrollToSection) window.scrollToSection('courses');" style="padding: 12px 28px; border-radius: 12px; font-weight: 700;">استكشف الدورات المتاحة</button>
      `;
      const container = myCoursesPage.querySelector(".my-courses-page");
      if (container) container.appendChild(globalEmptyState);
    }
    if (globalEmptyState) globalEmptyState.style.display = "block";
  } else {
    if (globalEmptyState) globalEmptyState.style.display = "none";
    sectionContainers.forEach((sec) => (sec.style.display = ""));
    if (controlsRow) controlsRow.style.display = "";

    // Auto load player into anchor if active course present or pick first enrolled course
    const activeId = window.activePlayerState?.courseId || 1;
    renderCoursePlayerView(activeId);
  }

  updateCertificateButtonsInCards();

  if (!window.location.hash.includes("my-courses")) {
    window.location.hash = "#student/my-courses";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function openMyCourses(e) {
  if (e && e.preventDefault) e.preventDefault();
  renderMyCoursesPage();
}

export function showPurchases() {
  renderMyCoursesPage();
}

export function closePurchases() {
  const modal = document.getElementById("purchasesModal");
  if (modal) modal.classList.remove("show");

  const myCoursesPage = document.getElementById("myCoursesPage");
  if (myCoursesPage) myCoursesPage.classList.add("hidden");

  if (window.showHomeSection) {
    window.showHomeSection("home");
  }
  window.location.hash = "#home";
}

export function renderCoursePlayerView(courseId) {
  const targetId = Number(courseId) || courseId;
  const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
  const course =
    coursesData.find((c) => String(c.id) === String(targetId)) ||
    teacherCourses.find((c) => String(c.id) === String(targetId)) ||
    coursesData[0];
  if (!course) return;

  if (!window.activePlayerState) window.activePlayerState = {};
  window.activePlayerState.courseId = course.id;

  const anchor = document.getElementById("courseDetailsAnchor");
  const pageContainer =
    document.getElementById("courseDetailsContent") ||
    document.getElementById("courseDetails");

  if (anchor) {
    renderCoursePlayerUI(course, anchor);
  }
  if (pageContainer) {
    renderCoursePlayerUI(course, pageContainer);
  }
}

export function renderCoursePlayerUI(course, containerElement) {
  if (!course || !containerElement) return;

  const curriculum = getCourseCurriculum(course);
  const progress = getCourseProgress(course.id);
  const progressPercent = calculateCourseProgressPercent(course);
  const purchased = isCoursePurchased(course.id);

  let activeLesson = null;
  let activeSectionIdx = 0;
  let activeLessonIdx = 0;

  if (progress.lastActiveLessonId) {
    curriculum.forEach((sec, sIdx) => {
      (sec.lessons || []).forEach((les, lIdx) => {
        if (les.id === progress.lastActiveLessonId) {
          activeLesson = les;
          activeSectionIdx = sIdx;
          activeLessonIdx = lIdx;
        }
      });
    });
  }

  if (!activeLesson) {
    activeLesson = curriculum[0]?.lessons?.[0] || {
      id: `les-${course.id}-default`,
      title: "مقدمة الكورس",
      duration: "10:00",
      videoUrl: SAMPLE_VIDEOS[0],
      description: course.description || "أهلاً بك في الكورس.",
    };
    progress.lastActiveLessonId = activeLesson.id;
    saveCourseProgress(course.id, progress);
  }

  const isCurrentCompleted = (progress.completedLessonIds || []).includes(
    activeLesson.id,
  );
  const formattedLevel = formatCourseLevel(course.level);
  const instructorAvatar =
    course.instructorImage ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";

  containerElement.innerHTML = `
    <div class="course-details-breadcrumb-bar">
      <span>دوراتي</span> &gt; <span class="active-crumb">${course.title}</span>
    </div>

    <div class="course-details-header-info">
      <h2 class="course-details-main-title">${course.title}</h2>
      <div class="course-meta-pills">
        <span class="meta-item"><img src="${instructorAvatar}" class="mini-avatar" alt="${course.instructor || "أحمد محمد"}" /> ${course.instructor || "أحمد محمد"}</span>
        <span class="meta-item text-amber">⭐ ${course.rating || "4.9"}</span>
        <span class="meta-item">⏱ ${course.duration || 10} ساعات</span>
        <span class="meta-item">📊 ${formattedLevel}</span>
        <span class="meta-item">🌐 اللغة: العربية</span>
        ${purchased ? `<span class="meta-item" style="background: #dcfce7; color: #166534; font-weight: 700;">✓ مشترك (${progressPercent}%)</span>` : '<span class="meta-item" style="background: #fef3c7; color: #92400e; font-weight: 700;">🔒 غير مشترك (معاينة فقط)</span>'}
      </div>
    </div>

    <div class="course-player-3col-layout">
      <!-- Left Column: Accordion -->
      <div class="player-accordion-panel">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <h4 class="accordion-header-title">محتوى الدورة</h4>
          <span class="badge-count" style="background: #e0e7ff; color: #4338ca; font-weight: 700;">${progressPercent}% مكتمل</span>
        </div>

        <input type="text" placeholder="🔍 بحث في الدروس..." class="form-input-builder" style="font-size: 12px; padding: 6px 10px; border-radius: 8px; width: 100%; border: 1px solid #cbd5e1; box-sizing: border-box;" oninput="filterCourseLessons(this.value, '${course.id}')" value="${window.activePlayerState?.lessonSearchQuery || ""}">

        <div class="lessons-accordion" id="playerLessonsAccordion_${course.id}">
          ${renderAccordionContentHTML(course, curriculum, progress, activeLesson.id)}
        </div>

        <button type="button" class="download-resources-btn" onclick="openCourseResourcesModal('${course.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          موارد الدورة
        </button>
      </div>

      <!-- Center Column: Video Player -->
      <div class="player-main-panel">
        <div class="video-preview-box" style="position: relative; background: #000; border-radius: 16px; overflow: hidden; height: 260px; display: flex; flex-direction: column; justify-content: space-between;">
          <video id="courseActiveVideoElement" src="${activeLesson.videoUrl || SAMPLE_VIDEOS[0]}" style="width: 100%; height: 100%; object-fit: cover; background: #000;" playsinline></video>

          <div class="video-bottom-controls-bar" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); padding: 10px 16px; display: flex; align-items: center; gap: 12px; color: #ffffff; font-size: 12px; z-index: 5;">
            <button class="play-control-btn" type="button" onclick="toggleCourseVideoPlay()" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 14px;">▶</button>
            <span class="video-time" id="videoTimeDisplay">00:00 / 00:00</span>
            <div class="video-track" style="flex: 1; height: 4px; background: rgba(255, 255, 255, 0.3); border-radius: 2px; cursor: pointer;" onclick="seekCourseVideo(event)">
              <div class="video-track-fill" id="videoTrackFill" style="height: 100%; width: 0%; background: #6366f1;"></div>
            </div>
            <button type="button" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 12px;" onclick="toggleCourseVideoMute()" id="videoMuteBtn">🔊</button>
            <select onchange="changeVideoSpeed(this.value)" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 6px; font-size: 11px; padding: 2px 4px; cursor: pointer;">
              <option value="0.75">0.75x</option>
              <option value="1" selected>1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
            <button class="fullscreen-control-btn" type="button" onclick="toggleCourseVideoFullscreen()" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 14px;">⛶</button>
          </div>
        </div>

        <div class="current-lesson-info-box">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span class="lesson-sub-header">الدرس الحالي:</span>
            <span style="font-size: 12px; color: #64748b; font-weight: 600;">⏱️ ${activeLesson.duration || "10:00"}</span>
          </div>
          <h3 class="current-lesson-title">${activeLesson.title}</h3>
          <p class="current-lesson-desc">${activeLesson.description || course.description || ""}</p>
          
          <div class="lesson-nav-buttons" style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">
            <button class="btn-secondary-outline sm" type="button" onclick="navigateToPrevLesson('${course.id}')" ${activeSectionIdx === 0 && activeLessonIdx === 0 ? "disabled" : ""}>الدرس السابق</button>
            
            <button class="${isCurrentCompleted ? "btn-secondary-outline" : "btn-primary-purple"} sm" type="button" onclick="toggleMarkLessonCompleted('${course.id}', '${activeLesson.id}')">
              ${isCurrentCompleted ? "✓ تم إكمال الدرس" : "تحديد كمكتمل"}
            </button>
            
            <button class="btn-primary-purple sm" type="button" onclick="navigateToNextLesson('${course.id}')">الدرس التالي</button>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #e2e8f0;">
            ${
              curriculum[activeSectionIdx]?.quiz
                ? `
              <button type="button" class="btn btn-secondary sm" onclick="openStudentQuizModal(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(curriculum[activeSectionIdx].quiz))}')), '${course.title.replace(/'/g, "\\'")}')" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-weight: 700;">
                ❓ اختبار الوحدة (${curriculum[activeSectionIdx].quiz.title})
              </button>
            `
                : ""
            }

            ${
              curriculum[activeSectionIdx]?.assignment
                ? `
              <button type="button" class="btn btn-secondary sm" onclick="openStudentAssignmentModal(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(curriculum[activeSectionIdx].assignment))}')), '${course.title.replace(/'/g, "\\'")}')" style="background: #fdf4ff; color: #86198f; border: 1px solid #f5d0fe; font-weight: 700;">
                📝 واجب الوحدة (${curriculum[activeSectionIdx].assignment.title})
              </button>
            `
                : ""
            }

            ${
              progressPercent === 100
                ? `
              <button type="button" class="btn-primary-purple sm" onclick="openCourseCertificateModal('${course.id}')" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-weight: 800; border: none;">
                🏆 عرض وحفظ الشهادة
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>

      <!-- Right Column: Promo Panel -->
      <div class="player-promo-panel">
        <div class="promo-card-box">
          <div class="promo-icon-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
            <span class="sparkle s1">✨</span>
            <span class="sparkle s2">✦</span>
          </div>
          <h3 class="promo-title">${purchased ? "واصل التقدّم بمهاراتك" : "اشترك بالدورة بالكامل"}</h3>
          <p class="promo-subtitle">${purchased ? `نسبة إنجازك الحالية هي ${progressPercent}%. واصل المشاهدة للحصول على الشهادة.` : `سعر الكورس $${course.price || 299} فقط شامل الاختبارات والشهادة.`}</p>
          
          ${
            purchased
              ? `
            <div style="width: 100%; background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin: 8px 0;">
              <div style="width: ${progressPercent}%; height: 100%; background: #7c3aed; transition: width 0.3s;"></div>
            </div>
            ${
              progressPercent === 100
                ? `
              <button type="button" class="btn-primary-purple lg" onclick="openCourseCertificateModal('${course.id}')" style="background: #059669;">🏆 تحميل الشهادة</button>
            `
                : `
              <button type="button" class="btn-primary-purple lg" onclick="navigateToNextLesson('${course.id}')">متابعة الدرس التالي</button>
            `
            }
          `
              : `
            <button type="button" class="btn-primary-purple lg" onclick="quickEnrollCourse('${course.id}')">اشترك الآن ($${course.price || 299})</button>
          `
          }
        </div>
      </div>
    </div>

    <!-- Q&A Section -->
    <div style="margin-top: 30px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px;">
      <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        💬 أسئلة واستفسارات الطلاب (Q&amp;A)
      </h3>
      ${renderQASectionHTML(course.id)}
    </div>
  `;

  setupVideoPlayerEvents(course, activeLesson);
}

function renderAccordionContentHTML(
  course,
  curriculum,
  progress,
  activeLessonId,
) {
  const query = (
    window.activePlayerState?.lessonSearchQuery || ""
  ).toLowerCase();
  const purchased = isCoursePurchased(course.id);

  return curriculum
    .map((section, sIdx) => {
      const lessons = (section.lessons || []).filter((les) => {
        if (!query) return true;
        return (
          les.title.toLowerCase().includes(query) ||
          (les.description && les.description.toLowerCase().includes(query))
        );
      });

      const completedCount = (section.lessons || []).filter((les) =>
        (progress.completedLessonIds || []).includes(les.id),
      ).length;

      return `
      <div class="accordion-group" style="margin-bottom: 8px;">
        <div class="accordion-group-header" onclick="toggleLessonAccordion(this)">
          <span>${section.title}</span>
          <span class="badge-count">${completedCount}/${(section.lessons || []).length}</span>
        </div>
        <div class="accordion-group-body" style="display: ${sIdx === 0 || lessons.some((l) => l.id === activeLessonId) ? "block" : "none"};">
          ${lessons
            .map((les, lIdx) => {
              const isCompleted = (progress.completedLessonIds || []).includes(
                les.id,
              );
              const isActive = les.id === activeLessonId;
              const isUnlocked =
                purchased || les.isFreePreview || (sIdx === 0 && lIdx === 0);

              let statusIcon = "🔒";
              let statusClass = "locked";

              if (isCompleted) {
                statusIcon = "✓";
                statusClass = "completed";
              } else if (isActive) {
                statusIcon = "●";
                statusClass = "active";
              } else if (isUnlocked) {
                statusIcon = les.isFreePreview ? "👁" : "▶";
                statusClass = "unlocked";
              }

              return `
              <div class="lesson-item ${statusClass} ${isActive ? "active" : ""}" onclick="selectCourseLesson('${course.id}', '${les.id}')" style="cursor: pointer;">
                <span class="lesson-status-icon ${isActive ? "active-dot" : ""}">${statusIcon}</span>
                <span class="lesson-title">${les.title} ${les.isFreePreview && !purchased ? '<span style="font-size: 10px; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">مجاني</span>' : ""}</span>
                <span class="lesson-duration">${les.duration || "10:00"}</span>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
    })
    .join("");
}

function setupVideoPlayerEvents(course, activeLesson) {
  setTimeout(() => {
    const video = document.getElementById("courseActiveVideoElement");
    if (!video) return;

    const playBtn = document.querySelector(".play-control-btn");
    const timeDisplay = document.getElementById("videoTimeDisplay");
    const trackFill = document.getElementById("videoTrackFill");

    const progress = getCourseProgress(course.id);
    const savedTime = progress.lessonTimestamps?.[activeLesson.id] || 0;
    if (savedTime > 0 && savedTime < (video.duration || 1000)) {
      video.currentTime = savedTime;
    }

    video.ontimeupdate = () => {
      if (isNaN(video.duration) || video.duration === 0) return;
      const current = video.currentTime;
      const dur = video.duration;

      if (timeDisplay) {
        timeDisplay.textContent = `${formatVideoTime(current)} / ${formatVideoTime(dur)}`;
      }
      if (trackFill) {
        trackFill.style.width = `${(current / dur) * 100}%`;
      }

      if (!progress.lessonTimestamps) progress.lessonTimestamps = {};
      progress.lessonTimestamps[activeLesson.id] = current;
      saveCourseProgress(course.id, progress);

      if (
        current / dur >= 0.9 &&
        !(progress.completedLessonIds || []).includes(activeLesson.id)
      ) {
        markLessonComplete(course.id, activeLesson.id);
      }
    };

    video.onplay = () => {
      if (playBtn) playBtn.textContent = "⏸";
    };
    video.onpause = () => {
      if (playBtn) playBtn.textContent = "▶";
    };
    video.onended = () => {
      if (playBtn) playBtn.textContent = "▶";
      markLessonComplete(course.id, activeLesson.id);
    };
  }, 100);
}

function formatVideoTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
}

export function toggleCourseVideoPlay() {
  const video = document.getElementById("courseActiveVideoElement");
  if (!video) return;
  if (video.paused) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

export function seekCourseVideo(e) {
  const video = document.getElementById("courseActiveVideoElement");
  if (!video || !video.duration) return;
  const track = e.currentTarget;
  const rect = track.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));
  video.currentTime = percent * video.duration;
}

export function changeVideoSpeed(rate) {
  const video = document.getElementById("courseActiveVideoElement");
  if (video) video.playbackRate = parseFloat(rate) || 1;
}

export function toggleCourseVideoMute() {
  const video = document.getElementById("courseActiveVideoElement");
  const btn = document.getElementById("videoMuteBtn");
  if (!video) return;
  video.muted = !video.muted;
  if (btn) btn.textContent = video.muted ? "🔇" : "🔊";
}

export function toggleCourseVideoFullscreen() {
  const box =
    document.querySelector("#courseDetailsAnchor .video-preview-box") ||
    document.querySelector(".video-preview-box");
  if (!box) return;
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else {
    box.requestFullscreen().catch(() => {});
  }
}

export function selectCourseLesson(courseId, lessonId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;

  const curriculum = getCourseCurriculum(course);
  let targetLesson = null;
  let isUnlocked = isCoursePurchased(course.id);

  curriculum.forEach((sec, sIdx) => {
    (sec.lessons || []).forEach((les, lIdx) => {
      if (les.id === lessonId) {
        targetLesson = les;
        if (les.isFreePreview || (sIdx === 0 && lIdx === 0)) {
          isUnlocked = true;
        }
      }
    });
  });

  if (!isUnlocked) {
    showCustomAlert("هذا الدرس مغلق. يرجى الاشتراك بالدورة لفتح جميع الدروس!");
    return;
  }

  const progress = getCourseProgress(course.id);
  progress.lastActiveLessonId = lessonId;
  saveCourseProgress(course.id, progress);

  renderCoursePlayerView(course.id);
}

export function toggleMarkLessonCompleted(courseId, lessonId) {
  const progress = getCourseProgress(courseId);
  if (!progress.completedLessonIds) progress.completedLessonIds = [];

  const idx = progress.completedLessonIds.indexOf(lessonId);
  if (idx >= 0) {
    progress.completedLessonIds.splice(idx, 1);
    showCustomAlert("تم إلغاء تحديد إكمال الدرس");
  } else {
    progress.completedLessonIds.push(lessonId);
    showCustomAlert("🎉 أحسنت! تم تحديد الدرس كمكتمل.");
  }
  saveCourseProgress(courseId, progress);
  notifyCourseSystemUpdated();
}

export function markLessonComplete(courseId, lessonId) {
  const progress = getCourseProgress(courseId);
  if (!progress.completedLessonIds) progress.completedLessonIds = [];
  if (!progress.completedLessonIds.includes(lessonId)) {
    progress.completedLessonIds.push(lessonId);
    saveCourseProgress(courseId, progress);
    notifyCourseSystemUpdated();
  }
}

export function navigateToPrevLesson(courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;
  const curriculum = getCourseCurriculum(course);
  const progress = getCourseProgress(course.id);

  let flatLessons = [];
  curriculum.forEach((sec) => flatLessons.push(...(sec.lessons || [])));
  const currIdx = flatLessons.findIndex(
    (l) => l.id === progress.lastActiveLessonId,
  );

  if (currIdx > 0) {
    selectCourseLesson(course.id, flatLessons[currIdx - 1].id);
  }
}

export function navigateToNextLesson(courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;
  const curriculum = getCourseCurriculum(course);
  const progress = getCourseProgress(course.id);

  let flatLessons = [];
  curriculum.forEach((sec) => flatLessons.push(...(sec.lessons || [])));
  const currIdx = flatLessons.findIndex(
    (l) => l.id === progress.lastActiveLessonId,
  );

  if (currIdx >= 0 && currIdx < flatLessons.length - 1) {
    selectCourseLesson(course.id, flatLessons[currIdx + 1].id);
  } else {
    showCustomAlert("وصلت إلى نهاية كافة دروس الكورس!");
  }
}

export function openCourseResourcesModal(courseId) {
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (!course) return;
  const curriculum = getCourseCurriculum(course);

  let resourcesList = [];
  curriculum.forEach((sec) => {
    (sec.lessons || []).forEach((les) => {
      if (Array.isArray(les.resources)) {
        resourcesList.push(...les.resources);
      }
    });
  });

  if (resourcesList.length === 0) {
    resourcesList = [
      { name: "خطة الكورس الشاملة.pdf", type: "pdf", size: "1.4 MB" },
      { name: "ملفات المشروع المصدري.zip", type: "zip", size: "4.2 MB" },
      { name: "عروض التقديم والشرائح.pptx", type: "ppt", size: "2.8 MB" },
    ];
  }

  const modal = document.createElement("div");
  modal.className = "floating-modal-overlay";
  modal.innerHTML = `
    <div class="floating-modal-box" style="max-width: 520px; width: 90%; background: #ffffff; border-radius: 18px; padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">📁 موارد وملفات دورة: ${course.title}</h3>
        <button type="button" class="close-modal-btn" onclick="this.closest('.floating-modal-overlay').remove()" style="background: none; border: none; font-size: 18px; cursor: pointer;">✖</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 350px; overflow-y: auto;">
        ${resourcesList
          .map(
            (res) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">📄</span>
              <div>
                <div style="font-weight: 700; font-size: 13px; color: #1e293b;">${res.name}</div>
                <div style="font-size: 11px; color: #64748b;">${res.type?.toUpperCase() || "FILE"} • ${res.size || "1.0 MB"}</div>
              </div>
            </div>
            <button type="button" class="btn btn-primary sm" onclick="downloadSampleFile('${res.name.replace(/'/g, "\\'")}')" style="padding: 6px 14px; border-radius: 8px; font-weight: 700;">تحميل ⬇</button>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

if (typeof window !== "undefined") {
  window.downloadSampleFile = function (fileName) {
    const blob = new Blob(
      [
        `محتوى الملف التعليمي: ${fileName}\n\nشكراً لاستخدامك منصتنا التعليمية.`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showCustomAlert(`تم بدء تحميل ملف ${fileName}`);
  };
}

export function openStudentQuizModal(quiz, courseTitle) {
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    showCustomAlert("لا توجد أسئلة مضافة في هذا الاختبار بعد.");
    return;
  }

  const userAnswers = {};
  const modal = document.createElement("div");
  modal.className = "floating-modal-overlay";
  modal.innerHTML = `
    <div class="floating-modal-box" style="max-width: 650px; width: 92%; background: #ffffff; border-radius: 20px; padding: 26px; max-height: 90vh; overflow-y: auto;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px;">
        <div>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">❓ ${quiz.title}</h3>
          <span style="font-size: 12px; color: #64748b;">دورة: ${courseTitle} • درجة النجاح: ${quiz.passingGrade || 70}%</span>
        </div>
        <button type="button" onclick="this.closest('.floating-modal-overlay').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
      </div>

      <div id="quizQuestionsContainer" style="display: flex; flex-direction: column; gap: 20px;">
        ${quiz.questions
          .map(
            (q, qIdx) => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px;">
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 12px;">
              س${qIdx + 1}: ${q.question}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(q.options || [])
                .map(
                  (opt, optIdx) => `
                <label style="display: flex; align-items: center; gap: 10px; background: #ffffff; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-size: 13px; color: #334155;">
                  <input type="radio" name="quiz_q_${qIdx}" value="${optIdx}" onchange="window._tempQuizAnswers = window._tempQuizAnswers || {}; window._tempQuizAnswers[${qIdx}] = ${optIdx};">
                  <span>${opt}</span>
                </label>
              `,
                )
                .join("")}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px;">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
        <button type="button" class="btn-primary-purple" onclick="submitStudentQuiz('${quiz.id}', ${quiz.passingGrade || 70}, ${quiz.questions.length})">تسليم الاختبار 🚀</button>
      </div>
    </div>
  `;
  window._tempQuizAnswers = {};
  document.body.appendChild(modal);
}

if (typeof window !== "undefined") {
  window.submitStudentQuiz = function (quizId, passingGrade, totalQuestions) {
    const answers = window._tempQuizAnswers || {};
    let score = 0;

    for (let i = 0; i < totalQuestions; i++) {
      if (answers[i] === 0) {
        score++;
      }
    }
    const percent = Math.round((score / totalQuestions) * 100);
    const passed = percent >= passingGrade;

    document.querySelector(".floating-modal-overlay")?.remove();

    showCustomAlert(
      passed
        ? `🎉 تهانينا! لقد اجتزت الاختبار بنسبة ${percent}%`
        : `النتيجة: ${percent}%. يرجى مراجعة الدروس وإعادة المحاولة.`,
    );
  };
}

export function openStudentAssignmentModal(assignment, courseTitle) {
  if (!assignment) return;

  const modal = document.createElement("div");
  modal.className = "floating-modal-overlay";
  modal.innerHTML = `
    <div class="floating-modal-box" style="max-width: 600px; width: 92%; background: #ffffff; border-radius: 20px; padding: 26px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px;">
        <div>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">📝 ${assignment.title}</h3>
          <span style="font-size: 12px; color: #64748b;">دورة: ${courseTitle} • الموعد النهائي: ${assignment.deadline || "2026-08-30"}</span>
        </div>
        <button type="button" onclick="this.closest('.floating-modal-overlay').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✖</button>
      </div>

      <div style="background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 13px; color: #334155; line-height: 1.6;">
        <strong>تعليمات الواجب:</strong><br>
        ${assignment.description || "قم بإنجاز المشروع المطلوب واكتب ملخص العمل هنا أو ارفع الملف المصدري."}
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-weight: 700; font-size: 13px; color: #1e293b; margin-bottom: 8px;">ملاحظات أو حل الواجب النصي:</label>
        <textarea id="assignmentStudentText" rows="4" placeholder="اكتب تفاصيل الحل هنا..." style="width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-family: inherit; font-size: 13px; box-sizing: border-box;"></textarea>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; font-weight: 700; font-size: 13px; color: #1e293b; margin-bottom: 8px;">إرفاق ملف الحل (ZIP / PDF / Image):</label>
        <input type="file" id="assignmentStudentFile" style="font-size: 13px;">
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
        <button type="button" class="btn-primary-purple" onclick="submitStudentAssignment('${assignment.id}')">تسليم الواجب 🚀</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

if (typeof window !== "undefined") {
  window.submitStudentAssignment = function (assignmentId) {
    const text = document.getElementById("assignmentStudentText")?.value;
    document.querySelector(".floating-modal-overlay")?.remove();
    showCustomAlert(
      "تم تسليم الواجب بنجاح! سيتم مراجعته وتقييمه من قبل المعلم.",
    );
  };
}

export function updateCertificateButtonsInCards() {
  if (typeof document === "undefined") return;
  const myCoursesPage = document.getElementById("myCoursesPage");
  if (!myCoursesPage) return;

  // 1. Process grid cards (.my-course-card)
  const cards = myCoursesPage.querySelectorAll(".my-course-card");
  cards.forEach((card) => {
    const cardTitle =
      card.getAttribute("data-title") ||
      card.querySelector(".card-title")?.textContent?.trim();
    if (!cardTitle) return;

    let course = coursesData.find(
      (c) =>
        c.title === cardTitle ||
        cardTitle.includes(c.title) ||
        c.title.includes(cardTitle),
    );
    if (!course) {
      const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
      course = teacherCourses.find(
        (c) => c.title === cardTitle || cardTitle.includes(c.title),
      );
    }

    const attrProgress = card.getAttribute("data-progress");
    let isCompleted = false;
    let courseId = course ? course.id : null;

    if (course) {
      const progressPercent = calculateCourseProgressPercent(course);
      if (
        progressPercent === 100 ||
        attrProgress === "100" ||
        card.getAttribute("data-category") === "completed"
      ) {
        isCompleted = true;
      }
    } else if (
      attrProgress === "100" ||
      card.getAttribute("data-category") === "completed"
    ) {
      isCompleted = true;
      courseId = cardTitle;
    }

    const buttonGroup = card.querySelector(".card-button-group");
    if (!buttonGroup) return;

    let certBtn = buttonGroup.querySelector(".btn-certificate-claim");

    if (isCompleted) {
      if (!certBtn) {
        certBtn = document.createElement("button");
        certBtn.type = "button";
        certBtn.className = "btn-secondary-outline sm btn-certificate-claim";
        certBtn.style.cssText =
          "width: 100%; margin-top: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-color: #7c3aed; color: #7c3aed; font-weight: 700;";
        certBtn.innerHTML = `<span>الحصول على الشهادة 🏆</span>`;
        certBtn.onclick = function (e) {
          e.stopPropagation();
          openCourseCertificateModal(courseId || cardTitle);
        };
        buttonGroup.appendChild(certBtn);
      } else {
        certBtn.onclick = function (e) {
          e.stopPropagation();
          openCourseCertificateModal(courseId || cardTitle);
        };
      }
    } else {
      if (certBtn) certBtn.remove();
    }
  });

  // 2. Process continue-learning card (.continue-learning-card)
  const continueCard = myCoursesPage.querySelector(".continue-learning-card");
  if (continueCard) {
    const titleElem = continueCard.querySelector(".continue-course-title");
    const cardTitle = titleElem ? titleElem.textContent.trim() : "";
    let course = coursesData.find(
      (c) =>
        c.title === cardTitle ||
        cardTitle.includes(c.title) ||
        c.title.includes(cardTitle),
    );

    let isCompleted = false;
    let courseId = course ? course.id : null;

    if (course) {
      const progressPercent = calculateCourseProgressPercent(course);
      if (progressPercent === 100) isCompleted = true;
    }

    const actionsSide = continueCard.querySelector(".card-actions-side");
    if (actionsSide) {
      let certBtn = actionsSide.querySelector(".btn-certificate-claim");
      if (isCompleted) {
        if (!certBtn) {
          certBtn = document.createElement("button");
          certBtn.type = "button";
          certBtn.className = "btn-secondary-outline btn-certificate-claim";
          certBtn.style.cssText =
            "width: 100%; margin-top: 6px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border-color: #7c3aed; color: #7c3aed; font-weight: 700;";
          certBtn.innerHTML = `<span>الحصول على الشهادة 🏆</span>`;
          certBtn.onclick = function (e) {
            e.stopPropagation();
            openCourseCertificateModal(courseId || cardTitle);
          };
          actionsSide.appendChild(certBtn);
        }
      } else {
        if (certBtn) certBtn.remove();
      }
    }
  }
}

export function openCourseCertificateModal(courseId) {
  let targetId = Number(courseId) || courseId;
  let course =
    coursesData.find((c) => String(c.id) === String(targetId)) ||
    coursesData.find(
      (c) => c.title === courseId || c.title.includes(String(courseId)),
    );

  if (!course) {
    const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
    course = teacherCourses.find(
      (c) => String(c.id) === String(targetId) || c.title === courseId,
    );
  }

  if (!course) {
    course = {
      id: courseId || 1,
      title:
        typeof courseId === "string" && courseId.startsWith("دورة")
          ? courseId
          : "دورة التسويق الرقمي",
      instructor: "أحمد محمد",
      duration: 10,
      level: "intermediate",
    };
  }

  const appState = window.appState || {};
  let currentUser = null;
  try {
    const raw = localStorage.getItem("lms_user_session");
    currentUser = raw ? JSON.parse(raw) : null;
  } catch (e) {}

  const studentName =
    appState.userData?.name ||
    appState.userData?.fullName ||
    currentUser?.name ||
    "إسلام عادل";

  // Level Arabic Mapping
  let levelText = "متوسط";
  if (course.level === "beginner") levelText = "مبتدئ";
  else if (course.level === "advanced") levelText = "متقدم";
  else if (course.level) levelText = course.level;

  const durationText = `${course.duration || 10} ساعات`;

  // Persistent Certificate ID and Issued Date per course
  const storageKey = `lms_course_cert_data_${course.id}`;
  let certData = loadLocalStorage(storageKey, null);

  if (!certData || !certData.certificateId) {
    const certId = "SM-CERT-2026-000493248";
    const verifyCode = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    certData = {
      certificateId: certId,
      verificationCode: verifyCode,
      issuedDate: "15 مايو 2024",
      courseTitle: course.title,
      studentName: studentName,
      instructor: course.instructor || "أحمد محمد",
    };
    saveLocalStorage(storageKey, certData);
  }

  // Remove any existing certificate modal if open
  const existingModal = document.getElementById("certificateModalOverlay");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "certificateModalOverlay";
  modal.className = "floating-modal-overlay";
  modal.style.cssText =
    "position: fixed; inset: 0; background: rgba(10, 18, 38, 0.88); backdrop-filter: blur(10px); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;";

  modal.innerHTML = `
    <!-- SVG Definitions for Metallic Gold Gradients -->
    <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
      <defs>
        <linearGradient id="masterGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#bf953f" />
          <stop offset="25%" stop-color="#fcf6ba" />
          <stop offset="50%" stop-color="#b38728" />
          <stop offset="75%" stop-color="#fbf5b7" />
          <stop offset="100%" stop-color="#aa771c" />
        </linearGradient>
      </defs>
    </svg>

    <div style="max-width: 1040px; width: 100%; display: flex; flex-direction: column; gap: 16px; align-items: center; margin: auto;">
      
      <!-- Top Action Bar (Screen Only - Hidden in Print) -->
      <div class="no-print" style="width: 100%; display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 14px 24px; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 42px; height: 42px; background: linear-gradient(135deg, #b38728, #aa771c); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #ffffff; box-shadow: 0 4px 12px rgba(170, 119, 28, 0.35);">
            🎓
          </div>
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #0d1b2a; margin: 0;">معاينة الشهادة المعتمدة</h3>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">رقم الشهادة: <strong style="color: #b38728;">${certData.certificateId}</strong></p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <button type="button" onclick="window.print()" style="padding: 11px 26px; border-radius: 10px; font-weight: 800; background: linear-gradient(135deg, #0d1b2a, #1e293b); color: #fef08a; border: 1.5px solid #d4af37; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 14px rgba(13, 27, 42, 0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            طباعة الشهادة / حفظ PDF
          </button>
          <button type="button" onclick="document.getElementById('certificateModalOverlay')?.remove()" style="background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 10px; font-size: 18px; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="إغلاق">✖</button>
        </div>
      </div>

      <!-- STEP 13: MASTER BLUEPRINT CERTIFICATE CANVAS WITH PERFECT LAYOUT & ALIGNMENT -->
      <div class="certificate-printable-area" dir="rtl" style="width: 100%; aspect-ratio: 1.414 / 1; max-width: 1000px; min-height: 620px; position: relative; background: #0b1426; border-radius: 14px; padding: 18px; box-sizing: border-box; box-shadow: 0 30px 70px rgba(0,0,0,0.6); border: 2.5px solid #d4af37; overflow: hidden; display: flex; flex-direction: column;">
        
        <!-- Inner Ivory Paper Canvas with Luxury Texture and Subtle Paper Lighting -->
        <div style="position: relative; width: 100%; height: 100%; flex: 1; background: #fdfbf7; background-image: radial-gradient(circle at center, #ffffff 0%, #fdfbf5 60%, #f7eff0 100%), repeating-linear-gradient(45deg, rgba(180, 150, 90, 0.015) 0px, rgba(180, 150, 90, 0.015) 2px, transparent 2px, transparent 4px); border-radius: 6px; padding: 28px 36px 0px; box-sizing: border-box; border: 3px solid #b38728; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
          
          <!-- Inner Double Gold Hairline Accent -->
          <div style="position: absolute; inset: 10px; border: 1.5px solid #d4af37; border-radius: 4px; pointer-events: none; z-index: 2;"></div>

          <!-- 1. TOP-RIGHT DIGITALLY VERIFIED RIBBON -->
          <div style="position: absolute; top: -2px; right: 48px; width: 88px; height: 132px; z-index: 10; pointer-events: none; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.3));">
            <svg width="88" height="132" viewBox="0 0 92 140" fill="none">
              <!-- Swallowtail Navy Ribbon -->
              <path d="M0 0 H92 V118 L46 140 L0 118 Z" fill="#0d1b2a" stroke="url(#masterGoldGrad)" stroke-width="2.5"/>
              <path d="M5 0 H87 V114 L46 133 L5 114 Z" fill="none" stroke="url(#masterGoldGrad)" stroke-width="1" stroke-dasharray="3 2" opacity="0.8"/>
            </svg>
            <div style="position: absolute; top: 10px; left: 0; width: 100%; text-align: center;">
              <!-- Laurel Wreath -->
              <svg width="34" height="34" viewBox="0 0 48 48" fill="none" style="margin: 0 auto; display: block;">
                <circle cx="24" cy="24" r="20" fill="url(#masterGoldGrad)" opacity="0.15"/>
                <circle cx="24" cy="24" r="18" stroke="url(#masterGoldGrad)" stroke-width="1.5"/>
                <path d="M16 26 C14 20, 18 14, 24 14 C30 14, 34 20, 32 26" stroke="url(#masterGoldGrad)" stroke-width="2" fill="none"/>
                <path d="M20 20 L24 16 L28 20 M24 16 V32" stroke="url(#masterGoldGrad)" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <div style="font-family: Arial, sans-serif; font-size: 9.5px; font-weight: 900; color: #fef08a; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.1;">
                Digitally<br><span style="color: #ffffff; font-size: 10.5px;">Verified</span>
              </div>
              <div style="font-size: 8.5px; color: #fbbf24; margin-top: 3px; letter-spacing: 2px;">★ ★ ★</div>
            </div>
          </div>

          <!-- 4 LUXURY VICTORIAN ENGRAVED METALLIC GOLD CORNER ORNAMENTS -->
          
          <!-- TOP LEFT CORNER ORNAMENT -->
          <svg width="105" height="105" viewBox="0 0 100 100" fill="none" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 5; filter: drop-shadow(0.5px 1px 1px rgba(0,0,0,0.3));">
            <path d="M 0 0 L 92 0 M 0 0 L 0 92" stroke="url(#masterGoldGrad)" stroke-width="2" />
            <path d="M 0 3 L 88 3 M 3 0 L 3 88" stroke="url(#masterGoldGrad)" stroke-width="0.8" opacity="0.85" />
            <path d="M 0 6 L 80 6 M 6 0 L 6 80" stroke="url(#masterGoldGrad)" stroke-width="0.6" opacity="0.7" />
            <path d="M 18 0 A 18 18 0 0 0 0 18" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 24 0 A 24 24 0 0 0 0 24" stroke="url(#masterGoldGrad)" stroke-width="0.7" fill="none" />
            <path d="M 32 0 A 32 32 0 0 0 0 32" stroke="url(#masterGoldGrad)" stroke-width="1" stroke-dasharray="2 2" fill="none" />
            <path d="M 0 90 C 25 90, 42 75, 58 58 C 75 42, 90 25, 90 0" stroke="url(#masterGoldGrad)" stroke-width="1.5" fill="none" />
            <path d="M 0 82 C 22 82, 38 68, 52 52 C 68 38, 82 22, 82 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 90 0 C 96 6, 98 15, 90 20 C 82 25, 75 16, 82 10 C 87 6, 92 12, 88 15" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 90 C 6 96, 15 98, 20 90 C 25 82, 16 75, 10 82 C 6 87, 12 92, 15 88" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 68 C 15 68, 28 58, 42 42 C 58 28, 68 15, 68 0" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 52 C 12 52, 22 44, 32 32 C 44 22, 52 12, 52 0" stroke="url(#masterGoldGrad)" stroke-width="1" fill="none" />
            <path d="M 0 38 C 8 38, 16 32, 24 24 C 32 16, 38 8, 38 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 28 28 C 40 18, 58 15, 62 25 C 52 30, 38 32, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 28 28 C 18 40, 15 58, 25 62 C 30 52, 32 38, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 8 8 C 22 22, 42 42, 60 60" stroke="url(#masterGoldGrad)" stroke-width="1.4" />
            <path d="M 18 18 L 26 12 M 22 22 L 28 16 M 30 30 L 38 22 M 38 38 L 48 28 M 46 46 L 56 36" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 18 18 L 12 26 M 22 22 L 16 28 M 30 30 L 22 38 M 38 38 L 28 48 M 46 46 L 36 56" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 45 2 L 45 8 M 55 2 L 55 8 M 65 2 L 65 8 M 75 2 L 75 8 M 85 2 L 85 8" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 2 45 L 8 45 M 2 55 L 8 55 M 2 65 L 8 65 M 2 75 L 8 75 M 2 85 L 8 85" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <circle cx="28" cy="28" r="2.5" fill="url(#masterGoldGrad)" />
            <circle cx="12" cy="12" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="48" cy="48" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="68" cy="20" r="1.5" fill="url(#masterGoldGrad)" />
            <circle cx="20" cy="68" r="1.5" fill="url(#masterGoldGrad)" />
          </svg>

          <!-- TOP RIGHT CORNER ORNAMENT -->
          <svg width="105" height="105" viewBox="0 0 100 100" fill="none" style="position: absolute; top: 0; right: 0; pointer-events: none; z-index: 5; filter: drop-shadow(-0.5px 1px 1px rgba(0,0,0,0.3)); transform: scaleX(-1);">
            <path d="M 0 0 L 92 0 M 0 0 L 0 92" stroke="url(#masterGoldGrad)" stroke-width="2" />
            <path d="M 0 3 L 88 3 M 3 0 L 3 88" stroke="url(#masterGoldGrad)" stroke-width="0.8" opacity="0.85" />
            <path d="M 0 6 L 80 6 M 6 0 L 6 80" stroke="url(#masterGoldGrad)" stroke-width="0.6" opacity="0.7" />
            <path d="M 18 0 A 18 18 0 0 0 0 18" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 24 0 A 24 24 0 0 0 0 24" stroke="url(#masterGoldGrad)" stroke-width="0.7" fill="none" />
            <path d="M 32 0 A 32 32 0 0 0 0 32" stroke="url(#masterGoldGrad)" stroke-width="1" stroke-dasharray="2 2" fill="none" />
            <path d="M 0 90 C 25 90, 42 75, 58 58 C 75 42, 90 25, 90 0" stroke="url(#masterGoldGrad)" stroke-width="1.5" fill="none" />
            <path d="M 0 82 C 22 82, 38 68, 52 52 C 68 38, 82 22, 82 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 90 0 C 96 6, 98 15, 90 20 C 82 25, 75 16, 82 10 C 87 6, 92 12, 88 15" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 90 C 6 96, 15 98, 20 90 C 25 82, 16 75, 10 82 C 6 87, 12 92, 15 88" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 68 C 15 68, 28 58, 42 42 C 58 28, 68 15, 68 0" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 52 C 12 52, 22 44, 32 32 C 44 22, 52 12, 52 0" stroke="url(#masterGoldGrad)" stroke-width="1" fill="none" />
            <path d="M 0 38 C 8 38, 16 32, 24 24 C 32 16, 38 8, 38 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 28 28 C 40 18, 58 15, 62 25 C 52 30, 38 32, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 28 28 C 18 40, 15 58, 25 62 C 30 52, 32 38, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 8 8 C 22 22, 42 42, 60 60" stroke="url(#masterGoldGrad)" stroke-width="1.4" />
            <path d="M 18 18 L 26 12 M 22 22 L 28 16 M 30 30 L 38 22 M 38 38 L 48 28 M 46 46 L 56 36" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 18 18 L 12 26 M 22 22 L 16 28 M 30 30 L 22 38 M 38 38 L 28 48 M 46 46 L 36 56" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 45 2 L 45 8 M 55 2 L 55 8 M 65 2 L 65 8 M 75 2 L 75 8 M 85 2 L 85 8" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 2 45 L 8 45 M 2 55 L 8 55 M 2 65 L 8 65 M 2 75 L 8 75 M 2 85 L 8 85" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <circle cx="28" cy="28" r="2.5" fill="url(#masterGoldGrad)" />
            <circle cx="12" cy="12" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="48" cy="48" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="68" cy="20" r="1.5" fill="url(#masterGoldGrad)" />
            <circle cx="20" cy="68" r="1.5" fill="url(#masterGoldGrad)" />
          </svg>

          <!-- BOTTOM LEFT CORNER ORNAMENT -->
          <svg width="105" height="105" viewBox="0 0 100 100" fill="none" style="position: absolute; bottom: 0; left: 0; pointer-events: none; z-index: 5; filter: drop-shadow(0.5px -1px 1px rgba(0,0,0,0.3)); transform: scaleY(-1);">
            <path d="M 0 0 L 92 0 M 0 0 L 0 92" stroke="url(#masterGoldGrad)" stroke-width="2" />
            <path d="M 0 3 L 88 3 M 3 0 L 3 88" stroke="url(#masterGoldGrad)" stroke-width="0.8" opacity="0.85" />
            <path d="M 0 6 L 80 6 M 6 0 L 6 80" stroke="url(#masterGoldGrad)" stroke-width="0.6" opacity="0.7" />
            <path d="M 18 0 A 18 18 0 0 0 0 18" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 24 0 A 24 24 0 0 0 0 24" stroke="url(#masterGoldGrad)" stroke-width="0.7" fill="none" />
            <path d="M 32 0 A 32 32 0 0 0 0 32" stroke="url(#masterGoldGrad)" stroke-width="1" stroke-dasharray="2 2" fill="none" />
            <path d="M 0 90 C 25 90, 42 75, 58 58 C 75 42, 90 25, 90 0" stroke="url(#masterGoldGrad)" stroke-width="1.5" fill="none" />
            <path d="M 0 82 C 22 82, 38 68, 52 52 C 68 38, 82 22, 82 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 90 0 C 96 6, 98 15, 90 20 C 82 25, 75 16, 82 10 C 87 6, 92 12, 88 15" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 90 C 6 96, 15 98, 20 90 C 25 82, 16 75, 10 82 C 6 87, 12 92, 15 88" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 68 C 15 68, 28 58, 42 42 C 58 28, 68 15, 68 0" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 52 C 12 52, 22 44, 32 32 C 44 22, 52 12, 52 0" stroke="url(#masterGoldGrad)" stroke-width="1" fill="none" />
            <path d="M 0 38 C 8 38, 16 32, 24 24 C 32 16, 38 8, 38 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 28 28 C 40 18, 58 15, 62 25 C 52 30, 38 32, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 28 28 C 18 40, 15 58, 25 62 C 30 52, 32 38, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 8 8 C 22 22, 42 42, 60 60" stroke="url(#masterGoldGrad)" stroke-width="1.4" />
            <path d="M 18 18 L 26 12 M 22 22 L 28 16 M 30 30 L 38 22 M 38 38 L 48 28 M 46 46 L 56 36" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 18 18 L 12 26 M 22 22 L 16 28 M 30 30 L 22 38 M 38 38 L 28 48 M 46 46 L 36 56" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 45 2 L 45 8 M 55 2 L 55 8 M 65 2 L 65 8 M 75 2 L 75 8 M 85 2 L 85 8" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 2 45 L 8 45 M 2 55 L 8 55 M 2 65 L 8 65 M 2 75 L 8 75 M 2 85 L 8 85" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <circle cx="28" cy="28" r="2.5" fill="url(#masterGoldGrad)" />
            <circle cx="12" cy="12" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="48" cy="48" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="68" cy="20" r="1.5" fill="url(#masterGoldGrad)" />
            <circle cx="20" cy="68" r="1.5" fill="url(#masterGoldGrad)" />
          </svg>

          <!-- BOTTOM RIGHT CORNER ORNAMENT -->
          <svg width="105" height="105" viewBox="0 0 100 100" fill="none" style="position: absolute; bottom: 0; right: 0; pointer-events: none; z-index: 5; filter: drop-shadow(-0.5px -1px 1px rgba(0,0,0,0.3)); transform: scale(-1, -1);">
            <path d="M 0 0 L 92 0 M 0 0 L 0 92" stroke="url(#masterGoldGrad)" stroke-width="2" />
            <path d="M 0 3 L 88 3 M 3 0 L 3 88" stroke="url(#masterGoldGrad)" stroke-width="0.8" opacity="0.85" />
            <path d="M 0 6 L 80 6 M 6 0 L 6 80" stroke="url(#masterGoldGrad)" stroke-width="0.6" opacity="0.7" />
            <path d="M 18 0 A 18 18 0 0 0 0 18" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 24 0 A 24 24 0 0 0 0 24" stroke="url(#masterGoldGrad)" stroke-width="0.7" fill="none" />
            <path d="M 32 0 A 32 32 0 0 0 0 32" stroke="url(#masterGoldGrad)" stroke-width="1" stroke-dasharray="2 2" fill="none" />
            <path d="M 0 90 C 25 90, 42 75, 58 58 C 75 42, 90 25, 90 0" stroke="url(#masterGoldGrad)" stroke-width="1.5" fill="none" />
            <path d="M 0 82 C 22 82, 38 68, 52 52 C 68 38, 82 22, 82 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 90 0 C 96 6, 98 15, 90 20 C 82 25, 75 16, 82 10 C 87 6, 92 12, 88 15" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 90 C 6 96, 15 98, 20 90 C 25 82, 16 75, 10 82 C 6 87, 12 92, 15 88" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 68 C 15 68, 28 58, 42 42 C 58 28, 68 15, 68 0" stroke="url(#masterGoldGrad)" stroke-width="1.2" fill="none" />
            <path d="M 0 52 C 12 52, 22 44, 32 32 C 44 22, 52 12, 52 0" stroke="url(#masterGoldGrad)" stroke-width="1" fill="none" />
            <path d="M 0 38 C 8 38, 16 32, 24 24 C 32 16, 38 8, 38 0" stroke="url(#masterGoldGrad)" stroke-width="0.8" fill="none" />
            <path d="M 28 28 C 40 18, 58 15, 62 25 C 52 30, 38 32, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 28 28 C 18 40, 15 58, 25 62 C 30 52, 32 38, 28 28 Z" stroke="url(#masterGoldGrad)" stroke-width="0.9" fill="url(#masterGoldGrad)" fill-opacity="0.1" />
            <path d="M 8 8 C 22 22, 42 42, 60 60" stroke="url(#masterGoldGrad)" stroke-width="1.4" />
            <path d="M 18 18 L 26 12 M 22 22 L 28 16 M 30 30 L 38 22 M 38 38 L 48 28 M 46 46 L 56 36" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 18 18 L 12 26 M 22 22 L 16 28 M 30 30 L 22 38 M 38 38 L 28 48 M 46 46 L 36 56" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 45 2 L 45 8 M 55 2 L 55 8 M 65 2 L 65 8 M 75 2 L 75 8 M 85 2 L 85 8" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <path d="M 2 45 L 8 45 M 2 55 L 8 55 M 2 65 L 8 65 M 2 75 L 8 75 M 2 85 L 8 85" stroke="url(#masterGoldGrad)" stroke-width="0.7" />
            <circle cx="28" cy="28" r="2.5" fill="url(#masterGoldGrad)" />
            <circle cx="12" cy="12" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="48" cy="48" r="2" fill="url(#masterGoldGrad)" />
            <circle cx="68" cy="20" r="1.5" fill="url(#masterGoldGrad)" />
            <circle cx="20" cy="68" r="1.5" fill="url(#masterGoldGrad)" />
          </svg>

          <!-- WATERMARK BACKGROUND SEAL (CENTERED BEHIND TEXT) -->
          <div style="position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%); width: 420px; height: 420px; pointer-events: none; opacity: 0.055; z-index: 1;">
            <svg width="420" height="420" viewBox="0 0 400 400" fill="none">
              <circle cx="200" cy="200" r="190" stroke="#0d1b2a" stroke-width="4"/>
              <circle cx="200" cy="200" r="180" stroke="#0d1b2a" stroke-width="1.5" stroke-dasharray="4 3"/>
              <circle cx="200" cy="200" r="150" stroke="#0d1b2a" stroke-width="2"/>
              <path id="watermarkTextPath" d="M 60, 200 A 140,140 0 1,1 340,200 A 140,140 0 1,1 60,200" fill="none"/>
              <text font-size="14" font-weight="900" fill="#0d1b2a" letter-spacing="4">
                <textPath href="#watermarkTextPath" startOffset="0%">STUDYMART ★ OFFICIAL CERTIFICATE ★ STUDYMART ★ OFFICIAL CERTIFICATE ★</textPath>
              </text>
              <g transform="translate(130, 140)">
                <path d="M70 15 L130 45 L70 75 L10 45 Z" fill="#0d1b2a"/>
                <path d="M35 58 V90 C35 98 50 105 70 105 C90 105 105 98 105 90 V58" fill="none" stroke="#0d1b2a" stroke-width="6"/>
              </g>
            </svg>
          </div>

          <!-- FOREGROUND LAYOUT CONTAINER -->
          <div style="position: relative; z-index: 4; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%; width: 100%;">

            <!-- TOP LOGO & TITLE SECTION -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
              
              <!-- 1. LOGO & BRANDING -->
              <div style="display: inline-flex; align-items: center; gap: 10px; margin-top: 2px; margin-bottom: 2px;">
                <svg width="42" height="42" viewBox="0 0 64 64" fill="none">
                  <path d="M32 8 L60 22 L32 36 L4 22 Z" fill="#0d1b2a" stroke="url(#masterGoldGrad)" stroke-width="2"/>
                  <path d="M16 29 V44 C16 48 23 52 32 52 C41 52 48 48 48 44 V29" fill="none" stroke="#0d1b2a" stroke-width="3"/>
                  <path d="M52 23 V40" stroke="url(#masterGoldGrad)" stroke-width="2.5"/>
                  <circle cx="52" cy="42" r="3.5" fill="url(#masterGoldGrad)"/>
                </svg>
                <div style="text-align: right;">
                  <div style="font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: -0.5px; font-family: sans-serif;">
                    <span style="color: #0d1b2a;">Study</span><span style="background: linear-gradient(135deg, #bf953f, #b38728, #aa771c); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Mart</span>
                  </div>
                </div>
              </div>

              <!-- Subtitle Tagline -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 36px; height: 1px; background: linear-gradient(90deg, transparent, #c59b27);"></div>
                <span style="color: #c59b27; font-size: 9px;">◆</span>
                <span style="font-size: 10px; font-weight: 800; color: #1e293b; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;">PROFESSIONAL LEARNING PLATFORM</span>
                <span style="color: #c59b27; font-size: 9px;">◆</span>
                <div style="width: 36px; height: 1px; background: linear-gradient(-90deg, transparent, #c59b27);"></div>
              </div>

              <!-- 3. ARABIC MAIN TITLE -->
              <h1 style="font-size: 32px; font-weight: 900; color: #0d1b2a; margin: 0 0 2px; letter-spacing: -0.5px; line-height: 1.15;">
                شهادة إتمام دورة تدريبية
              </h1>

              <!-- 4. GOLD ORNATE DIVIDER -->
              <svg width="240" height="16" viewBox="0 0 260 18" fill="none" style="margin: 0 auto 8px; display: block;">
                <path d="M0 9 H95 M165 9 H260" stroke="url(#masterGoldGrad)" stroke-width="1.5"/>
                <path d="M95 9 C105 4, 110 14, 130 9 C150 4, 155 14, 165 9" stroke="url(#masterGoldGrad)" stroke-width="2" fill="none"/>
                <polygon points="130,3 136,9 130,15 124,9" fill="url(#masterGoldGrad)"/>
              </svg>

              <!-- RECIPIENT INTRODUCTION -->
              <p style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 2px;">
                تشهد منصة StudyMart أن
              </p>

              <!-- UPPER SCROLL FLOURISH -->
              <svg width="240" height="12" viewBox="0 0 260 14" fill="none" style="margin: 0 auto 2px; display: block;">
                <path d="M0 7 H95 M165 7 H260" stroke="url(#masterGoldGrad)" stroke-width="1"/>
                <path d="M95 7 C105 2, 110 12, 130 7 C150 2, 155 12, 165 7" stroke="url(#masterGoldGrad)" stroke-width="1.5" fill="none"/>
                <circle cx="130" cy="7" r="2.5" fill="url(#masterGoldGrad)"/>
              </svg>

              <!-- 5. STUDENT NAME -->
              <h2 style="font-size: 42px; font-weight: 900; color: #0d1b2a; margin: 0 0 2px; letter-spacing: -0.5px; line-height: 1.1;">
                ${studentName}
              </h2>

              <!-- LOWER SCROLL FLOURISH -->
              <svg width="240" height="12" viewBox="0 0 260 14" fill="none" style="margin: 0 auto 6px; display: block;">
                <path d="M0 7 H95 M165 7 H260" stroke="url(#masterGoldGrad)" stroke-width="1"/>
                <path d="M95 7 C105 12, 110 2, 130 7 C150 12, 155 2, 165 7" stroke="url(#masterGoldGrad)" stroke-width="1.5" fill="none"/>
                <circle cx="130" cy="7" r="2.5" fill="url(#masterGoldGrad)"/>
              </svg>

              <p style="font-size: 14px; font-weight: 700; color: #334155; margin: 0 0 6px;">
                قد إكمل بنجاح جميع متطلبات دورة
              </p>

              <!-- 6. GOLD METALLIC COURSE BANNER -->
              <div style="position: relative; display: inline-flex; align-items: center; justify-content: center; margin: 2px 0 6px;">
                <svg width="28" height="44" viewBox="0 0 32 50" fill="none" style="margin-left: -2px; filter: drop-shadow(-3px 3px 5px rgba(0,0,0,0.25));">
                  <path d="M32 0 L0 25 L32 50 Z" fill="url(#masterGoldGrad)"/>
                  <path d="M30 4 L4 25 L30 46 Z" fill="none" stroke="#634505" stroke-width="1" opacity="0.6"/>
                </svg>
                
                <div style="background: linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%); padding: 9px 46px; min-width: 380px; border-radius: 2px; box-shadow: 0 8px 20px rgba(176, 131, 35, 0.4); border-top: 1.5px solid #fff5c0; border-bottom: 1.5px solid #634505;">
                  <h3 style="font-size: 22px; font-weight: 900; color: #0d1b2a; margin: 0; text-shadow: 0 1px 0 rgba(255,255,255,0.6);">
                    ${course.title}
                  </h3>
                </div>

                <svg width="28" height="44" viewBox="0 0 32 50" fill="none" style="margin-right: -2px; filter: drop-shadow(3px 3px 5px rgba(0,0,0,0.25));">
                  <path d="M0 0 L32 25 L0 50 Z" fill="url(#masterGoldGrad)"/>
                  <path d="M2 4 L28 25 L2 46 Z" fill="none" stroke="#634505" stroke-width="1" opacity="0.6"/>
                </svg>
              </div>

              <!-- 7. DESCRIPTION -->
              <p style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 12px;">
                وقد أظهر التزاماً واجتهاداً في التعلم وأثبت كفاءته في هذا المجال.
              </p>

              <!-- 8. INFORMATION ROW (3 COLUMNS) -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 32px; width: 100%; max-width: 580px; margin: 0 auto 12px;">
                
                <!-- Column 1: Level -->
                <div style="display: flex; align-items: center; gap: 8px; text-align: right;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d1b2a" stroke-width="2">
                    <rect x="3" y="12" width="4" height="8" rx="1"/>
                    <rect x="10" y="8" width="4" height="12" rx="1"/>
                    <rect x="17" y="4" width="4" height="16" rx="1"/>
                  </svg>
                  <div>
                    <div style="font-size: 10.5px; color: #64748b; font-weight: 700;">مستوى الدورة</div>
                    <div style="font-size: 13.5px; font-weight: 900; color: #0d1b2a;">${levelText}</div>
                  </div>
                </div>

                <!-- Divider -->
                <div style="width: 1px; height: 24px; background: #cbd5e1;"></div>

                <!-- Column 2: Duration -->
                <div style="display: flex; align-items: center; gap: 8px; text-align: right;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d1b2a" stroke-width="2">
                    <circle cx="12" cy="12" r="9"/>
                    <polyline points="12 7 12 12 15 15"/>
                  </svg>
                  <div>
                    <div style="font-size: 10.5px; color: #64748b; font-weight: 700;">مدة الدورة</div>
                    <div style="font-size: 13.5px; font-weight: 900; color: #0d1b2a;">${durationText}</div>
                  </div>
                </div>

                <!-- Divider -->
                <div style="width: 1px; height: 24px; background: #cbd5e1;"></div>

                <!-- Column 3: Completion Date -->
                <div style="display: flex; align-items: center; gap: 8px; text-align: right;">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d1b2a" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <div>
                    <div style="font-size: 10.5px; color: #64748b; font-weight: 700;">تاريخ الإكمال</div>
                    <div style="font-size: 13.5px; font-weight: 900; color: #0d1b2a;">${certData.issuedDate}</div>
                  </div>
                </div>

              </div>

            </div>

            <!-- LOWER SECTION: SIGNATURES & SEAL ROW -->
            <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
              
              <div style="display: grid; grid-template-columns: 1fr 120px 1fr; gap: 16px; width: 100%; max-width: 780px; margin: 0 auto 6px; align-items: flex-end;">
                
                <!-- 10. LEFT SIGNATURE (INSTRUCTOR) -->
                <div style="text-align: center;">
                  <div style="font-family: 'Dancing Script', 'Brush Script MT', 'Caveat', cursive, sans-serif; font-size: 26px; font-weight: 700; color: #0d1b2a; height: 34px; display: flex; align-items: center; justify-content: center;">
                    Ahmed Mohamed
                  </div>
                  <div style="width: 135px; height: 1.5px; background: #cbd5e1; margin: 3px auto 5px;"></div>
                  <div style="font-size: 13.5px; font-weight: 900; color: #0d1b2a;">أحمد محمد</div>
                  <div style="font-size: 11px; font-weight: 700; color: #64748b;">مدرب الدورة</div>
                </div>

                <!-- 9. SEAL (CENTER OFFICIAL 3D GOLD EMBOSSED SEAL) -->
                <div style="text-align: center; margin-bottom: -6px;">
                  <svg width="110" height="110" viewBox="0 0 120 120" fill="none" style="filter: drop-shadow(0 8px 16px rgba(0,0,0,0.35)); display: block; margin: 0 auto;">
                    <path d="M60 0 L64 6 L71 2 L73 9 L81 7 L81 14 L89 14 L87 21 L94 23 L91 30 L97 34 L92 40 L97 46 L91 50 L94 57 L87 59 L89 66 L81 66 L81 73 L73 71 L71 78 L64 74 L60 80 L56 74 L49 78 L47 71 L39 73 L39 66 L31 66 L33 59 L26 57 L29 50 L23 46 L28 40 L23 34 L29 30 L26 23 L33 21 L31 14 L39 14 L39 7 L47 9 L49 2 L56 6 Z" fill="url(#masterGoldGrad)"/>
                    <circle cx="60" cy="40" r="38" fill="url(#masterGoldGrad)" stroke="#634505" stroke-width="1"/>
                    <circle cx="60" cy="40" r="34" fill="#0d1b2a" stroke="url(#masterGoldGrad)" stroke-width="2"/>
                    <circle cx="60" cy="40" r="31" fill="none" stroke="url(#masterGoldGrad)" stroke-width="1" stroke-dasharray="2 2"/>
                    <text x="60" y="26" text-anchor="middle" fill="#fef08a" font-size="8" font-weight="bold">★ ★ ★</text>
                    <text x="60" y="36" text-anchor="middle" fill="#ffffff" font-size="8" font-weight="900" letter-spacing="1">STUDYMART</text>
                    <text x="60" y="45" text-anchor="middle" fill="#fef08a" font-size="7.5" font-weight="800" letter-spacing="0.5">OFFICIAL</text>
                    <text x="60" y="53" text-anchor="middle" fill="#fef08a" font-size="7" font-weight="800" letter-spacing="1">SEAL</text>
                  </svg>
                </div>

                <!-- 11. RIGHT SIGNATURE (FOUNDER & CEO) -->
                <div style="text-align: center;">
                  <div style="font-family: 'Dancing Script', 'Brush Script MT', 'Caveat', cursive, sans-serif; font-size: 26px; font-weight: 700; color: #0d1b2a; height: 34px; display: flex; align-items: center; justify-content: center;">
                    Omar Alaa
                  </div>
                  <div style="width: 135px; height: 1.5px; background: #cbd5e1; margin: 3px auto 5px;"></div>
                  <div style="font-size: 13.5px; font-weight: 900; color: #0d1b2a;">عمر علاء</div>
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; line-height: 1.2;">مؤسس منصة StudyMart<br>الرئيس التنفيذي</div>
                </div>

              </div>

              <!-- LOWER BAR: CERTIFICATE NO. (13) & QR CODE (12) -->
              <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 4px 10px 8px; border-top: 1px dashed #cbd5e1; margin-top: 2px;">
                
                <!-- 13. CERTIFICATE NO. -->
                <div style="text-align: right;">
                  <div style="font-size: 10.5px; color: #64748b; font-weight: 700; font-family: Arial, sans-serif;">Certificate No.</div>
                  <div style="font-size: 13.5px; font-weight: 900; color: #0d1b2a; font-family: monospace; letter-spacing: 0.5px;">${certData.certificateId}</div>
                </div>

                <!-- 12. QR VERIFICATION CODE -->
                <div style="display: flex; align-items: center; gap: 8px; text-align: left;">
                  <div style="text-align: left;">
                    <div style="font-size: 11.5px; font-weight: 900; color: #0d1b2a;">تحقق من صحة الشهادة</div>
                    <div style="font-size: 10px; font-weight: 700; color: #64748b;">امسح رمز QR للتحقق</div>
                  </div>
                  <div style="width: 48px; height: 48px; background: #ffffff; border: 1.5px solid #c59b27; border-radius: 6px; padding: 3px; box-sizing: border-box; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                    <svg width="100%" height="100%" viewBox="0 0 33 33" fill="#0d1b2a">
                      <rect x="0" y="0" width="9" height="9" fill="none" stroke="#0d1b2a" stroke-width="2"/>
                      <rect x="2" y="2" width="5" height="5" fill="#0d1b2a"/>
                      <rect x="24" y="0" width="9" height="9" fill="none" stroke="#0d1b2a" stroke-width="2"/>
                      <rect x="26" y="2" width="5" height="5" fill="#0d1b2a"/>
                      <rect x="0" y="24" width="9" height="9" fill="none" stroke="#0d1b2a" stroke-width="2"/>
                      <rect x="2" y="26" width="5" height="5" fill="#0d1b2a"/>
                      <rect x="12" y="2" width="3" height="3"/>
                      <rect x="18" y="2" width="3" height="3"/>
                      <rect x="12" y="12" width="9" height="9"/>
                      <rect x="2" y="12" width="3" height="3"/>
                      <rect x="6" y="15" width="3" height="3"/>
                      <rect x="15" y="24" width="3" height="6"/>
                      <rect x="24" y="12" width="6" height="3"/>
                      <rect x="27" y="18" width="3" height="6"/>
                      <rect x="21" y="27" width="6" height="3"/>
                    </svg>
                  </div>
                </div>

              </div>

            </div>

          </div>

          <!-- 14. BOTTOM NAVY FOOTER BAR -->
          <div style="margin: 0 -36px; background: #0d1b2a; padding: 8px 24px; display: flex; justify-content: center; align-items: center; gap: 24px; border-top: 2px solid #b38728;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #fef08a; font-family: sans-serif;">
              <span>🔒</span> <span>Digitally Signed</span>
            </div>
            <div style="width: 1px; height: 12px; background: #334155;"></div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #fef08a; font-family: sans-serif;">
              <span>✔</span> <span>Verified Certificate</span>
            </div>
            <div style="width: 1px; height: 12px; background: #334155;"></div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: #fef08a; font-family: sans-serif;">
              <span>🛡</span> <span>Encrypted</span>
            </div>
          </div>

        </div>
      </div>
    </div>
            <div style="width: 1px; height: 14px; background: #334155;"></div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #fef08a; font-family: sans-serif;">
              <span>✔</span> <span>Verified Certificate</span>
            </div>
            <div style="width: 1px; height: 14px; background: #334155;"></div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 800; color: #fef08a; font-family: sans-serif;">
              <span>🛡</span> <span>Encrypted</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);
}

function renderQASectionHTML(courseId) {
  const questions = getCourseQuestions(courseId);
  return `
    <div class="ask-question-card" style="background: #f8fafc; padding: 18px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #f1f5f9;">
      <label for="courseQuestionInput" style="display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">اطرح سؤالك أو استفسارك هنا مباشرة:</label>
      <textarea id="courseQuestionInput" rows="3" placeholder="اكتب سؤالك وسوف يصل إشعار للمعلم للإجابة عليه..." style="width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-family: inherit; font-size: 13px; resize: vertical; box-sizing: border-box;"></textarea>
      <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
        <button type="button" class="btn btn-primary" onclick="submitCourseQuestion('${courseId}')" style="padding: 8px 20px; border-radius: 10px; font-weight: 700;">إرسال السؤال 🚀</button>
      </div>
    </div>

    <div class="questions-list" style="display: flex; flex-direction: column; gap: 14px;">
      ${
        questions.length === 0
          ? `
        <div style="text-align: center; color: #64748b; padding: 16px;">لا توجد أسئلة سابقة. كن أول من يطرح سؤالاً!</div>
      `
          : questions
              .map(
                (q) => `
        <div class="question-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${q.studentAvatar}" alt="${q.studentName}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
              <div>
                <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${q.studentName}</div>
                <div style="font-size: 11px; color: #64748b;">${q.lessonTitle} • ${q.date}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button type="button" onclick="editQuestionItem('${q.id}', '${courseId}')" style="background: none; border: none; font-size: 12px; color: #6366f1; cursor: pointer;" title="تعديل السؤال">✏️</button>
              <button type="button" onclick="deleteQuestionItem('${q.id}', '${courseId}')" style="background: none; border: none; font-size: 12px; color: #ef4444; cursor: pointer;" title="حذف السؤال">🗑️</button>
            </div>
          </div>
          <div style="font-size: 13px; color: #1e293b; line-height: 1.5; margin-bottom: 8px;">${q.question}</div>
          ${
            q.answer
              ? `
            <div style="background: #f0f9ff; padding: 10px 12px; border-radius: 8px; margin-top: 8px;">
              <div style="font-weight: 700; font-size: 12px; color: #0369a1; margin-bottom: 4px;">✍️ رد المعلم (${q.answeredBy || "المعلم"}):</div>
              <div style="font-size: 12px; color: #0f172a;">${q.answer}</div>
            </div>
          `
              : `
            <button type="button" onclick="submitQuestionReply('${q.id}', '${courseId}')" style="font-size: 12px; color: #6366f1; background: none; border: none; cursor: pointer; padding: 0; font-weight: 700;">+ رد كمعلم</button>
          `
          }
        </div>
      `,
              )
              .join("")
      }
    </div>
  `;
}

export function submitCourseQuestion(courseId) {
  const input = document.getElementById("courseQuestionInput");
  if (!input || !input.value.trim()) {
    showCustomAlert("يرجى كتابة نص السؤال أولاً");
    return;
  }
  addCourseQuestion(courseId, "استفسار درس الكورس", input.value.trim());
  input.value = "";
  showCustomAlert("تم إرسال سؤالك بنجاح!");
  notifyCourseSystemUpdated();
}

export function submitQuestionReply(questionId, courseId) {
  const reply = prompt("اكتب رد المعلم على السؤال:");
  if (reply && reply.trim()) {
    answerCourseQuestion(questionId, reply.trim());
    showCustomAlert("تم إضافة الرد بنجاح!");
    notifyCourseSystemUpdated();
  }
}

export function deleteQuestionItem(questionId, courseId) {
  if (confirm("هل أنت تأكد من رغبتك في حذف هذا السؤال؟")) {
    deleteCourseQuestion(questionId);
    showCustomAlert("تم حذف السؤال.");
    notifyCourseSystemUpdated();
  }
}

export function editQuestionItem(questionId, courseId) {
  const qList = getCourseQuestions(courseId);
  const existing = qList.find((q) => String(q.id) === String(questionId));
  const newText = prompt("تعديل السؤال:", existing ? existing.question : "");
  if (newText && newText.trim()) {
    editCourseQuestion(questionId, newText.trim());
    showCustomAlert("تم تعديل السؤال بنجاح.");
    notifyCourseSystemUpdated();
  }
}

export function filterCourseLessons(query, courseId) {
  if (!window.activePlayerState) window.activePlayerState = {};
  window.activePlayerState.lessonSearchQuery = query;
  const course = coursesData.find((c) => String(c.id) === String(courseId));
  if (course) {
    const accordion = document.getElementById(
      `playerLessonsAccordion_${course.id}`,
    );
    if (accordion) {
      const curriculum = getCourseCurriculum(course);
      const progress = getCourseProgress(course.id);
      accordion.innerHTML = renderAccordionContentHTML(
        course,
        curriculum,
        progress,
        progress.lastActiveLessonId,
      );
    }
  }
}

export function quickEnrollCourse(courseId) {
  const appState = window.appState || {};
  if (!appState.userCourses) appState.userCourses = [];
  const target = Number(courseId) || courseId;
  if (!appState.userCourses.includes(target)) {
    appState.userCourses.push(target);
    saveLocalStorage("userCourses", appState.userCourses);
  }
  showCustomAlert(
    "🎉 تم الاشتراك بالدورة بنجاح! تم فتح جميع الدروس والمحتوى لك.",
  );
  notifyCourseSystemUpdated();
}

export function continueCourse(courseTitleOrId) {
  let course = coursesData.find(
    (c) =>
      String(c.id) === String(courseTitleOrId) || c.title === courseTitleOrId,
  );
  if (!course) {
    const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
    course = teacherCourses.find(
      (c) =>
        String(c.id) === String(courseTitleOrId) || c.title === courseTitleOrId,
    );
  }
  if (!course) {
    course = coursesData[0];
  }

  window.activePlayerState = window.activePlayerState || {};
  window.activePlayerState.courseId = course.id;

  renderMyCoursesPage();
  const anchor = document.getElementById("courseDetailsAnchor");
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth" });
  }
}

export function openCoursePreviewVideoModal(courseId) {
  const targetId = Number(courseId) || courseId;
  const course = coursesData.find((c) => String(c.id) === String(targetId));
  const videoUrl = SAMPLE_VIDEOS[0];
  const modal = document.createElement("div");
  modal.style.cssText =
    "position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;";
  modal.innerHTML = `
    <div style="position: relative; width: 100%; max-width: 820px; background: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #334155;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #1e293b; color: #fff;">
        <span style="font-weight: 700; font-size: 15px;">معاينة الدورة: ${course ? course.title : "معاينة"}</span>
        <button type="button" onclick="this.closest('div').parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">✕</button>
      </div>
      <video src="${videoUrl}" controls autoplay style="width: 100%; height: auto; max-height: 75vh; display: block;"></video>
    </div>
  `;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
}

export function toggleCourseWishlistBtn(courseId, btn) {
  const targetId = Number(courseId) || courseId;
  const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
  const course =
    coursesData.find((c) => String(c.id) === String(targetId)) ||
    teacherCourses.find((c) => String(c.id) === String(targetId));
  if (!course) return;
  const added = toggleFavorite("course", course);
  if (btn) {
    const span = btn.querySelector("span");
    const svg = btn.querySelector("svg");
    if (added) {
      if (span) span.textContent = "إزالة من المفضلة";
      if (svg) {
        svg.setAttribute("fill", "#ef4444");
        svg.setAttribute("stroke", "#ef4444");
      }
      showCustomAlert("تمت إضافة الدورة إلى المفضلة");
    } else {
      if (span) span.textContent = "إضافة إلى المفضلة";
      if (svg) {
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
      }
      showCustomAlert("تمت إزالة الدورة من المفضلة");
    }
  }
}

export function openLessonPreviewOrPlay(
  courseId,
  lessonTitle,
  isFreePreview,
  isPurchased,
) {
  if (isFreePreview || isPurchased) {
    openCoursePreviewVideoModal(courseId);
  } else {
    showCustomAlert(
      `🔒 درس "${lessonTitle}" مقفل. اشترك بالدورة لمشاهدة جميع الدروس بالكامل.`,
    );
  }
}

export function navigateToTeacherProfile(teacherKey) {
  if (!teacherKey) return;
  const targetHash = `#teacher/${encodeURIComponent(teacherKey)}`;
  window.location.hash = targetHash;
}

export function openInstructorProfileModal(instructorKey, avatarParam) {
  // Completely redirect popup/modal call to dedicated full page route (no popup window)
  navigateToTeacherProfile(instructorKey);
}

export function showTeacherProfilePage(teacherKey) {
  const containerElement = document.getElementById("teacherProfileContent");
  const pageSection = document.getElementById("teacherProfilePage");

  if (!containerElement || !pageSection) {
    return;
  }

  if (typeof window.hideAllMainSections === "function") {
    window.hideAllMainSections();
  }

  pageSection.classList.remove("hidden");
  pageSection.classList.remove("section-hidden");

  let teacher = getTeacherById(teacherKey);
  if (!teacher && teacherKey) {
    const keyLower = String(teacherKey).toLowerCase();
    teacher = teachersData.find(
      (t) =>
        String(t.id).toLowerCase() === keyLower ||
        t.name.toLowerCase().includes(keyLower) ||
        (t.nameEn && t.nameEn.toLowerCase().includes(keyLower)),
    );
  }

  if (!teacher) {
    const isFemale =
      String(teacherKey || "").includes("سارة") ||
      String(teacherKey || "").includes("فاطمة") ||
      String(teacherKey || "").includes("أميرة") ||
      String(teacherKey || "").includes("أسماء") ||
      String(teacherKey || "").includes("ليلى");
    teacher = {
      id: "teacher-custom",
      name: teacherKey || "محاضر متميز",
      nameEn: teacherKey || "Instructor",
      gender: isFemale ? "female" : "male",
      avatar: isFemale
        ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"
        : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      role: "محاضر وخبير في المنصة",
      bio: "مدرب معتمد بخبرة عريقة في مجاله، قدم العديد من الدورات التدريبية المتميزة وشغوف بنقل الخبرة والمهارات الحقيقية للطلاب.",
      experience: "+5 سنوات خبرة",
      company: "مؤسسات تعليمية وتقنية متقدمة",
      specialization: "التدريب الأكاديمي والتقني",
      rating: "4.9",
      studentsCount: "5.4K",
      coursesCount: 0,
    };
  }

  // Filter ONLY courses published by this teacher
  const teacherCourses = coursesData.filter((c) => {
    if (
      teacher.id &&
      c.instructorId &&
      String(c.instructorId) === String(teacher.id)
    ) {
      return true;
    }
    if (c.instructor) {
      const cName = c.instructor.trim().toLowerCase();
      const tName = teacher.name.trim().toLowerCase();
      const tNameEn = (teacher.nameEn || "").trim().toLowerCase();
      if (
        cName === tName ||
        cName === tNameEn ||
        cName.includes(tName) ||
        tName.includes(cName)
      ) {
        return true;
      }
    }
    return false;
  });

  const activeCoursesCount = teacherCourses.length;

  containerElement.innerHTML = `
    <div class="teacher-profile-page-wrapper" dir="rtl" style="max-width: 1200px; margin: 0 auto; padding: 32px 20px;">
      
      <!-- 1. Breadcrumb Navigation -->
      <div class="teacher-breadcrumb-bar" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary, #64748b); margin-bottom: 24px; flex-wrap: wrap;">
        <a href="#home" onclick="event.preventDefault(); window.location.hash='#home';" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 600;">الرئيسية</a>
        <span>&gt;</span>
        <a href="#home" onclick="event.preventDefault(); window.location.hash='#home'; if (typeof window.scrollToSection === 'function') window.scrollToSection('teachers');" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 600;">المعلمون</a>
        <span>&gt;</span>
        <span style="color: var(--text-primary, #0f172a); font-weight: 700;">${teacher.name}</span>
      </div>

      <!-- 2. Page Back Button -->
      <div style="margin-bottom: 24px;">
        <button type="button" class="btn btn-secondary" onclick="if (window.handleGlobalBack) window.handleGlobalBack(event); else if (window.history.length > 1) { window.history.back(); } else { window.location.hash = '#home'; }" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 10px 20px; border-radius: 12px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
          ← العودة إلى قائمة المعلمين
        </button>
      </div>

      <!-- 3. Teacher Hero Header Card -->
      <div class="teacher-profile-hero-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 24px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 32px;">
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; border-bottom: 1px solid var(--border-color, #e2e8f0); padding-bottom: 28px; margin-bottom: 28px;">
          <img src="${teacher.avatar}" alt="${teacher.name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 4px solid #7c3aed; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.25);" />
          <h1 style="font-size: 28px; font-weight: 900; color: var(--text-primary, #0f172a); margin: 0 0 8px 0;">${teacher.name}</h1>
          <span style="font-size: 15px; color: #7c3aed; font-weight: 700; background: rgba(124, 58, 237, 0.08); padding: 6px 18px; border-radius: 24px; margin-bottom: 16px; display: inline-block;">
            🎓 ${teacher.role}
          </span>
          <p style="font-size: 15px; color: var(--text-secondary, #475569); line-height: 1.8; max-width: 720px; margin: 0 0 20px 0;">
            ${teacher.bio}
          </p>

          <!-- Highlights Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; width: 100%; max-width: 860px; margin-top: 12px;">
            <div style="background: var(--bg-secondary, #f8fafc); padding: 16px; border-radius: 16px; border: 1px solid var(--border-color, #f1f5f9); text-align: center;">
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600; margin-bottom: 4px;">⏳ الخبرة</div>
              <div style="font-size: 15px; font-weight: 800; color: var(--text-primary, #0f172a);">${teacher.experience}</div>
            </div>
            <div style="background: var(--bg-secondary, #f8fafc); padding: 16px; border-radius: 16px; border: 1px solid var(--border-color, #f1f5f9); text-align: center;">
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600; margin-bottom: 4px;">🏢 جهات عمل تابعة/سابقة</div>
              <div style="font-size: 15px; font-weight: 800; color: var(--text-primary, #0f172a);">${teacher.company}</div>
            </div>
            <div style="background: var(--bg-secondary, #f8fafc); padding: 16px; border-radius: 16px; border: 1px solid var(--border-color, #f1f5f9); text-align: center;">
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600; margin-bottom: 4px;">🎯 التخصص الرئيسي</div>
              <div style="font-size: 15px; font-weight: 800; color: var(--text-primary, #0f172a);">${teacher.specialization}</div>
            </div>
            <div style="background: var(--bg-secondary, #f8fafc); padding: 16px; border-radius: 16px; border: 1px solid var(--border-color, #f1f5f9); text-align: center;">
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600; margin-bottom: 4px;">⭐ التقييم / الطلاب</div>
              <div style="font-size: 15px; font-weight: 800; color: var(--text-primary, #0f172a);">⭐ ${teacher.rating} (${teacher.studentsCount})</div>
            </div>
          </div>
        </div>

        <!-- 4. Published Courses Section -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0; display: flex; align-items: center; gap: 10px;">
              <span>📚</span> دورات المعلم المنشورة (${activeCoursesCount})
            </h2>
          </div>

          ${
            activeCoursesCount > 0
              ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
              ${teacherCourses
                .map(
                  (c) => `
                <div style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
                  <img src="${c.image}" alt="${c.title}" style="width: 100%; height: 150px; object-fit: cover;" />
                  <div style="padding: 18px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between;">
                    <div>
                      <span style="font-size: 12px; font-weight: 700; color: #7c3aed; background: rgba(124, 58, 237, 0.08); padding: 3px 10px; border-radius: 12px; display: inline-block; margin-bottom: 8px;">
                        ${formatCourseCategory(c.category)}
                      </span>
                      <h3 style="font-size: 16px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 10px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${c.title}
                      </h3>
                      <p style="font-size: 13px; color: var(--text-secondary, #64748b); line-height: 1.6; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${c.description}
                      </p>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; border-top: 1px solid var(--border-color, #f1f5f9); padding-top: 12px;">
                      <span style="font-size: 18px; font-weight: 900; color: #7c3aed;">$${c.price}</span>
                      <button type="button" class="btn btn-primary" onclick="if(typeof window.showCourseDetails==='function'){ window.showCourseDetails('${c.id}'); }" style="padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 10px; cursor: pointer;">
                        عرض الدورة ➔
                      </button>
                    </div>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          `
              : `
            <div style="text-align: center; padding: 48px 20px; background: var(--bg-secondary, #f8fafc); border-radius: 20px; border: 1px dashed var(--border-color, #cbd5e1);">
              <div style="font-size: 48px; margin-bottom: 12px;">📂</div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 6px 0;">لا توجد دورات منشورة لهذا المعلم حالياً.</h3>
              <p style="font-size: 14px; color: var(--text-secondary, #64748b); margin: 0;">سيتم إضافة دورات جديدة قريباً لهذا المعلم.</p>
            </div>
          `
          }
        </div>

      </div>
    </div>
  `;

  const footer = document.getElementById("contactFooter");
  if (footer) footer.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function renderCourseDetailsUI(course, containerElement) {
  if (!course || !containerElement) return;

  const curriculum = getCourseCurriculum(course);
  const purchased = isCoursePurchased(course.id);
  const favState = isFavorite("course", course.id);
  const formattedLevel = formatCourseLevel(course.level);
  const instructorAvatar =
    course.instructorImage ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";

  const courseReviews = reviewsData.filter(
    (r) =>
      String(r.purchasedItemId) === String(course.id) ||
      (r.courseOrBookName && r.courseOrBookName.includes(course.title)),
  );
  const displayReviews =
    courseReviews.length > 0
      ? courseReviews
      : [
          {
            studentName: "أحمد محمود علي",
            avatar:
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop",
            stars: 5,
            reviewTitle: "دورة شمولية وممتازة جداً!",
            reviewText:
              "الشرح وافي والمشاريع التطبيقية أضافت لي الكثير من الخبرة العميقة.",
            createdDate: "2026-07-28",
          },
          {
            studentName: "سارة خالد العتيبي",
            avatar:
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop",
            stars: 5,
            reviewTitle: "أسلوب رائع وسلس",
            reviewText:
              "استفدت جداً من التمارين وحل الواجبات والتفاعل المستمر مع الأستاذ.",
            createdDate: "2026-07-30",
          },
        ];

  const relatedCourses = coursesData
    .filter(
      (c) =>
        String(c.id) !== String(course.id) &&
        (c.category === course.category || !course.category),
    )
    .slice(0, 3);
  if (relatedCourses.length === 0) {
    relatedCourses.push(
      ...coursesData
        .filter((c) => String(c.id) !== String(course.id))
        .slice(0, 3),
    );
  }

  const oldPrice = Math.round((course.price || 99) * 1.35);

  containerElement.innerHTML = `
    <div class="official-course-details-wrapper" dir="rtl" style="max-width: 1200px; margin: 0 auto; padding: 24px 20px;">
      
      <!-- 1. Breadcrumb Navigation -->
      <div class="course-details-breadcrumb-bar" style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-secondary, #64748b); margin-bottom: 20px;">
        <a href="#home" onclick="event.preventDefault(); window.location.hash='#home'; if(window.showHomePage) window.showHomePage();" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 600;">الرئيسية</a>
        <span>&gt;</span>
        <a href="#courses" onclick="event.preventDefault(); window.location.hash='#courses'; if(window.showCoursesPage) window.showCoursesPage();" style="color: var(--primary-color, #7c3aed); text-decoration: none; font-weight: 600;">الدورات</a>
        <span>&gt;</span>
        <span style="color: var(--text-primary, #0f172a); font-weight: 700;">${course.title}</span>
      </div>

      <!-- 2. Back Button -->
      <div style="margin-bottom: 24px;">
        <button type="button" class="btn btn-secondary" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else if(window.showCoursesPage) window.showCoursesPage(); else window.history.back();" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; padding: 10px 18px; border-radius: 10px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          ← العودة إلى قائمة الدورات
        </button>
      </div>

      <!-- Main Layout Grid -->
      <div class="course-details-main-grid" style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;">
        
        <!-- RIGHT COLUMN: Course Hero & Details -->
        <div class="course-details-primary-col" style="display: flex; flex-direction: column; gap: 32px;">
          
          <!-- 3. Course Hero Banner -->
          <div class="course-hero-banner-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div class="course-preview-media" style="position: relative; width: 100%; height: 320px; background-image: url('${course.image}'); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.7) 100%);"></div>
              <button type="button" class="play-preview-btn" onclick="openCoursePreviewVideoModal('${course.id}')" style="position: relative; z-index: 5; display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); border: none; padding: 12px 24px; border-radius: 50px; font-weight: 800; font-size: 15px; color: #0f172a; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,0.2); transition: transform 0.2s ease;">
                <span style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #7c3aed; color: #fff; border-radius: 50%; font-size: 14px;">▶</span>
                معاينة الدورة
              </button>
            </div>
            
            <div class="course-hero-banner-body" style="padding: 28px;">
              <div class="course-badges-row" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; align-items: center;">
                <span style="background: #f3e8ff; color: #7c3aed; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">🎓 ${formatCourseCategory(course.category)}</span>
                <span style="background: #e0f2fe; color: #0284c7; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">📊 ${formattedLevel}</span>
                <span style="background: #fef3c7; color: #b45309; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">🎓 ${course.badge || "دورة تدريبية"}</span>
              </div>

              <h1 class="course-details-title" style="font-size: 26px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 16px 0; line-height: 1.4;">${course.title}</h1>

              <div class="course-hero-meta-row" style="display: flex; flex-wrap: wrap; align-items: center; gap: 20px; font-size: 14px; color: var(--text-secondary, #64748b); border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 16px;">
                <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="navigateToTeacherProfile('${(course.instructorId || course.instructor || "أحمد محمد").replace(/'/g, "\\'")}')" title="عرض الملف الشخصي للمدرس">
                  <img src="${instructorAvatar}" alt="${course.instructor || "المدرس"}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #7c3aed;" />
                  <div>
                    <div style="font-size: 11px; color: var(--text-secondary, #64748b);">المُدرّس:</div>
                    <div style="font-weight: 700; color: var(--text-primary, #0f172a);">${course.instructor || "أحمد محمد"}</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #f59e0b; font-weight: 800; font-size: 16px;">⭐ ${course.rating || "4.9"}</span>
                  <span style="font-size: 12px; color: var(--text-secondary, #64748b);">(${course.reviewsCount || (course.reviews ? course.reviews.length : displayReviews.length)} تقييم)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
                  <span>👥</span>
                  <span>${(course.students || course.studentsCount || 1250).toLocaleString("ar-EG")} طالب مشترك</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Statistics Cards -->
          <div class="course-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px;">
            <div class="course-stat-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">📚</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">${course.lessons || 25}</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">درس تعليمي</div>
            </div>
            <div class="course-stat-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">⏱️</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">${course.duration || 10} ساعات</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">المحتوى الإجمالي</div>
            </div>
            <div class="course-stat-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">📊</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">${formattedLevel}</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">مستوى الدورة</div>
            </div>
            <div class="course-stat-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 14px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; margin-bottom: 6px;">📜</div>
              <div style="font-size: 18px; font-weight: 800; color: var(--text-primary, #0f172a);">معتمدة</div>
              <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">شهادة إتمام</div>
            </div>
          </div>

          <!-- 5. Course Description -->
          <div class="course-description-box" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 16px 0; display: flex; align-items: center; gap: 10px;">
              <span>📖</span> عن الدورة التدريبية
            </h2>
            <p style="font-size: 15px; color: var(--text-secondary, #475569); line-height: 1.8; margin: 0 0 16px 0;">
              ${course.longDescription || course.description || "هذه الدورة توفر تجربة تعليمية شاملة ومصممة بعناية لبناء مهارات عملية حقيقية. ستتعلم الأساسيات بالإضافة إلى المفاهيم المتقدمة من خلال مشاريع وتطبيقات واقعية خطوة بخطوة."}
            </p>
            <div class="course-features-checklist" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; background: var(--bg-secondary, #f8fafc); padding: 18px; border-radius: 12px; border: 1px solid var(--border-color, #f1f5f9);">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a);">
                <span style="color: #10b981;">✓</span> تطبيقات عملية حقيقية
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a);">
                <span style="color: #10b981;">✓</span> متابعة ومجتمع تفاعلي
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a);">
                <span style="color: #10b981;">✓</span> تحديثات مستمرة للمحتوى
              </div>
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--text-primary, #0f172a);">
                <span style="color: #10b981;">✓</span> اختبارات وتقييم مهارات
              </div>
            </div>
          </div>

          <!-- 6. Curriculum -->
          <div class="course-curriculum-box" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0; display: flex; align-items: center; gap: 10px;">
                <span>📚</span> محتوى الدورة والدروس
              </h2>
              <span style="font-size: 13px; color: var(--text-secondary, #64748b); font-weight: 600;">${curriculum.length} وحدات • ${course.lessons || 25} درس</span>
            </div>

            <div class="lessons-accordion" style="display: flex; flex-direction: column; gap: 12px;">
              ${curriculum
                .map(
                  (sec, sIdx) => `
                <div style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; overflow: hidden;">
                  <div onclick="toggleAccordion(this)" style="background: var(--bg-secondary, #f8fafc); padding: 14px 18px; font-weight: 700; font-size: 14px; color: var(--text-primary, #0f172a); cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                    <span>${sec.title}</span>
                    <span style="font-size: 12px; color: var(--text-secondary, #64748b); background: var(--card-bg, #ffffff); padding: 2px 10px; border-radius: 20px; border: 1px solid var(--border-color, #cbd5e1);">${(sec.lessons || []).length} دروس</span>
                  </div>
                  <div style="padding: 10px 18px; display: flex; flex-direction: column; gap: 8px;">
                    ${(sec.lessons || [])
                      .map(
                        (les, lIdx) => `
                      <div onclick="openLessonPreviewOrPlay('${course.id}', '${(les.title || "").replace(/'/g, "\\'")}', ${!!les.isFreePreview}, ${!!purchased})" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #f1f5f9); font-size: 13px; cursor: pointer; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='var(--card-bg, #ffffff)'" title="اضغط لمشاهدة أو معاينة الدرس">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <span>${les.isFreePreview ? "▶️" : purchased ? "▶️" : "🔒"}</span>
                          <span style="font-weight: 600; color: var(--text-primary, #0f172a);">${les.title}</span>
                          ${les.isFreePreview ? `<span style="font-size: 10px; background: #dcfce7; color: #15803d; font-weight: 800; padding: 2px 8px; border-radius: 10px;">معاينة مجانية</span>` : ""}
                        </div>
                        <span style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">⏱️ ${les.duration || "10:00"}</span>
                      </div>
                    `,
                      )
                      .join("")}
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <!-- 7. Q&A Section -->
          <div class="course-qa-box" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
            <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
              <span>💬</span> أسئلة واستفسارات الطلاب (Q&amp;A)
            </h2>
            ${renderQASectionHTML(course.id)}
          </div>

          <!-- 8. Reviews Section -->
          <div class="course-reviews-box" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
              <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0; display: flex; align-items: center; gap: 10px;">
                <span>⭐</span> تقييمات الطلاب وآراؤهم
              </h2>
              <button type="button" class="btn btn-secondary sm" onclick="rateCourse('${course.id}')" style="font-weight: 700; border-radius: 8px;">
                + أضف تقييمك
              </button>
            </div>

            <div class="course-rating-summary-box" style="display: grid; grid-template-columns: 180px 1fr; gap: 24px; background: var(--bg-secondary, #f8fafc); padding: 20px; border-radius: 14px; margin-bottom: 24px; border: 1px solid var(--border-color, #f1f5f9); align-items: center;">
              <div style="text-align: center;">
                <div style="font-size: 42px; font-weight: 900; color: var(--text-primary, #0f172a); line-height: 1;">${course.rating || "4.9"}</div>
                <div style="color: #f59e0b; font-size: 18px; margin: 6px 0;">⭐⭐⭐⭐⭐</div>
                <div style="font-size: 12px; color: var(--text-secondary, #64748b); font-weight: 600;">تقييم العام</div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary, #64748b);">
                  <span>5 نجوم</span>
                  <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="width: 88%; height: 100%; background: #f59e0b;"></div>
                  </div>
                  <span>88%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary, #64748b);">
                  <span>4 نجوم</span>
                  <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="width: 9%; height: 100%; background: #f59e0b;"></div>
                  </div>
                  <span>9%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary, #64748b);">
                  <span>3 نجوم</span>
                  <div style="flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="width: 3%; height: 100%; background: #f59e0b;"></div>
                  </div>
                  <span>3%</span>
                </div>
              </div>
            </div>

            <div class="course-reviews-list" style="display: flex; flex-direction: column; gap: 16px;">
              ${displayReviews
                .map(
                  (r) => `
                <div style="border: 1px solid var(--border-color, #e2e8f0); border-radius: 12px; padding: 18px; background: var(--card-bg, #ffffff);">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <img src="${r.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop"}" alt="${r.studentName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
                      <div>
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-primary, #0f172a);">${r.studentName}</div>
                        <div style="font-size: 12px; color: var(--text-secondary, #64748b);">${r.createdDate || "قبل أسبوع"}</div>
                      </div>
                    </div>
                    <div style="color: #f59e0b; font-size: 14px; font-weight: 700;">${"⭐".repeat(r.stars || 5)}</div>
                  </div>
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary, #0f172a); margin: 0 0 6px 0;">${r.reviewTitle || "دورة ممتازة وشرح احترافي"}</h4>
                  <p style="font-size: 13px; color: var(--text-secondary, #475569); margin: 0; line-height: 1.6;">${r.reviewText || r.comment || ""}</p>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>

          <!-- 9. Related Courses Section -->
          ${
            relatedCourses.length > 0
              ? `
            <div class="course-related-box" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 18px; padding: 28px;">
              <h2 style="font-size: 20px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px;">
                <span>✨</span> دورات أخرى قد تهمك
              </h2>
              <div id="relatedCoursesContainer_${course.id}" class="courses-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;"></div>
            </div>
          `
              : ""
          }

        </div>

        <!-- LEFT COLUMN: Sticky Purchase Card (Sidebar) -->
        <div class="course-details-sidebar-col" style="position: sticky; top: 90px;">
          <div class="course-purchase-card" style="background: var(--card-bg, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 20px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
            
            <div class="course-price-box" style="margin-bottom: 20px; text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color, #e2e8f0);">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 6px;">
                <span style="font-size: 32px; font-weight: 900; color: var(--primary-color, #7c3aed);">$${course.price || 99}</span>
                <span style="font-size: 18px; text-decoration: line-through; color: var(--text-secondary, #94a3b8); font-weight: 600;">$${oldPrice}</span>
                <span style="background: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 12px;">خصم 35%</span>
              </div>
              <div style="font-size: 12px; color: #059669; font-weight: 700;">⚡ عرض لفترة محدودة شامل كافة التحديثات</div>
            </div>

            <div class="course-purchase-actions" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
              ${
                purchased
                  ? `
                <button type="button" class="btn btn-primary" onclick="continueCourse('${course.id}')" style="width: 100%; padding: 14px; font-weight: 800; font-size: 16px; border-radius: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; cursor: pointer;">
                  ▶ متابعة التعلم والدروس
                </button>
              `
                  : `
                <button type="button" class="btn btn-primary" onclick="quickEnrollCourse('${course.id}')" style="width: 100%; padding: 14px; font-weight: 800; font-size: 16px; border-radius: 12px; background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none; color: #fff; cursor: pointer; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
                  ⚡ اشترك الآن ($${course.price || 99})
                </button>
                <button type="button" class="btn btn-secondary" onclick="addToCart('${course.id}')" style="width: 100%; padding: 12px; font-weight: 700; font-size: 14px; border-radius: 12px; background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #cbd5e1); color: var(--text-primary, #0f172a); cursor: pointer;">
                  🛒 إضافة إلى السلة
                </button>
              `
              }

              <div style="display: flex; gap: 8px;">
                <button type="button" class="wishlist-action-btn" onclick="toggleCourseWishlistBtn('${course.id}', this)" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; font-weight: 700; font-size: 13px; border-radius: 10px; background: transparent; border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="${favState ? "#ef4444" : "none"}" stroke="${favState ? "#ef4444" : "currentColor"}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  <span>${favState ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}</span>
                </button>
                <button type="button" onclick="shareCourse('${(course.title || "").replace(/'/g, "\\'")}')" style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; font-weight: 700; font-size: 13px; border-radius: 10px; background: transparent; border: 1px solid var(--border-color, #e2e8f0); color: var(--text-primary, #0f172a); cursor: pointer;" title="مشاركة رابط الدورة">
                  <span>🔗</span> مشاركة
                </button>
              </div>
            </div>

            <div>
              <h4 style="font-size: 14px; font-weight: 800; color: var(--text-primary, #0f172a); margin: 0 0 12px 0;">تتضمن هذه الدورة:</h4>
              <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary, #475569);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>⏱️</span> <span>${course.duration || 10} ساعات فيديو حسب الطلب</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>📚</span> <span>${course.lessons || 25} درس تعليمي تفاعلي</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>📱</span> <span>دخول من الجوال والحاسوب</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>♾️</span> <span>وصول كامل مدى الحياة</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>📜</span> <span>شهادة إتمام معتمدة</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span>💬</span> <span>دعم واستفسارات متواصل</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;

  const relatedGrid = containerElement.querySelector(
    `#relatedCoursesContainer_${course.id}`,
  );
  if (relatedGrid) {
    relatedCourses.forEach((relCourse) => {
      const card = createCourseCard(relCourse, showCourseDetails);
      relatedGrid.appendChild(card);
    });
  }
}

export function showCourseDetails(courseId) {
  const targetId = Number(courseId) || courseId;
  const teacherCourses = loadLocalStorage("lms_teacher_courses_v1", []);
  const course =
    coursesData.find((c) => String(c.id) === String(targetId)) ||
    teacherCourses.find((c) => String(c.id) === String(targetId));

  if (!course) {
    const booksList = window.booksData || booksData || [];
    const book = booksList.find((b) => String(b.id) === String(targetId));
    if (book && window.showBookDetails) {
      window.showBookDetails(book.id);
      return;
    }
    if (typeof showCustomAlert === "function") {
      showCustomAlert("لم يتم العثور على الدورة المطلوبة");
    }
    return;
  }

  saveCourseListState(courseId);

  if (!window.location.hash.includes(`course-details/${course.id}`)) {
    window.location.hash = `#course-details/${course.id}`;
  }

  hideAllMainSections();
  const page = document.getElementById("courseDetailsPage");
  const detailsContainer =
    document.getElementById("courseDetailsContent") ||
    document.getElementById("courseDetails");
  if (!page || !detailsContainer) return;

  page.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });

  window.activePlayerState = window.activePlayerState || {};
  window.activePlayerState.courseId = course.id;

  renderCourseDetailsUI(course, detailsContainer);
}

export function rateCourse(courseId) {
  const ratingStr = prompt("أدخل تقييمك للدورة من 1 إلى 5 نجوم:");
  if (!ratingStr) return;
  const rating = Number(ratingStr);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    showCustomAlert("يرجى إدخال رقم صحيح بين 1 و 5");
    return;
  }

  const reviewTitle =
    prompt("عنوان التقييم (اختياري):") || "تقييم ممتاز ومفيد جداً";
  const reviewText =
    prompt("اكتب تعليقك أو ملاحظاتك حول الدورة (اختياري):") ||
    "دورة رائعة وشرح ممتاز ومفصل.";

  const targetId = Number(courseId) || courseId;
  const newReview = {
    id: Date.now(),
    purchasedItemId: targetId,
    studentName: window.appState?.userData?.name || "طالب متميز",
    avatar:
      window.appState?.userData?.image ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop",
    stars: rating,
    reviewTitle: reviewTitle,
    reviewText: reviewText,
    createdDate: new Date().toISOString().split("T")[0],
  };

  reviewsData.unshift(newReview);
  showCustomAlert(`شكراً لتقييمك! تم إدخال تقييمك بـ ${rating} نجوم بنجاح ⭐`);
  notifyCourseSystemUpdated();
}

export function toggleWishlist(courseId, btn) {
  if (btn) {
    if (btn.classList.contains("active")) {
      btn.classList.remove("active");
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> <span>حفظ في المفضلة</span>`;
      showCustomAlert("تمت إزالة الدورة من المفضلة");
    } else {
      btn.classList.add("active");
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#0057e7" stroke="#0057e7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> <span>تم الحفظ في المفضلة</span>`;
      showCustomAlert("تمت إضافة الدورة إلى المفضلة");
    }
  }
}

export function shareCourse(courseTitle) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    showCustomAlert(`تم نسخ رابط دورة "${courseTitle}" بنجاح!`);
  } else {
    showCustomAlert(`مشاركة دورة "${courseTitle}"`);
  }
}

export function toggleAccordion(headerElem) {
  if (!headerElem) return;
  const item =
    headerElem.closest(".accordion-item") || headerElem.parentElement;
  const body = item
    ? item.querySelector(".accordion-body") || headerElem.nextElementSibling
    : headerElem.nextElementSibling;
  const arrow =
    headerElem.querySelector(".accordion-arrow") ||
    headerElem.querySelector("span:last-child");

  if (body) {
    const isHidden =
      window.getComputedStyle(body).display === "none" ||
      body.classList.contains("hidden");
    if (isHidden) {
      body.style.display = "flex";
      body.style.flexDirection = "column";
      body.classList.remove("hidden");
      body.classList.add("active");
      headerElem.classList.add("active");
      if (arrow && arrow.textContent.trim().length <= 2)
        arrow.textContent = "▲";
    } else {
      body.style.display = "none";
      body.classList.remove("active");
      headerElem.classList.remove("active");
      if (arrow && arrow.textContent.trim().length <= 2)
        arrow.textContent = "▼";
    }
  }
}

export function toggleLessonAccordion(headerElem) {
  if (!headerElem) return;
  const group = headerElem.closest(".accordion-group");
  if (!group) return;
  const body = group.querySelector(".accordion-group-body");
  if (body) {
    const isHidden =
      window.getComputedStyle(body).display === "none" ||
      body.classList.contains("hidden");
    if (isHidden) {
      body.style.display = "block";
      body.classList.remove("hidden");
      headerElem.classList.add("active");
    } else {
      body.style.display = "none";
      headerElem.classList.remove("active");
    }
  }
}

if (typeof window !== "undefined") {
  window.CourseService = window.CourseService || {};
  window.CourseService.showCourseDetails = showCourseDetails;
  window.CourseService.showTeacherProfilePage = showTeacherProfilePage;
  window.CourseService.navigateToTeacherProfile = navigateToTeacherProfile;
  window.CourseService.continueCourse = continueCourse;
  window.CourseService.playCurrentCourse = playCurrentCourse;
  window.CourseService.openMyCourses = openMyCourses;
  window.CourseService.renderMyCoursesPage = renderMyCoursesPage;

  window.showCourseDetails = showCourseDetails;
  window.showTeacherProfilePage = showTeacherProfilePage;
  window.navigateToTeacherProfile = navigateToTeacherProfile;
  window.renderCourseDetailsUI = renderCourseDetailsUI;
  window.openCoursePreviewVideoModal = openCoursePreviewVideoModal;
  window.toggleCourseWishlistBtn = toggleCourseWishlistBtn;
  window.openLessonPreviewOrPlay = openLessonPreviewOrPlay;
  window.openInstructorProfileModal = openInstructorProfileModal;
  window.rateCourse = rateCourse;
  window.shareCourse = shareCourse;
  window.toggleAccordion = toggleAccordion;
  window.addToCart = addToCart;
  window.continueCourse = continueCourse;
  window.playCurrentCourse = playCurrentCourse;
  window.toggleLessonAccordion = toggleLessonAccordion;
  window.toggleLessonAccordionGroup = toggleLessonAccordion;
  window.selectCourseLesson = selectCourseLesson;
  window.toggleCourseVideoPlay = toggleCourseVideoPlay;
  window.seekCourseVideo = seekCourseVideo;
  window.changeVideoSpeed = changeVideoSpeed;
  window.toggleCourseVideoMute = toggleCourseVideoMute;
  window.toggleCourseVideoFullscreen = toggleCourseVideoFullscreen;
  window.openCourseResourcesModal = openCourseResourcesModal;
  window.openStudentQuizModal = openStudentQuizModal;
  window.openStudentAssignmentModal = openStudentAssignmentModal;
  window.openCourseCertificateModal = openCourseCertificateModal;
  window.updateCertificateButtonsInCards = updateCertificateButtonsInCards;
  window.submitCourseQuestion = submitCourseQuestion;
  window.submitQuestionReply = submitQuestionReply;
  window.deleteQuestionItem = deleteQuestionItem;
  window.editQuestionItem = editQuestionItem;
  window.toggleMarkLessonCompleted = toggleMarkLessonCompleted;
  window.markLessonComplete = markLessonComplete;
  window.navigateToPrevLesson = navigateToPrevLesson;
  window.navigateToNextLesson = navigateToNextLesson;
  window.filterCourseLessons = filterCourseLessons;
  window.filterStandaloneCourses = filterStandaloneCourses;
  window.quickEnrollCourse = quickEnrollCourse;
  window.notifyCourseSystemUpdated = notifyCourseSystemUpdated;
}
