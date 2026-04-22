/* instructor and courses */
const coursesData = [
  {
    id: 1,
    title: "بناء تطبيقات الويب الحديثة مع React",
    description:
      "دورة شاملة لتعلم React من البداية، تغطي الـ Hooks والـ Context API والـ Redux",
    longDescription:
      "تعلم كيفية بناء تطبيقات ويب احترافية وتفاعلية باستخدام React. الدورة تغطي جميع المواضيع من الأساسيات إلى المتقدمة.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/4cdd575e-deb3-4d4e-a583-46a91b737f3c.jpg",
    price: 299,
    rating: "4.9",
    instructor: "Fatima Ali",
    students: 2100,
    lessons: 45,
    duration: 25,
    category: "programming",
    level: "intermediate",
    series: "Web Development",
  },
  {
    id: 2,
    title: "Python للمبتدئين - من الصفر إلى الاحترافية",
    description: "تعلم البرمجة بلغة Python بطريقة سهلة وممتعة مع مشاريع عملية",
    longDescription:
      "دورة تفاعلية لتعلم Python من الصفر، تتضمن أساسيات البرمجة والمكتبات الشهيرة والمشاريع العملية.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/53307e0b-276d-4321-86ae-b8c703c48312.jpg",
    price: 179,
    rating: "4.8",
    instructor: "Sarah Khaled",
    students: 3400,
    lessons: 52,
    duration: 30,
    category: "programming",
    level: "beginner",
    series: "Programming Basics",
  },
  {
    id: 3,
    title: "تصميم UI/UX المتقدم مع Figma",
    description:
      "أساسيات ومتقدمات التصميم الحديث واستخدام أدوات التصميم الاحترافية",
    longDescription:
      "تعلم كيفية تصميم واجهات مستخدم احترافية وتجارب مستخدم ممتازة باستخدام Figma وأفضل الممارسات.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/9f477dec-eea5-41f1-9b0c-bd5e0ceb95f3.jpg",
    price: 249,
    rating: "4.7",
    instructor: "Mahmoud Al-Da'ayee",
    students: 890,
    lessons: 38,
    duration: 20,
    category: "design",
    level: "intermediate",
    series: "Design Fundamentals",
  },
  {
    id: 4,
    title: "JavaScript المتقدم - Async و Promises",
    description:
      "دورة متخصصة في البرمجة غير المتزامنة والمعالجة المتقدمة للأخطاء",
    longDescription:
      "فهم عميق لـ JavaScript المتقدم، الـ Promises، Async/Await، والمعالجة المتقدمة للأخطاء.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/9f477dec-eea5-41f1-9b0c-bd5e0ceb95f3.jpg",
    price: 349,
    rating: "4.9",
    instructor: "Ali Mahmoud",
    students: 1560,
    lessons: 40,
    duration: 22,
    category: "programming",
    level: "advanced",
    series: "Advanced JavaScript",
  },
  {
    id: 5,
    title: "قواعد البيانات SQL للمبتدئين",
    description: "تعلم SQL من الصفر وكيفية التعامل مع قواعد البيانات بكفاءة",
    longDescription:
      "دورة شاملة لتعلم لغة SQL والاستعلامات المختلفة وإدارة قواعد البيانات.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/53307e0b-276d-4321-86ae-b8c703c48312.jpg",
    price: 219,
    rating: "4.6",
    instructor: "Layla Hassan",
    students: 2200,
    lessons: 35,
    duration: 18,
    category: "programming",
    level: "beginner",
    series: "Database Fundamentals",
  },
  {
    id: 6,
    title: "الأمان السيبراني والحماية من الهجمات",
    description:
      "دورة متخصصة في حماية الأنظمة والبيانات من التهديدات السيبرانية",
    longDescription:
      "تعلم أساسيات الأمان السيبراني والتهديدات المختلفة وكيفية حماية الأنظمة.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/53307e0b-276d-4321-86ae-b8c703c48312.jpg",
    price: 399,
    rating: "4.9",
    instructor: "Mohammed Salem",
    students: 1100,
    lessons: 48,
    duration: 28,
    category: "programming",
    level: "advanced",
    series: "Security & Protection",
  },
  {
    id: 7,
    title: "تطوير تطبيقات الجوال مع React Native",
    description:
      "بناء تطبيقات جوال احترافية لـ iOS و Android باستخدام React Native",
    longDescription:
      "تعلم تطوير تطبيقات جوال عبر المنصات باستخدام React Native والمكتبات الشهيرة.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/4cdd575e-deb3-4d4e-a583-46a91b737f3c.jpg",
    price: 349,
    rating: "4.8",
    instructor: "Ali Mahmoud",
    students: 1800,
    lessons: 50,
    duration: 26,
    category: "programming",
    level: "intermediate",
    series: "Mobile Development",
  },
  {
    id: 8,
    title: "Adobe Photoshop الاحترافي",
    description: "تعلم جميع أدوات الفوتوشوب الاحترافية والتعديل على الصور",
    longDescription:
      "دورة شاملة لتعلم Adobe Photoshop من المبتدئ إلى الاحترافي.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/be3b2013-9e0a-4aea-9d30-ab4609e2f857.jpg",
    price: 199,
    rating: "4.7",
    instructor: "Noor Muhammad",
    students: 1600,
    lessons: 42,
    duration: 24,
    category: "design",
    level: "intermediate",
    series: "Design Tools",
  },
  {
    id: 9,
    title: "تطوير الويب Full Stack مع MERN",
    description:
      "بناء تطبيقات ويب كاملة باستخدام MongoDB, Express, React و Node.js",
    longDescription:
      "تعلم كيفية بناء تطبيقات ويب متكاملة من الواجهة الأمامية إلى الخادم باستخدام MERN Stack.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/be3b2013-9e0a-4aea-9d30-ab4609e2f857.jpg",
    price: 399,
    rating: "4.9",
    instructor: "Mohammed Ahmed",
    students: 2500,
    lessons: 65,
    duration: 35,
    category: "programming",
    level: "advanced",
    series: "Full Stack Development",
  },
  {
    id: 10,
    title: "Graphic Design للمبتدئين",
    description: "أساسيات التصميم الجرافيكي والمبادئ الأساسية للتصميم الفعال",
    longDescription:
      "دورة تفاعلية لتعلم أساسيات التصميم الجرافيكي والألوان والطباعة والتكوين.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/be3b2013-9e0a-4aea-9d30-ab4609e2f857.jpg",
    price: 179,
    rating: "4.6",
    instructor: "Amira Hassan",
    students: 1200,
    lessons: 28,
    duration: 15,
    category: "design",
    level: "beginner",
    series: "Design Fundamentals",
  },
  {
    id: 11,
    title: "اللغة الإنجليزية المحادثة",
    description: "تحسين مهارات التحدث والمحادثة باللغة الإنجليزية",
    longDescription:
      "دورة تفاعلية لتحسين مهارات التحدث والاستماع والمحادثة باللغة الإنجليزية.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=220&fit=crop",
    price: 159,
    rating: "4.8",
    instructor: "Sarah Ali",
    students: 4200,
    lessons: 40,
    duration: 20,
    category: "languages",
    level: "intermediate",
    series: "English Courses",
  },
  {
    id: 12,
    title: "مهارات التواصل الفعال والعرض",
    description: "تطوير مهارات التواصل الشفهي والعرض التقديمي الاحترافي",
    longDescription:
      "تعلم كيفية التواصل بفعالية والقيام بعروض تقديمية احترافية ومؤثرة.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=220&fit=crop",
    price: 139,
    rating: "4.8",
    instructor: "Ahmed Salem",
    students: 3100,
    lessons: 20,
    duration: 10,
    category: "development",
    level: "beginner",
    series: "Soft Skills",
  },
  {
    id: 13,
    title: "القيادة والإدارة الحديثة",
    description: "تطوير مهارات القيادة والإدارة والتعامل مع الفريق",
    longDescription:
      "دورة شاملة لتطوير مهارات القيادة والإدارة الفعالة والقيادة الإيجابية.",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=220&fit=crop",
    price: 219,
    rating: "4.7",
    instructor: "Khaled Ibrahim",
    students: 1900,
    lessons: 32,
    duration: 16,
    category: "development",
    level: "intermediate",
    series: "Leadership & Management",
  },
  {
    id: 14,
    title: "تطوير الذات والثقة بالنفس",
    description: "برنامج متكامل لبناء الثقة بالنفس وتطوير الشخصية",
    longDescription:
      "رحلة شاملة لتطوير الذات وبناء ثقة قوية بالنفس والنمو الشخصي.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/9f477dec-eea5-41f1-9b0c-bd5e0ceb95f3.jpg",
    price: 129,
    rating: "4.9",
    instructor: "Hind Mohammed",
    students: 2800,
    lessons: 25,
    duration: 12,
    category: "development",
    level: "beginner",
    series: "Personal Development",
  },
  {
    id: 15,
    title: "أساسيات التداول والاستثمار",
    description: "تعلم أساسيات الأسواق المالية والتداول الآمن",
    longDescription:
      "دورة تعليمية شاملة لفهم الأسواق المالية والمفاهيم الأساسية للتداول.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/53307e0b-276d-4321-86ae-b8c703c48312.jpg",
    price: 299,
    rating: "4.7",
    instructor: "Hassan Abdullah",
    students: 2400,
    lessons: 38,
    duration: 20,
    category: "trading",
    level: "beginner",
    series: "Trading Fundamentals",
  },
  {
    id: 16,
    title: "التحليل الفني المتقدم",
    description: "تحليل الأسواق والشموع اليابانية والتوقعات الدقيقة",
    longDescription:
      "دورة متقدمة لتعلم التحليل الفني وقراءة الرسوم البيانية بمهارة.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/53307e0b-276d-4321-86ae-b8c703c48312.jpg",
    price: 379,
    rating: "4.9",
    instructor: "Omar Mohammed",
    students: 1600,
    lessons: 45,
    duration: 24,
    category: "trading",
    level: "advanced",
    series: "Advanced Trading",
  },
  {
    id: 17,
    title: "العملات الرقمية والبلوكتشين",
    description: "فهم العملات الرقمية والاستثمار الآمن في البلوكتشين",
    longDescription:
      "تعلم عن العملات الرقمية والبلوكتشين والاستثمار الآمن والمحفظات الرقمية.",
    image:
      "https://miaoda-site-img.s3cdn.medo.dev/images/53307e0b-276d-4321-86ae-b8c703c48312.jpg",
    price: 349,
    rating: "4.8",
    instructor: "Mahmoud Salem",
    students: 1800,
    lessons: 35,
    duration: 18,
    category: "trading",
    level: "intermediate",
    series: "Cryptocurrency",
  },
];

