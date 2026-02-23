function showFootball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadTest()">Premier League</button>
  `;
}

function showBasketball() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadTest()">NBA</button>
  `;
}

function showHockey() {
  document.getElementById("leagues").innerHTML = `
    <button onclick="loadTest()">NHL</button>
  `;
}

function loadTest() {

  const container = document.getElementById("odds");

  container.innerHTML = `
    <h2>🔥 TOP 3 ŠIANDIEN</h2>

    <div class="pick-card">
      <h3>Real Madrid vs Barcelona</h3>
      <p><b>WIN</b></p>
      <p>Pick: Real Madrid</p>
      <p>Odds: 1.85</p>
      <p>Edge: 5.2%</p>
      <p>Stake: 4.5€</p>
    </div>

    <div class="pick-card">
      <h3>Lakers vs Celtics</h3>
      <p><b>OVER/UNDER</b></p>
      <p>Pick: Over 221.5</p>
      <p>Odds: 1.91</p>
      <p>Edge: 4.8%</p>
      <p>Stake: 4.0€</p>
    </div>

    <div class="pick-card">
      <h3>NY Rangers vs Bruins</h3>
      <p><b>WIN</b></p>
      <p>Pick: Bruins</p>
      <p>Odds: 2.05</p>
      <p>Edge: 6.1%</p>
      <p>Stake: 5.2€</p>
    </div>
  `;
}
