/**
 * Skeleton Component
 * Animated loading placeholder for content
 */

function Skeleton({ className = '', variant = 'default', ...props }) {
    const baseStyles = 'animate-pulse rounded-md bg-white/10'

    const variantStyles = {
        default: 'h-4 w-full',
        text: 'h-4 w-3/4',
        title: 'h-6 w-1/2',
        avatar: 'h-10 w-10 rounded-full',
        card: 'h-32 w-full',
        stat: 'h-20 w-full',
        chart: 'h-40 w-full',
        button: 'h-10 w-24',
    }

    return (
        <div
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            {...props}
        />
    )
}

/**
 * SkeletonCard - Pre-built skeleton for dashboard cards
 */
export function SkeletonCard({ className = '' }) {
    return (
        <div className={`rounded-3xl p-6 border border-white/10 space-y-4 ${className}`}
            style={{ background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))' }}
        >
            <Skeleton variant="title" />
            <Skeleton variant="text" />
            <Skeleton variant="stat" />
        </div>
    )
}

/**
 * SkeletonActivity - Pre-built skeleton for activity items
 */
export function SkeletonActivity() {
    return (
        <div className="flex items-center gap-3 p-3">
            <Skeleton variant="avatar" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="text" />
                <Skeleton className="h-3 w-1/3" />
            </div>
        </div>
    )
}

/**
 * SkeletonStats - Pre-built skeleton for stat cards
 */
export function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl p-4 border border-white/10 space-y-3"
                    style={{ background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.95), rgba(20, 25, 40, 0.98))' }}
                >
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton variant="text" />
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    )
}

export default Skeleton
