import { useEffect, useMemo, useState } from "react";
import { getConnectData, getMyPicks, saveMyPicks } from "../../api/routineApi";

function sectionNum(sec) {
  const n = Number(String(sec || "").trim());
  return Number.isFinite(n) ? n : 999999;
}

function dayShort(d) {
  const x = String(d || "").toUpperCase();
  if (x.startsWith("SUN")) return "SUN";
  if (x.startsWith("MON")) return "MON";
  if (x.startsWith("TUE")) return "TUE";
  if (x.startsWith("WED")) return "WED";
  if (x.startsWith("THU")) return "THU";
  if (x.startsWith("FRI")) return "FRI";
  if (x.startsWith("SAT")) return "SAT";
  return x.slice(0, 3);
}

function toAmPm(t) {
  if (!t) return "";
  const [hh, mm] = String(t).split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function fmtSlot(s) {
  // s: {day,startTime,endTime}
  const d = dayShort(s?.day);
  const st = toAmPm(s?.startTime);
  const en = toAmPm(s?.endTime);
  if (!d || !st || !en) return "";
  return `${d} ${st}–${en}`;
}

function fmtSchedules(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  const parts = arr
    .map(fmtSlot)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b)); // simple stable-ish
  return parts.length ? parts.join(" • ") : "—";
}

