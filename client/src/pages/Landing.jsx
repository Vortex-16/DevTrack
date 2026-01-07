import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { Github, Linkedin, Lock, Code, BarChart3, Rocket, Zap, Bot, RefreshCw, Flame, TrendingUp, HelpCircle, ChevronDown } from "lucide-react";


import { motion, useInView, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Magnetic Button Component
function MagneticButton({ children, className = "", strength = 0.3 }) {
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
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
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
    name: "Vikash Gupta",
    github: "Vortex-16",
    role: "Frontend & Backend, AI"
  },
  {
    name: "Ayush Chowdhury",
    github: "AyushChowdhuryCSE",
    role: "Innovation & Concepts",
  },
  {
    name: "Rajdeep Das",
    github: "yourajdeep",
    role: "UI/UX & Optimization"
  },
];

// Features - with sizes for bento grid
const features = [
  {
    title: "Daily Coding Tracker",
    desc: "Track every line of code you write and monitor your daily progress with detailed insights",
    icon: <Zap className="w-full h-full" />,
    color: "cyan",
    size: "large",
  },
  {
    title: "AI Error Assistance",
    desc: "Smart suggestions when stuck",
    icon: <Bot className="w-full h-full" />,
    color: "purple",
    size: "small",
  },
  {
    title: "GitHub Sync",
    desc: "Auto-sync commits and PRs",
    icon: <RefreshCw className="w-full h-full" />,
    color: "blue",
    size: "small",
  },
  {
    title: "Streak Calendar",
    desc: "Visualize your coding consistency with beautiful heatmaps and streak tracking",
    icon: <Flame className="w-full h-full" />,
    color: "orange",
    size: "medium",
  },
  {
    title: "Skill Growth",
    desc: "Track skill progression",
    icon: <TrendingUp className="w-full h-full" />,
    color: "green",
    size: "small",
  },
];

// Steps
const steps = [
  {
    num: "01",
    title: "Connect GitHub",
    desc: "Link your account in one click",
    icon: <Lock className="w-10 h-10 text-cyan-400" />,
  },
  {
    num: "02",
    title: "Start Coding",
    desc: "We track activity automatically",
    icon: <Code className="w-10 h-10 text-purple-400" />,
  },
  {
    num: "03",
    title: "View Insights",
    desc: "See beautiful analytics",
    icon: <BarChart3 className="w-10 h-10 text-blue-400" />,
  },
  {
    num: "04",
    title: "Grow Daily",
    desc: "Build consistency & improve",
    icon: <Rocket className="w-10 h-10 text-emerald-400" />,
  },
];

// Social links
const socialLinks = [
  {
    name: "GitHub",
    url: "https://github.com",
    icon: <Github className="w-4 h-4" />
  },
  {
    name: "Discord",
    url: "https://discord.gg/5Jyt4sQPR",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
      </svg>
    )
  },
  {
    name: "Alpha Coder",
    url: "https://alphacoders-official.vercel.app",
    icon: <img src="/AlphaCoders.jpg" alt="Alpha Coders" className="w-5 h-5 rounded-full object-cover" />,
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/alpha4coders/",
    icon: <Linkedin className="w-4 h-4" />,
  },
];


// Floating code lines
const codeLines = [
  "const dev = new Developer();",
  "git push origin main",
  "npm run build",
  "// Level up!",
  "export default Growth;",
  "await learn(newSkill);",
];

// Animated particles
function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] bg-cyan-400/40 rounded-full"
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

// Light streak effect
function LightStreaks() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute top-1/4 -left-20 w-[400px] h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rotate-[30deg]"
        animate={{ x: [0, window.innerWidth + 400], opacity: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
      />
      <motion.div
        className="absolute top-1/2 -right-20 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent -rotate-[20deg]"
        animate={{ x: [0, -(window.innerWidth + 300)], opacity: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, delay: 2 }}
      />
    </div>
  );
}

