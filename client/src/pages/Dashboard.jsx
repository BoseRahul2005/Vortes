import React, { useState, useMemo, useEffect } from 'react';
import {
    Github,
    GitBranch,
    ChevronDown,
    ChevronRight,
    Search,
    Folder,
    FolderOpen,
    FileCode,
    Copy,
    Check,
    ArrowRight,
    PanelLeftClose,
    PanelLeft,
    Sparkles,
    Bot
} from 'lucide-react';
import { repositoryData as defaultRepoData, extractFilesMap } from '../data/repositoryData';

// Re-export repositoryData for direct extraction if needed
export { defaultRepoData as repositoryData };

// Syntax highlighter helper
function highlightCodeLine(line) {
    if (!line) return <span>&nbsp;</span>;

    const tokenRegex = /(\b(?:import|from|export|async|function|const|let|var|await|new|return|try|catch|if|else|typeof|instanceof)\b)|(\b(?:string|boolean|number|null|undefined|void|Promise)\b)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|(?<=\.)[a-zA-Z_$][a-zA-Z0-9_$]*)|(\b(?:true|false)\b)|(\b\d+\b)|(\/\/.*$)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            parts.push({
                text: line.substring(lastIndex, match.index),
                type: 'plain'
            });
        }

        const [full, keyword, typeName, string, fn, boolean, number, comment] = match;

        if (keyword) {
            parts.push({ text: keyword, type: 'keyword' });
        } else if (typeName) {
            parts.push({ text: typeName, type: 'type' });
        } else if (string) {
            parts.push({ text: string, type: 'string' });
        } else if (fn) {
            parts.push({ text: fn, type: 'function' });
        } else if (boolean) {
            parts.push({ text: boolean, type: 'boolean' });
        } else if (number) {
            parts.push({ text: number, type: 'number' });
        } else if (comment) {
            parts.push({ text: comment, type: 'comment' });
        }

        lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
        parts.push({
            text: line.substring(lastIndex),
            type: 'plain'
        });
    }

    return (
        <span>
            {parts.map((part, i) => {
                let colorClass = 'text-slate-200';
                if (part.type === 'keyword') colorClass = 'text-[#c084fc] font-medium';
                else if (part.type === 'type') colorClass = 'text-[#fbbf24]';
                else if (part.type === 'string') colorClass = 'text-[#34d399]';
                else if (part.type === 'function') colorClass = 'text-[#60a5fa]';
                else if (part.type === 'boolean' || part.type === 'number') colorClass = 'text-[#f97316]';
                else if (part.type === 'comment') colorClass = 'text-slate-500 italic';

                return (
                    <span key={i} className={colorClass}>
                        {part.text}
                    </span>
                );
            })}
        </span>
    );
}

