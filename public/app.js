// ====== SPORTŲ LYGOS ======

function showFootball() {
  const leagues = document.getElementById("leagues");
  leagues.innerHTML = `
    <h2>Football Leagues</h2>
    <button onclick="loadOdds('soccer_uefa_champs_league')">Champions League</button>
    <button onclick="loadOdds('soccer_epl')">Premier League</button>
    <button onclick="loadOdds('soccer_spain_la_liga')">La Liga</button>
    <button onclick="loadOdds('soccer_germany_bundesliga')">Bundesliga</button>
    <button onclick="loadOdds('soccer_italy_serie_a')">Serie A</button>
  `;
}

function showBasketball() {
  const leagues = document.getElementById("leagues");
  leagues.innerHTML = `
    <h2>Basketball Leagues</h2>
    <button onclick="loadOdds('basketball_euroleague')">EuroLeague</button>
    <button onclick="loadOdds('basketball_nba')">NBA</button>
    <button onclick="loadOdds('basketball_eurocup')">EuroCup</button>
  `;
}

function showHockey() {
  const leagues = document.getElementById("leagues");
  leagues.innerHTML = `
    <h2>Hockey Leagues</h2>
    <button onclick="loadOdds('icehockey_nhl')">NHL</button>
    <button onclick="loadOdds('icehockey_sweden_allsvenskan')">Sweden Allsvenskan</button>
  `;
}

// ====== ODDS LOAD ======

async function loadOdds(sportKey) {

  const container = document.getElementById("odds");
  container.innerHTML = "Kraunama...";

  try {
    const res = await fetch(`/api/odds?sport=${sportKey}`);
    const games = await res.json();

    container.innerHTML = "";

    if (!games || games.length === 0) {
      container.innerHTML = "Nėra rungtynių.";
      return;
    }

    games.forEach(game => {

      const div = document.createElement("div");
      div.className = "match-card";

      div.innerHTML = `
        <h3>${game.home_team} vs ${game.away_team}</h3>
        <p>📅 ${new Date(game.commence_time).toLocaleString()}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    container.innerHTML = "Klaida gaunant duomenis.";
    console.error(err);
  }
}

// AUTO LOAD FOOTBALL
document.addEventListener("DOMContentLoaded", function() {
  showFootball();
});
