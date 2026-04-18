const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const profileForm = document.getElementById("profile-form");
const generateForm = document.getElementById("generate-form");

const authScreen = document.getElementById("auth-screen");
const appContent = document.getElementById("app-content");
const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");

const signupMessage = document.getElementById("signup-message");
const loginMessage = document.getElementById("login-message");
const profileMessage = document.getElementById("profile-message");

const summaryEl = document.getElementById("summary");
const notesEl = document.getElementById("notes");
const quizEl = document.getElementById("quiz");
const passwordInput = document.getElementById("signup-password");
const passwordMeter = document.getElementById("password-meter");
const passwordHint = document.getElementById("password-hint");
const logoutButton = document.getElementById("logout-button");
const generatorPage = document.getElementById("generator-page");
const resultsSection = document.getElementById("results");
const profileNote = document.getElementById("profile-note");
const educationLevelSelect = document.getElementById("education-level");
const levelSpecificFields = document.getElementById("level-specific-fields");
const topicSection = document.getElementById("topic-section");
const topicScroller = document.getElementById("topic-scroller");
const topicLevel = document.getElementById("topic-level");
const neoLine1 = document.getElementById("neo-line-1");
const neoLine2 = document.getElementById("neo-line-2");
const neoLine3 = document.getElementById("neo-line-3");
const neoLine4 = document.getElementById("neo-line-4");

let token = "";

function setActiveTab(tabName) {
  authTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  });
  authForms.forEach((form) => {
    form.classList.toggle("is-active", form.dataset.panel === tabName);
  });
}

function enterApp() {
  authScreen.classList.add("is-hidden");
  appContent.classList.remove("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnToAuth() {
  appContent.classList.add("is-hidden");
  authScreen.classList.remove("is-hidden");
  setActiveTab("login");
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.tab);
  });
});

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

function renderLevelFields(level) {
  if (!levelSpecificFields) return;
  let html = "";

  if (level === "Engineering" || level === "Diploma") {
    html = `
      <label>
        Branch
        <input type="text" name="branch" list="branch-suggestions" required />
      </label>
      <datalist id="branch-suggestions">
        <option value="Computer Science"></option>
        <option value="Information Technology"></option>
        <option value="Electronics & Communication"></option>
        <option value="Electrical"></option>
        <option value="Mechanical"></option>
        <option value="Civil"></option>
      </datalist>
      <label>
        Semester
        <input type="text" name="semester" list="semester-suggestions" required />
      </label>
      <datalist id="semester-suggestions">
        <option value="Semester 1"></option>
        <option value="Semester 2"></option>
        <option value="Semester 3"></option>
        <option value="Semester 4"></option>
        <option value="Semester 5"></option>
        <option value="Semester 6"></option>
        <option value="Semester 7"></option>
        <option value="Semester 8"></option>
      </datalist>
    `;
  }

  if (level === "School") {
    html = `
      <label>
        Class
        <input type="text" name="semester" list="class-suggestions" required />
      </label>
      <datalist id="class-suggestions">
        <option value="Class 6"></option>
        <option value="Class 7"></option>
        <option value="Class 8"></option>
        <option value="Class 9"></option>
        <option value="Class 10"></option>
        <option value="Class 11"></option>
        <option value="Class 12"></option>
      </datalist>
      <label>
        Stream
        <input type="text" name="branch" list="stream-suggestions" required />
      </label>
      <datalist id="stream-suggestions">
        <option value="Science"></option>
        <option value="Commerce"></option>
        <option value="Arts"></option>
        <option value="General"></option>
      </datalist>
    `;
  }

  levelSpecificFields.innerHTML = html;
}

if (educationLevelSelect) {
  educationLevelSelect.addEventListener("change", (e) => {
    renderLevelFields(e.target.value);
    wireSuggestionDropdowns();
  });
  renderLevelFields(educationLevelSelect.value);
}

