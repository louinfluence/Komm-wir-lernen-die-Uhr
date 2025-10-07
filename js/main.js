window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  const body = document.body;

  // ====== Grundelemente ======
  const menuToggle = document.getElementById("menuToggle");
  const closeMenu = document.getElementById("closeMenu");
  const sideMenu = document.getElementById("sideMenu");
  const modeToggle = document.getElementById("modeToggle");
  const timeLabel = document.getElementById("timeLabel");
  const slider = document.getElementById("timeSlider");
  const sliderContainer = document.getElementById("sliderContainer");

  // ====== Schalter ======
  const modeSwitch = document.getElementById("modeSwitch");       // Lernmodus / Echtzeit
  const displaySwitch = document.getElementById("displaySwitch"); // 12h / 24h
  const themeSwitch = document.getElementById("themeSwitch");     // Hell / Dunkel

  // ====== Zustände ======
  let liveMode = false;
  let liveInterval = null;
  let fineMode = false;
  let longPressTimer = null;

  /* =========================================================
     Menü-Steuerung & Theme
  ========================================================= */
  menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  // Header-Button Dark/Light
  modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    const theme = body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", theme);
    themeSwitch.checked = theme === "dark";
  });

  // Theme-Switch im Menü
  themeSwitch.addEventListener("change", () => {
    body.classList.toggle("dark", themeSwitch.checked);
    localStorage.setItem("theme", themeSwitch.checked ? "dark" : "light");
  });

  // Theme beim Laden übernehmen
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    themeSwitch.checked = true;
  }

  /* =========================================================
     Echtzeitmodus / Lernmodus
  ========================================================= */
  modeSwitch.addEventListener("change", () => {
    liveMode = modeSwitch.checked;
    if (liveMode) {
      sliderContainer.style.display = "none";
      startLiveClock();
    } else {
      clearInterval(liveInterval);
      sliderContainer.style.display = "block";
    }
  });

  /* =========================================================
     Anzeigeformat 12h / 24h
  ========================================================= */
  displaySwitch.addEventListener("change", () => {
    window.displayMode = displaySwitch.checked ? "24h" : "12h";
    toggleClockFace(window.displayMode);
    if (liveMode) startLiveClock();
  });

  function toggleClockFace(mode) {
    const z12 = document.getElementById("ziffernblatt_12h");
    const z24 = document.getElementById("ziffernblatt_24h");
    if (!z12 || !z24) return;
    if (mode === "24h") {
      z12.classList.add("hidden");
      z24.classList.remove("hidden");
    } else {
      z24.classList.add("hidden");
      z12.classList.remove("hidden");
    }
  }

  /* =========================================================
     Slider-Steuerung
  ========================================================= */
  setSliderMode(false);

  slider.addEventListener("input", () => {
    if (liveMode) return;
    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;
    const adjustedMinutes = (totalMinutes + 360) % 1440;
    const h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;
    window.currentTotalMinutes = adjustedMinutes;
    setTime(h, m);
    updateTimeLabel(h, m);
  });

  // Long-Press → Feinmodus aktivieren
  slider.addEventListener("pointerdown", () => {
    if (liveMode) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  });
  slider.addEventListener("pointerup", () => clearTimeout(longPressTimer));
  slider.addEventListener("touchstart", () => {
    if (liveMode) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  }, { passive: true });
  slider.addEventListener("touchend", () => clearTimeout(longPressTimer));

  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360;
    if (fine) {
      slider.min = 0; slider.max = 1439; slider.step = 1; slider.value = minutes;
    } else {
      slider.min = 0; slider.max = 288; slider.step = 1; slider.value = Math.round(minutes / 5);
    }
  }

  /* =========================================================
     Echtzeitmodus (Uhr läuft automatisch)
  ========================================================= */
  function startLiveClock() {
    clearInterval(liveInterval);
    function update() {
      const now = new Date();
      setTime(now.getHours(), now.getMinutes());
      updateTimeLabel(now.getHours(), now.getMinutes());
    }
    update();
    liveInterval = setInterval(update, 10000);
  }

  /* =========================================================
     Zeit & Anzeige
  ========================================================= */
  function getDaytimeText(hour) {
    if (hour >= 6 && hour < 10)  return "morgens";
    if (hour >= 10 && hour < 12) return "vormittags";
    if (hour >= 12 && hour < 14) return "mittags";
    if (hour >= 14 && hour < 18) return "nachmittags";
    if (hour >= 18 && hour < 22) return "abends";
    return "nachts";
  }

  function updateTimeLabel(h, m) {
    if (!timeLabel) return;
    const daytime = getDaytimeText(h);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const formatted = `${hh}:${mm}`;
    let text = "";

    // Mitternacht
    if (h === 0 && m === 0) {
      text = "Es ist 12:00 Uhr nachts oder auch 00:00 Uhr";
    }
    // Vormittag (keine Zusatzzeit)
    else if (h > 0 && h < 12) {
      text = `Es ist ${formatted} Uhr ${daytime}`;
    }
    // Mittag genau
    else if (h === 12 && m === 0) {
      text = "Es ist 12:00 Uhr mittags";
    }
    // Nachmittag / Abend (mit Zusatzzeit)
    else if (h >= 12 && !(h === 12 && m === 0)) {
      const altHour = h > 12 ? h - 12 : 12;
      const altFormatted = `${String(altHour).padStart(2, "0")}:${mm}`;
      text = `Es ist ${altFormatted} Uhr ${daytime} oder auch ${formatted} Uhr`;
    }

    timeLabel.textContent = text;

    // Farbverlauf für Text
    let c1, c2;
    switch (daytime) {
      case "morgens":     c1 = "#FFEB99"; c2 = "#FFD166"; break;
      case "vormittags":  c1 = "#FFD166"; c2 = "#FFA500"; break;
      case "mittags":     c1 = "#FFB347"; c2 = "#FF8C00"; break;
      case "nachmittags": c1 = "#87CEEB"; c2 = "#4682B4"; break;
      case "abends":      c1 = "#457b9d"; c2 = "#1d3557"; break;
      default:            c1 = "#0b132b"; c2 = "#1c2541";
    }
    timeLabel.style.backgroundImage = `linear-gradient(to right, ${c1}, ${c2})`;
    timeLabel.style.backgroundClip = "text";
    timeLabel.style.webkitBackgroundClip = "text";
    timeLabel.style.color = "transparent";
    timeLabel.style.transition = "background-image 1.5s ease";
  }

  /* =========================================================
     Initialisierung
  ========================================================= */
  setTime(6, 0);
  updateTimeLabel(6, 0);
}