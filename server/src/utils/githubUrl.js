const GITHUB_HOST = "github.com";

const parseGitHubRepoUrl = (input) => {
  // 1. Check whether input exists
  if (!input || typeof input !== "string") {
    return {
      success: false,
      message: "Please enter a GitHub repository URL.",
    };
  }

  try {
    let cleanInput = input.trim();
    if (!cleanInput) {
      return {
        success: false,
        message: "Please enter a GitHub repository URL.",
      };
    }

    // Support shorthand like owner/repo (e.g. facebook/react)
    if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/.test(cleanInput)) {
      cleanInput = `https://github.com/${cleanInput}`;
    } else if (
      !cleanInput.startsWith("http://") &&
      !cleanInput.startsWith("https://")
    ) {
      cleanInput = `https://${cleanInput}`;
    }

    // Parse the URL
    const url = new URL(cleanInput);

    // Normalize hostname: allow github.com or www.github.com
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname !== GITHUB_HOST) {
      return {
        success: false,
        message: "Please enter a valid GitHub repository URL.",
      };
    }

    // Extract pathname parts (ignoring query params and hash)
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length < 2) {
      return {
        success: false,
        message: "URL must contain an owner and repository name.",
      };
    }

    const owner = parts[0];
    const rawRepo = parts[1];

    // Support GitHub clone URLs ending in .git
    const repo = rawRepo.replace(/\.git$/i, "");

    // Validate owner
    const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
    if (!ownerRegex.test(owner)) {
      return {
        success: false,
        message: "Invalid GitHub username or organization.",
      };
    }

    // Validate repository name
    const repoRegex = /^[a-zA-Z0-9._-]+$/;
    if (!repoRegex.test(repo) || repo === "." || repo === "..") {
      return {
        success: false,
        message: "Invalid repository name.",
      };
    }

    return {
      success: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
    };
  } catch (err) {
    return {
      success: false,
      message: "Invalid GitHub repository URL.",
    };
  }
};

module.exports = { parseGitHubRepoUrl };
