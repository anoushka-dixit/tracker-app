import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const STATION_POSITIONS = {
  A: { x: 17.5781, y: 15.9352 },
  B: { x: 43, y: 23.5 },
  C: { x: 74.8698, y: 32.1944 },
  D: { x: 30, y: 53.8704 },
  E: { x: 61.849, y: 61 },
  F: { x: 23, y: 83.5 },
  TREASURE: { x: 71.6146, y: 83.3333 }
};

const MAP_ASPECT_RATIO = 1536 / 864;

const TEAM_COLORS = [
  "#e74c3c",
  "#e67e22",
  "#f1c40f",
  "#2ecc71",
  "#1abc9c",
  "#3498db",
  "#9b59b6",
  "#e91e63",
  "#00bcd4",
  "#ff5722",
  "#8bc34a",
  "#607d8b",
  "#ff9800",
  "#795548",
  "#673ab7"
];

const SHOW_ANCHORS = ["D", "F"];

function getIslandOffset(index, total, radius = 55) {
  if (total === 1) return { dx: 0, dy: 0 };

  const angleStep = (2 * Math.PI) / total;
  const angle = -Math.PI / 2 + index * angleStep;

  return {
    dx: radius * Math.cos(angle),
    dy: radius * Math.sin(angle)
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
          const next = {};
          teams.forEach((team) => {
            next[team.team] = team.station;
          });
          return next;
        });

        setTeams(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [teams]);

  useEffect(() => {
    const audio = new Audio("/background.mp3");
    audio.loop = true;
    audio.volume = 0.4;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch (err) {
        console.log("Autoplay blocked until user interacts");
      }
    };

    playAudio();

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const goFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) {
      stationGroups[team.station] = [];
    }
    stationGroups[team.station].push(team);
  });

  return (
    <div style={styles.shell}>
      <button onClick={goFullscreen} style={styles.fullscreenBtn}>
        ⛶
      </button>

      <div style={styles.sidePanel}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Team</th>
              <th style={styles.th}>Station</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.team}>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.colorDot,
                      background: TEAM_COLORS[index % TEAM_COLORS.length],
                      boxShadow: `0 0 5px ${
                        TEAM_COLORS[index % TEAM_COLORS.length]
                      }`
                    }}
                  />
                  {team.team}
                </td>
                <td style={styles.td}>{team.station}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.mapOuter}>
        <div
          style={{
            ...styles.mapAspectBox,
            paddingTop: `${(1 / MAP_ASPECT_RATIO) * 100}%`
          }}
        >
          <img src="/map.png" alt="map" style={styles.mapImg} />

          {SHOW_ANCHORS.map((station) => {
            const pos = STATION_POSITIONS[station];
            if (!pos) return null;

            return (
              <div
                key={`anchor-${station}`}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: window.innerWidth < 600 ? 18 : 24,
                  height: window.innerWidth < 600 ? 18 : 24,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "2px dashed white",
                  boxShadow: "0 0 10px rgba(255,255,255,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: window.innerWidth < 600 ? 8 : 10,
                  fontWeight: "bold",
                  zIndex: 15,
                  pointerEvents: "none"
                }}
              >
                {station}
              </div>
            );
          })}

          {teams.map((team, teamIndex) => {
            const pos = STATION_POSITIONS[team.station];
            if (!pos) return null;

            const group = stationGroups[team.station] || [];
            const indexInGroup = group.findIndex(
              (t) => t.team === team.team
            );

            const { dx, dy } = getIslandOffset(
              indexInGroup,
              group.length,
              window.innerWidth < 600 ? 40 : 55
            );

            const moved =
              prevStations[team.team] &&
              prevStations[team.team] !== team.station;

            const size = window.innerWidth < 600 ? 20 : 30;
            const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];

            return (
              <div
                key={team.team}
                title={team.team}
                style={{
                  ...styles.marker,
                  width: size,
                  height: size,
                  fontSize: size * 0.38,
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                  background: color,
                  boxShadow: `${color}B3 0px 0px 8px 3px, rgba(0,0,0,0.5) 0px 0px 2px`,
                  animation: moved
                    ? "arrive 0.9s ease"
                    : "pulse-glow 2.5s ease-in-out infinite",
                  transition:
                    "left 0.9s cubic-bezier(0.22, 1, 0.36, 1), top 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  zIndex: 20
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
          @keyframes pulse-glow {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.5); }
          }

          @keyframes arrive {
            0% {
              filter: brightness(1);
              scale: 1;
            }
            40% {
              filter: brightness(2.2);
              scale: 1.7;
            }
            100% {
              filter: brightness(1);
              scale: 1;
            }
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
    zIndex: 1000,
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6,
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: 14
  },

  sidePanel: {
    position: "absolute",
    left: 10,
    top: 10,
    background: "rgba(0,0,0,0.65)",
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

  colorDot: {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    marginRight: 6,
    verticalAlign: "middle"
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
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    cursor: "default",
    userSelect: "none"
  }
};

