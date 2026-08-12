import { coursesData } from "../data/courses.js";
import { showCustomAlert } from "../utils/helpers.js";
import { renderBooks } from "../components/books.js";
import { showPurchases } from "./courseService.js";
import { openCourseBuilder } from "./courseBuilderService.js";
import { openCourseManagementDashboard } from "./courseManagementService.js";
import { openBookBuilder } from "./bookBuilderService.js";
import { openBookManagementDashboard } from "./bookManagementService.js";
import { isTeacher } from "./permissionService.js";

export function setupDashboardBindings() {
  const hiddenVideoInput = document.createElement("input");
  hiddenVideoInput.id = "hiddenVideoInput";
  hiddenVideoInput.type = "file";
  hiddenVideoInput.accept = "video/*";
  hiddenVideoInput.style.display = "none";
  document.body.appendChild(hiddenVideoInput);

  hiddenVideoInput.addEventListener("change", function () {
    const file = hiddenVideoInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showCustomAlert("من فضلك اختر ملف فيديو فقط");
      hiddenVideoInput.value = "";
      return;
    }
    if (window.appState) {
      window.appState.selectedCourseVideo = URL.createObjectURL(file);
      showCustomAlert("تم اختيار فيديو الدورة بنجاح");
    }
  });

  const hiddenImageInput = document.createElement("input");
  hiddenImageInput.id = "hiddenImageInput";
  hiddenImageInput.type = "file";
  hiddenImageInput.accept = "image/*";
  hiddenImageInput.style.display = "none";
  document.body.appendChild(hiddenImageInput);

  hiddenImageInput.addEventListener("change", function () {
    const file = hiddenImageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showCustomAlert("من فضلك اختر صورة فقط");
      hiddenImageInput.value = "";
      return;
    }
    if (window.appState) {
      window.appState.selectedCourseImage = URL.createObjectURL(file);
      showCustomAlert("تم اختيار صورة الدورة بنجاح");
    }
  });
}

export function renderStudentDashboardPage() {
  if (typeof window.renderMyCoursesPage === "function") {
    window.renderMyCoursesPage();
  } else {
    window.location.hash = "#student/my-courses";
  }
}

export function showDashboard(event) {
  if (event) event.preventDefault();
  if (!window.appState?.isLoggedIn) {
    showCustomAlert("يجب تسجيل الدخول أولاً");
    if (window.showLogin) window.showLogin();
    return;
  }

  if (window.appState.userRole === "student") {
    renderStudentDashboardPage();
    return;
  }

  if (window.appState.userRole === "owner") {
    if (typeof window.openPayoutsDashboard === "function") {
      window.openPayoutsDashboard();
    } else {
      window.location.hash = "#teacher/payouts";
    }
    return;
  }

  const modal = document.getElementById("dashboardModal");
  if (modal) modal.classList.remove("show");
  openTeacherChoice();
}

export function openStudentPurchasesChoice() {
  const oldModal = document.getElementById("studentPurchasesModal");
  if (oldModal) oldModal.remove();

  if (typeof window !== "undefined" && window.renderPurchasesPage) {
    window.renderPurchasesPage();
  } else {
    window.location.hash = "#student/purchases";
  }
}

export function openMyBooks() {
  const oldModal = document.getElementById("myBooksModal");
  if (oldModal) oldModal.remove();

  if (typeof window !== "undefined" && window.renderMyBooksPage) {
    window.renderMyBooksPage();
  } else {
    window.location.hash = "#student/my-books";
  }
}

export function closeMyBooksModal() {
  const modal = document.getElementById("myBooksModal");
  if (modal) modal.remove();
}

export function openBook(fileUrl) {
  window.open(fileUrl, "_blank");
}