/*  قسم الكتب   */

const booksData = [
  {
    id: 201,
    title: "JavaScript الحديثة",
    author: "Ahmed Hassan",
    category: "برمجة",
    price: 35,
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4",
    fileUrl: "Books/css.pdf",
  },
  {
    id: 202,
    title: "React من الصفر",
    author: "Mohamed Ali",
    category: "برمجة",
    price: 40,
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    fileUrl: "Books/Fundamentals Of Programming With C++.pdf",
  },
  {
    id: 203,
    title: "أساسيات التداول",
    author: "Khaled Samir",
    category: "تداول",
    price: 30,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3",
    fileUrl: "Books/Learn Command Line.pdf",
  },
  {
    id: 204,
    title: "ريادة الأعمال الرقمية",
    author: "Sara Ibrahim",
    category: "ريادة أعمال",
    price: 28,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",
    fileUrl: "Books/CSS Useful Features.pdf",
  },
  {
    id: 205,
    title: "تنمية المهارات الشخصية",
    author: "Nour Adel",
    category: "تنمية ذاتية",
    price: 25,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    fileUrl: "Books/html (1).pdf",
  },
  {
    id: 206,
    title: "أساسيات UI/UX",
    author: "Omar Fathy",
    category: "تصميم جرافيك",
    price: 27,
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c",
    fileUrl: "Books/css (1).pdf",
  },
  {
    id: 207,
    title: "تعلم الإنجليزية للمطورين",
    author: "Laila Mostafa",
    category: "لغات",
    price: 22,
    image: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6",
    fileUrl: "Books/CSS Useful Features.pdf",
  },
];

const usersDB = [
  {
    email: "student@gmail.com",
    password: "123456",
    role: "student",
    name: "طالب تجريبي",
  },
  {
    email: "teacher@gmail.com",
    password: "123456",
    role: "teacher",
    name: "معلم تجريبي",
  },
];

let newBookTitle = "";
let newBookAuthor = "";
let newBookPrice = "";
let newBookCategory = "";
let bankReceiptImage = null;

let newBookFile = null;
let newBookCover = null;
let userPurchasedBooks = [];

let cart = [];
let userRole = "student";
let isLoggedIn = false;
let selectedCourseVideo = null;
let selectedCourseDescription = null;
let selectedCourseLevel = null;
const currentUser = null;
const userTeacherCourses = [];
// المستخدم المسجل
let userCourses = [];

const userData = {
  name: "Eslam Adel",
  email: "student@gmail.com",
  image: "https://via.placeholder.com/120?text=User",
  courses: [],
};

document.addEventListener("DOMContentLoaded", () => {
  loadCourses();
  loadCart();
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    document.querySelector(".theme-toggle").textContent = "☀️";
  }
});

function toggleProfile(e) {
  if (e) e.preventDefault();
  document.getElementById("profileSidebar").classList.toggle("show");
}
// عرض وتحديث الملف الشخصي
function showUserProfile() {
  const modal = document.getElementById("userProfileModal");
  const content = document.getElementById("userProfileContent");

  content.innerHTML = `
    <h2>تعديل الملف الشخصي</h2>
    <div class="user-profile-form">
      <div class="profile-form-group">
        <label>صورة البروفيل</label>
        <input type="file" id="profileImageInput" accept="image/*" onchange="updateProfileImage()">
        <div class="profile-avatar" style="margin-top: 10px;">
          <img id="previewImage" src="${userData.image}" alt="صورة البروفيل">
        </div>
      </div>
      <div class="profile-form-group">
        <label>الاسم</label>
        <input type="text" value="${userData.name}" onchange="userData.name = this.value">
      </div>
      <div class="profile-form-group">
        <label>البريد الإلكتروني</label>
        <input type="email" value="${userData.email}" onchange="userData.email = this.value">
      </div>
      <button class="btn btn-primary" onclick="saveProfile()">حفظ التغييرات</button>
      <button class="btn btn-secondary" onclick="closeUserProfile()">إلغاء</button>
    </div>
  `;

  modal.classList.add("show");
  toggleProfile();
}
// تحديث صورة الملف الشخصي
function updateProfileImage() {
  const file = document.getElementById("profileImageInput").files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;

      userData.image = imageData;

      const previewImg = document.getElementById("previewImage");
      if (previewImg) previewImg.src = imageData;
      const mainProfileImg = document.getElementById("profileImage");
      if (mainProfileImg) {
        mainProfileImg.src = imageData;
      }
    };

    reader.readAsDataURL(file);
  }
}
// حفظ التغييرات في الملف الشخصي
function saveProfile() {
  document.getElementById("profileName").textContent = userData.name;
  document.getElementById("profileEmail").textContent = userData.email;
  showCustomAlert("تم حفظ التغييرات بنجاح!");
  closeUserProfile();
}

function closeUserProfile() {
  document.getElementById("userProfileModal").classList.remove("show");
}

// عرض لبدورات المشتراة
function showPurchases() {
  const modal = document.getElementById("purchasesModal");
  const content = document.getElementById("purchasesContent");

  let purchasesHTML = "<h2>دوراتي المشتراة</h2>";

  if (userCourses.length === 0) {
    purchasesHTML +=
      '<p style="text-align: center; color: var(--text-secondary); padding: 30px;">لم تشتر أي دورات بعد</p>';
  } else {
    purchasesHTML += '<div class="purchases-grid">';
    userCourses.forEach((courseId) => {
      const course = coursesData.find((c) => c.id === courseId);
      if (course) {
        purchasesHTML += `
          <div class="purchased-course-card">
            <h4>${course.title}</h4>
            <p>المدرس: ${course.instructor}</p>
            <p>المستوى: ${course.level === "beginner" ? "مبتدئ" : course.level === "intermediate" ? "متوسط" : "متقدم"}</p>
            <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="continueCourse('${course.title}')">متابعة الدورة</button>
          </div>
        `;
      }
    });
    purchasesHTML += "</div>";
  }

  content.innerHTML = purchasesHTML;
  modal.classList.add("show");
  toggleProfile();
}

function continueCourse(courseTitle) {
  showCustomAlert(`جاري فتح دورة: ${courseTitle}`);
}

function continueCourse(courseTitle) {
  // نجيب الكورس
  const course = coursesData.find((c) => c.title === courseTitle);

  if (!course || !course.video) {
    showCustomAlert("لم يتم العثور على فيديو لهذه الدورة");
    return;
  }

  // افتح صفحة مشغل الفيديو (Modal أو صفحة)
  openVideoPlayer(course);
}

// open the video player modal
function openVideoPlayer(course) {
  const playerModal = document.createElement("div");
  playerModal.style.position = "fixed";
  playerModal.style.inset = "0";
  playerModal.style.background = "rgba(0,0,0,0.7)";
  playerModal.style.zIndex = "9999";
  playerModal.style.display = "flex";
  playerModal.style.alignItems = "center";
  playerModal.style.justifyContent = "center";

  playerModal.innerHTML = `
    <div style="background:#fff; width:80%; max-width:900px; padding:20px; border-radius:10px; position:relative;">
      <button onclick="this.closest('div').parentElement.remove()" 
        style="position:absolute; top:10px; right:10px; border:none; background:none; font-size:20px; cursor:pointer;">✖</button>
      <h3 style="margin-bottom:10px;">${course.title}</h3>
      <video src="${course.video}" controls autoplay style="width:100%; border-radius:8px;"></video>
    </div>
  `;

  document.body.appendChild(playerModal);
}

function closePurchases() {
  document.getElementById("purchasesModal").classList.remove("show");
}

