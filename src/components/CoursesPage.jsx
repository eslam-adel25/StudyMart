import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mockCourses } from "../data/coursesData";
import {
  Search,
  Star,
  Clock,
  Users,
  BookOpen,
  ArrowLeft,
  Sparkles
} from "lucide-react";

export const CoursesPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");

  const categories = ["الكل", "التسويق الرقمي", "برمجة وتطوير الويب", "التصميم والجرافيك"];

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch =
      course.title.includes(searchTerm) ||
      course.shortDescription.includes(searchTerm) ||
      course.instructor.name.includes(searchTerm);
    const matchesCategory =
      selectedCategory === "الكل" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-['Tajawal',sans-serif] pb-16" dir="rtl">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>منصة StudyMart التعليمية للأعمال والمهن المستقبلية</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            استكشف أفضل <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300">الدورات التدريبية المعتمدة</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
            تعلم مهارات سوق العمل مع نخبة من أفضل المدرسين والخبراء المعتمدين في الوطن العربي واحصل على شهادات إتمام موثقة.
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم الدورة، الموضوع، أو اسم المدرب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Course Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">جميع الدورات المتاحة</h2>
            <p className="text-xs text-slate-400 mt-0.5">تم إيجاد {filteredCourses.length} دورة تدريبية</p>
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center my-8">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-200">لم يتم العثور على نتائج</h3>
            <p className="text-xs text-slate-400 mt-1">جرب البحث بكلمة مفتاحية مختلفة أو تغيير القسم المختصر.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 lg:gap-6 courses-container">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-slate-900 border border-slate-800/90 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 shadow-xl flex flex-col group cursor-pointer"
                onClick={() => handleCardClick(course.id)}
              >
                {/* Course Image Header */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                  
                  {/* Badge */}
                  {course.badge && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 text-slate-950 font-black text-[11px] rounded-lg shadow-md backdrop-blur-xs">
                      {course.badge}
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-slate-900/80 border border-slate-700 text-purple-300 font-bold text-[11px] rounded-md backdrop-blur-xs">
                    {course.category}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    {/* Ratings & Level */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span>{course.rating}</span>
                        <span className="text-slate-500 font-normal">({course.reviewsCount})</span>
                      </div>
                      <span className="text-slate-400 font-medium">{course.level}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug mb-2">
                      {course.title}
                    </h3>

                    {/* Short description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {course.shortDescription}
                    </p>

                    {/* Instructor Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <img
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="w-7 h-7 rounded-full object-cover border border-purple-500/40"
                      />
                      <span className="text-xs font-semibold text-slate-300">{course.instructor.name}</span>
                    </div>
                  </div>

                  {/* Footer Meta & Action Button */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-amber-400">${course.price}</span>
                        {course.originalPrice && (
                          <span className="text-xs text-slate-500 line-through">${course.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          {course.studentsCount}
                        </span>
                      </div>
                    </div>

                    {/* View Details Button ("عرض التفاصيل") */}
                    <Link
                      to={`/course/${course.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 group-hover:scale-102"
                    >
                      <span>عرض التفاصيل</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CoursesPage;
