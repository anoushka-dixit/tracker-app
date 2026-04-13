const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

// In-memory data (no file system)
let teams = [
  { team: "T1", station: "A" },
  { team: "T2", station: "A" },
  { team: "T3", station: "A" },
  { team: "T4", station: "A" },
  { team: "T5", station: "A" },
  { team: "T6", station: "A" },
  { team: "T7", station: "A" },
  { team: "T8", station: "A" },
  { team: "T9", station: "A" },
  { team: "T10", station: "A" },
  { team: "T11", station: "A" },
  { team: "T12", station: "A" },
  { team: "T13", station: "A" },
  { team: "T14", station: "A" },
  { team: "T15", station: "A" }
];

const order = ["A", "B", "C", "D", "E", "F", "TREASURE"];

// Root (optional)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Get all teams
app.get("/teams", (req, res) => {
  res.json(teams);
});

// Update to specific station
app.get("/update", (req, res) => {
  const { team, station } = req.query;

  teams = teams.map((t) =>
    t.team === team ? { ...t, station } : t
  );

  res.json({ success: true });
});

// Move to next station
app.get("/next", (req, res) => {
  const { team } = req.query;

  teams = teams.map((t) => {
    if (t.team === team) {
      const idx = order.indexOf(t.station);
      return {
        ...t,
        station: order[Math.min(idx + 1, order.length - 1)]
      };
    }
    return t;
  });

  res.json({ success: true });
});

// Listen
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});