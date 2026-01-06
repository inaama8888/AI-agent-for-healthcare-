const express = require("express");
const axios = require("axios");
const { getDistance } = require("geolib");
const router = express.Router();
const db = require("../db");
async function getCityLocation(city) {
  const res = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: city,
        format: "json",
        limit: 1,
        countrycodes: "il",
        addressdetails: 1,
      },
      headers: { "User-Agent": "ZahavaProject/1.0" },
    }
  );

  if (!res.data || !res.data.length) return null;

  const place = res.data[0];

  const hasValidAddress =
    place.address?.city ||
    place.address?.town ||
    place.address?.village ||
    place.address?.suburb;

  if (!hasValidAddress) return null;

  return {
    lat: Number(place.lat),
    lng: Number(place.lon),
  };
}

function distanceKm(from, to) {
  return (
    getDistance(
      { latitude: from.lat, longitude: from.lng },
      { latitude: to.lat, longitude: to.lng }
    ) / 1000
  );
}

router.post("/nearby", async (req, res) => {
  const { city } = req.body;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  try {
    // 1. מיקום העיר שהמשתמש הקליד
    const cityLocation = await getCityLocation(city);
    if (!cityLocation) {
      return res.json({ status: "CITY_NOT_FOUND" });
    }

    // 2. שליפת שיעורים מה־DB
    const [lessons] = await db.query(
      "SELECT lesson_id, topic AS title, city, lat, lng FROM lessons"
    );

    // 3. חישוב מרחק (רק לפרונטלי)
    const nearby = lessons
      .filter(l => l.lat !== null && l.lng !== null)
      .map(l => ({
        ...l,
        distance: distanceKm(cityLocation, {
          lat: l.lat,
          lng: l.lng,
        }),
      }))
      .filter(l => l.distance <= 10)
      .sort((a, b) => a.distance - b.distance);

    res.json({ status: "OK", nearby });
  } catch (err) {
    console.error("NEARBY ERROR:", err);
    res.status(500).json({ error: "Nearby failed" });
  }
});

module.exports = router;
