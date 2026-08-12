// Data model & storage engine for Teacher Message Center
import { studentsData } from "./studentsData.js";

const STORAGE_KEY = "lms_teacher_messages_v1";
const QUICK_REPLIES_KEY = "lms_quick_replies_v1";

export const defaultQuickReplies = [
  "أهلاً بك! يسعدني مساعدتك اليوم 😊",
  "تم استلام استفسارك وجارٍ المراجعة والرد عليك قريباً ⏳",
  "يرجى مراجعة التطبيق العملي في الدرس الخامس 📺",
  "تم حل المشكلة بنجاح، نتمنى لك كل التوفيق والنجاح! ✅",
  "تجد الإجابة بالتفصيل في الفصل الثالث من الكتاب 📖",
  "هل تحتاج إلى مساعدة إضافية في هذا الموضوع؟ 💬"
];

const initialConversations = [
  {
    id: "MSG-CONV-101",
    studentId: "STD-101",
    studentName: "أحمد محمود علي",
    studentEmail: "ahmed.mahmoud@gmail.com",
    studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    country: "مصر",
    isOnline: true,
    lastSeen: "متصل الآن",
    itemType: "Course",
    itemId: 1,
    itemTitle: "بناء تطبيقات الويب الحديثة مع React",
    lessonName: "الدرس 39: Context API & Custom Hooks",
    lessonNumber: 39,
    status: "Open", // Open, Pending, Resolved, Closed, Archived, Blocked
    isPinned: true,
    isStarred: true,
    isMuted: false,
    unreadCount: 2,
    labels: ["سؤال دورة", "VIP", "عاجل"],
    lastUpdated: "2026-08-03T10:15:00",
    orderNo: "INV-2026-8001",
    messages: [
      {
        id: "M-101-1",
        sender: "student", // student or teacher
        text: "السلام عليكم أستاذي الكريم، لدي سؤال بخصوص استدعاء Context API داخل Custom Hook في درس React.",
        timestamp: "2026-08-03T09:40:00",
        status: "seen", // sent, delivered, seen
        attachments: []
      },
      {
        id: "M-101-2",
        sender: "teacher",
        text: "وعليكم السلام ورحمة الله وبركاته يا أحمد. أهلاً بك! يمكنك مشاركة ملخص الكود الذي تسبب في الخطأ لمساعدتك بشكل أفضل.",
        timestamp: "2026-08-03T09:45:00",
        status: "seen",
        attachments: []
      },
      {
        id: "M-101-3",
        sender: "student",
        text: "أرفقت لك ملف الكود لنموذج AuthProvider وقطعة الشاشة التي تظهر خطأ Re-render.",
        timestamp: "2026-08-03T10:10:00",
        status: "delivered",
        attachments: [
          {
            id: "ATT-1",
            name: "AuthProvider_Example.jsx",
            type: "code",
            size: "4.2 KB",
            url: "#",
            codeSnippet: `import { createContext, useContext, useState } from "react";\n\nconst AuthContext = createContext(null);\n\nexport const AuthProvider = ({ children }) => {\n  const [user, setUser] = useState(null);\n  return <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>;\n};\n\nexport const useAuth = () => useContext(AuthContext);`
          },
          {
            id: "ATT-2",
            name: "console_error_screenshot.png",
            type: "image",
            size: "340 KB",
            url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop"
          },
          {
            id: "ATT-3",
            name: "Context_Guide_Notes.pdf",
            type: "document",
            mime: "application/pdf",
            size: "1.2 MB",
            url: "#"
          }
        ]
      },
      {
        id: "M-101-4",
        sender: "student",
        text: "هل تحب أن تسجل فيديو قصير لشرح الطريقة الصحيحة لمنع إعادة العرض غير الضروري؟",
        timestamp: "2026-08-03T10:15:00",
        status: "delivered",
        attachments: []
      }
    ]
  },
  {
    id: "MSG-CONV-102",
    studentId: "STD-102",
    studentName: "سارة أحمد إبراهيم",
    studentEmail: "sara.ibrahim@yahoo.com",
    studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    country: "السعودية",
    isOnline: false,
    lastSeen: "منذ 25 دقيقة",
    itemType: "Assignment",
    itemId: 1,
    itemTitle: "بناء تطبيقات الويب الحديثة مع React",
    assignmentTitle: "الواجب 1: مشروع التطبيق النهائي المتكامل",
    lessonName: "الدرس 12: تسليم المشروع العملي الأول",
    lessonNumber: 12,
    status: "Pending",
    isPinned: false,
    isStarred: true,
    isMuted: false,
    unreadCount: 1,
    labels: ["واجبات", "تسليم مشروع"],
    lastUpdated: "2026-08-03T08:30:00",
    orderNo: "INV-2026-8002",
    messages: [
      {
        id: "M-102-1",
        sender: "student",
        text: "مرحباً يا أستاذ، قمت بتسليم واجب المشروع الأول وأرفقت أرشيف المشروع النهائي مضغوطاً بصيغة ZIP مع مستند الشرح بصيغة Word.",
        timestamp: "2026-08-03T08:20:00",
        status: "delivered",
        attachments: [
          {
            id: "ATT-102-1",
            name: "React_Project_Submission.zip",
            type: "document",
            mime: "application/zip",
            size: "8.5 MB",
            url: "#"
          },
          {
            id: "ATT-102-2",
            name: "Project_Documentation_Report.docx",
            type: "document",
            mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            size: "420 KB",
            url: "#"
          }
        ]
      },
      {
        id: "M-102-2",
        sender: "student",
        text: "هل يمكنك إفادتي بدرجة التقييم فور مراجعة الواجب؟ رابط المشروع على GitHub: https://github.com/sara/react-lms-demo",
        timestamp: "2026-08-03T08:30:00",
        status: "delivered",
        attachments: []
      }
    ]
  },
  {
    id: "MSG-CONV-103",
    studentId: "STD-103",
    studentName: "محمد عبد الله الشمري",
    studentEmail: "m.alshammari@hotmail.com",
    studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
    country: "الكويت",
    isOnline: true,
    lastSeen: "متصل الآن",
    itemType: "Book",
    itemId: 201,
    itemTitle: "كتاب JavaScript الحديثة",
    chapterName: "الفصل 3: Async/Await والتعامل مع APIs",
    status: "Resolved",
    isPinned: false,
    isStarred: false,
    isMuted: false,
    unreadCount: 0,
    labels: ["سؤال كتاب"],
    lastUpdated: "2026-08-02T18:20:00",
    orderNo: "INV-2026-8003",
    messages: [
      {
        id: "M-103-1",
        sender: "student",
        text: "السلام عليكم، أعجبني جداً الفصل الثالث في كتاب JS الحديثة، أريد الاستفسار عن كود صفحة 45.",
        timestamp: "2026-08-02T16:00:00",
        status: "seen",
        attachments: []
      },
      {
        id: "M-103-2",
        sender: "teacher",
        text: "تفضل يا محمد، الكود في صفحة 45 يوضح استخدام Promise.allSettled للحصول على كافة نتائج طلبات API حتى مع وجود بعض الأخطاء.",
        timestamp: "2026-08-02T16:15:00",
        status: "seen",
        attachments: []
      },
      {
        id: "M-103-3",
        sender: "student",
        text: "شكراً جزيلاً وضحت الفكرة تماماً! بارك الله فيك.",
        timestamp: "2026-08-02T18:20:00",
        status: "seen",
        attachments: []
      }
    ]
  },
  {
    id: "MSG-CONV-104",
    studentId: "STD-104",
    studentName: "خالد العمراني",
    studentEmail: "khalid.omrani@outlook.com",
    studentAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop",
    country: "الإمارات",
    isOnline: false,
    lastSeen: "منذ 3 ساعات",
    itemType: "Course",
    itemId: 2,
    itemTitle: "دورة الماستر في Node.js & Express",
    lessonName: "استفسار التسجيل الجماعي",
    status: "Open",
    isPinned: false,
    isStarred: false,
    isMuted: true,
    unreadCount: 3,
    labels: ["الدفع والمالية", "عاجل"],
    lastUpdated: "2026-08-03T02:10:00",
    orderNo: "INV-2026-8004",
    messages: [
      {
        id: "M-104-1",
        sender: "student",
        text: "مرحباً، أود تسجيل 5 مهندسين من شركتنا في دورة Node.js، هل يوجد خصم خاص للشركات والمجموعات؟",
        timestamp: "2026-08-03T02:10:00",
        status: "delivered",
        attachments: []
      }
    ]
  },
  {
    id: "MSG-CONV-105",
    studentId: "STD-105",
    studentName: "مريم العتيبي",
    studentEmail: "maryam.otaibi@gmail.com",
    studentAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop",
    country: "السعودية",
    isOnline: true,
    lastSeen: "متصل الآن",
    itemType: "Course",
    itemId: 1,
    itemTitle: "بناء تطبيقات الويب الحديثة مع React",
    lessonName: "طلب إصدار الشهادة",
    status: "Resolved",
    isPinned: false,
    isStarred: false,
    isMuted: false,
    unreadCount: 0,
    labels: ["الشهادات"],
    lastUpdated: "2026-08-01T14:00:00",
    orderNo: "INV-2026-8005",
    messages: [
      {
        id: "M-105-1",
        sender: "student",
        text: "أنهيت الدورة بنسبة 100%! أريد التأكد من الاسم المكتوب على الشهادة المطبوعة باللغة الإنكليزية.",
        timestamp: "2026-08-01T11:00:00",
        status: "seen",
        attachments: []
      },
      {
        id: "M-105-2",
        sender: "teacher",
        text: "مبارك إتمام الدورة بنجاح يا مريم! تم الاعتماد وإرسال الشهادة إلى البريد الإلكتروني.",
        timestamp: "2026-08-01T14:00:00",
        status: "seen",
        attachments: [
          {
            id: "ATT-105-1",
            name: "Certificate_Maryam_Otaibi.pdf",
            type: "document",
            mime: "application/pdf",
            size: "2.1 MB",
            url: "#"
          }
        ]
      }
    ]
  },
  {
    id: "MSG-CONV-106",
    studentId: "STD-106",
    studentName: "عمر الفاروق",
    studentEmail: "omar.alfarooq@gmail.com",
    studentAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop",
    country: "الأردن",
    isOnline: false,
    lastSeen: "منذ يومين",
    itemType: "Quiz",
    itemId: 3,
    itemTitle: "احتراف TypeScript وتطبيقات الحجم الكبير",
    quizTitle: "اختبار مهارات TypeScript - الفصل الرابع",
    lessonName: "اختبار الفصل الرابع",
    status: "Open",
    isPinned: false,
    isStarred: false,
    isMuted: false,
    unreadCount: 1,
    labels: ["الاختبارات", "بلاغ عن خطأ"],
    lastUpdated: "2026-08-02T22:45:00",
    orderNo: "INV-2026-8006",
    messages: [
      {
        id: "M-106-1",
        sender: "student",
        text: "أعتقد أن هناك خطأ مطبعي في الخيار الثالث للسؤال رقم 4 في اختبار TypeScript. يرجى المراجعة وشكراً.",
        timestamp: "2026-08-02T22:45:00",
        status: "delivered",
        attachments: []
      }
    ]
  }
];

