const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "/login.html";
}

const params = new URLSearchParams(window.location.search);
const topic = params.get("topic") || "General Topic";
let profile = {};

const titleEl = document.getElementById("material-title");
const subtitleEl = document.getElementById("material-subtitle");
const loadingEl = document.getElementById("material-loading");
const outputEl = document.getElementById("material-output");
const backButton = document.getElementById("back-button");
const sidebarLogout = document.getElementById("sidebar-logout");
const loadingHint = document.getElementById("loading-hint");
const sidebarToggle = document.getElementById("sidebar-toggle");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");
const chatWidget = document.getElementById("chat-widget");
const chatFab = document.getElementById("chat-fab");
const chatMinimize = document.getElementById("chat-minimize");
const chatRefresh = document.getElementById("chat-refresh");

const notesCheat = document.getElementById("notes-cheat");
const notesCore = document.getElementById("notes-core");
const notesAdvanced = document.getElementById("notes-advanced");
const notesFormulas = document.getElementById("notes-formulas");
const resourcesList = document.getElementById("resources-list");
const videosList = document.getElementById("videos-list");
const quizList = document.getElementById("quiz-list");
const notesLink = document.getElementById("notes-link");
const notesMore = document.getElementById("notes-more");
const materialsLink = document.getElementById("materials-link");
const videosLink = document.getElementById("videos-link");
const quizLink = document.getElementById("quiz-link");
const figuresLink = document.getElementById("figures-link");
const figureGrid = document.getElementById("figure-grid");

if (titleEl) titleEl.textContent = `Topic: ${topic}`;

const encodedTopic = encodeURIComponent(topic);
if (notesLink) notesLink.href = `https://en.wikipedia.org/wiki/Special:Search?search=${encodedTopic}`;
if (materialsLink) materialsLink.href = `https://ocw.mit.edu/search/?q=${encodedTopic}`;
if (videosLink) videosLink.href = `https://www.youtube.com/results?search_query=${encodedTopic}`;
if (quizLink) quizLink.href = `https://www.khanacademy.org/search?page_search_query=${encodedTopic}`;
if (figuresLink) figuresLink.href = `https://www.google.com/search?tbm=isch&q=${encodedTopic}%20diagram`;

if (notesMore) {
  notesMore.addEventListener("click", () => {
    window.location.href = `/notes.html?topic=${encodeURIComponent(topic)}`;
  });
}

async function loadFigures() {
  if (!figureGrid) return;
  figureGrid.innerHTML = "";
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodedTopic}&limit=1&namespace=0&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pageTitle = searchData?.[1]?.[0];
    let finalImages = [];

    if (pageTitle) {
      const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=thumbnail|original&pithumbsize=800&format=json&origin=*`;
      const pageRes = await fetch(pageUrl);
      const pageData = await pageRes.json();
      const page = pageData?.query?.pages ? Object.values(pageData.query.pages)[0] : null;
      const img = page?.thumbnail?.source || page?.original?.source;
      if (img) finalImages.push(img);
    }

    if (!finalImages.length) {
      figureGrid.innerHTML = `<div class="figure-empty">No public figures found. Use “Open Figures” to search.</div>`;
      return;
    }

    finalImages.forEach((src) => {
      const card = document.createElement("div");
      card.className = "figure-card";
      card.innerHTML = `<img src="${src}" alt="Diagram">`;
      figureGrid.appendChild(card);
    });
  } catch {
    figureGrid.innerHTML = `<div class="figure-empty">Unable to load figures right now.</div>`;
  }
}

async function loadProfile() {
  try {
    const res = await fetch("/api/profile", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (data.profile) profile = data.profile;
  } catch {
    // ignore
  }
  if (subtitleEl) {
    const level = profile.educationLevel || "General";
    const stream = profile.branch || "Core";
    subtitleEl.textContent = `Level: ${level} - ${stream}`;
  }
}

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/dashboard.html";
  });
}

if (sidebarLogout) {
  sidebarLogout.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
}

if (chatFab) {
  chatFab.addEventListener("click", () => {
    chatWidget?.classList.add("chat-open");
  });
}

if (chatMinimize) {
  chatMinimize.addEventListener("click", () => {
    chatWidget?.classList.remove("chat-open");
  });
}

if (chatRefresh) {
  chatRefresh.addEventListener("click", () => {
    if (chatMessages) {
      chatMessages.innerHTML = `<div class="chat-bubble bot">Hi! Welcome to NeoDesk.</div><div class="chat-bubble bot">How can I help you?</div>`;
    }
  });
}

function appendChatBubble(text, type = "bot") {
  if (!chatMessages) return;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage(text) {
  appendChatBubble(text, "user");
  if (chatInput) chatInput.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ topic, message: text })
    });
    const data = await res.json();
    appendChatBubble(data.reply || "Try asking in a simpler way.");
  } catch {
    appendChatBubble("I’m here to help! Try again in a moment.");
  }
}

if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput?.value?.trim();
    if (text) sendChatMessage(text);
  });
}

function setList(el, items) {
  if (!el) return;
  el.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = item;
    el.appendChild(li);
  });
}

function extractSection(markdown, heading) {
  const regex = new RegExp(`^##\\s*${heading}[\\s\\S]*?(?=^##\\s|\\Z)`, "mi");
  const match = markdown.match(regex);
  return match ? match[0] : "";
}

function extractLines(section) {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("##") && !line.startsWith("###"));
}

