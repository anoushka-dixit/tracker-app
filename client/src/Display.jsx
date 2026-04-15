import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const STATION_POSITIONS = {
  A:        { x: 17.5781, y: 25.9352 },
  B:        { x: 43,      y: 23.5    },
  C:        { x: 74.8698, y: 32.1944 },
  D:        { x: 39.0625, y: 57.8704 },
  E:        { x: 61.849,  y: 61      },
  F:        { x: 27.3438, y: 81.0185 },
  TREASURE: { x: 71.6146, y: 83.3333 }
};

const MAP_ASPECT_RATIO = 1536 / 864;

// 15 distinct colours — one per team, fixed by team number
const TEAM_COLOURS = [
  { bg: "#e74c3c", glow: "rgba(231,76,60,0.7)"   }, // T1  red
  { bg: "#e67e22", glow: "rgba(230,126,34,0.7)"  }, // T2  orange
  { bg: "#f1c40f", glow: "rgba(241,196,15,0.7)"  }, // T3  yellow
  { bg: "#2ecc71", glow: "rgba(46,204,113,0.7)"  }, // T4  green
  { bg: "#1abc9c", glow: "rgba(26,188,156,0.7)"  }, // T5  teal
  { bg: "#3498db", glow: "rgba(52,152,219,0.7)"  }, // T6  blue
  { bg: "#9b59b6", glow: "rgba(155,89,182,0.7)"  }, // T7  purple
  { bg: "#e91e63", glow: "rgba(233,30,99,0.7)"   }, // T8  pink
  { bg: "#00bcd4", glow: "rgba(0,188,212,0.7)"   }, // T9  cyan
  { bg: "#ff5722", glow: "rgba(255,87,34,0.7)"   }, // T10 deep-orange
  { bg: "#8bc34a", glow: "rgba(139,195,74,0.7)"  }, // T11 lime
  { bg: "#607d8b", glow: "rgba(96,125,139,0.7)"  }, // T12 slate
  { bg: "#ff9800", glow: "rgba(255,152,0,0.7)"   }, // T13 amber
  { bg: "#795548", glow: "rgba(121,85,72,0.7)"   }, // T14 brown
  { bg: "#673ab7", glow: "rgba(103,58,183,0.7)"  }, // T15 deep-purple
];

// Parse "T3" → index 2, then look up colour table
function teamColour(teamName) {
  const n = parseInt(teamName.replace(/\D/g, ""), 10);
  return TEAM_COLOURS[(n - 1) % TEAM_COLOURS.length];
}

/**
 * Circular layout centred ABOVE the station anchor.
 *
 * Why above?  The station label text sits below the anchor point on the map
 * image. Shifting the entire cluster upward by `r` pixels keeps all markers
 * clear of the label regardless of how many teams are present.
 *
 * maths:
 *   r  = max(circumference-based minimum, 1.2 × markerSize)
 *   centreOffsetY = -r   ← shift whole cluster up by one radius
 *   then each marker is placed on the circle relative to that shifted centre
 */
function getCircularOffset(index, total, markerSize) {
  if (total === 1) return { dx: 0, dy: -(markerSize * 1.2) };

  const MIN_GAP = 6;
  const minRadius = (total * (markerSize + MIN_GAP)) / (2 * Math.PI);
  const r = Math.max(minRadius, markerSize * 1.4);

  // Cluster centre is shifted up so it clears the label below
  const centreOffsetY = -r;

  // Start from top of the circle (−90°), spread clockwise
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;

  return {
    dx: Math.cos(angle) * r,
    dy: centreOffsetY + Math.sin(angle) * r
  };
}

export default function Display() {
  const [teams, setTeams] = useState([]);
  const [movedTeams, setMovedTeams] = useState(new Set());

  useEffect(() => {
    let prevStations = {};

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);
        const data = res.data;

        // Detect which teams just moved
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

        // Update prev for next poll
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

  // Group by station
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
                  animation:  moved ? "arrive 0.9s ease" : "pulse-glow 2.5s ease-in-out infinite",
                  transition: "left 0.9s cubic-bezier(0.22,1,0.36,1), top 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)",
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
          50%       { filter: brightness(1.4); }
        }
        @keyframes arrive {
          0%   { transform: translate(calc(-50% + ${0}px), calc(-50% + ${0}px)) scale(1);   }
          40%  { filter: brightness(2); transform: scale(1.6); }
          100% { filter: brightness(1); transform: scale(1);   }
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
    zIndex:         10,
    cursor:         "default",
    userSelect:     "none",
  }
};