// Floating code block
// Floating code block
function FloatingCode({ code, delay, x, y, className = '' }) {
  return (
    <motion.div
      className={`absolute px-3 py-1.5 rounded-lg bg-black/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 backdrop-blur-sm whitespace-nowrap ${className}`}
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
function NeonText({ children, color = "cyan" }) {
  const colors = {
    cyan: "text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]",
    purple: "text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.6)]",
    blue: "text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]",
  };
  return <span className={colors[color]}>{children}</span>;
}

// --- Unique Animation Components ---

const CodeAnimation = ({ size }) => (
  <div className="absolute right-4 bottom-4 w-32 h-24 pointer-events-none overflow-visible">
    {/* Moving Terminal Window */}
    <motion.div
      className="absolute bg-slate-900/5 border border-slate-700/20 rounded-lg overflow-hidden shadow-lg w-full h-full origin-bottom-right"
      initial={{ y: 5, rotate: 2 }}
      animate={{
        y: [5, 0, 5],
        rotate: [2, 0, 2],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Header */}
      <div className="h-5 bg-slate-800/20 flex items-center px-2 gap-1.5">
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
            <motion.div className="h-full bg-green-500/50" animate={{ width: ["0%", "80%", "100%"] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
          </div>
          <div className="w-3/4 h-1 bg-slate-700/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-cyan-500/50" animate={{ width: ["0%", "60%", "90%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }} />
          </div>
        </div>
        <motion.div
          className="text-slate-400/60 text-[7px]"
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          src/main.jsx linked
        </motion.div>
      </div>
    </motion.div>

    {/* Scanning Line Tracker */}
    <motion.div
      className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-0 group-hover:opacity-100"
      animate={{ top: ["10%", "90%", "10%"], opacity: [0, 1, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      style={{ boxShadow: "0 0 8px rgba(74, 222, 128, 0.3)" }}
    />
  </div>
);

const AIAnimation = () => (
  <div className="absolute right-4 bottom-4 w-24 h-24 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity duration-500">
    <div className="relative w-full h-full">
      {/* Robot Head */}
      <motion.svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
        <motion.path
          d="M20 40 Q 20 20 50 20 Q 80 20 80 40 V 80 H 20 Z"
          fill="none" stroke="currentColor" strokeWidth="2"
        />
        <motion.circle cx="35" cy="50" r="5" fill="currentColor" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        <motion.circle cx="65" cy="50" r="5" fill="currentColor" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
        <path d="M40 70 Q 50 80 60 70" fill="none" stroke="currentColor" strokeWidth="2" />
        {/* Antenna */}
        <line x1="50" y1="20" x2="50" y2="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="50" cy="5" r="3" fill="currentColor" />
      </motion.svg>

      {/* Chat Bubble */}
      <motion.div
        className="absolute -top-2 -right-2 bg-white text-black text-[6px] font-bold px-1.5 py-0.5 rounded-t-lg rounded-br-lg rounded-bl-none shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
      >
        <div className="flex gap-0.5">
          <motion.div className="w-0.5 h-0.5 bg-black rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
          <motion.div className="w-0.5 h-0.5 bg-black rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }} />
          <motion.div className="w-0.5 h-0.5 bg-black rounded-full" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
        </div>
      </motion.div>
    </div>
  </div>
);

const GitAnimation = () => (
  <div className="absolute right-4 bottom-4 w-24 h-24 flex items-center justify-center opacity-30 group-hover:opacity-80 transition-opacity duration-500">
    <div className="relative w-full h-full">
      {/* Rotating Sync Circle */}
      <motion.div
        className="absolute inset-2 border-2 border-t-cyan-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      {/* Center Git Icon */}
      <div className="absolute inset-0 flex items-center justify-center scale-75">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02a9.68 9.68 0 012.5-.34c.85.004 1.7.115 2.5.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
      </div>
      {/* Particles exchanging */}
      <motion.div
        className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full"
        animate={{ y: [0, 80, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full"
        animate={{ y: [0, -80, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  </div>
);



const StreakAnimation = () => {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev < 30 ? prev + 1 : 1);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute right-4 bottom-4 w-28 h-28 opacity-20 group-hover:opacity-60 transition-opacity duration-500">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Realistic Layered Fire */}
        <motion.div
          className="absolute w-20 h-20 bg-red-500/30 blur-xl rounded-full translate-y-2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {/* Orange core */}
        <motion.div
          className="absolute w-16 h-16 bg-orange-500/40 blur-md rounded-t-full rounded-b-lg"
          animate={{ scaleY: [1, 1.1, 1], y: [0, -5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        {/* Inner flame */}
        <motion.div
          className="absolute w-10 h-10 bg-yellow-400/40 blur-sm rounded-t-full rounded-b-lg translate-y-2"
          animate={{ scale: [1, 0.9, 1], rotate: [-5, 5, -5] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />

        {/* Changing Number - Semi transparent */}
        <div className="relative z-10 text-4xl font-black text-white/90 drop-shadow-lg">
          {count}
        </div>
      </div>
    </div>
  );
};

const GrowthAnimation = () => (
  <div className="absolute bottom-6 right-6 w-24 h-20 flex items-end justify-between gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
    {[30, 50, 40, 70, 90].map((h, i) => (
      <motion.div
        key={i}
        className="w-3 bg-gradient-to-t from-emerald-500 to-transparent rounded-t"
        initial={{ height: 0 }}
        whileInView={{ height: `${h}%` }}
        transition={{ duration: 1, delay: i * 0.1 }}
        viewport={{ once: true }}
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
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
    </svg>
  </div>
);


// Feature card - Bento grid with unique sizes
function FeatureCard({ feature, index }) {
  const gradients = {
    cyan: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    purple: "from-purple-500/20 via-purple-500/5 to-transparent",
    blue: "from-blue-500/20 via-blue-500/5 to-transparent",
    orange: "from-orange-500/20 via-orange-500/5 to-transparent",
    green: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    pink: "from-pink-500/20 via-pink-500/5 to-transparent",
  };

  const borderColors = {
    cyan: "border-cyan-500/30 hover:border-cyan-500/70 hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]",
    purple:
      "border-purple-500/30 hover:border-purple-500/70 hover:shadow-[0_0_40px_rgba(192,132,252,0.2)]",
    blue: "border-blue-500/30 hover:border-blue-500/70 hover:shadow-[0_0_40px_rgba(96,165,250,0.2)]",
    orange:
      "border-orange-500/30 hover:border-orange-500/70 hover:shadow-[0_0_40px_rgba(251,146,60,0.2)]",
    green:
      "border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_0_40px_rgba(52,211,153,0.2)]",
    pink: "border-pink-500/30 hover:border-pink-500/70 hover:shadow-[0_0_40px_rgba(244,114,182,0.2)]",
  };

  const sizeClasses = {
    large: "md:col-span-2 md:row-span-2",
    medium: "md:col-span-2",
    small: "",
  };

  const renderAnimation = () => {
    switch (feature.title) {
      case "Daily Coding Tracker": return <CodeAnimation size={feature.size} />;
      case "AI Error Assistance": return <AIAnimation />;
      case "GitHub Sync": return <GitAnimation />;
      case "Streak Calendar": return <StreakAnimation />;
      case "Skill Growth": return <GrowthAnimation />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 400, damping: 10 } }}
      className={`relative p-6 md:p-8 rounded-2xl bg-gradient-to-br ${gradients[feature.color]
        } backdrop-blur-xl border ${borderColors[feature.color]} ${sizeClasses[feature.size]
        } transition-colors duration-300 group overflow-hidden`}
    >
      {/* Dynamic Background Animation */}
      {renderAnimation()}

      {/* Glow overlay */}
      <motion.div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 h-full flex flex-col">
        {/* Icon */}
        <motion.div
          className={`${feature.size === "large" ? "md:text-6xl" : "md:text-4xl"
            } text-4xl mb-4 w-fit`}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          whileHover={{ x: 15, scale: 1.1 }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 200,
          }}
          viewport={{ once: true }}
        >
          {feature.icon}
        </motion.div>
        <h3
          className={`${feature.size === "large" ? "md:text-2xl" : "md:text-lg"
            } text-lg font-bold text-white mb-2`}
        >
          {feature.title}
        </h3>
        <p
          className={`${feature.size === "large" ? "md:text-base" : "md:text-sm"
            } text-sm text-slate-400`}
        >
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

// Dashboard mockup
function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
      className="relative mt-20 mx-auto max-w-5xl w-full perspective-1000"
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-[80px] scale-110" />

      {/* Dashboard */}
      <div className="relative rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-500/10">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/50">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
          <span className="ml-4 text-xs text-slate-500 font-mono">
            devtrack://dashboard
          </span>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stats */}
          {[
            {
              label: "Current Streak",
              value: "47",
              unit: "days",
              color: "cyan",
              change: "+12%",
            },
            {
              label: "Total Commits",
              value: "1,247",
              unit: "",
              color: "purple",
              change: "+89",
            },
            {
              label: "Skills Tracked",
              value: "12",
              unit: "skills",
              color: "blue",
              change: "React, Node...",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className={`p-4 rounded-xl bg-gradient-to-br from-${stat.color}-500/10 to-transparent border border-${stat.color}-500/30`}
              animate={{
                boxShadow: [
                  `0 0 20px rgba(34,211,238,0)`,
                  `0 0 25px rgba(34,211,238,0.1)`,
                  `0 0 20px rgba(34,211,238,0)`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <div className={`text-xs text-${stat.color}-400 mb-1`}>
                {stat.label}
              </div>
              <div className="text-lg md:text-2xl font-black text-white">
                {stat.value}{" "}
                <span className="text-sm font-normal text-slate-500">
                  {stat.unit}
                </span>
              </div>
              <div className="text-xs text-green-400 mt-1">{stat.change}</div>
            </motion.div>
          ))}

          {/* Chart */}
          <div className="col-span-1 md:col-span-2 p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="text-xs text-slate-500 mb-3">Weekly Activity</div>
            <div className="flex justify-between items-end h-24 gap-2">
              {[
                { h: 35, d: "Mon" },
                { h: 55, d: "Tue" },
                { h: 45, d: "Wed" },
                { h: 75, d: "Thu" },
                { h: 60, d: "Fri" },
                { h: 85, d: "Sat" },
                { h: 70, d: "Sun" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-2"
                >
                  <motion.div
                    className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-purple-500"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${item.h}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                    viewport={{ once: true }}
                  />
                  <span className="text-[10px] text-slate-600">{item.d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div className="col-span-1 p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="text-xs text-slate-500 mb-3">30-Day Streak</div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(28)].map((_, i) => {
                const intensity = Math.random();
                return (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        intensity > 0.7
                          ? "rgb(34 211 238)"
                          : intensity > 0.4
                            ? "rgb(34 211 238 / 0.5)"
                            : "rgb(34 211 238 / 0.15)",
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1 + i * 0.02 }}
                    viewport={{ once: true }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating code */}
      {/* Floating code */}
      {/* Floating code */}
      <FloatingCode
        code={codeLines[0]}
        delay={0}
        className="right-[2%] top-[32%] md:left-[80%] md:top-[18%] md:right-auto"
      />
      <FloatingCode
        code={codeLines[1]}
        delay={1}
        className="left-[5%] top-[65%] md:left-[5%] md:right-auto md:top-[75%] lg:left-[-10%] lg:right-auto lg:top-[70%]"
      />
      <FloatingCode
        code={codeLines[2]}
        delay={2}
        className="right-[5%] bottom-[5%] md:left-[85%] md:top-[80%] md:bottom-auto md:right-auto"
      />
    </motion.div>
  );
}

// Team card - More Unique Design
const cardColors = [
  { gradient: "from-cyan-500 to-blue-500", glow: "cyan" },
  { gradient: "from-purple-500 to-pink-500", glow: "purple" },
  { gradient: "from-orange-500 to-red-500", glow: "orange" },
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMedia = () => setIsMobile(window.innerWidth < 768);
    checkMedia();
    window.addEventListener("resize", checkMedia);
    return () => window.removeEventListener("resize", checkMedia);
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={!isMobile ? { y: -12, scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } } : {}}
      className="group perspective-1000 w-full"
    >
      {/* Card with gradient border */}
      <div
        className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${color.gradient} overflow-hidden h-full`}
      >
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
              whileHover={{ scale: 1.1, rotate: 5, transition: { duration: 0.2, ease: "easeOut" } }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  member.name
                )}&background=000&color=22d3ee&size=200`;
              }}
            />
          </div>

          {/* Info */}
          <div className="text-center relative z-10">
            <h3 className="font-bold text-white text-xs sm:text-sm md:text-sm xl:text-lg mb-1" title={member.name}>{member.name}</h3>
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
              <svg
                className="w-3.5 h-3.5 mb-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.42 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="group-hover/link:underline break-all text-center">
                @{member.github}
              </span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const faqs = [
  {
    q: "How does DevTrack monitor my activity?",
    a: "We integrate directly with the GitHub API to monitor your commits, PRs, and repository interactions. All data is synced in real-time to give you up-to-the-minute insights."
  },
  {
    q: "Is my source code secure?",
    a: "Yes. We only access metadata regarding your contributions (line counts, language types, timestamps). We never read, store, or share your actual source code contents."
  },
  {
    q: "What is the GitHub DNA Score?",
    a: "It's a proprietary metric that analyzes your consistency, impact, and code authority. It helps you understand your professional growth compared to global standards."
  },
  {
    q: "Can I use DevTrack for free?",
    a: "DevTrack is currently free for individual developers. We aim to help every coder build a consistent habit and a professional portfolio."
  }
];

function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-transparent to-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-cyan-400 text-sm font-semibold mb-4 tracking-widest uppercase">Answers</p>
          <h2 className="text-4xl md:text-6xl font-black text-white" style={{ fontFamily: "Syne, sans-serif" }}>
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
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  className="text-cyan-500"
                >
                  <ChevronDown size={20} />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-slate-400 leading-relaxed text-sm">
                      {faq.a}
                    </div>
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

  useEffect(() => {
    setMounted(true);
    const ctx = gsap.context(() => {
      // Giant title animation
      gsap.fromTo(
        ".hero-letter",
        { opacity: 0, y: 100, rotateY: -90 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          duration: 1,
          stagger: 0.05,
          ease: "power4.out",
          delay: 0.3,
        }
      );

      // Tagline
      gsap.fromTo(
        ".hero-tagline",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1 }
      );

      // Subtitle
      gsap.fromTo(
        ".hero-sub",
        { opacity: 0 },
        { opacity: 1, duration: 0.6, delay: 1.3 }
      );

      // CTA
      gsap.fromTo(
        ".hero-cta",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 1.5 }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const title = "DEVTRACK";

  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      {mounted && <Particles />}
      {mounted && <LightStreaks />}

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-blue-600/5 rounded-full blur-[150px]" />
      </div>

      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium backdrop-blur-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> Developer Productivity Tool
          </div>
        </motion.div>

        {/* GIANT Title - Using Syne font */}
        <h1
          className="text-[9vw] md:text-[10vw] lg:text-[8vw] font-black leading-[0.85] tracking-tighter text-center"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          {title.split("").map((char, i) => (
            <span
              key={i}
              className="hero-letter inline-block bg-gradient-to-b from-white via-slate-200 to-slate-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]"
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Tagline */}
        <motion.p
          className="hero-tagline mt-6 text-2xl md:text-3xl font-semibold text-center"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          <NeonText color="cyan">Track.</NeonText>{" "}
          <NeonText color="purple">Code.</NeonText>{" "}
          <NeonText color="blue">Improve.</NeonText>
        </motion.p>

        {/* Subtitle */}
        <p className="hero-sub mt-4 text-lg text-slate-500 text-center max-w-xl">
          Track your coding activity, progress, and consistency — <br />
          helping you grow every single day.
        </p>

        {/* CTA */}
        <div className="hero-cta mt-10 flex flex-col sm:flex-row gap-4">
          <MagneticButton strength={0.1}>
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-10 py-4 rounded-xl font-bold text-lg overflow-hidden group"
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500" />
                <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                <span className="relative z-10 text-white flex items-center gap-2">
                  Start Tracking
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>
            </SignInButton>
          </MagneticButton>

          <MagneticButton strength={0.1}>
            <motion.a
              href="#features"
              whileHover={{ scale: 1.01 }}
              className="px-10 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 hover:border-white/40 transition-all text-center block"
            >
              Explore Features
            </motion.a>
          </MagneticButton>
        </div>

        {/* Dashboard */}
        <DashboardMockup />

        {/* Scroll indicator */}
        <motion.div
          className="mt-16 mb-8 relative flex justify-center w-full"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2">
            <motion.div
              className="w-1 h-2 bg-cyan-500 rounded-full"
              animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-cyan-400 text-sm font-semibold mb-4 tracking-widest"
            >
              GETTING STARTED
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-white"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              How It <NeonText color="cyan">Works</NeonText>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ scale: 1.02, y: -5, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                className="relative p-6 rounded-2xl bg-black/60 backdrop-blur border border-white/10 hover:border-cyan-500/50 text-center group transition-colors duration-300"
              >
                <motion.div
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  {item.icon}
                </motion.div>
                <div className="text-xs text-cyan-400 font-bold mb-2 tracking-wider">
                  STEP {item.num}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="py-32 px-6 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-purple-400 text-sm font-semibold mb-4 tracking-widest"
            >
              POWERFUL FEATURES
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-white"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Everything You <NeonText color="purple">Need</NeonText>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-blue-400 text-sm font-semibold mb-4 tracking-widest"
            >
              THE TEAM
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-white"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Meet The <NeonText color="blue">Crew</NeonText>
            </motion.h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="w-[75%] sm:w-[calc(50%-1rem)] md:w-[25%]">
                <TeamCard member={member} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

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
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Ready to <NeonText color="cyan">Level Up</NeonText>?
          </h2>
          <p className="text-lg text-slate-500 mb-12">
            Join developers building consistency and tracking their growth.
          </p>
          <MagneticButton strength={0.1}>
            <SignInButton mode="modal">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-12 py-5 rounded-2xl font-bold text-xl overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <motion.div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 blur-2xl opacity-40 group-hover:opacity-70 transition-opacity" />
                <span className="relative z-10 text-white">
                  Start For Free →
                </span>
              </motion.button>
            </SignInButton>
          </MagneticButton>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {socialLinks.map((link, i) => (
              <motion.a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, y: -2 }}
                className="px-5 py-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-cyan-500/50 transition-colors text-sm text-slate-400 hover:text-white flex items-center gap-2"
              >
                {link.icon} {link.name}
              </motion.a>
            ))}
          </div>
          <div className="text-center">
            <motion.div
              className="text-3xl font-black tracking-tighter mb-3"
              style={{ fontFamily: "Syne, sans-serif" }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400">
                DEVTRACK
              </span>
            </motion.div>
            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()}{" "}
              <span className="text-cyan-500">TEKKUZEN</span>. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
