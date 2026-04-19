import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL;

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get("/", (_req, res) => {
  return res.sendFile(path.join(publicDir, "index.html"));
});

function getDbErrorMessage(err) {
  const code = err?.code || "";

  if (code === "ER_ACCESS_DENIED_ERROR") {
    return "Database login failed. Check DB user and password in Vercel.";
  }

  if (code === "ER_BAD_DB_ERROR") {
    return "Database not found. Check DB_NAME in Vercel.";
  }

  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    return "Database connection failed. Use a hosted MySQL database and check Vercel env vars.";
  }

  return "Server error";
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, passwordHash]
    );
    return res.status(201).json({ message: "Signup successful", userId: result.insertId });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: getDbErrorMessage(err) });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const [rows] = await pool.query("SELECT id, email, password_hash FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
    return res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: getDbErrorMessage(err) });
  }
});

app.post("/api/profile", authMiddleware, async (req, res) => {
  const { username, collegeName, branch, semester, educationLevel } = req.body;
  if (!username || !collegeName || !branch || !semester || !educationLevel) {
    return res.status(400).json({ message: "All profile fields are required" });
  }
  try {
    await pool.query(
      `INSERT INTO profiles (user_id, username, college_name, branch, semester, education_level)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         college_name = VALUES(college_name),
         branch = VALUES(branch),
         semester = VALUES(semester),
         education_level = VALUES(education_level)`
    , [req.user.id, username, collegeName, branch, semester, educationLevel]);

    return res.json({ message: "Profile saved" });
  } catch (err) {
    console.error("Profile error:", err);
    return res.status(500).json({ message: getDbErrorMessage(err) });
  }
});

app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT username, college_name, branch, semester, education_level FROM profiles WHERE user_id = ?",
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.json({ profile: null });
    }
    const row = rows[0];
    return res.json({
      profile: {
        username: row.username,
        collegeName: row.college_name,
        branch: row.branch,
        semester: row.semester,
        educationLevel: row.education_level
      }
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ message: getDbErrorMessage(err) });
  }
});

app.post("/api/generate", authMiddleware, async (req, res) => {
  const { subject, topic, level } = req.body;
  if (!subject || !topic || !level) {
    return res.status(400).json({ message: "Subject, topic, and level are required" });
  }

  const fallbackMaterials = {
    summary: [
      `Core idea of ${topic}`,
      `Key terms and definitions`,
      `Common applications in ${subject}`
    ],
    explanation_simple: `${topic} is a core part of ${subject}. It explains the basics so you can understand it easily.`,
    explanation_advanced: `${topic} covers foundational concepts in ${subject}, including definitions, workflows, and real-world applications.`,
    real_life: `You use ${topic} concepts when you solve everyday problems related to ${subject}.`,
    quiz: [
      `What is the main concept behind ${topic}?`,
      `Name one application of ${topic}.`
    ],
    pyq: [
      `Define ${topic} (IIT Bombay - 2022)`,
      `Explain a key concept in ${topic} (NIT Trichy - 2021)`
    ],
    key_points: ["✔ Core principles", "✔ Practical usage", "✔ Exam relevance"],
    flashcards: [
      { front: `${topic}`, back: `Definition and purpose in ${subject}` },
      { front: "Key term", back: "Short explanation" }
    ],
    study_plan: ["Review basics", "Study examples", "Attempt practice quiz"]
  };

  if (!OPENAI_API_KEY || !OPENAI_MODEL) {
    return res.json({ materials: fallbackMaterials, fallback: true });
  }

  const prompt = `
You are an AI study assistant. Return ONLY JSON with the following keys:
summary (array of 3-5 bullet strings),
explanation_simple (string),
explanation_advanced (string),
real_life (string),
quiz (array of 2-3 questions),
pyq (array of 2-3 questions),
key_points (array of 3-5 checklist strings),
flashcards (array of {front, back}),
study_plan (array of 3-5 short steps).

Topic: ${subject} - ${topic}
Level: ${level}
`.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return res.json({ materials: fallbackMaterials, fallback: true });
    }

    const data = await response.json();
    const outputText = data.output_text || "";
    let parsed;
    try {
      parsed = JSON.parse(outputText);
      return res.json({ materials: parsed });
    } catch (err) {
      console.error("Failed to parse OpenAI JSON:", err);
      return res.json({ materials: fallbackMaterials, fallback: true });
    }
  } catch (err) {
    console.error("OpenAI request error:", err);
    return res.json({ materials: fallbackMaterials, fallback: true });
  }
});

