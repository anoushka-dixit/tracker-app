import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

// % positions (stable)
const STATION_POSITIONS = {
  A: { x: (270 / 1536) * 100, y: (300 / 864) * 100 },
  B: { x: (700 / 1536) * 100, y: (260 / 864) * 100 },
  C: { x: (1150 / 1536) * 100, y: (330 / 864) * 100 },
  D: { x: (600 / 1536) * 100, y: (500 / 864) * 100 },
  E: { x: (950 / 1536) * 100, y: (560 / 864) * 100 },
  F: { x: (420 / 1536) * 100, y: (700 / 864) * 100 },
  TREASURE: { x: (1100 / 1536) * 100, y: (720 / 864) * 100 }
};

const MAP_ASPECT_RATIO = 1536 / 864;

const ROW_SIZE = 4;
const MARKER_GAP = 4;
import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const STATION_POSITIONS = {
  A: { x: (270 / 1536) * 100, y: (300 / 864) * 100 },
  B: { x: (700 / 1536) * 100, y: (260 / 864) * 100 }, // slightly higher
  C: { x: (1150 / 1536) * 100, y: (330 / 864) * 100 },
  D: { x: (600 / 1536) * 100, y: (500 / 864) * 100 },
  E: { x: (950 / 1536) * 100, y: (560 / 864) * 100 },
  F: { x: (420 / 1536) * 100, y: (700 / 864) * 100 },
  TREASURE: { x: (1100 / 1536) * 100, y: (720 / 864) * 100 }
};

const MAP_ASPECT_RATIO = 1536 / 864;

// 🔥 NEW: island-based layouts
function getStationOffset(station, index, total, size) {
  const gap = size + 6;

  if (station === "B") {
    const start = -(total - 1) * gap / 2;
    return { dx: start + index * gap, dy: 0 };
  }

  if (station === "C") {
    const angleStep = Math.PI / 6;
    const start = -((total - 1) / 2) * angleStep;
    const angle = start + index * angleStep;
    const radius = 25;

    return {
      dx: radius * Math.cos(angle),
      dy: radius * Math.sin(angle)
    };
  }

  if (station === "D") {
    const start = -(total - 1) * gap / 2;
    return { dx: 0, dy: start + index * gap };
  }

  if (station === "E") {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 25;

    return {
      dx: radius * Math.cos(angle),
      dy: radius * Math.sin(angle)
    };
  }

  if (station === "F") {
    const start = -(total - 1) * gap / 2;
    return {
      dx: start + index * gap,
      dy: start + index * gap
    };
  }

  if (station === "TREASURE") {
    return {
      dx: (index % 3) * gap - gap,
      dy: Math.floor(index / 3) * gap - gap
    };
  }

  // default (A)
  const start = -(total - 1) * gap / 2;
  return { dx: start + index * gap, dy: 0 };
}

export default function Display() {
  const [teams, setTeams] = useState([]);
  const [prevStations, setPrevStations] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);

        setPrevStations((prev) => {
          const copy = {};
          res.data.forEach((t) => {
            copy[t.team] = t.station;
          });
          return copy;
        });

        setTeams(res.data);
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
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  // group teams
  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) stationGroups[team.station] = [];
    stationGroups[team.station].push(team);
  });

  return (
    <div style={styles.shell}>
      {/* Fullscreen */}
      <button onClick={goFullscreen} style={styles.fullscreenBtn}>
        ⛶
      </button>

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
            {teams.map((t) => (
              <tr key={t.team}>
                <td style={styles.td}>{t.team}</td>
                <td style={styles.td}>{t.station}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Map */}
      <div style={styles.mapOuter}>
        <div
          style={{
            ...styles.mapAspectBox,
            paddingTop: `${(1 / MAP_ASPECT_RATIO) * 100}%`
          }}
        >
          <img src="/map.png" alt="map" style={styles.mapImg} />

          {teams.map((team) => {
            const pos = STATION_POSITIONS[team.station];
            if (!pos) return null;

            const group = stationGroups[team.station] || [];
            const index = group.findIndex((t) => t.team === team.team);
            const total = group.length;

            const size = window.innerWidth < 600 ? 20 : 30;

            const { dx, dy } = getStationOffset(
              team.station,
              index,
              total,
              size
            );

            const moved =
              prevStations[team.team] &&
              prevStations[team.team] !== team.station;

            return (
              <div
                key={team.team}
                style={{
                  ...styles.marker,
                  width: size,
                  height: size,
                  fontSize: size * 0.4,
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  transition:
                    "all 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  animation: moved ? "pulse 0.9s ease" : "none"
                }}
              >
                {team.team}
              </div>
            );
          })}
        </div>
      </div>

      {/* Animation */}
      <style>
        {`
        @keyframes pulse {
          0% { transform: scale(1) translate(-50%, -50%); }
          40% { transform: scale(1.5) translate(-50%, -50%); }
          100% { transform: scale(1) translate(-50%, -50%); }
        }
        `}
      </style>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000",
    position: "relative"
  },

  fullscreenBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1000
  },

  sidePanel: {
    position: "absolute",
    left: 10,
    top: 10,
    background: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    maxHeight: "80vh",
    overflowY: "auto",
    zIndex: 1000
  },

  table: {
    borderCollapse: "collapse",
    fontSize: "12px"
  },

  th: {
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    padding: "4px 8px",
    textAlign: "left"
  },

  td: {
    padding: "4px 8px"
  },

  mapOuter: {
    width: "100%",
    maxWidth: `min(100vw, calc(100vh * ${MAP_ASPECT_RATIO}))`
  },

  mapAspectBox: {
    position: "relative",
    width: "100%"
  },

  mapImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%"
  },

  marker: {
    position: "absolute",
    borderRadius: "50%",
    background: "#239dad",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    boxShadow: "0 0 6px rgba(0,0,0,0.6)",
    zIndex: 10
  }
};
function getGroupOffset(index, total, size) {
  const cols = Math.min(total, ROW_SIZE);
  const rows = Math.ceil(total / ROW_SIZE);
  const step = size + MARKER_GAP;

  const col = index % ROW_SIZE;
  const row = Math.floor(index / ROW_SIZE);

  const gridWidth = cols * step - MARKER_GAP;
  const gridHeight = rows * step - MARKER_GAP;

  const dx = col * step - gridWidth / 2 + size / 2;
  const dy = row * step - gridHeight / 2 + size / 2;

  return { dx, dy };
}

