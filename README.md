# 🚀 Vortes

### LLM-Powered GitHub Repository Analysis Platform

Vortes is an LLM-powered platform that helps developers understand, explore, and interact with GitHub repositories using natural language.

Instead of manually navigating through hundreds of files to understand how a project works, developers can simply ask questions about a repository and receive intelligent, context-aware answers based on its actual source code.

Powered by **Retrieval-Augmented Generation (RAG)**, Vortes retrieves relevant code snippets from a repository and uses Large Language Models (LLMs) to generate accurate and meaningful responses.

## 🌐 Live Demo

**Deployed Application:** https://vortes-topaz.vercel.app/

---

## ✨ Features

- **GitHub Repository Integration:** Connect and analyze repositories directly from GitHub.
- **LLM-Powered Code Understanding:** Ask questions about a codebase and receive answers based on its actual implementation.
- **Natural Language Search:** Find functions, components, files, and implementations without manually searching through code.
- **Retrieval-Augmented Generation (RAG):** Retrieve relevant code context before generating LLM responses.
- **Hybrid Code Chunking:** Split source code into meaningful chunks while preserving code structure and contextual information.
- **Vector Search:** Store and retrieve code embeddings using a vector database.
- **Semantic Understanding:** Find relevant code based on meaning rather than relying only on exact keyword matches.
- **Secure Authentication:** Clerk handles user authentication and account management.

---

## 🧠 How Vortes Works

Vortes uses a Retrieval-Augmented Generation (RAG) pipeline specifically designed for software repositories.

The process consists of two main stages:

### 1. Repository Ingestion

When a user connects a GitHub repository, Vortes:

1. Fetches repository information and source code from GitHub.
2. Identifies supported files and filters out unnecessary content.
3. Processes source code using a hybrid chunking strategy.
4. Generates vector embeddings for each code chunk using Google's Gemini Embedding 2.
5. Stores embeddings and associated metadata in ChromaDB.

### 2. Question Answering

When a user asks a question about a repository:

1. Vortes receives the user's question.
2. Converts the question into a vector embedding.
3. Searches the vector database for relevant code chunks.
4. Retrieves the most relevant repository context.
5. Passes the retrieved context and user's question to the Gemini LLM.
6. Generates a natural-language response grounded in the retrieved source code.

This approach allows Vortes to answer questions about large codebases without sending the entire repository to the LLM for every request.

---

## ✂️ Hybrid Code Chunking

Code chunking is an important part of Vortes' RAG pipeline.

Instead of splitting source code into arbitrary pieces based only on character or token limits, Vortes uses **Hybrid Chunking** to divide code into meaningful sections.

It combines:

- **Structural Chunking:** Identifies logical code units such as functions, classes, and other code structures.
- **Size-Based Chunking:** Uses size limits to keep chunks manageable for embedding generation and retrieval.

This approach helps preserve the meaning and context of source code, making it easier for the retrieval system to find relevant code when answering user questions.

---

## 🏗️ RAG Architecture

Vortes follows a Retrieval-Augmented Generation architecture designed specifically for software repositories.

**Ingestion Pipeline**

GitHub Repository → File Extraction → File Filtering → Hybrid Code Chunking → Embedding Generation → ChromaDB

**Retrieval & Generation Pipeline**

User Question → Query Embedding → Vector Retrieval → Relevant Code Context → Gemini LLM → Response

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Node.js | Backend runtime |
| Express.js | Backend API framework |
| Tailwind CSS | UI styling |
| Framer Motion | UI animations |
| Clerk | User authentication and account management |
| GitHub API | Repository access and source code retrieval |
| Google Gemini Embedding 2 | Code and query embedding generation |
| Google Gemini LLM | Context-aware response generation |
| MongoDB | Stores connected repositories' information |
| ChromaDB | Vector database for storing and retrieving embeddings |

---

## 📂 Project Structure

The project is organized into separate client and server applications.

```text
Vortes/
│
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── package.json
│
├── server/                 # Backend application
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ...
│   └── package.json
│
└── README.md
```

*This is a high-level overview. Individual directories may evolve as development progresses.*

---

## ⚙️ Getting Started

Follow these steps to run Vortes locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- Google Gemini API key
- Clerk account and API keys
- Running ChromaDB instance

### 1. Clone the Repository

```bash
git clone
cd Vortes
```

### 2. Install Dependencies

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the server directory and configure the required environment variables.

```env
PORT=5000

GEMINI_API_KEY=your_gemini_api_key

CHROMA_HOST=localhost
CHROMA_PORT=8000

GITHUB_TOKEN=your_github_token
```

Configure the Clerk publishable and secret keys in the appropriate frontend and backend environment files according to your application setup.

*The environment variable names above are examples. Adjust them to match your actual configuration. Never commit API keys or sensitive credentials.*

### 4. Start ChromaDB

Make sure your ChromaDB instance is running and accessible using the configured host and port.

### 5. Run the Backend

```bash
cd server
node/nodemon server.js
```

### 6. Run the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Open the local development URL displayed by Vite in your terminal.

---

## 💬 Example Questions

Once a repository has been indexed, users can ask questions such as:

- Where is authentication handled?
- How does the application handle API requests?
- Where is the database connection configured?
- Explain how the user authentication flow works.
- Which component handles the dashboard?
- Where is error handling implemented?
- How does data flow between the frontend and backend?
- Find the function responsible for processing user requests.

Vortes retrieves relevant source code and uses an LLM to generate context-aware answers.

---

## 🎯 Project Goals

The primary goal of Vortes is to make understanding unfamiliar codebases faster and easier.

Developers often spend significant time navigating files, tracing function calls, and understanding how different parts of an application interact.

Vortes aims to simplify this process through an LLM-powered interface that understands repository content and provides meaningful answers based on the actual implementation.

Rather than simply searching for code, Vortes helps developers understand it.

---

## 🔮 Future Improvements

Potential improvements include:

- Advanced hybrid retrieval combining semantic and keyword search.
- Improved code-aware retrieval and ranking.
- Repository-wide dependency and relationship analysis.
- Code references and source file citations in LLM responses.
- Support for multiple repositories and repository comparisons.
- Conversation history and contextual follow-up questions.
- Improved handling of large repositories.
- Support for additional programming languages.
- Code explanation and debugging assistance.
