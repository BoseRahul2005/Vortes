
const path = require("path");

// Supported file extensions
const SUPPORTED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".go",
  ".rs",
  ".php",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".mdx",
  ".vue",
  ".svelte",
  ".sql",
  ".sh",
  ".yaml",
  ".yml",
  ".toml",
]);

// Directories that should never be processed
const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".venv",
  "venv",
  "__pycache__",
  "vendor",
  "target",
  "out",
  "generated",
]);

// Files that should never be processed
const EXCLUDED_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  "composer.lock",
  "poetry.lock",
  "cargo.lock",
  "gemfile.lock",
  ".ds_store",
  "thumbs.db",
]);

// Avoid secrets and environment files
const EXCLUDED_FILE_PATTERNS = [
  /^\.env($|\.)/i,
  /\.min\.(js|css)$/i,
  /\.map$/i,
  /\.(pem|key|p12|pfx)$/i,
  /(^|\/)(id_rsa|id_ed25519)(\.pub)?$/i,
];

// Maximum allowed file size: 200 KB
const MAX_FILE_SIZE = 200 * 1024;

const isFileEligible = (file) => {
  // Only process actual files
  if (file.type !== "blob") {
    return false;
  }

  const filePath = file.path;
  const fileName = path.posix.basename(filePath);
  const extension = path.posix.extname(fileName).toLowerCase();

  // Exclude unwanted directories
  const directories = filePath.split("/");

  if (
    directories.some((directory) =>
      EXCLUDED_DIRECTORIES.has(directory.toLowerCase())
    )
  ) {
    return false;
  }

  // Exclude unwanted filenames
  if (EXCLUDED_FILES.has(fileName.toLowerCase())) {
    return false;
  }

  // Exclude sensitive and generated files
  if (
    EXCLUDED_FILE_PATTERNS.some((pattern) =>
      pattern.test(filePath)
    )
  ) {
    return false;
  }

  // Only allow supported extensions
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return false;
  }

  // Exclude empty or oversized files
  if (
    typeof file.size !== "number" ||
    file.size <= 0 ||
    file.size > MAX_FILE_SIZE
  ) {
    return false;
  }

  return true;
};

// Filter the complete repository tree
const filterRepositoryFiles = (tree) => {
  return tree.filter(isFileEligible);
};

module.exports = {
  filterRepositoryFiles,
  isFileEligible,
  MAX_FILE_SIZE,
};
