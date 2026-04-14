import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const STATION_POSITIONS = {
  A: { x: (270 / 1536) * 100, y: (280 / 864) * 100 },
  B: { x: (700 / 1536) * 100, y: (250 / 864) * 100 },
  C: { x: (1150 / 1536) * 100, y: (330 / 864) * 100 },
  D: { x: (600 / 1536) * 100, y: (500 / 864) * 100 },
  E: { x: (950 / 1536) * 100, y: (560 / 864) * 100 },
  F: { x: (420 / 1536) * 100, y: (700 / 864) * 100 },
  TREASURE: { x: (1100 / 1536) * 100, y: (720 / 864) * 100 }
};

const MAP_ASPECT_RATIO = 1536 / 864;

/**
 * Circular arrangement around the station anchor point.
 *
 * - 1 team: sits exactly on the anchor (no offset needed).
 * - 2–N teams: evenly distributed on a circle of radius `r`.
 *   Radius grows with team count so markers never overlap.
 *
 * The first marker starts at the top (−90°) so the cluster
 * fans out symmetrically and doesn't drift into the label below.
 */
function getCircularOffset(index, total, markerSize) {
  if (total === 1) return { dx: 0, dy: 0 };

  // Minimum gap between marker edges
  const MIN_GAP = 4;

  // Minimum radius so neighbouring markers don't touch:
  // circumference ≥ total × (markerSize + gap)
  // r = circumference / (2π)
  const minRadius = (total * (markerSize + MIN_GAP)) / (2 * Math.PI);

  // Also enforce a floor so even 2–3 teams aren't cramped
  const r = Math.max(minRadius, markerSize * 1.2);

  // Start from top (−90°), spread clockwise
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;

  return {
    dx: Math.cos(angle) * r,
    dy: Math.sin(angle) * r
  };
}

export default function Display() {
  const [teams, setTeams] = useState([]);
  const [prevStations, setPrevStations] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);

        setPrevStations(() => {
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

  // Group teams by station
  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) stationGroups[team.station] = [];
    stationGroups[team.station].push(team);
  });

  return (
    <div style={styles.shell}>
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
            const { dx, dy } = getCircularOffset(index, total, size);

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
                  transition: "left 0.9s cubic-bezier(0.22, 1, 0.36, 1), top 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  animation: moved ? "pulse 0.9s ease" : "none"
                }}
              >
                {team.team}
              </div>
            );
          })}
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%   { box-shadow: 0 0 6px rgba(0,0,0,0.6); }
            40%  { box-shadow: 0 0 0 8px rgba(35,157,173,0.4); }
            100% { box-shadow: 0 0 6px rgba(0,0,0,0.6); }
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
