const API = "https://www.thesportsdb.com/api/v1/json/1/";

const loadBtn = document.getElementById("loadBtn");
const leagueSelect = document.getElementById("leagueSelect");
const matchesDiv = document.getElementById("matches");

loadBtn.addEventListener("click", loadMatches);

async function loadMatches(){
matchesDiv.innerHTML="Loading...";

const leagueId = leagueSelect.value;

try{

// imam paskutinį round (veikia stabiliau nei eventsday)
const res = await fetch(`${API}eventspastleague.php?id=${leagueId}`);
const data = await res.json();

if(!data.events){
matchesDiv.innerHTML="No data.";
return;
}

// imam 10 paskutinių kaip demo
renderMatches(data.events.slice(0,10));

}catch(e){
matchesDiv.innerHTML="API error.";
}
}

function renderMatches(events){

matchesDiv.innerHTML="";

events.forEach(ev=>{

const homeProb = 45;
const drawProb = 25;
const awayProb = 30;
const overProb = 55;

const card = document.createElement("div");
card.className="card";

card.innerHTML=`
<h3>${ev.strHomeTeam} vs ${ev.strAwayTeam}</h3>

<div class="model">
Home ${homeProb}% |
Draw ${drawProb}% |
Away ${awayProb}% |
Over2.5 ${overProb}%
</div>

<div>
H <input type="number" step="0.01" class="h">
D <input type="number" step="0.01" class="d">
A <input type="number" step="0.01" class="a">
O <input type="number" step="0.01" class="o">
<button class="calc">Calc</button>
</div>

<div class="ev"></div>
`;

card.querySelector(".calc").addEventListener("click",()=>{
calcEV(card,homeProb,drawProb,awayProb,overProb);
});

matchesDiv.appendChild(card);

});
}

function calcEV(card,hp,dp,ap,op){

const h = parseFloat(card.querySelector(".h").value);
const d = parseFloat(card.querySelector(".d").value);
const a = parseFloat(card.querySelector(".a").value);
const o = parseFloat(card.querySelector(".o").value);

let out="";

if(h) out+=evLine("Home",hp,h);
if(d) out+=evLine("Draw",dp,d);
if(a) out+=evLine("Away",ap,a);
if(o) out+=evLine("Over",op,o);

card.querySelector(".ev").innerHTML=out;
}

function evLine(name,p,odd){
const ev = (p/100*odd-1)*100;
const c = ev>0?"pos":"neg";
return `<div class="${c}">${name} EV ${ev.toFixed(2)}%</div>`;
}
