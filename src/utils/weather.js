const DEFAULT_CITY = "Paris";

export async function fetchWeather(city = DEFAULT_CITY) {
  const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geoUrl.searchParams.set("name", city);
  geoUrl.searchParams.set("count", "1");
  geoUrl.searchParams.set("language", "fr");
  geoUrl.searchParams.set("format", "json");

  const geoResponse = await fetch(geoUrl);
  if (!geoResponse.ok) throw new Error("Recherche météo indisponible");
  const geoData = await geoResponse.json();
  const place = geoData.results?.[0];
  if (!place) throw new Error("Ville introuvable");

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", place.latitude);
  weatherUrl.searchParams.set("longitude", place.longitude);
  weatherUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m");
  weatherUrl.searchParams.set("daily", "precipitation_sum,temperature_2m_max,temperature_2m_min");
  weatherUrl.searchParams.set("forecast_days", "1");
  weatherUrl.searchParams.set("timezone", "auto");

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) throw new Error("Prévision météo indisponible");
  const weatherData = await weatherResponse.json();

  return {
    city: `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}`,
    temperature: Math.round(weatherData.current.temperature_2m),
    humidity: weatherData.current.relative_humidity_2m,
    rain: weatherData.daily.precipitation_sum?.[0] ?? weatherData.current.precipitation ?? 0,
    wind: Math.round(weatherData.current.wind_speed_10m),
    code: weatherData.current.weather_code,
    min: Math.round(weatherData.daily.temperature_2m_min?.[0]),
    max: Math.round(weatherData.daily.temperature_2m_max?.[0])
  };
}

export function weatherLabel(code) {
  if ([0].includes(code)) return "Grand soleil";
  if ([1, 2, 3].includes(code)) return "Ciel variable";
  if ([45, 48].includes(code)) return "Brouillard";
  if ([51, 53, 55, 56, 57].includes(code)) return "Bruine";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Pluie";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Neige";
  if ([95, 96, 99].includes(code)) return "Orage";
  return "Météo douce";
}

export function gardenAdvice(weather) {
  if (!weather) return "Météo locale en cours de chargement. Conseil par défaut : vérifier l'humidité du sol avant d'arroser.";
  if (weather.rain >= 5) return "Pluie significative prévue : suspendez l'arrosage extérieur et surveillez le drainage des bacs.";
  if (weather.temperature >= 28) return "Journée chaude : arrosez tôt le matin ou le soir, puis paillez les cultures sensibles.";
  if (weather.wind >= 30) return "Vent marqué : vérifiez les tuteurs, jeunes plants et pots exposés.";
  return "Conditions favorables : arrosage modéré au pied, observation des feuilles et aération de la serre.";
}
