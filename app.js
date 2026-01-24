const EURO_LEAGUES = [
  { id: 39, name: "Premier League 🇬🇧" },
  { id: 140, name: "La Liga 🇪🇸" },
  { id: 135, name: "Serie A 🇮🇹" },
  { id: 78, name: "Bundesliga 🇩🇪" },
  { id: 61, name: "Ligue 1 🇫🇷" },
  { id: 88, name: "Eredivisie 🇳🇱" },
  { id: 94, name: "Primeira Liga 🇵🇹" }
];

window.onload = () => {
  const sel = document.getElementById("league");
  EURO_LEAGUES.forEach(l => {
    sel.innerHTML += `<option value="${l.id}">${l.name}</option>`;
  });
};

async function loadMatches() {
  const league = document.getElementById("league").value;
  const market = document.getElementById("market").value;
  const box = document.getElementById("matches");

  box.innerHTML = "⏳ Kraunama...";

  const today = new Date();
  const from = today.toISOString().split("T")[0];
  today.setDate(today.getDate() + 7);
  const to = today.toISOString().split("T")[0];

  const res = await fetch(
    `https://${API_HOST}/fixtures?league=${league}&season=2025&from=${from}&to=${to}`,
    { headers: { "x-apisports-key": API_KEY } }
  );

  const data = await res.json();

  if (!data.response || data.response.length === 0) {
    box.innerHTML = "❌ Nėra artimiausių rungtynių";
    return;
  }

  let html = "";

  for (const m of data.response.slice(0, 10)) {
    const p = Math.floor(Math.random() * 30) + 55;
    const [st, c] = status(p);

    html += `
      <div class="match">
        <div class="teams">
          ${m.teams.home.name} <span>vs</span> ${m.teams.away.name}
        </div>
        <div class="result ${c}">
          ${market.toUpperCase()} • ${p}% • ${st}
        </div>
      </div>
    `;
  }

  box.innerHTML = html;
}
