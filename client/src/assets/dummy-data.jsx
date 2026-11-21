import { GitPullRequest, SearchCode, BotMessageSquare } from 'lucide-react';

export const featuresData = [
    {
        icon: <GitPullRequest className="w-6 h-6" />,
        title: 'GitHub Integration',
        desc: 'Connect your GitHub repositories seamlessly and import your codebase for intelligent analysis.'
    },
    {
        icon: <BotMessageSquare className="w-6 h-6" />,
        title: 'AI-Powered Code Understanding',
        desc: 'Leverage RAG-powered AI to understand your codebase, explore implementations and get context-aware answers.'
    },
    {
        icon: <SearchCode className="w-6 h-6" />,
        title: 'Smart Code Exploration',
        desc: 'Navigate project structures, discover relevant files and quickly find answers across your entire repository.'
    }
];

export const faqData = [
    {
        question: 'What is Vortes?',
        answer: 'Vortes is an AI-powered codebase assistant that helps developers understand, explore, and navigate GitHub repositories. Simply connect your repository and ask questions about its codebase to get intelligent, context-aware answers.'
    },
    {
        question: 'How does Vortes understand my codebase?',
        answer: 'Vortes uses Retrieval-Augmented Generation (RAG) to analyze your repository. It processes source code, breaks it into meaningful chunks, generates embeddings, and retrieves relevant code snippets to provide accurate answers to your questions.'
    },
    {
        question: 'Which GitHub repositories can I connect?',
        answer: 'You can connect GitHub repositories and let Vortes index their source code. Once indexing is complete, you can explore files, understand project structure, and ask questions about your codebase.'
    },
    {
        question: 'Can Vortes answer questions about specific code implementations?',
        answer: 'Absolutely! You can ask questions like "Where is authentication handled?", "How does the API work?", or "Which component manages user state?" Vortes retrieves relevant code from your repository to generate answers with useful context.'
    }
];

export const footerLinks = [
    {
        title: "Company",
        links: [
            { name: "Home", url: "#" },
            { name: "Services", url: "#" },
            { name: "Work", url: "#" },
            { name: "Contact", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];
