/* =========================================================
   LEVELS – JSON-basiertes Lernspiel mit Drag & Drop
   ========================================================= */

// 🔹 Globale Steuerungsvariablen
let level = null;
let current = 0;

/* ---------------------------------------------------------
   🔊 Zentraler Feedback-Helfer
   - Triggert globale Sound-Events, die in main.js abgefangen werden.
   - Kein Audio-Code in Level-Logik nötig.
--------------------------------------------------------- */
function reportAnswer(isCorrect) {
  const evt = new CustomEvent(isCorrect ? "answer:correct" : "answer:wrong");
  document.dispatchEvent(evt);
}

// Lädt Leveldaten aus der JSON-Datei
async function loadLevels() {
  const res = await fetch("data/levels.json");
  const data = await res.json();
  return data.levels;
}

/* =========================================================
   🕐 Haupt-Startfunktion (Level 1)
   ========================================================= */
async function startGameLevel(levelId, onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = ""; // altes Level leeren

  const levels = await loadLevels();
  level = levels.find(l => l.id === levelId);
  if (!level) return console.error("Level nicht gefunden:", levelId);

  const title = document.createElement("h2");
  title.textContent = `🎯 ${level.title}`;
  container.appendChild(title);

  const desc = document.createElement("p");
  desc.textContent = level.description;
  container.appendChild(desc);

  current = 0;
  showTask(level.tasks[current]);
  window.onComplete = onComplete;
}

/* =========================================================
   🧩 Einzelne Aufgaben anzeigen & prüfen (Level 1)
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

  // verhindert mehrfaches Auslösen des Sounds bei derselben Aufgabe
  task.__scored = false;

  // 🕒 Zeigerstellung
  const [hours, minutes] = task.time.split(":").map(Number);
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;

  const hourHand = container.querySelector(".mini-stundenzeiger");
  const minuteHand = container.querySelector(".mini-minutenzeiger");
  if (hourHand) hourHand.style.transform = `translate(-50%, -50%) rotate(${hourAngle}deg)`;
  if (minuteHand) minuteHand.style.transform = `translate(-50%, -50%) rotate(${minuteAngle}deg)`;

  // 🔹 Optionen rendern
  const optionsArea = document.getElementById("optionsArea");
  const shuffledOptions = [...task.options].sort(() => Math.random() - 0.5);

  shuffledOptions.forEach(opt => {
    const img = document.createElement("img");
    img.src = `assets/images/${opt}`;
    img.alt = opt.replace(".PNG", "");
    img.draggable = true;
    img.className = "draggable-option";

    // normales Drag & Drop (Desktop)
    img.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", opt);
    });

    // Touch-Drag (iPad)
    let touchMoveHandler, touchEndHandler;
    img.addEventListener("touchstart", e => {
      e.preventDefault();
      const touch = e.touches[0];
      const clone = img.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.pointerEvents = "none";
      clone.style.width = img.offsetWidth + "px";
      clone.style.height = img.offsetHeight + "px";
      clone.style.opacity = "0.8";
      clone.style.left = touch.clientX - img.offsetWidth / 2 + "px";
      clone.style.top = touch.clientY - img.offsetHeight / 2 + "px";
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
          if (opt === task.correct) {
            dropZone.textContent = "✅ Richtig!";
            dropZone.classList.add("correct");
            if (!task.__scored) {
              task.__scored = true;               // Mehrfach-Trigger vermeiden
              reportAnswer(true);                  // zentraler Event -> Erfolgston
            }
          } else {
            dropZone.textContent = "❌ Falsch!";
            dropZone.classList.add("wrong");
            reportAnswer(false);                   // zentraler Event -> Fehlerton
          }

          setTimeout(async () => {
            const oldTime = task.time;
            current++;
            if (current < level.tasks.length) {
              const nextTime = level.tasks[current].time;
              await animateClockToTime(oldTime, nextTime, 1800);
              showTask(level.tasks[current]);
            } else {
              showLevelComplete(level, window.onComplete);
            }
          }, 1000);
        }
      };

      document.addEventListener("touchmove", touchMoveHandler, { passive: false });
      document.addEventListener("touchend", touchEndHandler);
    }, { passive: false });

    optionsArea.appendChild(img);
  });

  // 🖱️ Drop-Zone Logik (Desktop)
  const dropZone = document.getElementById("dropZone");
  dropZone.addEventListener("dragover", e => e.preventDefault());
  dropZone.addEventListener("drop", async e => {
    e.preventDefault();
    const selected = e.dataTransfer.getData("text/plain");

    if (selected === task.correct) {
      dropZone.textContent = "✅ Richtig!";
      dropZone.classList.add("correct");
      if (!task.__scored) {
        task.__scored = true;
        reportAnswer(true);   // zentraler Erfolgston
      }
    } else {
      dropZone.textContent = "❌ Falsch!";
      dropZone.classList.add("wrong");
      reportAnswer(false);    // zentraler Fehlerton
    }

    setTimeout(async () => {
      const oldTime = task.time;
      current++;

      if (current < level.tasks.length) {
        const nextTime = level.tasks[current].time;
        await animateClockToTime(oldTime, nextTime, 1800);
        showTask(level.tasks[current]);
      } else {
        showLevelComplete(level, window.onComplete);
      }
    }, 1200);
  });
}

/* =========================================================
   Sanfte Bewegung beider Uhrzeiger
   ========================================================= */
