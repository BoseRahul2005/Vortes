const { getAuth } = require("@clerk/express");
const Repository = require("../models/Repository");
const { generateRepositoryAnswer } = require("../services/answerService");

const askRepository = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { repositoryId, query } = req.body;

    // Validate request
    if (!repositoryId) {
      return res.status(400).json({
        success: false,
        message: "Repository ID is required",
      });
    }

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid question is required",
      });
    }

    // Find repository
    const repository = await Repository.findOne({
      _id: repositoryId,
      userId,
    });

    if (!repository) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    // Generate repository-aware answer
    const result = await generateRepositoryAnswer({
      query: query.trim(),
      repository,
    });

    return res.status(200).json({
      success: true,
      message: "Answer generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("RAG Controller Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate repository answer",
      error: error.message,
    });
  }
};

module.exports = {
  askRepository,
};
