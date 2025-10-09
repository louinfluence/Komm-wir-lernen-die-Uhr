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

// Sanfte Bewegung der Uhrzeiger von alter zu neuer Zeit
function animateClockToTime(oldTime, newTime, duration = 1000) {
  const [oldH, oldM] = oldTime.split(":").map(Number);
  const [newH, newM] = newTime.split(":").map(Number);

  const oldHourAngle = (oldH % 12) * 30 + oldM * 0.5;
  const newHourAngle = (newH % 12) * 30 + newM * 0.5;
  const oldMinuteAngle = oldM * 6;
  const newMinuteAngle = newM * 6;

  const hourHand = document.querySelector(".mini-stundenzeiger");
  const minuteHand = document.querySelector(".mini-minutenzeiger");

  if (!hourHand || !minuteHand) return Promise.resolve();

  return new Promise(resolve => {
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1); // 0→1
      const eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;    // easeInOut
      const curH = oldHourAngle + (newHourAngle - oldHourAngle) * eased;
      const curM = oldMinuteAngle + (newMinuteAngle - oldMinuteAngle) * eased;
      hourHand.style.transform = `translate(-50%, -50%) rotate(${curH}deg)`;
      minuteHand.style.transform = `translate(-50%, -50%) rotate(${curM}deg)`;
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
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

setTimeout(async () => {
  const oldTime = task.time;
  current++;
  if (current < level.tasks.length) {
    const nextTime = level.tasks[current].time;

// Sanfte Bewegung beider Uhrzeiger – Dauer abhängig von Stundenunterschied
function animateClockToTime(oldTime, newTime, baseDuration = 1800) {
  const [oldH, oldM] = oldTime.split(":").map(Number);
  const [newH, newM] = newTime.split(":").map(Number);

  const hourHand = document.querySelector(".mini-stundenzeiger");
  const minuteHand = document.querySelector(".mini-minutenzeiger");
  if (!hourHand || !minuteHand) return Promise.resolve();

  // Ausgangspositionen
  const oldHourAngle = (oldH % 12) * 30 + oldM * 0.5;
  const oldMinuteAngle = oldM * 6;

  // Berechne Stunden-Differenz (immer vorwärts im Uhrzeigersinn)
  let hourDeltaHours = (newH - oldH + 12) % 12;
  if (hourDeltaHours === 0 && newTime !== oldTime) hourDeltaHours = 12; // z.B. 12→12

  const hourDeltaAngle = hourDeltaHours * 30;
  const newHourAngle = oldHourAngle + hourDeltaAngle;
  const newMinuteAngle = oldMinuteAngle + 360; // Minutenzeiger immer volle Runde

  // ⏱ Dauer skaliert mit Stunden-Differenz (mehr Stunden = länger)
  const duration = Math.max(baseDuration, baseDuration * (hourDeltaHours / 2));
  // Beispiel: 1h → ~1800ms, 4h → ~3600ms, 10h → ~9000ms

  return new Promise(resolve => {
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut

      const curHour = oldHourAngle + (newHourAngle - oldHourAngle) * eased;
      const curMinute = oldMinuteAngle + (newMinuteAngle - oldMinuteAngle) * eased;

      hourHand.style.transform = `translate(-50%, -50%) rotate(${curHour}deg)`;
      minuteHand.style.transform = `translate(-50%, -50%) rotate(${curMinute}deg)`;

      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}


  });
}


/* Aliase, damit main.js kompatibel bleibt */
function initLevel1(cb) { startGameLevel(1, cb); }
