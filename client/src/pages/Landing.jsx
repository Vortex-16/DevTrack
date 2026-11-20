import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import { publicApi } from '../services/api';
import {
    Github,
    Linkedin,
    Lock,
    Code2,
    BarChart3,
    Rocket,
    Zap,
    Bot,
    RefreshCw,
    Flame,
    TrendingUp,
    ChevronDown,
    CheckCircle2,
    ArrowRight,
    Star,
    GitFork,
    Users,
    Award,
    Terminal,
    Folder,
    FileCode,
    Shield,
    Activity,
    GitBranch,
    GitCommit,
    Layers,
    Check,
    X,
    Cpu,
    ExternalLink,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Team members specification
const teamMembers = [
    {
        name: 'Vikash Gupta',
        github: 'Vortex-16',
        role: 'Full Stack & AI Architect',
        bio: 'Core architecture, real-time sync engine, and Gemini AI integration.',
    },
    {
        name: 'Ayush Chowdhury',
        github: 'AyushChowdhuryCSE',
        role: 'Product & Innovation',
        bio: 'Developer workflows, habit tracking mechanics, and squad concepts.',
    },
    {
        name: 'Rajdeep Das',
        github: 'yourajdeep',
        role: 'UI/UX & Systems',
        bio: 'Design systems, interface precision, and web performance engineering.',
    },
];

// Workflow Steps
const steps = [
    {
        num: '01',
        title: 'Connect GitHub',
        desc: 'Link your GitHub account in one click with secure read-only metadata access.',
        accent: 'text-cobalt',
        borderHover: 'hover:border-cobalt/40',
        icon: <Lock className="w-5 h-5 text-cobalt" />,
    },
    {
        num: '02',
        title: 'Push & Build Normally',
        desc: 'Keep working in VS Code, terminal, or your IDE of choice with zero extra tooling.',
        accent: 'text-coral',
        borderHover: 'hover:border-coral/40',
        icon: <Code2 className="w-5 h-5 text-coral" />,
    },
    {
        num: '03',
        title: 'Instant DNA Scoring',
        desc: 'DevTrack computes code volume, commit velocity, consistency scores, and streak health.',
        accent: 'text-sprout',
        borderHover: 'hover:border-sprout/40',
        icon: <BarChart3 className="w-5 h-5 text-sprout" />,
    },
    {
        num: '04',
        title: 'Ship Like a Squad',
        desc: 'Share verified achievements, track shared sprints, and showcase your developer portfolio.',
        accent: 'text-cobalt',
        borderHover: 'hover:border-cobalt/40',
        icon: <Rocket className="w-5 h-5 text-cobalt" />,
    },
];

// Social links
const socialLinks = [
    {
        name: 'GitHub',
        url: 'https://github.com/Vortex-16/DevTrack',
        icon: <Github className="w-4 h-4" />,
    },
    {
        name: 'Discord',
        url: 'https://discord.gg/5Jyt4sQPR',
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
            </svg>
        ),
    },
    {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/company/alpha4coders/',
        icon: <Linkedin className="w-4 h-4" />,
    },
];

// Partner / Stack Logos
const stackLogos = [
    { name: 'GitHub', icon: <Github className="w-5 h-5" /> },
    { name: 'VS Code', icon: <Code2 className="w-5 h-5" /> },
    { name: 'Git Engine', icon: <GitBranch className="w-5 h-5" /> },
    { name: 'Terminal', icon: <Terminal className="w-5 h-5" /> },
    { name: 'Docker', icon: <Layers className="w-5 h-5" /> },
    { name: 'Discord', icon: <Activity className="w-5 h-5" /> },
];

