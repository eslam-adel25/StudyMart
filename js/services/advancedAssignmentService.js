import { showCustomAlert } from "../utils/helpers.js";

const ASSIGNMENT_SUBMISSIONS_KEY = "lms_assignment_submissions_v1";

/**
 * Get Submissions for a specific Assignment ID
 */
export function getAssignmentSubmissions(assignmentId) {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_SUBMISSIONS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[assignmentId] || generateDefaultAssignmentSubmissions(assignmentId);
  } catch (e) {
    return generateDefaultAssignmentSubmissions(assignmentId);
  }
}

/**
 * Save Submissions for an Assignment
 */
export function saveAssignmentSubmissions(assignmentId, submissions) {
  try {
    const raw = localStorage.getItem(ASSIGNMENT_SUBMISSIONS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[assignmentId] = submissions;
    localStorage.setItem(ASSIGNMENT_SUBMISSIONS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Error saving assignment submissions:", e);
  }
}

/**
 * Generate sample submissions for demonstration and preview
 */
function generateDefaultAssignmentSubmissions(assignmentId) {
  return [
    {
      id: "sub_1",
      studentId: "std_101",
      studentName: "عبدالرحمن الشمري",
      studentEmail: "abdulrahman@example.com",
      studentAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      submittedAt: "2026-08-01 15:45",
      status: "pending", // pending | graded | corrections_requested
      attemptNumber: 1,
      maxAttempts: 3,
      isLate: false,
      files: [
        { name: "main_project_v1.zip", size: "14.2 MB", type: "ZIP", url: "#" },
        { name: "documentation.pdf", size: "2.1 MB", type: "PDF", url: "#" }
      ],
      studentNote: "لقد قمت بإضافة كافة المتطلبات الموضحة في المنهج مع التوثيق المرفق.",
      teacherGrade: null,
      teacherFeedback: "",
      teacherFeedbackFile: null,
      teacherVoiceNoteUrl: "",
      rubricScores: {}
    },
    {
      id: "sub_2",
      studentId: "std_102",
      studentName: "مريم الأحمد",
      studentEmail: "maryam@example.com",
      studentAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      submittedAt: "2026-08-02 11:20",
      status: "graded",
      attemptNumber: 1,
      maxAttempts: 3,
      isLate: false,
      files: [
        { name: "ui_design_figma_export.pdf", size: "8.5 MB", type: "PDF", url: "#" }
      ],
      studentNote: "تم تصميم كافة الشاشات مع مراعاة المعايير التجريبية.",
      teacherGrade: 95,
      teacherFeedback: "عمل ممتاز جداً ورائع في تفاصيل الهيكلة والتصميم!",
      teacherFeedbackFile: null,
      teacherVoiceNoteUrl: "demo_audio_feedback.mp3",
      rubricScores: {
        cr_1: 30, // Code/Design Quality
        cr_2: 30, // Documentation
        cr_3: 35  // Execution
      }
    },
    {
      id: "sub_3",
      studentId: "std_103",
      studentName: "عمر الفاروق",
      studentEmail: "omar@example.com",
      studentAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      submittedAt: "2026-08-02 18:10",
      status: "corrections_requested",
      attemptNumber: 1,
      maxAttempts: 3,
      isLate: true,
      files: [
        { name: "incomplete_solution.docx", size: "900 KB", type: "Word", url: "#" }
      ],
      studentNote: "نعتذر عن التأخير بسبب عطل تقني.",
      teacherGrade: 50,
      teacherFeedback: "الملف المرفق ينقصه الجزء الثاني من المشروع. يرجى تعديل الملف وإعادة التسليم قبل انقضاء المهلة.",
      teacherFeedbackFile: null,
      teacherVoiceNoteUrl: "",
      rubricScores: {
        cr_1: 20,
        cr_2: 15,
        cr_3: 15
      }
    }
  ];
}

/**
 * Calculate total points for a Rubric array
 */
export function calculateRubricTotalPoints(rubricCriteria = []) {
  if (!Array.isArray(rubricCriteria)) return 100;
  if (rubricCriteria.length === 0) return 100;
  return rubricCriteria.reduce((sum, c) => sum + (Number(c.maxPoints) || 0), 0);
}

/**
 * Modal UI: Edit Rubric Modal in Course Builder
 */
export function openEditRubricModal(currentRubric = [], onSaveCallback) {
  let rubricList = JSON.parse(JSON.stringify(currentRubric));

  if (!rubricList || rubricList.length === 0) {
    rubricList = [
      { id: "cr_1", title: "جودة التنفيذ والأكواد", description: "مدى الالتزام بالمعايير ونظافة الكود والتنظيم.", maxPoints: 40, weight: 40, comment: "" },
      { id: "cr_2", title: "التوثيق والشرح المرفق", description: "دقة التوثيق والملاحظات الشارحة.", maxPoints: 30, weight: 30, comment: "" },
      { id: "cr_3", title: "تسليم المتطلبات المطلوبة", description: "اكتمال كافة النقاط المطلوبة في نموذج الواجب.", maxPoints: 30, weight: 30, comment: "" }
    ];
  }

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    const totalPoints = calculateRubricTotalPoints(rubricList);

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 780px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
              📏 إعداد مصفوفة التقييم المعيارية (Rubric Grading System)
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              حدد معايير التقييم، النقاط القصوى، والوزن النسبي لكل معيار لتسهيل عملية التقييم.
            </p>
          </div>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <!-- TOTAL POINTS SUMMARY BADGE -->
        <div style="display: flex; align-items: center; justify-content: space-between; background: #f5f3ff; border: 1px solid #ddd6fe; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px;">
          <span style="font-weight: 700; color: #5b21b6; font-size: 14px;">مجموع درجات مصفوفة التقييم:</span>
          <span style="font-size: 18px; font-weight: 800; color: #6d28d9;">${totalPoints} درجة</span>
        </div>

        <!-- CRITERIA LIST CONTAINER -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; padding-left: 4px;">
          ${rubricList.map((cr, idx) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: 800; color: #0f172a; font-size: 14px;">معيار #${idx + 1}</span>
                <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="deleteRubricCriterion(${idx})">🗑️ حذف المعيار</button>
              </div>

              <div class="form-grid-2" style="margin-bottom: 10px;">
                <div class="form-group-builder">
                  <label style="font-weight: 700;">عنوان المعيار</label>
                  <input type="text" class="form-input-builder" value="${escapeHtml(cr.title)}" oninput="updateRubricField(${idx}, 'title', this.value)" placeholder="عنوان المعيار..." />
                </div>
                
                <div style="display: flex; gap: 8px;">
                  <div class="form-group-builder" style="flex: 1;">
                    <label style="font-weight: 700;">الدرجة القصوى</label>
                    <input type="number" class="form-input-builder" value="${cr.maxPoints}" oninput="updateRubricField(${idx}, 'maxPoints', Number(this.value))" />
                  </div>
                  <div class="form-group-builder" style="flex: 1;">
                    <label style="font-weight: 700;">الوزن النسبي (%)</label>
                    <input type="number" class="form-input-builder" value="${cr.weight || cr.maxPoints}" oninput="updateRubricField(${idx}, 'weight', Number(this.value))" />
                  </div>
                </div>
              </div>

              <div class="form-group-builder">
                <label style="font-weight: 700;">وصف المعيار وإرشادات التقييم</label>
                <input type="text" class="form-input-builder" value="${escapeHtml(cr.description)}" oninput="updateRubricField(${idx}, 'description', this.value)" placeholder="توضيح للمعلم والطالب وحالات منح الدرجة..." />
              </div>
            </div>
          `).join('')}

          <button type="button" class="btn btn-outline-primary" style="width: 100%; text-align: center; padding: 12px; border-style: dashed;" onclick="addNewRubricCriterion()">
            ➕ إضافة معيار تقييم جديد
          </button>
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 16px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="button" class="btn btn-primary" id="btn_save_rubric">حفظ مصفوفة التقييم</button>
        </div>

      </div>
    `;

    overlay.querySelector("#btn_save_rubric").onclick = () => {
      if (typeof onSaveCallback === "function") {
        onSaveCallback(rubricList);
      }
      showCustomAlert("تم حفظ مصفوفة التقييم (Rubric) بنجاح!");
      overlay.remove();
    };
  }

  window.updateRubricField = (idx, field, val) => {
    if (rubricList[idx]) {
      rubricList[idx][field] = val;
      renderModal();
    }
  };

  window.addNewRubricCriterion = () => {
    rubricList.push({
      id: "cr_" + Date.now(),
      title: "معيار تقييم جديد",
      description: "وصف المعيار الإضافي.",
      maxPoints: 20,
      weight: 20,
      comment: ""
    });
    renderModal();
  };

  window.deleteRubricCriterion = (idx) => {
    rubricList.splice(idx, 1);
    renderModal();
  };

  renderModal();
  document.body.appendChild(overlay);
}

/**
 * Modal UI: Teacher Submissions Management & Grading Dashboard for an Assignment
 */
export function openTeacherSubmissionsModal(assignment) {
  let submissions = getAssignmentSubmissions(assignment.id);
  let activeFilter = "all"; // all | pending | graded | corrections_requested
  let activeSubmissionForReview = null;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  function renderModal() {
    const filteredSubs = submissions.filter((s) => {
      if (activeFilter === "pending") return s.status === "pending";
      if (activeFilter === "graded") return s.status === "graded";
      if (activeFilter === "corrections_requested") return s.status === "corrections_requested";
      return true;
    });

    const pendingCount = submissions.filter((s) => s.status === "pending").length;
    const gradedCount = submissions.filter((s) => s.status === "graded").length;
    const correctionsCount = submissions.filter((s) => s.status === "corrections_requested").length;
    const gradedScores = submissions.filter((s) => s.status === "graded" && s.teacherGrade !== null).map((s) => s.teacherGrade);
    const avgGrade = gradedScores.length ? (gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length).toFixed(1) : 0;

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 900px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
              📝 تصحيح واجبات الطلاب: ${escapeHtml(assignment.title)}
            </h3>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">
              مراجعة حلول الطلاب، التقييم بمصفوفة Rubric، وكتابة/تسجيل التغذية الراجعة.
            </p>
          </div>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <!-- STATS & FILTER TABS BAR -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 14px;">
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="setSubmissionFilter('all')">
              الكل (${submissions.length})
            </button>
            <button type="button" class="btn btn-sm ${activeFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}" onclick="setSubmissionFilter('pending')">
              ⏳ قيد المراجعة (${pendingCount})
            </button>
            <button type="button" class="btn btn-sm ${activeFilter === 'graded' ? 'btn-primary' : 'btn-secondary'}" onclick="setSubmissionFilter('graded')">
              ✅ مكتمل التقييم (${gradedCount})
            </button>
            <button type="button" class="btn btn-sm ${activeFilter === 'corrections_requested' ? 'btn-primary' : 'btn-secondary'}" onclick="setSubmissionFilter('corrections_requested')">
              🔄 مجهّز لتطلب التعديل (${correctionsCount})
            </button>
          </div>

          <div style="font-size: 13px; font-weight: 700; color: #334155;">
            متوسط الدرجات: <strong style="color: #6d28d9; font-size: 15px;">${avgGrade} / 100</strong>
          </div>
        </div>

        <!-- SUBMISSIONS LIST -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-left: 4px;">
          ${filteredSubs.length === 0 ? `
            <div style="text-align: center; color: #94a3b8; padding: 40px;">
              لا توجد تسليمات في هذا الفلتر حالياً.
            </div>
          ` : filteredSubs.map((sub) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
              
              <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px;">
                <img src="${sub.studentAvatar}" alt="${escapeHtml(sub.studentName)}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
                <div>
                  <h5 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">${escapeHtml(sub.studentName)}</h5>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                    تاريخ التسليم: ${sub.submittedAt} ${sub.isLate ? '<span style="color:#dc2626; font-weight:700;">(متأخر)</span>' : ''} | المحاولة: ${sub.attemptNumber} من ${sub.maxAttempts || 3}
                  </div>
                </div>
              </div>

              <!-- STATUS BADGE -->
              <div>
                ${sub.status === 'graded' ? `
                  <span class="status-badge published" style="font-size: 13px; font-weight: 800;">الدرجة: ${sub.teacherGrade} / 100</span>
                ` : sub.status === 'corrections_requested' ? `
                  <span class="status-badge" style="background: #fef3c7; color: #b45309;">طلب تعديل الحل</span>
                ` : `
                  <span class="status-badge draft">بانتظار المراجعة</span>
                `}
              </div>

              <!-- ACTION BUTTON -->
              <button type="button" class="btn btn-primary" onclick="openReviewModalForSubmission('${sub.id}')">
                🔍 مراجعة وتصحيح
              </button>

            </div>
          `).join('')}
        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق</button>
        </div>

      </div>
    `;

    window.setSubmissionFilter = (filter) => {
      activeFilter = filter;
      renderModal();
    };

    window.openReviewModalForSubmission = (subId) => {
      const targetSub = submissions.find((s) => s.id === subId);
      if (targetSub) {
        openSingleSubmissionReviewModal(assignment, targetSub, (updatedSub) => {
          const idx = submissions.findIndex((s) => s.id === subId);
          if (idx !== -1) submissions[idx] = updatedSub;
          saveAssignmentSubmissions(assignment.id, submissions);
          renderModal();
        });
      }
    };
  }

  renderModal();
  document.body.appendChild(overlay);
}

/**
 * Modal UI: Single Submission Detailed Grading & Feedback Drawer Modal
 */
function openSingleSubmissionReviewModal(assignment, submission, onSaveSubCallback) {
  let subData = JSON.parse(JSON.stringify(submission));
  let rubricList = assignment.rubric || [
    { id: "cr_1", title: "جودة التنفيذ والأكواد", maxPoints: 40 },
    { id: "cr_2", title: "التوثيق والشرح", maxPoints: 30 },
    { id: "cr_3", title: "استكمال المتطلبات", maxPoints: 30 }
  ];

  let isRecordingVoice = false;
  let voiceTimerSeconds = 0;
  let voiceInterval = null;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";
  overlay.style.zIndex = "10001";

  function renderModal() {
    const totalPossiblePoints = calculateRubricTotalPoints(rubricList);

    // Auto compute score based on rubric
    let computedGrade = 0;
    rubricList.forEach((c) => {
      computedGrade += Number(subData.rubricScores?.[c.id] || 0);
    });
    subData.teacherGrade = computedGrade;

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 860px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 17px; font-weight: 800;">
              🔍 مراجعة تسليم الطالب: ${escapeHtml(subData.studentName)}
            </h3>
            <span style="font-size: 12px; color: #64748b;">تاريخ التسليم: ${subData.submittedAt}</span>
          </div>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-left: 4px;">
          
          <!-- SUBMITTED FILES & PREVIEWER -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc;">
            <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 800; color: #0f172a;">
              📂 الملفات المرفوعة من الطالب:
            </h4>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(subData.files || []).map((file, fIdx) => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">📄</span>
                    <div>
                      <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(file.name)}</strong>
                      <div style="font-size: 11px; color: #64748b;">الحجم: ${file.size}</div>
                    </div>
                  </div>

                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="previewFileSimulated('${escapeHtml(file.name)}')">👁️ معاينة وتدقيق</button>
                    <a href="#" download="${file.name}" class="btn btn-sm btn-secondary" style="text-decoration: none;">⬇️ تحميل</a>
                  </div>
                </div>
              `).join('')}
            </div>

            ${subData.studentNote ? `
              <div style="margin-top: 10px; padding: 8px 12px; background: #ffffff; border-radius: 8px; border-right: 3px solid #6d28d9; font-size: 12px; color: #334155;">
                <strong>ملاحظة الطالب:</strong> "${escapeHtml(subData.studentNote)}"
              </div>
            ` : ''}
          </div>

          <!-- RUBRIC EVALUATION FORM -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">
                📏 التقييم بمصفوفة المعايير (Rubric Scoring):
              </h4>
              <div style="font-size: 16px; font-weight: 800; color: #6d28d9;">
                الدرجة الإجمالية المحسوبة: ${computedGrade} / ${totalPossiblePoints}
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${rubricList.map((cr) => {
                const currentScore = subData.rubricScores?.[cr.id] !== undefined ? subData.rubricScores[cr.id] : cr.maxPoints;
                return `
                  <div style="background: #f8fafc; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                      <span style="font-weight: 700; font-size: 13px; color: #0f172a;">${escapeHtml(cr.title)}</span>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="number" class="form-input-builder" style="width: 70px; padding: 4px 8px;" min="0" max="${cr.maxPoints}" value="${currentScore}" oninput="updateRubricScoreData('${cr.id}', Number(this.value))" />
                        <span style="font-size: 12px; color: #64748b;">/ ${cr.maxPoints} درجة</span>
                      </div>
                    </div>
                    ${cr.description ? `<p style="margin: 0; font-size: 11px; color: #64748b;">${escapeHtml(cr.description)}</p>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- TEACHER FEEDBACK & VOICE NOTE -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff;">
            <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 800; color: #0f172a;">
              💬 التغذية الراجعة والملاحظات (Feedback & Voice Note):
            </h4>

            <div class="form-group-builder" style="margin-bottom: 12px;">
              <label style="font-weight: 700;">الملاحظات النصية للمعلم</label>
              <textarea id="sub_feedback_text" class="form-textarea-builder" rows="3" placeholder="اكتب تغذيتك الراجعة المباشرة للطالب...">${escapeHtml(subData.teacherFeedback || '')}</textarea>
            </div>

            <!-- VOICE FEEDBACK SIMULATION -->
            <div style="background: #f1f5f9; padding: 12px; border-radius: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 22px;">🎙️</span>
                <div>
                  <strong style="font-size: 13px; color: #0f172a;">التسجيل الصوتي للتغذية الراجعة (Voice Feedback)</strong>
                  <div style="font-size: 11px; color: #64748b;">سجل ملاحظاتك المباشرة بصوتك ليسمعها الطالب.</div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 10px;">
                ${subData.teacherVoiceNoteUrl ? `
                  <span class="status-badge published">✓ يوجد تسجيل صوتي مرفق</span>
                  <button type="button" class="btn btn-sm btn-danger" style="background: #ef4444; color: #fff; border: none;" onclick="removeVoiceNote()">حذف الصوت</button>
                ` : `
                  <button type="button" class="btn btn-sm ${isRecordingVoice ? 'btn-danger' : 'btn-primary'}" id="btn_record_voice">
                    ${isRecordingVoice ? `🔴 جاري التسجيل (${voiceTimerSeconds}ث) - اضغط للإيقاف` : '🎙️ بدء تسجيل ملاحظة صوتية'}
                  </button>
                `}
              </div>
            </div>
          </div>

        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;" id="btn_request_corrections">
              🔄 طلب تعديل وإعادة التسليم
            </button>
            
            <button type="button" class="btn btn-primary" id="btn_pass_grade">
              ✅ اعتماد الدرجة ونشر النتيجة
            </button>
          </div>
        </div>

      </div>
    `;

    // Handlers
    window.updateRubricScoreData = (crId, score) => {
      if (!subData.rubricScores) subData.rubricScores = {};
      subData.rubricScores[crId] = score;
      renderModal();
    };

    window.previewFileSimulated = (fileName) => {
      showCustomAlert(`👁️ جاري فتح معاينة المدقق المباشر للملف: ${fileName}`);
    };

    window.removeVoiceNote = () => {
      subData.teacherVoiceNoteUrl = "";
      renderModal();
    };

    const recordBtn = overlay.querySelector("#btn_record_voice");
    if (recordBtn) {
      recordBtn.onclick = () => {
        if (!isRecordingVoice) {
          isRecordingVoice = true;
          voiceTimerSeconds = 0;
          voiceInterval = setInterval(() => {
            voiceTimerSeconds++;
            renderModal();
          }, 1000);
        } else {
          isRecordingVoice = false;
          clearInterval(voiceInterval);
          subData.teacherVoiceNoteUrl = "teacher_voice_feedback_demo.mp3";
          showCustomAlert("🎙️ تم حفظ التسجيل الصوتي بنجاح!");
          renderModal();
        }
      };
    }

    const reqCorrBtn = overlay.querySelector("#btn_request_corrections");
    if (reqCorrBtn) {
      reqCorrBtn.onclick = () => {
        subData.teacherFeedback = overlay.querySelector("#sub_feedback_text")?.value || "";
        subData.status = "corrections_requested";
        if (typeof onSaveSubCallback === "function") onSaveSubCallback(subData);
        showCustomAlert("🔄 تم إرسال طلب التعديل وإعادة التسليم للطالب بنجاح!");
        overlay.remove();
      };
    }

    const passBtn = overlay.querySelector("#btn_pass_grade");
    if (passBtn) {
      passBtn.onclick = () => {
        subData.teacherFeedback = overlay.querySelector("#sub_feedback_text")?.value || "";
        subData.status = "graded";
        if (typeof onSaveSubCallback === "function") onSaveSubCallback(subData);
        showCustomAlert("🎉 تم اعتماد الدرجة بنجاح وإشعار الطالب!");
        overlay.remove();
      };
    }
  }

  renderModal();
  document.body.appendChild(overlay);
}

/**
 * Modal UI: Assignment Statistics Panel
 */
export function openAssignmentStatsModal(assignment) {
  const submissions = getAssignmentSubmissions(assignment.id);

  const total = submissions.length;
  const graded = submissions.filter((s) => s.status === "graded").length;
  const pending = submissions.filter((s) => s.status === "pending").length;
  const corrections = submissions.filter((s) => s.status === "corrections_requested").length;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";

  overlay.innerHTML = `
    <div class="floating-modal-box" style="max-width: 760px; width: 95%; max-height: 90vh; display: flex; flex-direction: column;">
      
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 16px;">
        <h3 style="margin: 0; color: var(--primary-color, #6d28d9); font-size: 18px; font-weight: 800;">
          📊 إحصائيات وتسليمات الواجب: ${escapeHtml(assignment.title)}
        </h3>
        <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
      </div>

      <div style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); display: grid; gap: 12px; margin-bottom: 16px;">
        <div style="padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
          <span style="font-size: 12px; color: #64748b; font-weight: 700;">إجمالي التسليمات</span>
          <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px;">${total}</div>
        </div>

        <div style="padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center;">
          <span style="font-size: 12px; color: #166534; font-weight: 700;">مكتمل التقييم</span>
          <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 4px;">${graded}</div>
        </div>

        <div style="padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; text-align: center;">
          <span style="font-size: 12px; color: #92400e; font-weight: 700;">بانتظار المراجعة</span>
          <div style="font-size: 22px; font-weight: 800; color: #b45309; margin-top: 4px;">${pending}</div>
        </div>

        <div style="padding: 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; text-align: center;">
          <span style="font-size: 12px; color: #991b1b; font-weight: 700;">مطلوب تعديلها</span>
          <div style="font-size: 22px; font-weight: 800; color: #dc2626; margin-top: 4px;">${corrections}</div>
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
