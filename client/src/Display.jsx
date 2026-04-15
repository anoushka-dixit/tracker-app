import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

// ─── Edit these after your DevTools session ───────────────────────────────────
const STATION_POSITIONS = {
  A: { x: 17.5781, y: 25.9352 },
  B: { x: 43, y: 15 },
  C: { x: 74.8698, y: 18.5 },
  D: { x: 39.0625, y: 42.5 },
  E: { x: 61.849, y: 50 },
  F: { x: 27.3438, y: 70 },
  TREASURE: { x: 68.6146, y: 85 }
};
// ─────────────────────────────────────────────────────────────────────────────

const MAP_ASPECT_RATIO = 1536 / 864;

const TEAM_COLOURS = [
  { bg: "#e74c3c", glow: "rgba(231,76,60,0.7)"   },
  { bg: "#e67e22", glow: "rgba(230,126,34,0.7)"  },
  { bg: "#f1c40f", glow: "rgba(241,196,15,0.7)"  },
  { bg: "#2ecc71", glow: "rgba(46,204,113,0.7)"  },
  { bg: "#1abc9c", glow: "rgba(26,188,156,0.7)"  },
  { bg: "#3498db", glow: "rgba(52,152,219,0.7)"  },
  { bg: "#9b59b6", glow: "rgba(155,89,182,0.7)"  },
  { bg: "#e91e63", glow: "rgba(233,30,99,0.7)"   },
  { bg: "#00bcd4", glow: "rgba(0,188,212,0.7)"   },
  { bg: "#ff5722", glow: "rgba(255,87,34,0.7)"   },
  { bg: "#8bc34a", glow: "rgba(139,195,74,0.7)"  },
  { bg: "#607d8b", glow: "rgba(96,125,139,0.7)"  },
  { bg: "#ff9800", glow: "rgba(255,152,0,0.7)"   },
  { bg: "#795548", glow: "rgba(121,85,72,0.7)"   },
  { bg: "#673ab7", glow: "rgba(103,58,183,0.7)"  },
];

function teamColour(teamName) {
  const n = parseInt(teamName.replace(/\D/g, ""), 10);
  return TEAM_COLOURS[(n - 1) % TEAM_COLOURS.length];
}

function getCircularOffset(index, total, markerSize) {
  if (total === 1) return { dx: 0, dy: -(markerSize * 1.2) };
  const MIN_GAP = 6;
  const minRadius = (total * (markerSize + MIN_GAP)) / (2 * Math.PI);
  const r = Math.max(minRadius, markerSize * 1.4);
  const centreOffsetY = -r;
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return {
    dx: Math.cos(angle) * r,
    dy: centreOffsetY + Math.sin(angle) * r
  };
}

// ─── DevTools position helper ─────────────────────────────────────────────────
// After the page loads, paste this into the browser console:
//
//   window.__dumpPositions()
//
// It will print the updated STATION_POSITIONS object so you can paste it
// straight back into this file.
//
// To move an anchor, open DevTools → Elements, find the div with
// data-station="A" (etc.), and edit its `left` / `top` style directly.
// The values are percentages of the map box. When happy, call __dumpPositions().
// ─────────────────────────────────────────────────────────────────────────────