// FAQs matching light styling
const faqs = [
    {
        q: 'How does DevTrack monitor my activity?',
        a: 'We integrate securely via the GitHub REST and GraphQL APIs using OAuth tokens. DevTrack automatically tracks commits, pull requests, streaks, and repository timestamps in real time.',
    },
    {
        q: 'Is my source code stored or visible to DevTrack?',
        a: 'Never. DevTrack strictly queries metadata (commit hashes, line change differentials, programming language distributions, timestamps). Your proprietary source code never leaves GitHub.',
    },
    {
        q: 'What is the GitHub DNA Score?',
        a: 'It is an algorithmic metric that measures your engineering velocity, streak consistency, code review interaction, and long-term project impact against real-world production standards.',
    },
    {
        q: 'Is DevTrack free to use?',
        a: 'Yes! DevTrack is completely free for individual developers, students, and open-source contributors. We believe every engineer deserves transparent insight into their growth.',
    },
    {
        q: 'Can squads and teams collaborate on projects?',
        a: 'Yes. You can form developer squads, synchronize shared milestones, assign project modules, and review team commit heatmaps all in one unified workspace.',
    },
];

export default function Landing() {
    const [activeFaq, setActiveFaq] = useState(0);
    const [terminalTab, setTerminalTab] = useState('cli');
    const [showExpiredToast, setShowExpiredToast] = useState(false);
    const [platformStats, setPlatformStats] = useState({
        githubStars: 16,
        commitsAnalyzed: 42709,
        activeDevelopers: 37,
        habitRetention: 60.5,
    });
    const [isLiveStats, setIsLiveStats] = useState(false);
    const location = useLocation();

    useEffect(() => {
        let isMounted = true;

        const loadStats = async () => {
            try {
                const res = await publicApi.getPlatformStats();
                if (res.data?.success && res.data?.data && isMounted) {
                    setPlatformStats((prev) => ({
                        ...prev,
                        ...res.data.data,
                    }));
                    setIsLiveStats(true);
                    return;
                }
            } catch (err) {
                console.warn(
                    'DevTrack public stats endpoint unreachable, falling back to direct GitHub fetch:',
                    err.message
                );
            }

            // Fallback: Query GitHub API directly from client for live repository stars
            try {
                const ghRes = await fetch('https://api.github.com/repos/Vortex-16/DevTrack');
                if (ghRes.ok) {
                    const ghData = await ghRes.json();
                    if (typeof ghData.stargazers_count === 'number' && isMounted) {
                        setPlatformStats((prev) => ({
                            ...prev,
                            githubStars: ghData.stargazers_count,
                        }));
                        setIsLiveStats(true);
                    }
                }
            } catch (ghErr) {
                console.warn('GitHub direct API fallback unreachable:', ghErr.message);
            }
        };

        loadStats();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('expired') === 'true') {
            setShowExpiredToast(true);
            window.history.replaceState({}, '', '/');
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-[#fafafa] text-[#27272a] font-sans selection:bg-[#6a5ed9]/15 selection:text-[#18181b] overflow-x-hidden">
            {/* Session Expired Toast */}
            {showExpiredToast && (
                <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-zinc-200 rounded-xl shadow-lg p-4 flex gap-3 items-start animate-fade-in">
                    <div className="bg-red-50 p-2 rounded-lg text-crimson shrink-0">
                        <X className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-zinc-900 font-semibold text-sm">Session Expired</h4>
                        <p className="text-zinc-500 text-xs mt-0.5">Please sign in again to access your workspace.</p>
                    </div>
                    <button
                        onClick={() => setShowExpiredToast(false)}
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Sticky Navigation Bar */}
            <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200">
                <div className="max-w-[1200px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
                            DT
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight text-zinc-900">DevTrack</span>
                            <span className="font-mono text-[11px] font-medium tracking-wider text-sprout bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                v2.4
                            </span>
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
                        <a href="#features" className="hover:text-zinc-900 transition-colors">
                            Features
                        </a>
                        <a href="#workflow" className="hover:text-zinc-900 transition-colors">
                            Workflow
                        </a>
                        <a href="#developers" className="hover:text-zinc-900 transition-colors">
                            Engine
                        </a>
                        <a href="#contributors" className="hover:text-zinc-900 transition-colors">
                            Team
                        </a>
                        <a href="#faq" className="hover:text-zinc-900 transition-colors">
                            FAQ
                        </a>
                    </nav>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <SignInButton mode="modal">
                            <button
                                type="button"
                                className="px-3.5 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 rounded-lg transition-colors"
                            >
                                Log in
                            </button>
                        </SignInButton>

                        {/* Primary Violet Action CTA */}
                        <SignInButton mode="modal">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#6a5ed9] hover:bg-[#5b4ec8] rounded-[12px] shadow-sm transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <span>Start Free</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-16 md:pt-24 pb-16 px-4 sm:px-6 max-w-[1200px] mx-auto text-center">
                {/* DM Mono Eyebrow Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-zinc-200 shadow-sm mb-6">
                    <span className="w-2 h-2 rounded-full bg-sprout animate-pulse" />
                    <span className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-sprout">
                        DEVELOPER PAIR-PROGRAMMING &amp; HABIT ENGINE
                    </span>
                </div>

                {/* Display Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.08] max-w-4xl mx-auto mb-6">
                    The developer workshop for{' '}
                    <span className="text-coral underline decoration-coral/30 decoration-wavy decoration-2">
                        building habits
                    </span>{' '}
                    that ship.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-8">
                    DevTrack synchronizes your GitHub commits, analyzes your engineering DNA, and helps you stay in
                    consistent flow. Flat, clean, and engineered strictly for developers.
                </p>

                {/* CTA Area with Exclusive Violet Button */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                    <SignInButton mode="modal">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-medium text-white bg-[#6a5ed9] hover:bg-[#5a4ec6] rounded-[12px] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Start Tracking Free</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </SignInButton>

                    <a
                        href="#workflow"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-medium text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-[12px] shadow-sm transition-all"
                    >
                        <span>See How It Works</span>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </a>
                </div>

                {/* Micro-copy */}
                <p className="font-mono text-xs text-zinc-500 tracking-tight mb-16">
                    Free for individual developers · Instant GitHub OAuth · Zero source-code storage
                </p>

                {/* Product Screenshot Frame with macOS chrome & dev preview */}
                <div className="relative mx-auto max-w-5xl rounded-[12px] p-2 bg-gradient-to-b from-zinc-200 via-zinc-100 to-zinc-200 shadow-xl border border-zinc-300">
                    <div className="rounded-[10px] overflow-hidden bg-white border border-zinc-200">
                        {/* macOS Window Chrome Header */}
                        <div className="h-10 bg-zinc-100 border-b border-zinc-200 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#ef4444] border border-red-600/30" />
                                <div className="w-3 h-3 rounded-full bg-[#ffb929] border border-amber-600/30" />
                                <div className="w-3 h-3 rounded-full bg-[#22c55e] border border-emerald-600/30" />
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600 bg-white px-3 py-1 rounded-md border border-zinc-200 shadow-xs">
                                <GitBranch className="w-3.5 h-3.5 text-cobalt" />
                                <span>devtrack / main — live sync: connected</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
                                <span className="inline-block w-2 h-2 rounded-full bg-sprout" />
                                <span>14ms</span>
                            </div>
                        </div>

                        {/* Interactive Dev Workshop Window Preview */}
                        <div className="p-6 md:p-8 bg-[#fafafa] grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                            {/* Left Workspace Panel: Daily Streak & Activity */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="p-5 rounded-[12px] bg-white border border-zinc-200 shadow-xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-4 h-4 text-coral" />
                                            <span className="font-mono text-xs font-medium uppercase tracking-[0.05em] text-zinc-800">
                                                ACTIVE STREAK
                                            </span>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-coral bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                            28 DAYS
                                        </span>
                                    </div>
                                    <div className="text-3xl font-bold tracking-tight text-zinc-900 mb-1">
                                        Level 6 Architect
                                    </div>
                                    <p className="text-xs text-zinc-500 mb-4">Daily habit consistency at 98.4%.</p>

                                    {/* Mini Activity Heatmap */}
                                    <div className="grid grid-cols-7 gap-1.5 pt-2 border-t border-zinc-100">
                                        {[
                                            3, 4, 1, 2, 4, 3, 5, 2, 4, 3, 1, 4, 5, 4, 3, 2, 4, 5, 3, 4, 2, 5, 4, 3, 4,
                                            5, 4, 5,
                                        ].map((level, i) => (
                                            <div
                                                key={i}
                                                className={`h-3.5 rounded-[3px] transition-colors ${
                                                    level === 5
                                                        ? 'bg-sprout'
                                                        : level === 4
                                                          ? 'bg-emerald-400'
                                                          : level === 3
                                                            ? 'bg-emerald-300'
                                                            : level === 2
                                                              ? 'bg-emerald-200'
                                                              : 'bg-zinc-100'
                                                }`}
                                                title={`Day ${i + 1}: ${level * 3} commits`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2">
                                        <span>Less</span>
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-[2px] bg-zinc-100" />
                                            <span className="w-2 h-2 rounded-[2px] bg-emerald-200" />
                                            <span className="w-2 h-2 rounded-[2px] bg-emerald-400" />
                                            <span className="w-2 h-2 rounded-[2px] bg-sprout" />
                                        </div>
                                        <span>More</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-[12px] bg-white border border-zinc-200 shadow-xs flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-50 text-cobalt border border-blue-100">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-zinc-900">GitHub DNA Score</div>
                                            <div className="text-[11px] text-zinc-500 font-mono">Top 2.5% globally</div>
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-cobalt font-mono">94.8</span>
                                </div>
                            </div>

                            {/* Right Workspace Panel: Live Code Activity & Squad Status */}
                            <div className="lg:col-span-8 space-y-4">
                                <div className="p-5 rounded-[12px] bg-white border border-zinc-200 shadow-xs">
                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100">
                                        <div className="flex items-center gap-2">
                                            <Terminal className="w-4 h-4 text-cobalt" />
                                            <span className="font-mono text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                                                RECENT COMMIT STREAM
                                            </span>
                                        </div>
                                        <span className="font-mono text-xs text-zinc-500 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sprout" />
                                            polling active
                                        </span>
                                    </div>

                                    {/* Commit items */}
                                    <div className="space-y-2.5 font-mono text-xs">
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                                            <div className="flex items-center gap-2.5 truncate">
                                                <GitCommit className="w-3.5 h-3.5 text-cobalt shrink-0" />
                                                <span className="font-medium text-zinc-900 truncate">
                                                    feat(sync): add sub-50ms delta webhook handler
                                                </span>
                                            </div>
                                            <span className="text-sprout text-[11px] font-bold shrink-0 ml-2">
                                                +184 / -12
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                                            <div className="flex items-center gap-2.5 truncate">
                                                <GitCommit className="w-3.5 h-3.5 text-coral shrink-0" />
                                                <span className="font-medium text-zinc-900 truncate">
                                                    perf(dna): vectorize repository commit entropy
                                                </span>
                                            </div>
                                            <span className="text-sprout text-[11px] font-bold shrink-0 ml-2">
                                                +92 / -4
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                                            <div className="flex items-center gap-2.5 truncate">
                                                <GitCommit className="w-3.5 h-3.5 text-sprout shrink-0" />
                                                <span className="font-medium text-zinc-900 truncate">
                                                    fix(auth): cache token renewal in redis cluster
                                                </span>
                                            </div>
                                            <span className="text-coral text-[11px] font-bold shrink-0 ml-2">
                                                +14 / -48
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Squad Activity Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3.5 rounded-[12px] bg-white border border-zinc-200 shadow-xs">
                                        <div className="text-[11px] font-mono uppercase text-zinc-500 mb-1">
                                            TODAY'S COMMITS
                                        </div>
                                        <div className="text-xl font-bold text-zinc-900 font-mono">14 pushed</div>
                                    </div>
                                    <div className="p-3.5 rounded-[12px] bg-white border border-zinc-200 shadow-xs">
                                        <div className="text-[11px] font-mono uppercase text-zinc-500 mb-1">
                                            LANGUAGE RATIO
                                        </div>
                                        <div className="text-xl font-bold text-cobalt font-mono">72% TS · 28% Go</div>
                                    </div>
                                    <div className="p-3.5 rounded-[12px] bg-white border border-zinc-200 shadow-xs">
                                        <div className="text-[11px] font-mono uppercase text-zinc-500 mb-1">
                                            SQUAD VELOCITY
                                        </div>
                                        <div className="text-xl font-bold text-sprout font-mono">+24% Sprint</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Logo Strip Row */}
            <section className="py-12 border-y border-zinc-200 bg-white">
                <div className="max-w-[1200px] mx-auto px-4 text-center">
                    <p className="font-mono text-xs uppercase tracking-[0.1em] text-zinc-500 mb-6">
                        INTEGRATED WITH YOUR MODERN DEVELOPER TOOLCHAIN
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 hover:opacity-100 transition-opacity">
                        {stackLogos.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                                {item.icon}
                                <span className="font-mono text-sm font-semibold">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Stats Bar */}
            <section className="py-16 px-4 sm:px-6 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between mb-5 px-1">
                    <div className="flex items-center gap-2">
                        <span
                            className={`w-2 h-2 rounded-full ${isLiveStats ? 'bg-sprout animate-pulse' : 'bg-emerald-400'}`}
                        />
                        <span className="font-mono text-xs uppercase tracking-[0.08em] text-zinc-600 font-semibold">
                            Platform Telemetry &amp; Live Stats
                        </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400 hidden sm:inline-block">
                        Real-time repository syncs &amp; activity
                    </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <a
                        href="https://github.com/Vortex-16/DevTrack"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-6 rounded-[12px] bg-white border border-zinc-200 shadow-sm text-center transition-all hover:border-zinc-300 hover:shadow-md group block"
                        title="View DevTrack on GitHub"
                    >
                        <div className="flex items-center justify-center gap-1.5 text-cobalt mb-2">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                                GitHub Stars
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 font-mono tracking-tight group-hover:text-cobalt transition-colors">
                            {platformStats.githubStars ? `${platformStats.githubStars.toLocaleString()}+` : '16+'}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1">
                            <span>Open-source community</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400" />
                        </p>
                    </a>

                    <div className="p-6 rounded-[12px] bg-white border border-zinc-200 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-1.5 text-sprout mb-2">
                            <GitCommit className="w-4 h-4 text-sprout" />
                            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                                Commits Analyzed
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 font-mono tracking-tight">
                            {platformStats.commitsAnalyzed
                                ? `${platformStats.commitsAnalyzed.toLocaleString()}+`
                                : '42,709+'}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Real-time repository syncs</p>
                    </div>

                    <div className="p-6 rounded-[12px] bg-white border border-zinc-200 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-1.5 text-coral mb-2">
                            <Users className="w-4 h-4 text-coral" />
                            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                                Active Developers
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 font-mono tracking-tight">
                            {platformStats.activeDevelopers
                                ? `${platformStats.activeDevelopers.toLocaleString()}+`
                                : '37+'}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Daily engineering habit</p>
                    </div>

                    <div className="p-6 rounded-[12px] bg-white border border-zinc-200 shadow-sm text-center">
                        <div className="flex items-center justify-center gap-1.5 text-cobalt mb-2">
                            <Award className="w-4 h-4 text-cobalt" />
                            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
                                Habit Retention
                            </span>
                        </div>
                        <div className="text-3xl font-bold text-zinc-900 font-mono tracking-tight">
                            {typeof platformStats.habitRetention === 'number'
                                ? `${platformStats.habitRetention.toFixed(1)}%`
                                : platformStats.habitRetention || '60.5%'}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Consistency score rating</p>
                    </div>
                </div>
            </section>

            {/* Feature Capabilities Section */}
            <section id="features" className="py-20 px-4 sm:px-6 max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <div className="font-mono text-xs uppercase tracking-[0.08em] text-cobalt font-semibold mb-2">
                        CAPABILITIES
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                        Everything you need to ship consistently
                    </h2>
                    <p className="text-base text-zinc-500 max-w-xl mx-auto">
                        Flat, bordered, and designed for developer clarity. No noisy bloat — just precise telemetry for
                        your craft.
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1: Large 2-column card */}
                    <div className="md:col-span-2 p-8 rounded-[12px] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-cobalt">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Daily Coding &amp; Velocity Tracker</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6 max-w-lg">
                            Track every line of code written, files touched, and active duration. Automatically compiles
                            your velocity into intuitive graphs without manual timecard logging.
                        </p>
                        {/* Interactive UI snippet */}
                        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-xs space-y-2 text-zinc-700">
                            <div className="flex justify-between items-center text-zinc-500">
                                <span>SESSION_ID: dev-sync-2026</span>
                                <span className="text-sprout font-bold">● ACTIVE</span>
                            </div>
                            <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-cobalt h-full rounded-full w-[78%]" />
                            </div>
                            <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
                                <span>TypeScript (4.2 hrs)</span>
                                <span>3,412 lines compiled</span>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: AI Assistance */}
                    <div className="p-8 rounded-[12px] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center mb-5 text-coral">
                                <Bot className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 mb-2">AI Error Diagnostics</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Instant AI explanations when stacktraces break or builds fail. Get precise debugging
                                steps powered by DeepMind and OpenAI models.
                            </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-zinc-100 font-mono text-xs text-coral font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Sub-second latency
                        </div>
                    </div>

                    {/* Feature 3: GitHub Sync */}
                    <div className="p-8 rounded-[12px] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-sprout">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Automated GitHub Sync</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Webhooks synchronize pull requests, branch switches, and merges without manual triggers or
                            CLI commands.
                        </p>
                    </div>

                    {/* Feature 4: Streak Heatmap */}
                    <div className="p-8 rounded-[12px] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center mb-5 text-coral">
                            <Flame className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Streak Preservation &amp; Heatmaps</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Never lose hard-earned momentum. Visualize your year-at-a-glance commitment and protect your
                            streak with automated holiday freezes.
                        </p>
                    </div>

                    {/* Feature 5: Skill Tree & DNA */}
                    <div className="p-8 rounded-[12px] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 text-cobalt">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Skill Tree Milestones</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            Transform repetitive commits into measurable experience points. Level up your skill tree
                            across frontend, backend, devops, and algorithms.
                        </p>
                    </div>
                </div>
            </section>

            {/* Workflow Section */}
            <section id="workflow" className="py-20 px-4 sm:px-6 bg-zinc-100 border-y border-zinc-200">
                <div className="max-w-[1200px] mx-auto">
                    <div className="text-center mb-16">
                        <div className="font-mono text-xs uppercase tracking-[0.08em] text-coral font-semibold mb-2">
                            WORKFLOW
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                            From first commit to production habit
                        </h2>
                        <p className="text-base text-zinc-500 max-w-xl mx-auto">
                            Getting started takes less than 10 seconds. Connect your account and DevTrack works silently
                            in the background.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`p-6 rounded-[12px] bg-white border border-zinc-200 shadow-xs transition-all duration-200 ${step.borderHover}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                                        {step.icon}
                                    </div>
                                    <span className="font-mono text-xs font-bold text-zinc-400">STEP {step.num}</span>
                                </div>
                                <h3 className="text-base font-bold text-zinc-900 mb-2">{step.title}</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* THE SIGNATURE DARK BAND: "Built for developers" */}
            <section id="developers" className="py-24 px-4 sm:px-6 bg-[#18181b] text-white">
                <div className="max-w-[1200px] mx-auto">
                    <div className="text-center mb-16">
                        <div className="font-mono text-xs uppercase tracking-[0.08em] text-lime font-semibold mb-2">
                            BUILT FOR DEVELOPERS
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
                            Engineered with terminal-grade precision
                        </h2>
                        <p className="text-base text-zinc-400 max-w-2xl mx-auto">
                            No bloated tracking scripts or intrusive watchers. High-throughput webhook ingestion,
                            sub-second telemetry, and complete source code privacy.
                        </p>
                    </div>

                    {/* Technical UI Card on Zinc 800 Surface */}
                    <div className="max-w-4xl mx-auto rounded-[12px] bg-[#27272a] border border-zinc-700 shadow-2xl overflow-hidden">
                        {/* Terminal Header */}
                        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                <span className="ml-2 font-mono text-xs text-zinc-400">devtrack-cli — v2.4.0</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setTerminalTab('cli')}
                                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                                        terminalTab === 'cli'
                                            ? 'bg-zinc-800 text-lime border border-zinc-600'
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    terminal
                                </button>
                                <button
                                    onClick={() => setTerminalTab('tree')}
                                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                                        terminalTab === 'tree'
                                            ? 'bg-zinc-800 text-cobalt border border-zinc-600'
                                            : 'text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    file tree
                                </button>
                            </div>
                        </div>

                        {/* Interactive Tab Body */}
                        <div className="p-6 md:p-8 font-mono text-xs sm:text-sm">
                            {terminalTab === 'cli' ? (
                                <div className="space-y-3 text-zinc-300">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <span className="text-lime">➜</span>
                                        <span className="text-cobalt">~</span>
                                        <span className="text-white">devtrack status --verbose</span>
                                    </div>
                                    <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-1.5 text-xs text-zinc-400">
                                        <div className="text-sprout">✓ GitHub OAuth handshake verified (12ms)</div>
                                        <div>● Tracking repository: Vortex-16/DevTrack</div>
                                        <div>● Commits today: 14 commits across 3 branches</div>
                                        <div>● Active habit streak: 28 days [Flame shield enabled]</div>
                                        <div>● DNA Authority Score: 94.8 / 100 [Lead Architect Tier]</div>
                                    </div>

                                    <div className="flex items-center gap-2 text-zinc-500 pt-2">
                                        <span className="text-lime">➜</span>
                                        <span className="text-cobalt">~</span>
                                        <span className="text-white">devtrack privacy --audit</span>
                                    </div>
                                    <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                                        <div className="text-lime">
                                            [SECURE] Source code payload: 0 bytes stored or cached
                                        </div>
                                        <div>[METRICS] Metadata differential: line counts &amp; timestamps only</div>
                                        <div>[ENCRYPTION] AES-256-GCM token storage at rest</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-xs text-zinc-300">
                                    <div className="flex items-center gap-2 text-cobalt">
                                        <Folder className="w-4 h-4 text-cobalt" />
                                        <span>devtrack-core/</span>
                                    </div>
                                    <div className="pl-6 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Folder className="w-3.5 h-3.5 text-cobalt" />
                                            <span>src/services/</span>
                                        </div>
                                        <div className="pl-6 space-y-1 text-zinc-400">
                                            <div className="flex items-center justify-between py-0.5">
                                                <div className="flex items-center gap-2">
                                                    <FileCode className="w-3.5 h-3.5 text-sprout" />
                                                    <span>gitSync.service.ts</span>
                                                </div>
                                                <span className="text-zinc-600 font-mono text-[11px]">
                                                    sub-50ms webhooks
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-0.5">
                                                <div className="flex items-center gap-2">
                                                    <FileCode className="w-3.5 h-3.5 text-sprout" />
                                                    <span>dnaScore.engine.ts</span>
                                                </div>
                                                <span className="text-zinc-600 font-mono text-[11px]">
                                                    algorithmic metrics
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between py-0.5">
                                                <div className="flex items-center gap-2">
                                                    <FileCode className="w-3.5 h-3.5 text-coral" />
                                                    <span>streakShield.worker.ts</span>
                                                </div>
                                                <span className="text-zinc-600 font-mono text-[11px]">
                                                    streak protection
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-700 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-3">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-sprout">
                                    <Shield className="w-3.5 h-3.5" /> SOC-2 Compliant Architecture
                                </span>
                                <span className="hidden sm:inline text-zinc-600">|</span>
                                <span className="hidden sm:inline">Zero Source Code Retention</span>
                            </div>
                            <span className="font-mono text-zinc-500">v2.4 LTS</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Contributors / Team Section */}
            <section id="contributors" className="py-20 px-4 sm:px-6 max-w-[1200px] mx-auto">
                <div className="text-center mb-16">
                    <div className="font-mono text-xs uppercase tracking-[0.08em] text-cobalt font-semibold mb-2">
                        CORE CONTRIBUTORS
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                        The team behind the workshop
                    </h2>
                    <p className="text-base text-zinc-500 max-w-xl mx-auto">
                        DevTrack is crafted by engineers passionate about developer productivity and open-source habit
                        formation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {teamMembers.map((member, idx) => (
                        <div
                            key={idx}
                            className="p-6 rounded-[12px] bg-white border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <img
                                        src={`https://github.com/${member.github}.png`}
                                        alt={member.name}
                                        className="w-14 h-14 rounded-full border border-zinc-200 object-cover bg-zinc-100"
                                        onError={(e) => {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=e4e4e7&color=27272a`;
                                        }}
                                    />
                                    <div>
                                        <h3 className="font-bold text-base text-zinc-900">{member.name}</h3>
                                        <p className="font-mono text-xs text-cobalt">{member.role}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-500 leading-relaxed mb-6">{member.bio}</p>
                            </div>

                            <a
                                href={`https://github.com/${member.github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-mono text-zinc-600 hover:text-zinc-900 transition-colors pt-4 border-t border-zinc-100"
                            >
                                <Github className="w-4 h-4" />
                                <span>@{member.github}</span>
                                <ExternalLink className="w-3 h-3 ml-auto text-zinc-400" />
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 px-4 sm:px-6 bg-zinc-100 border-t border-zinc-200">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="font-mono text-xs uppercase tracking-[0.08em] text-sprout font-semibold mb-2">
                            FREQUENTLY ASKED QUESTIONS
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                            Questions &amp; Answers
                        </h2>
                        <p className="text-base text-zinc-500">
                            Clear, direct answers regarding DevTrack security, pricing, and integrations.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, idx) => {
                            const isOpen = activeFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className="rounded-[12px] bg-white border border-zinc-200 shadow-xs overflow-hidden transition-colors"
                                >
                                    <button
                                        onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-zinc-50/70"
                                    >
                                        <span className="font-semibold text-zinc-900 text-sm sm:text-base">
                                            {faq.q}
                                        </span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-zinc-400 transition-transform duration-200 shrink-0 ml-4 ${
                                                isOpen ? 'rotate-180 text-cobalt' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="px-6 pb-5 pt-1 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Pre-Footer Action Banner */}
            <section className="py-24 px-4 sm:px-6 bg-[#fafafa]">
                <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-[16px] bg-white border border-zinc-200 shadow-sm text-center">
                    <div className="font-mono text-xs uppercase tracking-[0.08em] text-coral font-semibold mb-2">
                        START TODAY
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
                        Ready to ship code with unstoppable consistency?
                    </h2>
                    <p className="text-base text-zinc-500 max-w-xl mx-auto mb-8">
                        Join over 15,000 developers building disciplined coding habits and verifiable GitHub authority.
                    </p>
                    <SignInButton mode="modal">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-medium text-white bg-[#6a5ed9] hover:bg-[#5a4ec6] rounded-[12px] shadow-sm hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>Start Tracking Free</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </SignInButton>
                    <p className="font-mono text-xs text-zinc-400 mt-4">No credit card required · Instant setup</p>
                </div>
            </section>

            {/* Site Footer */}
            <footer className="py-14 px-4 sm:px-6 bg-zinc-100 border-t border-zinc-200">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                                DT
                            </div>
                            <span className="font-bold text-base text-zinc-900">DevTrack</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            The pair-programming &amp; habit tracking workshop for modern developers.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-sprout animate-pulse" />
                            <span>Systems operational</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-800 font-semibold mb-3">
                            PRODUCT
                        </h4>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li>
                                <a href="#features" className="hover:text-zinc-900 transition-colors">
                                    Daily Coding Tracker
                                </a>
                            </li>
                            <li>
                                <a href="#features" className="hover:text-zinc-900 transition-colors">
                                    GitHub DNA Score
                                </a>
                            </li>
                            <li>
                                <a href="#developers" className="hover:text-zinc-900 transition-colors">
                                    CLI &amp; Engine
                                </a>
                            </li>
                            <li>
                                <a href="#workflow" className="hover:text-zinc-900 transition-colors">
                                    Workflow
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-800 font-semibold mb-3">
                            RESOURCES
                        </h4>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li>
                                <Link to="/guide" className="hover:text-zinc-900 transition-colors">
                                    User Guide
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="hover:text-zinc-900 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <a href="#faq" className="hover:text-zinc-900 transition-colors">
                                    FAQ
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-800 font-semibold mb-3">
                            COMMUNITY
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {socialLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
                                    title={link.name}
                                >
                                    {link.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-[1200px] mx-auto pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
                    <p>© {new Date().getFullYear()} DevTrack. All rights reserved.</p>
                    <p className="font-mono text-[11px]">Designed in accordance with Tuple Devtool Style Spec</p>
                </div>
            </footer>
        </div>
    );
}
