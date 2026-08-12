// هذا الملف مسؤول عن إدارة نظام الإشعارات والنوافذ المنبثقة التفاعلية (Toast & Dialog Notification System).

// إنشاء أو التأكد من وجود حاوية التوستات في أعلى الشاشة
function getOrCreateToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

/**
 * SVG icons dictionary for supported operations and semantic states
 */
function getNotificationIconSvg(operation, type) {
  const op = (operation || "").toLowerCase();

  if (type === "loading" || op === "loading") {
    return `<svg class="sm-toast-spinner-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>`;
  }

  switch (op) {
    case "download":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>`;
    case "upload":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>`;
    case "delete":
    case "remove":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
      </svg>`;
    case "add":
    case "create":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>`;
    case "save":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>`;
    case "bookmark":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>`;
    case "note":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>`;
    case "archive":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
      </svg>`;
    case "unpublish":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
      </svg>`;
    case "publish":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>`;
    case "price":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>`;
    case "progress":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>`;
    case "cart":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>`;
    case "search":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>`;
    case "copy":
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>`;
    default:
      break;
  }

  if (type === "error") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`;
  } else if (type === "warning") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
  } else if (type === "info") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`;
  }

  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;
}

/**
 * Intelligent metadata resolver for notifications
 */
function resolveNotificationMeta(params = {}) {
  let { type, operation, title, message, entityName } = params;
  message = message || "";
  let cleanMessage = typeof message === "string" ? message.replace(/^[❌✅⚠️🎉🔔🚀💾]\s*/, "").trim() : String(message);

  if (!type) {
    if (/خطأ|فشل|تعذر|غير صحيح|غير مسجل|عذراً|مرفوض|مغلق/i.test(cleanMessage)) {
      type = "error";
    } else if (/يرجى|تنبيه|تحذير|تأكد|مطلوب|كبير جداً|انتبه|ينقص/i.test(cleanMessage)) {
      type = "warning";
    } else if (/جاري|جارٍ/i.test(cleanMessage)) {
      type = "loading";
    } else if (/معلومات|عرض|فتح|تصفح/i.test(cleanMessage)) {
      type = "info";
    } else {
      type = "success";
    }
  }

  if (!operation) {
    if (/تحميل|تنزيل|download/i.test(cleanMessage) || /تحميل|تنزيل/i.test(title || "")) operation = "download";
    else if (/رفع|مرفق|رفع ملف|upload/i.test(cleanMessage) || /رفع/i.test(title || "")) operation = "upload";
    else if (/حذف|إزالة|حذفه|delete/i.test(cleanMessage) || /حذف/i.test(title || "")) operation = "delete";
    else if (/إضافة|أضيفت|تكرار|جديد|إنشاء|add/i.test(cleanMessage) || /إضافة|تكرار/i.test(title || "")) operation = "add";
    else if (/ملاحظة|ملاحظات|note/i.test(cleanMessage) || /ملاحظة/i.test(title || "")) operation = "note";
    else if (/علامة|مرجعية|bookmark/i.test(cleanMessage) || /علامة/i.test(title || "")) operation = "bookmark";
    else if (/حفظ|مسودة|save/i.test(cleanMessage) || /حفظ/i.test(title || "")) operation = "save";
    else if (/أرشفة|أرشفت|archive/i.test(cleanMessage) || /أرشفة/i.test(title || "")) operation = "archive";
    else if (/إلغاء نشر|unpublish/i.test(cleanMessage) || /إلغاء نشر/i.test(title || "")) operation = "unpublish";
    else if (/نشر|publish/i.test(cleanMessage) || /نشر/i.test(title || "")) operation = "publish";
    else if (/سعر|السعر|price/i.test(cleanMessage) || /سعر/i.test(title || "")) operation = "price";
    else if (/تقدم|قراءة|صفحة|progress/i.test(cleanMessage) || /تقدم/i.test(title || "")) operation = "progress";
    else if (/سلة|السلة|cart/i.test(cleanMessage) || /سلة/i.test(title || "")) operation = "cart";
    else if (/بحث|search/i.test(cleanMessage) || /بحث/i.test(title || "")) operation = "search";
    else if (/نسخ|رابط|copy/i.test(cleanMessage) || /نسخ/i.test(title || "")) operation = "copy";
  }

  if (!title || title === "تم بنجاح" || title === "تنبيه" || title === "حدث خطأ" || title === "معلومات") {
    if (type === "loading") {
      title = "جاري المعالجة...";
    } else if (type === "error") {
      switch (operation) {
        case "download": title = "فشل التحميل"; break;
        case "upload": title = "فشل الرفع"; break;
        case "delete": title = "تعذر الحذف"; break;
        case "save": title = "تعذر الحفظ"; break;
        default: title = "حدث خطأ"; break;
      }
    } else if (type === "warning") {
      title = "تنبيه";
    } else if (type === "info") {
      title = "معلومات";
    } else {
      switch (operation) {
        case "download": title = "تم التحميل بنجاح"; break;
        case "upload": title = "تم الرفع بنجاح"; break;
        case "delete": title = "تم الحذف بنجاح"; break;
        case "add": title = "تمت الإضافة بنجاح"; break;
        case "save": title = "تم الحفظ بنجاح"; break;
        case "bookmark": title = "تم حفظ العلامة بنجاح"; break;
        case "note": title = "تم حفظ الملاحظة بنجاح"; break;
        case "archive": title = "تمت الأرشفة بنجاح"; break;
        case "unpublish": title = "تم إلغاء النشر بنجاح"; break;
        case "publish": title = "تم النشر بنجاح"; break;
        case "price": title = "تم تحديث السعر بنجاح"; break;
        case "progress": title = "تم حفظ تقدم القراءة بنجاح"; break;
        case "cart": title = "السلة"; break;
        case "search": title = "نتائج البحث"; break;
        case "copy": title = "تم النسخ بنجاح"; break;
        default: title = "تمت العملية بنجاح"; break;
      }
    }
  }

  if (entityName && cleanMessage && !cleanMessage.includes(entityName)) {
    cleanMessage = `${cleanMessage} (${entityName})`;
  }

  const iconSvg = getNotificationIconSvg(operation, type);

  return {
    type,
    operation,
    title,
    message: cleanMessage,
    iconSvg
  };
}

/**
 * النظام الموحد الشامل للإشعارات (Unified Operation & Context-Aware Toast System)
 */
export function showToast(options = {}) {
  const opts = typeof options === "string" ? { message: options } : (options || {});

  const meta = resolveNotificationMeta(opts);

  const duration = opts.duration !== undefined
    ? opts.duration
    : (meta.type === "loading" ? 0 : meta.type === "error" ? 5000 : 4000);

  const container = getOrCreateToastContainer();
  const toast = document.createElement("div");

  toast.className = `sm-toast sm-toast-${meta.type}`;
  toast.setAttribute("role", "alert");

  const iconSvg = opts.icon || meta.iconSvg;

  toast.innerHTML = `
    <div class="sm-toast-progress" style="transform: scaleX(1)"></div>
    <div class="sm-toast-icon-wrapper sm-toast-icon-${meta.type}">
      ${iconSvg}
    </div>
    <div class="sm-toast-content">
      <div class="sm-toast-title">${meta.title}</div>
      <div class="sm-toast-desc">${meta.message}</div>
    </div>
    <button type="button" class="sm-toast-close" aria-label="إغلاق">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  const progressBar = toast.querySelector(".sm-toast-progress");
  const closeBtn = toast.querySelector(".sm-toast-close");

  container.appendChild(toast);

  let startTime = Date.now();
  let animationFrameId;

  function updateProgress() {
    if (duration <= 0) return;
    const elapsed = Date.now() - startTime;
    const remainingRatio = Math.max(0, 1 - elapsed / duration);
    if (progressBar) {
      progressBar.style.transform = `scaleX(${remainingRatio})`;
    }

    if (elapsed < duration) {
      animationFrameId = requestAnimationFrame(updateProgress);
    } else {
      dismissToast();
    }
  }

  if (duration > 0) {
    animationFrameId = requestAnimationFrame(updateProgress);
  }

  function dismissToast() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    toast.classList.add("hiding");
    setTimeout(() => {
      toast.remove();
    }, 250);
  }

  closeBtn?.addEventListener("click", dismissToast);

  const controller = {
    close: dismissToast,
    update: (newOpts = {}) => {
      const updatedOpts = typeof newOpts === "string" ? { message: newOpts } : newOpts;
      const mergedOpts = { ...opts, ...updatedOpts };
      const updatedMeta = resolveNotificationMeta(mergedOpts);

      toast.className = `sm-toast sm-toast-${updatedMeta.type}`;
      const iconWrap = toast.querySelector(".sm-toast-icon-wrapper");
      if (iconWrap) {
        iconWrap.className = `sm-toast-icon-wrapper sm-toast-icon-${updatedMeta.type}`;
        iconWrap.innerHTML = updatedOpts.icon || updatedMeta.iconSvg;
      }
      const titleEl = toast.querySelector(".sm-toast-title");
      if (titleEl) titleEl.textContent = updatedMeta.title;
      const descEl = toast.querySelector(".sm-toast-desc");
      if (descEl) descEl.textContent = updatedMeta.message;

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      const newDuration = updatedOpts.duration !== undefined ? updatedOpts.duration : (updatedMeta.type === "error" ? 5000 : 4000);
      if (newDuration > 0) {
        startTime = Date.now();
        const runProg = () => {
          const elapsed = Date.now() - startTime;
          const remainingRatio = Math.max(0, 1 - elapsed / newDuration);
          if (progressBar) progressBar.style.transform = `scaleX(${remainingRatio})`;
          if (elapsed < newDuration) animationFrameId = requestAnimationFrame(runProg);
          else dismissToast();
        };
        animationFrameId = requestAnimationFrame(runProg);
      }
    },
    success: (newOpts = {}) => {
      const args = typeof newOpts === "string" ? { message: newOpts } : newOpts;
      controller.update({ type: "success", ...args });
    },
    error: (newOpts = {}) => {
      const args = typeof newOpts === "string" ? { message: newOpts } : newOpts;
      controller.update({ type: "error", ...args });
    }
  };

  return controller;
}

