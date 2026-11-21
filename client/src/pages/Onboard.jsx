import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Github,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FolderTree,
  ArrowRight,
} from "lucide-react";
import API from "../api/axios";

export default function Onboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract repoUrl from location.state or query parameters
  const queryParams = new URLSearchParams(location.search);
  const repoUrl = location.state?.repoUrl || queryParams.get("repoUrl") || "";

  const [status, setStatus] = useState("loading"); // 'loading' | 'structuring' | 'success' | 'error'
  const [stageMessage, setStageMessage] = useState("Checking repository in database...");
  const [repoData, setRepoData] = useState(location.state?.repository || null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Prevent duplicate API calls during React StrictMode effects
  const requestStarted = useRef(false);

  const handleError = (message) => {
    setErrorMessage(message);
    setStatus("error");
    setShowToast(true);
    setCountdown(5);
  };

  // Safe countdown effect: decrements every second and redirects cleanly when reaching 0
  useEffect(() => {
    if (status !== "error") return;

    if (countdown <= 0) {
      navigate("/", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  useEffect(() => {
    if (!repoUrl) {
      navigate("/", { replace: true });
      return;
    }

    const processRepository = async () => {
      try {
        // =====================================================================
        // STEP 1: Check if repository is already present in DB
        // =====================================================================
        setStageMessage("Checking repository in database...");
        setStatus("loading");

        const checkResponse = await API.post("/repositories/check", { repoUrl });
        const checkData = checkResponse.data;

        if (!checkData.success) {
          throw new Error(checkData.message || "Failed to check repository.");
        }

        let repository;
        let fileTreeData;

        if (checkData.exists) {
          // ===================================================================
          // CASE 1: Repo is already present in the database
          // ===================================================================
          repository = checkData.repository;
          setRepoData(repository);

          // i) & ii): Call getRepositoryFiles controller and fetch files
          setStageMessage("Structuring your files...");
          setStatus("structuring");

          const filesResponse = await API.get(`/repositories/${repository._id}/tree`);
          fileTreeData = filesResponse.data;

          // Check if the repo has any files
          if (!fileTreeData.success || !fileTreeData.fileTree || fileTreeData.totalFiles === 0) {
            throw new Error("No files exist");
          }
        } else {
          // ===================================================================
          // CASE 2: Repo is NOT in the database
          // ===================================================================
          const githubRepoData = checkData.repoData;
          if (githubRepoData) {
            setRepoData(githubRepoData);
          }

          // i) Check if the repo has any files
          if (checkData.hasFiles === false || checkData.totalFiles === 0) {
            throw new Error("No files exist");
          }

          // ii) Insert that repo in the database
          setStageMessage("Saving repository to database...");
          setStatus("loading");

          const addResponse = await API.post("/repositories/add", { repoUrl });
          const addData = addResponse.data;

          if (!addData.success || !addData.repository) {
            throw new Error(addData.message || "Failed to save repository.");
          }

          repository = addData.repository;
          setRepoData(repository);

          // iii) Call getRepositoryFiles controller and fetch all files
          setStageMessage("Structuring your files...");
          setStatus("structuring");

          const filesResponse = await API.get(`/repositories/${repository._id}/tree`);
          fileTreeData = filesResponse.data;

          if (!fileTreeData.success || !fileTreeData.fileTree || fileTreeData.totalFiles === 0) {
            throw new Error("No files exist");
          }
        }

        // =====================================================================
        // STEP 3: Redirect to the dashboard page with that repo data
        // =====================================================================
        setStageMessage("Repository ready! Loading dashboard...");
        setStatus("success");

        setTimeout(() => {
          navigate("/dashboard", {
            replace: true,
            state: {
              repository,
              fileTree: fileTreeData.fileTree,
              totalFiles: fileTreeData.totalFiles,
            },
          });
        }, 1200);

      } catch (error) {
        console.error("Onboarding error:", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Something went wrong while processing the repository.";

        handleError(message);
      }
    };

    if (!requestStarted.current) {
      requestStarted.current = true;
      processRepository();
    }
  }, [repoUrl, navigate]);

  const repoName = repoData?.fullName || repoData?.name || "Your repository";
  const branch = repoData?.defaultBranch || "Default branch";

  return (
    <div className="min-h-screen w-screen bg-[#05070e] text-slate-200 flex flex-col items-center justify-center p-6 relative">
      {/* Subtle background ambient radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[540px] flex flex-col items-center relative z-10"
      >
        {/* Animated Circular Logo with Rotating Orbit */}
        <div className="relative size-28 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border border-indigo-500/20" />

          {/* Orbiting Satellite Dot */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full pointer-events-none"
          >
            <div className="absolute -top-1.5 right-6 size-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8]" />
            <div className="absolute -bottom-1 left-7 size-1.5 rounded-full bg-indigo-400/50" />
          </motion.div>

          {/* Inner Badge Container */}
          <div className="size-20 rounded-full bg-[#090d1f] border border-indigo-500/30 shadow-xl shadow-indigo-950/60 flex items-center justify-center">
            <div className="size-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Github className="size-6" />
            </div>
          </div>
        </div>

        {/* Category Label */}
        <span className="text-[11px] font-mono tracking-widest text-indigo-400 uppercase font-semibold mb-3">
          REPOSITORY ONBOARDING
        </span>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center tracking-tight leading-tight mb-5">
          Getting to know <br />
          your codebase.
        </h1>

        {/* Repository Details Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/8 mb-8 text-xs font-mono">
          <Github className="size-3.5 text-slate-400" />
          <span className="text-slate-300 font-medium">{repoName}</span>
          <span className="text-[10px] text-slate-400 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded ml-1">
            {branch}
          </span>
        </div>

        {/* Dynamic Status / Progress Section */}
        <div className="w-full">
          {/* Active Loading & Structuring Stage */}
          {(status === "loading" || status === "structuring") && (
            <div className="flex flex-col items-center justify-center gap-3 py-3">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 text-indigo-400 animate-spin" />
                <span className="text-sm font-medium text-slate-200">
                  {stageMessage}
                </span>
              </div>
              {status === "structuring" && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <FolderTree className="size-3.5 text-indigo-400" />
                  <span>Fetching repository tree from GitHub...</span>
                </div>
              )}
            </div>
          )}

          {/* Success Stage */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 py-3"
            >
              <CheckCircle2 className="size-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {stageMessage}
              </span>
            </motion.div>
          )}

          {/* Error Container */}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-500/25 bg-red-950/20 p-5 w-full shadow-lg"
            >
              <div className="flex items-center gap-2.5 text-red-400 mb-2">
                <AlertCircle className="size-5 shrink-0" />
                <span className="font-semibold text-sm">Something went wrong</span>
              </div>

              <p className="text-sm text-slate-300 pl-7.5">{errorMessage}</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Toast Notification with 5-Second Countdown */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-8 z-50 flex items-center gap-3 bg-[#0d1222] border border-white/10 text-slate-200 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md"
          >
            <AlertCircle className="size-4 text-indigo-400 animate-pulse shrink-0" />
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span>Redirecting to the home page...</span>
              <span className="font-mono text-indigo-400 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                {countdown}s
              </span>
            </div>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="ml-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
