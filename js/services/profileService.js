import { showCustomAlert } from "../utils/helpers.js";
import { DEFAULT_AVATAR, updateUserState } from "./authService.js";
import { saveUserToStorage, setCurrentUser, getCurrentUser, findUserByEmail, getStoredUsers } from "./authStorage.js";
import { syncSidebarOverlayAndScroll } from "./sidebarService.js";
import { hideAllMainSections } from "./layoutService.js";
import {
  getPlatformOwnerCredentials,
  getTeacherTestCredentials,
  getStudentTestCredentials
} from "./permissionService.js";

let pendingProfileImage = null;

/**
 * Get current user password with fallback to role defaults
 */
export function getCurrentUserPassword() {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.password) {
    return currentUser.password;
  }
  if (window.appState?.userData?.password) {
    return window.appState.userData.password;
  }

  const email = (window.appState?.userData?.email || currentUser?.email || "").toLowerCase().trim();

  const ownerCreds = getPlatformOwnerCredentials();
  if (email === ownerCreds.email || email === "owner@gmail.com" || email === "2005eaja@gmail.com") {
    return ownerCreds.password;
  }

  const teacherCreds = getTeacherTestCredentials();
  if (email === teacherCreds.email || email === "teacher@gmail.com" || email === "evip4158@gmail.com") {
    return teacherCreds.password;
  }

  const studentCreds = getStudentTestCredentials();
  if (email === studentCreds.email || email === "student@gmail.com" || email === "etak5806@gmail.com") {
    return studentCreds.password;
  }

  return currentUser?.password || "Eslam@301";
}

/**
 * Update currently logged-in user password in storage
 */
export function updateCurrentUserPassword(newPassword) {
  const currentUser = getCurrentUser() || {};
  currentUser.password = newPassword;

  if (!window.appState) window.appState = {};
  if (!window.appState.userData) window.appState.userData = {};
  window.appState.userData.password = newPassword;

  const email = (currentUser.email || window.appState.userData.email || "").toLowerCase().trim();
  const users = getStoredUsers();
  const foundIndex = users.findIndex((u) => u.email && u.email.toLowerCase() === email);
  if (foundIndex !== -1) {
    users[foundIndex].password = newPassword;
  } else if (email) {
    users.push({ ...currentUser, password: newPassword });
  }

  saveUserToStorage({ ...currentUser, password: newPassword });
  setCurrentUser({ ...currentUser, password: newPassword });
}

/**
 * Render the dedicated Edit Profile Page
 */
