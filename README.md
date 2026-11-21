# 🚀 Vortes

### AI-Powered GitHub Repository Analysis Platform

Vortes is an AI-powered platform that helps developers understand, explore, and interact with GitHub repositories using natural language.

Instead of manually navigating through hundreds of files to understand how a project works, developers can simply ask questions about a repository and receive intelligent, context-aware answers based on its actual source code.

Powered by **Retrieval-Augmented Generation (RAG)**, Vortes combines code-aware retrieval, vector embeddings, and Large Language Models (LLMs) to understand codebases and generate meaningful responses.

## 🌐 Live Demo

**Try Vortes:** https://vortes-topaz.vercel.app/

---

## ✨ Features

- **GitHub Repository Integration:** Connect and analyze repositories directly from GitHub.
- **LLM-Powered Code Understanding:** Ask questions about a codebase and receive answers based on its actual implementation.
- **Natural Language Search:** Find functions, components, files, and implementations without manually searching through code.
- **Retrieval-Augmented Generation (RAG):** Retrieve relevant code snippets before generating LLM responses.
- **Hybrid Code Chunking:** Divide source code into meaningful chunks while preserving code structure and context.
- **Vector Embeddings:** Convert code snippets and user queries into numerical representations for semantic retrieval.
- **Vector Search:** Store and retrieve code embeddings using ChromaDB.
- **Context-Aware Responses:** Generate responses using relevant repository information instead of relying entirely on the LLM's pre-trained knowledge.

---

## 🧠 How Vortes Works

Vortes uses a Retrieval-Augmented Generation (RAG) pipeline specifically designed for software repositories.

The entire process consists of two main stages.

### 1. Repository Ingestion Pipeline

When a user connects a GitHub repository, Vortes processes the repository and prepares it for intelligent retrieval.

**Step 1: Repository Extraction**

Vortes fetches repository information and source code directly from GitHub using the GitHub API.

**Step 2: File Filtering**

The extracted repository files are filtered to include supported programming languages and relevant file types while excluding unnecessary files.

**Step 3: Hybrid Code Chunking**

The source code is divided into smaller, meaningful pieces called *chunks*.

**Step 4: Embedding Generation**

Each code chunk is converted into a numerical vector representation using Google's Gemini Embedding 2.

**Step 5: Vector Storage**

The generated embeddings, along with their associated metadata and original code content, are stored in ChromaDB for future retrieval.

### 2. Question Answering Pipeline

When a user asks a question about an indexed repository, Vortes follows this process:

1. **Question Input:** Receives the user's natural-language question.
2. **Query Embedding:** Converts the question into a vector embedding using the same embedding model.
3. **Vector Retrieval:** Searches ChromaDB for code chunks that are semantically relevant to the question.
4. **Context Preparation:** Collects the retrieved code snippets and their associated metadata.
5. **LLM Processing:** Sends the user's question and retrieved repository context to the Gemini LLM.
6. **Response Generation:** The LLM analyzes the provided context and generates a natural-language response.

This approach allows Vortes to answer questions about large codebases without sending the entire repository to the LLM for every request.

---

## ✂️ Hybrid Code Chunking

One of the most important parts of Vortes is its **hybrid code chunking strategy**.

When working with large repositories, sending entire files to an embedding model or an LLM is inefficient. It can also make retrieving relevant information more difficult.

To solve this problem, Vortes divides source code into smaller chunks before generating embeddings.

However, simply splitting code after a fixed number of characters or lines can break functions, classes, and other logical structures.

That's why Vortes uses **Hybrid Chunking**.

### How Hybrid Chunking Works

Vortes combines code-aware splitting with size-based splitting to create meaningful and manageable chunks.

**1. Structure-Aware Chunking**

Whenever possible, the code is divided along meaningful structural boundaries rather than arbitrary character positions.

For example:
- Functions are treated as meaningful code units.
- Classes and their methods retain their logical context.
- Related code sections are kept together whenever possible.

**2. Size-Based Chunking**

Some functions, classes, or code sections can be extremely large.

When a section exceeds the configured chunk size, it is divided into smaller pieces to keep chunks manageable.

This prevents excessively large chunks from reducing retrieval quality.

**3. Metadata Preservation**

Each generated chunk retains important metadata, including:

| Metadata | Description |
|---|---|
| `filePath` | Original file location |
| `language` | Programming language |
| `chunkIndex` | Position of the chunk |
| `startLine` | Starting line number |
| `endLine` | Ending line number |

This metadata helps Vortes identify where retrieved code originally came from and provides useful context during retrieval.

### Why Hybrid Chunking?

- Preserves logical code structure.
- Avoids unnecessary splitting of smaller functions and classes.
- Handles large code sections efficiently.
- Improves the relevance of retrieved code snippets.
- Maintains file and line-level references for better context.

The ultimate goal is to ensure that the embedding model receives meaningful code segments rather than arbitrary pieces of source code.

---

## 🏗️ RAG Architecture

Vortes follows a Retrieval-Augmented Generation architecture designed specifically for software repositories.

### Ingestion Pipeline

```text
GitHub Repository
       |
       ▼
Repository Extraction
       |
       ▼
File Filtering
       |
       ▼
Hybrid Code Chunking
       |
       ▼
Embedding Generation
(Gemini Embedding 2)
       |
       ▼
Vector Storage
(ChromaDB)
```

### Retrieval and Generation Pipeline

```text
User Question
       |
       ▼
Query Embedding
       |
       ▼
Vector Search
(ChromaDB)
       |
       ▼
Relevant Code Retrieval
       |
       ▼
Context Preparation
       |
       ▼
Gemini LLM
       |
       ▼
Generated Response
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Node.js | Backend runtime |
| Express.js | Backend API framework |
| GitHub API | Repository access and source code extraction |
| Google Gemini Embedding 2 | Code and query embedding generation |
| Google Gemini LLM | Natural-language response generation |
| ChromaDB | Vector database for storing and retrieving embeddings |
| Tailwind CSS | UI styling |
| Framer Motion | UI animations |

---

## 📂 Project Structure

Vortes is organized into separate client and server applications.

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

*This is a high-level overview of the project structure.*

---

## ⚙️ Getting Started

Follow these steps to run Vortes locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- Google Gemini API key
- Running ChromaDB instance
- GitHub access token (if required by your GitHub integration)

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

Create a `.env` file inside the server directory.

```env
PORT=3000

GEMINI_API_KEY=your_gemini_api_key

CHROMA_HOST=localhost
CHROMA_PORT=8000

GITHUB_TOKEN=your_github_token
```

*Make sure the environment variable names match your actual server configuration. Never commit API keys or sensitive credentials to Git.*

### 4. Start ChromaDB

Make sure your ChromaDB instance is running and accessible using the configured host and port.

### 5. Start the Backend

```bash
cd server
npm run dev
```

### 6. Start the Frontend

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

Vortes retrieves relevant source code and uses the Gemini LLM to generate context-aware answers.

---

## 🎯 Project Goals

The primary goal of Vortes is to make understanding unfamiliar codebases faster and easier.

Developers often spend significant time navigating files, tracing function calls, and understanding how different parts of an application interact.

Vortes aims to simplify this process by providing an intelligent, LLM-powered interface that can retrieve and explain relevant parts of a repository.

Rather than simply searching for code, Vortes helps developers understand how their codebases actually work.

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
