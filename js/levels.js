function initLevel1() {
  console.log("🎮 Level 1 gestartet");

  const levelData = [
    { hour: 7,  minute: 0, correct: "Morgen.PNG", text: "Frühstückszeit!" },
    { hour: 9,  minute: 0, correct: "Schule.PNG", text: "Schulbeginn!" },
    { hour: 16, minute: 0, correct: "Hobby.PNG",  text: "Freizeit und Hobbys!" },
    { hour: 21, minute: 0, correct: "Schlaf.PNG",  text: "Schlafenszeit!" }
  ];

  const main = document.querySelector("main");
  if (!main) return;
  main.innerHTML = "";

  const game = document.createElement("div");
  game.className = "game-container";
  game.innerHTML = `
    <h2>Level 1: Tageszeiten zuordnen</h2>
    <p>Welche Bildkarte passt zur angezeigten Uhrzeit?</p>
    <div class="image-row" id="choices"></div>
  `;
  main.appendChild(game);

  const choicesEl = game.querySelector("#choices");

  let current = 0;
  nextRound();

  function nextRound() {
    if (current >= levelData.length) {
      main.innerHTML = `<div class="game-container"><h2>🎉 Super!</h2><p>Du hast alle Zeiten richtig zugeordnet.</p></div>`;
      return;
    }

    const round = levelData[current];
    setTime(round.hour, round.minute);
    const files = levelData.map(x => x.correct).sort(() => Math.random() - 0.5);
    choicesEl.innerHTML = "";

    files.forEach(file => {
      const img = document.createElement("img");
      img.src = `./assets/images/${file}`;
      img.alt = file;
      img.className = "choice-img";
      img.addEventListener("click", () => {
        if (file === round.correct) {
          alert(`✅ Richtig! ${round.text}`);
          current++;
          nextRound();
        } else {
          alert("❌ Versuch es nochmal!");
        }
      });
      choicesEl.appendChild(img);
    });
  }
}