/**
 * SkeletonLoader — Reusable shimmer skeleton loading component
 *
 * Variants:
 *  - card         : project/repo card skeleton
 *  - stat-box     : dashboard stat box skeleton
 *  - list-item    : table row / list item skeleton
 *  - chart        : chart area placeholder
 *  - profile      : avatar + name row
 *  - text         : paragraph text block
 *
 * Usage:
 *  <SkeletonLoader variant="card" count={3} />
 *  <SkeletonLoader variant="stat-box" count={4} className="grid grid-cols-2 gap-4" />
 */

import { cn } from 'clsx';

// The shimmering base animation element
const Shimmer = ({ className }) => (
    <div
        className={cn(
            'relative overflow-hidden rounded-lg bg-slate-800/60',
            'before:absolute before:inset-0',
            'before:bg-gradient-to-r before:from-transparent before:via-slate-700/40 before:to-transparent',
            'before:animate-[shimmer_1.5s_infinite]',
            className
        )}
    />
);

// ─── Variant Definitions ─────────────────────────────────────────────────────

const CardSkeleton = () => (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-4">
        <div className="flex items-center gap-3">
            <Shimmer className="h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
            </div>
        </div>
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-5/6" />
        <div className="flex gap-2 pt-1">
            <Shimmer className="h-6 w-16 rounded-full" />
            <Shimmer className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-700/30">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="h-4 w-16" />
        </div>
    </div>
);

const StatBoxSkeleton = () => (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-3">
        <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="h-8 w-8 rounded-lg" />
        </div>
        <Shimmer className="h-8 w-20" />
        <Shimmer className="h-3 w-24" />
    </div>
);

const ListItemSkeleton = () => (
    <div className="flex items-center gap-3 py-3 border-b border-slate-700/30 last:border-0">
        <Shimmer className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Shimmer className="h-3 w-2/3" />
            <Shimmer className="h-2.5 w-1/3" />
        </div>
        <Shimmer className="h-6 w-14 rounded-full" />
    </div>
);

const ChartSkeleton = () => (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-4">
        <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-36" />
            <Shimmer className="h-6 w-20 rounded-full" />
        </div>
        {/* Bar chart placeholder */}
        <div className="flex items-end gap-2 h-32 pt-2">
            {[60, 80, 40, 90, 70, 55, 85, 45, 75, 65, 50, 95].map((h, i) => (
                <Shimmer
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{ height: `${h}%` }}
                />
            ))}
        </div>
    </div>
);

const ProfileSkeleton = () => (
    <div className="flex items-center gap-4 p-4">
        <Shimmer className="h-16 w-16 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <Shimmer className="h-5 w-40" />
            <Shimmer className="h-3.5 w-28" />
            <Shimmer className="h-3 w-56" />
        </div>
    </div>
);

const TextSkeleton = () => (
    <div className="space-y-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-11/12" />
        <Shimmer className="h-3 w-4/5" />
        <Shimmer className="h-3 w-3/4" />
    </div>
);

// ─── Variant Map ─────────────────────────────────────────────────────────────

const VARIANTS = {
    card: CardSkeleton,
    'stat-box': StatBoxSkeleton,
    'list-item': ListItemSkeleton,
    chart: ChartSkeleton,
    profile: ProfileSkeleton,
    text: TextSkeleton,
};

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * @param {'card'|'stat-box'|'list-item'|'chart'|'profile'|'text'} variant
 * @param {number} count - how many skeletons to render
 * @param {string} className - wrapper class
 */
const SkeletonLoader = ({ variant = 'card', count = 1, className = '' }) => {
    const Component = VARIANTS[variant] || VARIANTS.card;

    return (
        <div className={className || undefined}>
            {Array.from({ length: count }, (_, i) => (
                <Component key={i} />
            ))}
        </div>
    );
};

export default SkeletonLoader;
export { Shimmer };