function handleLogout() {
  isLoggedIn = false;
  userRole = "student";
  document.querySelector(".btn-login").textContent = "تسجيل الدخول";
  document.querySelector(".profile-toggle").classList.add("hidden");
  document.querySelector(".dashboard-link").classList.add("hidden");
  toggleProfile();
  showCustomAlert("تم تسجيل الخروج بنجاح!");
}
// فلتر حسب الفئة
function filterByCategory(category) {
  document.getElementById("categoryFilter").value = category;
  filterCourses();
}
// فلتر حسب المستوى
function filterByLevel(level) {
  document.getElementById("levelFilter").value = level;
  filterCourses();
}
// تبديل الوضع الليلي
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  document.querySelector(".theme-toggle").textContent = isDark ? "☀️" : "🌙";
}
// عرض الدورات
function loadCourses() {
  const coursesList = document.getElementById("coursesList");
  coursesList.innerHTML = "";
  coursesData.forEach((course) => {
    const levelBadgeText =
      course.level === "beginner"
        ? "مبتدئ"
        : course.level === "intermediate"
          ? "متوسط"
          : "متقدم";
    const levelBadgeClass = course.level;

    const courseCard = document.createElement("div");
    courseCard.className = "course-card";
    courseCard.innerHTML = `
      <div class="course-image" style="background-image: url('${course.image}'); background-size: cover;">
        <div class="course-badge ${levelBadgeClass}">${levelBadgeText}</div>
      </div>
      <div class="course-content">
        <span class="course-category-tag">${course.category === "programming" ? "برمجة" : course.category === "design" ? "تصميم" : course.category === "languages" ? "لغات" : course.category === "development" ? "تنمية ذاتية" : "تداول"}</span>
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
        <button class="view-details-btn" onclick="showCourseDetails(${course.id})">عرض التفاصيل</button>
      </div>
    `;
    coursesList.appendChild(courseCard);
  });
}
// فلتر الدورات حسب البحث والفئة والمستوى
function filterCourses() {
  const searchInput = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const categoryFilter = document.getElementById("categoryFilter").value;
  const levelFilter = document.getElementById("levelFilter").value;

  const filtered = coursesData.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchInput) ||
      course.description.toLowerCase().includes(searchInput) ||
      course.instructor.toLowerCase().includes(searchInput);
    const matchesCategory =
      !categoryFilter || course.category === categoryFilter;
    const matchesLevel = !levelFilter || course.level === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const coursesList = document.getElementById("coursesList");
  coursesList.innerHTML = "";

  if (filtered.length === 0) {
    coursesList.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">لم نجد دورات تطابق البحث</p>';
    return;
  }

  filtered.forEach((course) => {
    const levelBadgeText =
      course.level === "beginner"
        ? "مبتدئ"
        : course.level === "intermediate"
          ? "متوسط"
          : "متقدم";
    const levelBadgeClass = course.level;

    const courseCard = document.createElement("div");
    courseCard.className = "course-card";
    courseCard.innerHTML = `
      <div class="course-image" style="background-image: url('${course.image}'); background-size: cover;">
        <div class="course-badge ${levelBadgeClass}">${levelBadgeText}</div>
      </div>
      <div class="course-content">
        <span class="course-category-tag">${course.category === "programming" ? "برمجة" : course.category === "design" ? "تصميم" : course.category === "languages" ? "لغات" : course.category === "development" ? "تنمية ذاتية" : "تداول"}</span>
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
        <button class="view-details-btn" onclick="showCourseDetails(${course.id})">عرض التفاصيل</button>
      </div>
    `;
    coursesList.appendChild(courseCard);
  });
}

function showCourseDetails(courseId) {
  if (!isLoggedIn) {
    showCustomAlert("يجب تسجيل الدخول أولاً");
    showLogin();
    return;
  }

  const course = coursesData.find((c) => c.id === courseId);
  const modal = document.getElementById("courseModal");
  const detailsContainer = document.getElementById("courseDetails");

  let progressHTML = "";
  for (let lesson = 1; lesson <= Math.min(course.lessons, 10); lesson++) {
    const progress = Math.random() * 100;
    progressHTML += `
      <div class="progress-item">
        <div class="progress-week">الدرس ${lesson}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span style="color: var(--text-secondary);">${Math.round(progress)}%</span>
      </div>
    `;
  }

  let certificateBtn = "";
  const isCourseCompleted = true;
  if (isCourseCompleted) {
    certificateBtn = `<button class="btn btn-secondary certificate-btn" onclick="printCertificate('${course.title}', '${course.instructor}')">🎓 اطبع الشهادة</button>`;
  }

  const levelText =
    course.level === "beginner"
      ? "مبتدئ"
      : course.level === "intermediate"
        ? "متوسط"
        : "متقدم";

  detailsContainer.innerHTML = `
    <div class="course-detail-header">
      <div class="course-image" style="background-image: url('${course.image}'); background-size: cover; border-radius: 8px; height: 250px;"></div>
      <h2>${course.title}</h2>
      <p style="color: var(--text-secondary); margin: 15px 0;">${course.longDescription}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0; background: var(--secondary-color); padding: 15px; border-radius: 8px;">
        <div>
          <span style="font-size: 24px; font-weight: bold; color: var(--primary-color);">$${course.price}</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 14px; color: var(--text-secondary);">⭐ ${course.rating} (${course.students} طالب)</span>
          <p style="color: var(--text-secondary); font-size: 12px;">المستوى: ${levelText}</p>
        </div>
      </div>
      <div style="background: var(--secondary-color); padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>المدرس:</strong> ${course.instructor}</p>
        <p><strong>السلسلة:</strong> ${course.series}</p>
        <p><strong>عدد الدروس:</strong> ${course.lessons}</p>
        <p><strong>المدة:</strong> ${course.duration} ساعة</p>
      </div>
    </div>

    <div class="progress-tracker">
      <h3 style="margin-bottom: 15px;">تتبع التقدم</h3>
      ${progressHTML}
    </div>

    <div class="action-buttons">
      <button class="btn btn-primary" onclick="addToCart(${course.id})">أضف إلى السلة</button>
      <button class="btn btn-secondary" onclick="rateCourse(${course.id})">تقيّم الدورة</button>
      ${certificateBtn}
      <button class="btn btn-secondary" onclick="closeCourseModal()">إغلاق</button>
    </div>
  `;

  modal.classList.add("show");
}

function closeCourseModal() {
  document.getElementById("courseModal").classList.remove("show");
}
// اضافة الدورة الي السلة
function addToCart(courseId) {
  const course = coursesData.find((c) => c.id === courseId);
  const existingItem = cart.find((item) => item.id === courseId);

  if (existingItem) {
    showCustomAlert("هذه الدورة موجودة بالفعل في السلة");
    return;
  }
  cart.push({
    id: course.id,
    title: course.title,
    price: course.price,
    type: "course",
  });

  saveCart();
  updateCartUI();
  showCustomAlert("تمت إضافة الدورة إلى السلة");
  closeCourseModal();
}

function toggleCart(e) {
  if (e) e.preventDefault();
  document.getElementById("cartSidebar").classList.toggle("show");
}
// تحديث واجهة السلة
function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");

  cartCount.textContent = cart.length;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">السلة فارغة</p>';
    cartTotal.textContent = "0";
    return;
  }

  let total = 0;
  cartItems.innerHTML = cart
    .map((item, index) => {
      total += item.price;
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.title}</h4>
            <p>$${item.price}</p>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart(${index})">حذف</button>
        </div>
      `;
    })
    .join("");

  cartTotal.textContent = total;
}
// حذف عنصر من السلة
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved) {
    cart = JSON.parse(saved);
    updateCartUI();
  }
}

function checkout() {
  if (cart.length === 0) {
    showCustomAlert("السلة فارغة");
    return;
  }

  const modal = document.getElementById("checkoutModal");
  const checkoutContent = document.getElementById("checkoutContent");

  let total = 0;
  const itemsHTML = cart
    .map((item) => {
      total += item.price;
      return `<div class="checkout-item">
        <span>${item.title}</span>
        <span>$${item.price}</span>
      </div>`;
    })
    .join("");

  const tax = Math.round(total * 0.15 * 100) / 100;
  const finalTotal = total + tax;

  checkoutContent.innerHTML = `
    <div class="checkout-items">${itemsHTML}</div>
    <div class="checkout-summary">
      <div class="summary-row">
        <span>الإجمالي:</span>
        <span>$${total}</span>
      </div>
      <div class="summary-row">
        <span>الضريبة (15%):</span>
        <span>$${tax}</span>
      </div>
      <div class="summary-row total">
        <span>المجموع النهائي:</span>
        <span>$${finalTotal}</span>
      </div>
    </div>
    <button class="btn btn-primary" style="width: 100%;" onclick="openPaymentMethods()">إكمال الدفع</button>
  `;

  modal.classList.add("show");
}

// عرض خيرات الدفع
function openPaymentMethods() {
  const modal = document.createElement("div");
  modal.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.6);
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
  `;

  modal.innerHTML = `
    <div style="background:#fff;width:90%;max-width:500px;border-radius:12px;padding:20px;direction:rtl">
      <h3 style="margin-bottom:15px;color:var(--primary-color)">اختر طريقة الدفع</h3>

      <button class="btn btn-secondary" style="width:100%;margin-bottom:8px" onclick="payByCard()">💳 بطاقة ائتمان</button>
      <button class="btn btn-secondary" style="width:100%;margin-bottom:8px" onclick="payByBank()">🏦 تحويل بنكي</button>
      <button class="btn btn-secondary" style="width:100%;margin-bottom:8px" onclick="payByWallet()">📱 محفظة رقمية</button>
      <button class="btn btn-secondary" style="width:100%" onclick="payByVodafone()">📞 فودافون كاش</button>
    </div>
  `;

  modal.onclick = (e) => e.target === modal && modal.remove();
  document.body.appendChild(modal);
}

//addToCart(courseId)
function completePayment() {
  if (userRole === "student") {
    cart.forEach((item) => {
      // ✅ لو العنصر دورة
      if (item.type === "course") {
        if (!userCourses.includes(item.id)) {
          userCourses.push(item.id);
        }
      }

      // ✅ لو العنصر كتاب
      if (item.type === "book") {
        const book = booksData.find((b) => b.id === item.id);

        if (book && !userPurchasedBooks.find((b) => b.id === book.id)) {
          userPurchasedBooks.push({
            id: book.id,
            title: book.title,
            author: book.author,
            fileUrl: book.fileUrl,
          });
        }
      }
    });
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const totalPayment = subtotal + tax;

  showCustomAlert(`تم الدفع بنجاح! المجموع: $${totalPayment}`);

  //alert(`تم الدفع بنجاح! المجموع: $${totalPayment}`)

  cart = [];
  saveCart();
  updateCartUI();

  document.getElementById("checkoutModal").classList.remove("show");
  toggleCart();
}

// حساب المجموع النهائي
function savePurchasedBooks() {
  localStorage.setItem(
    "userPurchasedBooks",
    JSON.stringify(userPurchasedBooks),
  );
}

function loadPurchasedBooks() {
  const saved = localStorage.getItem("userPurchasedBooks");
  if (saved) userPurchasedBooks = JSON.parse(saved);
}

function getFinalTotal() {
  document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    loadPurchasedBooks();
  });
}

