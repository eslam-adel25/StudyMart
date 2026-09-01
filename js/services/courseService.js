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

const STUDYMART_PLATFORM_OWNER = "Eslam Adel Jadalrab";

function getCertificateStorageKey(courseId) {
  return `lms_course_cert_data_${courseId}`;
}

function ensureCourseCertificate(
  course,
  studentName,
  studentIdentifier = "guest",
) {
  const storageKey = getCertificateStorageKey(course.id);
  let certData = loadLocalStorage(storageKey, null);

  if (!certData || !certData.certificateId) {
    const certificateId = `SM-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900000) + 100000,
    )}`;

    certData = {
      certificateId,
      verificationCode: `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      issuedDate: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }).format(new Date()),
      courseTitle: course.title,
      studentName,
      instructor: course.instructor || "Instructor",
      studentIdentifier,
    };
    saveLocalStorage(storageKey, certData);
  }

  return certData;
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
          : "Digital Marketing Fundamentals",
      instructor: "Ahmed Hassan",
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
    "Student";

  const studentIdentifier =
    appState.userData?.email ||
    currentUser?.email ||
    appState.userData?.name ||
    currentUser?.name ||
    "guest";

  const levelText =
    course.level === "beginner"
      ? "Beginner"
      : course.level === "advanced"
        ? "Advanced"
        : course.level || "Intermediate";

  const durationText = course.duration ? `${course.duration} hours` : "N/A";

  const certData = ensureCourseCertificate(
    course,
    studentName,
    studentIdentifier,
  );

  const existingModal = document.getElementById("certificateModalOverlay");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "certificateModalOverlay";
  modal.className = "floating-modal-overlay";
  modal.style.cssText =
    "position: fixed; inset: 0; background: rgba(15, 23, 42, 0.72); display: flex; align-items: flex-start; justify-content: center; padding: 18px 16px 28px; z-index: 99999; backdrop-filter: blur(7px); overflow-y: auto; overflow-x: hidden;";

  modal.innerHTML = `
    <div class="certificate-viewer" style="width: min(1100px, 100%); display: flex; flex-direction: column; align-items: center; gap: 18px; position: relative; z-index: 2;">
      <div class="certificate-toolbar no-print" style="width: 100%; display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-bottom: 4px; position: relative; z-index: 20;">
        <button type="button" class="certificate-close-button" onclick="document.getElementById('certificateModalOverlay')?.remove()" aria-label="Close certificate" style="width: 40px; height: 40px; border-radius: 10px; border: none; background: rgba(15, 23, 42, 0.82); color: #ffffff; font-size: 22px; line-height: 1; cursor: pointer; box-shadow: 0 10px 22px rgba(15,23,42,0.2); display: inline-flex; align-items: center; justify-content: center; font-weight: 700;">×</button>
        <button type="button" class="certificate-print-button" onclick="window.print()" style="border: none; background: #0f172a; color: #ffffff; border-radius: 10px; padding: 11px 18px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 12px 24px rgba(15,23,42,0.14);">🖨️ طباعة الشهادة</button>
      </div>

      <div class="certificate-printable-area certificate-print-area" dir="ltr" style="position: relative; width: min(1100px, 100%); min-height: 720px; background: #ffffff; border: 1px solid #dbeafe; box-shadow: 0 26px 56px rgba(37,99,235,0.08); border-radius: 22px; overflow: hidden; padding: 42px 48px 18px; box-sizing: border-box; z-index: 1;">
        <div style="position: absolute; top: -110px; right: -40px; width: 300px; height: 300px; background: rgba(147,197,253,0.18); border-radius: 40% 45% 50% 55%; transform: rotate(18deg);"></div>
        <div style="position: absolute; right: -30px; top: 180px; width: 260px; height: 420px; background: rgba(147,197,253,0.12); border-radius: 32px; transform: rotate(8deg);"></div>
        <div style="position: absolute; left: -90px; bottom: -70px; width: 330px; height: 240px; background: rgba(191,219,254,0.22); border-radius: 48% 52% 64% 36% / 58% 38% 62% 42%; transform: rotate(-12deg);"></div>

        <div style="position: relative; z-index: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 18px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <svg width="52" height="52" viewBox="0 0 64 64" fill="none" aria-hidden="true" style="flex-shrink: 0; display: block; filter: drop-shadow(0 3px 6px rgba(29,78,216,0.18));">
                <defs>
                  <linearGradient id="studyMartCapGradient" x1="10" y1="10" x2="52" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#3b82f6"/>
                    <stop offset="0.45" stop-color="#2563eb"/>
                    <stop offset="1" stop-color="#1e40af"/>
                  </linearGradient>
                </defs>
                <path d="M8 25.5 32 14l24 11.5L32 37 8 25.5Z" fill="url(#studyMartCapGradient)"/>
                <path d="M15 28.1 32 36.5l17-8.4v14.1c0 6.2-7.1 11.4-17 11.4s-17-5.2-17-11.4V28.1Z" fill="url(#studyMartCapGradient)"/>
                <path d="M15 28.1 32 36.5l17-8.4" stroke="#dbeafe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M32 36.5v14.1" stroke="#dbeafe" stroke-width="2" stroke-linecap="round"/>
                <path d="M47.5 39.7v10.4" stroke="#dbeafe" stroke-width="2" stroke-linecap="round"/>
                <path d="M47.5 39.7c4.5 0 7.8 2.8 7.8 6.2 0 3.4-3.3 6.2-7.8 6.2-4.4 0-7.8-2.8-7.8-6.2 0-3.4 3.4-6.2 7.8-6.2Z" fill="#dbeafe" opacity="0.95"/>
              </svg>
              <div>
                <div style="font-size: 32px; font-weight: 900; letter-spacing: -0.8px; line-height: 1; font-family: Arial, sans-serif;">
                  <span style="color: #0f172a;">Study</span><span style="color: #1d4ed8;">Mart</span>
                </div>
                <div style="font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1.8px; margin-top: 5px;">Learn · Grow · Achieve</div>
              </div>
            </div>

            <div style="text-align: right; min-width: 220px;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 6px;">
                <span style="font-size: 12px; color: #64748b; font-weight: 700; letter-spacing: 0.08em;">Certificate ID:</span>
                <span style="font-size: 15px; color: #1d4ed8; font-weight: 800;">${certData.certificateId}</span>
              </div>
              <div style="height: 1px; width: 100%; background: linear-gradient(90deg, rgba(148,163,184,0.2), rgba(59,130,246,0.6), rgba(148,163,184,0.2));"></div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 52px;">
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 0.18em; color: #0f172a; text-transform: uppercase;">Certificate</div>
            <div style="margin-top: 14px; font-size: 12px; font-weight: 700; letter-spacing: 0.8em; color: #1d4ed8; text-transform: uppercase;">O F &nbsp;&nbsp; C O M P L E T I O N</div>
            <div style="width: 150px; height: 2px; background: #93c5fd; margin: 18px auto 0; position: relative;">
              <span style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 9px; height: 9px; border-radius: 50%; background: #1d4ed8; display: block;"></span>
            </div>
          </div>

          <div style="margin-top: 34px; text-align: center;">
            <div style="font-size: 17px; color: #334155; font-weight: 500; margin-bottom: 8px;">This is to certify that</div>
            <div style="font-size: 40px; font-weight: 800; color: #0f172a; letter-spacing: -0.04em; margin: 0 auto 10px; max-width: 700px; word-break: break-word; line-height: 1.1;">${studentName}</div>
            <div style="font-size: 17px; color: #334155; font-weight: 500; margin-bottom: 10px;">has successfully completed the course</div>
            <div style="font-size: 27px; font-weight: 700; color: #1d4ed8; margin: 0 auto; max-width: 800px; word-break: break-word; line-height: 1.2;">${course.title}</div>
          </div>

          <div style="margin-top: 32px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid rgba(148,163,184,0.5); border-bottom: 1px solid rgba(148,163,184,0.5); background: rgba(219,234,254,0.18);">
            ${[
              ["Completion Date", certData.issuedDate || "—", "calendar"],
              ["Duration", durationText, "clock"],
              ["Level", levelText, "bar-chart"],
              ["Instructor", course.instructor || "Instructor", "user"],
            ]
              .map(
                ([label, value, icon]) => `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 78px; padding: 14px 10px; text-align: left;">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(96,165,250,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  ${icon === "calendar" ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="#1d4ed8" stroke-width="1.8"/><path d="M8 3v4M16 3v4M3 10h18" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round"/></svg>' : icon === "clock" ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="#1d4ed8" stroke-width="1.8"/><path d="M12 7v5l3 2" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : icon === "bar-chart" ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18V9M10 18V5M16 18v-8M22 18v-12" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round"/></svg>' : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="#1d4ed8" stroke-width="1.8"/><path d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" stroke="#1d4ed8" stroke-width="1.8" stroke-linecap="round"/></svg>'}
                </div>

                <div style="min-width: 0;">
                  <div style="font-size: 10px; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">${label}</div>
                  <div style="font-size: 15px; color: #0f172a; font-weight: 700; line-height: 1.35; word-break: break-word;">${value}</div>
                </div>
                ${label !== "Instructor" ? '<div style="position: absolute; right: 0; top: 16%; width: 1px; height: 68%; background: rgba(148,163,184,0.55);"></div>' : ""}
              </div>
            `,
              )
              .join("")}
          </div>

          <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 170px 1fr; gap: 14px; align-items: end;">
            <div style="text-align: center; padding-bottom: 10px;">
              <div style="min-height: 54px; display: flex; align-items: end; justify-content: center; margin-bottom: 8px;">
                <div style="font-family: 'Alex Brush', 'Segoe Script', 'Lucida Handwriting', cursive; font-size: 30px; line-height: 1; color: #102a43; font-weight: 400; letter-spacing: 1px; text-shadow: 0 0 0 rgba(16, 42, 67, 0.05);">${course.instructor || "Instructor"}</div>
              </div>
              <div style="height: 1.5px; background: rgba(148,163,184,0.8); width: 140px; margin: 6px auto 8px;"></div>
              <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Course Instructor</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">StudyMart</div>
            </div>

            <div style="display: flex; justify-content: center;">
              <div style="width: 118px; height: 118px; border-radius: 50%; border: 2px solid rgba(29,78,216,0.22); background: rgba(219,234,254,0.45); position: relative; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 6px rgba(255,255,255,0.75);">
                <svg width="72" height="72" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                  <circle cx="40" cy="40" r="31" fill="rgba(29,78,216,0.12)" stroke="#1d4ed8" stroke-width="1.5"/>
                  <path d="M40 15 57 24v12c0 10.7-7.7 18.3-17 21.5C27.7 54.3 20 46.7 20 36V24l17-9Z" fill="rgba(29,78,216,0.1)" stroke="#0f172a" stroke-width="1.5"/>
                  <path d="M28 36.5v-8.6c0-4.6 5.5-7.9 12-7.9s12 3.3 12 7.9v8.6" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M40 28v17" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M27 49.8c2.5-4.8 7-6.5 13-6.5 6 0 10.5 1.7 13 6.5" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
            </div>

            <div style="text-align: center; padding-bottom: 10px;">
              <div style="min-height: 54px; display: flex; align-items: end; justify-content: center; margin-bottom: 8px;">
                <div style="font-family: 'Alex Brush', 'Segoe Script', 'Lucida Handwriting', cursive; font-size: 30px; line-height: 1; color: #102a43; font-weight: 400; letter-spacing: 1px; text-shadow: 0 0 0 rgba(16, 42, 67, 0.05);">${STUDYMART_PLATFORM_OWNER}</div>
              </div>
              <div style="height: 1.5px; background: rgba(148,163,184,0.8); width: 140px; margin: 6px auto 8px;"></div>
              <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Founder</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 3px;">StudyMart</div>
            </div>
          </div>

          <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #0f172a; font-weight: 700; letter-spacing: 0.05em;">
            Platform Owner: ${STUDYMART_PLATFORM_OWNER}
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
