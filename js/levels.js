/* =========================================================
   LEVELS.JS – Alle Spiel-Levels.
   ========================================================= */

/* =========================================================
   Gemeinsame Spiellogik
   ========================================================= */
function runClockLevel(levelData, title, onComplete) {
  const main = document.getElementById("gameContainer");
  main.innerHTML = `<h2>${title}</h2>`;

  const clock = document.createElement("div");
  clock.className = "clock";

  const hourHand = document.createElement("div");
  hourHand.className = "hand hour";
  const minuteHand = document.createElement("div");
  minuteHand.className = "hand minute";
  clock.appendChild(hourHand);
  clock.appendChild(minuteHand);
  main.appendChild(clock);

  const feedback = document.createElement("div");
  feedback.id = "feedback";
  main.appendChild(feedback);

  let current = 0;

  function nextRound() {
    if (current >= levelData.length) {
      feedback.textContent = "🎉 Geschafft!";
      onComplete();
      return;
    }

    const data = levelData[current];
    feedback.textContent = data.text || "Welche Uhrzeit passt?";

    // Zeiger bewegen
    const hourAngle = (data.hour % 12) * 30 + data.minute * 0.5;
    const minuteAngle = data.minute * 6;
    hourHand.style.transform = `translate(-50%) rotate(${hourAngle}deg)`;
    minuteHand.style.transform = `translate(-50%) rotate(${minuteAngle}deg)`;

    // Antwortoptionen
    const opts = document.createElement("div");
    opts.id = "options";

    let pool;
    if (data.correct.endsWith(".PNG")) {
      pool = ["Morgen.PNG", "Schule.PNG", "Hobby.PNG", "Schlaf.PNG"];
    } else if (data.correct.includes("halb")) {
      pool = ["halb 2", "halb 5", "halb 8", "halb 11"];
    } else {
      pool = ["3 Uhr", "6 Uhr", "9 Uhr", "12 Uhr"];
    }

    shuffle(pool).forEach(opt => {
  const btn = document.createElement("div");
  btn.className = "option";

  // Wenn es ein Bild ist (endet auf .PNG)
  if (opt.endsWith(".PNG")) {
    const img = document.createElement("img");
    img.src = `assets/images/${opt}`;
    img.alt = opt.replace(".PNG", "");
    img.className = "option-img";
    btn.appendChild(img);
  } else {
    // sonst Textoption
    btn.textContent = opt;
  }

btn.addEventListener("click", () => {
  if (opt === data.correct) {
    feedback.textContent = "✅ Richtig!";
    btn.classList.add("correct", "pulse-correct");
    setTimeout(() => {
      btn.classList.remove("pulse-correct");
      current++;
      nextRound();
    }, 1000);
  } else {
    feedback.textContent = "❌ Versuch’s nochmal!";
    btn.classList.add("wrong", "shake-wrong");
    setTimeout(() => btn.classList.remove("shake-wrong", "wrong"), 700);
  }
});


  opts.appendChild(btn);
});


    const old = document.querySelector("#options");
    if (old) old.remove();
    main.appendChild(opts);
  }

  nextRound();
}

/* =========================================================
   Hilfsfunktionen
   ========================================================= */
function shuffle(arr) {
  let a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