export function showSuccessToast(options = {}) {
  const opts = typeof options === "string" ? { message: options } : (options || {});
  return showToast({ type: "success", ...opts });
}

export function showErrorToast(options = {}) {
  const opts = typeof options === "string" ? { message: options } : (options || {});
  return showToast({ type: "error", ...opts });
}

export function showWarningToast(options = {}) {
  const opts = typeof options === "string" ? { message: options } : (options || {});
  return showToast({ type: "warning", ...opts });
}

export function showInfoToast(options = {}) {
  const opts = typeof options === "string" ? { message: options } : (options || {});
  return showToast({ type: "info", ...opts });
}

export function showLoadingToast(options = {}) {
  const opts = typeof options === "string" ? { message: options } : (options || {});
  return showToast({ type: "loading", ...opts });
}

/**
 * 3. نافذة تأكيد الإجراء (Confirmation Dialog)
 * دعم كامل للخيارات المرنة، العناوين، والأزرار المخصصة بحسب نوع الإجراء (حظر، إيقاف، إعادة تفعيل، حذف)
 */
export function showConfirmDialog(options = {}, onConfirmCallback = null, onCancelCallback = null) {
  return new Promise((resolve) => {
    let title = "تأكيد الإجراء";
    let message = "هل أنت متأكد من رغبتك في الاستمرار؟ لا يمكن التراجع عن هذا الإجراء.";
    let confirmText = "تأكيد";
    let cancelText = "إلغاء";
    let danger = true;
    let onConfirm = null;
    let onCancel = null;
    let icon = null;

    if (typeof options === "string") {
      title = options;
      message = "";
      onConfirm = typeof onConfirmCallback === "function" ? onConfirmCallback : null;
      onCancel = typeof onCancelCallback === "function" ? onCancelCallback : null;
    } else if (typeof options === "object" && options !== null) {
      title = options.title || title;
      message = options.message || message;
      confirmText = options.confirmText || confirmText;
      cancelText = options.cancelText || cancelText;
      danger = options.danger !== undefined ? options.danger : danger;
      onConfirm = options.onConfirm || (typeof onConfirmCallback === "function" ? onConfirmCallback : null);
      onCancel = options.onCancel || (typeof onCancelCallback === "function" ? onCancelCallback : null);
      icon = options.icon || null;
    }

    // Auto-resolve confirm button text if defaults were left as "حذف" or "تأكيد"
    if (confirmText === "تأكيد" || confirmText === "حذف") {
      if (/إيقاف/i.test(title) || /إيقاف/i.test(message)) {
        confirmText = "إيقاف الحساب";
      } else if (/حظر/i.test(title) || /حظر/i.test(message)) {
        if (/رفع/i.test(title) || /رفع/i.test(message)) {
          confirmText = "رفع الحظر";
        } else {
          confirmText = "حظر الحساب";
        }
      } else if (/إعادة/i.test(title) || /تفعيل/i.test(title) || /تفعيل/i.test(message)) {
        confirmText = "إعادة الحساب للعمل";
      }
    }

    const overlay = document.createElement("div");
    overlay.className = "sm-dialog-overlay";

    overlay.innerHTML = `
      <div class="sm-dialog-card" role="dialog" aria-modal="true">
        <div class="sm-dialog-icon-wrapper" style="${!danger ? 'background: rgba(16, 185, 129, 0.12); color: #10b981;' : 'background: rgba(239, 68, 68, 0.12); color: #ef4444;'}">
          <div class="sm-dialog-sparkles">
            <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
              <circle cx="6" cy="6" r="1.5" fill="${!danger ? '#10b981' : '#EF4444'}" opacity="0.7" />
              <circle cx="16" cy="3" r="2" fill="${!danger ? '#10b981' : '#EF4444'}" />
              <circle cx="26" cy="7" r="1.5" fill="${!danger ? '#10b981' : '#EF4444'}" opacity="0.7" />
            </svg>
          </div>
          ${icon ? `<span style="font-size: 26px; line-height: 1;">${icon}</span>` : (
            danger ? `
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            ` : `
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            `
          )}
        </div>

        <div class="sm-dialog-title">${title}</div>
        ${message ? `<div class="sm-dialog-desc">${message}</div>` : ''}

        <div class="sm-dialog-actions">
          <button type="button" class="sm-btn-pill sm-btn-pill-cancel" id="smDialogCancel">
            ${cancelText}
          </button>
          <button type="button" class="sm-btn-pill ${danger ? "sm-btn-pill-danger" : "sm-btn-pill-primary"}" id="smDialogConfirm" style="${!danger ? 'background: #10b981; color: #ffffff;' : ''}">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector("#smDialogCancel");
    const confirmBtn = overlay.querySelector("#smDialogConfirm");
    const card = overlay.querySelector(".sm-dialog-card");

    function closeDialog(result) {
      card?.classList.add("hiding");
      overlay.classList.add("hiding");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    }

    cancelBtn?.addEventListener("click", () => {
      if (onCancel) onCancel();
      closeDialog(false);
    });

    confirmBtn?.addEventListener("click", async () => {
      if (onConfirm) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "جاري التنفيذ...";
        try {
          await onConfirm();
        } catch (e) {
          console.error(e);
        }
      }
      closeDialog(true);
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        if (onCancel) onCancel();
        closeDialog(false);
      }
    });
  });
}

/**
 * 3.5. نافذة إدخال نص (Input / Prompt Dialog)
 */
export function showInputDialog(options = {}) {
  return new Promise((resolve) => {
    const {
      title = "إدخال بيانات",
      message = "",
      placeholder = "",
      defaultValue = "",
      confirmText = "حفظ",
      cancelText = "إلغاء",
      isMultiline = true,
      icon = "📝"
    } = typeof options === "string" ? { title: options } : options;

    const overlay = document.createElement("div");
    overlay.className = "sm-dialog-overlay";

    overlay.innerHTML = `
      <div class="sm-dialog-card" style="max-width: 500px; width: 92%; text-align: right; direction: rtl; padding: 24px;" role="dialog" aria-modal="true">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(124, 58, 237, 0.1); color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
            ${icon}
          </div>
          <div>
            <div class="sm-dialog-title" style="margin: 0; font-size: 16px; font-weight: 800; color: #1e293b;">${title}</div>
            ${message ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${message}</div>` : ''}
          </div>
        </div>

        <div style="margin: 16px 0;">
          ${isMultiline 
            ? `<textarea id="smDialogInputText" class="crm-input" style="width: 100%; min-height: 110px; padding: 12px; font-family: inherit; border-radius: 10px; border: 1.5px solid #cbd5e1; outline: none; font-size: 13px; line-height: 1.5; resize: vertical; box-sizing: border-box;" placeholder="${placeholder}">${defaultValue}</textarea>`
            : `<input type="text" id="smDialogInputText" class="crm-input" style="width: 100%; padding: 12px; font-family: inherit; border-radius: 10px; border: 1.5px solid #cbd5e1; outline: none; font-size: 13px; box-sizing: border-box;" placeholder="${placeholder}" value="${defaultValue}" />`
          }
        </div>

        <div class="sm-dialog-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
          <button type="button" class="sm-btn-pill sm-btn-pill-cancel" id="smDialogInputCancel">
            ${cancelText}
          </button>
          <button type="button" class="sm-btn-pill sm-btn-pill-primary" id="smDialogInputConfirm" style="background: #7c3aed; color: #ffffff;">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector("#smDialogInputText");
    const confirmBtn = overlay.querySelector("#smDialogInputConfirm");
    const cancelBtn = overlay.querySelector("#smDialogInputCancel");
    const card = overlay.querySelector(".sm-dialog-card");

    setTimeout(() => {
      if (input) {
        input.focus();
        if (input.select) input.select();
      }
    }, 60);

    function close(result) {
      card?.classList.add("hiding");
      overlay.classList.add("hiding");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 150);
    }

    confirmBtn?.addEventListener("click", () => {
      const val = input ? input.value : "";
      close(val);
    });

    cancelBtn?.addEventListener("click", () => {
      close(null);
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(null);
    });

    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close(null);
    });
  });
}

/**
 * 4. نافذة التحميل والرفع (Loading / Upload Dialog)
 * مطابقة دقيقة للتصميم المرجعي (أيقونة الرفع الزرقاء، شريط التقدم، النسبة المئوية، وزر الإلغاء)
 */
export function showLoadingDialog(options = {}) {
  const {
    title = "جاري المعالجة...",
    message = "يرجى الانتظار قليلاً بينما نتم معالجة بياناتك.",
    progress = 0,
    onCancel = null
  } = typeof options === "string" ? { title: options } : options;

  const overlay = document.createElement("div");
  overlay.className = "sm-dialog-overlay";

  overlay.innerHTML = `
    <div class="sm-loading-card" role="dialog" aria-modal="true">
      <button type="button" class="sm-loading-close" id="smLoadingCloseBtn" aria-label="إغلاق">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="sm-loading-header">
        <div class="sm-loading-icon-blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </div>
        <div>
          <div class="sm-loading-title" id="smLoadingTitle">${title}</div>
          <div class="sm-loading-desc" id="smLoadingDesc">${message}</div>
        </div>
      </div>

      <div class="sm-loading-bottom">
        <div class="sm-loading-progress-wrapper">
          <div class="sm-loading-percent-row">
            <span id="smLoadingPercentText">${Math.round(progress)}%</span>
          </div>
          <div class="sm-loading-progress-track">
            <div class="sm-loading-progress-fill" id="smLoadingProgressFill" style="width: ${Math.round(progress)}%"></div>
          </div>
        </div>
        <button type="button" class="sm-loading-cancel-btn" id="smLoadingCancelBtn">
          إلغاء
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const titleElem = overlay.querySelector("#smLoadingTitle");
  const descElem = overlay.querySelector("#smLoadingDesc");
  const percentElem = overlay.querySelector("#smLoadingPercentText");
  const fillElem = overlay.querySelector("#smLoadingProgressFill");
  const closeBtn = overlay.querySelector("#smLoadingCloseBtn");
  const cancelBtn = overlay.querySelector("#smLoadingCancelBtn");

  function close() {
    overlay.classList.add("hiding");
    setTimeout(() => {
      overlay.remove();
    }, 200);
  }

  function setProgress(newProgress) {
    const clamped = Math.min(100, Math.max(0, Math.round(newProgress)));
    if (percentElem) percentElem.textContent = `${clamped}%`;
    if (fillElem) fillElem.style.width = `${clamped}%`;
  }

  function setMessage(newTitle, newDesc) {
    if (newTitle && titleElem) titleElem.textContent = newTitle;
    if (newDesc && descElem) descElem.textContent = newDesc;
  }

  const handleCancel = () => {
    if (onCancel) onCancel();
    close();
  };

  closeBtn?.addEventListener("click", handleCancel);
  cancelBtn?.addEventListener("click", handleCancel);

  return {
    setProgress,
    setMessage,
    close
  };
}

/**
 * 5. الدالة العامة المعوضة (Backward Compatible Custom Alert System)
 * بديل احترافي شامل يعالج كلاً من النصوص والكائنات بدقة ومرونة
 */
export function showCustomAlert(message, customTitle, options = {}) {
  const opts = typeof options === "string" ? { customTitle: options } : (options || {});
  return showToast({
    message: message,
    title: customTitle || opts.title,
    ...opts
  });
}

// كائن الخدمات المجمّع (Notify Object)
export const notify = {
  success: (msgOrOpts, title) => showSuccessToast(typeof msgOrOpts === "string" ? { message: msgOrOpts, title } : msgOrOpts),
  error: (msgOrOpts, title) => showErrorToast(typeof msgOrOpts === "string" ? { message: msgOrOpts, title } : msgOrOpts),
  warning: (msgOrOpts, title) => showWarningToast(typeof msgOrOpts === "string" ? { message: msgOrOpts, title } : msgOrOpts),
  info: (msgOrOpts, title) => showInfoToast(typeof msgOrOpts === "string" ? { message: msgOrOpts, title } : msgOrOpts),
  loading: (msgOrOpts, title) => showLoadingToast(typeof msgOrOpts === "string" ? { message: msgOrOpts, title } : msgOrOpts),
  toast: showToast,
  confirm: (opts) => showConfirmDialog(opts),
  input: (opts) => showInputDialog(opts),
  dialogLoading: (opts) => showLoadingDialog(opts),
  alert: showCustomAlert
};

// ====================================================
// NOTIFICATION CENTER STORE & PANEL (DYNAMIC)
// ====================================================
const NOTIFICATIONS_KEY = "lms_notifications_v1";

const initialNotifications = [
  {
    id: "notif-101",
    title: "سؤال جديد حول درس React",
    message: "طرح أحمد محمود سؤالاً: 'لدي سؤال بخصوص استدعاء Context API داخل Custom Hook...'",
    time: "منذ 10 دقائق",
    isRead: false,
    type: "question",
    link: "#teacher/messages/MSG-CONV-101/M-101-3"
  },
  {
    id: "notif-102",
    title: "تسليم واجب مشروع جديد",
    message: "أرفقت سارة أحمد ملف الواجب المكتمل React_Project_Submission.zip مع التقرير",
    time: "منذ 25 دقيقة",
    isRead: false,
    type: "assignment",
    link: "#teacher/messages/MSG-CONV-102/M-102-1"
  },
  {
    id: "notif-103",
    title: "استفسار حول كتاب JS الحديثة",
    message: "طرح محمد عبد الله الشمري سؤالاً حول 'Async/Await وتطبيق صفحة 45'",
    time: "منذ ساعة",
    isRead: false,
    type: "book",
    link: "#teacher/messages/MSG-CONV-103/M-103-1"
  },
  {
    id: "notif-104",
    title: "ملاحظة حول سؤال في الاختبار",
    message: "أرسل عمر الفاروق ملاحظة بخصوص سؤال في اختبار TypeScript",
    time: "منذ ساعتين",
    isRead: false,
    type: "quiz",
    link: "#teacher/messages/MSG-CONV-106/M-106-1"
  },
  {
    id: "notif-105",
    title: "استفسار تسجيل من طالب",
    message: "أرسل خالد العمراني رسالة: 'أود تسجيل 5 مهندسين من شركتنا، هل يوجد خصم؟'",
    time: "منذ 3 ساعات",
    isRead: true,
    type: "question",
    link: "#teacher/messages/MSG-CONV-104/M-104-1"
  }
];

export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initialNotifications));
      return initialNotifications;
    }
    return JSON.parse(raw);
  } catch (e) {
    return initialNotifications;
  }
}

