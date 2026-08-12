export function setupSeoModal() {
  const overlay = document.getElementById("modal-overlay");
  const modalContent = document.getElementById("modal-content");

  if (!overlay || !modalContent) return;

  window.openArticlesModal = async () => {
    try {
      const response = await fetch("assets/articles.html");
      const data = await response.text();
      modalContent.innerHTML = data;
      overlay.style.display = "flex";
    } catch (error) {
      console.error("Error loading articles modal:", error);
    }
  };

  const openSeo = document.getElementById("openSeo");
  if (openSeo) {
    openSeo.addEventListener("click", (event) => {
      event.preventDefault();
      window.openArticlesModal();
    });
  }
}
