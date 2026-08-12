import { loadLocalStorage, saveLocalStorage } from "../utils/helpers.js";
import { addNotification } from "../services/notificationService.js";

const QUESTIONS_KEY = "lms_course_questions_v1";

const initialQuestions = [
  {
    id: "q-101",
    courseId: 1,
    lessonTitle: "الدرس 2: إعداد بيئة العمل والأدوات",
    studentName: "أحمد علي",
    studentAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop",
    question: "هل يفضل استخدام VS Code أم WebStorm لهذا الكورس؟",
    date: "2024-03-01",
    status: "answered",
    answer: "أهلاً أحمد! نوصي باستخدام VS Code لأنه مجاني ومجتمع الإضافات فيه غني جداً، ولكن WebStorm ممتاز أيضاً.",
    answeredBy: "م. إسلام عادل",
    answeredAt: "2024-03-01"
  },
  {
    id: "q-102",
    courseId: 1,
    lessonTitle: "الدرس 4: بناء المكونات التفاعلية",
    studentName: "سارة محمد",
    studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop",
    question: "كيف يمكنني التعامل مع الأخطاء غير المتوقعة في API؟",
    date: "2024-03-02",
    status: "pending",
    answer: null
  }
];

export function getCourseQuestions(courseId) {
  const all = loadLocalStorage(QUESTIONS_KEY, initialQuestions);
  if (!courseId) return all;
  return all.filter((q) => String(q.courseId) === String(courseId));
}

export function addCourseQuestion(courseId, lessonTitle, questionText) {
  const all = loadLocalStorage(QUESTIONS_KEY, initialQuestions);
  const currentUser = window.appState?.user || { name: "طالب متفوق", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop" };
  const newQ = {
    id: "q-" + Date.now(),
    courseId: Number(courseId) || courseId,
    lessonTitle: lessonTitle || "عام حول الدورة",
    studentName: currentUser.name || "طالب",
    studentAvatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
    question: questionText,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
    answer: null
  };
  all.unshift(newQ);
  saveLocalStorage(QUESTIONS_KEY, all);

  // Notify Teacher
  try {
    addNotification({
      title: "سؤال جديد من طالب",
      message: `طرح ${newQ.studentName} سؤالاً جديداً: "${questionText.substring(0, 40)}..."`,
      type: "question",
      link: `#course-details/${courseId}`
    });
  } catch (e) {
    console.error(e);
  }

  return newQ;
}

export function answerCourseQuestion(questionId, answerText) {
  const all = loadLocalStorage(QUESTIONS_KEY, initialQuestions);
  const q = all.find((item) => item.id === questionId);
  if (q) {
    q.answer = answerText;
    q.status = "answered";
    q.answeredBy = "م. إسلام عادل";
    q.answeredAt = new Date().toISOString().split("T")[0];
    saveLocalStorage(QUESTIONS_KEY, all);

    // Notify Student
    try {
      addNotification({
        title: "تمت الإجابة على سؤالك!",
        message: `أجاب المعلم على سؤالك: "${answerText.substring(0, 40)}..."`,
        type: "answer",
        link: `#course-details/${q.courseId}`
      });
    } catch (e) {
      console.error(e);
    }
  }
  return q;
}

export function deleteCourseQuestion(questionId) {
  let all = loadLocalStorage(QUESTIONS_KEY, initialQuestions);
  all = all.filter((item) => String(item.id) !== String(questionId));
  saveLocalStorage(QUESTIONS_KEY, all);
  return true;
}

export function editCourseQuestion(questionId, newText) {
  const all = loadLocalStorage(QUESTIONS_KEY, initialQuestions);
  const q = all.find((item) => String(item.id) === String(questionId));
  if (q) {
    q.question = newText;
    saveLocalStorage(QUESTIONS_KEY, all);
  }
  return q;
}

if (typeof window !== "undefined") {
  window.getCourseQuestions = getCourseQuestions;
  window.addCourseQuestion = addCourseQuestion;
  window.answerCourseQuestion = answerCourseQuestion;
  window.deleteCourseQuestion = deleteCourseQuestion;
  window.editCourseQuestion = editCourseQuestion;
}
