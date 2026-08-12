// Data model for Student Reviews Management

export const reviewsData = [
  {
    id: "REV-501",
    studentId: "STD-101",
    studentName: "أحمد محمود علي",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop",
    courseOrBookName: "بناء تطبيقات الويب الحديثة مع React",
    purchasedItemId: 1,
    type: "Course",
    stars: 5,
    reviewTitle: "دورة ممتازة وشرح احترافي جداً!",
    reviewText: "الدورة تغطي كل التفاصيل الدقيقة في React Hooks و Context API بطريقة مبسطة مع أمثلة عملية ممتازة. تطبيق متجر المشتريات كان تطبيقاً واقعياً استفدت منه كثيراً في عملي.",
    createdDate: "2026-07-28",
    purchaseDate: "2026-06-15",
    completionStatus: "85% إنجاز",
    replyStatus: "Replied",
    isPinned: true,
    attachedImages: [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop"
    ],
    attachedVideos: [],
    teacherReply: "أهلاً بك يا أحمد! يسعدني جداً أن الدورة والمشروع التطبيقي حققا هدفك الاستثماري والعملي. بالتوفيق دائماً في مشاريعك القادمة!",
    replyDate: "2026-07-29",
    replyHistory: [
      { text: "شكراً لك أحمد، يسعدنا تقييمك العالي!", date: "2026-07-28" },
      { text: "أهلاً بك يا أحمد! يسعدني جداً أن الدورة والمشروع التطبيقي حققا هدفك الاستثماري والعملي. بالتوفيق دائماً في مشاريعك القادمة!", date: "2026-07-29" }
    ]
  },
  {
    id: "REV-502",
    studentId: "STD-102",
    studentName: "سارة خالد العتيبي",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop",
    courseOrBookName: "Python للمبتدئين - من الصفر إلى الاحترافية",
    purchasedItemId: 2,
    type: "Course",
    stars: 5,
    reviewTitle: "أفضل دورة بايثون باللغة العربية بجداره",
    reviewText: "الأسلوب متسلسل وممتع للغاية. أتممت الدورة بالكامل وحصلت على الشهادة وتمكنت من بناء مشروع تحليل بيانات كلياً بنجاح بفضل الشرح القوي.",
    createdDate: "2026-07-29",
    purchaseDate: "2026-07-02",
    completionStatus: "مكتمل 100%",
    replyStatus: "Replied",
    isPinned: true,
    attachedImages: [
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop"
    ],
    attachedVideos: [],
    teacherReply: "ألف مبروك التخرج والحصول على الشهادة سارة! فخورون بمجهودك وتميزك في مشروع تحليل البيانات.",
    replyDate: "2026-07-30",
    replyHistory: [
      { text: "ألف مبروك التخرج والحصول على الشهادة سارة! فخورون بمجهودك وتميزك في مشروع تحليل البيانات.", date: "2026-07-30" }
    ]
  },
  {
    id: "REV-503",
    studentId: "STD-103",
    studentName: "عمر فاروق الشمري",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop",
    courseOrBookName: "تصميم UI/UX المتقدم مع Figma",
    purchasedItemId: 3,
    type: "Course",
    stars: 4,
    reviewTitle: "دورة جيدة جداً ولكن نحتاج تطبيقات أكثر",
    reviewText: "الشرح في جزئية Auto Layout و Variables ممتاز جداً، أتمنى زيادة عدد التمارين التفاعلية في قسم الأنظمة المعقدة Design Systems.",
    createdDate: "2026-07-25",
    purchaseDate: "2026-07-18",
    completionStatus: "45% إنجاز",
    replyStatus: "Pending",
    isPinned: false,
    attachedImages: [],
    attachedVideos: [],
    teacherReply: null,
    replyDate: null,
    replyHistory: []
  },
  {
    id: "REV-504",
    studentId: "STD-104",
    studentName: "فاطمة الزهراء حسن",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop",
    courseOrBookName: "كتاب React من الصفر",
    purchasedItemId: 202,
    type: "Book",
    stars: 5,
    reviewTitle: "كتاب رائع جداً ومليء بالأمثلة التطبيقية",
    reviewText: "الكتاب منظم جداً والصور التوضيحية أضافت قيمة كبيرة للفهم، خصوصاً فصل إدارة الذاكرة والـ Component Lifecycle.",
    createdDate: "2026-07-26",
    purchaseDate: "2026-07-22",
    completionStatus: "تم القراءة بالكامل",
    replyStatus: "Replied",
    isPinned: false,
    attachedImages: [],
    attachedVideos: [],
    teacherReply: "شكراً فاطمة، يسعدنا أن الكتاب قدم لك القيمة البرمجية المرجوة!",
    replyDate: "2026-07-27",
    replyHistory: [
      { text: "شكراً فاطمة، يسعدنا أن الكتاب قدم لك القيمة البرمجية المرجوة!", date: "2026-07-27" }
    ]
  },
  {
    id: "REV-505",
    studentId: "STD-105",
    studentName: "عبد الله محمد الدوسري",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop",
    courseOrBookName: "JavaScript المتقدم - Async و Promises",
    purchasedItemId: 4,
    type: "Course",
    stars: 4,
    reviewTitle: "شرح عميق لمفاهيم السيرفر والـ Event Loop",
    reviewText: "المحتوى دقيق جداً للمطورين الراغبين في تفكيك غموض البرمجة اللاتزامنية في جاڤاسكريبت.",
    createdDate: "2026-07-30",
    purchaseDate: "2026-07-28",
    completionStatus: "20% إنجاز",
    replyStatus: "Pending",
    isPinned: false,
    attachedImages: [],
    attachedVideos: [],
    teacherReply: null,
    replyDate: null,
    replyHistory: []
  },
  {
    id: "REV-506",
    studentId: "STD-106",
    studentName: "مريم يوسف الملا",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
    courseOrBookName: "بناء تطبيقات الويب الحديثة مع React",
    purchasedItemId: 1,
    type: "Course",
    stars: 5,
    reviewTitle: "بداية ممتازة جداً للدورة!",
    reviewText: "أنهيت أول 4 دروس وكان أسلوب الأستاذ سلس ومشوق. أنصح بها لمن يريد تعلم React بأساس متين.",
    createdDate: "2026-08-02",
    purchaseDate: "2026-08-01",
    completionStatus: "10% إنجاز",
    replyStatus: "Pending",
    isPinned: false,
    attachedImages: [],
    attachedVideos: [],
    teacherReply: null,
    replyDate: null,
    replyHistory: []
  }
];

export function getReviewsList() {
  return reviewsData;
}

export function getReviewById(id) {
  return reviewsData.find(r => String(r.id) === String(id));
}

export function addTeacherReplyToReview(reviewId, replyText) {
  const review = getReviewById(reviewId);
  if (!review) return false;
  review.teacherReply = replyText;
  review.replyDate = new Date().toISOString().split("T")[0];
  review.replyStatus = "Replied";
  if (!review.replyHistory) review.replyHistory = [];
  review.replyHistory.push({
    text: replyText,
    date: review.replyDate
  });
  return true;
}

export function deleteTeacherReplyFromReview(reviewId) {
  const review = getReviewById(reviewId);
  if (!review) return false;
  review.teacherReply = null;
  review.replyDate = null;
  review.replyStatus = "Pending";
  return true;
}

export function togglePinReview(reviewId) {
  const review = getReviewById(reviewId);
  if (!review) return false;
  review.isPinned = !review.isPinned;
  return review.isPinned;
}

export function deleteReviewFromList(reviewId) {
  const idx = reviewsData.findIndex(r => String(r.id) === String(reviewId));
  if (idx !== -1) {
    reviewsData.splice(idx, 1);
    return true;
  }
  return false;
}
