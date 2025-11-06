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
   🕒 Level 3 – iOS-Time-Picker (HH:MM) → analoge Uhr stellt sich
   - 4 zufällige Fragen
   - Time-Picker links, Uhr rechts
   - Dynamischer Satz „Du … um HH:MM Uhr …“
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
  const idx = Array.from({ length: level.questions.length }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const picked = idx.slice(0, 4);
  let step = 0;

  // UI
  container.innerHTML = `
    <div class="clockInput-container">
      <h2>${level.title}</h2>

      <div class="clock-layout">
        <div class="time-col">
          <p id="clockQuestion" class="question"></p>

          <div class="time-input time-input--ios">
            <label class="visually-hidden" for="timeInput">Uhrzeit wählen</label>
            <input id="timeInput" type="time" min="00:00" max="23:59" step="60" aria-label="Uhrzeit">
          </div>

          <p id="selectionEcho" class="selection-echo" aria-live="polite"></p>

          <div class="clockInput-actions">
            <button id="nextQuestionBtn" type="button">Nächste Frage</button>
            <span id="progressInfo" class="progress" aria-live="polite"></span>
          </div>
        </div>

        <div class="clock-col">
          <div class="clock-wrapper">
            <img id="clockFace"   src="${level.assets.clockFace}"  alt="Ziffernblatt 24-Stunden">
            <img id="hourHand"    src="${level.assets.hourHand}"   alt="Stundenzeiger">
            <img id="minuteHand"  src="${level.assets.minuteHand}" alt="Minutenzeiger">
          </div>
        </div>
      </div>
    </div>
  `;

  // Elemente
  const timeInput  = document.getElementById("timeInput");
  const hourHand   = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");
  const questionEl = document.getElementById("clockQuestion");
  const echoEl     = document.getElementById("selectionEcho");
  const nextBtn    = document.getElementById("nextQuestionBtn");
  const progressEl = document.getElementById("progressInfo");

  // ---- Live-Update für iOS/Keyboard ----
const pad2 = n => String(n).padStart(2, "0");

function setClock(h, m) {
  const hourAngle   = (h % 12) * 30 + m * 0.5;
  const minuteAngle = m * 6;
  hourHand.style.transform   = `rotate(${hourAngle}deg)`;
  minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
  if (level.background === "daynight") {
    document.body.classList.toggle("night-mode", h < 6 || h >= 20);
  }
}
function makeEchoSentence(q, hh, mm) {
  // Basis: Frage aufbereiten
  let core = q.trim()
    .replace(/^Wann\s+/i, "")   // "Wann " entfernen
    .replace(/\?$/, "")         // Fragezeichen weg
    .replace(/\bdu\b/i, "")     // überflüssiges "du" löschen
    .replace(/\s{2,}/g, " ")    // doppelte Leerzeichen aufräumen
    .trim();

  // Kleine grammatische Korrekturen
  core = core
    .replace(/^isst\s+du/i, "isst")        // "isst du" → "isst"
    .replace(/^machst\s+du/i, "machst")    // "machst du" → "machst"
    .replace(/^gehst\s+du/i, "gehst")      // "gehst du" → "gehst"
    .replace(/^stehst\s+du/i, "stehst")    // "stehst du" → "stehst"
    .replace(/^spielst\s+du/i, "spielst"); // "spielst du" → "spielst"

  return `Du ${core} um ${pad2(hh)}:${pad2(mm)} Uhr.`;
}
function makeEchoSentence(q, hh, mm) {
  // Basis: Frage aufbereiten
  let core = q.trim()
    .replace(/^Wann\s+/i, "")   // "Wann " entfernen
    .replace(/\?$/, "")         // Fragezeichen weg
    .replace(/\bdu\b/i, "")     // überflüssiges "du" löschen
    .replace(/\s{2,}/g, " ")    // doppelte Leerzeichen aufräumen
    .trim();

  // Kleine grammatische Korrekturen
  core = core
    .replace(/^isst\s+du/i, "isst")        // "isst du" → "isst"
    .replace(/^machst\s+du/i, "machst")    // "machst du" → "machst"
    .replace(/^gehst\s+du/i, "gehst")      // "gehst du" → "gehst"
    .replace(/^stehst\s+du/i, "stehst")    // "stehst du" → "stehst"
    .replace(/^spielst\s+du/i, "spielst"); // "spielst du" → "spielst"

  return `Du ${core} um ${pad2(hh)}:${pad2(mm)} Uhr.`;
}
function updateFromPicker() {
  if (!timeInput.value) return;
  const [hh, mm] = timeInput.value.split(":").map(v => parseInt(v, 10));
  setClock(hh, mm);
  echoEl.textContent = makeEchoSentence(questionEl.textContent, hh, mm);
}

// ► normale Events (reichen oft schon)
timeInput.addEventListener("input",  updateFromPicker);
timeInput.addEventListener("change", updateFromPicker);
timeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") nextBtn.click(); });

// ► Zusatz: Polling, solange der iOS-Picker offen ist
let _syncTimer = null;
let _lastVal   = "";
function _tickSync() {
  if (timeInput.value && timeInput.value !== _lastVal) {
    _lastVal = timeInput.value;
    updateFromPicker();
  }
}
function _startSync() {
  if (_syncTimer) return;
  _lastVal = timeInput.value || "";
  _syncTimer = setInterval(_tickSync, 80); // angenehm flüssig, ressourcenschonend
}
function _stopSync() {
  if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; }
}
timeInput.addEventListener("focus", _startSync);
timeInput.addEventListener("blur",  _stopSync);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) _stopSync();
});

