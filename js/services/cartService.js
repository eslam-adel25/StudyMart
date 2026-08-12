import { showCustomAlert, showConfirmDialog, showSuccessToast } from "../utils/helpers.js";
import { syncSidebarOverlayAndScroll } from "./sidebarService.js";
import { renderPaymentOptions } from "./paymentService.js";

export function setupCart() {
  document.addEventListener("cartUpdated", () => {
    updateCartUI();
  });

  loadCart();
}

export function toggleCart(event) {
  if (event) {
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
  }
  const cart = document.getElementById("cartSidebar");
  if (!cart) return;

  const willShow = !cart.classList.contains("show");
  document.querySelectorAll(".profile-sidebar, .sidebar-drawer").forEach((s) => s.classList.remove("show"));

  if (willShow) {
    cart.classList.add("show");
  } else {
    cart.classList.remove("show");
  }
  syncSidebarOverlayAndScroll();
}

export function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const cartItemsState = window.appState ? window.appState.cart : [];

  if (cartCount) cartCount.textContent = cartItemsState.length;

  if (cartItems) {
    if (cartItemsState.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart-container" style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 12px; line-height: 1;">🛒</div>
          <p style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">سلة المشتريات فارغة</p>
          <p style="font-size: 13px; margin-bottom: 20px; color: #94a3b8;">ابدأ بإضافة بعض المنتجات.</p>
          <button type="button" class="btn btn-outline-cart-close" onclick="toggleCart(event)" style="padding: 9px 20px; font-size: 13px; border-radius: 8px; font-weight: 600; cursor: pointer;">متابعة التسوق</button>
        </div>
      `;
      if (cartTotal) cartTotal.textContent = "0";
      return;
    }

    let total = 0;
    cartItems.innerHTML = cartItemsState
      .map((item, index) => {
        total += item.price;
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <h4>${item.title}</h4>
              <p>$${item.price}</p>
            </div>
            <button class="cart-item-remove" type="button" data-remove-index="${index}">حذف</button>
          </div>
        `;
      })
      .join("");

    if (cartTotal) cartTotal.textContent = total;
    cartItems
      .querySelectorAll("button[data-remove-index]")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          removeFromCart(Number(button.dataset.removeIndex));
        });
      });
  }
}

export function saveCart() {
  if (window.appState) {
    localStorage.setItem("cart", JSON.stringify(window.appState.cart));
  }
}

export function loadCart() {
  const saved = localStorage.getItem("cart");
  if (saved && window.appState) {
    try {
      window.appState.cart = JSON.parse(saved);
    } catch {
      window.appState.cart = [];
    }
  }
  updateCartUI();
}

export function hasItemInCart(id) {
  return window.appState ? window.appState.cart.some((item) => item.id === id) : false;
}

export async function removeFromCart(index) {
  if (window.appState) {
    const item = window.appState.cart[index];
    const confirmed = await showConfirmDialog({
      title: "تأكيد الحذف من السلة",
      message: `هل أنت تأكد من رغبتك في حذف "${item?.title || 'هذا العنصر'}" من السلة؟`,
      confirmText: "حذف",
      cancelText: "إلغاء",
      danger: true
    });
    if (!confirmed) return;

    window.appState.cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showSuccessToast({ title: "تمت الإزالة", message: "تم حذف العنصر من السلة بنجاح." });
  }
}

export function checkout() {
  const cartItems = window.appState ? window.appState.cart : [];
  if (cartItems.length === 0) {
    showCustomAlert("السلة فارغة");
    return;
  }

  const modal = document.getElementById("checkoutModal");
  if (!modal) return;

  renderPaymentOptions();
  modal.classList.add("show");
}

export function computeCartTotal() {
  const cart = window.appState ? window.appState.cart : [];
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  if (subtotal === 0) return 40;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  return Math.round((subtotal + tax) * 100) / 100;
}

export function closeCheckout() {
  document.getElementById("checkoutModal")?.classList.remove("show");
}

export function completePayment() {
  if (window.appState) {
    window.appState.cart.forEach((item) => {
      if (item.type === "course" || !item.type) {
        if (!window.appState.userCourses.includes(item.id)) {
          window.appState.userCourses.push(item.id);
        }
      } else if (item.type === "book") {
        const customBooks = JSON.parse(localStorage.getItem("studymart_custom_books") || "[]");
        const allBooks = [...(window.booksData || []), ...customBooks];
        const found = allBooks.find((b) => String(b.id) === String(item.id));
        const bookObj = found
          ? {
              id: found.id,
              title: found.title,
              author: found.author || "غير معروف",
              pages: found.pages || 0,
              category: found.category || "عام"
            }
          : {
              id: item.id,
              title: item.title,
              author: item.author || "غير معروف",
              pages: item.pages || 0
            };
        if (!window.appState.userPurchasedBooks.some((b) => String(b.id) === String(item.id))) {
          window.appState.userPurchasedBooks.push(bookObj);
        }
      }
    });

    window.appState.cart = [];
    saveCart();
    updateCartUI();

    try {
      localStorage.setItem("userCourses", JSON.stringify(window.appState.userCourses));
      if (typeof window.saveUserPurchasedBooks === "function") {
        window.saveUserPurchasedBooks(window.appState.userPurchasedBooks);
      } else {
        const cleanBooks = window.appState.userPurchasedBooks.map((b) => {
          if (!b || typeof b !== "object") return b;
          const { fileDataUrl, previewFileDataUrl, fileBlob, pdfData, content, ...clean } = b;
          return clean;
        });
        localStorage.setItem("userPurchasedBooks", JSON.stringify(cleanBooks));
      }
    } catch (e) {
      console.error(e);
    }

    if (typeof window.notifyCourseSystemUpdated === "function") {
      window.notifyCourseSystemUpdated();
    }
  }
  document.getElementById("checkoutModal")?.classList.remove("show");
  document.getElementById("cartSidebar")?.classList.remove("show");
  syncSidebarOverlayAndScroll();
  showCustomAlert("تم الدفع بنجاح!");
}
