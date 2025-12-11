import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { geminiApi, projectsApi, logsApi } from '../services/api'
import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'

// Custom styled markdown renderer with colored text
const MarkdownMessage = ({ content }) => {
    return (
        <ReactMarkdown
            components={{
                // Bold text with primary color
                strong: ({ children }) => (
                    <strong className="text-primary-400 font-semibold">{children}</strong>
                ),
                // Italic text
                em: ({ children }) => (
                    <em className="text-slate-300 italic">{children}</em>
                ),
                // Headers
                h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-white mt-3 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-white mt-2 mb-1">{children}</h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-md font-semibold text-primary-300 mt-2 mb-1">{children}</h3>
                ),
                // Lists
                ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2 ml-2">{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2 ml-2">{children}</ol>
                ),
                li: ({ children }) => (
                    <li className="text-slate-200">{children}</li>
                ),
                // Code blocks
                code: ({ inline, children }) => (
                    inline
                        ? <code className="bg-dark-700 text-green-400 px-1 py-0.5 rounded text-sm">{children}</code>
                        : <pre className="bg-dark-700 text-green-400 p-3 rounded-lg my-2 overflow-x-auto text-sm"><code>{children}</code></pre>
                ),
                // Paragraphs
                p: ({ children }) => {
                    // Check if this paragraph contains danger words
                    const text = String(children)
                    if (text.includes('❌') || text.includes('🚨') || text.includes('⚠️')) {
                        return <p className="text-red-400 my-1">{children}</p>
                    }
                    if (text.includes('✅') || text.includes('✓') || text.includes('🎉')) {
                        return <p className="text-green-400 my-1">{children}</p>
                    }
                    return <p className="text-slate-200 my-1">{children}</p>
                },
                // Blockquotes for tips
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary-500 pl-3 my-2 text-slate-300 italic">
                        {children}
                    </blockquote>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    )
}

