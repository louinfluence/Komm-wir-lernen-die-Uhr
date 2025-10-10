/* =========================================================
   main.js – Zentrale Steuerung für alle Seiten
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  console.log("📋 main.js geladen und bereit.");

  /* ---------------------------------------------------------
     🔹 Globale Variablen & Selektoren
  --------------------------------------------------------- */
  const container = document.getElementById("gameContainer");
  const levelSelect = document.getElementById("levelSelect");
  const currentPage = document.body.dataset.page || "default";

  /* ---------------------------------------------------------
     🔹 Navigation zwischen Unterseiten
     (index.html, lernspiel.html, uhr.html, test.html, opt.html)
  --------------------------------------------------------- */
  window.navigateTo = function(page) {
    console.log("🌐 Navigiere zu:", page);
    const routes = {
      lernspiel: "lernspiel.html",
      uhr: "uhr.html",
      test: "test.html",
      opt: "opt.html",
      start: "index.html"
    };
    if (routes[page]) {
      window.location.href = routes[page];
    } else {
      console.warn("⚠️ Unbekannte Seite:", page);
    }
  };

/* ---------------------------------------------------------
   🔹 Lernspiel: Levelsteuerung
--------------------------------------------------------- */
if (levelSelect) {
  console.log("🎮 Lernspiel: Levelauswahl aktiv");

  const delegate = (e) => {
    const card = e.target.closest(".level-card");
    if (!card || !container.contains(card)) return;
    e.preventDefault();
    const level = parseInt(card.dataset.level, 10);
    startLevel(level);
  };

  document.addEventListener("pointerup", delegate, { passive: false });
  document.addEventListener("click", delegate);

  function startLevel(level) {
    console.log("▶️ Starte Level:", level);
    if (levelSelect) levelSelect.style.display = "none";

    // 🟢 Richtige Aufrufe der Level-Startfunktionen
    if (level === 1 && typeof initLevel1 === "function") {
      initLevel1(showNextButton);
    } 
    else if (level === 2 && typeof startLevel2 === "function") {
      startLevel2(showNextButton);
    } 
    else if (level === 3 && typeof initLevel3 === "function") {
      initLevel3(showNextButton);
    } 
    else {
      console.warn("⚠️ Level-Funktion fehlt oder wurde nicht geladen:", level);
    }
  }

  function showNextButton(nextLevel) {
    const btn = document.createElement("button");
    btn.className = "next-level-btn";

    if (nextLevel) {
      btn.textContent = `➡️ Weiter zu Level ${nextLevel}`;
      btn.addEventListener("click", () => {
        btn.remove();
        container.innerHTML = "";
        if (nextLevel === 2 && typeof startLevel2 === "function") startLevel2(showNextButton);
        else if (nextLevel === 3 && typeof initLevel3 === "function") initLevel3(showNextButton);
      });
    } else {
      btn.textContent = "🎉 Alle Level geschafft!";
      btn.disabled = true;
    }

    container.appendChild(btn);
  }

  window.__startLevel = (n) => startLevel(n);
} 
   /* ---------------------------------------------------------
   🔹 Uhr-Seite: Interaktive Uhrsteuerung (wenn vorhanden)
  --------------------------------------------------------- */
  if (document.querySelector(".clock-container")) {
    console.log("🕒 Uhr-Seite erkannt – Initialisierung läuft...");

    if (typeof initClock === "function") {
      initClock();
    } else {
      console.warn("⚠️ Keine Funktion initClock() gefunden.");
    }
  }
   
  /* ---------------------------------------------------------
     🔹 Test-Seite: Quiz oder Aufgabenmodus
  --------------------------------------------------------- */
  if (document.getElementById("testContainer")) {
    console.log("🧩 Test-Seite aktiv");
    if (typeof initTest === "function") {
      initTest();
    } else {
      console.warn("⚠️ initTest() nicht definiert.");
    }
  }

  /* ---------------------------------------------------------
     🔹 Optionen-Seite: Einstellungen
  --------------------------------------------------------- */
  if (document.getElementById("optContainer")) {
    console.log("⚙️ Optionen-Seite aktiv");
    if (typeof initOptions === "function") {
      initOptions();
    } else {
      console.warn("⚠️ initOptions() nicht definiert.");
    }
  }

  /* ---------------------------------------------------------
     🔹 Debug-Hinweis
  --------------------------------------------------------- */
  console.log("✅ Initialisierung abgeschlossen für:", currentPage);
});


/* ---------------------------------------------------------
   🔹 Uhr.html – Funktionen
--------------------------------------------------------- */
function initClock() {
  // --- Menüsteuerung ---
  const menuToggle = document.getElementById("menuToggle");
  const sideMenu   = document.getElementById("sideMenu");
  const closeMenu  = document.getElementById("closeMenu");

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", () =>
      sideMenu.classList.toggle("visible")
    );
  }
  if (closeMenu && sideMenu) {
    closeMenu.addEventListener("click", () =>
      sideMenu.classList.remove("visible")
    );
  }

  // --- Uhrsteuerung über Slider ---
  const slider = document.getElementById("timeSlider");
  if (slider) {
    slider.max = 2878;
    slider.step = 1;

    slider.addEventListener("input", () => {
      const totalMinutes = Math.round(parseInt(slider.value, 10) / 2);
      if (typeof updateClockFromSlider === "function") {
        updateClockFromSlider(totalMinutes);
      } else if (typeof setTime === "function") {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        setTime(h, m);
      }
    });

    if (typeof updateClockFromSlider === "function") {
      updateClockFromSlider(0);
    } else if (typeof setTime === "function") {
      setTime(0, 0);
    }
  }

  // --- Echtzeitmodus ---
  const modeSwitch = document.getElementById("modeSwitch");
  const sliderContainer = document.getElementById("sliderContainer");

  if (modeSwitch) {
    modeSwitch.addEventListener("change", () => {
      const isRealtime = modeSwitch.checked;
      if (isRealtime) {
        if (sliderContainer) sliderContainer.style.display = "none";
        startRealtimeClock();
      } else {
        if (sliderContainer) sliderContainer.style.display = "block";
        stopRealtimeClock();
      }
    });
  }

  // --- 12h / 24h-Umschalter ---
  const displaySwitch = document.getElementById("displaySwitch");
  if (displaySwitch) {
    displaySwitch.addEventListener("change", () => {
      window.displayMode = displaySwitch.checked ? "24h" : "12h";
      if (typeof applyDialForMode === "function") applyDialForMode();

      const total = window.currentTotalMinutes ?? 0;
      if (typeof updateClockFromSlider === "function") {
        updateClockFromSlider(total);
      } else if (typeof setTime === "function") {
        const h = Math.floor(total / 60);
        const m = total % 60;
        setTime(h, m);
      }
    });

    window.displayMode = displaySwitch.checked ? "24h" : "12h";
    if (typeof applyDialForMode === "function") applyDialForMode();
  }

  // --- Zurück zum Startbildschirm ---
  const backToStart = document.getElementById("backToStart");
  if (backToStart) {
    backToStart.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof window.navigateTo === "function") {
        window.navigateTo("start");
      } else {
        window.location.href = "index.html";
      }
    });
  }
}


/* -----------------------------------------------------------
   Dark Mode Umschalter (global)
----------------------------------------------------------- */
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark", themeSwitch.checked);
    localStorage.setItem("darkMode", themeSwitch.checked ? "true" : "false");
  });

  if (localStorage.getItem("darkMode") === "true") {
    themeSwitch.checked = true;
    document.body.classList.add("dark");
  }
}
