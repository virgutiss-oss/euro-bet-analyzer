export default async function handler(req, res) {
  const path = req.url.replace("/api/","");
  const url = `https://v3.football.api-sports.io/${path}`;

  const r = await fetch(url,{
    headers:{
      "x-apisports-key": process.env.API_FOOTBALL_KEY
    }
  });
  const data = await r.json();
  res.status(200).json(data);
}