function payByCard() {
  showPaymentForm(`
    <!-- Label رقم البطاقة -->
    <label style="display:block;margin-bottom:5px;color:#555">
      اكتب رقم البطاقة الائتمانية
    </label>

    <input
      id="cardNumber"
      value="4111 1111 1111 1111"
      style="
        width:100%;
        padding:10px;
        margin-bottom:15px;
        color:#999;
      "
      onfocus="clearFakeCardNumber()"
      onblur="restoreFakeCardNumber()"
    >

    <!-- Label الرقم السري -->
    <label style="display:block;margin-bottom:5px;color:#555">
      اكتب الرقم السري (CVV)
    </label>

    <input
      id="cardPassword"
      type="password"
      placeholder="CVV"
      style="
        width:100%;
        padding:10px;
        margin-bottom:20px;
      "
    >

    <button class="btn btn-primary" onclick="finalizeCardPayment()">
      إكمال الدفع
    </button>
  `);
}

function clearFakeCardNumber() {
  const input = document.getElementById("cardNumber");
  if (input.value === "4111 1111 1111 1111") {
    input.value = "";
    input.style.color = "#000";
  }
}

function restoreFakeCardNumber() {
  const input = document.getElementById("cardNumber");
  if (input.value.trim() === "") {
    input.value = "4111 1111 1111 1111";
    input.style.color = "#999";
  }
}

function finalizeCardPayment() {
  const card = document.getElementById("cardNumber").value.trim();
  const pass = document.getElementById("cardPassword").value.trim();

  if (!card || card === "4111 1111 1111 1111" || !pass) {
    showCustomAlert("من فضلك أدخل بيانات البطاقة بشكل صحيح");
    return;
  }

  const total = getFinalTotal();

  completePayment();
  showCustomAlert(`تم خصم مبلغ $${total} من بطاقتك الائتمانية بنجاح`);
}

function payByBank() {
  showPaymentForm(`
    <p>حوّل المبلغ إلى الحساب:</p>
    <strong>EG123456789</strong>

    <!-- بوكس رقم الحساب المُحوِّل -->
    <label style="display:block;margin-top:15px;margin-bottom:5px;color:#555">
      اكتب رقم الحساب الذي سيتم التحويل منه
    </label>

    <input
      id="fromAccountNumber"
      value="مثال: EG987654321"
      style="
        width:100%;
        padding:10px;
        margin-bottom:15px;
        color:#999;
      "
      onfocus="clearFakeFromAccount()"
      onblur="restoreFakeFromAccount()"
    >

    <input type="file" accept="image/*" id="bankReceipt" style="display:none">

    <button id="uploadBankBtn" class="btn btn-secondary" style="margin:15px 0">
      📤 رفع صورة إثبات الدفع
    </button>
    

    <p id="bankFileName" style="color:green;font-size:14px"></p>

    <button class="btn btn-primary" onclick="finalizeBankPayment()">
      إكمال الدفع
    </button>
  `);

  const uploadBtn = document.getElementById("uploadBankBtn");
  const fileInput = document.getElementById("bankReceipt");
  const fileName = document.getElementById("bankFileName");

  uploadBtn.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      fileName.textContent = "✔ تم رفع إثبات الدفع بنجاح";
      showCustomAlert("تم رفع إثبات الدفع بنجاح");
    }
  };
}

function clearFakeFromAccount() {
  const input = document.getElementById("fromAccountNumber");
  if (input.value === "مثال: EG987654321") {
    input.value = "";
    input.style.color = "#000";
  }
}

function restoreFakeFromAccount() {
  const input = document.getElementById("fromAccountNumber");
  if (input.value.trim() === "") {
    input.value = "مثال: EG987654321";
    input.style.color = "#999";
  }
}

function finalizeBankPayment() {
  const total = getFinalTotal();

  // إتمام الدفع
  completePayment();

  // ✅ إغلاق واجهة الدفع تلقائيًا
  setTimeout(() => {
    document.getElementById("checkoutModal").classList.remove("show");
  }, 300);
  showCustomAlert(`تم الدفع بنجاح عن طريق التحويل البنكي بقيمة $${total}`);

  //alert(`تم الدفع بنجاح عن طريق التحويل البنكي بقيمة $${total}`);
}

function payByWallet() {
  showPaymentForm(`
    <p>حوّل المبلغ إلى المحفظة الرقمية:</p>
    <strong>Wallet-ID-98765</strong>

    <!-- بوكس رقم الحساب المُحوِّل -->
    <label style="display:block;margin-top:15px;margin-bottom:5px;color:#555">
      اكتب رقم الحساب اللي هتحول منه
    </label>

    <input
      id="fromAccountWallet"
      value="مثال: Wallet-ID-98765"
      style="
        width:100%;
        padding:10px;
        margin-bottom:15px;
        color:#999;
      "
      onfocus="clearFakeFromAccountWallet()"
      onblur="restoreFakeFromAccountWallet()"
    >

    <!-- بوكس رقم المحفظة المُحوِّلة -->
    <label style="display:block;margin-top:5px;margin-bottom:5px;color:#555">
      اكتب رقم المحفظة التي سيتم التحويل منها
    </label>

    <input
      id="fromWalletNumber"
      value="مثال: 01012345678"
      style="
        width:100%;
        padding:10px;
        margin-bottom:15px;
        color:#999;
      "
      onfocus="clearFakeFromWallet()"
      onblur="restoreFakeFromWallet()"
    >

    <input type="file" accept="image/*" id="walletReceipt" style="display:none">

    <button id="uploadWalletBtn" class="btn btn-secondary" style="margin:15px 0">
      📤 رفع صورة إثبات الدفع
    </button>

    <p id="walletFileName" style="color:green;font-size:14px"></p>

    <button class="btn btn-primary" onclick="finalizeWalletPayment()">
      إكمال الدفع
    </button>
  `);

  const uploadBtn = document.getElementById("uploadWalletBtn");
  const fileInput = document.getElementById("walletReceipt");
  const fileName = document.getElementById("walletFileName");

  uploadBtn.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      fileName.textContent = "✔ تم رفع الإثبات بنجاح";
      showCustomAlert("تم رفع الإثبات بنجاح");
      //alert("تم رفع الإثبات بنجاح");
    }
  };
}

function finalizeWalletPayment() {
  const total = getFinalTotal();

  // تنفيذ نفس منطق الدفع العادي
  completePayment();

  // إغلاق نافذة الدفع
  document.getElementById("checkoutModal").classList.remove("show");

  showCustomAlert(`تم الدفع بنجاح عن طريق المحفظة الرقمية بقيمة $${total}`);

  //alert(`تم الدفع بنجاح عن طريق المحفظة الرقمية بقيمة $${total}`);
}

function clearFakeFromAccountWallet() {
  const input = document.getElementById("fromAccountWallet");
  if (input.value === "مثال: Wallet-ID-98765") {
    input.value = "";
    input.style.color = "#000";
  }
}

function restoreFakeFromAccountWallet() {
  const input = document.getElementById("fromAccountWallet");
  if (input.value.trim() === "") {
    input.value = "مثال: Wallet-ID-98765";
    input.style.color = "#999";
  }
}

function clearFakeFromWallet() {
  const input = document.getElementById("fromWalletNumber");
  if (input.value === "مثال: 01012345678") {
    input.value = "";
    input.style.color = "#000";
  }
}

function restoreFakeFromWallet() {
  const input = document.getElementById("fromWalletNumber");
  if (input.value.trim() === "") {
    input.value = "مثال: 01012345678";
    input.style.color = "#999";
  }
}

function payByVodafone() {
  showPaymentForm(`
    <p>ابعت المبلغ على الرقم:</p>
    <strong style="color:red">01093397961</strong>

    <!-- بوكس رقم الموبايل المُحوِّل -->
    <label style="display:block;margin-top:15px;margin-bottom:5px;color:#555">
      اكتب رقم الموبايل اللي هتحول منه
    </label>

    <input
      id="fromVodafoneNumber"
      value="مثال: 01012345678"
      style="
        width:100%;
        padding:10px;
        margin-bottom:15px;
        color:#999;
      "
      onfocus="clearFakeFromVodafone()"
      onblur="restoreFakeFromVodafone()"
    >

    <input type="file" accept="image/*" id="vodafoneReceipt" style="display:none">

    <button id="uploadVodafoneBtn" class="btn btn-secondary" style="margin:15px 0">
      📤 رفع صورة إثبات الدفع
    </button>

    <p id="vodafoneFileName" style="color:green;font-size:14px"></p>

    <button class="btn btn-primary" onclick="finalizeVodafonePayment()">
      إكمال الدفع
    </button>
  `);

  const uploadBtn = document.getElementById("uploadVodafoneBtn");
  const fileInput = document.getElementById("vodafoneReceipt");
  const fileName = document.getElementById("vodafoneFileName");

  // فتح الملفات
  uploadBtn.onclick = () => fileInput.click();

  // اختيار الصورة (شكلي فقط)
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      fileName.textContent = "✔ تم رفع الإثبات بنجاح";
      showCustomAlert("تم رفع إثبات الدفع بنجاح");
      //alert("تم رفع إثبات الدفع بنجاح");
    }
  };
}

function finalizeVodafonePayment() {
  const total = getFinalTotal();

  // إتمام الدفع
  completePayment();

  // إغلاق واجهة الدفع
  document.getElementById("checkoutModal").classList.remove("show");

  showCustomAlert(`تم الدفع بنجاح عن طريق فودافون كاش بقيمة $${total}`);

  //alert(`تم الدفع بنجاح عن طريق فودافون كاش بقيمة $${total}`);
}

