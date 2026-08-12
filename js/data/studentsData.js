import { isAccountBlocked } from "../services/accountStatusService.js";

// Data model for Enrolled Students CRM

const initialStudentsList = [
  {
    id: "STD-101",
    name: "إسلام عادل",
    email: "etak5806@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    country: "مصر",
    phone: "01153054568",
    purchasedItem: "بناء تطبيقات الويب الحديثة مع React",
    purchasedItemId: 1,
    type: "Course",
    purchaseDate: "2026-06-15",
    registrationDate: "2026-05-10",
    progress: 85,
    lessonsCompleted: 38,
    totalLessons: 45,
    watchTime: "22 ساعة",
    lastActivity: "منذ ساعتين",
    hasCertificate: true,
    certificateUrl: "CERT-2026-991",
    status: "Active",
    totalSpent: 328,
    rating: 5,
    purchasedCourses: [
      {
        id: 1,
        title: "بناء تطبيقات الويب الحديثة مع React",
        progress: 85,
        lessonsCompleted: 38,
        totalLessons: 45,
        currentLesson: "الدرس 39: Context API & Custom Hooks",
        purchaseDate: "2026-06-15",
        price: 299,
        status: "جارٍ التعلم"
      }
    ],
    purchasedBooks: [
      {
        id: 201,
        title: "كتاب JavaScript الحديثة",
        purchaseDate: "2026-07-01",
        price: 29,
        downloadCount: 8
      }
    ],
    invoices: [
      {
        id: "TXN-1001",
        invoiceNo: "INV-2026-8001",
        date: "2026-06-15",
        item: "بناء تطبيقات الويب الحديثة مع React",
        amount: "$299",
        status: "Completed",
        paymentMethod: "Visa"
      },
      {
        id: "TXN-1012",
        invoiceNo: "INV-2026-8012",
        date: "2026-07-01",
        item: "كتاب JavaScript الحديثة",
        amount: "$29",
        status: "Completed",
        paymentMethod: "Mastercard"
      }
    ],
    assignments: [
      {
        id: "ASN-101",
        title: "تطبيق قائمة المهام التفاعلي بـ React",
        courseName: "بناء تطبيقات الويب الحديثة مع React",
        submitDate: "2026-07-10",
        score: "95 / 100",
        status: "مقبول",
        feedback: "تنظيم ممتاز للكود واستخدام مميز للـ State."
      }
    ],
    quizResults: [
      {
        quizTitle: "اختبار أساسيات React & JSX",
        score: "92%",
        passStatus: "ناجح",
        date: "2026-06-25"
      },
      {
        quizTitle: "اختبار الـ Hooks المتقدمة",
        score: "88%",
        passStatus: "ناجح",
        date: "2026-07-05"
      }
    ],
    certificates: [
      {
        title: "شهادة إتمام دورة React الحديثة",
        issueDate: "2026-07-25",
        certNo: "CERT-2026-991"
      }
    ],
    timeline: [
      { date: "2026-08-02 14:30", action: "شاهد درس: Custom Hooks & Performance", icon: "📺" },
      { date: "2026-08-01 11:15", action: "سلم الواجب التطبيقي الثاني", icon: "📝" },
      { date: "2026-07-25 18:00", action: "حصل على شهادة إتمام المسار الأساسي", icon: "🎓" }
    ],
    privateNotes: [
      { id: "NOTE-1", text: "طالب مجتهد وسريع البديهة، يحتاج متابعة في الجزء الخاص بـ Redux.", date: "2026-07-18", author: "المعلم" }
    ],
    messages: [
      { sender: "Student", text: "السلام عليكم دكتور، هل أستطيع تقديم المشروع النهائي الأسبوع القادم؟", time: "2026-07-28 16:00" },
      { sender: "Teacher", text: "وعليكم السلام يا أحمد، بالتأكيد يمكنك التقديم قبل تاريخ 10 أغسطس.", time: "2026-07-28 16:15" }
    ]
  },
  {
    id: "STD-102",
    name: "سارة خالد العتيبي",
    email: "sara.otbi@yahoo.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    country: "السعودية",
    phone: "+966 50 123 4567",
    purchasedItem: "Python للمبتدئين - من الصفر إلى الاحترافية",
    purchasedItemId: 2,
    type: "Course",
    purchaseDate: "2026-07-02",
    registrationDate: "2026-06-01",
    progress: 100,
    lessonsCompleted: 52,
    totalLessons: 52,
    watchTime: "30 ساعة",
    lastActivity: "أمس",
    hasCertificate: true,
    certificateUrl: "CERT-2026-992",
    status: "Completed",
    totalSpent: 179,
    rating: 5,
    purchasedCourses: [
      {
        id: 2,
        title: "Python للمبتدئين - من الصفر إلى الاحترافية",
        progress: 100,
        lessonsCompleted: 52,
        totalLessons: 52,
        currentLesson: "تم إكمال الدورة بنجاح 🎉",
        purchaseDate: "2026-07-02",
        price: 179,
        status: "مكتمل"
      }
    ],
    purchasedBooks: [],
    invoices: [
      {
        id: "TXN-1002",
        invoiceNo: "INV-2026-8002",
        date: "2026-07-02",
        item: "Python للمبتدئين - من الصفر إلى الاحترافية",
        amount: "$179",
        status: "Completed",
        paymentMethod: "Apple Pay"
      }
    ],
    assignments: [
      {
        id: "ASN-102",
        title: "مشروع تحليل البيانات باستخدام Pandas",
        courseName: "Python للمبتدئين",
        submitDate: "2026-07-20",
        score: "100 / 100",
        status: "مقبول ممتاز",
        feedback: "عمل باهر وشامل لجميع الشروط المطلوب تحققها."
      }
    ],
    quizResults: [
      {
        quizTitle: "اختبار أساسيات Python والحلقات",
        score: "100%",
        passStatus: "ناجح",
        date: "2026-07-10"
      }
    ],
    certificates: [
      {
        title: "شهادة خبير Python المعتمدة",
        issueDate: "2026-07-28",
        certNo: "CERT-2026-992"
      }
    ],
    timeline: [
      { date: "2026-08-01 09:20", action: "حملت شهادة التخرج الرسمية", icon: "🏆" },
      { date: "2026-07-28 20:00", action: "أكملت الدرس الأخير في الدورة", icon: "✅" }
    ],
    privateNotes: [
      { id: "NOTE-2", text: "تمت إجازة الشهادة بنجاح وتم التواصل مع الطالبة لتأكيد الاستلام.", date: "2026-07-29", author: "المعلم" }
    ],
    messages: [
      { sender: "Student", text: "شكراً جزيلاً أستاذي على الشرح الرائع، استفدت كثيراً من الدورة!", time: "2026-07-28 20:30" }
    ]
  },
  {
    id: "STD-103",
    name: "عمر فاروق الشمري",
    email: "omar.farouk@outlook.com",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop",
    country: "الكويت",
    phone: "+965 99 876 543",
    purchasedItem: "تصميم UI/UX المتقدم مع Figma",
    purchasedItemId: 3,
    type: "Course",
    purchaseDate: "2026-07-18",
    registrationDate: "2026-07-10",
    progress: 45,
    lessonsCompleted: 17,
    totalLessons: 38,
    watchTime: "9 ساعات",
    lastActivity: "منذ 3 أيام",
    hasCertificate: false,
    certificateUrl: "",
    status: "Active",
    totalSpent: 249,
    rating: 4,
    purchasedCourses: [
      {
        id: 3,
        title: "تصميم UI/UX المتقدم مع Figma",
        progress: 45,
        lessonsCompleted: 17,
        totalLessons: 38,
        currentLesson: "الدرس 18: Auto Layout & Component Variants",
        purchaseDate: "2026-07-18",
        price: 249,
        status: "جارٍ التعلم"
      }
    ],
    purchasedBooks: [],
    invoices: [
      {
        id: "TXN-1003",
        invoiceNo: "INV-2026-8003",
        date: "2026-07-18",
        item: "تصميم UI/UX المتقدم مع Figma",
        amount: "$249",
        status: "Completed",
        paymentMethod: "Mada"
      }
    ],
    assignments: [],
    quizResults: [
      {
        quizTitle: "اختبار قواعد نظام الألوان والـ Typography",
        score: "85%",
        passStatus: "ناجح",
        date: "2026-07-25"
      }
    ],
    certificates: [],
    timeline: [
      { date: "2026-07-31 16:40", action: "شاهد درس: Figma Design Tokens", icon: "📺" }
    ],
    privateNotes: [],
    messages: []
  },
  {
    id: "STD-104",
    name: "فاطمة الزهراء حسن",
    email: "fatima.z@hotmail.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop",
    country: "الإمارات",
    phone: "+971 52 987 6543",
    purchasedItem: "كتاب React من الصفر",
    purchasedItemId: 202,
    type: "Book",
    purchaseDate: "2026-07-22",
    registrationDate: "2026-07-15",
    progress: 100,
    lessonsCompleted: 1,
    totalLessons: 1,
    watchTime: "قراءة إلكترونية",
    lastActivity: "اليوم",
    hasCertificate: false,
    certificateUrl: "",
    status: "Completed",
    totalSpent: 42,
    rating: 5,
    purchasedCourses: [],
    purchasedBooks: [
      {
        id: 202,
        title: "كتاب React من الصفر",
        purchaseDate: "2026-07-22",
        price: 42,
        downloadCount: 15
      }
    ],
    invoices: [
      {
        id: "TXN-1004",
        invoiceNo: "INV-2026-8004",
        date: "2026-07-22",
        item: "كتاب React من الصفر",
        amount: "$42",
        status: "Completed",
        paymentMethod: "Visa"
      }
    ],
    assignments: [],
    quizResults: [],
    certificates: [],
    timeline: [
      { date: "2026-08-03 10:00", action: "قامت بتحميل نسخة PDF المحينة لكتاب React", icon: "📥" }
    ],
    privateNotes: [],
    messages: []
  },
  {
    id: "STD-105",
    name: "عبد الله محمد الدوسري",
    email: "abdullah.dosari@gmail.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
    country: "السعودية",
    phone: "+966 55 443 2211",
    purchasedItem: "JavaScript المتقدم - Async و Promises",
    purchasedItemId: 4,
    type: "Course",
    purchaseDate: "2026-07-28",
    registrationDate: "2026-07-01",
    progress: 20,
    lessonsCompleted: 6,
    totalLessons: 30,
    watchTime: "3 ساعات",
    lastActivity: "منذ أسبوع",
    hasCertificate: false,
    certificateUrl: "",
    status: "Inactive",
    totalSpent: 199,
    rating: 4,
    purchasedCourses: [
      {
        id: 4,
        title: "JavaScript المتقدم - Async و Promises",
        progress: 20,
        lessonsCompleted: 6,
        totalLessons: 30,
        currentLesson: "الدرس 7: Understanding Event Loop & Call Stack",
        purchaseDate: "2026-07-28",
        price: 199,
        status: "غير نشط مؤقتاً"
      }
    ],
    purchasedBooks: [],
    invoices: [
      {
        id: "TXN-1005",
        invoiceNo: "INV-2026-8005",
        date: "2026-07-28",
        item: "JavaScript المتقدم - Async و Promises",
        amount: "$199",
        status: "Completed",
        paymentMethod: "Mastercard"
      }
    ],
    assignments: [],
    quizResults: [],
    certificates: [],
    timeline: [
      { date: "2026-07-29 12:00", action: "شاهد درس: Callback Hell to Promises", icon: "📺" }
    ],
    privateNotes: [
      { id: "NOTE-3", text: "توقف الطالب عن المشاهدة عند الدرس السابع، يفضل إرسال تذكير تحفيزي البريد.", date: "2026-08-01", author: "المعلم" }
    ],
    messages: []
  },
  {
    id: "STD-106",
    name: "مريم يوسف الملا",
    email: "maryam.mulla@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
    country: "قطر",
    phone: "+974 55 123 987",
    purchasedItem: "بناء تطبيقات الويب الحديثة مع React",
    purchasedItemId: 1,
    type: "Course",
    purchaseDate: "2026-08-01",
    registrationDate: "2026-08-01",
    progress: 10,
    lessonsCompleted: 4,
    totalLessons: 45,
    watchTime: "2 ساعة",
    lastActivity: "اليوم",
    hasCertificate: false,
    certificateUrl: "",
    status: "Active",
    totalSpent: 299,
    rating: 5,
    purchasedCourses: [
      {
        id: 1,
        title: "بناء تطبيقات الويب الحديثة مع React",
        progress: 10,
        lessonsCompleted: 4,
        totalLessons: 45,
        currentLesson: "الدرس 5: Components Props & State",
        purchaseDate: "2026-08-01",
        price: 299,
        status: "جديد هذا الشهر"
      }
    ],
    purchasedBooks: [],
    invoices: [
      {
        id: "TXN-1006",
        invoiceNo: "INV-2026-8006",
        date: "2026-08-01",
        item: "بناء تطبيقات الويب الحديثة مع React",
        amount: "$299",
        status: "Completed",
        paymentMethod: "Visa"
      }
    ],
    assignments: [],
    quizResults: [],
    certificates: [],
    timeline: [
      { date: "2026-08-03 11:30", action: "أكملت اختبار مرحلي لأساسيات React", icon: "⭐" }
    ],
    privateNotes: [],
    messages: []
  }
];

