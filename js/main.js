window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  const sideMenu = document.getElementById("sideMenu");
  if (!sideMenu) { setTimeout(initClockApp, 200); return; }

  // Haupt-Elemente
  const menuToggle       = document.getElementById("menuToggle");
  const closeMenu        = document.getElementById("closeMenu");
  const modeToggle       = document.getElementById("modeToggle");
  const body             = document.body;
  const slider           = document.getElementById("timeSlider");
  const sliderContainer  = document.getElementById("sliderContainer");
  const timeLabel        = document.getElementById("timeLabel");

  // Menü-Buttons
  const btnStartGame = document.getElementById("btnStartGame");
  const btnFreeMode  = document.getElementById("btnFreeMode");
  const btnOptions   = document.getElementById("btnOptions");
  const btnQuiz      = document.getElementById("btnQuiz");

  // Zustände
  let fineMode = false;
  let longPressTimer = null;
  let liveMode = false;
  let liveInterval = null;

  /* =========================================================
     Menüsteuerung & Theme
     ========================================================= */
  menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  // Dark/Light-Modus per Button
  modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
  });

  // Theme speichern/laden
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
  }

  /* =========================================================
     Slider Logik (Grob/Feinumschaltung)
     ========================================================= */
  setSliderMode(false);

  slider.addEventListener("input", () => {
    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;

    // Startzeit auf 6:00 verschieben
    const adjustedMinutes = (totalMinutes + 360) % 1440;
    const h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;

    window.currentTotalMinutes = adjustedMinutes;

    setTime(h, m);
    updateTimeLabel(h, m);
  });

  // Long-Press: Umschalten in Feinmodus
  slider.addEventListener("pointerdown", () => {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  });
  slider.addEventListener("pointerup", () => clearTimeout(longPressTimer));

  /* =========================================================
     Hilfsfunktionen
     ========================================================= */
  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360;
    if (fine) {
      slider.min = 0; slider.max = 1439; slider.step = 1;
      slider.value = minutes;
    } else {
      slider.min = 0; slider.max = 288; slider.step = 1;
      slider.value = Math.round(minutes / 5);
    }
  }

  function updateSliderFromTime(hours, minutes) {
    const total = ((hours * 60 + minutes) - 360 + 1440) % 1440;
    const sliderVal = fineMode ? total : Math.round(total / 5);
    slider.value = sliderVal;
  }

  /* =========================================================
     Tageszeit & Textanzeige (bereinigt!)
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

    // 🌙 0:00 Uhr (Mitternacht)
    if (h === 0 && m === 0) {
      text = `Es ist 12:00 Uhr nachts oder auch 00:00 Uhr`;
    }
    // 🌅 0:01 – 11:59 Uhr → kein Zusatz
    else if (h > 0 && h < 12) {
      text = `Es ist ${formatted} Uhr ${daytime}`;
    }
    // ☀️ 12:00 Uhr genau (Mittag) → kein Zusatz
    else if (h === 12 && m === 0) {
      text = `Es ist 12:00 Uhr mittags`;
    }
    // 🌇 12:01 – 23:59 Uhr → mit Zusatz
    else if (h >= 12 && !(h === 12 && m === 0)) {
      const altHour = h > 12 ? h - 12 : 12;
      const altFormatted = `${String(altHour).padStart(2, "0")}:${mm}`;
      text = `Es ist ${altFormatted} Uhr ${daytime} oder auch ${formatted} Uhr`;
    }

    timeLabel.textContent = text;

    // Farbverlauf
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

  /* =========================================================
     Menü-Buttons (Platzhalter)
     ========================================================= */
  if (btnStartGame) btnStartGame.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    initLevel1(); // Direkt ins Lernspiel starten
  });

  if (btnFreeMode) btnFreeMode.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    clearInterval(liveInterval);
    liveMode = false;
    if (sliderContainer) sliderContainer.style.display = "block";
  });

  if (btnOptions) btnOptions.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    alert("📘 Anleitung & Optionen werden hier später angezeigt.");
  });

  if (btnQuiz) btnQuiz.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    alert("💡 Quiz-Modus wird bald verfügbar!");
  });

  /* =========================================================
     Initialisierung
     ========================================================= */
  setTime(6, 0);
  updateTimeLabel(6, 0);
  updateSliderFromTime(6, 0);
}