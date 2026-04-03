const API = "https://notespro-research-console.onrender.com";

const user = localStorage.getItem("loggedInUser");
if (!user) window.location.href = "index.html";

const input = document.getElementById("topic");
const loader = document.getElementById("loader");
const historyList = document.getElementById("historyList");

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("userDisplay").textContent = "👤 " + user;
  loadHistory();
});

// 🔥 MAIN AI FUNCTION (IMPROVED)
async function getNotes() {
  const topic = input.value.trim();
  if (!topic) return alert("Enter topic");

  loader.classList.remove("hidden");
  document.getElementById("output").innerHTML = "<p>Generating smart notes...</p>";

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

    if (!data.text) throw new Error();

    // 🔥 FORMAT OUTPUT CLEANLY
    const formatted = data.text
      .replace(/\n/g, "<br>")
      .replace(/📌/g, "<br><br>📌")
      .replace(/- /g, "• ");

    document.getElementById("output").innerHTML = `
      <div class="card">
        <h2>${topic}</h2>
        <div class="notes-content">
          ${formatted}
        </div>
      </div>
    `;

    saveHistory(topic);

  } catch {
    document.getElementById("output").innerHTML =
      "<p>⚠ Server waking up... try again</p>";
  }

  loader.classList.add("hidden");
}

// HISTORY
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

function logout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "index.html";
}
