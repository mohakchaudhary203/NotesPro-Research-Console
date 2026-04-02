const API = "https://notespro-research-console.onrender.com";

let isLogin = true;

// ── Toggle Login / Signup ──
function toggleMode() {
  isLogin = !isLogin;

  document.getElementById("title").innerText =
    isLogin ? "Student Login" : "Register Account";

  const sw = document.getElementById("switch");
  sw.innerHTML = isLogin
    ? `New student? <span>Create an account</span>`
    : `Already registered? <span>Login here</span>`;
}

document.getElementById("switch").addEventListener("click", toggleMode);

// ── AUTH FUNCTION ──
async function handleAuth() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    showToast("Please fill all fields", "error");
    return;
  }

  const endpoint = isLogin ? "login" : "signup";

  try {
    const res = await fetch(`${API}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: user,
        password: pass
      })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("loggedInUser", user);
      window.location.href = "app.html";
    } else {
      showToast(
        isLogin
          ? "Invalid credentials"
          : "User already exists",
        "error"
      );
    }

  } catch (err) {
    console.error("Auth error:", err);

    showToast(
      "Server unreachable. Open backend once and try again.",
      "error"
    );
  }
}

// ── TOAST ──
function showToast(msg, type = "info") {
  const existing = document.querySelector(".np-toast");
  if (existing) existing.remove();

  const colors = {
    success: { bg: "#1a5c35", border: "#2d8a52", color: "#e8f5ee" },
    error:   { bg: "#5c1a1a", border: "#8a3030", color: "#f5e8e8" },
    info:    { bg: "#0d2240", border: "#1e4080", color: "#dce7f5" }
  };

  const c = colors[type] || colors.info;

  const t = document.createElement("div");
  t.className = "np-toast";

  t.style.cssText = `
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: ${c.bg};
    border: 1px solid ${c.border};
    color: ${c.color};
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 0.85rem;
    z-index: 9999;
  `;

  t.textContent = msg;
  document.body.appendChild(t);

  setTimeout(() => t.remove(), 3000);
}

// ── AUTO REDIRECT IF LOGGED IN ──
if (localStorage.getItem("loggedInUser")) {
  window.location.href = "app.html";
}
