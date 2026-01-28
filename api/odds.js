// 🏒 LEDO RITULYS – VISOS LYGOS
if (sport === "hockey") {
  urls = [
    // NHL
    "https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY,

    // KHL
    "https://api.the-odds-api.com/v4/sports/icehockey_khl/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY,

    // SHL (Švedija)
    "https://api.the-odds-api.com/v4/sports/icehockey_sweden_hockey_league/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY,

    // Liiga (Suomija)
    "https://api.the-odds-api.com/v4/sports/icehockey_finnish_liiga/odds/?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=" + API_KEY
  ];
}
