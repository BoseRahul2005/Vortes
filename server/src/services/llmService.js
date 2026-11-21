
const { GoogleGenAI } = require("@google/genai");
const { SYSTEM_PROMPT } = require("../utils/systemPrompt");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
        apiVersion: "v1beta",
    },
});

const LLM_MODEL =
    (process.env.LLM_MODEL || "").trim() || "gemini-2.5-flash";

const generateWithModel = async (model, prompt) => {
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2,
        },
    });

    const generatedText = response.text;

    if (typeof generatedText !== "string" || !generatedText.trim()) {
        throw new Error("Gemini returned an empty response");
    }

    return generatedText.trim();
};

const generateResponse = async (prompt) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error(
                "GEMINI_API_KEY is not configured in server/.env"
            );
        }

        if (typeof prompt !== "string" || !prompt.trim()) {
            throw new Error("Prompt must be a non-empty string");
        }

        try {
            return await generateWithModel(LLM_MODEL, prompt);
        } catch (apiError) {
            if (LLM_MODEL !== "gemini-2.5-flash") {
                console.warn(
                    `Model ${LLM_MODEL} failed (${apiError.message}), trying gemini-2.5-flash fallback...`
                );

                return await generateWithModel(
                    "gemini-2.5-flash",
                    prompt
                );
            }

            throw apiError;
        }
    } catch (error) {
        throw new Error(
            `LLM response generation failed: ${error.message}`,
            { cause: error }
        );
    }
};

module.exports = {
    generateResponse,
    LLM_MODEL,
};