export default function RoutineSetupPage() {
  const [term, setTerm] = useState("Spring");
  const [year, setYear] = useState(2026);

  const [connect, setConnect] = useState([]);
  const [query, setQuery] = useState("");
  const [picks, setPicks] = useState([]); // [{courseCode, sectionName}]
  const [err, setErr] = useState("");

  // autosave UI
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "error"
  const [msg, setMsg] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr("");
        const [cData, my] = await Promise.all([getConnectData(), getMyPicks()]);
        if (!alive) return;

        setConnect(cData || []);
        if (my?.term) setTerm(my.term);
        if (my?.year) setYear(my.year);
        if (Array.isArray(my?.picks)) setPicks(my.picks);

        setSaveStatus("saved");
        setLoaded(true);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load data");
      }
    }

    load();
    return () => (alive = false);
  }, []);

  function flashMsg(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2000);
  }

  // picked course set (only 1 section per course)
  const pickedCourseSet = useMemo(() => {
    const s = new Set();
    for (const p of picks) s.add(String(p.courseCode || "").toUpperCase());
    return s;
  }, [picks]);

  // details for selected list from connect: faculty/room + schedules
  const pickedDetails = useMemo(() => {
    const m = new Map(); // key: course__sec -> details
    for (const x of connect) {
      const code = String(x.courseCode || "").toUpperCase();
      const sec = String(x.sectionName || "");
      if (x.sectionType !== "THEORY") continue;

      const classSchedules = x?.sectionSchedule?.classSchedules || [];
      const labSchedules = x?.labSchedules || [];

      const key = `${code}__${sec}`;
      if (!m.has(key)) {
        m.set(key, {
          faculty: x.faculties || "TBA",
          room: x.roomName || x.roomNumber || "?",
          classText: fmtSchedules(classSchedules),
          labText: Array.isArray(labSchedules) && labSchedules.length ? fmtSchedules(labSchedules) : null,
          labRoom: x.labRoomName || null,
          labFaculty: x.labFaculties || null,
        });
      }
    }
    return m;
  }, [connect]);

  const sortedPicks = useMemo(() => {
    return picks
      .slice()
      .sort((a, b) => {
        const ac = String(a.courseCode || "").toUpperCase();
        const bc = String(b.courseCode || "").toUpperCase();
        const c = ac.localeCompare(bc);
        if (c !== 0) return c;
        return sectionNum(a.sectionName) - sectionNum(b.sectionName);
      });
  }, [picks]);

  const results = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];

    const filtered = connect.filter((x) => {
      if (x?.sectionType !== "THEORY") return false;

      const code = String(x?.courseCode || "").toUpperCase();
      const sec = String(x?.sectionName || "");
      const fac = String(x?.faculties || "").toUpperCase();

      return code.includes(q) || sec.includes(q) || fac.includes(q);
    });

    // sort by courseCode then section number
    filtered.sort((a, b) => {
      const ac = String(a.courseCode || "").toUpperCase();
      const bc = String(b.courseCode || "").toUpperCase();
      const c = ac.localeCompare(bc);
      if (c !== 0) return c;

      const an = sectionNum(a.sectionName);
      const bn = sectionNum(b.sectionName);
      if (an !== bn) return an - bn;

      return String(a.sectionName || "").localeCompare(String(b.sectionName || ""));
    });

    return filtered.slice(0, 60);
  }, [connect, query]);

  function addPick(item) {
    const courseCode = String(item.courseCode || "").toUpperCase();
    const sectionName = String(item.sectionName || "");

    // only 1 section per course
    const alreadyPickedCourse = picks.some(
      (p) => String(p.courseCode || "").toUpperCase() === courseCode
    );
    if (alreadyPickedCourse) {
      flashMsg("You have already selected this course");
      return;
    }

    setPicks([{ courseCode, sectionName }, ...picks]);
    setSaveStatus("saving");
    flashMsg("Added ✓");
  }

  function removePickByKey(courseCode, sectionName) {
    setPicks(
      picks.filter(
        (p) =>
          !(
            String(p.courseCode || "").toUpperCase() ===
            String(courseCode || "").toUpperCase() &&
            String(p.sectionName || "") === String(sectionName || "")
          )
      )
    );
    setSaveStatus("saving");
  }

  // AUTOSAVE (debounced)
  useEffect(() => {
    if (!loaded) return;

    const t = setTimeout(async () => {
      try {
        setErr("");
        setSaveStatus("saving");

        const payload = {
          term,
          year: Number(year),
          picks,
        };

        await saveMyPicks(payload);
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("error");
        setErr(e?.message || "Failed to save");
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [loaded, term, year, picks]);

  return (
    <div style={{ padding: 20, maxWidth: 980, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 6 }}>Routine Setup</h2>

      {err ? <p style={{ color: "red", fontWeight: 800 }}>{err}</p> : null}
      {msg ? <p style={{ color: "#0f7a2a", fontWeight: 900 }}>{msg}</p> : null}

      <p style={{ fontWeight: 900, marginTop: 6 }}>
        {saveStatus === "saving" && "Saving…"}
        {saveStatus === "saved" && "All changes saved"}
        {saveStatus === "error" && "Failed to save"}
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontWeight: 800 }}>
          Term:&nbsp;
          <select
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setSaveStatus("saving");
            }}
          >
            <option>Spring</option>
            <option>Summer</option>
            <option>Fall</option>
          </select>
        </label>

        <label style={{ fontWeight: 800 }}>
          Year:&nbsp;
          <input
            type="number"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setSaveStatus("saving");
            }}
            style={{ width: 110 }}
          />
        </label>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0 }}>My Selected Sections</h3>
        <span
          style={{
            fontWeight: 900,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: "#fafafa",
          }}
        >
          Selected: {picks.length}
        </span>
      </div>

      {picks.length === 0 ? (
        <p style={{ opacity: 0.75, marginTop: 10 }}>No selections yet.</p>
      ) : (
        <div
          style={{
            marginTop: 10,
            border: "1px solid #e6e6e6",
            borderRadius: 10,
            padding: 10,
            background: "#fff",
          }}
        >
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {sortedPicks.map((p) => {
              const code = String(p.courseCode || "").toUpperCase();
              const sec = String(p.sectionName || "");
              const key = `${code}__${sec}`;
              const extra = pickedDetails.get(key);

              return (
                <li key={`${code}-${sec}`} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div>
                      <b style={{ fontSize: 15 }}>{code}</b> — Section <b>{sec}</b>
                      <div style={{ marginTop: 3, opacity: 0.9 }}>
                        Faculty: <b>{extra?.faculty || "TBA"}</b> &nbsp;|&nbsp; Room:{" "}
                        <b>{extra?.room || "?"}</b>
                      </div>

                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontWeight: 800 }}>Class:</span>{" "}
                        <span style={{ fontWeight: 400 }}>{extra?.classText || "—"}</span>
                      </div>

                      {extra?.labText ? (
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontWeight: 800 }}>Lab:</span>{" "}
                          <span style={{ fontWeight: 400 }}>{extra.labText}</span>
                          {extra.labRoom ? (
                            <span style={{ fontWeight: 600, opacity: 0.9 }}>
                              &nbsp;|&nbsp; Lab Room: {extra.labRoom}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <button onClick={() => removePickByKey(code, sec)} style={{ marginLeft: "auto" }}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h3 style={{ marginBottom: 8 }}>Add Courses (Theory sections)</h3>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search: CSE111 or 09 or KNI..."
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
      />

      {query.trim() ? (
        <div style={{ marginTop: 12 }}>
          {results.length === 0 ? (
            <p>No results.</p>
          ) : (
            <div style={{ border: "1px solid #e6e6e6", borderRadius: 10, padding: 10, background: "#fff" }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {results.map((x) => {
                  const courseCode = String(x.courseCode || "").toUpperCase();
                  const sectionName = String(x.sectionName || "");
                  const room = x.roomName || x.roomNumber || "?";
                  const fac = x.faculties || "TBA";

                  const classSchedules = x?.sectionSchedule?.classSchedules || [];
                  const labSchedules = x?.labSchedules || [];

                  const classText = fmtSchedules(classSchedules);
                  const labText = Array.isArray(labSchedules) && labSchedules.length ? fmtSchedules(labSchedules) : null;

                  const courseAlreadyPicked = pickedCourseSet.has(courseCode);

                  return (
                    <li key={x.sectionId} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          flexWrap: "wrap",
                          padding: "10px 10px",
                          borderRadius: 10,
                          border: "1px solid #eee",
                          background: courseAlreadyPicked ? "#f6f6f6" : "#fff",
                          opacity: courseAlreadyPicked ? 0.75 : 1,
                        }}
                      >
                        <div style={{ minWidth: 320 }}>
                          <div style={{ fontWeight: 900 }}>
                            <span style={{ fontSize: 15 }}>{courseCode}</span> — Section <b>{sectionName}</b>
                          </div>
                          <div style={{ marginTop: 2, opacity: 0.88 }}>
                            {fac} &nbsp;|&nbsp; Room: {room}
                          </div>

                          <div style={{ marginTop: 6 }}>
                            <span style={{ fontWeight: 800 }}>Class:</span>{" "}
                            <span style={{ fontWeight: 400 }}>{classText}</span>
                          </div>

                          {labText ? (
                            <div style={{ marginTop: 2 }}>
                              <span style={{ fontWeight: 800 }}>Lab:</span>{" "}
                              <span style={{ fontWeight: 400 }}>{labText}</span>
                              {x.labRoomName ? (
                                <span style={{ fontWeight: 600, opacity: 0.9 }}>
                                  {" "}
                                  &nbsp;|&nbsp; Lab Room: {x.labRoomName}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <div style={{ marginTop: 2, fontWeight: 800, opacity: 0.75 }}>Lab: —</div>
                          )}
                        </div>

                        <button
                          onClick={() => addPick(x)}
                          disabled={courseAlreadyPicked}
                          style={{
                            marginLeft: "auto",
                            padding: "6px 10px",
                            fontWeight: 900,
                            cursor: courseAlreadyPicked ? "not-allowed" : "pointer",
                            opacity: courseAlreadyPicked ? 0.7 : 1,
                          }}
                          title={courseAlreadyPicked ? "You already selected this course" : "Add this section"}
                        >
                          {courseAlreadyPicked ? "Added ✓" : "Add"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p style={{ opacity: 0.7, marginTop: 10 }}>Type something to search.</p>
      )}
    </div>
  );
}
