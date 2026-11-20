const mongoose = require("mongoose");
const { getAuth } = require("@clerk/express");
const { parseGitHubRepoUrl } = require("../utils/githubUrl.js");
const {
  getRepositoryDetails,
  getRepositoryTree,
  getFileContent,
} = require("../services/githubService.js");
const Repository = require("../models/Repository.js");
const buildFileTree = require("../utils/buildFileTree.js");

// Check if a repository is already in the database and verify its files
const checkRepository = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { repoUrl } = req.body;

    const result = parseGitHubRepoUrl(repoUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const { owner, repo } = result;

    // 1. Check if repo already exists in DB for this user
    const existingRepo = await Repository.findOne({
      userId,
      fullName: new RegExp(`^${owner}/${repo}$`, "i"),
    });

    if (existingRepo) {
      return res.status(200).json({
        success: true,
        exists: true,
        repository: existingRepo,
      });
    }

    // 2. Not in DB: Fetch repo details from GitHub
    const repoData = await getRepositoryDetails(owner, repo);

    // Double-check by githubId in case casing differed
    const existingByGithubId = await Repository.findOne({
      userId,
      githubId: repoData.githubId,
    });

    if (existingByGithubId) {
      return res.status(200).json({
        success: true,
        exists: true,
        repository: existingByGithubId,
      });
    }

    // 3. Check if the repository has any files on GitHub
    const { tree } = await getRepositoryTree(
      repoData.owner,
      repoData.name,
      repoData.defaultBranch
    );

    const fileCount = tree.filter((item) => item.type === "blob").length;

    if (fileCount === 0) {
      return res.status(200).json({
        success: true,
        exists: false,
        hasFiles: false,
        message: "No files exist",
        repoData,
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      hasFiles: true,
      repoData,
      totalFiles: fileCount,
    });
  } catch (error) {
    console.error("Check repository error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check repository.",
    });
  }
};

const addRepository = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { repoUrl } = req.body;

    const result = parseGitHubRepoUrl(repoUrl);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    const { owner, repo } = result;
    const repoData = await getRepositoryDetails(owner, repo);

    const existingRepo = await Repository.findOne({
      githubId: repoData.githubId,
      userId,
    });

    if (existingRepo) {
      return res.status(200).json({
        success: true,
        message: "Repository already exists.",
        repository: existingRepo,
      });
    }

    // Check if repo has files before inserting
    const { tree } = await getRepositoryTree(
      repoData.owner,
      repoData.name,
      repoData.defaultBranch
    );

    const fileCount = tree.filter((item) => item.type === "blob").length;

    if (fileCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No files exist",
      });
    }

    const repository = await Repository.create({
      ...repoData,
      userId,
    });

    return res.status(201).json({
      success: true,
      repository,
    });
  } catch (error) {
    console.error("Add repository error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

const getRepositoryById = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID.",
      });
    }

    const repository = await Repository.findOne({
      _id: id,
      userId,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Repository retrieved successfully.",
      repository,
    });
  } catch (error) {
    console.error("Error retrieving repository:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve repository.",
    });
  }
};

const getRepositoryFiles = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID.",
      });
    }

    const repository = await Repository.findOne({
      _id: id,
      userId,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    // Fetch actual GitHub file structure
    const { tree, truncated } = await getRepositoryTree(
      repository.owner,
      repository.name,
      repository.defaultBranch
    );

    if (truncated) {
      return res.status(422).json({
        success: false,
        message: "Repository is too large to retrieve in one tree request.",
      });
    }

    const totalFiles = tree.filter((item) => item.type === "blob").length;

    // Check if the repo has any files
    if (totalFiles === 0) {
      return res.status(400).json({
        success: false,
        message: "No files exist",
      });
    }

    const fileTree = buildFileTree(tree);

    return res.status(200).json({
      success: true,
      fileTree,
      totalFiles,
    });
  } catch (error) {
    console.error("Get repository files error:", error);

    return res.status(502).json({
      success: false,
      message: error.message || "Failed to retrieve repository files.",
    });
  }
};

const getRepositoryFileContent = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { id } = req.params;
    const { path } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid repository ID.",
      });
    }

    if (typeof path !== "string" || !path.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid file path is required.",
      });
    }

    const repository = await Repository.findOne({
      _id: id,
      userId,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found.",
      });
    }

    const file = await getFileContent(
      repository.owner,
      repository.name,
      path,
      repository.defaultBranch
    );

    return res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    console.error("Get file content error:", error);

    return res.status(502).json({
      success: false,
      message: error.message || "Failed to retrieve file content.",
    });
  }
};

const getUserRepositories = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please sign in.",
      });
    }

    const repositories = await Repository.find({ userId }).sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      repositories,
    });
  } catch (error) {
    console.error("Get user repositories error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve user repositories.",
    });
  }
};

module.exports = {
  checkRepository,
  addRepository,
  getUserRepositories,
  getRepositoryById,
  getRepositoryFiles,
  getRepositoryFileContent,
};
