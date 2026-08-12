import { showCustomAlert } from "../utils/helpers.js";
import {
  getSavedQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
  recordQuizAttempt,
  calculateQuizTotalScore
} from "./advancedQuizService.js";
import {
  getAssignmentSubmissions,
  saveAssignmentSubmissions,
  calculateRubricTotalPoints
} from "./advancedAssignmentService.js";

/**
 * Open Interactive Student Quiz Taking Modal
 */
export function openStudentQuizModal(quiz, courseTitle = "الدورة") {
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    showCustomAlert("هذا الاختبار لا يحتوي على أي أسئلة بعد.");
    return;
  }

  const userId = window.appState?.user?.id || "guest_student";
  const userName = window.appState?.user?.name || "طالب تجريبي";

  // Check saved progress
  let saved = getSavedQuizProgress(quiz.id, userId);

  let currentQuestionIndex = saved ? saved.currentQuestionIndex || 0 : 0;
  let userAnswers = saved ? saved.userAnswers || {} : {};
  let revealedHints = saved ? saved.revealedHints || {} : {};
  let timeRemainingSeconds = saved ? saved.timeRemainingSeconds : (quiz.timeLimit || 15) * 60;
  let isSubmitted = false;
  let submissionResult = null;

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";
  overlay.style.zIndex = "10005";

  // Setup periodic auto-save timer
  const autoSaveInterval = setInterval(() => {
    if (!isSubmitted) {
      timeRemainingSeconds = Math.max(0, timeRemainingSeconds - 1);
      saveQuizProgress(quiz.id, {
        currentQuestionIndex,
        userAnswers,
        revealedHints,
        timeRemainingSeconds
      }, userId);

      // Render countdown timer update
      const timerEl = overlay.querySelector("#quiz_timer_display");
      if (timerEl) {
        const mins = Math.floor(timeRemainingSeconds / 60);
        const secs = timeRemainingSeconds % 60;
        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (timeRemainingSeconds < 120) {
          timerEl.style.color = "#dc2626";
        }
      }

      if (timeRemainingSeconds <= 0 && !isSubmitted) {
        clearInterval(autoSaveInterval);
        submitQuizAttempt(true); // Auto-submit when time expires!
      }
    }
  }, 1000);

  function renderQuizUI() {
    if (isSubmitted && submissionResult) {
      renderResultsUI();
      return;
    }

    const navRules = quiz.navigationRules || { allowBack: true, allowSkip: true, requireAnswer: false, lockAnswered: false };
    const questions = quiz.questions;
    const q = questions[currentQuestionIndex];

    const isAnswered = userAnswers[q.id] !== undefined;
    const isHintRevealed = revealedHints[q.id] === true;

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 840px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER WITH TIMER & COURSE TITLE -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <span style="font-size: 11px; color: #6d28d9; font-weight: 700; background: #f5f3ff; padding: 2px 8px; border-radius: 6px;">${escapeHtml(courseTitle)}</span>
            <h3 style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 800;">
              ❓ ${escapeHtml(quiz.title)}
            </h3>
          </div>

          <!-- COUNTDOWN TIMER BADGE -->
          <div style="display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 10px;">
            <span style="font-size: 18px;">⏱️</span>
            <span id="quiz_timer_display" style="font-size: 18px; font-weight: 800; font-family: monospace; color: #0f172a;">
              ${Math.floor(timeRemainingSeconds / 60).toString().padStart(2, '0')}:${(timeRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <!-- QUESTION NAVIGATION DOTS -->
        <div style="display: flex; align-items: center; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 14px; border-bottom: 1px solid #f1f5f9;">
          ${questions.map((item, idx) => {
            const answered = userAnswers[item.id] !== undefined;
            const isCurrent = idx === currentQuestionIndex;
            let bg = "#e2e8f0";
            let color = "#475569";
            if (isCurrent) { bg = "#6d28d9"; color = "#ffffff"; }
            else if (answered) { bg = "#22c55e"; color = "#ffffff"; }

            return `
              <button type="button" style="width: 32px; height: 32px; border-radius: 8px; border: none; background: ${bg}; color: ${color}; font-weight: 800; font-size: 13px; cursor: pointer; flex-shrink: 0;" onclick="navigateToQuestion(${idx})">
                ${idx + 1}
              </button>
            `;
          }).join('')}
        </div>

        <!-- QUESTION CONTENT CARD -->
        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-left: 4px;">
          <div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; background: #ffffff;">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px;">
              <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.5;">
                سؤال ${currentQuestionIndex + 1} من ${questions.length}: ${escapeHtml(q.question)}
              </h4>
              <span class="status-badge" style="background: #e0f2fe; color: #0369a1; white-space: nowrap;">
                ${q.points || 10} نقاط ${q.bonusPoints ? `(+${q.bonusPoints} بونص)` : ''}
              </span>
            </div>

            <!-- OPTIONS LIST -->
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
              ${(q.options || []).map((opt, oIdx) => {
                const isSelected = userAnswers[q.id] === oIdx;
                const isLocked = navRules.lockAnswered && isAnswered && !isSelected;

                return `
                  <div style="border: 2px solid ${isSelected ? '#6d28d9' : '#e2e8f0'}; background: ${isSelected ? '#f5f3ff' : '#ffffff'}; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; gap: 12px; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; opacity: ${isLocked ? 0.6 : 1}; transition: all 0.2s;" onclick="selectAnswerOption(${oIdx})">
                    <input type="radio" name="opt_${q.id}" ${isSelected ? 'checked' : ''} ${isLocked ? 'disabled' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
                    <span style="font-weight: 700; color: #334155; font-size: 14px;">${escapeHtml(opt)}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- HINT REVEAL BOX -->
            ${q.hint ? `
              <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 10px; margin-top: 14px;">
                ${isHintRevealed ? `
                  <div style="font-size: 13px; color: #92400e;">
                    💡 <strong>تلميح السؤال:</strong> ${escapeHtml(q.hint)}
                    ${q.hintType === 'penalty' ? `<span style="font-size: 11px; color: #dc2626; display: block; margin-top: 2px;">(تم تطبيق خصم ${q.hintPenaltyPercent || 25}% من درجة السؤال لطلب التلميح)</span>` : ''}
                  </div>
                ` : `
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: #b45309; font-weight: 700;">💡 هل تحتاج تلميحاً للمساعدة في هذا السؤال؟</span>
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="revealHintForQuestion()">
                      إظهار التلميح ${q.hintType === 'penalty' ? `(خصم ${q.hintPenaltyPercent || 25}%)` : '(مجاني)'}
                    </button>
                  </div>
                `}
              </div>
            ` : ''}

          </div>
        </div>

        <!-- FOOTER NAVIGATION & SUBMIT -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="navigatePrevQuestion()" ${currentQuestionIndex === 0 || !navRules.allowBack ? 'disabled style="opacity:0.5;"' : ''}>
            ← السؤال السابق
          </button>

          <span style="font-size: 12px; color: #64748b; font-weight: 700;">
            تمت الإجابة على ${Object.keys(userAnswers).length} من ${questions.length} سؤال
          </span>

          ${currentQuestionIndex === questions.length - 1 ? `
            <button type="button" class="btn btn-primary" style="background: linear-gradient(135deg, #16a34a, #15803d);" onclick="submitQuizAttempt(false)">
              ✅ إنهاء واستكشاف النتيجة
            </button>
          ` : `
            <button type="button" class="btn btn-primary" onclick="navigateNextQuestion()">
              السؤال التالي →
            </button>
          `}
        </div>

      </div>
    `;

    window.selectAnswerOption = (oIdx) => {
      userAnswers[q.id] = oIdx;
      saveQuizProgress(quiz.id, { currentQuestionIndex, userAnswers, revealedHints, timeRemainingSeconds }, userId);
      renderQuizUI();
    };

    window.revealHintForQuestion = () => {
      revealedHints[q.id] = true;
      saveQuizProgress(quiz.id, { currentQuestionIndex, userAnswers, revealedHints, timeRemainingSeconds }, userId);
      renderQuizUI();
    };

    window.navigateToQuestion = (idx) => {
      if (idx < 0 || idx >= questions.length) return;
      if (!navRules.allowSkip && idx > currentQuestionIndex && userAnswers[questions[currentQuestionIndex].id] === undefined) {
        showCustomAlert("يشترط الإجابة على السؤال الحالي قبل الانتقال للسؤال التالي.");
        return;
      }
      currentQuestionIndex = idx;
      renderQuizUI();
    };

    window.navigateNextQuestion = () => {
      window.navigateToQuestion(currentQuestionIndex + 1);
    };

    window.navigatePrevQuestion = () => {
      window.navigateToQuestion(currentQuestionIndex - 1);
    };

    window.submitQuizAttempt = (isAuto = false) => {
      if (!isAuto && navRules.requireAnswer && Object.keys(userAnswers).length < questions.length) {
        showCustomAlert("يرجى إجابة جميع الأسئلة المطلوبة قبل إرسال الاختبار.");
        return;
      }

      clearInterval(autoSaveInterval);
      clearQuizProgress(quiz.id, userId);

      // Compute grade
      let earnedPoints = 0;
      let totalPoints = calculateQuizTotalScore(quiz);
      let correctCount = 0;
      let wrongCount = 0;

      questions.forEach((question) => {
        const studentAns = userAnswers[question.id];
        const isCorrect = studentAns === question.correctAnswer;
        const qPoints = Number(question.points) || 10;
        const bPoints = Number(question.bonusPoints) || 0;
        const nPoints = Number(question.negativePoints) || 0;

        if (isCorrect) {
          correctCount++;
          let pts = qPoints + bPoints;
          // Factor hint penalty
          if (revealedHints[question.id] && question.hintType === "penalty") {
            const penaltyRatio = (question.hintPenaltyPercent || 25) / 100;
            pts = pts * (1 - penaltyRatio);
          }
          earnedPoints += pts;
        } else if (studentAns !== undefined) {
          wrongCount++;
          earnedPoints = Math.max(0, earnedPoints - nPoints);
        }
      });

      const finalPercentage = Math.round((earnedPoints / (totalPoints || 100)) * 100);
      const isPassed = finalPercentage >= (quiz.passingGrade || 70);

      submissionResult = {
        score: finalPercentage,
        earnedPoints: Math.round(earnedPoints),
        totalPoints,
        correctCount,
        wrongCount,
        isPassed,
        submittedAt: new Date().toLocaleString("ar-SA")
      };

      recordQuizAttempt(quiz.id, {
        studentName: userName,
        score: finalPercentage,
        totalPossible: 100,
        timeSpentMins: Math.round(((quiz.timeLimit || 15) * 60 - timeRemainingSeconds) / 60),
        submittedAt: submissionResult.submittedAt
      });

      isSubmitted = true;
      renderResultsUI();
    };
  }

  function renderResultsUI() {
    const questions = quiz.questions;
    const res = submissionResult;

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 840px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 800;">
              🎉 نتيجة الاختبار: ${escapeHtml(quiz.title)}
            </h3>
            <span style="font-size: 12px; color: #64748b;">تاريخ التقديم: ${res.submittedAt}</span>
          </div>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-left: 4px;">
          
          <!-- SCORE SUMMARY BANNER -->
          <div style="padding: 24px; border-radius: 14px; text-align: center; background: ${res.isPassed ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)'}; border: 1px solid ${res.isPassed ? '#bbf7d0' : '#fecaca'};">
            <span style="font-size: 44px;">${res.isPassed ? '🎓' : '📚'}</span>
            <h2 style="margin: 8px 0 4px 0; font-size: 28px; font-weight: 800; color: ${res.isPassed ? '#15803d' : '#b91c1c'};">
              ${res.score}%
            </h2>
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: ${res.isPassed ? '#166534' : '#991b1b'};">
              ${res.isPassed ? 'تهانينا! لقد اجتزت الاختبار بنجاح متفوق.' : 'للأسف لم تتجاوز درجة النجاح المطلوبة. يمكنك مراجعة الإجابات وإعادة المحاولة.'}
            </p>

            <div style="display: flex; justify-content: center; gap: 16px; margin-top: 16px; font-size: 13px; font-weight: 700;">
              <span>الإجابات الصحيحة: <strong style="color: #16a34a;">${res.correctCount}</strong></span> |
              <span>الأخطاء: <strong style="color: #dc2626;">${res.wrongCount}</strong></span> |
              <span>درجة النجاح: <strong>${quiz.passingGrade || 70}%</strong></span>
            </div>
          </div>

          <!-- DETAILED EXPLANATION AFTER ANSWER REVIEW -->
          <h4 style="margin: 10px 0 4px 0; font-size: 16px; font-weight: 800; color: #0f172a;">
            📝 مراجعة الإجابات وشرح الحلول (Explanation Review):
          </h4>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${questions.map((q, idx) => {
              const studentAns = userAnswers[q.id];
              const isCorrect = studentAns === q.correctAnswer;
              const correctOptionText = q.options[q.correctAnswer] || '';
              const studentOptionText = studentAns !== undefined ? (q.options[studentAns] || '') : 'لم تتم الإجابة';

              return `
                <div style="border: 1px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}; background: ${isCorrect ? '#ffffff' : '#fff5f5'}; border-radius: 12px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <strong style="font-size: 14px; color: #0f172a;">
                      ${idx + 1}. ${escapeHtml(q.question)}
                    </strong>
                    <span class="status-badge" style="background: ${isCorrect ? '#dcfce7' : '#fee2e2'}; color: ${isCorrect ? '#166534' : '#991b1b'}; font-weight: 800;">
                      ${isCorrect ? '✓ إجابة صحيحة' : '✕ إجابة خاطئة'}
                    </span>
                  </div>

                  <div style="margin-top: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px;">
                    <div>إجابتك: <strong style="color: ${isCorrect ? '#16a34a' : '#dc2626'};">${escapeHtml(studentOptionText)}</strong></div>
                    ${!isCorrect ? `<div>الإجابة الصحيحة: <strong style="color: #16a34a;">${escapeHtml(correctOptionText)}</strong></div>` : ''}
                  </div>

                  <!-- EXPLANATION & REFERENCE LINKS -->
                  ${q.explanation ? `
                    <div style="margin-top: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; border-right: 3px solid #6d28d9; font-size: 12px; color: #334155;">
                      <strong>💡 شرح الحل الصحيح:</strong> ${escapeHtml(q.explanation)}
                    </div>
                  ` : ''}

                  ${q.referenceLinks && q.referenceLinks.length > 0 ? `
                    <div style="margin-top: 8px; font-size: 12px; color: #6d28d9;">
                      <strong>📚 مراجع مفيدة للدرس:</strong>
                      ${q.referenceLinks.map((link) => `<a href="${link.url}" target="_blank" style="color: #6d28d9; font-weight: 700; margin-right: 6px; text-decoration: underline;">${escapeHtml(link.title || link.url)}</a>`).join(', ')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

        </div>

        <!-- FOOTER -->
        <div style="display: flex; justify-content: flex-end; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-primary" onclick="this.closest('.floating-modal-overlay').remove()">إغلاق ومتابعة المنهج</button>
        </div>

      </div>
    `;
  }

  renderQuizUI();
  document.body.appendChild(overlay);
}

/**
 * Open Interactive Student Assignment View & File Submission Modal
 */
export function openStudentAssignmentModal(assignment, courseTitle = "الدورة") {
  const userId = window.appState?.user?.id || "guest_student";
  const userName = window.appState?.user?.name || "طالب تجريبي";

  let submissions = getAssignmentSubmissions(assignment.id);
  let mySubmission = submissions.find((s) => s.studentId === userId) || null;

  let uploadedFiles = [];
  let studentNoteText = "";

  const overlay = document.createElement("div");
  overlay.className = "floating-modal-overlay";
  overlay.style.zIndex = "10005";

  function renderAssignmentUI() {
    const rubric = assignment.rubric || [];
    const totalPossiblePoints = calculateRubricTotalPoints(rubric);

    overlay.innerHTML = `
      <div class="floating-modal-box" style="max-width: 840px; width: 95%; max-height: 92vh; display: flex; flex-direction: column;">
        
        <!-- HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <span style="font-size: 11px; color: #6d28d9; font-weight: 700; background: #f5f3ff; padding: 2px 8px; border-radius: 6px;">${escapeHtml(courseTitle)}</span>
            <h3 style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px; font-weight: 800;">
              📝 ${escapeHtml(assignment.title)}
            </h3>
          </div>
          <button type="button" class="btn-icon-action" onclick="this.closest('.floating-modal-overlay').remove()">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding-left: 4px;">
          
          <!-- ASSIGNMENT INSTRUCTIONS CARD -->
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #ffffff;">
            <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 800; color: #0f172a;">📌 معلومات وإرشادات الواجب:</h4>
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #334155; line-height: 1.6;">
              ${escapeHtml(assignment.description || 'يرجى تطبيق المهارات المطلوبة ورفع ملف الحل.')}
            </p>

            <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #64748b; background: #f8fafc; padding: 10px; border-radius: 8px;">
              <span>الموعد النهائي: <strong>${assignment.deadline || 'مفتوح'}</strong></span> |
              <span>أقصى محاولات: <strong>${assignment.maxAttempts || 3} محاولات</strong></span> |
              <span>أقصى حجم ملف: <strong>${assignment.maxFileSizeMB || 50} MB</strong></span> |
              <span>الدرجة القصوى: <strong>${totalPossiblePoints} درجة</strong></span>
            </div>
          </div>

          <!-- REFERENCE MATERIALS (DOWNLOADABLE ATTACHMENTS) -->
          ${assignment.referenceMaterials && assignment.referenceMaterials.length > 0 ? `
            <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background: #f8fafc;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #0f172a;">📥 المراجع والقوالب المرفقة من المعلم:</h4>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${assignment.referenceMaterials.map((ref) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <span style="font-weight: 700; font-size: 13px; color: #0f172a;">📄 ${escapeHtml(ref.name)}</span>
                    <a href="${ref.url || '#'}" download="${ref.name}" class="btn btn-sm btn-outline-primary" style="text-decoration: none;">⬇️ تنزيل المرجع</a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- RUBRIC CRITERIA PREVIEW FOR STUDENT -->
          ${rubric.length > 0 ? `
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #ffffff;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #0f172a;">📐 مصفوفة معايير التقييم (Rubric):</h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${rubric.map((cr) => `
                  <div style="padding: 8px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(cr.title)}</strong>
                      ${cr.description ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(cr.description)}</div>` : ''}
                    </div>
                    <span style="font-size: 12px; font-weight: 800; color: #6d28d9;">${cr.maxPoints} درجة</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- SUBMISSION STATUS / FEEDBACK FROM TEACHER -->
          ${mySubmission ? `
            <div style="border: 1px solid ${mySubmission.status === 'graded' ? '#bbf7d0' : mySubmission.status === 'corrections_requested' ? '#fde68a' : '#cbd5e1'}; border-radius: 12px; padding: 16px; background: ${mySubmission.status === 'graded' ? '#f0fdf4' : mySubmission.status === 'corrections_requested' ? '#fffbeb' : '#ffffff'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">
                  حالة التسليم السابق (المحاولة ${mySubmission.attemptNumber} من ${assignment.maxAttempts || 3}):
                </h4>
                <span class="status-badge ${mySubmission.status === 'graded' ? 'published' : 'draft'}">
                  ${mySubmission.status === 'graded' ? `تم التقييم: ${mySubmission.teacherGrade} / ${totalPossiblePoints}` : mySubmission.status === 'corrections_requested' ? '⚠️ مطلوب تعديل الحل' : '⏳ قيد المراجعة'}
                </span>
              </div>

              ${mySubmission.teacherFeedback ? `
                <div style="margin-top: 8px; padding: 10px; background: #ffffff; border-radius: 8px; border-right: 3px solid #6d28d9; font-size: 13px; color: #334155;">
                  <strong>💬 ملاحظات المعلم:</strong> "${escapeHtml(mySubmission.teacherFeedback)}"
                </div>
              ` : ''}

              ${mySubmission.teacherVoiceNoteUrl ? `
                <div style="margin-top: 8px; padding: 10px; background: #ffffff; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 20px;">🎙️</span>
                  <div>
                    <strong>تغذية راجعة صوتية من المعلم:</strong>
                    <div style="font-size: 11px; color: #16a34a; font-weight: 700;">انقر للاستماع إلى التسجيل الصوتي المباشر</div>
                  </div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- MULTI FILE UPLOADER & FORM -->
          <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; background: #ffffff;">
            <input type="file" id="asg_file_input" style="display: none;" multiple />
            
            <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #0f172a;">📤 تقديم الحل ورفع ملفات الواجب:</h4>
            <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748b;">الصيغ المدعومة: PDF, Word, PPT, Excel, ZIP, RAR, Images, Videos, Source Code</p>

            <button type="button" class="btn btn-primary" id="btn_asg_browse">اختيار الملفات من الجهاز</button>

            <!-- UPLOADED FILES LIST -->
            ${uploadedFiles.length > 0 ? `
              <div style="margin-top: 14px; text-align: right; display: flex; flex-direction: column; gap: 6px;">
                ${uploadedFiles.map((f, idx) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <span style="font-size: 13px; font-weight: 700; color: #0f172a;">📄 ${escapeHtml(f.name)} (${f.size})</span>
                    <button type="button" class="btn-icon-action" style="color: #ef4444;" onclick="removeAsgUploadedFile(${idx})">🗑️</button>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="form-group-builder" style="margin-top: 14px; text-align: right;">
              <label style="font-weight: 700;">إضافة ملاحظة أو توضيح للمعلم (اختياري)</label>
              <textarea id="asg_student_note" class="form-textarea-builder" rows="2" placeholder="أدخل أي ملاحظات ترغب في إطلاع المعلم عليها...">${escapeHtml(studentNoteText)}</textarea>
            </div>
          </div>

        </div>

        <!-- FOOTER ACTIONS -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="this.closest('.floating-modal-overlay').remove()">إلغاء</button>
          <button type="button" class="btn btn-primary" id="btn_submit_asg" ${uploadedFiles.length === 0 ? 'disabled style="opacity:0.5;"' : ''}>
            🚀 إرسال وتسليم الواجب (${uploadedFiles.length} ملف)
          </button>
        </div>

      </div>
    `;

    const fileInput = overlay.querySelector("#asg_file_input");
    const browseBtn = overlay.querySelector("#btn_asg_browse");
    const submitBtn = overlay.querySelector("#btn_submit_asg");

    if (browseBtn && fileInput) browseBtn.onclick = () => fileInput.click();

    window.removeAsgUploadedFile = (idx) => {
      uploadedFiles.splice(idx, 1);
      renderAssignmentUI();
    };

    if (fileInput) {
      fileInput.onchange = () => {
        const files = Array.from(fileInput.files);
        files.forEach((f) => {
          const sz = f.size >= 1024 * 1024 ? (f.size / (1024 * 1024)).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB";
          uploadedFiles.push({
            name: f.name,
            size: sz,
            type: f.name.split('.').pop().toUpperCase(),
            url: URL.createObjectURL(f)
          });
        });
        renderAssignmentUI();
      };
    }

    if (submitBtn) {
      submitBtn.onclick = () => {
        const note = overlay.querySelector("#asg_student_note")?.value || "";

        const newSub = {
          id: "sub_" + Date.now(),
          studentId: userId,
          studentName: userName,
          studentEmail: window.appState?.user?.email || "student@example.com",
          studentAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
          submittedAt: new Date().toLocaleString("ar-SA"),
          status: "pending",
          attemptNumber: (mySubmission ? mySubmission.attemptNumber : 0) + 1,
          maxAttempts: assignment.maxAttempts || 3,
          isLate: false,
          files: uploadedFiles,
          studentNote: note,
          teacherGrade: null,
          teacherFeedback: "",
          teacherFeedbackFile: null,
          teacherVoiceNoteUrl: "",
          rubricScores: {}
        };

        const existingSubs = getAssignmentSubmissions(assignment.id);
        const myIdx = existingSubs.findIndex((s) => s.studentId === userId);
        if (myIdx !== -1) {
          existingSubs[myIdx] = newSub;
        } else {
          existingSubs.push(newSub);
        }

        saveAssignmentSubmissions(assignment.id, existingSubs);
        showCustomAlert("🎉 تم تسليم الواجب بنجاح وإرساله للمعلم للمراجعة والتقييم!");
        overlay.remove();
      };
    }
  }

  renderAssignmentUI();
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
