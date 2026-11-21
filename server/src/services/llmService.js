const { GoogleGenAI } = require("@google/genai");
const { SYSTEM_PROMPT } = require("../utils/systemPrompt");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

const LLM_MODEL =
    process.env.LLM_MODEL || "gemini-3.8-flash";

const generateResponse = async (prompt) => {
    try {
        if (typeof prompt !== "string" || !prompt.trim()) {
            throw new Error("Prompt must be a non-empty string");
        }

        const response = await ai.models.generateContent({
            model: LLM_MODEL,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.2,
            },
        });

        const generatedText = response.text;

        if (
            typeof generatedText !== "string" ||
            !generatedText.trim()
        ) {
            throw new Error("Gemini returned an empty response");
        }

        return generatedText.trim();

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