import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Loader2, Trash2, Zap, Sparkles, Clock, GraduationCap } from 'lucide-react';
import { savedIdeasApi } from '../../services/api';
import Button from '../ui/Button';
import Lenis from 'lenis';
import { useLenis } from 'lenis/react';

/**
 * Modal to display user's saved AI project ideas
 */
export default function SavedIdeasModal({ isOpen, onClose, onStartProject }) {
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const scrollWrapperRef = useRef(null);
    const scrollContentRef = useRef(null);
    const globalLenis = useLenis();

    useEffect(() => {
        if (isOpen) {
            fetchSavedIdeas();
        }
    }, [isOpen]);

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

    const fetchSavedIdeas = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await savedIdeasApi.getAll();
            setIdeas(response.data?.data || []);
        } catch (err) {
            console.error('Error fetching saved ideas:', err);
            setError('Failed to load saved ideas.');
        } finally {
            setLoading(false);
        }
    };

    const removeIdea = async (e, ideaId) => {
        e.preventDefault();
        e.stopPropagation();

        // Optimistic update
        setIdeas(prev => prev.filter(i => i.id !== ideaId));

        try {
            await savedIdeasApi.remove(ideaId);
        } catch (error) {
            console.error('Error removing saved idea:', error);
            // Reload on error to restore state
            fetchSavedIdeas();
        }
    };

    const handleStartProject = (idea) => {
        if (onStartProject) {
            onStartProject(idea);
        }
        onClose();
    };

    const handleAskGemini = async (idea) => {
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
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-0 z-[12000] flex items-center justify-center p-4"
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
                    className="relative w-[95%] md:w-[85%] max-w-4xl max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                                <Lightbulb className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Saved Project Ideas</h2>
                                <p className="text-sm text-slate-400">
                                    Your bookmarked AI-suggested projects
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

                    {/* Content - Scrollable with Lenis */}
                    <div
                        ref={scrollWrapperRef}
                        className="flex-1 overflow-y-auto custom-scrollbar"
                    >
                        <div ref={scrollContentRef} className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                                    <p className="text-slate-400">Loading saved ideas...</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-red-400 mb-4">{error}</p>
                                    <button
                                        onClick={fetchSavedIdeas}
                                        className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : ideas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Lightbulb className="w-12 h-12 text-slate-700 mb-4" />
                                    <p className="text-slate-400 text-lg mb-2">No saved ideas yet</p>
                                    <p className="text-slate-500 text-sm max-w-xs text-center">
                                        Use the "Get Ideas" feature to generate AI project suggestions and save the ones you like.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {ideas.map((idea, index) => (
                                        <motion.div
                                            key={idea.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group p-5 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 relative"
                                        >
                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => removeIdea(e, idea.id)}
                                                className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/20 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors z-10"
                                                title="Remove from saved"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-3 mb-3 pr-8">
                                                <h4 className="font-bold text-white text-base leading-tight group-hover:text-emerald-300 transition-colors">
                                                    {idea.title}
                                                </h4>
                                                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
                                                    {idea.category || 'Project'}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-3">
                                                {idea.description}
                                            </p>

                                            {/* Tech Stack */}
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

                                            {/* Meta Info */}
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
                                                <Button
                                                    onClick={() => handleStartProject(idea)}
                                                    variant="ghost"
                                                    className="flex-1 h-10 flex items-center justify-center text-sm font-semibold border-2 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 transition-all duration-300"
                                                >
                                                    <Zap className="w-4 h-4 mr-2" />
                                                    Start This Project
                                                </Button>

                                                <Button
                                                    onClick={() => handleAskGemini(idea)}
                                                    variant="ghost"
                                                    className="flex-1 h-10 flex items-center justify-center text-sm font-semibold border-2 border-blue-500/40 hover:bg-blue-500/20 hover:border-blue-500/60 text-blue-400 hover:text-blue-300 transition-all duration-300"
                                                >
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Ask Gemini For Roadmap
                                                </Button>
                                            </div>
                                        </motion.div>
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
