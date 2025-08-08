// build.mjs — daily static build (Node 20+ required)
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = __dirname;
const citiesDir = path.join(outDir, "cities");
const dataDir = path.join(outDir, "data");

async function ensureDirs() {
  await fs.mkdir(citiesDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });
}

function yyyymmdd(d=new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayOfYear(d = new Date()) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24)); // 0-based
}

// --------- Config ---------
const cities = [
  { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Toronto, Canada", lat: 43.6532, lon: -79.3832 },
  { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
  { name: "São Paulo, Brazil", lat: -23.5505, lon: -46.6333 },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { name: "Johannesburg, South Africa", lat: -26.2041, lon: 28.0473 },
  { name: "Mexico City, Mexico", lat: 19.4326, lon: -99.1332 },
  { name: "Berlin, Germany", lat: 52.5200, lon: 13.4050 }
];

// Map Open-Meteo weather codes to emojis/labels
const weatherCodeMap = {
  0: { emoji: "☀️", label: "Clear sky" },
  1: { emoji: "🌤️", label: "Mainly clear" },
  2: { emoji: "⛅", label: "Partly cloudy" },
  3: { emoji: "☁️", label: "Overcast" },
  45: { emoji: "🌫️", label: "Fog" },
  48: { emoji: "🌫️", label: "Depositing rime fog" },
  51: { emoji: "🌦️", label: "Light drizzle" },
  53: { emoji: "🌦️", label: "Moderate drizzle" },
  55: { emoji: "🌧️", label: "Dense drizzle" },
  56: { emoji: "🌦️", label: "Light freezing drizzle" },
  57: { emoji: "🌧️", label: "Dense freezing drizzle" },
  61: { emoji: "🌦️", label: "Slight rain" },
  63: { emoji: "🌧️", label: "Moderate rain" },
  65: { emoji: "🌧️", label: "Heavy rain" },
  66: { emoji: "🌨️", label: "Light freezing rain" },
  67: { emoji: "🌨️", label: "Heavy freezing rain" },
  71: { emoji: "🌨️", label: "Slight snow fall" },
  73: { emoji: "🌨️", label: "Moderate snow fall" },
  75: { emoji: "❄️", label: "Heavy snow fall" },
  77: { emoji: "🌨️", label: "Snow grains" },
  80: { emoji: "🌦️", label: "Slight rain showers" },
  81: { emoji: "🌧️", label: "Moderate rain showers" },
  82: { emoji: "⛈️", label: "Violent rain showers" },
  85: { emoji: "🌨️", label: "Slight snow showers" },
  86: { emoji: "❄️", label: "Heavy snow showers" },
  95: { emoji: "⛈️", label: "Thunderstorm" },
  96: { emoji: "⛈️", label: "Thunderstorm w/ hail" },
  99: { emoji: "⛈️", label: "Thunderstorm w/ heavy hail" }
};

async function getPhotoOfTheDay() {
  // Use Picsum (no key): pick deterministically from a list based on day-of-year
  const listUrl = "https://picsum.photos/v2/list?limit=100";
  try {
    const res = await fetch(listUrl, { headers: { "User-Agent": "autopilot-micro-portal" } });
    if (!res.ok) throw new Error("Picsum list failed");
    const arr = await res.json();
    const idx = dayOfYear() % arr.length;
    const item = arr[idx];
    return {
      url: item.download_url,
      author: item.author,
      source: "Picsum.photos"
    };
  } catch (e) {
    // Fallback: seed-based URL (no author metadata)
    const seed = yyyymmdd();
    return {
      url: `https://picsum.photos/seed/${seed}/1200/800`,
      author: "Unknown (Picsum seed)",
      source: "Picsum.photos"
    };
  }
}

async function getQuote() {
  // Try Quotable (no key). Fallback to local quotes.json
  try {
    const res = await fetch("https://api.quotable.io/random");
    if (res.ok) {
      const q = await res.json();
      return { text: q.content, author: q.author || "Unknown" };
    }
  } catch {}
  // Fallback
  const quotesRaw = await fs.readFile(path.join(dataDir, "quotes.json"), "utf-8");
  const quotes = JSON.parse(quotesRaw);
  const idx = dayOfYear() % quotes.length;
  return quotes[idx];
}

async function getWeather(lat, lon) {
  // Current + 3-day daily forecast
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("forecast_days", "3");
  url.searchParams.set("timezone", "UTC");
  const res = await fetch(url, { headers: { "User-Agent": "autopilot-micro-portal" } });
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
  return res.json();
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function renderIndex({ photo, quote, citySummaries }) {
  const tpl = await fs.readFile(path.join(__dirname, "template.html"), "utf-8");
  const cards = citySummaries.map(cs => `
    <a class="card" href="./cities/${slugify(cs.name)}.html" aria-label="${cs.name} weather">
      <div class="card-title">${cs.name}</div>
      <div class="card-row"><span>${cs.emoji}</span><span>${cs.label}</span></div>
      <div class="card-row big">${Math.round(cs.temp)}°C</div>
      <div class="card-row small">Wind ${Math.round(cs.wind)} m/s</div>
    </a>
  `).join("\n");

  const html = tpl
    .replace("{{PHOTO_URL}}", photo.url)
    .replace("{{PHOTO_AUTHOR}}", photo.author)
    .replace("{{QUOTE_TEXT}}", quote.text)
    .replace("{{QUOTE_AUTHOR}}", quote.author)
    .replace("{{CITY_CARDS}}", cards)
    .replace("{{TODAY}}", yyyymmdd());

  await fs.writeFile(path.join(outDir, "index.html"), html, "utf-8");
}

async function renderCityPage(city, w) {
  const tpl = await fs.readFile(path.join(__dirname, "city.template.html"), "utf-8");
  const curr = w.current;
  const d = w.daily;
  const code = (curr && typeof curr.weather_code === "number") ? curr.weather_code : 3;
  const wx = weatherCodeMap[code] || { emoji: "☁️", label: "Cloudy" };
  const rows = [];
  for (let i = 0; i < (d?.time?.length ?? 0); i++) {
    rows.push(`
      <div class="row">
        <div>${d.time[i]}</div>
        <div>${Math.round(d.temperature_2m_max[i])} / ${Math.round(d.temperature_2m_min[i])} °C</div>
        <div>${(d.precipitation_sum[i] ?? 0)} mm</div>
      </div>
    `);
  }
  const html = tpl
    .replaceAll("{{CITY_NAME}}", city.name)
    .replace("{{CURR_EMOJI}}", wx.emoji)
    .replace("{{CURR_LABEL}}", wx.label)
    .replace("{{CURR_TEMP}}", String(Math.round(curr?.temperature_2m ?? 0)))
    .replace("{{CURR_WIND}}", String(Math.round(curr?.wind_speed_10m ?? 0)))
    .replace("{{DAILY_ROWS}}", rows.join("\n"))
    .replace("{{TODAY}}", yyyymmdd());

  await fs.writeFile(path.join(citiesDir, `${slugify(city.name)}.html`), html, "utf-8");
}

async function renderSitemap(cityNames) {
  const base = ""; // relative URLs for GitHub Pages
  const pages = [
    `${base}/`,
    `${base}/privacy.html` // we will ensure privacy.html exists
  ];

  const urls = [`<url><loc>/</loc></url>`,
                `<url><loc>/privacy.html</loc></url>`];
  for (const name of cityNames) {
    urls.append(`<url><loc>/cities/${slugify(name)}.html</loc></url>`);
  }

  // Fix: JS doesn't have f-strings; we manually craft the XML.
  const items = [`<url><loc>/</loc></url>`, `<url><loc>/privacy.html</loc></url>`];
  for (const name of cityNames) {
    items.push(`<url><loc>/cities/${slugify(name)}.html</loc></url>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join("\n")}
</urlset>`;
  await fs.writeFile(path.join(outDir, "sitemap.xml"), xml, "utf-8");
}

async function main() {
  await ensureDirs();

  // Load local quotes for fallback
  try {
    await fs.access(path.join(dataDir, "quotes.json"));
  } catch {
    await fs.writeFile(path.join(dataDir, "quotes.json"), JSON.stringify([
      {"text":"Simplicity is the soul of efficiency.","author":"Austin Freeman"},
      {"text":"Well begun is half done.","author":"Aristotle"},
      {"text":"The future depends on what you do today.","author":"Mahatma Gandhi"},
      {"text":"Make it work, make it right, make it fast.","author":"Kent Beck"},
      {"text":"Action is the foundational key to all success.","author":"Pablo Picasso"},
      {"text":"Small deeds done are better than great deeds planned.","author":"Peter Marshall"},
      {"text":"You miss 100% of the shots you don’t take.","author":"Wayne Gretzky"},
      {"text":"It always seems impossible until it’s done.","author":"Nelson Mandela"},
      {"text":"Do one thing every day that scares you.","author":"Eleanor Roosevelt"},
      {"text":"No pressure, no diamonds.","author":"Thomas Carlyle"}
    ], null, 2), "utf-8");
  }

  const [photo, quote] = await Promise.all([getPhotoOfTheDay(), getQuote()]);

  const citySummaries = [];
  for (const city of cities) {
    try {
      const w = await getWeather(city.lat, city.lon);
      const code = (w.current && typeof w.current.weather_code === "number") ? w.current.weather_code : 3;
      const wx = weatherCodeMap[code] || { emoji: "☁️", label: "Cloudy" };
      citySummaries.push({
        name: city.name,
        temp: w.current?.temperature_2m ?? 0,
        wind: w.current?.wind_speed_10m ?? 0,
        emoji: wx.emoji,
        label: wx.label
      });
      await renderCityPage(city, w);
    } catch (e) {
      // Skip on failure but continue others
      citySummaries.push({
        name: city.name,
        temp: 0, wind: 0, emoji: "ℹ️", label: "Data unavailable"
      });
    }
  }

  await renderIndex({ photo, quote, citySummaries });
  await renderSitemap(cities.map(c => c.name));

  // robots.txt (allow all)
  const robots = `User-agent: *
Allow: /
Sitemap: /sitemap.xml
`;
  await fs.writeFile(path.join(outDir, "robots.txt"), robots, "utf-8");

  console.log("Build complete:", yyyymmdd(), "Cities:", cities.length);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
