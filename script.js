const API = "https://notespro-research-console.onrender.com";

const user = localStorage.getItem("loggedInUser");
if (!user) window.location.href = "index.html";

const input = document.getElementById("topic");
const loader = document.getElementById("loader");
const historyList = document.getElementById("historyList");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userDisplay").textContent = "👤 " + user;
  console.log("Logged in user:", user);
  loadHistory();
});

// 🔥 FORMATTER
function formatNotes(text) {
  return text
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/📌/g, "<br><br><strong style='color:#60a5fa;'>📌")
    .replace(/:\n/g, ":</strong><br>")
    .replace(/- /g, "• ");
}

// 🔥 MAIN AI FUNCTION
async function getNotes() {
  const topic = input.value.trim();
  if (!topic) return alert("Enter topic");

  loader.classList.remove("hidden");
  document.getElementById("output").innerHTML =
    "<p>🧠 Generating detailed notes...</p>";

  try {
    let res;

    // retry logic (Render sleep fix)
    for (let i = 0; i < 2; i++) {
      try {
        res = await fetch(`${API}/ai-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic })
        });

        if (res.ok) break;
      } catch {}

      await new Promise(r => setTimeout(r, 2000));
    }

    const data = await res.json();

    if (!data.text) throw new Error("No AI response");

    const formatted = formatNotes(data.text);

    document.getElementById("output").innerHTML = `
      <div class="card">
        <h2>${topic}</h2>
        <div style="
          line-height:1.9;
          font-size:15px;
          max-height:500px;
          overflow-y:auto;
          padding-right:10px;
        ">
          ${formatted}
        </div>
      </div>
    `;

    // ✅ SAVE HISTORY AFTER SUCCESS
    await saveHistory(topic);

  } catch (err) {
    console.error("AI ERROR:", err);

    document.getElementById("output").innerHTML = `
      <div class="card">
        ⚠ Server waking up or AI error.<br><br>
        Try again in a few seconds.
      </div>
    `;
  }

  loader.classList.add("hidden");
}

// 🔥 SAVE HISTORY (FIXED)
async function saveHistory(topic) {
  try {
    const res = await fetch(`${API}/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: user,
        topic: topic
      })
    });

    const data = await res.json();
    console.log("History saved:", data);

  } catch (err) {
    console.error("History save failed:", err);
  }

  // reload after saving
  loadHistory();
}

// 🔥 LOAD HISTORY (FIXED)
async function loadHistory() {
  try {
    const res = await fetch(`${API}/history/${user}`);
    const data = await res.json();

    console.log("History loaded:", data);

    historyList.innerHTML = data.length
      ? data.map(i => `<li onclick="loadFromHistory('${i}')">${i}</li>`).join("")
      : "<li>No history</li>";

  } catch (err) {
    console.error("History load error:", err);
    historyList.innerHTML = "<li>Error loading</li>";
  }
}

// LOAD FROM HISTORY
function loadFromHistory(t) {
  input.value = t;
  getNotes();
}

// LOGOUT
function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}
