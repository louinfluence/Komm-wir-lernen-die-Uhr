/* =========================================================
   main.js – Zentrale Steuerung für alle Seiten
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  console.log("📋 main.js geladen und bereit.");

  // === Zentrale SFX: success + wrong, mit globalem Event-Listener ===
  (function setupSFX() {
    if (window.sfx && window.sfx.__ready) return; // already set

    const makeAudio = (src) => {
      const a = new Audio(src);
      a.preload = 'auto';
      return a;
    };

    /* ===========================
       🔗 Globaler Level-Launcher
       (einmalig, außerhalb des if(levelSelect)-Blocks)
       =========================== */
    (function ensureGlobalLauncher(){
      const prev = window.__startLevel;

      function launcher(n){
        console.log("⏭️ __startLevel →", n);
        if (typeof window.__realStartLevel === "function") {
          window.__realStartLevel(n);
        } else {
          console.warn("startLevel() noch nicht bereit – zeige Baustelle:", n);
          if (typeof window.showComingSoon === "function") {
            window.showComingSoon(n);
          }
        }
      }
      launcher.__isLauncher = true;

      // Nur ersetzen, wenn kein kompatibler Launcher existiert
      if (typeof prev !== "function" || !prev.__isLauncher) {
        window.__startLevel = launcher;
      }
    })();

    const success = makeAudio('assets/sounds/erfolg.mp3');
    const wrong   = makeAudio('assets/sounds/wrong.mp3'); // Platzhalter-Datei, kann leer sein

    let unlocked = false;
    const unlock = () => {
      // beide einmal „stumm“ unlocken
      const tryUnlock = (a) => a?.play().then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{});
      success.muted = true; wrong.muted = true;
      Promise.all([tryUnlock(success), tryUnlock(wrong)]).finally(() => {
        success.muted = false; wrong.muted = false;
        unlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      });
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown',   unlock, { once: true });

    // kleine Schutzbremse (Throttling), falls Events doppelt feuern
    let lastAt = 0;
    async function play(a) {
      if (!unlocked || !a) return;
      const now = performance.now();
      if (now - lastAt < 120) return; // 120ms debounce
      lastAt = now;
      try { a.pause(); a.currentTime = 0; await a.play(); } catch {}
    }

    window.sfx = {
      success: () => play(success),
      wrong:   () => play(wrong),
      __ready: true
    };

    // 🔊 Globale Event-Hooks: Alle Level können nur Events dispatchen.
    document.addEventListener('answer:correct', () => window.sfx.success());
    document.addEventListener('answer:wrong',   () => window.sfx.wrong());
  })();

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
     (robuster Delegator – hört direkt auf #levelSelect)
  --------------------------------------------------------- */
  if (levelSelect) {
    console.log("🎮 Lernspiel: Levelauswahl aktiv");

    function onCardActivate(e) {
      const card = e.target.closest('.level-card[data-level]');
      if (!card) return;
      e.preventDefault();
      const n = parseInt(card.dataset.level, 10);
      if (!Number.isFinite(n)) return;
      console.log("▶️ Starte Level:", n);
      startLevel(n);
    }

    // iPad-sicher: sowohl click als auch pointerup (mit kleinem Debounce)
    let _last = 0;
    function debounced(handler) {
      return (ev) => {
        const now = performance.now();
        if (now - _last < 160) return;
        _last = now;
        handler(ev);
      };
    }

    levelSelect.addEventListener('click',     debounced(onCardActivate));
    levelSelect.addEventListener('pointerup', debounced(onCardActivate), { passive: false });

    function hideOverview() {
      if (levelSelect) levelSelect.style.display = "none";
    }

    function showNextButton(nextLevel) {
      const btn = document.createElement("button");
      btn.className = "next-level-btn";

      if (nextLevel) {
        btn.textContent = `➡️ Weiter zu Level ${nextLevel}`;
        btn.addEventListener("click", () => window.__startLevel(nextLevel));
      } else {
        btn.textContent = "🎉 Alle Level geschafft!";
        btn.disabled = true;
      }

      container.appendChild(btn);
    }

    function startLevel(n) {
      hideOverview();

      if (n === 1 && typeof window.initLevel1 === "function") {
        window.initLevel1(showNextButton);
      }
      else if (n === 2 && typeof window.startLevel2 === "function") {
        window.startLevel2(showNextButton);
      }
      else if (n === 3 && typeof window.initLevel3 === "function") {
        window.initLevel3(showNextButton);
      }
      else if (n === 4 && typeof window.initLevel4 === "function") {
        window.initLevel4(showNextButton);
      }
      else if (n === 5 && typeof window.startLevel5 === "function") {
        window.startLevel5(showNextButton);
      }
      // Platz für weitere:
      // else if (n === 6 && typeof window.startLevel6 === "function") { ... }

      else {
        console.warn("⚠️ Level-Funktion fehlt oder wurde nicht geladen:", n);
        if (typeof window.showComingSoon === "function") {
          window.showComingSoon(n);
        }
      }
    }

    // Stelle die Startfunktion dem globalen Launcher zur Verfügung
    window.__realStartLevel = startLevel;
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

/* Lernvideos neben Kapitel-Boxen anordnen (mehrere Paare, links ODER rechts) */
(function arrangeVideosBesideChapters(){
  // ➜ Hier deine Paare eintragen: videoId, chapterId, side: 'left' | 'right'
  const pairs = [
    { videoId: 'learnVideoCard',   chapterId: 'chapter2', side: 'left'  },
    { videoId: 'quarterVideoCard', chapterId: 'chapter3', side: 'right' },
    { videoId: 'minutesVideoCard', chapterId: 'chapter4', side: 'right' }
  ];

  function mountPair({ videoId, chapterId, side = 'left' }) {
    const video = document.getElementById(videoId);
    const chap  = document.getElementById(chapterId);
    if (!video || !chap) return;

    // Schon in einer section-row gruppiert?
    let row = chap.previousElementSibling;
    const alreadyGrouped = row && row.classList?.contains('section-row') && row.contains(video);
    if (alreadyGrouped) return;

    // Wrapper vor das Kapitel setzen
    row = document.createElement('div');
    row.className = `section-row section-row--video-${side}`;
    chap.parentNode.insertBefore(row, chap);

    // Reihenfolge je nach Seite
    if (side === 'right') {
      row.appendChild(chap);
      row.appendChild(video);
    } else {
      row.appendChild(video);
      row.appendChild(chap);
    }

    // optionale Marker-Klassen (falls du später stylen willst)
    video.classList.add('section-col','section-col--video');
    chap .classList.add('section-col','section-col--content');
  }

  function mountAll(){ pairs.forEach(mountPair); }

  // iPad-sicher: wiederholt versuchen und auf DOM-Änderungen hören
  function tryMount(){ mountAll(); }
  tryMount();
  const mo = new MutationObserver(tryMount);
  mo.observe(document.body, { childList: true, subtree: true });
})();

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