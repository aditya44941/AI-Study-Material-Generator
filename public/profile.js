const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "/login.html";
}

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const logoutButton = document.getElementById("logout-button");
const backButton = document.getElementById("back-button");
const educationLevelSelect = document.getElementById("education-level");
const levelSpecificFields = document.getElementById("level-specific-fields");

const neoLine1 = document.getElementById("neo-line-1");
const neoLine2 = document.getElementById("neo-line-2");
const neoLine3 = document.getElementById("neo-line-3");
const neoLine4 = document.getElementById("neo-line-4");

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#f87171" : "#1f7ae0";
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
  wireSuggestionDropdowns();
}

if (educationLevelSelect) {
  educationLevelSelect.addEventListener("change", (e) => {
    renderLevelFields(e.target.value);
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

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(profileForm).entries());

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
    window.location.href = "/dashboard.html";
  }
});

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login.html";
  });
}

if (backButton) {
  backButton.addEventListener("click", () => {
    window.location.href = "/login.html";
  });
}

async function loadExistingProfile() {
  try {
    const res = await fetch("/api/profile", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (data.profile) {
      window.location.href = "/dashboard.html";
    }
  } catch {
    // ignore
  }
}

loadExistingProfile();

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
