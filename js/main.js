const sideMenu = document.getElementById("sideMenu");
const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const modeToggle = document.getElementById("modeToggle"); // Sonne/Mond oben rechts
const body = document.body;
const slider = document.getElementById("timeSlider");
const timeDisplay = document.getElementById("timeDisplay");

const modeSwitch = document.getElementById("modeSwitch");
const displaySwitch = document.getElementById("displaySwitch");
const themeSwitch = document.getElementById("themeSwitch");

let liveMode = false;
let liveInterval = null;
let textTimeout = null;

/* ---------------- MENÜ ---------------- */
menuToggle.addEventListener("click", () => {
  // Falls Menü gerade sichtbar ist, schließen – sonst öffnen
  sideMenu.classList.toggle("visible");
});

closeMenu.addEventListener("click", () => {
  sideMenu.classList.remove("visible");
});

/* ---------------- DARK / LIGHT MODUS ---------------- */
// Button oben rechts (🌗)
modeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  // synchronisiere Zustand mit Theme-Switch im Menü
  themeSwitch.checked = body.classList.contains("dark");
  localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
});

// Switch im Menü
themeSwitch.addEventListener("change", () => {
  body.classList.toggle("dark", themeSwitch.checked);
  localStorage.setItem("theme", themeSwitch.checked ? "dark" : "light");
});

// Initial: gespeichertes Theme anwenden
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  themeSwitch.checked = true;
}

/* ---------------- MODI ---------------- */
modeSwitch.addEventListener("change", () => {
  liveMode = modeSwitch.checked;
  if (liveMode) startLiveClock();
  else clearInterval(liveInterval);
});

displaySwitch.addEventListener("change", () => {
  window.displayMode = displaySwitch.checked ? "24h" : "12h";
  toggleClockFace(window.displayMode);
  if (liveMode) startLiveClock();
});

/* ---------------- SLIDER ---------------- */
slider.addEventListener("input", () => {
  if (!liveMode) {
    const totalMinutes = parseInt(slider.value);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTime(hours, minutes);

    // Text kurz ausblenden während Slider bewegt wird
    timeDisplay.style.opacity = 0;
    clearTimeout(textTimeout);
    textTimeout = setTimeout(() => {
      timeDisplay.textContent = formatTime(hours, minutes);
      timeDisplay.style.opacity = 1;
    }, 1000);
  }
});

/* ---------------- UHR UMSCHALTUNG ---------------- */
function toggleClockFace(mode) {
  const z12 = document.getElementById("ziffernblatt_12h");
  const z24 = document.getElementById("ziffernblatt_24h");
  if (mode === "24h") {
    z12.classList.add("hidden");
    z24.classList.remove("hidden");
  } else {
    z24.classList.add("hidden");
    z12.classList.remove("hidden");
  }
}

/* ---------------- ECHTZEIT ---------------- */
function startLiveClock() {
  clearInterval(liveInterval);
  function update() {
    const now = new Date();
    setTime(now.getHours(), now.getMinutes());
  }
  update();
  liveInterval = setInterval(update, 10000);
}

/* ---------------- INIT ---------------- */
document.addEventListener("DOMContentLoaded", () => {
  setTime(3, 0);
});
