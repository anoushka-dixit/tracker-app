import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

// % positions based on image (stable)
const STATION_POSITIONS = {
  A: { x: (270 / 1536) * 100, y: (300 / 864) * 100 },
  B: { x: (700 / 1536) * 100, y: (280 / 864) * 100 },
  C: { x: (1150 / 1536) * 100, y: (330 / 864) * 100 },
  D: { x: (600 / 1536) * 100, y: (500 / 864) * 100 },
  E: { x: (950 / 1536) * 100, y: (560 / 864) * 100 },
  F: { x: (420 / 1536) * 100, y: (700 / 864) * 100 },
  TREASURE: { x: (1100 / 1536) * 100, y: (720 / 864) * 100 }
};

const MAP_ASPECT_RATIO = 1536 / 864;

const ROW_SIZE = 4;
const MARKER_GAP = 4;

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

  // 🔥 Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);

        // store previous positions BEFORE updating
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

  // group teams by station
  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) stationGroups[team.station] = [];
    stationGroups[team.station].push(team);
  });

  return (
    <div style={styles.shell}>
      {/* Fullscreen button */}
      <button onClick={goFullscreen} style={styles.fullscreenBtn}>
        ⛶
      </button>

      {/* Side panel */}
      <div style={styles.sidePanel}>
        <strong>Teams</strong>
        {teams.map((t) => (
          <div key={t.team}>
            {t.team} → {t.station}
          </div>
        ))}
      </div>

      {/* Map wrapper */}
      <div style={styles.mapOuter}>
        <div
          style={{
            ...styles.mapAspectBox,
            paddingTop: `${(1 / MAP_ASPECT_RATIO) * 100}%`
          }}
        >
          <img src="/map.png" alt="map" style={styles.mapImg} />

          {/* Teams */}
          {teams.map((team) => {
            const pos = STATION_POSITIONS[team.station];
            if (!pos) return null;

            const group = stationGroups[team.station] || [];
            const index = group.findIndex((t) => t.team === team.team);
            const total = group.length;

            const size =
              window.innerWidth < 600 ? 20 : 30; // responsive size

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
                  transition: "all 0.4s ease",
                  animation: moved ? "pulse 0.6s ease" : "none"
                }}
              >
                {team.team}
              </div>
            );
          })}
        </div>
      </div>

      {/* animation */}
      <style>
        {`
        @keyframes pulse {
          0% { transform: scale(1) translate(-50%, -50%); }
          50% { transform: scale(1.4) translate(-50%, -50%); }
          100% { transform: scale(1) translate(-50%, -50%); }
        }
        `}
      </style>
    </div>
  );
}

// styles
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
    fontSize: "12px",
    maxHeight: "80vh",
    overflowY: "auto",
    zIndex: 1000
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