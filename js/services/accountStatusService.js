import { showCustomAlert } from "../utils/helpers.js";

const ACCOUNT_STATUS_STORAGE_KEY = "studymart_account_statuses_v1";
const SUPPORT_EMAIL = "eslam.adel2596@gmail.com";
const SUPPORT_PHONE = "01153054568";

export function getSupportContactInfo() {
  return {
    email: SUPPORT_EMAIL,
    phone: SUPPORT_PHONE
  };
}

/**
 * Normalizes email or user ID for uniform status lookup
 */
function normalizeIdentifier(idOrEmail) {
  if (!idOrEmail) return "";
  let key = "";
  if (typeof idOrEmail === "object") {
    key = (idOrEmail.email || idOrEmail.id || idOrEmail.username || "").toString().trim().toLowerCase();
  } else {
    key = idOrEmail.toString().trim().toLowerCase();
  }

  // Canonical alias resolution for student test account
  if (
    key === "std-101" ||
    key === "student@gmail.com" ||
    key === "etak5806@gmail.com" ||
    key === "ahmed.mahmoud@gmail.com"
  ) {
    return "etak5806@gmail.com";
  }

  // Canonical alias resolution for teacher test account
  if (
    key === "teacher-1" ||
    key === "teacher@gmail.com" ||
    key === "evip4158@gmail.com"
  ) {
    return "evip4158@gmail.com";
  }

  return key;
}

/**
 * Gets account status for a given user or identifier
 * Returns "ACTIVE", "BLOCKED", or "SUSPENDED"
 */
export function getAccountStatus(idOrEmail) {
  const normKey = normalizeIdentifier(idOrEmail);
  if (!normKey) return "ACTIVE";

  // Platform owner is never blocked
  if (
    normKey === "2005eaja@gmail.com" ||
    normKey === "owner@gmail.com" ||
    normKey === "owner"
  ) {
    return "ACTIVE";
  }

  // 1. Check central account status storage
  try {
    const raw = localStorage.getItem(ACCOUNT_STATUS_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[normKey]) return map[normKey];
      for (const k in map) {
        if (k === normKey) return map[k];
      }
    }
  } catch (e) {}

  // 2. Check studentsData storage (`lms_enrolled_students_v1`)
  try {
    const rawStudents = localStorage.getItem("lms_enrolled_students_v1");
    if (rawStudents) {
      const students = JSON.parse(rawStudents);
      const student = students.find(s => 
        String(s.id).toLowerCase() === normKey || 
        (s.email && s.email.toLowerCase() === normKey)
      );
      if (student) {
        if (student.status === "Blocked" || student.isBlocked) return "BLOCKED";
      }
    }
  } catch (e) {}

  // 3. Check teacher overrides storage (`lms_owner_teachers_v1`)
  try {
    const rawTeachers = localStorage.getItem("lms_owner_teachers_v1");
    if (rawTeachers) {
      const teacherOverrides = JSON.parse(rawTeachers);
      for (const tid in teacherOverrides) {
        const ov = teacherOverrides[tid];
        if (
          tid.toLowerCase() === normKey ||
          (ov.email && ov.email.toLowerCase() === normKey)
        ) {
          if (ov.status === "Suspended" || ov.status === "Blocked") return "SUSPENDED";
        }
      }
      if (
        (normKey === "teacher@gmail.com" || normKey === "evip4158@gmail.com") &&
        teacherOverrides["teacher-1"] &&
        (teacherOverrides["teacher-1"].status === "Suspended" || teacherOverrides["teacher-1"].status === "Blocked")
      ) {
        return "SUSPENDED";
      }
    }
  } catch (e) {}

  // 4. Check registered users storage (`studymart_users`)
  try {
    const rawUsers = localStorage.getItem("studymart_users");
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const u = users.find(usr => 
        (usr.email && usr.email.toLowerCase() === normKey) ||
        (usr.id && String(usr.id).toLowerCase() === normKey)
      );
      if (u) {
        if (u.status === "Blocked" || u.status === "Suspended" || u.isBlocked) return "BLOCKED";
      }
    }
  } catch (e) {}

  return "ACTIVE";
}

/**
 * Check if a user or identifier is blocked/suspended
 */
