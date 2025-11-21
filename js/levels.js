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
   🕑 LEVEL 4 – Volle Stunden 1 (nur ganze Stunden)
   Intro: Uhr steht auf 6 Uhr, Stundenzeiger pulsiert
   Quiz: 6 Aufgaben, ganze Stunden 1–12, 4 Optionen
   Assets:
    - assets/images/zbuhr.png           (Zifferblatt)
    - assets/images/roterzeiger.png     (Stundenzeiger)
    - assets/images/schwarzerzeiger.png (Minutenzeiger)
========================================================= */
function initLevel4(cb){ startLevel4(cb); }

function startLevel4(onComplete) {
  const container = document.getElementById("gameContainer");
  if (!container) return;
  container.innerHTML = "";

  // --- Styles (Blinken & Layout wie in Level 5) ---
  if (!document.getElementById("l4-style")) {
    const st = document.createElement("style");
    st.id = "l4-style";
    st.textContent = `
      @keyframes l4pulse{0%{opacity:.45;transform:scale(.98)}100%{opacity:1;transform:scale(1)}}
      .l4-blink{animation:l4pulse .6s ease-in-out infinite alternate}
      .l4-clock{position:relative;width:280px;height:280px;margin:12px auto}
      .l4-clock img{position:absolute;top:0;left:0;width:100%;transform-origin:50% 50%;pointer-events:none}
      .l4-actions{display:flex;justify-content:center;margin-top:10px}
      .options-grid{display:grid;grid-template-columns:repeat(2,min(220px,42vw));gap:10px;justify-content:center;margin-top:10px}
      .option-btn{padding:12px;border-radius:10px;border:2px solid var(--menu-border,#cdd5df);background:var(--menu-bg,#f6f8fb);font-size:1.2rem;cursor:pointer}
      .option-btn.correct{background:#4caf50;color:#fff;border-color:#2e7d32}
      .option-btn.wrong{background:#e53935;color:#fff;border-color:#b71c1c}
      .l4-progress{margin-top:6px;opacity:.75}
    `;
    document.head.appendChild(st);
  }

  // --- Helfer für Winkel/Zeiger ---
  const HOUR_SPRITE_OFFSET = 180; // ggf. 0/90/180/270 je nach PNG-Ausrichtung
  const rnd = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;

  const hourToAngle   = (h,m=0) => (h%12)*30 + m*0.5 + HOUR_SPRITE_OFFSET;
  const minuteToAngle = (m)    => m*6;

  const setHour   = (el,h,turns=0)=> el.style.transform   = `rotate(${hourToAngle(h)+360*turns}deg)`;
  const setMinute = (el,m)=>        el.style.transform     = `rotate(${minuteToAngle(m)}deg)`;

  const buildClock = ({showMinute=false}={})=>{
    const wrap = document.createElement("div");
    wrap.className = "l4-clock";
    wrap.innerHTML = `
      <img id="l4Face" src="assets/images/zbuhr.png" alt="Zifferblatt">
      ${showMinute ? `<img id="l4Min"  src="assets/images/schwarzerzeiger.png" alt="Minutenzeiger">` : ``}
      <img id="l4Hour" src="assets/images/roterzeiger.png"     alt="Stundenzeiger">
    `;
    return wrap;
  };

  // --- Intro (statisch 6 Uhr, pulsierender Stundenzeiger) ---
  const intro = document.createElement("div");
  intro.className = "task-block";
  intro.innerHTML = `
    <h2>Level 4 – Volle Stunden</h2>
    <p><strong>Merke:</strong> Der <span style="color:#d32f2f;">rote Zeiger</span> ist der <strong>Stundenzeiger</strong>.
       Er zeigt auf die Zahl der Stunde. Steht er auf der 6, ist es <strong>6&nbsp;Uhr</strong>.</p>
  `;

  const clockIntro = buildClock({showMinute:false}); // Minutenzeiger im Intro ausgeblendet
  const hourIntro  = clockIntro.querySelector("#l4Hour");
  setHour(hourIntro, 6, 0);           // ← fest auf 6 Uhr stellen
  hourIntro.classList.add("l4-blink"); // pulsieren lassen

  intro.appendChild(clockIntro);

  const startBtn = document.createElement("button");
  startBtn.id = "l4StartBtn";
  startBtn.className = "next-level-btn";
  startBtn.textContent = "Los geht’s";
  const actions = document.createElement("div");
  actions.className = "l4-actions";
  actions.appendChild(startBtn);
  intro.appendChild(actions);

  container.appendChild(intro);

  // --- Quiz (6 Aufgaben) ---
  const TOTAL = 6;
  let step = 0;

  // ✨ NEU: innerhalb einer Runde keine doppelte Stunde
  const usedHours = new Set();

  function pickHourUnique() {
    let h, guard = 0;
    do {
      h = rnd(1,12);
      guard++;
      if (guard > 50) break; // Fallback-Schutz
    } while (usedHours.has(h));
    usedHours.add(h);
    return h;
  }
  function buildRound() {
    container.innerHTML = "";
    const block = document.createElement("div");
    block.className = "task-block";

    block.innerHTML = `
      <h3>Welche Uhrzeit ist das?</h3>
      <p class="explain">Tipp: oben=12, rechts=3, unten=6, links=9.</p>
    `;

    // Uhr MIT Minutenzeiger (auf 12)
    const clock = buildClock({showMinute:true});
    const hEl = clock.querySelector("#l4Hour");
    const mEl = clock.querySelector("#l4Min");
    const hour = pickHourUnique();
    setHour(hEl, hour, 0);
    setMinute(mEl, 0);
    block.appendChild(clock);

    // Optionen
    const optsWrap = document.createElement("div");
    optsWrap.className = "options-grid";
    const opts = new Set([hour]);
    while (opts.size < 4) opts.add(rnd(1,12));
    const options = [...opts].sort(()=>Math.random()-0.5);
    options.forEach(val=>{
      const b = document.createElement("button");
      b.className = "option-btn";
      b.textContent = `${val} Uhr`;
      b.addEventListener("click",()=>handleAnswer(val===hour,b,optsWrap,()=>next()));
      optsWrap.appendChild(b);
    });
    block.appendChild(optsWrap);

    // Fortschritt
    const prog = document.createElement("p");
    prog.className = "l4-progress";
    prog.textContent = `Frage ${step+1} / ${TOTAL}`;
    block.appendChild(prog);

    container.appendChild(block);
  }

  function handleAnswer(ok, btn, scope, after){
    scope.querySelectorAll("button").forEach(b=>b.disabled=true);
    if (ok){ btn.classList.add("correct"); reportAnswer(true); }
    else   { btn.classList.add("wrong");   reportAnswer(false); }
    setTimeout(after, 900);
  }

  function next(){
    step++;
    if (step < TOTAL) buildRound();
        else {
      usedHours.clear();        // ✨ optionaler Reset für spätere Replays
      showLevelComplete({ title:"Volle Stunden 1", id:4 }, onComplete);
    }
  }

  // Start-Button: Intro → Quiz
    startBtn.addEventListener("click", ()=>{
    hourIntro.classList.remove("l4-blink");
    usedHours.clear();          // ✨ NEU: neue Spielrunde -> Reset
    step = 0;
    buildRound();
  });
}

