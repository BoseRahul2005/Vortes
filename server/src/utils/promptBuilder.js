const { prepareContext } = require("../services/retrievalService");

/**
 * Build the final prompt using the user question
 * and retrieved repository context.
 */
const buildPrompt = ({
    query,
    chunks,
    repository,
}) => {
    if (typeof query !== "string" || !query.trim()) {
        throw new Error("Query must be a non-empty string");
    }

    if (!Array.isArray(chunks)) {
        throw new Error("Retrieved chunks must be an array");
    }

    const repositoryName =
        repository?.name || "Unknown Repository";

    const repositoryOwner =
        repository?.owner || "Unknown Owner";

    const repositoryBranch =
        repository?.defaultBranch || "Unknown Branch";

    const repositoryContext = prepareContext(chunks);

    return `
REPOSITORY INFORMATION

Repository: ${repositoryOwner}/${repositoryName}
Branch: ${repositoryBranch}

${repositoryContext}

USER QUESTION

${query.trim()}

INSTRUCTIONS

Answer the user's question using the repository context above.

- Reference relevant files and line numbers.
- Explain the relevant code clearly.
- Do not invent information that is not present in the context.
- If the context is insufficient, clearly say so.
- Keep the answer focused on the user's question.
`;
};

module.exports = {
    buildPrompt,
};