import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

// 🔥 Use percentages instead of pixels (responsive)
const stationPositions = {
  A: { top: "22%", left: "20%" },
  B: { top: "18%", left: "48%" },
  C: { top: "28%", left: "78%" },
  D: { top: "55%", left: "60%" },
  E: { top: "65%", left: "82%" },
  F: { top: "72%", left: "30%" },
  TREASURE: { top: "85%", left: "88%" }
};

export default function Display() {
  const [teams, setTeams] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/teams`);
      setTeams(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const goFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    else alert("Fullscreen not supported");
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        minHeight: "100vh",
        overflow: "auto"
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

      {/* Map */}
      <img
        src="/map.png"
        alt="map"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain"
        }}
      />

      {/* 🔥 Optional: DEBUG markers (remove later) */}
      {/* {Object.entries(stationPositions).map(([key, pos]) => (
        <div
          key={key}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -50%)",
            background: "red",
            color: "white",
            padding: "4px 6px",
            borderRadius: "6px",
            fontSize: "12px",
            zIndex: 999
          }}
        >
          {key}
        </div>
      ))} */}

      {/* Teams */}
      {teams.map((team, i) => {
        const pos = stationPositions[team.station];
        if (!pos) return null;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -50%)",
              background: "#239dad",
              color: "white",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              // small spread if multiple teams at same station
              marginLeft: `${(i % 4) * 10}px`
            }}
          >
            {team.team}
          </div>
        );
      })}
    </div>
  );
}