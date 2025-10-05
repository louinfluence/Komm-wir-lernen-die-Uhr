// ----------------------------
// CLOCK.JS – Uhrdarstellung
// ----------------------------

// interne Zustände
let hourAngle = 0;
let minuteAngle = 0;
let currentHours = 3;
let currentMinutes = 0;

/**
 * Dreht den Stundenzeiger um den angegebenen Winkel
 */
function rotateHour(deg) {
  hourAngle = (hourAngle + deg) % 360;
  updateClock();
}

/**
 * Dreht den Minutenzeiger um den angegebenen Winkel
 * und verschiebt den Stundenzeiger anteilig mit.
 */
function rotateMinute(deg) {
  minuteAngle = (minuteAngle + deg) % 360;

  // Stundenzeiger bewegt sich 1/12 so schnell wie Minutenzeiger
  hourAngle = (hourAngle + deg / 12) % 360;

  updateClock();
}

/**
 * Setzt eine Uhrzeit direkt (z. B. 3:45)
 */
function setTime(hours, minutes) {
  currentHours = hours;
  currentMinutes = minutes;

  minuteAngle = minutes * 6; // 360° / 60 min
  hourAngle = (hours % 12) * 30 + minutes * 0.5; // 30°/h + 0,5°/min
  updateClock();
}

/**
 * Aktualisiert die Anzeige
 */
function updateClock() {
  const hourHand = document.getElementById("stundenzeiger");
  const minuteHand = document.getElementById("minutenzeiger");

  if (hourHand && minuteHand) {
    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
  }
}

/**
 * Liest Eingaben aus dem Interface aus und setzt Zeit
 */
function applyTime() {
  const hours = parseInt(document.getElementById("hourInput").value) || 0;
  const minutes = parseInt(document.getElementById("minuteInput").value) || 0;
  setTime(hours, minutes);
}

// Startposition
document.addEventListener("DOMContentLoaded", () => {
  setTime(currentHours, currentMinutes);
});
