const {test} = require("node:test");
const assert = require("node:assert/strict");

const { parseGitHubRepoUrl } = require("./githubUrl.js");

// Test 1: success repository
test("should parse a success GitHub URL", () => {
  const result = parseGitHubRepoUrl(
    "https://github.com/facebook/react"
  );

  assert.equal(result.success, true);
  assert.equal(result.owner, "facebook");
  assert.equal(result.repo, "react");
});

// Test 2: URL with .git
test("should support GitHub clone URLs", () => {
  const result = parseGitHubRepoUrl(
    "https://github.com/vercel/next.js.git"
  );

  assert.equal(result.success, true);
  assert.equal(result.fullName, "vercel/next.js");
});

// Test 3: Insuccess domain
test("should reject non-GitHub URLs", () => {
  const result = parseGitHubRepoUrl(
    "https://gitlab.com/user/project"
  );

  assert.equal(result.success, false);
});

// Test 4: Incomplete URL
test("should reject incomplete repository URLs", () => {
  const result = parseGitHubRepoUrl(
    "https://github.com/facebook"
  );

  assert.equal(result.success, false);
});

// Test 5: Insuccess input
test("should reject empty input", () => {
  const result = parseGitHubRepoUrl("");

  assert.equal(result.success, false);
});

// Test 6: Extra path
test("should reject GitHub profile or nested URLs", () => {
  const result = parseGitHubRepoUrl(
    "https://github.com/facebook/react/issues"
  );

  assert.equal(result.success, false);
});