function showPaymentForm(content) {
  const modal = document.createElement("div");
  modal.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.6);
    z-index:9999;
    display:flex;
    align-items:center;
    justify-content:center;
  `;

  modal.innerHTML = `
    <div style="background:#fff;width:90%;max-width:450px;border-radius:12px;padding:20px;direction:rtl">
      ${content}
    </div>
  `;

  modal.onclick = (e) => e.target === modal && modal.remove();
  document.body.appendChild(modal);
}

function getFinalTotal() {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  return Math.round((subtotal + tax) * 100) / 100;
}

function finalizePayment(type) {
  let methodText = {
    card: "بطاقتك الائتمانية",
    bank: "التحويل البنكي",
    wallet: "المحفظة الرقمية",
    vodafone: "فودافون كاش",
  }[type];

  completePayment();
  showCustomAlert(`تم خصم المبلغ بنجاح عبر ${methodText}`);
  //alert(`تم خصم المبلغ بنجاح عبر ${methodText}`)
}

////////////////////////////

function closeCheckout() {
  document.getElementById("checkoutModal").classList.remove("show");
}

function rateCourse(courseId) {
  if (userRole !== "student") {
    showCustomAlert("فقط الطلاب يمكنهم تقييم الدورات");
    //alert("فقط الطلاب يمكنهم تقييم الدورات")
    return;
  }

  const rating = prompt("قيّم الدورة من 1 إلى 5:");
  if (rating && rating >= 1 && rating <= 5) {
    showCustomAlert(`شكراً لتقييمك! لقد أعطيت الدورة ${rating} نجوم`);
    //alert(`شكراً لتقييمك! لقد أعطيت الدورة ${rating} نجوم`)
  }
}

function showLogin(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById("authModal");
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("registerForm").classList.add("hidden");
  modal.classList.add("show");
}

function showRegister(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById("authModal");
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
  modal.classList.add("show");
}

function switchToLogin(e) {
  e.preventDefault();
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

function switchToRegister(e) {
  e.preventDefault();
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.remove("hidden");
}

function handleLogin(e) {
  e.preventDefault();
  isLoggedIn = true;
  userRole = "student";
  document.querySelector(".btn-login").textContent = "تسجيل خروج";
  document.querySelector(".btn-login").onclick = (e) => {
    e.preventDefault();
    handleLogout();
  };
  document.querySelector(".profile-toggle").classList.remove("hidden");
  document.querySelector(".dashboard-link").classList.remove("hidden");
  document.getElementById("profileName").textContent = userData.name;
  document.getElementById("profileEmail").textContent = userData.email;
  document.getElementById("profileImage").innerHTML =
    `<img src="${userData.image}" alt="صورة البروفيل">`;
  closeAuth();
  alert("تم تسجيل الدخول بنجاح!");
}

function handleRegister(e) {
  e.preventDefault();

  // 🔍 جلب الإيميل والباسورد من فورم التسجيل
  const email = document
    .querySelector('#registerForm input[type="email"]')
    .value.trim();
  const password = document.querySelectorAll(
    '#registerForm input[type="password"]',
  )[0].value;

  // ✅ التحقق من صحة الإيميل
  const emailRegex = /^[a-zA-Z0-9._%+-]{3,}@gmail\.com$/;
  if (!emailRegex.test(email)) {
    showCustomAlert("❌ من فضلك أدخل بريد إلكتروني صحيح");
    return;
  }

  // ✅ التحقق من طول كلمة المرور
  if (password.length < 8) {
    showCustomAlert("❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    return;
  }

  // ⬇️ الكود الأصلي كما هو بدون أي تغيير
  const role = document.querySelector('input[name="role"]:checked').value;
  userRole = role;
  isLoggedIn = true;
  document.querySelector(".btn-login").textContent = "تسجيل خروج";
  document.querySelector(".profile-toggle").classList.remove("hidden");
  document.querySelector(".dashboard-link").classList.remove("hidden");
  document.getElementById("profileName").textContent = userData.name;
  document.getElementById("profileEmail").textContent = userData.email;
  closeAuth();
  showCustomAlert(
    `تم إنشاء حسابك بنجاح كـ ${role === "student" ? "طالب" : "معلم"}!`,
  );
}

function handleOAuth(provider) {
  const role = document.querySelector('input[name="role"]:checked').value;
  userRole = role;
  isLoggedIn = true;
  document.querySelector(".btn-login").textContent = "تسجيل خروج";
  document.querySelector(".profile-toggle").classList.remove("hidden");
  document.querySelector(".dashboard-link").classList.remove("hidden");
  closeAuth();
  showCustomAlert(
    `تم تسجيل الدخول عبر ${provider === "facebook" ? "فيسبوك" : "جوجل"} بنجاح!`,
  );
  //alert(`تم تسجيل الدخول عبر ${provider === "facebook" ? "فيسبوك" : "جوجل"} بنجاح!`)
}

function closeAuth() {
  document.getElementById("authModal").classList.remove("show");
}

function showDashboard(e) {
  if (e) e.preventDefault();
  if (!isLoggedIn) {
    showCustomAlert("يجب تسجيل الدخول أولاً");
    //alert("يجب تسجيل الدخول أولاً")
    showLogin();
    return;
  }

  const modal = document.getElementById("dashboardModal");
  const dashboardContent = document.getElementById("dashboardContent");

  if (userRole === "student") {
    dashboardContent.innerHTML = `
   <h2 style="margin-bottom: 30px; color: var(--primary-color); display: flex; align-items: center; gap: 10px;">
     <span>📊</span> لوحة تحكم الطالب
   </h2>
   <div class="dashboard-content">
     <div class="dashboard-section">
       <h3>📚 دوراتي المشتراة</h3>
       <p>إجمالي الدورات: <strong style="color: var(--primary-color); font-size: 18px;">${userCourses.length}</strong></p>
       <div style="margin-top: 15px;">
         ${userCourses.length === 0 ? '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">لم تشترك في أي دورات بعد</p>' : userCourses.map((c) => `<div style="padding: 10px 15px; background: var(--secondary-color); border-radius: 6px; margin: 8px 0; border-right: 4px solid var(--primary-color); font-weight: 500;">✓ ${c}</div>`).join("")}
       </div>
     </div>
     <div class="dashboard-section">
       <h3>📈 إحصائياتي</h3>
       <div style="padding: 15px; background: var(--card-bg); border-radius: 8px; margin-top: 10px;">
         <p style="margin-bottom: 10px;"><span style="color: var(--text-secondary);">إجمالي الساعات:</span> <strong style="color: var(--primary-color);">${Math.floor(Math.random() * 100)}</strong></p>
         <p style="margin-bottom: 10px;"><span style="color: var(--text-secondary);">معدل التقدم:</span> <strong style="color: var(--success-color);">${Math.floor(Math.random() * 100)}%</strong></p>
         <p><span style="color: var(--text-secondary);">الشهادات المكتسبة:</span> <strong style="color: var(--primary-color);">${Math.floor(Math.random() * 10)}</strong></p>
       </div>
     </div>
   </div>
   <button class="btn btn-secondary" onclick="closeDashboard()" style="width: 100%; margin-top: 20px;">إغلاق</button>
 `;
    //openStudentPurchasesChoice()
  } else if (userRole === "teacher") {
    openTeacherChoice();
  }

  modal.classList.add("show");
}
/**  تحكم المشتريات  */
function openStudentPurchasesChoice() {
  // إزالة المودال القديم لو موجود
  const oldModal = document.getElementById("studentPurchasesModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "studentPurchasesModal";
  modal.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.55);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:99999;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="
      background:#fff;
      width:95%;
      max-width:520px;
      border-radius:18px;
      padding:30px 25px;
      position:relative;
      box-shadow:0 25px 60px rgba(0,0,0,.25);
      animation:scaleIn .25s ease
    ">

      <!-- زر الإغلاق -->
      <button onclick="closeStudentPurchasesChoice()"
        style="
          position:absolute;
          top:15px;
          left:15px;
          width:38px;
          height:38px;
          border-radius:50%;
          border:none;
          background:#f3f4f6;
          font-size:18px;
          cursor:pointer
        ">✖</button>

      <!-- العنوان -->
      <h2 style="
        text-align:center;
        color:var(--primary-color);
        margin-bottom:10px;
        font-size:26px
      ">
        🛒 مشترياتي
      </h2>

      <p style="
        text-align:center;
        color:#6b7280;
        margin-bottom:30px;
        font-size:14px
      ">
        اختر ما تريد عرضه من مشترياتك
      </p>

      <!-- كارت الدورات -->
      <div
        onclick="showPurchases(); closeStudentPurchasesChoice();"
        style="
          cursor:pointer;
          border:2px solid var(--primary-color);
          border-radius:14px;
          padding:18px;
          display:flex;
          align-items:center;
          gap:15px;
          margin-bottom:15px;
          transition:.25s;
        "
        onmouseenter="this.style.background='#f0f6ff'"
        onmouseleave="this.style.background='#fff'"
      >
        <div style="font-size:34px">📚</div>
        <div>
          <h4 style="margin:0;color:#111">الدورات المشترك بها</h4>
          <p style="margin:5px 0 0;color:#6b7280;font-size:13px">
            متابعة الدورات والفيديوهات
          </p>
        </div>
      </div>

      <!-- كارت الكتب -->
<div
  onclick="openMyBooks(); setTimeout(closeStudentPurchasesChoice, 50);"
  style="
    cursor:pointer;
    border:2px solid #e5e7eb;
    border-radius:14px;
    padding:18px;
    display:flex;
    align-items:center;
    gap:15px;
    transition:.25s;
  "
  onmouseenter="this.style.background='#f9fafb'"
  onmouseleave="this.style.background='#fff'"
>
  <div style="font-size:34px">📘</div>
  <div>
    <h4 style="margin:0;color:#111">الكتب المشتراة</h4>
    <p style="margin:5px 0 0;color:#6b7280;font-size:13px">
      قراءة وتحميل الكتب
    </p>
  </div>
</div>

  `;

  document.body.appendChild(modal);
}

