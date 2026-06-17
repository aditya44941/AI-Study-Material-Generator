const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "/login.html";
}

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const logoutButton = document.getElementById("logout-button");
const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const educationLevelSelect = document.getElementById("education-level");
const levelSpecificFields = document.getElementById("level-specific-fields");
const accountTitle = document.getElementById("account-title");
const accountSubtitle = document.getElementById("account-subtitle");
const accountAvatar = document.getElementById("account-avatar");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const accountCollege = document.getElementById("account-college");
const accountLevel = document.getElementById("account-level");
const accountBranch = document.getElementById("account-branch");
const goDashboardButton = document.getElementById("go-dashboard");
const goGeneratorButton = document.getElementById("go-generator");
const avatarFile = document.getElementById("avatar-file");
const avatarUrlInput = document.getElementById("avatar-url");
const photoPreview = document.getElementById("photo-preview");
const removePhotoButton = document.getElementById("remove-photo");
const accountGoal = document.getElementById("account-goal");
const accountStyle = document.getElementById("account-style");
const accountTarget = document.getElementById("account-target");

const neoLine1 = document.getElementById("neo-line-1");
const neoLine2 = document.getElementById("neo-line-2");
const neoLine3 = document.getElementById("neo-line-3");
const neoLine4 = document.getElementById("neo-line-4");

function showMessage(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? "#f87171" : "#1f7ae0";
}

function setAvatarPreview(value, fallbackInitial = "N") {
  const targets = [accountAvatar, photoPreview].filter(Boolean);
  targets.forEach((target) => {
    target.innerHTML = "";
    target.style.backgroundImage = "";

    if (value) {
      target.style.backgroundImage = `url("${value}")`;
      target.classList.add("has-photo");
    } else {
      target.textContent = fallbackInitial;
      target.classList.remove("has-photo");
    }
  });

  if (avatarUrlInput) avatarUrlInput.value = value || "";
}

function updateAccountNote(prof) {
  const username = prof?.username || "Student";
  const email = prof?.email || "Not available";
  const college = prof?.collegeName || "Not set";
  const level = prof?.educationLevel || "Not set";
  const branch = prof?.branch || "Not set";
  const semester = prof?.semester || "";
  const avatarUrl = prof?.avatarUrl || "";
  const studyGoal = prof?.studyGoal || "Not set";
  const learningStyle = prof?.learningStyle || "Not set";
  const dailyTarget = prof?.dailyTarget || "Not set";
  const initial = username.trim().charAt(0).toUpperCase() || "N";

  if (accountTitle) accountTitle.textContent = `${username}'s account`;
  if (accountSubtitle) {
    accountSubtitle.textContent = `${level} profile${semester ? ` • ${semester}` : ""} • personalized NeoDesk access`;
  }
  setAvatarPreview(avatarUrl, initial);
  if (accountName) accountName.textContent = username;
  if (accountEmail) accountEmail.textContent = email;
  if (accountCollege) accountCollege.textContent = college;
  if (accountLevel) accountLevel.textContent = semester ? `${level} - ${semester}` : level;
  if (accountBranch) accountBranch.textContent = branch;
  if (accountGoal) accountGoal.textContent = studyGoal;
  if (accountStyle) accountStyle.textContent = learningStyle;
  if (accountTarget) accountTarget.textContent = dailyTarget;
}

if (avatarFile) {
  avatarFile.addEventListener("change", () => {
    const file = avatarFile.files && avatarFile.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage(profileMessage, "Please select an image file", true);
      avatarFile.value = "";
      return;
    }

    if (file.size > 750 * 1024) {
      showMessage(profileMessage, "Image is too large. Choose a photo under 750 KB.", true);
      avatarFile.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result, "N");
      showMessage(profileMessage, "Photo added. Click Save profile to update it.");
    };
    reader.readAsDataURL(file);
  });
}

if (removePhotoButton) {
  removePhotoButton.addEventListener("click", () => {
    const username = profileForm.elements.username.value || "Student";
    const initial = username.trim().charAt(0).toUpperCase() || "N";
    setAvatarPreview("", initial);
    if (avatarFile) avatarFile.value = "";
    showMessage(profileMessage, "Photo removed. Click Save profile to confirm.");
  });
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
    await fetch("/api/stats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        overallProgress: 0,
        streakDays: 1,
        topicsCompleted: 0,
        questionsSolved: 0,
        practiceTopics: []
      })
    }).catch(() => {});
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
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/dashboard.html";
    }
  });
}

if (forwardButton) {
  forwardButton.addEventListener("click", () => {
    window.location.href = "/dashboard.html#generator-page";
  });
}

if (goDashboardButton) {
  goDashboardButton.addEventListener("click", () => {
    window.location.href = "/dashboard.html";
  });
}

if (goGeneratorButton) {
  goGeneratorButton.addEventListener("click", () => {
    window.location.href = "/dashboard.html#generator-page";
  });
}

async function loadExistingProfile() {
  try {
    const res = await fetch("/api/profile", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (data.profile) {
      const prof = data.profile;
      profileForm.elements.username.value = prof.username || "";
      profileForm.elements.educationLevel.value = prof.educationLevel || "";
      renderLevelFields(prof.educationLevel || "");
      profileForm.elements.collegeName.value = prof.collegeName || "";
      if (profileForm.elements.branch) profileForm.elements.branch.value = prof.branch || "";
      if (profileForm.elements.semester) profileForm.elements.semester.value = prof.semester || "";
      if (profileForm.elements.avatarUrl) profileForm.elements.avatarUrl.value = prof.avatarUrl || "";
      if (profileForm.elements.studyGoal) profileForm.elements.studyGoal.value = prof.studyGoal || "";
      if (profileForm.elements.learningStyle) profileForm.elements.learningStyle.value = prof.learningStyle || "";
      if (profileForm.elements.dailyTarget) profileForm.elements.dailyTarget.value = prof.dailyTarget || "";
      updateAccountNote(prof);
      showMessage(profileMessage, "Loaded your saved profile");
    } else {
      updateAccountNote(null);
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