/* =========================================================
   🕒 LEVEL 5 – Volle Stunden ohne Ziffern
   - Intro: Zeiger 12→3→6→9 (loop), 1s Startdelay
   - 6 Runden, zufällige volle Stunde (1–12)
   - 4 Antwortoptionen, 1 korrekt
========================================================= */
function initLevel5(cb) { startLevel5(cb); }

async function startLevel5(onComplete) {
  const container = document.getElementById("gameContainer");
  if (!container) return;

  // ---------- Helpers ----------
  const rnd     = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

  // Falls der Stundenzeiger „spiegelverkehrt“ wirkt, Offset anpassen (0/90/180/270)
  const HOUR_SPRITE_OFFSET = 180;

  function hourToAngle(h) {
    return (h % 12) * 30 + HOUR_SPRITE_OFFSET;
  }
  function setHour(el, h, turns = 0) {
    const angle = hourToAngle(h) + 360 * turns;
    el.style.transformOrigin = "50% 50%";
    el.style.transform = `rotate(${angle}deg)`;
  }

  function buildClockDOM({
    face   = "assets/images/kzuhr.png",
    hour   = "assets/images/roterzeiger.png",
    minute = "assets/images/schwarzerzeiger.png",
    showMinute = false
  } = {}) {
    const wrap = document.createElement("div");
    wrap.className = "clock-wrapper";
    wrap.innerHTML = `
      <img id="lv5Face"   src="${face}"   alt="Ziffernblatt ohne Zahlen">
      ${showMinute ? `<img id="lv5Minute" src="${minute}" alt="Minutenzeiger">` : ``}
      <img id="lv5Hour"   src="${hour}"   alt="Stundenzeiger">
    `;
    return wrap;
  }

  // ---------- Intro ----------
  container.innerHTML = "";
  const intro = document.createElement("div");
  intro.className = "task-block";
  intro.innerHTML = `
    <h2>Level 5: Uhr ohne Zahlen</h2>
    <p class="explain">
      Manche Uhren haben keine Ziffern. Merke dir:
      <strong>oben = 12</strong>, <strong>rechts = 3</strong>,
      <strong>unten = 6</strong>, <strong>links = 9</strong>.
    </p>
  `;

  // Intro ohne Minutenzeiger
  const introClock = buildClockDOM({ showMinute: false });
  const label = document.createElement("p");
  label.id = "lv5IntroLabel";
  label.className = "intro-label";
  label.setAttribute("aria-live", "polite");
  label.style.opacity = 0;

  const goBtn = document.createElement("button");
  goBtn.className = "next-level-btn";
  goBtn.textContent = "Los geht’s";

  intro.appendChild(introClock);
  intro.appendChild(label);
  intro.appendChild(goBtn);
  container.appendChild(intro);

  const hourHandIntro = introClock.querySelector("#lv5Hour");

  // Endlos vorwärts: 12 → 3 → 6 → 9 → 12(+360) …
  const seqHours = [12, 3, 6, 9];
  let introAlive = true;
  let introTimer = null;

  function runIntro() {
    let stepIndex = 0;
    const tick = () => {
      if (!introAlive) return;
      const h = seqHours[stepIndex % seqHours.length];
      const turns = Math.floor(stepIndex / seqHours.length);
      setHour(hourHandIntro, h, turns);
      label.textContent = `${h} Uhr`;
      label.style.opacity = 1;
      setTimeout(() => { label.style.opacity = 0; }, 900);
      stepIndex++;
      introTimer = setTimeout(tick, 1200);
    };
    // 1 s warten → wirkt smoother
    introTimer = setTimeout(tick, 1000);
  }
  runIntro();

  // ---------- Spielzustand ----------
  const ROUNDS = 6;
  const used = new Set();

  function pickHour() {
    if (used.size >= 12) used.clear();
    let h, tries = 0;
    do {
      h = rnd(1, 12);
      tries++;
      if (tries > 30) break;
    } while (used.has(h));
    used.add(h);
    return h;
  }

  function makeOptions(correctHour) {
    const opts = new Set([correctHour]);
    while (opts.size < 4) {
      const cand = rnd(1, 12);
      if (!opts.has(cand)) opts.add(cand);
    }
    return shuffle([...opts]);
  }

  // ---------- Runden ----------
  let roundIndex = 0;

  function renderRound() {
    container.innerHTML = "";
    const h = pickHour();
    const options = makeOptions(h);

    const block = document.createElement("div");
    block.className = "task-block";
    block.innerHTML = `
      <h3>Welche Uhrzeit ist das?</h3>
      <p class="explain">Tipp: oben=12, rechts=3, unten=6, links=9.</p>
    `;

    // Aufgaben-Uhr MIT Minutenzeiger (auf :00)
    const clock = buildClockDOM({ showMinute: true });
    const hourHand   = clock.querySelector("#lv5Hour");
    const minuteHand = clock.querySelector("#lv5Minute");
    setHour(hourHand, h, 0);
    if (minuteHand) {
      minuteHand.style.transformOrigin = "50% 50%";
      minuteHand.style.transform = "rotate(0deg)";
    }
    block.appendChild(clock);

    // Antworten
    const grid = document.createElement("div");
    grid.className = "options-grid";
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = `${opt} Uhr`;
      btn.addEventListener("click", () => handleAnswer(opt === h, btn));
      grid.appendChild(btn);
    });
    block.appendChild(grid);

    // Fortschritt
    const prog = document.createElement("p");
    prog.style.marginTop = "0.6rem";
    prog.style.opacity = "0.8";
    prog.textContent = `Aufgabe ${roundIndex + 1} / ${ROUNDS}`;
    block.appendChild(prog);

    container.appendChild(block);

    function handleAnswer(ok, btn) {
      block.querySelectorAll(".option-btn").forEach(b => (b.disabled = true));
      if (ok) { btn.classList.add("correct"); reportAnswer(true); }
      else    { btn.classList.add("wrong");   reportAnswer(false); }
      setTimeout(() => {
        roundIndex++;
        if (roundIndex < ROUNDS) renderRound();
        else finish();
      }, 900);
    }
  }

  function finish() {
    // Einheitlich über Router weiter
    showLevelComplete({ title: "Volle Stunden 2", id: 5 });
  }

  // ---------- Los geht’s ----------
  goBtn.addEventListener("click", () => {
    introAlive = false;
    if (introTimer) clearTimeout(introTimer);
    roundIndex = 0;
    setTimeout(renderRound, 150);
  });
}

