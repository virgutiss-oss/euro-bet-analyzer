const API = "https://www.thesportsdb.com/api/v1/json/1/";

const matchesContainer = document.getElementById("matches");
const loadBtn = document.getElementById("loadBtn");
const leagueSelect = document.getElementById("leagueSelect");

loadBtn.addEventListener("click", loadMatches);

async function loadMatches() {
    matchesContainer.innerHTML = "Loading...";

    const leagueId = leagueSelect.value;
    const today = new Date().toISOString().split("T")[0];

    try {
        const res = await fetch(`${API}eventsday.php?d=${today}&l=${leagueId}`);
        const data = await res.json();

        if (!data.events) {
            matchesContainer.innerHTML = "No matches today.";
            return;
        }

        renderMatches(data.events);

    } catch (err) {
        matchesContainer.innerHTML = "Error loading matches.";
    }
}

function renderMatches(events) {
    matchesContainer.innerHTML = "";

    events.forEach(event => {

        const homeProb = randomProb();
        const drawProb = randomProb();
        const awayProb = 100 - homeProb - drawProb;

        const overProb = 55;

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h3>${event.strHomeTeam} vs ${event.strAwayTeam}</h3>
            <div class="model">
                Home: ${homeProb}% |
                Draw: ${drawProb}% |
                Away: ${awayProb}% <br>
                Over 2.5: ${overProb}%
            </div>

            <div class="odds">
                H <input type="number" step="0.01" class="odd-home">
                D <input type="number" step="0.01" class="odd-draw">
                A <input type="number" step="0.01" class="odd-away">
                O2.5 <input type="number" step="0.01" class="odd-over">
                <button class="calcBtn">Calc</button>
            </div>

            <div class="ev"></div>
        `;

        card.querySelector(".calcBtn").addEventListener("click", () => {
            calculateEV(card, homeProb, drawProb, awayProb, overProb);
        });

        matchesContainer.appendChild(card);
    });
}

function calculateEV(card, homeP, drawP, awayP, overP) {
    const homeOdd = parseFloat(card.querySelector(".odd-home").value);
    const drawOdd = parseFloat(card.querySelector(".odd-draw").value);
    const awayOdd = parseFloat(card.querySelector(".odd-away").value);
    const overOdd = parseFloat(card.querySelector(".odd-over").value);

    let output = "";

    if (homeOdd)
        output += formatEV("Home", homeP, homeOdd);

    if (drawOdd)
        output += formatEV("Draw", drawP, drawOdd);

    if (awayOdd)
        output += formatEV("Away", awayP, awayOdd);

    if (overOdd)
        output += formatEV("Over 2.5", overP, overOdd);

    card.querySelector(".ev").innerHTML = output;
}

function formatEV(name, prob, odd) {
    const ev = (prob / 100 * odd - 1) * 100;
    const className = ev > 0 ? "positive" : "negative";
    return `<div class="${className}">${name} EV: ${ev.toFixed(2)}%</div>`;
}

function randomProb() {
    return Math.floor(Math.random() * 40) + 20;
}
