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
  const timeLabel  = document.getElementById("timeLabel");

  const modeSwitch    = document.getElementById("modeSwitch");
  const displaySwitch = document.getElementById("displaySwitch");
  const themeSwitch   = document.getElementById("themeSwitch");

  let liveMode = false;
  let liveInterval = null;
  let textTimeout = null;

  // 👉 Grob/Fein-Status
  let fineMode = false;
  let lpTimer  = null;

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
  if (localStorage.getItem("theme") === "dark") {
    body.classList.add("dark"); themeSwitch.checked = true;
  }

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
  setSliderMode(false);

 slider.addEventListener("input", () => {
  if (liveMode) return;

  const val = parseInt(slider.value, 10);
  const totalMinutes = fineMode ? val : val * 5;

  // Startzeit auf 6:00 verschieben
  const adjustedMinutes = (totalMinutes + 360) % 1440;
  const h = Math.floor(adjustedMinutes / 60);
  const m = adjustedMinutes % 60;

  setTime(h, m);
  updateTimeLabel(h, m); // 👈 direkt live aktualisieren, ohne Timeout
});

  // Long-Press → temporär Feinmodus
  const enableFine = (on) => {
    if (fineMode === on) return;
    fineMode = on;
    setSliderMode(fineMode);
  };

  const onPointerDown = () => {
    if (liveMode) return;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => enableFine(true), 350);
  };
  const onPointerUp = () => {
    clearTimeout(lpTimer);
    if (!liveMode) enableFine(false);
  };

  slider.addEventListener("pointerdown", onPointerDown);
  slider.addEventListener("pointerup", onPointerUp);
  slider.addEventListener("pointercancel", onPointerUp);
  slider.addEventListener("pointerleave", onPointerUp);
  slider.addEventListener("touchstart", onPointerDown, { passive: true });
  slider.addEventListener("touchend", onPointerUp);
  slider.addEventListener("touchcancel", onPointerUp);

  /* -------- Slider-Modus & Startwert -------- */
  function setSliderMode(fine) {
    // 👇 Slider ganz links (0), Uhr auf 6:00 Uhr
    const minutes = 0;
    window.currentTotalMinutes = 360;

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
      updateTimeLabel(now.getHours(), now.getMinutes());
    }
    update();
    liveInterval = setInterval(update, 10000);
  }

  /* -------- Tageszeit-Anzeige -------- */
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

  const hour = h;
  const minute = m;
  const daytime = getDaytimeText(hour);
  const formatted = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  // Alternativzeit (12 h-Format mit Minuten)
  let altHour = hour >= 12 ? hour - 12 : hour + 12;
  if (altHour >= 24) altHour -= 24;
  const altFormatted = `${altHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

  let text = "";
  if (hour >= 12) {
    text = `Es ist ${formatted} Uhr oder auch ${altFormatted} Uhr ${daytime}`;
  } else {
    text = `Es ist ${formatted} Uhr ${daytime}`;
  }

  timeLabel.textContent = text;

  // dynamische Farbverläufe je nach Tageszeit
  let color1, color2;
  switch (daytime) {
    case "morgens":
      color1 = "#FFEB99"; color2 = "#FFD166"; break;
    case "vormittags":
      color1 = "#FFD166"; color2 = "#FFA500"; break;
    case "mittags":
      color1 = "#FFB347"; color2 = "#FF8C00"; break;
    case "nachmittags":
      color1 = "#87CEEB"; color2 = "#4682B4"; break;
    case "abends":
      color1 = "#457b9d"; color2 = "#1d3557"; break;
    case "nachts":
    default:
      color1 = "#0b132b"; color2 = "#1c2541"; break;
  }

  timeLabel.style.background = `linear-gradient(to right, ${color1}, ${color2})`;
  timeLabel.style.webkitBackgroundClip = "text";
  timeLabel.style.webkitTextFillColor = "transparent";
  timeLabel.style.transition = "background 1.5s ease";
}

  /* -------- Init -------- */
  setTime(6, 0);
  updateTimeLabel(6, 0);
  slider.value = 0; // 👈 beim Start ganz links
}
