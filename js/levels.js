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
   🔹 Optionen rendern (echtes Drag & Drop + manuelles Touch-Drag für iPad)
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

  // --- normales Drag für Desktop ---
  img.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", opt);
  });

  // --- manuelles Touch-Drag für iPad ---
  let touchMoveHandler, touchEndHandler;
  img.addEventListener("touchstart", e => {
    e.preventDefault();
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const clone = img.cloneNode(true);
    clone.style.position = "fixed";
    clone.style.pointerEvents = "none";
    clone.style.width = img.offsetWidth + "px";
    clone.style.height = img.offsetHeight + "px";
    clone.style.opacity = "0.8";
    clone.style.left = startX - img.offsetWidth / 2 + "px";
    clone.style.top = startY - img.offsetHeight / 2 + "px";
    clone.style.zIndex = "9999";
    document.body.appendChild(clone);

    touchMoveHandler = ev => {
      const move = ev.touches[0];
      clone.style.left = move.clientX - img.offsetWidth / 2 + "px";
      clone.style.top = move.clientY - img.offsetHeight / 2 + "px";
    };

    touchEndHandler = ev => {
      document.removeEventListener("touchmove", touchMoveHandler);
      document.removeEventListener("touchend", touchEndHandler);
      const end = ev.changedTouches[0];
      const target = document.elementFromPoint(end.clientX, end.clientY);
      clone.remove();

      const dropZone = document.getElementById("dropZone");
      if (target && dropZone.contains(target)) {
        // „Manueller Drop“
        if (opt === task.correct) {
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
            await animateClockToTime(oldTime, nextTime, 1800);
            showTask(level.tasks[current]);
          } else {
         // 🎉 Level abgeschlossen – automatisch weiter
        container.innerHTML = `<h2>🎉 ${level.title} abgeschlossen!</h2>`;
        await new Promise(res => setTimeout(res, 1500)); // kurzer Moment zum Lesen
        window.onComplete(level.id + 1); // direkt nächstes Level starten
         }
        }, 1000);
      }
    };

    document.addEventListener("touchmove", touchMoveHandler, { passive: false });
    document.addEventListener("touchend", touchEndHandler);
  }, { passive: false });

  optionsArea.appendChild(img);
});
   
/* ----------------------------------------------------
   🔹 Drop-Zone Logik
---------------------------------------------------- */
const dropZone = document.getElementById("dropZone");
dropZone.addEventListener("dragover", e => e.preventDefault());
dropZone.addEventListener("drop", async e => {
  e.preventDefault();
  const selected = e.dataTransfer.getData("text/plain");

  if (selected === task.correct) {
    dropZone.textContent = "✅ Richtig!";
    dropZone.classList.add("correct");
  } else {
    dropZone.textContent = "❌ Falsch!";
    dropZone.classList.add("wrong");
  }

  // ⏳ Wartezeit + Animation der Uhr vor nächster Aufgabe
  setTimeout(async () => {
    const oldTime = task.time;
    current++;

    if (current < level.tasks.length) {
      const nextTime = level.tasks[current].time;

      // Uhr bewegt sich weiter zur nächsten Zeit
      await animateClockToTime(oldTime, nextTime, 1800);

      showTask(level.tasks[current]);
    } else {
      container.innerHTML = `<h2>🎉 ${level.title} abgeschlossen!</h2>`;
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "➡️ Weiter zum nächsten Level";
      nextBtn.className = "next-level-btn";
      nextBtn.addEventListener("click", () => window.onComplete(level.id + 1));
      container.appendChild(nextBtn);
    }
  }, 1200);
 }); 
}  // 👈 Ende showTask()

/* =========================================================
   Sanfte Bewegung beider Uhrzeiger – Dauer abhängig von Stundenunterschied
   ========================================================= */
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

/* Aliase, damit main.js kompatibel bleibt */
function initLevel1(cb) { startGameLevel(1, cb); }

/* =========================================================
   🕓 Level 2 – Tageszeit anhand eines Bildes erkennen
   ========================================================= */
async function startLevel2(onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = "";

  const levels = await loadLevels();
  const level = levels.find(l => l.id === 2);
  if (!level) return console.error("Level 2 nicht gefunden!");

  let current = 0;

  showTask2(level.tasks[current]);

  function showTask2(task) {
    container.innerHTML = `
      <div class="task-block">
        <div class="image-preview">
          <img src="assets/images/${task.image}" alt="Situation" class="situation-img">
        </div>
        <div class="options-grid" id="optionsGrid"></div>
      </div>
    `;

    const grid = document.getElementById("optionsGrid");
    const shuffled = [...task.options].sort(() => Math.random() - 0.5);

    shuffled.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.className = "option-btn";
      btn.addEventListener("click", () => handleAnswer(option, task.correct, btn));
      grid.appendChild(btn);
    });
  }

  async function handleAnswer(selected, correct, btn) {
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(b => (b.disabled = true));

    if (selected === correct) {
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
    }

    setTimeout(async () => {
      current++;
      if (current < level.tasks.length) {
        showTask2(level.tasks[current]);
      } else {
        container.innerHTML = `<h2>🎉 ${level.title} abgeschlossen!</h2>`;
        await new Promise(r => setTimeout(r, 1500));
        onComplete(level.id + 1); // direkt weiter zu Level 3
      }
    }, 1000);
  }
}

