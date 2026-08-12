# StudyMart — Release History & Changelog

All notable changes, architectural refactorings, and feature updates for StudyMart are documented in this file.

---

## [1.2.0] — 2026-08-12

### 🚀 Major Architectural Refactoring
- **Role-Based Navigation Restructuring**:
  - Reorganized Platform Owner sidebar navigation.
  - Formatted Platform Owner section into a single, dedicated collapsible sub-menu (`#owner-menu-section`) containing ONLY exclusive administrative controls (`إدارة الصفحة الرئيسية`, `إدارة الطلاب`, `إدارة المعلمين`).
  - Extracted shared content management features (`إضافة دورة جديدة`, `إدارة الدورات`, `إضافة كتاب`, `إدارة الكتب`) into a distinct "Content Management" menu section accessible to both Teachers and Owner.
- **Account Status & Suspension Engine**:
  - Integrated central `accountStatusService.js` to manage student blocking and teacher suspension across all storage keys.
  - Added dynamic Suspended Account Modal with copyable support email (`eslam.adel2596@gmail.com`) and phone (`01153054568`).
- **Comprehensive Documentation Suite**:
  - Created complete repository documentation system under `docs/` (`architecture.md`, `features.md`, `roles-and-permissions.md`, `routing.md`, `authentication.md`, `data-model.md`, `ui-ux.md`, `localization.md`, `setup.md`, `security.md`, `limitations.md`).
  - Created high-impact recruiter-friendly `README.md`.

---

## [1.1.0] — 2026-08-01

### ✨ Added
- Platform Owner Student Detail Page (`#owner/student-details?id=...`) with enrollment history, spend analysis, and private admin notes.
- Platform Owner Teacher Detail Page (`#owner/teacher-details?id=...`) with earnings analytics, published course catalog, and private admin notes.
- Dedicated Public Reviews Page (`#public-reviews`) accessible to all visitors.
- Question Bank with Gemini AI auto-generation capabilities (`@google/genai`).
- Printable PDF Invoice & Receipt generator (`jsPDF` & `html2pdf.js`).

---

## [1.0.0] — 2026-07-15

### 🎉 Initial Release
- Initial release of StudyMart SPA platform built with Vite, React 18/19, Tailwind CSS, and Vanilla JS modules.
- Course catalog, video lecture player, digital books library with PDF.js reader.
- Shopping cart, simulated payment checkout, and wishlist system.
