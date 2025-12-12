import { useEffect, useRef, useState } from 'react'
import { SignInButton } from '@clerk/clerk-react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Team members
const teamMembers = [
    { name: 'Vikash Gupta', github: 'Vortex-16', role: 'Backend & Frontend' },
    { name: 'Ayush Chowdhury', github: 'AyushChowdhuryCSE', role: 'Frontend Developer' },
    { name: 'Rajbeer Saha', github: 'PixelPioneer404', role: 'Frontend Developer' },
    { name: 'Rajdeep Das', github: 'yourajdeep', role: 'Frontend Developer' }
]

// Features
const features = [
    { title: 'Daily Coding Tracker', desc: 'Track every line of code you write', icon: '⚡', color: 'cyan' },
    { title: 'AI Error Assistance', desc: 'Smart suggestions when you\'re stuck', icon: '🤖', color: 'purple' },
    { title: 'GitHub Sync', desc: 'Auto-sync commits and contributions', icon: '🔗', color: 'blue' },
    { title: 'Streak Calendar', desc: 'Visualize your consistency', icon: '🔥', color: 'orange' },
    { title: 'Skill Growth', desc: 'Track skill progression over time', icon: '📈', color: 'green' },
    { title: 'Analytics', desc: 'Beautiful progress visualizations', icon: '📊', color: 'pink' }
]

// Steps
const steps = [
    { num: '01', title: 'Connect GitHub', desc: 'Link your account in one click', icon: '🔐' },
    { num: '02', title: 'Start Coding', desc: 'We track activity automatically', icon: '💻' },
    { num: '03', title: 'View Insights', desc: 'See beautiful analytics', icon: '📊' },
    { num: '04', title: 'Grow Daily', desc: 'Build consistency & improve', icon: '🚀' }
]

// Social links
const socialLinks = [
    { name: 'GitHub', url: 'https://github.com', icon: '⚡' },
    { name: 'Discord', url: 'https://discord.gg/5Jyt4sQPR', icon: '💬' },
    { name: 'Website', url: 'https://alphacoders-official.vercel.app', icon: '🌐' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/alpha4coders/', icon: '💼' }
]

// Floating code lines
const codeLines = [
    'const dev = new Developer();',
    'git push origin main',
    'npm run build',
    '// Level up!',
    'export default Growth;',
    'await learn(newSkill);'
]

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
                        top: `${Math.random() * 100}%`
                    }}
                    animate={{
                        y: [0, -150],
                        x: [0, (Math.random() - 0.5) * 50],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 4 + Math.random() * 3,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                />
            ))}
        </div>
    )
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
    )
}

// Floating code block
function FloatingCode({ code, delay, x, y }) {
    return (
        <motion.div
            className="absolute px-3 py-1.5 rounded-lg bg-black/80 border border-cyan-500/30 text-xs font-mono text-cyan-400 backdrop-blur-sm"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: [0.4, 0.8, 0.4],
                y: [0, -15, 0],
                rotate: [-1, 1, -1]
            }}
            transition={{
                duration: 5,
                repeat: Infinity,
                delay
            }}
        >
            {code}
        </motion.div>
    )
}

// Neon text
function NeonText({ children, color = 'cyan' }) {
    const colors = {
        cyan: 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]',
        purple: 'text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.6)]',
        blue: 'text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]'
    }
    return <span className={colors[color]}>{children}</span>
}

// Feature card
function FeatureCard({ feature, index }) {
    const borderColors = {
        cyan: 'hover:border-cyan-500/70 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]',
        purple: 'hover:border-purple-500/70 hover:shadow-[0_0_30px_rgba(192,132,252,0.15)]',
        blue: 'hover:border-blue-500/70 hover:shadow-[0_0_30px_rgba(96,165,250,0.15)]',
        orange: 'hover:border-orange-500/70 hover:shadow-[0_0_30px_rgba(251,146,60,0.15)]',
        green: 'hover:border-emerald-500/70 hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
        pink: 'hover:border-pink-500/70 hover:shadow-[0_0_30px_rgba(244,114,182,0.15)]'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03, y: -8 }}
            className={`relative p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 ${borderColors[feature.color]} transition-all duration-500 group`}
        >
            <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
            <div className="relative z-10">
                <motion.div
                    className="text-4xl mb-4"
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                >
                    {feature.icon}
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
        </motion.div>
    )
}

