import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_ITEMS = [
    {
        question: 'What is DevTrack?',
        answer: 'DevTrack is an AI-powered developer hub that tracks daily progress, syncs GitHub commits, manages projects, and turns student/developer projects into production-level workflows.',
    },
    {
        question: 'How does the GitHub Integration work?',
        answer: 'You link your GitHub account in one click. DevTrack automatically pulls your commits, pull requests, streaks, and repository metrics to provide live analytics and progress visualization.',
    },
    {
        question: 'Is DevTrack free for students and developers?',
        answer: 'Yes! DevTrack offers a comprehensive free tier with project tracking, AI assistance, GitHub sync, and streak monitoring designed for individual developers and small squads.',
    },
    {
        question: 'How does real-time team synchronization work?',
        answer: 'Teams can collaborate on joint projects, assign features, track sprint goals, and receive smart real-time activity notifications across desktop and mobile.',
    },
    {
        question: 'What AI features are included in DevTrack?',
        answer: 'DevTrack features AI Error Assistance, Smart Project Recommendations, Resume & Showcase Builder, and Automated Sprint Planning powered by Gemini & OpenAI engines.',
    },
];

export function FaqAccordion({ items = DEFAULT_ITEMS, title = 'DevTrack FAQs', className, ...props }) {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleItem = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <div className={cn('w-full max-w-3xl mx-auto py-8 relative font-sans', className)} {...props}>
            {title && (
                <h2
                    className="text-center font-bold text-2xl md:text-3xl mb-10 text-white"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                    {title}
                </h2>
            )}

            <ul className="w-full mx-auto list-none p-0 flex flex-col gap-3">
                {items.map((item, index) => {
                    const isActive = activeIndex === index;
                    return (
                        <li
                            key={index}
                            className={cn(
                                'w-full relative transition-all duration-300 ease-in-out rounded-2xl overflow-hidden shadow-lg',
                                'border border-zinc-800 bg-zinc-900/90 backdrop-blur-md',
                                isActive ? 'border-sky-400/50 bg-zinc-900' : 'hover:border-zinc-700'
                            )}
                        >
                            <button
                                className={cn(
                                    'flex flex-row items-center justify-between w-full min-h-[60px] py-4 relative m-0 px-6 cursor-pointer',
                                    'border-l-[6px] md:border-l-[8px] transition-colors duration-200 text-left outline-none text-base md:text-lg font-semibold',
                                    isActive
                                        ? 'border-l-sky-400 bg-zinc-800/60 text-white'
                                        : 'border-l-zinc-700 bg-transparent text-zinc-300 hover:border-l-sky-400 hover:text-white hover:bg-zinc-800/40'
                                )}
                                onClick={() => toggleItem(index)}
                                aria-expanded={isActive}
                            >
                                <div className="flex items-center gap-4">
                                    <span
                                        className={cn(
                                            'flex items-center justify-center w-7 h-7 rounded-full text-sm transition-all duration-200 font-mono',
                                            isActive
                                                ? 'bg-sky-400 text-zinc-950 font-bold'
                                                : 'bg-zinc-800 text-zinc-400'
                                        )}
                                    >
                                        {isActive ? '−' : '+'}
                                    </span>

                                    <span className="pr-4">{item.question}</span>
                                </div>

                                {/* Chevron */}
                                <span
                                    className={cn(
                                        'block w-2.5 h-2.5 border-t-2 border-r-2 transition-transform duration-200 ease-in-out shrink-0',
                                        isActive ? 'rotate-[-45deg] border-sky-400' : 'rotate-[135deg] border-zinc-400'
                                    )}
                                />
                            </button>

                            <div
                                className={cn(
                                    'grid transition-all duration-300 ease-in-out w-full',
                                    isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="flex flex-row items-start justify-start w-full px-6 pl-16 pb-6 pt-2 text-base font-normal text-zinc-300 leading-relaxed border-t border-zinc-800/40">
                                        <span>{item.answer}</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default FaqAccordion;
