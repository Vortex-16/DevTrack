export default function Card({ children, className = '', hover = false }) {
    return (
        <div className={`glass rounded-xl p-6 ${hover ? 'glass-hover cursor-pointer' : ''} ${className}`}>
            {children}
        </div>
    )
}