function animateClockToTime(oldTime, newTime, baseDuration = 1800) {
  const [oldH, oldM] = oldTime.split(":").map(Number);
  const [newH, newM] = newTime.split(":").map(Number);

  const hourHand = document.querySelector(".mini-stundenzeiger");
  const minuteHand = document.querySelector(".mini-minutenzeiger");
  if (!hourHand || !minuteHand) return Promise.resolve();

  const oldHourAngle = (oldH % 12) * 30 + oldM * 0.5;
  const oldMinuteAngle = oldM * 6;

  let hourDeltaHours = (newH - oldH + 12) % 12;
  if (hourDeltaHours === 0 && newTime !== oldTime) hourDeltaHours = 12;

  const hourDeltaAngle = hourDeltaHours * 30;
  const newHourAngle = oldHourAngle + hourDeltaAngle;
  const newMinuteAngle = oldMinuteAngle + 360;

  const duration = Math.max(baseDuration, baseDuration * (hourDeltaHours / 2));

  return new Promise(resolve => {
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
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

/* =========================================================
   Einheitlicher Abschluss-Bildschirm
   ========================================================= */
function showLevelComplete(level, onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = `<h2>🎉 ${level.title} abgeschlossen!</h2>`;

  const btn = document.createElement("button");
  btn.className = "next-level-btn";
  btn.textContent = `➡️ Weiter zu Level ${level.id + 1}`;

  btn.addEventListener("click", () => {
    container.innerHTML = "";

    if (typeof initLevel1 === "function" && level.id + 1 === 1) initLevel1(showLevelComplete);
    else if (typeof startLevel2 === "function" && level.id + 1 === 2) startLevel2(showLevelComplete);
    else if (typeof initLevel3 === "function" && level.id + 1 === 3) initLevel3(showLevelComplete);
    else container.innerHTML = `<h2>🎉 Alle Level abgeschlossen!</h2>`;
  });

  container.appendChild(btn);
}

/* =========================================================
   🕓 Level 2 – Tageszeit anhand eines Bildes erkennen
   ========================================================= */
async function startLevel2(onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = "";

  const levels = await loadLevels();
  level = levels.find(l => l.id === 2);
  if (!level || !level.tasks) {
    console.error("Level 2 nicht gefunden oder fehlerhaft:", level);
    container.innerHTML = "<p>❌ Fehler beim Laden des Levels.</p>";
    return;
  }

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
      reportAnswer(true);
    } else {
      btn.classList.add("wrong");
      reportAnswer(false);
    }

    setTimeout(async () => {
      current++;
      if (current < level.tasks.length) {
        showTask2(level.tasks[current]);
      } else {
        showLevelComplete(level, onComplete);
      }
    }, 1000);
  }
}

/* =========================================================
   🕒 Level 3 – Digital eingeben (HH:MM) → analoge Uhr stellt sich
   - 4 zufällige Fragen aus level.questions
   - Keine Richtig/Falsch-Logik, nur Visualisierung
   - Nutzt assets / timeRange / background aus levels.json
========================================================= */
async function initLevel3(onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = "";

  // Level 3 laden
  const levels = await loadLevels();
  level = levels.find(l => l.id === 3 && l.type === "clockInput");
  if (!level) {
    console.error("Level 3 (clockInput) nicht gefunden.");
    container.innerHTML = "<p>❌ Fehler beim Laden von Level 3.</p>";
    return;
  }

  // 4 zufällige Fragen wählen
  const idx = Array.from({length: level.questions.length}, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const picked = idx.slice(0, 4);
  let step = 0;

  // UI-Gerüst
  container.innerHTML = `
    <div class="clockInput-container">
      <h2>${level.title}</h2>
      <p id="clockQuestion"></p>

      <div class="clock-wrapper">
        <img id="clockFace"   src="${level.assets.clockFace}"  alt="Ziffernblatt">
        <img id="hourHand"    src="${level.assets.hourHand}"   alt="Stundenzeiger">
        <img id="minuteHand"  src="${level.assets.minuteHand}" alt="Minutenzeiger">
      </div>

      <div class="time-input">
        <label class="visually-hidden" for="hoursInput">Stunden</label>
        <input id="hoursInput" type="number"
               min="${level.timeRange.minHour}" max="${level.timeRange.maxHour}"
               value="7" inputmode="numeric" pattern="[0-9]*" aria-label="Stunden">
        <span>:</span>
        <label class="visually-hidden" for="minutesInput">Minuten</label>
        <input id="minutesInput" type="number"
               min="0" max="59" value="0" inputmode="numeric" pattern="[0-9]*" aria-label="Minuten">
      </div>

      <div class="clockInput-actions">
        <button id="nextQuestionBtn" type="button">Nächste Frage</button>
        <span id="progressInfo" aria-live="polite"></span>
      </div>
    </div>
  `;

  // Elemente holen
  const hourInput  = document.getElementById("hoursInput");
  const minuteInput= document.getElementById("minutesInput");
  const hourHand   = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const questionEl = document.getElementById("clockQuestion");
  const nextBtn    = document.getElementById("nextQuestionBtn");
  const progressEl = document.getElementById("progressInfo");

  // Hilfsfunktionen
  const clamp = (v, min, max) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
  const pad2  = n => String(n).padStart(2, "0");

  function updateClockFromInputs() {
    let h = clamp(parseInt(hourInput.value),  level.timeRange.minHour, level.timeRange.maxHour);
    let m = clamp(parseInt(minuteInput.value), 0, 59);

    // Werte normalisieren/visual fix
    hourInput.value   = pad2(h);
    minuteInput.value = pad2(m);

    // Zeiger stellen
    const hourAngle   = (h % 12) * 30 + m * 0.5;
    const minuteAngle = m * 6;
    hourHand.style.transform   = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;

    // Optional: Hintergrund Tag/Nacht
    if (level.background === "daynight") {
      document.body.classList.toggle("night-mode", h < 6 || h >= 20);
    }
  }

  function renderStep() {
    const qIdx = picked[step];
    questionEl.textContent = level.questions[qIdx];
    progressEl.textContent = `Frage ${step + 1} / ${picked.length}`;

    // sinnvolle Startwerte je nach Frage (optional minimal)
    if (step === 0) { hourInput.value = "07"; minuteInput.value = "00"; }
    updateClockFromInputs();
  }

  // Eingaben live verarbeiten
  hourInput.addEventListener("input", updateClockFromInputs);
  minuteInput.addEventListener("input", updateClockFromInputs);

  // Enter → nächste Frage (komfortabel auf iPad mit Tastatur)
  [hourInput, minuteInput].forEach(inp => {
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") nextBtn.click();
    });
  });

  // Weiter
  nextBtn.addEventListener("click", () => {
    step++;
    if (step < picked.length) {
      renderStep();
    } else {
      showLevelComplete(level, onComplete);
    }
  });

  // Initial
  renderStep();
}

/* =========================================================
   Aliase, damit main.js kompatibel bleibt
   ========================================================= */
function initLevel1(cb) { startGameLevel(1, cb); }
function initLevel2(cb) { startLevel2(cb); }




// ⚠️ WICHTIG: KEIN Top-Level-Block für Level 3 hier.
// initLevel3(cb) wird später implementiert, wenn Level 3 genutzt wird.