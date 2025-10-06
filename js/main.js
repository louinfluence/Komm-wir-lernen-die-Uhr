window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  console.log("🕒 App initialisiert");

  const sideMenu = document.getElementById("sideMenu");
  const menuToggle = document.getElementById("menuToggle");
  const closeMenu = document.getElementById("closeMenu");
  const modeToggle = document.getElementById("modeToggle");

  const body = document.body;
  const slider = document.getElementById("timeSlider");
  const sliderContainer = document.getElementById("sliderContainer");
  const timeLabel = document.getElementById("timeLabel");

  const btnStartGame = document.getElementById("btnStartGame");
  const btnFreeMode = document.getElementById("btnFreeMode");
  const btnOptions = document.getElementById("btnOptions");
  const btnQuiz = document.getElementById("btnQuiz");

  let liveMode = false;
  let fineMode = false;
  let longPressTimer = null;

  /* ========== Menü-Steuerung ========== */
  if (menuToggle)
    menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  if (closeMenu)
    closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  if (modeToggle)
    modeToggle.addEventListener("click", () => {
      body.classList.toggle("dark");
      localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
    });

  if (localStorage.getItem("theme") === "dark") body.classList.add("dark");

  /* ========== Slider-Logik ========== */
  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360;
    if (fine) {
      slider.min = 0;
      slider.max = 1439;
      slider.step = 1;
      slider.value = minutes;
    } else {
      slider.min = 0;
      slider.max = 288;
      slider.step = 1;
      slider.value = Math.round(minutes / 5);
    }
  }

  function updateTimeLabel(h, m) {
    const daytime = getDaytimeText(h);
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    timeLabel.textContent = `Es ist ${hh}:${mm} Uhr ${daytime}`;
  }

  function getDaytimeText(hour) {
    if (hour >= 6 && hour < 10) return "morgens";
    if (hour >= 10 && hour < 12) return "vormittags";
    if (hour >= 12 && hour < 14) return "mittags";
    if (hour >= 14 && hour < 17) return "nachmittags";
    if (hour >= 17 && hour < 21) return "abends";
    return "nachts";
  }

  slider.addEventListener("input", () => {
    if (liveMode) return;
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

  /* ========== Menü-Buttons ========== */
  if (btnStartGame)
    btnStartGame.addEventListener("click", showLevelSelection);

  if (btnFreeMode)
    btnFreeMode.addEventListener("click", () => {
      sideMenu.classList.remove("visible");
      liveMode = false;
      if (sliderContainer) sliderContainer.style.display = "block";
    });

  if (btnOptions)
    btnOptions.addEventListener("click", () => {
      alert("Optionen & Anleitung folgen bald!");
    });

  if (btnQuiz)
    btnQuiz.addEventListener("click", () => {
      alert("Quiz-Modus folgt!");
    });

  /* ========== Level-Auswahl-Overlay ========== */
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
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector("#level1Btn").addEventListener("click", () => {
      overlay.remove();
      initLevel1();
    });
    overlay.querySelector("#closeOverlay").addEventListener("click", () => {
      overlay.remove();
    });
  }

  /* ========== Startzustand ========== */
  setTime(6, 0);
  updateTimeLabel(6, 0);
  setSliderMode(false);
}