import { showCustomAlert } from "../utils/helpers.js";
import {
  getQuestionBank,
  addQuestionToBank,
  searchBankQuestions,
  parseAndValidateImportQuestions
} from "./questionBankService.js";

const QUIZ_PROGRESS_PREFIX = "lms_quiz_progress_";
const QUIZ_STATS_KEY = "lms_quiz_stats_records_v1";

/**
 * Calculate total points for a quiz object
 * @param {Object} quiz 
 */
export function calculateQuizTotalScore(quiz) {
  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) return 0;
  return quiz.questions.reduce((sum, q) => {
    const pts = Number(q.points) || 0;
    const bonus = Number(q.bonusPoints) || 0;
    return sum + pts + bonus;
  }, 0);
}

/**
 * Get Quiz Statistics records for a course/quiz
 */
export function getQuizStats(quizId) {
  try {
    const raw = localStorage.getItem(QUIZ_STATS_KEY);
    const allStats = raw ? JSON.parse(raw) : {};
    return allStats[quizId] || generateDefaultQuizStats(quizId);
  } catch (e) {
    return generateDefaultQuizStats(quizId);
  }
}

/**
 * Generate default or simulated stats for a quiz
 */
function generateDefaultQuizStats(quizId) {
  return {
    quizId,
    totalSubmissions: 28,
    completionRate: 92, // %
    avgScore: 84.5,
    highestScore: 100,
    lowestScore: 55,
    avgCompletionTimeMinutes: 11.4,
    mostMissedQuestions: [
      { questionId: "q1", questionText: "ما هي الخاصية المسؤولة عن محاذاة العناصر...", wrongCount: 9, totalAttempts: 28, difficultyIndex: 0.67 },
      { questionId: "q2", questionText: "ما هو الناتج من typeof null ؟", wrongCount: 12, totalAttempts: 28, difficultyIndex: 0.57 }
    ],
    attemptsHistory: [
      { studentName: "أحمد علي", score: 95, totalPossible: 100, timeSpentMins: 9, submittedAt: "2026-08-01 14:30" },
      { studentName: "فاطمة الزهراء", score: 80, totalPossible: 100, timeSpentMins: 13, submittedAt: "2026-08-01 16:15" },
      { studentName: "محمد خالد", score: 100, totalPossible: 100, timeSpentMins: 10, submittedAt: "2026-08-02 10:00" },
      { studentName: "سارة محمود", score: 65, totalPossible: 100, timeSpentMins: 14, submittedAt: "2026-08-02 11:45" }
    ]
  };
}

/**
 * Save new student quiz attempt result into stats
 */
export function recordQuizAttempt(quizId, attemptData) {
  try {
    const raw = localStorage.getItem(QUIZ_STATS_KEY);
    const allStats = raw ? JSON.parse(raw) : {};

    if (!allStats[quizId]) {
      allStats[quizId] = generateDefaultQuizStats(quizId);
    }

    const stat = allStats[quizId];
    stat.totalSubmissions = (stat.totalSubmissions || 0) + 1;
    stat.attemptsHistory.unshift(attemptData);

    // Recalculate avg, high, low
    const scores = stat.attemptsHistory.map((a) => (a.score / (a.totalPossible || 100)) * 100);
    stat.avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    stat.highestScore = Math.round(Math.max(...scores));
    stat.lowestScore = Math.round(Math.min(...scores));

    allStats[quizId] = stat;
    localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(allStats));
  } catch (e) {
    console.error("Error recording quiz attempt:", e);
  }
}

/**
 * Student Quiz Auto-Save helpers
 */