export default function Display() {
  const [teams, setTeams] = useState([]);
  const [movedTeams, setMovedTeams] = useState(new Set());

  // Install the console helper once on mount
  

  useEffect(() => {
    let prevStations = {};

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);
        const data = res.data;

        const nowMoved = new Set();
        data.forEach((t) => {
          if (prevStations[t.team] && prevStations[t.team] !== t.station) {
            nowMoved.add(t.team);
          }
        });
        if (nowMoved.size > 0) {
          setMovedTeams(nowMoved);
          setTimeout(() => setMovedTeams(new Set()), 1000);
        }

        data.forEach((t) => { prevStations[t.team] = t.station; });
        setTeams(data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const goFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen)            el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen)     el.msRequestFullscreen();
  };

  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) stationGroups[team.station] = [];
    stationGroups[team.station].push(team);
  });

  const size = typeof window !== "undefined" && window.innerWidth < 600 ? 22 : 30;

  return (
    <div style={styles.shell}>
      <button onClick={goFullscreen} style={styles.fullscreenBtn}>⛶</button>

      {/* Side panel */}
      <div style={styles.sidePanel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Team</th>
              <th style={styles.th}>Station</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => {
              const colour = teamColour(t.team);
              return (
                <tr key={t.team}>
                  <td style={styles.td}>
                    <span style={{
                      display: "inline-block",
                      width: 10, height: 10,
                      borderRadius: "50%",
                      background: colour.bg,
                      boxShadow: `0 0 5px ${colour.glow}`,
                      marginRight: 6,
                      verticalAlign: "middle"
                    }} />
                    {t.team}
                  </td>
                  <td style={styles.td}>{t.station}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Map */}
      <div style={styles.mapOuter}>
        <div style={{
          ...styles.mapAspectBox,
          paddingTop: `${(1 / MAP_ASPECT_RATIO) * 100}%`
        }}>
          <img src="/map.png" alt="map" style={styles.mapImg} />
   

          {/* ── Team markers ───────────────────────────────────────────────── */}
          {teams.map((team) => {
            const pos = STATION_POSITIONS[team.station];
            if (!pos) return null;

            const group  = stationGroups[team.station] || [];
            const index  = group.findIndex((t) => t.team === team.team);
            const total  = group.length;
            const colour = teamColour(team.team);
            const moved  = movedTeams.has(team.team);

            const { dx, dy } = getCircularOffset(index, total, size);

            return (
              <div
                key={team.team}
                title={team.team}
                style={{
                  ...styles.marker,
                  width:      size,
                  height:     size,
                  fontSize:   size * 0.38,
                  left:       `${pos.x}%`,
                  top:        `${pos.y}%`,
                  transform:  `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  background: colour.bg,
                  boxShadow:  `0 0 8px 3px ${colour.glow}, 0 0 2px rgba(0,0,0,0.5)`,
                  animation:  moved
                    ? "arrive 0.9s ease"
                    : "pulse-glow 2.5s ease-in-out infinite",
                  transition: [
                    "left 0.9s cubic-bezier(0.22,1,0.36,1)",
                    "top 0.9s cubic-bezier(0.22,1,0.36,1)",
                    "transform 0.9s cubic-bezier(0.22,1,0.36,1)"
                  ].join(", "),
                  zIndex: 20,
                }}
              >
                {team.team}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { filter: brightness(1);   }
          50%       { filter: brightness(1.5); }
        }
        @keyframes arrive {
          0%   { filter: brightness(1);   transform: scale(1);   }
          40%  { filter: brightness(2.2); transform: scale(1.7); }
          100% { filter: brightness(1);   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}

const styles = {
  shell: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    width:           "100vw",
    height:          "100vh",
    backgroundColor: "#000",
    position:        "relative"
  },
  fullscreenBtn: {
    position: "absolute", top: 16, right: 16, zIndex: 1000,
    background: "rgba(0,0,0,0.5)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6,
    padding: "5px 10px", cursor: "pointer", fontSize: 14
  },
  sidePanel: {
    position: "absolute", left: 10, top: 10,
    background: "rgba(0,0,0,0.65)", color: "white",
    padding: "10px", borderRadius: "8px",
    maxHeight: "80vh", overflowY: "auto", zIndex: 1000
  },
  table:  { borderCollapse: "collapse", fontSize: "12px" },
  th:     { borderBottom: "1px solid rgba(255,255,255,0.3)", padding: "4px 8px", textAlign: "left" },
  td:     { padding: "4px 8px" },
  mapOuter: {
    width: "100%",
    maxWidth: `min(100vw, calc(100vh * ${MAP_ASPECT_RATIO}))`
  },
  mapAspectBox: { position: "relative", width: "100%" },
  mapImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  marker: {
    position:       "absolute",
    borderRadius:   "50%",
    color:          "#fff",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     "bold",
    cursor:         "default",
    userSelect:     "none",
  }
};
