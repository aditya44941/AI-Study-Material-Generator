const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "/login.html";
}

const logoutButton = document.getElementById("logout-button");
const backButton = document.getElementById("back-button");
const topicScroller = document.getElementById("topic-scroller");
const topicLevel = document.getElementById("topic-level");
const generateForm = document.getElementById("generate-form");
const resultsSection = document.getElementById("results");
const topicNameEl = document.getElementById("topic-name");
const topicLevelOutputEl = document.getElementById("topic-level-output");
const aiLoading = document.getElementById("ai-loading");
const outputContainer = document.getElementById("output-container");
const summaryList = document.getElementById("summary-list");
const explanationText = document.getElementById("explanation-text");
const realLifeText = document.getElementById("real-life-text");
const quizList = document.getElementById("quiz-list");
const pyqList = document.getElementById("pyq-list");
const keypointsList = document.getElementById("keypoints-list");
const flashcardsList = document.getElementById("flashcards-list");
const planList = document.getElementById("plan-list");
const simplerBtn = document.getElementById("simpler-btn");
const advancedBtn = document.getElementById("advanced-btn");
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const overallProgress = document.getElementById("overall-progress");
const overallBar = document.getElementById("overall-bar");
const learningStreak = document.getElementById("learning-streak");
const topicsCompleted = document.getElementById("topics-completed");
const practiceDone = document.getElementById("practice-done");
const practiceGrid = document.getElementById("practice-grid");
const toast = document.getElementById("toast");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarLogout = document.getElementById("sidebar-logout");

let profile = {};

function normalizeBranch(value) {
  const text = (value || "").toLowerCase();
  if (text.includes("ai") || text.includes("ml") || text.includes("artificial")) return "aiml";
  if (text.includes("computer") || text.includes("cse") || text.includes("cs")) return "cse";
  if (text.includes("it")) return "it";
  return "general";
}

function renderTopicCards() {
  if (!topicScroller) return;

  const branchKey = normalizeBranch(profile.branch);
  const levelText = profile.educationLevel || "General";
  const streamText = profile.branch ? profile.branch : "Core";
  if (topicLevel) {
    topicLevel.textContent = `Based on: ${levelText} - ${streamText}`;
  }

  const topicsByBranch = {
    diploma_cse: [
      { title: "Data Structures", subtitle: "Core Concepts", icon: "📘" },
      { title: "DBMS", subtitle: "Query Basics", icon: "🗃️" },
      { title: "Operating Systems", subtitle: "Process & Memory", icon: "⚙️" },
      { title: "Computer Networks", subtitle: "Protocols", icon: "💻" },
      { title: "OOP Concepts", subtitle: "Design Basics", icon: "🧱" },
      { title: "Software Engineering", subtitle: "Lifecycle", icon: "🛠️" }
    ],
    school: [
      { title: "Basic Math", subtitle: "Foundations", icon: "➗" },
      { title: "Science Concepts", subtitle: "Everyday Science", icon: "🔬" },
      { title: "Problem Solving", subtitle: "Logic Skills", icon: "🧩" },
      { title: "Communication Skills", subtitle: "Soft Skills", icon: "🗣️" }
    ],
    cse: [
      { title: "Data Structures", subtitle: "Core Concepts", icon: "📘" },
      { title: "DBMS", subtitle: "Query Basics", icon: "🗃️" },
      { title: "Operating Systems", subtitle: "Process & Memory", icon: "⚙️" },
      { title: "Computer Networks", subtitle: "Protocols", icon: "💻" },
      { title: "OOP Concepts", subtitle: "Design Basics", icon: "🧱" },
      { title: "Software Engineering", subtitle: "Lifecycle", icon: "🛠️" }
    ],
    aiml: [
      { title: "Machine Learning", subtitle: "Model Basics", icon: "🧠" },
      { title: "Neural Networks", subtitle: "Deep Learning", icon: "🤖" },
      { title: "Python for AI", subtitle: "Practical Labs", icon: "🐍" },
      { title: "Data Science", subtitle: "Insights", icon: "📊" },
      { title: "Math for AI", subtitle: "Foundations", icon: "📐" },
      { title: "Model Evaluation", subtitle: "Metrics", icon: "📈" }
    ],
    it: [
      { title: "Web Development", subtitle: "Frontend Core", icon: "🌐" },
      { title: "Databases", subtitle: "Design Basics", icon: "🗃️" },
      { title: "Networking", subtitle: "Infrastructure", icon: "🧩" },
      { title: "Cyber Security", subtitle: "Fundamentals", icon: "🛡️" },
      { title: "Cloud Basics", subtitle: "Deployment", icon: "☁️" },
      { title: "UI/UX", subtitle: "Design", icon: "🎨" }
    ],
    general: [
      { title: "Problem Solving", subtitle: "Core Skills", icon: "🧩" },
      { title: "Mathematics", subtitle: "Foundations", icon: "📐" },
      { title: "Programming Basics", subtitle: "Start Here", icon: "💡" },
      { title: "Communication", subtitle: "Soft Skills", icon: "🗣️" },
      { title: "Productivity", subtitle: "Study Skills", icon: "⏱️" },
      { title: "Critical Thinking", subtitle: "Reasoning", icon: "🧠" }
    ]
  };

  const gradients = [
    "linear-gradient(135deg, #e0f2fe, #e0f7f5)",
    "linear-gradient(135deg, #ede9fe, #fdf2f8)",
    "linear-gradient(135deg, #dcfce7, #f0fdf4)",
    "linear-gradient(135deg, #fef3c7, #fff7ed)"
  ];

  topicScroller.innerHTML = "";
  const key =
    levelText === "Diploma" && branchKey === "cse"
      ? "diploma_cse"
      : levelText === "School"
      ? "school"
      : branchKey;

  topicsByBranch[key].forEach((topic, index) => {
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
      if (levelInput) levelInput.value = `Level: ${levelText} - ${streamText}`;

      window.location.href = `/material.html?topic=${encodeURIComponent(topic.title)}`;
    });

    topicScroller.appendChild(card);
  });
}

