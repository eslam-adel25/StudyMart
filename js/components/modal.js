import { showCustomAlert } from "../utils/helpers.js";
import { PAYMENT_METHODS } from "../utils/constants.js";

const modalOverlayId = "modal-overlay";

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
  }
}

export function showPaymentOverlay(content) {
  const existing = document.getElementById("floatingModalOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "floatingModalOverlay";
  overlay.className = "floating-modal-overlay";
  overlay.innerHTML = `
    <div class="floating-modal-box">
      ${content}
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function createPaymentForm(formHtml) {
  const overlay = showPaymentOverlay(formHtml);
  return overlay;
}

export function renderPaymentOptions(onOptionSelect) {
  const content = `
    <div class="floating-modal-box payment-options-box">
      <h3>اختر طريقة الدفع</h3>
      <button type="button" class="btn btn-secondary" data-method="${PAYMENT_METHODS.card}">💳 بطاقة ائتمان</button>
      <button type="button" class="btn btn-secondary" data-method="${PAYMENT_METHODS.vodafone}">📞 فودافون كاش</button>
    </div>
  `;

  const overlay = showPaymentOverlay(content);
  overlay.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-method]");
    if (!button) return;
    const method = button.dataset.method;
    onOptionSelect(method);
  });

  return overlay;
}

export function renderFileSelectionInput(id, onChange) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.id = id;
  input.style.display = "none";
  input.addEventListener("change", onChange);
  document.body.appendChild(input);
  return input;
}

export function showSimpleAlert(message) {
  showCustomAlert(message);
}
