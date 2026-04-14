import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

// Positions as percentages of the map image's natural dimensions (1536x864).
// x = (pixel_x / 1536) * 100, y = (pixel_y / 864) * 100
const STATION_POSITIONS = {
  A:       { x: (270  / 1536) * 100, y: (300 / 864) * 100 },
  B:       { x: (700  / 1536) * 100, y: (280 / 864) * 100 },
  C:       { x: (1150 / 1536) * 100, y: (330 / 864) * 100 },
  D:       { x: (600  / 1536) * 100, y: (500 / 864) * 100 },
  E:       { x: (950  / 1536) * 100, y: (560 / 864) * 100 },
  F:       { x: (420  / 1536) * 100, y: (700 / 864) * 100 },
  TREASURE:{ x: (1100 / 1536) * 100, y: (720 / 864) * 100 },
};

// Map aspect ratio: width / height
const MAP_ASPECT_RATIO = 1536 / 864;

// Marker size in px — keep this consistent for offset math
const MARKER_SIZE = 30;
const MARKER_GAP = 4; // gap between markers in a group

/**
 * Given N teams at the same station, return the (dx, dy) offset in px
 * for the i-th team so they spread into a tidy grid without overlapping.
 *
 * Layout: teams flow left→right, wrapping every ROW_SIZE items.
 * The whole group is centered on the station point.
 */
const ROW_SIZE = 4;
function getGroupOffset(index, total) {
  const cols = Math.min(total, ROW_SIZE);
  const rows = Math.ceil(total / ROW_SIZE);
  const step = MARKER_SIZE + MARKER_GAP;

  const col = index % ROW_SIZE;
  const row = Math.floor(index / ROW_SIZE);

  // Center the grid on the anchor point
  const gridWidth  = cols * step - MARKER_GAP;
  const gridHeight = rows * step - MARKER_GAP;

  const dx = col * step - gridWidth  / 2 + MARKER_SIZE / 2;
  const dy = row * step - gridHeight / 2 + MARKER_SIZE / 2;

  return { dx, dy };
}

export default function Display() {
  const [teams, setTeams] = useState([]);

  // Poll backend every 2 s
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/teams`);
        setTeams(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen helper
  const goFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen)            el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen)     el.msRequestFullscreen();
  };

  // Pre-compute per-station group indices so each team knows its slot
  const stationGroups = {};
  teams.forEach((team) => {
    if (!stationGroups[team.station]) stationGroups[team.station] = [];
    stationGroups[team.station].push(team.team);
  });

  return (
    // Outer shell: fills the viewport, black letterbox background
    <div style={styles.shell}>

      {/* Fullscreen button */}
      <button onClick={goFullscreen} style={styles.fullscreenBtn}>
        ⛶ Fullscreen
      </button>

      {/*
        * MAP WRAPPER
        * Uses padding-top to enforce the map's aspect ratio.
        * This div is always exactly the right shape — no JS sizing needed.
        * We constrain it to fit inside the viewport via max-width / max-height.
        *
        * Key insight: with padding-top = (H/W)*100%, the div's rendered height
        * always equals its rendered width × (H/W). The image and overlay sit
        * inside it as absolute children, so percentage positions are always
        * relative to the true rendered map area.
      */}
      <div style={styles.mapOuter}>
        <div
          style={{
            ...styles.mapAspectBox,
            paddingTop: `${(1 / MAP_ASPECT_RATIO) * 100}%`,
          }}
        >
          {/* Map image */}
          <img src="/map.png" alt="map" style={styles.mapImg} />

          {/* Team markers */}
          {teams.map((team) => {
            const pos = STATION_POSITIONS[team.station];
            if (!pos) return null;

            const groupAtStation = stationGroups[team.station] || [];
            const indexInGroup   = groupAtStation.indexOf(team.team);
            const total          = groupAtStation.length;
            const { dx, dy }     = getGroupOffset(indexInGroup, total);

            return (
              <div
                key={team.team}
                style={{
                  ...styles.marker,
                  // Percentage positions anchor to station centre
                  left: `${pos.x}%`,
                  top:  `${pos.y}%`,
                  // Pixel offsets spread grouped teams; translate(-50%,-50%)
                  // centres each marker on its anchor before the offset is applied
                  transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
                }}
              >
                {team.team}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  shell: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    width:           "100vw",
    height:          "100vh",
    backgroundColor: "#000",
    overflow:        "hidden",
    position:        "relative",
  },

  fullscreenBtn: {
    position:   "absolute",
    top:        16,
    right:      16,
    zIndex:     1000,
    background: "rgba(0,0,0,0.6)",
    color:      "#fff",
    border:     "1px solid rgba(255,255,255,0.3)",
    borderRadius: 6,
    padding:    "6px 12px",
    cursor:     "pointer",
    fontSize:   13,
  },

  /*
   * mapOuter constrains the aspect-ratio box so it never overflows the
   * viewport in either dimension.
   *
   * max-width  = 100vw  (don't overflow horizontally)
   * max-height = 100vh  (don't overflow vertically)
   *
   * Since padding-top drives height from width, we also need:
   *   width ≤ 100vh × MAP_ASPECT_RATIO   (height constraint → width limit)
   *
   * We achieve this with a CSS calc on max-width.
   */
  mapOuter: {
    width:    "100%",
    maxWidth: `min(100vw, calc(100vh * ${MAP_ASPECT_RATIO}))`,
  },

  mapAspectBox: {
    position: "relative",
    width:    "100%",
    // height is driven by padding-top set inline above
  },

  mapImg: {
    position: "absolute",
    top:      0,
    left:     0,
    width:    "100%",
    height:   "100%",
    display:  "block",
  },

  marker: {
    position:     "absolute",
    width:        MARKER_SIZE,
    height:       MARKER_SIZE,
    borderRadius: "50%",
    background:   "#239dad",
    color:        "#fff",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    fontSize:     10,
    fontWeight:   "bold",
    boxShadow:    "0 0 6px rgba(0,0,0,0.6)",
    userSelect:   "none",
    whiteSpace:   "nowrap",
    zIndex:       10,
  },
};
