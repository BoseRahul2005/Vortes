
const path = require("path");
const { fileURLToPath } = require("url");
const { Parser, Language } = require("web-tree-sitter");

// ==========================================
// 1. CHUNKING CONFIGURATION
// ==========================================

const CHUNK_CONFIG = {
  targetChunkTokens: 800,
  maxChunkTokens: 1500,
  minChunkTokens: 100,
  overlapTokens: 100,

  // Approximation until a model-specific tokenizer
  // is introduced in the embedding stage.
  charactersPerToken: 4,
};

// ==========================================
// 2. LANGUAGE CONFIGURATION
// ==========================================

const AST_LANGUAGES = {
  javascript: "javascript",
  jsx: "javascript",
  typescript: "typescript",
  tsx: "tsx",
};

const getAstLanguage = (language) => {
  return AST_LANGUAGES[language] || null;
};

// ==========================================
// 3. TREE-SITTER INITIALIZATION
// ==========================================

let initializationPromise = null;

const languageCache = new Map();

const initializeTreeSitter = async () => {
  if (!initializationPromise) {
    initializationPromise = Parser.init();
  }

  await initializationPromise;
};

const loadLanguage = async (grammarName) => {
  if (languageCache.has(grammarName)) {
    return languageCache.get(grammarName);
  }

  await initializeTreeSitter();

  const { wasmURL } = await import(
    "@2h2d/tree-sitter-wasms"
  );

  const grammarPath = fileURLToPath(
    wasmURL(grammarName)
  );

  const language = await Language.load(grammarPath);

  languageCache.set(grammarName, language);

  return language;
};

// ==========================================
// 4. TOKEN ESTIMATION
// ==========================================

const estimateTokens = (text) => {
  return Math.ceil(
    text.length / CHUNK_CONFIG.charactersPerToken
  );
};

const getMaxCharacters = () => {
  return (
    CHUNK_CONFIG.maxChunkTokens *
    CHUNK_CONFIG.charactersPerToken
  );
};

const getTargetCharacters = () => {
  return (
    CHUNK_CONFIG.targetChunkTokens *
    CHUNK_CONFIG.charactersPerToken
  );
};

const getOverlapCharacters = () => {
  return (
    CHUNK_CONFIG.overlapTokens *
    CHUNK_CONFIG.charactersPerToken
  );
};

// ==========================================
// 5. CHUNK TYPE DETECTION
// ==========================================

const getChunkType = (nodeType) => {
  const type = nodeType.toLowerCase();

  if (
    type.includes("function") ||
    type.includes("method")
  ) {
    return "function";
  }

  if (
    type.includes("class") ||
    type.includes("interface")
  ) {
    return "class";
  }

  if (type.includes("import")) {
    return "import";
  }

  if (type.includes("export")) {
    return "export";
  }

  if (
    type.includes("comment") ||
    type.includes("documentation")
  ) {
    return "comment";
  }

  return "code";
};

// ==========================================
// 6. LINE NUMBER UTILITIES
// ==========================================

const getLineNumber = (source, offset) => {
  return source.slice(0, offset).split("\n").length;
};

// ==========================================
// 7. CREATE STANDARDIZED CHUNK
// ==========================================

const createChunk = (
  document,
  chunkIndex,
  content,
  startOffset,
  endOffset,
  chunkType
) => {
  const metadata = document.metadata;

  const startLine = getLineNumber(
    document.content,
    startOffset
  );

  const endLine = getLineNumber(
    document.content,
    Math.max(startOffset, endOffset - 1)
  );

  return {
    id: [
      metadata.repositoryId,
      metadata.branch,
      metadata.filePath,
      metadata.sha,
      chunkIndex,
    ].join(":"),

    content: content.trim(),

    metadata: {
      repositoryId: String(metadata.repositoryId),
      repositoryName: metadata.repositoryName,
      owner: metadata.owner,

      branch: metadata.branch,

      fileName: metadata.fileName,
      filePath: metadata.filePath,

      language: metadata.language,
      extension: metadata.extension,

      sha: metadata.sha,
      size: Number(metadata.size),

      chunkIndex,
      startLine,
      endLine,

      chunkType,
    },
  };
};

