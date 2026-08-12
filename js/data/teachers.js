export const teachersData = [
  {
    id: "teacher-1",
    name: "د. أحمد خليل",
    nameEn: "Dr. Ahmed Khalil",
    email: "evip4158@gmail.com",
    gender: "male",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80",
    role: "مطور تطبيقات الجوال وخبير برمجيات",
    bio: "خبير تطوير تطبيقات الجوال بخبرة +8 سنوات. عمل سابقاً لدى Google وVodafone. متخصص في Flutter وReact Native.",
    experience: "+8 سنوات",
    company: "Google & Vodafone",
    specialization: "Flutter & React Native",
    rating: "4.8",
    studentsCount: "9.3K",
    coursesCount: 70
  },
  {
    id: "teacher-2",
    name: "أسماء محمد",
    nameEn: "Asmaa Mohammed",
    gender: "female",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    role: "خبيرة تسويق رقمي",
    bio: "خبيرة تسويق رقمي واستراتيجيات نمو بخبرة +7 سنوات. عملت لدى Meta وAmazon. متخصصة في SEO وPerformance Marketing.",
    experience: "+7 سنوات",
    company: "Meta & Amazon",
    specialization: "SEO & Performance Marketing",
    rating: "4.9",
    studentsCount: "6.1K",
    coursesCount: 35
  },
  {
    id: "teacher-3",
    name: "محمد إبراهيم",
    nameEn: "Mohammed Ibrahim",
    gender: "male",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    role: "مصمم جرافيك وUI/UX",
    bio: "مصمم واجهات وتجربة مستخدم بخبرة +10 سنوات. عمل سابقاً لدى Adobe وCanva. متخصص في Figma وDesign Systems.",
    experience: "+10 سنوات",
    company: "Adobe & Canva",
    specialization: "Figma & Design Systems",
    rating: "4.8",
    studentsCount: "7.2K",
    coursesCount: 45
  },
  {
    id: "teacher-4",
    name: "سارة خالد",
    nameEn: "Sarah Khaled",
    gender: "female",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    role: "خبيرة ذكاء اصطناعي",
    bio: "مهندسة ذكاء اصطناعي بخبرة +9 سنوات. عملت لدى IBM وMicrosoft. متخصصة في Python وMachine Learning.",
    experience: "+9 سنوات",
    company: "IBM & Microsoft",
    specialization: "Python & Machine Learning",
    rating: "5.0",
    studentsCount: "8.5K",
    coursesCount: 60
  },
  {
    id: "teacher-5",
    name: "أحمد حسن",
    nameEn: "Ahmed Hassan",
    gender: "male",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    role: "مطور ويب متكامل",
    bio: "مهندس برمجيات بخبرة 12 سنة. عمل لدى Microsoft وIBM. خبير في .NET وCloud Computing وتطوير الويب المتكامل.",
    experience: "+12 سنة",
    company: "Microsoft & IBM",
    specialization: ".NET & Cloud Computing",
    rating: "4.9",
    studentsCount: "12K",
    coursesCount: 95
  }
];

export function getTeacherById(idOrName) {
  if (!idOrName) return null;
  const target = String(idOrName).trim().toLowerCase();
  return teachersData.find(
    (t) =>
      t.id.toLowerCase() === target ||
      t.name.toLowerCase() === target ||
      t.nameEn.toLowerCase() === target ||
      target.includes(t.name.toLowerCase()) ||
      t.name.toLowerCase().includes(target)
  ) || null;
}
