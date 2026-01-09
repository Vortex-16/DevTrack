import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { projectsApi, githubApi, geminiApi, projectIdeasApi, savedIdeasApi, readmeApi } from "../services/api";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Lenis from "lenis";
import { useLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCache } from "../context/CacheContext";
import {
  Folder,
  Activity,
  CheckCircle,
  GitCommitHorizontal,
  Plus,
  Rocket,
  Star,
  FileText,
  Bug,
  Bot,
  RefreshCcw,
  Loader2,
  PlusSquare,
  PartyPopper,
  Sparkles,
  Search,
  Lightbulb,
  Clock,
  GraduationCap,
  Zap,
  Bookmark,
  Leaf,
  Lock,
  XCircle,
  AlertTriangle,
  Globe,
  ArrowLeft,
  ChevronDown,
  Projector,
} from "lucide-react";
import SimilarProjectsModal from "../components/projects/SimilarProjectsModal";
import SavedProjectsModal from "../components/projects/SavedProjectsModal";
import SavedIdeasModal from "../components/projects/SavedIdeasModal";
import ReadmeGeneratorModal from "../components/projects/ReadmeGeneratorModal";
import PixelTransition from "../components/ui/PixelTransition";

// SVG Icon Components
const GeminiIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C10.5 8.5 8 10.5 2 12C8 13.5 10.5 16 12 22C13.5 16 16 13.5 22 12C16 10.5 13.5 8 12 2Z"
      fill="currentColor"
    />
  </svg>
);

// Animated counter
function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const numValue = parseInt(value) || 0;
    if (numValue === 0) {
      setCount(0);
      return;
    }
    const step = numValue / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
}

