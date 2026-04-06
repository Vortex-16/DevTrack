import { motion } from 'framer-motion'
import { BookOpen, ChevronRight } from 'lucide-react'

export default function DomainCard({ roadmap, onClick, index }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group relative w-full text-left rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      }}
    >
      {/* Glow accent */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${roadmap.color}18, transparent 70%)`,
        }}
      />

      {/* Top color strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${roadmap.color}, transparent)` }}
      />

      <div className="relative p-6">
        {/* Icon + Title */}
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
            style={{
              background: `${roadmap.color}22`,
              boxShadow: `0 0 20px ${roadmap.color}33`,
            }}
          >
            {roadmap.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 leading-tight">{roadmap.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{roadmap.description}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <BookOpen size={12} />
              {roadmap.totalTopics} topics
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: roadmap.color }}></span>
              {roadmap.sections.length} sections
            </span>
          </div>

          <div
            className="flex items-center gap-1 text-xs font-semibold transition-all group-hover:gap-2"
            style={{ color: roadmap.color }}
          >
            View Roadmap
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