export function getSavedQuizProgress(quizId, userId = "default_user") {
  try {
    const raw = localStorage.getItem(`${QUIZ_PROGRESS_PREFIX}${quizId}_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveQuizProgress(quizId, progressObj, userId = "default_user") {
  try {
    localStorage.setItem(
      `${QUIZ_PROGRESS_PREFIX}${quizId}_${userId}`,
      JSON.stringify({
        ...progressObj,
        lastSavedAt: new Date().toISOString()
      })
    );
  } catch (e) {
    console.error("Error auto-saving quiz progress:", e);
  }
}

export function clearQuizProgress(quizId, userId = "default_user") {
  try {
    localStorage.removeItem(`${QUIZ_PROGRESS_PREFIX}${quizId}_${userId}`);
  } catch (e) {}
}

/**
 * Modal UI: Open Question Bank Selector Modal to pick questions into a quiz
 */
export function openQuestionBankSelectorModal(onSelectCallback) {
  let selectedCategory = "";
  let selectedDifficulty = "";
  let searchQuery = "";
  let selectedIds = new Set();

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    const questions = searchBankQuestions({
      query: searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty
    });

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 820px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
              🏛️ استيراد أسئلة من بنك الأسئلة المركزي (Question Bank)
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              اختر الأسئلة الجاهزة لإضافتها مباشرة إلى الاختبار الحالي مع كافة الإعدادات والتلميحات.
            </p>
          </div>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <!-- SEARCH & FILTER CONTROLS -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <input type="text" id="qb_search_input" class="form-input-builder" style="flex: 1; min-width: 200px;" value="${escapeHtml(searchQuery)}" placeholder="بحث في بنك الأسئلة..." />
          
          <select id="qb_category_select" class="form-select-builder" style="width: 160px;">
            <option value="">جميع التخصصات</option>
            <option value="programming" ${selectedCategory === 'programming' ? 'selected' : ''}>البرمجة والتطوير</option>
            <option value="design" ${selectedCategory === 'design' ? 'selected' : ''}>التصميم والتجربة</option>
            <option value="business" ${selectedCategory === 'business' ? 'selected' : ''}>إدارة الأعمال</option>
            <option value="math" ${selectedCategory === 'math' ? 'selected' : ''}>العلوم والرياضيات</option>
          </select>

          <select id="qb_diff_select" class="form-select-builder" style="width: 140px;">
            <option value="">جميع المستويات</option>
            <option value="easy" ${selectedDifficulty === 'easy' ? 'selected' : ''}>سهل</option>
            <option value="medium" ${selectedDifficulty === 'medium' ? 'selected' : ''}>متوسط</option>
            <option value="hard" ${selectedDifficulty === 'hard' ? 'selected' : ''}>صعب</option>
          </select>
        </div>

        <!-- QUESTION LIST -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-left: 4px;">
          ${questions.length === 0 ? `
            <div style="text-align: center; color: #94a3b8; padding: 40px;">
              لا توجد أسئلة تطابق فلتر البحث الحالية في بنك الأسئلة.
            </div>
          ` : questions.map((q) => {
            const isChecked = selectedIds.has(q.id);
            return `
              <div style="border: 1px solid ${isChecked ? '#6d28d9' : '#e2e8f0'}; background: ${isChecked ? '#f5f3ff' : '#ffffff'}; padding: 14px; border-radius: 12px; transition: all 0.2s; cursor: pointer;" onclick="toggleQbSelection('${q.id}')">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <input type="checkbox" style="margin-top: 4px; width: 18px; height: 18px; cursor: pointer;" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleQbSelection('${q.id}')" />
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                      <span style="font-weight: 700; color: #0f172a; font-size: 15px;">${escapeHtml(q.question)}</span>
                      <span class="status-badge" style="background: #e0f2fe; color: #0369a1;">${q.points} نقاط ${q.bonusPoints ? `(+${q.bonusPoints} إضافية)` : ''}</span>
                    </div>

                    <div style="display: flex; gap: 8px; font-size: 12px; color: #64748b; margin-top: 6px; flex-wrap: wrap;">
                      <span>التخصص: <strong>${q.category}</strong></span> |
                      <span>الصعوبة: <strong style="color: ${q.difficulty === 'hard' ? '#dc2626' : q.difficulty === 'medium' ? '#d97706' : '#16a34a'};">${q.difficulty}</strong></span> |
                      <span>النوع: ${q.type === 'mc' ? 'اختيار متعدد' : 'صح/خطأ'}</span> |
                      <span>مرات الاستخدام: ${q.usedCount || 0}</span>
                    </div>

                    ${q.hint ? `
                      <div style="font-size: 12px; color: #b45309; background: #fffbeb; padding: 4px 8px; border-radius: 6px; margin-top: 6px; display: inline-block;">
                        💡 تلميح: ${escapeHtml(q.hint)} (${q.hintType === 'penalty' ? `خصم ${q.hintPenaltyPercent}%` : 'مجاني'})
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 16px;">
          <span style="font-size: 14px; font-weight: 700; color: #334155;">
            تم تحديد: <span style="color: var(--primary-color, #6d28d9); font-size: 16px;">${selectedIds.size}</span> سؤال
          </span>

          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
            <button type="button" class="btn btn-primary" id="qb_confirm_btn" ${selectedIds.size === 0 ? 'disabled style="opacity:0.5;"' : ''}>
              📥 استيراد الأسئلة المحددة (${selectedIds.size})
            </button>
          </div>
        </div>

      </div>
    `;

    // Re-attach handlers
    const searchInput = overlay.querySelector("#qb_search_input");
    const catSelect = overlay.querySelector("#qb_category_select");
    const diffSelect = overlay.querySelector("#qb_diff_select");

    if (searchInput) {
      searchInput.oninput = (e) => {
        searchQuery = e.target.value;
        renderModal();
      };
    }
    if (catSelect) {
      catSelect.onchange = (e) => {
        selectedCategory = e.target.value;
        renderModal();
      };
    }
    if (diffSelect) {
      diffSelect.onchange = (e) => {
        selectedDifficulty = e.target.value;
        renderModal();
      };
    }

    const confirmBtn = overlay.querySelector("#qb_confirm_btn");
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const bank = getQuestionBank();
        const chosen = bank.filter((q) => selectedIds.has(q.id));
        if (chosen.length > 0 && typeof onSelectCallback === "function") {
          onSelectCallback(chosen);
        }
        overlay.remove();
      };
    }
  }

  window.toggleQbSelection = (id) => {
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    renderModal();
  };

  renderModal();
  document.body.appendChild(overlay);
}

