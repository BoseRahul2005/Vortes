import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { getToken } from "@clerk/react";
import API from "../api/axios";
import RepositoryInput from "../components/RepositoryInput";

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
  Bot,
  Star,
  GitFork,
  Lock,
  Globe,
  Code2,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { repositoryData as defaultRepoData } from "../data/repositoryData";

// Re-export repositoryData
export { defaultRepoData as repositoryData };

// --------------------------------------------------
// HELPER: Syntax highlighter
// --------------------------------------------------

function highlightCodeLine(line) {
  if (!line) return <span>&nbsp;</span>;

  const tokenRegex =
    /(\b(?:import|from|export|async|function|const|let|var|await|new|return|try|catch|if|else|typeof|instanceof)\b)|(\b(?:string|boolean|number|null|undefined|void|Promise)\b)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|(?<=\.)[a-zA-Z_$][a-zA-Z0-9_$]*)|(\b(?:true|false)\b)|(\b\d+\b)|(\/\/.*$)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: line.substring(lastIndex, match.index),
        type: "plain",
      });
    }

    const [full, keyword, typeName, string, fn, boolean, number, comment] =
      match;

    if (keyword) {
      parts.push({ text: keyword, type: "keyword" });
    } else if (typeName) {
      parts.push({ text: typeName, type: "type" });
    } else if (string) {
      parts.push({ text: string, type: "string" });
    } else if (fn) {
      parts.push({ text: fn, type: "function" });
    } else if (boolean) {
      parts.push({ text: boolean, type: "boolean" });
    } else if (number) {
      parts.push({ text: number, type: "number" });
    } else if (comment) {
      parts.push({ text: comment, type: "comment" });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push({
      text: line.substring(lastIndex),
      type: "plain",
    });
  }

  return (
    <span>
      {parts.map((part, i) => {
        let colorClass = "text-slate-200";

        if (part.type === "keyword") colorClass = "text-[#c084fc] font-medium";
        else if (part.type === "type") colorClass = "text-[#fbbf24]";
        else if (part.type === "string") colorClass = "text-[#34d399]";
        else if (part.type === "function") colorClass = "text-[#60a5fa]";
        else if (part.type === "boolean" || part.type === "number")
          colorClass = "text-[#f97316]";
        else if (part.type === "comment") colorClass = "text-slate-500 italic";

        return (
          <span key={i} className={colorClass}>
            {part.text}
          </span>
        );
      })}
    </span>
  );
}

// --------------------------------------------------
// HELPER: Initial folder expansion
// --------------------------------------------------

function getInitialOpenFolders(fileTree = []) {
  const initial = {};

  fileTree.forEach((node) => {
    if (node.type === "folder") {
      initial[node.id] = true;

      if (node.children) {
        node.children.forEach((sub) => {
          if (sub.type === "folder") {
            initial[sub.id] = true;
          }
        });
      }
    }
  });

  return initial;
}

// --------------------------------------------------
// COMPONENT: Recursive File Tree Node
// --------------------------------------------------