function wireSuggestionDropdowns() {
  const inputs = document.querySelectorAll("input[list]");
  inputs.forEach((input) => {
    if (input.dataset.suggestReady === "true") return;
    const listId = input.getAttribute("list");
    const dataList = document.getElementById(listId);
    if (!dataList) return;

    const wrapper = document.createElement("div");
    wrapper.className = "suggestion-wrap";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "suggestion-toggle";
    toggle.setAttribute("aria-label", "Show options");
    wrapper.appendChild(toggle);

    const box = document.createElement("div");
    box.className = "suggestion-box";
    box.setAttribute("aria-hidden", "true");
    wrapper.appendChild(box);

    const options = Array.from(dataList.options).map((opt) => opt.value);
    const renderOptions = (filter) => {
      const value = (filter || "").toLowerCase();
      const filtered = options.filter((opt) => opt.toLowerCase().includes(value));
      box.innerHTML = "";
      if (filtered.length === 0) {
        box.classList.remove("is-open");
        box.setAttribute("aria-hidden", "true");
        return;
      }
      filtered.forEach((opt) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "suggestion-item";
        item.textContent = opt;
        item.addEventListener("click", () => {
          input.value = opt;
          box.classList.remove("is-open");
          box.setAttribute("aria-hidden", "true");
        });
        box.appendChild(item);
      });
      box.classList.add("is-open");
      box.setAttribute("aria-hidden", "false");
    };

    const showBox = () => renderOptions(input.value);
    const hideBox = () => {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
    };

    input.addEventListener("focus", showBox);
    input.addEventListener("click", showBox);
    input.addEventListener("input", () => renderOptions(input.value));
    input.addEventListener("blur", () => {
      setTimeout(hideBox, 120);
    });
    toggle.addEventListener("click", () => {
      if (box.classList.contains("is-open")) {
        hideBox();
      } else {
        showBox();
      }
    });
    toggle.addEventListener("mouseenter", showBox);

    input.setAttribute("autocomplete", "off");
    input.removeAttribute("list");
    dataList.remove();
    input.dataset.suggestReady = "true";
  });
}

wireSuggestionDropdowns();

async function typeLine(el, text, speed = 45) {
  el.textContent = "";
  el.classList.add("show");
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    await new Promise((r) => setTimeout(r, speed));
  }
}

function thinkingDots() {
  return `<span class="thinking"><span></span><span></span><span></span></span>`;
}

async function runNeoDeskDemo() {
  if (!neoLine1 || !neoLine2 || !neoLine3 || !neoLine4) return;
  while (true) {
    [neoLine1, neoLine2, neoLine3, neoLine4].forEach((el) => {
      el.classList.remove("show");
      el.innerHTML = "";
    });

    await typeLine(neoLine1, "Enter topic: Data Structures");
    await new Promise((r) => setTimeout(r, 500));

    neoLine2.classList.add("show");
    neoLine2.innerHTML = `🤖 <span class="ai-highlight">AI</span> is analyzing your level ${thinkingDots()}`;
    await new Promise((r) => setTimeout(r, 1200));

    await typeLine(neoLine3, "Generating personalized study materials...");
    await new Promise((r) => setTimeout(r, 600));

    neoLine4.classList.add("show");
    neoLine4.innerHTML = `<div class="result-list">
      <div>✔ Smart notes ready</div>
      <div>✔ Practice questions generated</div>
      <div>✔ Previous year papers found</div>
    </div>`;

    await new Promise((r) => setTimeout(r, 1800));
  }
}

runNeoDeskDemo();

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#f87171" : "#1f7ae0";
}

const storedToken = localStorage.getItem("authToken");
if (storedToken) {
  token = storedToken;
  enterApp();
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const payload = Object.fromEntries(formData.entries());

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
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    token = data.token;
    localStorage.setItem("authToken", token);
    showMessage(loginMessage, "Login successful");
    enterApp();
  } else {
    showMessage(loginMessage, data.message || "Login failed", true);
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    token = "";
    localStorage.removeItem("authToken");
    loginForm.reset();
    signupForm.reset();
    profileForm.reset();
    generateForm.reset();
    showMessage(loginMessage, "");
    showMessage(signupMessage, "");
    showMessage(profileMessage, "");
    if (generatorPage) generatorPage.classList.add("is-hidden");
    if (resultsSection) resultsSection.classList.add("is-hidden");
    if (profileNote) profileNote.classList.remove("is-hidden");
    if (topicSection) topicSection.classList.add("is-hidden");
    if (topicScroller) topicScroller.innerHTML = "";
    returnToAuth();
  });
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (token === "") return showMessage(profileMessage, "Login first", true);

  const formData = new FormData(profileForm);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch("/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  showMessage(profileMessage, data.message || "Profile saved", res.ok === false);
  if (res.ok) {
    if (resultsSection) resultsSection.classList.add("is-hidden");
    if (profileNote) profileNote.classList.add("is-hidden");
    renderTopicCards(payload);
    topicSection?.scrollIntoView({ behavior: "smooth" });
  }
});

generateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (token === "") return alert("Login first");

  const formData = new FormData(generateForm);
  const payload = Object.fromEntries(formData.entries());

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok === false) return alert(data.message || "Error generating");

  summaryEl.textContent = data.materials.summary;

  notesEl.innerHTML = "";
  data.materials.notes.forEach((note) => {
    const li = document.createElement("li");
    li.textContent = note;
    notesEl.appendChild(li);
  });

  quizEl.innerHTML = "";
  data.materials.quiz.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    quizEl.appendChild(li);
  });

  if (resultsSection) resultsSection.classList.remove("is-hidden");
  resultsSection?.scrollIntoView({ behavior: "smooth" });
});

function normalizeBranch(value) {
  const text = (value || "").toLowerCase();
  if (text.includes("ai") || text.includes("ml") || text.includes("artificial")) return "aiml";
  if (text.includes("computer") || text.includes("cse") || text.includes("cs")) return "cse";
  if (text.includes("it")) return "it";
  return "general";
}

function renderTopicCards(profile) {
  if (!topicSection || !topicScroller) return;

  const branchKey = normalizeBranch(profile.branch);
  const levelText = profile.educationLevel || "General";
  if (topicLevel) {
    topicLevel.textContent = `Level: ${levelText} - ${levelText === "Engineering" ? "Advanced" : "Core"}`;
  }

  const topicsByBranch = {
    cse: [
      { title: "Data Structures", subtitle: "Core Concepts", icon: "📘" },
      { title: "DBMS", subtitle: "Query Basics", icon: "🗃️" },
      { title: "Operating Systems", subtitle: "Process & Memory", icon: "⚙️" },
      { title: "Computer Networks", subtitle: "Protocols", icon: "💻" }
    ],
    aiml: [
      { title: "Machine Learning", subtitle: "Model Basics", icon: "🧠" },
      { title: "Neural Networks", subtitle: "Deep Learning", icon: "🤖" },
      { title: "Python for AI", subtitle: "Practical Labs", icon: "🐍" },
      { title: "Data Science", subtitle: "Insights", icon: "📊" }
    ],
    it: [
      { title: "Web Development", subtitle: "Frontend Core", icon: "🌐" },
      { title: "Databases", subtitle: "Design Basics", icon: "🗃️" },
      { title: "Networking", subtitle: "Infrastructure", icon: "🧩" },
      { title: "Cyber Security", subtitle: "Fundamentals", icon: "🛡️" }
    ],
    general: [
      { title: "Problem Solving", subtitle: "Core Skills", icon: "🧩" },
      { title: "Mathematics", subtitle: "Foundations", icon: "📐" },
      { title: "Programming Basics", subtitle: "Start Here", icon: "💡" },
      { title: "Communication", subtitle: "Soft Skills", icon: "🗣️" }
    ]
  };

  const gradients = [
    "linear-gradient(135deg, #e0f2fe, #e0f7f5)",
    "linear-gradient(135deg, #ede9fe, #fdf2f8)",
    "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    "linear-gradient(135deg, #fef3c7, #fff7ed)"
  ];

  topicScroller.innerHTML = "";
  topicsByBranch[branchKey].forEach((topic, index) => {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.style.background = gradients[index % gradients.length];
    card.style.animationDelay = `${index * 0.08}s`;
    card.innerHTML = `
      <div class="topic-icon">${topic.icon}</div>
      <div class="topic-title">${topic.title}</div>
      <div class="topic-sub">${topic.subtitle}</div>
      <button class="topic-action" type="button">Start Learning ▶</button>
    `;

    card.querySelector(".topic-action").addEventListener("click", () => {
      const subjectInput = generateForm.querySelector("input[name='subject']");
      const topicInput = generateForm.querySelector("input[name='topic']");
      const levelInput = generateForm.querySelector("input[name='level']");

      if (subjectInput) subjectInput.value = topic.title;
      if (topicInput) topicInput.value = topic.subtitle;
      if (levelInput) levelInput.value = `${levelText} - ${levelText === "Engineering" ? "Advanced" : "Core"}`;

      if (generatorPage) generatorPage.classList.remove("is-hidden");
      generatorPage?.scrollIntoView({ behavior: "smooth" });
    });

    topicScroller.appendChild(card);
  });

  topicSection.classList.remove("is-hidden");
}
