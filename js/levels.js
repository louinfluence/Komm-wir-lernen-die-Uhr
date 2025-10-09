/* =========================================================
   LEVELS – JSON-basiertes Lernspiel mit Drag & Drop
   ========================================================= */

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
  const level = levels.find(l => l.id === levelId);
  if (!level) return console.error("Level nicht gefunden:", levelId);

  const title = document.createElement("h2");
  title.textContent = `🎯 ${level.title}`;
  container.appendChild(title);

  const desc = document.createElement("p");
  desc.textContent = level.description;
  container.appendChild(desc);

  // Aufgaben nacheinander anzeigen
  let current = 0;
  showTask(level.tasks[current]);
}


// Level 1
function showTask(task) {
  container.innerHTML = `
    <div class="task-block">
      <div class="clock-preview">
        🕒 <span>${task.text}</span>
      </div>

      <div id="dropZone" class="drop-zone">
        Ziehe das passende Bild hierher 👇
      </div>

      <div class="options-area" id="optionsArea"></div>
    </div>
  `;

  const optionsArea = document.getElementById("optionsArea");

  task.options.forEach(opt => {
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
        nextBtn.addEventListener("click", () => onComplete(level.id + 1));
        container.appendChild(nextBtn);
      }
    }, 1500);
  });
}


/* Aliase, damit main.js kompatibel bleibt */
function initLevel1(cb) { startGameLevel(1, cb); }
