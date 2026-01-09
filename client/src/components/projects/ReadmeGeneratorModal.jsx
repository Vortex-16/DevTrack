import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, FileText, Copy, Download, GitCommitHorizontal, 
    Loader2, Check, Eye, Code, RefreshCcw, Github
} from 'lucide-react';
import { readmeApi } from '../../services/api';
import { ReactLenis, useLenis } from 'lenis/react';

/**
 * Modal to generate and commit README files for projects
 */
export default function ReadmeGeneratorModal({ isOpen, onClose, project }) {
    const [readme, setReadme] = useState('');
    const [loading, setLoading] = useState(false);
    const [committing, setCommitting] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [committed, setCommitted] = useState(false);
    const [commitUrl, setCommitUrl] = useState('');
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'raw'
    const [commitMessage, setCommitMessage] = useState('docs: update README.md');
    const [showCommitDialog, setShowCommitDialog] = useState(false);

    const globalLenis = useLenis();

    useEffect(() => {
        if (isOpen && project) {
            generateReadme();
        }
    }, [isOpen, project?.id]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setReadme('');
            setError(null);
            setCopied(false);
            setCommitted(false);
            setCommitUrl('');
            setActiveTab('preview');
            setShowCommitDialog(false);
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



    const generateReadme = async () => {
        if (!project?.id) return;
        
        setLoading(true);
        setError(null);
        setCommitted(false);
        
        try {
            const response = await readmeApi.generate(project.id);
            const data = response.data?.data;
            if (data?.readme) {
                setReadme(data.readme);
            } else {
                throw new Error('No README content received');
            }
        } catch (err) {
            console.error('Error generating README:', err);
            setError(err.response?.data?.error || 'Failed to generate README. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(readme);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([readme], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCommit = async () => {
        if (!project?.id || !readme) return;
        
        setCommitting(true);
        setError(null);
        
        try {
            const response = await readmeApi.commit(project.id, readme, commitMessage);
            const data = response.data?.data;
            setCommitted(true);
            setCommitUrl(data?.commit?.url || '');
            setShowCommitDialog(false);
        } catch (err) {
            console.error('Error committing README:', err);
            setError(err.response?.data?.error || 'Failed to commit README to GitHub.');
        } finally {
            setCommitting(false);
        }
    };

    // Simple markdown to HTML renderer for preview
    const renderMarkdown = (md) => {
        if (!md) return '';
        
        let html = md
            // Escape HTML
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Headers
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-6 mb-3">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-black/40 rounded-lg p-4 my-3 overflow-x-auto text-sm"><code class="text-green-400">$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-purple-300 text-sm">$1</code>')
            // Lists
            .replace(/^\- (.*$)/gm, '<li class="ml-4 text-slate-300">• $1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-slate-300">$1</li>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-purple-400 hover:text-purple-300 underline">$1</a>')
            // Blockquotes
            .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-purple-500 pl-4 my-2 text-slate-400 italic">$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gm, '<hr class="border-white/10 my-6" />')
            // Paragraphs (preserve line breaks)
            .replace(/\n\n/g, '</p><p class="text-slate-300 mb-3">')
            .replace(/\n/g, '<br />');
        
        return `<p class="text-slate-300 mb-3">${html}</p>`;
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
                            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                                <FileText className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">README Generator</h2>
                                <p className="text-sm text-slate-400">
                                    {project?.name || 'Generate README for your project'}
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

                    {/* Tabs & Actions */}
                    {readme && !loading && (
                        <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                        activeTab === 'preview' 
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                            : 'text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                                <button
                                    onClick={() => setActiveTab('raw')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                        activeTab === 'raw' 
                                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                            : 'text-slate-400 hover:bg-white/5'
                                    }`}
                                >
                                    <Code className="w-4 h-4" />
                                    Raw
                                </button>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={generateReadme}
                                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    title="Regenerate"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => setShowCommitDialog(true)}
                                    disabled={committed}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                                        committed
                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white'
                                    }`}
                                >
                                    {committed ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Committed!
                                        </>
                                    ) : (
                                        <>
                                            <Github className="w-4 h-4" />
                                            Commit to GitHub
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content - Scrollable with Lenis */}
                    <ReactLenis 
                        root={false}
                        options={{
                            duration: 1.2,
                            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                            gestureOrientation: 'vertical',
                            smoothWheel: true,
                            wheelMultiplier: 1,
                            touchMultiplier: 2,
                        }}
                        className="flex-1 overflow-y-auto custom-scrollbar"
                    >
                        <div className="p-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-spin" style={{ animationDuration: '3s' }}>
                                            <div className="absolute inset-1 bg-slate-900 rounded-full" />
                                        </div>
                                        <FileText className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <p className="text-slate-400 mt-6">Analyzing your project...</p>
                                    <p className="text-slate-500 text-sm mt-2">Generating comprehensive README</p>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <p className="text-red-400 mb-4">{error}</p>
                                    <button
                                        onClick={generateReadme}
                                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : readme ? (
                                <div>
                                    {activeTab === 'preview' ? (
                                        <div 
                                            className="prose prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: renderMarkdown(readme) }}
                                        />
                                    ) : (
                                        <textarea
                                            value={readme}
                                            onChange={(e) => setReadme(e.target.value)}
                                            className="w-full h-[500px] bg-black/30 border border-white/10 rounded-lg p-4 text-slate-300 text-sm font-mono focus:outline-none focus:border-purple-500/50 resize-none"
                                            spellCheck={false}
                                        />
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </ReactLenis>

                    {/* Commit URL after success */}
                    {committed && commitUrl && (
                        <div className="px-6 py-3 border-t border-white/10 bg-green-500/5 flex-shrink-0">
                            <div className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-green-300">README committed successfully!</span>
                                <a 
                                    href={commitUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300 underline ml-2"
                                >
                                    View commit →
                                </a>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Commit Dialog */}
                <AnimatePresence>
                    {showCommitDialog && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center z-10"
                            onClick={() => setShowCommitDialog(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-800 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl"
                            >
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <GitCommitHorizontal className="w-5 h-5 text-purple-400" />
                                    Commit to GitHub
                                </h3>
                                
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Commit Message
                                    </label>
                                    <input
                                        type="text"
                                        value={commitMessage}
                                        onChange={(e) => setCommitMessage(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                        placeholder="docs: update README.md"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCommitDialog(false)}
                                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCommit}
                                        disabled={committing || !commitMessage}
                                        className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {committing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Committing...
                                            </>
                                        ) : (
                                            <>
                                                <Github className="w-4 h-4" />
                                                Commit
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
