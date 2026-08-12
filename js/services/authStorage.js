/**
 * Isolated Client-Side Auth Storage Service (localStorage for development)
 * Can easily be replaced with a real API service later without modifying UI.
 */

const USERS_KEY = "studymart_users";
const CURRENT_USER_KEY = "studymart_current_user";

function sanitizeUserForStorage(user, forceLightweight = false) {
  if (!user || typeof user !== "object") return user;
  const clone = { ...user };

  // Strip or replace very long data URIs (e.g. uploaded avatars) if they exceed threshold or if forced
  if (clone.avatar && (forceLightweight || clone.avatar.length > 2000)) {
    delete clone.avatar;
  }
  if (clone.image && (forceLightweight || clone.image.length > 2000)) {
    delete clone.image;
  }
  if (forceLightweight && Array.isArray(clone.courses)) {
    clone.courses = clone.courses.map((c) =>
      typeof c === "object" && c ? { id: c.id, title: c.title } : c
    );
  }
  return clone;
}

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading users from localStorage:", err);
    return [];
  }
}

export function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  return users.find((u) => u.email && u.email.toLowerCase() === cleanEmail) || null;
}

export function saveUserToStorage(user) {
  try {
    const users = getStoredUsers();
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : "";
    const filtered = users.filter((u) => u.email && u.email.toLowerCase() !== cleanEmail);
    const sanitized = sanitizeUserForStorage(user);
    filtered.push({
      ...sanitized,
      email: cleanEmail
    });

    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
    } catch (quotaErr) {
      console.warn("Storage quota exceeded in saveUserToStorage, pruning avatars...", quotaErr);
      const lightweightUsers = filtered.map((u) => sanitizeUserForStorage(u, true));
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(lightweightUsers));
      } catch (e2) {
        console.error("Could not save users list to localStorage even after pruning:", e2);
      }
    }
  } catch (err) {
    console.error("Error saving user to localStorage:", err);
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error reading current user from localStorage:", err);
    return null;
  }
}

export function setCurrentUser(user) {
  try {
    if (user) {
      const sanitized = sanitizeUserForStorage(user);
      try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitized));
      } catch (quotaErr) {
        console.warn("Storage quota exceeded in setCurrentUser, saving lightweight user...", quotaErr);
        const lightweight = sanitizeUserForStorage(user, true);
        try {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(lightweight));
        } catch (e2) {
          console.error("Could not set current user in localStorage even after pruning:", e2);
        }
      }
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error("Error setting current user in localStorage:", err);
  }
}

export function removeCurrentUser() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch (err) {
    console.error("Error removing current user from localStorage:", err);
  }
}
