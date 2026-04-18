const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const signupMessage = document.getElementById("signup-message");
const loginMessage = document.getElementById("login-message");
const passwordInput = document.getElementById("signup-password");
const passwordMeter = document.getElementById("password-meter");
const passwordHint = document.getElementById("password-hint");

function setActiveTab(tabName) {
  authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  });
  authForms.forEach((form) => {
    form.classList.toggle("is-active", form.dataset.panel === tabName);
  });
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#f87171" : "#1f7ae0";
}

function evaluatePassword(value) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

function updatePasswordMeter() {
  if (!passwordInput) return;
  const value = passwordInput.value;
  const score = evaluatePassword(value);
  const percent = (score / 4) * 100;

  passwordMeter.style.width = `${percent}%`;

  if (value.length === 0) {
    passwordMeter.style.background = "#f87171";
    passwordHint.textContent = "Start typing to see password strength.";
    return;
  }

  if (score <= 1) {
    passwordMeter.style.background = "#f87171";
    passwordHint.textContent = "Weak: add more length, numbers, or symbols.";
  } else if (score === 2) {
    passwordMeter.style.background = "#fbbf24";
    passwordHint.textContent = "Okay: try adding a symbol or uppercase letter.";
  } else if (score === 3) {
    passwordMeter.style.background = "#34d399";
    passwordHint.textContent = "Good: almost there. Add one more type for strong.";
  } else {
    passwordMeter.style.background = "#22c55e";
    passwordHint.textContent = "Strong password.";
  }
}

if (passwordInput) {
  passwordInput.addEventListener("input", updatePasswordMeter);
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(signupForm).entries());

  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  showMessage(signupMessage, data.message || "Signup done", res.ok === false);
  if (res.ok) {
    setActiveTab("login");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(loginForm).entries());

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("authToken", data.token);
    showMessage(loginMessage, "Login successful");
    window.location.href = "/profile.html";
  } else {
    showMessage(loginMessage, data.message || "Login failed", true);
  }
});