app.post("/generate", authMiddleware, async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "Topic is required" });
  }

  const fallbackMarkdown = `## I. Master Notes
### Core Definition
**${topic}** is a foundational concept defined by its core purpose, scope, and the key constraints that shape how it is used.

### Historical Context/Importance
Understanding the background of **${topic}** helps explain why it became essential in modern academic and real-world applications.

### Key Mechanisms
- **Mechanism 1:** The primary process that enables ${topic}.
- **Mechanism 2:** How the concept is applied in standard problems.
- **Mechanism 3:** Edge cases and limitations to watch for.

## II. Curated Video Library (Simulated/Searchable)
- **Crash Course ${topic}:** Look for a fast-paced overview that defines core ideas and common examples.
- **MIT OpenCourseWare ${topic}:** Focus on lectures that explain the most complex mechanism.
- **${topic} for Beginners:** Seek videos with visual demos and step-by-step walkthroughs.

## III. Academic References & Reading
- Author, A. (Year). *${topic}: A Complete Guide*. Publisher.
- Author, B. (Year). *Principles of ${topic}*. Publisher.
- Britannica Editors. (Year). *${topic}*. Encyclopedia Britannica.

## IV. Interactive Resource Links
- Explore ${topic} on Wikipedia (https://www.wikipedia.org)
- View ${topic} on Khan Academy (https://www.khanacademy.org)
- Search ${topic} on Coursera (https://www.coursera.org)

## V. Next-Step Suggestions
- How does ${topic} connect to advanced applications?
- What are the most common mistakes in ${topic}?
- Which real-world system uses ${topic} directly?`;

  if (!OPENAI_API_KEY || !OPENAI_MODEL) {
    return res.json({ result: fallbackMarkdown, fallback: true });
  }

  const systemPrompt = `You are an Elite Instructional Designer and Academic Researcher. For any topic provided, generate a comprehensive study module using Markdown. Follow this strict structure:
I. Master Notes (Structured Hierarchy):
Use H2/H3 tags. Break down the topic into: Core Definition, Historical Context/Importance, and Key Mechanisms.
Highlight critical terms in bold.
Write at least 2–3 short paragraphs per subheading and include bullet lists where helpful.
II. Curated Video Library (Simulated/Searchable):
List 2-3 high-quality YouTube search queries (e.g., 'Crash Course [Topic]', 'MIT OpenCourseWare [Topic]').
Provide brief descriptions of what to look for in these videos.
III. Academic References & Reading:
Cite 2-3 major textbooks, seminal papers, or authoritative websites (e.g., Britannica, PubMed, Khan Academy).
Use proper APA/MLA formatting for citations.
IV. Interactive Resource Links:
Suggest specific repositories or interactive tools (e.g., 'Explore [Topic] on Wikipedia', 'View [Topic] on [Specific Educational Platform]').
Include placeholders for real-time API-fetched links.
V. Next-Step Suggestions:
List 3 'Follow-up Questions' a user might search for next to deepen their understanding.
Tone: Professional, engaging, and adapted to a student.
Constraint: No fluff; every sentence must add educational value.`;

  try {
    try {
      await pool.query(
        "CREATE TABLE IF NOT EXISTS ai_cache (topic VARCHAR(255) PRIMARY KEY, result MEDIUMTEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
      );
    } catch (err) {
      console.error("Cache table init error:", err);
    }

    const [rows] = await pool.query("SELECT result FROM ai_cache WHERE topic = ? LIMIT 1", [topic]);
    if (rows && rows.length && rows[0].result) {
      return res.json({ result: rows[0].result, cached: true });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Topic: ${topic}. Use the required Markdown structure.` }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return res.json({ result: fallbackMarkdown, fallback: true });
    }

    const data = await response.json();
    const outputText = data.output_text || "";
    const finalText = outputText || fallbackMarkdown;
    try {
      await pool.query(
        "INSERT INTO ai_cache (topic, result) VALUES (?, ?) ON DUPLICATE KEY UPDATE result = VALUES(result)",
        [topic, finalText]
      );
    } catch (err) {
      console.error("Cache save error:", err);
    }
    return res.json({ result: finalText });
  } catch (err) {
    console.error("OpenAI request error:", err);
    return res.json({ result: fallbackMarkdown, fallback: true });
  }
});

app.post("/notes", authMiddleware, async (req, res) => {
  const { topic, level } = req.body;
  if (!topic) return res.status(400).json({ message: "Topic is required" });

  const fallbackNotes = `# ${topic}\n\n## Definition\n${topic} is a foundational concept introduced from first principles. It explains what the topic is, why it exists, and how it solves a core problem in its domain. A strong definition also clarifies the scope of the topic, what it does not cover, and why understanding its boundaries is important. In exams, you should be able to state this definition clearly, connect it to real‑world use, and describe how it fits into the wider syllabus. This long definition sets the context for deeper sections that follow.\n\n## Key Concepts\n${topic} is built on a small set of core ideas that appear again and again in questions. These concepts include the basic units, the relationships between those units, and the rules that control how they interact. Understanding these concepts is the fastest path to solving typical exam problems because most questions are simply re‑arrangements of these fundamentals. Focus on how each concept is defined, what inputs it expects, and what outputs or effects it produces.\n\n- **Core idea:** The main purpose of ${topic} and what problem it solves.\n- **Key terms:** The vocabulary and definitions you must memorize.\n- **Applications:** Common places where these ideas appear in real systems.\n- **Constraints:** Limits or assumptions you must not ignore.\n\n## Detailed Explanation\nIn this section, break the topic into sub‑concepts and explain each one in a full paragraph. Start from the most basic idea, then move to how it behaves in practice, and finally discuss edge cases and limitations. This is the part that should be studied slowly because it builds true understanding. When answering exam questions, use these paragraphs as your mental blueprint for structuring the response.\n\n## Examples\nA good example should include the scenario, the relevant concept, and the outcome. For ${topic}, first choose a simple, everyday scenario to show the idea in action. Then give a real‑world or academic example that is slightly more complex. Each example should clearly show inputs, process, and outputs, because that is how many exam questions are graded.\n\n## Important Formulas / Facts\n- Key formula or rule (if applicable), with a one‑line explanation of when to use it.\n- Must‑remember facts that often appear in objective questions.\n- Common properties that distinguish ${topic} from related concepts.\n\n## Summary\n- The definition of ${topic} and why it is important in the syllabus.\n- The core concepts that appear in most exam questions.\n- Typical examples and how they illustrate the ideas.\n- Key formulas/facts and when to apply them.\n- Common mistakes to avoid when writing answers.`;

  if (!OPENAI_API_KEY || !OPENAI_MODEL) {
    return res.json({ result: fallbackNotes, fallback: true });
  }

  const systemPrompt = `You are an expert educational content generator.\n\nYour task is to create high-quality, structured notes on the given topic.\n\nFollow these instructions strictly:\n1. Start with a clear definition of the topic using a LONG paragraph (6–10 sentences).\n2. Break the topic into logical sections with proper headings.\n3. For each section, write a LONG paragraph (6–10 sentences) that explains the concept fully from scratch.\n4. After each long paragraph, add a short bullet list of key terms and facts.\n5. Include important formulas, equations, or key facts (if applicable).\n6. Add examples to improve understanding (each example should be a long paragraph).\n7. Keep the language clear and suitable for the target level, but DO NOT shorten the content.\n8. Include a summary at the end with 5–7 detailed takeaways (each takeaway 1–2 sentences).\n9. If relevant, include:\n   - Diagrams (describe in text)\n   - Tables or comparisons (describe in text)\n10. Make the notes exam-oriented and comprehensive.\n\nOutput Format:\n# Topic Name\n\n## Definition\n[LONG paragraph]\n\n## Key Concepts\n[LONG paragraphs + bullets]\n\n## Detailed Explanation\n[LONG paragraphs per concept + bullets]\n\n## Examples\n[LONG paragraph examples]\n\n## Important Formulas / Facts\n[List with explanations]\n\n## Summary\n- Long takeaway 1\n- Long takeaway 2\n- Long takeaway 3\n- Long takeaway 4\n- Long takeaway 5`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Input Topic: ${topic}\n\nTarget Level: ${level || "beginner"}` }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Notes OpenAI error:", errText);
      return res.json({ result: fallbackNotes, fallback: true });
    }

    const data = await response.json();
    const outputText = data.output_text || "";
    return res.json({ result: outputText || fallbackNotes });
  } catch (err) {
    console.error("Notes request error:", err);
    return res.json({ result: fallbackNotes, fallback: true });
  }
});

app.post("/chat", authMiddleware, async (req, res) => {
  const { topic, message } = req.body;
  if (!message) return res.status(400).json({ message: "Message is required" });

  const buildFallbackReply = (cachedText) => {
    const subject = topic || "this topic";
    if (cachedText) {
      const lines = cachedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .slice(0, 4);
      return `Here’s a quick answer based on your saved notes for ${subject}:\n- ${lines.join("\n- ")}\n\nIf you want, ask me to explain any one point in detail.`;
    }
    return `Here’s a quick, student‑friendly answer about ${subject}:\n\n1) Simple idea: ${subject} focuses on the core concepts and how they are used in practice.\n2) Key point: Learn the definitions first, then the mechanisms.\n3) Example: Think of a basic real‑world scenario where ${subject} is applied.\n\nAsk me to explain any part in simpler or deeper terms.`;
  };

  if (!OPENAI_API_KEY || !OPENAI_MODEL) {
    try {
      const [rows] = await pool.query("SELECT result FROM ai_cache WHERE topic = ? LIMIT 1", [topic]);
      const cached = rows && rows.length ? rows[0].result : "";
      return res.json({ reply: buildFallbackReply(cached) });
    } catch {
      return res.json({ reply: buildFallbackReply("") });
    }
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content:
              "You are NeoTutor, a friendly academic coach. Answer briefly, step-by-step, and suggest one follow-up question."
          },
          { role: "user", content: `Topic: ${topic || "General"}\nQuestion: ${message}` }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Chat OpenAI error:", errText);
      try {
        const [rows] = await pool.query("SELECT result FROM ai_cache WHERE topic = ? LIMIT 1", [topic]);
        const cached = rows && rows.length ? rows[0].result : "";
        return res.json({ reply: buildFallbackReply(cached) });
      } catch {
        return res.json({ reply: buildFallbackReply("") });
      }
    }

    const data = await response.json();
    const outputText = data.output_text || "I can help with that—try asking for a short explanation.";
    return res.json({ reply: outputText });
  } catch (err) {
    console.error("Chat request error:", err);
    try {
      const [rows] = await pool.query("SELECT result FROM ai_cache WHERE topic = ? LIMIT 1", [topic]);
      const cached = rows && rows.length ? rows[0].result : "";
      return res.json({ reply: buildFallbackReply(cached) });
    } catch {
      return res.json({ reply: buildFallbackReply("") });
    }
  }
});

app.get("/api/health", (_req, res) => {
  return res.json({ status: "ok" });
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      await pool.query("SELECT 1");
      console.log("Database connection: ok");
    } catch (err) {
      console.error("Database connection failed:", err);
    }
  });
}

export default app;
