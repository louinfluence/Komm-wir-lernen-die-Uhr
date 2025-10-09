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

    // robust für Touch + Maus
    const delegate = (e) => {
      const card = e.target.closest(".level-card");
      if (!card || !container.contains(card)) return;
      e.preventDefault();
      const level = parseInt(card.dataset.level, 10);
      startLevel(level);
    };

    document.addEventListener("pointerup", delegate, { passive: false });
    document.addEventListener("click", delegate);

    // Level starten
    function startLevel(level) {
      console.log("▶️ Starte Level:", level);
      if (levelSelect) levelSelect.style.display = "none";

      if (level === 1 && typeof initLevel1 === "function") initLevel1(showNextButton);
      else if (level === 2 && typeof initLevel2 === "function") initLevel2(showNextButton);
      else if (level === 3 && typeof initLevel3 === "function") initLevel3(showNextButton);
      else console.warn("⚠️ Level-Funktion fehlt oder wurde nicht geladen:", level);
    }

    // "Weiter zu Level X" – Button nach Abschluss
    function showNextButton(nextLevel) {
      const btn = document.createElement("button");
      btn.className = "next-level-btn";

      if (nextLevel) {
        btn.textContent = `➡️ Weiter zu Level ${nextLevel}`;
        btn.addEventListener("click", () => {
          btn.remove();
          container.innerHTML = "";
          if (nextLevel === 2 && typeof initLevel2 === "function") initLevel2(showNextButton);
          else if (nextLevel === 3 && typeof initLevel3 === "function") initLevel3(showNextButton);
        });
      } else {
        btn.textContent = "🎉 Alle Level geschafft!";
        btn.disabled = true;
      }

      container.appendChild(btn);
    }

    // Für Debug/Manuellen Start (Konsole)
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
     🔹 Uhr.html
  --------------------------------------------------------- */
function initClock() {
  // --- Menüsteuerung bleibt wie gehabt ---
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

// --- Uhrsteuerung über Slider (feinfühligere Variante B) ---
const slider = document.getElementById("timeSlider");
if (slider) {
  // Slider hat jetzt doppelt so viele Schritte (0–2878)
  // → ergibt weicheres Bewegen, aber weiterhin 0–1439 Minuten real
  slider.max = 2878;
  slider.step = 1;

  slider.addEventListener("input", () => {
    // interner Wert = Sliderwert / 2 → ergibt Minuten (0–1439)
    const totalMinutes = Math.round(parseInt(slider.value, 10) / 2);

    if (typeof updateClockFromSlider === "function") {
      updateClockFromSlider(totalMinutes);
    } else if (typeof setTime === "function") {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      setTime(h, m);
    } else {
      console.warn("⚠️ Weder updateClockFromSlider noch setTime vorhanden!");
    }
  });

  // --- Anfangszeit setzen (z. B. 0:00 Uhr) ---
  if (typeof updateClockFromSlider === "function") {
    updateClockFromSlider(0);
  } else if (typeof setTime === "function") {
    setTime(0, 0);
  }
}
  // --- Umschalten zwischen Lernmodus und Echtzeit ---
const modeSwitch = document.getElementById("modeSwitch");
const sliderContainer = document.getElementById("sliderContainer");

if (modeSwitch) {
  modeSwitch.addEventListener("change", () => {
    const isRealtime = modeSwitch.checked;

    if (isRealtime) {
      // Echtzeitmodus aktivieren
      if (sliderContainer) sliderContainer.style.display = "none";
      startRealtimeClock();
    } else {
      // Lernmodus aktivieren
      if (sliderContainer) sliderContainer.style.display = "block";
      stopRealtimeClock();
    }
  });
}
}

// -----------------------------------------------------------
// Dark Mode Umschalter (steht jetzt wieder auf oberster Ebene)
// -----------------------------------------------------------
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.addEventListener("change", () => {
    document.body.classList.toggle("dark", themeSwitch.checked);
    localStorage.setItem("darkMode", themeSwitch.checked ? "true" : "false");
  });

  // Zustand beim Laden wiederherstellen
  if (localStorage.getItem("darkMode") === "true") {
    themeSwitch.checked = true;
    document.body.classList.add("dark");
  }
}