function openMyBooks() {
  // لو في مودال قديم امسحه
  const oldModal = document.getElementById("myBooksModal");
  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");
  modal.id = "myBooksModal";
  modal.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.65);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:99999;
  `;

  let booksHTML = "";

  if (!userPurchasedBooks || userPurchasedBooks.length === 0) {
    booksHTML = `
      <p style="text-align:center;color:#6b7280;padding:40px">
        لم تقم بشراء أي كتب بعد
      </p>
    `;
  } else {
    booksHTML = `
      <div style="
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
        gap:18px
      ">
        ${userPurchasedBooks
          .map(
            (book) => `
          <div style="
            background:#fff;
            border-radius:14px;
            padding:16px;
            box-shadow:0 10px 25px rgba(0,0,0,.08);
            display:flex;
            flex-direction:column
          ">
            <h4 style="margin:0 0 6px">${book.title}</h4>
            <p style="color:#6b7280;font-size:13px;margin-bottom:12px">
              المؤلف: ${book.author || "غير معروف"}
            </p>

            <button class="btn btn-primary"
              style="margin-bottom:8px"
              onclick="openBook('${book.fileUrl}')">
              📖 فتح الكتاب
            </button>

            <button class="btn btn-outline-primary"
              onclick="saveBook('${book.fileUrl}', '${book.title}')">
              💾 حفظ الكتاب
            </button>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  modal.innerHTML = `
    <div style="
      background:#fff;
      width:95%;
      max-width:900px;
      max-height:90vh;
      overflow:auto;
      border-radius:18px;
      padding:25px;
      position:relative
    ">

      <button onclick="closeMyBooksModal()"
        style="
          position:absolute;
          top:15px;
          left:15px;
          border:none;
          background:#f3f4f6;
          width:36px;
          height:36px;
          border-radius:50%;
          cursor:pointer;
          font-size:18px
        ">✖</button>

      <h2 style="
        text-align:center;
        color:var(--primary-color);
        margin-bottom:25px
      ">
        📘 كتبي المشتراة
      </h2>

      ${booksHTML}

    </div>
  `;

  document.body.appendChild(modal);
}

function closeMyBooksModal() {
  const modal = document.getElementById("myBooksModal");
  if (modal) modal.remove();
}

function openBook(fileUrl) {
  window.open(fileUrl, "_blank");
}

function saveBook(fileUrl, title) {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = title + ".pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function closeStudentPurchasesChoice() {
  const modal = document.getElementById("studentPurchasesModal");
  if (modal) modal.remove();
}

function openMyCourses() {
  showStudentCourses();
}

//completePayment()
/******      اضافه الدورات     */
function openAddCourse() {
  const dashboardContent = document.getElementById("dashboardContent");

  dashboardContent.innerHTML = `
    <div class="dashboard-content">
      <div class="dashboard-section">
        <h3>➕ إضافة دورة جديدة</h3>

        <div class="add-course-form">
          <input type="text" placeholder="اسم الدورة" id="courseTitle"
            style="padding: 10px; margin-bottom: 10px;">

          <input type="number" placeholder="السعر" id="coursePrice"
            style="padding: 10px; margin-bottom: 10px;">

          <select id="courseCategory"
            style="padding: 10px; border: 1px solid var(--border-color);
                   border-radius: 6px; background: var(--card-bg);
                   color: var(--text-primary); margin-bottom: 10px;">
            <option value="programming">برمجة</option>
            <option value="design">تصميم جرافيك</option>
            <option value="languages">لغات</option>
            <option value="development">تنمية ذاتية</option>
            <option value="trading">تداول</option>
          </select>

          <button class="btn btn-primary"
            onclick="addNewCourse()"
            style="margin-bottom: 10px;">
            إضافة الدورة
          </button>
        </div>
      </div>

      <div class="dashboard-section">
        <h3>📊 إحصائياتي</h3>
        <div style="padding: 15px; background: var(--card-bg);
                    border-radius: 8px; margin-top: 10px;">
          <p style="margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">
              إجمالي الطلاب:
            </span>
            <strong style="color: var(--primary-color);">
              ${Math.floor(Math.random() * 5000)}
            </strong>
          </p>

          <p style="margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">
              الإيرادات:
            </span>
            <strong style="color: var(--success-color);">
              $${Math.floor(Math.random() * 50000)}
            </strong>
          </p>

          <p>
            <span style="color: var(--text-secondary);">
              الدورات المنشورة:
            </span>
            <strong style="color: var(--primary-color);">
              ${userTeacherCourses.length}
            </strong>
          </p>
        </div>
      </div>
    </div>

    <button class="btn btn-secondary"
      onclick="closeDashboard()"
      style="width: 100%; margin-top: 20px;">
      إغلاق
    </button>
  `;
}

// نعمل input فيديو مخفي ديناميكيًا
const hiddenVideoInput = document.createElement("input");
hiddenVideoInput.type = "file";
hiddenVideoInput.accept = "video/*";
hiddenVideoInput.style.display = "none";
document.body.appendChild(hiddenVideoInput);

// نراقب الضغط على علامة + داخل h3
document.addEventListener("click", function (e) {
  const target = e.target;

  // لو ضغط على h3 اللي فيها ➕ إضافة دورة جديدة
  if (
    target.tagName === "H3" &&
    target.textContent.includes("➕") &&
    target.textContent.includes("إضافة دورة جديدة")
  ) {
    hiddenVideoInput.click();
  }
});

// بعد اختيار الفيديو
hiddenVideoInput.addEventListener("change", function () {
  const file = hiddenVideoInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("video/")) {
    showCustomAlert("من فضلك اختر ملف فيديو فقط");
    //alert("من فضلك اختر ملف فيديو فقط");
    hiddenVideoInput.value = "";
    return;
  }
  selectedCourseVideo = URL.createObjectURL(file);

  console.log("Video selected:", file.name);
  console.log("Size:", (file.size / 1024 / 1024).toFixed(2), "MB");

  // هنا تقدر:
  // - ترفعه للسيرفر
  // - تخزنه مؤقتًا
  // - تربطه بإضافة الدورة
});

let selectedCourseImage = null;

// input صورة مخفي
const hiddenImageInput = document.createElement("input");
hiddenImageInput.type = "file";
hiddenImageInput.accept = "image/*";
hiddenImageInput.style.display = "none";
document.body.appendChild(hiddenImageInput);

hiddenImageInput.addEventListener("change", function () {
  const file = hiddenImageInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showCustomAlert("من فضلك اختر صورة فقط");
    //alert("من فضلك اختر صورة فقط");
    hiddenImageInput.value = "";
    return;
  }

  // تخزين الصورة مؤقتًا (URL)
  selectedCourseImage = URL.createObjectURL(file);
});

function openCourseDescriptionModal(onConfirm) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.zIndex = "9999";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";

  overlay.innerHTML = `
    <div style="
      background:#fff;
      width:90%;
      max-width:460px;
      padding:20px;
      border-radius:10px;
      direction:rtl;
      text-align:right;
    ">
      <h3 style="margin-bottom:10px;">📝 بيانات الدورة</h3>

      <textarea id="courseDescriptionInput"
        placeholder="اكتب وصفًا مختصرًا للدورة..."
        style="
          width:100%;
          height:90px;
          padding:10px;
          border-radius:6px;
          border:1px solid #ccc;
          margin-bottom:12px;
        "></textarea>

      <select id="courseLevelSelect"
        style="
          width:100%;
          padding:10px;
          border-radius:6px;
          border:1px solid #ccc;
          margin-bottom:15px;
        ">
        <option value="">اختر مستوى الدورة</option>
        <option value="beginner">مبتدئ</option>
        <option value="intermediate">متوسط</option>
        <option value="advanced">متقدم</option>
      </select>

      <button class="btn btn-primary" style="width:100%;" id="confirmCourseData">
        تأكيد البيانات
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("confirmCourseData").onclick = function () {
    const desc = document.getElementById("courseDescriptionInput").value.trim();
    const level = document.getElementById("courseLevelSelect").value;

    if (!desc) {
      showCustomAlert("من فضلك أدخل وصف الدورة");
      //alert("من فضلك أدخل وصف الدورة");
      return;
    }

    if (!level) {
      showCustomAlert("من فضلك اختر مستوى الدورة");
      //alert("من فضلك اختر مستوى الدورة");
      return;
    }

    selectedCourseDescription = desc;
    selectedCourseLevel = level;

    overlay.remove();
    onConfirm(); // يكمل addNewCourse
  };
}

/**************  اضافه كتاب   */
function openTeacherChoice() {
  const modal = document.getElementById("dashboardModal");
  const dashboardContent = document.getElementById("dashboardContent");

  dashboardContent.innerHTML = `
    <h2 style="margin-bottom:20px;color:var(--primary-color)">اختر ما تريد إضافته</h2>

    <div style="display:flex;gap:20px;flex-direction:column">

      <button class="btn btn-primary" onclick="openAddCourse()">
        ➕ إضافة دورة
      </button>

      <button class="btn btn-secondary" onclick="openAddBook()">
        📘 إضافة كتاب
      </button>

    </div>
  `;

  modal.classList.add("show");
}

function openAddBook() {
  const dashboardContent = document.getElementById("dashboardContent");

  dashboardContent.innerHTML = `
    <h2 style="margin-bottom:20px;color:var(--primary-color)">📘 إضافة كتاب</h2>

    <div class="add-course-form">

      <label>اسم الكتاب</label>
      <input id="bookTitle" placeholder="اكتب اسم الكتاب" style="margin-bottom:10px">

      <label>اسم المؤلف</label>
      <input id="bookAuthor" placeholder="اكتب اسم المؤلف" style="margin-bottom:10px">

      <label>سعر الكتاب</label>
      <input id="bookPrice" type="number" placeholder="اكتب سعر الكتاب" style="margin-bottom:10px">

      <label>القسم</label>
      <select id="bookCategoryAdd" style="margin-bottom:15px">
  
          <option value="برمجة">برمجة</option>
          <option value="لغات">لغات</option>
          <option value="تداول">تداول</option>
          <option value="تنمية ذاتية">تنمية ذاتية</option>
          <option value="ريادة أعمال">ريادة أعمال</option>
          <option value="تصميم جرافيك">تصميم جرافيك</option>

      </select>

      <button class="btn btn-primary" onclick="handleAddBook()">
        إضافة الكتاب
      </button>

    </div>
  `;
}

function handleAddBook() {
  newBookTitle = document.getElementById("bookTitle").value;
  newBookAuthor = document.getElementById("bookAuthor").value;
  newBookPrice = document.getElementById("bookPrice").value;
  newBookCategory = document.getElementById("bookCategoryAdd").value;

  if (!newBookTitle || !newBookAuthor || !newBookPrice) {
    showCustomAlert("يرجى ملء جميع البيانات");
    //alert("يرجى ملء جميع البيانات")
    return;
  }

  // 1️⃣ اختيار ملف الكتاب
  if (!newBookFile) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".pdf";
    fileInput.onchange = () => {
      newBookFile = fileInput.files[0];
      showCustomAlert("تم اختيار ملف الكتاب، اختر صورة الغلاف");
      //alert("تم اختيار ملف الكتاب، اختر صورة الغلاف")
    };
    fileInput.click();
    return;
  }

  // 2️⃣ اختيار صورة الغلاف
  if (!newBookCover) {
    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";
    imageInput.onchange = () => {
      newBookCover = imageInput.files[0];
      showCustomAlert("اضغط إضافة الكتاب مرة أخرى للحفظ");
      //alert("اضغط إضافة الكتاب مرة أخرى للحفظ")
    };
    imageInput.click();
    return;
  }
  // إنشاء كائن الكتاب الجديد
  const newBook = {
    id: Date.now(), // ID فريد
    title: newBookTitle,
    author: newBookAuthor,
    category: newBookCategory,
    price: Number(newBookPrice),
    image: URL.createObjectURL(newBookCover), // صورة الغلاف
    fileUrl: URL.createObjectURL(newBookFile),
  };

  // إضافته فعليًا لقائمة الكتب
  booksData.unshift(newBook);

  // حل المشكلة 👇
  //document.getElementById("bookCategoryFilter").value = "all"
  const filterSelect = document.getElementById("bookCategory");
  if (filterSelect) {
    filterSelect.value = "all";
  }
  // إعادة رسم الكتب
  renderBooks();
  showCustomAlert("✅ تم إضافة الكتاب بنجاح");

  //alert("✅ تم إضافة الكتاب بنجاح")

  // تفريغ المتغيرات (جاهز لإضافة كتاب جديد)
  newBookTitle = "";
  newBookAuthor = "";
  newBookPrice = "";
  newBookCategory = "";
  newBookFile = null;
  newBookCover = null;
}

