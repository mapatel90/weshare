let sidebarCollapsed = false;

function toggleSidebar() {
  const textSidebar = document.getElementById("textSidebar");
  const mainContent = document.getElementById("mainContent");
  const toggleBtn = document.querySelector(".toggle-btn");

  sidebarCollapsed = !sidebarCollapsed;

  if (sidebarCollapsed) {
    textSidebar.classList.add("collapsed");
    mainContent.classList.add("expanded");
    toggleBtn.innerHTML = "❯";
  } else {
    textSidebar.classList.remove("collapsed");
    mainContent.classList.remove("expanded");
    toggleBtn.innerHTML = "❮";
  }
}

function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  const arrow = element.querySelector("span:last-child");

  if (submenu && submenu.classList.contains("submenu")) {
    submenu.classList.toggle("show");
    arrow.innerHTML = submenu.classList.contains("show") ? "▼" : "▶";
  }

  // Toggle active state
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });
  element.classList.add("active");
}

// Icon sidebar click handlers
document.querySelectorAll(".icon-item:not(.support)").forEach((item) => {
  item.addEventListener("click", function () {
    document.querySelectorAll(".icon-item").forEach((i) => {
      if (!i.classList.contains("support")) {
        i.classList.remove("active");
      }
    });
    this.classList.add("active");
  });
});

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", function () {
    const parent = this.closest(".tabs");
    parent
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    this.classList.add("active");
  });
});

// Bar chart hover effects
document.querySelectorAll(".bar").forEach((bar) => {
  bar.addEventListener("mouseenter", function () {
    this.style.transform = "scaleY(1.05)";
  });
  bar.addEventListener("mouseleave", function () {
    this.style.transform = "scaleY(1)";
  });
});

// Animate stats on load
window.addEventListener("load", () => {
  document.querySelectorAll(".stat-card").forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "all 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 100);
  });
});
