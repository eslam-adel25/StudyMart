import { showCustomAlert } from "../utils/helpers.js";
import { addQuestionToBank, updateBankQuestion } from "./questionBankService.js";
import { hideAllMainSections } from "./layoutService.js";

let activeQuestionSaveCallback = null;
let isQuestionEditorOpen = false;
let originatingHash = null;
let originatingSectionId = null;

function detectOriginatingContext() {
  const currentHash = window.location.hash || "";
  const sectionIds = [
    "courseBuilderPage",
    "questionBankPage",
    "importQuestionsPage",
    "myCoursesPage",
    "teacherDashboardPage",
    "standaloneCoursesPage",
    "homepageManagementPage"
  ];
  let visibleId = null;
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (el && !el.classList.contains("hidden") && el.style.display !== "none") {
      visibleId = id;
      break;
    }
  }

  return {
    hash: currentHash.includes("questions/") ? (originatingHash || "#teacher/question-bank") : currentHash,
    sectionId: visibleId || originatingSectionId
  };
}

export function closeQuestionEditorOverlay() {
  isQuestionEditorOpen = false;
  const page = document.getElementById("questionEditorPage");
  if (page) {
    page.classList.add("hidden");
    page.style.position = "";
    page.style.inset = "";
    page.style.zIndex = "";
    page.style.background = "";
    page.style.overflowY = "";
  }
}

