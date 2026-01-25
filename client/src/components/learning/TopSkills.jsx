import { useMemo } from 'react';
import { Tag, Sparkles } from 'lucide-react';

export default function TopSkills({ entries }) {
    const skillsData = useMemo(() => {
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

    if (skillsData.length === 0) {
        return (
            <div className="rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-purple-500/5 to-blue-500/5 flex flex-col justify-center text-center h-full">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
                    <Tag className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">No Skills Tracked Yet</h3>
                <p className="text-slate-400 text-xs text-center">
                    Add tags to your learning entries to see your top skills here.
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
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-400" /> Top Skills
            </h3>

            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {skillsData.map((skill, index) => (
                    <div key={skill.name} className="group">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-slate-200 font-medium">{skill.name}</span>
                            <span className="text-slate-500">{skill.count} sessions</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                                style={{ width: `${skill.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-4 mt-auto border-t border-white/5">
                <p className="text-[10px] text-slate-500 text-center">
                    Based on your tagged learning sessions
                </p>
            </div>
        </div>
    );
}
