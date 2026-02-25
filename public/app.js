const API_KEY = "b2e1590b865bd748e670388b64aad940";
const BASE_URL = "https://api.the-odds-api.com/v4/sports/";

let todayValuePicks = [];
let MIN_BOOKS = 3;
const MIN_EDGE = 0.02;

async function loadOdds() {

  const sport = document.getElementById("sportSelect").value;
  MIN_BOOKS = parseInt(document.getElementById("minBooks").value);

  todayValuePicks = [];

  const url = `${BASE_URL}${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`;

  const response = await fetch(url);
  const data = await response.json();

  const gamesContainer = document.getElementById("games");
  gamesContainer.innerHTML = "";

  data.forEach(game => {

    const div = document.createElement("div");
    div.className = "game";

    const date = new Date(game.commence_time).toLocaleString();

    div.innerHTML = `<h3>${game.home_team} vs ${game.away_team}</h3>
                     <p>${date}</p>`;

    const h2hPick = calculateTrueEV(game, "h2h");
    const totalPick = calculateTrueEV(game, "totals");

    [h2hPick, totalPick].forEach(pick => {

      if (pick) {

        let lineText = pick.line ? ` ${pick.line}` : "";

        div.innerHTML += `
          <div class="pick">
            <b>${pick.type}</b> – ${pick.pick}${lineText}
            @ ${pick.odds}
            | EV ${(pick.ev*100).toFixed(2)}%
          </div>
        `;

        if (isToday(game.commence_time)) {
          todayValuePicks.push(pick);
        }
      }

    });

    gamesContainer.appendChild(div);
  });

  showTop3();
}

function calculateTrueEV(game, marketKey) {

  if (!game.bookmakers || game.bookmakers.length < MIN_BOOKS) return null;

  let marketMap = {};

  game.bookmakers.forEach(book => {

    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        const id = outcome.name + "_" + (outcome.point || "");

        if (!marketMap[id]) {
          marketMap[id] = {
            name: outcome.name,
            point: outcome.point,
            prices: []
          };
        }

        marketMap[id].prices.push(outcome.price);
      });

    });

  });

  let bestPick = null;

  Object.values(marketMap).forEach(o => {

    if (o.prices.length < MIN_BOOKS) return;

    const avgOdds = o.prices.reduce((a,b)=>a+b,0) / o.prices.length;
    const impliedProb = 1 / avgOdds;
    const bestOdds = Math.max(...o.prices);

    const ev = (impliedProb * bestOdds) - 1;

    if (ev > MIN_EDGE) {

      if (!bestPick || ev > bestPick.ev) {

        bestPick = {
          match: `${game.home_team} vs ${game.away_team}`,
          date: game.commence_time,
          type: marketKey === "h2h" ? "WIN" : "TOTAL",
          pick: o.name,
          line: o.point || null,
          odds: bestOdds.toFixed(2),
          ev
        };
      }

    }

  });

  return bestPick;
}

function showTop3() {

  const container = document.getElementById("top3");
  container.innerHTML = "";

  const top = todayValuePicks
    .sort((a,b)=>b.ev-a.ev)
    .slice(0,3);

  top.forEach(p => {

    let lineText = p.line ? ` ${p.line}` : "";

    container.innerHTML += `
      <div class="top-card">
        <h3>${p.match}</h3>
        <p>${p.type} – ${p.pick}${lineText}</p>
        <p>Odds: ${p.odds}</p>
        <p>EV: ${(p.ev*100).toFixed(2)}%</p>
      </div>
    `;
  });
}

function isToday(dateString) {
  const today = new Date();
  const date = new Date(dateString);
  return today.toDateString() === date.toDateString();
}