export function saveNotifications(list) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
    updateNotificationBadge();
  } catch (e) {
    console.error(e);
  }
}

export function addNotification(opts = {}) {
  const { title = "تنبيه جديد", message = "", type = "info", link = "" } = opts;
  const list = getNotifications();
  const newNotif = {
    id: "notif-" + Date.now(),
    title,
    message,
    time: "الآن",
    isRead: false,
    type,
    link
  };
  list.unshift(newNotif);
  saveNotifications(list);
  showSuccessToast({ title, message });
  return newNotif;
}

export function markNotificationAsRead(id) {
  const list = getNotifications();
  const item = list.find((n) => n.id === id);
  if (item && !item.isRead) {
    item.isRead = true;
    saveNotifications(list);
  }
}

export function markAllNotificationsAsRead() {
  const list = getNotifications();
  list.forEach((n) => { n.isRead = true; });
  saveNotifications(list);
  renderNotificationPanelList();
}

export function deleteNotification(id) {
  let list = getNotifications();
  list = list.filter((n) => n.id !== id);
  saveNotifications(list);
  renderNotificationPanelList();
}

export function updateNotificationBadge() {
  const list = getNotifications();
  const unreadCount = list.filter((n) => !n.isRead).length;
  const badge = document.getElementById("navNotificationBadge") || document.querySelector(".nav-notification-badge");
  if (badge) {
    badge.textContent = unreadCount;
    if (unreadCount === 0) {
      badge.style.display = "none";
    } else {
      badge.style.display = "inline-flex";
    }
  }
}

