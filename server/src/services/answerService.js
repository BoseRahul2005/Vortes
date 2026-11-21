const { retrieveRelevantChunks } = require("../services/retrievalService");
const { buildPrompt } = require("../utils/promptBuilder");
const { generateResponse } = require("../services/llmService");
const {
  getRepositoryTree,
  getFileContent,
} = require("../services/githubService");

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "where",
  "what",
  "which",
  "who",
  "when",
  "why",
  "how",
  "all",
  "any",
  "both",
  "each",
  "handled",
  "implemented",
  "located",
  "defined",
  "used",
  "working",
  "work",
  "explain",
  "show",
  "tell",
  "code",
  "file",
  "files",
  "project",
  "repo",
]);

const SYNONYM_MAP = {
  auth: [
    "auth",
    "login",
    "signup",
    "session",
    "jwt",
    "token",
    "password",
    "protect",
    "user",
    "middleware",
  ],
  authentication: [
    "auth",
    "login",
    "signup",
    "session",
    "jwt",
    "token",
    "password",
    "protect",
    "user",
    "middleware",
  ],
  login: ["auth", "login", "session", "signin", "user"],
  signup: ["auth", "signup", "register", "user"],
  routes: ["route", "router", "endpoint", "api", "controller", "server", "app"],
  route: ["route", "router", "endpoint", "api", "controller", "server", "app"],
  api: ["api", "route", "endpoint", "controller"],
  database: [
    "db",
    "database",
    "model",
    "schema",
    "prisma",
    "mongoose",
    "mongo",
  ],
  db: ["db", "database", "model", "schema", "prisma", "mongoose", "mongo"],
  model: ["model", "schema", "entity"],
  models: ["model", "schema", "entity"],
  middleware: ["middleware", "protect", "guard", "auth", "verify"],
  socket: ["socket", "io", "chat", "message", "realtime", "event"],
  chat: ["chat", "message", "conversation", "socket"],
  message: ["message", "chat", "conversation"],
  config: ["config", "env", "setting", "setup"],
};

/**
 * Fallback retrieval: When ChromaDB has not yet indexed this repository
 * or is temporarily offline, extract relevant code files directly from the
 * repository file tree so the AI always has real code context.
 */
const retrieveFallbackChunks = async (repository, query, maxFiles = 4) => {
  try {
    const { tree } = await getRepositoryTree(
      repository.owner,
      repository.name,
      repository.defaultBranch,
    );

    if (!Array.isArray(tree) || tree.length === 0) {
      return [];
    }

    const tokens = query
      .toLowerCase()
      .replace(/[^a-z0-9_\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

    const searchTerms = new Set(tokens);
    for (const token of tokens) {
      if (SYNONYM_MAP[token]) {
        SYNONYM_MAP[token].forEach((syn) => searchTerms.add(syn));
      }
    }

    const ignoredExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".ico",
      ".lock",
      ".woff",
      ".woff2",
      ".ttf",
      ".eot",
      ".mp4",
      ".pdf",
      ".zip",
    ];

    const candidates = tree.filter((item) => {
      if (item.type !== "blob") return false;
      const lower = item.path.toLowerCase();
      if (
        lower.includes("node_modules/") ||
        lower.includes("dist/") ||
        lower.includes("build/") ||
        lower.startsWith(".git/")
      ) {
        return false;
      }
      return !ignoredExtensions.some((ext) => lower.endsWith(ext));
    });

    const scored = candidates.map((item) => {
      const lowerPath = item.path.toLowerCase();
      const fileName = lowerPath.split("/").pop();
      let score = 0;

      for (const term of searchTerms) {
        if (fileName.includes(term)) {
          score += 5;
        } else if (lowerPath.includes(term)) {
          score += 2;
        }
      }

      return { ...item, score };
    });

    let topCandidates = scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFiles);

    // If no keyword match, grab high-value project overview files
    if (topCandidates.length === 0) {
      const overviewPriority = [
        "readme.md",
        "package.json",
        "server.js",
        "app.js",
        "index.js",
        "main.jsx",
        "app.jsx",
      ];
      topCandidates = candidates
        .filter((item) => {
          const fn = item.path.toLowerCase().split("/").pop();
          return overviewPriority.includes(fn);
        })
        .slice(0, maxFiles);
    }

    if (topCandidates.length === 0) {
      return [];
    }

    const fileResults = await Promise.allSettled(
      topCandidates.map((file) =>
        getFileContent(
          repository.owner,
          repository.name,
          file.path,
          repository.defaultBranch,
        ),
      ),
    );

    const chunks = [];
    fileResults.forEach((res) => {
      if (res.status === "fulfilled" && res.value?.content) {
        const file = res.value;
        const maxChars = 4000;
        const contentSnippet =
          file.content.length > maxChars
            ? file.content.slice(0, maxChars) +
              "\n\n// ... [remaining file content truncated for prompt context limit]"
            : file.content;

        const lineCount = (contentSnippet.match(/\n/g) || []).length + 1;

        chunks.push({
          id: `fallback_${file.path}`,
          content: contentSnippet,
          metadata: {
            filePath: file.path,
            language: file.path.split(".").pop() || "text",
            startLine: 1,
            endLine: lineCount,
          },
          similarity: 1.0,
        });
      }
    });

    return chunks;
  } catch (error) {
    console.warn("Direct file tree retrieval error:", error.message);
    return [];
  }
};

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

    // Step 1: Retrieve relevant code chunks from ChromaDB vector search
    let retrievedChunks = [];
    try {
      retrievedChunks = await retrieveRelevantChunks(
        query,
        repository._id,
        limit,
        similarityThreshold,
      );
    } catch (retrievalError) {
      console.warn("ChromaDB retrieval warning:", retrievalError.message);
      retrievedChunks = [];
    }

    // Step 1B: If vector search returned 0 chunks (ChromaDB empty or down), fallback to direct repository code retrieval
    if (retrievedChunks.length === 0) {
      console.log(
        "Vector search returned 0 chunks. Performing direct repository code retrieval...",
      );
      retrievedChunks = await retrieveFallbackChunks(repository, query);
    }

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