export default function Display() {
  const [teams, setTeams] = useState([]);
  const [prevStations, setPrevStations] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);

        setPrevStations((prev) => {
          const copy = {};
          res.data.forEach((t) => {
            copy[t.team] = t.station;
          });
          return copy;
        });

        setTeams(res.data);
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
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  // group teams
  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) stationGroups[team.station] = [];
    stationGroups[team.station].push(team);
  });

  return (
    <div style={styles.shell}>
      {/* Fullscreen */}
      <button onClick={goFullscreen} style={styles.fullscreenBtn}>
        ⛶
      </button>

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
            {teams.map((t) => (
              <tr key={t.team}>
                <td style={styles.td}>{t.team}</td>
                <td style={styles.td}>{t.station}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Map */}
      <div style={styles.mapOuter}>
        <div
          style={{
            ...styles.mapAspectBox,
            paddingTop: `${(1 / MAP_ASPECT_RATIO) * 100}%`
          }}
        >
          <img src="/map.png" alt="map" style={styles.mapImg} />

          {teams.map((team) => {
            const pos = STATION_POSITIONS[team.station];
            if (!pos) return null;

            const group = stationGroups[team.station] || [];
            const index = group.findIndex((t) => t.team === team.team);
            const total = group.length;

            const size = window.innerWidth < 600 ? 20 : 30;

            const { dx, dy } = getGroupOffset(index, total, size);

            const moved =
              prevStations[team.team] &&
              prevStations[team.team] !== team.station;

            return (
              <div
                key={team.team}
                style={{
                  ...styles.marker,
                  width: size,
                  height: size,
                  fontSize: size * 0.4,
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  transition:
                    "all 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  animation: moved ? "pulse 0.9s ease" : "none"
                }}
              >
                {team.team}
              </div>
            );
          })}
        </div>
      </div>

      {/* Animation */}
      <style>
        {`
        @keyframes pulse {
          0% { transform: scale(1) translate(-50%, -50%); }
          40% { transform: scale(1.5) translate(-50%, -50%); }
          100% { transform: scale(1) translate(-50%, -50%); }
        }
        `}
      </style>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000",
    position: "relative"
  },

  fullscreenBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1000
  },

  sidePanel: {
    position: "absolute",
    left: 10,
    top: 10,
    background: "rgba(0,0,0,0.6)",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    maxHeight: "80vh",
    overflowY: "auto",
    zIndex: 1000
  },

  table: {
    borderCollapse: "collapse",
    fontSize: "12px"
  },

  th: {
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    padding: "4px 8px",
    textAlign: "left"
  },

  td: {
    padding: "4px 8px"
  },

  mapOuter: {
    width: "100%",
    maxWidth: `min(100vw, calc(100vh * ${MAP_ASPECT_RATIO}))`
  },

  mapAspectBox: {
    position: "relative",
    width: "100%"
  },

  mapImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%"
  },

  marker: {
    position: "absolute",
    borderRadius: "50%",
    background: "#239dad",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    boxShadow: "0 0 6px rgba(0,0,0,0.6)",
    zIndex: 10
  }
};