// ==========================================
// 8. SPLIT OVERSIZED TEXT
// ==========================================

const splitTextRecursively = (
  source,
  maxCharacters = getMaxCharacters()
) => {
  const chunks = [];

  if (!source || !source.trim()) {
    return chunks;
  }

  const lines = source.split("\n");

  let currentStart = 0;
  let currentText = "";
  let currentOffset = 0;

  const overlapCharacters = Math.min(
    getOverlapCharacters(),
    Math.floor(maxCharacters / 4)
  );

  const flushChunk = () => {
    if (!currentText.trim()) {
      return;
    }

    const startOffset = currentStart;
    const endOffset = currentStart + currentText.length;

    chunks.push({
      content: currentText,
      startOffset,
      endOffset,
    });

    // Preserve some trailing context in the next chunk.
    const overlapStart = Math.max(
      0,
      currentText.length - overlapCharacters
    );

    const overlapText = currentText.slice(overlapStart);

    currentStart = endOffset - overlapText.length;
    currentText = overlapText;
  };

  for (const line of lines) {
    const lineText = line + "\n";

    // Handle a single line larger than the limit.
    if (lineText.length > maxCharacters) {
      if (currentText.trim()) {
        flushChunk();
      }

      // Avoid carrying overlapping text into a long-line split.
      if (currentText.length > 0) {
        currentOffset = currentStart + currentText.length;
        currentText = "";
      }

      let position = 0;

      while (position < lineText.length) {
        const piece = lineText.slice(
          position,
          position + maxCharacters
        );

        chunks.push({
          content: piece,
          startOffset: currentOffset + position,
          endOffset: currentOffset + position + piece.length,
        });

        position += Math.max(
          1,
          maxCharacters - overlapCharacters
        );
      }

      currentOffset += lineText.length;
      currentStart = currentOffset;
      currentText = "";

      continue;
    }

    if (
      currentText.length + lineText.length >
      maxCharacters
    ) {
      flushChunk();
    }

    currentText += lineText;
    currentOffset += lineText.length;
  }

  if (currentText.trim()) {
    chunks.push({
      content: currentText,
      startOffset: currentStart,
      endOffset: currentStart + currentText.length,
    });
  }

  return chunks;
};

// ==========================================
// 9. RECURSIVE FALLBACK CHUNKING
// ==========================================

const recursiveChunking = (document) => {
  const source = document.content;

  const rawChunks = splitTextRecursively(source);

  return rawChunks.map((chunk, index) =>
    createChunk(
      document,
      index,
      chunk.content,
      chunk.startOffset,
      chunk.endOffset,
      "code"
    )
  );
};

// ==========================================
// 10. AST NODE EXTRACTION
// ==========================================

