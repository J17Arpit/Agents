export type ToolName = 'getTime' | 'getWeather';

export type ToolCall = {
  name: ToolName;
  arguments: Record<string, unknown>;
};

import https from 'node:https';

function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

export async function callTool(toolCall: ToolCall): Promise<string> {
  switch (toolCall.name) {
    case 'getTime': {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString()}.`;
    }
    case 'getWeather': {
      const city = String(toolCall.arguments.city ?? 'your location');
      try {
        // 1) Geocode the city name to latitude/longitude using Open-Meteo's free geocoding API
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city,
        )}&count=1`;

        const geoRaw = await fetchJson(geoUrl);
        const geoData = geoRaw as {
          results?: { name?: string; latitude: number; longitude: number; country?: string }[];
        };

        const first = geoData.results?.[0];
        if (!first) {
          return `I couldn't find weather data for "${city}".`;
        }

        const { latitude, longitude, name, country } = first;

        // 2) Fetch current weather for that location
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m`;
        const forecastRaw = await fetchJson(forecastUrl);
        const forecast = forecastRaw as {
          current?: {
            temperature_2m?: number;
            wind_speed_10m?: number;
          };
        };

        const temp = forecast.current?.temperature_2m;
        const wind = forecast.current?.wind_speed_10m;

        const locationLabel = [name, country].filter(Boolean).join(', ') || city;

        const parts = [
          `Current weather for ${locationLabel}`,
          temp !== undefined ? `Temperature: ${temp.toFixed(1)}°C` : null,
          wind !== undefined ? `Wind speed: ${wind.toFixed(1)} m/s` : null,
        ].filter(Boolean);

        return parts.join('. ') + '.';
      } catch (err) {
        return 'Unable to fetch live weather data right now.';
      }
    }
    default:
      return 'Unknown tool.';
  }
}

