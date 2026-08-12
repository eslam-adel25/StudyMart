import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import CoursesPage from "./components/CoursesPage";
import CourseDetailsPage from "./components/CourseDetailsPage";
import TeacherSidebar from "./components/TeacherSidebar";
import StudentSidebar from "./components/StudentSidebar";
import { GraduationCap, LayoutDashboard, UserCheck, BookOpen } from "lucide-react";

function NavigationHeader() {
  const location = useLocation();

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-tight">StudyMart</span>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">منصة الدورات والكتب</span>
          </div>
        </Link>

        {/* Navigation Switcher Links */}
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              location.pathname === "/" || location.pathname.startsWith("/course")
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>الدورات التدريبية</span>
          </Link>

          <Link
            to="/teacher"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              location.pathname.startsWith("/teacher")
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة المعلم</span>
          </Link>

          <Link
            to="/student"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              location.pathname.startsWith("/student")
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>لوحة الطالب</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 font-['Tajawal',sans-serif] text-slate-100 flex flex-col">
        <NavigationHeader />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<CoursesPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/course/:courseId" element={<CourseDetailsPage />} />
            <Route
              path="/teacher"
              element={
                <div className="p-6 flex justify-center" dir="rtl">
                  <div className="w-full max-w-[340px]">
                    <TeacherSidebar />
                  </div>
                </div>
              }
            />
            <Route
              path="/student"
              element={
                <div className="p-6 flex justify-center" dir="rtl">
                  <div className="w-full max-w-[340px]">
                    <StudentSidebar />
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
