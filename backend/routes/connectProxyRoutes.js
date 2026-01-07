const express = require("express");
const router = express.Router();

let cache = { data: null, fetchedAt: 0 };
const CACHE_MS = 60 * 1000;

// default (you can override with CONNECT_URL in .env)
const DEFAULT_CONNECT_URL = "https://usis-cdn.eniamza.com/connect.json";

async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Upstream error: ${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// GET /api/connect/raw
router.get("/raw", async (req, res) => {
  try {
    const connectUrl = process.env.CONNECT_URL || DEFAULT_CONNECT_URL;
    const now = Date.now();

    if (cache.data && now - cache.fetchedAt < CACHE_MS) {
      return res.json({
        success: true,
        source: "cache",
        fetchedAt: new Date(cache.fetchedAt).toISOString(),
        connectUrl,
        data: cache.data,
      });
    }

    const data = await fetchWithTimeout(connectUrl, 15000);
    cache = { data, fetchedAt: now };

    return res.json({
      success: true,
      source: "live",
      fetchedAt: new Date(now).toISOString(),
      connectUrl,
      data,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: "Failed to fetch Connect dataset",
      error: err?.message || String(err),
    });
  }
});

// GET /api/connect/health
router.get("/health", (req, res) => {
  res.json({
    success: true,
    cache: {
      hasData: !!cache.data,
      fetchedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
      cacheMs: CACHE_MS,
    },
  });
});

module.exports = router;
