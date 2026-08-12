import { showCustomAlert } from "../utils/helpers.js";
import { hideAllMainSections } from "./layoutService.js";
import { openAdvancedQuestionEditorModal } from "./advancedQuestionEditorService.js";

const QUESTION_BANK_KEY = "lms_question_bank_v2";

/**
 * Pre-seeded Question Bank Dataset
 */
const DEFAULT_BANK_QUESTIONS = [
  {
    id: "qb_101",
    question: "ما هي الخاصية المسؤولة عن محاذاة العناصر في CSS Flexbox على المحور الرئيسي؟",
    type: "mc",
    category: "programming",
    difficulty: "medium",
    tags: ["CSS", "Flexbox", "Frontend"],
    options: ["justify-content", "align-items", "flex-direction", "grid-gap"],
    correctAnswer: 0,
    points: 10,
    negativePoints: 2,
    bonusPoints: 0,
    hint: "تأكد من التفريق بين المحور الرئيسي (Main Axis) والمحور التقاطعي (Cross Axis).",
    hintType: "penalty",
    hintPenaltyPercent: 25,
    explanation: "خاصية justify-content تضبط محاذاة عناصر flex على المحور الرئيسي Main Axis.",
    referenceLinks: [
      { title: "دليل Flexbox على MDN", url: "https://developer.mozilla.org/en-US/docs/Web/CSS/flex" }
    ],
    isArchived: false,
    usedCount: 5,
    createdAt: "2026-08-01T10:00:00.000Z"
  },
  {
    id: "qb_102",
    question: "في React، ما هي الهوك المخصصة لإدارة الآثار الجانبية (Side Effects) مثل طلبات الشبكة؟",
    type: "mc",
    category: "programming",
    difficulty: "easy",
    tags: ["React", "JavaScript", "Hooks"],
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correctAnswer: 1,
    points: 10,
    negativePoints: 0,
    bonusPoints: 2,
    hint: "اسم الهوك يحتوي على كلمة Effect.",
    hintType: "free",
    hintPenaltyPercent: 0,
    explanation: "تستخدم useEffect للتعامل مع side-effects بعد دورة التقديم (render).",
    referenceLinks: [
      { title: "مستندات React الرسمية - useEffect", url: "https://react.dev/reference/react/useEffect" }
    ],
    isArchived: false,
    usedCount: 8,
    createdAt: "2026-08-01T11:30:00.000Z"
  },
  {
    id: "qb_103",
    question: "لغة HTML هي لغة برمجة كائنية التوجه (Object-Oriented Programming Language).",
    type: "tf",
    category: "programming",
    difficulty: "easy",
    tags: ["HTML", "Web"],
    options: ["صحيح", "خطأ"],
    correctAnswer: 1, // 1 = خطأ
    points: 5,
    negativePoints: 1,
    bonusPoints: 0,
    hint: "HTML هي لغة توصيف هيكل الصفحات وليست لغة برمجة تنفذ خوارزميات.",
    hintType: "free",
    hintPenaltyPercent: 0,
    explanation: "خطأ. HTML تعني HyperText Markup Language وهي لغة هيكلة وتنسيق مستندات وليست لغة برمجة.",
    referenceLinks: [],
    isArchived: false,
    usedCount: 12,
    createdAt: "2026-08-01T12:00:00.000Z"
  },
  {
    id: "qb_104",
    question: "ما هو النموذج الأنسب في التصميم لإنشاء أنظمة ألوان ومكونات قابلة لإعادة الاستخدام (Design System)؟",
    type: "mc",
    category: "design",
    difficulty: "hard",
    tags: ["UI/UX", "Design System", "Figma"],
    options: ["Atomic Design Model", "Waterfall Model", "MVC Model", "Monolithic Design"],
    correctAnswer: 0,
    points: 15,
    negativePoints: 3,
    bonusPoints: 5,
    hint: "يعتمد هذا النموذج على الذرات (Atoms) والجزئيات (Molecules).",
    hintType: "penalty",
    hintPenaltyPercent: 20,
    explanation: "Atomic Design يرتكز على بناء الواجهات بدءاً من الذرات مروراً بالجزيئات والكائنات، وصولاً إلى الصفحات الكاملة.",
    referenceLinks: [
      { title: "Atomic Design Methodology", url: "https://atomicdesign.bradfrost.com/" }
    ],
    isArchived: false,
    usedCount: 4,
    createdAt: "2026-08-02T09:00:00.000Z"
  },
  {
    id: "qb_105",
    question: "ما هو الناتج من التعبير التالي في JavaScript: typeof null ؟",
    type: "mc",
    category: "programming",
    difficulty: "medium",
    tags: ["JavaScript", "Variables"],
    options: ["null", "undefined", "object", "number"],
    correctAnswer: 2,
    points: 10,
    negativePoints: 2,
    bonusPoints: 0,
    hint: "هذه واحدة من أشهر السلوكيات التاريخية (Legacy Bugs) في JavaScript.",
    hintType: "penalty",
    hintPenaltyPercent: 25,
    explanation: "في JavaScript يرجع typeof null القيمة 'object' بسبب طريقة تمثيل البيانات في أول إصدار من اللغة.",
    referenceLinks: [],
    isArchived: false,
    usedCount: 15,
    createdAt: "2026-08-02T10:15:00.000Z"
  }
];

