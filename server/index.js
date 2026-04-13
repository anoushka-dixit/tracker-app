const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.options("*", cors());

const DATA_FILE = path.join(__dirname, "data.json");

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

const order = ["A", "B", "C", "D", "E", "F", "TREASURE"];

// GET all teams
app.get("/teams", (req, res) => {
  res.json(readData());
});

// UPDATE specific station (POST — from Admin "Update" button)
app.get("/update", (req, res) => {
  const { team, station } = req.query;

  const data = readData();
  const updated = data.map((t) =>
    t.team === team ? { ...t, station } : t
  );

  writeData(updated);
  res.json({ success: true });
});

// MOVE team to next station (GET — from Admin "Next Station" button)
app.get("/next", (req, res) => {
  const { team } = req.query; // was req.body — body is always empty on GET

  const data = readData();
  const updated = data.map((t) => {
    if (t.team === team) {
      const idx = order.indexOf(t.station);
      return { ...t, station: order[Math.min(idx + 1, order.length - 1)] };
    }
    return t;
  });

  writeData(updated);
  res.json({ success: true });
});

app.listen(5000, "0.0.0.0", () =>
  console.log("Server running on port 5000")
);