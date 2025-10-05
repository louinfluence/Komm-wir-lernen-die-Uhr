// ----------------------------
// MAIN.JS – UI & Menülogik
// ----------------------------

const body = document.body;
const sideMenu = document.getElementById("sideMenu");
const menuToggle = document.getElementById("menuToggle");
const modeToggle = document.getElementById("modeToggle");

// Menü öffnen/schließen
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("visible");
});

// Dark-/Light-Mode umschalten
modeToggle.addEventListener("click", toggleMode);

function toggleMode() {
  const isDark = body.classList.toggle("dark");
  localStorage.setItem("mode", isDark ? "dark" : "light");
}

// beim Laden gespeicherten Modus aktivieren
document.addEventListener("DOMContentLoaded", () => {
  const savedMode = localStorage.getItem("mode");
  if (savedMode === "dark") body.classList.add("dark");
});