// Simple cache for AI responses
const responseCache = new Map()
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes
const RATE_LIMIT_MS = 10000 // 10 seconds between requests

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
        // Add welcome message
        setMessages([{
            role: 'assistant',
            content: `👋 **Hi! I'm your DevTrack AI Assistant** powered by **Llama 3.3 70B** via Groq.

I can help you with:
- **Project guidance** - Which project to focus on and why
- **Learning suggestions** - What to learn next based on your progress
- **Code help** - Debug issues or explain concepts
- **Motivation** - Keep you on track with your goals

✅ I have access to your full project details including GitHub data and AI analysis!

> 💡 **Tip**: To reduce API usage, I cache responses for similar questions.

⏱️ Rate limit: 1 request every 10 seconds.

Just ask me anything!`
        }])
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Cooldown timer effect
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
            context += '\nProjects (with full details):\n'
            projects.forEach(p => {
                context += `\n## ${p.name}\n`
                context += `- Status: ${p.status}\n`
                context += `- Progress: ${p.progress || 0}%\n`
                context += `- Commits: ${p.commits || 0}\n`
                if (p.technologies?.length) {
                    context += `- Technologies: ${p.technologies.join(', ')}\n`
                }
                if (p.description) {
                    context += `- Description: ${p.description}\n`
                }
                if (p.projectIdea) {
                    context += `- Project Idea: ${p.projectIdea}\n`
                }
                if (p.repositoryUrl) {
                    context += `- GitHub: ${p.repositoryUrl}\n`
                }
                // Include GitHub data if available
                if (p.githubData) {
                    context += `- Stars: ${p.githubData.stars || 0}, Forks: ${p.githubData.forks || 0}\n`
                    context += `- Open Issues: ${p.githubData.openIssues?.length || p.githubData.openIssuesCount || 0}\n`
                    context += `- Recent Commits This Week: ${p.githubData.recentCommitsThisWeek || 0}\n`
                }
                // Include AI Analysis if available
                if (p.aiAnalysis) {
                    context += `- AI Progress Summary: ${p.aiAnalysis.progressSummary || p.aiAnalysis.reasoning || 'N/A'}\n`
                    context += `- Commit Frequency Score: ${p.aiAnalysis.commitFrequencyScore || 'N/A'}\n`
                    if (p.aiAnalysis.nextRecommendedTasks?.length) {
                        context += `- Next Tasks: ${p.aiAnalysis.nextRecommendedTasks.slice(0, 2).join(', ')}\n`
                    }
                    if (p.aiAnalysis.areasOfImprovement?.length) {
                        context += `- Areas to Improve: ${p.aiAnalysis.areasOfImprovement.slice(0, 2).join(', ')}\n`
                    }
                    if (p.aiAnalysis.concerns) {
                        context += `- Concerns: ${p.aiAnalysis.concerns}\n`
                    }
                }
            })
        } else {
            context += '\nNo projects yet.\n'
        }

        context += `\nLearning Stats:\n`
        context += `- Total learning entries: ${learningStats.totalLogs || 0}\n`
        context += `- Current streak: ${learningStats.currentStreak || 0} days\n`
        context += `- Unique learning days: ${learningStats.uniqueDays || 0}\n`

        return context
    }

    // Generate a cache key from the message
    const getCacheKey = (message) => {
        // Normalize message for caching (lowercase, trim, first 100 chars)
        return message.toLowerCase().trim().substring(0, 100)
    }

    // Check if a cached response exists and is still valid
    const getCachedResponse = (message) => {
        const key = getCacheKey(message)
        const cached = responseCache.get(key)
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
            return cached.response
        }
        return null
    }

    // Store a response in the cache
    const cacheResponse = (message, response) => {
        const key = getCacheKey(message)
        responseCache.set(key, {
            response,
            timestamp: Date.now()
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!input.trim() || loading || cooldown > 0) return

        // Check rate limit
        const now = Date.now()
        const timeSinceLastRequest = now - lastRequestTime.current
        if (timeSinceLastRequest < RATE_LIMIT_MS) {
            const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000)
            setCooldown(waitTime)
            return
        }

        const userMessage = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])

        // Check cache first
        const cachedResponse = getCachedResponse(userMessage)
        if (cachedResponse) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: cachedResponse + '\n\n_📦 (Cached response)_'
            }])
            return
        }

        setLoading(true)
        lastRequestTime.current = now

        try {
            const context = buildContext()
            const response = await geminiApi.chat(userMessage, context)

            const aiMessage = response.data.data.message
            cacheResponse(userMessage, aiMessage)

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: aiMessage
            }])

            // Start cooldown after successful request
            setCooldown(10)
        } catch (err) {
            console.error('Chat error:', err)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const quickPrompts = [
        { label: '🎯 Which project first?', prompt: 'Based on my projects, which one should I focus on first and why? Give me a prioritized plan.' },
        { label: '📚 What to learn?', prompt: 'Based on my projects and learning history, what should I learn next to improve my skills?' },
        { label: '💪 Motivate me', prompt: 'Give me a motivational message based on my progress. Be encouraging and specific.' },
        { label: '📊 Analyze progress', prompt: 'Analyze my overall progress across projects and learning. What am I doing well? What can I improve?' },
    ]

    const handleQuickPrompt = (prompt) => {
        if (cooldown > 0) return
        setInput(prompt)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gradient mb-2">AI Assistant</h1>
                <p className="text-slate-400">Get personalized guidance for your development journey</p>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mb-4">
                {quickPrompts.map((qp, idx) => (
                    <Button
                        key={idx}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleQuickPrompt(qp.prompt)}
                        className="text-sm"
                        disabled={cooldown > 0}
                    >
                        {qp.label}
                    </Button>
                ))}
            </div>

            {/* Chat Messages */}
            <Card className="flex-1 overflow-y-auto mb-4 p-4">
                <div className="space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-dark-800 border border-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs opacity-70">
                                        {msg.role === 'user' ? '👤 You' : '🤖 DevTrack AI'}
                                    </span>
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <MarkdownMessage content={msg.content} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-dark-800 border border-white/10 rounded-lg px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="animate-pulse">🤖 Thinking...</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </Card>

            {/* Context Info */}
            <div className="flex gap-2 mb-2 text-xs text-slate-500">
                <Badge variant="default">{projects.length} projects loaded</Badge>
                <Badge variant="default">{learningStats.totalLogs || 0} learning entries</Badge>
                <Badge variant="default">{learningStats.currentStreak || 0} day streak</Badge>
                {cooldown > 0 && (
                    <Badge variant="warning">⏳ Wait {cooldown}s</Badge>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={cooldown > 0 ? `Please wait ${cooldown}s before sending...` : "Ask me anything about your projects, learning, or coding..."}
                    className="flex-1 bg-dark-800 border border-white/10 rounded-lg px-4 py-3"
                    disabled={loading || cooldown > 0}
                />
                <Button type="submit" disabled={loading || !input.trim() || cooldown > 0}>
                    {loading ? '...' : cooldown > 0 ? `${cooldown}s` : 'Send'}
                </Button>
            </form>
        </div>
    )
}
