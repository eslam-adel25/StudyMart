import { coursesData } from "../data/courses.js";
import { booksData } from "../data/books.js";
import { formatCourseCategory, formatCourseLevel } from "../utils/helpers.js";
import { createCourseCard } from "./courseCard.js";
import { createBookCard } from "./books.js";
import { showCourseDetails } from "../services/courseService.js";

export function normalizeSearchString(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function getInstructorArabic(name) {
  if (!name) return "";
  const map = {
    "dr.": "د. دكتور",
    dr: "د. دكتور",
    "eng.": "م. مهندس",
    eng: "م. مهندس",
    fatima: "فاطمة فاطمه",
    ali: "علي",
    sarah: "سارة ساره",
    sara: "سارة ساره",
    khaled: "خالد",
    mahmoud: "محمود",
    "al-da'ayee": "الداعي الداعيه",
    layla: "ليلى ليلي",
    hassan: "حسن",
    mohammed: "محمد",
    mohamad: "محمد",
    muhammad: "محمد",
    mohamed: "محمد",
    salem: "سالم",
    noor: "نور",
    ahmed: "أحمد احمد",
    amira: "أميرة اميره",
    hind: "هند",
    abdullah: "عبد الله عبدالله",
    omar: "عمر",
    asmaa: "أسماء اسماء",
    ibrahim: "إبراهيم ابراهيم",
    yasmin: "ياسمين",
    sherif: "الشريف",
    abdelrahman: "عبد الرحمن عبدالرحمن",
    majed: "الماجد",
    tareq: "طارق",
    mona: "منى مني",
    "al-morsi": "المرسي",
    youssef: "يوسف",
  };
  const words = String(name).toLowerCase().split(/\s+/);
  const arabicWords = words.map((w) => map[w] || w);
  return arabicWords.join(" ");
}

export function matchCourse(course, query) {
  const normQuery = normalizeSearchString(query);
  if (!normQuery) return true;

  const tagsStr = Array.isArray(course.tags)
    ? course.tags.join(" ")
    : course.tags || "";
  const catArabic = formatCourseCategory(course.category);
  const lvlArabic = formatCourseLevel(course.level);
  const instArabic = getInstructorArabic(course.instructor);

  const searchableText = normalizeSearchString(
    [
      course.title,
      course.subtitle,
      course.series,
      course.instructor,
      instArabic,
      course.category,
      catArabic,
      course.description,
      course.longDescription,
      tagsStr,
      course.level,
      lvlArabic,
      course.language,
      course.price,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const tokens = normQuery.split(" ").filter(Boolean);
  return tokens.every((token) => searchableText.includes(token));
}

export function matchBook(book, query) {
  const normQuery = normalizeSearchString(query);
  if (!normQuery) return true;

  const tagsStr = Array.isArray(book.tags)
    ? book.tags.join(" ")
    : book.tags || "";
  const authorArabic = getInstructorArabic(book.author);

  const searchableText = normalizeSearchString(
    [
      book.title,
      book.shortTitle,
      book.seoTitle,
      book.author,
      authorArabic,
      book.publisher,
      book.category,
      book.subCategory,
      book.description,
      book.shortDescription,
      book.fullDescription,
      tagsStr,
      book.language,
      book.price,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const tokens = normQuery.split(" ").filter(Boolean);
  return tokens.every((token) => searchableText.includes(token));
}

export function getSearchQuery() {
  const searchInput = document.getElementById("searchInput");
  return searchInput ? searchInput.value : "";
}

export function performGlobalSearch(rawQuery) {
  const heroInput = document.getElementById("searchInput");
  const courseInput = document.getElementById("standaloneCourseSearch");
  const bookInput = document.getElementById("standaloneBookSearch");

  if (heroInput) {
    const userEmail = String(window.appState?.userData?.email || "")
      .trim()
      .toLowerCase();
    const currentValue = String(heroInput.value || "").trim();
    if (userEmail && currentValue && currentValue.toLowerCase() === userEmail) {
      heroInput.value = "";
    }
  }

  const query = rawQuery !== undefined ? rawQuery : getSearchQuery();
  const normQuery = normalizeSearchString(query);

  const navigateHomePage = () => {
    if (typeof window.showHomePage === "function") window.showHomePage();
  };
  const navigateCoursesPage = () => {
    if (typeof window.showCoursesPage === "function") window.showCoursesPage();
  };
  const navigateBooksPage = () => {
    if (typeof window.showBooksPage === "function") window.showBooksPage();
  };

  if (!normQuery) {
    if (heroInput) heroInput.value = "";
    if (courseInput) courseInput.value = "";
    if (bookInput) bookInput.value = "";

    if (typeof window.filterCourses === "function") window.filterCourses();
    if (typeof window.renderBooks === "function") window.renderBooks();
    if (typeof window.filterStandaloneCourses === "function")
      window.filterStandaloneCourses();
    if (typeof window.filterStandaloneBooks === "function")
      window.filterStandaloneBooks();
    return;
  }

  const matchingCourses = coursesData.filter((c) => matchCourse(c, normQuery));
  const matchingBooks = booksData.filter((b) => matchBook(b, normQuery));

  if (matchingCourses.length > 0 && matchingBooks.length === 0) {
    if (courseInput) courseInput.value = query;
    navigateCoursesPage();

    const listContainer = document.getElementById("standaloneCoursesList");
    if (listContainer) {
      listContainer.innerHTML = "";
      matchingCourses.forEach((course) => {
        const card = createCourseCard(course, showCourseDetails);
        listContainer.appendChild(card);
      });
    }
  } else if (matchingCourses.length === 0 && matchingBooks.length > 0) {
    if (bookInput) bookInput.value = query;
    navigateBooksPage();

    const gridContainer = document.getElementById("standaloneBooksGrid");
    if (gridContainer) {
      gridContainer.innerHTML = "";
      matchingBooks.forEach((book) => {
        const card = createBookCard(book);
        gridContainer.appendChild(card);
      });
    }
  } else if (matchingCourses.length > 0 && matchingBooks.length > 0) {
    navigateHomePage();

    const coursesList = document.getElementById("coursesList");
    if (coursesList) {
      coursesList.innerHTML = "";
      matchingCourses.forEach((course) => {
        const card = createCourseCard(course, showCourseDetails);
        coursesList.appendChild(card);
      });
    }

    const booksGrid = document.getElementById("booksGrid");
    if (booksGrid) {
      booksGrid.innerHTML = "";
      const fragment = document.createDocumentFragment();
      matchingBooks.forEach((book) => {
        const card = createBookCard(book);
        fragment.appendChild(card);
      });
      booksGrid.replaceChildren(fragment);
    }
  } else {
    const emptyMsg = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 45px 20px; background: var(--card-bg, #ffffff); border-radius: 12px; border: 1px dashed var(--border-color, #e2e8f0); margin: 20px 0;">
        <p style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">لا توجد نتائج مطابقة</p>
        <p style="font-size: 14px; color: var(--text-secondary);">لم نجد أي دورات أو كتب تطابق بحثك الحالي "${query}".</p>
      </div>
    `;

    const standaloneCoursesPage = document.getElementById(
      "standaloneCoursesPage",
    );
    const standaloneBooksPage = document.getElementById("standaloneBooksPage");

    if (
      standaloneCoursesPage &&
      !standaloneCoursesPage.classList.contains("hidden")
    ) {
      const listContainer = document.getElementById("standaloneCoursesList");
      if (listContainer) listContainer.innerHTML = emptyMsg;
    } else if (
      standaloneBooksPage &&
      !standaloneBooksPage.classList.contains("hidden")
    ) {
      const gridContainer = document.getElementById("standaloneBooksGrid");
      if (gridContainer) gridContainer.innerHTML = emptyMsg;
    } else {
      const coursesList = document.getElementById("coursesList");
      if (coursesList) coursesList.innerHTML = emptyMsg;

      const booksGrid = document.getElementById("booksGrid");
      if (booksGrid) booksGrid.innerHTML = emptyMsg;
    }
  }
}

export function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.querySelector(".hero-search-btn");

  if (searchInput) {
    searchInput.autocomplete = "off";
    searchInput.autocorrect = "off";
    searchInput.autocapitalize = "off";
    searchInput.spellcheck = false;

    const userEmail = String(window.appState?.userData?.email || "")
      .trim()
      .toLowerCase();
    const currentValue = String(searchInput.value || "").trim();
    if (userEmail && currentValue && currentValue.toLowerCase() === userEmail) {
      searchInput.value = "";
    }
  }

  if (searchInput && !searchInput.dataset.globalSearchBound) {
    searchInput.dataset.globalSearchBound = "true";
    searchInput.addEventListener("input", (e) => {
      performGlobalSearch(e.target.value);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performGlobalSearch(searchInput.value);
      }
    });
  }

  if (searchBtn && !searchBtn.dataset.bound) {
    searchBtn.dataset.bound = "true";
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const val = searchInput ? searchInput.value : "";
      performGlobalSearch(val);
    });
  }
}

if (typeof window !== "undefined") {
  window.performGlobalSearch = performGlobalSearch;
  window.normalizeSearchString = normalizeSearchString;
  window.matchCourse = matchCourse;
  window.matchBook = matchBook;
}
