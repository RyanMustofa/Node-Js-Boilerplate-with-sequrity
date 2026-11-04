const sidebar = document.querySelector("#backoffice-sidebar");
const toggle = document.querySelector("[data-sidebar-toggle]");
const closeButtons = document.querySelectorAll("[data-sidebar-close]");
const backdrop = document.querySelector(".sidebar-backdrop");
const mobileViewport = window.matchMedia("(max-width: 767.98px)");

if (sidebar && toggle && backdrop) {
  function setSidebarOpen(isOpen) {
    const shouldOpen = mobileViewport.matches && isOpen;

    sidebar.classList.toggle("is-open", shouldOpen);
    sidebar.inert = mobileViewport.matches && !shouldOpen;
    backdrop.hidden = !shouldOpen;
    document.body.classList.toggle("sidebar-open", shouldOpen);
    toggle.setAttribute("aria-expanded", String(shouldOpen));
    toggle.setAttribute("aria-label", shouldOpen ? "Tutup menu" : "Buka menu");
  }

  toggle.addEventListener("click", () => {
    setSidebarOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => setSidebarOpen(false));
  });

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setSidebarOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSidebarOpen(false);
    }
  });

  mobileViewport.addEventListener("change", () => setSidebarOpen(false));
  setSidebarOpen(false);
}
