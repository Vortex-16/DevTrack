import { motion, AnimatePresence } from 'framer-motion';
import { Github, Lock, Database, ArrowRight, X, Loader2, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGitHubScopes } from '../../hooks/useGitHubScopes';

export default function GitHubPermissionModal({ isOpen, onClose }) {
    const { requestRepoAccess } = useGitHubScopes();
    const [isLoading, setIsLoading] = useState(false);

    // Global Scroll Lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGrantAccess = async () => {
        setIsLoading(true);
        try {
            await requestRepoAccess();
            // onClose(); 
        } catch (error) {
            console.error("Error requesting repo access:", error);
            setIsLoading(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[20000] p-4 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-[420px] rounded-2xl border border-white/10 overflow-hidden relative"
                    style={{
                        background: 'linear-gradient(180deg, rgba(24, 24, 27, 0.95) 0%, rgba(14, 14, 17, 0.98) 100%)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)'
                    }}
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top Subtle Highlight */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                    {/* Header Region */}
                    <div className="relative px-6 pt-8 pb-5 flex flex-col items-center text-center">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                            disabled={isLoading}
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="w-14 h-14 mb-5 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center shadow-lg relative">
                            <Github className="w-6 h-6 text-white" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-[#151518] flex items-center justify-center">
                                <Key className="w-3 h-3 text-white" />
                            </div>
                        </div>

                        <h2 className="text-xl font-semibold text-white tracking-tight leading-tight mb-2">
                            Connect Private Repositories
                        </h2>
                        <p className="text-[13px] text-slate-400 leading-relaxed px-2">
                            DevTrack needs elevated access to interact with your private GitHub codebases.
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                    {/* Details section */}
                    <div className="px-6 py-5 bg-white/[0.02]">
                        <div className="space-y-5">
                            <div className="flex gap-4 items-start">
                                <div className="mt-0.5 p-2 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                                    <Database className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-slate-200 mb-0.5">Read & Write Access</h4>
                                    <p className="text-[13px] text-slate-500 leading-snug">
                                        Required to analyze repositories and commit generated documents (like READMEs). GitHub does not offer a read-only scope for private repositories.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="mt-0.5 p-2 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-slate-200 mb-0.5">Secure By Default</h4>
                                    <p className="text-[13px] text-slate-500 leading-snug">
                                        We never use these permissions without your explicit action. Your code remains private and secure.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 pt-4 bg-white/[0.02]">
                        <button
                            onClick={handleGrantAccess}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    Authorize Github
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
