const fs = require("fs");
const path = require("path");
const { extractResumeText } = require("./resumeExtractor");

const COMMON_SKILL_STOPWORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "your",
  "into",
  "from",
  "this",
  "that",
  "will",
  "work",
  "team",
  "role",
  "job",
  "developer",
  "engineer",
  "candidate",
  "experience",
  "skills",
  "strong",
  "good",
  "using",
  "based",
  "including",
  "knowledge",
  "knowledgeable",
  "excellent",
  "must",
  "have",
  "be",
  "able",
  "also",
  "like",
  "about",
  "within",
  "ideal",
  "responsible",
  "related",
  "new",
  "build",
  "building",
  "apps",
  "app",
  "responsive",
  "development",
  "developing",
  "under",
  "over",
  "more",
  "best",
  "among",
  "you",
  "our",
  "we",
  "are",
  "on",
  "at",
  "to",
  "of",
  "a",
  "an",
  "in",
  "as",
  "is",
  "it",
  "by",
  "or",
  "us",
  "can",
  "out",
  "company",
  "business",
  "product",
  "service",
  "customer",
  "client",
  "technology",
  "technical",
  "startup",
  "digital",
  "full",
  "stack",
  "backend",
  "frontend",
  "front",
  "end",
  "software",
  "application",
  "applications",
  "solutions",
  "industry",
  "growth",
  "scale",
]);

const GENERIC_SKILL_WORDS = new Set([
  "front",
  "end",
  "full",
  "stack",
  "backend",
  "frontend",
  "software",
  "developer",
  "engineer",
  "application",
  "applications",
  "team",
  "web",
  "website",
  "design",
  "data",
  "analytics",
  "business",
  "product",
  "responsive",
  "build",
  "apps",
  "app",
  "company",
  "role",
  "job",
]);

const SKILL_ALIASES = {
  javascript: ["javascript", "js", "ecmascript"],
  typescript: ["typescript", "ts"],
  python: ["python", "python3"],
  java: ["java"],
  react: ["react", "reactjs", "react.js"],
  "next.js": ["next.js", "nextjs"],
  vue: ["vue", "vuejs", "vue.js"],
  angular: ["angular", "angularjs"],
  "node.js": ["node.js", "nodejs", "node"],
  express: ["express", "expressjs", "express.js"],
  mongodb: ["mongodb", "mongo"],
  postgresql: ["postgresql", "postgres"],
  mysql: ["mysql"],
  sql: ["sql"],
  html: ["html", "html5"],
  css: ["css", "css3"],
  tailwind: ["tailwind", "tailwindcss"],
  bootstrap: ["bootstrap"],
  sass: ["sass", "scss"],
  git: ["git", "github", "gitlab"],
  docker: ["docker"],
  kubernetes: ["kubernetes", "k8s"],
  aws: ["aws", "amazon web services"],
  gcp: ["gcp", "google cloud"],
  azure: ["azure", "microsoft azure"],
  rest: ["rest", "restful", "rest api"],
  graphql: ["graphql"],
  redux: ["redux", "redux toolkit"],
  "c#": ["c#", "csharp"],
  ".net": [".net", "dotnet"],
  php: ["php"],
  laravel: ["laravel"],
  ruby: ["ruby"],
  swift: ["swift"],
  kotlin: ["kotlin"],
  flutter: ["flutter"],
  firebase: ["firebase"],
  redis: ["redis"],
  figma: ["figma"],
  jira: ["jira"],
  linux: ["linux", "unix", "bash"],
  tensorflow: ["tensorflow"],
  pytorch: ["pytorch"],
  pandas: ["pandas"],
  numpy: ["numpy"],
  devops: ["devops", "ci/cd", "jenkins"],
  "machine learning": ["machine learning"],
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractKnownSkills = (value = "") => {
  const text = normalizeText(value);
  if (!text) return [];

  return Object.entries(SKILL_ALIASES)
    .filter(([, aliases]) =>
      aliases.some((alias) =>
        new RegExp(
          `(^|[^a-z0-9])${escapeRegExp(normalizeText(alias))}($|[^a-z0-9])`,
        ).test(text),
      ),
    )
    .map(([skill]) => skill);
};

const calculateSkillMatch = (candidateText, job = {}) => {
  const requiredSkills = extractKnownSkills(
    [
      job.title,
      job.description,
      job.AdditionalInformation,
      job.additionalInformation,
    ]
      .filter(Boolean)
      .join(" "),
  );
  if (!requiredSkills.length) {
    return {
      score: null,
      matchedSkills: [],
      missingSkills: [],
      explanation: "No recognizable required skills were found in this job posting.",
    };
  }

  const applicantSkills = new Set(extractKnownSkills(candidateText));
  const matchedSkills = requiredSkills.filter((skill) =>
    applicantSkills.has(skill),
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !applicantSkills.has(skill),
  );
  const score = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    score,
    matchedSkills,
    missingSkills,
    explanation: `Matched ${matchedSkills.length} of ${requiredSkills.length} required skills${
      matchedSkills.length ? `: ${matchedSkills.join(", ")}` : ""
    }.${
      missingSkills.length
        ? ` Missing: ${missingSkills.join(", ")}.`
        : " All identified required skills are present."
    }`,
  };
};

const resolveResumePath = (resumeUrl) => {
  if (typeof resumeUrl !== "string" || !resumeUrl.trim()) return null;

  let pathname;
  try {
    pathname = new URL(resumeUrl).pathname;
  } catch {
    pathname = resumeUrl;
  }

  const uploadsIndex = pathname.indexOf("/uploads/");
  if (uploadsIndex === -1 && !pathname.startsWith("uploads/")) return null;
  const fileName = path.basename(
    decodeURIComponent(
      uploadsIndex === -1
        ? pathname.slice("uploads/".length)
        : pathname.slice(uploadsIndex + "/uploads/".length),
    ),
  );
  if (!fileName) return null;

  const uploadsDirectory = path.resolve(__dirname, "../uploads");
  const filePath = path.resolve(uploadsDirectory, fileName);
  return filePath.startsWith(`${uploadsDirectory}${path.sep}`) ? filePath : null;
};

