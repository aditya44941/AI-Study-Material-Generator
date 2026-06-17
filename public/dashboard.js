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
const overallProgress = document.getElementById("overall-progress");
const overallBar = document.getElementById("overall-bar");
const learningStreak = document.getElementById("learning-streak");
const topicsCompleted = document.getElementById("topics-completed");
const practiceDone = document.getElementById("practice-done");
const practiceGrid = document.getElementById("practice-grid");
const toast = document.getElementById("toast");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarLogout = document.getElementById("sidebar-logout");
const profileTrigger = document.getElementById("profile-trigger");
const profileDropdown = document.getElementById("profile-dropdown");
const profileMenuLogout = document.getElementById("profile-menu-logout");
const profileAvatar = document.getElementById("profile-avatar");
const profileAvatarLarge = document.getElementById("profile-avatar-large");
const profileName = document.getElementById("profile-name");
const profileBatch = document.getElementById("profile-batch");
const navBack = document.getElementById("nav-back");
const navForward = document.getElementById("nav-forward");

let profile = {};
let statsState = null; // loaded from server, NOT localStorage

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEmptyStats() {
  return {
    overallProgress: 0,
    streakDays: 0,
    topicsCompleted: 0,
    questionsSolved: 0,
    practiceTopics: [],
    profileKey: ""
  };
}

