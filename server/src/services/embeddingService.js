const { GoogleGenAI } = require("@google/genai");

// ==========================================
// 1. GEMINI CLIENT INITIALIZATION
// ==========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================================
// 2. EMBEDDING CONFIGURATION
// ==========================================

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-2";

const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 768);

// ==========================================
// 3. EMBEDDING VALIDATION
// ==========================================

const validateEmbedding = (embedding) => {
  if (!Array.isArray(embedding)) {
    throw new Error("Invalid embedding: Expected an array");
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding dimensions. Expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`,
    );
  }

  if (
    !embedding.every(
      (value) => typeof value === "number" && Number.isFinite(value),
    )
  ) {
    throw new Error("Invalid embedding: Contains non-numeric values");
  }

  return true;
};

// ==========================================
// TOKEN COUNTING CONFIGURATION
// ==========================================

const MAX_INPUT_TOKENS = 8192;

// ==========================================
// COUNT INPUT TOKENS
// ==========================================

const countInputTokens = async (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Token counting requires non-empty text");
  }

  try {
    const response = await ai.models.countTokens({
      model: EMBEDDING_MODEL,
      contents: text,
    });

    if (!Number.isInteger(response.totalTokens)) {
      throw new Error("Invalid token count response from Gemini");
    }

    return response.totalTokens;
  } catch (error) {
    throw new Error(`Failed to count input tokens: ${error.message}`, {
      cause: error,
    });
  }
};

// ==========================================
// VALIDATE INPUT TOKEN LIMIT
// ==========================================

const validateInputLength = async (text) => {
  const tokenCount = await countInputTokens(text);

  if (tokenCount > MAX_INPUT_TOKENS) {
    throw new Error(
      `Input exceeds Gemini's token limit. ` +
        `Received ${tokenCount}, maximum ${MAX_INPUT_TOKENS}`,
    );
  }

  return {
    valid: true,
    tokenCount,
    maxTokens: MAX_INPUT_TOKENS,
  };
};

// ==========================================
// 4. DOCUMENT FORMATTING
// ==========================================

const prepareDocumentText = (content, title = "none") => {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Document content must be a non-empty string");
  }

  if (typeof title !== "string") {
    throw new Error("Document title must be a string");
  }

  return `title: ${title.trim() || "none"} | text: ${content}`;
};

// ==========================================
// 5. QUERY FORMATTING
// ==========================================

const prepareQueryText = (query) => {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("Query must be a non-empty string");
  }

  return `task: code retrieval | query: ${query.trim()}`;
};

// ==========================================
// 4. GENERATE SINGLE EMBEDDING
// ==========================================

const generateEmbedding = async (text) => {
  try {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Embedding input must be a non-empty string");
    }

    // Validate token count before generating embedding
    await validateInputLength(text);

    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    });

    const embedding = response.embeddings?.[0]?.values;

    validateEmbedding(embedding);

    return embedding;
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error.message}`, {
      cause: error,
    });
  }
};

const generateBatchEmbeddings = async (texts, concurrency = 3) => {
  // Validate input
  if (!Array.isArray(texts)) {
    throw new Error("Batch input must be an array");
  }

  if (texts.length === 0) {
    return [];
  }

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer");
  }

  // Validate all chunks before making API calls
  texts.forEach((text, index) => {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error(`Invalid text at batch index ${index}`);
    }
  });

  // Store results in their original positions
  const embeddings = new Array(texts.length);

  // Shared index for distributing work among workers
  let currentIndex = 0;

  let hasFailed = false;

  if (hasFailed) return;

  const worker = async () => {
    while (true) {
      const index = currentIndex++;

      if (index >= texts.length) {
        return;
      }

      try {
        embeddings[index] = await generateEmbedding(texts[index]);
      } catch (error) {
        hasFailed = true;
        throw new Error(
          `Failed to embed chunk at index ${index}: ${error.message}`,
          { cause: error },
        );
      }
    }
  };

  // Don't create more workers than available chunks
  const workerCount = Math.min(concurrency, texts.length);

  const workers = Array.from({ length: workerCount }, () => worker());

  const results = await Promise.allSettled(workers);

  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    throw failure.reason;
  }

  return embeddings;
};

// ==========================================
// 6. GENERATE DOCUMENT EMBEDDING
// ==========================================

const generateDocumentEmbedding = async (content, title = "none") => {
  const formattedText = prepareDocumentText(content, title);

  return await generateEmbedding(formattedText);
};

// ==========================================
// 7. GENERATE QUERY EMBEDDING
// ==========================================

const generateQueryEmbedding = async (query) => {
  const formattedQuery = prepareQueryText(query);

  return await generateEmbedding(formattedQuery);
};

// ==========================================
// 5. EXPORTS
// ==========================================

module.exports = {
  generateEmbedding,
  generateBatchEmbeddings,
  generateDocumentEmbedding,
  generateQueryEmbedding,

  prepareDocumentText,
  prepareQueryText,

  countInputTokens,
  validateInputLength,
  validateEmbedding,

  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  MAX_INPUT_TOKENS,
};
