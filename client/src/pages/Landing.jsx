import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInButton } from '@clerk/clerk-react';
import {
    Github,
    Linkedin,
    Lock,
    Code,
    BarChart3,
    Rocket,
    Zap,
    Bot,
    RefreshCw,
    Flame,
    TrendingUp,
    HelpCircle,
    ChevronDown,
    CheckCircle,
    XCircle,
    X,
    ArrowRight,
    Star,
    GitFork,
    Users,
    Award,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MorphText } from '@/components/ui/morph-text';
import { LiquidMetalButton } from '@/components/ui/liquid-metal';
import { StatsCounter } from '@/components/ui/stats-counter';
import { HoverMember } from '@/components/ui/skiper6';
import { FaqAccordion } from '@/components/ui/faq-accordion';

gsap.registerPlugin(ScrollTrigger);

// Magnetic Button Component
function MagneticButton({ children, className = '', strength = 0.3 }) {
    const ref = useRef(null);

    const handleMouseMove = (e) => {
        const btn = ref.current;
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
            x: x * strength,
            y: y * strength,
            duration: 0.3,
            ease: 'power2.out',
        });
    };

    const handleMouseLeave = () => {
        gsap.to(ref.current, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)',
        });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`inline-block ${className}`}
        >
            {children}
        </div>
    );
}

// Team members
const teamMembers = [
    {
        name: 'Vikash Gupta',
        github: 'Vortex-16',
        role: 'Frontend & Backend, AI',
    },
    {
        name: 'Ayush Chowdhury',
        github: 'AyushChowdhuryCSE',
        role: 'Innovation & Concepts',
    },
    {
        name: 'Rajdeep Das',
        github: 'yourajdeep',
        role: 'UI/UX & Optimization',
    },
];

// Features - with sizes for bento grid
const features = [
    {
        title: 'Daily Coding Tracker',
        desc: 'Track every line of code you write and monitor your daily progress with detailed insights',
        icon: <Zap className="w-full h-full text-sky-400" />,
        size: 'large',
    },
    {
        title: 'AI Error Assistance',
        desc: 'Smart suggestions when stuck',
        icon: <Bot className="w-full h-full text-sky-400" />,
        size: 'small',
    },
    {
        title: 'GitHub Sync',
        desc: 'Auto-sync commits and PRs',
        icon: <RefreshCw className="w-full h-full text-sky-400" />,
        size: 'small',
    },
    {
        title: 'Streak Calendar',
        desc: 'Visualize your coding consistency with beautiful heatmaps and streak tracking',
        icon: <Flame className="w-full h-full text-sky-400" />,
        size: 'medium',
    },
    {
        title: 'Skill Growth',
        desc: 'Track skill progression',
        icon: <TrendingUp className="w-full h-full text-sky-400" />,
        size: 'small',
    },
];

// Steps
const steps = [
    {
        num: '01',
        title: 'Connect GitHub',
        desc: 'Link your account in one click',
        icon: <Lock className="w-10 h-10 text-sky-400" />,
    },
    {
        num: '02',
        title: 'Start Coding',
        desc: 'We track activity automatically',
        icon: <Code className="w-10 h-10 text-sky-400" />,
    },
    {
        num: '03',
        title: 'View Insights',
        desc: 'See beautiful analytics',
        icon: <BarChart3 className="w-10 h-10 text-sky-400" />,
    },
    {
        num: '04',
        title: 'Grow Daily',
        desc: 'Build consistency & improve',
        icon: <Rocket className="w-10 h-10 text-sky-400" />,
    },
];

// Social links
const socialLinks = [
    {
        name: 'GitHub',
        url: 'https://github.com',
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
        name: 'Alpha Coder',
        url: 'https://alphacoders-official.vercel.app',
        icon: <img src="/AlphaCoders.jpg" alt="Alpha Coders" className="w-5 h-5 rounded-full object-cover" />,
    },
    {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/company/alpha4coders/',
        icon: <Linkedin className="w-4 h-4" />,
    },
];

// Floating code lines
const codeLines = [
    'const dev = new Developer();',
    'git push origin main',
    'npm run build',
    '// Level up!',
    'export default Growth;',
    'await learn(newSkill);',
];

// Animated particles
function Particles() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(25)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-[2px] h-[2px] bg-slate-600/30 rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -150],
                        x: [0, (Math.random() - 0.5) * 50],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 4 + Math.random() * 3,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                    }}
                />
            ))}
        </div>
    );
}