function normalizeBranch(value) {
  const text = (value || "").toLowerCase();
  if (text.includes("ai") || text.includes("ml") || text.includes("artificial")) return "aiml";
  if (text.includes("computer") || text.includes("cse") || text.includes("cs")) return "cse";
  if (text.includes("it")) return "it";
  return "general";
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderProfileMenu() {
  const username = profile.username || profile.email || "Student";
  const initial = username.trim().charAt(0).toUpperCase() || "N";
  const level = profile.educationLevel || "Learner";
  const stream = profile.branch || "General";
  const avatarUrl = profile.avatarUrl || "";

  [profileAvatar, profileAvatarLarge].filter(Boolean).forEach((avatar) => {
    avatar.innerHTML = "";
    avatar.style.backgroundImage = "";
    if (avatarUrl) {
      avatar.style.backgroundImage = `url("${avatarUrl}")`;
      avatar.classList.add("has-photo");
    } else {
      avatar.textContent = initial;
      avatar.classList.remove("has-photo");
    }
  });
  if (profileName) profileName.textContent = username;
  if (profileBatch) profileBatch.textContent = `${level} - ${stream}`;
}

// ─── Stats: load from server ────────────────────────────────────────────────

async function fetchStats() {
  try {
    const res = await fetch("/api/stats", {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      statsState = getEmptyStats();
      return;
    }

    const data = await res.json();
    statsState = data.stats || getEmptyStats();
  } catch {
    statsState = getEmptyStats();
  }
}

// ─── Stats: save to server ──────────────────────────────────────────────────

async function saveStats() {
  if (!statsState) return;
  try {
    await fetch("/api/stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(statsState)
    });
  } catch {
    // silent fail — data still in memory for this session
  }
}

// ─── Render stats cards ─────────────────────────────────────────────────────

function renderStatsCards() {
  if (!statsState) return;
  if (overallProgress) overallProgress.textContent = `${statsState.overallProgress}%`;
  if (overallBar) overallBar.style.width = `${statsState.overallProgress}%`;
  if (learningStreak) learningStreak.textContent = statsState.streakDays;
  if (topicsCompleted) topicsCompleted.textContent = statsState.topicsCompleted;
  if (practiceDone) practiceDone.textContent = statsState.questionsSolved;
}

// ─── Profile-based recommendation data ─────────────────────────────────────

const videoGrid = document.getElementById("video-grid");
const videoTitle = document.getElementById("video-title");
const videoSubtitle = document.getElementById("video-subtitle");

const gradients = [
  "linear-gradient(135deg, #e0f2fe, #e0f7f5)",
  "linear-gradient(135deg, #ede9fe, #fdf2f8)",
  "linear-gradient(135deg, #dcfce7, #f0fdf4)",
  "linear-gradient(135deg, #fef3c7, #fff7ed)",
  "linear-gradient(135deg, #dbeafe, #f0f9ff)",
  "linear-gradient(135deg, #fae8ff, #fefce8)"
];

function getSemesterNumber(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function getProfileKey(prof) {
  return [prof.educationLevel, prof.branch, prof.semester].filter(Boolean).join("|").toLowerCase();
}

function makePracticeTopic(topic, index) {
  const levels = ["Beginner", "Intermediate", "Advanced"];
  return {
    name: topic.title,
    level: topic.difficulty || levels[index % levels.length],
    progress: 0,
    total: topic.total || (20 + (index % 4) * 5)
  };
}

function getSchoolRecommendations(prof) {
  const schoolClass = getSemesterNumber(prof.semester);
  const classLabel = schoolClass ? `Class ${schoolClass}` : "Class 5-10";
  return {
    label: `School - ${classLabel}`,
    hint: "Foundation topics matched for middle and high school revision.",
    topics: [
      {
        title: "Earth's Ecosystems & Natural Resources",
        subtitle: "Biomes, water cycle, resources",
        icon: "🌍",
        difficulty: schoolClass >= 8 ? "Intermediate" : "Beginner",
        total: 24
      },
      {
        title: "Matter and Chemical Reactions",
        subtitle: "Atoms, states, equations",
        icon: "⚗️",
        difficulty: schoolClass >= 8 ? "Intermediate" : "Beginner",
        total: 26
      },
      {
        title: "Laws of Motion and Energy",
        subtitle: "Force, friction, kinetic energy",
        icon: "⚙️",
        difficulty: schoolClass >= 9 ? "Intermediate" : "Beginner",
        total: 28
      },
      {
        title: "Cell Biology & Human Physiology",
        subtitle: "Cells, organs, photosynthesis",
        icon: "🧬",
        difficulty: "Intermediate",
        total: 25
      },
      {
        title: "Electricity & Electromagnetism",
        subtitle: "Circuits, Ohm's law, magnets",
        icon: "⚡",
        difficulty: schoolClass >= 9 ? "Advanced" : "Intermediate",
        total: 30
      },
      {
        title: "Democratic Institutions & Civics",
        subtitle: "Rights, duties, Constitution",
        icon: "🏛️",
        difficulty: "Beginner",
        total: 22
      }
    ],
    videos: [
      {
        title: "School Science Foundations",
        note: "Useful for ecosystems, matter, cells, and electricity basics.",
        embed: "https://www.youtube.com/embed/videoseries?list=PL8dPuuaLjXtO8YgPlCPCXHf0YVY4ZVQJI",
        search: "https://www.youtube.com/results?search_query=class+8+9+10+science+ecosystem+matter+electricity"
      },
      {
        title: "Physics: Motion and Energy",
        note: "Start here for Newton's laws, force, work, and energy.",
        embed: "https://www.youtube.com/embed/videoseries?list=PL8dPuuaLjXtN0ge7yDk_UA0ldZJdhwkoV",
        search: "https://www.youtube.com/results?search_query=school+physics+newton+laws+motion+energy"
      },
      {
        title: "Civics and Constitution",
        note: "Best for revising democracy, rights, duties, and institutions.",
        embed: "https://www.youtube.com/embed?listType=search&list=class%209%2010%20civics%20indian%20constitution",
        search: "https://www.youtube.com/results?search_query=class+9+10+civics+indian+constitution"
      }
    ]
  };
}

function getDiplomaRecommendations(prof) {
  const stream = String(prof.branch || "").toLowerCase();
  const isCommerce = stream.includes("commerce") || stream.includes("business") || stream.includes("account");
  const isComputer = stream.includes("computer") || stream.includes("cse") || stream.includes("it") || stream.includes("cs");

  if (isCommerce) {
    return {
      label: "Diploma / College - Commerce",
      hint: "Commerce topics selected for accounting, management, economics, and law.",
      topics: [
        { title: "Financial Accounting", subtitle: "Journal, ledger, final accounts", icon: "📒", difficulty: "Beginner", total: 30 },
        { title: "Principles of Management", subtitle: "Planning to controlling", icon: "🧭", difficulty: "Beginner", total: 24 },
        { title: "Micro & Macro Economics", subtitle: "Markets and national income", icon: "📈", difficulty: "Intermediate", total: 28 },
        { title: "Business Law & Ethics", subtitle: "Contracts and consumer law", icon: "⚖️", difficulty: "Intermediate", total: 24 },
        { title: "Cost Accounting", subtitle: "Cost sheets and budgeting", icon: "🧾", difficulty: "Advanced", total: 26 }
      ],
      videos: [
        {
          title: "Financial Accounting Basics",
          note: "Use this for journals, ledgers, trial balance, and final accounts.",
          embed: "https://www.youtube.com/embed?listType=search&list=financial%20accounting%20journal%20ledger%20trial%20balance",
          search: "https://www.youtube.com/results?search_query=financial+accounting+journal+ledger+trial+balance"
        },
        {
          title: "Principles of Management",
          note: "Good for planning, organizing, directing, and controlling.",
          embed: "https://www.youtube.com/embed?listType=search&list=principles%20of%20management%20planning%20organizing%20directing%20controlling",
          search: "https://www.youtube.com/results?search_query=principles+of+management+planning+organizing+directing+controlling"
        },
        {
          title: "Economics for Commerce",
          note: "Covers demand, supply, markets, and national income basics.",
          embed: "https://www.youtube.com/embed?listType=search&list=microeconomics%20macroeconomics%20commerce%20demand%20supply",
          search: "https://www.youtube.com/results?search_query=microeconomics+macroeconomics+commerce+demand+supply"
        }
      ]
    };
  }

  if (isComputer) {
    return {
      label: "Diploma / College - Computer Science",
      hint: "Computer science topics selected for practical programming and systems learning.",
      topics: [
        { title: "Computer Programming Basics", subtitle: "Algorithms, Python, C", icon: "💻", difficulty: "Beginner", total: 30 },
        { title: "Data Structures", subtitle: "Arrays, stacks, queues", icon: "📘", difficulty: "Intermediate", total: 35 },
        { title: "DBMS", subtitle: "Tables, SQL, normalization", icon: "🗃️", difficulty: "Intermediate", total: 30 },
        { title: "Operating Systems", subtitle: "Processes and memory", icon: "⚙️", difficulty: "Advanced", total: 28 },
        { title: "Computer Networks", subtitle: "Protocols and layers", icon: "🌐", difficulty: "Intermediate", total: 26 },
        { title: "Software Engineering", subtitle: "SDLC and testing", icon: "🛠️", difficulty: "Beginner", total: 24 }
      ],
      videos: [
        {
          title: "Programming Basics",
          note: "Start here for algorithms, variables, loops, and functions.",
          embed: "https://www.youtube.com/embed?listType=search&list=python%20c%20programming%20basics%20for%20diploma%20students",
          search: "https://www.youtube.com/results?search_query=python+c+programming+basics+for+diploma+students"
        },
        {
          title: "DBMS and SQL",
          note: "Useful for tables, SQL queries, keys, and normalization.",
          embed: "https://www.youtube.com/embed?listType=search&list=dbms%20sql%20normalization%20tutorial",
          search: "https://www.youtube.com/results?search_query=dbms+sql+normalization+tutorial"
        },
        {
          title: "Operating System Basics",
          note: "Best for process scheduling, memory, and file systems.",
          embed: "https://www.youtube.com/embed?listType=search&list=operating%20system%20basics%20process%20memory%20management",
          search: "https://www.youtube.com/results?search_query=operating+system+basics+process+memory+management"
        }
      ]
    };
  }

  return {
    label: "Diploma / College - Science",
    hint: "Science topics selected for first and second year fundamentals.",
    topics: [
      { title: "Calculus & Differential Equations", subtitle: "Limits, derivatives, integrals", icon: "∫", difficulty: "Intermediate", total: 32 },
      { title: "Thermodynamics & Optics", subtitle: "Heat laws and wave optics", icon: "🔭", difficulty: "Intermediate", total: 30 },
      { title: "Organic Chemistry & Spectroscopy", subtitle: "Carbon compounds and spectra", icon: "🧪", difficulty: "Advanced", total: 30 },
      { title: "Genetics & Molecular Biology", subtitle: "DNA, protein, inheritance", icon: "🧬", difficulty: "Intermediate", total: 28 },
      { title: "Computer Programming Basics", subtitle: "Algorithms in Python or C", icon: "💻", difficulty: "Beginner", total: 24 }
    ],
    videos: [
      {
        title: "Calculus and Differential Equations",
        note: "Use this to revise limits, differentiation, integration, and first-order equations.",
        embed: "https://www.youtube.com/embed/videoseries?list=PL590CCC2BC5AF3BC1",
        search: "https://www.youtube.com/results?search_query=calculus+differential+equations+first+year+college"
      },
      {
        title: "Thermodynamics and Optics",
        note: "Good for laws of thermodynamics and wave nature of light.",
        embed: "https://www.youtube.com/embed?listType=search&list=thermodynamics%20optics%20college%20physics",
        search: "https://www.youtube.com/results?search_query=thermodynamics+optics+college+physics"
      },
      {
        title: "Organic Chemistry and Biology",
        note: "Use this for reaction mechanisms, DNA, and molecular biology basics.",
        embed: "https://www.youtube.com/embed/videoseries?list=PL8dPuuaLjXtONguuhLdVmq0HTKS0jksS4",
        search: "https://www.youtube.com/results?search_query=organic+chemistry+genetics+molecular+biology+college"
      }
    ]
  };
}

function getEngineeringRecommendations(prof) {
  const sem = getSemesterNumber(prof.semester);
  if (sem <= 2) {
    return {
      label: `Engineering - Semester ${sem || "1-2"}`,
      hint: "Foundation engineering subjects selected for first-year study.",
      topics: [
        { title: "Engineering Mathematics", subtitle: "Linear algebra and transforms", icon: "📐", difficulty: "Intermediate", total: 35 },
        { title: "Engineering Mechanics", subtitle: "Forces and equilibrium", icon: "⚙️", difficulty: "Intermediate", total: 30 },
        { title: "Basic Electrical Engineering", subtitle: "Circuits and machines", icon: "⚡", difficulty: "Beginner", total: 28 },
        { title: "Programming for Problem Solving", subtitle: "C/Python fundamentals", icon: "💻", difficulty: "Beginner", total: 32 },
        { title: "Engineering Graphics", subtitle: "Projection and drawing", icon: "📏", difficulty: "Beginner", total: 24 }
      ],
      videos: [
        {
          title: "Engineering Mathematics",
          note: "Best for linear algebra, calculus, and transforms.",
          embed: "https://www.youtube.com/embed/videoseries?list=PL221E2BBF13BECF6C",
          search: "https://www.youtube.com/results?search_query=engineering+mathematics+linear+algebra+transforms"
        },
        {
          title: "Programming for Problem Solving",
          note: "Use this for algorithms, C/Python basics, and problem solving.",
          embed: "https://www.youtube.com/embed?listType=search&list=programming%20for%20problem%20solving%20engineering%20first%20year",
          search: "https://www.youtube.com/results?search_query=programming+for+problem+solving+engineering+first+year"
        },
        {
          title: "Basic Electrical Engineering",
          note: "Good for circuits, Ohm's law, AC/DC, and electrical machines.",
          embed: "https://www.youtube.com/embed?listType=search&list=basic%20electrical%20engineering%20circuits%20first%20year",
          search: "https://www.youtube.com/results?search_query=basic+electrical+engineering+circuits+first+year"
        }
      ]
    };
  }

  if (sem <= 4) {
    return {
      label: `Engineering - Semester ${sem}`,
      hint: "Core branch subjects selected for second-year engineering.",
      topics: [
        { title: "Data Structures & Algorithms", subtitle: "Arrays, trees, complexity", icon: "🌳", difficulty: "Intermediate", total: 40 },
        { title: "Fluid Mechanics", subtitle: "Flow, pressure, Bernoulli", icon: "💧", difficulty: "Advanced", total: 30 },
        { title: "Electronic Circuits", subtitle: "Diodes, BJTs, amplifiers", icon: "🔌", difficulty: "Intermediate", total: 30 },
        { title: "Thermodynamics", subtitle: "Cycles and entropy", icon: "🔥", difficulty: "Advanced", total: 28 },
        { title: "Material Science", subtitle: "Properties and structures", icon: "🧱", difficulty: "Intermediate", total: 24 }
      ],
      videos: [
        {
          title: "Data Structures and Algorithms",
          note: "Use this for arrays, linked lists, stacks, queues, trees, and complexity.",
          embed: "https://www.youtube.com/embed?listType=search&list=data%20structures%20and%20algorithms%20engineering",
          search: "https://www.youtube.com/results?search_query=data+structures+and+algorithms+engineering"
        },
        {
          title: "Fluid Mechanics / Thermodynamics",
          note: "Good for Bernoulli equation, heat, work, and thermodynamic cycles.",
          embed: "https://www.youtube.com/embed?listType=search&list=fluid%20mechanics%20thermodynamics%20engineering",
          search: "https://www.youtube.com/results?search_query=fluid+mechanics+thermodynamics+engineering"
        },
        {
          title: "Electronic Circuits",
          note: "Use this for diode circuits, transistors, and amplifier basics.",
          embed: "https://www.youtube.com/embed?listType=search&list=electronic%20circuits%20diodes%20transistors%20amplifiers",
          search: "https://www.youtube.com/results?search_query=electronic+circuits+diodes+transistors+amplifiers"
        }
      ]
    };
  }

  if (sem <= 6) {
    return {
      label: `Engineering - Semester ${sem}`,
      hint: "Specialization subjects selected for third-year engineering.",
      topics: [
        { title: "Database Management Systems", subtitle: "SQL, ER model, normalization", icon: "🗃️", difficulty: "Intermediate", total: 35 },
        { title: "Microprocessors", subtitle: "Architecture and assembly", icon: "🧠", difficulty: "Advanced", total: 30 },
        { title: "Machine Design", subtitle: "Shafts, gears, design safety", icon: "🛠️", difficulty: "Advanced", total: 30 },
        { title: "Control Systems", subtitle: "Feedback and stability", icon: "🎛️", difficulty: "Advanced", total: 28 },
        { title: "Power Systems", subtitle: "Generation and transmission", icon: "🏭", difficulty: "Intermediate", total: 26 },
        { title: "Geotechnical Engineering", subtitle: "Soil and foundation", icon: "🏗️", difficulty: "Intermediate", total: 24 }
      ],
      videos: [
        {
          title: "DBMS and SQL",
          note: "Useful for ER diagrams, relational model, SQL, and normalization.",
          embed: "https://www.youtube.com/embed?listType=search&list=dbms%20sql%20normalization%20engineering",
          search: "https://www.youtube.com/results?search_query=dbms+sql+normalization+engineering"
        },
        {
          title: "Microprocessors and Control Systems",
          note: "Good for CPU architecture, assembly basics, feedback, and stability.",
          embed: "https://www.youtube.com/embed?listType=search&list=microprocessors%20control%20systems%20engineering",
          search: "https://www.youtube.com/results?search_query=microprocessors+control+systems+engineering"
        },
        {
          title: "Power / Machine / Geotechnical Subjects",
          note: "Use this for branch-specific mechanical, electrical, and civil specialization.",
          embed: "https://www.youtube.com/embed?listType=search&list=machine%20design%20power%20systems%20geotechnical%20engineering",
          search: "https://www.youtube.com/results?search_query=machine+design+power+systems+geotechnical+engineering"
        }
      ]
    };
  }

  return {
    label: `Engineering - Semester ${sem || "7-8"}`,
    hint: "Advanced subjects and project topics selected for final-year engineering.",
    topics: [
      { title: "Artificial Intelligence", subtitle: "Search, learning, reasoning", icon: "🤖", difficulty: "Advanced", total: 35 },
      { title: "Embedded Systems", subtitle: "MCUs and real-time systems", icon: "🔧", difficulty: "Advanced", total: 30 },
      { title: "Project Management", subtitle: "Planning and execution", icon: "📋", difficulty: "Intermediate", total: 24 },
      { title: "Cloud Computing", subtitle: "Deployment and scaling", icon: "☁️", difficulty: "Advanced", total: 30 },
      { title: "Industrial Capstone Project", subtitle: "Research to delivery", icon: "🏁", difficulty: "Advanced", total: 26 }
    ],
    videos: [
      {
        title: "Artificial Intelligence",
        note: "Use this for AI foundations, search, ML basics, and reasoning.",
        embed: "https://www.youtube.com/embed?listType=search&list=artificial%20intelligence%20engineering%20course",
        search: "https://www.youtube.com/results?search_query=artificial+intelligence+engineering+course"
      },
      {
        title: "Cloud and Embedded Systems",
        note: "Good for cloud architecture, IoT, microcontrollers, and real-time systems.",
        embed: "https://www.youtube.com/embed?listType=search&list=cloud%20computing%20embedded%20systems%20engineering",
        search: "https://www.youtube.com/results?search_query=cloud+computing+embedded+systems+engineering"
      },
      {
        title: "Final Year Project Guidance",
        note: "Use this for capstone planning, documentation, demos, and project management.",
        embed: "https://www.youtube.com/embed?listType=search&list=engineering%20final%20year%20project%20management%20capstone",
        search: "https://www.youtube.com/results?search_query=engineering+final+year+project+management+capstone"
      }
    ]
  };
}

function getRecommendations(prof) {
  const level = String(prof.educationLevel || "").toLowerCase();
  if (level === "school") return getSchoolRecommendations(prof);
  if (level === "diploma") return getDiplomaRecommendations(prof);
  if (level === "engineering") return getEngineeringRecommendations(prof);
  return getSchoolRecommendations({ ...prof, educationLevel: "School", semester: "Class 8" });
}

function buildDefaultPracticeTopics(prof) {
  return getRecommendations(prof).topics.map(makePracticeTopic);
}

// ─── Render practice grid ────────────────────────────────────────────────────

function renderPracticeGrid() {
  if (!practiceGrid || !statsState) return;
  practiceGrid.innerHTML = "";

  statsState.practiceTopics.forEach((topic) => {
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

    const goToTopic = async () => {
      topic.progress = Math.min(100, topic.progress + 5);
      statsState.questionsSolved += 1;

      const avg = statsState.practiceTopics.reduce((sum, t) => sum + t.progress, 0) / statsState.practiceTopics.length;
      statsState.overallProgress = Math.round(avg);
      statsState.topicsCompleted = statsState.practiceTopics.filter(t => t.progress >= 100).length;

      await saveStats();
      window.location.href = `/material.html?topic=${encodeURIComponent(topic.name)}`;
    };

    viewBtn.addEventListener("click", goToTopic);
    continueBtn.addEventListener("click", goToTopic);

    practiceGrid.appendChild(card);
  });
}

// ─── Render topic cards ──────────────────────────────────────────────────────

function renderTopicCards() {
  if (!topicScroller) return;

  const rec = getRecommendations(profile);
  if (topicLevel) topicLevel.textContent = `Based on: ${rec.label}`;

  topicScroller.innerHTML = "";
  rec.topics.forEach((topic, index) => {
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
      window.location.href = `/material.html?topic=${encodeURIComponent(topic.title)}`;
    });

    topicScroller.appendChild(card);
  });
}

