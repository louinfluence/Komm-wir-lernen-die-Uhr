window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  const sideMenu = document.getElementById("sideMenu");
  if (!sideMenu) { setTimeout(initClockApp, 200); return; }

  // Header & Grundelemente
  const menuToggle       = document.getElementById("menuToggle");
  const closeMenu        = document.getElementById("closeMenu");
  const modeToggle       = document.getElementById("modeToggle"); // toggelt Theme
  const body             = document.body;
  const slider           = document.getElementById("timeSlider");
  const sliderContainer  = document.getElementById("sliderContainer");
  const timeLabel        = document.getElementById("timeLabel");
	const optionsOverlay = document.getElementById("optionsOverlay");
	const closeOptions   = document.getElementById("closeOptions");
  // Neue Menü-Buttons
  const btnStartGame = document.getElementById("btnStartGame");
  const btnFreeMode  = document.getElementById("btnFreeMode");
  const btnOptions   = document.getElementById("btnOptions");
  const btnQuiz      = document.getElementById("btnQuiz");

  // (OPTIONAL) Alte Schalter – können fehlen! => sicher abfragen
  const modeSwitch    = document.getElementById("modeSwitch");    // Lernmodus/Echtzeit (derzeit entfernt)
  const displaySwitch = document.getElementById("displaySwitch"); // 12h/24h (derzeit entfernt)
  const themeSwitch   = document.getElementById("themeSwitch");   // Hell/Dunkel (derzeit entfernt)

  // Zustände
  let liveMode = false;
  let liveInterval = null;
  let fineMode = false;
  let longPressTimer = null;

  /* =========================================================
     Menü & Theme
     ========================================================= */
  menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  if (closeMenu) closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  // Theme per Header-Button umschalten (unabhängig von themeSwitch)
  modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
  });

  // Falls es doch einen themeSwitch gibt, diesen synchronisieren
  if (themeSwitch) {
    themeSwitch.addEventListener("change", () => {
      body.classList.toggle("dark", themeSwitch.checked);
      localStorage.setItem("theme", themeSwitch.checked ? "dark" : "light");
    });
  }

  // Theme aus LocalStorage laden
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark");
    if (themeSwitch) themeSwitch.checked = true;
  }

  /* =========================================================
     Echtzeitmodus / Lernmodus (falls modeSwitch vorhanden)
     ========================================================= */
  if (modeSwitch) {
    modeSwitch.addEventListener("change", () => {
      liveMode = modeSwitch.checked;
      if (liveMode) {
        if (sliderContainer) sliderContainer.style.display = "none";
        startLiveClock();
      } else {
        if (sliderContainer) sliderContainer.style.display = "block";
        clearInterval(liveInterval);
      }
    });
  } else {
    // Kein modeSwitch vorhanden → Standard: Lernmodus (Slider sichtbar)
    liveMode = false;
    if (sliderContainer) sliderContainer.style.display = "block";
  }

  /* =========================================================
     Anzeige: 12h / 24h (falls displaySwitch vorhanden)
     ========================================================= */
  window.displayMode = "24h"; // Default
  toggleClockFace(window.displayMode);

  if (displaySwitch) {
    displaySwitch.addEventListener("change", () => {
      window.displayMode = displaySwitch.checked ? "24h" : "12h";
      toggleClockFace(window.displayMode);
      if (liveMode) startLiveClock();
    });
  }

  /* =========================================================
     Slider Logik (mit Grob/Fein Umschaltung)
     ========================================================= */
  setSliderMode(false);

  slider.addEventListener("input", () => {
    if (liveMode) return; // Im Echtzeitmodus ignorieren

    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;

    // Startzeit auf 6:00 verschieben
    const adjustedMinutes = (totalMinutes + 360) % 1440;
    const h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;

    // Minutenstand global merken (wichtig, damit nichts „zurückspringt“)
    window.currentTotalMinutes = adjustedMinutes;

    setTime(h, m);
    updateTimeLabel(h, m);
  });

  // Long-Press => temporär Feinmodus (ohne Reset beim Loslassen)
  slider.addEventListener("pointerdown", () => {
    if (liveMode) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  });
  slider.addEventListener("pointerup", () => { clearTimeout(longPressTimer); });
  slider.addEventListener("touchstart", () => {
    if (liveMode) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  }, { passive: true });
  slider.addEventListener("touchend", () => { clearTimeout(longPressTimer); });

  /* =========================================================
     Hilfsfunktionen
     ========================================================= */
  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360; // 6:00 Standard

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
    if (z12 && z24) {
      if (mode === "24h") {
        z12.classList.add("hidden");
        z24.classList.remove("hidden");
      } else {
        z24.classList.add("hidden");
        z12.classList.remove("hidden");
      }
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
    if (hour >= 14 && hour < 17) return "nachmittags";
    if (hour >= 17 && hour < 21) return "abends";
    return "nachts";
  }

  function updateTimeLabel(h, m) {
    if (!timeLabel) return;

    const daytime = getDaytimeText(h);
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    const formatted = `${hh}:${mm}`;

    let altHour = h >= 12 ? h - 12 : h + 12;
    if (altHour >= 24) altHour -= 24;
    const altFormatted = `${altHour.toString().padStart(2, "0")}:${mm}`;

    const text =
      h >= 12
        ? `Es ist ${formatted} Uhr oder auch ${altFormatted} Uhr ${daytime}`
        : `Es ist ${formatted} Uhr ${daytime}`;

    timeLabel.textContent = text;

    // Farbverlauf smooth ändern (robust für Safari)
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
/* -------- Menü-Buttons -------- */
btnStartGame.addEventListener("click", () => {
  showLevelSelection();
});

btnFreeMode.addEventListener("click", () => {
  sideMenu.classList.remove("visible");
  modeSwitch.checked = false; // Lernmodus aktiv
  liveMode = false;
  clearInterval(liveInterval);
});

btnOptions.addEventListener("click", () => {
  sideMenu.classList.remove("visible");
  alert("📘 Anleitung & Optionen werden hier später angezeigt.");
});

btnQuiz.addEventListener("click", () => {
  sideMenu.classList.remove("visible");
  alert("💡 Quiz-Modus wird bald verfügbar!");
});

/* =========================================================
   Untermenü: Levelauswahl
========================================================= */
function showLevelSelection() {
  sideMenu.classList.remove("visible");

  // Overlay anlegen
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  overlay.innerHTML = `
    <div class="overlay-content">
      <h2>🎮 Lernspiel starten</h2>
      <p>Wähle ein Level:</p>
      <div class="level-list">
        <button class="level-card" id="level1Btn">
          <strong>Level 1:</strong><br>Tageszeiten zuordnen
        </button>
        <button class="level-card disabled">
          <strong>Level 2:</strong><br>Uhrzeiten einstellen<br><small>(demnächst)</small>
        </button>
      </div>
      <button class="menu-btn close" id="closeOverlay">✖ Zurück</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Events
  overlay.querySelector("#level1Btn").addEventListener("click", () => {
    overlay.remove();
    initLevel1(); // direkt Level 1 starten
  });

  overlay.querySelector("#closeOverlay").addEventListener("click", () => {
    overlay.classList.add("hidden");
    setTimeout(() => overlay.remove(), 300);
  });
}
  if (btnFreeMode) btnFreeMode.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    // Zur Sicherheit Echtzeit aus
    liveMode = false;
    clearInterval(liveInterval);
    if (sliderContainer) sliderContainer.style.display = "block";
  });

  if (btnOptions) btnOptions.addEventListener("click", () => {
  sideMenu.classList.remove("visible");
  optionsOverlay.classList.remove("hidden");
});

if (closeOptions) closeOptions.addEventListener("click", () => {
  optionsOverlay.classList.add("hidden");
});
  if (btnQuiz) btnQuiz.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    alert("💡 Quiz-Modus wird bald verfügbar!");
  });

  /* =========================================================
     Initialisierung
     ========================================================= */
  // Start auf 6:00
  setTime(6, 0);
  updateTimeLabel(6, 0);
  updateSliderFromTime(6, 0);
}