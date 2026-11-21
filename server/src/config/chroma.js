const { ChromaClient } = require("chromadb");

let clientConfig = {
  host: "localhost",
  port: 8000,
  ssl: false,
};

if (process.env.CHROMA_URL) {
  try {
    const parsed = new URL(process.env.CHROMA_URL);
    clientConfig = {
      host: parsed.hostname,
      port: parsed.port
        ? Number(parsed.port)
        : parsed.protocol === "https:"
          ? 443
          : 8000,
      ssl: parsed.protocol === "https:",
    };
  } catch {
    clientConfig = { path: process.env.CHROMA_URL };
  }
}

const chroma = new ChromaClient(clientConfig);

const connectChroma = async () => {
  try {
    const heartbeat = await chroma.heartbeat();
    console.log("ChromaDB connected successfully!");
    console.log("Heartbeat:", heartbeat);
    return chroma;
  } catch (error) {
    const targetUrl = process.env.CHROMA_URL || "http://localhost:8000";
    console.warn(`ChromaDB is not reachable at ${targetUrl}: ${error.message}`);
  }
};

// Hybrid export: callable as connectChromaDb() or destructurable as { chroma, connectChroma }
connectChroma.chroma = chroma;
connectChroma.client = chroma;
connectChroma.connectChroma = connectChroma;
connectChroma.connectChromaDb = connectChroma;

module.exports = connectChroma;