export function renderProfilePage() {
  const isLoggedIn = window.appState?.isLoggedIn;
  if (!isLoggedIn) {
    showCustomAlert("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
    if (window.showLogin) window.showLogin();
    return;
  }

  const userRole = window.appState?.userRole || "student";
  const targetHash = userRole === "teacher" ? "#teacher/profile" : (userRole === "owner" ? "#owner/profile" : "#student/profile");

  if (window.location.hash !== targetHash) {
    history.replaceState(null, "", targetHash);
  }

  // Close profile sidebar if open
  const profileSidebar = document.getElementById("profileSidebar");
  if (profileSidebar && profileSidebar.classList.contains("show")) {
    profileSidebar.classList.remove("show");
    syncSidebarOverlayAndScroll();
  }

  // Hide all main sections
  if (typeof window !== "undefined" && typeof window.hideAllMainSections === "function") {
    window.hideAllMainSections();
  } else {
    hideAllMainSections();
  }

  // Show edit profile page
  const editProfilePage = document.getElementById("editProfilePage");
  if (editProfilePage) {
    editProfilePage.classList.remove("hidden");
  }

  // Reset form and error messages
  clearProfileErrors();
  pendingProfileImage = null;

  // Clear password inputs and strength widget
  const currentInput = document.getElementById("currentPassword");
  const newInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");
  if (currentInput) currentInput.value = "";
  if (newInput) newInput.value = "";
  if (confirmInput) confirmInput.value = "";
  const pwdStrengthWrapper = document.getElementById("pwdStrengthWrapper");
  if (pwdStrengthWrapper) pwdStrengthWrapper.classList.add("hidden");

  const userData = window.appState?.userData || {};
  const userImage = userData.image || DEFAULT_AVATAR;
  const userName = userData.name || "";
  const userEmail = userData.email || "";

  // Populate avatar and inputs
  const avatarImg = document.getElementById("editProfileAvatarImg");
  if (avatarImg) {
    avatarImg.src = userImage;
    avatarImg.onerror = function () {
      this.src = DEFAULT_AVATAR;
    };
  }

  const nameInput = document.getElementById("editFullName");
  if (nameInput) nameInput.value = userName;

  const emailInput = document.getElementById("editEmail");
  if (emailInput) emailInput.value = userEmail;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Trigger file selector for avatar image
 */
export function triggerEditProfileImageUpload() {
  const fileInput = document.getElementById("editProfileImageInput");
  if (fileInput) fileInput.click();
}

/**
 * Handle avatar image file selection
 */
export function handleEditProfileImageChange(event) {
  const file = event.target?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showCustomAlert("من فضلك اختر صورة صحيحة (JPG, PNG)");
    return;
  }

  // 2MB limit
  if (file.size > 2 * 1024 * 1024) {
    showCustomAlert("حجم الصورة يجب ألا يتجاوز 2 ميجابايت");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    pendingProfileImage = e.target.result;
    const avatarImg = document.getElementById("editProfileAvatarImg");
    if (avatarImg) {
      avatarImg.src = pendingProfileImage;
    }
  };
  reader.readAsDataURL(file);
}

/**
 * Clear all profile inline error messages
 */
function clearProfileErrors() {
  const errorElements = [
    "editFullNameError",
    "editEmailError",
    "currentPasswordError",
    "newPasswordError",
    "confirmNewPasswordError"
  ];
  errorElements.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

/**
 * Cancel profile editing and return to home view
 */
export function cancelEditProfile() {
  clearProfileErrors();
  pendingProfileImage = null;

  // Restore fields
  const userData = window.appState?.userData || {};
  const nameInput = document.getElementById("editFullName");
  if (nameInput) nameInput.value = userData.name || "";

  const emailInput = document.getElementById("editEmail");
  if (emailInput) emailInput.value = userData.email || "";

  const avatarImg = document.getElementById("editProfileAvatarImg");
  if (avatarImg) avatarImg.src = userData.image || DEFAULT_AVATAR;

  // Clear password inputs
  const currentInput = document.getElementById("currentPassword");
  const newInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");
  if (currentInput) currentInput.value = "";
  if (newInput) newInput.value = "";
  if (confirmInput) confirmInput.value = "";
  const pwdStrengthWrapper = document.getElementById("pwdStrengthWrapper");
  if (pwdStrengthWrapper) pwdStrengthWrapper.classList.add("hidden");

  // Hide edit profile page
  const editProfilePage = document.getElementById("editProfilePage");
  if (editProfilePage) {
    editProfilePage.classList.add("hidden");
  }

  // Show home page
  if (window.showHomeSection) {
    window.showHomeSection("home");
  }
  window.location.hash = "#home";
}

/**
 * Save updated profile details
 */
export function saveEditProfile() {
  try {
    clearProfileErrors();

    const nameInput = document.getElementById("editFullName");
    const emailInput = document.getElementById("editEmail");

    const fullName = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim().toLowerCase() : "";

    let hasError = false;

    // 1. Validate Full Name
    if (!fullName || fullName.length < 2) {
      const err = document.getElementById("editFullNameError");
      if (err) err.textContent = "الاسم الكامل مطلوب ويجب أن يتكون من حرفين على الأقل";
      hasError = true;
    }

    // 2. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const err = document.getElementById("editEmailError");
      if (err) err.textContent = "يرجى إدخال بريد إلكتروني صحيح";
      hasError = true;
    }

    if (hasError) return;

    // Save changes to window.appState
    if (!window.appState.userData) {
      window.appState.userData = {};
    }

    const oldEmail = window.appState.userData.email || "";

    window.appState.userData.name = fullName;
    window.appState.userData.email = email;

    if (pendingProfileImage) {
      window.appState.userData.image = pendingProfileImage;
    }

    const role = window.appState.userRole || window.appState.userData.role || "student";
    const avatar = window.appState.userData.image || DEFAULT_AVATAR;

    // Retrieve stored user object to retain extra metadata (phone, birthdate, etc.)
    const existingStoredUser = getCurrentUser() || (oldEmail ? findUserByEmail(oldEmail) : null) || {};

    const updatedUserObj = {
      ...existingStoredUser,
      fullName: fullName,
      name: fullName,
      email: email,
      avatar: avatar,
      image: avatar,
      accountType: role,
      role: role
    };

    // Save user object
    saveUserToStorage(updatedUserObj);
    setCurrentUser(updatedUserObj);

    // Reset pending image
    pendingProfileImage = null;

    // Update app UI immediately across all elements
    updateUserState();

    // Ensure edit profile page fields reflect new state
    const avatarImg = document.getElementById("editProfileAvatarImg");
    if (avatarImg) avatarImg.src = avatar;

    showCustomAlert("✅ تم حفظ التغييرات بنجاح");
  } catch (error) {
    console.error("Error saving edit profile:", error);
    showCustomAlert("❌ حدث خطأ أثناء حفظ التغييرات");
  }
}

/**
 * Calculate Password Strength Score & Checklist Status
 */
export function calculatePasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      text: "ضعيفة جداً",
      levelClass: "very-weak",
      isStrongEnough: false,
      lengthOk: false,
      upperOk: false,
      lowerOk: false,
      numberOk: false,
      specialOk: false
    };
  }

  const lengthOk = password.length >= 8;
  const upperOk = /[A-Z]/.test(password);
  const lowerOk = /[a-z]/.test(password);
  const numberOk = /[0-9]/.test(password);
  const specialOk = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (lengthOk) score += 1;
  if (password.length >= 12) score += 1;
  if (upperOk) score += 1;
  if (lowerOk) score += 1;
  if (numberOk) score += 1;
  if (specialOk) score += 1;

  let text = "ضعيفة جداً";
  let levelClass = "very-weak";

  if (score <= 2) {
    text = "ضعيفة جداً";
    levelClass = "very-weak";
  } else if (score === 3) {
    text = "ضعيفة";
    levelClass = "weak";
  } else if (score === 4) {
    text = "متوسطة";
    levelClass = "medium";
  } else if (score === 5) {
    text = "قوية";
    levelClass = "strong";
  } else {
    text = "قوية جداً";
    levelClass = "very-strong";
  }

  const isStrongEnough = lengthOk && upperOk && lowerOk && numberOk && specialOk;

  return {
    score,
    text,
    levelClass,
    isStrongEnough,
    lengthOk,
    upperOk,
    lowerOk,
    numberOk,
    specialOk
  };
}

