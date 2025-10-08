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
  if (document.getElementById("clockContainer")) {
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
