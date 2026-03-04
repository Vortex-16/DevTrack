import React from 'react'
import {
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Github,
    Link as LinkIcon
} from 'lucide-react'

// ==========================================
// PREVIEW COMPONENT (The "God Level" Resume)
// A4 Scaled CSS
// ==========================================
const ResumePaper = ({ data, projects, verifiedSkills = [], user }) => {
    const themeColor = data.theme?.color || '#435260';
    const themeFont = data.theme?.font || 'font-sans';
    const template = data.template || 'modern';
    const layoutOrder = data.layoutOrder || ['summary', 'experience', 'projects', 'education', 'skills', 'achievements'];

    // Helper to render section headers
    const SectionHeader = ({ title }) => {
        if (template === 'professional') {
            return (
                <div className="border-b-2 mb-4 mt-2 print:break-inside-avoid" style={{ borderColor: themeColor }}>
                    <h3 className="font-bold uppercase tracking-widest text-sm pb-1" style={{ color: themeColor }}>
                        {title}
                    </h3>
                </div>
            )
        }
        if (template === 'creative') {
            return (
                <div className="mb-4 mt-2 print:break-inside-avoid inline-block px-3 py-1 text-white rounded-tr-xl rounded-bl-xl shadow-sm" style={{ backgroundColor: themeColor }}>
                    <h3 className="font-bold uppercase tracking-widest text-xs">
                        {title}
                    </h3>
                </div>
            )
        }
        return (
            <div className="py-1.5 px-4 mb-4 mt-2 print:break-inside-avoid" style={{ backgroundColor: `${themeColor}15`, borderLeft: `4px solid ${themeColor}` }}>
                <h3 className="font-bold uppercase tracking-widest text-sm" style={{ color: themeColor }}>
                    {title}
                </h3>
            </div>
        )
    }

    // Calculate avatar source
    const avatarSrc = data.basics.avatar || user?.avatar || user?.picture || user?.githubAvatar;

    // --- Section Content Generators ---
    const sections = {
        summary: data.basics.summary ? (
            <section key="summary" className="mb-6">
                <SectionHeader title="Profile" />
                <p className="text-justify text-slate-800 leading-relaxed font-medium">
                    {data.basics.summary}
                </p>
            </section>
        ) : null,

        skills: (data.selectedSkillNames?.length > 0 || data.skills?.length > 0) ? (
            <section key="skills" className="mb-6 print:break-inside-avoid">
                <SectionHeader title="Skills" />
                <div className="space-y-4">
                    {/* Verified Skills (with bars) */}
                    {data.selectedSkillNames?.map(name => {
                        const verified = verifiedSkills.find(s => s.name === name);
                        const percentage = verified ? Math.min(verified.count * 10, 100) : 60;
                        return (
                            <div key={name}>
                                <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
                                    <span>{name}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full print:print-color-adjust-exact" style={{ width: `${percentage}%`, backgroundColor: themeColor }}></div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Other Skills (Manual) */}
                    {data.skills?.length > 0 && (
                        <div className="mt-4">
                            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">Domains & Interests</div>
                            <div className="text-sm text-slate-700 leading-relaxed italic">
                                {data.skills.join(', ')}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        ) : null,

        achievements: (data.achievements && data.achievements.length > 0) ? (
            <section key="achievements" className="mb-6 print:break-inside-avoid">
                <SectionHeader title="Certificates" />
                <ul className="space-y-2">
                    {data.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: themeColor }}></span>
                            <span>
                                {typeof achievement === 'string' ? achievement : achievement.text}
                                {typeof achievement === 'object' && achievement.url && (
                                    <a href={achievement.url} target="_blank" rel="noreferrer" className="inline-block ml-1 text-slate-500 hover:text-blue-600">
                                        <LinkIcon size={12} />
                                    </a>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        ) : null,

        projects: (projects && projects.length > 0) ? (
            <section key="projects" className="mb-6">
                <SectionHeader title="Projects" />
                <div className="space-y-6">
                    {projects.map((proj) => (
                        <div key={proj.id} className="relative print:break-inside-avoid">
                            <div className="flex justify-between items-baseline">
                                <h4 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2">
                                    {proj.name}
                                    {proj.repositoryUrl && (
                                        <a href={proj.repositoryUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-black">
                                            <LinkIcon size={14} />
                                        </a>
                                    )}
                                </h4>
                                {proj.createdAt && (
                                    <span style={{ color: themeColor }} className="text-xs font-bold">
                                        {new Date(proj.createdAt).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })} – Present
                                    </span>
                                )}
                            </div>
                            <div className="mb-2 text-sm font-medium text-slate-700">
                                {proj.description?.split('.')[0]}.
                            </div>
                            <div className="text-sm text-slate-800">
                                <span className="font-bold text-xs uppercase mb-1 block">Key Features</span>
                                <ul className="list-disc ml-4 space-y-1 text-slate-700">
                                    {(proj.longDescription || proj.description)?.split('. ').slice(0, 4).map((sentence, idx) => {
                                        if (!sentence.trim()) return null;
                                        const clean = sentence.replace(/\.$/, '');
                                        return (
                                            <li key={idx} className="pl-1">
                                                {clean.includes(':') ? (
                                                    <>
                                                        <span className="font-bold">{clean.split(':')[0]}:</span>
                                                        {clean.substring(clean.split(':')[0].length + 1)}
                                                    </>
                                                ) : (
                                                    clean
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ) : null,

        education: (data.education && data.education.length > 0) ? (
            <section key="education" className="mb-6 print:break-inside-avoid">
                <SectionHeader title="Education" />
                <div className="space-y-6">
                    {data.education.map((edu, i) => (
                        <div key={i} className="print:break-inside-avoid">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    {edu.degree}
                                </h4>
                                <span className="text-xs font-bold" style={{ color: themeColor }}>
                                    {edu.year}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-1">
                                <span className="flex items-center gap-1">
                                    {edu.school} {data.basics.location && `- ${data.basics.location}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ) : null,

        experience: (data.experience && data.experience.length > 0) ? (
            <section key="experience" className="mb-6">
                <SectionHeader title="Experience" />
                <div className="space-y-6">
                    {data.experience.map((exp, i) => (
                        <div key={i} className="print:break-inside-avoid">
                            <div className="flex justify-between items-baseline mb-1">
                                <h4 className="text-base font-bold text-slate-900">{exp.role}</h4>
                                <span className="text-xs font-bold" style={{ color: themeColor }}>{exp.startDate} – {exp.endDate}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-700 mb-2">{exp.company}</div>
                            <ul className="list-disc ml-4 space-y-1 text-sm text-slate-700">
                                {exp.description?.split('\n').map((line, idx) => (
                                    <li key={idx}>{line}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        ) : null
    };

    // --- Layout Renderer ---
    const renderLayout = () => {
        if (template === 'professional') {
            // Single Column
            return (
                <div className="p-10 space-y-2">
                    {layoutOrder.map(key => sections[key])}
                </div>
            )
        }

        // Modern and Creative are Two-Column
        // We bucket sections depending on their natural column assignment to keep them separated,
        // but order them according to `layoutOrder` position.
        const leftColKeys = ['summary', 'skills', 'achievements'];
        const rightColKeys = ['experience', 'projects', 'education'];

        const sortedLeft = leftColKeys.sort((a, b) => layoutOrder.indexOf(a) - layoutOrder.indexOf(b));
        const sortedRight = rightColKeys.sort((a, b) => layoutOrder.indexOf(a) - layoutOrder.indexOf(b));

        return (
            <div className="grid grid-cols-12 gap-8 p-8 print:p-8">
                {/* --- LEFT COLUMN (36%) --- */}
                <div className="col-span-4 text-left">
                    {sortedLeft.map(key => sections[key])}
                </div>

                {/* --- RIGHT COLUMN (64%) --- */}
                <div className="col-span-8 text-left">
                    {sortedRight.map(key => sections[key])}
                </div>
            </div>
        )
    }

    // Header component
    const Header = () => {
        if (template === 'creative') {
            return (
                <header className="pt-10 pb-6 px-10 print:print-color-adjust-exact transition-colors flex flex-col items-center text-center border-b-[16px]" style={{ borderColor: themeColor }}>
                    {avatarSrc && (
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 mb-4 shadow-lg shrink-0 print:w-28 print:h-28" style={{ borderColor: themeColor }}>
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">
                        {data.basics.name}
                    </h1>
                    <span className="text-xl font-medium tracking-widest uppercase mb-4" style={{ color: themeColor }}>
                        {data.basics.headline}
                    </span>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-600">
                        {data.basics.email && <span>{data.basics.email}</span>}
                        {data.basics.phone && <span>{data.basics.phone}</span>}
                        {data.basics.location && <span>{data.basics.location}</span>}
                    </div>
                </header>
            )
        }

        if (template === 'professional') {
            return (
                <header className="py-8 px-10 border-b-2 text-slate-900" style={{ borderColor: themeColor }}>
                    <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ color: themeColor }}>
                        {data.basics.name}
                    </h1>
                    <div className="text-xl font-medium text-slate-700 mb-4">{data.basics.headline}</div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
                        {data.basics.email && <span className="flex items-center gap-1"><Mail size={12} />{data.basics.email}</span>}
                        {data.basics.phone && <span className="flex items-center gap-1"><Phone size={12} />{data.basics.phone}</span>}
                        {data.basics.location && <span className="flex items-center gap-1"><MapPin size={12} />{data.basics.location}</span>}
                        {data.basics.linkedin && <span className="flex items-center gap-1"><Linkedin size={12} />{data.basics.linkedin.replace(/^https?:\/\//, '')}</span>}
                        {data.basics.github && <span className="flex items-center gap-1"><Github size={12} />{data.basics.github.replace(/^https?:\/\//, '')}</span>}
                    </div>
                </header>
            )
        }

        // Modern (default)
        return (
            <header className="text-white py-8 px-10 print:print-color-adjust-exact transition-colors" style={{ backgroundColor: themeColor }}>
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    {avatarSrc && (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shrink-0 print:w-32 print:h-32">
                            <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="flex-1 mt-2">
                        <div className="flex items-baseline gap-3 mb-3">
                            <h1 className="text-4xl font-bold tracking-tight">
                                {data.basics.name}
                            </h1>
                            <span className="text-xl font-light opacity-90 border-l pl-3 border-white/30">
                                {data.basics.headline}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-light opacity-90">
                            {data.basics.email && (
                                <a href={`mailto:${data.basics.email}`} className="flex items-center gap-2 hover:text-white">
                                    <Mail size={14} /> {data.basics.email}
                                </a>
                            )}
                            {data.basics.phone && (
                                <a href={`tel:${data.basics.phone}`} className="flex items-center gap-2 hover:text-white">
                                    <Phone size={14} /> {data.basics.phone}
                                </a>
                            )}
                            {data.basics.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} /> {data.basics.location}
                                </div>
                            )}
                            {data.basics.linkedin && (
                                <a href={data.basics.linkedin.startsWith('http') ? data.basics.linkedin : `https://${data.basics.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                                    <Linkedin size={14} /> {data.basics.linkedin.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            )}
                            {data.basics.github && (
                                <a href={data.basics.github.startsWith('http') ? data.basics.github : `https://${data.basics.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                                    <Github size={14} /> {data.basics.github.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        )
    }

    return (
        <div id="resume-preview" className={`relative bg-white text-slate-800 w-[210mm] ${data.documentType === 'cv' ? 'min-h-[297mm]' : 'h-[297mm]'} shadow-2xl mx-auto origin-top transform scale-[0.6] lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-300 print:transform-none print:scale-100 print:shadow-none print:m-0 print:w-[210mm] print:overflow-visible font-sans overflow-hidden text-sm leading-relaxed ${themeFont}`}>
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
                    #resume-preview {
                        width: 210mm !important;
                        ${data.documentType === 'cv' ? 'min-height: 297mm !important;' : 'height: 297mm !important; overflow: hidden !important;'}
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        transform: scale(1) !important;
                    }
                }
            `}</style>

            {/* Visual Page Break Guide (Screen Only) */}
            {data.documentType === 'cv' && (
                <>
                    <div className="absolute top-[297mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-50 pointer-events-none print:hidden z-50 flex items-end justify-end pr-2 pb-1">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-white/80 px-1 rounded">End of Page 1</span>
                    </div>
                    <div className="absolute top-[594mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-50 pointer-events-none print:hidden z-50 flex items-end justify-end pr-2 pb-1">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-white/80 px-1 rounded">End of Page 2</span>
                    </div>
                    <div className="absolute top-[891mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-50 pointer-events-none print:hidden z-50 flex items-end justify-end pr-2 pb-1">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-white/80 px-1 rounded">End of Page 3</span>
                    </div>
                </>
            )}

            <Header />
            {renderLayout()}

        </div>
    )
}

export default ResumePaper
