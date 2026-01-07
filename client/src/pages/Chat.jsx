import LoadingText from '../components/ui/LoadingText'
import PixelTransition from '../components/ui/PixelTransition'
import { useCache } from '../context/CacheContext'
import Button from '../components/ui/Button'
import { geminiApi, projectsApi, logsApi } from '../services/api'
import { useState, useEffect, useRef } from 'react'
import Lenis from 'lenis'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import { Plus, Target, BookOpen, Dumbbell, BarChart2, Zap, Send, User, ArrowDown, Bot, SquarePen } from 'lucide-react'

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
    const { user } = useUser()

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`flex items-start gap-3 w-full sm:max-w-[85%] sm:w-auto ${isUser ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center
                    ${isUser
                        ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20 text-sm'
                        : 'bg-white/10 border border-white/10'}`}
                >
                    {isUser
                        ? (user?.imageUrl ? <img src={user.imageUrl} alt="User" className="w-full h-full object-cover" /> : <User size={18} className="text-white" />)
                        : <img src="/DevTrack.png" alt="AI" className="w-full h-full object-cover" />}
                </div>

                {/* Message Content */}
                <div
                    className={`relative px-4 py-2 shadow-sm max-w-[calc(100%-3rem)] ${isUser
                        ? 'rounded-lg rounded-tr-none bg-purple-600 text-white after:content-[""] after:absolute after:top-0 after:-right-[10px] after:w-0 after:h-0 after:border-t-[10px] after:border-t-purple-600 after:border-r-[10px] after:border-r-transparent'
                        : 'rounded-lg rounded-tl-none bg-[#1e293b] text-slate-200 before:content-[""] before:absolute before:top-0 before:-left-[10px] before:w-0 before:h-0 before:border-t-[10px] before:border-t-[#1e293b] before:border-l-[10px] before:border-l-transparent'}`}
                    style={{}}
                >
                    <div className="prose prose-invert prose-sm max-w-none">
                        <MarkdownMessage content={message.content} />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Quick PromptButton
