import { useState } from "react";
import axios from "axios";

const API = "https://your-backend-url.onrender.com";

const teams = Array.from({ length: 15 }, (_, i) => `T${i + 1}`);
const stations = ["A", "B", "C", "D", "E", "F", "TREASURE"];

export default function Admin() {
  const [team, setTeam] = useState("T1");
  const [station, setStation] = useState("A");

  // Manually set a team to a specific station
  const update = async () => {
    await axios.post(`${API}/update`, { team, station }, {
      headers: { "Content-Type": "application/json" }
    });
    alert("Updated!");
  };

  // Advance a team to their next station
  const next = async () => {
    await axios.get(`${API}/next?team=${team}`); // was calling /update by mistake
    alert("Moved forward!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Panel</h1>

      <select onChange={(e) => setTeam(e.target.value)}>
        {teams.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <select onChange={(e) => setStation(e.target.value)}>
        {stations.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <br /><br />

      <button onClick={update}>Update</button>
      <button onClick={next} style={{ marginLeft: 10 }}>
        Next Station
      </button>
    </div>
  );
}
