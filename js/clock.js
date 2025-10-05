// --------------------
// CLOCK MODULE
// --------------------

let hourAngle = 0;
let minuteAngle = 0;

export function rotateHour(deg) {
  hourAngle = (hourAngle + deg) % 360;
  document.getElementById("stundenzeiger").style.transform = `rotate(${hourAngle}deg)`;
}

export function rotateMinute(deg) {
  minuteAngle = (minuteAngle + deg) % 360;
  document.getElementById("minutenzeiger").style.transform = `rotate(${minuteAngle}deg)`;
}

// Beispiel: direkt Uhrzeit setzen
export function setTime(hours, minutes) {
  // Minuten → 6° pro Minute
  const minuteDeg = minutes * 6;
  // Stunden → 30° pro Stunde + Zusatz je nach Minuten
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  minuteAngle = minuteDeg;
  hourAngle = hourDeg;

  document.getElementById("stundenzeiger").style.transform = `rotate(${hourDeg}deg)`;
  document.getElementById("minutenzeiger").style.transform = `rotate(${minuteDeg}deg)`;
}

