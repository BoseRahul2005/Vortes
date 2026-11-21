require("dotenv").config();
const {
    generateResponse,
    LLM_MODEL,
} = require("../services/llmService");

const testLLM = async () => {
    try {
        console.log("\nStarting Gemini LLM test...\n");

        console.log("Model:", LLM_MODEL);

        // Test prompt
        const prompt = `
You are a helpful programming assistant.

Explain the following JavaScript code in simple terms:

const add = (a, b) => {
    return a + b;
}
        `;

        console.log("\nSending prompt to Gemini...\n");

        // Generate response
        const answer = await generateResponse(prompt);

        console.log("========== GEMINI RESPONSE ==========\n");

        console.log(answer);

        console.log("\n=====================================");

        console.log("\nLLM test completed successfully!");

    } catch (error) {
        console.error("\nLLM test failed:", error.message);

        process.exitCode = 1;
    }
};

testLLM();
