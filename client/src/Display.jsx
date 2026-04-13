import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://your-backend-url.onrender.com";

// Moved to top — was declared after use, which caused a crash
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

const stationPositions = {
  A: { x: 200, y: 150 },
  B: { x: 500, y: 120 },
  C: { x: 800, y: 200 },
  D: { x: 600, y: 350 },
  E: { x: 850, y: 400 },
  F: { x: 300, y: 450 },
  TREASURE: { x: 900, y: 550 }
};

export default function Display() {
  const [teams, setTeams] = useState([]);

  const fetchData = async () => {
    const res = await axios.get(`${API}/teams`);
    setTeams(res.data);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const goFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    } else {
      alert("Fullscreen not supported");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
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
      <img src="/map.png" alt="map" width="100%" />

      {teams.map((team, i) => {
        const pos = stationPositions[team.station];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x + (i % 4) * 15,
              top: pos.y,
              background: "#239dad",
              color: "white",
              padding: "67px",
              borderRadius: "50%"
            }}
          >
            {team.team}
          </div>
        );
      })}
    </div>
  );
}
