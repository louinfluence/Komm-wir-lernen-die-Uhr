// ----------------------------
// MAIN.JS – Spiel- und Aufgabenlogik
// ----------------------------

/**
 * Beispiel: Startfunktion (wird später beim Spielstart genutzt)
 */
function initGame() {
  console.log("Uhr-Spiel gestartet!");
  // Hier könnte später z. B. die erste Aufgabe geladen werden
  // loadLevel(0);
}

/**
 * Beispiel: Rückmeldung im Konsolen-Test
 */
document.addEventListener("DOMContentLoaded", () => {
  initGame();

  // Beispiel-Test: Uhr auf 7:30 stellen nach 2 Sekunden
  setTimeout(() => {
    setTime(12, 00);
    console.log("Uhr auf 12:00 gestellt.");
  }, 2000);
});
