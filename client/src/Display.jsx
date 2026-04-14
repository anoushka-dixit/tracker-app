import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

// 🔥 PIXEL POSITIONS based on your image (reference resolution ~1536x864)
const stationPositions = {
  A: { x: 270, y: 300 },
  B: { x: 700, y: 280 },
  C: { x: 1150, y: 330 },
  D: { x: 600, y: 500 },
  E: { x: 950, y: 560 },
  F: { x: 420, y: 700 },
  TREASURE: { x: 1100, y: 720 }
};

export default function Display() {
  const [teams, setTeams] = useState([]);
  

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const BASE_WIDTH = 1536;
  const BASE_HEIGHT = 864;

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/teams`);
      setTeams(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };



  // 🔥 calculate scale dynamically
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();

      const scaleX = width / BASE_WIDTH;
      const scaleY = height / BASE_HEIGHT;

      // contain behavior
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const goFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
        overflow: "hidden"
      }}
    >
      {!isMobile && (
        <button
          onClick={goFullscreen}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            zIndex: 1000
          }}
        >
          Fullscreen
        </button>
      )}

      {/* 🔥 CENTERED + SCALED IMAGE */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: "top left",
          width: BASE_WIDTH,
          height: BASE_HEIGHT
        }}
      >
        <img
          src="/map.png"
          alt="map"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain"
          }}
        />

        {/* 🔥 TEAM MARKERS */}
        {teams.map((team, i) => {
          const pos = stationPositions[team.station];
          if (!pos) return null;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: pos.y,
                left: pos.x,
                transform: "translate(-50%, -50%)",
                background: "#239dad",
                color: "white",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                marginLeft: `${(i % 4) * 12}px`,
                zIndex: 10
              }}
            >
              {team.team}
            </div>
          );
        })}
      </div>
    </div>
  );
}