// beim Seiten-/Schritt-Start initial stellen
function renderStep() {
  const qIdx = picked[step];
  questionEl.textContent = level.questions[qIdx];
  progressEl.textContent = `Frage ${step + 1} / ${picked.length}`;
  if (step === 0) timeInput.value = "07:00";
  updateFromPicker();
}

  // Events
  timeInput.addEventListener("input",  updateFromPicker);
  timeInput.addEventListener("change", updateFromPicker);
  timeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") nextBtn.click(); });

  nextBtn.addEventListener("click", () => {
    step++;
    if (step < picked.length) renderStep();
    else showLevelComplete(level, onComplete);
  });

  // Init
  renderStep();
}

/* =========================================================
   🕑 Level 4 – Volle Stunden 1 (nur ganze Stunden)
   Assets:
    - assets/images/zbuhr.png           (Zifferblatt)
    - assets/images/roterzeiger.png     (Stundenzeiger)
    - assets/images/schwarzerzeiger.png (Minutenzeiger)
========================================================= */
function startLevel4(onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = "";

  // --- kleines Style-Snippet für Blinken, falls nicht vorhanden ---
  if (!document.getElementById("l4-pulse-style")) {
    const st = document.createElement("style");
    st.id = "l4-pulse-style";
    st.textContent = `
      @keyframes l4pulse { 0%{opacity:.45; transform:scale(.98)} 100%{opacity:1; transform:scale(1)} }
      .l4-blink { animation: l4pulse .6s ease-in-out infinite alternate; }
      .l4-clock { position:relative; width:280px; height:280px; margin:12px auto; }
      .l4-clock img { position:absolute; top:0; left:0; width:100%; transform-origin:50% 50%; pointer-events:none; }
      .l4-intro { background:#ffffff; border-radius:14px; padding:16px 18px; box-shadow:0 6px 18px rgba(0,0,0,.12); margin:8px auto 14px; max-width:520px; }
      .l4-actions { margin:10px 0 2px; display:flex; gap:10px; justify-content:center; align-items:center; }
      .l4-btn { background:linear-gradient(135deg,#4caf50,#81c784); color:#fff; border:0; border-radius:12px; padding:10px 16px; font-weight:700; cursor:pointer; }
      .l4-grid { display:grid; grid-template-columns:repeat(2, min(220px, 42vw)); gap:10px; justify-content:center; margin-top:10px; }
      .l4-opt { padding:12px; border-radius:10px; border:2px solid var(--menu-border, #cdd5df); background:var(--menu-bg, #f6f8fb); font-size:1.2rem; cursor:pointer; }
      .l4-opt.correct { background:#4caf50; color:#fff; border-color:#2e7d32; }
      .l4-opt.wrong   { background:#e53935; color:#fff; border-color:#b71c1c; }
      .l4-progress { margin-top:4px; font-size:.95rem; opacity:.75; }
    `;
    document.head.appendChild(st);
  }

  // --- Grundgerüst ---
  container.innerHTML = `
    <h2>Level 4 – Volle Stunden</h2>

    <div class="l4-intro" id="l4Intro">
      <p><strong>Merke:</strong> Der <span style="color:#d32f2f;">rote Zeiger</span> ist der <strong>Stundenzeiger</strong>.
      Er zeigt auf die Zahl der <strong>Stunde</strong>. Steht er z.&nbsp;B. auf der 6, ist es <strong>6&nbsp;Uhr</strong>.</p>
      <div class="l4-actions"><button id="l4StartBtn" class="l4-btn">Los geht’s</button></div>
    </div>

    <div class="l4-clock">
      <img id="l4Face" src="assets/images/zbuhr.png" alt="Zifferblatt">
      <img id="l4Hour" src="assets/images/roterzeiger.png" alt="Stundenzeiger">
      <img id="l4Min"  src="assets/images/schwarzerzeiger.png" alt="Minutenzeiger">
    </div>

    <div id="l4QA" style="display:none;">
      <div class="l4-grid" id="l4Options"></div>
      <div class="l4-progress" id="l4Prog"></div>
    </div>
  `;

  // --- Elemente holen ---
  const hourHand = document.getElementById("l4Hour");
  const minHand  = document.getElementById("l4Min");
  const startBtn = document.getElementById("l4StartBtn");
  const qaWrap   = document.getElementById("l4QA");
  const optGrid  = document.getElementById("l4Options");
  const progEl   = document.getElementById("l4Prog");
  const introBox = document.getElementById("l4Intro");

  // Minutenzeiger fürs Intro verstecken
  minHand.style.display = "none";

  // kleine Intro-Stunde (z.B. 3 Uhr) zum Erklären anzeigen
  setClock(3, 0, /*blinkHour=*/true);


  // --- Quiz-Parameter ---
  const TOTAL = 6;      // Anzahl Aufgaben
  let step = 0;

  // Klick auf „Los geht’s“ → Minutenzeiger wieder zeigen + Quiz starten
  startBtn.addEventListener("click", () => {
    // Minutenzeiger sichtbar
    minHand.style.display = "block";
    // Blink vom Stundenzeiger beenden
    hourHand.classList.remove("l4-blink");
    // Intro ausblenden, Fragenbereich zeigen
    introBox.style.display = "none";
    qaWrap.style.display = "block";
    nextQuestion();
  });

  // ---- Hilfen ----
  function setClock(h, m, blinkHour=false) {
    // Minutenzeiger
    const minuteAngle = m * 6; // 60m → 360°
    minHand.style.transform = `rotate(${minuteAngle}deg)`;

    // Stundenzeiger (DEIN Zeiger muss um 180° gespiegelt werden)
    const hourAngle = (h % 12) * 30 + m * 0.5 + 180;
    hourHand.style.transform = `rotate(${hourAngle}deg)`;

    if (blinkHour) hourHand.classList.add("l4-blink");
    else           hourHand.classList.remove("l4-blink");
  }

  function randHour() {
    return Math.floor(Math.random() * 12) + 1; // 1..12
  }

  function buildOptions(correctHour) {
    const set = new Set([correctHour]);
    while (set.size < 4) set.add(randHour());
    const arr = Array.from(set);
    // shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function nextQuestion() {
    step++;
    if (step > TOTAL) {
      showLevelComplete({ title: "Volle Stunden 1", id: 4 }, onComplete);
      return;
    }

    const hour = randHour();
    setClock(hour, 0);

    const options = buildOptions(hour);
    optGrid.innerHTML = "";
    options.forEach(h => {
      const btn = document.createElement("button");
      btn.className = "l4-opt";
      btn.textContent = `${h} Uhr`;
      btn.addEventListener("click", () => handleAnswer(h, hour, btn));
      optGrid.appendChild(btn);
    });

    progEl.textContent = `Frage ${step} / ${TOTAL}`;
  }

  function handleAnswer(chosen, correct, btn) {
    // Buttons sperren
    optGrid.querySelectorAll("button").forEach(b => b.disabled = true);

    if (chosen === correct) {
      btn.classList.add("correct");
      reportAnswer(true);
    } else {
      btn.classList.add("wrong");
      reportAnswer(false);
      // richtigen markieren
      optGrid.querySelectorAll("button").forEach(b => {
        if (b.textContent.startsWith(correct + " ")) b.classList.add("correct");
      });
    }

    setTimeout(nextQuestion, 900);
  }
}

