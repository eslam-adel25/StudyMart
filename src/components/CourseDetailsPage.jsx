import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourseById, mockCourses } from "../data/coursesData";
import {
  ArrowRight,
  Star,
  Users,
  Clock,
  BookOpen,
  Award,
  Globe,
  Play,
  CheckCircle2,
  Heart,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Video,
  HelpCircle,
  ArrowLeft
} from "lucide-react";

export const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = getCourseById(courseId || "");

  // Interactive UI states
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedModules, setExpandedModules] = useState({
    m1: true,
    m2: true
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [cartNotification, setCartNotification] = useState(null);

  // New Question state
  const [newQuestionText, setNewQuestionText] = useState("");
  const [qaItems, setQaItems] = useState(course?.qaList || []);

  if (!course) {
    return (
      <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-['Tajawal',sans-serif]" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">لم يتم العثور على الدورة المطلوب عرضها</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          الدورة برقم ({courseId}) غير موجودة أو تم نقلها. يرجى العودة إلى دليل الدورات.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى جميع الدورات</span>
        </button>
      </div>
    );
  }

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddToCart = () => {
    setIsInCart(!isInCart);
    setCartNotification(!isInCart ? "تمت إضافة الدورة إلى سلة التسوق بنجاح!" : "تمت إزالة الدورة من السلة");
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const newQA = {
      id: `q-${Date.now()}`,
      question: newQuestionText,
      answer: "شكراً لسؤالك! سيقوم المدرب بالرد على استفسارك قريباً جداً.",
      author: "أنت (الطالب)",
      date: "الآن"
    };

    setQaItems([newQA, ...qaItems]);
    setNewQuestionText("");
  };

  const relatedCourses = mockCourses.filter((c) => c.id !== course.id);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-['Tajawal',sans-serif] pb-20" dir="rtl">
      {/* Toast Notification */}
      {cartNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{cartNotification}</span>
        </div>
      )}

      {/* Top Header / Breadcrumb Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-purple-300 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى جميع الدورات</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>الدورات</span>
            <span>/</span>
            <span className="text-purple-400 font-semibold">{course.category}</span>
          </div>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Info Header Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-lg">
                {course.category}
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold rounded-lg">
                {course.level}
              </span>
              {course.badge && (
                <span className="px-3 py-1 bg-amber-500/90 text-slate-950 font-black text-xs rounded-lg shadow-md">
                  {course.badge}
                </span>
              )}
            </div>

            {/* Course Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-snug">
              {course.title}
            </h1>

            {/* Short Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {course.shortDescription}
            </p>

            {/* Rating & Stats Summary */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm pt-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-xl">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span>{course.rating}</span>
                <span className="text-slate-400 font-normal">({course.reviewsCount} تقييم)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{course.studentsCount} طالب مشترك</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>لغة الشرح: {course.language}</span>
              </div>
            </div>

            {/* Instructor Summary Bar */}
            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-slate-800/80">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/60 shadow-lg"
              />
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">مدرس الدورة المعلم:</span>
                <span className="text-sm font-bold text-white hover:text-purple-300 transition-colors cursor-pointer">
                  {course.instructor.name}
                </span>
                <span className="text-xs text-slate-400">{course.instructor.title}</span>
              </div>
            </div>
          </div>

          {/* Floating Course Purchase Card Column */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-5 relative">
              {/* Image / Video Preview */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(true)}
                    className="w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl shadow-purple-600/50 hover:bg-purple-500 hover:scale-110 transition-all cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </button>
                  <span className="text-xs font-bold text-white drop-shadow-md">معاينة فيديو الدورة الترويجي</span>
                </div>
              </div>

              {/* Pricing Row */}
              <div className="flex items-baseline justify-between border-b border-slate-800 pb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400">${course.price}</span>
                  {course.originalPrice && (
                    <span className="text-base text-slate-500 line-through">${course.originalPrice}</span>
                  )}
                </div>
                {course.originalPrice && (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg">
                    خصم {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Primary Action Buttons (Add to Cart & Wishlist) */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    isInCart
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30"
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isInCart ? "في سلة التسوق (انقر للإلغاء)" : "إضافة إلى السلة الان"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    isWishlisted
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span>{isWishlisted ? "المفضلة (مُضافة)" : "إضافة إلى المفضلة"}</span>
                </button>
              </div>

              {/* Course Key Features / Information Cards List */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{course.duration} من المحتوى المرئي الفاخر</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{course.lessonsCount} درسًا تعليميًا مقسمًا بعناية</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>شهادة إتمام رسمية موثقة برمز QR</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>وصول مدى الحياة عبر جميع الأجهزة</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-6 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            نظرة عامة عن الدورة
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("curriculum")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "curriculum"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            المنهج والدروس ({course.curriculum.reduce((acc, m) => acc + m.lessons.length, 0)})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("qa")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "qa"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            الأسئلة والأجوبة ({qaItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "reviews"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            تقييمات الطلاب ({course.reviewsList.length})
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-8">
                {/* What You Will Learn Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>ماذا ستتعلم في هذه الدورة؟</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.whatYouWillLearn.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm text-slate-200 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Description Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-3">تفاصيل الدورة التدريبية</h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {course.fullDescription}
                  </p>
                </div>

                {/* Requirements Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-3">متطلبات الدورة</h3>
                  <ul className="flex flex-col gap-2">
                    {course.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* CURRICULUM TAB */}
            {activeTab === "curriculum" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-white">منهج الدورة التدريبية</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {course.curriculum.length} وحدات • {course.lessonsCount} درساً • الإجمالي {course.duration}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {course.curriculum.map((module) => {
                    const isExpanded = expandedModules[module.id];
                    return (
                      <div key={module.id} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
                        <button
                          type="button"
                          onClick={() => toggleModule(module.id)}
                          className="w-full p-4 flex items-center justify-between text-right bg-slate-900/80 hover:bg-slate-800/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-purple-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="text-sm font-bold text-white">{module.title}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">{module.lessonsCount} دروس ({module.totalDuration})</span>
                        </button>

                        {isExpanded && (
                          <div className="flex flex-col border-t border-slate-800 divide-y divide-slate-800/60">
                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-900/40 transition-colors text-xs">
                                <div className="flex items-center gap-3">
                                  <Video className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span className="font-semibold text-slate-200">{lesson.title}</span>
                                  {lesson.isFreePreview && (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-md">
                                      معاينة مجانية
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                  <span>{lesson.duration}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Q&A TAB */}
            {activeTab === "qa" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-400" />
                  <span>الأسئلة والأجوبة حول الدورة</span>
                </h3>

                {/* Add Question Form */}
                <form onSubmit={handleAddQuestion} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                  <label className="text-xs font-bold text-slate-300">اطرح سؤالاً على مدرب الدورة:</label>
                  <textarea
                    rows={2}
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="اكتب سؤالك أو استفسارك هنا..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      إرسال السؤال
                    </button>
                  </div>
                </form>

                {/* Q&A List */}
                <div className="flex flex-col gap-4">
                  {qaItems.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">لا توجد أسئلة سابقة بعد. كن أول من يطرح سؤالاً!</p>
                  ) : (
                    qaItems.map((qa) => (
                      <div key={qa.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-bold text-purple-300">{qa.author}</span>
                          <span>{qa.date}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white">س: {qa.question}</p>
                        <div className="bg-purple-950/30 border border-purple-500/20 p-3 rounded-xl mt-1 text-xs text-slate-300">
                          <span className="font-bold text-amber-300 block mb-1">إجابة المدرب:</span>
                          <p>{qa.answer}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-extrabold text-white">{course.rating}</div>
                    <div className="flex flex-col">
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 mt-1">متوسط تقييم الدورة بناءً على {course.reviewsCount} تقييماً</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {course.reviewsList.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">لا توجد تقييمات مكتوبة حتى الآن لهذه الدورة.</p>
                  ) : (
                    course.reviewsList.map((review) => (
                      <div key={review.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={review.userAvatar}
                              alt={review.userName}
                              className="w-8 h-8 rounded-full object-cover border border-purple-500/40"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white">{review.userName}</span>
                              <span className="text-[10px] text-slate-500">{review.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-400">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Instructor Full Section Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white">عن مدرب الدورة</h3>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-xl"
                />
                <div className="flex flex-col gap-1.5 flex-1">
                  <h4 className="text-base font-bold text-white">{course.instructor.name}</h4>
                  <p className="text-xs text-purple-300 font-medium">{course.instructor.title}</p>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{course.instructor.bio}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <span>⭐ {course.instructor.rating} تقييم المدرب</span>
                    <span>👨‍🎓 {course.instructor.studentsCount} طالب</span>
                    <span>📚 {course.instructor.coursesCount} دورة</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Related Courses Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">دورات ذات صلة</h3>

              <div className="flex flex-col gap-4">
                {relatedCourses.map((rel) => (
                  <div key={rel.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                    <img
                      src={rel.image}
                      alt={rel.title}
                      className="w-full h-28 object-cover rounded-xl"
                    />
                    <h4 className="text-xs font-bold text-white line-clamp-1">{rel.title}</h4>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-400 font-extrabold">${rel.price}</span>
                      <span className="text-slate-400">{rel.instructor.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/course/${rel.id}`)}
                      className="w-full mt-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>عرض التفاصيل</span>
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Video Modal Preview */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-4 flex flex-col gap-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">معاينة فيديو الدورة الترويجي</h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden">
              <video controls autoPlay className="w-full h-full">
                <source src={course.videoPreviewUrl} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailsPage;
