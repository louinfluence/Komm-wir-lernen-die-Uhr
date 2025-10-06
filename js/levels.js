// levels.js – Lernspiel: Tageszeiten zuordnen

function initLevel1() {
  console.log("🎮 Level 1 gestartet");

  const levelData = [
    { hour: 7, minute: 0, correct: "Morgen.PNG", text: "Frühstückszeit!" },
    { hour: 9, minute: 0, correct: "Schule.PNG", text: "Schulbeginn!" },
    { hour: 16, minute: 0, correct: "Hobby.PNG", text: "Freizeit und Hobbys!" },
    { hour: 21, minute: 0, correct: "Schlaf.PNG", text: "Schlafenszeit!" }
  ];

  const main = document.querySelector("main");
  if (!main) {
    console.error("❌ Kein <main>-Element gefunden!");
    return;
  }

  main.innerHTML = "";

  const gameContainer = document.createElement("div");
  gameContainer.className = "game-container";

  const clockArea = document.createElement("div");
  clockArea.id = "clockArea";

  const instruction = document.createElement("p");
  instruction.textContent = "Ordne die richtige Tageszeit zu!";

  const imageRow = document.createElement("div");
  imageRow.className = "image-row";

  levelData.forEach((entry) => {
    const img = document.createElement("img");
    img.src = `./assets/images/${entry.correct}`;
    img.alt = entry.text;
    img.className = "choice-img";
    img.addEventListener("click", () => {
      alert(`✅ ${entry.text}`);
      nextRound();
    });
    imageRow.appendChild(img);
  });

  gameContainer.appendChild(instruction);
  gameContainer.appendChild(clockArea);
  gameContainer.appendChild(imageRow);
  main.appendChild(gameContainer);

  let currentRound = 0;
  function nextRound() {
    if (currentRound >= levelData.length) {
      main.innerHTML = "<h2>🎉 Super gemacht! Du hast alle Zeiten richtig zugeordnet!</h2>";
      return;
    }

    const round = levelData[currentRound];
    setTime(round.hour, round.minute);
    currentRound++;
  }

  nextRound();
}