// هذا المكون مسؤول عن عرض وتفاعل القائمة الجانبية لبيئة الطالب (Student Sidebar).
import React from "react";
import {
  User,
  GraduationCap,
  BookOpen,
  ShoppingCart,
  Heart,
  LogOut,
  ChevronLeft
} from "lucide-react";

export const StudentSidebar = ({
  studentName = "إسلام عادل",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
  activeItem = "profile",
  onNavigate,
  onLogout
}) => {
  // عناصر القائمة الجانبية للطالب
  const menuItems = [
    { key: "profile", title: "تعديل البروفايل", icon: User },
    { key: "courses", title: "دوراتي", icon: GraduationCap },
    { key: "books", title: "كتبي", icon: BookOpen },
    { key: "purchases", title: "مشترياتي", icon: ShoppingCart },
    { key: "favorites", title: "المفضلة", icon: Heart }
  ];

  // التعامل مع النقر على عناصر القائمة وتوجيه الصفحة
  const handleItemClick = (key) => {
    if (key === "purchases") {
      if (typeof window !== "undefined" && window.renderPurchasesPage) {
        window.renderPurchasesPage();
      } else {
        window.location.hash = "#student/purchases";
      }
    } else if (key === "courses") {
      if (typeof window !== "undefined" && window.openMyCourses) {
        window.openMyCourses();
      } else {
        window.location.hash = "#student/my-courses";
      }
    } else if (key === "books") {
      if (typeof window !== "undefined" && window.openMyBooks) {
        window.openMyBooks();
      } else {
        window.location.hash = "#student/my-books";
      }
    } else if (key === "profile") {
      if (typeof window !== "undefined" && window.renderProfilePage) {
        window.renderProfilePage();
      } else {
        window.location.hash = "#student/profile";
      }
    } else if (key === "favorites") {
      if (typeof window !== "undefined" && window.renderFavoritesPage) {
        window.renderFavoritesPage();
      } else {
        window.location.hash = "#student/favorites";
      }
    }

    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <aside
      dir="rtl"
      className="w-full max-w-[340px] bg-white rounded-[20px] p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 font-['Tajawal',sans-serif] transition-all duration-300"
    >
      {/* الهيدر العلوي ومعلومات الطالب */}
      <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-purple-50 via-purple-100/60 to-indigo-50 p-6 flex flex-col items-center justify-center text-center shadow-xs">
        {/* خلفية زخرفية هندسية */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 280 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="50" fill="#7c3aed" />
            <rect x="190" y="-10" width="80" height="80" rx="18" transform="rotate(25 190 -10)" fill="#8b5cf6" />
            <circle cx="240" cy="110" r="35" fill="#6366f1" />
            <path d="M-10 110 L40 160 L-60 160 Z" fill="#a855f7" />
          </svg>
        </div>

        {/* الصورة الشخصية */}
        <div className="relative z-10 mb-3">
          <img
            src={avatarUrl}
            alt={studentName}
            className="w-[70px] h-[70px] rounded-full object-cover border-3 border-white shadow-[0_4px_14px_rgba(124,58,237,0.18)]"
            onError={(e) => {
              e.target.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2364748b"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-1.04-4.83-2.62.03-1.6 3.22-2.48 4.83-2.48 1.6 0 4.8.88 4.83 2.48C15.8 18.96 14.03 20 12 20z"/></svg>';
            }}
          />
        </div>

        {/* اسم وحالة الطالب */}
        <h3 className="relative z-10 text-[18px] font-bold text-slate-900 tracking-tight mb-1">
          {studentName}
        </h3>
        <span className="relative z-10 text-[13px] font-medium text-purple-700 bg-white/80 backdrop-blur-xs px-3 py-0.5 rounded-full shadow-xs">
          طالب
        </span>
      </div>

      {/* قائمة التنقل */}
      <nav className="flex flex-col gap-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeItem === item.key;

          return (
            <React.Fragment key={item.key}>
              <button
                type="button"
                onClick={() => handleItemClick(item.key)}
                className={`group h-[60px] min-h-[60px] px-4 rounded-xl flex items-center justify-between w-full transition-all duration-200 cursor-pointer text-right border-none outline-none ${
                  isActive
                    ? "bg-purple-50/70 text-purple-900 font-semibold"
                    : "hover:bg-slate-50 text-slate-700 font-medium"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 stroke-[1.8] transition-colors ${
                      isActive
                        ? "text-purple-600"
                        : "text-slate-500 group-hover:text-purple-600"
                    }`}
                  />
                  <span className="text-[15px]">{item.title}</span>
                </div>

                <ChevronLeft className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-purple-600 group-hover:-translate-x-1 transition-all duration-200" />
              </button>

              {index < menuItems.length - 1 && (
                <div className="h-[1px] bg-slate-100 my-0.5 mx-2" />
              )}
            </React.Fragment>
          );
        })}

        {/* فاصل زر تسجيل الخروج */}
        <div className="h-[1px] bg-slate-200/80 my-2 mx-1" />

        {/* زر تسجيل الخروج */}
        <button
          type="button"
          onClick={() => {
            if (onLogout) {
              onLogout();
            } else if (typeof window !== "undefined" && window.handleLogout) {
              window.handleLogout();
            }
          }}
          className="group h-[60px] min-h-[60px] px-4 rounded-xl flex items-center justify-between w-full transition-all duration-200 cursor-pointer text-right border-none outline-none hover:bg-rose-50 text-rose-600 font-medium"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 shrink-0 stroke-[1.8] text-rose-500 group-hover:text-rose-600" />
            <span className="text-[15px] text-rose-600 font-semibold">تسجيل الخروج</span>
          </div>
          <ChevronLeft className="w-4 h-4 shrink-0 text-rose-300 group-hover:text-rose-500 group-hover:-translate-x-1 transition-all duration-200" />
        </button>
      </nav>
    </aside>
  );
};

export default StudentSidebar;