export function toggleNotificationPanel(event) {
  if (event) event.stopPropagation();

  let panel = document.getElementById("navNotificationPanel");
  if (panel) {
    if (panel.style.display === "block") {
      panel.style.display = "none";
      return;
    } else {
      panel.style.display = "block";
      renderNotificationPanelList();
      positionNotificationPanel(panel);
      return;
    }
  }

  // Create Panel Dropdown
  panel = document.createElement("div");
  panel.id = "navNotificationPanel";
  panel.className = "nav-notification-panel";
  panel.setAttribute("dir", "rtl");

  document.body.appendChild(panel);
  renderNotificationPanelList();
  panel.style.display = "block";

  // Position relative to notification button
  positionNotificationPanel(panel);

  // Close on outside click
  const outsideClickListener = (e) => {
    if (panel && !panel.contains(e.target) && !e.target.closest(".nav-notification-btn")) {
      panel.style.display = "none";
      document.removeEventListener("click", outsideClickListener);
    }
  };
  setTimeout(() => {
    document.addEventListener("click", outsideClickListener);
  }, 10);
}

function positionNotificationPanel(panel) {
  const btn = document.querySelector(".nav-notification-btn");
  if (!btn || !panel) return;

  const rect = btn.getBoundingClientRect();
  panel.style.position = "fixed";
  panel.style.top = `${rect.bottom + 8}px`;

  if (window.innerWidth < 768) {
    const panelWidth = panel.offsetWidth || Math.min(310, window.innerWidth - 16);
    const idealRight = window.innerWidth - rect.right;
    const maxRight = Math.max(8, window.innerWidth - panelWidth - 8);
    const right = Math.max(8, Math.min(idealRight, maxRight));
    panel.style.right = `${right}px`;
    panel.style.left = "auto";
  } else {
    const panelWidth = panel.offsetWidth || 360;
    let left = rect.left - 10;
    const maxLeft = Math.max(10, window.innerWidth - panelWidth - 10);
    left = Math.max(10, Math.min(left, maxLeft));
    panel.style.left = `${left}px`;
    panel.style.right = "auto";
  }
  panel.style.zIndex = "9999";
}

