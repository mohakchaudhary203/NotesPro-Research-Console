const API = "https://notespro-research-console.onrender.com";

const user = localStorage.getItem("loggedInUser");
if (!user) window.location.href = "index.html";

const input = document.getElementById("topic");
const loader = document.getElementById("loader");
const historyList = document.getElementById("historyList");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userDisplay").textContent = "👤 " + user;
  console.log("User:", user);
  loadHistory();
});

// FORMATTER
function formatNotes(text) {
  return text
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/📌/g, "<br><br><strong>📌")
    .replace(/:\n/g, ":</strong><br>")
    .replace(/- /g, "• ");
}

// MAIN FUNCTION
async function getNotes() {
  const topic = input.value.trim();
  if (!topic) return alert("Enter topic");

  loader.classList.remove("hidden");
  document.getElementById("output").innerHTML =
    "<p>🧠 Generating notes...</p>";

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

    const formatted = formatNotes(data.text);

    document.getElementById("output").innerHTML = `
      <div class="card">
        <h2>${topic}</h2>
        <div style="line-height:1.9; max-height:500px; overflow-y:auto;">
          ${formatted}
        </div>

        <br>
        <button onclick="speakNotes()">🔊 Listen</button>
        <button onclick="downloadNotes()">📄 Download</button>
      </div>
    `;

    await saveHistory(topic);

  } catch (err) {
    console.error(err);

    document.getElementById("output").innerHTML =
      "<p>⚠ Error. Try again.</p>";
  }

  loader.classList.add("hidden");
}

// SAVE HISTORY
async function saveHistory(topic) {
  try {
    const res = await fetch(`${API}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: user,
        topic
      })
    });

    const data = await res.json();
    console.log("Saved:", data);

  } catch (err) {
    console.error("History error:", err);
  }

  loadHistory();
}

// LOAD HISTORY
async function loadHistory() {
  try {
    const res = await fetch(`${API}/history/${user}`);
    const data = await res.json();

    historyList.innerHTML = data.length
      ? data.map(i => `<li onclick="loadFromHistory('${i}')">${i}</li>`).join("")
      : "<li>No history</li>";

  } catch {
    historyList.innerHTML = "<li>Error</li>";
  }
}

// CLICK HISTORY
function loadFromHistory(t) {
  input.value = t;
  getNotes();
}

// 🔊 VOICE
function speakNotes() {
  const text = document.getElementById("output").innerText;

  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = 1;
  speech.pitch = 1;

  speechSynthesis.speak(speech);
}

// 📄 DOWNLOAD
function downloadNotes() {
  const text = document.getElementById("output").innerText;

  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "notes.txt";
  link.click();
}

// LOGOUT
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}