/**
 * Real-time update for New Password input
 */
export function handleNewPasswordInput(value) {
  const container = document.getElementById("pwdStrengthWrapper");
  const textEl = document.getElementById("pwdStrengthText");
  const barEl = document.getElementById("pwdStrengthBarFill");

  if (!value) {
    if (container) container.classList.add("hidden");
    const newErr = document.getElementById("newPasswordError");
    if (newErr) newErr.textContent = "";
    return;
  }

  if (container) container.classList.remove("hidden");

  const result = calculatePasswordStrength(value);

  if (textEl) textEl.textContent = result.text;
  if (barEl) {
    barEl.className = "pwd-strength-bar-fill " + result.levelClass;
  }

  const ruleLen = document.getElementById("ruleLength");
  const ruleUp = document.getElementById("ruleUpper");
  const ruleLow = document.getElementById("ruleLower");
  const ruleNum = document.getElementById("ruleNumber");
  const ruleSpec = document.getElementById("ruleSpecial");

  if (ruleLen) ruleLen.classList.toggle("valid", result.lengthOk);
  if (ruleUp) ruleUp.classList.toggle("valid", result.upperOk);
  if (ruleLow) ruleLow.classList.toggle("valid", result.lowerOk);
  if (ruleNum) ruleNum.classList.toggle("valid", result.numberOk);
  if (ruleSpec) ruleSpec.classList.toggle("valid", result.specialOk);

  const newErr = document.getElementById("newPasswordError");
  if (newErr) newErr.textContent = "";
}

