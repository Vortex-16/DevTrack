import LoadingText from '../components/ui/LoadingText'
import ProfessionalLoader from '../components/ui/ProfessionalLoader'
import { useCache } from '../context/CacheContext'
import Button from '../components/ui/Button'
import { geminiApi, projectsApi, logsApi } from '../services/api'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'

// Custom styled markdown renderer
const MarkdownMessage = ({ content }) => {
    return (
        <ReactMarkdown
            components={{
                strong: ({ children }) => (
                    <strong className="text-purple-400 font-semibold">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="text-slate-300 italic">{children}</em>
                ),
                h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-white mt-3 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-white mt-2 mb-1">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-md font-semibold text-purple-300 mt-2 mb-1">{children}</h3>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2 ml-2">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2 ml-2">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="text-slate-200">{children}</li>
                ),
                code: ({ inline, children }) => (
                    inline
                        ? <code className="bg-white/10 text-emerald-400 px-1.5 py-0.5 rounded text-sm">{children}</code>
                        : <pre className="bg-white/5 text-emerald-400 p-3 rounded-xl my-2 overflow-x-auto text-sm border border-white/10"><code>{children}</code></pre>
                ),
                p: ({ children }) => {
                    const text = String(children)
                    if (text.includes('❌') || text.includes('🚨') || text.includes('⚠️')) {
                        return <p className="text-red-400 my-1">{children}</p>
                    }
                    if (text.includes('✅') || text.includes('✓') || text.includes('🎉')) {
                        return <p className="text-emerald-400 my-1">{children}</p>
                    }
                    return <p className="text-slate-200 my-1">{children}</p>
                },
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-purple-500 pl-3 my-2 text-slate-300 italic bg-purple-500/5 py-2 rounded-r-lg">
                        {children}
                    </blockquote>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    )
}

// Message Bubble Component
function MessageBubble({ message, idx }) {
    const isUser = message.role === 'user'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm
                    ${isUser
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20'
                        : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/20'}`}
                >
                    {isUser ? '👤' : '🤖'}
                </div>

                {/* Message Content */}
                <div
                    className={`rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-gradient-to-br from-purple-500/90 to-purple-600/90 text-white'
                        : 'bg-white/5 border border-white/10'}`}
                    style={!isUser ? {
                        background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))'
                    } : {}}
                >
                    <div className="prose prose-invert prose-sm max-w-none">
                        <MarkdownMessage content={message.content} />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Quick Prompt Button
function QuickPromptButton({ label, onClick, disabled }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${disabled
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                    : 'bg-white/5 text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 border border-white/10 hover:border-purple-500/30'}`}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
        >
            {label}
        </motion.button>
    )
}

// Typing Indicator
function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
        >
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                    🤖
                </div>
                <div
                    className="rounded-2xl px-5 py-4 border border-white/10"
                    style={{ background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))' }}
                >
                    <div className="flex items-center gap-1">
                        <motion.div
                            className="w-2 h-2 rounded-full bg-purple-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                            className="w-2 h-2 rounded-full bg-purple-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                            className="w-2 h-2 rounded-full bg-purple-500"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Rate limit constants
const RATE_LIMIT_MS = 10000

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [error, setError] = useState(null)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const { getCachedData, setCachedData, hasCachedData } = useCache()
    const [loading, setLoading] = useState(!hasCachedData('chat-history'))
    const [projects, setProjects] = useState([])
    const [learningStats, setLearningStats] = useState({})
    const [cooldown, setCooldown] = useState(0)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const messagesEndRef = useRef(null)
    const lastRequestTime = useRef(0)

    useEffect(() => {
        fetchContext()
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            if (!hasCachedData('chat-history')) setLoading(true)
            const response = await geminiApi.getHistory()
            if (response.data?.data) {
                const logs = response.data.data.history || []

                // Only animate if not cached
                if (!hasCachedData('chat-history')) {
                    // Small delay for initial load animation
                    await new Promise(r => setTimeout(r, 500))
                }

                setMessages(prev => {
                    if (prev.length > 2) return prev // Don't overwrite if we have active chat

                    const historyMessages = logs.map(log => ({
                        id: log.id,
                        role: log.role || (log.isUser ? 'user' : 'model'),
                        content: log.content || log.message,
                        timestamp: log.createdAt || log.timestamp
                    }))

                    return historyMessages.length > 0 ? historyMessages : [{
                        role: 'assistant',
                        content: `👋 **Hi! I'm your Gemini 2.0 flash coding assistant.**\nI'm here to help you build better software faster.\n\nI can help you with:\n- **Code implementation**\n- **Debugging**\n- **Architecture**\n- **Best practices**\n\n> 💡 **Tip**: I specialize strictly in coding. Just share your code or ask any programming question!`
                    }]
                })
                setHistoryLoaded(true)
                setCachedData('chat-history', true)
            }
        } catch (err) {
            console.error('Error fetching chat history:', err)
            setError('Failed to load chat history.')
            setMessages([{
                role: 'assistant',
                content: `👋 **Hi! I'm your Gemini 2.0 flash coding assistant.**\nI'm here to help you build better software faster.\n\nI can help you with:\n- **Code implementation**\n- **Debugging**\n- **Architecture**\n- **Best practices**\n\n> 💡 **Tip**: I specialize strictly in coding. Just share your code or ask any programming question!`
            }])
        } finally {
            setLoading(false)
        }
    }

    const groupHistoryByDate = () => {
        const groups = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);

        messages.filter(m => m.role === 'user').forEach(msg => {
            const msgDate = new Date(msg.timestamp?._seconds * 1000 || msg.timestamp || now);
            const d = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

            if (d.getTime() === today.getTime()) {
                groups['Today'].push(msg);
            } else if (d.getTime() === yesterday.getTime()) {
                groups['Yesterday'].push(msg);
            } else if (d.getTime() >= lastWeek.getTime()) {
                groups['Previous 7 Days'].push(msg);
            } else {
                groups['Older'].push(msg);
            }
        });

        return groups;
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchContext = async () => {
        try {
            const [projectsRes, statsRes] = await Promise.all([
                projectsApi.getAll({ limit: 10 }).catch(() => ({ data: { data: { projects: [] } } })),
                logsApi.getStats().catch(() => ({ data: { data: {} } }))
            ])
            setProjects(projectsRes.data.data.projects || [])
            setLearningStats(statsRes.data.data || {})
        } catch (err) {
            console.error('Error fetching context:', err)
        }
    }

    const buildContext = () => {
        let context = 'User Context:\n'
        if (projects.length > 0) {
            context += '\nProjects:\n'
            projects.forEach(p => {
                context += `\n## ${p.name}\n- Status: ${p.status}\n- Progress: ${p.progress || 0}%\n- Commits: ${p.commits || 0}\n`
                if (p.technologies?.length) context += `- Technologies: ${p.technologies.join(', ')}\n`
                if (p.aiAnalysis) {
                    context += `- AI Summary: ${p.aiAnalysis.progressSummary || p.aiAnalysis.reasoning || 'N/A'}\n`
                }
            })
        }
        context += `\nLearning Stats:\n- Total entries: ${learningStats.totalLogs || 0}\n- Streak: ${learningStats.currentStreak || 0} days\n`
        return context
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading || cooldown > 0) return

        const now = Date.now()
        const timeSinceLastRequest = now - lastRequestTime.current
        if (timeSinceLastRequest < RATE_LIMIT_MS) {
            setCooldown(Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000))
            return
        }

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])

        setLoading(true)
        lastRequestTime.current = now

        try {
            const response = await geminiApi.chat(userMessage, buildContext())
            const aiMessage = response.data.data.message
            setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }])
            setCooldown(10)
        } catch (err) {
            console.error('Chat error:', err)
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.' }])
        } finally {
            setLoading(false)
        }
    }

    const quickPrompts = [
        { label: '🎯 Which project first?', prompt: 'Based on my projects, which one should I focus on first and why?' },
        { label: '📚 What to learn?', prompt: 'What should I learn next to improve my skills?' },
        { label: '💪 Motivate me', prompt: 'Give me a motivational message based on my progress.' },
        { label: '📊 Analyze progress', prompt: 'Analyze my overall progress. What can I improve?' },
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-[calc(100vh-6rem)] flex gap-4 lg:gap-6 overflow-hidden relative"
        >
            {/* Loader Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/80 backdrop-blur-sm rounded-3xl border border-white/5"
                    >
                        <ProfessionalLoader size="lg" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar (History) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        className="fixed lg:relative z-40 lg:z-auto flex flex-col w-72 h-[calc(100vh-25px)] lg:h-full rounded-[2rem] border border-white/10 p-4"
                        style={{
                            background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
                            backdropFilter: 'blur(20px)'
                        }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <Button
                                variant="outline"
                                className="flex-1 justify-start gap-2 border-white/5 hover:bg-white/5 bg-white/5"
                                onClick={() => {
                                    setMessages([]);
                                    fetchHistory();
                                }}
                            >
                                <span className="text-lg">➕</span> New Chat
                            </Button>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="lg:hidden p-2 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {Object.entries(groupHistoryByDate()).map(([label, msgs]) => msgs.length > 0 && (
                                <div key={label}>
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-2">{label}</h3>
                                    <div className="space-y-1">
                                        {msgs.slice(0, 5).reverse().map((msg, i) => (
                                            <button
                                                key={i}
                                                className="w-full text-left px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all truncate border border-transparent hover:border-white/5"
                                                onClick={() => {
                                                    setInput(msg.content);
                                                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                                }}
                                            >
                                                {msg.content}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {!historyLoaded && messages.length === 0 && !loading && (
                                <p className="text-xs text-slate-600 px-3 py-2 italic text-center">No recent history</p>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm shadow-lg shadow-purple-500/20">
                                    👤
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">Developer Settings</p>
                                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">AI Management</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Container */}
            <div
                className="rounded-[2rem] p-6 lg:p-8 border border-white/10 flex-1 flex flex-col overflow-hidden relative"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
            >
                {/* Sidebar Toggle Button (Visible when sidebar is closed) */}
                {!isSidebarOpen && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl backdrop-blur-md"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 -ml-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">DevTrack AI</h1>
                            <p className="text-slate-400 text-sm">Experimental Technical Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Context badges */}
                        <div className="flex items-center gap-2 text-xs">
                            <span className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {projects.length} projects
                            </span>
                            <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                🔥 {learningStats.currentStreak || 0} day streak
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {quickPrompts.map((qp, idx) => (
                        <QuickPromptButton
                            key={idx}
                            label={qp.label}
                            onClick={() => setInput(qp.prompt)}
                            disabled={cooldown > 0 || loading}
                        />
                    ))}
                </div>

                {/* Messages Area */}
                <div
                    className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
                >
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <MessageBubble key={idx} message={msg} idx={idx} />
                        ))}
                    </AnimatePresence>

                    {loading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={cooldown > 0 ? `Please wait ${cooldown}s...` : "Ask me anything about your projects, learning, or coding..."}
                            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                            disabled={loading || cooldown > 0}
                        />
                        {cooldown > 0 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <span className="text-orange-400 text-sm font-medium">⏳ {cooldown}s</span>
                            </div>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !input.trim() || cooldown > 0}
                        className="px-6 rounded-full"
                    >
                        {loading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                ⚡
                            </motion.div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </Button>
                </form>
            </div>
        </motion.div>
    )
}