const extractAstChunks = (document, tree) => {
  const source = document.content;

  const rootNode = tree.rootNode;

  const nodes = rootNode.namedChildren;

  if (!nodes || nodes.length === 0) {
    return [];
  }

  const chunks = [];

  let groupStart = null;
  let groupEnd = null;
  let groupType = "code";

  const flushGroup = () => {
    if (groupStart === null || groupEnd === null) {
      return;
    }

    const content = source.slice(
      groupStart,
      groupEnd
    );

    if (content.trim()) {
      chunks.push({
        content,
        startOffset: groupStart,
        endOffset: groupEnd,
        chunkType: groupType,
      });
    }

    groupStart = null;
    groupEnd = null;
    groupType = "code";
  };

  for (const node of nodes) {
    const nodeStart = node.startIndex;
    const nodeEnd = node.endIndex;

    const nodeText = source.slice(
      nodeStart,
      nodeEnd
    );

    const nodeTokens = estimateTokens(nodeText);

    // Oversized AST nodes need further splitting.
    if (
      nodeTokens > CHUNK_CONFIG.maxChunkTokens
    ) {
      flushGroup();

      const smallerChunks = splitTextRecursively(
        nodeText
      );

      smallerChunks.forEach((chunk) => {
        chunks.push({
          content: chunk.content,

          startOffset: nodeStart + chunk.startOffset,
          endOffset: nodeStart + chunk.endOffset,

          chunkType: getChunkType(node.type),
        });
      });

      continue;
    }

    // Start a new group.
    if (groupStart === null) {
      groupStart = nodeStart;
      groupEnd = nodeEnd;
      groupType = getChunkType(node.type);

      continue;
    }

    const combinedText = source.slice(
      groupStart,
      nodeEnd
    );

    // Flush when the target size is reached.
    if (
      estimateTokens(combinedText) >
      CHUNK_CONFIG.targetChunkTokens
    ) {
      flushGroup();

      groupStart = nodeStart;
      groupEnd = nodeEnd;
      groupType = getChunkType(node.type);
    } else {
      groupEnd = nodeEnd;
    }
  }

  flushGroup();

  return chunks.map((chunk, index) =>
    createChunk(
      document,
      index,
      chunk.content,
      chunk.startOffset,
      chunk.endOffset,
      chunk.chunkType
    )
  );
};

// ==========================================
// 11. AST PARSING
// ==========================================

const astChunking = async (document) => {
  const grammarName = getAstLanguage(
    document.metadata.language
  );

  if (!grammarName) {
    return null;
  }

  let parser;

  try {
    const language = await loadLanguage(grammarName);

    parser = new Parser();

    parser.setLanguage(language);

    const tree = parser.parse(document.content);

    if (!tree || tree.rootNode.hasError) {
      return null;
    }

    const chunks = extractAstChunks(
      document,
      tree
    );

    return chunks.length > 0 ? chunks : null;

  } catch (error) {
    console.warn(
      `AST parsing failed for ${document.metadata.filePath}:`,
      error.message
    );

    return null;

  } finally {
    if (parser) {
      parser.delete();
    }
  }
};

// ==========================================
// 12. CHUNK A SINGLE DOCUMENT
// ==========================================

const chunkDocument = async (document) => {
  if (
    !document ||
    !document.content ||
    !document.metadata
  ) {
    throw new Error("Invalid document supplied.");
  }

  const astChunks = await astChunking(document);

  const chunks = astChunks || recursiveChunking(document);

  return chunks
    .filter((chunk) => chunk.content.trim())
    .map((chunk, index) => ({
      ...chunk,
      id: [
        document.metadata.repositoryId,
        document.metadata.branch,
        document.metadata.filePath,
        document.metadata.sha,
        index,
      ].join(":"),
      metadata: {
        ...chunk.metadata,
        chunkIndex: index,
        chunkingMethod: astChunks
          ? "ast"
          : "recursive",
      },
    }));
};

// ==========================================
// 13. CHUNK MULTIPLE DOCUMENTS
// ==========================================

const chunkDocuments = async (documents) => {
  if (!Array.isArray(documents)) {
    throw new Error("Documents must be an array.");
  }

  const allChunks = [];

  for (let i = 0; i < documents.length; i++) {
    const chunks = await chunkDocument(documents[i]);

    allChunks.push(...chunks);

    console.log(
      `Chunked ${i + 1}/${documents.length}:`,
      documents[i].metadata.filePath,
      `(${chunks.length} chunks)`
    );
  }

  return allChunks;
};

// ==========================================
// 14. EXPORTS
// ==========================================

module.exports = {
  CHUNK_CONFIG,
  initializeTreeSitter,
  estimateTokens,
  chunkDocument,
  chunkDocuments,
  recursiveChunking,
};
