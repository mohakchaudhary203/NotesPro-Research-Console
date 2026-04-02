const API = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:3000"
  : "https://notespro-backend.onrender.com";

const user = localStorage.getItem("loggedInUser");
if (!user) window.location.href = "index.html";

// ── DOM refs ──
const input          = document.getElementById("topic");
const suggestionsBox = document.getElementById("suggestions");
const loader         = document.getElementById("loader");
const historyList    = document.getElementById("historyList");
const statusDot      = document.getElementById("statusDot");
const statusText     = document.getElementById("statusText");

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userDisplay").textContent = "👤 " + user;
  checkServerStatus();
  loadHistory();
});

// ── Server Status ──
async function checkServerStatus() {
  statusDot.className = "status-dot";
  statusText.textContent = "Connecting...";

  try {
    const res = await fetch(`${API}/`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      statusDot.className = "status-dot online";
      statusText.textContent = "Server connected";
    } else throw new Error();
  } catch {
    statusDot.className = "status-dot offline";
    statusText.textContent = "Server sleeping (Render)";
  }
}

// ── Autocomplete (kept same) ──
let debounceTimer;
input.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = input.value.trim();
  if (query.length < 2) { suggestionsBox.innerHTML = ""; return; }

  debounceTimer = setTimeout(async () => {
    try {
      const res  = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&origin=*`);
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

// prevent reload
input.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    getNotes();
  }
});

// ── 🔥 AI NOTES ──
async function getNotes() {

  if (!loader.classList.contains("hidden")) return;

  const topic = input.value.trim();
  if (!topic) return showToast("Enter topic first", "info");

  statusText.textContent = "Generating AI notes...";

  loader.classList.remove("hidden");
  suggestionsBox.innerHTML = "";
  document.getElementById("output").innerHTML = "";

  try {
    const res = await fetch(`${API}/ai-notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic })
    });

    const data = await res.json();

    if (!data.text) throw new Error();

    const today = new Date().toLocaleDateString();

    document.getElementById("output").innerHTML = `
      <div class="card" id="noteCard">
        <div class="card-meta-bar">
          <span>AI Generated Notes</span>
          <span>${today}</span>
        </div>

        <div class="card-body">
          <h2>${topic}</h2>

          <div style="white-space: pre-line; line-height:1.6;">
            ${data.text}
          </div>
        </div>
      </div>
    `;

    saveHistory(topic);

  } catch {
    document.getElementById("output").innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align:center;padding:30px">
          ⚠ Failed to generate notes
        </div>
      </div>
    `;
  } finally {
    loader.classList.add("hidden");
    setTimeout(() => checkServerStatus(), 1000);
  }
}

// ── History ──
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

// ── Voice ──
function startVoice() {
  let r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  r.start();
  r.onresult = e => {
    input.value = e.results[0][0].transcript;
    getNotes();
  };
}

// ── Logout ──
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}

// ── Toast ──
function showToast(msg, type="info") {
  alert(msg);
}
