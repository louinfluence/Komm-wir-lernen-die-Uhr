// Menüsteuerung & Modi
const sideMenu = document.getElementById("sideMenu");
const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const modeToggle = document.getElementById("modeToggle");
const slider = document.getElementById("timeSlider");
const body = document.body;

let liveMode = false;

// --- Menü ---
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("visible");
});
closeMenu.addEventListener("click", () => {
  sideMenu.classList.remove("visible");
});

// --- Dark/Light Mode ---
modeToggle.addEventListener("click", () => {
  const isDark = body.classList.toggle("dark");
  localStorage.setItem("mode", isDark ? "dark" : "light");
});
if (localStorage.getItem("mode") === "dark") body.classList.add("dark");

// --- Slidersteuerung ---
slider.addEventListener("input", () => {
  if (!liveMode) {
    const totalMinutes = parseInt(slider.value);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTime(hours, minutes);
  }
});

// --- Radiobuttons ---
document.querySelectorAll('input[name="mode"]').forEach((el) => {
  el.addEventListener("change", () => {
    liveMode = el.value === "live";
    if (liveMode) startLiveClock();
  });
});

document.querySelectorAll('input[name="display"]').forEach((el) => {
  el.addEventListener("change", () => {
    displayMode = el.value;
    const now = new Date();
    setTime(now.getHours(), now.getMinutes());
  });
});

document.querySelectorAll('input[name="theme"]').forEach((el) => {
  el.addEventListener("change", () => {
    body.classList.toggle("dark", el.value === "dark");
  });
});

// --- Echtzeitmodus ---
let liveInterval = null;
function startLiveClock() {
  clearInterval(liveInterval);
  function update() {
    const now = new Date();
    setTime(now.getHours(), now.getMinutes());
  }
  update();
  liveInterval = setInterval(update, 10000);
}

// --- Initial ---
document.addEventListener("DOMContentLoaded", () => {
  setTime(3, 0);
});
