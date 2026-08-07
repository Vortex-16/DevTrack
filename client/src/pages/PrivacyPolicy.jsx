import { motion } from 'framer-motion';
import { Shield, Lock, Database, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
    return (
        <div className="text-slate-300 py-4 px-4">
            <div className="max-w-3xl mx-auto">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                            <Shield className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white">
                            Privacy{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Policy
                            </span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg">
                        Last updated:{' '}
                        {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </motion.div>

                <div className="space-y-8">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-6 h-6 text-purple-400" />
                            <h2 className="text-2xl font-bold text-white">Data Collection</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-4">
                            DevTrack collects minimal data required to provide you with insights into your development
                            workflow. We store:
                        </p>
                        <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                            <li>Public GitHub repository metadata (commits, stars, forks).</li>
                            <li>Your preferred notification settings and goals.</li>
                            <li>AI-generated reports based on your codebase structure.</li>
                        </ul>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold text-white">GitHub OAuth & Token Security</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            When you connect your GitHub account, we utilize Clerk for secure OAuth authentication.
                            DevTrack never sees or stores your password.
                            <br />
                            <br />
                            If you explicitly grant DevTrack the `repo` scope to view private repository traffic
                            (clones/views), your GitHub token is **encrypted at rest** using military-grade AES-256-GCM
                            encryption before being saved to our Firestore database.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCw className="w-6 h-6 text-orange-400" />
                            <h2 className="text-2xl font-bold text-white">Data Retention & Deletion</h2>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                            Elevated GitHub access tokens are automatically purged from our systems after your
                            configured retention window (default 7 days). You can completely delete your DevTrack
                            account at any time, which will immediately scrub all associated data, logs, and preferences
                            from our database.
                        </p>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl"
                    >
                        <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
                        <p className="text-slate-400 leading-relaxed">
                            We utilize the following trusted third-party services:
                        </p>
                        <ul className="list-disc list-inside text-slate-400 mt-4 space-y-2 ml-4">
                            <li>
                                <strong className="text-slate-300">Clerk:</strong> For identity management and
                                authentication.
                            </li>
                            <li>
                                <strong className="text-slate-300">Google Firebase:</strong> For secure database
                                hosting.
                            </li>
                            <li>
                                <strong className="text-slate-300">Groq / Gemini:</strong> For AI-powered repository
                                insights. We do not use your private code to train these models.
                            </li>
                        </ul>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
