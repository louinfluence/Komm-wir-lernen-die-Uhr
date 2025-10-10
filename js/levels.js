/* =========================================================
   LEVELS – JSON-basiertes Lernspiel mit Drag & Drop
   ========================================================= */

// 🔹 Globale Steuerungsvariablen
let level = null;
let current = 0;

// Lädt Leveldaten aus der JSON-Datei
async function loadLevels() {
  try {
    const res = await fetch("data/levels.json");
    if (!res.ok) throw new Error(`Fehler beim Laden (${res.status})`);
    const data = await res.json();
    debug("✅ JSON erfolgreich geladen");
    return data.levels;
  } catch (err) {
    debug("❌ Fehler beim Laden der JSON: " + err.message, "red");
    return [];
  }
}

/* =========================================================
   🧩 Level 1 – Uhrzeiten zuordnen
   ========================================================= */
async function startGameLevel(levelId, onComplete) {
  const container = document.getElementById("gameContainer");
  if (!container) {
    debug("❌ Kein #gameContainer gefunden!", "red");
    return;
  }
  container.innerHTML = "⏳ Lade Level " + levelId + "...";

  const levels = await loadLevels();
  level = levels.find(l => l.id === levelId);
  if (!level) {
    debug("❌ Level nicht gefunden: " + levelId, "red");
    container.innerHTML = "<p>Level konnte nicht geladen werden.</p>";
    return;
  }

  debug("🎯 Starte Level " + levelId);
  current = 0;
  window.onComplete = onComplete;

  showTask(level.tasks[current]);
}

/* =========================================================
   🧩 Einzelne Aufgaben anzeigen & prüfen
   ========================================================= */
function showTask(task) {
  const container = document.getElementById("gameContainer");
  if (!task) {
    container.innerHTML = "<p>❌ Keine Aufgabe gefunden!</p>";
    debug("⚠️ Keine gültige Aufgabe");
    return;
  }

  container.innerHTML = `
    <div class="task-block">
      <h2>${task.text || "Aufgabe"}</h2>
      <div id="dropZone" class="drop-zone">Ziehe das passende Bild hierher 👇</div>
      <div class="options-area" id="optionsArea"></div>
    </div>
  `;

  const optionsArea = document.getElementById("optionsArea");
  if (!Array.isArray(task.options)) {
    debug("⚠️ task.options fehlt oder ist kein Array", "orange");
    return;
  }

  task.options.forEach(opt => {
    const img = document.createElement("img");
    img.src = `assets/images/${opt}`;
    img.alt = opt;
    img.className = "draggable-option";
    optionsArea.appendChild(img);
  });
}

/* =========================================================
   🕓 Level 2 – Bild erkennen
   ========================================================= */
async function startLevel2(onComplete) {
  const container = document.getElementById("gameContainer");
  if (!container) {
    debug("❌ Kein #gameContainer gefunden (Level2)!", "red");
    return;
  }
  container.innerHTML = "⏳ Lade Level 2...";

  const levels = await loadLevels();
  level = levels.find(l => l.id === 2);

  if (!level || !level.tasks) {
    debug("❌ Level 2 nicht gefunden oder leer", "red");
    container.innerHTML = "<p>❌ Fehler beim Laden des Levels.</p>";
    return;
  }

  debug("🎯 Starte Level 2");
  let current = 0;
  showTask2(level.tasks[current]);

  function showTask2(task) {
    container.innerHTML = `
      <div class="task-block">
        <h2>${task.text || "Wähle die richtige Tageszeit"}</h2>
        <div class="image-preview">
          <img src="assets/images/${task.image}" class="situation-img">
        </div>
        <div id="optionsGrid" class="options-grid"></div>
      </div>
    `;

    const grid = document.getElementById("optionsGrid");
    task.options.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.className = "option-btn";
      btn.addEventListener("click", () => {
        if (option === task.correct) {
          btn.classList.add("correct");
          debug("✅ Richtige Antwort: " + option, "green");
        } else {
          btn.classList.add("wrong");
          debug("❌ Falsche Antwort: " + option, "red");
        }
      });
      grid.appendChild(btn);
    });
  }
}

/* =========================================================
   🔁 Kompatibilitätsfunktionen
   ========================================================= */
function initLevel1(cb) { startGameLevel(1, cb); }
function initLevel2(cb) { startLevel2(cb); }

debug("📦 levels.js erfolgreich geladen");
