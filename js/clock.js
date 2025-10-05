// ----------------------------
// CLOCK.JS – Uhrdarstellung
// ----------------------------

// interne Zustände der Zeiger
let hourAngle = 0;
let minuteAngle = 0;

/**
 * Dreht den Stundenzeiger um den angegebenen Winkel
 * @param {number} deg - Gradzahl (positiv = im Uhrzeigersinn)
 */
function rotateHour(deg) {
  hourAngle = (hourAngle + deg) % 360;
  updateClock();
}

/**
 * Dreht den Minutenzeiger um den angegebenen Winkel
 * @param {number} deg - Gradzahl (positiv = im Uhrzeigersinn)
 */
function rotateMinute(deg) {
  minuteAngle = (minuteAngle + deg) % 360;
  updateClock();
}

/**
 * Setzt eine Uhrzeit direkt (z. B. setTime(3, 45))
 * @param {number} hours - Stunde (0–23)
 * @param {number} minutes - Minuten (0–59)
 */
function setTime(hours, minutes) {
  minuteAngle = minutes * 6;                   // 360° / 60 min
  hourAngle = (hours % 12) * 30 + minutes * 0.5; // 360° / 12 h + Anteil der Minuten
  updateClock();
}

/**
 * Aktualisiert die Anzeige der Uhr
 */
function updateClock() {
  const hourHand = document.getElementById("stundenzeiger");
  const minuteHand = document.getElementById("minutenzeiger");

  if (hourHand && minuteHand) {
    hourHand.style.transform = `rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
  }
}

// Optional: kleine Startzeit anzeigen (z. B. 3:00)
document.addEventListener("DOMContentLoaded", () => {
  setTime(3, 0);
});