const STUDENTS_STORAGE_KEY = "lms_enrolled_students_v1";

function loadInitialStudentsData() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved students data", e);
      }
    }
  }
  return initialStudentsList;
}

export function saveStudentsData() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(studentsData));
  }
}

export function getStudentsList() {
  let list = [...studentsData];

  // Merge registered student users from studymart_users
  if (typeof window !== "undefined") {
    try {
      const rawUsers = localStorage.getItem("studymart_users");
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const registeredStudents = users.filter((u) => {
          const role = (u.accountType || u.role || "student").toLowerCase();
          return role === "student" || role === "user";
        });

        registeredStudents.forEach((rs) => {
          const rsEmail = (rs.email || "").toLowerCase();
          const exists = list.some((s) => 
            (s.id && rs.id && String(s.id) === String(rs.id)) || 
            (s.email && rsEmail && s.email.toLowerCase() === rsEmail)
          );
          if (!exists && rsEmail) {
            list.push({
              id: rs.id || `STD-REG-${Date.now()}`,
              name: rs.fullName || rs.name || "طالب جديد",
              email: rs.email,
              avatar: rs.avatar || rs.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
              country: rs.country || "غير محدد",
              phone: rs.phone || "بدون هاتف",
              purchasedItem: "-",
              purchasedItemId: null,
              type: "-",
              purchaseDate: rs.registrationDate ? rs.registrationDate.split("T")[0] : "2026-08-01",
              registrationDate: rs.registrationDate ? rs.registrationDate.split("T")[0] : "2026-08-01",
              progress: 0,
              lessonsCompleted: 0,
              totalLessons: 0,
              watchTime: "0 ساعة",
              lastActivity: "حديثاً",
              hasCertificate: false,
              certificateUrl: "",
              status: "Active",
              totalSpent: 0,
              purchasedCourses: [],
              purchasedBooks: [],
              invoices: [],
              assignments: [],
              quizResults: [],
              certificates: [],
              timeline: [],
              privateNotes: [],
              messages: []
            });
          }
        });
      }
    } catch (e) {
      console.error("Error merging registered students from studymart_users", e);
    }
  }

  return list.map(s => {
    const isBlk = isAccountBlocked(s.id) || isAccountBlocked(s.email);
    if (isBlk) {
      s.status = "Blocked";
      s.isBlocked = true;
    } else {
      s.status = s.progress === 100 ? "Completed" : "Active";
      s.isBlocked = false;
    }
    return s;
  });
}