// Dashboard mockup
function DashboardMockup() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
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
                    <span className="ml-4 text-xs text-slate-500 font-mono">devtrack://dashboard</span>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-3 gap-4">
                    {/* Stats */}
                    {[
                        { label: 'Current Streak', value: '47', unit: 'days', color: 'cyan', change: '+12%' },
                        { label: 'Total Commits', value: '1,247', unit: '', color: 'purple', change: '+89' },
                        { label: 'Skills Tracked', value: '12', unit: 'skills', color: 'blue', change: 'React, Node...' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            className={`p-4 rounded-xl bg-gradient-to-br from-${stat.color}-500/10 to-transparent border border-${stat.color}-500/30`}
                            animate={{ boxShadow: [`0 0 20px rgba(34,211,238,0)`, `0 0 25px rgba(34,211,238,0.1)`, `0 0 20px rgba(34,211,238,0)`] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                            <div className={`text-xs text-${stat.color}-400 mb-1`}>{stat.label}</div>
                            <div className="text-2xl font-black text-white">{stat.value} <span className="text-sm font-normal text-slate-500">{stat.unit}</span></div>
                            <div className="text-xs text-green-400 mt-1">{stat.change}</div>
                        </motion.div>
                    ))}

                    {/* Chart */}
                    <div className="col-span-2 p-4 rounded-xl bg-black/40 border border-white/10">
                        <div className="text-xs text-slate-500 mb-3">Weekly Activity</div>
                        <div className="flex items-end gap-2 h-24">
                            {[35, 55, 45, 75, 60, 85, 70].map((h, i) => (
                                <motion.div
                                    key={i}
                                    className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-purple-500"
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${h}%` }}
                                    transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                                    viewport={{ once: true }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-slate-600">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <div className="col-span-1 p-4 rounded-xl bg-black/40 border border-white/10">
                        <div className="text-xs text-slate-500 mb-3">30-Day Streak</div>
                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(28)].map((_, i) => {
                                const intensity = Math.random()
                                return (
                                    <motion.div
                                        key={i}
                                        className="w-3 h-3 rounded-sm"
                                        style={{
                                            backgroundColor: intensity > 0.7
                                                ? 'rgb(34 211 238)'
                                                : intensity > 0.4
                                                    ? 'rgb(34 211 238 / 0.5)'
                                                    : 'rgb(34 211 238 / 0.15)'
                                        }}
                                        initial={{ scale: 0, opacity: 0 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.02 }}
                                        viewport={{ once: true }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating code */}
            <FloatingCode code={codeLines[0]} delay={0} x="90%" y="10%" />
            <FloatingCode code={codeLines[1]} delay={1} x="-10%" y="70%" />
            <FloatingCode code={codeLines[2]} delay={2} x="85%" y="80%" />
        </motion.div>
    )
}

// Team card - More Unique Design
const cardColors = [
    { gradient: 'from-cyan-500 to-blue-500', glow: 'cyan' },
    { gradient: 'from-purple-500 to-pink-500', glow: 'purple' },
    { gradient: 'from-emerald-500 to-teal-500', glow: 'emerald' },
    { gradient: 'from-orange-500 to-red-500', glow: 'orange' }
]

function TeamCard({ member, index }) {
    const color = cardColors[index % cardColors.length]

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, rotateY: -15 }}
            whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -12, scale: 1.05 }}
            className="group perspective-1000"
        >
            {/* Card with gradient border */}
            <div className={`relative p-[2px] rounded-2xl bg-gradient-to-br ${color.gradient} overflow-hidden h-full`}>
                {/* Inner card */}
                <div className="relative p-6 rounded-2xl bg-black backdrop-blur-xl h-full min-h-[220px] flex flex-col justify-center">
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`} />

                    {/* Avatar */}
                    <div className="relative mb-4">
                        <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient} blur-xl opacity-30 group-hover:opacity-60 transition-opacity scale-75`} />
                        <motion.img
                            src={`https://github.com/${member.github}.png`}
                            alt={member.name}
                            className={`relative w-20 h-20 mx-auto rounded-2xl border-2 border-white/20 group-hover:border-white/50 transition-all shadow-lg`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=000&color=22d3ee&size=200`
                            }}
                        />
                    </div>

                    {/* Info */}
                    <div className="text-center relative z-10">
                        <h3 className="font-bold text-white text-lg mb-1">{member.name}</h3>
                        <p className={`text-xs font-medium mb-3 bg-gradient-to-r ${color.gradient} bg-clip-text text-transparent`}>
                            {member.role}
                        </p>
                        <a
                            href={`https://github.com/${member.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors group/link"
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            <span className="group-hover/link:underline">@{member.github}</span>
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default function Landing() {
    const heroRef = useRef(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const ctx = gsap.context(() => {
            // Giant title animation
            gsap.fromTo('.hero-letter',
                { opacity: 0, y: 100, rotateY: -90 },
                {
                    opacity: 1, y: 0, rotateY: 0,
                    duration: 1,
                    stagger: 0.05,
                    ease: 'power4.out',
                    delay: 0.3
                }
            )

            // Tagline
            gsap.fromTo('.hero-tagline',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, delay: 1 }
            )

            // Subtitle
            gsap.fromTo('.hero-sub',
                { opacity: 0 },
                { opacity: 1, duration: 0.6, delay: 1.3 }
            )

            // CTA
            gsap.fromTo('.hero-cta',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, delay: 1.5 }
            )
        }, heroRef)

        return () => ctx.revert()
    }, [])

    const title = "DEVTRACK"

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
                    backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
                    backgroundSize: '80px 80px'
                }}
            />

            {/* Hero */}
            <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <div className="px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium backdrop-blur-sm">
                        ⚡ Developer Productivity Tool
                    </div>
                </motion.div>

                {/* GIANT Title - Using Syne font */}
                <h1 className="text-[14vw] md:text-[10vw] lg:text-[8vw] font-black leading-[0.85] tracking-tighter text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {title.split('').map((char, i) => (
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
                    style={{ fontFamily: 'Syne, sans-serif' }}
                >
                    <NeonText color="cyan">Track.</NeonText>{' '}
                    <NeonText color="purple">Code.</NeonText>{' '}
                    <NeonText color="blue">Improve.</NeonText>
                </motion.p>

                {/* Subtitle */}
                <p className="hero-sub mt-4 text-lg text-slate-500 text-center max-w-xl">
                    Track your coding activity, progress, and consistency — <br />helping you grow every single day.
                </p>

                {/* CTA */}
                <div className="hero-cta mt-10 flex flex-col sm:flex-row gap-4">
                    <SignInButton mode="modal">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative px-10 py-4 rounded-xl font-bold text-lg overflow-hidden group"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500"
                            />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 blur-xl opacity-50 group-hover:opacity-80 transition-opacity"
                            />
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

                    <motion.a
                        href="#features"
                        whileHover={{ scale: 1.03 }}
                        className="px-10 py-4 rounded-xl border border-white/20 text-white font-semibold text-lg hover:bg-white/5 hover:border-white/40 transition-all text-center"
                    >
                        Explore Features
                    </motion.a>
                </div>

                {/* Dashboard */}
                <DashboardMockup />

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8"
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
                            style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                            How It <NeonText color="cyan">Works</NeonText>
                        </motion.h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {steps.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.15 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -8 }}
                                className="relative p-6 rounded-2xl bg-black/60 backdrop-blur border border-white/10 hover:border-cyan-500/50 text-center group transition-all duration-500"
                            >
                                <motion.div
                                    className="text-4xl mb-4"
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                >
                                    {item.icon}
                                </motion.div>
                                <div className="text-xs text-cyan-400 font-bold mb-2 tracking-wider">STEP {item.num}</div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-32 px-6 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent">
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
                            style={{ fontFamily: 'Syne, sans-serif' }}
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
                            style={{ fontFamily: 'Syne, sans-serif' }}
                        >
                            Meet The <NeonText color="blue">Crew</NeonText>
                        </motion.h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                        {teamMembers.map((member, index) => (
                            <TeamCard key={index} member={member} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2
                        className="text-5xl md:text-7xl font-black text-white mb-8"
                        style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                        Ready to <NeonText color="cyan">Level Up</NeonText>?
                    </h2>
                    <p className="text-lg text-slate-500 mb-12">
                        Join developers building consistency and tracking their growth.
                    </p>
                    <SignInButton mode="modal">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative px-12 py-5 rounded-2xl font-bold text-xl overflow-hidden group"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500"
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                style={{ backgroundSize: '200% 200%' }}
                            />
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400 blur-2xl opacity-40 group-hover:opacity-70 transition-opacity"
                            />
                            <span className="relative z-10 text-white">Start For Free →</span>
                        </motion.button>
                    </SignInButton>
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
                            style={{ fontFamily: 'Syne, sans-serif' }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-blue-400">
                                DEVTRACK
                            </span>
                        </motion.div>
                        <p className="text-slate-600 text-sm">
                            © {new Date().getFullYear()} <span className="text-cyan-500">TEKKUZEN</span>. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
