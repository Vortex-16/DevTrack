import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Circle, Info, BookOpen, Star, ArrowRight } from 'lucide-react'

const TYPE_CONFIG = {
  required: {
    label: 'Required',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
  },
  recommended: {
    label: 'Recommended',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-500',
    ring: 'ring-blue-500/30',
  },
  optional: {
    label: 'Optional',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    dot: 'bg-slate-500',
    ring: 'ring-slate-500/30',
  },
}

function TopicChip({ topic, checked, onToggle, sectionColor }) {
  const cfg = TYPE_CONFIG[topic.type] || TYPE_CONFIG.optional

  return (
    <motion.button
      layout
      onClick={() => onToggle(topic.id)}
      className={`
        group relative flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all duration-200
        ${checked
          ? 'bg-white/5 border-white/10 opacity-60'
          : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20'}
      `}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Checkbox */}
      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-emerald-500 bg-emerald-500' : 'border-white/20 group-hover:border-white/40'}`}>
        {checked && <CheckCircle2 size={12} className="text-white" />}
      </div>

      {/* Label */}
      <span className={`flex-1 text-sm font-medium transition-colors ${checked ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {topic.label}
      </span>

      {/* Type badge */}
      <span className={`flex-shrink-0 hidden sm:flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${cfg.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
        {cfg.label}
      </span>
    </motion.button>
  )
}

function SectionBlock({ section, checkedTopics, onToggle, index }) {
  const [expanded, setExpanded] = useState(true)
  const completedCount = section.topics.filter(t => checkedTopics.has(t.id)).length
  const totalCount = section.topics.length
  const pct = Math.round((completedCount / totalCount) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative"
    >
      {/* Vertical connecting line (not on last) */}
      <div
        className="absolute left-[22px] top-[60px] bottom-[-28px] w-0.5 z-0"
        style={{ background: `linear-gradient(to bottom, ${section.color}44, transparent)` }}
      />

      <div className="relative z-10">
        {/* Section Header */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center gap-3 mb-3 group"
        >
          {/* Numbered circle */}
          <div
            className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg transition-transform group-hover:scale-110"
            style={{ background: section.color, boxShadow: `0 0 16px ${section.color}55` }}
          >
            {index + 1}
          </div>

          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{section.title}</h3>
              <span className="text-xs text-slate-500">{completedCount}/{totalCount}</span>
            </div>
            {/* Progress mini bar */}
            <div className="h-1 w-32 mt-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: section.color }}
              />
            </div>
          </div>

          {/* Expand chevron */}
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500"
          >
            <ArrowRight size={16} />
          </motion.div>
        </button>

        {/* Topics List */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pl-14 space-y-2 mb-6"
            >
              {section.topics.map((topic) => (
                <TopicChip
                  key={topic.id}
                  topic={topic}
                  checked={checkedTopics.has(topic.id)}
                  onToggle={onToggle}
                  sectionColor={section.color}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function RoadmapViewer({ roadmap, onBack }) {
  const [checkedTopics, setCheckedTopics] = useState(() => new Set())

  const totalTopics = roadmap.sections.reduce((acc, s) => acc + s.topics.length, 0)
  const completedTotal = checkedTopics.size
  const overallPct = Math.round((completedTotal / totalTopics) * 100)

  const handleToggle = (topicId) => {
    setCheckedTopics(prev => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-[#0d1117]/80 backdrop-blur-md border-b border-white/5 -mx-4 px-4 py-3 mb-8">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft size={18} />
            All Roadmaps
          </button>
          <div className="flex-1 mx-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Overall Progress</span>
              <span className="font-bold" style={{ color: roadmap.color }}>{overallPct}% ({completedTotal}/{totalTopics})</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${roadmap.color}, ${roadmap.color}99)` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto pb-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl text-4xl mb-5 shadow-2xl"
            style={{ background: `${roadmap.color}22`, boxShadow: `0 0 40px ${roadmap.color}33` }}
          >
            {roadmap.icon}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{roadmap.title}</h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">{roadmap.description}</p>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <div key={key} className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${cfg.color}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                {cfg.label}
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Sections */}
        <div>
          {roadmap.sections.map((section, index) => (
            <SectionBlock
              key={section.id}
              section={section}
              index={index}
              checkedTopics={checkedTopics}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Completion Banner */}
        <AnimatePresence>
          {overallPct === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-center p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10"
            >
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-emerald-400 mb-1">Roadmap Complete!</h3>
              <p className="text-slate-400 text-sm">You've covered every topic in the {roadmap.title} roadmap. Amazing work!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