/**
 * Load Question Bank from LocalStorage or initialize
 */
export function getQuestionBank() {
  try {
    const raw = localStorage.getItem(QUESTION_BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading question bank:", e);
  }
  // Save defaults
  saveQuestionBank(DEFAULT_BANK_QUESTIONS);
  return DEFAULT_BANK_QUESTIONS;
}

/**
 * Save Question Bank to LocalStorage
 */
export function saveQuestionBank(questions) {
  try {
    localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(questions));
    document.dispatchEvent(new CustomEvent("questionBankUpdated"));
  } catch (e) {
    console.error("Error saving question bank:", e);
  }
}

/**
 * Search and filter question bank
 */
export function searchBankQuestions({ query = "", category = "", difficulty = "", tag = "", includeArchived = false } = {}) {
  const bank = getQuestionBank();
  const cleanQuery = query.toLowerCase().trim();

  return bank.filter((item) => {
    if (!includeArchived && item.isArchived) return false;
    if (includeArchived === "only" && !item.isArchived) return false;

    if (category && item.category !== category) return false;
    if (difficulty && item.difficulty !== difficulty) return false;
    if (tag && (!item.tags || !item.tags.includes(tag))) return false;

    if (cleanQuery) {
      const matchText = (item.question || "").toLowerCase().includes(cleanQuery);
      const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(cleanQuery));
      const matchCategory = (item.category || "").toLowerCase().includes(cleanQuery);
      return matchText || matchTags || matchCategory;
    }

    return true;
  });
}

/**
 * Add a new question to the Question Bank
 */
export function addQuestionToBank(questionObj) {
  const bank = getQuestionBank();
  const newQuestion = {
    ...questionObj,
    id: (questionObj.id && String(questionObj.id).startsWith("qb_")) ? questionObj.id : ("qb_" + Date.now() + "_" + Math.floor(Math.random() * 1000)),
    question: questionObj.question || "سؤال جديد",
    type: questionObj.type || "mc",
    category: questionObj.category || "programming",
    difficulty: questionObj.difficulty || "medium",
    tags: Array.isArray(questionObj.tags) ? questionObj.tags : (questionObj.tags ? String(questionObj.tags).split(",").map((t) => t.trim()) : []),
    options: questionObj.options || ["خيار A", "خيار B"],
    correctAnswer: questionObj.correctAnswer !== undefined ? questionObj.correctAnswer : 0,
    points: Number(questionObj.points) || 10,
    negativePoints: Number(questionObj.negativePoints) || 0,
    bonusPoints: Number(questionObj.bonusPoints) || 0,
    hint: questionObj.hint || "",
    hintType: questionObj.hintType || "free",
    hintPenaltyPercent: Number(questionObj.hintPenaltyPercent) || 0,
    explanation: questionObj.explanation || "",
    referenceLinks: Array.isArray(questionObj.referenceLinks) ? questionObj.referenceLinks : [],
    isArchived: false,
    usedCount: questionObj.usedCount || 0,
    createdAt: questionObj.createdAt || new Date().toISOString()
  };

  bank.unshift(newQuestion);
  saveQuestionBank(bank);
  return newQuestion;
}

