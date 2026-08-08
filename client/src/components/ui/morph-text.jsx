import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function MorphText({
    words = ['BUILD FASTER', 'TRACK SMARTER', 'SHIP TOGETHER', 'DEVTRACK HUB'],
    interval = 2500,
    subtext,
    fontSize = 'clamp(2rem, 5vw, 4rem)',
    fontFamily = '"Space Grotesk", sans-serif',
    className,
    textClassName,
    subtextClassName,
}) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, interval);
        return () => clearInterval(timer);
    }, [words.length, interval]);

    return (
        <div
            className={cn('morph-text-root relative flex flex-col items-center justify-center text-center', className)}
        >
            <div
                className={cn(
                    'morph-text-container relative select-none font-bold tracking-tight text-white h-[1.3em] flex items-center justify-center overflow-hidden',
                    textClassName
                )}
                style={{ fontSize, fontFamily }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={words[index]}
                        initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="text-sky-400 font-black tracking-tight whitespace-nowrap"
                    >
                        {words[index]}
                    </motion.span>
                </AnimatePresence>
            </div>

            {subtext && (
                <p
                    className={cn(
                        'morph-subtext mt-3 uppercase tracking-[0.25em] text-zinc-400 font-medium text-xs md:text-sm',
                        subtextClassName
                    )}
                    style={{ fontFamily }}
                >
                    {subtext}
                </p>
            )}
        </div>
    );
}

export default MorphText;