function renderNotificationPanelList() {
  const panel = document.getElementById("navNotificationPanel");
  if (!panel) return;

  const list = getNotifications();
  const unreadCount = list.filter((n) => !n.isRead).length;

  panel.innerHTML = `
    <div class="notif-panel-header">
      <div class="notif-panel-title">
        🔔 الإشعارات
        ${unreadCount > 0 ? `<span class="notif-unread-tag">${unreadCount} جديدة</span>` : ''}
      </div>
      <div class="notif-panel-actions">
        ${unreadCount > 0 ? `<button type="button" class="btn-text-action" onclick="markAllNotificationsAsRead()">تحديد الكل كقراءة</button>` : ''}
        <button type="button" class="btn-close-panel" onclick="document.getElementById('navNotificationPanel').style.display='none';">✕</button>
      </div>
    </div>
    <div class="notif-panel-body">
      ${list.length === 0 ? `
        <div class="notif-empty-state">
          <span>🔕</span>
          <p>لا توجد إشعارات حالياً</p>
        </div>
      ` : list.map((item) => `
        <div class="notif-item ${item.isRead ? 'read' : 'unread'}" onclick="handleNotifItemClick('${item.id}', '${item.link || ''}')">
          <div class="notif-item-start">
            <span class="notif-type-icon">${getNotifIcon(item.type)}</span>
          </div>
          <div class="notif-item-content">
            <div class="notif-item-title">${escapeHtmlNotif(item.title)} ${!item.isRead ? '<span class="notif-dot"></span>' : ''}</div>
            <div class="notif-item-desc">${escapeHtmlNotif(item.message)}</div>
            <span class="notif-item-time">${item.time}</span>
          </div>
          <button type="button" class="notif-item-del" onclick="event.stopPropagation(); deleteNotification('${item.id}')" title="حذف الإشعار">✕</button>
        </div>
      `).join('')}
    </div>
  `;
}

