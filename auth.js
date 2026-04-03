const API = "https://notespro-research-console.onrender.com";

let isLogin = true;

function toggleMode() {
  isLogin = !isLogin;

  document.getElementById("title").innerText =
    isLogin ? "Student Login" : "Register Account";

  document.getElementById("switch").innerHTML =
    isLogin
      ? `New student? <span>Create an account</span>`
      : `Already registered? <span>Login here</span>`;
}

document.getElementById("switch").addEventListener("click", toggleMode);

async function handleAuth() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    alert("Fill all fields");
    return;
  }

  const endpoint = isLogin ? "login" : "signup";

  try {
    const res = await fetch(`${API}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username: user, password: pass })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("loggedInUser", user);
      window.location.href = "app.html";
    } else {
      alert(isLogin ? "Invalid login" : "User exists");
    }

  } catch (err) {
    alert("Server not responding. Try again.");
  }
}

if (localStorage.getItem("loggedInUser")) {
  window.location.href = "app.html";
}
