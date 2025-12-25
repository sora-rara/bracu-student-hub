import { useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getConnectData, getMyPicks } from "../api/routineApi";

function timeToMinutes(t) {
  const [hh, mm] = String(t || "00:00:00").split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function toAmPmFromTime(t) {
  if (!t) return "";
  const [hh, mm] = String(t).split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function getDhakaNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === "weekday")?.value || "Sunday";
  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");

  return { dayName: weekday.toUpperCase(), minutes: hour * 60 + minute };
}

const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const SLOTS = [
  { id: "S1", start: "08:00:00", end: "09:20:00" },
  { id: "S2", start: "09:30:00", end: "10:50:00" },
  { id: "S3", start: "11:00:00", end: "12:20:00" },
  { id: "S4", start: "12:30:00", end: "13:50:00" },
  { id: "S5", start: "14:00:00", end: "15:20:00" },
  { id: "S6", start: "15:30:00", end: "16:50:00" },
  { id: "S7", start: "17:00:00", end: "18:20:00" },
];

function markClashesAndPairs(grouped) {
  const out = {};
  const pairs = [];

  for (const day of Object.keys(grouped)) {
    const arr = grouped[day].map((b) => ({ ...b, clash: false }));
    arr.sort((a, b) => a.startMin - b.startMin);

    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[j].startMin >= arr[i].endMin) break;

        arr[i].clash = true;
        arr[j].clash = true;

        const key = `${day}|${arr[i].label}|${arr[i].start}-${arr[i].end}|${arr[j].label}|${arr[j].start}-${arr[j].end}`;
        pairs.push({ key, day, a: arr[i], b: arr[j] });
      }
    }

    out[day] = arr;
  }

  const seen = new Set();
  const uniqPairs = [];
  for (const p of pairs) {
    if (seen.has(p.key)) continue;
    seen.add(p.key);
    uniqPairs.push(p);
  }

  return { out, pairs: uniqPairs };
}

function reorderDaysTodayFirst(today) {
  const t = String(today || "").toUpperCase();
  if (!DAY_ORDER.includes(t)) return DAY_ORDER.slice();
  return [t, ...DAY_ORDER.filter((d) => d !== t)];
}

function slotIndexForTimeMin(mins) {
  return SLOTS.findIndex((s) => {
    const st = timeToMinutes(s.start);
    const en = timeToMinutes(s.end);
    return st <= mins && mins < en;
  });
}

