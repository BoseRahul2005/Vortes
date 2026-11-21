const { retrieveRelevantChunks } = require("../services/retrievalService");

const { buildPrompt } = require("../utils/promptBuilder");
const { generateResponse } = require("../services/llmService");

/**
 * Generate an AI answer using repository-specific context.
 */
const generateRepositoryAnswer = async ({
  query,
  repository,
  limit = 5,
  similarityThreshold = 0.5,
}) => {
  try {
    // Validate input
    if (typeof query !== "string" || !query.trim()) {
      throw new Error("Query must be a non-empty string");
    }

    if (!repository || !repository._id) {
      throw new Error("Valid repository is required");
    }

    // Step 1: Retrieve relevant code chunks
    const retrievedChunks = await retrieveRelevantChunks(
      query,
      repository._id,
      limit,
      similarityThreshold,
    );

    // Step 2: Build the Gemini prompt
    const prompt = buildPrompt({
      query,
      chunks: retrievedChunks,
      repository: {
        name: repository.name,
        owner: repository.owner,
        defaultBranch: repository.defaultBranch,
      },
    });

    // Step 3: Generate the AI response
    const answer = await generateResponse(prompt);

    // Step 4: Return answer and retrieval information
    return {
      answer,
      sources: retrievedChunks.map((chunk) => ({
        filePath: chunk.metadata?.filePath || "Unknown",
        language: chunk.metadata?.language || "Unknown",
        startLine: chunk.metadata?.startLine || null,
        endLine: chunk.metadata?.endLine || null,
        similarity: chunk.similarity,
        content: chunk.content,
      })),
      metadata: {
        repositoryId: String(repository._id),
        repositoryName: repository.name,
        retrievedChunks: retrievedChunks.length,
      },
    };
  } catch (error) {
    throw new Error(`Repository answer generation failed: ${error.message}`, {
      cause: error,
    });
  }
};

module.exports = {
  generateRepositoryAnswer,
};