// Stat Card Component
function StatCard({ icon, label, value, color, delay = 0 }) {
  const colors = {
    purple: {
      border: "border-purple-500/30",
      iconBg: "from-purple-500 to-purple-600",
      glow: "shadow-purple-500/20",
    },
    cyan: {
      border: "border-cyan-500/30",
      iconBg: "from-cyan-500 to-cyan-600",
      glow: "shadow-cyan-500/20",
    },
    green: {
      border: "border-emerald-500/30",
      iconBg: "from-emerald-500 to-emerald-600",
      glow: "shadow-emerald-500/20",
    },
    orange: {
      border: "border-orange-500/30",
      iconBg: "from-orange-500 to-orange-600",
      glow: "shadow-orange-500/20",
    },
  };
  const c = colors[color] || colors.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className={`rounded-2xl p-3 md:p-5 border ${c.border} backdrop-blur-sm h-full`}
        style={{
          background:
            "linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))",
        }}
      >
        <div className="flex items-start gap-3 md:gap-4">
          <div
            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-lg md:text-xl shadow-lg ${c.glow} flex-shrink-0`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex flex-col justify-center min-h-[3rem]">
            <p className="text-xl md:text-2xl font-bold text-white leading-none mb-1">
              <AnimatedCounter value={value} />
            </p>
            <p className="text-slate-400 text-xs md:text-sm leading-tight line-clamp-2">
              {label}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Project Card Component
function ProjectCard({
  project,
  onEdit,
  onDelete,
  onReanalyze,
  onComplete,
  analyzing,
  delay = 0,
  isExpanded,
  onToggle,
  onGenerateReadme,
}) {
  const statusColors = {
    Active: {
      bg: "bg-emerald-500/20",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    Completed: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500/30",
    },
    Planning: {
      bg: "bg-orange-500/20",
      text: "text-orange-400",
      border: "border-orange-500/30",
    },
    "On Hold": {
      bg: "bg-slate-500/20",
      text: "text-slate-400",
      border: "border-slate-500/30",
    },
  };
  const status = statusColors[project.status] || statusColors.Planning;
  const progress =
    project.status === "Completed"
      ? 100
      : project.aiAnalysis?.progressPercentage ?? project.progress ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group"
    >
      <div
        className={`rounded-2xl p-6 border ${isExpanded ? "border-purple-500/50" : "border-white/10"
          } hover:border-purple-500/30 transition-all duration-300 flex flex-col`}
        style={{
          background:
            "linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex-1 min-w-0"
            onClick={onToggle}
            style={{ cursor: "pointer" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-white truncate">
                {project.name}
              </h3>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="text-slate-500 text-xs"
              >
                <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
              </motion.span>
            </div>
            <p
              className={`text-slate-400 text-sm ${isExpanded ? "" : "truncate"
                }`}
            >
              {project.description || "No description"}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${status.bg} ${status.text} ${status.border} border ml-3 flex-shrink-0`}
          >
            {project.status}
          </span>
          {/* Show analyzing indicator when server is processing GitHub/AI data */}
          {project.isAnalyzing && (
            <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 ml-2 flex-shrink-0 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing
            </span>
          )}
        </div>

        {/* Progress Bar (Always visible but compact) */}
        <div className="mb-2">
          <div className="flex justify-between text-[11px] mb-1.5 px-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Progress
            </span>
            <span className="text-purple-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                delay: delay + 0.3,
                duration: 0.8,
                ease: "easeOut",
              }}
            />
          </div>
        </div>

        {/* Expandable Section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* AI Analysis (Compact in details) */}
                {project.aiAnalysis && (
                  <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <GeminiIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                        AI Status Report
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      "
                      {project.aiAnalysis.progressSummary ||
                        project.aiAnalysis.reasoning ||
                        "Project is proceeding normally."}
                      "
                    </p>
                  </div>
                )}

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5">
                  {(project.technologies || []).map((tech, i) => {
                    // Handle both string and object formats
                    const techName =
                      typeof tech === "string"
                        ? tech
                        : tech?.name || String(tech);
                    return (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-medium border border-white/5"
                      >
                        {techName}
                      </span>
                    );
                  })}
                </div>

                {/* Detailed Stats Row */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex gap-4 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase text-[9px] tracking-tight mb-0.5">
                        Stars
                      </span>
                      <span className="text-white font-medium flex items-center gap-1">
                        <Star
                          size={10}
                          className="text-yellow-500 fill-yellow-500"
                        />{" "}
                        {project.githubData?.stars || 0}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase text-[9px] tracking-tight mb-0.5">
                        Commits
                      </span>
                      <span className="text-white font-medium flex items-center gap-1">
                        <FileText size={10} className="text-blue-400" />{" "}
                        {project.commits || 0}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 uppercase text-[9px] tracking-tight mb-0.5">
                        Issues
                      </span>
                      <span className="text-white font-medium flex items-center gap-1">
                        <Bug size={10} className="text-red-400" />{" "}
                        {project.githubData?.openIssues || 0}
                      </span>
                    </div>
                  </div>

                  {project.repositoryUrl && (
                    <button
                      onClick={() => onReanalyze(project)}
                      disabled={analyzing}
                      className="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                      title="Re-analyze Repository"
                    >
                      {analyzing ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCcw size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer (Actions) */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <button
            onClick={onToggle}
            className="text-[10px] font-bold text-slate-500 hover:text-purple-400 uppercase tracking-widest transition-colors"
          >
            {isExpanded ? "Hide Details" : "View Details"}
          </button>

          <div className="flex gap-2">
            {project.repositoryUrl && (
              <button
                onClick={() => onGenerateReadme(project)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Generate README"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}
            {project.status !== "Completed" && (
              <button
                onClick={() => onComplete(project)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase transition-colors border border-emerald-500/20"
              >
                Done
              </button>
            )}
            <button
              onClick={() => onEdit(project)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Modal Component
// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const globalLenis = useLenis();

  // Global Scroll Lock
  useEffect(() => {
    if (isOpen) {
      globalLenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      globalLenis?.start();
      document.body.style.overflow = "unset";
    }
    return () => {
      globalLenis?.start();
      document.body.style.overflow = "unset";
    };
  }, [isOpen, globalLenis]);

  // Local Scroll (inside modal)
  useEffect(() => {
    if (!isOpen || !modalRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: modalRef.current,
      content: contentRef.current,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    resizeObserver.observe(contentRef.current);

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const animationId = requestAnimationFrame(raf);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
      lenis.destroy();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className="w-full max-w-lg rounded-3xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar"
          style={{
            background:
              "linear-gradient(145deg, rgba(30, 35, 50, 0.98), rgba(20, 25, 40, 0.99))",
            boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex items-center gap-4 p-6 border-b border-white/10 sticky top-0 bg-slate-900/50 backdrop-blur-md z-10">
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                  title="Close"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Project Form with two-path flow
function ProjectForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit,
  analyzing,
  error,
}) {
  const [hasRepo, setHasRepo] = useState(
    isEdit ? (formData.repositoryUrl ? "yes" : "no") : null
  );
  const [fetchingLanguages, setFetchingLanguages] = useState(false);
  const [fetchedLanguages, setFetchedLanguages] = useState([]);
  const [createRepoMode, setCreateRepoMode] = useState(false);
  // Initialize newRepoData with formData values (for AI-suggested projects)
  const [newRepoData, setNewRepoData] = useState({
    name: formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : "",
    description: formData.description || "",
    isPrivate: false,
  });
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [repoError, setRepoError] = useState("");

  // Parse GitHub URL to extract owner/repo
  const parseGitHubUrl = (url) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    return null;
  };

  // Auto-fetch languages when repo URL changes
  useEffect(() => {
    const fetchLanguages = async () => {
      const parsed = parseGitHubUrl(formData.repositoryUrl);
      if (!parsed) {
        setFetchedLanguages([]);
        return;
      }

      setFetchingLanguages(true);
      try {
        const response = await githubApi.getRepoLanguages(
          parsed.owner,
          parsed.repo
        );
        const langs = response.data?.data?.languages || [];
        setFetchedLanguages(langs);

        // Auto-fill technologies if empty
        if (langs.length > 0 && !formData.technologies) {
          setFormData({
            ...formData,
            technologies: langs.map((l) => l.name).join(", "),
          });
        }
      } catch (err) {
        console.error("Error fetching languages:", err);
        setFetchedLanguages([]);
      } finally {
        setFetchingLanguages(false);
      }
    };

    const timer = setTimeout(fetchLanguages, 500); // Debounce
    return () => clearTimeout(timer);
  }, [formData.repositoryUrl]);

  // Create a new GitHub repo
  const handleCreateRepo = async () => {
    if (!newRepoData.name) {
      setRepoError("Repository name is required");
      return;
    }

    setCreatingRepo(true);
    setRepoError("");

    try {
      const response = await githubApi.createRepo(
        newRepoData.name,
        newRepoData.description,
        newRepoData.isPrivate
      );

      if (response.data?.success) {
        const repoUrl = response.data.data.url;
        setFormData({
          ...formData,
          repositoryUrl: repoUrl,
          name: formData.name || newRepoData.name,
        });
        setHasRepo("yes");
        setCreateRepoMode(false);
      }
    } catch (err) {
      setRepoError(err.response?.data?.error || "Failed to create repository");
    } finally {
      setCreatingRepo(false);
    }
  };

  // Initial question - skip if editing
  if (!isEdit && hasRepo === null) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Folder size={48} className="text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Do you have a GitHub repository?
          </h3>
          <p className="text-slate-400 text-sm">
            We'll auto-fetch languages and analyze your project
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setHasRepo("yes")}
            className="p-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
          >
            <div className="mb-2">
              <CheckCircle
                size={32}
                className="text-emerald-500 group-hover:scale-110 transition-transform"
              />
            </div>
            <p className="font-semibold text-white">Yes, I have a repo</p>
            <p className="text-xs text-slate-400 mt-1">
              Link your existing repository
            </p>
          </button>

          <button
            onClick={() => setHasRepo("no")}
            className="p-6 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-left group"
          >
            <div className="mb-2">
              <PlusSquare
                size={32}
                className="text-cyan-500 group-hover:scale-110 transition-transform"
              />
            </div>
            <p className="font-semibold text-white">No, create one</p>
            <p className="text-xs text-slate-400 mt-1">
              We'll create a repo for you
            </p>
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full mt-4 border border-white/20 hover:border-white/40"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Create new repo form
  if (hasRepo === "no" && !createRepoMode && !formData.repositoryUrl) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => setHasRepo(null)}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Rocket size={48} className="text-cyan-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Create a New Repository
          </h3>
          <p className="text-slate-400 text-sm">
            We'll create a GitHub repo and link it to your project
          </p>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Repository Name *
          </label>
          <input
            type="text"
            value={newRepoData.name}
            onChange={(e) =>
              setNewRepoData({
                ...newRepoData,
                name: e.target.value.replace(/\s+/g, "-"),
              })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="my-awesome-project"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Description (optional)
          </label>
          <textarea
            value={newRepoData.description}
            onChange={(e) =>
              setNewRepoData({ ...newRepoData, description: e.target.value })
            }
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:border-purple-500 focus:outline-none transition-colors resize-none"
            placeholder="A brief description of your project..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setNewRepoData({ ...newRepoData, isPrivate: false })}
            className={`flex-1 p-3 rounded-xl border-2 transition-all ${!newRepoData.isPrivate
              ? "border-purple-500 bg-purple-500/10"
              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              }`}
          >
            <p className="font-medium text-white flex items-center gap-1.5"><Globe className="w-4 h-4" /> Public</p>
            <p className="text-xs text-slate-400">Anyone can see</p>
          </button>
          <button
            type="button"
            onClick={() => setNewRepoData({ ...newRepoData, isPrivate: true })}
            className={`flex-1 p-3 rounded-xl border-2 transition-all ${newRepoData.isPrivate
              ? "border-purple-500 bg-purple-500/10"
              : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              }`}
          >
            <p className="font-medium text-white flex items-center gap-1.5"><Lock className="w-4 h-4" /> Private</p>
            <p className="text-xs text-slate-400">Only you</p>
          </button>
        </div>

        {repoError && (
          <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
            {repoError}
          </p>
        )}

        <div className="flex gap-4 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setHasRepo(null)}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleCreateRepo}
            className="flex-1"
            disabled={creatingRepo || !newRepoData.name}
          >
            {creatingRepo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><Rocket className="w-4 h-4 mr-2" />Create Repository</>}
          </Button>
        </div>
      </div>
    );
  }

  // Main project form (with or without repo)
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!isEdit && hasRepo !== null && (
        <button
          type="button"
          onClick={() => {
            setHasRepo(null);
            setFormData({ ...formData, repositoryUrl: "" });
          }}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
      )}

      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Project Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="My Awesome Project"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[80px] focus:border-purple-500 focus:outline-none transition-colors resize-none"
          placeholder="Describe your project..."
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">Status</label>
        <div className="grid grid-cols-4 gap-2">
          {["Planning", "Active", "On Hold", "Completed"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFormData({ ...formData, status })}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${formData.status === status
                ? "bg-purple-500/20 border-purple-500 text-white"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/30"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* GitHub Repository - Required if hasRepo is 'yes' */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          GitHub Repository
          {hasRepo === "yes" && <span className="text-red-400"> *</span>}
          <span className="text-purple-400 ml-2 text-xs">
            <Sparkles className="w-3 h-3 text-yellow-400" /> Auto-fetches languages!
          </span>
        </label>
        <input
          type="url"
          value={formData.repositoryUrl}
          onChange={(e) =>
            setFormData({ ...formData, repositoryUrl: e.target.value })
          }
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="https://github.com/username/repo"
          required={hasRepo === "yes"}
        />

        {/* Show fetched languages */}
        {fetchingLanguages && (
          <p className="text-purple-400 text-xs mt-2 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" /> Fetching languages...
          </p>
        )}
        {fetchedLanguages.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {fetchedLanguages.map((lang, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs"
              >
                {lang.name} ({lang.percentage}%)
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Technologies (comma separated)
        </label>
        <input
          type="text"
          value={formData.technologies}
          onChange={(e) =>
            setFormData({ ...formData, technologies: e.target.value })
          }
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="React, Node.js, Firebase"
        />
      </div>

      {/* Error Message - Displayed prominently above buttons */}
      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">Could not create project</span>
          </div>
          <p className="text-red-300 text-sm pl-7">
            <span className="text-red-400 font-medium">Reason: </span>
            {error}
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="flex-1 border border-white/20 hover:border-white/40"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={analyzing}>
          {analyzing
            ? <><Search className="w-4 h-4 mr-2 animate-pulse" />Analyzing...</>
            : isEdit
              ? "Save Changes"
              : "Create Project"}
        </Button>
      </div>
    </form>
  );
}

// Success Tick Component (Google Pay Style)
function SuccessTick() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="relative flex flex-col items-center justify-center transform -translate-y-8">
        {/* Icon Container to ensure concentricity */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Ripple Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.8, 2.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeInOut",
                }}
                className="absolute w-28 h-28 bg-emerald-500/30 rounded-full"
              />
            ))}
          </div>

          {/* Main Circle Pop */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.6)] border-4 border-slate-900"
          >
            <svg
              className="w-14 h-14 text-white drop-shadow-md"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3.5}
            >
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "easeInOut" }}
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </div>

        {/* Text below */}
        <div className="text-center z-20">
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white mb-2 tracking-tight"
          >
            Completed!
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-400 font-medium"
          >
            Project marked as done
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const { getCachedData, setCachedData, hasCachedData } = useCache();

  // Helper function to sanitize project data
  const sanitizeProjects = (projects) => {
    if (!Array.isArray(projects)) return [];

    return projects.map((project) => {
      const sanitized = { ...project };

      // Fix openIssues if it's an array instead of a number
      if (sanitized.githubData?.openIssues) {
        if (Array.isArray(sanitized.githubData.openIssues)) {
          sanitized.githubData = {
            ...sanitized.githubData,
            openIssues: sanitized.githubData.openIssues.length,
          };
        }
      }

      // Fix technologies if it contains objects instead of strings
      if (Array.isArray(sanitized.technologies)) {
        sanitized.technologies = sanitized.technologies.map((tech) =>
          typeof tech === "string" ? tech : tech?.name || String(tech)
        );
      }

      return sanitized;
    });
  };

  // Initialize from cache with sanitization
  const cachedData = getCachedData("projects_data") || {};
  const sanitizedCachedProjects = sanitizeProjects(cachedData.projects || []);

  const [projects, setProjects] = useState(sanitizedCachedProjects);
  const [loading, setLoading] = useState(!hasCachedData("projects_data"));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState(
    cachedData.stats || {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalCommits: 0,
    }
  );

  const [showModal, setShowModal] = useState(false);

  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [completeConfirm, setCompleteConfirm] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showSavedIdeasModal, setShowSavedIdeasModal] = useState(false);
  const [showIdeasModal, setShowIdeasModal] = useState(false);
  const [projectIdeas, setProjectIdeas] = useState([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideaDifficulty, setIdeaDifficulty] = useState('intermediate');
  // Track shown idea titles with occurrence count (max 2 times per idea)
  const [shownIdeaTitles, setShownIdeaTitles] = useState({});
  // Track saved idea titles for bookmark status
  const [savedIdeaTitles, setSavedIdeaTitles] = useState(new Set());
  // README Generator Modal
  const [showReadmeModal, setShowReadmeModal] = useState(false);
  const [readmeProject, setReadmeProject] = useState(null);

  const defaultFormData = {
    name: "",
    description: "",
    status: "Planning",
    repositoryUrl: "",
    technologies: "",
  };
  const [formData, setFormData] = useState(defaultFormData);

  // Clear error when user types
  useEffect(() => {
    if (formError) setFormError(null);
  }, [formData]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!hasCachedData("projects_data")) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const [projectsRes, statsRes] = await Promise.all([
        projectsApi.getAll({ limit: 50 }),
        projectsApi.getStats(),
      ]);

      const rawProjects = projectsRes.data.data.projects || [];
      const newStats = statsRes.data.data || {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalCommits: 0,
      };

      // Sanitize project data to fix legacy data structures
      const newProjects = sanitizeProjects(rawProjects);

      setProjects(newProjects);
      setStats(newStats);

      // Cache data
      setCachedData("projects_data", {
        projects: newProjects,
        stats: newStats,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const parseGitHubUrl = (url) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    return null;
  };

  const analyzeWithGitHub = async (repositoryUrl) => {
    const githubInfo = parseGitHubUrl(repositoryUrl);
    if (!githubInfo) return null;

    try {
      const repoResponse = await githubApi.analyzeRepo(
        githubInfo.owner,
        githubInfo.repo
      );
      const repoInfo = repoResponse.data.data;

      let result = {
        commits: repoInfo.totalCommits || repoInfo.commitCount || 0,
        technologies: repoInfo.languages?.map((l) => l.name) || [],
        githubData: {
          stars: repoInfo.stars,
          forks: repoInfo.forks,
          openIssues:
            repoInfo.openIssuesCount ||
            (Array.isArray(repoInfo.openIssues)
              ? repoInfo.openIssues.length
              : 0),
          languages: repoInfo.languages,
          totalCommits: repoInfo.totalCommits,
        },
        progress: 0,
        aiAnalysis: null,
      };

      try {
        const analysisResponse = await geminiApi.analyzeProject(repoInfo);
        if (analysisResponse.data.data?.success) {
          const analysis = analysisResponse.data.data;
          result.progress =
            analysis.progressPercentage ?? analysis.progress ?? 0;
          result.aiAnalysis = {
            progressSummary: analysis.progressSummary,
            progressPercentage: analysis.progressPercentage,
            commitFrequencyScore: analysis.commitFrequencyScore,
            nextRecommendedTasks: analysis.nextRecommendedTasks,
            reasoning: analysis.reasoning || analysis.progressSummary,
          };
        }
      } catch (aiErr) {
        console.error("AI analysis failed:", aiErr);
      }

      return result;
    } catch (ghErr) {
      console.error("GitHub fetch failed:", ghErr);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const techArray = formData.technologies
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      // Basic project data
      let projectData = { ...formData, technologies: techArray };

      // Close modal immediately for fast UX
      // setShowModal(false); // DON'T CLOSE IMMEDIATELY if we want to show errors, but since we want optimistic UI...
      // Actually, for validation errors we MUST wait for response.
      // But preserving the "Fast UX" might be tricky if we want to show server errors inline.
      // The previous code closed modal immediately. This means users never saw server errors in the modal!
      // They only saw "Failed to create project" alert if it failed.
      // To show inline errors, we must NOT close modal optimisticly for creation if we want to validate.
      // However, "optimistic UI" usually implies assuming success.
      // If we want "proper messages", we should probably wait for at least initial validation response.
      // Let's change this to wait for creation.

      // Create project
      const createResponse = await projectsApi.create(projectData);

      // If we get here, it succeeded
      setShowModal(false);
      setFormData(defaultFormData);
      setFormError(null);

      const newProject = createResponse.data?.data;

      if (newProject) {
        // Optimistic UI: Add new project to state immediately
        setProjects((prev) => [newProject, ...prev]);

        // Update stats optimistically
        setStats((prev) => ({
          ...prev,
          totalProjects: (prev.totalProjects || 0) + 1,
          activeProjects: projectData.status === "Active"
            ? (prev.activeProjects || 0) + 1
            : prev.activeProjects || 0,
        }));

        // Update cache with new project
        setCachedData("projects_data", {
          projects: [newProject, ...projects],
          stats: {
            ...stats,
            totalProjects: (stats.totalProjects || 0) + 1,
          },
        });
      }

      // Background: Server is analyzing GitHub data, poll for updates if needed
      if (newProject?.isAnalyzing) {
        // Start polling for analysis completion
        let pollCount = 0;
        const maxPolls = 10; // Maximum 10 polls (30 seconds total)
        const pollInterval = 3000; // Poll every 3 seconds

        const pollForCompletion = async () => {
          pollCount++;
          try {
            // Fetch just this specific project to check status
            const response = await projectsApi.getById(newProject.id);
            const updatedProject = response.data?.data;

            if (updatedProject && !updatedProject.isAnalyzing) {
              // Analysis complete, update state with fresh data
              setProjects((prev) =>
                prev.map((p) => (p.id === newProject.id ? updatedProject : p))
              );
              // Also refresh all data to ensure stats are up to date
              fetchData();
              return; // Stop polling
            }

            // Still analyzing, continue polling if we haven't exceeded max
            if (pollCount < maxPolls) {
              setTimeout(pollForCompletion, pollInterval);
            } else {
              // Max polls reached, do one final fetchData
              fetchData();
            }
          } catch (err) {
            console.error('Error polling for project completion:', err);
            // On error, fall back to fetchData
            fetchData();
          }
        };

        // Start polling after initial delay
        setTimeout(pollForCompletion, pollInterval);
      }
    } catch (err) {
      console.error("Error creating project:", err);
      // Backend returns error in 'error' field, not 'message'
      setFormError(err.response?.data?.error || err.message || "Failed to create project");
    }
  };

  const handleGenerateReadme = (project) => {
    setReadmeProject(project);
    setShowReadmeModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status || "Planning",
      repositoryUrl: project.repositoryUrl || "",
      technologies: (project.technologies || []).join(", "),
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // 1. Prepare Data
    const techArray = formData.technologies
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    let updateData = { ...formData, technologies: techArray };
    const needsAnalysis =
      formData.repositoryUrl &&
      formData.repositoryUrl !== editingProject.repositoryUrl;
    const projectId = editingProject.id;

    try {
      // 2. Trigger Full-Page "Loading..." Animation
      setLoading(true);

      // 3. Perform Basic Update
      await projectsApi.update(projectId, updateData);

      // 4. Clean up UI states
      setShowEditModal(false);
      setEditingProject(null);
      setFormData(defaultFormData);

      // 5. Fetch latest data (still under loading state or silent)
      await fetchData();

      // 6. Stop Full-Page Loading
      setLoading(false);

      // 7. Background Analysis (if needed)
      if (needsAnalysis) {
        (async () => {
          try {
            setIsBackgroundProcessing(true);
            const analysisData = await analyzeWithGitHub(
              updateData.repositoryUrl
            );
            if (analysisData) {
              await projectsApi.update(projectId, analysisData);
              fetchData();
            }
          } catch (err) {
            console.error("Background analysis failed:", err);
          } finally {
            setIsBackgroundProcessing(false);
          }
        })();
      }
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Failed to update project");
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await projectsApi.delete(projectId);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project");
    }
  };

  const handleReanalyze = async (project) => {
    if (!project.repositoryUrl) return;

    try {
      setAnalyzing(true);
      const analysisData = await analyzeWithGitHub(project.repositoryUrl);

      if (analysisData) {
        await projectsApi.update(project.id, {
          commits: analysisData.commits,
          technologies:
            analysisData.technologies.length > 0
              ? analysisData.technologies
              : project.technologies,
          githubData: analysisData.githubData,
          progress: analysisData.progress,
          aiAnalysis: analysisData.aiAnalysis,
        });
        fetchData();
      }
    } catch (err) {
      console.error("Error re-analyzing project:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleComplete = (project) => {
    setCompleteConfirm(project);
  };

  const executeProjectCompletion = async () => {
    if (!completeConfirm) return;

    // Optimistic UI: Show success immediately
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3500);

    const projectId = completeConfirm.id;
    setCompleteConfirm(null);

    (async () => {
      setIsBackgroundProcessing(true);
      try {
        // Only update status, preserve progress for undo capability
        await projectsApi.update(projectId, {
          status: "Completed",
        });
        fetchData();
      } catch (err) {
        console.error("Error completing project:", err);
        alert("Failed to update project status");
      } finally {
        setIsBackgroundProcessing(false);
      }
    })();
  };

  const projectsContainerRef = useRef(null);
  const projectsContentRef = useRef(null);
  const lenisRef = useRef(null);

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    if (!projectsContainerRef.current || !projectsContentRef.current) return;

    const lenis = new Lenis({
      wrapper: projectsContainerRef.current,
      content: projectsContentRef.current,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [projects]); // Re-init if projects change/load

  // Generate AI project ideas
  const handleGenerateIdeas = async () => {
    try {
      setGeneratingIdeas(true);
      setProjectIdeas([]);

      // Get titles that have already been shown twice (need to be excluded)
      const excludeTitles = Object.entries(shownIdeaTitles)
        .filter(([_, count]) => count >= 2)
        .map(([title]) => title);

      const response = await projectIdeasApi.generate({
        difficulty: ideaDifficulty,
        excludeTitles
      });

      if (response.data?.success) {
        const newIdeas = response.data.data.ideas || [];
        setProjectIdeas(newIdeas);

        // Update shown titles count
        setShownIdeaTitles(prev => {
          const updated = { ...prev };
          newIdeas.forEach(idea => {
            const title = idea.title;
            updated[title] = (updated[title] || 0) + 1;
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error generating ideas:', err);
      alert('Failed to generate project ideas. Please try again.');
    } finally {
      setGeneratingIdeas(false);
    }
  };

  // Start a project from an idea
  const startIdeaAsProject = (idea) => {
    setFormData({
      name: idea.title,
      description: idea.description,
      status: 'Planning',
      repositoryUrl: '',
      technologies: idea.techStack?.join(', ') || ''
    });
    setShowIdeasModal(false);
    setShowModal(true);
  };

  // Toggle save/unsave an idea
  const toggleSaveIdea = async (idea) => {
    const isSaved = savedIdeaTitles.has(idea.title);

    // Optimistic update
    setSavedIdeaTitles(prev => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.delete(idea.title);
      } else {
        newSet.add(idea.title);
      }
      return newSet;
    });

    try {
      if (isSaved) {
        // Generate the same ID the backend uses
        const ideaId = btoa(idea.title).replace(/[/+=]/g, '_').substring(0, 50);
        await savedIdeasApi.remove(ideaId);
      } else {
        await savedIdeasApi.save(idea);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      // Rollback on error
      setSavedIdeaTitles(prev => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(idea.title);
        } else {
          newSet.delete(idea.title);
        }
        return newSet;
      });
    }
  };

  return (
    <PixelTransition loading={loading}>
      <motion.div>
        {/* Main Container - Background removed */}
        <div className="px-4 md:px-6 py-0 flex flex-col h-[calc(100vh-4rem)] overflow-hidden overflow-x-hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-col lg:flex-row justify-between items-start md:items-start lg:items-center gap-4 mb-2 md:mb-4 flex-shrink-0">
            <div className="w-full md:w-full lg:w-auto">
              <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
              <p className="text-slate-400 text-sm whitespace-nowrap md:whitespace-nowrap lg:whitespace-normal">
                Track your development projects and milestones
              </p>
            </div>
            {/* Desktop buttons - modified for md screen */}
            <div className="hidden md:flex flex-row lg:flex-row gap-3 w-full lg:w-auto overflow-x-auto lg:overflow-visible scrollbar-hide pb-2 lg:pb-0">
              <Button
                onClick={() => setShowIdeasModal(true)}
                variant="ghost"
                className="flex items-center gap-2 border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs lg:text-sm h-8 lg:h-10 px-3 lg:px-4 whitespace-nowrap"
              >
                <Lightbulb className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
                Get Ideas
              </Button>
              <Button
                onClick={() => setShowSavedIdeasModal(true)}
                variant="ghost"
                className="flex items-center gap-2 border border-teal-500/30 hover:border-teal-500/50 hover:bg-teal-500/10 text-xs lg:text-sm h-8 lg:h-10 px-3 lg:px-4 whitespace-nowrap"
              >
                <Bookmark className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400" />
                Saved Ideas
              </Button>
              <Button
                onClick={() => setShowSavedModal(true)}
                variant="ghost"
                className="flex items-center gap-2 border border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-xs lg:text-sm h-8 lg:h-10 px-3 lg:px-4 whitespace-nowrap"
              >
                <Star className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-500 fill-yellow-500" />
                Saved Repos
              </Button>
              <Button
                onClick={() => setShowSimilarModal(true)}
                variant="ghost"
                className="flex items-center gap-2 border border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 text-xs lg:text-sm h-8 lg:h-10 px-3 lg:px-4 whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-purple-400" />
                Discover Similar
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 text-xs lg:text-sm h-8 lg:h-10 px-3 lg:px-4 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                New Project
              </Button>
            </div>
          </div>

          {/* Mobile buttons row - scrollable */}
          <div className="md:hidden flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 flex-shrink-0">
            <Button
              onClick={() => setShowIdeasModal(true)}
              variant="ghost"
              className="flex-shrink-0 flex items-center gap-2 border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs h-8 px-3"
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
              Get Ideas
            </Button>
            <Button
              onClick={() => setShowSavedIdeasModal(true)}
              variant="ghost"
              className="flex-shrink-0 flex items-center gap-2 border border-teal-500/30 hover:border-teal-500/50 hover:bg-teal-500/10 text-xs h-8 px-3"
            >
              <Bookmark className="w-3.5 h-3.5 text-teal-400" />
              Saved Ideas
            </Button>
            <Button
              onClick={() => setShowSavedModal(true)}
              variant="ghost"
              className="flex-shrink-0 flex items-center gap-2 border border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-xs h-8 px-3"
            >
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              Saved Repos
            </Button>
            <Button
              onClick={() => setShowSimilarModal(true)}
              variant="ghost"
              className="flex-shrink-0 flex items-center gap-2 border border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 text-xs h-8 px-3"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              Discover Similar
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              className="flex-shrink-0 flex items-center gap-2 text-xs h-8 px-3"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>

          {/* Stats Row */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mb-4 flex-shrink-0">
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
              <StatCard
                icon={<Folder className="w-5 h-5 md:w-6 md:h-6" />}
                label="Total Projects"
                value={stats.totalProjects || 0}
                color="purple"
                delay={0.1}
              />
            </div>
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
              <StatCard
                icon={<Activity className="w-5 h-5 md:w-6 md:h-6" />}
                label="Active"
                value={stats.activeProjects || 0}
                color="cyan"
                delay={0.15}
              />
            </div>
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
              <StatCard
                icon={<CheckCircle className="w-5 h-5 md:w-6 md:h-6" />}
                label="Completed"
                value={stats.completedProjects || 0}
                color="green"
                delay={0.2}
              />
            </div>
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-auto">
              <StatCard
                icon={<GitCommitHorizontal className="w-5 h-5 md:w-6 md:h-6" />}
                label="Total Commits"
                value={stats.totalCommits || 0}
                color="orange"
                delay={0.25}
              />
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div
            ref={projectsContainerRef}
            id="projects-scroll-container"
            className="flex-1 overflow-y-auto min-h-0 pr-6 -mr-2 relative"
          >
            <div ref={projectsContentRef} className="pb-4">
              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 mb-6"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 flex-1">Error: {error}</p>
                    <Button
                      variant="ghost"
                      onClick={fetchData}
                      className="text-sm"
                    >
                      Retry
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {!loading && projects.length === 0 && !error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 rounded-2xl border-2 border-dashed border-purple-500/30"
                >
                  <div className="flex justify-center mb-4">
                    <Rocket className="w-16 h-16 text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Projects Yet
                  </h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    Track your coding projects, link your GitHub repos, and let
                    AI analyze your progress!
                  </p>
                  <Button onClick={() => setShowModal(true)} size="lg">
                    Create Your First Project
                  </Button>
                </motion.div>
              )}

              {/* Projects Grid */}
              {projects.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {projects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isExpanded={expandedProjectId === project.id}
                      onToggle={() =>
                        setExpandedProjectId(
                          expandedProjectId === project.id ? null : project.id
                        )
                      }
                      onEdit={handleEdit}
                      onDelete={() => {
                        setDeleteConfirm(project.id);
                      }}
                      onReanalyze={handleReanalyze}
                      onComplete={handleComplete}
                      onGenerateReadme={handleGenerateReadme}
                      analyzing={analyzing}
                      delay={index * 0.1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Project?"
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <p className="text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>

        {/* Completion Confirmation Modal */}
        <Modal
          isOpen={!!completeConfirm}
          onClose={() => setCompleteConfirm(null)}
          title="Finish Project?"
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <PartyPopper className="w-16 h-16 text-yellow-500" />
            </div>
            <p className="text-xl font-semibold text-white mb-6">
              Do you want to finish this project?
            </p>
            <div className="flex gap-4">
              <Button
                variant="ghost"
                onClick={() => setCompleteConfirm(null)}
                className="flex-1 border border-white/20 hover:border-white/40"
              >
                No
              </Button>
              <Button
                onClick={executeProjectCompletion}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                Yes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="New Project"
        >
          <ProjectForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => setShowModal(false)}
            isEdit={false}
            analyzing={analyzing}
            error={formError}
          />
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProject(null);
          }}
          title="Edit Project"
        >
          <ProjectForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setShowEditModal(false);
              setEditingProject(null);
            }}
            isEdit={true}
            analyzing={analyzing}
            error={formError}
          />
        </Modal>
        {/* Background Processing Indicator */}
        <AnimatePresence>
          {isBackgroundProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg backdrop-blur-md"
            >
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-slate-300">
                Processing...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{showSuccess && <SuccessTick />}</AnimatePresence>

        {/* Similar Projects Discovery Modal */}
        <SimilarProjectsModal
          isOpen={showSimilarModal}
          onClose={() => setShowSimilarModal(false)}
          userLanguages={
            // Extract unique languages from user's projects
            [
              ...new Set(
                projects
                  .flatMap((p) =>
                    (p.languages || [])
                      .map((l) => (typeof l === "string" ? l : l.name))
                      .filter(Boolean)
                  )
                  .concat(
                    projects.map((p) => p.primaryLanguage).filter(Boolean)
                  )
              ),
            ].slice(0, 3)
          }
        />

        {/* Saved Repos Modal */}
        <SavedProjectsModal
          isOpen={showSavedModal}
          onClose={() => setShowSavedModal(false)}
        />

        {/* Saved Ideas Modal */}
        <SavedIdeasModal
          isOpen={showSavedIdeasModal}
          onClose={() => setShowSavedIdeasModal(false)}
          onStartProject={startIdeaAsProject}
        />

        {/* Readme Generator Modal */}
        <ReadmeGeneratorModal
          isOpen={showReadmeModal}
          onClose={() => {
            setShowReadmeModal(false);
            setReadmeProject(null);
          }}
          project={readmeProject}
        />

        {/* Project Ideas Modal */}
        <Modal
          isOpen={showIdeasModal}
          onClose={() => {
            setShowIdeasModal(false);
            setProjectIdeas([]);
          }}
          title={
            <div className="flex items-center gap-2">
              <Projector className="w-6 h-6 text-emerald-400" />
              <span>AI Project Ideas</span>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Header Description with gradient text */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl blur-xl opacity-50" />
              <div className="relative p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-slate-300 text-sm leading-relaxed">
                  Get <span className="text-emerald-400 font-medium">personalized project ideas</span> based on your skills, learning history, and current tech stack.
                </p>
              </div>
            </div>

            {/* Difficulty Selector - Enhanced Design */}
            <div>
              <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Select Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'beginner', label: 'Beginner', Icon: Leaf, desc: '1-2 weeks', color: 'emerald' },
                  { value: 'intermediate', label: 'Intermediate', Icon: Rocket, desc: '2-4 weeks', color: 'purple' },
                  { value: 'advanced', label: 'Advanced', Icon: Zap, desc: '4-8 weeks', color: 'orange' },
                ].map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setIdeaDifficulty(diff.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-center group relative overflow-hidden ${ideaDifficulty === diff.value
                      ? `bg-${diff.color}-500/20 border-${diff.color}-500 text-white shadow-lg shadow-${diff.color}-500/20`
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30 hover:bg-white/10'
                      }`}
                  >
                    {ideaDifficulty === diff.value && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    )}
                    <div className="relative">
                      <div className="flex justify-center mb-2">
                        <diff.Icon className={`w-7 h-7 group-hover:scale-110 transition-transform duration-300 ${ideaDifficulty === diff.value
                          ? diff.color === 'emerald' ? 'text-emerald-400'
                            : diff.color === 'purple' ? 'text-purple-400'
                              : 'text-orange-400'
                          : 'text-slate-400 group-hover:text-white'
                          }`} />
                      </div>
                      <div className="text-sm font-semibold mb-1">{diff.label}</div>
                      <div className="text-[11px] text-slate-500">{diff.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button - Enhanced */}
            <Button
              onClick={handleGenerateIdeas}
              disabled={generatingIdeas}
              className="w-full h-12 flex items-center justify-center gap-3 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 shadow-lg shadow-emerald-500/20"
            >
              {generatingIdeas ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing your skills...</span>
                </>
              ) : (
                <>
                  <GeminiIcon className="w-5 h-5" />
                  <span>Generate Project Ideas</span>
                </>
              )}
            </Button>

            {/* Ideas List - No nested scroll, let Modal's Lenis handle it */}
            {projectIdeas.length > 0 && (
              <div className="space-y-4 pt-5 border-t border-white/10">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <Lightbulb className="w-4 h-4 text-emerald-400" />
                  </div>
                  Suggested Projects
                  <span className="ml-auto text-xs px-2 py-1 rounded-full bg-white/10 text-slate-400">
                    {projectIdeas.length} ideas
                  </span>
                </h3>

                {/* Ideas Cards - Scrollable via Modal's Lenis */}
                <div className="space-y-4">
                  {projectIdeas.map((idea, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="group p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="font-bold text-white text-base leading-tight group-hover:text-emerald-300 transition-colors flex-1">
                          {idea.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Bookmark Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveIdea(idea);
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-200 ${savedIdeaTitles.has(idea.title)
                              ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-teal-400'
                              }`}
                            title={savedIdeaTitles.has(idea.title) ? 'Remove from saved' : 'Save idea'}
                          >
                            <Bookmark className={`w-4 h-4 ${savedIdeaTitles.has(idea.title) ? 'fill-teal-400' : ''}`} />
                          </button>
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                            {idea.category || 'Project'}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">
                        {idea.description}
                      </p>

                      {/* Tech Stack - Improved tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(idea.techStack || []).slice(0, 6).map((tech, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-[11px] font-medium border border-purple-500/20"
                          >
                            {tech}
                          </span>
                        ))}
                        {(idea.techStack || []).length > 6 && (
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-500 text-[11px] font-medium">
                            +{idea.techStack.length - 6} more
                          </span>
                        )}
                      </div>

                      {/* Meta Info - Better layout */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 p-3 rounded-xl bg-white/5 overflow-hidden">
                        <span className="flex items-center gap-1.5 flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span className="text-slate-400 whitespace-nowrap">~{idea.estimatedHours || 40} hours</span>
                        </span>
                        <div className="w-px h-4 bg-white/10 flex-shrink-0" />
                        <span className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                          <GraduationCap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                          <span className="text-slate-400 truncate">
                            {(idea.newSkillsToLearn || []).slice(0, 2).join(', ') || 'New skills await'}
                          </span>
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        {/* Start Button - Enhanced */}
                        <Button
                          onClick={() => startIdeaAsProject(idea)}
                          variant="ghost"
                          className="flex-1 h-10 flex items-center justify-center text-sm font-semibold border-2 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 transition-all duration-300 group/btn"
                        >
                          <Zap className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                          Start This Project
                        </Button>

                        {/* Ask Gemini For Roadmap Button */}
                        <Button
                          onClick={async () => {
                            const prompt =
                              `Create a detailed step-by-step roadmap for building the following project:\n\n` +
                              `**Project Title:** ${idea.title}\n\n` +
                              `**Description:** ${idea.description}\n\n` +
                              `**Tech Stack:** ${(idea.techStack || []).join(', ')}\n\n` +
                              `**Estimated Hours:** ${idea.estimatedHours || 40} hours\n\n` +
                              `Please provide:\n` +
                              `1. A clear breakdown of phases/milestones\n` +
                              `2. Specific tasks for each phase with estimated time\n` +
                              `3. Key technologies and libraries to use for each part\n` +
                              `4. Potential challenges and how to overcome them\n` +
                              `5. Learning resources for any new skills needed\n` +
                              `6. Best practices and tips for success`;

                            try {
                              await navigator.clipboard.writeText(prompt);
                              alert('Prompt copied to clipboard! Paste it in Gemini to get your roadmap.');
                              window.open('https://gemini.google.com/app', '_blank');
                            } catch (err) {
                              console.error('Failed to copy:', err);
                              window.open('https://gemini.google.com/app', '_blank');
                            }
                          }}
                          variant="ghost"
                          className="flex-1 h-10 flex items-center justify-center text-sm font-semibold border-2 border-blue-500/40 hover:bg-blue-500/20 hover:border-blue-500/60 text-blue-400 hover:text-blue-300 transition-all duration-300 group/btn2"
                        >
                          <GeminiIcon className="w-5 h-5 mr-2 group-hover/btn2:animate-pulse" />
                          Ask Gemini For Roadmap
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State - Enhanced */}
            {!generatingIdeas && projectIdeas.length === 0 && (
              <div className="text-center py-12">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-purple-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative p-4 rounded-full bg-white/5 border border-white/10">
                    <Lightbulb className="w-10 h-10 text-slate-500" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Ready to discover ideas?</p>
                <p className="text-slate-600 text-xs">Click "Generate" to get AI-powered project recommendations</p>
              </div>
            )}
          </div>
        </Modal>
      </motion.div>
    </PixelTransition>
  );
}
