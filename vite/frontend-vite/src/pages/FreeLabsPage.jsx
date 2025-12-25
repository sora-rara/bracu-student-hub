import { useEffect, useMemo, useState } from "react";
import axios from "../api/axios.jsx";

function toAmPmFromHHMM24(hhmm) {
  if (!hhmm || hhmm === "End of day") return hhmm;
  const [hh, mm] = hhmm.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function relativeUpdated(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m === 1) return "1 min ago";
  return `${m} mins ago`;
}

function getFloorFromLab(labName) {
  const s = String(labName || "");
  if (s.toUpperCase().includes("FT")) return "FT";
  const m = s.match(/^(\d{2})/);
  return m ? m[1] : "NA";
}

// ✅ get Dhaka "now" in minutes from browser
function getDhakaNowMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

// "HH:MM" -> minutes since 00:00
function hhmmToMinutes(hhmm) {
  if (!hhmm || hhmm === "End of day") return null;
  const [hh, mm] = String(hhmm).split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

export default function FreeLabsPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [floorFilter, setFloorFilter] = useState("ALL");
  const [minFree, setMinFree] = useState(0); // minutes threshold ("more than")
  const [copied, setCopied] = useState("");

  async function load() {
    try {
      setErr("");
      const res = await axios.get("/labs/free");
      setData(res.data);
    } catch (e) {
      setErr(e?.message || "Failed to load free labs");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  // ✅ robust nowMin: use backend seconds if exists, else compute in browser
  const nowMin = useMemo(() => {
    const sec = data?.meta?.dhakaNow?.seconds;
    if (typeof sec === "number") return Math.round(sec / 60);
    return getDhakaNowMinutes();
  }, [data]);

  const labs = useMemo(() => {
    const arr = Array.isArray(data?.freeLabsWithUntil) ? data.freeLabsWithUntil : [];

    return arr.map((x) => {
      const floor = getFloorFromLab(x.lab);

      // ✅ robust freeUntilMin:
      // prefer freeUntilSec -> else parse freeUntil "HH:MM"
      let freeUntilMin = null;
      if (typeof x.freeUntilSec === "number") {
        freeUntilMin = Math.round(x.freeUntilSec / 60);
      } else {
        freeUntilMin = hhmmToMinutes(x.freeUntil);
      }

      // ✅ duration in minutes
      let freeForMin = null;
      if (freeUntilMin != null && nowMin != null) {
        freeForMin = Math.max(0, freeUntilMin - nowMin);
      }

      // sort key: soonest busy first
      // if we don't know, put at end
      let sortKey = 999999;
      if (typeof x.freeUntilSec === "number") sortKey = x.freeUntilSec;
      else if (freeUntilMin != null) sortKey = freeUntilMin * 60;

      return {
        lab: x.lab,
        floor,
        freeUntilText: toAmPmFromHHMM24(x.freeUntil),
        freeForMin,
        sortKey,
      };
    });
  }, [data, nowMin]);

  const uniqueFloors = useMemo(() => {
    const set = new Set(labs.map((x) => x.floor));
    return Array.from(set).sort();
  }, [labs]);

  const filtered = useMemo(() => {
    return labs
      .filter((x) => (floorFilter === "ALL" ? true : x.floor === floorFilter))
      .filter((x) => {
        if (!minFree) return true;

        // ✅ if duration unknown, don't include it in "more than" filter
        if (x.freeForMin == null) return false;

        // ✅ "more than" logic
        return x.freeForMin > minFree;
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [labs, floorFilter, minFree]);

  async function copyLab(name) {
    try {
      await navigator.clipboard.writeText(String(name));
      setCopied(String(name));
      setTimeout(() => setCopied(""), 900);
    } catch {}
  }

  if (loading) return <div style={{ padding: 20 }}>Loading free labs…</div>;

  if (err) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Free Labs</h2>
        <p style={{ color: "red" }}>{err}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Free Labs Right Now!</h2>

      <p>
        Total: <b>{data?.counts?.totalLabs}</b> | Busy: <b>{data?.counts?.busyLabs}</b> | Free:{" "}
        <b>{data?.counts?.freeLabs}</b>
      </p>

      <small style={{ opacity: 0.7 }}>
        Updated {relativeUpdated(data?.meta?.fetchedAt)} • Auto updates every 1 minute
      </small>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        >
          <option value="ALL">All floors</option>
          {uniqueFloors.map((f) => (
            <option key={f} value={f}>
              {f === "FT" ? "FT" : `Floor ${f}`}
            </option>
          ))}
        </select>

        <select
          value={minFree}
          onChange={(e) => setMinFree(Number(e.target.value))}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        >
          <option value={0}>Any duration</option>
          <option value={30}>More than 30 min</option>
          <option value={60}>More than 60 min</option>
          <option value={90}>More than 90 min</option>
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        {filtered.length === 0 ? (
          <p>No free labs match your filters.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {filtered.map((x) => (
              <div
                key={x.lab}
                onClick={() => copyLab(x.lab)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 999,
                  padding: "8px 12px",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  background: "#fafafa",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                title="Click to copy"
              >
                <span style={{ fontWeight: 700 }}>{x.lab}</span>

                {x.freeUntilText ? (
                  <span style={{ fontSize: 12, opacity: 0.75 }}>
                    until {x.freeUntilText}
                    {x.freeForMin != null ? ` • ${x.freeForMin} min` : ""}
                  </span>
                ) : null}

                {copied === x.lab ? (
                  <span style={{ fontSize: 12, opacity: 0.7 }}>Copied</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