export function isAccountBlocked(idOrEmail) {
  const status = getAccountStatus(idOrEmail);
  return status === "BLOCKED" || status === "SUSPENDED" || status === "Blocked" || status === "Suspended";
}

/**
 * Set account status persistently and sync across all system storage keys
 */
export function setAccountStatus(identifier, status, meta = {}) {
  const normKey = normalizeIdentifier(identifier);
  if (!normKey) return;

  const targetStatus = (status || "ACTIVE").toUpperCase();

  // 1. Save in central account status map
  let map = {};
  try {
    const raw = localStorage.getItem(ACCOUNT_STATUS_STORAGE_KEY);
    if (raw) map = JSON.parse(raw);
  } catch (e) {}

  map[normKey] = targetStatus;

  if (meta.email) {
    map[meta.email.toLowerCase()] = targetStatus;
  }
  if (meta.id) {
    map[String(meta.id).toLowerCase()] = targetStatus;
  }

  // Handle student test account aliases
  if (normKey === "std-101" || meta.email === "ahmed.mahmoud@gmail.com") {
    map["student@gmail.com"] = targetStatus;
    map["etak5806@gmail.com"] = targetStatus;
    map["std-101"] = targetStatus;
  }
  if (normKey === "student@gmail.com" || normKey === "etak5806@gmail.com") {
    map["std-101"] = targetStatus;
    map["student@gmail.com"] = targetStatus;
    map["etak5806@gmail.com"] = targetStatus;
  }

  // Handle teacher test account aliases
  if (normKey === "teacher-1" || meta.email === "omar.hassan@gmail.com") {
    map["teacher@gmail.com"] = targetStatus;
    map["evip4158@gmail.com"] = targetStatus;
    map["teacher-1"] = targetStatus;
  }
  if (normKey === "teacher@gmail.com" || normKey === "evip4158@gmail.com") {
    map["teacher-1"] = targetStatus;
    map["teacher@gmail.com"] = targetStatus;
    map["evip4158@gmail.com"] = targetStatus;
  }

  localStorage.setItem(ACCOUNT_STATUS_STORAGE_KEY, JSON.stringify(map));

  // 2. Sync with `lms_enrolled_students_v1`
  try {
    const rawStudents = localStorage.getItem("lms_enrolled_students_v1");
    if (rawStudents) {
      const students = JSON.parse(rawStudents);
      let updated = false;
      students.forEach(s => {
        if (
          String(s.id).toLowerCase() === normKey ||
          (s.email && s.email.toLowerCase() === normKey) ||
          (meta.id && String(s.id).toLowerCase() === String(meta.id).toLowerCase()) ||
          (meta.email && s.email && s.email.toLowerCase() === meta.email.toLowerCase())
        ) {
          s.status = targetStatus === "ACTIVE" ? "Active" : "Blocked";
          s.isBlocked = targetStatus !== "ACTIVE";
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem("lms_enrolled_students_v1", JSON.stringify(students));
      }
    }
  } catch (e) {}

  // 3. Sync with `lms_owner_teachers_v1`
  try {
    const rawTeachers = localStorage.getItem("lms_owner_teachers_v1");
    let overrides = {};
    if (rawTeachers) overrides = JSON.parse(rawTeachers);

    const teacherId = meta.id || (normKey.startsWith("teacher-") ? normKey : null);
    if (teacherId) {
      overrides[teacherId] = {
        ...(overrides[teacherId] || {}),
        status: targetStatus === "ACTIVE" ? "Active" : "Suspended",
        email: meta.email || overrides[teacherId]?.email
      };
      localStorage.setItem("lms_owner_teachers_v1", JSON.stringify(overrides));
    }
  } catch (e) {}

  // 4. Sync with `studymart_users`
  try {
    const rawUsers = localStorage.getItem("studymart_users");
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      let updated = false;
      users.forEach(u => {
        if (
          (u.email && u.email.toLowerCase() === normKey) ||
          (u.id && String(u.id).toLowerCase() === normKey) ||
          (meta.email && u.email && u.email.toLowerCase() === meta.email.toLowerCase())
        ) {
          u.status = targetStatus === "ACTIVE" ? "Active" : "Blocked";
          u.isBlocked = targetStatus !== "ACTIVE";
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem("studymart_users", JSON.stringify(users));
      }
    }
  } catch (e) {}

  // 5. Check if currently logged in user is affected
  try {
    const currentRaw = localStorage.getItem("studymart_current_user");
    if (currentRaw) {
      const currentUser = JSON.parse(currentRaw);
      const isCurrent = 
        (currentUser.email && currentUser.email.toLowerCase() === normKey) ||
        (currentUser.id && String(currentUser.id).toLowerCase() === normKey) ||
        (meta.email && currentUser.email && currentUser.email.toLowerCase() === meta.email.toLowerCase());

      if (isCurrent && targetStatus !== "ACTIVE") {
        localStorage.removeItem("studymart_current_user");
        if (window.appState) {
          window.appState.isLoggedIn = false;
          window.appState.userData = null;
        }
        if (typeof window.updateUserState === "function") {
          window.updateUserState();
        }
        showSuspendedAccountModal();
      }
    }
  } catch (e) {}
}

/**
 * Display clean Suspended Account Modal with support contact details
 */
export function showSuspendedAccountModal(customMessage, customTitle) {
  const existingModal = document.getElementById("suspendedAccountModal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "suspendedAccountModal";
  modal.className = "suspended-account-modal-overlay";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(6px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: inherit;
  `;

  modal.innerHTML = `
    <div dir="rtl" style="
      background: #ffffff;
      border-radius: 24px;
      max-width: 480px;
      width: 100%;
      padding: 32px 28px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.25);
      border: 1px solid #fee2e2;
      text-align: center;
      position: relative;
    ">
      <div style="
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: #fef2f2;
        border: 2px solid #fecaca;
        color: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        margin: 0 auto 20px auto;
        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.15);
      ">
        🚫
      </div>

      <h2 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0;">
        ${customTitle || 'حسابك موقوف / معلق'}
      </h2>

      <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
        ${customMessage || 'تم إيقاف أو تعليق حسابك من قبل إدارة المنصة. لا يمكنك تسجيل الدخول إلى هذا الحساب في الوقت الحالي.'}
      </p>

      <div style="
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 18px 20px;
        margin-bottom: 24px;
        text-align: right;
      ">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
          <span>🎧</span> يرجى التواصل مع فريق الدعم الفني:
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13.5px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1;">
            <div style="display: flex; align-items: center; gap: 8px; color: #334155; font-weight: 600;">
              <span>✉️</span>
              <a href="mailto:${SUPPORT_EMAIL}" style="color: #7c3aed; text-decoration: none; font-weight: 700;">${SUPPORT_EMAIL}</a>
            </div>
            <button type="button" onclick="navigator.clipboard.writeText('${SUPPORT_EMAIL}'); this.textContent='تم النسخ ✓'; setTimeout(()=>this.textContent='نسخ', 2000);" style="padding: 4px 10px; border-radius: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer;">
              نسخ
            </button>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1;">
            <div style="display: flex; align-items: center; gap: 8px; color: #334155; font-weight: 600;">
              <span>📞</span>
              <a href="tel:${SUPPORT_PHONE.replace(/\s+/g, '')}" style="color: #059669; text-decoration: none; font-weight: 700; direction: ltr;">${SUPPORT_PHONE}</a>
            </div>
            <button type="button" onclick="navigator.clipboard.writeText('${SUPPORT_PHONE}'); this.textContent='تم النسخ ✓'; setTimeout(()=>this.textContent='نسخ', 2000);" style="padding: 4px 10px; border-radius: 6px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer;">
              نسخ
            </button>
          </div>

        </div>
      </div>

      <button type="button" onclick="document.getElementById('suspendedAccountModal').remove();" style="
        width: 100%;
        padding: 12px 20px;
        border-radius: 12px;
        background: #0f172a;
        color: #ffffff;
        border: none;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        حسناً، فهمت
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

if (typeof window !== "undefined") {
  window.getAccountStatus = getAccountStatus;
  window.isAccountBlocked = isAccountBlocked;
  window.setAccountStatus = setAccountStatus;
  window.showSuspendedAccountModal = showSuspendedAccountModal;
}
