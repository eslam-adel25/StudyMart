import { coursesData } from "../data/courses.js";
import { showCustomAlert } from "../utils/helpers.js";
import { hideAllMainSections } from "./layoutService.js";
import { isTeacher } from "./permissionService.js";
import {
  getQuestionBank,
  addQuestionToBank,
  updateBankQuestion,
  duplicateBankQuestion,
  toggleArchiveQuestion,
  deleteBankQuestion,
  searchBankQuestions
} from "./questionBankService.js";
import {
  openQuestionBankSelectorModal,
  openImportQuestionsFileModal,
  openQuizStatsModal,
  calculateQuizTotalScore
} from "./advancedQuizService.js";
import {
  openEditRubricModal,
  openTeacherSubmissionsModal,
  openAssignmentStatsModal,
  calculateRubricTotalPoints
} from "./advancedAssignmentService.js";
import {
  openStudentQuizModal,
  openStudentAssignmentModal
} from "./studentAssessmentService.js";
import { openAdvancedQuestionEditorModal } from "./advancedQuestionEditorService.js";

// Active editing state for course builder
let activeCourseState = null;
let activeTab = "info"; // info | requirements | curriculum | attachments | quizzes | pricing | messages | qna | preview
let autoSaveTimer = null;

/**
 * Validate Course Requirements for Save and Publishing
 * @param {Object} course 
 */
export function validateCourseForPublish(course) {
  if (!course) {
    return {
      isValid: false,
      missing: ["بيانات الدورة غير موجودة"],
      hasTitle: false,
      hasDescription: false,
      hasImage: false,
      hasSection: false,
      hasLesson: false
    };
  }

  const missing = [];

  const hasTitle = Boolean(course.title && course.title.trim().length > 0 && course.title.trim() !== "دورة جديدة بدون عنوان");
  if (!hasTitle) {
    missing.push("عنوان الدورة الرئيسي");
  }

  const hasDescription = Boolean(course.description && course.description.trim().length > 0);
  if (!hasDescription) {
    missing.push("وصف الدورة المختصر");
  }

  const hasImage = Boolean(course.image && course.image.trim().length > 0);
  if (!hasImage) {
    missing.push("صورة غلاف الدورة");
  }

  const hasSection = Boolean(course.sections && course.sections.length >= 1);
  if (!hasSection) {
    missing.push("قسم واحد على الأقل في المنهج");
  }

  const totalLessons = calculateTotalLessons(course);
  const hasLesson = totalLessons >= 1;
  if (!hasLesson) {
    missing.push("درس واحد على الأقل داخل المنهج");
  }

  return {
    isValid: missing.length === 0,
    missing,
    hasTitle,
    hasDescription,
    hasImage,
    hasSection,
    hasLesson
  };
}

/**
 * Initialize or Load Course into Course Builder
 * @param {number|string|null} courseId 
 */
export function openCourseBuilder(courseId = null) {
  if (!isTeacher(window.appState?.userRole)) {
    showCustomAlert("عذراً، لوحة إنتاج الدورات مخصصة للمعلمين والمالك فقط.");
    return;
  }

  // Close any modal overlay
  const modal = document.getElementById("dashboardModal");
  if (modal) modal.classList.remove("show");

  let courseObj = null;

  if (courseId) {
    const existing = coursesData.find((c) => String(c.id) === String(courseId));
    if (existing) {
      // Deep clone existing course object to builder state
      courseObj = JSON.parse(JSON.stringify(existing));
      courseObj.hasBeenSaved = true; // Existing loaded course was previously saved
    }
  }

  if (!courseObj) {
    // Brand new course skeleton - starts unsaved with clean slate
    courseObj = {
      id: Date.now(),
      title: "",
      shortTitle: "",
      description: "",
      longDescription: "",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop",
      previewVideo: "",
      category: "programming",
      subCategory: "web-development",
      level: "beginner",
      language: "العربية",
      tags: ["برمجة", "تعلم"],
      visibility: "draft", // draft | private | public
      publishedStatus: "draft",
      hasBeenSaved: false, // Brand new course must be explicitly saved first
      price: 0,
      pricingType: "paid", // free | paid
      discountPrice: 0,
      discountExpiry: "",
      currency: "USD",
      instructor: window.appState?.userData?.name || "المعلم",
      instructorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
      requirements: [],
      outcomes: [],
      sections: [],
      attachments: [],
      quizzes: [],
      assignments: [],
      certificate: {
        enabled: true,
        template: "standard-gold",
        name: "شهادة إتمام الدورة التدريبية"
      },
      welcomeMessage: "",
      congratulationsMessage: "",
      qna: [],
      reviews: [],
      stats: {
        studentsCount: 0, viewsCount: 0, totalRevenue: 0, completionRate: 0, avgRating: 5.0, reviewsCount: 0, questionsCount: 0
      },
      updatedAt: new Date().toISOString()
    };
  }

  // Ensure arrays exist
  if (!courseObj.requirements) courseObj.requirements = [];
  if (!courseObj.outcomes) courseObj.outcomes = [];
  if (!courseObj.sections) courseObj.sections = [];
  if (!courseObj.attachments) courseObj.attachments = [];
  if (!courseObj.quizzes) courseObj.quizzes = [];
  if (!courseObj.assignments) courseObj.assignments = [];
  if (!courseObj.qna) courseObj.qna = [];
  if (!courseObj.reviews) courseObj.reviews = [];

  activeCourseState = courseObj;
  activeTab = "info";

  // Hide other sections and show full page courseBuilderPage
  hideAllMainSections();
  const page = document.getElementById("courseBuilderPage");
  if (page) page.classList.remove("hidden");

  // Update hash
  const targetHash = courseId ? `#teacher/course-builder?id=${courseId}` : `#teacher/course-builder`;
  if (window.location.hash !== targetHash) {
    history.pushState(null, "", targetHash);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  renderCourseBuilderUI();
}

/**
 * Auto-calculate total course duration
 */
export function calculateTotalDuration(course) {
  if (!course || !course.sections) return 0;
  let totalMins = 0;
  course.sections.forEach((sec) => {
    if (sec.lessons && Array.isArray(sec.lessons)) {
      sec.lessons.forEach((les) => {
        totalMins += Number(les.duration) || 0;
      });
    }
  });
  return totalMins;
}

/**
 * Total lessons count helper
 */
export function calculateTotalLessons(course) {
  if (!course || !course.sections) return 0;
  let count = 0;
  course.sections.forEach((sec) => {
    count += sec.lessons ? sec.lessons.length : 0;
  });
  return count;
}

/**
 * Trigger Auto-Save Logic
 */
function triggerAutoSave() {
  const pill = document.getElementById("autoSaveStatusPill");
  if (!activeCourseState) return;

  if (!activeCourseState.hasBeenSaved) {
    if (pill) {
      pill.className = "auto-save-pill unsaved";
      pill.innerHTML = `لم يتم الحفظ بعد`;
    }
    return;
  }

  if (pill) {
    pill.className = "auto-save-pill saving";
    pill.innerHTML = `⏳ جاري الحفظ...`;
  }

  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    persistActiveCourseToData();
    if (pill) {
      pill.className = "auto-save-pill";
      pill.innerHTML = `✓ تم الحفظ الآن`;
    }
  }, 600);
}

/**
 * Save Active State back to global coursesData array
 */
export function persistActiveCourseToData() {
  if (!activeCourseState) return;

  activeCourseState.duration = calculateTotalDuration(activeCourseState);
  activeCourseState.lessons = calculateTotalLessons(activeCourseState);
  activeCourseState.updatedAt = new Date().toISOString();

  const index = coursesData.findIndex((c) => String(c.id) === String(activeCourseState.id));
  if (index >= 0) {
    coursesData[index] = JSON.parse(JSON.stringify(activeCourseState));
  } else {
    coursesData.unshift(JSON.parse(JSON.stringify(activeCourseState)));
  }

  // Update teacher courses list in appState
  if (window.appState) {
    if (!window.appState.userTeacherCourses) window.appState.userTeacherCourses = [];
    if (!window.appState.userTeacherCourses.includes(activeCourseState.title)) {
      window.appState.userTeacherCourses.push(activeCourseState.title);
    }
  }

  document.dispatchEvent(new CustomEvent("reloadCourses"));
  if (typeof window.notifyCourseSystemUpdated === "function") {
    window.notifyCourseSystemUpdated();
  }
}

/**
 * Manual Save Course Draft Button Handler
 */
window.manualSaveCourseDraft = function () {
  if (!activeCourseState) return;

  const validation = validateCourseForPublish(activeCourseState);

  const minMissing = [];
  if (!validation.hasTitle) minMissing.push("عنوان الدورة الرئيسي");
  if (!validation.hasDescription) minMissing.push("وصف الدورة المختصر");
  if (!validation.hasSection) minMissing.push("قسم واحد على الأقل في المنهج");
  if (!validation.hasLesson) minMissing.push("درس واحد على الأقل داخل المنهج");

  if (minMissing.length > 0) {
    showCustomAlert("يرجى إكمال الشروط الأساسية الأولى قبل الحفظ:\n• " + minMissing.join("\n• "));
    return;
  }

  activeCourseState.hasBeenSaved = true;
  persistActiveCourseToData();

  const pill = document.getElementById("autoSaveStatusPill");
  if (pill) {
    pill.className = "auto-save-pill";
    pill.innerHTML = "✓ تم الحفظ الآن";
  }

  showCustomAlert("💾 تم حفظ مسودة الدورة بنجاح!");
  renderCourseBuilderUI();
};

/**
 * Preview Button Handler
 */
window.handlePreviewClick = function () {
  if (!activeCourseState) return;
  if (!activeCourseState.hasBeenSaved) {
    showCustomAlert("معاينة الطالب غير متاحة حالياً. يجب أولاً إدخال البيانات وحفظ المسودة بنجاح.");
    return;
  }
  switchCourseBuilderTab("preview");
};

/**
 * Render Main Course Builder Interface
 */
