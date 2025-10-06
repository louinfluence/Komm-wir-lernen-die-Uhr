// --- CLOCK CORE FUNCTIONS ---
window.displayMode = "24h"; // global sichtbar

window.setTime = function(hours, minutes) {
  // kontinuierlicher Minutenwinkel (keine Sprünge)
  window.totalMinuteAngle ??= 0;
  const targetAngle = minutes * 6;
  const lastAngle = window.totalMinuteAngle % 360;
  let delta = targetAngle - lastAngle;

  // Sprünge über 180° korrigieren (z. B. 354° → 0° → +6°)
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

  updateClock(hours, minutes, hourAngle, minuteAngle);
};

function updateClock(hours, minutes, hourAngle, minuteAngle) {
  const hourHand = document.getElementById("stundenzeiger");
  const minuteHand = document.getElementById("minutenzeiger");

  if (hourHand && minuteHand) {
    hourHand.style.transition = "transform 0.15s ease";
    minuteHand.style.transition = "transform 0.15s ease";
    hourHand.style.transform = `translate(-50%, -50%) rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `translate(-50%, -50%) rotate(${minuteAngle}deg)`;
  }

  // optional: Anzeige der digitalen Zeit, falls vorhanden
  const disp = document.getElementById("timeDisplay");
  if (disp) disp.textContent = formatTime(hours, minutes);
}

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
console.log("Clock.js geladen ✅");
