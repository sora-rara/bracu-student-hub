// vite/backend/routes/freeLabRoutes.js
const express = require("express");
const router = express.Router();

// ====== cache (avoid hammering Connect) ======
let cache = { data: null, fetchedAt: 0 };
const CACHE_MS = 60 * 1000;

const DEFAULT_CONNECT_URL = "https://usis-cdn.eniamza.com/connect.json";

// ====== fetch helper ======
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

async function getConnectData() {
  const connectUrl = process.env.CONNECT_URL || DEFAULT_CONNECT_URL;
  const now = Date.now();

  if (cache.data && now - cache.fetchedAt < CACHE_MS) {
    return { source: "cache", connectUrl, data: cache.data, fetchedAt: cache.fetchedAt };
  }

  const data = await fetchWithTimeout(connectUrl, 15000);
  cache = { data, fetchedAt: now };
  return { source: "live", connectUrl, data, fetchedAt: now };
}

// ====== time helpers ======
function timeToSeconds(t) {
  const [hh, mm, ss] = (t || "00:00:00").split(":").map(Number);
  return (hh || 0) * 3600 + (mm || 0) * 60 + (ss || 0);
}

function formatHHMM(seconds) {
  const hh = Math.floor(seconds / 3600);
  const mm = Math.floor((seconds % 3600) / 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function getDhakaNow() {
  const tz = "Asia/Dhaka";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === "weekday")?.value || "Sunday";
  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";

  return {
    dayName: weekday.toUpperCase(),
    seconds: Number(hour) * 3600 + Number(minute) * 60,
    hhmm: `${hour}:${minute}`,
  };
}

/**
 * GET /api/labs/free
 * Shows free labs + free-until time
 */
router.get("/free", async (req, res) => {
  try {
    const { source, connectUrl, data, fetchedAt } = await getConnectData();

    // ---- determine "now" ----
    let now = getDhakaNow();
    const qDay = (req.query.day || "").toUpperCase();
    const qTime = req.query.time || "";

    if (qDay) now.dayName = qDay;

    if (qTime) {
      const [hh, mm] = qTime.split(":").map(Number);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
        now.seconds = hh * 3600 + mm * 60;
        now.hhmm = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      }
    }

    // ---- collect labs ----
    const allLabs = new Set();
    const busyLabs = new Set();
    const debugBusy = [];

    for (const item of data) {
      const labRoom = item?.labRoomName;
      if (labRoom) allLabs.add(labRoom);

      const labSchedules = item?.labSchedules;
      if (!labRoom || !Array.isArray(labSchedules)) continue;

      for (const s of labSchedules) {
        const day = String(s.day || "").toUpperCase();
        if (day !== now.dayName) continue;

        const start = timeToSeconds(s.startTime);
        const end = timeToSeconds(s.endTime);

        if (start <= now.seconds && now.seconds < end) {
          busyLabs.add(labRoom);

          if (req.query.debug === "1") {
            debugBusy.push({
              lab: labRoom,
              course: item.courseCode,
              section: item.sectionName,
              startTime: s.startTime,
              endTime: s.endTime,
            });
          }
        }
      }
    }

    const allLabsArr = Array.from(allLabs).sort();
    const busyLabsArr = Array.from(busyLabs).sort();
    const freeLabsArr = allLabsArr.filter((x) => !busyLabs.has(x));

    // ---- compute free-until ----
    const nextBusyStart = {};

    for (const item of data) {
      const labRoom = item?.labRoomName;
      const labSchedules = item?.labSchedules;
      if (!labRoom || !Array.isArray(labSchedules)) continue;

      for (const s of labSchedules) {
        const day = String(s.day || "").toUpperCase();
        if (day !== now.dayName) continue;

        const start = timeToSeconds(s.startTime);
        if (start > now.seconds) {
          if (!nextBusyStart[labRoom] || start < nextBusyStart[labRoom]) {
            nextBusyStart[labRoom] = start;
          }
        }
      }
    }

    const freeLabsWithUntil = freeLabsArr.map((lab) => ({
      lab,
      freeUntil: nextBusyStart[lab] ? formatHHMM(nextBusyStart[lab]) : "End of day",
    }));

    return res.json({
      success: true,
      meta: {
        source,
        connectUrl,
        fetchedAt: new Date(fetchedAt).toISOString(),
        dhakaNow: { day: now.dayName, time: now.hhmm },
        cacheMs: CACHE_MS,
      },
      counts: {
        totalLabs: allLabsArr.length,
        busyLabs: busyLabsArr.length,
        freeLabs: freeLabsArr.length,
      },
      freeLabsWithUntil,
      freeLabs: freeLabsArr,
      busyLabs: busyLabsArr,
      ...(req.query.debug === "1" ? { busyDetails: debugBusy } : {}),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to compute free labs",
      error: err.message,
    });
  }
});

module.exports = router;