/**
 * Modal UI: File Importer Modal (Excel / CSV) with validation, errors, warnings & preview table
 */
export function openImportQuestionsFileModal(onImportSuccessCallback) {
  let selectedFile = null;
  let rawFileContent = "";
  let fileType = "csv";
  let importResult = null;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 760px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px;">
          <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
            📊 استيراد أسئلة من ملف Excel / CSV
          </h3>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
          <!-- FILE SELECTION -->
          <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; background: #f8fafc;">
            <input type="file" id="file_import_input" style="display: none;" accept=".csv,.json,.xlsx" />
            
            ${selectedFile ? `
              <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <span style="font-size: 36px;">📄</span>
                <strong style="color: #0f172a;">${escapeHtml(selectedFile.name)}</strong>
                <span style="font-size: 12px; color: #64748b;">الحجم: ${(selectedFile.size / 1024).toFixed(1)} KB</span>
                <button type="button" class="btn btn-sm btn-secondary" id="btn_change_import_file">استبدال الملف</button>
              </div>
            ` : `
              <span style="font-size: 40px; color: #6d28d9;">📂</span>
              <p style="margin: 8px 0 4px 0; font-size: 14px; font-weight: 700; color: #334155;">اضغط لاختيار ملف CSV أو JSON/Excel</p>
              <p style="margin: 0 0 14px 0; font-size: 12px; color: #64748b;">يجب أن يحتوي الملف على الأعمدة: السؤال، التخصص، الصعوبة، الخيارات، دليل الإجابة، النقاط، التلميح، الشرح.</p>
              <button type="button" class="btn btn-primary" id="btn_browse_import_file">اختيار ملف من الجهاز</button>
            `}
          </div>

          <!-- DEMO SAMPLE DOWNLOAD BUTTON -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 10px 14px; border-radius: 10px;">
            <span style="font-size: 13px; color: #475569;">💡 يمكنك تحميل نموذج تجريبي جاهز لتجربة الاستيراد:</span>
            <button type="button" class="btn btn-sm btn-outline-primary" id="btn_download_demo_csv">⬇️ تنزيل ملف تجريبي CSV</button>
          </div>

          <!-- VALIDATION SUMMARY & PREVIEW -->
          ${importResult ? `
            <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; background: #ffffff;">
              <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #0f172a;">
                📋 نتائج فحص وتحليل الملف (File Validation Summary)
              </h4>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px;">
                <div style="padding: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 13px; font-weight: 700; color: #166534;">
                  إجمالي الأسئلة المستخرجة: <strong>${importResult.totalFound}</strong>
                </div>
                <div style="padding: 10px; background: ${importResult.errors.length > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${importResult.errors.length > 0 ? '#fecaca' : '#bbf7d0'}; border-radius: 10px; font-size: 13px; font-weight: 700; color: ${importResult.errors.length > 0 ? '#991b1b' : '#166534'};">
                  الأخطاء: <strong>${importResult.errors.length}</strong>
                </div>
                <div style="padding: 10px; background: ${importResult.warnings.length > 0 ? '#fffbeb' : '#f0fdf4'}; border: 1px solid ${importResult.warnings.length > 0 ? '#fde68a' : '#bbf7d0'}; border-radius: 10px; font-size: 13px; font-weight: 700; color: ${importResult.warnings.length > 0 ? '#92400e' : '#166534'};">
                  التحذيرات: <strong>${importResult.warnings.length}</strong>
                </div>
              </div>

              ${importResult.errors.length > 0 ? `
                <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 12px; color: #991b1b;">
                  <strong>⚠️ أخطاء يرجى تصحيحها:</strong>
                  <ul style="margin: 4px 0 0 0; padding-right: 18px;">
                    ${importResult.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${importResult.warnings.length > 0 ? `
                <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 12px; color: #92400e;">
                  <strong>ℹ️ تحذيرات تم التعامل معها:</strong>
                  <ul style="margin: 4px 0 0 0; padding-right: 18px;">
                    ${importResult.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              <!-- PREVIEW TABLE -->
              <h5 style="margin: 10px 0 6px 0; font-size: 14px; font-weight: 700;">👁️ معاينة الأسئلة الصالحة للاستيراد:</h5>
              <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: right;">
                  <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <tr>
                      <th style="padding: 8px;">#</th>
                      <th style="padding: 8px;">السؤال</th>
                      <th style="padding: 8px;">الخيارات</th>
                      <th style="padding: 8px;">الإجابة</th>
                      <th style="padding: 8px;">النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${importResult.questions.map((q, i) => `
                      <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 8px;">${i + 1}</td>
                        <td style="padding: 8px; font-weight: 700;">${escapeHtml(q.question)}</td>
                        <td style="padding: 8px;">${q.options.join(" | ")}</td>
                        <td style="padding: 8px; color: #16a34a; font-weight: 700;">${escapeHtml(q.options[q.correctAnswer] || '')}</td>
                        <td style="padding: 8px;">${q.points}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 16px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="button" class="btn btn-primary" id="btn_confirm_import" ${!importResult || importResult.questions.length === 0 ? 'disabled style="opacity:0.5;"' : ''}>
            🚀 استيراد (${importResult?.questions.length || 0}) سؤال إلى الاختبار
          </button>
        </div>
      </div>
    `;

    // Handlers
    const fileInput = overlay.querySelector("#file_import_input");
    const browseBtn = overlay.querySelector("#btn_browse_import_file");
    const changeBtn = overlay.querySelector("#btn_change_import_file");
    const demoBtn = overlay.querySelector("#btn_download_demo_csv");
    const confirmBtn = overlay.querySelector("#btn_confirm_import");

    if (browseBtn) browseBtn.onclick = () => fileInput.click();
    if (changeBtn) changeBtn.onclick = () => fileInput.click();

    if (demoBtn) {
      demoBtn.onclick = () => {
        const demoCSV = `Question,Category,Difficulty,Option1,Option2,Option3,Option4,CorrectIndex,Points,Hint,Explanation
"ما هي لغة البرمجة الأكثر استخداماً لتطوير واجهات المستخدم؟",programming,easy,"JavaScript","Python","C++","SQL",0,10,"فكر في التفاعل داخل المتصفح","JavaScript هي لغة الويب القياسية للمتصفحات."
"خاصية display: flex تستخدم لتفعيل الشبكة ثنائية الأبعاد.",design,medium,"صح","خطأ",,,1,5,"الشبكة ثنائية الأبعاد تعني CSS Grid","خطأ، flexbox مخصص للمحور الأحادي."`;

        const blob = new Blob([demoCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "demo_questions_import.csv";
        a.click();
      };
    }

    if (fileInput) {
      fileInput.onchange = () => {
        const file = fileInput.files[0];
        if (!file) return;
        selectedFile = file;
        fileType = file.name.endsWith(".json") ? "json" : "csv";

        const reader = new FileReader();
        reader.onload = (e) => {
          rawFileContent = e.target.result;
          importResult = parseAndValidateImportQuestions(rawFileContent, fileType);
          renderModal();
        };
        reader.readAsText(file);
      };
    }

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        if (importResult && importResult.questions.length > 0) {
          // Add imported questions to Central Question Bank as well!
          importResult.questions.forEach((q) => addQuestionToBank(q));

          if (typeof onImportSuccessCallback === "function") {
            onImportSuccessCallback(importResult.questions);
          }
          showCustomAlert(`🎉 تم استيراد ${importResult.questions.length} سؤال بنجاح وإضافتها إلى بنك الأسئلة والاختبار!`);
          overlay.remove();
        }
      };
    }
  }

  renderModal();
  document.body.appendChild(overlay);
}

/**
 * Modal UI: Quiz Enterprise Statistics Dashboard for Teachers
 */
export function openQuizStatsModal(quiz) {
  const stats = getQuizStats(quiz.id);

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 820px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
      
      <!-- HEADER -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px;">
        <div>
          <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
            📊 تحليلات وإحصائيات الاختبار: ${escapeHtml(quiz.title)}
          </h3>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
            مؤشرات أداء الطلاب، متوسط الدرجات، والأسئلة الأكثر صعوبة.
          </p>
        </div>
        <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>

      <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
        <!-- STATS OVERVIEW CARDS GRID -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
          <div style="padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
            <span style="font-size: 12px; color: #64748b; font-weight: 700;">عدد محاولات الاختبار</span>
            <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px;">${stats.totalSubmissions}</div>
          </div>
          <div style="padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center;">
            <span style="font-size: 12px; color: #166534; font-weight: 700;">متوسط الدرجات</span>
            <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 4px;">${stats.avgScore}%</div>
          </div>
          <div style="padding: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; text-align: center;">
            <span style="font-size: 12px; color: #1e40af; font-weight: 700;">أعلى / أدنى درجة</span>
            <div style="font-size: 20px; font-weight: 800; color: #1d4ed8; margin-top: 4px;">${stats.highestScore}% / ${stats.lowestScore}%</div>
          </div>
          <div style="padding: 14px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; text-align: center;">
            <span style="font-size: 12px; color: #6b21a8; font-weight: 700;">نسبة الإكمال</span>
            <div style="font-size: 22px; font-weight: 800; color: #7e22ce; margin-top: 4px;">${stats.completionRate}%</div>
          </div>
          <div style="padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; text-align: center;">
            <span style="font-size: 12px; color: #92400e; font-weight: 700;">متوسط الوقت المستغرق</span>
            <div style="font-size: 22px; font-weight: 800; color: #b45309; margin-top: 4px;">${stats.avgCompletionTimeMinutes} دقيقة</div>
          </div>
        </div>

        <!-- MOST MISSED QUESTIONS (ITEM ANALYSIS) -->
        <div>
          <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
            🔥 تحليل الأسئلة الأكثر صعوبة وتكراراً للأخطاء (Most Missed Questions):
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${(stats.mostMissedQuestions || []).map((m) => `
              <div style="padding: 12px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                <div>
                  <div style="font-weight: 700; color: #991b1b; font-size: 14px;">${escapeHtml(m.questionText)}</div>
                  <div style="font-size: 12px; color: #7f1d1d; margin-top: 2px;">
                    أخطأ فيه <strong>${m.wrongCount}</strong> طلاب من أصل ${m.totalAttempts} محاولة.
                  </div>
                </div>
                <div style="padding: 6px 12px; background: #fee2e2; border-radius: 8px; font-weight: 800; color: #991b1b; font-size: 13px;">
                  مؤشر الصعوبة: ${(m.difficultyIndex * 100).toFixed(0)}%
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- RECENT ATTEMPTS TABLE -->
        <div>
          <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #0f172a;">
            📜 سجل أحدث محاولات الطلاب:
          </h4>
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: right;">
              <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <tr>
                  <th style="padding: 10px;">اسم الطالب</th>
                  <th style="padding: 10px;">النتيجة النهائي</th>
                  <th style="padding: 10px;">الوقت المستغرق</th>
                  <th style="padding: 10px;">تاريخ التقديم</th>
                  <th style="padding: 10px;">الحالة</th>
                </tr>
              </thead>
              <tbody>
                ${(stats.attemptsHistory || []).map((att) => {
                  const pass = att.score >= (quiz.passingGrade || 70);
                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px; font-weight: 700;">${escapeHtml(att.studentName)}</td>
                      <td style="padding: 10px; font-weight: 800; color: ${pass ? '#16a34a' : '#dc2626'};">
                        ${att.score} / ${att.totalPossible || 100}
                      </td>
                      <td style="padding: 10px;">${att.timeSpentMins} دقيقة</td>
                      <td style="padding: 10px; color: #64748b;">${escapeHtml(att.submittedAt)}</td>
                      <td style="padding: 10px;">
                        <span class="status-badge ${pass ? 'published' : 'draft'}">
                          ${pass ? 'اجتاز الاختبار' : 'لم يجتز'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 16px;">
        <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
      </div>

    </div>
  `;

  document.body.appendChild(overlay);
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
