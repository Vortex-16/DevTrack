import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, GitFork, ExternalLink, Sparkles, Search, Loader2 } from 'lucide-react';
import { githubApi } from '../../services/api';
import Lenis from 'lenis';
import { useLenis } from 'lenis/react';

/**
 * Modal to display similar open-source projects based on user's tech stack
 */
export default function SimilarProjectsModal({ isOpen, onClose, userLanguages = [] }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchedLanguages, setSearchedLanguages] = useState([]);

    const scrollWrapperRef = useRef(null);
    const scrollContentRef = useRef(null);
    const globalLenis = useLenis();

    useEffect(() => {
        if (isOpen) {
            fetchSimilarProjects();
        }
    }, [isOpen]);

    // Global scroll lock when modal is open
    useEffect(() => {
        if (isOpen) {
            globalLenis?.stop();
            document.body.style.overflow = 'hidden';
        } else {
            globalLenis?.start();
            document.body.style.overflow = 'unset';
        }
        return () => {
            globalLenis?.start();
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, globalLenis]);

    // Local Lenis smooth scroll for modal content
    useEffect(() => {
        if (!isOpen || !scrollWrapperRef.current || !scrollContentRef.current) return;

        const lenis = new Lenis({
            wrapper: scrollWrapperRef.current,
            content: scrollContentRef.current,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        const resizeObserver = new ResizeObserver(() => {
            lenis.resize();
        });

        resizeObserver.observe(scrollContentRef.current);

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
    }, [isOpen, loading]);

    const fetchSimilarProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await githubApi.getSimilarProjects(
                userLanguages.length > 0 ? userLanguages : null,
                null, // topics
                100,  // minStars
                12    // limit
            );
            setProjects(response.data?.data?.repos || []);
            setSearchedLanguages(userLanguages.length > 0 ? userLanguages : ['JavaScript', 'TypeScript', 'Python']);
        } catch (err) {
            console.error('Error fetching similar projects:', err);
            setError('Failed to fetch similar projects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatStars = (count) => {
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ 
                        type: 'spring', 
                        damping: 30, 
                        stiffness: 400,
                        mass: 0.8
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                <Search className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Discover Similar Projects</h2>
                                <p className="text-sm text-slate-400">
                                    Open-source projects matching your tech stack
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Languages Tag */}
                    {searchedLanguages.length > 0 && (
                        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2 flex-wrap flex-shrink-0">
                            <Search className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-500">Searching:</span>
                            {searchedLanguages.map((lang, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                >
                                    {lang}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Content - Scrollable with Lenis */}
                    <div 
                        ref={scrollWrapperRef}
                        className="flex-1 overflow-y-auto custom-scrollbar"
                    >
                        <div ref={scrollContentRef} className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
                                    <p className="text-slate-400">Searching GitHub for similar projects...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-red-400 mb-4">{error}</p>
                                    <button
                                        onClick={fetchSimilarProjects}
                                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-slate-400">No similar projects found.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {projects.map((project, index) => (
                                        <motion.a
                                            key={project.id}
                                            href={project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300"
                                        >
                                            {/* Owner */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <img
                                                    src={project.owner.avatarUrl}
                                                    alt={project.owner.login}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                                <span className="text-xs text-slate-400 truncate">
                                                    {project.owner.login}
                                                </span>
                                            </div>

                                            {/* Name */}
                                            <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors mb-2 truncate">
                                                {project.name}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-3 min-h-[2.5rem]">
                                                {project.description || 'No description available'}
                                            </p>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                                                    {formatStars(project.stars)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <GitFork className="w-3.5 h-3.5" />
                                                    {formatStars(project.forks)}
                                                </span>
                                                {project.language && (
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300">
                                                        {project.language}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Updated */}
                                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                                                <span className="text-slate-500">
                                                    Updated {formatDate(project.updatedAt)}
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
