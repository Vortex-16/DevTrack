import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

export function StatsCounter({ value, duration = 1.5, prefix = '', suffix = '', decimals = 0, className }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (isInView) {
            motionValue.set(value);
        }
    }, [isInView, value, motionValue]);

    useEffect(() => {
        const unsubscribe = springValue.on('change', (latest) => {
            setDisplayValue(latest);
        });
        return unsubscribe;
    }, [springValue]);

    return (
        <span ref={ref} className={cn('tabular-nums', className)}>
            {prefix}
            {displayValue.toFixed(decimals)}
            {suffix}
        </span>
    );
}

export default StatsCounter;