function createBooksSection() {
  if (document.getElementById("books")) return;

  const section = document.createElement("section");
  section.id = "books";
  section.className = "section-padding";
  section.style.background = "#f6f8fb";

  section.innerHTML = `
    <div style="max-width:1200px;margin:auto">

      <h1 style="
        text-align:center;
        font-size:32px;
        margin-bottom:10px;
        color:#1f2937
      ">جميع الكتب</h1>

      <p style="
        text-align:center;
        color:#6b7280;
        margin-bottom:35px
      ">اكتشف مجموعة واسعة من الكتب التعليمية</p>

      <!-- البحث -->
      <div style="
        display:flex;
        gap:10px;
        justify-content:center;
        flex-wrap:wrap;
        margin-bottom:20px
      ">
        <input
          id="bookSearch"
          placeholder="ابحث عن كتاب..."
          style="
            width:280px;
            padding:12px;
            border-radius:8px;
            border:1px solid #ddd
          "
        >

        <select id="bookCategory" style="
          padding:12px;
          border-radius:8px;
          border:1px solid #ddd
        ">
          <option value="all">جميع الفئات</option>


          <option value="برمجة">برمجة</option>
          <option value="لغات">لغات</option>
          <option value="تداول">تداول</option>
          <option value="تنمية ذاتية">تنمية ذاتية</option>
          <option value="ريادة أعمال">ريادة أعمال</option>
          <option value="تصميم جرافيك">تصميم جرافيك</option>
        </select>
      </div>

      <!-- الكتب -->
      <div id="booksGrid" style="
        display:grid;
        grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
        gap:20px
      "></div>

    </div>
  `;

  document.body.appendChild(section);

  document.getElementById("bookSearch").addEventListener("input", renderBooks);

  document
    .getElementById("bookCategory")
    .addEventListener("change", renderBooks);
}

