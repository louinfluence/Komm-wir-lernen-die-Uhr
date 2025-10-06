window.addEventListener("DOMContentLoaded", initClockApp);

function initClockApp() {
  const sideMenu = document.getElementById("sideMenu");
  const menuToggle = document.getElementById("menuToggle");
  const closeMenu = document.getElementById("closeMenu");
  const modeToggle = document.getElementById("modeToggle");

  const body = document.body;
  const slider = document.getElementById("timeSlider");
  const timeLabel = document.getElementById("timeLabel");

  const btnStartGame = document.getElementById("btnStartGame");
  const btnFreeMode = document.getElementById("btnFreeMode");
  const btnOptions = document.getElementById("btnOptions");
  const btnQuiz = document.getElementById("btnQuiz");

  let liveMode = false;      // (Reserve, z. B. für Echtzeitmodus)
  let fineMode = false;      // grob (5-Min-Schritte) vs. fein (1 Min)
  let longPressTimer = null;

  /* ========== Menü & Theme ========== */
  if (menuToggle) menuToggle.addEventListener("click", () => sideMenu.classList.toggle("visible"));
  if (closeMenu)  closeMenu.addEventListener("click", () => sideMenu.classList.remove("visible"));

  if (modeToggle) modeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    // (hier könntest du ein Dark-Theme via CSS-Variablen setzen)
  });

  /* ========== Tageszeiten-Theme (Farben) ========== */
  function setDaytimeTheme(daytime) {
    let c1="#87CEEB", c2="#4682B4"; // default: nachmittags
    switch(daytime){
      case "morgens":     c1="#FFEB99"; c2="#FFD166"; break;
      case "vormittags":  c1="#FFD166"; c2="#FFA500"; break;
      case "mittags":     c1="#FFB347"; c2="#FF8C00"; break;
      case "nachmittags": c1="#87CEEB"; c2="#4682B4"; break;
      case "abends":      c1="#457b9d"; c2="#1d3557"; break;
      default:            c1="#0b132b"; c2="#1c2541"; break; // nachts
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
    setDaytimeTheme(daytime); // -> setzt die Gradientenfarben (Label & Slider)
  }

  /* ========== Slider-Logik ========== */
  function setSliderMode(fine) {
    fineMode = fine;
    const minutes = window.currentTotalMinutes ?? 360; // 06:00
    if (fine) {
      slider.min = 0; slider.max = 1439; slider.step = 1; slider.value = minutes;
      slider.classList.add("fine");
    } else {
      slider.min = 0; slider.max = 288;  slider.step = 1; slider.value = Math.round(minutes/5);
      slider.classList.remove("fine");
    }
  }

  slider.addEventListener("input", () => {
    if (liveMode) return;
    const val = parseInt(slider.value, 10);
    const totalMinutes = fineMode ? val : val * 5;
    // Referenzpunkt 06:00 (damit der Slider bei 0 auf 06:00 steht)
    const adjustedMinutes = (totalMinutes + 360) % 1440;
    const h = Math.floor(adjustedMinutes / 60);
    const m = adjustedMinutes % 60;
    window.currentTotalMinutes = adjustedMinutes;
    setTime(h, m);          // -> clock.js rotiert die Zeiger
    updateTimeLabel(h, m);  // -> Text + Farben
  });

  // Long-Press für Feineinstellung (400ms halten)
  slider.addEventListener("pointerdown", () => {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => setSliderMode(true), 400);
  });
  slider.addEventListener("pointerup",   () => clearTimeout(longPressTimer));
  slider.addEventListener("pointerleave",() => clearTimeout(longPressTimer));

  /* ========== Menü-Buttons ========== */
  if (btnStartGame) btnStartGame.addEventListener("click", showLevelSelection);
  if (btnFreeMode)  btnFreeMode.addEventListener("click", () => {
    sideMenu.classList.remove("visible");
    returnToStart(); // 👉 zurück zur Startuhr
  });
  if (btnOptions)   btnOptions.addEventListener("click", () => {
    alert("Anleitung & Optionen folgen bald.");
  });
  if (btnQuiz)      btnQuiz.addEventListener("click", () => {
    alert("Quiz-Modus kommt bald!");
  });

  /* ========== Zurück zur Startseite (Freie Uhr) ========== */
  function returnToStart() {
    const main = document.querySelector("main");
    if (!main) return;

    // Inhalt zurücksetzen
    main.innerHTML = `
      <section id="clockArea" aria-label="Analoguhr">
        <img id="ziffernblatt_12h" src="./assets/images/Ziffernblatt.png" alt="Ziffernblatt 12h">
        <img id="ziffernblatt_24h" class="hidden" alt="Ziffernblatt 24h">
        <img id="hourHand"   class="hand" src="./assets/images/Stundenzeiger.png" alt="Stundenzeiger">
        <img id="minuteHand" class="hand" src="./assets/images/Minutenzeiger.png" alt="Minutenzeiger">
      </section>
      <div id="timeLabel">Es ist 06:00 Uhr morgens</div>
      <div id="sliderContainer">
        <input id="timeSlider" type="range" min="0" max="288" step="1" value="0" />
      </div>
    `;

    // neu gebaute DOM-Elemente wieder an init-Funktionen koppeln
    const slider = document.getElementById("timeSlider");
    const timeLabel = document.getElementById("timeLabel");

    slider.addEventListener("input", () => {
      const val = parseInt(slider.value, 10);
      const totalMinutes = val * 5;
      const adjustedMinutes = (totalMinutes + 360) % 1440;
      const h = Math.floor(adjustedMinutes / 60);
      const m = adjustedMinutes % 60;
      window.currentTotalMinutes = adjustedMinutes;
      setTime(h, m);
      const daytime = getDaytimeText(h);
      const hh = String(h).padStart(2,"0");
      const mm = String(m).padStart(2,"0");
      timeLabel.textContent = `Es ist ${hh}:${mm} Uhr ${daytime}`;
      setDaytimeTheme(daytime);
    });

    // Standarduhrzeit
    setTime(6, 0);
    const d = getDaytimeText(6);
    setDaytimeTheme(d);
    timeLabel.textContent = "Es ist 06:00 Uhr morgens";
  }