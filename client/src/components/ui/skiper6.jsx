import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultMembers = [
    {
        name: 'Vikash Gupta',
        github: 'Vortex-16',
        role: 'Frontend & Backend, AI',
        avatar: 'https://github.com/Vortex-16.png',
        linkedin: 'https://linkedin.com',
        bio: 'Architecting DevTrack core infrastructure, real-time sync, and Gemini AI workflows.',
    },
    {
        name: 'Ayush Chowdhury',
        github: 'AyushChowdhuryCSE',
        role: 'Innovation & Concepts',
        avatar: 'https://github.com/AyushChowdhuryCSE.png',
        linkedin: 'https://linkedin.com',
        bio: 'Pioneering developer productivity frameworks and interactive feature concepts.',
    },
    {
        name: 'Rajdeep Das',
        github: 'yourajdeep',
        role: 'UI/UX & Optimization',
        avatar: 'https://github.com/yourajdeep.png',
        linkedin: 'https://linkedin.com',
        bio: 'Crafting fluid animations, dark aesthetics, and performant user interface designs.',
    },
];

export function HoverMember({ teamMembers = defaultMembers, className }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <div className={cn('w-full max-w-6xl mx-auto py-8 px-4', className)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {teamMembers.map((member, idx) => {
                    const isHovered = hoveredIndex === idx;

                    return (
                        <motion.div
                            key={member.github || member.name}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className="relative group rounded-3xl p-6 bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl transition-all duration-500 hover:border-sky-400/50 hover:shadow-[0_0_40px_rgba(56,189,248,0.15)] flex flex-col justify-between overflow-hidden"
                        >
                            {/* Subtle background overlay */}
                            <div
                                className={cn(
                                    'absolute inset-0 bg-zinc-800/40 transition-opacity duration-500 pointer-events-none',
                                    isHovered ? 'opacity-100' : 'opacity-0'
                                )}
                            />

                            <div className="relative z-10">
                                {/* Member Avatar & Badges */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="relative">
                                        <motion.div
                                            animate={{ scale: isHovered ? 1.05 : 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-zinc-700 group-hover:border-sky-400 shadow-xl relative bg-zinc-950"
                                        >
                                            <img
                                                src={member.avatar || `https://github.com/${member.github}.png`}
                                                alt={member.name}
                                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=0f172a&color=fff`;
                                                }}
                                            />
                                        </motion.div>
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-sky-400 border-2 border-zinc-900 shadow-sm" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {member.github && (
                                            <a
                                                href={`https://github.com/${member.github}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-sky-400 hover:text-zinc-950 transition-all duration-300"
                                                title="GitHub Profile"
                                            >
                                                <Github className="w-4 h-4" />
                                            </a>
                                        )}
                                        {member.linkedin && (
                                            <a
                                                href={member.linkedin}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-sky-400 hover:text-zinc-950 transition-all duration-300"
                                                title="LinkedIn Profile"
                                            >
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Member Info */}
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 border border-zinc-700 text-sky-400 mb-3">
                                        <Sparkles className="w-3 h-3 text-sky-400" />
                                        <span>{member.role}</span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors">
                                        {member.name}
                                    </h3>

                                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                                        {member.bio || `@${member.github}`}
                                    </p>
                                </div>
                            </div>

                            {/* Hover Footer Action */}
                            <div className="relative z-10 pt-6 mt-6 border-t border-zinc-800/60 flex items-center justify-between">
                                <span className="text-xs font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                    @{member.github}
                                </span>

                                <motion.div
                                    animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0.6 }}
                                    className="flex items-center gap-1 text-xs font-semibold text-sky-400"
                                >
                                    <span>Connect</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default HoverMember;