function renderBooks() {
  createBooksSection();

  const grid = document.getElementById("booksGrid");
  const search = document.getElementById("bookSearch").value.toLowerCase();
  const category = document.getElementById("bookCategory")?.value || "all";

  grid.innerHTML = "";

  const filtered = booksData.filter((book) => {
    const matchTitle = book.title.toLowerCase().includes(search);
    const matchCategory = category === "all" || book.category === category;
    return matchTitle && matchCategory;
  });

  if (filtered.length === 0) {
    grid.innerHTML =
      "<p style='grid-column:1/-1;text-align:center;color:var(--text-secondary)'>لا توجد كتب مطابقة</p>";
    return;
  }

  // استخدام DocumentFragment بيسرع التحميل جداً لأنه بيضيف العناصر مرة واحدة للـ DOM
  const fragment = document.createDocumentFragment();

  filtered.forEach((book) => {
    const card = document.createElement("div");
    card.className = "course-card"; // استخدم نفس كلاس الكورسات عشان ياخد ستايل الوضع الليلي جاهز

    card.innerHTML = `
      <div class="course-image" style="background-image: url('${book.image}'); height:200px; background-size:cover; background-position:center;"></div>
      <div class="course-content">
        <span class="course-category-tag">${book.category}</span>
        <h3 style="margin:10px 0">${book.title}</h3>
        <p style="color:var(--text-secondary); font-size:14px">المؤلف: ${book.author}</p>
        <div class="course-footer" style="margin-top:15px; border-top:1px solid var(--border-color); padding-top:10px">
          <span class="course-price">$${book.price}</span>
          <button class="btn btn-primary" onclick="addBookToCart(${book.id})">🛒 السلة</button>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  });

  grid.appendChild(fragment);
}

function addBookToCart(bookId) {
  // ❗ منع الإضافة بدون تسجيل دخول
  if (!isLoggedIn) {
    showCustomAlert("يجب تسجيل الدخول أولاً لإضافة كتاب إلى السلة");
    showLogin();
    return;
  }

  const book = booksData.find((b) => b.id === bookId);
  const exists = cart.find((item) => item.id === bookId);

  if (exists) {
    showCustomAlert("هذا الكتاب موجود بالفعل في السلة");
    return;
  }

  cart.push({
    id: book.id,
    title: book.title,
    price: book.price,
    type: "book",
  });

  saveCart();
  updateCartUI();
  showCustomAlert("تمت إضافة الكتاب إلى السلة");
}

window.addEventListener("load", renderBooks);

// اضافة دورة جديدة 
function addNewCourse() {
  const title = document.getElementById("courseTitle").value;
  const price = document.getElementById("coursePrice").value;
  const category = document.getElementById("courseCategory").value;

  if (!selectedCourseImage) {
    hiddenImageInput.click();
    showCustomAlert("من فضلك اختر صورة للدورة أولًا");
    return;
  }

  if (!selectedCourseDescription || !selectedCourseLevel) {
    openCourseDescriptionModal(addNewCourse);
    return;
  }

  if (!title || !price) {
    showCustomAlert("يرجى ملء جميع الحقول");
    return;
  }

  const newCourse = {
    id: coursesData.length + 1,
    title: title,
    description: "دورة جديدة",
    longDescription: selectedCourseDescription,
    image: selectedCourseImage,
    video: selectedCourseVideo,
    price: Number.parseInt(price),
    rating: "4.5",
    instructor: userData.name,
    students: 0,
    lessons: 20,
    duration: 10,
    category: category,
    level: selectedCourseLevel,
    series: "New Series",
  };

  coursesData.push(newCourse);
  userTeacherCourses.push(title);
  showCustomAlert("تمت إضافة الدورة بنجاح!");
  loadCourses();
  closeDashboard();
}

/////////////////////////////////////

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

function closeDashboard() {
  document.getElementById("dashboardModal").classList.remove("show");
}
// طباعة الشهادة
function printCertificate(courseTitle, instructor, recipientName) {
  const displayName =
    recipientName && recipientName.trim().length > 0
      ? recipientName.trim()
      : userData && userData.name
        ? userData.name
        : userRole === "teacher"
          ? "Instructor"
          : "Student";

  const now = new Date();
  const dateEnglish = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeEnglish = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const serial = `SM-${now.getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;

  function escapeHtml(text) {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  //
  const logoUrl = userData && userData.logo ? userData.logo : "";

  const certificateHTML = `
  <!doctype html>
  <html lang="ar">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>شهادة - ${escapeHtml(courseTitle)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Great+Vibes&display=swap" rel="stylesheet">
    <style>
      
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
      @page { size: A4; margin: 0; }
      html,body{ height:100%; margin:0; padding:0; background:#f3f4f6; font-family:'Tajawal', Arial, sans-serif; direction:rtl; color:#0b1220; }
      .wrap{ display:flex; align-items:center; justify-content:center; padding:32px; background:#f3f4f6; }

      /* بطاقة الشهادة */
      .cert{
        width:100%; max-width:1120px;
        border-radius:12px;
        padding:40px;
        position:relative;
        overflow:visible;
        border:10px solid rgba(210,178,68,0.95);
        background: #ffffff;
        box-shadow: 0 20px 60px rgba(10,10,10,0.06);
      }

      /* تأثير ذهبي داخلي ناعم */
      .inner-line { position:absolute; inset:10px; border-radius:8px; pointer-events:none; box-shadow: inset 0 0 0 2px rgba(210,178,68,0.03); }

      .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; z-index:6; position:relative; }
      .logo { display:flex; gap:12px; align-items:center; }
      .logo img { width:72px; height:72px; object-fit:contain; border-radius:8px; background:transparent; }
      .title h3 { margin:0; color:#1b2937; font-size:18px; font-weight:800; }
      .title p { margin:0; color:#5b6b74; font-size:12px; }

      .body { text-align:center; padding:12px 24px; z-index:8; position:relative; }
      h1.title-main { margin:6px 0 6px; font-size:36px; color:#2b2f36; font-weight:900; letter-spacing:0.6px; }
      .subtitle { color:#6b7280; font-size:15px; margin-bottom:6px; }

      .recipient {
        display:inline-block; padding:14px 28px; border-radius:12px;
        background: linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01));
        font-size:34px; font-weight:800; color:#0b1220; margin:18px 0; letter-spacing:0.4px;
        border:1px solid rgba(0,0,0,0.04); position:relative; z-index:10;
      }

      .course { font-size:20px; font-weight:700; color:#2b2f36; margin-top:12px; }
      .sub { color:#6b7280; margin-top:10px; font-size:14px; }

      .meta { display:flex; justify-content:space-between; gap:12px; margin-top:34px; align-items:flex-end; z-index:10; position:relative; }
      .meta .left, .meta .right { display:flex; flex-direction:column; gap:6px; }
      .meta span { color:#5b6b74; font-size:13px; }

      .signature-area { display:flex; align-items:center; justify-content:flex-end; gap:18px; position:relative; }
      .sig-block { display:flex; flex-direction:column; align-items:flex-end; gap:6px; z-index:12; position:relative; }
      .sig-name { font-family:'Great Vibes', cursive; font-size:42px; color:#0b1220; }
      .sig-role { color:#5b6b74; font-size:12px; }

      .seal { position:absolute; right:170px; bottom:60px; width:150px; height:150px; z-index:9; opacity:0.45; transform: rotate(-6deg); pointer-events:none; filter: drop-shadow(0 6px 18px rgba(0,0,0,0.06)); }

      .print-btn { position:absolute; left:18px; top:16px; z-index:20; background:#fff; border:1px solid rgba(0,0,0,0.06); color:#111; padding:8px 12px; border-radius:8px; cursor:pointer; }
      .print-btn:hover { background:#f6f6f6; }

      @media print {
        html,body{ background: #fff; }
        .wrap { padding:0; }
        .cert { box-shadow: none; border-width:12px; border-radius:6px; margin:0; width:100%; max-width:unset; }
        .print-btn { display:none; }
      }

      @media (max-width:700px){
        .recipient{ font-size:28px; padding:10px 18px; }
        .logo img{ width:58px;height:58px;}
        .seal{ width:110px;height:110px; right:110px; bottom:36px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="cert" role="document" aria-label="شهادة إتمام">
        <button class="print-btn" onclick="window.print()">🖨️ Print</button>
        <div class="inner-line" aria-hidden="true"></div>

        <div class="header" role="banner">
          <div class="logo" aria-hidden="true">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="StudyMart logo (transparent)">` : `<div style="width:72px;height:72px;border-radius:8px;background:linear-gradient(135deg,#d4b94a,#b78f2a);display:flex;align-items:center;justify-content:center;color:#081226;font-weight:900">SM</div>`}
            <div class="title">
              <h3>StudyMart</h3>
              <p>منصة تعليمية متكاملة</p>
            </div>
          </div>
          <div class="serial" aria-label="المرجع">Reference: ${escapeHtml(serial)}</div>
        </div>

        <div class="body">
          <h1 class="title-main">شهادة إتمام الدورة</h1>
          <div class="subtitle">تُمنح هذه الشهادة لـ</div>

          <div class="recipient">${escapeHtml(displayName)}</div>

          <div class="subtitle" style="margin-top:12px">بعد إتمام الدورة بنجاح:</div>
          <div class="course">${escapeHtml(courseTitle)}</div>

          <div style="margin-top:10px; color:#5b6b74;">Instructor: <strong style="color:#2b2f36">${escapeHtml(instructor)}</strong></div>

          <div class="meta">
            <div class="left">
              <span>Creation Date: <strong>${escapeHtml(dateEnglish)}</strong></span>
              <span>Creation Time: <strong>${escapeHtml(timeEnglish)}</strong></span>
            </div>

            <div class="right" style="text-align:right;">
              <div class="signature-area" aria-hidden="true">
                <div class="sig-block">
                  <div class="sig-name">Eslam Adel Jadalrab</div>
                  <div class="sig-role">Founder & Content Curator - StudyMart</div>
                </div>

                <!-- seal (transparent behind signature) -->
                <div class="seal" aria-hidden="true">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Seal StudyMart">
                    <defs>
                      <radialGradient id="gseal" cx="50%" cy="35%">
                        <stop offset="0%" stop-color="#fffaf0"/>
                        <stop offset="45%" stop-color="#f7e6b8"/>
                        <stop offset="100%" stop-color="#c79b32"/>
                      </radialGradient>
                    </defs>
                    <g transform="translate(100,100)">
                      <circle r="86" fill="url(#gseal)" stroke="#b58522" stroke-width="3" opacity="0.95"/>
                      ${Array.from({ length: 12 })
                        .map(
                          (_, i) =>
                            `<path d="M0 -86 L5 -66 L18 -62 L6 -48 L12 -30 L0 -40 L-12 -30 L-6 -48 L-18 -62 L-5 -66 Z" transform="rotate(${i * 30})" fill="#f3d08a" opacity="0.55"></path>`,
                        )
                        .join("")}
                      <circle r="38" fill="transparent" stroke="#caa73f" stroke-width="2"/>
                      <text x="0" y="10" text-anchor="middle" font-family="Tajawal, Arial" font-weight="800" font-size="28" fill="#123a8a">SM</text>
                    </g>
                  </svg>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <script>
      window.onload = function() {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 350);
      };
    </script>
  </body>
  </html>
  `;
  const newWindow = window.open("", "_blank");
  newWindow.document.open();
  newWindow.document.write(certificateHTML);
  newWindow.document.close();
}

// html 2
const openSeo = document.getElementById("openSeo");
const overlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");

openSeo.addEventListener("click", function (e) {
  e.preventDefault();

  fetch("../assets/articles.html")
    .then((res) => res.text())
    .then((data) => {
      modalContent.innerHTML = data;
      overlay.style.display = "flex";
    });
});

// إغلاق عند الضغط خارج المحتوى
overlay.addEventListener("click", function (e) {
  if (e.target === overlay) {
    overlay.style.display = "none";
    modalContent.innerHTML = "";
  }
});

////////////////////////////////////////

window.onload = function () {
  window.scrollTo(0, 0);
};

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");

  // مدة عرض شاشة الترحيب (بالمللي ثانية)
  const SPLASH_DURATION = 2555; // 3 ثواني

  setTimeout(() => {
    splash.classList.add("fade-out");

    // إزالة العنصر نهائيًا بعد الانيميشن
    setTimeout(() => {
      splash.remove();
    }, 1000);
  }, SPLASH_DURATION);
});

// حل نهائي لفتح اختيار الصور من أزرار "رفع صورة إثبات الدفع"
document.addEventListener("click", function (e) {
  const btn = e.target.closest("button");

  if (!btn) return;

  // نتحقق إن ده زر رفع صورة إثبات الدفع
  if (btn.textContent.includes("رفع صورة إثبات الدفع")) {
    e.preventDefault();

    // نجيب آخر modal مفتوح
    const modals = document.querySelectorAll("div[style*='position:fixed']");
    const activeModal = modals[modals.length - 1];

    if (!activeModal) return;

    // نجيب input file داخل نفس الـ modal
    const fileInput = activeModal.querySelector("input[type='file']");

    if (fileInput) {
      fileInput.click();
    }
  }
});

document.addEventListener("change", function (e) {
  if (e.target.type === "file" && e.target.files.length > 0) {
    const file = e.target.files[0];

    // نجيب العنصر اللي يعرض اسم الملف
    const id = e.target.id;
    const labelId = id.replace("Receipt", "FileName");
    const label = document.getElementById(labelId);

    if (label) {
      label.textContent = "✔ تم اختيار الملف: " + file.name;
    }
  }
});

//  alert
function showCustomAlert(message) {
  const old = document.getElementById("customAlert");
  if (old) old.remove();

  const alertBox = document.createElement("div");
  alertBox.id = "customAlert";
  alertBox.style = `
    position:fixed;
    inset:0;
    background:rgba(0,0,0,.5);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index:99999;
  `;

  alertBox.innerHTML = `
    <div style="
      background:#fff;
      padding:25px 30px;
      border-radius:14px;
      width:90%;
      max-width:400px;
      text-align:center;
      box-shadow:0 15px 40px rgba(0,0,0,.25)
    ">
      <h3 style="color:#1f2937;margin-bottom:10px">
        ⚠️ تنبيه
      </h3>
      <p style="color:#4b5563;margin-bottom:20px">
        ${message}
      </p>
      <button class="btn btn-primary" style="width:100%"
        onclick="document.getElementById('customAlert').remove()">
        موافق
      </button>
    </div>
  `;

  document.body.appendChild(alertBox);
}
