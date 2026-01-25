const out = document.getElementById("out");
const btn = document.getElementById("load");

btn.onclick = async () => {
  out.innerHTML = "⏳ Analizuojama...";
  const r = await fetch("/api/basketball-totals");
  const data = await r.json();

  out.innerHTML = "";

  data.forEach(d => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${d.match}</h3>
      <b>${d.pick}</b><br/>
      Odds: ${d.odds}<br/>
      Tikimybė: ${d.prob}<br/>
      <i>${d.info}</i>
    `;
    out.appendChild(div);
  });
};
