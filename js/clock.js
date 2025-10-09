/* ===========================================================
   clock.js – stabilisierte Version (voll kompatibel)
   =========================================================== */

// --- CLOCK CORE FUNCTIONS ---
window.displayMode = "24h"; // global sichtbar

window.setTime = function (hours, minutes) {
  // kontinuierlicher Minutenwinkel (keine Sprünge)
  window.totalMinuteAngle ??= 0;
  const targetAngle = minutes * 6;
  const lastAngle = window.totalMinuteAngle % 360;
  let delta = targetAngle - lastAngle;
  if (delta < -180) delta += 360;
  if (delta > 180) delta -= 360;
  window.totalMinuteAngle += delta;
  const minuteAngle = window.totalMinuteAngle;

  // kontinuierlicher Stundenwinkel
  window.totalHourAngle ??= 0;
  const targetHourAngle = (hours % 12) * 30 + minutes * 0.5;
  const lastHourAngle = window.totalHourAngle % 360;
  let deltaH = targetHourAngle - lastHourAngle;
  if (deltaH < -180) deltaH += 360;
  if (deltaH > 180) deltaH -= 360;
  window.totalHourAngle += deltaH;
  const hourAngle = window.totalHourAngle;

  // aktuelle Minuten global merken (0–1439)
  window.currentTotalMinutes = (hours * 60 + minutes) % 1440;

  // --- jetzt Zeiger und Text aktualisieren ---
  updateClock(hours, minutes, hourAngle, minuteAngle);
  updateTimeLabel(hours, minutes);
};

/* -----------------------------------------------------------
   Anzeige und Zeigerbewegung
----------------------------------------------------------- */
function updateClock(hours, minutes, hourAngle, minuteAngle) {
  const hourHand = document.getElementById("stundenzeiger");
  const minuteHand = document.getElementById("minutenzeiger");

  if (hourHand && minuteHand) {
    hourHand.style.transition = "transform 0.15s ease";
    minuteHand.style.transition = "transform 0.15s ease";
    hourHand.style.transform = `translate(-50%, -50%) rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `translate(-50%, -50%) rotate(${minuteAngle}deg)`;
  }

  // digitale Anzeige (alter timeDisplay + neuer timeLabel-Support)
  const disp = document.getElementById("timeDisplay") || document.getElementById("timeLabel");
  if (disp) disp.textContent = formatTime(hours, minutes);
}

/* -----------------------------------------------------------
   Formatierung der Zeit (12h / 24h)
----------------------------------------------------------- */
function formatTime(h, m) {
  const pad = (x) => x.toString().padStart(2, "0");
  if (window.displayMode === "12h") {
    const suffix = h >= 12 ? "nachmittags" : "vormittags";
    const hour = h % 12 || 12;
    return `Es ist ${hour}:${pad(m)} Uhr ${suffix}.`;
  } else {
    return `${pad(h)}:${pad(m)} Uhr`;
  }
}

/* -----------------------------------------------------------
   Tageszeiten-Logik für farbige Anzeige und Text
----------------------------------------------------------- */
function updateTimeLabel(hours, minutes) {
  const label = document.getElementById("timeLabel");
  if (!label) return;

  // Alle alten Klassen entfernen
  label.className = "";
  label.classList.add("fade-in");

  // Text generieren
  const pad = (x) => x.toString().padStart(2, "0");
  const timeString = `${pad(hours)}:${pad(minutes)} Uhr`;

  // Kategorie bestimmen
  let phase = "";
  if (hours >= 5 && hours < 9) phase = "morgens";
  else if (hours >= 9 && hours < 12) phase = "vormittags";
  else if (hours >= 12 && hours < 14) phase = "mittags";
  else if (hours >= 14 && hours < 18) phase = "nachmittags";
  else if (hours >= 18 && hours < 21) phase = "abends";
  else phase = "nachts";

  // Klasse und Text setzen
  label.classList.add(phase);
  label.textContent = `Es ist ${timeString} ${phase}.`;
}

/* -----------------------------------------------------------
   Integration für Slidersteuerung
----------------------------------------------------------- */
function updateClockFromSlider(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  setTime(hours, minutes);
}

/* -----------------------------------------------------------
   Echtzeitmodus (optional)
----------------------------------------------------------- */
let realtimeInterval = null;

function startRealtimeClock() {
  stopRealtimeClock(); // alten Timer stoppen

  const secHand = document.getElementById("sekundenzeiger");
  if (secHand) secHand.style.display = "block"; // Sekundenzeiger einblenden

  realtimeInterval = setInterval(() => {
    const now = new Date();
    const hours   = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // Stunden + Minuten aktualisieren
    setTime(hours, minutes);

    // Sekundenzeiger (6° pro Sekunde)
    const secondDeg = seconds * 6;
    if (secHand) {
      secHand.style.transform = `translate(-50%, -100%) rotate(${secondDeg}deg)`;
    }
  }, 1000);
}

function stopRealtimeClock() {
  if (realtimeInterval) {
    clearInterval(realtimeInterval);
    realtimeInterval = null;
  }
  const secHand = document.getElementById("sekundenzeiger");
  if (secHand) secHand.style.display = "none"; // im Lernmodus ausblenden
}

