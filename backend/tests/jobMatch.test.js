"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  calculateCandidateJobMatch,
  calculateSkillMatch,
} = require("../utils/jobMatch");
const UserHistory = require("../models/jobHistory");

test("scores matched resume skills against skills named in the job posting", () => {
  const match = calculateSkillMatch(
    "Built services with JavaScript and Node.js and delivered React interfaces.",
    {
      title: "Software Developer",
      description: "Required: JavaScript, Node.js, MongoDB, and REST API experience.",
    },
  );

  assert.equal(match.score, 50);
  assert.deepEqual(match.matchedSkills, ["javascript", "node.js"]);
  assert.deepEqual(match.missingSkills, ["mongodb", "rest"]);
  assert.match(match.explanation, /Matched 2 of 4 required skills/);
});

test("does not return a zero score when job requirements are not identifiable", () => {
  const match = calculateSkillMatch("JavaScript and React", {
    title: "Team member",
    description: "A positive attitude and excellent communication.",
  });

  assert.equal(match.score, null);
  assert.match(match.explanation, /No recognizable required skills/);
});

test("does not return a zero score when a candidate has no uploaded resume", async () => {
  const match = await calculateCandidateJobMatch(
    {},
    { title: "Developer", description: "Required: JavaScript and React." },
  );

  assert.equal(match.score, null);
  assert.match(match.explanation, /No resume has been uploaded/);
});

test("application schema stores the calculated score and skill breakdown", () => {
  const application = new UserHistory({
    matchScore: 50,
    matchedSkills: ["javascript"],
    missingSkills: ["mongodb"],
    matchExplanation: "Matched 1 of 2 required skills.",
  });

  assert.equal(application.matchScore, 50);
  assert.deepEqual(application.matchedSkills, ["javascript"]);
  assert.deepEqual(application.missingSkills, ["mongodb"]);
  assert.equal(application.matchExplanation, "Matched 1 of 2 required skills.");
});
