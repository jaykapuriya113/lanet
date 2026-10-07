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
]);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+\-#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeSkill = (skill = "") => {
  const normalized = normalizeText(skill).replace(/\s+/g, " ");
  const aliasMap = {
    reactjs: "react",
    react: "react",
    javascript: "javascript",
    js: "javascript",
    typescript: "typescript",
    ts: "typescript",
    nodejs: "node",
    node: "node",
    mongodb: "mongodb",
    mongo: "mongodb",
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
  };

  return aliasMap[normalized] || normalized;
};

const extractTokens = (value = "") => {
  const normalized = normalizeText(value);
  if (!normalized) return [];

  return normalized
    .split(/[\s,;|/]+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter(
      (token) =>
        token && token.length > 2 && !COMMON_SKILL_STOPWORDS.has(token),
    );
};

const extractJobSkills = (job = {}) => {
  const content = [
    job.title,
    job.description,
    job.AdditionalInformation,
    job.companyName,
    job.location,
  ].join(" ");
  const tokens = extractTokens(content).map((skill) => normalizeSkill(skill));
  return [...new Set(tokens.filter(Boolean))];
};

const extractUserSkills = (user = {}) => {
  const content = [
    user.skills,
    user.education,
    user.experience,
    user.profileInformation,
    user.resume,
  ].join(" ");
  const tokens = extractTokens(content).map((skill) => normalizeSkill(skill));
  return [...new Set(tokens.filter(Boolean))];
};

const hasEducationFit = (user = {}, jobText = "") => {
  const userEducation = normalizeText(user.education || "");
  const jobTextNormalized = normalizeText(jobText);
  const educationKeywords = [
    "bachelor",
    "bca",
    "bsc",
    "be",
    "btech",
    "bachelor's",
    "master",
    "mca",
    "msc",
    "mtech",
    "diploma",
    "degree",
    "engineering",
    "commerce",
    "computer",
    "it",
    "technology",
  ];

  return educationKeywords.some(
    (keyword) =>
      userEducation.includes(keyword) || jobTextNormalized.includes(keyword),
  );
};

const hasExperienceFit = (user = {}) => {
  const experienceText = normalizeText(user.experience || "");
  return (
    /\b\d+\s*(year|years|yr|yrs)\b/.test(experienceText) ||
    /\b\d+\+?\b/.test(experienceText)
  );
};

const buildExplanation = (matchedSkills, missingSkills, score) => {
  if (!matchedSkills.length) {
    if (!missingSkills.length) {
      return "No clear skill match data is available for this role yet.";
    }
    return `The profile is missing core skills like ${missingSkills.slice(0, 3).join(", ")}.`;
  }

  if (score >= 80) {
    return `Strong fit based on ${matchedSkills.slice(0, 3).join(", ")}.`;
  }

  if (score >= 60) {
    return `Good fit with ${matchedSkills.slice(0, 3).join(", ")}, but adding ${missingSkills.slice(0, 2).join(", ")} would improve the match.`;
  }

  return `Partial fit from ${matchedSkills.slice(0, 2).join(", ")}; focus on ${missingSkills.slice(0, 2).join(", ")} to improve alignment.`;
};

export const calculateJobMatch = (user = {}, job = {}) => {
  const jobSkills = extractJobSkills(job);
  const userSkills = extractUserSkills(user);

  if (!jobSkills.length) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
      explanation: "No skill data is available for this job yet.",
    };
  }

  const matchedSkills = jobSkills.filter((skill) => userSkills.includes(skill));
  const missingSkills = jobSkills.filter(
    (skill) => !userSkills.includes(skill),
  );
  const jobText = [job.title, job.description, job.AdditionalInformation].join(
    " ",
  );

  let score = 0;
  score += (matchedSkills.length / jobSkills.length) * 75;

  if (hasEducationFit(user, jobText)) score += 15;
  if (hasExperienceFit(user)) score += 10;
  if (userSkills.length) score += 5;

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score: finalScore,
    matchedSkills: matchedSkills.slice(0, 6),
    missingSkills: missingSkills.slice(0, 6),
    explanation: buildExplanation(matchedSkills, missingSkills, finalScore),
  };
};

export const getMatchBadgeColor = (score = 0) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  if (score > 0) return "info";
  return "default";
};