function renderQuiz(questions) {
  quizList.innerHTML = "";
  questions.forEach((item, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "quiz-item";
    wrapper.innerHTML = `
      <div class="quiz-question">${item.question}</div>
      <div class="quiz-options">
        ${item.options
          .map(
            (opt, i) => `
          <label class="quiz-option">
            <input type="radio" name="quiz-${idx}" />
            <span>${String.fromCharCode(65 + i)}) ${opt}</span>
          </label>
        `
          )
          .join("")}
      </div>
      <button class="quiz-submit" type="button">Submit</button>
      <div class="quiz-answer hidden">Answer: ${item.correct_answer}. ${item.explanation}</div>
    `;
    wrapper.querySelector(".quiz-submit").addEventListener("click", () => {
      const ans = wrapper.querySelector(".quiz-answer");
      ans.classList.remove("hidden");
    });
    quizList.appendChild(wrapper);
  });
}

function renderOutput(markdown) {
  if (!markdown || !markdown.trim()) return;

  const master = extractSection(markdown, "I\\. Master Notes");
  const videos = extractSection(markdown, "II\\. Curated Video Library");
  const refs = extractSection(markdown, "III\\. Academic References & Reading");
  const links = extractSection(markdown, "IV\\. Interactive Resource Links");
  const next = extractSection(markdown, "V\\. Next-Step Suggestions");

  const masterLines = extractLines(master);
  const nextLines = extractLines(next);
  const intro = masterLines.slice(0, 3).join(" ");
  notesCheat.textContent = intro || "Cheat sheet not available.";
  setList(notesCore, masterLines.slice(3, 10));
  setList(notesAdvanced, masterLines.slice(10, 18));
  setList(notesFormulas, [...masterLines.slice(18, 22), ...nextLines.slice(0, 3)].filter(Boolean));

  const refLines = extractLines(refs);
  const linkLines = extractLines(links);
  const videoLines = extractLines(videos);
  const combinedResources = [...refLines, ...linkLines];

  resourcesList.innerHTML = "";
  combinedResources.forEach((line) => {
    const li = document.createElement("li");
    li.innerHTML = line.replace(/\((https?:\/\/[^\s)]+)\)/g, '<a href="$1" target="_blank">$1</a>');
    resourcesList.appendChild(li);
  });

  videosList.innerHTML = "";
  videoLines.forEach((line) => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <div class="video-title">${line}</div>
      <div class="video-meta">Search suggestion</div>
      <div class="video-takeaway">Look for the most complex mechanism and pause there.</div>
      <a class="video-link" href="https://www.youtube.com/results?search_query=${encodeURIComponent(line)}" target="_blank">Search</a>
    `;
    videosList.appendChild(card);
  });

  const fallbackQuiz = [
    {
      question: `Which best defines ${topic}?`,
      options: ["Accurate definition", "Incorrect definition", "Unrelated", "None"],
      correct_answer: "Accurate definition",
      explanation: "This matches the core definition."
    },
    {
      question: `Why is ${topic} important?`,
      options: ["It is foundational", "It is optional", "It is obsolete", "It is trivial"],
      correct_answer: "It is foundational",
      explanation: "It supports advanced concepts."
    },
    {
      question: `Which is a correct mechanism in ${topic}?`,
      options: ["Key mechanism", "False mechanism", "Random", "Not applicable"],
      correct_answer: "Key mechanism",
      explanation: "This matches the core mechanism."
    },
    {
      question: `A common mistake in ${topic} is:`,
      options: ["Ignoring constraints", "Following rules", "Testing edge cases", "Reviewing basics"],
      correct_answer: "Ignoring constraints",
      explanation: "This leads to incorrect results."
    },
    {
      question: `Next step after learning ${topic} is:`,
      options: ["Practice problems", "Skip practice", "Avoid revision", "Ignore applications"],
      correct_answer: "Practice problems",
      explanation: "Practice builds retention."
    }
  ];

  renderQuiz(fallbackQuiz);
}

async function loadMaterial() {
  let previewShown = false;
  const fallbackPreview = `## I. Master Notes
### Core Definition
**${topic}** summary is loading. This preview highlights the key ideas.
### Historical Context/Importance
Why ${topic} matters in modern study and applications.
### Key Mechanisms
- **Mechanism 1:** Core process
- **Mechanism 2:** Real-world usage
- **Mechanism 3:** Limits and constraints

## II. Curated Video Library (Simulated/Searchable)
- Crash Course ${topic}
- MIT OpenCourseWare ${topic}
- ${topic} for Beginners

## III. Academic References & Reading
- Author, A. (Year). *${topic}: A Complete Guide*. Publisher.
- Britannica Editors. (Year). *${topic}*. Encyclopedia Britannica.

## IV. Interactive Resource Links
- Explore ${topic} on Wikipedia (https://www.wikipedia.org)
- View ${topic} on Khan Academy (https://www.khanacademy.org)

## V. Next-Step Suggestions
- How does ${topic} connect to advanced applications?
- What are the most common mistakes in ${topic}?
- Which real-world system uses ${topic} directly?`;

  const slowTimer = setTimeout(() => {
    previewShown = true;
    if (loadingHint) loadingHint.textContent = "Still generating… showing quick preview.";
    renderOutput(fallbackPreview);
    loadingEl.classList.add("hidden");
    outputEl.classList.remove("hidden");
  }, 2000);

  try {
    const res = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ topic })
    });
    const data = await res.json();
    const result = data.result || null;
    clearTimeout(slowTimer);
    renderOutput(result || fallbackPreview);
    loadingEl.classList.add("hidden");
    outputEl.classList.remove("hidden");
    if (!previewShown) outputEl.scrollIntoView({ behavior: "smooth" });
    loadFigures();
  } catch (err) {
    clearTimeout(slowTimer);
    if (loadingHint) loadingHint.textContent = "Using quick preview. Try again later.";
    renderOutput(fallbackPreview);
    loadingEl.classList.add("hidden");
    outputEl.classList.remove("hidden");
    loadFigures();
  }
}

loadProfile().then(loadMaterial);
