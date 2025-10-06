// clock.js – steuert die Rotation der Zeiger
// Wichtig: CSS setzt transform: translate(-50%, -100%) rotate(var(--rot))
// Wir ändern NUR die Variable --rot, damit die Ausrichtung erhalten bleibt.

function setTime(hours, minutes) {
  const hourDeg   = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;

  const hourHand   = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");

  if (hourHand)   hourHand.style.setProperty("--rot", `${hourDeg}deg`);
  if (minuteHand) minuteHand.style.setProperty("--rot", `${minuteDeg}deg`);
}