export function getStudentById(id) {
  const allStudents = getStudentsList();
  const student = allStudents.find(s => 
    String(s.id).toLowerCase() === String(id).toLowerCase() ||
    (s.email && s.email.toLowerCase() === String(id).toLowerCase())
  );
  if (student) {
    const isBlk = isAccountBlocked(student.id) || isAccountBlocked(student.email);
    if (isBlk) {
      student.status = "Blocked";
      student.isBlocked = true;
    } else {
      student.status = student.progress === 100 ? "Completed" : "Active";
      student.isBlocked = false;
    }
  }
  return student;
}

export function addPrivateNoteToStudent(studentId, noteText) {
  const student = getStudentById(studentId);
  if (!student) return false;
  if (!student.privateNotes) student.privateNotes = [];
  if (!student.notes) student.notes = [];
  const newNote = {
    id: `NOTE-${Date.now()}`,
    text: noteText,
    date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }),
    author: "مالك المنصة"
  };
  student.privateNotes.unshift(newNote);
  student.notes.unshift(newNote);
  saveStudentsData();
  return newNote;
}

export function toggleStudentBlock(studentId) {
  const student = getStudentById(studentId);
  if (!student) return false;
  if (student.status === "Blocked" || student.isBlocked) {
    student.status = student.progress === 100 ? "Completed" : "Active";
    student.isBlocked = false;
  } else {
    student.status = "Blocked";
    student.isBlocked = true;
  }
  saveStudentsData();
  return student.status;
}

