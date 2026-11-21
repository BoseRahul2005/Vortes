const path = require("path");

// Map extensions to programming languages
const LANGUAGE_MAP = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".java": "java",
  ".cpp": "cpp",
  ".c": "c",
  ".h": "c",
  ".hpp": "cpp",
  ".go": "go",
  ".rs": "rust",
  ".php": "php",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".json": "json",
  ".md": "markdown",
  ".mdx": "markdown",
  ".vue": "vue",
  ".svelte": "svelte",
  ".sql": "sql",
  ".sh": "shell",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
};

// Identify language from file extension
const getLanguage = (filePath) => {
  const extension = path.posix.extname(filePath).toLowerCase();

  return LANGUAGE_MAP[extension] || "unknown";
};

// Create a standardized document
const createDocument = (file, repository) => {
  const filePath = file.path.replace(/\\/g, "/");

  const fileName = path.posix.basename(filePath);

  const extension = path.posix.extname(fileName).toLowerCase();

  const documentId = `${repository.repositoryId}:${filePath}`;

  return {
    id: documentId,

    content: file.content,

    metadata: {
      repositoryId: String(repository.repositoryId),
      repositoryName: repository.repositoryName,
      owner: repository.owner,

      branch: repository.branch,

      fileName,
      filePath,

      extension,
      language: getLanguage(filePath),

      sha: file.sha,
      size: Number(file.size),
    },
  };
};

// Process all extracted files
const processRepositoryDocuments = (extractedFiles, repository) => {
  if (!Array.isArray(extractedFiles)) {
    throw new Error("Invalid extracted files.");
  }

  if (
    !repository.repositoryId ||
    !repository.repositoryName ||
    !repository.owner ||
    !repository.branch
  ) {
    throw new Error("Incomplete repository information.");
  }

  return extractedFiles
    .filter((file) => file.content && file.content.trim())
    .map((file) => createDocument(file, repository));
};

module.exports = {
  getLanguage,
  createDocument,
  processRepositoryDocuments,
};
