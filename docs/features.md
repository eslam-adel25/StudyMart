# StudyMart — Complete Feature Inventory

This document provides a comprehensive inventory of all features implemented across StudyMart, verified directly from source code implementation.

---

## 1. Feature Inventory Summary

| Feature Category | Features Count | Primary User Role |
|---|:---:|---|
| **Platform Owner Administration** | 5 | Platform Owner (`owner`) |
| **Teacher Management & Content Creation** | 10 | Teacher (`teacher`), Owner (`owner`) |
| **Student Learning & Library** | 8 | Student (`student`), Teacher (`teacher`), Owner (`owner`) |
| **Public Browsing & Discovery** | 6 | All Users & Guests |
| **Shared Platform Services** | 7 | All Registered Users |

---

## 2. Platform Owner Exclusive Features (`owner`)

### 1. Homepage Management (`#owner/homepage-management`)
- **Purpose**: Controls featured content displayed on the public landing page.
- **Capabilities**: Toggle featured courses, featured digital books, highlighted top teachers, and student testimonial cards.
- **Service File**: `/js/services/homepageManagementService.js`
- **Persistence**: `localStorage.getItem("studyMart_featured_config")` & fallback `.featured-config.js`.

### 2. Global Student Management (`#owner/students`)
- **Purpose**: Comprehensive administrative oversight over all student accounts on the platform.
- **Capabilities**: Real-time student search and filter, view student detail page (`#owner/student-details?id=...`), inspect enrollment history, total spent, view/edit private admin notes, and **Block / Unblock** student accounts.
- **Exporting**: Export filtered student list to PDF or trigger browser print formatted view.
- **Service File**: `/js/services/ownerStudentsService.js`
- **Persistence**: `localStorage.getItem("studyMart_blocked_accounts")` & `studyMart_users`.

### 3. Global Teacher Management (`#owner/teachers`)
- **Purpose**: Comprehensive administrative oversight over all instructor accounts.
- **Capabilities**: Search and filter teachers, view teacher detail page (`#owner/teacher-details?id=...`), inspect published courses & books, total revenue generated, view/edit private admin notes, and **Suspend / Reactivate** teacher accounts.
- **Exporting**: Export filtered teacher list to PDF or trigger browser print formatted view.
- **Service File**: `/js/services/ownerTeachersService.js`
- **Persistence**: `localStorage.getItem("studyMart_blocked_accounts")` & `studyMart_users`.

### 4. Payout Approval Workflow (`#teacher/payouts`)
- **Purpose**: Financial disbursement approval system for teacher withdrawal requests.
- **Capabilities**: Filter payout requests by status (`Pending`, `Under Review`, `Approved`, `Rejected`), review teacher bank/payout details, approve payouts or reject with reason feedback.
- **Service File**: `/js/services/payoutsService.js`
- **Persistence**: `localStorage.getItem("studyMart_payouts")`.

### 5. Platform Revenue Ledger (`#teacher/revenue`)
- **Purpose**: Financial tracking of total platform volume and platform 10% commission.
- **Capabilities**: Visual revenue charts, total sales metrics, net platform income calculations, transaction logs, and PDF export.
- **Service File**: `/js/services/revenueTransactionService.js`

---

## 3. Teacher Features (`teacher` & `owner`)

### 1. Course Builder Wizard (`#teacher/course-builder`)
- **Purpose**: Drag-and-drop course creation suite.
- **Capabilities**: Enter course title, description, category, level, price, thumbnail image URL, introductory video URL; structure curriculum into sections and lessons; attach downloadable files; publish or save as draft.
- **Service File**: `/js/services/courseBuilderService.js`

### 2. Course Management Dashboard (`#teacher/courses`)
- **Purpose**: Central hub for instructors to manage their course catalog.
- **Capabilities**: List owned courses, search/filter by status (`Published`/`Draft`), edit course details, toggle status, delete courses.
- **Service File**: `/js/services/courseManagementService.js`

### 3. Digital Book Builder Wizard (`#teacher/book-builder`)
- **Purpose**: Digital book publishing suite.
- **Capabilities**: Book metadata (title, author, category, price, description, cover image), PDF file upload/URL, specify free preview page limit, define table of contents chapters, publish or draft.
- **Service File**: `/js/services/bookBuilderService.js`

### 4. Digital Book Management Dashboard (`#teacher/books`)
- **Purpose**: Dashboard to manage published digital books.
- **Capabilities**: List published books, price adjustments, status toggles, deletion, and preview link generation.
- **Service File**: `/js/services/bookManagementService.js`

### 5. Question Bank & AI Question Generator (`#teacher/question-bank`)
- **Purpose**: Reusable quiz question repository.
- **Capabilities**: Create multiple choice, true/false, essay, code, and matching questions. Includes Gemini AI auto-generation based on topic/difficulty.
- **Service File**: `/js/services/questionBankService.js` & `/js/services/advancedQuestionEditorService.js`

### 6. Interactive Quiz & Assignment Builder (`#teacher/quiz-builder`)
- **Purpose**: Create timed quizzes and graded assignments for courses.
- **Capabilities**: Set time limits, passing scores, attach questions from question bank, configure auto-grading or manual submission review.
- **Service File**: `/js/services/advancedQuizService.js` & `/js/services/advancedAssignmentService.js`

