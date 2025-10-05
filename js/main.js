window.addEventListener("DOMContentLoaded", () => {
  initClockApp();
});

function initClockApp() {
  const sideMenu = document.getElementById("sideMenu");
  if (!sideMenu) { setTimeout(initClockApp, 200); return; }

  const menuToggle = document.getElementById("menuToggle");
  const closeMenu  = document.getElementById("closeMenu");
  const modeToggle = document.getElementById("modeToggle");
  const body       = document.body;
  const slider     = document.getElementById("timeSlider");
  const timeDisplay= document.getElementById("timeDisplay");

  const modeSwitch    = document.getElementById("modeSwitch");
  const displaySwitch = document.getElementById("displaySwitch");
  const themeSwitch   = document.getElementById("themeSwitch");

  let liveMode = false;
  let liveInterval = null;
  let textTimeout = null;

  // 👉 Grob/Fein-Status
  let fineMode = false;     // false = Grob (5 min), true = Fein (1 min)
  let lpTimer  = null;      // Long-Press Timer

  /* -------- Menü -------- */
  menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  /* -------- Dark/Light -------- */
  modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    themeSwitch.checked = body.classList.contains("dark");
    localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
  });
  themeSwitch.addEventListener("change", () => {
    body.classList.toggle("dark", themeSwitch.checked);
    localStorage.setItem("theme", themeSwitch.checked ? "dark" : "light");
  });
  if (localStorage.getItem("theme") === "dark") { body.classList.add("dark"); themeSwitch.checked = true; }

  /* -------- Echtzeit/Lern -------- */
  modeSwitch.addEventListener("change", () => {
    liveMode = modeSwitch.checked;
    if (liveMode) startLiveClock(); else clearInterval(liveInterval);
  });

  /* -------- 12h / 24h -------- */
  displaySwitch.addEventListener("change", () => {
    window.displayMode = displaySwitch.checked ? "24h" : "12h";
    toggleClockFace(window.displayMode);
    if (liveMode) startLiveClock();
  });

  /* ===== Slider: Grob/Fein ===== */

  // Initial: Grobmodus aktiv (5-min Schritte → 0..288)
  setSliderMode(false);

  // Input -> Zeit setzen
  slider.addEventListener("input", () => {
    if (liveMode) return;

    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;  // Fein=1min, Grob=5min
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    setTime(h, m);

    // Text ausblenden beim Ziehen
    timeDisplay.style.opacity = 0;
    clearTimeout(textTimeout);
    textTimeout = setTimeout(() => {
      timeDisplay.textContent = formatTime(h, m);
      timeDisplay.style.opacity = 1;
    }, 1000);
  });

  // Long-Press → temporär Feinmodus
  const enableFine = (on) => {
    if (fineMode === on) return;
    fineMode = on;
    setSliderMode(fineMode);
  };

  // Pointer-Events (iPad freundlich)
  const onPointerDown = () => {
    if (liveMode) return;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => enableFine(true), 350); // 350ms halten => Fein
  };
  const onPointerUp = () => {
    clearTimeout(lpTimer);
    if (!liveMode) enableFine(false); // zurück zu Grob nach Loslassen
  };

  // iOS Safari: pointer & touch unterstützen
  slider.addEventListener("pointerdown", onPointerDown);
  slider.addEventListener("pointerup", onPointerUp);
  slider.addEventListener("pointercancel", onPointerUp);
  slider.addEventListener("pointerleave", onPointerUp);
  slider.addEventListener("touchstart", onPointerDown, { passive: true });
  slider.addEventListener("touchend", onPointerUp);
  slider.addEventListener("touchcancel", onPointerUp);

  // Slider-Modus setzen (Grob/Fein) und Wert synchronisieren
  function setSliderMode(fine) {
    const minutes = (window.currentTotalMinutes ?? 180); // fallback 03:00
    if (fine) {
      slider.min = 0; slider.max = 1439; slider.step = 1;
      slider.value = minutes;
      slider.classList.add("fine");
    } else {
      slider.min = 0; slider.max = 288; slider.step = 1;  // 288 * 5 = 1440
      slider.value = Math.round(minutes / 5);
      slider.classList.remove("fine");
    }
  }

  /* -------- Ziffernblatt-Umschaltung -------- */
  function toggleClockFace(mode) {
    const z12 = document.getElementById("ziffernblatt_12h");
    const z24 = document.getElementById("ziffernblatt_24h");
    if (mode === "24h") { z12.classList.add("hidden"); z24.classList.remove("hidden"); }
    else { z24.classList.add("hidden"); z12.classList.remove("hidden"); }
  }

  /* -------- Echtzeit -------- */
  function startLiveClock() {
    clearInterval(liveInterval);
    function update() {
      const now = new Date();
      setTime(now.getHours(), now.getMinutes());
    }
    update();
    liveInterval = setInterval(update, 10000);
  }

  /* -------- Init -------- */
  setTime(3, 0);
}
