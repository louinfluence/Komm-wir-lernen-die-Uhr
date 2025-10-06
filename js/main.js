window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  const sideMenu = document.getElementById("sideMenu");
  const menuToggle = document.getElementById("menuToggle");
  const closeMenu = document.getElementById("closeMenu");
  const modeToggle = document.getElementById("modeToggle");

  const slider = document.getElementById("timeSlider");
  const timeLabel = document.getElementById("timeLabel");

  const btnStartGame = document.getElementById("btnStartGame");
  const btnFreeMode = document.getElementById("btnFreeMode");
  const btnOptions = document.getElementById("btnOptions");
  const btnQuiz = document.getElementById("btnQuiz");

  let fineMode = false;
  let longPressTimer = null;

  /* Menü */
  menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  /* Dark / Light Modus */
  modeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  /* Zeitabschnitt-Farben */
  function setDaytimeTheme(daytime) {
    let c1="#87CEEB", c2="#4682B4";
    switch(daytime){
      case "morgens":     c1="#FFEB99"; c2="#FFD166"; break;
      case "vormittags":  c1="#FFD166"; c2="#FFA500"; break;
      case "mittags":     c1="#FFB347"; c2="#FF8C00"; break;
      case "nachmittags": c1="#87CEEB"; c2="#4682B4"; break;
      case "abends":      c1="#457b9d"; c2="#1d3557"; break;
      default:            c1="#0b132b"; c2="#1c2541"; break;
    }
    document.documentElement.style.setProperty("--accent1", c1);
    document.documentElement.style.setProperty("--accent2", c2);
  }

  function getDaytimeText(hour) {
    if (hour >= 6 && hour < 10)  return "morgens";
    if (hour >= 10 && hour < 12) return "vormittags";
    if (hour >= 12 && hour < 14) return "mittags";
    if (hour >= 14 && hour < 17) return "nachmittags";
    if (hour >= 17 && hour < 21) return "abends";
    return "nachts";
  }

  function updateTimeLabel(h, m) {
    const daytime = getDaytimeText(h);
    const hh = String(h).padStart(2,"0");
    const mm = String(m).padStart(2,"0");
    timeLabel.textContent = `Es ist ${hh}:${mm} Uhr ${daytime}`;
    setDaytimeTheme(daytime);
  }

  /* Slider */
  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360;
    if (fine) {
      slider.min = 0; slider.max = 1439; slider.step = 1; slider.value = minutes;
    } else {
      slider.min = 0; slider.max = 288; slider.step = 1; slider.value = Math.round(minutes/5);
    }
  }

  slider.addEventListener("input", () => {
    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;
    const adjustedMinutes = (totalMinutes + 360) % 1440;
    const h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;
    window.currentTotalMinutes = adjustedMinutes;
    setTime(h, m);
    updateTimeLabel(h, m);
  });

  slider.addEventListener("pointerdown", () => {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  });
  slider.addEventListener("pointerup", () => clearTimeout(longPressTimer));

  /* Menü-Buttons */
  btnStartGame.addEventListener("click", showLevelSelection);
  btnFreeMode.addEventListener("click", () => sideMenu.classList.remove("visible"));
  btnOptions.addEventListener("click", () => alert("Hier folgt die Anleitung und Optionen."));
  btnQuiz.addEventListener("click", () => alert("Quiz-Modus kommt bald!"));

  function showLevelSelection() {
    sideMenu.classList.remove("visible");
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `
      <div class="panel">
        <h2>🎮 Lernspiel starten</h2>
        <p>Wähle ein Level:</p>
        <button id="level1Btn">Level 1: Tageszeiten zuordnen</button>
        <button id="closeOverlay">✖ Zurück</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector("#level1Btn").addEventListener("click", () => {
      overlay.remove();
      initLevel1();
    });
    overlay.querySelector("#closeOverlay").addEventListener("click", () => overlay.remove());
  }

  /* Startzustand */
  setTime(6, 0);
  updateTimeLabel(6, 0);
  setSliderMode(false);
}