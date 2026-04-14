import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://tracker-backend-tb4z.onrender.com";

const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // 🔥 detect fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const goFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  };

  return (
    <div
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

      {/* 🔥 Dynamic image behavior */}
      <img
        src="/map.png"
        alt="map"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: isFullscreen ? "cover" : "contain",
          top: 0,
          left: 0
        }}
      />

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
              zIndex: 10,
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