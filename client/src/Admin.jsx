import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const TEAM_LIST  = Array.from({ length: 15 }, (_, i) => `T${i + 1}`);
const STATIONS   = ["A", "B", "C", "D", "E", "F", "TREASURE"];

const TEAM_COLOURS = [
  "#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c",
  "#3498db","#9b59b6","#e91e63","#00bcd4","#ff5722",
  "#8bc34a","#607d8b","#ff9800","#795548","#673ab7",
];

function teamColour(teamName) {
  const n = parseInt(teamName.replace(/\D/g, ""), 10);
  return TEAM_COLOURS[(n - 1) % TEAM_COLOURS.length];
}

export default function Admin() {
  // Map of teamName → current station, seeded from server
  const [stationMap, setStationMap]   = useState({});
  const [feedback, setFeedback]       = useState(null); // { msg, ok }
  const [loading, setLoading]         = useState(false);

  // Load current state on mount
  const loadTeams = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/teams`);
      const map = {};
      res.data.forEach((t) => { map[t.team] = t.station; });
      setStationMap(map);
    } catch {
      showFeedback("Failed to load team data", false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  function showFeedback(msg, ok) {
    setFeedback({ msg, ok });
    setTimeout(() => setFeedback(null), 2500);
  }

  // Update a single team to a chosen station
  async function handleUpdate(team, station) {
    setLoading(true);
    try {
      await axios.get(`${API}/update?team=${team}&station=${station}`);
      setStationMap((prev) => ({ ...prev, [team]: station }));
      showFeedback(`${team} → ${station}`, true);
    } catch {
      showFeedback(`Failed to update ${team}`, false);
    } finally {
      setLoading(false);
    }
  }

  // Advance a single team one station forward
  async function handleNext(team) {
    setLoading(true);
    try {
      await axios.get(`${API}/next?team=${team}`);
      // Re-fetch to get the real new station
      const res = await axios.get(`${API}/teams`);
      const updated = res.data.find((t) => t.team === team);
      if (updated) {
        setStationMap((prev) => ({ ...prev, [team]: updated.station }));
        showFeedback(`${team} → ${updated.station}`, true);
      }
    } catch {
      showFeedback(`Failed to advance ${team}`, false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>🗺️ Lupin Heist — Admin</h1>

      {/* Feedback toast */}
      {feedback && (
        <div style={{
          ...styles.toast,
          background: feedback.ok ? "#2ecc71" : "#e74c3c"
        }}>
          {feedback.msg}
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Team</th>
            <th style={styles.th}>Current Station</th>
            <th style={styles.th}>Move to Station</th>
            <th style={styles.th}>Quick Action</th>
          </tr>
        </thead>
        <tbody>
          {TEAM_LIST.map((team) => {
            const current = stationMap[team] || "—";
            const colour  = teamColour(team);

            return (
              <tr key={team} style={styles.row}>
                {/* Team name with colour dot */}
                <td style={styles.td}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 12, height: 12, borderRadius: "50%",
                      background: colour, flexShrink: 0
                    }} />
                    <strong>{team}</strong>
                  </span>
                </td>

                {/* Current station badge */}
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    background: current === "TREASURE" ? "#f1c40f" : "#2c3e50",
                    color:      current === "TREASURE" ? "#000" : "#fff",
                  }}>
                    {current}
                  </span>
                </td>

                {/* Station dropdown + Set button */}
                <td style={styles.td}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      defaultValue={current !== "—" ? current : "A"}
                      id={`sel-${team}`}
                      style={styles.select}
                      disabled={loading}
                    >
                      {STATIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      style={styles.btnSet}
                      disabled={loading}
                      onClick={() => {
                        const sel = document.getElementById(`sel-${team}`);
                        handleUpdate(team, sel.value);
                      }}
                    >
                      Set
                    </button>
                  </span>
                </td>

                {/* Next station button */}
                <td style={styles.td}>
                  <button
                    style={{
                      ...styles.btnNext,
                      opacity: current === "TREASURE" ? 0.4 : 1,
                    }}
                    disabled={loading || current === "TREASURE"}
                    onClick={() => handleNext(team)}
                  >
                    Next →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button onClick={loadTeams} style={styles.btnRefresh} disabled={loading}>
        ↻ Refresh
      </button>
    </div>
  );
}

const styles = {
  page: {
  fontFamily: "sans-serif",
  padding: "24px",
  maxWidth: 760,
  margin: "0 auto",
  color: "#111",
  overflowY: "auto",
  height: "100vh",
  boxSizing: "border-box"
},
  heading: {
    marginBottom: 20,
    fontSize: 22
  },
  toast: {
    position: "fixed", top: 20, right: 20,
    padding: "10px 18px", borderRadius: 8,
    color: "#fff", fontWeight: "bold",
    fontSize: 14, zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    borderRadius: 8,
    overflow: "hidden"
  },
  th: {
    background: "#2c3e50",
    color: "#fff",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 600
  },
  row: {
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "9px 14px",
    verticalAlign: "middle"
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  select: {
    padding: "5px 8px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 13,
    cursor: "pointer"
  },
  btnSet: {
    padding: "5px 12px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 13
  },
  btnNext: {
    padding: "5px 12px",
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 13
  },
  btnRefresh: {
    marginTop: 20,
    padding: "8px 18px",
    background: "#95a5a6",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14
  }
};
