const MIN_EDGE = 0.03;
const bankroll = 100;

// ================= MENU =================
function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_france_ligue_one')">Ligue 1</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_fiba')">FIBA</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
  `;
}

// ================= LOAD =================
async function loadOdds(sportKey) {
  const container = document.getElementById("odds");
  container.innerHTML = "<p>Kraunama...</p>";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>Rungtynių nėra</p>";
      return;
    }

    buildTop3(data);

  } catch (err) {
    container.innerHTML = "<p>Klaida kraunant</p>";
  }
}

// ================= CORE LOGIC =================
function impliedProbability(odds) { return 1 / odds; }
function calculateEdge(modelProb, impliedProb) { return modelProb - impliedProb; }
function kelly(edge, odds) { if (odds <= 1) return 0; return edge / (odds - 1); }

function buildTop3(games) {
  const container = document.getElementById("odds");
  container.innerHTML = "";

  let picks = [];

  games.forEach(game => {
    if (!game.bookmakers) return;

    game.bookmakers.forEach(book => {
      book.markets.forEach(market => {
        if (market.key !== "h2h" && market.key !== "totals") return;

        market.outcomes.forEach(outcome => {
          if (!outcome.price) return;

          const implied = impliedProbability(outcome.price);
          const modelProb = implied * 1.05; // simple adjustment
          const edge = calculateEdge(modelProb, implied);

          if (edge < MIN_EDGE) return;

          picks.push({
            match: `${game.home_team} vs ${game.away_team}`,
            type: market.key === "h2h" ? "WIN" : "OVER/UNDER",
            pick: market.key === "totals"
              ? `${outcome.name} ${outcome.point || ""}`
              : outcome.name,
            odds: outcome.price,
            edge,
            stake: bankroll * Math.max(0, kelly(edge, outcome.price)) * 0.5
          });
        });
      });
    });
  });

  // tik TOP 3 pagal edge
  picks = picks.sort((a,b)=>b.edge-a.edge).slice(0,3);

  if (picks.length === 0) {
    container.innerHTML = "<p>Value pasirinkimų nėra</p>";
    return;
  }

  container.innerHTML = "<h2>🔥 TOP 3 ŠIANDIEN</h2>";

  picks.forEach(p => {
    const div = document.createElement("div");
    div.className = "pick-card";

    div.innerHTML = `
      <h3>${p.match}</h3>
      <p><b>${p.type}</b></p>
      <p>Pick: ${p.pick}</p>
      <p>Odds: ${p.odds}</p>
      <p>Edge: ${(p.edge*100).toFixed(2)}%</p>
      <p>Stake: ${p.stake.toFixed(2)}€</p>
    `;

    container.appendChild(div);
  });
}