export function deleteStudentFromList(studentId) {
  const idx = studentsData.findIndex(s => String(s.id) === String(studentId));
  if (idx !== -1) {
    studentsData.splice(idx, 1);
    saveStudentsData();
    return true;
  }
  return false;
}

export function generateStudentCertificate(studentId) {
  const student = getStudentById(studentId);
  if (!student) return false;
  student.hasCertificate = true;
  student.certificateUrl = `CERT-2026-${Math.floor(100 + Math.random() * 900)}`;
  if (!student.certificates) student.certificates = [];
  student.certificates.push({
    title: `شهادة إتمام معتمدة (${student.purchasedItem})`,
    issueDate: new Date().toISOString().split("T")[0],
    certNo: student.certificateUrl
  });
  saveStudentsData();
  return student.certificateUrl;
}

export function ensureStudentMessageIds(student) {
  if (!student || !student.messages) return;
  student.messages.forEach((m, idx) => {
    if (!m.id) {
      m.id = `MSG-${student.id}-${idx}-${Date.now()}`;
    }
  });
}

export function sendStudentMessage(studentId, messageText) {
  const student = getStudentById(studentId);
  if (!student) return false;
  if (!student.messages) student.messages = [];
  ensureStudentMessageIds(student);
  const msg = {
    id: `MSG-${studentId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    sender: "Teacher",
    text: messageText,
    time: new Date().toLocaleString("ar-EG", { hour12: true }),
    isPinned: false
  };
  student.messages.push(msg);
  saveStudentsData();
  return msg;
}

export function editStudentMessage(studentId, messageId, newText) {
  const student = getStudentById(studentId);
  if (!student || !student.messages) return false;
  ensureStudentMessageIds(student);
  const msg = student.messages.find(m => m.id === messageId);
  if (!msg) return false;
  msg.text = newText;
  saveStudentsData();
  return true;
}

export function togglePinStudentMessage(studentId, messageId) {
  const student = getStudentById(studentId);
  if (!student || !student.messages) return false;
  ensureStudentMessageIds(student);
  const msg = student.messages.find(m => m.id === messageId);
  if (!msg) return false;
  msg.isPinned = !msg.isPinned;
  saveStudentsData();
  return msg.isPinned;
}

export function deleteStudentMessage(studentId, messageId) {
  const student = getStudentById(studentId);
  if (!student || !student.messages) return false;
  ensureStudentMessageIds(student);
  student.messages = student.messages.filter(m => m.id !== messageId);
  saveStudentsData();
  return true;
}

export const studentsData = loadInitialStudentsData();
