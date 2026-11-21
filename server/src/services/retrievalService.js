const { searchSimilar } = require("../rag/vectorStoreService.js");

/**
 * Rank and deduplicate retrieved chunks.
 */
const rankAndDeduplicateChunks = (chunks) => {
  const uniqueChunks = new Map();

  for (const chunk of chunks) {
    if (!uniqueChunks.has(chunk.id)) {
      uniqueChunks.set(chunk.id, chunk);
    }
  }

  return Array.from(uniqueChunks.values()).sort(
    (a, b) => b.similarity - a.similarity,
  );
};

/**
 * Prepare retrieved code chunks into LLM-ready context.
 */
const prepareContext = (chunks) => {
  if (!Array.isArray(chunks)) {
    throw new Error("Chunks must be an array");
  }

  if (chunks.length === 0) {
    return "No relevant code context was found.";
  }

  const contextSections = chunks.map((chunk, index) => {
    const metadata = chunk.metadata || {};

    return `
[${index + 1}] File: ${metadata.filePath || "Unknown"}
Language: ${metadata.language || "Unknown"}
Lines: ${metadata.startLine || "?"}-${metadata.endLine || "?"}
Similarity: ${
      chunk.similarity !== null
        ? `${(chunk.similarity * 100).toFixed(2)}%`
        : "Unknown"
    }

CODE:
${chunk.content || ""}
        `.trim();
  });

  return `
REPOSITORY CONTEXT

${contextSections.join("\n\n----------------------------------------\n\n")}
    `.trim();
};

/**
 * Retrieve relevant code chunks from a repository.
 */
const retrieveRelevantChunks = async (
  query,
  repositoryId,
  limit = 5,
  similarityThreshold = 0.5,
) => {
  try {
    // Validate query
    if (typeof query !== "string" || !query.trim()) {
      throw new Error("Query must be a non-empty string");
    }

    // Validate repository ID
    if (!repositoryId) {
      throw new Error("Repository ID is required");
    }

    // Validate limit
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Limit must be a positive integer");
    }

    // Validate similarity threshold
    if (
      typeof similarityThreshold !== "number" ||
      similarityThreshold < 0 ||
      similarityThreshold > 1
    ) {
      throw new Error("Similarity threshold must be between 0 and 1");
    }

    // Perform semantic search
    const searchResults = await searchSimilar(query, repositoryId, limit);

    // Convert cosine distance into similarity score
    const scoredResults = searchResults.map((result) => {
      const similarity =
        result.distance === null
          ? null
          : Math.max(0, Math.min(1, 1 - result.distance));

      return {
        ...result,
        similarity,
      };
    });

    // Filter results using similarity threshold
    const relevantResults = scoredResults.filter(
      (result) =>
        result.similarity !== null && result.similarity >= similarityThreshold,
    );

    // Rank and deduplicate results
    const rankedResults = rankAndDeduplicateChunks(relevantResults);

    return rankedResults;
  } catch (error) {
    throw new Error(`Retrieval failed: ${error.message}`, { cause: error });
  }
};

module.exports = {
  retrieveRelevantChunks,
  rankAndDeduplicateChunks,
  prepareContext,
};