/* =========================================================
   🕓 Level 5 – Volle Stunden ohne Zahlen (MCQ)
   - 6 Zufallsaufgaben aus 1..12
   - Intro mit nur Stundenzeiger, dann Spiel mit 4 Antwortoptionen
========================================================= */
async function startLevel5(onComplete) {
  const container = document.getElementById("gameContainer");
  container.innerHTML = "";

  const levels = await loadLevels();
  const cfg = levels.find(l => l.id === 5 && l.type === "hours-mcq");
  if (!cfg) {
    console.error("Level 5 (hours-mcq) nicht gefunden.");
    container.innerHTML = "<p>❌ Fehler beim Laden von Level 5.</p>";
    return;
  }

  // --- Intro: Uhr ohne Zahlen, nur Stundenzeiger sichtbar ---
  container.innerHTML = `
    <div class="task-block">
      <h2>${cfg.title}</h2>
      <p style="max-width:600px;margin:0 auto 1rem;">${cfg.introText}</p>

      <div class="clock-wrapper" style="width:260px;height:260px;position:relative;margin:1rem auto;">
        <img src="${cfg.assets.clockFace}"  alt="Uhr ohne Zahlen" style="position:absolute;inset:0;width:100%;height:100%;transform-origin:50% 50%;">
        <img id="lv5Hour" src="${cfg.assets.hourHand}"   alt="Stundenzeiger" style="position:absolute;inset:0;width:100%;height:100%;transform-origin:50% 50%;animation:blink 1s step-end infinite;">
        <!-- Minutenzeiger im Intro ausgeblendet -->
      </div>

      <button id="lv5Start" class="next-level-btn">Los geht’s</button>
    </div>
  `;

  // Stundenzeiger ins Intro auf 12 Uhr setzen (deutlich)
  const hIntro = document.getElementById("lv5Hour");
  if (hIntro) hIntro.style.transform = `rotate(0deg)`; // 12 Uhr

  // kleine Blink-Animation, falls nicht vorhanden
  const styleId = "lv5BlinkStyle";
  if (!document.getElementById(styleId)) {
    const st = document.createElement("style");
    st.id = styleId;
    st.textContent = `@keyframes blink { 50% { opacity: .25 } }`;
    document.head.appendChild(st);
  }

  document.getElementById("lv5Start")?.addEventListener("click", () => runGame(cfg, onComplete));

  function runGame(cfg, onComplete) {
    // — Spielaufbau
    const hours = [...cfg.hours]; // 1..12
    // shuffle
    for (let i = hours.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hours[i], hours[j]] = [hours[j], hours[i]];
    }
    const picked = hours.slice(0, Math.max(1, Math.min(cfg.numTasks || 6, hours.length)));

    let index = 0;

    container.innerHTML = `
      <div class="task-block">
        <h2>${cfg.title}</h2>
        <p id="lv5Progress" style="margin-top:-.5rem;"></p>

        <div class="clock-wrapper" style="width:260px;height:260px;position:relative;margin:1rem auto;">
          <img src="${cfg.assets.clockFace}"  alt="Uhr ohne Zahlen" style="position:absolute;inset:0;width:100%;height:100%;transform-origin:50% 50%;">
          <img id="lv5HourG" src="${cfg.assets.hourHand}"   alt="Stundenzeiger" style="position:absolute;inset:0;width:100%;height:100%;transform-origin:50% 50%;">
          <img id="lv5MinG"  src="${cfg.assets.minuteHand}" alt="Minutenzeiger" style="position:absolute;inset:0;width:100%;height:100%;transform-origin:50% 50%;">
        </div>

        <p style="font-weight:600">Wie spät ist es?</p>
        <div id="lv5Options" class="options-grid" style="max-width:520px;"></div>
      </div>
    `;

    const hourImg  = document.getElementById("lv5HourG");
    const minuteImg= document.getElementById("lv5MinG");
    const optsWrap = document.getElementById("lv5Options");
    const prog     = document.getElementById("lv5Progress");

    function showRound() {
      const h = picked[index];            // 1..12
      const m = 0;                        // volle Stunde
      // Minutenzeiger wird zur Spielrunde eingeblendet (Wunsch aus L4)
      if (minuteImg) minuteImg.style.display = "block";

      // Zeiger stellen
      const hourAngle   = (h % 12) * 30 + m * 0.5;
      const minuteAngle = m * 6;
      if (hourImg)   hourImg.style.transform   = `rotate(${hourAngle}deg)`;
      if (minuteImg) minuteImg.style.transform = `rotate(${minuteAngle}deg)`;

      // Fortschritt
      if (prog) prog.textContent = `Aufgabe ${index + 1} / ${picked.length}`;

      // 4 Antwortoptionen (eine korrekt, drei falsch)
      const pool = [1,2,3,4,5,6,7,8,9,10,11,12].filter(x => x !== h);
      // 3 zufällige falsche Antworten
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const wrongs = pool.slice(0, 3);
      const options = [h, ...wrongs].sort(() => Math.random() - 0.5);

      optsWrap.innerHTML = "";
      options.forEach(val => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = `${val} Uhr`;
        btn.addEventListener("click", () => handle(val === h, btn));
        optsWrap.appendChild(btn);
      });
    }

    function handle(correct, btn) {
      // Buttons sperren
      optsWrap.querySelectorAll("button").forEach(b => b.disabled = true);

      if (correct) {
        btn.classList.add("correct");
        reportAnswer(true);
      } else {
        btn.classList.add("wrong");
        reportAnswer(false);
      }

      setTimeout(() => {
        index++;
        if (index < picked.length) {
          showRound();
        } else {
          showLevelComplete({ id: 5, title: cfg.title }, onComplete);
        }
      }, 900);
    }

    showRound();
  }
}


/* =========================================================
   Aliase, damit main.js kompatibel bleibt
   ========================================================= */
function initLevel1(cb){ startGameLevel(1, cb); }
function initLevel2(cb){ startLevel2(cb); }
function initLevel4(cb) { startLevel4(cb); }




// ⚠️ WICHTIG: KEIN Top-Level-Block für Level 3 hier.
// initLevel3(cb) wird später implementiert, wenn Level 3 genutzt wird.
