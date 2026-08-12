// Navigation History Service - Centralized Real Navigation History Manager for StudyMart

let navHistory = []; // Array of in-app history entries: { hash: string, scrollY: number }
let isNavigatingBack = false;
let currentTrackedHash = typeof window !== "undefined" ? getNormalizedHash(window.location.hash) : "#home";

const ROOT_HASHES = ["#home", "#/home", "#", "", "#/"];

function getNormalizedHash(rawHash) {
  if (!rawHash) return "#home";
  const h = String(rawHash).trim();
  if (h === "#" || h === "#/" || h === "") return "#home";
  return h;
}

export function initNavigationHistory() {
  if (typeof window === "undefined") return;

  currentTrackedHash = getNormalizedHash(window.location.hash);

  // Patch history.pushState and history.replaceState to capture programmatic navigation
  if (!window._navHistoryPatched) {
    window._navHistoryPatched = true;

    const origPushState = window.history.pushState;
    window.history.pushState = function (data, unused, url) {
      const result = origPushState.apply(this, arguments);
      if (url) {
        handleRouteTransition(url, "push");
      }
      return result;
    };

    const origReplaceState = window.history.replaceState;
    window.history.replaceState = function (data, unused, url) {
      const result = origReplaceState.apply(this, arguments);
      if (url) {
        handleRouteTransition(url, "replace");
      }
      return result;
    };
  }

  // Listen for native browser hashchange and popstate events
  window.addEventListener("hashchange", () => {
    handleRouteTransition(window.location.hash, "hashchange");
  });

  window.addEventListener("popstate", () => {
    handleRouteTransition(window.location.hash, "popstate");
  });

  updateGlobalBackUI();
}

function handleRouteTransition(targetUrlOrHash, mode) {
  let targetHash = "#home";
  if (targetUrlOrHash) {
    if (typeof targetUrlOrHash === "string" && targetUrlOrHash.includes("#")) {
      targetHash = "#" + targetUrlOrHash.split("#")[1];
    } else if (typeof targetUrlOrHash === "string" && targetUrlOrHash.startsWith("#")) {
      targetHash = targetUrlOrHash;
    } else {
      targetHash = getNormalizedHash(window.location.hash);
    }
  } else {
    targetHash = getNormalizedHash(window.location.hash);
  }

  targetHash = getNormalizedHash(targetHash);

  if (targetHash === currentTrackedHash) {
    updateGlobalBackUI();
    return;
  }

  if (isNavigatingBack) {
    currentTrackedHash = targetHash;
    updateGlobalBackUI();
    return;
  }

  if (mode === "replace") {
    currentTrackedHash = targetHash;
    updateGlobalBackUI();
    return;
  }

  // Record previous location in stack if moving to a new route
  if (currentTrackedHash) {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const lastEntry = navHistory[navHistory.length - 1];

    if (!lastEntry || lastEntry.hash !== currentTrackedHash) {
      navHistory.push({
        hash: currentTrackedHash,
        scrollY: scrollY
      });
      if (navHistory.length > 50) {
        navHistory.shift();
      }
    }
  }

  currentTrackedHash = targetHash;
  updateGlobalBackUI();
}

export function handleGlobalBack(event) {
  if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }

  if (navHistory.length === 0) {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = "#home";
    }
    return;
  }

  const prev = navHistory.pop();
  if (!prev) return;

  isNavigatingBack = true;

  const targetHash = prev.hash;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  } else {
    if (typeof window.handleRoleRouteProtection === "function") {
      window.handleRoleRouteProtection();
    }
  }

  // Restore scroll position
  if (typeof prev.scrollY === "number" && prev.scrollY >= 0) {
    const sY = prev.scrollY;
    requestAnimationFrame(() => {
      window.scrollTo({ top: sY, behavior: "instant" });
    });
    setTimeout(() => {
      window.scrollTo({ top: sY, behavior: "instant" });
    }, 60);
  }

  setTimeout(() => {
    isNavigatingBack = false;
    updateGlobalBackUI();
  }, 120);
}

export function updateGlobalBackUI() {
  if (typeof document === "undefined") return;

  const btn = document.getElementById("globalBackBtn");
  if (!btn) return;

  const current = getNormalizedHash(window.location.hash);
  const isRoot = ROOT_HASHES.includes(current);

  const canGoBack = navHistory.length > 0;

  if (canGoBack && !isRoot) {
    btn.classList.remove("hidden");
    btn.style.display = "inline-flex";
  } else {
    btn.classList.add("hidden");
    btn.style.display = "none";
  }
}

if (typeof window !== "undefined") {
  window.handleGlobalBack = handleGlobalBack;
  window.updateGlobalBackUI = updateGlobalBackUI;
}
