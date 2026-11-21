const express = require("express");
const {
  checkRepository,
  addRepository,
  getUserRepositories,
  getRepositoryById,
  getRepositoryFiles,
  getRepositoryFileContent,
  deleteRepository,
} = require("../controllers/repositoryController.js");
const { protectRoute } = require("../middleware/authMiddleware.js");

const repoRouter = express.Router();

// Get all repositories of logged-in user
repoRouter.get("/", protectRoute, getUserRepositories);
repoRouter.get("/user", protectRoute, getUserRepositories);

// Check repository existence in DB and file availability
repoRouter.post("/check", protectRoute, checkRepository);

// Add a GitHub repository to DB
repoRouter.post("/add", protectRoute, addRepository);

// Delete repository from MongoDB and ChromaDB
repoRouter.delete("/:id", protectRoute, deleteRepository);

// Get repository by ID
repoRouter.get("/:id", protectRoute, getRepositoryById);

// Get repository file tree
repoRouter.get("/:id/tree", protectRoute, getRepositoryFiles);

// Get individual file content
repoRouter.get("/:id/file", protectRoute, getRepositoryFileContent);

module.exports = repoRouter;
