// ----------------------------
// MAIN.JS – UI & Menülogik
// ----------------------------

const body = document.body;
const sideMenu = document.getElementById("sideMenu");
const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const modeToggle = document.getElementById("modeToggle");

// --- Menü öffnen/schließen ---
menuToggle.addEventListener("click", toggleMenu);
closeMenu.addEventListener("click", toggleMenu);

function toggleMenu() {
  sideMenu.classList.toggle("visible");
}

// --- Dark-/Light-Mode ---
modeToggle.addEventListener("click", toggleMode);

function toggleMode() {
  const isDark = body.classList.toggle("dark");
  localStorage.setItem("mode", isDark ? "dark" : "light");
}

// --- Modus beim Laden aktivieren ---
document.addEventListener("DOMContentLoaded", () => {
  const savedMode = localStorage.getItem("mode");
  if (savedMode === "dark") body.classList.add("dark");
});