/**
 * Update an existing Bank Question
 */
export function updateBankQuestion(id, updatedFields) {
  const bank = getQuestionBank();
  const index = bank.findIndex((q) => q.id === id);
  if (index === -1) return null;

  bank[index] = {
    ...bank[index],
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };

  saveQuestionBank(bank);
  return bank[index];
}

/**
 * Duplicate a Question in Bank
 */
export function duplicateBankQuestion(id) {
  const bank = getQuestionBank();
  const existing = bank.find((q) => q.id === id);
  if (!existing) return null;

  const clone = JSON.parse(JSON.stringify(existing));
  clone.id = "qb_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  clone.question = clone.question + " (نسخة مكررة)";
  clone.usedCount = 0;
  clone.createdAt = new Date().toISOString();

  bank.unshift(clone);
  saveQuestionBank(bank);
  return clone;
}

/**
 * Archive / Restore Bank Question
 */
export function toggleArchiveQuestion(id, archiveState = true) {
  const bank = getQuestionBank();
  const item = bank.find((q) => q.id === id);
  if (item) {
    item.isArchived = archiveState;
    saveQuestionBank(bank);
  }
}

/**
 * Permanently Delete Question
 */
export function deleteBankQuestion(id) {
  let bank = getQuestionBank();
  bank = bank.filter((q) => q.id !== id);
  saveQuestionBank(bank);
}

/**
 * Import Questions from CSV or Excel file contents with validation
 * @param {string} textContent Raw text or CSV string
 * @param {string} format 'csv' | 'json'
 */
export function parseAndValidateImportQuestions(textContent, format = "csv") {
  const errors = [];
  const warnings = [];
  const validQuestions = [];

  if (!textContent || !textContent.trim()) {
    return {
      isValid: false,
      totalFound: 0,
      importedCount: 0,
      errors: ["الملف فارغ لا يحتوي على أي بيانات أسئلة."],
      warnings: [],
      questions: []
    };
  }

  if (format === "json") {
    try {
      const parsed = JSON.parse(textContent);
      const rawList = Array.isArray(parsed) ? parsed : [parsed];

      rawList.forEach((q, idx) => {
        const rowNum = idx + 1;
        if (!q.question || !q.question.trim()) {
          errors.push(`الصف ${rowNum}: نص السؤال مفقود.`);
          return;
        }
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          errors.push(`الصف ${rowNum}: خيارات السؤال يجب أن تكون قائمة وتتكون من خيارين على الأقل.`);
          return;
        }

        const validQ = {
          question: q.question.trim(),
          type: q.type || (q.options.length === 2 && q.options.includes("صح") ? "tf" : "mc"),
          category: q.category || "programming",
          difficulty: q.difficulty || "medium",
          tags: Array.isArray(q.tags) ? q.tags : ["مستورد"],
          options: q.options.map((o) => String(o).trim()),
          correctAnswer: Number(q.correctAnswer) || 0,
          points: Number(q.points) || 10,
          negativePoints: Number(q.negativePoints) || 0,
          bonusPoints: Number(q.bonusPoints) || 0,
          hint: q.hint || "",
          hintType: q.hintType || "free",
          explanation: q.explanation || "",
          referenceLinks: Array.isArray(q.referenceLinks) ? q.referenceLinks : []
        };
        validQuestions.push(validQ);
      });
    } catch (e) {
      errors.push("فشل في تحليل ملف JSON: " + e.message);
    }
  } else {
    // CSV Parsing Mode
    const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return {
        isValid: false,
        totalFound: 0,
        importedCount: 0,
        errors: ["الملف CSV يتطلب صف رأس (Header) وصف سؤال واحد على الأقل."],
        warnings: [],
        questions: []
      };
    }

    // Skip header line (e.g., Question,Type,Category,Difficulty,Option1,Option2,Option3,Option4,CorrectIndex,Points,Hint,Explanation)
    const dataLines = lines.slice(1);

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2;
      // Split CSV allowing commas inside quotes
      const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanCols = columns.map((c) => c.replace(/^"|"$/g, "").trim());

      if (cleanCols.length < 5) {
        errors.push(`الصف ${rowNum}: عدد أعمدة البيانات غير كافٍ.`);
        return;
      }

      const questionText = cleanCols[0];
      const category = cleanCols[1] || "programming";
      const difficulty = cleanCols[2] || "medium";
      const option1 = cleanCols[3];
      const option2 = cleanCols[4];
      const option3 = cleanCols[5] || "";
      const option4 = cleanCols[6] || "";
      const correctIdxStr = cleanCols[7] || "0";
      const pointsStr = cleanCols[8] || "10";
      const hint = cleanCols[9] || "";
      const explanation = cleanCols[10] || "";

      if (!questionText) {
        errors.push(`الصف ${rowNum}: نص السؤال مفقود.`);
        return;
      }
      if (!option1 || !option2) {
        errors.push(`الصف ${rowNum}: يجب تقديم خيارين على الأقل للسؤال.`);
        return;
      }

      const options = [option1, option2];
      if (option3) options.push(option3);
      if (option4) options.push(option4);

      let correctIdx = parseInt(correctIdxStr, 10);
      if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
        warnings.push(`الصف ${rowNum}: دليل الإجابة الصحيحة غير دقيق (${correctIdxStr})، تم تعيين الخيار الأول تلقائياً.`);
        correctIdx = 0;
      }

      const points = parseInt(pointsStr, 10) || 10;

      validQuestions.push({
        question: questionText,
        type: options.length === 2 && (option1 === "صح" || option1 === "True") ? "tf" : "mc",
        category,
        difficulty,
        tags: ["استيراد CSV"],
        options,
        correctAnswer: correctIdx,
        points,
        negativePoints: 0,
        bonusPoints: 0,
        hint,
        hintType: hint ? "free" : "disabled",
        explanation,
        referenceLinks: []
      });
    });
  }

  return {
    isValid: errors.length === 0,
    totalFound: validQuestions.length + errors.length,
    importedCount: validQuestions.length,
    errors,
    warnings,
    questions: validQuestions
  };
}

