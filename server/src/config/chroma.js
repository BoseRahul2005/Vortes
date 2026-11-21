
const { ChromaClient } = require("chromadb");

const chroma = new ChromaClient({
    host: "localhost",
    port: 8000,
    ssl: false
});

const connectChroma = async () => {
    try {
        const heartbeat = await chroma.heartbeat();

        console.log("ChromaDB connected successfully!");
        console.log("Heartbeat:", heartbeat);

        return chroma;
    } catch (error) {
        console.error("ChromaDB connection failed:", error.message);
        throw error;
    }
};

module.exports = {
    chroma,
    connectChroma,
};
