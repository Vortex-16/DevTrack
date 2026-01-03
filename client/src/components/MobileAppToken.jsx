import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Loader2, Key, CheckCircle2, Copy, CircleDot } from 'lucide-react'

/**
 * Component that shows a "Get Token for Mobile App" button
 * Makes it easy for users to copy their session token for the Flutter app
 */
export default function MobileAppToken() {
    const { getToken } = useAuth()
    const [token, setToken] = useState('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showToken, setShowToken] = useState(false)

    const handleGetToken = async () => {
        setLoading(true)
        try {
            // Get the session token from Clerk
            const sessionToken = await getToken()
            if (sessionToken) {
                setToken(sessionToken)
                setShowToken(true)
            }
        } catch (error) {
            console.error('Failed to get token:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(token)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            // Fallback for mobile browsers
            const textArea = document.createElement('textarea')
            textArea.value = token
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30">
            <div className="flex items-center gap-3 mb-3">
                <Smartphone className="text-purple-400" size={24} />
                <div>
                    <h3 className="text-white font-semibold">Mobile App Login</h3>
                    <p className="text-xs text-slate-400">Get token for DevTrack mobile app</p>
                </div>
            </div>

            {!showToken ? (
                <button
                    onClick={handleGetToken}
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Getting Token...
                        </>
                    ) : (
                        <>
                            <Key size={16} />
                            Get Session Token
                        </>
                    )}
                </button>
            ) : (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                    >
                        {/* Token display */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/10">
                            <p className="text-xs text-slate-400 mb-1">Your session token:</p>
                            <p className="text-xs text-slate-300 font-mono break-all line-clamp-3">
                                {token.slice(0, 50)}...
                            </p>
                        </div>

                        {/* Copy button */}
                        <button
                            onClick={handleCopy}
                            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2
                                ${copied
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 size={16} />
                                    Copied! Paste in Mobile App
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    Copy Token
                                </>
                            )}
                        </button>

                        {/* Instructions */}
                        <div className="text-xs text-slate-400 space-y-1">
                            <p className="flex items-center gap-2"><CircleDot size={10} className="text-purple-500" /> Open DevTrack mobile app</p>
                            <p className="flex items-center gap-2"><CircleDot size={10} className="text-purple-500" /> Tap "Already signed in? Enter token"</p>
                            <p className="flex items-center gap-2"><CircleDot size={10} className="text-purple-500" /> Paste this token and tap Login</p>
                        </div>

                        {/* Hide button */}
                        <button
                            onClick={() => setShowToken(false)}
                            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            Hide Token
                        </button>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}
