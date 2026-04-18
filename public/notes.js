const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "/login.html";
}

const params = new URLSearchParams(window.location.search);
const topic = params.get("topic") || "General Topic";
const titleEl = document.getElementById("notes-title");
const subtitleEl = document.getElementById("notes-subtitle");
const loadingEl = document.getElementById("notes-loading");
const outputEl = document.getElementById("notes-output");
const notesLong = document.getElementById("notes-long");
const notesRef = document.getElementById("notes-ref");
const figuresLink = document.getElementById("notes-figures");
const figureGrid = document.getElementById("notes-figure-grid");
const backButton = document.getElementById("back-button");
let profile = {};

if (titleEl) titleEl.textContent = `Notes: ${topic}`;
if (subtitleEl) subtitleEl.textContent = "Detailed study guide";

const encodedTopic = encodeURIComponent(topic);
if (notesRef) notesRef.href = `https://en.wikipedia.org/wiki/Special:Search?search=${encodedTopic}`;
if (figuresLink) figuresLink.href = `https://www.google.com/search?tbm=isch&q=${encodedTopic}%20diagram`;

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = `/material.html?topic=${encodeURIComponent(topic)}`;
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

async function loadNotes() {
  try {
    try {
      const profRes = await fetch("/api/profile", {
        headers: { Authorization: "Bearer " + token }
      });
      const profData = await profRes.json();
      if (profData.profile) profile = profData.profile;
    } catch {}

    const level = profile.educationLevel || "beginner";
    const res = await fetch("/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ topic, level })
    });
    const data = await res.json().catch(() => ({}));
    const fallbackNotes = `## I. Master Notes\n### Core Definition\n**${topic}** is a core concept explained from the ground up, including its goals, scope, and constraints.\n\n### Historical Context/Importance\nThis topic became essential because it solves fundamental problems and supports advanced systems.\n\n### Key Mechanisms\n- **Mechanism 1:** The main process that makes ${topic} work.\n- **Mechanism 2:** Standard applications and workflows.\n- **Mechanism 3:** Edge cases and limitations.\n\n## II. Curated Video Library (Simulated/Searchable)\n- Crash Course ${topic} — overview and intuition.\n- MIT OpenCourseWare ${topic} — deep dive into mechanisms.\n- ${topic} for Beginners — step-by-step examples.\n\n## III. Academic References & Reading\n- Author, A. (Year). *${topic}: A Complete Guide*. Publisher.\n- Author, B. (Year). *Principles of ${topic}*. Publisher.\n- Britannica Editors. (Year). *${topic}*. Encyclopedia Britannica.\n\n## IV. Interactive Resource Links\n- Explore ${topic} on Wikipedia (https://www.wikipedia.org)\n- View ${topic} on Khan Academy (https://www.khanacademy.org)\n- Search ${topic} on Coursera (https://www.coursera.org)\n\n## V. Next-Step Suggestions\n- How does ${topic} connect to advanced applications?\n- What are common mistakes in ${topic}?\n- Which real systems rely on ${topic}?`;
    const text = res.ok ? data.result || fallbackNotes : fallbackNotes;
    notesLong.innerHTML = text
      .replace(/^###\s/gm, "<h3>")
      .replace(/^##\s/gm, "<h2>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/<h2>/g, "</p><h2>")
      .replace(/<h3>/g, "</p><h3>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n-\s/g, "<br>• ");

    notesLong.innerHTML = `<p>${notesLong.innerHTML}</p>`;
  } catch {
    notesLong.innerHTML = "<p>Unable to load detailed notes right now.</p>";
  } finally {
    loadingEl.classList.add("hidden");
    outputEl.classList.remove("hidden");
    loadFigures();
  }
}

loadNotes();