function FileTreeNode({
  node,
  selectedFile,
  onSelectFile,
  openFolders,
  onToggleFolder,
  searchQuery,
  depth = 0,
}) {
  if (node.type === "folder") {
    const isOpen = !!openFolders[node.id];

    const hasMatchingDescendant = (item) => {
      if (!searchQuery) return true;

      if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true;
      }

      if (item.children) {
        return item.children.some(hasMatchingDescendant);
      }

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
          style={{
            paddingLeft: `${depth * 14 + 8}px`,
          }}
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
            {node.children.map((child) => (
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

  if (
    searchQuery &&
    !node.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) {
    return null;
  }

  const isSelected = selectedFile === node.id;

  return (
    <div
      onClick={() => onSelectFile(node)}
      style={{
        paddingLeft: `${depth * 14 + 10}px`,
      }}
      className={`flex items-center gap-2 py-1 pr-2 rounded-md cursor-pointer transition ${
        isSelected
          ? "bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
      }`}
    >
      <FileCode
        className={`size-3.5 shrink-0 ${
          isSelected ? "text-indigo-400" : "text-slate-500"
        }`}
      />

      <span className="truncate">{node.name}</span>
    </div>
  );
}

// --------------------------------------------------
// MAIN COMPONENT: Dashboard
// --------------------------------------------------

export default function Dashboard({ repo: repoProp }) {
  const location = useLocation();

  // --------------------------------------------------
  // 1. RECEIVE DATA FROM ONBOARD & LOCAL STATE
  // --------------------------------------------------

  const [currentRepo, setCurrentRepo] = useState(
    repoProp || location.state?.repository || null,
  );

  const [currentFileTree, setCurrentFileTree] = useState(
    location.state?.fileTree || repoProp?.fileTree || [],
  );

  const [currentTotalFiles, setCurrentTotalFiles] = useState(
    location.state?.totalFiles ??
      (repoProp || location.state?.repository)?.totalFiles ??
      0,
  );

  const actualRepository = currentRepo;
  const actualFileTree = currentFileTree;
  const totalFiles = currentTotalFiles;

  // Dropdown & User Repositories
  const [userRepos, setUserRepos] = useState([]);
  const [loadingUserRepos, setLoadingUserRepos] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSwitchingRepo, setIsSwitchingRepo] = useState(false);

  // Add Repository Modal & Floating Card
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [addModalError, setAddModalError] = useState("");
  const [addModalStage, setAddModalStage] = useState("");
  const [newRepoUrl, setNewRepoUrl] = useState("");

  // Delete Repository Modal & Loading
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [deletingRepoId, setDeletingRepoId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const dropdownRef = useRef(null);

  const repositoryIdentity =
    actualRepository?._id ||
    actualRepository?.githubId ||
    actualRepository?.fullName ||
    "demo-repository";

  // --------------------------------------------------
  // 2. REPOSITORY METADATA
  // --------------------------------------------------

  const repo = useMemo(() => {
    return {
      ...defaultRepoData,
      ...(actualRepository || {}),
      fileTree: actualFileTree,
    };
  }, [actualRepository, actualFileTree]);

  const repoName = repo?.fullName || repo?.name || "Repository";

  const displayName = repo?.name?.toUpperCase() || "PROJECT";

  const owner = repo?.owner || "Unknown owner";

  const branch = repo?.defaultBranch || "main";

  const language = repo?.language || "Not specified";

  const stars = repo?.stars ?? 0;

  const forks = repo?.forks ?? 0;

  const isPrivate = repo?.isPrivate ?? false;

  const repositoryUrl = repo?.url || null;

  const status = {
    label: "Connected",
    lastIndexedText: "Codebase indexing not implemented",
  };

  const chatConfig = repo?.chatConfig || {};

  // --------------------------------------------------
  // 3. DASHBOARD STATES
  // --------------------------------------------------

  const [explorerWidth, setExplorerWidth] = useState(260);

  const [chatWidth, setChatWidth] = useState(430);

  const [isResizing, setIsResizing] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Explorer states
  const [selectedFile, setSelectedFile] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [openFolders, setOpenFolders] = useState(() =>
    getInitialOpenFolders(actualFileTree),
  );

  // Code editor states
  const [activeFileData, setActiveFileData] = useState(null);

  const [fileLoading, setFileLoading] = useState(false);

  const [fileError, setFileError] = useState("");

  const [copied, setCopied] = useState(false);

  // Request ID prevents outdated file requests
  // from overwriting the currently selected file.
  const fileRequestId = useRef(0);

  // --------------------------------------------------
  // 4. INITIAL CHAT MESSAGE
  // --------------------------------------------------

  const getInitialMessage = () => ({
    id: "init-1",
    sender: chatConfig.agentName || "Codebase AI",
    time: "just now",
    text: actualRepository
      ? `Your repository ${repoName} is connected.\n\nAsk me anything about your codebase, architecture, authentication flows, or API routes!`
      : "You're viewing the Vortes demo workspace. Connect a repository to explore and ask questions about its actual code.",
  });

  const [messages, setMessages] = useState([getInitialMessage()]);
  const [chatInput, setChatInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiThinking]);

  // --------------------------------------------------
  // 4B. REPOSITORY SWITCHING & MANAGEMENT
  // --------------------------------------------------

  // Load a repository file tree and activate it
  const loadRepository = async (targetRepo) => {
    if (!targetRepo?._id) return;
    setIsSwitchingRepo(true);

    try {
      const response = await API.get(`/repositories/${targetRepo._id}/tree`);
      if (response.data.success && response.data.fileTree) {
        setCurrentRepo(targetRepo);
        setCurrentFileTree(response.data.fileTree);
        setCurrentTotalFiles(response.data.totalFiles || 0);
        setOpenFolders(getInitialOpenFolders(response.data.fileTree));
      }
    } catch (err) {
      console.error("Failed to load repository tree:", err);
    } finally {
      setIsSwitchingRepo(false);
    }
  };

  // Switch repository from dropdown
  const handleSwitchRepository = async (targetRepo) => {
    if (!targetRepo?._id) return;
    if (currentRepo?._id === targetRepo._id) {
      setDropdownOpen(false);
      return;
    }
    setDropdownOpen(false);
    await loadRepository(targetRepo);
  };

  // Delete repository from MongoDB and ChromaDB
  const confirmDeleteRepository = async () => {
    if (!repoToDelete?._id) return;
    const targetId = repoToDelete._id;
    setDeletingRepoId(targetId);
    setDeleteError("");

    try {
      const response = await API.delete(`/repositories/${targetId}`);
      if (response.data.success) {
        // Remove from userRepos
        const remainingRepos = userRepos.filter((r) => r._id !== targetId);
        setUserRepos(remainingRepos);

        // If currently active repo was deleted, switch to next available or reset
        if (currentRepo?._id === targetId) {
          if (remainingRepos.length > 0) {
            await loadRepository(remainingRepos[0]);
          } else {
            setCurrentRepo(null);
            setCurrentFileTree([]);
            setCurrentTotalFiles(0);
            setSelectedFile("");
            setActiveFileData(null);
            setFileContent("");
            setOpenFolders({});
          }
        }

        setRepoToDelete(null);
      } else {
        setDeleteError(response.data.message || "Failed to delete repository.");
      }
    } catch (err) {
      console.error("Delete repository error:", err);
      setDeleteError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete repository."
      );
    } finally {
      setDeletingRepoId(null);
    }
  };

  // Fetch all repositories for this user from DB on mount
  useEffect(() => {
    let isMounted = true;

    const fetchUserRepositories = async () => {
      try {
        setLoadingUserRepos(true);
        const response = await API.get("/repositories");
        if (
          isMounted &&
          response.data.success &&
          Array.isArray(response.data.repositories)
        ) {
          const repos = response.data.repositories;
          setUserRepos(repos);

          // If no repository is active yet, select the first one from DB
          if (!currentRepo && repos.length > 0) {
            await loadRepository(repos[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user repositories:", err);
      } finally {
        if (isMounted) setLoadingUserRepos(false);
      }
    };

    fetchUserRepositories();

    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure currentRepo is in userRepos list if it came from location.state
  useEffect(() => {
    if (currentRepo?._id && userRepos.length > 0) {
      const exists = userRepos.some((r) => r._id === currentRepo._id);
      if (!exists) {
        setUserRepos((prev) => [currentRepo, ...prev]);
      }
    }
  }, [currentRepo, userRepos]);

  // Click outside to close dropdown & Escape to close modal/dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        if (!isAddingRepo) {
          setShowAddModal(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddingRepo]);

  // Add new repository from floating modal
  const handleAddRepository = async (urlToAdd) => {
    const url = (urlToAdd || newRepoUrl).trim();
    if (!url) {
      setAddModalError("Please enter a valid GitHub repository URL.");
      return;
    }

    setIsAddingRepo(true);
    setAddModalError("");
    setAddModalStage("Checking repository in database...");

    try {
      // Step 1: Check repo in DB or GitHub
      const checkRes = await API.post("/repositories/check", { repoUrl: url });
      const checkData = checkRes.data;

      if (!checkData.success) {
        throw new Error(checkData.message || "Failed to check repository.");
      }

      let repoToActivate;
      let fileTreeData;

      if (checkData.exists) {
        // Case 1: Already present in DB
        repoToActivate = checkData.repository;
        setAddModalStage("Structuring your files...");

        const treeRes = await API.get(
          `/repositories/${repoToActivate._id}/tree`,
        );
        fileTreeData = treeRes.data;

        if (
          !fileTreeData.success ||
          !fileTreeData.fileTree ||
          fileTreeData.totalFiles === 0
        ) {
          throw new Error("No files exist in this repository.");
        }
      } else {
        // Case 2: Not in DB
        if (checkData.hasFiles === false || checkData.totalFiles === 0) {
          throw new Error("No files exist in this repository.");
        }

        setAddModalStage("Saving repository to database...");
        const addRes = await API.post("/repositories/add", { repoUrl: url });
        const addData = addRes.data;

        if (!addData.success || !addData.repository) {
          throw new Error(addData.message || "Failed to save repository.");
        }

        repoToActivate = addData.repository;
        setAddModalStage("Structuring your files...");

        const treeRes = await API.get(
          `/repositories/${repoToActivate._id}/tree`,
        );
        fileTreeData = treeRes.data;

        if (
          !fileTreeData.success ||
          !fileTreeData.fileTree ||
          fileTreeData.totalFiles === 0
        ) {
          throw new Error("No files exist in this repository.");
        }

        // Add to user repos list
        setUserRepos((prev) => [
          repoToActivate,
          ...prev.filter((r) => r._id !== repoToActivate._id),
        ]);
      }

      // Activate newly added repository and its file tree
      setCurrentRepo(repoToActivate);
      setCurrentFileTree(fileTreeData.fileTree);
      setCurrentTotalFiles(fileTreeData.totalFiles);
      setOpenFolders(getInitialOpenFolders(fileTreeData.fileTree));

      // Reset modal state
      setNewRepoUrl("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Add repository error in modal:", err);
      setAddModalError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add repository.",
      );
    } finally {
      setIsAddingRepo(false);
    }
  };

  // --------------------------------------------------
  // 5. RESET WHEN REPOSITORY CHANGES
  // --------------------------------------------------

  useEffect(() => {
    fileRequestId.current += 1;

    setSelectedFile("");

    setActiveFileData(null);

    setFileLoading(false);

    setFileError("");

    setCopied(false);

    setOpenFolders(getInitialOpenFolders(actualFileTree));

    setSearchQuery("");

    setChatInput("");
    setIsAiThinking(false);

    setMessages([
      {
        id: "init-1",
        sender: chatConfig.agentName || "Codebase AI",
        time: "just now",
        text: actualRepository
          ? `Your repository ${repoName} is connected.\n\nAsk me anything about your codebase, architecture, authentication flows, or API routes!`
          : "You're viewing the Vortes demo workspace. Connect a repository to explore and ask questions about its actual code.",
      },
    ]);
  }, [repositoryIdentity]);

  // --------------------------------------------------
  // 6. FILE EXPLORER FUNCTIONS
  // --------------------------------------------------

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // --------------------------------------------------
  // 7. FETCH ACTUAL FILE CONTENT
  // --------------------------------------------------

  const handleSelectFile = async (file) => {
    if (!file?.path || !actualRepository?._id) {
      return;
    }

    const requestId = ++fileRequestId.current;

    // Immediately highlight selected file
    setSelectedFile(file.id);

    // Clear previously displayed source code
    setActiveFileData(null);

    setFileError("");

    setFileLoading(true);

    setCopied(false);

    try {
      const token = await getToken();

      // Ignore request if another file was selected
      if (requestId !== fileRequestId.current) {
        return;
      }

      const response = await API.get(
        `/repositories/${actualRepository._id}/file`,
        {
          params: {
            path: file.path,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (requestId !== fileRequestId.current) {
        return;
      }

      const data = response.data;

      if (!data.success || !data.file) {
        throw new Error(data.message || "Unable to retrieve file content.");
      }

      setActiveFileData(data.file);
    } catch (error) {
      if (requestId !== fileRequestId.current) {
        return;
      }

      console.error("File retrieval error:", error);

      setFileError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load file.",
      );
    } finally {
      if (requestId === fileRequestId.current) {
        setFileLoading(false);
      }
    }
  };

  // --------------------------------------------------
  // 8. COPY CODE
  // --------------------------------------------------

  const handleCopyCode = async () => {
    if (!activeFileData?.content) return;

    try {
      await navigator.clipboard.writeText(activeFileData.content);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Unable to copy code:", error);
    }
  };

  // --------------------------------------------------
  // 9. AI REPOSITORY CHAT (RAG API INTEGRATION)
  // --------------------------------------------------

  const handleSendMessage = async (customQuery) => {
    const query = (customQuery !== undefined ? customQuery : chatInput).trim();

    if (!query || isAiThinking) return;

    if (!actualRepository?._id) {
      setMessages((prev) => [
        ...prev,
        {
          id: "user-" + Date.now(),
          sender: "You",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text: query,
        },
        {
          id: "ai-" + (Date.now() + 1),
          sender: chatConfig.agentName || "Codebase AI",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          text: "Please select or connect a repository from the header dropdown before asking questions.",
          isError: true,
        },
      ]);
      setChatInput("");
      return;
    }

    const userMsg = {
      id: "user-" + Date.now(),
      sender: "You",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsAiThinking(true);

    try {
      const response = await API.post("/rag/ask", {
        repositoryId: actualRepository._id,
        query,
      });

      const data = response.data?.data;
      const answer =
        data?.answer ||
        "I analyzed the repository, but no answer could be generated.";
      const sources = data?.sources || [];

      const aiMsg = {
        id: "ai-" + Date.now(),
        sender: chatConfig.agentName || "Codebase AI",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: answer,
        sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("RAG Ask Error:", error);
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to generate repository answer. Please check if your repository is indexed.";

      const errorAiMsg = {
        id: "ai-err-" + Date.now(),
        sender: chatConfig.agentName || "Codebase AI",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: `Sorry, I encountered an issue analyzing the codebase:\n\n${errMsg}`,
        isError: true,
      };

      setMessages((prev) => [...prev, errorAiMsg]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // --------------------------------------------------
  // 10. CODE EDITOR LINE DATA
  // --------------------------------------------------

  const codeLines = useMemo(() => {
    return activeFileData?.content !== undefined
      ? activeFileData.content.split("\n")
      : [];
  }, [activeFileData]);

  // --------------------------------------------------
  // 11. RESIZABLE COLUMNS
  // --------------------------------------------------

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      if (isResizing === "explorer") {
        const newWidth = Math.max(160, Math.min(500, e.clientX));

        setExplorerWidth(newWidth);
      } else if (isResizing === "chat") {
        const explorerOffset = sidebarOpen ? explorerWidth : 32;

        const maxAllowedChat = Math.max(
          280,
          window.innerWidth - explorerOffset - 280,
        );

        const newWidth = Math.max(
          260,
          Math.min(maxAllowedChat, e.clientX - explorerOffset),
        );

        setChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    window.addEventListener("mousemove", handleMouseMove);

    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, sidebarOpen, explorerWidth]);

  // --------------------------------------------------
  // 12. DASHBOARD UI
  // --------------------------------------------------

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#06080d] text-slate-200">
      {/* Resize Overlay */}

      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
      )}

      {/* ==========================================
          TOP NAVIGATION BAR
      ========================================== */}

      <header className="min-h-12 border-b border-[#141923] bg-[#07090e] px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Branding and Repository */}

        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="logo" className="h-8" />
          </div>

          <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />

          {/* Repository Dropdown Selector */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono transition cursor-pointer group min-w-0"
                title="Switch repository"
              >
                <Github className="size-3.5 text-slate-400 group-hover:text-white shrink-0 transition-colors" />

                <span className="font-mono text-slate-200 group-hover:text-white truncate max-w-[180px] sm:max-w-[260px] md:max-w-[340px] select-text">
                  {repoName}
                </span>

                {isSwitchingRepo ? (
                  <Loader2 className="size-3 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <ChevronDown
                    className={`size-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                      dropdownOpen ? "rotate-180 text-white" : ""
                    }`}
                  />
                )}
              </button>

              {repositoryUrl && (
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open GitHub repository"
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition shrink-0"
                >
                  <Globe className="size-3.5" />
                </a>
              )}
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 w-72 sm:w-84 rounded-xl bg-[#0c101c] border border-white/15 shadow-2xl backdrop-blur-xl z-50 overflow-hidden flex flex-col"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-white/[0.02]">
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold">
                      Your Repositories
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                      {userRepos.length}
                    </span>
                  </div>

                  {/* Repositories List */}
                  <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.03] py-1">
                    {loadingUserRepos ? (
                      <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                        <Loader2 className="size-3.5 animate-spin text-indigo-400" />
                        <span>Loading repositories...</span>
                      </div>
                    ) : userRepos.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-slate-400 font-mono">
                        No repositories in database.
                      </div>
                    ) : (
                      userRepos.map((item) => {
                        const isSelected =
                          item._id === currentRepo?._id ||
                          item.fullName === currentRepo?.fullName;
                        return (
                          <div
                            key={item._id}
                            className={`w-full flex items-center justify-between px-3 py-1.5 transition group ${
                              isSelected
                                ? "bg-indigo-950/30 text-indigo-200"
                                : "hover:bg-white/5 text-slate-300"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSwitchRepository(item)}
                              className="flex-1 min-w-0 flex items-center justify-between text-left cursor-pointer mr-1 py-1"
                            >
                              <div className="flex items-center gap-2 min-w-0 mr-2">
                                <Github className="size-3.5 text-slate-400 group-hover:text-indigo-400 shrink-0 transition-colors" />
                                <span className="text-xs font-mono truncate">
                                  {item.fullName || item.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.defaultBranch && (
                                  <span className="text-[9px] font-mono text-slate-400 bg-white/4 border border-white/5 px-1.5 py-0.5 rounded">
                                    {item.defaultBranch}
                                  </span>
                                )}
                                {isSelected && (
                                  <Check className="size-3.5 text-indigo-400 shrink-0" />
                                )}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteError("");
                                setRepoToDelete(item);
                                setDropdownOpen(false);
                              }}
                              disabled={deletingRepoId === item._id}
                              title={`Delete ${item.fullName || item.name} from MongoDB & ChromaDB`}
                              className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 opacity-60 hover:opacity-100 group-hover:opacity-100 cursor-pointer disabled:opacity-30"
                            >
                              {deletingRepoId === item._id ? (
                                <Loader2 className="size-3 text-red-400 animate-spin" />
                              ) : (
                                <Trash2 className="size-3" />
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* "+ Add new repository" Option */}
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowAddModal(true);
                      setAddModalError("");
                    }}
                    className="flex items-center gap-2 w-full px-3.5 py-2.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 transition border-t border-white/10 cursor-pointer"
                  >
                    <Plus className="size-3.5 shrink-0" />
                    <span>+ Add new repository</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Repository Metadata */}

        <div className="flex items-center gap-2 shrink-0">

          {/* Language */}

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/10 text-[11px] text-slate-300">
            <Code2 className="size-3 text-indigo-400" />

            <span>{language}</span>
          </div>

          {/* Stars */}

          <div
            title="GitHub stars"
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/10 text-[11px] text-slate-300"
          >
            <Star className="size-3 text-amber-400" />

            <span>{stars.toLocaleString()}</span>
          </div>

          {/* Forks */}

          <div
            title="GitHub forks"
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/10 text-[11px] text-slate-300"
          >
            <GitFork className="size-3 text-slate-400" />

            <span>{forks.toLocaleString()}</span>
          </div>

          {/* Visibility */}

          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.03] border border-white/10 text-[11px] text-slate-300">
            {isPrivate ? (
              <Lock className="size-3 text-amber-400" />
            ) : (
              <Globe className="size-3 text-emerald-400" />
            )}

            <span>{isPrivate ? "Private" : "Public"}</span>
          </div>

          {/* Branch */}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/10 text-xs font-mono text-slate-300">
            <GitBranch className="size-3 text-slate-400" />

            <span className="text-[11px]">{branch}</span>
          </div>
        </div>
      </header>

      {/* ==========================================
          MAIN WORKSPACE
      ========================================== */}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ======================================
            1. LEFT COLUMN: FILE EXPLORER
        ====================================== */}

        {sidebarOpen ? (
          <aside
            style={{
              width: `${explorerWidth}px`,
            }}
            className="border-r border-[#141923] bg-[#07090e] flex flex-col shrink-0 min-w-0"
          >
            {/* Explorer Header */}

            <div className="h-9 px-3 border-b border-[#141923] flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Explorer
              </span>

              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/5 transition"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="size-3.5" />
              </button>
            </div>

            {/* Repository Root */}

            <div className="px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] tracking-wide text-slate-200 min-w-0">
                <ChevronDown className="size-3 text-slate-400 shrink-0" />

                <span className="truncate">{displayName}</span>
              </div>

              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                {totalFiles}
              </span>
            </div>

            {/* Repository Owner */}

            <div className="px-3 pb-2 text-[10px] text-slate-500 font-mono truncate">
              {owner}/{repo?.name || "repository"}
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

            {/* Actual GitHub File Tree */}

            <div className="flex-1 overflow-y-auto px-1 py-1 text-xs font-mono space-y-0.5">
              {isSwitchingRepo ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 className="size-4 animate-spin text-indigo-400" />
                  <span className="text-[11px] text-slate-400">
                    Switching repository...
                  </span>
                </div>
              ) : actualFileTree.length > 0 ? (
                actualFileTree.map((node) => (
                  <FileTreeNode
                    key={node.id}
                    node={node}
                    selectedFile={selectedFile}
                    onSelectFile={handleSelectFile}
                    openFolders={openFolders}
                    onToggleFolder={toggleFolder}
                    searchQuery={searchQuery}
                    depth={0}
                  />
                ))
              ) : (
                <div className="px-3 py-5 text-center text-slate-500 text-xs">
                  No repository files available.
                </div>
              )}
            </div>

            {/* Bottom Status */}

            <div className="border-t border-[#141923] px-3 py-2 flex flex-col gap-1 shrink-0">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="size-1.5 rounded-full bg-emerald-500" />

                <span className="text-slate-400 font-medium">
                  Repository Connected
                </span>
              </div>

              <span className="text-[10px] text-slate-500">
                {totalFiles} files · Source from GitHub
              </span>
            </div>
          </aside>
        ) : (
          /* Collapsed Sidebar */

          <button
            onClick={() => setSidebarOpen(true)}
            className="h-full w-8 border-r border-[#141923] bg-[#07090e] hover:bg-white/5 flex flex-col items-center pt-3 text-slate-500 hover:text-slate-300 transition shrink-0"
            title="Expand Sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        )}

        {/* Resize Handle 1 */}

        {sidebarOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing("explorer");
            }}
            onDoubleClick={() => setExplorerWidth(260)}
            className={`w-1 -ml-0.5 -mr-0.5 relative z-30 cursor-col-resize select-none transition-colors duration-150 hover:bg-indigo-500/70 ${
              isResizing === "explorer" ? "bg-indigo-500" : "bg-transparent"
            }`}
            title="Drag to resize, double-click to reset"
          />
        )}

        {/* ======================================
            2. MIDDLE COLUMN: AI CHAT
        ====================================== */}

        <section
          style={{
            width: `${chatWidth}px`,
          }}
          className="border-r border-[#141923] bg-[#070a10] flex flex-col shrink-0 min-w-0"
        >
          {/* Chat Header */}

          <div className="h-16 px-4 border-b border-[#141923] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/20">
                <Sparkles className="size-4.5" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-white leading-tight">
                  {chatConfig.title || "Ask your codebase"}
                </h2>

                <p className="text-xs text-slate-400">Grounded in repository</p>
              </div>
            </div>
          </div>

          {/* Repository Status Divider */}

          <div className="relative py-4 flex items-center justify-center shrink-0">
            <div className="absolute inset-x-8 h-px bg-white/5" />

            <span className="relative text-[10px] font-mono tracking-widest text-blue-300 px-3 py-0.5 rounded-full bg-[#070a10] border border-blue-500/20 uppercase">
              REPOSITORY CONNECTED
            </span>
          </div>

          {/* Chat Messages */}

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 text-xs leading-relaxed"
              >
                {msg.sender === (chatConfig.agentName || "Codebase AI") ? (
                  <div
                    className={`size-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.isError
                        ? "bg-red-950/80 border-red-500/40 text-red-400"
                        : "bg-indigo-950/80 border-indigo-500/30 text-indigo-400"
                    }`}
                  >
                    <Bot className="size-3.5" />
                  </div>
                ) : (
                  <div className="size-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-slate-200 shrink-0 mt-0.5 font-medium">
                    U
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-200">
                      {msg.sender}
                    </span>

                    <span className="text-[11px] text-slate-500">
                      {msg.time}
                    </span>
                  </div>

                  <div
                    className={`text-xs leading-relaxed whitespace-pre-line select-text ${
                      msg.isError ? "text-red-300" : "text-slate-300"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Sources citation list */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
                        Referenced files:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => {
                          const fileName =
                            src.filePath?.split("/").pop() || src.filePath;
                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => {
                                if (src.filePath && actualRepository?._id) {
                                  handleSelectFile({
                                    id: src.filePath,
                                    path: src.filePath,
                                    name: fileName,
                                  });
                                }
                              }}
                              title={`Open ${src.filePath}${
                                src.startLine
                                  ? ` (lines ${src.startLine}-${src.endLine})`
                                  : ""
                              }`}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.04] hover:bg-indigo-950/50 border border-white/10 hover:border-indigo-500/40 text-[10px] font-mono text-indigo-300 hover:text-white transition cursor-pointer"
                            >
                              <FileCode className="size-3 text-indigo-400 shrink-0" />
                              <span className="truncate max-w-[170px]">
                                {fileName}
                              </span>
                              {src.startLine && (
                                <span className="text-slate-500 text-[9px]">
                                  :{src.startLine}-{src.endLine}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* AI Thinking Animation */}
            {isAiThinking && (
              <div className="flex items-start gap-3 text-xs leading-relaxed">
                <div className="size-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-200">
                      {chatConfig.agentName || "Codebase AI"}
                    </span>
                    <span className="text-[11px] text-indigo-400 font-mono animate-pulse">
                      Thinking...
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 py-1">
                    <Loader2 className="size-3.5 animate-spin text-indigo-400" />
                    <span>Analyzing codebase & generating answer...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}

          <div className="p-4 border-t border-[#141923] bg-[#070a10] shrink-0">
            {/* Clickable suggestion chips */}
            {chatConfig.suggestions && chatConfig.suggestions.length > 0 && (
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {chatConfig.suggestions.slice(0, 3).map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAiThinking}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-[10px] text-slate-400 hover:text-indigo-300 bg-white/[0.03] hover:bg-indigo-950/40 border border-white/8 hover:border-indigo-500/30 px-2 py-1 rounded-md transition text-left truncate max-w-full cursor-pointer disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

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
                disabled={isAiThinking}
                placeholder={
                  chatConfig.placeholder || "Where is authentication handled?"
                }
                className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none pr-2 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isAiThinking || !chatInput.trim()}
                className="size-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer shrink-0 disabled:opacity-40"
                title="Send query"
              >
                {isAiThinking ? (
                  <Loader2 className="size-3.5 animate-spin text-indigo-400" />
                ) : (
                  <ArrowRight className="size-3.5" />
                )}
              </button>
            </form>

            <p className="mt-2 text-[10px] text-slate-600">
              AI answers grounded in your connected repository.
            </p>
          </div>
        </section>

        {/* Resize Handle 2 */}

        <div
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing("chat");
          }}
          onDoubleClick={() => setChatWidth(430)}
          className={`w-1 -ml-0.5 -mr-0.5 relative z-30 cursor-col-resize select-none transition-colors duration-150 hover:bg-indigo-500/70 ${
            isResizing === "chat" ? "bg-indigo-500" : "bg-transparent"
          }`}
          title="Drag to resize, double-click to reset"
        />

        {/* ======================================
            3. RIGHT COLUMN: CODE EDITOR
        ====================================== */}

        <main className="flex-1 flex flex-col bg-[#05070c] min-w-0 overflow-hidden">
          {/* Editor Tab Header */}

          <div className="h-9 border-b border-[#141923] bg-[#07090e] flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center h-full">
              <div className="h-full flex items-center gap-2 px-3 bg-[#05070c] border-r border-[#141923] text-xs font-mono text-slate-200 border-t-2 border-t-indigo-500">
                <FileCode className="size-3.5 text-indigo-400" />

                <span>{activeFileData?.name || "No file selected"}</span>

                {activeFileData && (
                  <span className="size-1.5 rounded-full bg-slate-500 ml-1" />
                )}
              </div>
            </div>

            {/* Copy Button */}

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleCopyCode}
                disabled={!activeFileData?.content}
                className="p-1 rounded hover:bg-white/5 hover:text-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Copy file code"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-400" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Breadcrumbs */}

          <div className="h-7 border-b border-[#141923] bg-[#06080d] px-4 flex items-center gap-1.5 text-xs font-mono text-slate-400 shrink-0">
            <Github className="size-3 text-slate-500" />

            <span className="text-slate-600">&gt;</span>

            <span className="truncate select-text">
              {activeFileData?.path || "Select a file"}
            </span>
          </div>

          {/* ======================================
              CODE EDITOR CONTENT
          ====================================== */}

          <div className="flex-1 overflow-auto relative">
            {/* Initial Empty State */}

            {!selectedFile && !fileLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                <div className="size-14 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center mb-4">
                  <FileCode className="size-6 text-indigo-400" />
                </div>

                <h3 className="text-sm font-medium text-slate-200 mb-2">
                  Select a file
                </h3>

                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Choose a file from the Explorer to view its source code here.
                </p>
              </div>
            )}

            {/* Loading State */}

            {fileLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-6 text-indigo-400 animate-spin" />

                <span className="text-xs text-slate-400">
                  Loading file contents...
                </span>
              </div>
            )}

            {/* Error State */}

            {!fileLoading && fileError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="size-7 text-red-400 mb-3" />

                <p className="text-sm text-red-300 mb-2">Unable to load file</p>

                <p className="text-xs text-slate-500 max-w-sm">{fileError}</p>
              </div>
            )}

            {/* Actual Source Code */}

            {!fileLoading && !fileError && activeFileData && (
              <div className="p-4 font-mono text-xs leading-relaxed selection:bg-indigo-600/30">
                <table className="w-full border-collapse">
                  <tbody>
                    {codeLines.map((line, index) => (
                      <tr key={index} className="hover:bg-white/[0.02]">
                        {/* Line Number */}

                        <td className="w-10 pr-6 text-right text-slate-600 select-none align-top font-mono text-[11px]">
                          {index + 1}
                        </td>

                        {/* Code */}

                        <td className="whitespace-pre font-mono text-slate-200 select-text">
                          {highlightCodeLine(line)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==========================================
          ADD NEW REPOSITORY MODAL WITH BACKDROP
      ========================================== */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isAddingRepo) {
                  setShowAddModal(false);
                  setAddModalError("");
                }
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            />

            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-lg rounded-2xl bg-[#0c101c] border border-white/15 p-6 shadow-2xl shadow-indigo-950/50 z-10 flex flex-col gap-4"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Github className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Add New Repository
                    </h3>
                    <p className="text-xs text-slate-400">
                      Connect a GitHub repository to inspect its files and code.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAddingRepo) {
                      setShowAddModal(false);
                      setAddModalError("");
                    }
                  }}
                  disabled={isAddingRepo}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition disabled:opacity-50 cursor-pointer"
                  title="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Status Stage Message if Loading */}
              {isAddingRepo && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
                  <Loader2 className="size-4 animate-spin shrink-0 text-indigo-400" />
                  <span>{addModalStage || "Processing repository..."}</span>
                </div>
              )}

              {/* Error Message if any */}
              {addModalError && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-950/30 border border-red-500/25 text-xs text-red-300">
                  <AlertCircle className="size-4 shrink-0 text-red-400" />
                  <span className="flex-1">{addModalError}</span>
                </div>
              )}

              {/* Repository Input Area */}
              <div className="pt-1">
                <RepositoryInput
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  onAnalyze={handleAddRepository}
                  isLoading={isAddingRepo}
                  disabled={isAddingRepo}
                  placeholder="https://github.com/owner/repository"
                  className="w-full"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          DELETE REPOSITORY CONFIRMATION MODAL
      ========================================== */}
      <AnimatePresence>
        {repoToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!deletingRepoId) {
                  setRepoToDelete(null);
                  setDeleteError("");
                }
              }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-2xl bg-[#0c101c] border border-red-500/20 p-6 shadow-2xl shadow-red-950/40 z-10 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                    <Trash2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Delete Repository
                    </h3>
                    <p className="text-xs text-slate-400">
                      Remove from MongoDB & ChromaDB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!!deletingRepoId}
                  onClick={() => {
                    setRepoToDelete(null);
                    setDeleteError("");
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer disabled:opacity-40"
                  title="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                <p>
                  Are you sure you want to delete{" "}
                  <span className="font-mono font-semibold text-white px-1.5 py-0.5 rounded bg-white/5 border border-white/10 select-text">
                    {repoToDelete?.fullName || repoToDelete?.name}
                  </span>
                  ?
                </p>
                <p className="text-slate-400">
                  This action will permanently delete the repository from the database and remove all its vectorized code embeddings from ChromaDB.
                </p>
              </div>

              {deleteError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                  <AlertCircle className="size-4 text-red-400 shrink-0" />
                  <span className="flex-1">{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={!!deletingRepoId}
                  onClick={() => {
                    setRepoToDelete(null);
                    setDeleteError("");
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!!deletingRepoId}
                  onClick={confirmDeleteRepository}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-red-950/50"
                >
                  {deletingRepoId ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      <span>Delete Repository</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
