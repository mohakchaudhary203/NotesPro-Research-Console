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

// DB helpers
function readDB() {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, JSON.stringify({ users: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB));
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

// AUTH
app.post("/signup", (req, res) => {
  let db = readDB();
  let { username, password } = req.body;

  if (db.users.find(u => u.username === username)) {
    return res.json({ success: false });
  }

  db.users.push({ username, password, history: [] });
  writeDB(db);

  res.json({ success: true });
});

app.post("/login", (req, res) => {
  let db = readDB();
  let { username, password } = req.body;

  let user = db.users.find(
    u => u.username === username && u.password === password
  );

  res.json({ success: !!user });
});

// HISTORY
app.post("/history", (req, res) => {
  let db = readDB();
  let { username, topic } = req.body;

  let user = db.users.find(u => u.username === username);
  if (!user) return res.json({ success: false });

  user.history.unshift(topic);
  user.history = [...new Set(user.history)].slice(0, 10);

  writeDB(db);
  res.json({ success: true });
});

app.get("/history/:username", (req, res) => {
  let db = readDB();
  let user = db.users.find(u => u.username === req.params.username);
  res.json(user ? user.history : []);
});

// 🔥 AI NOTES (MAX QUALITY VERSION)
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
              content: `You are an expert teacher, mentor, and exam strategist.

Create VERY DETAILED, HIGH-QUALITY notes.

Topic: ${topic}

Follow structure:

📌 1. Definition:
- 2–3 lines

📌 2. Core Concept:
- Explain in 2–3 short paragraphs

📌 3. Why It Matters:
- Importance of topic

📌 4. Key Points:
- 8–10 bullets

📌 5. Important Terms:
- 8–12 keywords with meanings

📌 6. Examples:
- 3–4 examples

📌 7. Applications:
- 4–6 uses

📌 8. Advantages:
- 4–5 points

📌 9. Disadvantages:
- 3–4 points

📌 10. Common Mistakes:
- 3–5 points

📌 11. Exam Tips:
- What to write for full marks

📌 12. Quick Revision:
- Short bullets

📌 13. Memory Tricks:
- Simple mnemonics

📌 14. Summary:
- 5–6 lines

Rules:
- Mix paragraphs + bullet points
- Keep language simple
- Avoid repetition
- Make it exam-focused + easy to revise
`
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.choices) {
      console.error("GROQ ERROR:", data);
      return res.status(500).json({ error: "AI failed" });
    }

    res.json({
      text: data.choices[0].message.content
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

// ROOT
app.get("/", (req, res) => {
  res.send("✅ NotesPro Backend Running (Final)");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
