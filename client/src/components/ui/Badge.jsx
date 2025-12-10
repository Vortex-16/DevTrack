export default function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-slate-700 text-slate-200',
        primary: 'bg-primary-600 text-white',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        danger: 'bg-red-600 text-white',
    }

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
            {children}
        </span>
    )
}
