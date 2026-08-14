// هذا المكون مسؤول عن عرض وتفاعل القائمة الجانبية الخاصة بالمعلم (Teacher Sidebar).
import React, { useState } from "react";
import {
  User,
  PlusCircle,
  GraduationCap,
  PlusSquare,
  BookOpen,
  TrendingUp,
  Receipt,
  Users,
  Star,
  MessageSquare,
  Book,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronLeft,
} from "lucide-react";

export const TeacherSidebar = ({
  teacherName = "د. أحمد خليل",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  activeItem = "profile",
  onNavigate,
  onLogout,
}) => {
  // حالة التحكم في القائمة الأكورديون للإحصائيات
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState(activeItem);

  // التعامل مع تحديد خيارات القائمة والتنقل
  const handleSelect = (key) => {
    setSelectedItem(key);

    if (key === "profile") {
      if (typeof window !== "undefined" && window.renderProfilePage) {
        window.renderProfilePage();
      } else {
        window.location.hash = "#teacher/profile";
      }
    } else if (key === "add-course") {
      if (typeof window !== "undefined" && window.openAddCourse) {
        window.openAddCourse();
      }
    } else if (key === "add-book") {
      if (typeof window !== "undefined" && window.openAddBook) {
        window.openAddBook();
      }
    } else if (key === "manage-courses" || key === "purchased-courses") {
      if (
        typeof window !== "undefined" &&
        window.openCourseManagementDashboard
      ) {
        window.openCourseManagementDashboard();
      } else if (typeof window !== "undefined" && window.openMyCourses) {
        window.openMyCourses();
      } else {
        window.location.hash = "#teacher/my-courses";
      }
    } else if (key === "manage-books" || key === "purchased-books") {
      if (typeof window !== "undefined" && window.openMyBooks) {
        window.openMyBooks();
      } else {
        window.location.hash = "#teacher/my-books";
      }
    } else if (key === "revenue") {
      if (typeof window !== "undefined" && window.openRevenueDashboard) {
        window.openRevenueDashboard();
      } else {
        window.location.hash = "#teacher/revenue";
      }
    } else if (key === "transactions") {
      if (typeof window !== "undefined" && window.openTransactionHistory) {
        window.openTransactionHistory();
      } else {
        window.location.hash = "#teacher/transactions";
      }
    }

    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <aside
      dir="rtl"
      className="w-full max-w-80 bg-[#0b1329] text-slate-200 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800/80 flex flex-col gap-5 font-['Tajawal',sans-serif] select-none transition-all duration-300"
    >
      {/* الهيدر العلوي الشعار وبطاقة المعلم */}
      <div className="flex flex-col gap-4">
        {/* شعار المنصة */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]">
              <GraduationCap className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-tight">
                StudyMart
              </span>
              <span className="text-[10px] font-medium text-purple-400 tracking-wider uppercase block">
                لوحة المعلم
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md">
            PRO
          </span>
        </div>

        {/* بطاقة ملف المعلم */}
        <div
          onClick={() => handleSelect("profile")}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-slate-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={teacherName}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/60 shadow-md"
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-1.04-4.83-2.62.03-1.6 3.22-2.48 4.83-2.48 1.6 0 4.8.88 4.83 2.48C15.8 18.96 14.03 20 12 20z"/></svg>';
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b1329] rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                {teacherName}
              </span>
              <span className="text-xs font-medium text-slate-400">معلم</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform duration-200" />
        </div>
      </div>

      {/* أقسام التنقل الرئيسية */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-1 pl-1 max-h-[calc(100vh-220px)] custom-scrollbar">
        {/* قسم الحساب */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            الحساب
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <SidebarItem
              icon={User}
              title="تعديل البروفايل"
              active={selectedItem === "profile"}
              onClick={() => handleSelect("profile")}
            />
          </div>
        </div>

        {/* قسم إدارة المحتوى */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            إدارة المحتوى
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <SidebarItem
              icon={PlusCircle}
              title="إضافة دورة جديدة"
              active={selectedItem === "add-course"}
              onClick={() => handleSelect("add-course")}
              highlight
            />
            <SidebarItem
              icon={GraduationCap}
              title="إدارة الدورات"
              active={selectedItem === "manage-courses"}
              onClick={() => handleSelect("manage-courses")}
            />
            <SidebarItem
              icon={PlusSquare}
              title="إضافة كتاب"
              active={selectedItem === "add-book"}
              onClick={() => handleSelect("add-book")}
            />
            <SidebarItem
              icon={BookOpen}
              title="إدارة الكتب"
              active={selectedItem === "manage-books"}
              onClick={() => handleSelect("manage-books")}
            />
          </div>
        </div>

        {/* قسم المبيعات */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            المبيعات
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <SidebarItem
              icon={TrendingUp}
              title="الإيرادات"
              active={selectedItem === "revenue"}
              onClick={() => handleSelect("revenue")}
            />
            <SidebarItem
              icon={Receipt}
              title="سجل المعاملات"
              active={selectedItem === "transactions"}
              onClick={() => handleSelect("transactions")}
            />
          </div>
        </div>

        {/* قسم الطلاب */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            الطلاب
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <SidebarItem
              icon={Users}
              title="الطلاب المشتركون"
              active={selectedItem === "students"}
              onClick={() => handleSelect("students")}
            />
            <SidebarItem
              icon={Star}
              title="تقييمات الطلاب"
              active={selectedItem === "reviews"}
              onClick={() => handleSelect("reviews")}
            />
            <SidebarItem
              icon={MessageSquare}
              title="الرسائل (لاحقًا)"
              badge="لاحقًا"
              active={selectedItem === "messages"}
              onClick={() => handleSelect("messages")}
              disabled
            />
          </div>
        </div>

        {/* قسم المشتريات */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            المشتريات
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <SidebarItem
              icon={GraduationCap}
              title="الدورات التي اشتراها"
              active={selectedItem === "purchased-courses"}
              onClick={() => handleSelect("purchased-courses")}
            />
            <SidebarItem
              icon={Book}
              title="الكتب التي اشتراها"
              active={selectedItem === "purchased-books"}
              onClick={() => handleSelect("purchased-books")}
            />
          </div>
        </div>

        {/* قسم الإحصائيات (قائمة أكورديون تفاعلية) */}
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            الإحصائيات
          </span>
          <div className="mt-1 flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => setStatsExpanded(!statsExpanded)}
              className={`h-12 px-3.5 rounded-xl flex items-center justify-between w-full transition-all duration-200 cursor-pointer text-right border-none outline-none ${
                statsExpanded || selectedItem.startsWith("stats-")
                  ? "bg-purple-950/40 text-purple-300 font-semibold border border-purple-500/20"
                  : "hover:bg-slate-800/60 text-slate-300 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 shrink-0 stroke-[1.8] text-purple-400" />
                <span className="text-[14px]">الإحصائيات</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  statsExpanded ? "rotate-180 text-purple-400" : ""
                }`}
              />
            </button>

            {/* تفاصيل قائمة الإحصائيات */}
            <div
              className={`overflow-hidden transition-all duration-300 flex flex-col gap-1 pr-4 pl-1 ${
                statsExpanded
                  ? "max-h-50 opacity-100 mt-1"
                  : "max-h-0 opacity-0"
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelect("stats-overview")}
                className={`h-10 px-3 rounded-lg flex items-center justify-between text-xs font-medium transition-all ${
                  selectedItem === "stats-overview"
                    ? "text-purple-300 bg-purple-900/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <span>نظرة عامة</span>
                <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => handleSelect("stats-sales")}
                className={`h-10 px-3 rounded-lg flex items-center justify-between text-xs font-medium transition-all ${
                  selectedItem === "stats-sales"
                    ? "text-purple-300 bg-purple-900/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <span>إحصائيات المبيعات</span>
                <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
              </button>
              <button
                type="button"
                onClick={() => handleSelect("stats-students")}
                className={`h-10 px-3 rounded-lg flex items-center justify-between text-xs font-medium transition-all ${
                  selectedItem === "stats-students"
                    ? "text-purple-300 bg-purple-900/30 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <span>إحصائيات الطلاب</span>
                <ChevronLeft className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* زر تسجيل الخروج في الأسفل */}
      <div className="pt-2 border-t border-slate-800/80 mt-auto">
        <button
          type="button"
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else if (typeof window !== "undefined" && window.handleLogout) {
              window.handleLogout();
            }
          }}
          className="group h-12.5 px-3.5 rounded-xl flex items-center justify-between w-full transition-all duration-200 cursor-pointer text-right border border-red-500/10 hover:border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-semibold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 shrink-0 stroke-[1.8] text-red-400 group-hover:text-red-300" />
            <span className="text-[14px]">تسجيل الخروج</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-red-400/60 group-hover:text-red-300 group-hover:-translate-x-1 transition-all duration-200" />
        </button>
      </div>
    </aside>
  );
};

// عنصر القائمة الفرعي القابل لإعادة الاستخدام
const SidebarItem = ({
  icon: Icon,
  title,
  active,
  badge,
  highlight,
  disabled,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group h-12 px-3.5 rounded-xl flex items-center justify-between w-full transition-all duration-200 cursor-pointer text-right border-none outline-none ${
        active
          ? "bg-purple-600 text-white font-bold shadow-[0_4px_15px_rgba(124,58,237,0.3)]"
          : highlight
            ? "bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 font-semibold border border-purple-500/30"
            : disabled
              ? "opacity-60 cursor-not-allowed text-slate-400 hover:bg-slate-800/30"
              : "hover:bg-slate-800/60 text-slate-300 hover:text-white font-medium"
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon
          className={`w-5 h-5 shrink-0 stroke-[1.8] transition-colors ${
            active
              ? "text-white"
              : highlight
                ? "text-purple-400"
                : "text-slate-400 group-hover:text-purple-400"
          }`}
        />
        <span className="text-[14px] truncate">{title}</span>
      </div>

      {badge ? (
        <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md border border-slate-700">
          {badge}
        </span>
      ) : (
        <ChevronLeft
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            active
              ? "text-white"
              : "text-slate-500 group-hover:text-slate-300 group-hover:-translate-x-1"
          }`}
        />
      )}
    </button>
  );
};

export default TeacherSidebar;