/**
 * Dedicated Full Page Renderer for Question Bank ("بنك الأسئلة المركزي")
 */
export function renderQuestionBankPage() {
  hideAllMainSections();

  const page = document.getElementById("questionBankPage");
  const container = document.getElementById("questionBankContent");

  if (page) page.classList.remove("hidden");
  if (!container) return;

  if (!window.location.hash.includes("question-bank")) {
    window.location.hash = "#teacher/question-bank";
  }

  let searchQuery = "";
  let selectedCategory = "";
  let selectedDifficulty = "";
  let activeTab = "active"; // active | archived

  function renderUI() {
    const questions = searchBankQuestions({
      query: searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      includeArchived: activeTab === "archived" ? "only" : false
    });

    const allBank = getQuestionBank();
    const totalCount = allBank.length;
    const activeCount = allBank.filter((q) => !q.isArchived).length;
    const archivedCount = allBank.filter((q) => q.isArchived).length;

    container.innerHTML = `
      <div style="max-width: 1280px; margin: 0 auto; padding: 24px 16px;">
        
        <!-- BREADCRUMB & HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">
              <span>لوحة المعلم</span> &gt; <span style="color: #6d28d9; font-weight: 700;">بنك الأسئلة المركزي</span>
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px;">
              📚 بنك الأسئلة المركزي (Central Question Bank)
            </h1>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" id="btn_new_question_bank" style="padding: 10px 18px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
              ➕ إضافة سؤال جديد
            </button>
            <button type="button" class="btn btn-secondary" id="btn_import_questions_bank" style="padding: 10px 18px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
              📥 استيراد أسئلة (CSV)
            </button>
            <button type="button" class="btn btn-secondary" onclick="window.location.hash='#teacher/dashboard'" style="padding: 10px 18px; border-radius: 10px;">
              ← لوحة التحكّم
            </button>
          </div>
        </div>

        <!-- STATS CARDS ROW -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="width: 46px; height: 46px; border-radius: 12px; background: #f5f3ff; color: #6d28d9; display: flex; align-items: center; justify-content: center; font-size: 22px;">📚</div>
            <div>
              <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${totalCount}</div>
              <div style="font-size: 13px; color: #64748b;">إجمالي الأسئلة</div>
            </div>
          </div>

          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="width: 46px; height: 46px; border-radius: 12px; background: #f0fdf4; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 22px;">✅</div>
            <div>
              <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${activeCount}</div>
              <div style="font-size: 13px; color: #64748b;">أسئلة نشطة متاحة</div>
            </div>
          </div>

          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="width: 46px; height: 46px; border-radius: 12px; background: #fff7ed; color: #ea580c; display: flex; align-items: center; justify-content: center; font-size: 22px;">📦</div>
            <div>
              <div style="font-size: 22px; font-weight: 800; color: #0f172a;">${archivedCount}</div>
              <div style="font-size: 13px; color: #64748b;">أسئلة مؤرشفة</div>
            </div>
          </div>
        </div>

        <!-- CONTROLS & SEARCH BAR -->
        <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 16px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
            <!-- Tabs: Active / Archived -->
            <div style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 10px;">
              <button type="button" id="tab_active_qs" style="padding: 8px 16px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; ${activeTab === 'active' ? 'background:#fff; color:#6d28d9; box-shadow:0 1px 2px rgba(0,0,0,0.08);' : 'background:transparent; color:#64748b;'}">
                الأسئلة النشطة (${activeCount})
              </button>
              <button type="button" id="tab_archived_qs" style="padding: 8px 16px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; ${activeTab === 'archived' ? 'background:#fff; color:#ea580c; box-shadow:0 1px 2px rgba(0,0,0,0.08);' : 'background:transparent; color:#64748b;'}">
                الأرشيف (${archivedCount})
              </button>
            </div>

            <div style="font-size: 13px; color: #64748b;">
              عدد النتائج المعروضة: <strong>${questions.length}</strong> سؤال
            </div>
          </div>

          <!-- Filters Row -->
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px;">
            <div>
              <input type="text" id="qb_search_input" value="${searchQuery}" placeholder="ابحث بنص السؤال، التاج، أو الخيارات..." style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px;" />
            </div>
            <div>
              <select id="qb_category_select" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #fff;">
                <option value="">كل التصنيفات</option>
                <option value="programming" ${selectedCategory === 'programming' ? 'selected' : ''}>برمجة وتطوير</option>
                <option value="design" ${selectedCategory === 'design' ? 'selected' : ''}>تصميم واجهات</option>
                <option value="marketing" ${selectedCategory === 'marketing' ? 'selected' : ''}>تسويق رقمي</option>
              </select>
            </div>
            <div>
              <select id="qb_difficulty_select" style="width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #fff;">
                <option value="">كل الصعوبات</option>
                <option value="easy" ${selectedDifficulty === 'easy' ? 'selected' : ''}>سهل (Easy)</option>
                <option value="medium" ${selectedDifficulty === 'medium' ? 'selected' : ''}>متوسط (Medium)</option>
                <option value="hard" ${selectedDifficulty === 'hard' ? 'selected' : ''}>صعب (Hard)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- QUESTIONS GRID LIST -->
        ${questions.length === 0 ? `
          <div style="background: #fff; border: 1px dashed #cbd5e1; border-radius: 14px; padding: 48px 20px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
            <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px;">لم نجد أسئلة تطابق البحث الحالي</h3>
            <p style="color: #64748b; font-size: 14px; margin: 0;">يمكنك تغيير الفلاتر أو إضافة سؤال جديد إلى البنك.</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${questions.map((q) => `
              <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#e2e8f0'">
                
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 280px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                      <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #f3e8ff; color: #7e22ce;">
                        ${q.category || 'عام'}
                      </span>
                      <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: ${q.difficulty === 'easy' ? '#dcfce7; color:#15803d;' : q.difficulty === 'hard' ? '#fee2e2; color:#b91c1c;' : '#fef3c7; color:#b45309;'};">
                        ${q.difficulty === 'easy' ? 'سهل' : q.difficulty === 'hard' ? 'صعب' : 'متوسط'}
                      </span>
                      <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 6px;">
                        🎯 ${q.points || 10} نقاط
                      </span>
                      ${q.usedCount ? `<span style="font-size: 11px; color: #0369a1; background: #e0f2fe; padding: 2px 8px; border-radius: 6px;">🔄 مستخدم في ${q.usedCount} اختبارات</span>` : ''}
                    </div>

                    <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.5;">
                      ${escapeHtml(q.question)}
                    </h3>

                    ${q.tags && q.tags.length > 0 ? `
                      <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
                        ${q.tags.map((t) => `<span style="font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px;">#${escapeHtml(t)}</span>`).join('')}
                      </div>
                    ` : ''}
                  </div>

                  <!-- ACTION BUTTONS -->
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-secondary btn-edit-q" data-id="${q.id}" title="تعديل السؤال" aria-label="تعديل السؤال" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      تعديل
                    </button>
                    <button type="button" class="btn btn-secondary btn-dup-q" data-id="${q.id}" title="تكرار السؤال" aria-label="تكرار السؤال" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      تكرار
                    </button>
                    <button type="button" class="btn btn-secondary btn-archive-q" data-id="${q.id}" data-archived="${q.isArchived}" title="${q.isArchived ? 'استعادة السؤال' : 'أرشفة السؤال'}" aria-label="${q.isArchived ? 'استعادة السؤال' : 'أرشفة السؤال'}" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                      ${q.isArchived ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg> استعادة` : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> أرشفة`}
                    </button>
                    <button type="button" class="btn btn-secondary btn-del-q" data-id="${q.id}" title="حذف السؤال" aria-label="حذف السؤال" style="padding: 6px 12px; font-size: 12px; border-radius: 8px; color: #dc2626; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      حذف
                    </button>
                  </div>
                </div>

                <!-- OPTIONS PREVIEW -->
                ${q.options && q.options.length > 0 ? `
                  <div style="background: #f8fafc; border-radius: 8px; padding: 10px 14px; font-size: 13px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; border: 1px solid #f1f5f9;">
                    ${q.options.map((opt, idx) => {
                      const text = typeof opt === 'string' ? opt : opt.text;
                      const isCorrect = idx === q.correctAnswer || (typeof opt === 'object' && opt.isCorrect);
                      return `
                        <div style="display: flex; align-items: center; gap: 6px; color: ${isCorrect ? '#15803d' : '#475569'}; font-weight: ${isCorrect ? '700' : '400'};">
                          <span>${isCorrect ? '✅' : '⚪'}</span>
                          <span>${escapeHtml(text)}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}

              </div>
            `).join('')}
          </div>
        `}

      </div>
    `;

    // Bind event handlers
    container.querySelector("#btn_new_question_bank")?.addEventListener("click", () => {
      openAdvancedQuestionEditorModal(null, () => renderUI());
    });

    container.querySelector("#btn_import_questions_bank")?.addEventListener("click", () => {
      window.location.hash = "#teacher/questions/import";
    });

    container.querySelector("#tab_active_qs")?.addEventListener("click", () => {
      activeTab = "active";
      renderUI();
    });

    container.querySelector("#tab_archived_qs")?.addEventListener("click", () => {
      activeTab = "archived";
      renderUI();
    });

    container.querySelector("#qb_search_input")?.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      renderUI();
    });

    container.querySelector("#qb_category_select")?.addEventListener("change", (e) => {
      selectedCategory = e.target.value;
      renderUI();
    });

    container.querySelector("#qb_difficulty_select")?.addEventListener("change", (e) => {
      selectedDifficulty = e.target.value;
      renderUI();
    });

    // Question item action bindings
    container.querySelectorAll(".btn-edit-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const bank = getQuestionBank();
        const item = bank.find((q) => q.id === id);
        if (item) {
          openAdvancedQuestionEditorModal(item, () => renderUI());
        }
      });
    });

    container.querySelectorAll(".btn-dup-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        duplicateBankQuestion(id);
        showCustomAlert("تم تكرار السؤال بنجاح!");
        renderUI();
      });
    });

    container.querySelectorAll(".btn-archive-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const isArchived = btn.getAttribute("data-archived") === "true";
        toggleArchiveQuestion(id, !isArchived);
        showCustomAlert(isArchived ? "تمت استعادة السؤال بنجاح" : "تم نقل السؤال إلى الأرشيف");
        renderUI();
      });
    });

    container.querySelectorAll(".btn-del-q").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm("هل أنت تأكد من رغبتك في حذف هذا السؤال نهائياً من بنك الأسئلة؟")) {
          deleteBankQuestion(id);
          showCustomAlert("تم حذف السؤال نهائياً");
          renderUI();
        }
      });
    });
  }

  renderUI();
}

