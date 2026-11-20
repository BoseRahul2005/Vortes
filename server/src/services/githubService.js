const GITHUB_API_BASE_URL = "https://api.github.com";

const getRepositoryDetails = async (owner, repo) => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Vortes",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Repository not found or inaccessible");
      }

      if (response.status === 403) {
        const remaining = response.headers.get("x-ratelimit-remaining");

        if (remaining === "0") {
          throw new Error("GitHub API rate limit exceeded");
        }

        throw new Error("GitHub API access forbidden");
      }

      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      githubId: data.id,
      name: data.name,
      owner: data.owner.login,
      fullName: data.full_name,
      url: data.html_url,
      description: data.description,
      isPrivate: data.private,
      defaultBranch: data.default_branch,
      language: data.language,
      stars: data.stargazers_count,
      forks: data.forks_count,
    };
  } catch (error) {
    throw error;
  }
};

const githubRequest = async (endpoint) => {
  const response = await fetch(`${GITHUB_API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Vortes",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("GitHub resource not found or inaccessible.");
    }

    if (response.status === 403) {
      const remaining = response.headers.get("x-ratelimit-remaining");

      if (remaining === "0") {
        throw new Error("GitHub API rate limit exceeded.");
      }
    }

    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
};

// 1. Get the complete repository file tree
const getRepositoryTree = async (owner, repo, branch) => {
  // Get branch details
  const branchData = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(branch)}`,
  );

  const commitSha = branchData.commit.sha;

  // Get commit details
  const commitData = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${commitSha}`,
  );

  const treeSha = commitData.tree.sha;

  // Get recursive file tree
  const treeData = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${treeSha}?recursive=1`,
  );

  return {
    tree: treeData.tree,
    truncated: treeData.truncated,
  };
};

// 2. Get the contents of an individual file
const getFileContent = async (owner, repo, path, branch) => {
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  const fileData = await githubRequest(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`,
  );

  if (Array.isArray(fileData) || fileData.type !== "file") {
    throw new Error("The requested path is not a file.");
  }

  if (fileData.encoding !== "base64" || !fileData.content) {
    throw new Error(
      "File content is unavailable or exceeds the supported size.",
    );
  }

  const content = Buffer.from(fileData.content, "base64").toString("utf8");

  // Basic protection against displaying binary files as source code
  if (content.includes("\0")) {
    throw new Error("Binary files are not supported.");
  }

  return {
    name: fileData.name,
    path: fileData.path,
    sha: fileData.sha,
    size: fileData.size,
    content,
  };
};

module.exports = { getRepositoryDetails, getRepositoryTree, getFileContent };