function QuickPromptButton({ icon, label, onClick, disabled }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap
                ${disabled
                    ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                    : 'bg-white/5 text-slate-300 hover:bg-purple-500/20 hover:text-purple-400 border border-white/10 hover:border-purple-500/30'}`}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
        >
            {icon}
            <span>{label}</span>
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
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                    <img src="/DevTrack.png" alt="AI" className="w-full h-full object-cover" />
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

// Rate limit constants removed

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [error, setError] = useState(null)
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const { getCachedData, setCachedData, hasCachedData } = useCache()
    const [loading, setLoading] = useState(!hasCachedData('chat-history'))
    const [projects, setProjects] = useState([])
    const [learningStats, setLearningStats] = useState({})
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Sidebar removed, kept state as false to avoid layout issues if used elsewhere temporarily
    const messagesEndRef = useRef(null)
    const containerRef = useRef(null)
    const contentRef = useRef(null)
    const lenisRef = useRef(null)
    const [showScrollBottom, setShowScrollBottom] = useState(false)

    // Load chat state on mount
    useEffect(() => {
        const savedMessages = sessionStorage.getItem('chat_messages')
        if (savedMessages) {
            try {
                setMessages(JSON.parse(savedMessages))
                setHistoryLoaded(true)
                setLoading(false)
            } catch (e) {
                console.error("Failed to parse saved chat", e)
                fetchHistory()
            }
        } else {
            fetchHistory()
        }
        fetchContext()
    }, [])

    useEffect(() => {
        if (!containerRef.current) return

        const lenis = new Lenis({
            wrapper: containerRef.current,
            content: contentRef.current,
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        })

        lenisRef.current = lenis

        lenis.on('scroll', ({ scroll, limit, velocity }) => {
            const isFarUp = limit - scroll > 150
            
            if (!isFarUp) {
                setShowScrollBottom(false)
            } else {
                // Only hide if actively scrolling down
                if (velocity > 1) {
                    setShowScrollBottom(false)
                } else {
                    // Show if stopped or scrolling up
                    setShowScrollBottom(true)
                }
            }
        })
        
        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        const rafId = requestAnimationFrame(raf)

        return () => {
            cancelAnimationFrame(rafId)
            lenis.destroy()
        }
    }, [])

    // Persist messages to session storage
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('chat_messages', JSON.stringify(messages))
        }
    }, [messages])

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
        // Small delay to ensure content is rendered before scrolling
        const timer = setTimeout(() => {
            scrollToBottom()
        }, 100)
        return () => clearTimeout(timer)
    }, [messages])

    const scrollToBottom = () => {
        if (lenisRef.current && messagesEndRef.current) {
            lenisRef.current.scrollTo(messagesEndRef.current, { immediate: false })
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
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
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])

        setLoading(true)

        try {
            const response = await geminiApi.chat(userMessage, buildContext())
            const aiMessage = response.data.data.message
            setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }])
        } catch (err) {
            console.error('Chat error:', err)
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again.' }])
        } finally {
            setLoading(false)
        }
    }

    const quickPrompts = [
        { icon: <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />, label: 'Which project first?', prompt: 'Based on my projects, which one should I focus on first and why?' },
        { icon: <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />, label: 'What to learn?', prompt: 'What should I learn next to improve my skills?' },
        { icon: <Dumbbell className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />, label: 'Motivate me', prompt: 'Give me a motivational message based on my progress.' },
        { icon: <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />, label: 'Analyze progress', prompt: 'Analyze my overall progress. What can I improve?' },
    ]

    return (
        <PixelTransition loading={loading && messages.length === 0}>
        <motion.div
            className="h-[calc(100vh-4rem)] flex gap-4 lg:gap-6 overflow-hidden relative"
        >
            {/* Loader Overlay removed - replaced by PixelTransition */}


            {/* Sidebar Removed */}

            {/* Main Chat Container - Background removed, padding maximized */}
            <div
                className="px-4 md:px-6 py-0 flex-1 flex flex-col overflow-hidden relative"
            >
                {/* Header toggle removed */}
                {/* Header */}
                <div className="flex flex-row justify-between items-center gap-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">DevTrack AI</h1>
                            <p className="text-slate-400 text-xs sm:text-sm">Experimental Technical Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden sm:flex items-center gap-2 border-white/5 hover:bg-white/10 bg-white/5 rounded-full px-4"
                            onClick={() => {
                                sessionStorage.removeItem('chat_messages');
                                setMessages([{
                                    role: 'assistant',
                                    content: `👋 **Hi! I'm your Gemini 2.0 flash coding assistant.**\nI'm here to help you build better software faster.\n\nI can help you with:\n- **Code implementation**\n- **Debugging**\n- **Architecture**\n- **Best practices**\n\n> 💡 **Tip**: I specialize strictly in coding. Just share your code or ask any programming question!`
                                }]);
                            }}
                        >
                            <Plus size={16} />
                            <span>New Chat</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="sm:hidden flex items-center justify-center text-white w-10 h-10 p-0 hover:bg-white/10 rounded-full"
                            onClick={() => {
                                sessionStorage.removeItem('chat_messages');
                                setMessages([{
                                    role: 'assistant',
                                    content: `👋 **Hi! I'm your Gemini 2.0 flash coding assistant.**\nI'm here to help you build better software faster.\n\nI can help you with:\n- **Code implementation**\n- **Debugging**\n- **Architecture**\n- **Best practices**\n\n> 💡 **Tip**: I specialize strictly in coding. Just share your code or ask any programming question!`
                                }]);
                            }}
                        >
                            <SquarePen size={26} />
                        </Button>
                    </div>
                </div>

                {/* Quick Prompts */}
                <div className="flex items-center gap-2 mb-2 overflow-hidden">
                    <div className="flex-1 flex flex-nowrap gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade-right">
                        {quickPrompts.map((qp, idx) => (
                            <QuickPromptButton
                                key={idx}
                                icon={qp.icon}
                                label={qp.label}
                                onClick={() => setInput(qp.prompt)}
                                disabled={loading}
                            />
                        ))}
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto min-h-0 mb-2 overscroll-behavior-contain relative z-0 pointer-events-auto"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
                >
                    <div ref={contentRef} className="space-y-4 pr-6 pb-4">
                        <AnimatePresence>
                            {messages.map((msg, idx) => (
                                <MessageBubble key={idx} message={msg} idx={idx} />
                            ))}
                        </AnimatePresence>

                        {loading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <AnimatePresence>
                    {showScrollBottom && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={scrollToBottom}
                            className="absolute bottom-24 right-8 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg shadow-purple-900/50 border border-purple-400/30 z-20 transition-colors"
                        >
                            <ArrowDown size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about your projects, learning, or coding..."
                            className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                            disabled={loading}
                        />
                        {/* Visual timer removed */}
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-6 rounded-full"
                    >
                        {loading ? (
                            <motion.div
                                animate={{ 
                                    x: [0, 15, -15, 0], 
                                    y: [0, -15, 15, 0],
                                    opacity: [1, 0, 0, 1] 
                                }}
                                transition={{ 
                                    duration: 1, 
                                    repeat: Infinity, 
                                    ease: ["easeIn", "linear", "easeOut"],
                                    times: [0, 0.45, 0.45, 1]
                                }}
                            >
                                <Send size={18} />
                            </motion.div>
                        ) : (
                            <Send size={18} />
                        )}
                    </Button>
                </form>
            </div>
        </motion.div>
        </PixelTransition>
    )
}