export function saveBook(fileUrl, title) {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = `${title}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function closeStudentPurchasesChoice() {
  const modal = document.getElementById("studentPurchasesModal");
  if (modal) modal.remove();
}

export function openMyCourses() {
  showPurchases();
}

export function openAddCourse() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الخاصية مخصصة للمعلمين والمالك فقط.");
    return;
  }
  openCourseBuilder(null);
}

export function openTeacherChoice() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الخاصية مخصصة للمعلمين والمالك فقط.");
    return;
  }
  openCourseManagementDashboard();
}

export function openAddBook() {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، هذه الخاصية مخصصة للمعلمين والمالك فقط.");
    return;
  }
  openBookBuilder(null);
}

export function handleAddBook() {
  if (!window.appState) return;

  window.appState.newBookTitle = document.getElementById("bookTitle")?.value;
  window.appState.newBookAuthor = document.getElementById("bookAuthor")?.value;
  window.appState.newBookPrice = document.getElementById("bookPrice")?.value;
  window.appState.newBookCategory =
    document.getElementById("bookCategoryAdd")?.value;

  if (
    !window.appState.newBookTitle ||
    !window.appState.newBookAuthor ||
    !window.appState.newBookPrice
  ) {
    showCustomAlert("يرجى ملء جميع البيانات");
    return;
  }

  if (!window.appState.newBookFile) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.onchange = () => {
      window.appState.newBookFile = fileInput.files[0];
      showCustomAlert("تم اختيار ملف الكتاب، اختر صورة الغلاف");
    };
    fileInput.click();
    return;
  }

  if (!window.appState.newBookCover) {
    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.onchange = () => {
      window.appState.newBookCover = imageInput.files[0];
      showCustomAlert("اضغط إضافة الكتاب مرة أخرى للحفظ");
    };
    imageInput.click();
    return;
  }

  const newBook = {
    id: Date.now(),
    title: window.appState.newBookTitle,
    author: window.appState.newBookAuthor,
    category: window.appState.newBookCategory,
    price: Number(window.appState.newBookPrice),
    image: URL.createObjectURL(window.appState.newBookCover),
    fileUrl: URL.createObjectURL(window.appState.newBookFile),
  };

  const booksModule = window.booksData;
  if (booksModule && Array.isArray(booksModule)) {
    booksModule.unshift(newBook);
  }

  window.appState.newBookTitle = "";
  window.appState.newBookAuthor = "";
  window.appState.newBookPrice = "";
  window.appState.newBookCategory = "";
  window.appState.newBookFile = null;
  window.appState.newBookCover = null;

  renderBooks();
  showCustomAlert("✅ تم إضافة الكتاب بنجاح");
}

export function addNewCourse() {
  if (!window.appState) return;

  const title = document.getElementById("courseTitle")?.value;
  const price = document.getElementById("coursePrice")?.value;
  const category = document.getElementById("courseCategory")?.value;

  if (!window.appState.selectedCourseImage) {
    window.appState.selectedCourseImage = "https://images.unsplash.com/photo-1515879218367-8466d910aaa4";
  }

  if (
    !window.appState.selectedCourseDescription ||
    !window.appState.selectedCourseLevel
  ) {
    openCourseDescriptionModal(addNewCourse);
    return;
  }

  if (!title || !price) {
    showCustomAlert("يرجى ملء جميع الحقول");
    return;
  }

  const newCourse = {
    id: coursesData.length + 1,
    title,
    description: "دورة جديدة",
    longDescription: window.appState.selectedCourseDescription,
    image: window.appState.selectedCourseImage,
    video: window.appState.selectedCourseVideo,
    price: Number.parseInt(price, 10),
    rating: "4.5",
    instructor: window.appState.userData.name,
    students: 0,
    lessons: 20,
    duration: 10,
    category,
    level: window.appState.selectedCourseLevel,
    series: "New Series",
  };

  coursesData.push(newCourse);
  window.appState.userTeacherCourses.push(title);
  showCustomAlert("تمت إضافة الدورة بنجاح!");

  document.dispatchEvent(new CustomEvent("reloadCourses"));
  closeDashboard();
}

export function closeDashboard() {
  document.getElementById("dashboardModal")?.classList.remove("show");
}

function openCourseDescriptionModal(onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";
  overlay.innerHTML = `
    <div class="floating-modal-box">
      <h3>📝 بيانات الدورة</h3>
      <textarea id="courseDescriptionInput" placeholder="اكتب وصفًا مختصرًا للدورة..."></textarea>
      <select id="courseLevelSelect">
        <option value="">اختر مستوى الدورة</option>
        <option value="beginner">مبتدئ</option>
        <option value="intermediate">متوسط</option>
        <option value="advanced">متقدم</option>
      </select>
      <button class="btn btn-primary" type="button" id="confirmCourseData">تأكيد البيانات</button>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  overlay.querySelector("#confirmCourseData")?.addEventListener("click", () => {
    const desc = overlay.querySelector("#courseDescriptionInput")?.value.trim();
    const level = overlay.querySelector("#courseLevelSelect")?.value;
    if (!desc) {
      showCustomAlert("من فضلك أدخل وصف الدورة");
      return;
    }
    if (!level) {
      showCustomAlert("من فضلك اختر مستوى الدورة");
      return;
    }
    if (window.appState) {
      window.appState.selectedCourseDescription = desc;
      window.appState.selectedCourseLevel = level;
    }
    overlay.remove();
    onConfirm();
  });
}
