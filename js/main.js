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
  const timeLabel  = document.getElementById("timeLabel"); // 👈 für Textausgabe

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
    window.displayMode = displaySwitch.checked ? "12h" : "24h";
    toggleClockFace(window.displayMode);
    if (liveMode) startLiveClock();
  });

  /* ===== Slider: Grob/Fein ===== */
  setSliderMode(false);

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
      updateTimeLabel(h, m); // 👈 Text aktualisieren
    }, 1000);
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

  function setSliderMode(fine) {
    const minutes = (window.currentTotalMinutes ?? 180);
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
  const daytime = getDaytimeText(hour);
  const formatted = `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  let text = "";
  if (hour >= 12) {
    const alt = hour >= 12 ? hour - 12 : hour + 12;
    text = `Es ist ${formatted} Uhr oder auch ${alt}:00 Uhr ${daytime}`;
  } else {
    text = `Es ist ${formatted} Uhr ${daytime}`;
  }

  // sanft einblenden
  timeLabel.className = ""; // alte Klassen entfernen
  timeLabel.classList.add("fade-in", daytime);
  timeLabel.textContent = text;
}


  /* -------- Init -------- */
  setTime(6, 0);
  updateTimeLabel(6, 0);
}