export function renderCourseBuilderUI() {
  const container = document.getElementById("courseBuilderContent") || document.getElementById("dashboardContent");
  if (!container || !activeCourseState) return;

  const totalMins = calculateTotalDuration(activeCourseState);
  const totalLessonsCount = calculateTotalLessons(activeCourseState);
  const publishValidation = validateCourseForPublish(activeCourseState);
  const isSaved = Boolean(activeCourseState.hasBeenSaved);
  const canPublish = isSaved && publishValidation.isValid;

  let savePillClass = "auto-save-pill unsaved";
  let savePillText = "لم يتم الحفظ بعد";
  if (isSaved) {
    savePillClass = "auto-save-pill";
    savePillText = "✓ تم الحفظ الآن";
  }

  let statusBadgeClass = "status-badge draft";
  let statusBadgeText = "مسودة جديدة (غير محفوظة)";
  if (activeCourseState.publishedStatus === "published") {
    statusBadgeClass = "status-badge published";
    statusBadgeText = "منشورة";
  } else if (isSaved) {
    statusBadgeClass = "status-badge draft";
    statusBadgeText = "مسودة محفوظة";
  }

  container.innerHTML = `
    <div class="course-builder-container">
      
      <!-- TOP CONTROL BAR -->
      <div class="builder-top-bar">
        <div class="builder-top-bar-title-group">
          <button class="builder-back-btn" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else openCourseManagementDashboard();">
            ← العودة لإدارة الدورات
          </button>
          <span class="builder-top-bar-course-title">
            ${activeCourseState.title ? escapeHtml(activeCourseState.title) : "دورة جديدة بدون عنوان"}
          </span>
          <span class="${statusBadgeClass}">
            ${statusBadgeText}
          </span>
        </div>

        <div class="builder-top-bar-actions-group">
          <span id="autoSaveStatusPill" class="${savePillClass}">${savePillText}</span>

          <button type="button" class="btn btn-secondary builder-action-btn" onclick="manualSaveCourseDraft()">
            💾 حفظ المسودة
          </button>

          <button type="button" class="btn btn-outline-primary builder-action-btn" ${!isSaved ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''} ${!isSaved ? 'disabled title="يجب حفظ الدورة أولاً للمعاينة"' : ''} onclick="handlePreviewClick()">
            👁️ معاينة الطالب
          </button>

          <button type="button" class="btn btn-primary builder-action-btn" ${!canPublish ? 'style="opacity: 0.5; cursor: not-allowed;"' : ''} ${!canPublish ? `disabled title="${!isSaved ? 'يجب حفظ الدورة أولاً قبل النشر' : 'يرجى إكمال متطلبات النشر: ' + publishValidation.missing.join(', ')}"` : ''} onclick="handlePublishAction('publish')">
            🚀 نشر الدورة
          </button>
        </div>
      </div>

      <!-- TABS NAVIGATION -->
      <div class="builder-tabs-nav">
        <button class="builder-tab-btn ${activeTab === 'info' ? 'active' : ''}" onclick="switchCourseBuilderTab('info')">
          📝 1. بيانات الدورة
        </button>
        <button class="builder-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}" onclick="switchCourseBuilderTab('curriculum')">
          📚 2. منهج الدورة (${totalLessonsCount} درس / ${totalMins} دقيقة)
        </button>
        <button class="builder-tab-btn ${activeTab === 'attachments' ? 'active' : ''}" onclick="switchCourseBuilderTab('attachments')">
          📎 3. المرفقات والمصادر (${(activeCourseState.attachments || []).length})
        </button>
        <button class="builder-tab-btn ${activeTab === 'quizzes' ? 'active' : ''}" onclick="switchCourseBuilderTab('quizzes')">
          ❓ 4. الاختبارات والواجبات
        </button>
        <button class="builder-tab-btn ${activeTab === 'pricing' ? 'active' : ''}" onclick="switchCourseBuilderTab('pricing')">
          🏷️ 5. التسعير والشهادة
        </button>
        <button class="builder-tab-btn ${activeTab === 'messages' ? 'active' : ''}" onclick="switchCourseBuilderTab('messages')">
          💬 6. الرسائل الترحيبية
        </button>
        <button class="builder-tab-btn ${activeTab === 'preview' ? 'active' : ''}" onclick="switchCourseBuilderTab('preview')">
          👁️ 7. معاينة ونشر
        </button>
      </div>

      <!-- TAB 1: BASIC COURSE INFO -->
      <div class="builder-tab-panel ${activeTab === 'info' ? 'active' : ''}" id="panel-info">
        <h3 class="builder-section-title">📝 البيانات العامة للدورة التدريبية</h3>
        
        <div class="form-group-builder">
          <label>عنوان الدورة الرئيسي *</label>
          <input type="text" class="form-input-builder" value="${escapeHtml(activeCourseState.title || '')}" placeholder="مثال: احتراف تطوير واجهات المستخدم بـ React و Tailwind" oninput="updateCourseInfoField('title', this.value)" />
        </div>

        <div class="form-group-builder">
          <label>عنوان فرعي / مختصر *</label>
          <input type="text" class="form-input-builder" value="${escapeHtml(activeCourseState.description || '')}" placeholder="شرح مبسط ومباشر عن الهدف الأساسي من الدورة" oninput="updateCourseInfoField('description', this.value)" />
        </div>

        <div class="form-grid-2">
          <div class="form-group-builder">
            <label>التخصص الرئيسي (Category)</label>
            <select class="form-select-builder" onchange="updateCourseInfoField('category', this.value)">
              <option value="programming" ${activeCourseState.category === 'programming' ? 'selected' : ''}>البرمجة والتطوير</option>
              <option value="design" ${activeCourseState.category === 'design' ? 'selected' : ''}>التصميم والجرافيك</option>
              <option value="business" ${activeCourseState.category === 'business' ? 'selected' : ''}>إدارة الأعمال والتسويق</option>
              <option value="languages" ${activeCourseState.category === 'languages' ? 'selected' : ''}>اللغات والترجمة</option>
              <option value="math" ${activeCourseState.category === 'math' ? 'selected' : ''}>العلوم والرياضيات</option>
            </select>
          </div>

          <div class="form-group-builder">
            <label>المستوى المستهدف (Level)</label>
            <select class="form-select-builder" onchange="updateCourseInfoField('level', this.value)">
              <option value="beginner" ${activeCourseState.level === 'beginner' ? 'selected' : ''}>مبتدئ (Beginner)</option>
              <option value="intermediate" ${activeCourseState.level === 'intermediate' ? 'selected' : ''}>متوسط (Intermediate)</option>
              <option value="advanced" ${activeCourseState.level === 'advanced' ? 'selected' : ''}>متقدم (Advanced)</option>
              <option value="all" ${activeCourseState.level === 'all' ? 'selected' : ''}>جميع المستويات</option>
            </select>
          </div>
        </div>

        <!-- Cover Image & Media Upload -->
        <div class="form-grid-2" style="margin-top: 16px;">
          <div class="form-group-builder">
            <label>🖼️ صورة غلاف الدورة</label>
            <div class="builder-media-upload-row">
              <img src="${activeCourseState.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'}" alt="Preview" style="width: 100px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" />
              <button type="button" class="btn btn-secondary" onclick="triggerFileSelector('image')">تغيير الصورة</button>
            </div>
          </div>

          <div class="form-group-builder">
            <label>🎥 فيديو المعاينة الترويجي (Promo Video)</label>
            <div class="builder-media-upload-row">
              <input type="text" class="form-input-builder" style="flex: 1;" value="${escapeHtml(activeCourseState.previewVideo || '')}" placeholder="رابط MP4 أو YouTube" oninput="updateCourseInfoField('previewVideo', this.value)" />
              <button type="button" class="btn btn-secondary" onclick="triggerFileSelector('video')">رفع فيديو</button>
            </div>
          </div>
        </div>

        <div class="form-group-builder" style="margin-top: 16px;">
          <label>وصف مفصل وشامل للدورة (Long Description)</label>
          <div class="rich-editor-toolbar">
            <button type="button" onclick="formatRichText('b_longDesc', '**', '**')"><b>B</b></button>
            <button type="button" onclick="formatRichText('b_longDesc', '_', '_')"><i>I</i></button>
            <button type="button" onclick="formatRichText('b_longDesc', '\n- ', '')">• قائمة</button>
          </div>
          <textarea id="b_longDesc" class="form-textarea-builder" rows="6" placeholder="تفاصيل المنهج، الفئات المستهدفة، والمفاهيم المشروحة..." oninput="updateCourseInfoField('longDescription', this.value)">${escapeHtml(activeCourseState.longDescription || '')}</textarea>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <h3 class="builder-section-title" style="margin: 0; border: none; padding: 0;">🎯 مخرجات التعلم ومتطلبات الدورة</h3>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">حدد المتطلبات السابقة للحضور والنتائج التي سيحققها الطالب.</p>
          </div>
        </div>

        <div style="margin-top: 20px;">
          <h4 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">1. المهارات المكتسبة (ماذا سيتعلم الطالب؟)</h4>
          <div class="item-list-builder" id="outcomesListContainer">
            ${renderOutcomesListHtml()}
          </div>
          <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="addOutcomeItem()">➕ إضافة مخرج تعلم جديد</button>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <div>
          <h4 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">2. المتطلبات السابقة والبرامج المطلوبة</h4>
          <div class="item-list-builder" id="requirementsListContainer">
            ${renderRequirementsListHtml()}
          </div>
          <button type="button" class="btn btn-secondary" style="margin-top: 10px;" onclick="addRequirementItem()">➕ إضافة متطلب جديد</button>
        </div>
      </div>

      <!-- TAB 3: CURRICULUM TREE -->
      <div class="builder-tab-panel ${activeTab === 'curriculum' ? 'active' : ''}" id="panel-curriculum">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <div>
            <h3 class="builder-section-title" style="margin: 0; border: none; padding: 0;">📚 منهج الدورة (الأقسام والدروس)</h3>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">قم بتقسيم الدورة إلى وحدات دراسية ودروس تفاعلية.</p>
          </div>
          <button type="button" class="btn btn-primary" onclick="addNewSection()">➕ إضافة وحدة/قسم جديد</button>
        </div>

        <div class="curriculum-tree-container" id="curriculumTreeContainer">
          ${renderCurriculumTreeHtml()}
        </div>
      </div>

      <!-- TAB 4: ATTACHMENTS & RESOURCES MODULE -->
      <div class="builder-tab-panel ${activeTab === 'attachments' ? 'active' : ''}" id="panel-attachments">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <div>
            <h3 class="builder-section-title" style="margin: 0; border: none; padding: 0;">📎 مرفقات ومصادر الدورة</h3>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">دعم رفع ملفات من الجهاز (PDF, Word, PPT, Excel, ZIP, RAR, MP4) أو إدخال روابط خارجية (Google Drive, GitHub).</p>
          </div>
          <button type="button" class="btn btn-primary" onclick="openAddAttachmentModal()">➕ إضافة مرفق جديد</button>
        </div>

        <div class="attachments-grid-builder" id="attachmentsGridContainer">
          ${renderAttachmentsGridHtml()}
        </div>
      </div>

      <!-- TAB 5: QUIZZES & ASSIGNMENTS -->
      <div class="builder-tab-panel ${activeTab === 'quizzes' ? 'active' : ''}" id="panel-quizzes">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <h3 class="builder-section-title" style="margin: 0; border: none; padding: 0;">❓ الاختبارات والواجبات المدرسية</h3>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">إنشاء أسئلة اختيار من متعدد، صح/خطأ، وواجبات برفع ملفات.</p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="addNewQuiz()">❓ إضافة اختبار</button>
            <button type="button" class="btn btn-secondary" onclick="addNewAssignment()">📝 إضافة واجب</button>
          </div>
        </div>

        <div id="quizzesAssignmentsContainer">
          ${renderQuizzesAssignmentsHtml()}
        </div>
      </div>

      <!-- TAB 6: PRICING & CERTIFICATE -->
      <div class="builder-tab-panel ${activeTab === 'pricing' ? 'active' : ''}" id="panel-pricing">
        <h3 class="builder-section-title">🏷️ التسعير والشهادات</h3>
        
        <div class="form-grid-2">
          <div class="form-group-builder">
            <label>نوع التسعير</label>
            <select class="form-select-builder" id="b_pricingType" onchange="updateCoursePricingField('pricingType', this.value)">
              <option value="paid" ${activeCourseState.pricingType === 'paid' ? 'selected' : ''}>مدفوعة (Paid)</option>
              <option value="free" ${activeCourseState.pricingType === 'free' ? 'selected' : ''}>مجانية (Free)</option>
            </select>
          </div>

          <div class="form-group-builder">
            <label>العملة</label>
            <select class="form-select-builder" id="b_currency" onchange="updateCoursePricingField('currency', this.value)">
              <option value="USD" ${activeCourseState.currency === 'USD' ? 'selected' : ''}>دولار أمريكي ($)</option>
              <option value="SAR" ${activeCourseState.currency === 'SAR' ? 'selected' : ''}>ريال سعودي (SAR)</option>
              <option value="EGP" ${activeCourseState.currency === 'EGP' ? 'selected' : ''}>جنيه مصري (EGP)</option>
            </select>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group-builder">
            <label>سعر الدورة الرئيسي</label>
            <input type="number" class="form-input-builder" id="b_price" value="${activeCourseState.price || 0}" ${activeCourseState.pricingType === 'free' ? 'disabled' : ''} oninput="updateCoursePricingField('price', Number(this.value))" />
          </div>

          <div class="form-group-builder">
            <label>السعر بعد التخفيض (اختياري)</label>
            <input type="number" class="form-input-builder" id="b_discountPrice" value="${activeCourseState.discountPrice || 0}" ${activeCourseState.pricingType === 'free' ? 'disabled' : ''} oninput="updateCoursePricingField('discountPrice', Number(this.value))" />
          </div>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

        <h3 class="builder-section-title">🎓 إعدادات شهادة إتمام الدورة</h3>
        <div class="form-grid-2">
          <div class="form-group-builder">
            <label>تفعيل الشهادة</label>
            <select class="form-select-builder" onchange="updateCourseCertificateField('enabled', this.value === 'true')">
              <option value="true" ${activeCourseState.certificate?.enabled ? 'selected' : ''}>مفعلة تلقائياً عند الإتمام</option>
              <option value="false" ${!activeCourseState.certificate?.enabled ? 'selected' : ''}>معطلة</option>
            </select>
          </div>

          <div class="form-group-builder">
            <label>اسم الشهادة الظاهر</label>
            <input type="text" class="form-input-builder" value="${escapeHtml(activeCourseState.certificate?.name || '')}" oninput="updateCourseCertificateField('name', this.value)" placeholder="شهادة إتمام الدورة التدريبية" />
          </div>
        </div>
      </div>

      <!-- TAB 6: MESSAGES, QNA & REVIEWS -->
      <div class="builder-tab-panel ${activeTab === 'messages' || activeTab === 'qna' ? 'active' : ''}" id="panel-messages">
        <h3 class="builder-section-title">💬 الرسائل التلقائية للطالب</h3>
        
        <div class="form-group-builder">
          <label>👋 رسالة الترحيب (تظهر للطالب فور الشراء أو الاشتراك)</label>
          <textarea class="form-textarea-builder" rows="4" placeholder="أهلاً بك في الدورة! يسعدنا انضمامك..." oninput="updateCourseInfoField('welcomeMessage', this.value)">${escapeHtml(activeCourseState.welcomeMessage || '')}</textarea>
        </div>

        <div class="form-group-builder" style="margin-top: 16px;">
          <label>🏆 رسالة التهاني (تظهر عند إنهاء جميع دروس الدورة)</label>
          <textarea class="form-textarea-builder" rows="4" placeholder="تهانينا! لقد أتممت الدورة بنجاح..." oninput="updateCourseInfoField('congratulationsMessage', this.value)">${escapeHtml(activeCourseState.congratulationsMessage || '')}</textarea>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

        <h3 class="builder-section-title">🙋 استفسارات الطلاب والرد عليها</h3>
        <div id="builderQnaList">
          ${renderBuilderQnaHtml()}
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

        <h3 class="builder-section-title">⭐ تقييمات ومراجعات الدورة</h3>
        <div id="builderReviewsList">
          ${renderBuilderReviewsHtml()}
        </div>
      </div>

      <!-- TAB 9: PREVIEW & PUBLISH -->
      <div class="builder-tab-panel ${activeTab === 'preview' ? 'active' : ''}" id="panel-preview">
        <div style="background: #ffffff; padding: 20px; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
            📋 قائمة جاهزية وشروط نشر الدورة
          </h3>
          <div class="builder-preview-checklist-grid">
            <div style="padding: 10px 14px; border-radius: 10px; background: ${publishValidation.hasTitle ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${publishValidation.hasTitle ? '#bbf7d0' : '#fecaca'}; font-size: 13px; font-weight: 700; color: ${publishValidation.hasTitle ? '#166534' : '#991b1b'};">
              ${publishValidation.hasTitle ? '✓' : '❌'} عنوان الدورة الرئيسي
            </div>
            <div style="padding: 10px 14px; border-radius: 10px; background: ${publishValidation.hasDescription ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${publishValidation.hasDescription ? '#bbf7d0' : '#fecaca'}; font-size: 13px; font-weight: 700; color: ${publishValidation.hasDescription ? '#166534' : '#991b1b'};">
              ${publishValidation.hasDescription ? '✓' : '❌'} وصف الدورة المختصر
            </div>
            <div style="padding: 10px 14px; border-radius: 10px; background: ${publishValidation.hasImage ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${publishValidation.hasImage ? '#bbf7d0' : '#fecaca'}; font-size: 13px; font-weight: 700; color: ${publishValidation.hasImage ? '#166534' : '#991b1b'};">
              ${publishValidation.hasImage ? '✓' : '❌'} صورة غلاف الدورة
            </div>
            <div style="padding: 10px 14px; border-radius: 10px; background: ${publishValidation.hasSection ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${publishValidation.hasSection ? '#bbf7d0' : '#fecaca'}; font-size: 13px; font-weight: 700; color: ${publishValidation.hasSection ? '#166534' : '#991b1b'};">
              ${publishValidation.hasSection ? '✓' : '❌'} قسم واحد على الأقل
            </div>
            <div style="padding: 10px 14px; border-radius: 10px; background: ${publishValidation.hasLesson ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${publishValidation.hasLesson ? '#bbf7d0' : '#fecaca'}; font-size: 13px; font-weight: 700; color: ${publishValidation.hasLesson ? '#166534' : '#991b1b'};">
              ${publishValidation.hasLesson ? '✓' : '❌'} درس واحد على الأقل
            </div>
            <div style="padding: 10px 14px; border-radius: 10px; background: ${isSaved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isSaved ? '#bbf7d0' : '#fecaca'}; font-size: 13px; font-weight: 700; color: ${isSaved ? '#166534' : '#991b1b'};">
              ${isSaved ? '✓' : '❌'} حفظ المسودة الأولية
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary" onclick="manualSaveCourseDraft()">💾 حفظ المسودة</button>
            <button type="button" class="btn btn-primary" ${!canPublish ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="handlePublishAction('publish')">🚀 نشر الآن</button>
          </div>
        </div>

        <!-- Student View Simulation Box -->
        <div style="border: 2px dashed #cbd5e1; border-radius: 16px; padding: 20px; background: #ffffff;">
          <h4 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 800; color: #334155;">👁️ محاكاة صفحة الدورة للطلاب</h4>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <img src="${activeCourseState.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'}" alt="Cover" style="width: 240px; height: 150px; object-fit: cover; border-radius: 12px;" />
            <div style="flex: 1; min-width: 260px;">
              <span class="status-badge published">${activeCourseState.category || 'عام'}</span>
              <h2 style="margin: 8px 0; font-size: 22px;">${escapeHtml(activeCourseState.title) || 'دورة بدون عنوان'}</h2>
              <p style="color: #64748b; font-size: 14px;">${escapeHtml(activeCourseState.description) || 'لا يوجد وصف بعد.'}</p>
              <div style="display: flex; gap: 16px; font-weight: 700; color: var(--primary-color, #6d28d9); margin-top: 10px;">
                <span>💰 ${activeCourseState.pricingType === 'free' ? 'مجانية' : activeCourseState.price + ' ' + activeCourseState.currency}</span>
                <span>⏱️ ${totalMins} دقيقة</span>
                <span>📖 ${totalLessonsCount} درس</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Automatically scroll horizontal tab navigation bar to keep selected tab in view
  requestAnimationFrame(() => {
    const navContainer = container.querySelector(".builder-tabs-nav");
    const activeBtn = navContainer?.querySelector(".builder-tab-btn.active");
    if (navContainer && activeBtn) {
      scrollActiveTabIntoView(navContainer, activeBtn, true);
    }
  });
}

/**
 * Scroll active tab into view inside its horizontal scroll container
 */
export function scrollActiveTabIntoView(navContainer, activeBtn, smooth = true) {
  if (!navContainer || !activeBtn) return;

  const initialWindowY = window.scrollY;

  // Use native scrollIntoView with inline: "nearest" for precise horizontal placement
  activeBtn.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "nearest",
    inline: "nearest"
  });

  // Restore vertical window position if scrollIntoView altered it
  if (window.scrollY !== initialWindowY) {
    window.scrollTo({ top: initialWindowY, behavior: "instant" });
  }

  // Fallback calculation to guarantee padding from container edges
  const cRect = navContainer.getBoundingClientRect();
  const bRect = activeBtn.getBoundingClientRect();
  const padding = 12;

  if (cRect.width > 0 && bRect.width > 0) {
    if (bRect.left < cRect.left + padding) {
      const delta = bRect.left - (cRect.left + padding);
      navContainer.scrollBy({ left: delta, behavior: smooth ? "smooth" : "auto" });
    } else if (bRect.right > cRect.right - padding) {
      const delta = bRect.right - (cRect.right - padding);
      navContainer.scrollBy({ left: delta, behavior: smooth ? "smooth" : "auto" });
    }
  }
}

// Global helpers & handlers attached to window
export function switchCourseBuilderTab(tabKey) {
  if (tabKey === "requirements") tabKey = "info";
  if (tabKey === "qna") tabKey = "messages";
  if (tabKey === "preview" && (!activeCourseState || !activeCourseState.hasBeenSaved)) {
    showCustomAlert("معاينة الطالب غير متاحة حالياً. يجب أولاً إدخال البيانات وحفظ المسودة بنجاح.");
    return;
  }
  activeTab = tabKey;
  renderCourseBuilderUI();
}

window.switchCourseBuilderTab = switchCourseBuilderTab;
window.switchBuilderTab = function (tabKey) {
  const coursePage = document.getElementById("courseBuilderPage");
  if (coursePage && !coursePage.classList.contains("hidden")) {
    switchCourseBuilderTab(tabKey);
  } else if (typeof window.switchBookBuilderTab === "function") {
    window.switchBookBuilderTab(tabKey);
  } else {
    switchCourseBuilderTab(tabKey);
  }
};

window.updateCourseInfoField = function (field, value) {
  if (!activeCourseState) return;
  activeCourseState[field] = value;
  triggerAutoSave();
};

window.updateCourseTags = function (tagString) {
  if (!activeCourseState) return;
  activeCourseState.tags = tagString.split(",").map((s) => s.trim()).filter(Boolean);
  triggerAutoSave();
};

window.updateCoursePricingField = function (field, value) {
  if (!activeCourseState) return;
  activeCourseState[field] = value;
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.updateCourseCertificateField = function (field, value) {
  if (!activeCourseState) return;
  if (!activeCourseState.certificate) activeCourseState.certificate = {};
  activeCourseState.certificate[field] = value;
  triggerAutoSave();
};

window.formatRichText = function (textareaId, prefix, suffix) {
  const el = document.getElementById(textareaId);
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = el.value;
  const selected = text.substring(start, end) || "نص";
  const replacement = prefix + selected + suffix;
  el.value = text.substring(0, start) + replacement + text.substring(end);
  updateCourseInfoField('longDescription', el.value);
};

window.triggerFileSelector = function (type) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = type === "image" ? "image/*" : "video/*";
  input.onchange = () => {
    const file = input.files[0];
    if (file && activeCourseState) {
      const url = URL.createObjectURL(file);
      if (type === "image") {
        activeCourseState.image = url;
      } else {
        activeCourseState.previewVideo = url;
      }
      triggerAutoSave();
      renderCourseBuilderUI();
    }
  };
  input.click();
};

/* Requirements & Outcomes list rendering */
function renderRequirementsListHtml() {
  if (!activeCourseState || !activeCourseState.requirements || !activeCourseState.requirements.length) {
    return `<p style="color: #64748b; font-size: 13px;">لا توجد متطلبات مضافة بعد.</p>`;
  }
  return activeCourseState.requirements
    .map(
      (req, idx) => `
    <div class="item-row-builder">
      <span class="drag-handle">☰</span>
      <input type="text" class="form-input-builder" value="${escapeHtml(req)}" oninput="updateRequirementItem(${idx}, this.value)" />
      <button type="button" class="btn-icon-action" onclick="moveRequirement(${idx}, -1)" title="أعلى">↑</button>
      <button type="button" class="btn-icon-action" onclick="moveRequirement(${idx}, 1)" title="أسفل">↓</button>
      <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="deleteRequirementItem(${idx})" title="حذف">🗑️</button>
    </div>
  `
    )
    .join("");
}

function renderOutcomesListHtml() {
  if (!activeCourseState || !activeCourseState.outcomes || !activeCourseState.outcomes.length) {
    return `<p style="color: #64748b; font-size: 13px;">لا توجد مخرجات تعلم مضافة بعد.</p>`;
  }
  return activeCourseState.outcomes
    .map(
      (out, idx) => `
    <div class="item-row-builder">
      <span class="drag-handle">☰</span>
      <input type="text" class="form-input-builder" value="${escapeHtml(out)}" oninput="updateOutcomeItem(${idx}, this.value)" />
      <button type="button" class="btn-icon-action" onclick="moveOutcome(${idx}, -1)" title="أعلى">↑</button>
      <button type="button" class="btn-icon-action" onclick="moveOutcome(${idx}, 1)" title="أسفل">↓</button>
      <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="deleteOutcomeItem(${idx})" title="حذف">🗑️</button>
    </div>
  `
    )
    .join("");
}

window.addRequirementItem = function () {
  if (!activeCourseState) return;
  activeCourseState.requirements.push("متطلب جديد");
  triggerAutoSave();
  document.getElementById("requirementsListContainer").innerHTML = renderRequirementsListHtml();
};

window.updateRequirementItem = function (idx, val) {
  if (!activeCourseState) return;
  activeCourseState.requirements[idx] = val;
  triggerAutoSave();
};

window.deleteRequirementItem = function (idx) {
  if (!activeCourseState) return;
  activeCourseState.requirements.splice(idx, 1);
  triggerAutoSave();
  document.getElementById("requirementsListContainer").innerHTML = renderRequirementsListHtml();
};

window.moveRequirement = function (idx, dir) {
  if (!activeCourseState) return;
  const target = idx + dir;
  if (target < 0 || target >= activeCourseState.requirements.length) return;
  const temp = activeCourseState.requirements[idx];
  activeCourseState.requirements[idx] = activeCourseState.requirements[target];
  activeCourseState.requirements[target] = temp;
  triggerAutoSave();
  document.getElementById("requirementsListContainer").innerHTML = renderRequirementsListHtml();
};

window.addOutcomeItem = function () {
  if (!activeCourseState) return;
  activeCourseState.outcomes.push("مخرج تعلم جديد");
  triggerAutoSave();
  document.getElementById("outcomesListContainer").innerHTML = renderOutcomesListHtml();
};

window.updateOutcomeItem = function (idx, val) {
  if (!activeCourseState) return;
  activeCourseState.outcomes[idx] = val;
  triggerAutoSave();
};

window.deleteOutcomeItem = function (idx) {
  if (!activeCourseState) return;
  activeCourseState.outcomes.splice(idx, 1);
  triggerAutoSave();
  document.getElementById("outcomesListContainer").innerHTML = renderOutcomesListHtml();
};

window.moveOutcome = function (idx, dir) {
  if (!activeCourseState) return;
  const target = idx + dir;
  if (target < 0 || target >= activeCourseState.outcomes.length) return;
  const temp = activeCourseState.outcomes[idx];
  activeCourseState.outcomes[idx] = activeCourseState.outcomes[target];
  activeCourseState.outcomes[target] = temp;
  triggerAutoSave();
  document.getElementById("outcomesListContainer").innerHTML = renderOutcomesListHtml();
};

/* Curriculum Tree (Sections & Lessons) HTML Rendering & Operations */
function renderCurriculumTreeHtml() {
  if (!activeCourseState || !activeCourseState.sections || !activeCourseState.sections.length) {
    return `<div style="padding: 30px; text-align: center; color: #64748b;">لا توجد أقسام في المنهج بعد. اضغط على "إضافة وحدة/قسم جديد" للبدء.</div>`;
  }

  return activeCourseState.sections
    .map((section, sIdx) => {
      const lessonsList = section.lessons || [];
      return `
      <div class="section-builder-card">
        <div class="section-header-row" onclick="toggleSectionExpand(${sIdx})">
          <span class="drag-handle">☰</span>
          <input type="text" class="section-title-input" value="${escapeHtml(section.title)}" onclick="event.stopPropagation()" oninput="updateSectionTitle(${sIdx}, this.value)" placeholder="عنوان الوحدة" />
          <div class="section-actions" onclick="event.stopPropagation()">
            <button type="button" class="btn-icon-action" onclick="event.stopPropagation(); addNewLessonToSection(${sIdx})" title="إضافة درس">➕ درس</button>
            <button type="button" class="btn-icon-action" onclick="event.stopPropagation(); duplicateSection(${sIdx})" title="تكرار الوحدة">📋</button>
            <button type="button" class="btn-icon-action" onclick="event.stopPropagation(); moveSection(${sIdx}, -1)" title="أعلى">↑</button>
            <button type="button" class="btn-icon-action" onclick="event.stopPropagation(); moveSection(${sIdx}, 1)" title="أسفل">↓</button>
            <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="event.stopPropagation(); deleteSection(${sIdx})" title="حذف">🗑️</button>
          </div>
        </div>

        <div class="lessons-list-builder" style="display: ${section.isExpanded !== false ? 'flex' : 'none'};">
          ${lessonsList.length === 0 ? `<p style="font-size: 13px; color: #94a3b8; margin: 0;">لا توجد دروس في هذه الوحدة بعد.</p>` : ''}
          ${lessonsList.map((lesson, lIdx) => `
            <div class="lesson-builder-card">
              <div class="lesson-info-group">
                <span class="drag-handle">⋮⋮</span>
                <input type="text" class="form-input-builder" style="flex: 1; font-weight: 700;" value="${escapeHtml(lesson.title)}" oninput="updateLessonField(${sIdx}, ${lIdx}, 'title', this.value)" />
                <input type="number" class="form-input-builder" style="width: 80px;" value="${lesson.duration || 10}" title="المدة بالدقائق" oninput="updateLessonField(${sIdx}, ${lIdx}, 'duration', Number(this.value))" /> دقيقة
                <label style="font-size: 12px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
                  <input type="checkbox" ${lesson.isFreePreview ? 'checked' : ''} onchange="updateLessonField(${sIdx}, ${lIdx}, 'isFreePreview', this.checked)" /> معاينة مجانية
                </label>
              </div>

              <div class="section-actions">
                <button type="button" class="btn-icon-action" onclick="openLessonDetailsModal(${sIdx}, ${lIdx})" title="تعديل الفيديو والملفات">⚙️ التفاصيل</button>
                <button type="button" class="btn-icon-action" onclick="duplicateLesson(${sIdx}, ${lIdx})" title="تكرار">📋</button>
                <button type="button" class="btn-icon-action" onclick="moveLesson(${sIdx}, ${lIdx}, -1)" title="أعلى">↑</button>
                <button type="button" class="btn-icon-action" onclick="moveLesson(${sIdx}, ${lIdx}, 1)" title="أسفل">↓</button>
                <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="deleteLesson(${sIdx}, ${lIdx})" title="حذف">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    })
    .join("");
}

window.addNewSection = function () {
  if (!activeCourseState) return;
  activeCourseState.sections.push({
    id: "sec_" + Date.now(),
    title: `الوحدة ${activeCourseState.sections.length + 1}: عنوان الوحدة`,
    description: "",
    isExpanded: true,
    lessons: []
  });
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.toggleSectionExpand = function (sIdx) {
  if (!activeCourseState || !activeCourseState.sections[sIdx]) return;
  activeCourseState.sections[sIdx].isExpanded = !activeCourseState.sections[sIdx].isExpanded;
  renderCourseBuilderUI();
};

window.updateSectionTitle = function (sIdx, val) {
  if (!activeCourseState || !activeCourseState.sections[sIdx]) return;
  activeCourseState.sections[sIdx].title = val;
  triggerAutoSave();
};

window.deleteSection = function (sIdx) {
  if (!activeCourseState) return;
  activeCourseState.sections.splice(sIdx, 1);
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.duplicateSection = function (sIdx) {
  if (!activeCourseState) return;
  const clone = JSON.parse(JSON.stringify(activeCourseState.sections[sIdx]));
  clone.id = "sec_" + Date.now();
  clone.title += " (نسخة)";
  activeCourseState.sections.splice(sIdx + 1, 0, clone);
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.moveSection = function (sIdx, dir) {
  if (!activeCourseState) return;
  const target = sIdx + dir;
  if (target < 0 || target >= activeCourseState.sections.length) return;
  const temp = activeCourseState.sections[sIdx];
  activeCourseState.sections[sIdx] = activeCourseState.sections[target];
  activeCourseState.sections[target] = temp;
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.addNewLessonToSection = function (sIdx) {
  if (!activeCourseState || !activeCourseState.sections[sIdx]) return;
  const lessons = activeCourseState.sections[sIdx].lessons || [];
  lessons.push({
    id: "les_" + Date.now(),
    title: `درس ${lessons.length + 1}: عنوان الدرس الجديد`,
    description: "",
    videoUrl: "",
    duration: 10,
    isFreePreview: false,
    notes: "",
    thumbnail: ""
  });
  activeCourseState.sections[sIdx].lessons = lessons;
  activeCourseState.sections[sIdx].isExpanded = true;
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.updateLessonField = function (sIdx, lIdx, field, val) {
  if (!activeCourseState || !activeCourseState.sections[sIdx] || !activeCourseState.sections[sIdx].lessons[lIdx]) return;
  activeCourseState.sections[sIdx].lessons[lIdx][field] = val;
  triggerAutoSave();
};

window.deleteLesson = function (sIdx, lIdx) {
  if (!activeCourseState || !activeCourseState.sections[sIdx]) return;
  activeCourseState.sections[sIdx].lessons.splice(lIdx, 1);
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.duplicateLesson = function (sIdx, lIdx) {
  if (!activeCourseState || !activeCourseState.sections[sIdx]) return;
  const clone = JSON.parse(JSON.stringify(activeCourseState.sections[sIdx].lessons[lIdx]));
  clone.id = "les_" + Date.now();
  clone.title += " (نسخة)";
  activeCourseState.sections[sIdx].lessons.splice(lIdx + 1, 0, clone);
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.moveLesson = function (sIdx, lIdx, dir) {
  if (!activeCourseState || !activeCourseState.sections[sIdx]) return;
  const lessons = activeCourseState.sections[sIdx].lessons;
  const target = lIdx + dir;
  if (target < 0 || target >= lessons.length) return;
  const temp = lessons[lIdx];
  lessons[lIdx] = lessons[target];
  lessons[target] = temp;
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.openLessonDetailsModal = function (sIdx, lIdx) {
  const lesson = activeCourseState.sections[sIdx].lessons[lIdx];
  if (!lesson) return;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";
  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 600px;">
      <h3 style="margin-bottom: 16px; color: var(--primary-color);">🎥 تفاصيل الدرس والفيديو</h3>
      
      <div class="form-group-builder" style="margin-bottom: 12px;">
        <label>عنوان الدرس</label>
        <input type="text" id="m_les_title" class="form-input-builder" value="${escapeHtml(lesson.title)}" />
      </div>

      <div class="form-group-builder" style="margin-bottom: 12px;">
        <label>رابط الفيديو أو رفع ملف (MP4, MOV, WEBM)</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="m_les_videoUrl" class="form-input-builder" style="flex: 1;" value="${escapeHtml(lesson.videoUrl || '')}" placeholder="https://..." />
          <button type="button" class="btn btn-secondary" id="m_les_upload_btn">🎥 رفع فيديو</button>
        </div>
      </div>

      <div class="form-grid-2" style="margin-bottom: 12px;">
        <div class="form-group-builder">
          <label>المدة المقدرة (بالدقائق)</label>
          <input type="number" id="m_les_duration" class="form-input-builder" value="${lesson.duration || 10}" />
        </div>

        <div class="form-group-builder">
          <label>معاينة مجانية؟</label>
          <select id="m_les_free" class="form-select-builder">
            <option value="false" ${!lesson.isFreePreview ? 'selected' : ''}>غير مجاني (للمشتركين فقط)</option>
            <option value="true" ${lesson.isFreePreview ? 'selected' : ''}>مجاني (معاينة قبل الشراء)</option>
          </select>
        </div>
      </div>

      <div class="form-group-builder" style="margin-bottom: 16px;">
        <label>ملاحظات ومصادر الدرس</label>
        <textarea id="m_les_notes" class="form-textarea-builder" rows="3" placeholder="ملاحظات أو روابط إضافية...">${escapeHtml(lesson.notes || '')}</textarea>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
        <button type="button" class="btn btn-primary" id="m_les_save_btn">حفظ الدرس</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#m_les_upload_btn")?.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        overlay.querySelector("#m_les_videoUrl").value = url;
        showCustomAlert("تم رفع الفيديو بنجاح");
      }
    };
    fileInput.click();
  });

  overlay.querySelector("#m_les_save_btn")?.addEventListener("click", () => {
    lesson.title = overlay.querySelector("#m_les_title").value;
    lesson.videoUrl = overlay.querySelector("#m_les_videoUrl").value;
    lesson.duration = Number(overlay.querySelector("#m_les_duration").value) || 10;
    lesson.isFreePreview = overlay.querySelector("#m_les_free").value === "true";
    lesson.notes = overlay.querySelector("#m_les_notes").value;

    triggerAutoSave();
    overlay.remove();
    renderCourseBuilderUI();
  });
};

/* Attachments Module HTML & Logic */
function renderAttachmentsGridHtml() {
  if (!activeCourseState || !activeCourseState.attachments || !activeCourseState.attachments.length) {
    return `
      <div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px 20px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 14px;">
        <span style="font-size: 40px; color: #cbd5e1; display: block; margin-bottom: 10px;">📎</span>
        <h4 style="margin: 0 0 6px 0; font-size: 16px; color: #334155;">لا توجد مرفقات مضافة بعد</h4>
        <p style="margin: 0 0 16px 0; font-size: 13px;">قم بإضافة ملفات PDF, Word, PPT, Excel, ZIP أو روابط Google Drive و GitHub لمساعدة الطلاب.</p>
        <button type="button" class="btn btn-primary" onclick="openAddAttachmentModal()">➕ إضافة أول مرفق</button>
      </div>
    `;
  }

  return activeCourseState.attachments
    .map(
      (att, idx) => `
    <div class="attachment-card-builder">
      <div class="attachment-meta" style="flex: 1;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 18px;">${getAttachmentTypeIcon(att.type, att.sourceType)}</span>
          <h5 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${escapeHtml(att.name)}</h5>
        </div>
        <p style="margin: 0; font-size: 12px; color: #64748b;">
          النوع: <strong>${att.type}</strong> | المصدر: <strong>${att.sourceType === 'url' ? '🔗 رابط خارجي' : '📁 ملف مرفوع'}</strong> | الحجم: <strong>${att.size}</strong>
        </p>
      </div>
      <div style="display: flex; gap: 6px; align-items: center;">
        <a href="${att.url || '#'}" target="_blank" class="btn-icon-action" title="معاينة / فتح" style="text-decoration: none;">👁️</a>
        <a href="${att.url || '#'}" download="${att.name}" class="btn-icon-action" title="تحميل" style="text-decoration: none;">⬇️</a>
        <button type="button" class="btn-icon-action" title="تعديل" onclick="openAddAttachmentModal(${idx})">✏️</button>
        <button type="button" class="btn-icon-action" style="color: #ef4444;" title="حذف" onclick="deleteAttachment(${idx})">🗑️</button>
      </div>
    </div>
  `
    )
    .join("");
}

function getAttachmentTypeIcon(type, sourceType) {
  if (sourceType === "url" && (type === "Drive" || type === "GitHub")) {
    return type === "Drive" ? "🤖" : "🐙";
  }
  switch (type) {
    case "PDF": return "📄";
    case "Word": return "📝";
    case "PowerPoint": return "📊";
    case "Excel": return "📈";
    case "ZIP": return "📦";
    case "Image": return "🖼️";
    case "Video": return "🎥";
    case "Code": return "💻";
    default: return "📎";
  }
}

window.openAddAttachmentModal = function (editIdx = null) {
  const existingAtt = (editIdx !== null && activeCourseState.attachments && activeCourseState.attachments[editIdx]) ? activeCourseState.attachments[editIdx] : null;

  let currentSource = existingAtt ? (existingAtt.sourceType || (existingAtt.url && existingAtt.url.startsWith("http") ? "url" : "upload")) : "upload";
  let attachmentName = existingAtt ? existingAtt.name : "";
  let attachmentType = existingAtt ? existingAtt.type : "PDF";
  let externalUrl = existingAtt ? (existingAtt.url || "") : "";
  let scopeLevel = existingAtt ? (existingAtt.scopeLevel || "course") : "course";
  let targetId = existingAtt ? existingAtt.targetId : null;
  let fileSize = existingAtt ? (existingAtt.size || "") : "";
  let uploadedFileBlobUrl = existingAtt ? (existingAtt.fileBlobUrl || existingAtt.url || "") : "";
  let uploadProgress = existingAtt ? 100 : 0;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModalContent() {
    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 540px; width: 92%;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
            📎 ${existingAtt ? 'تعديل المرفق' : 'إضافة مرفق أو مصدر جديد'}
          </h3>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <!-- SOURCE SELECTION TOGGLE -->
        <div class="form-group-builder" style="margin-bottom: 16px;">
          <label style="font-weight: 700; margin-bottom: 8px; display: block;">مصدر المرفق (Attachment Source):</label>
          <div style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 12px;">
            <button type="button" id="btn_src_upload" style="flex: 1; text-align: center; padding: 10px; border-radius: 8px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; ${currentSource === 'upload' ? 'background: #ffffff; color: #6d28d9; box-shadow: 0 2px 6px rgba(0,0,0,0.08);' : 'background: transparent; color: #64748b;'}">
              📁 رفع ملف من الجهاز (Upload File)
            </button>

            <button type="button" id="btn_src_url" style="flex: 1; text-align: center; padding: 10px; border-radius: 8px; border: none; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; ${currentSource === 'url' ? 'background: #ffffff; color: #6d28d9; box-shadow: 0 2px 6px rgba(0,0,0,0.08);' : 'background: transparent; color: #64748b;'}">
              🔗 رابط خارجي (External Link)
            </button>
          </div>
        </div>

        <!-- MODE 1: FILE UPLOAD -->
        ${currentSource === 'upload' ? `
          <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; background: #f8fafc; margin-bottom: 16px;">
            <input type="file" id="m_att_file_input" style="display: none;" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.csv,image/*,video/mp4" />
            
            ${uploadedFileBlobUrl ? `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="font-size: 32px;">📄</div>
                <div style="font-weight: 700; color: #0f172a; word-break: break-all;">${escapeHtml(attachmentName || 'ملف مرفوع')}</div>
                <div style="font-size: 12px; color: #64748b;">الحجم: <strong>${fileSize || 'غير معروف'}</strong></div>
                
                <!-- PROGRESS BAR -->
                <div style="width: 100%; max-width: 320px; background: #e2e8f0; border-radius: 10px; height: 10px; overflow: hidden; margin-top: 6px;">
                  <div id="m_att_progress_bar" style="width: ${uploadProgress}%; height: 100%; background: #22c55e; transition: width 0.3s ease;"></div>
                </div>
                <span id="m_att_progress_text" style="font-size: 12px; font-weight: 700; color: #166534;">
                  ${uploadProgress === 100 ? '✓ تم رفع الملف بنجاح' : `جاري الرفع... ${uploadProgress}%`}
                </span>

                <!-- FILE ACTIONS -->
                <div class="att-file-actions-group">
                  <button type="button" class="btn btn-sm btn-secondary att-action-btn" id="m_att_btn_replace">🔄 استبدال الملف</button>
                  <a href="${uploadedFileBlobUrl}" target="_blank" class="btn btn-sm btn-outline-primary att-action-btn" style="text-decoration: none;">👁️ معاينة</a>
                  <a href="${uploadedFileBlobUrl}" download="${attachmentName}" class="btn btn-sm btn-outline-primary att-action-btn" style="text-decoration: none;">⬇️ تحميل</a>
                  <button type="button" class="btn btn-sm btn-danger att-action-btn" id="m_att_btn_remove">🗑️ إزالة</button>
                </div>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <span style="font-size: 36px; color: #6d28d9;">📤</span>
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #334155;">اضغط للاختيار أو جر الملف إلى هنا</p>
                <p style="margin: 0; font-size: 12px; color: #64748b;">الصيغ المدعومة: PDF, DOC, PPT, XLS, ZIP, RAR, Images, MP4, TXT, CSV (حتى 100MB)</p>
                <button type="button" class="btn btn-primary" id="m_att_btn_browse">اختيار ملف من الجهاز</button>
              </div>
            `}
          </div>
        ` : `
          <!-- MODE 2: EXTERNAL LINK -->
          <div class="form-group-builder" style="margin-bottom: 16px;">
            <label style="font-weight: 700;">رابط المرفق الخارجي (URL)</label>
            <input type="url" id="m_att_url_input" class="form-input-builder" value="${escapeHtml(externalUrl)}" placeholder="https://drive.google.com/file/d/... أو https://github.com/..." />
            <div id="m_att_url_error" style="font-size: 12px; color: #ef4444; margin-top: 4px; display: none;">يرجى إدخال رابط صحيح يبدأ بـ http:// أو https://</div>

            <!-- SUPPORTED SERVICES BADGES -->
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
              <span style="font-size: 11px; color: #64748b;">الخدمات المدعومة:</span>
              <span class="status-badge" style="background: #e0f2fe; color: #0369a1;">Google Drive</span>
              <span class="status-badge" style="background: #f1f5f9; color: #0f172a;">GitHub</span>
              <span class="status-badge" style="background: #eff6ff; color: #1d4ed8;">Dropbox</span>
              <span class="status-badge" style="background: #f0fdf4; color: #15803d;">OneDrive</span>
              <span class="status-badge" style="background: #fef3c7; color: #b45309;">روابط تنزيل مباشرة</span>
            </div>
          </div>
        `}

        <!-- COMMON METADATA INPUTS -->
        <div class="form-group-builder" style="margin-bottom: 12px;">
          <label style="font-weight: 700;">اسم المرفق الظاهر للطلاب</label>
          <input type="text" id="m_att_name_input" class="form-input-builder" value="${escapeHtml(attachmentName)}" placeholder="مثال: كتاب تمارين الدورة الشامل.pdf" />
        </div>

        <div class="form-grid-2" style="margin-bottom: 16px;">
          <div class="form-group-builder">
            <label style="font-weight: 700;">نوع المرفق</label>
            <select id="m_att_type_select" class="form-select-builder">
              <option value="PDF" ${attachmentType === 'PDF' ? 'selected' : ''}>PDF</option>
              <option value="Word" ${attachmentType === 'Word' ? 'selected' : ''}>Word Document (.docx)</option>
              <option value="PowerPoint" ${attachmentType === 'PowerPoint' ? 'selected' : ''}>PowerPoint (.pptx)</option>
              <option value="Excel" ${attachmentType === 'Excel' ? 'selected' : ''}>Excel Sheet (.xlsx)</option>
              <option value="ZIP" ${attachmentType === 'ZIP' ? 'selected' : ''}>ملف مضغوط (ZIP / RAR)</option>
              <option value="Image" ${attachmentType === 'Image' ? 'selected' : ''}>صورة توضيحية</option>
              <option value="Video" ${attachmentType === 'Video' ? 'selected' : ''}>فيديو (MP4)</option>
              <option value="Code" ${attachmentType === 'Code' ? 'selected' : ''}>كود برمجي / Text</option>
              <option value="Drive" ${attachmentType === 'Drive' ? 'selected' : ''}>Google Drive</option>
              <option value="GitHub" ${attachmentType === 'GitHub' ? 'selected' : ''}>GitHub Repository</option>
            </select>
          </div>

          <div class="form-group-builder">
            <label style="font-weight: 700;">نطاق التوفر</label>
            <select id="m_att_scope_select" class="form-select-builder">
              <option value="course" ${scopeLevel === 'course' ? 'selected' : ''}>الدورة ككل (عام)</option>
              ${(activeCourseState.sections || []).map((sec, sIdx) => `
                <option value="section_${sIdx}" ${scopeLevel === `section_${sIdx}` ? 'selected' : ''}>وحدة: ${escapeHtml(sec.title)}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="button" class="btn btn-primary" id="m_att_submit_btn">حفظ المرفق</button>
        </div>
      </div>
    `;

    // Attach local element event listeners
    const btnUpload = overlay.querySelector("#btn_src_upload");
    const btnUrl = overlay.querySelector("#btn_src_url");
    if (btnUpload) {
      btnUpload.onclick = () => {
        currentSource = "upload";
        renderModalContent();
      };
    }
    if (btnUrl) {
      btnUrl.onclick = () => {
        currentSource = "url";
        renderModalContent();
      };
    }

    const btnBrowse = overlay.querySelector("#m_att_btn_browse");
    const btnReplace = overlay.querySelector("#m_att_btn_replace");
    const btnRemove = overlay.querySelector("#m_att_btn_remove");
    const fileInput = overlay.querySelector("#m_att_file_input");

    if (btnBrowse && fileInput) {
      btnBrowse.onclick = () => fileInput.click();
    }
    if (btnReplace && fileInput) {
      btnReplace.onclick = () => fileInput.click();
    }
    if (btnRemove) {
      btnRemove.onclick = () => {
        uploadedFileBlobUrl = "";
        fileSize = "";
        uploadProgress = 0;
        renderModalContent();
      };
    }

    if (fileInput) {
      fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (!file) return;

        const MAX_MB = 100;
        if (file.size > MAX_MB * 1024 * 1024) {
          showCustomAlert(`حجم الملف كبير جداً (${(file.size / (1024 * 1024)).toFixed(1)} MB). الحد الأقصى هو ${MAX_MB} MB.`);
          return;
        }

        const nameInput = overlay.querySelector("#m_att_name_input");
        if (!attachmentName || (nameInput && !nameInput.value.trim())) {
          attachmentName = file.name;
        }

        if (file.size >= 1024 * 1024) {
          fileSize = (file.size / (1024 * 1024)).toFixed(1) + " MB";
        } else {
          fileSize = Math.max(1, Math.round(file.size / 1024)) + " KB";
        }

        const ext = file.name.split(".").pop().toLowerCase();
        if (["pdf"].includes(ext)) attachmentType = "PDF";
        else if (["doc", "docx"].includes(ext)) attachmentType = "Word";
        else if (["ppt", "pptx"].includes(ext)) attachmentType = "PowerPoint";
        else if (["xls", "xlsx", "csv"].includes(ext)) attachmentType = "Excel";
        else if (["zip", "rar", "7z"].includes(ext)) attachmentType = "ZIP";
        else if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) attachmentType = "Image";
        else if (["mp4", "webm", "mov"].includes(ext)) attachmentType = "Video";
        else if (["txt", "js", "py", "html", "css", "json"].includes(ext)) attachmentType = "Code";

        uploadedFileBlobUrl = URL.createObjectURL(file);
        uploadProgress = 0;
        renderModalContent();

        let step = 0;
        const interval = setInterval(() => {
          step += 25;
          uploadProgress = Math.min(100, step);
          const pBar = overlay.querySelector("#m_att_progress_bar");
          const pTxt = overlay.querySelector("#m_att_progress_text");
          if (pBar) pBar.style.width = uploadProgress + "%";
          if (pTxt) {
            if (uploadProgress === 100) {
              pTxt.innerHTML = "✓ تم رفع الملف بنجاح";
            } else {
              pTxt.innerHTML = `جاري الرفع... ${uploadProgress}%`;
            }
          }
          if (uploadProgress >= 100) {
            clearInterval(interval);
          }
        }, 100);
      };
    }

    const urlInput = overlay.querySelector("#m_att_url_input");
    if (urlInput) {
      urlInput.oninput = () => {
        externalUrl = urlInput.value.trim();
        const errEl = overlay.querySelector("#m_att_url_error");
        if (errEl) {
          if (externalUrl && !externalUrl.match(/^https?:\/\/.+/i)) {
            errEl.style.display = "block";
          } else {
            errEl.style.display = "none";
          }
        }
      };
    }

    overlay.querySelector("#m_att_submit_btn")?.addEventListener("click", () => {
      const nameVal = overlay.querySelector("#m_att_name_input")?.value.trim() || attachmentName.trim() || "مرفق جديد";
      const typeVal = overlay.querySelector("#m_att_type_select")?.value || attachmentType;
      const scopeVal = overlay.querySelector("#m_att_scope_select")?.value || scopeLevel;

      if (currentSource === "upload") {
        if (!uploadedFileBlobUrl) {
          showCustomAlert("يرجى اختيار ملف من الجهاز للرفع.");
          return;
        }
      } else {
        const urlVal = overlay.querySelector("#m_att_url_input")?.value.trim() || externalUrl.trim();
        if (!urlVal || !urlVal.match(/^https?:\/\/.+/i)) {
          showCustomAlert("يرجى إدخال رابط خارجي صحيح يبدأ بـ http:// أو https://");
          return;
        }
        externalUrl = urlVal;
      }

      const finalUrl = currentSource === "upload" ? uploadedFileBlobUrl : externalUrl;
      const finalSize = currentSource === "upload" ? (fileSize || "1.0 MB") : "رابط خارجي";

      const attObj = {
        id: existingAtt ? existingAtt.id : "att_" + Date.now(),
        name: nameVal,
        type: typeVal,
        sourceType: currentSource,
        url: finalUrl,
        fileBlobUrl: uploadedFileBlobUrl,
        scopeLevel: scopeVal,
        targetId: targetId,
        size: finalSize
      };

      if (!activeCourseState.attachments) activeCourseState.attachments = [];

      if (editIdx !== null && activeCourseState.attachments[editIdx]) {
        activeCourseState.attachments[editIdx] = attObj;
      } else {
        activeCourseState.attachments.push(attObj);
      }

      triggerAutoSave();
      overlay.remove();
      renderCourseBuilderUI();
    });
  }

  renderModalContent();
  document.body.appendChild(overlay);
};

window.deleteAttachment = function (idx) {
  if (!activeCourseState || !activeCourseState.attachments) return;
  activeCourseState.attachments.splice(idx, 1);
  triggerAutoSave();
  renderCourseBuilderUI();
};

/* Quizzes & Assignments HTML Rendering & Advanced Enterprise Operations */
function renderQuizzesAssignmentsHtml() {
  if (!activeCourseState) return "";

  const quizzes = activeCourseState.quizzes || [];
  const assignments = activeCourseState.assignments || [];

  return `
    <div style="margin-top: 16px;">
      
      <!-- TOP CENTRAL BANK TOOLBAR -->
      <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border: 1px solid #ddd6fe; border-radius: 14px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
        <div>
          <h4 style="margin: 0; color: #5b21b6; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            🏛️ بنك الأسئلة المركزي (Central Question Bank)
          </h4>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6d28d9;">
            مستودع الأسئلة القابلة لإعادة الاستخدام عبر كافة الدورات مع نظام الفهرسة، البحث، والتصنيف الحصري.
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" style="background: #6d28d9; border: none;" onclick="openQuestionBankManagerModal()">
            ⚙️ إدارة بنك الأسئلة
          </button>
          <button type="button" class="btn btn-outline-primary" style="background: #ffffff;" onclick="triggerDirectImportFile()">
            📊 استيراد أسئلة (CSV/Excel)
          </button>
        </div>
      </div>

      <!-- SECTION 1: QUIZZES -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">
          ❓ الاختبارات التفاعلية تقييمية (${quizzes.length})
        </h4>
        <button type="button" class="btn btn-sm btn-primary" onclick="addNewQuiz()">➕ إضافة اختبار جديد</button>
      </div>

      ${quizzes.length === 0 ? `
        <div style="text-align: center; color: #64748b; padding: 30px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
          لا توجد اختبارات تفاعلية مضافة لهذه الدورة بعد. اضغط على "إضافة اختبار جديد" للبدء.
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 30px;">
          ${quizzes.map((q, idx) => {
            const totalScore = calculateQuizTotalScore(q);
            const orderRuleText = q.questionOrder === 'random' ? 'ترتيب عشوائي' : q.questionOrder === 'shuffle_answers' ? 'خلط الخيارات' : 'ترتيب يدوي';
            
            return `
              <div class="quiz-question-card" style="border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
                  <div>
                    <h5 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">
                      ${escapeHtml(q.title)}
                    </h5>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; font-size: 12px; color: #64748b;">
                      <span>عدد الأسئلة: <strong>${q.questions.length}</strong></span> |
                      <span>الدرجة الكلية: <strong style="color: #16a34a;">${totalScore} نقطة</strong></span> |
                      <span>الزمن: <strong>${q.timeLimit} دقيقة</strong></span> |
                      <span>درجة النجاح: <strong>${q.passingGrade}%</strong></span>
                    </div>
                  </div>

                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <span class="status-badge" style="background: #e0f2fe; color: #0369a1;">${orderRuleText}</span>
                    <span class="status-badge" style="background: #f1f5f9; color: #475569;">${q.navigationRules?.allowBack !== false ? 'سماح بالرجوع' : 'تأكيد الإجابة'}</span>
                  </div>
                </div>

                <!-- ACTIONS BUTTONS ROW -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                  <button type="button" class="btn btn-sm btn-primary" onclick="openQuizEditorModal(${idx})">
                    ⚙️ تعديل الأسئلة والإعدادات
                  </button>

                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="triggerQuizStatsModal(${idx})">
                    📊 تحليلات وإحصائيات
                  </button>

                  <button type="button" class="btn btn-sm btn-secondary" onclick="triggerStudentQuizPreview(${idx})">
                    👁️ تجربة التقديم كطالب
                  </button>

                  <button type="button" class="btn btn-sm btn-danger" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; margin-right: auto;" onclick="deleteQuiz(${idx})">
                    🗑️ حذف
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

      <!-- SECTION 2: ASSIGNMENTS -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">
          📝 الواجبات والمشاريع التطبيقية (${assignments.length})
        </h4>
        <button type="button" class="btn btn-sm btn-primary" onclick="addNewAssignment()">➕ إضافة واجب جديد</button>
      </div>

      ${assignments.length === 0 ? `
        <div style="text-align: center; color: #64748b; padding: 30px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px;">
          لا توجد واجبات مضافة لهذه الدورة بعد. اضغط على "إضافة واجب جديد" للبدء.
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${assignments.map((a, idx) => {
            const rubricCount = (a.rubric || []).length;
            const totalRubricScore = calculateRubricTotalPoints(a.rubric);

            return `
              <div class="quiz-question-card" style="border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">
                  <div>
                    <h5 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">
                      ${escapeHtml(a.title)}
                    </h5>
                    <p style="margin: 4px 0 6px 0; font-size: 13px; color: #475569;">${escapeHtml(a.description || 'لا يوجد وصف مضاف')}</p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 12px; color: #64748b;">
                      <span>نوع التسليم: <strong>${a.submissionType === 'file' ? 'رفع ملفات' : 'إدخال نصي'}</strong></span> |
                      <span>الموعد النهائي: <strong>${a.deadline || 'مفتوح'}</strong></span> |
                      <span>أقصى محاولات: <strong>${a.maxAttempts || 3}</strong></span> |
                      <span>مصفوفة Rubric: <strong style="color: #6d28d9;">${rubricCount} معايير (${totalRubricScore} درجة)</strong></span>
                    </div>
                  </div>

                  <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <span class="status-badge" style="background: #f0fdf4; color: #166534;">${a.allowResubmission !== false ? 'يسمح بإعادة التسليم' : 'تسليم واحد'}</span>
                  </div>
                </div>

                <!-- ACTIONS BUTTONS ROW -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                  <button type="button" class="btn btn-sm btn-primary" onclick="openAssignmentEditorModal(${idx})">
                    ⚙️ تعديل الواجب والـ Rubric
                  </button>

                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="triggerTeacherSubmissionsModal(${idx})">
                    📝 تصحيح وتصنيف تسليمات الطلاب
                  </button>

                  <button type="button" class="btn btn-sm btn-secondary" onclick="triggerAssignmentStatsModal(${idx})">
                    📊 الإحصائيات
                  </button>

                  <button type="button" class="btn btn-sm btn-secondary" onclick="triggerStudentAssignmentPreview(${idx})">
                    👁️ معاينة كطالب
                  </button>

                  <button type="button" class="btn btn-sm btn-danger" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; margin-right: auto;" onclick="deleteAssignment(${idx})">
                    🗑️ حذف
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}

    </div>
  `;
}

/* WINDOW HANDLERS FOR QUIZZES & ASSIGNMENTS */

window.triggerDirectImportFile = function () {
  openImportQuestionsFileModal((importedQuestions) => {
    // Also attach to active course quizzes if needed
    if (activeCourseState && activeCourseState.quizzes && activeCourseState.quizzes.length > 0) {
      activeCourseState.quizzes[0].questions.push(...importedQuestions);
      triggerAutoSave();
      renderCourseBuilderUI();
    }
  });
};

window.triggerQuizStatsModal = function (idx) {
  if (!activeCourseState || !activeCourseState.quizzes[idx]) return;
  openQuizStatsModal(activeCourseState.quizzes[idx]);
};

window.triggerStudentQuizPreview = function (idx) {
  if (!activeCourseState || !activeCourseState.quizzes[idx]) return;
  openStudentQuizModal(activeCourseState.quizzes[idx], activeCourseState.title);
};

window.triggerTeacherSubmissionsModal = function (idx) {
  if (!activeCourseState || !activeCourseState.assignments[idx]) return;
  openTeacherSubmissionsModal(activeCourseState.assignments[idx]);
};

window.triggerAssignmentStatsModal = function (idx) {
  if (!activeCourseState || !activeCourseState.assignments[idx]) return;
  openAssignmentStatsModal(activeCourseState.assignments[idx]);
};

window.triggerStudentAssignmentPreview = function (idx) {
  if (!activeCourseState || !activeCourseState.assignments[idx]) return;
  openStudentAssignmentModal(activeCourseState.assignments[idx], activeCourseState.title);
};

window.addNewQuiz = function () {
  if (!activeCourseState) return;
  const newQ = {
    id: "quiz_" + Date.now(),
    title: "اختبار تقييمي جديد",
    timeLimit: 15,
    passingGrade: 70,
    questionOrder: "manual",
    navigationRules: {
      allowBack: true,
      allowSkip: true,
      requireAnswer: false,
      lockAnswered: false
    },
    questions: [
      {
        id: "q_" + Date.now(),
        question: "ما هي الخاصية المسؤولة عن محاذاة العناصر على المحور الرئيسي؟",
        type: "mc",
        category: "programming",
        difficulty: "medium",
        options: ["justify-content", "align-items", "flex-direction"],
        correctAnswer: 0,
        points: 10,
        negativePoints: 0,
        bonusPoints: 0,
        hint: "تأكد من التفريق بين المحور الرئيسي والتقاطعي.",
        hintType: "penalty",
        hintPenaltyPercent: 25,
        explanation: "خاصية justify-content تضبط المحاذاة على Main Axis.",
        referenceLinks: []
      }
    ]
  };

  activeCourseState.quizzes.push(newQ);
  triggerAutoSave();
  renderCourseBuilderUI();
  openQuizEditorModal(activeCourseState.quizzes.length - 1);
};

window.deleteQuiz = function (idx) {
  if (!activeCourseState) return;
  activeCourseState.quizzes.splice(idx, 1);
  triggerAutoSave();
  renderCourseBuilderUI();
};

window.addNewAssignment = function () {
  if (!activeCourseState) return;
  const newA = {
    id: "asg_" + Date.now(),
    title: "واجب تطبيق عملي",
    description: "يرجى بناء المشروع المطلوب ورفع الحل وفق المعايير المرفقة.",
    submissionType: "file",
    deadline: "2026-12-31",
    maxAttempts: 3,
    allowResubmission: true,
    maxFileSizeMB: 50,
    allowedTypes: ["PDF", "ZIP", "RAR", "DOCX"],
    referenceMaterials: [],
    rubric: [
      { id: "cr_1", title: "جودة الهيكلة والتنظيم", description: "تنظيم الأكواد أو الملفات.", maxPoints: 40, weight: 40 },
      { id: "cr_2", title: "التوثيق والشرح المرفق", description: "وضوح الملاحظات والخطوات.", maxPoints: 30, weight: 30 },
      { id: "cr_3", title: "اكتمال كافة المتطلبات", description: "تسليم كامل أجزاء الواجب.", maxPoints: 30, weight: 30 }
    ]
  };

  activeCourseState.assignments.push(newA);
  triggerAutoSave();
  renderCourseBuilderUI();
  openAssignmentEditorModal(activeCourseState.assignments.length - 1);
};

window.deleteAssignment = function (idx) {
  if (!activeCourseState) return;
  activeCourseState.assignments.splice(idx, 1);
  triggerAutoSave();
  renderCourseBuilderUI();
};

/**
 * Modal UI: Question Bank Central Manager
 */
window.openQuestionBankManagerModal = function () {
  let searchQuery = "";
  let selectedCategory = "";
  let selectedDifficulty = "";
  let includeArchived = false;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    const questions = searchBankQuestions({
      query: searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      includeArchived: includeArchived ? "only" : false
    });

    overlay.innerHTML = `
      <div class="floating-modal-box qb-mgr-modal-box" style="max-width: 900px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div class="qb-mgr-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 14px;">
          <div>
            <h3 class="qb-mgr-title" style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
              🏛️ بنك الأسئلة المركزي (Central Question Bank)
            </h3>
            <p class="qb-mgr-desc" style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              مستودع شامل للأسئلة مع إمكانيات الأرشفة والتكرار والفهرسة والاستيراد.
            </p>
          </div>
          <button type="button" class="btn-icon-action qb-mgr-close-btn" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <!-- SEARCH & ACTION TOOLBAR -->
        <div class="qb-mgr-toolbar" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <input type="text" id="qb_mgr_search" class="form-input-builder" style="flex: 1; min-width: 200px;" value="${escapeHtml(searchQuery)}" placeholder="بحث برمز السؤال أو النص..." />
          
          <select id="qb_mgr_cat" class="form-select-builder" style="width: 150px;">
            <option value="">جميع التخصصات</option>
            <option value="programming" ${selectedCategory === 'programming' ? 'selected' : ''}>البرمجة والتطوير</option>
            <option value="design" ${selectedCategory === 'design' ? 'selected' : ''}>التصميم والتجربة</option>
            <option value="business" ${selectedCategory === 'business' ? 'selected' : ''}>إدارة الأعمال</option>
            <option value="math" ${selectedCategory === 'math' ? 'selected' : ''}>العلوم والرياضيات</option>
          </select>

          <select id="qb_mgr_diff" class="form-select-builder" style="width: 130px;">
            <option value="">جميع المستويات</option>
            <option value="easy" ${selectedDifficulty === 'easy' ? 'selected' : ''}>سهل</option>
            <option value="medium" ${selectedDifficulty === 'medium' ? 'selected' : ''}>متوسط</option>
            <option value="hard" ${selectedDifficulty === 'hard' ? 'selected' : ''}>صعب</option>
          </select>

          <label class="qb-mgr-archived-label" style="font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="checkbox" id="qb_mgr_archived" ${includeArchived ? 'checked' : ''} /> الأسئلة المؤرشفة فقط
          </label>

          <button type="button" class="btn btn-primary qb-mgr-add-btn" style="margin-right: auto;" id="qb_mgr_add_btn">➕ سؤال جديد للبنك</button>
        </div>

        <!-- QUESTIONS LIST TABLE -->
        <div class="qb-mgr-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-left: 4px;">
          ${questions.length === 0 ? `
            <div style="text-align: center; color: #94a3b8; padding: 40px;">لا توجد أسئلة مسجلة تحت هذا الفلتر.</div>
          ` : questions.map((q) => `
            <div class="qb-mgr-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: ${q.isArchived ? '#f8fafc' : '#ffffff'}; opacity: ${q.isArchived ? 0.7 : 1};">
              <div class="qb-mgr-card-row" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                <div class="qb-mgr-card-body" style="flex: 1;">
                  <strong class="qb-mgr-card-title" style="font-size: 15px; color: #0f172a;">${escapeHtml(q.question)}</strong>
                  
                  <div class="qb-mgr-card-meta" style="display: flex; gap: 10px; font-size: 12px; color: #64748b; margin-top: 6px; flex-wrap: wrap;">
                    <span>النقاط: <strong>${q.points}</strong></span> |
                    <span>التخصص: <strong>${q.category}</strong></span> |
                    <span>الصعوبة: <strong>${q.difficulty}</strong></span> |
                    <span>استخدم <strong>${q.usedCount || 0} مرات</strong></span>
                  </div>

                  ${q.explanation ? `<div class="qb-mgr-card-explanation" style="font-size: 12px; color: #475569; margin-top: 4px;">💡 الشرح: ${escapeHtml(q.explanation)}</div>` : ''}
                </div>

                <div class="qb-mgr-card-actions" style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button type="button" class="btn btn-sm btn-primary qb-action-btn" title="تعديل متقدم" aria-label="تعديل متقدم" style="display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;" onclick="editBankQuestionAction('${q.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    تعديل متقدم
                  </button>
                  <button type="button" class="btn btn-sm btn-secondary qb-action-btn" title="تكرار السؤال" aria-label="تكرار السؤال" style="display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;" onclick="duplicateBankQuestionAction('${q.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    تكرار
                  </button>
                  <button type="button" class="btn btn-sm ${q.isArchived ? 'btn-primary' : 'btn-secondary'} qb-action-btn" title="${q.isArchived ? 'استعادة السؤال' : 'أرشفة السؤال'}" aria-label="${q.isArchived ? 'استعادة السؤال' : 'أرشفة السؤال'}" style="display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;" onclick="toggleArchiveBankQuestionAction('${q.id}', ${!q.isArchived})">
                    ${q.isArchived ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> استعادة` : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> أرشفة`}
                  </button>
                  <button type="button" class="btn btn-sm btn-danger qb-action-btn btn-del" title="حذف السؤال" aria-label="حذف السؤال" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="deleteBankQuestionAction('${q.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="qb-mgr-footer" style="display: flex; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary qb-mgr-close-footer" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
        </div>

      </div>
    `;

    // Rebind toolbar handlers
    const searchEl = overlay.querySelector("#qb_mgr_search");
    const catEl = overlay.querySelector("#qb_mgr_cat");
    const diffEl = overlay.querySelector("#qb_mgr_diff");
    const archEl = overlay.querySelector("#qb_mgr_archived");
    const addBtn = overlay.querySelector("#qb_mgr_add_btn");

    if (searchEl) searchEl.oninput = (e) => { searchQuery = e.target.value; renderModal(); };
    if (catEl) catEl.onchange = (e) => { selectedCategory = e.target.value; renderModal(); };
    if (diffEl) diffEl.onchange = (e) => { selectedDifficulty = e.target.value; renderModal(); };
    if (archEl) archEl.onchange = (e) => { includeArchived = e.target.checked; renderModal(); };

    if (addBtn) {
      addBtn.onclick = () => {
        openAdvancedQuestionEditorModal(null, () => {
          renderModal();
        });
      };
    }
  }

  window.editBankQuestionAction = (id) => {
    const questions = getQuestionBank();
    const q = questions.find(item => item.id === id);
    if (q) {
      openAdvancedQuestionEditorModal(q, () => {
        renderModal();
      });
    }
  };

  window.duplicateBankQuestionAction = (id) => {
    duplicateBankQuestion(id);
    renderModal();
  };

  window.toggleArchiveBankQuestionAction = (id, state) => {
    toggleArchiveQuestion(id, state);
    renderModal();
  };

  window.deleteBankQuestionAction = (id) => {
    if (confirm("هل أنت تأكد من حذف هذا السؤال من بنك الأسئلة نهائياً؟")) {
      deleteBankQuestion(id);
      renderModal();
    }
  };

  renderModal();
  document.body.appendChild(overlay);
};

/**
 * Modal UI: Quiz Detailed Questions & Rules Editor
 */
window.openQuizEditorModal = function (qIdx) {
  if (!activeCourseState || !activeCourseState.quizzes[qIdx]) return;
  let quizData = JSON.parse(JSON.stringify(activeCourseState.quizzes[qIdx]));

  if (!quizData.navigationRules) {
    quizData.navigationRules = { allowBack: true, allowSkip: true, requireAnswer: false, lockAnswered: false };
  }

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 880px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
          <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
            ⚙️ محرر الاختبار والأسئلة الشامل: ${escapeHtml(quizData.title)}
          </h3>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-left: 4px;">
          
          <!-- GENERAL SETTINGS GRID -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #0f172a;">⚙️ الإعدادات العامة وقواعد التصفح والترتيب:</h4>
            
            <div class="form-grid-3" style="margin-bottom: 10px;">
              <div class="form-group-builder">
                <label style="font-weight: 700;">عنوان الاختبار</label>
                <input type="text" id="qz_edit_title" class="form-input-builder" value="${escapeHtml(quizData.title)}" />
              </div>
              <div class="form-group-builder">
                <label style="font-weight: 700;">الزمن المحدد (بالدقائق)</label>
                <input type="number" id="qz_edit_time" class="form-input-builder" value="${quizData.timeLimit || 15}" />
              </div>
              <div class="form-group-builder">
                <label style="font-weight: 700;">درجة النجاح (%)</label>
                <input type="number" id="qz_edit_pass" class="form-input-builder" value="${quizData.passingGrade || 70}" />
              </div>
            </div>

            <!-- ORDER & NAVIGATION RULES -->
            <div class="form-grid-2" style="margin-top: 10px;">
              <div class="form-group-builder">
                <label style="font-weight: 700;">استراتيجية ترتيب الأسئلة (Question Order)</label>
                <select id="qz_edit_order" class="form-select-builder">
                  <option value="manual" ${quizData.questionOrder === 'manual' ? 'selected' : ''}>ترتيب يدوي حسب الإدخال</option>
                  <option value="random" ${quizData.questionOrder === 'random' ? 'selected' : ''}>ترتيب عشوائي كامل لكل طالب (Random)</option>
                  <option value="random_sections" ${quizData.questionOrder === 'random_sections' ? 'selected' : ''}>ترتيب عشوائي حسب الفصول</option>
                  <option value="shuffle_answers" ${quizData.questionOrder === 'shuffle_answers' ? 'selected' : ''}>خلط خيارات الإجابة فقط</option>
                </select>
              </div>

              <div class="form-group-builder">
                <label style="font-weight: 700;">قواعد تصفح الأسئلة للطلاب (Navigation Rules)</label>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
                  <label style="font-size: 12px; font-weight: 700; cursor: pointer;">
                    <input type="checkbox" id="qz_nav_back" ${quizData.navigationRules?.allowBack !== false ? 'checked' : ''} /> السماح بالرجوع للأسئلة السابقة
                  </label>
                  <label style="font-size: 12px; font-weight: 700; cursor: pointer;">
                    <input type="checkbox" id="qz_nav_skip" ${quizData.navigationRules?.allowSkip !== false ? 'checked' : ''} /> السماح بتخطي الأسئلة
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- QUESTIONS LIST BUILDER TOOLBAR -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">
              ❓ قائمة الأسئلة (${quizData.questions.length}):
            </h4>

            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-sm btn-primary" onclick="addSingleQuestionToQuiz()">➕ إضافة سؤال جديد</button>
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="importFromQuestionBankToQuiz()">🏛️ استيراد من بنك الأسئلة</button>
              <button type="button" class="btn btn-sm btn-secondary" onclick="importExcelCsvToQuiz()">📊 استيراد Excel/CSV</button>
            </div>
          </div>

          <!-- QUESTIONS LIST -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${quizData.questions.map((q, i) => `
              <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <strong style="font-size: 14px; color: #0f172a;">سؤال #${i + 1} (${getQuestionTypeLabel(q.type)})</strong>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-sm btn-outline-primary" title="المحرر المتقدم" aria-label="المحرر المتقدم" style="display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;" onclick="editQuizQuestionAdvanced(${i})">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      المحرر المتقدم
                    </button>
                    <button type="button" class="btn-icon-action" title="تحريك للأعلى" aria-label="تحريك للأعلى" style="display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="moveQuizQuestion(${i}, -1)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    </button>
                    <button type="button" class="btn-icon-action" title="تحريك للأسفل" aria-label="تحريك للأسفل" style="display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="moveQuizQuestion(${i}, 1)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                    </button>
                    <button type="button" class="btn-icon-action" title="حذف السؤال" aria-label="حذف السؤال" style="color: #ef4444; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" onclick="deleteQuizQuestion(${i})">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>

                <div class="form-group-builder" style="margin-bottom: 10px;">
                  <label style="font-weight: 700;">نص السؤال</label>
                  <input type="text" class="form-input-builder" value="${escapeHtml(q.question)}" oninput="updateQzQuestionField(${i}, 'question', this.value)" />
                </div>

                <!-- SCORES & HINTS -->
                <div class="form-grid-3" style="margin-bottom: 10px;">
                  <div class="form-group-builder">
                    <label style="font-weight: 700;">النقاط الإيجابية</label>
                    <input type="number" class="form-input-builder" value="${q.points || 10}" oninput="updateQzQuestionField(${i}, 'points', Number(this.value))" />
                  </div>
                  <div class="form-group-builder">
                    <label style="font-weight: 700;">خصم الإجابة الخاطئة (Negative)</label>
                    <input type="number" class="form-input-builder" value="${q.negativePoints || 0}" oninput="updateQzQuestionField(${i}, 'negativePoints', Number(this.value))" />
                  </div>
                  <div class="form-group-builder">
                    <label style="font-weight: 700;">نقاط بونص إضافية</label>
                    <input type="number" class="form-input-builder" value="${q.bonusPoints || 0}" oninput="updateQzQuestionField(${i}, 'bonusPoints', Number(this.value))" />
                  </div>
                </div>

                <!-- HINT & EXPLANATION -->
                <div class="form-grid-2" style="margin-bottom: 10px;">
                  <div class="form-group-builder">
                    <label style="font-weight: 700;">التلميح (Hint Text)</label>
                    <input type="text" class="form-input-builder" value="${escapeHtml(q.hint || '')}" oninput="updateQzQuestionField(${i}, 'hint', this.value)" placeholder="تلميح اختياري للطالب..." />
                  </div>
                  <div class="form-group-builder">
                    <label style="font-weight: 700;">نظام التلميح</label>
                    <select class="form-select-builder" onchange="updateQzQuestionField(${i}, 'hintType', this.value)">
                      <option value="free" ${q.hintType === 'free' ? 'selected' : ''}>تلميح مجاني بدون خصم</option>
                      <option value="penalty" ${q.hintType === 'penalty' ? 'selected' : ''}>تلميح بخصم % من النقاط (Penalty)</option>
                      <option value="disabled" ${q.hintType === 'disabled' ? 'selected' : ''}>إلغاء التلميح لهذا السؤال</option>
                    </select>
                  </div>
                </div>

                <div class="form-group-builder">
                  <label style="font-weight: 700;">الشرح التفصيلي بعد الإجابة (Explanation After Submission)</label>
                  <textarea class="form-textarea-builder" rows="2" oninput="updateQzQuestionField(${i}, 'explanation', this.value)" placeholder="توضيح الإجابة الصحيحة للطلاب بعد تسليم الاختبار...">${escapeHtml(q.explanation || '')}</textarea>
                </div>
              </div>
            `).join('')}
          </div>

        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="button" class="btn btn-primary" id="btn_save_quiz_modal">حفظ الاختبار والأسئلة</button>
        </div>

      </div>
    `;

    // Local Question editing helpers
    window.addSingleQuestionToQuiz = () => {
      openAdvancedQuestionEditorModal(null, (newQ) => {
        quizData.questions.push(newQ);
        renderModal();
      });
    };

    window.editQuizQuestionAdvanced = (idx) => {
      if (quizData.questions[idx]) {
        openAdvancedQuestionEditorModal(quizData.questions[idx], (updatedQ) => {
          quizData.questions[idx] = updatedQ;
          renderModal();
        });
      }
    };

    window.importFromQuestionBankToQuiz = () => {
      openQuestionBankSelectorModal((chosenQuestions) => {
        quizData.questions.push(...chosenQuestions);
        renderModal();
      });
    };

    window.importExcelCsvToQuiz = () => {
      openImportQuestionsFileModal((imported) => {
        quizData.questions.push(...imported);
        renderModal();
      });
    };

    window.updateQzQuestionField = (i, field, val) => {
      if (quizData.questions[i]) {
        quizData.questions[i][field] = val;
      }
    };

    window.moveQuizQuestion = (i, dir) => {
      const target = i + dir;
      if (target < 0 || target >= quizData.questions.length) return;
      const temp = quizData.questions[i];
      quizData.questions[i] = quizData.questions[target];
      quizData.questions[target] = temp;
      renderModal();
    };

    window.deleteQuizQuestion = (i) => {
      quizData.questions.splice(i, 1);
      renderModal();
    };

    overlay.querySelector("#btn_save_quiz_modal").onclick = () => {
      quizData.title = overlay.querySelector("#qz_edit_title")?.value || quizData.title;
      quizData.timeLimit = Number(overlay.querySelector("#qz_edit_time")?.value) || 15;
      quizData.passingGrade = Number(overlay.querySelector("#qz_edit_pass")?.value) || 70;
      quizData.questionOrder = overlay.querySelector("#qz_edit_order")?.value || "manual";

      quizData.navigationRules = {
        allowBack: overlay.querySelector("#qz_nav_back")?.checked !== false,
        allowSkip: overlay.querySelector("#qz_nav_skip")?.checked !== false,
        requireAnswer: false,
        lockAnswered: false
      };

      activeCourseState.quizzes[qIdx] = quizData;
      triggerAutoSave();
      showCustomAlert("تم حفظ الاختبار والأسئلة بنجاح!");
      overlay.remove();
      renderCourseBuilderUI();
    };
  }

  renderModal();
  document.body.appendChild(overlay);
};

/**
 * Modal UI: Assignment Detailed Builder & Rubric Settings
 */
window.openAssignmentEditorModal = function (aIdx) {
  if (!activeCourseState || !activeCourseState.assignments[aIdx]) return;
  let asgData = JSON.parse(JSON.stringify(activeCourseState.assignments[aIdx]));

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 820px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
          <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
            📝 إعدادات الواجب ومصفوفة Rubric: ${escapeHtml(asgData.title)}
          </h3>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-left: 4px;">
          
          <div class="form-group-builder">
            <label style="font-weight: 700;">عنوان الواجب / المشروع التطبيقي</label>
            <input type="text" id="asg_edit_title" class="form-input-builder" value="${escapeHtml(asgData.title)}" />
          </div>

          <div class="form-group-builder">
            <label style="font-weight: 700;">التعليمات وإرشادات التنفيذ للطالب</label>
            <textarea id="asg_edit_desc" class="form-textarea-builder" rows="3">${escapeHtml(asgData.description || '')}</textarea>
          </div>

          <div class="form-grid-3">
            <div class="form-group-builder">
              <label style="font-weight: 700;">الموعد النهائي (Deadline)</label>
              <input type="date" id="asg_edit_deadline" class="form-input-builder" value="${asgData.deadline || ''}" />
            </div>
            <div class="form-group-builder">
              <label style="font-weight: 700;">نوع التسليم</label>
              <select id="asg_edit_type" class="form-select-builder">
                <option value="file" ${asgData.submissionType === 'file' ? 'selected' : ''}>رفع ملف من الجهاز (ZIP, PDF, Word)</option>
                <option value="text" ${asgData.submissionType === 'text' ? 'selected' : ''}>إدخال نصي فقط</option>
                <option value="both" ${asgData.submissionType === 'both' ? 'selected' : ''}>ملفات وإدخال نصي معا</option>
              </select>
            </div>
            <div class="form-group-builder">
              <label style="font-weight: 700;">أقصى عدد محاولات</label>
              <input type="number" id="asg_edit_attempts" class="form-input-builder" value="${asgData.maxAttempts || 3}" />
            </div>
          </div>

          <!-- RUBRIC MANAGEMENT SECTION -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f5f3ff;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 14px; color: #5b21b6;">📏 مصفوفة التقييم المعيارية (Rubric Grading)</strong>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #6d28d9;">
                  المحدد حالياً: ${(asgData.rubric || []).length} معايير تقييم.
                </p>
              </div>

              <button type="button" class="btn btn-sm btn-primary" onclick="triggerRubricEditorForAsg()">
                ⚙️ تعديل مصفوفة المعايير (Rubric Builder)
              </button>
            </div>
          </div>

          <!-- REFERENCE MATERIALS ATTACHMENTS -->
          <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <strong style="font-size: 14px; color: #0f172a;">📥 المراجع والمستندات القابلة للتنزيل للطالب:</strong>
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="addRefMaterialToAsg()">➕ إضافة مرجع</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(asgData.referenceMaterials || []).map((ref, rIdx) => `
                <div style="display: flex; gap: 8px; align-items: center;">
                  <input type="text" class="form-input-builder" style="flex: 1;" value="${escapeHtml(ref.name)}" oninput="asgData.referenceMaterials[${rIdx}].name=this.value" placeholder="اسم المرجع..." />
                  <input type="text" class="form-input-builder" style="flex: 1;" value="${escapeHtml(ref.url)}" oninput="asgData.referenceMaterials[${rIdx}].url=this.value" placeholder="رابط التحميل..." />
                  <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="asgData.referenceMaterials.splice(${rIdx},1); renderModal();">🗑️</button>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="button" class="btn btn-primary" id="btn_save_asg_modal">حفظ إعدادات الواجب</button>
        </div>

      </div>
    `;

    window.triggerRubricEditorForAsg = () => {
      openEditRubricModal(asgData.rubric, (newRubric) => {
        asgData.rubric = newRubric;
        renderModal();
      });
    };

    window.addRefMaterialToAsg = () => {
      if (!asgData.referenceMaterials) asgData.referenceMaterials = [];
      asgData.referenceMaterials.push({ name: "قالب مشروع جديد.zip", url: "#" });
      renderModal();
    };

    overlay.querySelector("#btn_save_asg_modal").onclick = () => {
      asgData.title = overlay.querySelector("#asg_edit_title")?.value || asgData.title;
      asgData.description = overlay.querySelector("#asg_edit_desc")?.value || "";
      asgData.deadline = overlay.querySelector("#asg_edit_deadline")?.value || "";
      asgData.submissionType = overlay.querySelector("#asg_edit_type")?.value || "file";
      asgData.maxAttempts = Number(overlay.querySelector("#asg_edit_attempts")?.value) || 3;

      activeCourseState.assignments[aIdx] = asgData;
      triggerAutoSave();
      showCustomAlert("تم حفظ الواجب ومصفوفة Rubric بنجاح!");
      overlay.remove();
      renderCourseBuilderUI();
    };
  }

  renderModal();
  document.body.appendChild(overlay);
};

/* Q&A and Reviews Builder HTML Rendering */
function renderBuilderQnaHtml() {
  if (!activeCourseState || !activeCourseState.qna || !activeCourseState.qna.length) {
    return `<p style="font-size: 13px; color: #64748b;">لا توجد أسئلة مطروحة من الطلاب حتى الآن.</p>`;
  }

  return activeCourseState.qna
    .map(
      (q, idx) => `
    <div class="qna-thread-card">
      <div class="qna-header">
        <strong style="font-size: 15px; color: #0f172a;">${escapeHtml(q.studentName)}: ${escapeHtml(q.question)}</strong>
        <span class="status-badge ${q.isAnswered ? 'published' : 'draft'}">${q.isAnswered ? 'تم الرد' : 'بانتظار الرد'}</span>
      </div>

      <div style="padding-right: 16px; border-right: 2px solid var(--primary-color); display: flex; flex-direction: column; gap: 8px;">
        ${(q.replies || []).map((r) => `
          <div style="font-size: 13px; color: #334155;">
            <strong>${escapeHtml(r.author)}:</strong> ${escapeHtml(r.text)} <small style="color: #94a3b8;">(${escapeHtml(r.date)})</small>
          </div>
        `).join('')}
      </div>

      <div style="display: flex; gap: 8px; margin-top: 8px;">
        <input type="text" id="qna_reply_input_${idx}" class="form-input-builder" style="flex: 1;" placeholder="اكتب ردك كمعلم..." />
        <button type="button" class="btn btn-primary" onclick="replyToQna(${idx})">إرسال الرد</button>
      </div>
    </div>
  `
    )
    .join("");
}

window.replyToQna = function (qIdx) {
  const input = document.getElementById(`qna_reply_input_${qIdx}`);
  if (!input || !input.value.trim() || !activeCourseState) return;

  const q = activeCourseState.qna[qIdx];
  if (!q.replies) q.replies = [];
  q.replies.push({
    id: "rep_" + Date.now(),
    author: "المعلم",
    role: "teacher",
    text: input.value.trim(),
    date: "الآن",
    isPinned: false
  });
  q.isAnswered = true;

  triggerAutoSave();
  renderCourseBuilderUI();
};

function renderBuilderReviewsHtml() {
  if (!activeCourseState || !activeCourseState.reviews || !activeCourseState.reviews.length) {
    return `<p style="font-size: 13px; color: #64748b;">لا توجد مراجعات مضافة بعد.</p>`;
  }

  return activeCourseState.reviews
    .map(
      (r) => `
    <div class="review-manage-card">
      <div class="review-header">
        <div>
          <strong>${escapeHtml(r.studentName)}</strong> ⭐ ${r.rating} / 5
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155;">"${escapeHtml(r.text)}"</p>
        </div>
        <span style="font-size: 12px; color: #94a3b8;">${escapeHtml(r.date)}</span>
      </div>
      ${r.teacherReply ? `<div style="padding: 8px 12px; background: #f1f5f9; border-radius: 8px; font-size: 13px;"><strong>ردك:</strong> ${escapeHtml(r.teacherReply)}</div>` : ''}
    </div>
  `
    )
    .join("");
}

window.handlePublishAction = function (action) {
  if (!activeCourseState) return;

  if (action === "publish") {
    if (!activeCourseState.hasBeenSaved) {
      showCustomAlert("لا يمكن نشر الدورة قبل إدخال بياناتها وحفظ المسودة الأولية أولاً.");
      return;
    }

    const val = validateCourseForPublish(activeCourseState);
    if (!val.isValid) {
      showCustomAlert("عذراً، لا يمكن نشر الدورة حتى استكمال جميع الشروط المطلوب استيفاؤها:\n• " + val.missing.join("\n• "));
      return;
    }

    activeCourseState.publishedStatus = "published";
    activeCourseState.visibility = "public";
    persistActiveCourseToData();
    showCustomAlert("🎉 تم نشر الدورة بنجاح في المنصة وتصبح متاحة للطلاب الآن!");
  } else if (action === "draft") {
    manualSaveCourseDraft();
    return;
  }

  renderCourseBuilderUI();
};

function getQuestionTypeLabel(type) {
  switch (type) {
    case "mc": return "اختيار من متعدد";
    case "tf": return "صح / خطأ";
    case "image_choice": return "اختيار بالصور";
    case "matching": return "توصيل الأعمدة";
    case "ordering": return "ترتيب تسلسلي";
    case "fill_blank": return "إكمال الفراغ";
    case "short_answer": return "إجابة قصيرة";
    default: return type || "اختيار من متعدد";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
