export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary: 'gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/50 hover:scale-105',
        secondary: 'glass glass-hover text-slate-100 border border-primary-500/30',
        ghost: 'hover:bg-white/10 text-slate-300 hover:text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white'
    }

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
