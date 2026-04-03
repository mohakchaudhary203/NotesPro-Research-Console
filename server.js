require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");

// fetch fix for Node
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();

app.use(cors());
app.use(express.json());

const DB = "./db.json";

// ── DB HELPERS ──
function readDB() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, JSON.stringify({ users: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB));
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// ── AUTH ──
app.post("/signup", (req, res) => {
  let db = readDB();
  let { username, password } = req.body;

  if (db.users.find(u => u.username === username)) {
    return res.json({ success: false });
  }

  db.users.push({ username, password, history: [] });
  writeDB(db);

  console.log("✅ New user:", username);

  res.json({ success: true });
});

app.post("/login", (req, res) => {
  let db = readDB();
  let { username, password } = req.body;

  let user = db.users.find(
    u => u.username === username && u.password === password
  );

  console.log("🔐 Login attempt:", username);

  res.json({ success: !!user });
});

// ── HISTORY (FIXED + DEBUG) ──
app.post("/history", (req, res) => {
  try {
    let db = readDB();
    let { username, topic } = req.body;

    console.log("👉 Incoming history:", username, topic);

    if (!username || !topic) {
      return res.status(400).json({ success: false });
    }

    let user = db.users.find(u => u.username === username);

    if (!user) {
      console.log("❌ User not found");
      return res.json({ success: false });
    }

    if (!user.history) user.history = [];

    user.history.unshift(topic);
    user.history = [...new Set(user.history)].slice(0, 10);

    writeDB(db);

    console.log("✅ History saved:", user.history);

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 History ERROR:", err);
    res.status(500).json({ success: false });
  }
});

app.get("/history/:username", (req, res) => {
  let db = readDB();
  let user = db.users.find(u => u.username === req.params.username);

  console.log("📜 Load history for:", req.params.username);

  res.json(user ? user.history : []);
});

// ── AI NOTES (GROQ FINAL) ──
app.post("/ai-notes", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic required" });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.GROQ_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: `You are an expert teacher.

Create detailed, structured exam notes.

Topic: ${topic}

Include:
- Definition
- Explanation
- Key Points
- Terms
- Examples
- Applications
- Advantages
- Disadvantages
- Mistakes
- Tips
- Summary

Keep it clear and useful for exams.`
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.choices) {
      console.error("❌ GROQ ERROR:", data);
      return res.status(500).json({ error: "AI failed" });
    }

    res.json({
      text: data.choices[0].message.content
    });

  } catch (err) {
    console.error("🔥 AI ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ── ROOT ──
app.get("/", (req, res) => {
  res.send("✅ NotesPro Backend Running (FINAL)");
});

// ── SERVER ──
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
