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

// Simple cache for AI responses
const responseCache = new Map()
const CACHE_EXPIRY = 5 * 60 * 1000
const RATE_LIMIT_MS = 10000

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState([])
    const [learningStats, setLearningStats] = useState({})
    const [cooldown, setCooldown] = useState(0)
    const messagesEndRef = useRef(null)
    const lastRequestTime = useRef(0)

    useEffect(() => {
        fetchContext()
        setMessages([{
            role: 'assistant',
            content: `👋 **Hi! I'm your DevTrack AI Assistant** powered by **Llama 3.3 70B** via Groq.

I can help you with:
- **Project guidance** - Which project to focus on and why
- **Learning suggestions** - What to learn next based on your progress
- **Code help** - Debug issues or explain concepts
- **Motivation** - Keep you on track with your goals

> 💡 **Tip**: I have access to your full project details including GitHub data and AI analysis!

Just ask me anything!`
        }])
    }, [])

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

    const getCacheKey = (message) => message.toLowerCase().trim().substring(0, 100)

    const getCachedResponse = (message) => {
        const cached = responseCache.get(getCacheKey(message))
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) return cached.response
        return null
    }

    const cacheResponse = (message, response) => {
        responseCache.set(getCacheKey(message), { response, timestamp: Date.now() })
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

        const cachedResponse = getCachedResponse(userMessage)
        if (cachedResponse) {
            setMessages(prev => [...prev, { role: 'assistant', content: cachedResponse + '\n\n_📦 (Cached response)_' }])
            return
        }

        setLoading(true)
        lastRequestTime.current = now

        try {
            const response = await geminiApi.chat(userMessage, buildContext())
            const aiMessage = response.data.data.message
            cacheResponse(userMessage, aiMessage)
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
            className="h-[calc(100vh-25px)] flex flex-col"
        >
            {/* Main Container */}
            <div
                className="rounded-[2rem] p-6 lg:p-8 border border-white/10 flex-1 flex flex-col overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, rgba(15, 20, 35, 0.8), rgba(10, 15, 25, 0.9))',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">AI Assistant</h1>
                        <p className="text-slate-400 text-sm">Get personalized guidance for your development journey</p>
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
