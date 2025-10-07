window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  const sideMenu = document.getElementById("sideMenu");
  if (!sideMenu) { setTimeout(initClockApp, 200); return; }

  const menuToggle = document.getElementById("menuToggle");
  const closeMenu  = document.getElementById("closeMenu");
  const modeToggle = document.getElementById("modeToggle");
  const body       = document.body;
  const slider     = document.getElementById("timeSlider");
  const sliderContainer = document.getElementById("sliderContainer");
  const timeLabel  = document.getElementById("timeLabel");

  const modeSwitch    = document.getElementById("modeSwitch");
  const displaySwitch = document.getElementById("displaySwitch");
  const themeSwitch   = document.getElementById("themeSwitch");

  let liveMode = false;
  let liveInterval = null;
  let fineMode = false;
  let longPressTimer = null;

  /* =========================================================
     Menü & Theme
     ========================================================= */
  menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    themeSwitch.checked = body.classList.contains("dark");
    localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
  });

  themeSwitch.addEventListener("change", () => {
    body.classList.toggle("dark", themeSwitch.checked);
    localStorage.setItem("theme", themeSwitch.checked ? "dark" : "light");
  });

  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    themeSwitch.checked = true;
  }

  /* =========================================================
     Echtzeitmodus / Lernmodus
     ========================================================= */
  modeSwitch.addEventListener("change", () => {
    liveMode = modeSwitch.checked;

    // Echtzeit aktiv → Slider ausblenden
    if (liveMode) {
      sliderContainer.style.display = "none";
      startLiveClock();
    } else {
      sliderContainer.style.display = "block";
      clearInterval(liveInterval);
    }
  });

  /* =========================================================
     Anzeige: 12h / 24h
     ========================================================= */
  displaySwitch.addEventListener("change", () => {
    window.displayMode = displaySwitch.checked ? "24h" : "12h";
    toggleClockFace(window.displayMode);
    if (liveMode) startLiveClock();
  });

  /* =========================================================
     Slider Logik (mit Grob/Fein Umschaltung)
     ========================================================= */
  setSliderMode(false);

  slider.addEventListener("input", () => {
    if (liveMode) return; // deaktiviert bei Echtzeit

    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;
    const adjustedMinutes = (totalMinutes + 360) % 1440;
    const h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;

    setTime(h, m);
    updateTimeLabel(h, m);
  });

  // Long-Press zum Umschalten auf Feinmodus (temporär)
  slider.addEventListener("pointerdown", () => {
    if (liveMode) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  });

  slider.addEventListener("pointerup", () => {
    clearTimeout(longPressTimer);
    if (!liveMode) setSliderMode(false);
  });

  slider.addEventListener("touchstart", () => {
    if (liveMode) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  }, { passive: true });

  slider.addEventListener("touchend", () => {
    clearTimeout(longPressTimer);
    if (!liveMode) setSliderMode(false);
  });

  /* =========================================================
     Hilfsfunktionen
     ========================================================= */
  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360;

    if (fine) {
      slider.min = 0; slider.max = 1439; slider.step = 1;
      slider.value = minutes;
      slider.classList.add("fine");
    } else {
      slider.min = 0; slider.max = 288; slider.step = 1;
      slider.value = Math.round(minutes / 5);
      slider.classList.remove("fine");
    }
  }

  function updateSliderFromTime(hours, minutes) {
    const total = ((hours * 60 + minutes) - 360 + 1440) % 1440;
    const sliderVal = fineMode ? total : Math.round(total / 5);
    slider.value = sliderVal;
  }

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

  /* =========================================================
     Echtzeitmodus
     ========================================================= */
  function startLiveClock() {
    clearInterval(liveInterval);

    function update() {
      const now = new Date();
      setTime(now.getHours(), now.getMinutes());
      updateTimeLabel(now.getHours(), now.getMinutes());
      updateSliderFromTime(now.getHours(), now.getMinutes());
    }

    update();
    liveInterval = setInterval(update, 10000);
  }

  /* =========================================================
     Tageszeit & Textanzeige
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

  // Normale Anzeige
  // 0:00 – 11:59 Uhr → kein Zusatz (außer 0:00 Uhr selbst)
  if ((h >= 0 && h < 12 && !(h === 0 && m === 0))) {
    text = `Es ist ${formatted} Uhr ${daytime}`;
  }

  // 0:00 Uhr genau → Spezialfall
  else if (h === 0 && m === 0) {
    text = `Es ist 12:00 Uhr nachts oder auch 00:00 Uhr`;
  }

  // 12:00 Uhr mittags → kein Zusatz
  else if (h === 12 && m === 0) {
    text = `Es ist 12:00 Uhr mittags`;
  }

  // 12:01 – 23:59 Uhr → mit Zusatz
  else if (h >= 12) {
    // z. B. 14 → 2 Uhr
    const altHour = h > 12 ? h - 12 : 12;
    const altFormatted = `${String(altHour).padStart(2, "0")}:${mm}`;
    text = `Es ist ${altFormatted} Uhr ${daytime} oder auch ${formatted} Uhr`;
  }

  timeLabel.textContent = text;

  // Farbverlauf wie zuvor
  let color1, color2;
  switch (daytime) {
    case "morgens":     color1 = "#FFEB99"; color2 = "#FFD166"; break;
    case "vormittags":  color1 = "#FFD166"; color2 = "#FFA500"; break;
    case "mittags":     color1 = "#FFB347"; color2 = "#FF8C00"; break;
    case "nachmittags": color1 = "#87CEEB"; color2 = "#4682B4"; break;
    case "abends":      color1 = "#457b9d"; color2 = "#1d3557"; break;
    default:            color1 = "#0b132b"; color2 = "#1c2541";
  }
  timeLabel.style.backgroundImage = `linear-gradient(to right, ${color1}, ${color2})`;
  timeLabel.style.backgroundClip = "text";
  timeLabel.style.webkitBackgroundClip = "text";
  timeLabel.style.color = "transparent";
  timeLabel.style.transition = "background-image 1.5s ease";
}
  }

  /* =========================================================
     Initialisierung
     ========================================================= */
  setTime(6, 0);
  updateTimeLabel(6, 0);
  updateSliderFromTime(6, 0);
}