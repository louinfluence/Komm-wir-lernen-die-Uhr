/* =========================================================
   LEVELS.JS – Lernspiel "Tageszeiten zuordnen"
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {
  if (typeof initLevel1 === "function") initLevel1();
});

/* =========================================================
   LEVEL 1: Tageszeiten zuordnen
   ========================================================= */
function initLevel1() {
  console.log("🎮 Level 1 gestartet");

  const levelData = [
    { hour: 7, minute: 0, correct: "Morgen.PNG", text: "Frühstückszeit!" },
    { hour: 9, minute: 0, correct: "Schule.PNG", text: "Schulbeginn!" },
    { hour: 16, minute: 0, correct: "Hobby.PNG", text: "Freizeit und Hobbys!" },
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

  // Finger-Tipp-Hinweis
  const hint = document.createElement("div");
  hint.classList.add("finger-hint");
  hint.textContent = "👉 Tipp: Ziehe das richtige Bild auf die Uhr!";

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

    // Reset Feedback / Animation
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
    function nextRound() {
    currentRound++;
    if (currentRound < levelData.length) {
      // sanft animieren zur neuen Uhrzeit
      const next = levelData[currentRound];
      animateClockToTime(next.hour, next.minute, 1200, startRound);
    } else {
      showEndScreen();
    }
  }

  /* =========================================================
     Sanfte Zeigeranimation
  ========================================================= */
  function animateClockToTime(targetHour, targetMinute, duration = 1200, callback) {
    if (typeof setTime !== "function") return;

    // Ausgangspunkt (aktuelle Zeit aus globalem Speicher)
    const startMinutes = window.currentTotalMinutes ?? 0;
    const endMinutes = (targetHour * 60 + targetMinute) % 1440;

    // z. B. von 420 (7:00) auf 540 (9:00)
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

  