import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import { createPortal } from "react-dom";
import Lenis from "lenis";
import { useLenis } from "lenis/react";
import {
  Trophy,
  Search,
  Filter,
  Star,
  MessageCircle,
  ExternalLink,
  Github,
  Plus,
  Loader2,
  X,
  Image as ImageIcon,
  Send,
  TrendingUp,
  Users,
  Sparkles,
  ChevronDown,
  Upload,
  Eye,
  Clock,
  Trash2,
} from "lucide-react";
import { projectsApi, showcaseApi } from "../services/api";
import Button from "../components/ui/Button";

// Modal Component (reused from Projects.jsx pattern)
function Modal({ isOpen, onClose, title, children, size = "lg" }) {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const globalLenis = useLenis();

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

  useEffect(() => {
    if (!isOpen || !modalRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: modalRef.current,
      content: contentRef.current,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const animationId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationId);
      lenis.destroy();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

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
          className={`w-full ${sizeClasses[size]} rounded-3xl border border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar`}
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

// Showcase Card Component
function ShowcaseCard({
  showcase,
  onStar,
  onComment,
  onDeleteComment,
  currentUserId,
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const { user } = useUser();

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await onComment(
        showcase.id,
        newComment,
        user?.fullName || user?.username,
        user?.imageUrl
      );
      setNewComment("");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div
        className="rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all duration-300"
        style={{
          background:
            "linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))",
        }}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {showcase.imageUrl ? (
            <img
              src={showcase.imageUrl}
              alt={showcase.projectName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center">
              <Trophy className="w-16 h-16 text-purple-400/50" />
            </div>
          )}
          {/* Overlay with links */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
              {showcase.liveUrl && (
                <a
                  href={showcase.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  <ExternalLink size={12} /> Live Demo
                </a>
              )}
              {showcase.githubUrl && (
                <a
                  href={showcase.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white text-xs font-medium hover:bg-white/20 transition-colors"
                >
                  <Github size={12} /> GitHub
                </a>
              )}
            </div>
          </div>
          {/* Template Badge */}
          {showcase.template && showcase.template !== "general" && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-purple-500/80 text-white text-[10px] font-bold uppercase tracking-wider">
              {showcase.template}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Owner */}
          <div className="flex items-center gap-2 mb-3">
            {showcase.ownerAvatar ? (
              <img
                src={showcase.ownerAvatar}
                alt={showcase.ownerName}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users size={12} className="text-purple-400" />
              </div>
            )}
            <span className="text-slate-400 text-xs">{showcase.ownerName}</span>
            {showcase.ownerGithub && (
              <a
                href={`https://github.com/${showcase.ownerGithub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-purple-400 transition-colors"
              >
                <Github size={12} />
              </a>
            )}
          </div>

          {/* Title & Summary */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
            {showcase.projectName}
          </h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
            {showcase.summary}
          </p>

          {/* Technologies */}
          {showcase.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {showcase.technologies.slice(0, 4).map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-medium border border-white/5"
                >
                  {tech}
                </span>
              ))}
              {showcase.technologies.length > 4 && (
                <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-500 text-[10px]">
                  +{showcase.technologies.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onStar(showcase.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  showcase.hasStarred
                    ? "text-yellow-400"
                    : "text-slate-400 hover:text-yellow-400"
                }`}
              >
                <Star
                  size={16}
                  className={showcase.hasStarred ? "fill-yellow-400" : ""}
                />
                <span>{showcase.starCount}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-400 transition-colors"
              >
                <MessageCircle size={16} />
                <span>{showcase.commentCount}</span>
              </button>
            </div>
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Clock size={10} />
              {(() => {
                try {
                  if (showcase.createdAt?.seconds) {
                    return new Date(
                      showcase.createdAt.seconds * 1000
                    ).toLocaleDateString();
                  } else if (showcase.createdAt?._seconds) {
                    return new Date(
                      showcase.createdAt._seconds * 1000
                    ).toLocaleDateString();
                  } else if (showcase.createdAt) {
                    const date = new Date(showcase.createdAt);
                    return isNaN(date.getTime())
                      ? "Recently"
                      : date.toLocaleDateString();
                  }
                  return "Recently";
                } catch {
                  return "Recently";
                }
              })()}
            </span>
          </div>

          {/* Comments Section */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                  {/* Existing Comments */}
                  {showcase.comments?.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                      {showcase.comments.map((comment, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 p-2 rounded-lg bg-white/5 group"
                        >
                          {comment.authorAvatar ? (
                            <img
                              src={comment.authorAvatar}
                              alt={comment.authorName}
                              className="w-6 h-6 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <Users size={10} className="text-purple-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-400 font-medium">
                              {comment.authorName}
                            </p>
                            <p className="text-sm text-slate-300">
                              {comment.content}
                            </p>
                          </div>
                          {/* Delete button - only show for comment author or showcase owner */}
                          {(comment.userId === currentUserId ||
                            showcase.isOwner) && (
                            <button
                              onClick={async () => {
                                setDeletingCommentId(comment.id);
                                await onDeleteComment(showcase.id, comment.id);
                                setDeletingCommentId(null);
                              }}
                              disabled={deletingCommentId === comment.id}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                              title="Delete comment"
                            >
                              {deletingCommentId === comment.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-2">
                      No comments yet
                    </p>
                  )}

                  {/* Add Comment (only if not owner) */}
                  {!showcase.isOwner && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSubmitComment()
                        }
                      />
                      <button
                        onClick={handleSubmitComment}
                        disabled={submittingComment || !newComment.trim()}
                        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                      >
                        {submittingComment ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Submit Showcase Modal
function SubmitShowcaseModal({ isOpen, onClose, projects, onSubmit }) {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({
    liveUrl: "",
    summary: "",
    template: "general",
    imageBase64: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const templates = [
    { id: "general", name: "General", icon: "📦" },
    { id: "web-app", name: "Web App", icon: "🌐" },
    { id: "mobile", name: "Mobile", icon: "📱" },
    { id: "ai-ml", name: "AI/ML", icon: "🤖" },
    { id: "game", name: "Game", icon: "🎮" },
    { id: "api", name: "API/Backend", icon: "⚡" },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, imageBase64: reader.result });
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      setError("Please select a project");
      return;
    }
    if (!formData.summary.trim()) {
      setError("Please add a summary");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await onSubmit({
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        summary: formData.summary,
        liveUrl: formData.liveUrl || null,
        githubUrl: selectedProject.repositoryUrl || null,
        technologies: selectedProject.technologies || [],
        template: formData.template,
        imageBase64: formData.imageBase64,
        ownerName: user?.fullName || user?.username || "Anonymous",
        ownerAvatar: user?.imageUrl || null,
        ownerEmail: user?.primaryEmailAddress?.emailAddress || null,
        ownerGithub:
          user?.externalAccounts?.find((a) => a.provider === "github")
            ?.username || null,
      });
      onClose();
      // Reset state
      setStep(1);
      setSelectedProject(null);
      setFormData({
        liveUrl: "",
        summary: "",
        template: "general",
        imageBase64: null,
      });
      setImagePreview(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit showcase");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedProject(null);
    setFormData({
      liveUrl: "",
      summary: "",
      template: "general",
      imageBase64: null,
    });
    setImagePreview(null);
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Showcase Your Project"
      size="lg"
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <p className="text-slate-400 text-sm mb-4">
              Select one of your{" "}
              <strong className="text-emerald-400">
                public GitHub repositories
              </strong>{" "}
              to showcase:
            </p>

            <div className="grid gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
              {projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Github className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No public repositories available.</p>
                  <p className="text-sm mt-2">
                    Add a public GitHub repository to your Projects first.
                  </p>
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedProject?.id === project.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 hover:border-white/20 bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">
                        {project.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                        <Github size={10} /> Public
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-1">
                      {project.description}
                    </p>
                    {project.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.slice(0, 3).map((tech, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400 text-[10px]"
                          >
                            {typeof tech === "string" ? tech : tech?.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedProject}
                className="px-6"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-purple-300 text-sm">
                <strong>Selected:</strong> {selectedProject?.name}
              </p>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Project Summary *
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[100px] focus:border-purple-500 focus:outline-none transition-colors resize-none"
                placeholder="A brief, compelling description of what your project does..."
                maxLength={500}
              />
              <p className="text-slate-500 text-xs mt-1 text-right">
                {formData.summary.length}/500
              </p>
            </div>

            {/* Live URL */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Live Demo URL (optional)
              </label>
              <input
                type="url"
                value={formData.liveUrl}
                onChange={(e) =>
                  setFormData({ ...formData, liveUrl: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="https://your-project.com"
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Project Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() =>
                      setFormData({ ...formData, template: template.id })
                    }
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.template === template.id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl">{template.icon}</span>
                    <p className="text-white text-xs mt-1">{template.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Showcase Image (optional)
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => {
                        setFormData({ ...formData, imageBase64: null });
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-slate-400 text-sm">
                      Click to upload image
                    </span>
                    <span className="text-slate-500 text-xs">Max 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Showcase Project
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

// Main Showcase Page
export default function Showcase() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("discover");
  const [showcases, setShowcases] = useState([]);
  const [myShowcases, setMyShowcases] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        showcaseApi.getAll(true, "", ""), // Exclude own for discovery
        showcaseApi.getMine(),
        projectsApi.getAll(),
        showcaseApi.getTrending(),
      ]);

      // Extract data from settled promises, defaulting to empty arrays on failure
      const [showcasesResult, mineResult, projectsResult, trendingResult] =
        results;

      if (showcasesResult.status === "fulfilled") {
        setShowcases(showcasesResult.value.data?.data || []);
      } else {
        console.error("Failed to fetch showcases:", showcasesResult.reason);
        setShowcases([]);
      }

      if (mineResult.status === "fulfilled") {
        setMyShowcases(mineResult.value.data?.data || []);
      } else {
        console.error("Failed to fetch my showcases:", mineResult.reason);
        setMyShowcases([]);
      }

      if (projectsResult.status === "fulfilled") {
        // Projects API returns { data: { projects, pagination } }
        const projects =
          projectsResult.value.data?.data?.projects ||
          projectsResult.value.data?.data ||
          [];
        setMyProjects(projects);
      } else {
        console.error("Failed to fetch projects:", projectsResult.reason);
        setMyProjects([]);
      }

      if (trendingResult.status === "fulfilled") {
        setTrending(trendingResult.value.data?.data || []);
      } else {
        console.error("Failed to fetch trending:", trendingResult.reason);
        setTrending([]);
      }
    } catch (error) {
      console.error("Failed to fetch showcase data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter showcases
  const filteredShowcases = showcases.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTech =
      !techFilter ||
      s.technologies?.some((t) =>
        t.toLowerCase().includes(techFilter.toLowerCase())
      );

    return matchesSearch && matchesTech;
  });

  // Get public repo projects that are not yet showcased
  // Only projects with a repositoryUrl and that are public (not private) can be showcased
  const publicProjects = myProjects.filter((p) => {
    // Must have a GitHub repository URL
    if (!p.repositoryUrl) return false;
    // Must be public (githubData.isPrivate === false means public)
    // Note: The field is named isPrivate, not private
    if (p.githubData?.isPrivate === true) return false;
    return true;
  });

  // Get non-showcased public projects
  const availableProjects = publicProjects.filter(
    (p) => !myShowcases.some((s) => s.projectId === p.id)
  );

  // Count of private projects (for messaging)
  const privateProjectCount = myProjects.filter(
    (p) => p.githubData?.isPrivate === true
  ).length;
  const noRepoProjectCount = myProjects.filter((p) => !p.repositoryUrl).length;

  // Handle star
  const handleStar = async (showcaseId) => {
    try {
      const response = await showcaseApi.toggleStar(showcaseId);
      // Update local state
      setShowcases((prev) =>
        prev.map((s) =>
          s.id === showcaseId
            ? {
                ...s,
                hasStarred: response.data.starred,
                starCount: response.data.starCount,
              }
            : s
        )
      );
      setTrending((prev) =>
        prev.map((s) =>
          s.id === showcaseId
            ? {
                ...s,
                hasStarred: response.data.starred,
                starCount: response.data.starCount,
              }
            : s
        )
      );
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  // Handle comment
  const handleComment = async (
    showcaseId,
    content,
    authorName,
    authorAvatar
  ) => {
    try {
      const response = await showcaseApi.addComment(
        showcaseId,
        content,
        authorName,
        authorAvatar
      );
      // Update local state
      const newComment = response.data.data;
      setShowcases((prev) =>
        prev.map((s) =>
          s.id === showcaseId
            ? {
                ...s,
                comments: [...(s.comments || []), newComment],
                commentCount: (s.commentCount || 0) + 1,
              }
            : s
        )
      );
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (showcaseId, commentId) => {
    try {
      await showcaseApi.deleteComment(showcaseId, commentId);
      // Update local state - remove comment from all lists
      const updateShowcaseComments = (showcaseList) =>
        showcaseList.map((s) =>
          s.id === showcaseId
            ? {
                ...s,
                comments: (s.comments || []).filter((c) => c.id !== commentId),
                commentCount: Math.max(0, (s.commentCount || 0) - 1),
              }
            : s
        );
      setShowcases(updateShowcaseComments);
      setMyShowcases(updateShowcaseComments);
      setTrending(updateShowcaseComments);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  // Handle submit showcase
  const handleSubmitShowcase = async (data) => {
    const response = await showcaseApi.create(data);
    // Refresh data
    await fetchData();
    return response;
  };

  // Handle delete showcase
  const handleDeleteShowcase = async (id) => {
    try {
      await showcaseApi.delete(id);
      setMyShowcases((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete showcase:", error);
    }
  };

  return (
    <div
      id="showcase-scroll-container"
      className="min-h-screen bg-slate-950 overflow-y-auto"
    >
      <div className="px-4 md:px-6 py-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 md:mb-8 mt-2 md:mt-0"
        >
          <div className="flex items-center gap-3 mb-2">

            <div>
              <h1 className="text-3xl font-bold text-white">
                Project Showcase
              </h1>
              <p className="text-slate-400 text-sm">
                Discover amazing projects from the community
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              activeTab === "discover"
                ? "bg-purple-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Discover Projects
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
              activeTab === "mine"
                ? "bg-purple-500 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            My Showcases
          </button>
        </div>

        {/* Search & Filter (for Discover tab) */}
        {activeTab === "discover" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                placeholder="Filter by tech..."
                className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {activeTab === "discover" && (
              <div className="space-y-8">
                {/* Trending Section */}
                {trending.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                      <h2 className="text-lg font-bold text-white">
                        Trending This Week
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {trending.slice(0, 3).map((showcase, idx) => (
                        <ShowcaseCard
                          key={showcase.id}
                          showcase={showcase}
                          onStar={handleStar}
                          onComment={handleComment}
                          onDeleteComment={handleDeleteComment}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Projects */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">
                      Community Projects ({filteredShowcases.length})
                    </h2>
                  </div>
                  {filteredShowcases.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-40" />
                      <p className="text-lg">No projects found</p>
                      <p className="text-sm">
                        Be the first to showcase your project!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredShowcases.map((showcase) => (
                        <ShowcaseCard
                          key={showcase.id}
                          showcase={showcase}
                          onStar={handleStar}
                          onComment={handleComment}
                          onDeleteComment={handleDeleteComment}
                          currentUserId={user?.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Showcases Tab */}
            {activeTab === "mine" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-slate-400">
                    {myShowcases.length} project
                    {myShowcases.length !== 1 ? "s" : ""} showcased
                  </p>
                  <Button
                    onClick={() => setShowSubmitModal(true)}
                    disabled={availableProjects.length === 0}
                    title={
                      availableProjects.length === 0
                        ? "No public projects available to showcase"
                        : ""
                    }
                    size="sm"
                    className="flex items-center whitespace-nowrap !px-3 !py-1.5 !text-xs sm:!text-sm h-9 sm:h-auto"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Showcase
                  </Button>
                </div>

                {/* Info banner for why button might be disabled */}
                {availableProjects.length === 0 && myProjects.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-amber-300 text-sm flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      <span>
                        Only <strong>public GitHub repositories</strong> from
                        your Projects can be showcased.
                        {privateProjectCount > 0 &&
                          ` (${privateProjectCount} private repo${
                            privateProjectCount > 1 ? "s" : ""
                          } hidden)`}
                        {noRepoProjectCount > 0 &&
                          ` (${noRepoProjectCount} project${
                            noRepoProjectCount > 1 ? "s" : ""
                          } without GitHub repos)`}
                      </span>
                    </p>
                  </div>
                )}

                {myShowcases.length === 0 ? (
                  <div className="text-center py-16">
                    <Trophy className="w-20 h-20 mx-auto mb-4 text-slate-700" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      No projects showcased yet
                    </h3>
                    <p className="text-slate-400 mb-6">
                      Share your work with the community and get feedback!
                    </p>
                    {availableProjects.length > 0 ? (
                      <Button onClick={() => setShowSubmitModal(true)} className="inline-flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Showcase Your First Project
                      </Button>
                    ) : myProjects.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-slate-500 text-sm">
                          You have {myProjects.length} project
                          {myProjects.length > 1 ? "s" : ""}, but none are
                          eligible for showcase.
                        </p>
                        <p className="text-slate-500 text-sm">
                          Only{" "}
                          <strong className="text-purple-400">
                            public GitHub repositories
                          </strong>{" "}
                          can be showcased.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-slate-500 text-sm">
                          You don't have any projects yet.
                        </p>
                        <p className="text-slate-500 text-sm">
                          Go to{" "}
                          <Link
                            to="/projects"
                            className="text-purple-400 hover:text-purple-300 underline font-semibold"
                          >
                            Projects
                          </Link>{" "}
                          to add a public GitHub repository first.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {myShowcases.map((showcase) => (
                      <div key={showcase.id} className="relative">
                        <ShowcaseCard
                          showcase={{
                            ...showcase,
                            isOwner: true,
                            hasStarred: false,
                          }}
                          onStar={() => {}}
                          onComment={handleComment}
                          onDeleteComment={handleDeleteComment}
                          currentUserId={user?.id}
                        />
                        <button
                          onClick={() => handleDeleteShowcase(showcase.id)}
                          className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                          title="Remove from Showcase"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Submit Modal */}
      <SubmitShowcaseModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        projects={availableProjects}
        onSubmit={handleSubmitShowcase}
      />
    </div>
  );
}