// Floating code block
function FloatingCode({ code, delay, x, y, className = '' }) {
    return (
        <motion.div
            className={`absolute px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-400 backdrop-blur-sm whitespace-nowrap ${className}`}
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: [0.4, 0.8, 0.4],
                y: [0, -15, 0],
                rotate: [-1, 1, -1],
            }}
            transition={{
                duration: 5,
                repeat: Infinity,
                delay,
            }}
        >
            {code}
        </motion.div>
    );
}

// Neon text
function NeonText({ children }) {
    return <span className="text-sky-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">{children}</span>;
}

// --- Unique Animation Components ---

const CodeAnimation = ({ size, isHovered }) => (
    <div className="absolute right-4 bottom-4 w-32 h-24 pointer-events-none overflow-visible">
        {/* Moving Terminal Window */}
        <motion.div
            className="absolute bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-lg w-full h-full origin-bottom-right"
            initial={{ y: 5, rotate: 2 }}
            animate={
                isHovered
                    ? {
                          y: [5, 0, 5],
                          rotate: [2, 0, 2],
                      }
                    : { y: 5, rotate: 2 }
            }
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
            {/* Header */}
            <div className="h-5 bg-zinc-900 border-b border-zinc-800 flex items-center px-2 gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
            </div>
            {/* Body */}
            <div className="p-2 space-y-1.5 font-mono text-[8px] opacity-60">
                <div className="flex items-center gap-1">
                    <span className="text-green-400/60">➜</span>
                    <span className="text-cyan-300/60">tracking...</span>
                </div>
                {/* Progress Bars */}
                <div className="space-y-1">
                    <div className="w-full h-1 bg-slate-700/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-green-500/50"
                            animate={isHovered ? { width: ['0%', '80%', '100%'] } : { width: '0%' }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        />
                    </div>
                    <div className="w-3/4 h-1 bg-slate-700/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-cyan-500/50"
                            animate={isHovered ? { width: ['0%', '60%', '90%'] } : { width: '0%' }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                        />
                    </div>
                </div>
                <motion.div
                    className="text-slate-400/60 text-[7px]"
                    animate={isHovered ? { opacity: [0, 0.8, 0] } : { opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    src/main.jsx linked
                </motion.div>
            </div>
        </motion.div>

        {/* Scanning Line Tracker */}
        <motion.div
            className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-400/50 to-transparent"
            animate={isHovered ? { top: ['10%', '90%', '10%'], opacity: [0, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ boxShadow: '0 0 8px rgba(74, 222, 128, 0.3)' }}
        />
    </div>
);

const AIAnimation = ({ isHovered }) => (
    <div
        className={`absolute right-4 bottom-4 w-24 h-24 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-20'}`}
    >
        <div className="relative w-full h-full">
            {/* Robot Head */}
            <motion.svg viewBox="0 0 100 100" className="w-full h-full text-sky-400">
                <motion.path
                    d="M20 40 Q 20 20 50 20 Q 80 20 80 40 V 80 H 20 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <motion.circle
                    cx="35"
                    cy="50"
                    r="5"
                    fill="currentColor"
                    animate={isHovered ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.circle
                    cx="65"
                    cy="50"
                    r="5"
                    fill="currentColor"
                    animate={isHovered ? { opacity: [1, 0.2, 1] } : { opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <path d="M40 70 Q 50 80 60 70" fill="none" stroke="currentColor" strokeWidth="2" />
                {/* Antenna */}
                <line x1="50" y1="20" x2="50" y2="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="50" cy="5" r="3" fill="currentColor" />
            </motion.svg>
        </div>
    </div>
);

const GitAnimation = ({ isHovered }) => (
    <div
        className={`absolute right-4 bottom-4 w-24 h-24 flex items-center justify-center transition-opacity duration-500 ${isHovered ? 'opacity-80' : 'opacity-30'}`}
    >
        <div className="relative w-full h-full">
            {/* Sync Circle */}
            <motion.div
                className="absolute inset-2 border-2 border-sky-400 border-t-transparent border-l-transparent rounded-full"
                animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Center Git Icon */}
            <div className="absolute inset-0 flex items-center justify-center scale-75">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02a9.68 9.68 0 012.5-.34c.85.004 1.7.115 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                </svg>
            </div>
        </div>
    </div>
);

const StreakAnimation = ({ isHovered }) => {
    const [count, setCount] = useState(1);

    useEffect(() => {
        if (!isHovered) {
            setCount(1);
            return;
        }
        const interval = setInterval(() => {
            setCount((prev) => (prev < 30 ? prev + 1 : 1));
        }, 200);
        return () => clearInterval(interval);
    }, [isHovered]);

    return (
        <div
            className={`absolute right-4 bottom-4 w-28 h-28 transition-opacity duration-500 ${isHovered ? 'opacity-60' : 'opacity-20'}`}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Realistic Layered Fire */}
                <motion.div
                    className="absolute w-20 h-20 bg-red-500/30 blur-xl rounded-full translate-y-2"
                    animate={isHovered ? { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] } : { scale: 1, opacity: 0.3 }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Orange core */}
                <motion.div
                    className="absolute w-16 h-16 bg-orange-500/40 blur-md rounded-t-full rounded-b-lg"
                    animate={isHovered ? { scaleY: [1, 1.1, 1], y: [0, -5, 0] } : { scaleY: 1, y: 0 }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                />
                {/* Inner flame */}
                <motion.div
                    className="absolute w-10 h-10 bg-yellow-400/40 blur-sm rounded-t-full rounded-b-lg translate-y-2"
                    animate={isHovered ? { scale: [1, 0.9, 1], rotate: [-5, 5, -5] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                />

                {/* Changing Number - Semi transparent */}
                <div className="relative z-10 text-4xl font-black text-white/90 drop-shadow-lg">{count}</div>
            </div>
        </div>
    );
};

const GrowthAnimation = ({ isHovered }) => (
    <div
        className={`absolute bottom-6 right-6 w-24 h-20 flex items-end justify-between gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-50'}`}
    >
        {[30, 50, 40, 70, 90].map((h, i) => (
            <motion.div
                key={i}
                className="w-3 bg-gradient-to-t from-emerald-500 to-transparent rounded-t"
                initial={{ height: 0 }}
                animate={isHovered ? { height: `${h}%` } : { height: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ height: `${h + 10}%` }}
            />
        ))}
        {/* Trend Line */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            <motion.path
                d="M0 70 L 25 50 L 50 60 L 75 30 L 100 10"
                fill="none"
                stroke="#34d399" // Emerald-400
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={isHovered ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.5, delay: 0.3 }}
            />
        </svg>
    </div>
);

// Feature card - Bento grid with unique sizes
function FeatureCard({ feature, index }) {
    const [isHovered, setIsHovered] = useState(false);

    const renderAnimation = () => {
        switch (feature.title) {
            case 'Daily Coding Tracker':
                return <CodeAnimation size={feature.size} isHovered={isHovered} />;
            case 'AI Error Assistance':
                return <AIAnimation isHovered={isHovered} />;
            case 'GitHub Sync':
                return <GitAnimation isHovered={isHovered} />;
            case 'Streak Calendar':
                return <StreakAnimation isHovered={isHovered} />;
            case 'Skill Growth':
                return <GrowthAnimation isHovered={isHovered} />;
            default:
                return null;
        }
    };

    const sizeClasses = {
        large: 'md:col-span-2 md:row-span-2',
        medium: 'md:col-span-2',
        small: '',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-50px' }}
            whileHover={{ scale: 1.02, y: -5, transition: { type: 'spring', stiffness: 400, damping: 10 } }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`relative p-6 md:p-8 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 hover:border-sky-400/50 ${sizeClasses[feature.size]} transition-all duration-300 group overflow-hidden shadow-xl`}
        >
            {/* Dynamic Background Animation */}
            {renderAnimation()}

            <div className="relative z-10 h-full flex flex-col">
                {/* Icon */}
                <motion.div
                    className={`${feature.size === 'large' ? 'md:text-5xl' : 'md:text-3xl'} text-3xl mb-4 w-fit text-sky-400`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    whileHover={{ x: 10, scale: 1.1 }}
                    transition={{
                        duration: 0.3,
                        type: 'spring',
                        stiffness: 200,
                    }}
                    viewport={{ once: true }}
                >
                    {feature.icon}
                </motion.div>
                <h3
                    className={`${feature.size === 'large' ? 'md:text-2xl' : 'md:text-lg'} text-lg font-bold text-white mb-2`}
                >
                    {feature.title}
                </h3>
                <p className={`${feature.size === 'large' ? 'md:text-base' : 'md:text-sm'} text-sm text-slate-400`}>
                    {feature.desc}
                </p>
            </div>
        </motion.div>
    );
}

// DevTrack Social View Showcase component matching DevTrack Social View.jpg
function DevTrackSocialShowcase() {
    const [activeTab, setActiveTab] = useState(0);

    const featureItems = [
        {
            title: 'AI-POWERED DEVELOPER WORKSPACE',
            desc: 'Manage coding goals, tasks, streaks, and project flow in one unified dashboard.',
            icon: <Bot className="w-5 h-5 text-sky-400" />,
        },
        {
            title: 'REAL-TIME TEAM SYNC',
            desc: 'Collaborate with your squad through live progress tracking, updates, and smart notifications.',
            icon: <Users className="w-5 h-5 text-sky-400" />,
        },
        {
            title: 'DEVELOPER PRODUCTIVITY ENGINE',
            desc: 'Organize projects, monitor progress, and maintain focus with a streamlined workflow system.',
            icon: <Zap className="w-5 h-5 text-sky-400" />,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full rounded-3xl p-6 md:p-8 bg-zinc-950 border border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden group hover:border-sky-500/40 transition-all duration-500"
        >
            {/* Sleek metallic top bar with DEVTRACK emblem */}
            <div className="flex flex-col items-center justify-center border-b border-zinc-800/80 pb-6 mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-zinc-700 flex items-center justify-center shadow-lg">
                        <span
                            className="font-extrabold text-white text-sm"
                            style={{ fontFamily: '"Orbitron", sans-serif' }}
                        >
                            DT
                        </span>
                    </div>
                    <span
                        className="text-2xl md:text-3xl font-extrabold tracking-wider text-white"
                        style={{ fontFamily: '"Orbitron", sans-serif' }}
                    >
                        DEVTRACK
                    </span>
                </div>
                <p
                    className="text-sky-400 text-xs font-bold tracking-widest text-center uppercase max-w-md mt-1 leading-relaxed"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                    "DEVTRACK TRANSFORMS CHAOTIC STUDENT PROJECTS INTO PRODUCTION-LEVEL DEVELOPMENT WORKFLOWS."
                </p>
            </div>

            {/* 3 Feature Boxes */}
            <div className="space-y-4">
                {featureItems.map((item, idx) => {
                    const isActive = activeTab === idx;
                    return (
                        <motion.div
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            onMouseEnter={() => setActiveTab(idx)}
                            className={`p-4 md:p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                                isActive
                                    ? 'bg-zinc-900/90 border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                                        isActive ? 'bg-sky-400/20 text-sky-400' : 'bg-zinc-800 text-zinc-400'
                                    }`}
                                >
                                    {item.icon}
                                </div>
                                <div>
                                    <h4
                                        className="text-xs md:text-sm font-bold text-white tracking-wider mb-1 flex items-center gap-2"
                                        style={{ fontFamily: '"Orbitron", sans-serif' }}
                                    >
                                        {item.title}
                                    </h4>
                                    <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Card Footer Banner */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span
                    className="text-sky-400 font-bold tracking-wider"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                    Build Faster. Track Smarter. Ship Like a Team.
                </span>
                <span className="hidden sm:inline font-mono">v2.0 • Active Squad Sync</span>
            </div>
        </motion.div>
    );
}

// Team card - More Unique Design
const cardColors = [
    { gradient: 'from-cyan-500 to-blue-500', glow: 'cyan' },
    { gradient: 'from-purple-500 to-pink-500', glow: 'purple' },
    { gradient: 'from-orange-500 to-red-500', glow: 'orange' },
];

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMedia = () => setIsMobile(window.innerWidth < 768);
        checkMedia();
        window.addEventListener('resize', checkMedia);
        return () => window.removeEventListener('resize', checkMedia);
    }, []);
    return isMobile;
};

function TeamCard({ member, index }) {
    const color = cardColors[index % cardColors.length];
    const isMobile = useIsMobile();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-50px' }}
            whileHover={
                !isMobile ? { y: -12, scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } } : {}
            }
            className="group perspective-1000 w-full"
        >
            {/* Card with gradient border */}
            <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${color.gradient} overflow-hidden h-full`}>
                {/* Inner card */}
                {/* Inner card */}
                <div className="relative p-3 md:p-4 xl:p-6 rounded-2xl bg-black backdrop-blur-xl h-full min-h-[220px] md:min-h-[320px] flex flex-col justify-center">
                    {/* Glow effect on hover */}
                    <div
                        className={`absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}
                    />

                    {/* Avatar */}
                    <div className="relative mb-4">
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${color.gradient} blur-xl opacity-30 group-hover:opacity-60 transition-opacity scale-75`}
                        />
                        <motion.img
                            src={`https://github.com/${member.github}.png`}
                            alt={member.name}
                            className={`relative w-20 h-20 mx-auto rounded-2xl border-2 border-white/20 group-hover:border-white/50 transition-colors duration-300 shadow-lg`}
                            whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2, ease: 'easeOut' } }}
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    member.name
                                )}&background=000&color=22d3ee&size=200`;
                            }}
                        />
                    </div>

                    {/* Info */}
                    <div className="text-center relative z-10">
                        <h3
                            className="font-bold text-white text-xs sm:text-sm md:text-sm xl:text-lg mb-1"
                            title={member.name}
                        >
                            {member.name}
                        </h3>
                        <p
                            className={`text-xs font-medium mb-3 bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}
                        >
                            {member.role}
                        </p>
                        <a
                            href={`https://github.com/${member.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-1 text-[10px] md:text-xs text-slate-500 hover:text-white transition-colors group/link w-full px-1"
                        >
                            <svg className="w-3.5 h-3.5 mb-1" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    fillRule="evenodd"
                                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.42 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="group-hover/link:underline break-all text-center">@{member.github}</span>
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const faqs = [
    {
        q: 'How does DevTrack monitor my activity?',
        a: 'We integrate directly with the GitHub API to monitor your commits, PRs, and repository interactions. All data is synced in real-time to give you up-to-the-minute insights.',
    },
    {
        q: 'Is my source code secure?',
        a: 'Yes. We only access metadata regarding your contributions (line counts, language types, timestamps). We never read, store, or share your actual source code contents.',
    },
    {
        q: 'What is the GitHub DNA Score?',
        a: "It's a proprietary metric that analyzes your consistency, impact, and code authority. It helps you understand your professional growth compared to global standards.",
    },
    {
        q: 'Can I use DevTrack for free?',
        a: 'DevTrack is currently free for individual developers. We aim to help every coder build a consistent habit and a professional portfolio.',
    },
];

function FAQ() {
    const [open, setOpen] = useState(0);

    return (
        <section className="py-32 px-6 bg-gradient-to-b from-transparent to-black">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <p className="text-cyan-400 text-sm font-semibold mb-4 tracking-widest uppercase">Answers</p>
                    <h2
                        className="text-4xl md:text-6xl font-black text-white"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                        Common <NeonText color="cyan">Questions</NeonText>
                    </h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            className="group rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-colors hover:border-cyan-500/30"
                        >
                            <button
                                onClick={() => setOpen(open === i ? -1 : i)}
                                className="w-full px-6 py-6 flex items-center justify-between text-left"
                            >
                                <span className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                                    {faq.q}
                                </span>
                                <motion.div animate={{ rotate: open === i ? 180 : 0 }} className="text-cyan-500">
                                    <ChevronDown size={20} />
                                </motion.div>
                            </button>
                            <AnimatePresence>
                                {open === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-6 text-slate-400 leading-relaxed text-sm">{faq.a}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Landing() {
    const heroRef = useRef(null);
    const [mounted, setMounted] = useState(false);
    const location = useLocation();
    const [showExpiredToast, setShowExpiredToast] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('expired') === 'true') {
            setShowExpiredToast(true);
            // Remove query param from url without reloading
            window.history.replaceState({}, '', '/');
        }
    }, [location]);

    useEffect(() => {
        setMounted(true);
        const ctx = gsap.context(() => {
            // CTA & Hero Entrance Animation
            const ctaEl = document.querySelector('.hero-cta');
            if (ctaEl) {
                gsap.fromTo('.hero-cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.5 });
            }
        }, heroRef);

        return () => ctx.revert();
    }, []);

    const title = 'DEVTRACK';

    return (
        <div className="min-h-screen bg-[#000000] text-zinc-100 overflow-x-hidden font-sans">
            {showExpiredToast && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 z-[100] max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 backdrop-blur-xl flex gap-3 items-start"
                    >
                        <div className="bg-red-500/10 p-2 rounded-full shrink-0">
                            <XCircle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm">Session Expired</h4>
                            <p className="text-zinc-400 text-xs mt-1">
                                Please sign in again to continue using DevTrack.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowExpiredToast(false)}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </AnimatePresence>
            )}

            {mounted && <Particles />}

            {/* Hero Section matching DevTrack Social View.jpg */}
            <section
                ref={heroRef}
                className="relative min-h-[90vh] flex flex-col justify-center px-6 pt-24 pb-16 max-w-7xl mx-auto"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left Column: Headline, CTAs & 5 Feature Pills */}
                    <div className="lg:col-span-6 flex flex-col items-start text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="mb-6"
                        >
                            <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-sky-400 text-xs font-semibold backdrop-blur-sm flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" /> Developer Productivity Tool
                            </div>
                        </motion.div>

                        {/* Headline */}
                        <div className="mb-4">
                            <h1
                                className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight"
                                style={{ fontFamily: '"Orbitron", sans-serif' }}
                            >
                                Build Faster. <br />
                                Track Smarter. <br />
                                <span className="text-sky-400">Ship Like a Team.</span>
                            </h1>
                        </div>

                        {/* Subtitle */}
                        <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-lg mb-8">
                            DevTrack is your AI-powered developer hub to track progress, analyze projects, and
                            accelerate growth.
                        </p>

                        {/* CTAs */}
                        <div className="hero-cta flex flex-wrap gap-4 items-center mb-10">
                            <SignInButton mode="modal">
                                <LiquidMetalButton
                                    icon={<ArrowRight className="w-5 h-5 text-sky-400" />}
                                    metalConfig={{
                                        colorBack: '#0f172a',
                                        colorTint: '#38bdf8',
                                        speed: 0.5,
                                        distortion: 0.15,
                                    }}
                                    size="lg"
                                >
                                    Start Tracking Free
                                </LiquidMetalButton>
                            </SignInButton>

                            <a href="#features">
                                <LiquidMetalButton
                                    icon={<Rocket className="w-5 h-5 text-sky-400" />}
                                    metalConfig={{
                                        colorBack: '#0f172a',
                                        colorTint: '#38bdf8',
                                        speed: 0.4,
                                        distortion: 0.15,
                                    }}
                                    size="lg"
                                >
                                    Explore Features
                                </LiquidMetalButton>
                            </a>
                        </div>

                        {/* 5 Feature Pills from DevTrack Social View banner */}
                        <div className="pt-6 border-t border-zinc-900 grid grid-cols-5 gap-2 w-full">
                            {[
                                { label: 'Track Progress', icon: <TrendingUp className="w-4 h-4 text-sky-400" /> },
                                { label: 'GitHub Sync', icon: <Github className="w-4 h-4 text-sky-400" /> },
                                { label: 'AI Insights', icon: <Bot className="w-4 h-4 text-sky-400" /> },
                                { label: 'Next Steps', icon: <CheckCircle className="w-4 h-4 text-sky-400" /> },
                                { label: 'Consistency', icon: <Flame className="w-4 h-4 text-sky-400" /> },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col items-center text-center p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-sky-400/40 transition-all"
                                >
                                    <div className="p-1.5 rounded-lg bg-zinc-800 mb-1">{item.icon}</div>
                                    <span className="text-[10px] text-zinc-400 font-medium leading-tight">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: DevTrack Social View Card Showcase */}
                    <div className="lg:col-span-6 w-full">
                        <DevTrackSocialShowcase />
                    </div>
                </div>

                {/* Live Community & Stats Counters Bar */}
                <div className="w-full max-w-6xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl flex flex-col items-center justify-center text-center group hover:border-sky-400/50 transition-colors">
                        <div className="flex items-center gap-2 text-sky-400 mb-1">
                            <Star className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                                GitHub Stars
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white font-mono">
                            <StatsCounter value={12500} suffix="+" duration={2} />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl flex flex-col items-center justify-center text-center group hover:border-sky-400/50 transition-colors">
                        <div className="flex items-center gap-2 text-sky-400 mb-1">
                            <GitFork className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                                Repo Clones
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white font-mono">
                            <StatsCounter value={48000} suffix="+" duration={2.2} />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl flex flex-col items-center justify-center text-center group hover:border-sky-400/50 transition-colors">
                        <div className="flex items-center gap-2 text-sky-400 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                                Active Devs
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white font-mono">
                            <StatsCounter value={15200} suffix="+" duration={2} />
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl flex flex-col items-center justify-center text-center group hover:border-sky-400/50 transition-colors">
                        <div className="flex items-center gap-2 text-sky-400 mb-1">
                            <Award className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                                Satisfaction
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white font-mono">
                            <StatsCounter value={99.6} suffix="%" decimals={1} duration={2.5} />
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-sky-400 text-xs font-bold mb-3 tracking-widest uppercase"
                        >
                            GETTING STARTED
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-white"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                            How It <NeonText>Works</NeonText>
                        </motion.h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {steps.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                viewport={{ once: true, margin: '-50px' }}
                                whileHover={{
                                    scale: 1.02,
                                    y: -5,
                                    transition: { type: 'spring', stiffness: 400, damping: 10 },
                                }}
                                className="relative p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-sky-400/50 text-center group transition-colors duration-300 shadow-xl"
                            >
                                <motion.div className="text-4xl mb-4 flex justify-center" whileHover={{ scale: 1.1 }}>
                                    {item.icon}
                                </motion.div>
                                <div className="text-xs text-sky-400 font-bold mb-2 tracking-wider font-mono">
                                    STEP {item.num}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-zinc-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-sky-400 text-xs font-bold mb-3 tracking-widest uppercase"
                        >
                            POWERFUL FEATURES
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-white"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                            Everything You <NeonText>Need</NeonText>
                        </motion.h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} feature={feature} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Team - Skiper6 Hover Member Component */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-sky-400 text-xs font-bold mb-3 tracking-widest uppercase"
                        >
                            THE TEAM
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-4xl md:text-5xl font-bold text-white"
                            style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                            Meet The <NeonText>Crew</NeonText>
                        </motion.h2>
                    </div>

                    <HoverMember teamMembers={teamMembers} />
                </div>
            </section>

            {/* FAQ Accordion Component */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <FaqAccordion
                        items={[
                            {
                                question: 'How does DevTrack monitor my coding activity?',
                                answer: 'We integrate directly with the GitHub API to monitor your commits, pull requests, streaks, and repository interactions in real-time.',
                            },
                            {
                                question: 'Is my source code secure?',
                                answer: 'Yes. We only access contribution metadata (commit frequency, line counts, language percentages). We never read, store, or share your actual code contents.',
                            },
                            {
                                question: 'What is the GitHub DNA Score?',
                                answer: "It's a proprietary metric that evaluates your coding consistency, impact, activity depth, and project authority to track professional growth.",
                            },
                            {
                                question: 'Can I use DevTrack for free?',
                                answer: 'Yes! DevTrack is free for developers and students. We aim to help every coder build a consistent habit and portfolio.',
                            },
                            {
                                question: 'How do team projects and squads work?',
                                answer: 'Teams can sync shared goals, track joint commits, assign features, and collaborate with real-time progress notifications.',
                            },
                        ]}
                        title="DevTrack FAQs"
                    />
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-5xl mx-auto text-center"
                >
                    <h2
                        className="text-[6vw] md:text-5xl lg:text-6xl font-black text-white mb-8 whitespace-nowrap"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                        Ready to <NeonText>Level Up</NeonText>?
                    </h2>
                    <p className="text-lg text-slate-400 mb-12">
                        Join developers building consistency and tracking their growth.
                    </p>
                    <div className="flex justify-center">
                        <SignInButton mode="modal">
                            <LiquidMetalButton
                                icon={<ArrowRight className="w-6 h-6 text-sky-400" />}
                                metalConfig={{
                                    colorBack: '#0f172a',
                                    colorTint: '#38bdf8',
                                    speed: 0.5,
                                    distortion: 0.15,
                                }}
                                size="lg"
                            >
                                Start For Free Now
                            </LiquidMetalButton>
                        </SignInButton>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-slate-800">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap justify-center gap-4 mb-10">
                        {socialLinks.map((link, i) => (
                            <motion.a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, y: -2 }}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-400/50 transition-colors text-sm text-slate-400 hover:text-white flex items-center gap-2"
                            >
                                {link.icon} {link.name}
                            </motion.a>
                        ))}
                    </div>
                    <div className="text-center">
                        <div
                            className="text-3xl font-black tracking-wider mb-3 text-white"
                            style={{ fontFamily: '"Orbitron", sans-serif' }}
                        >
                            DEVTRACK
                        </div>
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} <span className="text-sky-400 font-semibold">TEKKUZEN</span>.
                            All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