### 7. Enrolled Students & Gradebook (`#teacher/students`)
- **Purpose**: Student progress monitoring for teacher courses.
- **Capabilities**: View list of students enrolled in teacher's courses, progress completion percentage, quiz scores, assignment grades, and write student progress notes.
- **Service File**: `/js/services/enrolledStudentsService.js`

### 8. Student Reviews Management (`#teacher/reviews`)
- **Purpose**: Inspect student feedback and ratings.
- **Capabilities**: View reviews on teacher's courses and books, filter by rating stars, reply to student reviews.
- **Service File**: `/js/services/studentReviewsService.js`

### 9. Message Center (`#teacher/messages`)
- **Purpose**: In-app messaging system for student inquiries.
- **Capabilities**: Instant messaging threads, search conversations, filter unread messages, send file attachments.
- **Service File**: `/js/services/messageCenterService.js`

### 10. Teacher Wallet & Payout Submission (`#teacher/payouts`)
- **Purpose**: Wallet management and withdrawal request submission.
- **Capabilities**: View total balance, available balance, pending payouts, submit new payout request (Bank Transfer, Vodafone Cash, InstaPay), track request approval status.
- **Service File**: `/js/services/payoutsService.js`

---

## 4. Student Features (`student`, `teacher`, `owner`)

### 1. Course Enrollment & Video Player (`#my-courses` & `#course-details?id=...`)
- **Purpose**: Interactive learning portal.
- **Capabilities**: Enroll in free/paid courses, stream video lectures, check off completed lessons, view curriculum sections, download lesson resources, take course quizzes.
- **Service File**: `/js/services/courseService.js`

### 2. Digital Book Library & PDF Reader (`#my-books` & `#reader/:bookId`)
- **Purpose**: Digital book reading experience.
- **Capabilities**: Purchased books library, embedded PDF reader powered by PDF.js, page navigation controls, zoom in/out, jump to page, bookmarking.
- **Service File**: `/js/services/bookService.js`

### 3. Shopping Cart & Checkout (`#cart` & `#checkout`)
- **Purpose**: E-commerce cart and checkout flow.
- **Capabilities**: Add/remove courses and books, apply promo discount codes, select payment method (Credit Card simulation, Vodafone Cash, InstaPay), complete instant purchase transaction.
- **Service File**: `/js/services/cartService.js` & `/js/services/paymentService.js`

### 4. Wishlist / Favorites (`#favorites`)
- **Purpose**: Bookmark saved courses and books.
- **Capabilities**: One-click heart button toggles across catalog, centralized favorites page, instant move-to-cart action.
- **Service File**: `/js/services/favoritesService.js`

### 5. Purchase History & Printable Invoices (`#purchases`)
- **Purpose**: Transaction records and official receipts.
- **Capabilities**: List past orders, view order breakdown, preview formatted A4 receipt, print or download PDF invoice.
- **Service File**: `/js/services/purchasesService.js` & `/js/services/invoicePdfService.js`

### 6. Course & Book Review Submission
- **Purpose**: Rating and feedback system.
- **Capabilities**: Star rating (1 to 5 stars), written review text, submit review for enrolled courses or purchased books.
- **Service File**: `/js/services/studentReviewsService.js`

### 7. Course Completion Certificates
- **Purpose**: Certificate of completion upon course finish.
- **Capabilities**: Auto-generated certificate upon reaching 100% course progress, student name, course title, issue date, instructor signature, PDF download/print.
- **Service File**: `/js/services/courseService.js`

---

## 5. Public / Guest Features

### 1. Public Landing Page (`#home`)
- **Hero Banner**: High-impact messaging with CTA buttons.
- **Featured Categories & Stats**: Overview of subjects and platform metrics.
- **Featured Courses & Books**: Top items configured by Platform Owner.
- **Top Instructors & Testimonials**: Highlighted educators and student feedback.

### 2. Public Course Catalog (`#courses`)
- Search by keyword, filter by category (e.g., Programming, Business, Design), level (Beginner, Intermediate, Advanced), price range, and sort by popularity or price.

### 3. Public Digital Books Catalog (`#books`)
- Search digital books, filter by category/author, view book details, read free preview pages.

### 4. Instructor Profile Page (`#teacher-profile/:key`)
- View instructor bio, social links, rating average, published courses, and published books.

### 5. Dedicated Public Reviews Page (`#public-reviews`)
- Consolidated feed of student reviews across courses and books with star filters.

### 6. Authentication Modal (`#login` / `#register`)
- Dual-tab login and register modal with Google Sign-In button, password visibility toggle, role selection card during registration (Student vs Teacher), and account status error handling.

---

## 6. Shared Platform Services

- **In-App Notification Center (`notificationService.js`)**: Real-time notification badge, list dropdown, mark as read, localStorage persistence.
- **Theme Switcher (`themeService.js`)**: Light and dark mode support with DOM class dynamic switching and preference saved in `localStorage`.
- **Global Navigation History (`navigationHistoryService.js`)**: In-app stack tracking for back button functionality.
- **Responsive Drawer Sidebar (`sidebarService.js`)**: Collapsible mobile sidebar overlay with active route highlighting.
- **Account Suspension & Blocking (`accountStatusService.js`)**: Intercepts blocked students and suspended teachers during login or navigation, showing dedicated suspension modal with support contact options.