function renderVideoSuggestions() {
  if (!videoGrid) return;
  const rec = getRecommendations(profile);
  if (videoTitle) videoTitle.textContent = "Recommended Video Tutorials";
  if (videoSubtitle) videoSubtitle.textContent = rec.hint;

  videoGrid.innerHTML = "";
  rec.videos.forEach((video) => {
    const isSearchEmbed = video.embed.includes("listType=search");
    const frameContent = isSearchEmbed
      ? `srcdoc="${makeVideoSrcdoc(video)}"`
      : `src="${video.embed}"`;
    const card = document.createElement("article");
    card.className = "video-card";
    card.innerHTML = `
      <iframe ${frameContent} title="${video.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      <div class="video-copy">
        <h3>${video.title}</h3>
        <p>${video.note}</p>
        <a href="${video.search}" target="_blank" rel="noreferrer">Open related videos</a>
      </div>
    `;
    videoGrid.appendChild(card);
  });
}

function makeVideoSrcdoc(video) {
  const safeTitle = video.title.replace(/"/g, "&quot;");
  const safeNote = video.note.replace(/"/g, "&quot;");
  return `
    <style>
      body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(135deg,#0f172a,#1f7ae0);color:white;display:grid;place-items:center;height:100vh;text-align:center}
      a{color:white;text-decoration:none;padding:12px 18px;border:1px solid rgba(255,255,255,.5);border-radius:999px;font-weight:700}
      div{padding:22px} h3{font-size:22px;margin:0 0 10px} p{opacity:.86;line-height:1.4}
    </style>
    <div><h3>${safeTitle}</h3><p>${safeNote}</p><a href='${video.search}' target='_blank'>Open YouTube</a></div>
  `.replace(/\n/g, " ").replace(/"/g, "&quot;");
}

// ─── Fetch profile then load everything ─────────────────────────────────────

async function fetchProfile() {
  try {
    const res = await fetch("/api/profile", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (!data.profile) {
      profile = {
        username: "New student",
        educationLevel: "General",
        branch: "Core"
      };
      showToast("Open My Account to complete your profile.");
    } else {
      profile = data.profile;
    }
  } catch {
    profile = {
      username: "New student",
      educationLevel: "General",
      branch: "Core"
    };
    showToast("Profile could not load. Dashboard opened with default topics.");
  }

  // Load stats from server (per-user, not localStorage)
  await fetchStats();

  const profileKey = getProfileKey(profile);

  // Seed or refresh practice topics when this user's profile level/stream changes.
  if (!statsState.practiceTopics || statsState.practiceTopics.length === 0 || statsState.profileKey !== profileKey) {
    statsState.practiceTopics = buildDefaultPracticeTopics(profile);
    statsState.profileKey = profileKey;
    // Bump streak for first login of the day
    statsState.streakDays = statsState.streakDays || 1;
    await saveStats();
  }

  renderTopicCards();
  renderVideoSuggestions();
  renderStatsCards();
  renderPracticeGrid();
  renderProfileMenu();
}

fetchProfile();

// ─── Generate form ───────────────────────────────────────────────────────────

if (resultsSection) resultsSection.classList.add("is-hidden");

generateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(generateForm).entries());
  const topic = payload.subject || payload.topic || "Selected Topic";
  window.location.href = `/material.html?topic=${encodeURIComponent(topic)}`;
});

// ─── Logout ──────────────────────────────────────────────────────────────────

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

if (profileMenuLogout) {
  profileMenuLogout.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });
}

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/profile.html";
  });
}

if (navBack) {
  navBack.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/login.html";
    }
  });
}

if (navForward) {
  navForward.addEventListener("click", () => {
    window.history.forward();
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
}

if (profileTrigger && profileDropdown) {
  profileTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("is-open");
  });

  document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target) && !profileTrigger.contains(e.target)) {
      profileDropdown.classList.remove("is-open");
    }
  });
}
