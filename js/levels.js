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
  console.log("🎮 Level 1 gestartet: Tageszeiten zuordnen");

  const gameContainer = document.createElement("div");
  gameContainer.id = "level1";
  gameContainer.classList.add("level-container");

  // --- Uhr mit fester Startzeit ---
  const clockArea = document.createElement("div");
  clockArea.classList.add("clock-area");
  clockArea.innerHTML = `
    <div class="clock-container small">
      <img src="assets/images/Ziffernblatt.png" id="ziffernblatt_12h" alt="Ziffernblatt">
      <img src="assets/images/Stundenzeiger.png" id="stundenzeiger" alt="Stundenzeiger">
      <img src="assets/images/Minutenzeiger.png" id="minutenzeiger" alt="Minutenzeiger">
    </div>
    <p class="task-text">Welche Szene passt zur angezeigten Uhrzeit?</p>
  `;

  // --- Bildoptionen ---
  const optionsArea = document.createElement("div");
  optionsArea.classList.add("options-area");

  const images = [
    { src: "assets/images/Morgen.PNG", label: "Frühstück" },
    { src: "assets/images/Schule.PNG", label: "Schule" },
    { src: "assets/images/Schlaf.PNG", label: "Schlafen" },
  ];

  images.forEach((img, i) => {
    const el = document.createElement("img");
    el.src = img.src;
    el.alt = img.label;
    el.classList.add("drag-option");
    el.draggable = true;
    el.dataset.correct = img.label === "Frühstück" ? "true" : "false";
    optionsArea.appendChild(el);
  });

  // --- Finger-Tipp-Hinweis ---
  const hint = document.createElement("img");
  hint.src = "assets/images/finger.png"; // später ersetzen
  hint.alt = "Tipp-Hinweis";
  hint.classList.add("finger-hint");
  gameContainer.append(hint);

  // --- Zusammenfügen ---
  gameContainer.append(clockArea, optionsArea);
  document.querySelector("main").innerHTML = ""; // alten Inhalt leeren
  document.querySelector("main").appendChild(gameContainer);

  // --- Uhrzeit für die Aufgabe setzen (7:00 Uhr = Frühstück) ---
  if (typeof setTime === "function") setTime(7, 0);

  // --- Drag-&-Drop Logik ---
  initDragDrop(optionsArea, clockArea);
}

/* =========================================================
   Drag & Drop Logik
   ========================================================= */
function initDragDrop(optionsArea, clockArea) {
  const dropZone = clockArea.querySelector(".clock-container");

  dropZone.addEventListener("dragover", (e) => e.preventDefault());
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const dragged = document.querySelector(".dragging");
    if (!dragged) return;

    if (dragged.dataset.correct === "true") {
      dropZone.classList.add("correct");
      showFeedback(true);
    } else {
      dropZone.classList.add("wrong");
      showFeedback(false);
      setTimeout(() => dropZone.classList.remove("wrong"), 800);
    }
    dragged.classList.remove("dragging");
  });

  optionsArea.querySelectorAll(".drag-option").forEach((el) => {
    el.addEventListener("dragstart", () => el.classList.add("dragging"));
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
  });
}

/* =========================================================
   Feedback & Animationen
   ========================================================= */
function showFeedback(correct) {
  const feedback = document.createElement("div");
  feedback.className = "feedback";
  feedback.textContent = correct ? "✅ Richtig!" : "❌ Versuch’s nochmal!";
  document.body.appendChild(feedback);

  setTimeout(() => feedback.remove(), 1200);
}
