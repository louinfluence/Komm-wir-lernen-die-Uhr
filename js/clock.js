// clock.js – robuste Zeigersteuerung mit klaren Hilfsfunktionen
// Ziel: große Zeiger, korrekter Pivot (unten Mitte), saubere Rotation.

(function(){
  let $hour, $minute;

  function q(id){ return document.getElementById(id); }

  function ensureRefs(){
    if (!$hour)   $hour   = q("hourHand");
    if (!$minute) $minute = q("minuteHand");
    return ($hour && $minute);
  }

  // Setzt die Rotation (Grad) und lässt das translate aus CSS bestehen.
  function rotateEl(el, deg){
    if (!el) return;
    el.style.transform = `translate(-50%, -100%) rotate(${deg}deg)`;
  }

  // Öffentliche API: Uhrzeit setzen (h,m). Sekunden optional ignoriert.
  window.setTime = function(hours, minutes){
    if (!ensureRefs()) return;
    const h = Number(hours) || 0;
    const m = Number(minutes) || 0;

    const hourDeg   = (h % 12) * 30 + m * 0.5;
    const minuteDeg = m * 6;

    rotateEl($hour, hourDeg);
    rotateEl($minute, minuteDeg);
  };

  // Optional: bei Bildladen Pivot/Kanten sauber halten – hier bewusst schlank,
  // weil CSS bereits transform-origin korrekt setzt.
  // Falls du mit SVG arbeitest, könntest du hier zusätzliche Korrekturen einbauen.

  // Erste Initialisierung: falls DOM schon da ist, Zeiger auf 6:00
  if (document.readyState !== "loading") {
    window.setTime(6,0);
  } else {
    document.addEventListener("DOMContentLoaded", ()=> window.setTime(6,0));
  }
})();