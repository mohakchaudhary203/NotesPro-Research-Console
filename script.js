const API =
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1")
    ? "http://localhost:3000"
    : "https://notespro-research-console.onrender.com";

const user = localStorage.getItem("loggedInUser");
if (!user) window.location.href = "index.html";

// ── DOM ──
const input = document.getElementById("topic");
const suggestionsBox = document.getElementById("suggestions");
const loader = document.getElementById("loader");
const historyList = document.getElementById("historyList");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userDisplay").textContent = "👤 " + user;
  checkServerStatus();
  loadHistory();
});

// ── SERVER STATUS ──
async function checkServerStatus() {
  statusText.textContent = "Connecting...";

  try {
    const res = await fetch(`${API}/`);
    if (res.ok) {
      statusDot.className = "status-dot online";
      statusText.textContent = "Server connected";
    } else throw new Error();
  } catch {
    statusDot.className = "status-dot offline";
    statusText.textContent = "Server sleeping (Render)";
  }
}

// ── AUTOCOMPLETE ──
let debounceTimer;

input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = input.value.trim();

  if (query.length < 2) {
    suggestionsBox.innerHTML = "";
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&origin=*`
      );

      const data = await res.json();

      suggestionsBox.innerHTML = data[1]
        .map(item => `<li onclick="selectSuggestion('${item}')">${item}</li>`)
        .join("");

    } catch {
      suggestionsBox.innerHTML = "";
    }
  }, 300);
});

function selectSuggestion(text) {
  input.value = text;
  suggestionsBox.innerHTML = "";
  getNotes();
}

// ── ENTER KEY ──
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    getNotes();
  }
});

// ── AI NOTES ──
async function getNotes() {
  if (!input.value.trim()) return alert("Enter topic");

  loader.classList.remove("hidden");
  document.getElementById("output").innerHTML = "";

  try {
    const res = await fetch(`${API}/ai-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic: input.value })
    });

    const data = await res.json();

    if (!data.text) throw new Error();

    document.getElementById("output").innerHTML = `
      <div class="card">
        <h2>${input.value}</h2>
        <div style="white-space: pre-line">${data.text}</div>
      </div>
    `;

    saveHistory(input.value);

  } catch {
    document.getElementById("output").innerHTML =
      "<p>⚠ Failed to generate notes</p>";
  }

  loader.classList.add("hidden");
  checkServerStatus();
}

// ── HISTORY ──
async function saveHistory(topic) {
  try {
    await fetch(`${API}/history`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ username: user, topic })
    });
  } catch {}

  loadHistory();
}

async function loadHistory() {
  try {
    const res = await fetch(`${API}/history/${user}`);
    const data = await res.json();

    historyList.innerHTML = data.length
      ? data.map(i => `<li onclick="loadFromHistory('${i}')">${i}</li>`).join("")
      : "<li>No history</li>";

  } catch {
    historyList.innerHTML = "<li>Error loading</li>";
  }
}

function loadFromHistory(t) {
  input.value = t;
  getNotes();
}

// ── LOGOUT ──
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}
