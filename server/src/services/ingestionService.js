const { getRepositoryTree } = require("../services/githubService.js");

const { filterRepositoryFiles } = require("../rag/fileFilter.js");

const {
  extractRepositoryFiles,
} = require("../rag/repoFileContentExtractor.js");

const { processRepositoryDocuments } = require("../rag/documentProcessor.js");

const { chunkDocuments } = require("../rag/codeChunker.js");

const { replaceRepositoryDocuments } = require("../rag/vectorStoreService.js");

/**
 * Normalize the MongoDB repository object
 * into the structure required by documentProcessor.
 */
const normalizeRepository = (repository) => {
  const repositoryId = repository._id || repository.repositoryId;

  const owner =
    typeof repository.owner === "object"
      ? repository.owner.login
      : repository.owner;

  const repositoryName = repository.name || repository.repositoryName;

  const branch = repository.defaultBranch || repository.branch;

  if (!repositoryId || !owner || !repositoryName || !branch) {
    throw new Error("Incomplete repository information.");
  }

  return {
    repositoryId: String(repositoryId),
    repositoryName,
    owner,
    branch,
  };
};

/**
 * Main repository ingestion function.
 */
const ingestRepository = async (repository) => {
  try {
    console.log("\n========== RAG INGESTION STARTED ==========\n");

    // STEP 1: Normalize repository information
    const repo = normalizeRepository(repository);

    console.log(`Repository: ${repo.owner}/${repo.repositoryName}`);
    console.log(`Branch: ${repo.branch}`);

    // STEP 2: Fetch complete repository file tree
    console.log("\n[1/6] Fetching repository tree...");

    const { tree, truncated } = await getRepositoryTree(
      repo.owner,
      repo.repositoryName,
      repo.branch,
    );

    if (truncated) {
      throw new Error(
        "Repository tree was truncated by GitHub. Complete ingestion cannot proceed.",
      );
    }

    console.log(`Total tree entries: ${tree.length}`);

    // STEP 3: Filter eligible files
    console.log("\n[2/6] Filtering repository files...");

    const eligibleFiles = filterRepositoryFiles(tree);

    console.log(`Eligible files: ${eligibleFiles.length}`);

    if (eligibleFiles.length === 0) {
      throw new Error("No eligible files found in this repository.");
    }

    // STEP 4: Extract file contents
    console.log("\n[3/6] Extracting file contents...");

    const extractionResult = await extractRepositoryFiles(
      repo.owner,
      repo.repositoryName,
      eligibleFiles,
      repo.branch,
    );

    const {
      extractedFiles,
      failedFiles,
      totalFiles,
      successfulFiles,
      failedCount,
    } = extractionResult;

    console.log(`Successfully extracted: ${successfulFiles}`);
    console.log(`Failed extractions: ${failedCount}`);

    if (extractedFiles.length === 0) {
      throw new Error(
        "Unable to extract content from any eligible repository file.",
      );
    }

    // STEP 5: Convert extracted files into documents
    console.log("\n[4/6] Processing documents...");

    const documents = processRepositoryDocuments(extractedFiles, repo);

    console.log(`Documents created: ${documents.length}`);

    // STEP 6: Generate code chunks
    console.log("\n[5/6] Generating chunks...");

    const chunks = await chunkDocuments(documents);

    console.log(`Total chunks generated: ${chunks.length}`);

    if (chunks.length === 0) {
      throw new Error("Chunking completed but no chunks were generated.");
    }

    // STEP 7: Generate embeddings and store in ChromaDB
    console.log("\n[6/6] Generating embeddings and storing vectors...");

    /*
     * Current vectorStore.addDocuments() expects
     * file metadata at the top level of each chunk.
     *
     * Our chunker stores metadata inside chunk.metadata.
     * Therefore, we adapt the structure here.
     */
    const vectorResult = await replaceRepositoryDocuments(
      repo.repositoryId,
      chunks,
    );

    // FINAL RESULT
    console.log("\n========== RAG INGESTION COMPLETED ==========\n");

    return {
      success: true,

      repository: {
        id: repo.repositoryId,
        name: repo.repositoryName,
        owner: repo.owner,
        branch: repo.branch,
      },

      statistics: {
        totalTreeEntries: tree.length,
        eligibleFiles: eligibleFiles.length,
        totalFiles,
        successfulFiles,
        failedFiles: failedCount,
        documentsCreated: documents.length,
        chunksGenerated: chunks.length,
        vectorsStored: vectorResult?.count ?? chunks.length,
      },

      failedFilePaths: failedFiles,
    };
  } catch (error) {
    console.error("\nRAG INGESTION FAILED:", error.message);

    throw error;
  }
};

module.exports = {
  ingestRepository,
};