/**
 * Compatibility helper
 */
export function openQuestionBankModal() {
  renderQuestionBankPage();
}

/**
 * Dedicated Full Page Renderer for Importing Questions (CSV/Excel Importer)
 */
export function renderImportQuestionsPage() {
  hideAllMainSections();

  const page = document.getElementById("importQuestionsPage");
  const container = document.getElementById("importQuestionsContent");

  if (page) page.classList.remove("hidden");
  if (!container) return;

  if (!window.location.hash.includes("questions/import")) {
    window.location.hash = "#teacher/questions/import";
  }

  let fileContent = null;
  let fileName = "";
  let validationResult = null;

  function renderUI() {
    container.innerHTML = `
      <div style="max-width: 960px; margin: 0 auto; padding: 24px 16px;">
        
        <!-- BREADCRUMB & HEADER -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">
            <span>لوحة المعلم</span> &gt; <a href="#teacher/question-bank" style="color: #6d28d9; text-decoration: none; font-weight: 700;">بنك الأسئلة</a> &gt; <span style="color: #0f172a;">استيراد أسئلة</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a;">
              📥 استيراد الأسئلة من ملف (Excel / CSV)
            </h1>
            <button type="button" class="btn btn-secondary" onclick="if(window.handleGlobalBack) window.handleGlobalBack(event); else window.location.hash='#teacher/question-bank'" style="border-radius: 8px;">
              ← العودة لبنك الأسئلة
            </button>
          </div>
        </div>

        <!-- INSTRUCTIONS & SAMPLE FORMAT -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px; color: #1e40af; line-height: 1.6;">
          <strong>ℹ️ صيغة ملف الاستيراد المطلوبة:</strong>
          <div style="margin-top: 6px;">
            يجب أن يحتوي الملف على الأعمدة بالترتيب التالي: <br/>
            <code>QuestionText, Category, Difficulty, Option1, Option2, Option3, Option4, CorrectIndex (0-3), Points, Hint, Explanation</code>
          </div>
          <div style="margin-top: 10px;">
            <button type="button" id="btn_download_csv_template" style="background: #3b82f6; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px;">
              📄 تحميل قالب CSV توضيحي
            </button>
          </div>
        </div>

        <!-- UPLOAD DROPZONE -->
        <div style="background: #fff; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px 20px; text-align: center; margin-bottom: 24px; transition: border 0.2s;" id="dropzone_box">
          <div style="font-size: 48px; margin-bottom: 12px;">📄</div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #0f172a;">اختر ملف CSV أو Excel للاستيراد</h3>
          <p style="color: #64748b; font-size: 13px; margin: 0 0 20px 0;">يدعم الملفات بحجم حتى 10 ميجابايت (.csv, .xlsx)</p>
          
          <label class="btn btn-primary" style="padding: 10px 24px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
            <span>📁 اختيار ملف من الجهاز</span>
            <input type="file" id="csv_file_input" accept=".csv, .xlsx" style="display: none;" />
          </label>

          ${fileName ? `
            <div style="margin-top: 16px; font-weight: 700; color: #16a34a; font-size: 14px;">
              ✅ الملف المحدد: ${escapeHtml(fileName)}
            </div>
          ` : ''}
        </div>

        <!-- VALIDATION RESULTS & PREVIEW -->
        ${validationResult ? `
          <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
              📊 نتائج الفحص والمعاينة قبل الاستيراد
            </h3>

            <!-- SUMMARY BADGES -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${validationResult.totalFound}</div>
                <div style="font-size: 12px; color: #64748b;">إجمالي الأسئلة بالملف</div>
              </div>

              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #16a34a;">${validationResult.importedCount}</div>
                <div style="font-size: 12px; color: #15803d;">أسئلة صالحة للاستيراد</div>
              </div>

              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #dc2626;">${validationResult.errors.length}</div>
                <div style="font-size: 12px; color: #991b1b;">أخطاء يرجى إصلاحها</div>
              </div>

              <div style="background: #fffbe0; border: 1px solid #fde68a; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #d97706;">${validationResult.warnings.length}</div>
                <div style="font-size: 12px; color: #b45309;">تنبيهات وتنبيهات ملحوظة</div>
              </div>
            </div>

            <!-- ERRORS BOX -->
            ${validationResult.errors.length > 0 ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; color: #991b1b; font-size: 13px;">
                <strong>❌ قائمة الأخطاء في الملف:</strong>
                <ul style="margin: 6px 0 0 0; padding-right: 18px;">
                  ${validationResult.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- WARNINGS BOX -->
            ${validationResult.warnings.length > 0 ? `
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; color: #b45309; font-size: 13px;">
                <strong>⚠️ التنبيهات:</strong>
                <ul style="margin: 6px 0 0 0; padding-right: 18px;">
                  ${validationResult.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- PREVIEW TABLE -->
            ${validationResult.questions.length > 0 ? `
              <div style="margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">👀 معاينة الأسئلة الصالحة:</h4>
                <div style="max-height: 280px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: right;">
                    <thead>
                      <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <th style="padding: 10px; border-left: 1px solid #e2e8f0;">#</th>
                        <th style="padding: 10px; border-left: 1px solid #e2e8f0;">السؤال</th>
                        <th style="padding: 10px; border-left: 1px solid #e2e8f0;">التصنيف</th>
                        <th style="padding: 10px; border-left: 1px solid #e2e8f0;">الصعوبة</th>
                        <th style="padding: 10px;">عدد الخيارات</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${validationResult.questions.map((q, idx) => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 8px 10px; border-left: 1px solid #f1f5f9;">${idx + 1}</td>
                          <td style="padding: 8px 10px; border-left: 1px solid #f1f5f9; font-weight: 600;">${escapeHtml(q.question)}</td>
                          <td style="padding: 8px 10px; border-left: 1px solid #f1f5f9;">${q.category}</td>
                          <td style="padding: 8px 10px; border-left: 1px solid #f1f5f9;">${q.difficulty}</td>
                          <td style="padding: 8px 10px;">${q.options ? q.options.length : 0} خيارات</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- CONFIRM IMPORT ACTION -->
            <div style="display: flex; justify-content: flex-end; gap: 12px;">
              <button type="button" class="btn btn-secondary" onclick="window.location.hash='#teacher/question-bank'">إلغاء</button>
              <button type="button" class="btn btn-primary" id="btn_confirm_import_questions" ${validationResult.questions.length === 0 ? 'disabled style="opacity:0.5;"' : ''} style="padding: 10px 24px; border-radius: 10px;">
                🚀 تأكيد حفظ الأسئلة في البنك (${validationResult.questions.length})
              </button>
            </div>

          </div>
        ` : ''}

      </div>
    `;

    // Bind event handlers
    container.querySelector("#btn_download_csv_template")?.addEventListener("click", () => {
      const sampleCsv = `QuestionText,Category,Difficulty,Option1,Option2,Option3,Option4,CorrectIndex,Points,Hint,Explanation
ما هي حزمة Node.js؟,programming,medium,بيئة تشغيل JavaScript خارج المتصفح,محرر نصوص,قاعدة بيانات,لغة برمجة جديدة,0,10,بيئة تشغيل V8,تسمح Node.js بتشغيل كود JS على الخادم
ما هما الوسمان الرئيسيان لجدول HTML؟,programming,easy,table و tr,div و span,h1 و p,ul و li,0,5,لتمثيل الجداول,وسم table ينشئ الجدول و tr ينشئ الصفوف`;
      
      const blob = new Blob(["\uFEFF" + sampleCsv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample_questions_import.csv";
      a.click();
    });

    container.querySelector("#csv_file_input")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      fileName = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        fileContent = event.target.result;
        validationResult = parseCSVQuestions(fileContent);
        renderUI();
      };
      reader.readAsText(file, "UTF-8");
    });

    container.querySelector("#btn_confirm_import_questions")?.addEventListener("click", () => {
      if (!validationResult || validationResult.questions.length === 0) return;

      validationResult.questions.forEach((q) => {
        addQuestionToBank(q);
      });

      showCustomAlert(`🎉 تم استيراد ${validationResult.questions.length} سؤال بنجاح وتخزينهم في بنك الأسئلة!`);
      window.location.hash = "#teacher/question-bank";
    });
  }

  renderUI();
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