function restoreOriginatingContext() {
  closeQuestionEditorOverlay();

  const targetHash = originatingHash || "#teacher/question-bank";
  const targetSectionId = originatingSectionId;

  if (targetSectionId === "courseBuilderPage" || targetHash.includes("course-builder")) {
    const cbPage = document.getElementById("courseBuilderPage");
    if (cbPage) cbPage.classList.remove("hidden");
    const builderHash = targetHash.includes("course-builder") ? targetHash : "#teacher/course-builder";
    if (window.location.hash !== builderHash) {
      if (history.replaceState) {
        history.replaceState(null, "", builderHash);
      }
      window.location.hash = builderHash;
    }
    if (typeof window.renderCourseBuilderUI === "function") {
      window.renderCourseBuilderUI();
    }
    return;
  }

  if (targetSectionId === "questionBankPage" || targetHash.includes("question-bank")) {
    const qbPage = document.getElementById("questionBankPage");
    if (qbPage) qbPage.classList.remove("hidden");
    if (window.location.hash !== "#teacher/question-bank") {
      if (history.replaceState) {
        history.replaceState(null, "", "#teacher/question-bank");
      }
      window.location.hash = "#teacher/question-bank";
    }
    if (typeof window.renderQuestionBankPage === "function") {
      window.renderQuestionBankPage();
    }
    return;
  }

  if (targetSectionId) {
    const targetEl = document.getElementById(targetSectionId);
    if (targetEl) targetEl.classList.remove("hidden");
  } else {
    const qbPage = document.getElementById("questionBankPage");
    if (qbPage) qbPage.classList.remove("hidden");
  }

  if (targetHash && window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

/**
 * Enterprise-Grade Live Split-Screen Question Editor Page
 * @param {Object} questionObj Existing question object or null for new
 * @param {Function} onSaveCallback Callback when question is validated & saved
 */
export function openAdvancedQuestionEditorModal(questionObj = null, onSaveCallback) {
  // Prevent duplicate reset if triggered via hashchange while already open
  if (isQuestionEditorOpen && onSaveCallback === undefined && window.location.hash.includes("questions/")) {
    const page = document.getElementById("questionEditorPage");
    if (page) {
      page.classList.remove("hidden");
      page.style.position = "fixed";
      page.style.inset = "0";
      page.style.zIndex = "100000";
      page.style.background = "#f8fafc";
      page.style.overflowY = "auto";
    }
    return;
  }

  if (!isQuestionEditorOpen || !window.location.hash.includes("questions/")) {
    const ctx = detectOriginatingContext();
    if (!window.location.hash.includes("questions/")) {
      originatingHash = ctx.hash || "#teacher/question-bank";
      originatingSectionId = ctx.sectionId;
    }
  }

  hideAllMainSections();
  isQuestionEditorOpen = true;

  if (typeof onSaveCallback === "function") {
    activeQuestionSaveCallback = onSaveCallback;
  }

  const page = document.getElementById("questionEditorPage");
  const container = document.getElementById("questionEditorContent");

  if (page) {
    page.classList.remove("hidden");
    page.style.position = "fixed";
    page.style.inset = "0";
    page.style.zIndex = "100000";
    page.style.background = "#f8fafc";
    page.style.overflowY = "auto";
  }
  if (!container) return;

  let isEditingExisting = !!questionObj;
  
  // Clone or initialize question model
  let q = questionObj ? JSON.parse(JSON.stringify(questionObj)) : {
    id: "q_" + Date.now(),
    question: "",
    type: "mc", // mc, tf, image_choice, matching, ordering, fill_blank, short_answer
    category: "programming",
    topic: "واجهات المستخدم",
    chapter: "الفصل الأول",
    lesson: "الدرس 1",
    difficulty: "medium",
    tags: ["مهم"],
    
    // Rich content & media
    media: {
      images: [], // { url, caption, alt }
      videoUrl: "",
      audioUrl: "",
      pdfUrl: "",
      externalUrl: ""
    },
    
    // Options / Choices
    options: [
      { text: "الخيار الأول", richText: "", image: "", audio: "", video: "", explanation: "", isCorrect: true },
      { text: "الخيار الثاني", richText: "", image: "", audio: "", video: "", explanation: "", isCorrect: false }
    ],
    correctAnswer: 0, // index for mc/tf/image_choice
    
    // Matching pairs (column A & column B)
    matchingPairs: [
      { left: "HTML", right: "لغة هيكلية المستندات" },
      { left: "CSS", right: "لغة تنسيق الأنماط والمظهر" },
      { left: "JavaScript", right: "لغة التفاعلية والبرمجة" }
    ],

    // Ordering items
    orderingItems: ["الخطوة الأولى: التحليل", "الخطوة الثانية: التصميم", "الخطوة الثالثة: البرمجة"],

    // Fill in the blanks
    fillBlanks: {
      template: "لغة [CSS] مسؤولة عن التنسيق، بينما [HTML] مسؤولة عن الهيكل.",
      blanks: [
        { word: "CSS", accepted: ["CSS", "css"], caseSensitive: false },
        { word: "HTML", accepted: ["HTML", "html"], caseSensitive: false }
      ]
    },

    // Short answer
    shortAnswer: {
      acceptedAnswers: ["flexbox", "Flexbox", "display: flex"],
      caseSensitive: false,
      maxChars: 100
    },

    // Scoring & Rules
    points: 10,
    negativePoints: 0,
    bonusPoints: 0,
    estimatedTimeSeconds: 60,
    timeLimit: 0,
    isRequired: true,
    randomPosition: false,
    allowRetry: false,
    
    // Hint & Explanation
    hint: "",
    hintType: "free", // free | penalty | disabled
    hintPenaltyPercent: 25,
    explanation: "",
    referenceLinks: [],

    // Meta
    isArchived: false,
    updatedAt: new Date().toISOString()
  };

  if (!q.media) {
    q.media = {
      images: [],
      videoUrl: "",
      audioUrl: "",
      pdfUrl: "",
      externalUrl: ""
    };
  }

  const targetHash = isEditingExisting ? `#teacher/questions/edit?id=${q.id}` : "#teacher/questions/new";
  if (!window.location.hash.includes("questions/") || (isEditingExisting && !window.location.hash.includes(`id=${q.id}`))) {
    if (window.location.hash !== targetHash) {
      if (history.replaceState) {
        history.replaceState(null, "", targetHash);
      } else {
        window.location.hash = targetHash;
      }
    }
  }

  // State management for Auto-Save & Validation
  let autoSaveStatus = "Saved"; // "Saved" | "Saving..." | "Unsaved Changes"
  let validationErrors = [];
  let activeTab = "editor"; // editor | preview
  let autoSaveTimer = null;

  const rootEl = container;

  function validateQuestion() {
    validationErrors = [];
    if (!q.question || !q.question.trim()) {
      validationErrors.push("نص السؤال رئيسي مطلوب ولا يمكن أن يكون فارغاً.");
    }

    if (q.type === "mc" || q.type === "tf") {
      if (!q.options || q.options.length < 2) {
        validationErrors.push("يجب تقديم خيارين على الأقل للأسئلة متعددة الخيارات.");
      }
      const hasCorrect = q.options.some((opt, idx) => idx === q.correctAnswer || opt.isCorrect);
      if (!hasCorrect) {
        validationErrors.push("يجب تحديد إجابة صحيحة واحدة على الأقل.");
      }
      const texts = q.options.map(o => (typeof o === "string" ? o : o.text).trim());
      const hasDuplicates = new Set(texts).size !== texts.length;
      if (hasDuplicates) {
        validationErrors.push("توجد خيارات مكررة في النص، يرجى التمييز بين الخيارات.");
      }
    } else if (q.type === "image_choice") {
      if (!q.options || q.options.length < 2) {
        validationErrors.push("أسئلة الصور تتطلب خيارين مصورين على الأقل.");
      }
    } else if (q.type === "matching") {
      if (!q.matchingPairs || q.matchingPairs.length < 2) {
        validationErrors.push("أسئلة التوصيل تتطلب زوجين متطابقين على الأقل.");
      }
    } else if (q.type === "ordering") {
      if (!q.orderingItems || q.orderingItems.length < 2) {
        validationErrors.push("أسئلة الترتيب تتطلب عنصرين على الأقل.");
      }
    } else if (q.type === "short_answer") {
      if (!q.shortAnswer || !q.shortAnswer.acceptedAnswers || q.shortAnswer.acceptedAnswers.length === 0) {
        validationErrors.push("يرجى إدخال إجابة واحدة مقبولة على الأقل للسؤال القصير.");
      }
    } else if (q.type === "fill_blank") {
      if (!q.fillBlanks || !q.fillBlanks.template || !q.fillBlanks.template.includes("[")) {
        validationErrors.push("يرجى كتابة قالب النص وتحديد كلمة واحدة على الأقل بين أقواس مربعة [كلمة].");
      }
    }

    return validationErrors.length === 0;
  }

  function markUnsaved() {
    autoSaveStatus = "Unsaved Changes";
    renderAutoSaveBadge();

    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      autoSaveStatus = "Saving...";
      renderAutoSaveBadge();
      setTimeout(() => {
        autoSaveStatus = "Saved";
        renderAutoSaveBadge();
      }, 600);
    }, 2000);
  }

  function renderAutoSaveBadge() {
    const el = rootEl.querySelector("#auto_save_indicator");
    if (!el) return;
    if (autoSaveStatus === "Saved") {
      el.innerHTML = `<span style="color:#16a34a; font-size:12px; font-weight:700;">🟢 محفوط تلقائياً</span>`;
    } else if (autoSaveStatus === "Saving...") {
      el.innerHTML = `<span style="color:#d97706; font-size:12px; font-weight:700;">⏳ جاري الحفظ...</span>`;
    } else {
      el.innerHTML = `<span style="color:#dc2626; font-size:12px; font-weight:700;">🔴 تعديلات غير محفوظة</span>`;
    }
  }

  function updateLivePreviewAndValidation() {
    const isValid = validateQuestion();

    const saveBtn = rootEl.querySelector("#btn_save_master_question");
    if (saveBtn) {
      saveBtn.disabled = !isValid;
      saveBtn.style.opacity = !isValid ? "0.5" : "1";
    }

    const valBox = rootEl.querySelector("#validation_error_box");
    if (valBox) {
      if (validationErrors.length > 0) {
        valBox.style.display = "block";
        valBox.innerHTML = `
          <strong>⚠️ يرجى تصحيح الملاحظات التالية لتتمكن من الحفظ:</strong>
          <ul style="margin: 4px 0 0 0; padding-right: 18px;">
            ${validationErrors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
          </ul>
        `;
      } else {
        valBox.style.display = "none";
        valBox.innerHTML = "";
      }
    }

    const pQuestionText = rootEl.querySelector("#preview_question_text");
    if (pQuestionText) {
      pQuestionText.innerHTML = q.question ? escapeHtml(q.question) : '<span style="color:#94a3b8; font-style:italic;">(اكتب نص السؤال في المحرر لرؤية المعاينة...)</span>';
    }

    const pPointsBadge = rootEl.querySelector("#preview_points_badge");
    if (pPointsBadge) {
      pPointsBadge.textContent = `${q.points || 10} نقاط`;
    }

    const pMediaBox = rootEl.querySelector("#preview_media_container");
    if (pMediaBox) {
      let mediaHtml = "";
      if (q.media?.images && q.media.images.length > 0) {
        mediaHtml += `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">${q.media.images.map(img => `<img src="${escapeHtml(img.url)}" style="max-width: 100%; max-height: 160px; border-radius: 8px; object-fit: contain;" />`).join('')}</div>`;
      }
      if (q.media?.videoUrl) {
        mediaHtml += `<div style="margin-bottom: 10px; background: #000; border-radius: 8px; padding: 10px; text-align: center; color: #fff; font-size: 12px;">📹 فيديو مدمج: ${escapeHtml(q.media.videoUrl)}</div>`;
      }
      if (q.media?.audioUrl) {
        mediaHtml += `<div style="margin-bottom: 10px; padding: 8px; background: #e0f2fe; border-radius: 8px; font-size: 12px; color: #0369a1;">🎧 تسجيل صوتي: ${escapeHtml(q.media.audioUrl)}</div>`;
      }
      pMediaBox.innerHTML = mediaHtml;
    }

    const pAnswersContainer = rootEl.querySelector("#preview_answers_container");
    if (pAnswersContainer) {
      pAnswersContainer.innerHTML = renderStudentLivePreviewWidget();
    }

    const pHintBox = rootEl.querySelector("#preview_hint_container");
    if (pHintBox) {
      pHintBox.innerHTML = q.hint ? `
        <div style="margin-top: 14px; padding: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #b45309;">
          💡 <strong>تلميح:</strong> ${escapeHtml(q.hint)}
        </div>
      ` : '';
    }
  }

  function renderModal() {
    const rightPanel = rootEl.querySelector("#editor_right_panel");
    const leftPanel = rootEl.querySelector("#preview_left_panel");
    const savedRightScroll = rightPanel ? rightPanel.scrollTop : 0;
    const savedLeftScroll = leftPanel ? leftPanel.scrollTop : 0;

    const isValid = validateQuestion();

    rootEl.innerHTML = `
      <div class="qe-main-wrapper" style="width: 100%; min-height: 85vh; display: flex; flex-direction: column; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-top: 10px;">
        
        <!-- TOP TOOLBAR HEADER -->
        <div class="qe-top-toolbar" style="background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div class="qe-toolbar-left" style="display: flex; align-items: center; gap: 12px;">
            <button type="button" class="btn btn-secondary qe-back-btn" id="btn_cancel_question_editor" style="border-radius: 8px; font-size: 13px;">
              ← العودة
            </button>
            <div>
              <h3 class="qe-title" style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                ${isEditingExisting ? 'تعديل السؤال المتقدم' : 'إنشاء سؤال جديد في بنك الأسئلة'}
                <span class="status-badge qe-badge" style="background: #e0f2fe; color: #0369a1; font-size: 11px;">Enterprise Edition</span>
              </h3>
              <div class="qe-subtitle" style="font-size: 12px; color: #64748b; margin-top: 2px;">
                محرر الأسئلة التفاعلية المباشر مع دعم الرياضيات، الوسائط، والـ Live Preview للطلاب.
              </div>
            </div>
          </div>

          <div class="qe-toolbar-actions" style="display: flex; align-items: center; gap: 14px;">
            <div id="auto_save_indicator" class="qe-autosave">
              <span style="color:#16a34a; font-size:12px; font-weight:700;">🟢 محفوط تلقائياً</span>
            </div>

            <button type="button" class="btn btn-secondary qe-export-btn" onclick="exportQuestionJson()">
              ⬇️ تصدير JSON
            </button>

            <button type="button" class="btn btn-primary qe-save-btn" id="btn_save_master_question" ${!isValid ? 'disabled style="opacity:0.5;"' : ''}>
              💾 حفظ السؤال
            </button>
          </div>
        </div>

        <!-- MAIN SPLIT WORKSPACE: RIGHT (EDITOR) - LEFT (LIVE PREVIEW) -->
        <div class="qe-workspace" style="flex: 1; display: flex; overflow: hidden; position: relative;">
          
          <!-- RIGHT PANEL: EDITOR SECTIONS (60% WIDTH) -->
          <div id="editor_right_panel" class="qe-editor-panel" style="flex: 1; min-width: 320px; border-left: 1px solid #cbd5e1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; background: #ffffff;">
            
            <div id="validation_error_box" class="qe-val-box" style="display: ${validationErrors.length > 0 ? 'block' : 'none'}; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #991b1b;">
              ${validationErrors.length > 0 ? `
                <strong>⚠️ يرجى تصحيح الملاحظات التالية لتتمكن من الحفظ:</strong>
                <ul style="margin: 4px 0 0 0; padding-right: 18px;">
                  ${validationErrors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
                </ul>
              ` : ''}
            </div>

            <!-- SECTION 1: GENERAL INFORMATION & TAGS -->
            <div class="builder-card qe-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc;">
              <h4 class="qe-card-title" style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: var(--primary-color, #6d28d9); display: flex; align-items: center; gap: 6px;">
                📌 1. المعلمات الأساسية والتصنيف (General & Tags)
              </h4>

              <div class="form-grid-3 qe-grid-3" style="margin-bottom: 12px;">
                <div class="form-group-builder">
                  <label style="font-weight: 700;">نوع السؤال (Question Type)</label>
                  <select id="q_edit_type" class="form-select-builder">
                    <option value="mc" ${q.type === 'mc' ? 'selected' : ''}>اختيار من متعدد (Multiple Choice)</option>
                    <option value="tf" ${q.type === 'tf' ? 'selected' : ''}>صح أو خطأ (True / False)</option>
                    <option value="image_choice" ${q.type === 'image_choice' ? 'selected' : ''}>اختيار بالصور (Image Choice)</option>
                    <option value="matching" ${q.type === 'matching' ? 'selected' : ''}>توصيل أعمدة (Matching Pairs)</option>
                    <option value="ordering" ${q.type === 'ordering' ? 'selected' : ''}>ترتيب تسلسلي (Ordering items)</option>
                    <option value="fill_blank" ${q.type === 'fill_blank' ? 'selected' : ''}>إكمال الفراغات (Fill in the Blank)</option>
                    <option value="short_answer" ${q.type === 'short_answer' ? 'selected' : ''}>إجابة قصيرة (Short Answer)</option>
                  </select>
                </div>

                <div class="form-group-builder">
                  <label style="font-weight: 700;">مستوى الصعوبة</label>
                  <select id="q_edit_diff" class="form-select-builder">
                    <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>سهل (Easy)</option>
                    <option value="medium" ${q.difficulty === 'medium' ? 'selected' : ''}>متوسط (Medium)</option>
                    <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>صعب (Hard)</option>
                  </select>
                </div>

                <div class="form-group-builder">
                  <label style="font-weight: 700;">التخصص العام (Category)</label>
                  <input type="text" id="q_edit_category" class="form-input-builder" value="${escapeHtml(q.category)}" placeholder="مثال: البرمجة" />
                </div>
              </div>

              <div class="form-grid-3 qe-grid-3">
                <div class="form-group-builder">
                  <label style="font-weight: 700;">الموضوع (Topic)</label>
                  <input type="text" id="q_edit_topic" class="form-input-builder" value="${escapeHtml(q.topic || '')}" placeholder="مثال: Flexbox Layout" />
                </div>
                <div class="form-group-builder">
                  <label style="font-weight: 700;">الفصل (Chapter)</label>
                  <input type="text" id="q_edit_chapter" class="form-input-builder" value="${escapeHtml(q.chapter || '')}" placeholder="مثال: الفصل 2" />
                </div>
                <div class="form-group-builder">
                  <label style="font-weight: 700;">الوسوم (Custom Tags)</label>
                  <input type="text" id="q_edit_tags" class="form-input-builder" value="${escapeHtml((q.tags || []).join(', '))}" placeholder="CSS, Layout, CSS3" />
                </div>
              </div>
            </div>

            <!-- SECTION 2: QUESTION CONTENT & RICH TEXT EDITOR -->
            <div class="builder-card qe-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">
              <h4 class="qe-card-title" style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: var(--primary-color, #6d28d9); display: flex; align-items: center; gap: 6px;">
                ✏️ 2. محتوى السؤال والـ Rich Text Editor
              </h4>

              <!-- RICH TEXT FORMATTING TOOLBAR BAR -->
              <div class="qe-rich-toolbar" style="display: flex; gap: 4px; flex-wrap: wrap; background: #f1f5f9; padding: 6px 10px; border-radius: 8px 8px 0 0; border: 1px solid #cbd5e1; border-bottom: none;">
                <button type="button" class="btn-icon-action qe-rich-btn" style="font-weight:800;" title="Bold" onclick="insertRichFormat('**', '**')"><b>B</b></button>
                <button type="button" class="btn-icon-action qe-rich-btn" style="font-style:italic;" title="Italic" onclick="insertRichFormat('*', '*')"><i>I</i></button>
                <button type="button" class="btn-icon-action qe-rich-btn" style="text-decoration:underline;" title="Underline" onclick="insertRichFormat('<u>', '</u>')"><u>U</u></button>
                <span style="color:#cbd5e1;" class="qe-rich-sep">|</span>
                <button type="button" class="btn-icon-action qe-rich-btn" title="Code Block" onclick="insertRichFormat('\\n\`\`\`javascript\\n', '\\n\`\`\`\\n')"><code>&lt;&gt;</code></button>
                <button type="button" class="btn-icon-action qe-rich-btn" title="LaTeX Equation" onclick="insertRichFormat('$$ ', ' $$')">Σ Math</button>
                <button type="button" class="btn-icon-action qe-rich-btn" title="Table" onclick="insertRichTable()">📊 جدول</button>
                <button type="button" class="btn-icon-action qe-rich-btn" title="Link" onclick="insertRichLink()">🔗 رابط</button>
                <button type="button" class="btn-icon-action qe-rich-btn" title="Color Highlight" onclick="insertRichFormat('&lt;mark style=&quot;background:#fef08a;&quot;&gt;', '&lt;/mark&gt;')">🖍️ تمييز</button>
              </div>

              <textarea id="q_main_text" class="form-textarea-builder qe-textarea" rows="4" style="border-radius: 0 0 8px 8px; font-size: 15px; line-height: 1.6;" placeholder="اكتب نص السؤال الرئيسي هنا... يمكنك إضافة صيغ معادلات LaTeX مثل $$E=mc^2$$ أو كود برمجي">${escapeHtml(q.question)}</textarea>
            </div>

            <!-- SECTION 3: MEDIA ATTACHMENTS -->
            <div class="builder-card qe-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">
              <h4 class="qe-card-title" style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: var(--primary-color, #6d28d9); display: flex; align-items: center; gap: 6px;">
                🖼️ 3. وسائط السؤال (Multiple Images, Video, Audio, PDF)
              </h4>

              <!-- MEDIA DRAG DROP / URL INPUTS -->
              <div class="qe-media-drop" style="border: 2px dashed #cbd5e1; border-radius: 10px; padding: 14px; background: #f8fafc; text-align: center; margin-bottom: 12px;" id="media_drop_zone">
                <input type="file" id="q_media_file_input" style="display:none;" accept="image/*,video/*,audio/*,.pdf" multiple />
                <span class="qe-drop-icon" style="font-size: 28px;">📁</span>
                <p class="qe-drop-text" style="margin: 4px 0; font-size: 13px; font-weight: 700; color: #334155;">اسحب الملفات هنا أو انقر للاختيار من الجهاز</p>
                <button type="button" class="btn btn-sm btn-outline-primary qe-drop-btn" onclick="document.getElementById('q_media_file_input').click()">تصفح الجهاز</button>
              </div>

              <!-- URL ATTACHMENTS GRID -->
              <div class="form-grid-2 qe-grid-2">
                <div class="form-group-builder">
                  <label style="font-weight: 700;">رابط فيديو (YouTube / Vimeo / MP4)</label>
                  <input type="text" id="q_video_url" class="form-input-builder" value="${escapeHtml(q.media?.videoUrl || '')}" placeholder="https://..." />
                </div>
                <div class="form-group-builder">
                  <label style="font-weight: 700;">رابط صوتي / تسجيل شرح (Audio URL)</label>
                  <input type="text" id="q_audio_url" class="form-input-builder" value="${escapeHtml(q.media?.audioUrl || '')}" placeholder="https://..." />
                </div>
              </div>

              <!-- ATTACHED IMAGES LIST -->
              ${(q.media?.images || []).length > 0 ? `
                <div style="margin-top: 10px;">
                  <strong style="font-size: 13px;">الصور المرفقة بالسؤال:</strong>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px;">
                    ${(q.media?.images || []).map((img, i) => `
                      <div style="position: relative; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; background: #fff; width: 100px;">
                        <img src="${img.url}" style="width: 100%; height: 70px; object-fit: cover; border-radius: 4px;" />
                        <button type="button" style="position: absolute; top: 2px; right: 2px; background: #ef4444; color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; cursor: pointer;" onclick="removeQuestionImage(${i})">✕</button>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- SECTION 4: ANSWER BUILDER ACCORDING TO TYPE -->
            <div class="builder-card qe-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">
              <h4 class="qe-card-title" style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: var(--primary-color, #6d28d9); display: flex; align-items: center; justify-content: space-between;">
                <span>🎯 4. بناء الخيارات والإجابة الصحيحة (Answer Builder)</span>
                <span style="font-size: 12px; font-weight: 700; color: #64748b;">النوع الحالي: ${getQuestionTypeLabel(q.type)}</span>
              </h4>

              ${renderTypeSpecificAnswerBuilder()}
            </div>

            <!-- SECTION 5: SCORING & RULES -->
            <div class="builder-card qe-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc;">
              <h4 class="qe-card-title" style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: var(--primary-color, #6d28d9); display: flex; align-items: center; gap: 6px;">
                🏆 5. حساب الدرجات والعلامات (Scoring & Rules)
              </h4>

              <div class="form-grid-3 qe-grid-3">
                <div class="form-group-builder">
                  <label style="font-weight: 700;">النقاط الأساسية (Points)</label>
                  <input type="number" id="q_points" class="form-input-builder" value="${q.points || 10}" />
                </div>
                <div class="form-group-builder">
                  <label style="font-weight: 700;">خصم الإجابة الخاطئة (Negative Marking)</label>
                  <input type="number" id="q_negative" class="form-input-builder" value="${q.negativePoints || 0}" />
                </div>
                <div class="form-group-builder">
                  <label style="font-weight: 700;">نقاط البونص الإضافية</label>
                  <input type="number" id="q_bonus" class="form-input-builder" value="${q.bonusPoints || 0}" />
                </div>
              </div>

              <div class="qe-scoring-checks" style="display: flex; gap: 14px; flex-wrap: wrap; margin-top: 10px;">
                <label style="font-size: 13px; font-weight: 700; cursor: pointer;">
                  <input type="checkbox" id="q_req" ${q.isRequired !== false ? 'checked' : ''} /> سؤال إجباري (Required)
                </label>
                <label style="font-size: 13px; font-weight: 700; cursor: pointer;">
                  <input type="checkbox" id="q_rand" ${q.randomPosition ? 'checked' : ''} /> مواضع عشوائية في الاختبار
                </label>
                <label style="font-size: 13px; font-weight: 700; cursor: pointer;">
                  <input type="checkbox" id="q_retry" ${q.allowRetry ? 'checked' : ''} /> السماح بإعادة المحاولة
                </label>
              </div>
            </div>

            <!-- SECTION 6: HINT & EXPLANATION -->
            <div class="builder-card qe-card" style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">
              <h4 class="qe-card-title" style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: var(--primary-color, #6d28d9); display: flex; align-items: center; gap: 6px;">
                💡 6. التلميح والشرح التفصيلي (Hint & Explanation)
              </h4>

              <div class="form-grid-2 qe-grid-2" style="margin-bottom: 10px;">
                <div class="form-group-builder">
                  <label style="font-weight: 700;">نص التلميح (Hint)</label>
                  <input type="text" id="q_hint_text" class="form-input-builder" value="${escapeHtml(q.hint || '')}" placeholder="تلميح لمساعدة الطالب..." />
                </div>
                <div class="form-group-builder">
                  <label style="font-weight: 700;">نوع التلميح</label>
                  <select id="q_hint_type" class="form-select-builder">
                    <option value="free" ${q.hintType === 'free' ? 'selected' : ''}>تلميح مجاني</option>
                    <option value="penalty" ${q.hintType === 'penalty' ? 'selected' : ''}>تلميح مع خصم نسبة من نقاط السؤال</option>
                    <option value="disabled" ${q.hintType === 'disabled' ? 'selected' : ''}>تعطيل التلميح لهذا السؤال</option>
                  </select>
                </div>
              </div>

              <div class="form-group-builder">
                <label style="font-weight: 700;">الشرح التفصيلي بعد الإجابة (Rich Explanation)</label>
                <textarea id="q_explanation_text" class="form-textarea-builder qe-textarea" rows="3" placeholder="توضيح الإجابة بالتفصيل...">${escapeHtml(q.explanation || '')}</textarea>
              </div>
            </div>

          </div>

          <!-- LEFT PANEL: STUDENT LIVE PREVIEW (40% WIDTH) -->
          <div id="preview_left_panel" class="qe-preview-panel" style="width: 420px; min-width: 320px; background: #f1f5f9; padding: 20px; display: flex; flex-direction: column; gap: 14px; overflow-y: auto;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                👁️ المعاينة المباشرة للطلاب (Live Preview)
              </h4>
              <span class="status-badge" style="background: #dcfce7; color: #166534; font-size: 11px;">تحديث لحظي</span>
            </div>

            <div style="border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
                <h5 id="preview_question_text" style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.5;">
                  ${q.question ? escapeHtml(q.question) : '<span style="color:#94a3b8; font-style:italic;">(اكتب نص السؤال في المحرر لرؤية المعاينة...)</span>'}
                </h5>
                <span id="preview_points_badge" class="status-badge" style="background: #e0f2fe; color: #0369a1;">${q.points || 10} نقاط</span>
              </div>

              <!-- PREVIEW MEDIA -->
              <div id="preview_media_container">
                ${q.media && q.media.videoUrl ? `
                  <div style="margin-bottom: 12px; background: #000; border-radius: 8px; padding: 10px; text-align: center; color: #fff; font-size: 12px;">
                    📹 فيديو مدمج: ${escapeHtml(q.media.videoUrl)}
                  </div>
                ` : ''}
              </div>

              <!-- PREVIEW TYPE SPECIFIC RENDER -->
              <div id="preview_answers_container">
                ${renderStudentLivePreviewWidget()}
              </div>

              <!-- PREVIEW HINT BOX -->
              <div id="preview_hint_container">
                ${q.hint ? `
                  <div style="margin-top: 14px; padding: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; color: #b45309;">
                    💡 <strong>تلميح:</strong> ${escapeHtml(q.hint)}
                  </div>
                ` : ''}
              </div>

            </div>

          </div>

        </div>

      </div>
    `;

    const newRightPanel = rootEl.querySelector("#editor_right_panel");
    const newLeftPanel = rootEl.querySelector("#preview_left_panel");
    if (newRightPanel) newRightPanel.scrollTop = savedRightScroll;
    if (newLeftPanel) newLeftPanel.scrollTop = savedLeftScroll;

    attachEditorEventHandlers();
  }

  function renderTypeSpecificAnswerBuilder() {
    if (q.type === "mc" || q.type === "tf") {
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${(q.options || []).map((opt, i) => {
            const optText = typeof opt === "string" ? opt : opt.text;
            const isCorrect = i === q.correctAnswer || (typeof opt === "object" && opt.isCorrect);

            return `
              <div class="qe-ans-opt-row" style="display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <input type="radio" name="mc_correct_radio" ${isCorrect ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" onclick="setMcCorrectAnswer(${i})" title="تعيين كإجابة صحيحة" />
                
                <input type="text" class="form-input-builder qe-opt-input" style="flex: 1;" value="${escapeHtml(optText)}" oninput="updateMcOptionText(${i}, this.value)" placeholder="نص الخيار..." />

                <div class="qe-opt-actions" style="display: flex; gap: 4px;">
                  <button type="button" class="btn-icon-action qe-opt-btn" onclick="moveMcOption(${i}, -1)">↑</button>
                  <button type="button" class="btn-icon-action qe-opt-btn" onclick="moveMcOption(${i}, 1)">↓</button>
                  <button type="button" class="btn-icon-action qe-opt-btn" style="color: #ef4444;" onclick="deleteMcOption(${i})">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}

          <button type="button" class="btn btn-outline-primary qe-add-opt-btn" style="margin-top: 6px;" onclick="addMcOption()">➕ إضافة خيار جديد</button>
        </div>
      `;
    } else if (q.type === "image_choice") {
      return `
        <div class="qe-img-choice-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
          ${(q.options || []).map((opt, i) => {
            const isCorrect = i === q.correctAnswer;
            const imgUrl = typeof opt === "object" ? opt.image : "";

            return `
              <div class="qe-img-choice-card" style="border: 2px solid ${isCorrect ? '#6d28d9' : '#e2e8f0'}; background: #ffffff; border-radius: 10px; padding: 10px; text-align: center;">
                <input type="radio" name="img_correct_radio" ${isCorrect ? 'checked' : ''} onclick="setMcCorrectAnswer(${i})" style="margin-bottom: 6px;" />
                
                <div class="qe-img-choice-box" style="height: 100px; background: #f1f5f9; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
                  ${imgUrl ? `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" />` : '<span style="font-size:24px;">🖼️</span>'}
                </div>

                <input type="text" class="form-input-builder" style="font-size: 12px; margin-bottom: 4px;" value="${escapeHtml(typeof opt === 'object' ? opt.text : opt)}" oninput="updateMcOptionText(${i}, this.value)" placeholder="تسمية الصورة..." />
                <input type="text" class="form-input-builder" style="font-size: 11px;" value="${escapeHtml(imgUrl)}" oninput="updateMcOptionImage(${i}, this.value)" placeholder="رابط الصورة..." />
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (q.type === "matching") {
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div class="qe-matching-header" style="display: flex; gap: 10px; font-size: 12px; font-weight: 800; color: #475569;">
            <span style="flex:1;">العنصر (العمود الأول)</span>
            <span style="flex:1;">المقابل المتطابق (العمود الثاني)</span>
            <span style="width: 40px;"></span>
          </div>

          ${(q.matchingPairs || []).map((pair, i) => `
            <div class="qe-matching-row" style="display: flex; gap: 10px; align-items: center;">
              <input type="text" class="form-input-builder" style="flex:1;" value="${escapeHtml(pair.left)}" oninput="q.matchingPairs[${i}].left=this.value; markUnsaved(); updateLivePreviewAndValidation();" />
              <input type="text" class="form-input-builder" style="flex:1;" value="${escapeHtml(pair.right)}" oninput="q.matchingPairs[${i}].right=this.value; markUnsaved(); updateLivePreviewAndValidation();" />
              <button type="button" class="btn-icon-action qe-opt-btn" style="color:#ef4444;" onclick="q.matchingPairs.splice(${i},1); markUnsaved(); renderModal();">🗑️</button>
            </div>
          `).join('')}

          <button type="button" class="btn btn-outline-primary qe-add-opt-btn" onclick="q.matchingPairs.push({left:'', right:''}); markUnsaved(); renderModal();">➕ إضافة زوج متطابق</button>
        </div>
      `;
    } else if (q.type === "ordering") {
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(q.orderingItems || []).map((item, i) => `
            <div class="qe-ordering-row" style="display: flex; gap: 8px; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #6d28d9;">${i + 1}.</strong>
              <input type="text" class="form-input-builder" style="flex:1;" value="${escapeHtml(item)}" oninput="q.orderingItems[${i}]=this.value; markUnsaved(); updateLivePreviewAndValidation();" />
              <button type="button" class="btn-icon-action qe-opt-btn" style="color:#ef4444;" onclick="q.orderingItems.splice(${i},1); markUnsaved(); renderModal();">🗑️</button>
            </div>
          `).join('')}

          <button type="button" class="btn btn-outline-primary qe-add-opt-btn" onclick="q.orderingItems.push('عنصر ترتيب جديد'); markUnsaved(); renderModal();">➕ إضافة عنصر للترتيب</button>
        </div>
      `;
    } else if (q.type === "short_answer") {
      if (!q.shortAnswer) q.shortAnswer = { acceptedAnswers: [], caseSensitive: false };
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div class="form-group-builder">
            <label style="font-weight: 700;">الإجابات النصية المقبولة (Accepted Answers)</label>
            <input type="text" class="form-input-builder" value="${escapeHtml((q.shortAnswer.acceptedAnswers || []).join(', '))}" oninput="q.shortAnswer.acceptedAnswers=this.value.split(',').map(s=>s.trim()); markUnsaved(); updateLivePreviewAndValidation();" placeholder="ادخل الإجابات المقبولة مفصولة بفواصل..." />
          </div>

          <label style="font-size: 13px; font-weight: 700; cursor: pointer;">
            <input type="checkbox" ${q.shortAnswer.caseSensitive ? 'checked' : ''} onchange="q.shortAnswer.caseSensitive=this.checked; markUnsaved(); renderModal();" /> حساسة لحالة الأحرف (Case Sensitive)
          </label>
        </div>
      `;
    } else if (q.type === "fill_blank") {
      if (!q.fillBlanks) {
        q.fillBlanks = { template: "لغة [HTML] مسؤولة عن الهيكل، بينما [CSS] عن التنسيق.", blanks: [] };
      }
      return `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div class="form-group-builder">
            <label style="font-weight: 700;">قالب النص مع الفراغات بين أقواس [مربعة]</label>
            <input type="text" class="form-input-builder" value="${escapeHtml(q.fillBlanks.template || '')}" oninput="q.fillBlanks.template=this.value; markUnsaved(); updateLivePreviewAndValidation();" placeholder="مثال: لغة [HTML] مسؤولة عن الهيكل، بينما [CSS] عن التنسيق." />
            <small style="color: #64748b; font-size: 11px;">ضع الكلمات التي يراد جعلها فراغات بين أقواس [كلمة].</small>
          </div>
        </div>
      `;
    }

    return `<div>نوع السؤال غير معرف</div>`;
  }

  function renderStudentLivePreviewWidget() {
    if (q.type === "mc" || q.type === "tf") {
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(q.options || []).map((opt) => {
            const text = typeof opt === "string" ? opt : opt.text;
            return `
              <div style="border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; gap: 10px; background: #fff;">
                <input type="radio" disabled />
                <span style="font-size: 14px; font-weight: 700; color: #334155;">${escapeHtml(text)}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (q.type === "image_choice") {
      return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${(q.options || []).map((opt) => {
            const text = typeof opt === "object" ? opt.text : opt;
            const img = typeof opt === "object" ? opt.image : "";
            return `
              <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; text-align: center; background: #fff;">
                <div style="height: 80px; background: #f1f5f9; border-radius: 6px; overflow: hidden; margin-bottom: 6px;">
                  ${img ? `<img src="${img}" style="width:100%; height:100%; object-fit:cover;" />` : ''}
                </div>
                <span style="font-size: 12px; font-weight: 700;">${escapeHtml(text)}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (q.type === "matching") {
      return `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${(q.matchingPairs || []).map((p) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 13px;">
              <strong>${escapeHtml(p.left)}</strong>
              <span style="color:#6d28d9;">↔️</span>
              <strong>${escapeHtml(p.right)}</strong>
            </div>
          `).join('')}
        </div>
      `;
    } else if (q.type === "ordering") {
      return `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${(q.orderingItems || []).map((it) => `
            <div style="padding: 8px 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span>☰</span> ${escapeHtml(it)}
            </div>
          `).join('')}
        </div>
      `;
    } else if (q.type === "short_answer") {
      return `
        <input type="text" class="form-input-builder" disabled placeholder="مساحة كتابة إجابة الطالب القصيرة..." />
      `;
    } else if (q.type === "fill_blank") {
      const tmpl = (q.fillBlanks && q.fillBlanks.template) ? q.fillBlanks.template : "";
      const rendered = tmpl.replace(/\[(.*?)\]/g, '<span style="border-bottom: 2px solid #6d28d9; padding: 0 10px; font-weight: 700; color: #6d28d9;">[ فراغ ]</span>');
      return `<div style="font-size: 14px; line-height: 1.8; padding: 10px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px;">${rendered}</div>`;
    }

    return ``;
  }

  function attachEditorEventHandlers() {
    const mainText = rootEl.querySelector("#q_main_text");
    const qType = rootEl.querySelector("#q_edit_type");
    const qDiff = rootEl.querySelector("#q_edit_diff");
    const qCat = rootEl.querySelector("#q_edit_category");
    const qTopic = rootEl.querySelector("#q_edit_topic");
    const qChapter = rootEl.querySelector("#q_edit_chapter");
    const qTags = rootEl.querySelector("#q_edit_tags");
    const qVideo = rootEl.querySelector("#q_video_url");
    const qAudio = rootEl.querySelector("#q_audio_url");
    const qPoints = rootEl.querySelector("#q_points");
    const qNegative = rootEl.querySelector("#q_negative");
    const qBonus = rootEl.querySelector("#q_bonus");
    const qHint = rootEl.querySelector("#q_hint_text");
    const qHintType = rootEl.querySelector("#q_hint_type");
    const qExplanation = rootEl.querySelector("#q_explanation_text");
    const qReq = rootEl.querySelector("#q_req");
    const qRand = rootEl.querySelector("#q_rand");
    const qRetry = rootEl.querySelector("#q_retry");

    if (mainText) {
      mainText.oninput = (e) => {
        q.question = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qCat) {
      qCat.oninput = (e) => {
        q.category = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qTopic) {
      qTopic.oninput = (e) => {
        q.topic = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qChapter) {
      qChapter.oninput = (e) => {
        q.chapter = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qTags) {
      qTags.oninput = (e) => {
        q.tags = e.target.value.split(',').map(s => s.trim());
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qVideo) {
      qVideo.oninput = (e) => {
        if (!q.media) q.media = {};
        q.media.videoUrl = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qAudio) {
      qAudio.oninput = (e) => {
        if (!q.media) q.media = {};
        q.media.audioUrl = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qPoints) {
      qPoints.oninput = (e) => {
        q.points = parseFloat(e.target.value) || 0;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qNegative) {
      qNegative.oninput = (e) => {
        q.negativePoints = parseFloat(e.target.value) || 0;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qBonus) {
      qBonus.oninput = (e) => {
        q.bonusPoints = parseFloat(e.target.value) || 0;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qHint) {
      qHint.oninput = (e) => {
        q.hint = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qHintType) {
      qHintType.onchange = (e) => {
        q.hintType = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qExplanation) {
      qExplanation.oninput = (e) => {
        q.explanation = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qReq) {
      qReq.onchange = (e) => {
        q.isRequired = e.target.checked;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qRand) {
      qRand.onchange = (e) => {
        q.randomPosition = e.target.checked;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qRetry) {
      qRetry.onchange = (e) => {
        q.allowRetry = e.target.checked;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    if (qType) {
      qType.onchange = (e) => {
        q.type = e.target.value;
        markUnsaved();
        renderModal();
      };
    }

    if (qDiff) {
      qDiff.onchange = (e) => {
        q.difficulty = e.target.value;
        markUnsaved();
        updateLivePreviewAndValidation();
      };
    }

    // Media upload and drag/drop handlers
    const fileInput = rootEl.querySelector("#q_media_file_input");
    const dropZone = rootEl.querySelector("#media_drop_zone");

    const processMediaFiles = (files) => {
      if (!files || !files.length) return;
      if (!q.media) q.media = { images: [], videoUrl: "", audioUrl: "", pdfUrl: "", externalUrl: "" };
      if (!Array.isArray(q.media.images)) q.media.images = [];

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          if (file.type.startsWith("image/")) {
            q.media.images.push({ url: dataUrl, name: file.name, type: file.type });
          } else if (file.type.startsWith("video/")) {
            q.media.videoUrl = dataUrl;
          } else if (file.type.startsWith("audio/")) {
            q.media.audioUrl = dataUrl;
          } else if (file.type.includes("pdf")) {
            q.media.pdfUrl = dataUrl;
          }
          markUnsaved();
          renderModal();
        };
        reader.readAsDataURL(file);
      });
    };

    if (fileInput) {
      fileInput.onchange = (e) => processMediaFiles(e.target.files);
    }

    if (dropZone) {
      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = "#6d28d9"; };
      dropZone.ondragleave = (e) => { e.preventDefault(); dropZone.style.borderColor = "#cbd5e1"; };
      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.borderColor = "#cbd5e1";
        if (e.dataTransfer && e.dataTransfer.files) {
          processMediaFiles(e.dataTransfer.files);
        }
      };
    }

    const cancelBtn = rootEl.querySelector("#btn_cancel_question_editor");
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        activeQuestionSaveCallback = null;
        restoreOriginatingContext();
      };
    }

    let isSubmitting = false;
    const saveBtn = rootEl.querySelector("#btn_save_master_question");
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (isSubmitting) return;

        if (!validateQuestion()) {
          showCustomAlert("يرجى تصحيح أخطاء السؤال قبل الحفظ.");
          return;
        }

        isSubmitting = true;
        saveBtn.disabled = true;

        let savedQuestion;
        if (isEditingExisting) {
          savedQuestion = updateBankQuestion(q.id, q) || q;
        } else {
          savedQuestion = addQuestionToBank(q);
        }

        document.dispatchEvent(new CustomEvent("questionBankUpdated", { detail: savedQuestion }));

        showCustomAlert("🎉 تم حفظ السؤال بنجاح!");

        const cb = activeQuestionSaveCallback || onSaveCallback;
        activeQuestionSaveCallback = null;

        restoreOriginatingContext();

        if (typeof cb === "function") {
          cb(savedQuestion);
        }
      };
    }
  }

  // Window helper actions inside modal
  window.removeQuestionImage = (idx) => {
    if (q.media && Array.isArray(q.media.images)) {
      q.media.images.splice(idx, 1);
      markUnsaved();
      renderModal();
    }
  };

  window.setMcCorrectAnswer = (idx) => {
    q.correctAnswer = idx;
    if (Array.isArray(q.options)) {
      q.options.forEach((opt, i) => {
        if (typeof opt === "object") opt.isCorrect = i === idx;
      });
    }
    markUnsaved();
    updateLivePreviewAndValidation();
  };

  window.updateMcOptionText = (idx, text) => {
    if (q.options[idx] !== undefined) {
      if (typeof q.options[idx] === "string") {
        q.options[idx] = text;
      } else {
        q.options[idx].text = text;
      }
      markUnsaved();
      updateLivePreviewAndValidation();
    }
  };

  window.updateMcOptionImage = (idx, url) => {
    if (q.options[idx] !== undefined) {
      if (typeof q.options[idx] === "string") {
        q.options[idx] = { text: q.options[idx], image: url, isCorrect: idx === q.correctAnswer };
      } else {
        q.options[idx].image = url;
      }
      markUnsaved();
      updateLivePreviewAndValidation();
    }
  };

  window.addMcOption = () => {
    q.options.push({ text: `خيار ${q.options.length + 1}`, richText: "", image: "", isCorrect: false });
    markUnsaved();
    renderModal();
  };

  window.deleteMcOption = (idx) => {
    q.options.splice(idx, 1);
    markUnsaved();
    renderModal();
  };

  window.moveMcOption = (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= q.options.length) return;
    const temp = q.options[idx];
    q.options[idx] = q.options[target];
    q.options[target] = temp;
    markUnsaved();
    renderModal();
  };

  window.insertRichFormat = (start, end) => {
    const textarea = rootEl.querySelector("#q_main_text");
    if (!textarea) return;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(selStart, selEnd);
    textarea.value = val.substring(0, selStart) + start + (selected || "نص مدمج") + end + val.substring(selEnd);
    q.question = textarea.value;
    markUnsaved();
    updateLivePreviewAndValidation();
    textarea.focus();
    textarea.setSelectionRange(selStart + start.length, selEnd + start.length);
  };

  window.insertRichTable = () => {
    const tableMd = `\n| العمود 1 | العمود 2 |\n|---|---|\n| قيمة 1 | قيمة 2 |\n`;
    window.insertRichFormat(tableMd, "");
  };

  window.insertRichLink = () => {
    window.insertRichFormat("[عنوان الرابط](", "https://example.com)");
  };

  window.exportQuestionJson = () => {
    const jsonStr = JSON.stringify(q, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `question_${q.id || 'export'}.json`;
    a.click();
  };

  renderModal();
}

function getQuestionTypeLabel(type) {
  switch (type) {
    case "mc": return "اختيار من متعدد";
    case "tf": return "صح / خطأ";
    case "image_choice": return "اختيار بالصور";
    case "matching": return "توصيل الأعمدة";
    case "ordering": return "الترتيب التسلسلي";
    case "fill_blank": return "إكمال الفراغ";
    case "short_answer": return "إجابة قصيرة";
    default: return type;
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
