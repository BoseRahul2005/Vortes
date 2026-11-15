// Repository data object containing repository metadata, file tree, source code, and AI chat configuration.
// All repository details are extractable and dynamic from this structure.

export const repositoryData = {
    // Repository Metadata
    id: 'repo-baba-yaga',
    name: 'BabaYaga',
    displayName: 'BabaYaga',
    branch: 'main',
    branches: ['main', 'develop', 'feat/auth'],
    status: {
        isIndexed: true,
        label: 'Indexed',
        lastIndexedText: 'Indexed just now',
        isReady: true,
    },
    defaultSelectedFile: 'src/auth/session.ts',

    // File Tree Hierarchy (nested folders and files)
    fileTree: [
        {
            id: 'src',
            name: 'src',
            type: 'folder',
            children: [
                {
                    id: 'src/components',
                    name: 'components',
                    type: 'folder',
                    children: [
                        {
                            id: 'src/components/session.ts',
                            name: 'session.ts',
                            type: 'file',
                            path: 'src > components > session.ts',
                            language: 'typescript',
                            code: `import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  cookies().set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}`
                        },
                        {
                            id: 'src/auth/password.ts',
                            name: 'password.ts',
                            type: 'file',
                            path: 'src > auth > password.ts',
                            language: 'typescript',
                            code: `import { hash, compare } from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return await compare(password, hashed);
}`
                        }
                    ]
                },
                {
                    id: 'src/routes',
                    name: 'routes',
                    type: 'folder',
                    children: [
                        {
                            id: 'src/routes/auth.ts',
                            name: 'auth.ts',
                            type: 'file',
                            path: 'src > routes > auth.ts',
                            language: 'typescript',
                            code: `import { Router } from "express";
import { createSession } from "../auth/session";
import { verifyPassword } from "../auth/password";
import { db } from "../db";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.user.findUnique({ where: { email } });
  
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await createSession(user.id);
  return res.json({ success: true, user: { id: user.id, email: user.email } });
});

export default router;`
                        },
                        {
                            id: 'src/routes/api.ts',
                            name: 'api.ts',
                            type: 'file',
                            path: 'src > routes > api.ts',
                            language: 'typescript',
                            code: `import { Router } from "express";
import { getSession } from "../auth/session";

const router = Router();

router.get("/me", async (req, res) => {
  const session = await getSession();
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user: session });
});

export default router;`
                        }
                    ]
                },
                {
                    id: 'src/middleware',
                    name: 'middleware',
                    type: 'folder',
                    children: []
                },
                {
                    id: 'src/db.ts',
                    name: 'db.ts',
                    type: 'file',
                    path: 'src > db.ts',
                    language: 'typescript',
                    code: `import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}`
                },
                {
                    id: 'src/index.ts',
                    name: 'index.ts',
                    type: 'file',
                    path: 'src > index.ts',
                    language: 'typescript',
                    code: `import express from "express";
import authRoutes from "./routes/auth";
import apiRoutes from "./routes/api";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server listening on port \${PORT}\`);
});`
                }
            ]
        }
    ],

    // AI Chat configuration and initial prompt suggestions
    chatConfig: {
        agentName: 'Codebase AI',
        title: 'Ask your codebase',
        subtitle: 'Answers grounded in your source',
        tag: 'CODEBASE AI',
        statusPill: 'REPOSITORY READY',
        initialMessage: "I've indexed this repository and mapped its key flows. Ask me about authentication, the login process, or API routes to get started.",
        placeholder: "Where is authentication handled?",
        suggestions: [
            "Where is authentication handled?",
            "Explain how sessions are created",
            "What API routes are available?"
        ]
    }
};

// Utility function to extract a flat dictionary of all files and count them
export function extractFilesMap(tree = []) {
    const fileMap = {};
    let totalCount = 0;

    function traverse(nodes) {
        if (!Array.isArray(nodes)) return;
        for (const node of nodes) {
            if (node.type === 'file') {
                fileMap[node.id] = node;
                totalCount++;
            } else if (node.type === 'folder' && node.children) {
                traverse(node.children);
            }
        }
    }

    traverse(tree);
    return { fileMap, totalCount };
}