// Recursive Tree Node: Renders folders and files dynamically from repository data
function FileTreeNode({
    node,
    selectedFile,
    onSelectFile,
    openFolders,
    onToggleFolder,
    searchQuery,
    depth = 0
}) {
    if (node.type === 'folder') {
        const isOpen = !!openFolders[node.id];

        // Search match filter: check if folder name or any nested descendant matches
        const hasMatchingDescendant = (item) => {
            if (!searchQuery) return true;
            if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
            if (item.children) return item.children.some(hasMatchingDescendant);
            return false;
        };

        if (searchQuery && !hasMatchingDescendant(node)) {
            return null;
        }

        const shouldExpand = searchQuery ? true : isOpen;

        return (
            <div>
                <div
                    onClick={() => onToggleFolder(node.id)}
                    style={{ paddingLeft: `${depth * 14 + 8}px` }}
                    className="flex items-center gap-1.5 py-1 pr-2 rounded hover:bg-white/[0.04] cursor-pointer text-slate-300 transition"
                >
                    {shouldExpand ? (
                        <ChevronDown className="size-3 text-slate-500 shrink-0" />
                    ) : (
                        <ChevronRight className="size-3 text-slate-500 shrink-0" />
                    )}
                    {shouldExpand ? (
                        <FolderOpen className="size-3.5 text-amber-400/80 shrink-0" />
                    ) : (
                        <Folder className="size-3.5 text-amber-400/80 shrink-0" />
                    )}
                    <span className="truncate">{node.name}</span>
                </div>

                {shouldExpand && node.children && (
                    <div className="space-y-0.5 mt-0.5">
                        {node.children.map(child => (
                            <FileTreeNode
                                key={child.id}
                                node={child}
                                selectedFile={selectedFile}
                                onSelectFile={onSelectFile}
                                openFolders={openFolders}
                                onToggleFolder={onToggleFolder}
                                searchQuery={searchQuery}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Node is a file
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return null;
    }

    const isSelected = selectedFile === node.id;

    return (
        <div
            onClick={() => onSelectFile(node.id)}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={`flex items-center gap-2 py-1 pr-2 rounded-md cursor-pointer transition ${
                isSelected
                    ? 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
        >
            <FileCode className={`size-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="truncate">{node.name}</span>
        </div>
    );
}

export default function Dashboard({ repo = defaultRepoData }) {
    // Adjustable column widths (in pixels)
    const [explorerWidth, setExplorerWidth] = useState(260);
    const [chatWidth, setChatWidth] = useState(430);
    const [isResizing, setIsResizing] = useState(null); // 'explorer' | 'chat' | null

    // Extract file dictionary and file count from the repository object
    const { fileMap, totalCount } = useMemo(() => {
        return extractFilesMap(repo?.fileTree || []);
    }, [repo?.fileTree]);

    const repoName = repo?.name || 'acme/saas-starter';
    const displayName = repo?.displayName || repoName.split('/')[1]?.toUpperCase() || 'PROJECT';
    const branch = repo?.branch || 'main';
    const status = repo?.status || { label: 'Indexed', lastIndexedText: 'Indexed just now' };
    const chatConfig = repo?.chatConfig || {};

    // Initial selected file from repo object
    const [selectedFile, setSelectedFile] = useState(
        repo?.defaultSelectedFile || Object.keys(fileMap)[0] || ''
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [copied, setCopied] = useState(false);
    const [chatInput, setChatInput] = useState('');

    // Pre-open top-level and first-level folders
    const [openFolders, setOpenFolders] = useState(() => {
        const initial = {};
        if (repo?.fileTree) {
            repo.fileTree.forEach(node => {
                if (node.type === 'folder') {
                    initial[node.id] = true;
                    if (node.children) {
                        node.children.forEach(sub => {
                            if (sub.type === 'folder') initial[sub.id] = true;
                        });
                    }
                }
            });
        }
        return initial;
    });

    const toggleFolder = (folderId) => {
        setOpenFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    // Chat messages history
    const [messages, setMessages] = useState([
        {
            id: 'init-1',
            sender: chatConfig.agentName || 'Codebase AI',
            time: 'just now',
            text: chatConfig.initialMessage || "I've indexed this repository and mapped its key flows. Ask me about authentication, the login process, or API routes to get started."
        }
    ]);

    const activeFileData = fileMap[selectedFile] || Object.values(fileMap)[0] || {
        name: 'untitled.ts',
        path: 'untitled.ts',
        code: '// No file selected'
    };

    const handleCopyCode = () => {
        if (!activeFileData?.code) return;
        navigator.clipboard?.writeText(activeFileData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendMessage = (customQuery) => {
        const query = (customQuery !== undefined ? customQuery : chatInput).trim();
        if (!query) return;

        const userMsg = {
            id: 'user-' + Date.now(),
            sender: 'You',
            time: 'just now',
            text: query
        };

        let aiReplyText = `I analyzed the repository for "${query}". You can inspect the relevant implementation in the file explorer on the left.`;

        const lower = query.toLowerCase();
        if (lower.includes('authentication') || lower.includes('auth') || lower.includes('session') || lower.includes('login')) {
            aiReplyText = "Authentication is handled across two core modules:\n\n• **src/auth/session.ts**: Implements JWT-based session tokens via `jose`. Sessions are stored in HTTP-only, secure cookies with HS256 encryption and a 7-day expiration.\n\n• **src/routes/auth.ts**: Exposes the `/login` route which verifies credentials using bcrypt and issues the session.\n\nSelect `src/auth/session.ts` in the explorer to view `createSession` and `getSession`.";
        } else if (lower.includes('route') || lower.includes('api')) {
            aiReplyText = "API routes are organized under `src/routes/`:\n• `auth.ts`: Authentication endpoints (`/login`)\n• `api.ts`: Protected user endpoints (`/me`)\n\nMounted in `src/index.ts` under `/api` and `/api/auth`.";
        } else if (lower.includes('db') || lower.includes('database')) {
            aiReplyText = "Database connections are managed via Prisma in `src/db.ts`, preserving a singleton client instance on `globalThis` to avoid connection exhaustion in development.";
        }

        const aiMsg = {
            id: 'ai-' + (Date.now() + 1),
            sender: chatConfig.agentName || 'Codebase AI',
            time: 'just now',
            text: aiReplyText
        };

        setMessages(prev => [...prev, userMsg, aiMsg]);
        setChatInput('');
    };

    const codeLines = useMemo(() => {
        return (activeFileData?.code || '').split('\n');
    }, [activeFileData]);

    // Handle mouse movement for resizing columns
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e) => {
            if (isResizing === 'explorer') {
                const newWidth = Math.max(160, Math.min(500, e.clientX));
                setExplorerWidth(newWidth);
            } else if (isResizing === 'chat') {
                const explorerOffset = sidebarOpen ? explorerWidth : 32;
                const maxAllowedChat = Math.max(280, window.innerWidth - explorerOffset - 280);
                const newWidth = Math.max(260, Math.min(maxAllowedChat, e.clientX - explorerOffset));
                setChatWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, sidebarOpen, explorerWidth]);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#06080d] text-slate-200 select-none">
            {/* Fullscreen transparent overlay while resizing to prevent selection and ensure smooth dragging */}
            {isResizing && (
                <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
            )}

            {/* Top Navigation Bar */}
            <header className="h-12 border-b border-[#141923] bg-[#07090e] px-4 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-3">
                    {/* Brand Logo & Name */}
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div className="size-6 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                            <Sparkles className="size-3.5" />
                        </div>
                        <span className="font-semibold text-sm tracking-tight text-white">codebase.ai</span>
                    </div>

                    <div className="h-4 w-px bg-white/10 mx-1" />

                    {/* Dynamic Repository Dropdown */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/[0.04] cursor-pointer text-xs transition">
                        <Github className="size-3.5 text-slate-400" />
                        <span className="font-mono text-slate-300">{repoName}</span>
                        <ChevronDown className="size-3 text-slate-500" />
                    </div>
                </div>

                {/* Right Status Badges */}
                <div className="flex items-center gap-3">
                    {/* Index Status Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-slate-300 font-medium text-[11px]">{status.label || 'Indexed'}</span>
                    </div>

                    {/* Git Branch Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/[0.06] cursor-pointer transition">
                        <GitBranch className="size-3 text-slate-400" />
                        <span className="text-[11px]">{branch}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Workspace: 3 Columns with Draggable Dividers */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* 1. Left Column: File Explorer */}
                {sidebarOpen ? (
                    <aside
                        style={{ width: `${explorerWidth}px` }}
                        className="border-r border-[#141923] bg-[#07090e] flex flex-col shrink-0 min-w-0"
                    >
                        {/* Explorer Header */}
                        <div className="h-9 px-3 border-b border-[#141923] flex items-center justify-between">
                            <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Explorer</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/5 transition"
                                title="Collapse Sidebar"
                            >
                                <PanelLeftClose className="size-3.5" />
                            </button>
                        </div>

                        {/* Project Root Label */}
                        <div className="px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-300">
                            <div className="flex items-center gap-1.5 font-semibold text-[11px] tracking-wide text-slate-200">
                                <ChevronDown className="size-3 text-slate-400" />
                                <span>{displayName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{totalCount}</span>
                        </div>

                        {/* File Search */}
                        <div className="px-3 pb-2">
                            <div className="relative flex items-center">
                                <Search className="size-3 text-slate-500 absolute left-2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Find a file..."
                                    className="w-full bg-[#0b0e14] border border-white/8 rounded-md pl-7 pr-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>

                        {/* Dynamic Recursive File Tree */}
                        <div className="flex-1 overflow-y-auto px-1 py-1 text-xs font-mono space-y-0.5">
                            {repo?.fileTree?.map(node => (
                                <FileTreeNode
                                    key={node.id}
                                    node={node}
                                    selectedFile={selectedFile}
                                    onSelectFile={setSelectedFile}
                                    openFolders={openFolders}
                                    onToggleFolder={toggleFolder}
                                    searchQuery={searchQuery}
                                    depth={0}
                                />
                            ))}
                        </div>

                        {/* Bottom Status Bar */}
                        <div className="h-8 border-t border-[#141923] px-3 flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span className="text-slate-400 font-medium">Ready</span>
                            <span>{status.lastIndexedText || 'Indexed just now'}</span>
                        </div>
                    </aside>
                ) : (
                    /* Collapsed sidebar trigger */
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="h-full w-8 border-r border-[#141923] bg-[#07090e] hover:bg-white/5 flex flex-col items-center pt-3 text-slate-500 hover:text-slate-300 transition shrink-0"
                        title="Expand Sidebar"
                    >
                        <PanelLeft className="size-4" />
                    </button>
                )}

                {/* Resize Handle 1: Between Explorer and Chat */}
                {sidebarOpen && (
                    <div
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing('explorer');
                        }}
                        onDoubleClick={() => setExplorerWidth(260)}
                        className={`w-1 -ml-0.5 -mr-0.5 relative z-30 cursor-col-resize select-none transition-colors duration-150 hover:bg-indigo-500/70 ${
                            isResizing === 'explorer' ? 'bg-indigo-500' : 'bg-transparent'
                        }`}
                        title="Drag to resize, double-click to reset"
                    />
                )}

                {/* 2. Middle Column: AI Chat */}
                <section
                    style={{ width: `${chatWidth}px` }}
                    className="border-r border-[#141923] bg-[#070a10] flex flex-col shrink-0 min-w-0"
                >
                    {/* Header */}
                    <div className="h-16 px-4 border-b border-[#141923] flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/20">
                                <Sparkles className="size-4.5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-white leading-tight">{chatConfig.title || 'Ask your codebase'}</h2>
                                <p className="text-xs text-slate-400">{chatConfig.subtitle || 'Answers grounded in your source'}</p>
                            </div>
                        </div>

                        <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border border-white/10 text-slate-400 uppercase bg-white/[0.02]">
                            {chatConfig.tag || 'CODEBASE AI'}
                        </span>
                    </div>

                    {/* Repository Ready divider */}
                    <div className="relative py-4 flex items-center justify-center shrink-0">
                        <div className="absolute inset-x-8 h-px bg-white/5" />
                        <span className="relative text-[10px] font-mono tracking-widest text-slate-400 px-3 py-0.5 rounded-full bg-[#070a10] border border-white/10 uppercase">
                            {chatConfig.statusPill || 'REPOSITORY READY'}
                        </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
                        {messages.map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3 text-xs leading-relaxed">
                                {msg.sender === (chatConfig.agentName || 'Codebase AI') ? (
                                    <div className="size-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                                        <Bot className="size-3.5" />
                                    </div>
                                ) : (
                                    <div className="size-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-slate-200 shrink-0 mt-0.5 font-medium">
                                        U
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-200">{msg.sender}</span>
                                        <span className="text-[11px] text-slate-500">{msg.time}</span>
                                    </div>
                                    <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input Section */}
                    <div className="p-4 border-t border-[#141923] bg-[#070a10] shrink-0">
                        <div className="mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                TRY ASKING
                            </span>
                        </div>

                        {/* Interactive Input Form */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="relative flex items-center justify-between rounded-xl bg-[#0b0f19] border border-white/10 px-3.5 py-2.5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition"
                        >
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder={chatConfig.placeholder || "Where is authentication handled?"}
                                className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none pr-2"
                            />
                            <button
                                type="submit"
                                className="size-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                                title="Send query"
                            >
                                <ArrowRight className="size-3.5" />
                            </button>
                        </form>
                    </div>
                </section>

                {/* Resize Handle 2: Between Chat and Code Editor */}
                <div
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing('chat');
                    }}
                    onDoubleClick={() => setChatWidth(430)}
                    className={`w-1 -ml-0.5 -mr-0.5 relative z-30 cursor-col-resize select-none transition-colors duration-150 hover:bg-indigo-500/70 ${
                        isResizing === 'chat' ? 'bg-indigo-500' : 'bg-transparent'
                    }`}
                    title="Drag to resize, double-click to reset"
                />

                {/* 3. Right Column: Code Viewer / Editor */}
                <main className="flex-1 flex flex-col bg-[#05070c] min-w-0 overflow-hidden">
                    {/* Tab Header */}
                    <div className="h-9 border-b border-[#141923] bg-[#07090e] flex items-center justify-between px-3 shrink-0">
                        <div className="flex items-center h-full">
                            {/* Active Tab */}
                            <div className="h-full flex items-center gap-2 px-3 bg-[#05070c] border-r border-[#141923] text-xs font-mono text-slate-200 border-t-2 border-t-indigo-500">
                                <FileCode className="size-3.5 text-indigo-400" />
                                <span>{activeFileData?.name}</span>
                                <span className="size-1.5 rounded-full bg-slate-500 ml-1" />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 text-slate-400">
                            <button
                                onClick={handleCopyCode}
                                className="p-1 rounded hover:bg-white/5 hover:text-slate-200 transition"
                                title="Copy file code"
                            >
                                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Breadcrumbs Bar */}
                    <div className="h-7 border-b border-[#141923] bg-[#06080d] px-4 flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
                        <Github className="size-3 text-slate-500" />
                        <span className="text-slate-600">&gt;</span>
                        {(activeFileData?.path || activeFileData?.id || '').split(' > ').map((crumb, idx, arr) => (
                            <React.Fragment key={idx}>
                                <span className={idx === arr.length - 1 ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                                    {crumb}
                                </span>
                                {idx < arr.length - 1 && <span className="text-slate-600">&gt;</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Code Content with Line Numbers */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-indigo-600/30">
                        <table className="w-full border-collapse">
                            <tbody>
                                {codeLines.map((line, index) => (
                                    <tr key={index} className="hover:bg-white/[0.02]">
                                        {/* Line Numbers */}
                                        <td className="w-10 pr-6 text-right text-slate-600 select-none align-top font-mono text-[11px]">
                                            {index + 1}
                                        </td>
                                        {/* Code Content */}
                                        <td className="whitespace-pre font-mono text-slate-200">
                                            {highlightCodeLine(line)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}
