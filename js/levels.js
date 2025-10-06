/* =========================================================
   LEVELS.JS – Lernspiel "Tageszeiten zuordnen"
   ========================================================= */

/* Kein automatischer Start mehr!
window.addEventListener("DOMContentLoaded", () => {
  if (typeof initLevel1 === "function") initLevel1();
});
*/

/* =========================================================
   LEVEL 1: Tageszeiten zuordnen
   ========================================================= */
function initLevel1() {
  console.log("🎮 Level 1 gestartet");

  const levelData = [
    { hour: 7,  minute: 0, correct: "Morgen.PNG", text: "Frühstückszeit!" },
    { hour: 9,  minute: 0, correct: "Schule.PNG", text: "Schulbeginn!" },
    { hour: 16, minute: 0, correct: "Hobby.PNG",  text: "Freizeit und Hobbys!" },
    { hour: 21, minute: 0, correct: "Schlaf.PNG", text: "Schlafenszeit!" }
  ];

  let currentRound = 0;

  const main = document.querySelector("main");
  main.innerHTML = "";

  const gameContainer = document.createElement("div");
  gameContainer.id = "level1";
  gameContainer.classList.add("level-container");

  // Uhr + Aufgabe
  const clockArea = document.createElement("div");
  clockArea.classList.add("clock-area");
  clockArea.innerHTML = `
    <div class="clock-container small">
      <img src="assets/images/Ziffernblatt.png" alt="Ziffernblatt">
      <img src="assets/images/Stundenzeiger.png" id="stundenzeiger" alt="Stundenzeiger">
      <img src="assets/images/Minutenzeiger.png" id="minutenzeiger" alt="Minutenzeiger">
    </div>
    <p id="taskText" class="task-text"></p>
  `;

  // Auswahlbilder
  const optionsArea = document.createElement("div");
  optionsArea.classList.add("options-area");

  const imageFiles = ["Morgen.PNG", "Schule.PNG", "Hobby.PNG", "Schlaf.PNG"];
  imageFiles.forEach(file => {
    const el = document.createElement("img");
    el.src = `assets/images/${file}`;
    el.alt = file.split(".")[0];
    el.classList.add("drag-option");
    el.draggable = true;
    el.dataset.file = file;
    optionsArea.appendChild(el);
  });

  // Tipp-Hinweis
  const hint = document.createElement("div");
  hint.classList.add("finger-hint");
  hint.textContent = "👉 Ziehe das richtige Bild auf die Uhr!";

  // Zusammenfügen
  gameContainer.append(clockArea, hint, optionsArea);
  main.appendChild(gameContainer);

  // Runde starten
  startRound();

  /* =========================================================
     Funktionen
  ========================================================= */

  function startRound() {
    const round = levelData[currentRound];
    const { hour, minute, text } = round;

    if (typeof setTime === "function") setTime(hour, minute);
    document.getElementById("taskText").textContent = text;

    document.querySelectorAll(".drag-option").forEach(opt => {
      opt.classList.remove("disabled", "correct", "wrong");
    });

    initDragDrop(round.correct);
  }

  function initDragDrop(correctFile) {
    const dropZone = clockArea.querySelector(".clock-container");
    const options = optionsArea.querySelectorAll(".drag-option");

    dropZone.addEventListener("dragover", e => e.preventDefault());
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      const dragged = document.querySelector(".dragging");
      if (!dragged) return;

      if (dragged.dataset.file === correctFile) {
        dragged.classList.add("correct");
        showFeedback(true);
        setTimeout(nextRound, 1000);
      } else {
        dragged.classList.add("wrong");
        showFeedback(false);
      }
      dragged.classList.remove("dragging");
    });

    options.forEach(el => {
      el.addEventListener("dragstart", () => el.classList.add("dragging"));
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
    });
  }

  function showFeedback(success) {
    const hint = document.querySelector(".finger-hint");
    hint.textContent = success ? "✅ Richtig!" : "❌ Versuch’s nochmal!";
    hint.style.transition = "opacity 0.3s";
    hint.style.opacity = 1;
    setTimeout(() => (hint.style.opacity = 0.8), 1000);
  }

  function nextRound() {
    currentRound++;
    if (currentRound < levelData.length) {
      const next = levelData[currentRound];
      animateClockToTime(next.hour, next.minute, 1200, startRound);
    } else {
      showEndScreen();
    }
  }

  function animateClockToTime(targetHour, targetMinute, duration = 1200, callback) {
    if (typeof setTime !== "function") return;

    const startMinutes = window.currentTotalMinutes ?? 0;
    const endMinutes = (targetHour * 60 + targetMinute) % 1440;
    const diff = ((endMinutes - startMinutes + 1440) % 1440);
    const stepCount = 60;
    const stepTime = duration / stepCount;
    let step = 0;

    const anim = setInterval(() => {
      step++;
      const current = (startMinutes + (diff * step / stepCount)) % 1440;
      const h = Math.floor(current / 60);
      const m = Math.floor(current % 60);
      setTime(h, m);

      if (step >= stepCount) {
        clearInterval(anim);
        window.currentTotalMinutes = endMinutes;
        if (callback) setTimeout(callback, 200);
      }
    }, stepTime);
  }

  function showEndScreen() {
    const main = document.querySelector("main");
    main.innerHTML = `
      <div class="end-screen">
        <h2>🎉 Super gemacht!</h2>
        <p>Du hast alle Tageszeiten richtig zugeordnet.</p>
        <button id="backToMenu" class="menu-btn">🏠 Zurück zum Menü</button>
      </div>
    `;
    document.getElementById("backToMenu").addEventListener("click", () => location.reload());
  }
}

// ✅ Wichtig für Safari/iPad – globale Sichtbarkeit
window.initLevel1 = initLevel1;