// --- CLOCK CORE FUNCTIONS ---
window.displayMode = "12h"; // global sichtbar

window.setTime = function(hours, minutes) {
  // Drehrichtung weich halten: merken der letzten Winkelposition
window.lastMinuteAngle ??= 0;
let newAngle = minutes * 6;

// Falls Sprung > 300° (z. B. 354 -> 0), korrigieren:
if (Math.abs(newAngle - window.lastMinuteAngle) > 300) {
  if (newAngle < window.lastMinuteAngle) {
    newAngle += 360;
  }
}

const minuteAngle = newAngle;
window.lastMinuteAngle = newAngle % 360;

  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  // ⬇️ NEU: aktuelle Minuten global merken (0–1439)
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

  document.getElementById("timeDisplay").textContent = formatTime(hours, minutes);
}

function formatTime(h, m) {
  const pad = (x) => x.toString().padStart(2, "0");
  if (window.displayMode === "12h") {
    const suffix = h >= 12 ? "nachmittags" : "vormittags";
    const hour = h % 12 || 12;
    return `Es ist ${hour}:${pad(m)} Uhr ${suffix}.`;
  } else {
    return `Es ist ${pad(h)}:${pad(m)} Uhr.`;
  }
}