export default function MyRoutinePage() {
  const [connect, setConnect] = useState([]);
  const [my, setMy] = useState(null);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const [view, setView] = useState("GRID");

  // ✅ UX controls
  const [scope, setScope] = useState("TODAY"); // TODAY | WEEK
  const [onlyLabs, setOnlyLabs] = useState(false);

  const [copied, setCopied] = useState(""); // room last copied

  const gridWrapRef = useRef(null);

  // ✅ FIX: dhaka time should update (was frozen before)
  const [dhakaNow, setDhakaNow] = useState(getDhakaNow());
  useEffect(() => {
    const t = setInterval(() => setDhakaNow(getDhakaNow()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  const today = dhakaNow.dayName;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr("");
        const [cData, picks] = await Promise.all([getConnectData(), getMyPicks()]);
        if (!alive) return;

        setConnect(cData || []);
        setMy(picks);

        if (picks && (!picks.picks || picks.picks.length === 0)) {
          navigate("/routine-setup");
        }
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load routine");
      }
    }

    load();
    return () => (alive = false);
  }, [navigate]);

  const computed = useMemo(() => {
    if (!my?.picks?.length) return { blocksByDay: {}, clashPairs: [] };

    const idx = new Map();
    for (const item of connect) {
      const key = `${String(item.courseCode || "").toUpperCase()}__${String(item.sectionName || "")}`;
      idx.set(key, item);
    }

    const blocks = [];

    for (const p of my.picks) {
      const key = `${String(p.courseCode || "").toUpperCase()}__${String(p.sectionName || "")}`;
      const item = idx.get(key);
      if (!item) continue;

      const classSchedules = item?.sectionSchedule?.classSchedules || [];
      for (const s of classSchedules) {
        blocks.push({
          type: "CLASS",
          courseCode: item.courseCode,
          sectionName: item.sectionName,
          faculty: item.faculties || "TBA",
          day: String(s.day || "").toUpperCase(),
          start: s.startTime,
          end: s.endTime,
          startMin: timeToMinutes(s.startTime),
          endMin: timeToMinutes(s.endTime),
          room: item.roomName || item.roomNumber || "?",
          label: `${item.courseCode}-${item.sectionName} (Class)`,
        });
      }

      const labSchedules = item?.labSchedules || [];
      for (const s of labSchedules) {
        blocks.push({
          type: "LAB",
          courseCode: item.courseCode,
          sectionName: item.sectionName,
          faculty: item.labFaculties || "TBA",
          day: String(s.day || "").toUpperCase(),
          start: s.startTime,
          end: s.endTime,
          startMin: timeToMinutes(s.startTime),
          endMin: timeToMinutes(s.endTime),
          room: item.labRoomName || "?",
          label: `${item.courseCode}-${item.sectionName} (Lab)`,
        });
      }
    }

    const grouped = {};
    for (const b of blocks) {
      if (!grouped[b.day]) grouped[b.day] = [];
      grouped[b.day].push(b);
    }

    const { out, pairs } = markClashesAndPairs(grouped);
    return { blocksByDay: out, clashPairs: pairs };
  }, [connect, my]);

  const blocksByDayRaw = computed.blocksByDay;
  const clashPairs = computed.clashPairs;

  // ✅ apply "only labs" filter + compute NOW flag
  const blocksByDay = useMemo(() => {
    const out = {};
    for (const d of DAY_ORDER) {
      const arr = (blocksByDayRaw[d] || []).filter((b) => (onlyLabs ? b.type === "LAB" : true));
      out[d] = arr.map((b) => ({
        ...b,
        isNow: b.day === today && b.startMin <= dhakaNow.minutes && dhakaNow.minutes < b.endMin,
      }));
    }
    return out;
  }, [blocksByDayRaw, onlyLabs, dhakaNow.minutes, today]);

  const clashCount = useMemo(() => {
    let c = 0;
    for (const day of Object.keys(blocksByDay)) {
      for (const b of blocksByDay[day]) if (b.clash) c++;
    }
    return c;
  }, [blocksByDay]);

  // ✅ Today first ordering + scope
  const renderDays = useMemo(() => {
    const ordered = reorderDaysTodayFirst(today);
    if (scope === "TODAY") return [today];
    return ordered;
  }, [scope, today]);

  // ✅ Next class banner (today only)
  const nextClass = useMemo(() => {
    const todayArr = blocksByDay[today] || [];
    const future = todayArr.filter((b) => b.startMin > dhakaNow.minutes);
    future.sort((a, b) => a.startMin - b.startMin);
    return future[0] || null;
  }, [blocksByDay, today, dhakaNow.minutes]);

  const nowBlock = useMemo(() => {
    const todayArr = blocksByDay[today] || [];
    return todayArr.find((b) => b.isNow) || null;
  }, [blocksByDay, today]);

  // ✅ table model with rowSpan + BREAK rendering + NOW highlight
  const tableModel = useMemo(() => {
    const model = {};
    for (const d of DAY_ORDER) {
      model[d] = SLOTS.map(() => ({ block: null, span: 1, hidden: false }));
    }

    for (const d of DAY_ORDER) {
      const blocks = blocksByDay[d] || [];

      for (const b of blocks) {
        const startIdx = SLOTS.findIndex((s) => s.start === b.start);
        if (startIdx < 0) continue;

        let span = 0;
        for (let i = startIdx; i < SLOTS.length; i++) {
          const st = timeToMinutes(SLOTS[i].start);
          const en = timeToMinutes(SLOTS[i].end);
          if (st >= b.endMin) break;
          if (st >= b.startMin && en <= b.endMin) span++;
        }
        if (span <= 0) span = 1;

        model[d][startIdx].block = b;
        model[d][startIdx].span = span;

        for (let k = 1; k < span; k++) {
          if (model[d][startIdx + k]) model[d][startIdx + k].hidden = true;
        }
      }
    }

    return model;
  }, [blocksByDay]);

  // ✅ always compact scroll height
  useEffect(() => {
    if (view !== "GRID") return;
    const wrap = gridWrapRef.current;
    if (!wrap) return;

    const idx = slotIndexForTimeMin(dhakaNow.minutes);
    if (idx >= 0) {
      const approxRowHeight = 54; // compact always
      wrap.scrollTop = Math.max(0, idx * approxRowHeight - 120);
    }
  }, [view, dhakaNow.minutes]);

  async function copyRoom(room) {
    try {
      await navigator.clipboard.writeText(String(room || ""));
      setCopied(String(room || ""));
      setTimeout(() => setCopied(""), 1200);
    } catch (e) {
      // ignore
    }
  }

  function handlePrint() {
    window.print();
  }

  // ✅ break cell detection: show BREAK only between first & last class of that day
  function isBreakCell(day, rowIdx) {
    const blocks = blocksByDay[day] || [];
    if (blocks.length === 0) return false;

    const minsStart = timeToMinutes(SLOTS[rowIdx].start);

    const earliest = Math.min(...blocks.map((b) => b.startMin));
    const latest = Math.max(...blocks.map((b) => b.endMin));

    if (minsStart < earliest) return false;
    if (minsStart >= latest) return false;
    return true;
  }

  if (err) return <div style={{ padding: 20, color: "red" }}>{err}</div>;
  if (!my) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <div style={{ padding: 20 }}>
      <div className="routine-topbar">
        <div className="routine-left">
          <div className="routine-title">My Routine</div>
          <div className="routine-sub">
            Semester: <b>{my.term}</b> <b>{my.year}</b>
          </div>

          <div className="banner-area">
            {nowBlock ? (
              <div className="banner banner-now">
                <b>NOW:</b> {nowBlock.courseCode} (Sec {nowBlock.sectionName}) • {nowBlock.type} • Room{" "}
                <span className="copyable" onClick={() => copyRoom(nowBlock.room)} title="Click to copy room">
                  {nowBlock.room}
                </span>
              </div>
            ) : nextClass ? (
              <div className="banner banner-next">
                <b>Next:</b> {nextClass.courseCode} ({toAmPmFromTime(nextClass.start)} – {toAmPmFromTime(nextClass.end)}) in{" "}
                <span className="copyable" onClick={() => copyRoom(nextClass.room)} title="Click to copy room">
                  {nextClass.room}
                </span>
              </div>
            ) : (
              <div className="banner banner-empty">No more classes today.</div>
            )}

            {copied ? <div className="copied">Copied: {copied}</div> : null}
          </div>
        </div>

        <div className="routine-right">
          <button className="rbtn rbtn-ghost" onClick={() => setView(view === "LIST" ? "GRID" : "LIST")}>
            View: {view === "LIST" ? "Grid" : "List"}
          </button>

          <Link className="rbtn rbtn-link" to="/routine-setup">
            Edit Routine
          </Link>

          <button className="rbtn rbtn-ghost" onClick={handlePrint}>
            Print
          </button>

          <span className={`rbadge ${clashCount > 0 ? "rbadge-bad" : "rbadge-good"}`}>
            {clashCount > 0 ? `${clashCount} clashes` : "No clashes"}
          </span>
        </div>
      </div>

      {/* ✅ controls row (compact toggle removed) */}
      <div className="controls-row">
        <div className="seg">
          <button className={`seg-btn ${scope === "TODAY" ? "on" : ""}`} onClick={() => setScope("TODAY")}>
            Today
          </button>
          <button className={`seg-btn ${scope === "WEEK" ? "on" : ""}`} onClick={() => setScope("WEEK")}>
            This Week
          </button>
        </div>

        <label className="chk">
          <input type="checkbox" checked={onlyLabs} onChange={(e) => setOnlyLabs(e.target.checked)} /> Show only LABS
        </label>
      </div>

      {clashPairs.length > 0 && (
        <div className="clash-box">
          <div className="clash-title">Clash details</div>
          <ul className="clash-list">
            {clashPairs.slice(0, 8).map((p) => (
              <li key={p.key}>
                <b>{p.day}</b>: {p.a.courseCode}-{p.a.sectionName} ({toAmPmFromTime(p.a.start)}–{toAmPmFromTime(p.a.end)}) clashes with{" "}
                {p.b.courseCode}-{p.b.sectionName} ({toAmPmFromTime(p.b.start)}–{toAmPmFromTime(p.b.end)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === "LIST" ? (
        <div style={{ marginTop: 14 }}>
          {renderDays.map((day) => {
            const arr = blocksByDay[day] || [];
            const isToday = day === today;

            return (
              <div key={day} style={{ marginBottom: 16 }}>
                <h3 style={{ marginBottom: 8 }}>
                  {day}
                  {isToday ? <span style={{ marginLeft: 8, opacity: 0.7 }}>(Today)</span> : null}
                </h3>

                {arr.length === 0 ? (
                  <p style={{ opacity: 0.7 }}>No classes.</p>
                ) : (
                  <ul>
                    {arr.map((b, i) => (
                      <li key={`${day}-${i}`} className={`list-item ${b.isNow ? "list-now" : ""}`}>
                        <div>
                          <b style={{ fontSize: 15 }}>
                            {b.courseCode} (Sec {b.sectionName})
                          </b>{" "}
                          <span style={{ fontWeight: 900, opacity: 0.85 }}>• {b.type}</span>
                          {b.isNow ? <span className="pill-now">NOW</span> : null}
                          {b.clash ? <span style={{ color: "#d9534f", fontWeight: 900 }}> (CLASH)</span> : null}
                        </div>

                        <div style={{ fontWeight: 900, marginTop: 3 }}>
                          {toAmPmFromTime(b.start)} – {toAmPmFromTime(b.end)}
                        </div>

                        <div style={{ marginTop: 3 }}>
                          Faculty: <b>{b.faculty}</b> — Classroom:{" "}
                          <b className="copyable" onClick={() => copyRoom(b.room)} title="Click to copy room">
                            {b.room}
                          </b>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          {/* ✅ compact always */}
          <div ref={gridWrapRef} className="grid-wrap compact">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="sticky top">TIME/DAY</th>
                  {renderDays.map((d) => (
                    <th key={d} className={`sticky top ${d === today ? "today-head" : ""}`}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {SLOTS.map((slot, rowIdx) => (
                  <tr key={slot.id}>
                    <td className="time-cell">
                      {toAmPmFromTime(slot.start)} - {toAmPmFromTime(slot.end)}
                    </td>

                    {renderDays.map((d) => {
                      const cell = tableModel[d]?.[rowIdx];
                      if (!cell) return <td key={d} />;

                      if (cell.hidden) return <td key={d} style={{ display: "none" }} />;

                      if (!cell.block) {
                        const showBreak = isBreakCell(d, rowIdx);
                        return (
                          <td key={d} className={`${d === today ? "today-cell" : ""} ${showBreak ? "cell-break" : ""}`}>
                            {showBreak ? <div className="break-text">BREAK</div> : null}
                          </td>
                        );
                      }

                      const b = cell.block;

                      let kindClass = b.type === "LAB" ? "cell-lab" : "cell-class";
                      if (b.clash) kindClass = "cell-clash";
                      if (b.isNow) kindClass += " cell-now";

                      return (
                        <td
                          key={d}
                          rowSpan={cell.span}
                          className={`${kindClass} ${d === today ? "today-cell" : ""}`}
                          title={`${b.courseCode} Sec ${b.sectionName} ${b.type} | Faculty: ${b.faculty} | Classroom: ${b.room}`}
                        >
                          <div className="cell-line cell-course">{b.courseCode}</div>
                          <div className="cell-line cell-sec">
                            Sec {b.sectionName} • {b.type}
                            {b.isNow ? <span className="pill-now">NOW</span> : null}
                          </div>
                          <div className="cell-line cell-meta">Faculty: {b.faculty}</div>
                          <div className="cell-line cell-meta">
                            Classroom:{" "}
                            <span className="copyable" onClick={() => copyRoom(b.room)} title="Click to copy room">
                              {b.room}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ opacity: 0.65, marginTop: 10 }}>Times are on the left. Click a classroom to copy.</p>
        </div>
      )}

      <style>{`
        .routine-topbar{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:14px;
          flex-wrap:wrap;
          padding:14px 14px;
          border:1px solid #e6e6e6;
          border-radius:12px;
          background:#ffffff;
          box-shadow: 0 1px 0 rgba(0,0,0,0.03);
        }
        .routine-title{ font-size:28px; font-weight:900; line-height:1.1; }
        .routine-sub{ margin-top:6px; opacity:0.8; }
        .routine-right{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }

        .banner-area{ margin-top:10px; }
        .banner{
          display:inline-block;
          padding:8px 10px;
          border-radius:10px;
          border:1px solid #e6e6e6;
          font-weight:800;
          background:#fafafa;
        }
        .banner-now{ border-color:#b7e3b7; background:#eef9ee; }
        .banner-next{ border-color:#cfe0ff; background:#f2f6ff; }
        .banner-empty{ border-color:#eee; background:#fbfbfb; opacity:0.85; }
        .copied{ margin-top:6px; font-weight:800; opacity:0.85; }

        .controls-row{
          margin-top:12px;
          display:flex;
          gap:10px;
          align-items:center;
          flex-wrap:wrap;
        }
        .seg{
          display:flex;
          border:1px solid #ddd;
          border-radius:10px;
          overflow:hidden;
        }
        .seg-btn{
          padding:8px 12px;
          border:none;
          background:white;
          cursor:pointer;
          font-weight:900;
        }
        .seg-btn.on{
          background:#111;
          color:white;
        }

        .chk{
          display:flex;
          align-items:center;
          gap:8px;
          font-weight:800;
          user-select:none;
        }

        .rbtn{
          border:1px solid #ddd;
          background:white;
          border-radius:10px;
          padding:8px 10px;
          cursor:pointer;
          font-weight:600;
          text-decoration:none;
          color:inherit;
        }
        .rbtn:hover{ background:#f7f7f7; }
        .rbtn-link{
          border-color:transparent;
          background:transparent;
          color:#0b5ed7;
          padding:8px 4px;
        }
        .rbtn-link:hover{ text-decoration:underline; background:transparent; }

        .rbadge{
          padding:7px 10px;
          border-radius:999px;
          font-weight:900;
          font-size:13px;
          border:1px solid #ddd;
          white-space:nowrap;
        }
        .rbadge-good{ background:#eaf7ea; border-color:#bfe6bf; }
        .rbadge-bad{ background:#ffecec; border-color:#f3b3b3; }

        .clash-box{
          margin-top:14px;
          padding:12px;
          border:1px solid #f1b0b7;
          border-radius:10px;
          background:#fff5f5;
        }
        .clash-title{ font-weight:900; margin-bottom:6px; }
        .clash-list{ margin:0; padding-left:18px; }

        .grid-wrap{
          overflow:auto;
          max-height:520px;
          border:1px solid #ddd;
          border-radius:10px;
        }
        .grid-table{
          border-collapse:collapse;
          min-width:980px;
          width:100%;
        }
        .grid-table th, .grid-table td{
          border:1px solid #e3e3e3;
          padding:12px 10px;
          vertical-align:middle;
        }

        /* ✅ compact ALWAYS ON (kept your compact CSS) */
        .grid-wrap.compact .grid-table th,
        .grid-wrap.compact .grid-table td{
          padding:8px 8px;
        }
        .grid-wrap.compact .cell-course{ font-size:14px; }
        .grid-wrap.compact .cell-sec,
        .grid-wrap.compact .cell-meta{ font-size:12px; }

        .sticky.top{
          position:sticky;
          top:0;
          background:white;
          z-index:2;
        }
        .today-head{ background:#fff7d6 !important; }
        .today-cell{ background:#fffdf0; }

        .time-cell{
          white-space:nowrap;
          font-weight:900;
          background:#fbfbfb;
          width: 190px;
        }

        .cell-class{ background:#ffffff; }
        .cell-lab{
          background:#eef6ff;
          border-left: 4px solid #2f6fed;
        }
        .cell-clash{ background:#ffd6d6; }

        .cell-now{
          outline: 3px solid rgba(17,17,17,0.35);
          box-shadow: 0 0 0 3px rgba(17,17,17,0.08) inset;
        }

        .cell-break{
          background:#f2f2f2;
        }
        .break-text{
          font-weight:900;
          opacity:0.6;
          text-align:center;
        }

        .cell-line{ margin-bottom: 3px; }
        .cell-course{ font-weight: 900; font-size: 16px; }
        .cell-sec{ font-weight: 900; font-size: 13px; }
        .cell-meta{ font-weight: 900; font-size: 13px; }

        .pill-now{
          margin-left:8px;
          display:inline-block;
          font-size:11px;
          padding:2px 8px;
          border-radius:999px;
          background:#111;
          color:white;
          font-weight:900;
          vertical-align:middle;
        }

        .copyable{
          cursor:pointer;
          text-decoration:underline;
        }

        .list-item{
          padding:10px 12px;
          border:1px solid #e6e6e6;
          border-radius:10px;
          margin-bottom:10px;
          background:#fff;
        }
        .list-now{
          border-width:3px;
          border-color:rgba(17,17,17,0.35);
          background:#fafafa;
        }

        @media print{
          .routine-topbar .rbtn, .routine-topbar a { display:none !important; }
          .controls-row{ display:none !important; }
          body{ background:white; }
          .grid-wrap{ max-height:none; border:none; }
        }
      `}</style>
    </div>
  );
}
