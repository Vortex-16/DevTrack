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
    // Helper to render section headers
    const SectionHeader = ({ title }) => (
        <div className="bg-slate-100 py-1.5 px-4 mb-4 mt-2 print:bg-slate-100 print:break-inside-avoid">
            <h3 className="text-center font-bold text-slate-600 uppercase tracking-widest text-sm">
                {title}
            </h3>
        </div>
    )

    // Calculate avatar source
    const avatarSrc = data.basics.avatar || user?.avatar || user?.picture || user?.githubAvatar;

    return (
        <div id="resume-preview" className="relative bg-white text-slate-800 w-[210mm] min-h-[297mm] shadow-2xl mx-auto origin-top transform scale-[0.6] lg:scale-[0.75] xl:scale-[0.85] transition-transform duration-300 print:transform-none print:scale-100 print:shadow-none print:m-0 print:w-full print:h-auto font-sans overflow-hidden text-sm leading-relaxed">

            {/* Visual Page Break Guide (Screen Only) */}
            <div className="absolute top-[297mm] left-0 w-full border-b-2 border-red-400 border-dashed opacity-50 pointer-events-none print:hidden z-50 flex items-end justify-end pr-2 pb-1">
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest bg-white/80 px-1 rounded">End of Page 1</span>
            </div>

            {/* Header (Dark Slate) */}
            <header className="bg-[#435260] text-white py-8 px-10 print:bg-[#435260] print:print-color-adjust-exact">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    {avatarSrc && (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#52606d] shrink-0 print:w-32 print:h-32">
                            <img
                                src={avatarSrc}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="flex-1 mt-2">
                        <div className="flex items-baseline gap-3 mb-3">
                            <h1 className="text-4xl font-bold tracking-tight">
                                {data.basics.name}
                            </h1>
                            <span className="text-xl font-light opacity-90 border-l pl-3 border-gray-400">
                                {data.basics.headline}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-light opacity-90">
                            {data.basics.email && (
                                <a href={`mailto:${data.basics.email}`} className="flex items-center gap-2 hover:text-cyan-300">
                                    <Mail size={14} /> {data.basics.email}
                                </a>
                            )}
                            {data.basics.phone && (
                                <a href={`tel:${data.basics.phone}`} className="flex items-center gap-2 hover:text-cyan-300">
                                    <Phone size={14} /> {data.basics.phone}
                                </a>
                            )}
                            {data.basics.location && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} /> {data.basics.location}
                                </div>
                            )}
                            {data.basics.linkedin && (
                                <a href={data.basics.linkedin.startsWith('http') ? data.basics.linkedin : `https://${data.basics.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-cyan-300">
                                    <Linkedin size={14} /> {data.basics.linkedin.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            )}
                            {data.basics.github && (
                                <a href={data.basics.github.startsWith('http') ? data.basics.github : `https://${data.basics.github}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-cyan-300">
                                    <Github size={14} /> {data.basics.github.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-12 gap-8 p-8 print:p-8">

                {/* --- LEFT COLUMN (36%) --- */}
                <div className="col-span-4 space-y-6 text-left">

                    {/* Profile Summary */}
                    {data.basics.summary && (
                        <section>
                            <SectionHeader title="Profile" />
                            <p className="text-justify text-slate-800 leading-relaxed font-medium">
                                {data.basics.summary}
                            </p>
                        </section>
                    )}

                    {/* Skills */}
                    {(data.selectedSkillNames.length > 0 || data.skills.length > 0) && (
                        <section>
                            <SectionHeader title="Skills" />
                            <div className="space-y-4">
                                {/* Verified Skills (with bars) */}
                                {data.selectedSkillNames.map(name => {
                                    const verified = verifiedSkills.find(s => s.name === name);
                                    // Calculate width based on count (max 10 roughly?)
                                    const percentage = verified ? Math.min(verified.count * 10, 100) : 60;

                                    return (
                                        <div key={name}>
                                            <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
                                                <span>{name}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-600 rounded-full print:bg-slate-600 print:print-color-adjust-exact" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Other Skills (Manual) */}
                                {data.skills.length > 0 && (
                                    <div className="mt-4">
                                        <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">Domains & Interests</div>
                                        <div className="text-sm text-slate-700 leading-relaxed italic">
                                            {data.skills.join(', ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Certificates */}
                    {data.achievements && data.achievements.length > 0 && (
                        <section>
                            <SectionHeader title="Certificates" />
                            <ul className="space-y-2">
                                {data.achievements.map((achievement, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                                        <span className="mt-1.5 w-1.5 h-1.5 bg-slate-800 rounded-full shrink-0"></span>
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
                    )}
                </div>


                {/* --- RIGHT COLUMN (64%) --- */}
                <div className="col-span-8 space-y-6 text-left">

                    {/* Projects */}
                    {projects.length > 0 && (
                        <section>
                            <SectionHeader title="Projects" />
                            <div className="space-y-6">
                                {projects.map((proj) => (
                                    <div key={proj.id} className="relative">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2">
                                                {proj.name}
                                                {proj.repositoryUrl && (
                                                    <a href={proj.repositoryUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-black">
                                                        <LinkIcon size={14} />
                                                    </a>
                                                )}
                                            </h4>

                                            {/* Date placeholder */}
                                            {proj.createdAt && (
                                                <span className="text-xs font-semibold text-slate-500">
                                                    {new Date(proj.createdAt).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })} – Present
                                                </span>
                                            )}
                                        </div>

                                        <div className="mb-2 text-sm font-medium text-slate-700">
                                            {proj.description.split('.')[0]}.
                                        </div>

                                        <div className="text-sm text-slate-800">
                                            <span className="font-bold text-xs uppercase mb-1 block">Key Features</span>
                                            <ul className="list-disc ml-4 space-y-1 text-slate-700">
                                                {(proj.longDescription || proj.description).split('. ').slice(0, 4).map((sentence, idx) => {
                                                    if (!sentence.trim()) return null;
                                                    const clean = sentence.replace(/\.$/, '');
                                                    return (
                                                        <li key={idx} className="pl-1">
                                                            {/* Try to bold first few words if they look like a header */}
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
                    )}

                    {/* Education */}
                    {data.education.length > 0 && (
                        <section>
                            <SectionHeader title="Education" />
                            <div className="space-y-6">
                                {data.education.map((edu, i) => (
                                    <div key={i}>
                                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            {edu.degree}
                                        </h4>
                                        <div className="flex justify-between items-center text-sm font-semibold text-slate-700 mb-1">
                                            <span className="flex items-center gap-1">
                                                {edu.school}
                                                <LinkIcon size={12} className="opacity-50" />
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-2 font-medium">
                                            {edu.year} | {data.basics.location || 'India'}
                                            <span className="block mt-1">Grade: 8.5/10 (Example)</span>
                                        </div>

                                        <div className="text-sm text-slate-700">
                                            <ul className="list-disc ml-4 space-y-1">
                                                <li><span className="font-bold">Core Subjects:</span> Data Structures, Algorithms, DBMS, Operating Systems.</li>
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                        <section>
                            <SectionHeader title="Experience" />
                            <div className="space-y-6">
                                {data.experience.map((exp, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="text-base font-bold text-slate-900">{exp.role}</h4>
                                            <span className="text-xs font-bold text-slate-500">{exp.startDate} – {exp.endDate}</span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 mb-2">{exp.company}</div>
                                        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-700">
                                            {exp.description.split('\n').map((line, idx) => (
                                                <li key={idx}>{line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>
    )
}

export default ResumePaper
