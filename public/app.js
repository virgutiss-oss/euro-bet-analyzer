const MAX_PICKS = 3;
const MIN_EDGE = 0.03; // minimum 3% EV

function isToday(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}

async function loadOdds(sportKey) {
  const container = document.getElementById("odds");
  container.innerHTML = "Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const games = await res.json();
    buildBoard(games);
  } catch {
    container.innerHTML = "Klaida";
  }
}

function buildBoard(games) {

  const container = document.getElementById("odds");
  container.innerHTML = "";

  let todayPicks = [];

  games.forEach(game => {

    if (!game.bookmakers) return;

    const winPick = calculateEV(game, "h2h");
    const totalPick = calculateEV(game, "totals");

    const gameDiv = document.createElement("div");
    gameDiv.className = "pick-card";

    gameDiv.innerHTML = `
      <h3>${game.home_team} vs ${game.away_team}</h3>
      <p>📅 ${formatDate(game.commence_time)}</p>
    `;

    if (winPick) {
      gameDiv.innerHTML += `<p><b>WIN:</b> ${winPick.pick} @ ${winPick.odds}</p>`;
      if (isToday(game.commence_time)) todayPicks.push(winPick);
    }

    if (totalPick) {
      gameDiv.innerHTML += `
        <p><b>OVER/UNDER:</b> ${totalPick.pick} ${totalPick.point} @ ${totalPick.odds}</p>
      `;
      if (isToday(game.commence_time)) todayPicks.push(totalPick);
    }

    container.appendChild(gameDiv);
  });

  // 🔥 TOP 3 TIK IŠ ŠIANDIENOS
  const top3 = todayPicks
    .filter(p => p.ev > MIN_EDGE)
    .sort((a,b)=>b.ev-a.ev)
    .slice(0,MAX_PICKS);

  if (top3.length > 0) {

    const title = document.createElement("h2");
    title.innerText = "🔥 TODAY TOP 3 (REAL EV)";
    container.prepend(title);

    top3.forEach(p => {
      const div = document.createElement("div");
      div.className = "top-card";
      div.innerHTML = `
        <h3>${p.match}</h3>
        <p>📅 ${formatDate(p.date)}</p>
        <p>${p.type}</p>
        <p>Pick: ${p.pick} ${p.point || ""}</p>
        <p>Odds: ${p.odds}</p>
        <p>Expected Value: ${(p.ev*100).toFixed(2)}%</p>
      `;
      container.prepend(div);
    });
  }
}

function calculateEV(game, marketKey) {

  let outcomeMap = {};

  game.bookmakers.forEach(book => {
    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        if (!outcomeMap[outcome.name]) {
          outcomeMap[outcome.name] = [];
        }

        outcomeMap[outcome.name].push({
          price: outcome.price,
          point: outcome.point || ""
        });
      });
    });
  });

  let bestPick = null;

  Object.keys(outcomeMap).forEach(name => {

    const prices = outcomeMap[name];

    if (prices.length < 2) return;

    const oddsArray = prices.map(p => p.price);
    const bestOdds = Math.max(...oddsArray);

    if (bestOdds > 4.5) return; // no crazy longshots

    // implied probabilities
    const implied = oddsArray.map(o => 1/o);
    const total = implied.reduce((a,b)=>a+b,0);

    // remove overround
    const fairProbs = implied.map(p => p/total);

    const fairProb = fairProbs.reduce((a,b)=>a+b,0)/fairProbs.length;

    const ev = (fairProb * bestOdds) - 1;

    if (!bestPick || ev > bestPick.ev) {
      bestPick = {
        match: `${game.home_team} vs ${game.away_team}`,
        date: game.commence_time,
        type: marketKey === "h2h" ? "WIN" : "OVER/UNDER",
        pick: name,
        point: prices[0].point,
        odds: bestOdds,
        ev
      };
    }
  });

  return bestPick;
}