export function getConversations() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse conversations from storage", e);
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialConversations));
  return initialConversations;
}

export function saveConversations(conversations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function getQuickReplies() {
  const saved = localStorage.getItem(QUICK_REPLIES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse quick replies", e);
    }
  }
  localStorage.setItem(QUICK_REPLIES_KEY, JSON.stringify(defaultQuickReplies));
  return defaultQuickReplies;
}

export function addQuickReply(replyText) {
  if (!replyText || !replyText.trim()) return;
  const list = getQuickReplies();
  list.push(replyText.trim());
  localStorage.setItem(QUICK_REPLIES_KEY, JSON.stringify(list));
  return list;
}

export function deleteQuickReply(index) {
  const list = getQuickReplies();
  if (index >= 0 && index < list.length) {
    list.splice(index, 1);
    localStorage.setItem(QUICK_REPLIES_KEY, JSON.stringify(list));
  }
  return list;
}

export function getMessageStats(conversations) {
  const convs = conversations || getConversations();
  const total = convs.length;
  const unreadCount = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const pendingCount = convs.filter((c) => c.status === "Pending").length;
  const resolvedCount = convs.filter((c) => c.status === "Resolved").length;
  const activeStudents = new Set(convs.map((c) => c.studentId)).size;
  
  // Calculate messages today
  const todayStr = new Date().toISOString().split("T")[0];
  let messagesToday = 0;
  convs.forEach((c) => {
    (c.messages || []).forEach((m) => {
      if (m.timestamp && m.timestamp.startsWith(todayStr)) {
        messagesToday++;
      }
    });
  });

  return {
    totalConversations: total,
    unreadMessages: unreadCount,
    pendingReplies: pendingCount,
    resolvedConversations: resolvedCount,
    avgResponseTime: "12 دقيقة",
    messagesToday: messagesToday || 14,
    activeStudents: activeStudents
  };
}
