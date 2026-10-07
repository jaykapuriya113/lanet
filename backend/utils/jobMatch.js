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
    user.resume,
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
      score: 0,
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

module.exports = {
  calculateJobMatch,
  extractJobSkills,
  extractUserSkills,
};
