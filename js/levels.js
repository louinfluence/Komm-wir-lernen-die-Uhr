/* =========================================================
   LEVELS – JSON-basiertes Lernspiel mit Drag & Drop
   ========================================================= */

// 🔹 Globale Steuerungsvariablen (werden von mehreren Funktionen gebraucht)
let level = null;
let current = 0;

// Lädt Leveldaten aus der JSON-Datei
async function loadLevels() {
  const res = await fetch("data/levels.json");
  const data = await res.json();
  return data.levels;
}

/* Haupt-Startfunktion */
async function startGameLevel(levelId, onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = ""; // altes Level leeren

  const levels = await loadLevels();
  level = levels.find(l => l.id === levelId); // ✅ global speichern
  if (!level) return console.error("Level nicht gefunden:", levelId);

  const title = document.createElement("h2");
  title.textContent = `🎯 ${level.title}`;
  container.appendChild(title);

  const desc = document.createElement("p");
  desc.textContent = level.description;
  container.appendChild(desc);

  // Aufgaben nacheinander anzeigen
  current = 0; // ✅ global aktualisieren
  showTask(level.tasks[current]);

  // Callback speichern, damit es beim Abschluss verwendet werden kann
  window.onComplete = onComplete;
}

/* =========================================================
   🧩 Einzelne Aufgaben anzeigen & prüfen
   ========================================================= */
function showTask(task) {
  const container = document.getElementById("gameContainer");

  container.innerHTML = `
    <div class="task-block">
      <div class="clock-preview">
        <div class="mini-clock">
          <img src="assets/images/Ziffernblatt.png" alt="Ziffernblatt" class="mini-ziffernblatt">
          <img src="assets/images/Stundenzeiger.png" class="mini-stundenzeiger" alt="Stundenzeiger" />
          <img src="assets/images/Minutenzeiger.png" class="mini-minutenzeiger" alt="Minutenzeiger" />
        </div>
        <div class="clock-label">
          <strong>${task.text}</strong><br>
          <span>${task.label}</span>
        </div>
      </div>

      <div id="dropZone" class="drop-zone">Ziehe das passende Bild hierher 👇</div>
      <div class="options-area" id="optionsArea"></div>
    </div>
  `;

  /* ----------------------------------------------------
     🕒 Zeigerstellung basierend auf task.time
  ---------------------------------------------------- */
  const [hours, minutes] = task.time.split(":").map(Number);
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;

  const hourHand = container.querySelector(".mini-stundenzeiger");
  const minuteHand = container.querySelector(".mini-minutenzeiger");

  if (hourHand) hourHand.style.transform = `translate(-50%, -50%) rotate(${hourAngle}deg)`;
  if (minuteHand) minuteHand.style.transform = `translate(-50%, -50%) rotate(${minuteAngle}deg)`;

/* ----------------------------------------------------
   🔹 Optionen rendern 
---------------------------------------------------- */
const optionsArea = document.getElementById("optionsArea");

// Kopie der Optionsliste und zufällig mischen
const shuffledOptions = [...task.options].sort(() => Math.random() - 0.5);

shuffledOptions.forEach(opt => {
  const img = document.createElement("img");
  img.src = `assets/images/${opt}`;
  img.alt = opt.replace(".PNG", "");
  img.draggable = true;
  img.className = "draggable-option";
  img.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", opt);
  });
  optionsArea.appendChild(img);
});
   
  /* ----------------------------------------------------
     🔹 Drop-Zone Logik
  ---------------------------------------------------- */
  const dropZone = document.getElementById("dropZone");
  dropZone.addEventListener("dragover", e => e.preventDefault());
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    const selected = e.dataTransfer.getData("text/plain");

    if (selected === task.correct) {
      dropZone.textContent = "✅ Richtig!";
      dropZone.classList.add("correct");
    } else {
      dropZone.textContent = "❌ Falsch!";
      dropZone.classList.add("wrong");
    }

    setTimeout(() => {
      current++;
      if (current < level.tasks.length) {
        showTask(level.tasks[current]);
      } else {
        container.innerHTML = `<h2>🎉 ${level.title} abgeschlossen!</h2>`;
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "➡️ Weiter zum nächsten Level";
        nextBtn.className = "next-level-btn";
        nextBtn.addEventListener("click", () => window.onComplete(level.id + 1));
        container.appendChild(nextBtn);
      }
    }, 1500);
  });
}


/* Aliase, damit main.js kompatibel bleibt */
function initLevel1(cb) { startGameLevel(1, cb); }
