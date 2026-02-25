const API_KEY = "b2e1590b865bd748e670388b64aad940";
const BASE = "https://api.the-odds-api.com/v4/sports/";

async function loadOdds() {

  const sport = document.getElementById("sport").value;
  const marketFilter = document.getElementById("marketFilter").value;
  const minEv = parseFloat(document.getElementById("minEv").value) / 100;
  const minBooks = parseInt(document.getElementById("minBooks").value);

  const url = `${BASE}${sport}/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h,totals`;

  const res = await fetch(url);
  const data = await res.json();

  const gamesDiv = document.getElementById("games");
  const topDiv = document.getElementById("top3");

  gamesDiv.innerHTML = "";
  topDiv.innerHTML = "";

  let allToday = [];

  data.forEach(game => {

    const bestPick = getBestSharpPick(game, marketFilter, minEv, minBooks);

    if (!bestPick) return;

    const date = new Date(game.commence_time).toLocaleString();

    gamesDiv.innerHTML += `
      <div class="game">
        <b>${game.home_team} vs ${game.away_team}</b><br>
        ${date}
        <div class="pick">
          ${bestPick.type} – ${bestPick.pick}${bestPick.line ? " " + bestPick.line : ""}
          @ ${bestPick.odds}
          | EV ${(bestPick.ev*100).toFixed(2)}%
        </div>
      </div>
    `;

    if (isToday(game.commence_time)) {
      allToday.push(bestPick);
    }

  });

  const top3 = allToday.sort((a,b)=>b.ev-a.ev).slice(0,3);

  top3.forEach(p => {
    topDiv.innerHTML += `
      <div class="top-card">
        <b>${p.match}</b><br>
        ${p.type} – ${p.pick}${p.line ? " " + p.line : ""}<br>
        Odds ${p.odds} | EV ${(p.ev*100).toFixed(2)}%
      </div>
    `;
  });
}

function getBestSharpPick(game, marketFilter, minEv, minBooks) {

  if (!game.bookmakers || game.bookmakers.length < minBooks) return null;

  let best = null;

  game.bookmakers.forEach(book => {

    book.markets.forEach(market => {

      if (marketFilter !== "both" && market.key !== marketFilter) return;

      market.outcomes.forEach(outcome => {

        if (!outcome.price) return;

        const avgOdds = getAverageOdds(game, market.key, outcome.name, outcome.point);
        const implied = 1 / avgOdds;
        const ev = (implied * outcome.price) - 1;

        if (ev > minEv) {

          if (!best || ev > best.ev) {
            best = {
              match: `${game.home_team} vs ${game.away_team}`,
              type: market.key === "h2h" ? "WIN" : "TOTAL",
              pick: outcome.name,
              line: outcome.point || null,
              odds: outcome.price.toFixed(2),
              ev
            };
          }

        }

      });

    });

  });

  return best;
}

function getAverageOdds(game, marketKey, name, point) {

  let prices = [];

  game.bookmakers.forEach(book => {

    book.markets.forEach(market => {

      if (market.key !== marketKey) return;

      market.outcomes.forEach(outcome => {
        if (outcome.name === name && outcome.point === point) {
          prices.push(outcome.price);
        }
      });

    });

  });

  return prices.reduce((a,b)=>a+b,0) / prices.length;
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}