const normalizeText = (value = "") => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value)
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join(" ");
  }

  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+\-#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeSkill = (skill = "") => {
  const normalized = normalizeText(skill).replace(/\s+/g, " ");
  if (!normalized) return "";

  const aliases = {
    reactjs: "react",
    react: "react",
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    nodejs: "node",
    "node.js": "node",
    node: "node",
    mongodb: "mongodb",
    mongo: "mongodb",
    "mongo db": "mongodb",
    sql: "sql",
    mysql: "sql",
    postgresql: "sql",
    html5: "html",
    html: "html",
    css3: "css",
    css: "css",
    python: "python",
    java: "java",
    php: "php",
    csharp: "c#",
    "c#": "c#",
    dotnet: ".net",
    ".net": ".net",
    aws: "aws",
    docker: "docker",
    k8s: "kubernetes",
    kubernetes: "kubernetes",
    git: "git",
    jira: "jira",
    agile: "agile",
    ui: "ui",
    ux: "ux",
    rest: "rest",
    api: "api",
    apis: "api",
    nosql: "nosql",
  };

  if (aliases[normalized]) return aliases[normalized];
  const compact = normalized.replace(/\s+/g, "");
  return aliases[compact] || normalized;
};

const extractSkillTokens = (value = "") => {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  return normalized
    .split(/[\s,;|/]+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .map((token) => normalizeSkill(token))
    .filter((token) => {
      if (!token || token.length < 2) return false;
      if (COMMON_SKILL_STOPWORDS.has(token)) return false;
      if (GENERIC_SKILL_WORDS.has(token)) return false;
      return true;
    });
};

const buildSkillSet = (value = "") => {
  const tokens = extractSkillTokens(value);
  return [...new Set(tokens.filter(Boolean))];
};

const extractJobSkills = (job = {}) => {
  const content = [
    job.title,
    job.description,
    job.AdditionalInformation,
    job.additionalInformation,
    job.skills,
    job.requirements,
  ].join(" ");

  return buildSkillSet(content);
};

const extractUserSkills = (user = {}) => {
  const content = [
    user.skills,
    user.education,
    user.experience,
    user.profileInformation,
    user.contactDetails,
    user.summary,
    user.bio,
    user.about,
  ].join(" ");

  return buildSkillSet(content);
};

const buildExplanation = (matchedSkills, missingSkills, score) => {
  if (score === null || typeof score === "undefined") {
    return "Not enough data";
  }

  if (!matchedSkills.length) {
    if (!missingSkills.length) {
      return "Not enough data";
    }
    return `The profile is missing key skills such as ${missingSkills.slice(0, 3).join(", ")}.`;
  }

  if (score >= 80) {
    return `Strong match based on ${matchedSkills.slice(0, 3).join(", ")}.`;
  }

  if (score >= 60) {
    return `Good match with ${matchedSkills.slice(0, 3).join(", ")}; missing ${missingSkills.slice(0, 2).join(", ")}.`;
  }

  return `Partial match from ${matchedSkills.slice(0, 2).join(", ")}; focus on ${missingSkills.slice(0, 2).join(", ")}.`;
};

const calculateJobMatch = (user = {}, job = {}) => {
  const requiredSkills = extractJobSkills(job);
  const applicantSkills = extractUserSkills(user);

  if (!requiredSkills.length || !applicantSkills.length) {
    return {
      score: null,
      matchedSkills: [],
      missingSkills: requiredSkills.slice(0, 6),
      explanation: "Not enough data",
    };
  }

  const matchedSkills = [
    ...new Set(
      requiredSkills.filter((skill) => applicantSkills.includes(skill)),
    ),
  ];
  const missingSkills = [
    ...new Set(
      requiredSkills.filter((skill) => !applicantSkills.includes(skill)),
    ),
  ];

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round((matchedSkills.length / requiredSkills.length) * 100),
    ),
  );

  return {
    score,
    matchedSkills: matchedSkills.slice(0, 6),
    missingSkills: missingSkills.slice(0, 6),
    explanation: buildExplanation(matchedSkills, missingSkills, score),
  };
};

const calculateCandidateJobMatch = async (user = {}, job = {}) => {
  if (!user.resume) {
    return {
      score: null,
      matchedSkills: [],
      missingSkills: [],
      explanation: "No resume has been uploaded for this candidate.",
    };
  }

  const resumePath = resolveResumePath(user.resume);
  if (!resumePath || !fs.existsSync(resumePath)) {
    return {
      score: null,
      matchedSkills: [],
      missingSkills: [],
      explanation: "The uploaded resume could not be found or read.",
    };
  }

  const resumeText = await extractResumeText(resumePath);
  if (resumeText.length < 50) {
    return {
      score: null,
      matchedSkills: [],
      missingSkills: [],
      explanation:
        "Resume text could not be extracted. Upload a readable, text-based PDF to calculate a match score.",
    };
  }

  return calculateSkillMatch(
    [
      resumeText,
      user.skills,
      user.education,
      user.experience,
      user.profileInformation,
    ]
      .filter(Boolean)
      .join(" "),
    job,
  );
};

module.exports = {
  calculateJobMatch,
  calculateCandidateJobMatch,
  calculateSkillMatch,
  extractJobSkills,
  extractUserSkills,
  extractKnownSkills,
};