/* ===========================
   Einheitlicher Abschluss + Router-Fallback
   (am Ende von levels.js einfügen)
   =========================== */
(function ensureLevelRouter(){
  // Baustellenkarte, falls sie noch nicht existiert
  if (typeof window.showComingSoon !== 'function') {
    window.showComingSoon = function(nextId){
      const c = document.getElementById('gameContainer');
      if (!c) return;
      c.innerHTML = `
        <div class="task-block" style="text-align:center">
          <div style="font-size:48px;line-height:1;margin-bottom:8px">🚧</div>
          <h2>Hier wird noch gebaut …</h2>
          <p>Level ${nextId ?? '…'} ist noch nicht fertig. Schau bald wieder vorbei!</p>
          <button class="next-level-btn" id="wipBack">Zur Level-Übersicht</button>
        </div>`;
      const back = document.getElementById('wipBack');
      back?.addEventListener('click', () => {
        // zurück zur Übersicht (lernspiel.html)
        window.location.href = window.location.pathname;
      });
    };
  }

  // Abschlusskarte + „Weiter“-Button (unterstützt {id,title} und Zahl)
  window.showLevelComplete = function(levelOrNext /*, _ignored */){
    const c = document.getElementById('gameContainer');
    if (!c) return;

    let title, nextId;

    if (typeof levelOrNext === 'number') {
      // z.B. showLevelComplete(6) → wir tun so, als ob Level 5 grad fertig wurde
      nextId = levelOrNext;
      title  = `Level ${nextId - 1} abgeschlossen!`;
    } else {
      const curId = Number(levelOrNext?.id ?? NaN);
      nextId = Number.isFinite(curId) ? (curId + 1) : NaN;
      title  = levelOrNext?.title || (Number.isFinite(curId) ? `Level ${curId} abgeschlossen!` : `Geschafft!`);
    }

    c.innerHTML = `
      <div class="task-block" style="text-align:center">
        <h2>🎉 ${title}</h2>
        <p>Super gemacht!</p>
        <button class="next-level-btn" id="btnNext">
          ➡️ Weiter zu Level ${Number.isFinite(nextId) ? nextId : '…'}
        </button>
      </div>`;

    document.getElementById('btnNext')?.addEventListener('click', () => {
      if (Number.isFinite(nextId) && typeof window.__startLevel === 'function') {
        window.__startLevel(nextId);
      } else {
        window.showComingSoon?.(nextId);
      }
    });
  };
})();

/* =========================================================
   Aliase, damit main.js kompatibel bleibt
   ========================================================= */
function initLevel1(cb){ startGameLevel(1, cb); }
function initLevel2(cb){ startLevel2(cb); }
function initLevel4(cb) { startLevel4(cb); }




// ⚠️ WICHTIG: KEIN Top-Level-Block für Level 3 hier.
// initLevel3(cb) wird später implementiert, wenn Level 3 genutzt wird.