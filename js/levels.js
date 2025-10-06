// levels.js – Lernspiel: Tageszeiten zuordnen

function initLevel1() {
  console.log("🎮 Level 1 gestartet");

  const levelData = [
    { hour: 7,  minute: 0, correct: "Morgen.PNG", text: "Frühstückszeit!" },
    { hour: 9,  minute: 0, correct: "Schule.PNG", text: "Schulbeginn!" },
    { hour: 16, minute: 0, correct: "Hobby.PNG",  text: "Freizeit und Hobbys!" },
    { hour: 21, minute: 0, correct: "Schlaf.PNG",  text: "Schlafenszeit!" }
  ];

  const main = document.querySelector("main");
  if (!main) { console.error("❌ Kein <main>-Element gefunden!"); return; }

  main.innerHTML = "";
  const game = document.createElement("div");
  game.className = "game-container";
  game.innerHTML = `
    <h2>Level 1: Tageszeiten zuordnen</h2>
    <p>Welche Bildkarte passt zur angezeigten Uhrzeit?</p>
    <div id="levelClock" style="position:relative; width:min(80vw,480px); aspect-ratio:1/1; margin:10px auto;">
      <img class="zb" src="./assets/images/Ziffernblatt.png" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain;">
      <img id="lvlHour"   class="hand" src="./assets/images/Stundenzeiger.png" alt="Stundenzeiger">
      <img id="lvlMinute" class="hand" src="./assets/images/Minutenzeiger.png" alt="Minutenzeiger">
    </div>
    <div class="image-row" id="choices"></div>
  `;
  main.appendChild(game);

  // Uhr im Level unabhängig von der großen Uhr steuern
  function setLevelTime(h, m) {
    const hourDeg   = (h % 12) * 30 + m * 0.5;
    const minuteDeg = m * 6;
    const H = game.querySelector("#lvlHour");
    const M = game.querySelector("#lvlMinute");
    if (H) H.style.transform = `translate(-50%, -100%) rotate(${hourDeg}deg)`;
    if (M) M.style.transform = `translate(-50%, -100%) rotate(${minuteDeg}deg)`;
  }

  const choicesEl = game.querySelector("#choices");

  let current = 0;
  nextRound();

  function nextRound() {
    if (current >= levelData.length) {
      main.innerHTML = `<div class="game-container"><h2>🎉 Super!</h2><p>Du hast alle Zeiten richtig zugeordnet.</p></div>`;
      return;
    }

    const round = levelData[current];
    setLevelTime(round.hour, round.minute);

    // Karten neu rendern (shuffle)
    const files = levelData.map(x => x.correct).sort(() => Math.random() - 0.5);
    choicesEl.innerHTML = "";
    files.forEach(file => {
      const img = document.createElement("img");
      img.src = `./assets/images/${file}`;
      img.alt = file.replace(".PNG","");
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