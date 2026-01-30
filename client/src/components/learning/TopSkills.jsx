import { useMemo, useState } from 'react';
import { Tag, Sparkles, Briefcase } from 'lucide-react';

export default function TopSkills({ entries, verifiedSkills = [] }) {
    const [activeTab, setActiveTab] = useState('learning'); // 'learning' | 'projects'

    const learningSkills = useMemo(() => {
        if (!entries || entries.length === 0) return [];

        const tagCounts = {};
        let totalTags = 0;

        entries.forEach(entry => {
            if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags.forEach(tag => {
                    const normalizedTag = tag.trim();
                    if (normalizedTag) {
                        tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
                        totalTags++;
                    }
                });
            }
        });

        return Object.entries(tagCounts)
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalTags) * 100)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [entries]);

    const displayedSkills = activeTab === 'learning' ? learningSkills : verifiedSkills.slice(0, 8);

    const hasVerified = verifiedSkills.length > 0;
    const hasLearning = learningSkills.length > 0;

    // Auto-switch if one is empty
    if (activeTab === 'learning' && !hasLearning && hasVerified) setActiveTab('projects');

    const isEmpty = !hasLearning && !hasVerified;

    if (isEmpty) {
        return (
            <div className="rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-purple-500/5 to-blue-500/5 flex flex-col justify-center text-center h-full">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
                    <Tag className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">No Skills Data</h3>
                <p className="text-slate-400 text-xs text-center">
                    Track learning or add projects to see skills here.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-5 border border-white/10 h-full flex flex-col"
            style={{
                background: 'linear-gradient(145deg, rgba(30, 35, 50, 0.9), rgba(20, 25, 40, 0.95))',
            }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    {activeTab === 'learning' ? <Sparkles className="w-4 h-4 text-purple-400" /> : <Briefcase className="w-4 h-4 text-cyan-400" />}
                    Top Skills
                </h3>

                {hasVerified && (
                    <div className="flex bg-white/5 rounded-lg p-0.5">
                        <button
                            onClick={() => setActiveTab('learning')}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'learning' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Learning
                        </button>
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${activeTab === 'projects' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Projects
                        </button>
                    </div>
                )}
            </div>

            <div data-lenis-prevent className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 overscroll-contain relative z-30 pointer-events-auto touch-pan-y">
                {displayedSkills.map((skill, index) => (
                    <div key={skill.name} className="group">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-slate-200 font-medium">{skill.name}</span>
                            <span className="text-slate-500">
                                {activeTab === 'learning' ? `${skill.count} sessions` : `${skill.count} projects`}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${activeTab === 'learning' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gradient-to-r from-cyan-500 to-teal-500'}`}
                                style={{ width: activeTab === 'learning' ? `${skill.percentage}%` : `${Math.min((skill.count / 5) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 mt-auto border-t border-white/5">
                <p className="text-[10px] text-slate-500 text-center">
                    {activeTab === 'learning' ? 'Based on learning tags' : 'Based on project technologies'}
                </p>
            </div>
        </div>
    );
}