async function fetchProfile() {
  try {
    const res = await fetch("/api/profile", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (!data.profile) {
      window.location.href = "/profile.html";
      return;
    }
    profile = data.profile;
renderTopicCards();
renderStatsAndPractice();
  } catch {
    window.location.href = "/profile.html";
  }
}

fetchProfile();

if (resultsSection) resultsSection.classList.add("is-hidden");

generateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(generateForm).entries());
  const topic = payload.subject || payload.topic || "Selected Topic";
  window.location.href = `/material.html?topic=${encodeURIComponent(topic)}`;
});

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });
}

if (sidebarLogout) {
  sidebarLogout.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });
}

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/profile.html";
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
}

function getPracticeState() {
  const stored = localStorage.getItem("practiceState");
  if (stored) return JSON.parse(stored);
  return {
    overallProgress: 42,
    streakDays: 6,
    topicsCompleted: 8,
    questionsSolved: 54,
    practiceTopics: [
      { name: "Data Structures", level: "Intermediate", progress: 55, total: 40 },
      { name: "DBMS", level: "Beginner", progress: 35, total: 30 },
      { name: "Operating Systems", level: "Advanced", progress: 70, total: 25 },
      { name: "Computer Networks", level: "Intermediate", progress: 45, total: 20 },
      { name: "OOP Concepts", level: "Beginner", progress: 30, total: 25 },
      { name: "Software Engineering", level: "Intermediate", progress: 50, total: 20 }
    ],
    lastTopic: "Data Structures"
  };
}

function savePracticeState(state) {
  localStorage.setItem("practiceState", JSON.stringify(state));
}

function renderStatsAndPractice() {
  const state = getPracticeState();
  if (overallProgress) overallProgress.textContent = `${state.overallProgress}%`;
  if (overallBar) overallBar.style.width = `${state.overallProgress}%`;
  if (learningStreak) learningStreak.textContent = state.streakDays;
  if (topicsCompleted) topicsCompleted.textContent = state.topicsCompleted;
  if (practiceDone) practiceDone.textContent = state.questionsSolved;

  if (!practiceGrid) return;
  practiceGrid.innerHTML = "";
  state.practiceTopics.forEach((topic) => {
    const card = document.createElement("div");
    card.className = "practice-card";
    card.innerHTML = `
      <div class="practice-title">${topic.name}</div>
      <div class="practice-level">Level: ${topic.level}</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${topic.progress}%"></div>
      </div>
      <div class="practice-meta">${topic.progress}% completed • ${topic.total} problems</div>
      <div class="practice-actions">
        <button class="practice-btn" type="button">View Problems</button>
        <button class="practice-btn primary" type="button">Continue ▶</button>
      </div>
    `;

    const [viewBtn, continueBtn] = card.querySelectorAll("button");
    viewBtn.addEventListener("click", () => {
      state.lastTopic = topic.name;
      savePracticeState(state);
      window.location.href = `/material.html?topic=${encodeURIComponent(topic.name)}`;
    });

    continueBtn.addEventListener("click", () => {
      state.lastTopic = topic.name;
      savePracticeState(state);
      window.location.href = `/material.html?topic=${encodeURIComponent(topic.name)}`;
    });

    practiceGrid.appendChild(card);
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}