/**
 * Real-time update for Confirm New Password input
 */
export function handleConfirmPasswordInput(value) {
  const newPwd = document.getElementById("newPassword")?.value || "";
  const errEl = document.getElementById("confirmNewPasswordError");
  if (errEl) {
    if (value && value !== newPwd) {
      errEl.textContent = "كلمتا المرور غير متطابقتين";
    } else {
      errEl.textContent = "";
    }
  }
}

/**
 * Handle Change Password Submission
 */
export function handleChangePassword() {
  const currentInput = document.getElementById("currentPassword");
  const newInput = document.getElementById("newPassword");
  const confirmInput = document.getElementById("confirmNewPassword");

  const currentErr = document.getElementById("currentPasswordError");
  const newErr = document.getElementById("newPasswordError");
  const confirmErr = document.getElementById("confirmNewPasswordError");

  if (currentErr) currentErr.textContent = "";
  if (newErr) newErr.textContent = "";
  if (confirmErr) confirmErr.textContent = "";

  const currentVal = currentInput ? currentInput.value.trim() : "";
  const newVal = newInput ? newInput.value.trim() : "";
  const confirmVal = confirmInput ? confirmInput.value.trim() : "";

  let hasError = false;

  // 1. Check empty fields
  if (!currentVal) {
    if (currentErr) currentErr.textContent = "يرجى إدخال كلمة المرور الحالية";
    hasError = true;
  }

  if (!newVal) {
    if (newErr) newErr.textContent = "يرجى إدخال كلمة المرور الجديدة";
    hasError = true;
  }

  if (!confirmVal) {
    if (confirmErr) confirmErr.textContent = "يرجى تأكيد كلمة المرور الجديدة";
    hasError = true;
  }

  if (hasError) return;

  // 2. Validate current password against user account
  const storedPass = getCurrentUserPassword();
  if (currentVal !== storedPass) {
    if (currentErr) currentErr.textContent = "كلمة المرور الحالية غير صحيحة";
    hasError = true;
  }

  // 3. New password must be different from current password
  if (newVal === currentVal) {
    if (newErr) newErr.textContent = "كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية";
    hasError = true;
  }

  // 4. Validate complexity rules
  const strength = calculatePasswordStrength(newVal);
  if (!strength.isStrongEnough) {
    if (newErr) {
      if (!strength.lengthOk) {
        newErr.textContent = "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل";
      } else {
        newErr.textContent = "كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، ورمز خاص";
      }
    }
    hasError = true;
  }

  // 5. Confirm password match
  if (newVal !== confirmVal) {
    if (confirmErr) confirmErr.textContent = "كلمتا المرور غير متطابقتين";
    hasError = true;
  }

  if (hasError) return;

  // Disable button while processing to prevent double submission
  const submitBtn = document.getElementById("btnChangePassword");
  if (submitBtn) {
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = "جاري الحفظ...";
  }

  setTimeout(() => {
    try {
      updateCurrentUserPassword(newVal);

      if (currentInput) currentInput.value = "";
      if (newInput) newInput.value = "";
      if (confirmInput) confirmInput.value = "";

      const strengthWrapper = document.getElementById("pwdStrengthWrapper");
      if (strengthWrapper) strengthWrapper.classList.add("hidden");

      showCustomAlert("✅ تم تغيير كلمة المرور بنجاح");
    } catch (err) {
      console.error("Error changing password:", err);
      showCustomAlert("❌ حدث خطأ غير متوقع أثناء تغيير كلمة المرور");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const btnText = submitBtn.querySelector(".btn-text");
        if (btnText) btnText.textContent = "تغيير كلمة المرور";
      }
    }
  }, 300);
}

