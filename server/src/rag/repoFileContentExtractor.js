const { getFileContent } = require("../services/githubService.js");

// Number of files fetched simultaneously
const CONCURRENCY_LIMIT = 5;

// Fetch and validate an individual file
const extractFileContent = async (owner, repo, filePath, branch) => {
  try {
    const file = await getFileContent(owner, repo, filePath, branch);

    if (!file.content || !file.content.trim()) {
      throw new Error("File content is empty.");
    }

    return {
      name: file.name,
      path: file.path,
      sha: file.sha,
      size: file.size,
      content: file.content,
    };
  } catch (error) {
    console.error(`Failed to extract ${filePath}:`, error.message);

    return null;
  }
};

// Process files with controlled concurrency
const extractRepositoryFiles = async (owner, repo, files, branch) => {
  const extractedFiles = [];
  const failedFiles = [];

  for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
    const batch = files.slice(i, i + CONCURRENCY_LIMIT);

    const results = await Promise.all(
      batch.map((file) => extractFileContent(owner, repo, file.path, branch)),
    );

    results.forEach((result, index) => {
      if (result) {
        extractedFiles.push(result);
      } else {
        failedFiles.push(batch[index].path);
      }
    });

    console.log(
      `Processed ${Math.min(
        i + CONCURRENCY_LIMIT,
        files.length,
      )}/${files.length} files`,
    );
  }

  return {
    extractedFiles,
    failedFiles,
    totalFiles: files.length,
    successfulFiles: extractedFiles.length,
    failedCount: failedFiles.length,
  };
};

module.exports = {
  extractFileContent,
  extractRepositoryFiles,
};
