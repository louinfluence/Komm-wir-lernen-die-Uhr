// clock.js – steuert die Zeigerbewegung

function setTime(hours, minutes) {
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;

  const hourHand = document.getElementById("hourHand");
  const minuteHand = document.getElementById("minuteHand");

  if (hourHand) hourHand.style.transform = `rotate(${hourDeg}deg)`;
  if (minuteHand) minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
}