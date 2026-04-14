import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export const generateResumeDocx = async (data, projects, verifiedSkills, user) => {
    // Helper for spacing
    const createEmptyLine = () => new Paragraph({ text: "" });

    // Section header
    const createSectionHeader = (title) => new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.LEFT,
        border: {
            bottom: {
                color: "000000",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
            },
        },
        spacing: { before: 200, after: 120 }
    });

    const children = [];

    // 1. Header (Name & Contact)
    children.push(
        new Paragraph({
            text: data.basics.name,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: data.basics.email, size: 24 }),
                new TextRun({ text: " | ", size: 24 }),
                new TextRun({ text: data.basics.phone || data.basics.location || "", size: 24 }),
                data.basics.linkedin ? new TextRun({ text: ` | LinkedIn: ${data.basics.linkedin.replace(/^https?:\/\//, '')}`, size: 24 }) : new TextRun(""),
                data.basics.github ? new TextRun({ text: ` | GitHub: ${data.basics.github.replace(/^https?:\/\//, '')}`, size: 24 }) : new TextRun(""),
            ].filter(run => run.text !== "")
        }),
        createEmptyLine()
    );

    // Dynamic order based on layoutOrder
    const layoutOrder = data.layoutOrder || ['summary', 'experience', 'projects', 'education', 'skills', 'achievements'];

    layoutOrder.forEach(section => {
        if (section === 'summary' && data.basics.summary) {
            children.push(
                createSectionHeader("Professional Summary"),
                new Paragraph({
                    children: [new TextRun({ text: data.basics.summary, size: 24 })],
                    spacing: { after: 120 }
                })
            );
        }

        if (section === 'experience' && data.experience && data.experience.length > 0) {
            children.push(createSectionHeader("Experience"));
            data.experience.forEach(exp => {
                children.push(
                    new Paragraph({
                        tabStops: [{ type: "right", position: 9000 }],
                        children: [
                            new TextRun({ text: exp.role, bold: true, size: 24 }),
                            new TextRun({ text: `\t${exp.startDate} – ${exp.endDate}`, size: 24 }),
                        ],
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: exp.company, italics: true, size: 24 })],
                        spacing: { after: 40 }
                    })
                );
                
                if (exp.description) {
                    exp.description.split('\n').filter(l => l.trim()).forEach(line => {
                        children.push(
                            new Paragraph({
                                text: line.trim(),
                                size: 24,
                                bullet: { level: 0 }
                            })
                        );
                    });
                }
                children.push(createEmptyLine());
            });
        }

        if (section === 'projects' && projects && projects.length > 0) {
            children.push(createSectionHeader("Projects"));
            projects.forEach(proj => {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: proj.name, bold: true, size: 24 }),
                            proj.repositoryUrl ? new TextRun({ text: ` (${proj.repositoryUrl})`, size: 20 }) : new TextRun(""),
                        ],
                        spacing: { after: 40 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: proj.description, size: 24 })],
                        spacing: { after: 80 }
                    })
                );

                const features = (proj.longDescription || proj.description)?.split('. ').filter(s => s.trim());
                if (features && features.length > 0) {
                    features.slice(0, 4).forEach(feature => {
                        children.push(
                            new Paragraph({
                                text: feature.replace(/\.$/, '').trim(),
                                size: 24,
                                bullet: { level: 0 }
                            })
                        );
                    });
                }
                children.push(createEmptyLine());
            });
        }

        if (section === 'education' && data.education && data.education.length > 0) {
            children.push(createSectionHeader("Education"));
            data.education.forEach(edu => {
                children.push(
                    new Paragraph({
                        tabStops: [{ type: "right", position: 9000 }],
                        children: [
                            new TextRun({ text: edu.school, bold: true, size: 24 }),
                            new TextRun({ text: `\t${edu.year}`, size: 24 }),
                        ],
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: edu.degree, size: 24 })],
                        spacing: { after: 120 }
                    })
                );
            });
            children.push(createEmptyLine());
        }

        if (section === 'skills' && (data.selectedSkillNames?.length > 0 || data.skills?.length > 0)) {
            children.push(createSectionHeader("Skills"));
            const allSkills = [
                ...(data.selectedSkillNames || []),
                ...(data.skills || [])
            ];
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: allSkills.join(', '), size: 24 })],
                    spacing: { after: 120 }
                })
            );
            children.push(createEmptyLine());
        }

        if (section === 'achievements' && data.achievements && data.achievements.length > 0) {
            children.push(createSectionHeader("Achievements"));
            data.achievements.forEach(ach => {
                const text = typeof ach === 'string' ? ach : ach.text;
                children.push(
                    new Paragraph({
                        text,
                        size: 24,
                        bullet: { level: 0 }
                    })
                );
            });
            children.push(createEmptyLine());
        }
    });

    // Create document
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5 inch margins
                },
            },
            children: children,
        }],
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial",
                    },
                },
            },
        },
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${data.basics.name.replace(/\s+/g, '_')}_Resume.docx`);
};
