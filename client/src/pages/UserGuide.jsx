import { motion } from 'framer-motion';
import { BookOpen, BarChart3, Bot, Bell, Shield, Zap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserGuide = () => {
    const sections = [
        {
            title: "Getting Started",
            icon: <Zap className="w-6 h-6 text-cyan-400" />,
            content: "Welcome to DevTrack! To begin, connect your GitHub account. DevTrack requests read-only access to your public data by default. To unlock advanced traffic stats (clones and views), you can temporarily elevate your permissions using the 'Locked' badge on your dashboard.",
            color: "cyan"
        },
        {
            title: "Analytics & Traffic",
            icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
            content: "The Projects dashboard gives you a real-time view of your repository health. You can track stars, forks, issues, and traffic. If your traffic stats show as 'Locked', click the badge to grant DevTrack the required GitHub 'repo' scope. We only hold this elevated access for a maximum of 7 days before automatically discarding it.",
            color: "purple"
        },
        {
            title: "AI Insights & Mentorship",
            icon: <Bot className="w-6 h-6 text-blue-400" />,
            content: "DevTrack integrates advanced AI (powered by Gemini/Groq) to analyze your code and commit history. On any project card, you can view AI-generated insights regarding architecture maturity, code quality, and security vulnerabilities. Our AI is configured to understand your specific tech stack.",
            color: "blue"
        },
        {
            title: "Automated PDF Reports",
            icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
            content: "Showcase your progress with automated weekly PDF reports. Configure your preferred delivery time in Settings > Notifications. The report provides a comprehensive summary of your commits, streak calendar, and project milestones.",
            color: "emerald"
        },
        {
            title: "Smart Notifications",
            icon: <Bell className="w-6 h-6 text-pink-400" />,
            content: "Never break your streak. DevTrack's smart notification system learns your coding habits. Choose between 'Adaptive' reminders (which ping you at the same time you coded yesterday) or a 'Fixed Time' daily schedule.",
            color: "pink"
        },
        {
            title: "Security & Privacy",
            icon: <Shield className="w-6 h-6 text-orange-400" />,
            content: "Your data security is our top priority. DevTrack encrypts all GitHub OAuth tokens at rest using AES-256-GCM. We never store your passwords, as all authentication is handled securely via Clerk.",
            color: "orange"
        }
    ];

    const gradients = {
        cyan: "from-cyan-500/20 via-cyan-500/5 to-transparent",
        purple: "from-purple-500/20 via-purple-500/5 to-transparent",
        blue: "from-blue-500/20 via-blue-500/5 to-transparent",
        emerald: "from-emerald-500/20 via-emerald-500/5 to-transparent",
        pink: "from-pink-500/20 via-pink-500/5 to-transparent",
        orange: "from-orange-500/20 via-orange-500/5 to-transparent",
    };

    const borders = {
        cyan: "border-cyan-500/30",
        purple: "border-purple-500/30",
        blue: "border-blue-500/30",
        emerald: "border-emerald-500/30",
        pink: "border-pink-500/30",
        orange: "border-orange-500/30",
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8">
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
                        DevTrack <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">User Guide</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Everything you need to know to master your developer workflow, track your progress, and leverage AI insights.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`p-6 md:p-8 rounded-2xl bg-gradient-to-br ${gradients[section.color]} border ${borders[section.color]} backdrop-blur-xl hover:scale-[1.02] transition-transform duration-300`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                    {section.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white">{section.title}</h3>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                {section.content}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-center text-sm text-slate-500"
                >
                    <p>Still have questions? Reach out to us on our Discord community.</p>
                </motion.div>
            </div>
        </div>
    );
};

export default UserGuide;
