let hourAngle = 0;
let minuteAngle = 0;
let displayMode = "24h";

function setTime(hours, minutes) {
  minuteAngle = minutes * 6;
  hourAngle = (hours % 12) * 30 + minutes * 0.5;
  updateClock(hours, minutes);
}

function updateClock(hours, minutes) {
  const hourHand = document.getElementById("stundenzeiger");
  const minuteHand = document.getElementById("minutenzeiger");
  if (hourHand && minuteHand) {
    hourHand.style.transform = `translate(-50%, -50%) rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `translate(-50%, -50%) rotate(${minuteAngle}deg)`;
  }
  document.getElementById("timeDisplay").textContent = formatTime(hours, minutes);
}

function formatTime(h, m) {
  const pad = (x) => x.toString().padStart(2, "0");
  if (displayMode === "12h") {
    const suffix = h >= 12 ? "nachmittags" : "vormittags";
    let hour = h % 12 || 12;
    return `Es ist ${hour}:${pad(m)} Uhr ${suffix}.`;
  } else {
    return `Es ist ${pad(h)}:${pad(m)} Uhr.`;
  }
}