function getNotifIcon(type) {
  switch (type) {
    case "course": case "question": return "🎓";
    case "book": return "📚";
    case "assignment": return "📝";
    case "quiz": case "answer": return "✍️";
    case "payout": return "💰";
    case "account": return "👤";
    default: return "🔔";
  }
}

function escapeHtmlNotif(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function handleNotifItemClick(id, link) {
  markNotificationAsRead(id);
  updateNotificationBadge();
  const panel = document.getElementById("navNotificationPanel");
  if (panel) panel.style.display = "none";

  if (link && link.trim()) {
    window.location.hash = link;

    if (link.includes("messages")) {
      const cleanHash = link.split("#")[1] || link;
      const parts = cleanHash.split("messages/");
      if (parts.length > 1 && parts[1].trim()) {
        const subParts = parts[1].split("?")[0].split("/");
        const convId = subParts[0];
        const msgId = subParts.length > 1 ? subParts[1] : null;
        if (window.MessageCenterService && window.MessageCenterService.openMessageCenterPage) {
          window.MessageCenterService.openMessageCenterPage(convId, msgId);
        }
      } else {
        if (window.MessageCenterService && window.MessageCenterService.openMessageCenterPage) {
          window.MessageCenterService.openMessageCenterPage();
        }
      }
    }
  }
}

// Auto update badge on DOM ready
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    updateNotificationBadge();
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    const panel = document.getElementById("navNotificationPanel");
    if (panel && panel.style.display === "block") {
      positionNotificationPanel(panel);
    }
  });
}

// ربط كافة الخدمات بالـ Window للوصول المباشر في جميع أجزاء الصفحة
if (typeof window !== "undefined") {
  window.showToast = showToast;
  window.showSuccessToast = showSuccessToast;
  window.showErrorToast = showErrorToast;
  window.showWarningToast = showWarningToast;
  window.showInfoToast = showInfoToast;
  window.showLoadingToast = showLoadingToast;
  window.showConfirmDialog = showConfirmDialog;
  window.showInputDialog = showInputDialog;
  window.showLoadingDialog = showLoadingDialog;
  window.showCustomAlert = showCustomAlert;
  window.notify = notify;
  window.getNotifications = getNotifications;
  window.addNotification = addNotification;
  window.markNotificationAsRead = markNotificationAsRead;
  window.markAllNotificationsAsRead = markAllNotificationsAsRead;
  window.deleteNotification = deleteNotification;
  window.updateNotificationBadge = updateNotificationBadge;
  window.toggleNotificationPanel = toggleNotificationPanel;
  window.handleNotifItemClick = handleNotifItemClick;
}

