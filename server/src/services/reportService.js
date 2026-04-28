/**
 * Report Service
 * Generates beautiful weekly GitHub PDF reports and sends via email using Gmail SMTP
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const emailService = require('./emailService');
const { collections } = require('../config/firebase');
const GitHubService = require('./githubService');
const { getActiveGithubToken } = require('./githubAccessService');
const { getGroqService } = require('./groqService');

class ReportService {
    constructor() {
        // Path to logo
        this.logoPath = path.join(__dirname, '../../../client/public/DevTrack.png');
    }

    // Color palette - Professional dark theme
    colors = {
        primary: '#6366f1',
        primaryDark: '#4f46e5',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        dark: '#0f172a',
        darkGray: '#1e293b',
        text: '#1e293b',
        textLight: '#334155',
        muted: '#64748b',
        light: '#f1f5f9',
        lighter: '#f8fafc',
        success: '#10b981',
        successLight: '#d1fae5',
        warning: '#f59e0b',
        warningLight: '#fef3c7',
        danger: '#ef4444',
        white: '#ffffff',
    };

    drawHeader(doc, subtitle, isShort = false) {
        if (isShort) {
            // Simplified header for subsequent pages
            doc.rect(0, 0, doc.page.width, 50).fill(this.colors.dark);
            doc.rect(0, 48, doc.page.width, 2).fill(this.colors.primary);
            doc.font('Helvetica-Bold').fontSize(16).fillColor(this.colors.white).text('DevTrack', 50, 15);
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.muted).text(subtitle, doc.page.width - 200, 20, { width: 150, align: 'right' });
            return;
        }

        // Professional gradient-style header
        doc.rect(0, 0, doc.page.width, 110).fill(this.colors.dark);
        doc.rect(0, 108, doc.page.width, 2).fill(this.colors.primary);

        // Logo
        if (fs.existsSync(this.logoPath)) {
            doc.image(this.logoPath, 50, 25, { width: 55 });
        }

        // Title with better typography
        doc.font('Helvetica-Bold').fontSize(26).fillColor(this.colors.white).text('DevTrack', 115, 28);
        doc.font('Helvetica').fontSize(14).fillColor(this.colors.primary).text('Weekly Performance Report', 115, 58);

        // Date on right side
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text(subtitle, doc.page.width - 200, 40, { width: 150, align: 'right' });

        // Week range
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(dateRange, doc.page.width - 200, 55, { width: 150, align: 'right' });
    }

    drawSectionHeader(doc, title, y) {
        // Section header with underline (no icon)
        doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.primary).text(title, 50, y);
        doc.moveTo(50, y + 18).lineTo(doc.page.width - 50, y + 18).strokeColor(this.colors.light).lineWidth(1).stroke();
        return y + 28;
    }

    // Enhanced page break check - prevents blank pages
    checkPageBreak(doc, currentY, neededHeight = 100, subtitle = '') {
        const pageHeight = doc.page.height;
        const bottomMargin = 80; 
        const contentEnd = pageHeight - bottomMargin;

        if (currentY + neededHeight > contentEnd) {
            doc.addPage();
            this.drawHeader(doc, subtitle, true);
            return 70; // Top margin for subsequent pages (after short header)
        }
        return currentY;
    }

    drawStatBox(doc, label, value, x, y, width = 120, accentColor = null) {
        const color = accentColor || this.colors.primary;

        // Box background with subtle border effect
        doc.roundedRect(x, y, width, 55, 8).fill(this.colors.lighter);
        doc.roundedRect(x, y, width, 55, 8).strokeColor(this.colors.light).lineWidth(1).stroke();

        // Color accent bar at top
        doc.roundedRect(x, y, width, 4, 2).fill(color);

        // Value - larger and bolder
        doc.font('Helvetica-Bold').fontSize(20).fillColor(color).text(String(value), x, y + 14, { width, align: 'center' });

        // Label
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(label, x, y + 38, { width, align: 'center' });
    }

    drawProgressBar(doc, label, percentage, x, y, width = 250) {
        const barHeight = 10;
        const safePercentage = Math.min(100, Math.max(0, percentage || 0));

        // Label row
        doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text).text(label, x, y);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.primary).text(`${safePercentage}%`, x + width - 35, y);

        // Background bar
        doc.roundedRect(x, y + 16, width, barHeight, 5).fill(this.colors.light);

        // Progress bar with gradient effect
        const progressWidth = (safePercentage / 100) * width;
        if (progressWidth > 0) {
            doc.roundedRect(x, y + 16, Math.max(progressWidth, 10), barHeight, 5).fill(this.colors.primary);
        }

        return y + 32;
    }

    drawBadge(doc, name, x, y) {
        // Badge without icon
        doc.roundedRect(x, y, 115, 30, 15).fill(this.colors.lighter);
        doc.roundedRect(x, y, 115, 30, 15).strokeColor(this.colors.light).lineWidth(1).stroke();

        doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.text).text(name, x + 5, y + 10, { width: 105, align: 'center' });
    }

    drawAIInsights(doc, insights, y, subtitle = '') {
        const boxWidth = doc.page.width - 100;
        const LEFT = 50;
        const INNER_LEFT = 65;
        const TEXT_WIDTH = boxWidth - 30;

        // ── Section header ──────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.primary)
            .text('AI Strategic Insights', LEFT, y);
        doc.moveTo(LEFT, y + 18).lineTo(doc.page.width - LEFT, y + 18)
            .strokeColor(this.colors.light).lineWidth(1).stroke();
        y += 30;

        // ── Executive Summary card ───────────────────────────────
        const execSummary = insights.executiveSummary || insights.summary || 'Solid work this week!';
        const summaryLines = doc.heightOfString(execSummary, { width: TEXT_WIDTH - 20, lineGap: 2 });
        const summaryBoxH = summaryLines + 30;

        doc.roundedRect(LEFT, y, boxWidth, summaryBoxH, 8).fill('#f0f4ff');
        doc.roundedRect(LEFT, y, boxWidth, summaryBoxH, 8).strokeColor('#c7d2fe').lineWidth(1).stroke();
        // Badge
        doc.roundedRect(LEFT + 8, y + 8, 100, 16, 8).fill(this.colors.primary);
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
            .text('EXECUTIVE SUMMARY', LEFT + 12, y + 12);
        doc.font('Helvetica').fontSize(9.5).fillColor('#1e293b')
            .text(execSummary, INNER_LEFT, y + 30, { width: TEXT_WIDTH - 20, lineGap: 2 });
        y += summaryBoxH + 12;

        // ── Growth Score + Sentiment row ─────────────────────────
        const growthScore = insights.growthScore;
        const sentiment = insights.sentiment || 'Positive';
        const sentimentColors = {
            'Excellent': '#16a34a', 'Strong': '#059669', 'Positive': '#0369a1',
            'Neutral': '#92400e', 'Encouraging': '#0369a1', 'Needs Attention': '#dc2626'
        };
        const sentimentBg = {
            'Excellent': '#dcfce7', 'Strong': '#d1fae5', 'Positive': '#dbeafe',
            'Neutral': '#fef3c7', 'Encouraging': '#dbeafe', 'Needs Attention': '#fee2e2'
        };
        const sColor = sentimentColors[sentiment] || '#0369a1';
        const sBg = sentimentBg[sentiment] || '#dbeafe';

        // Sentiment pill
        const sentW = doc.widthOfString(sentiment) + 22;
        doc.roundedRect(LEFT, y, sentW, 22, 11).fill(sBg);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(sColor)
            .text(sentiment, LEFT + 11, y + 6);

        // Growth score pill (if present)
        if (growthScore) {
            const scoreLabel = `Growth Score: ${growthScore.score}/100  ·  ${growthScore.label}`;
            const scoreW = doc.widthOfString(scoreLabel) + 22;
            doc.roundedRect(LEFT + sentW + 10, y, scoreW, 22, 11).fill('#f0fdf4');
            doc.roundedRect(LEFT + sentW + 10, y, scoreW, 22, 11).strokeColor('#bbf7d0').lineWidth(1).stroke();
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#15803d')
                .text(scoreLabel, LEFT + sentW + 21, y + 6);
        }
        y += 32;

        // ── Strategic Insight bullets ────────────────────────────
        const strategicInsights = insights.strategicInsights || [];
        if (strategicInsights.length > 0) {
            doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text)
                .text('Strategic Recommendations', INNER_LEFT, y);
            y += 16;

            for (const item of strategicInsights) {
                const title  = item.title  || '';
                const detail = item.detail || '';
                const detailH = doc.heightOfString(detail, { width: TEXT_WIDTH - 45, lineGap: 1.5 });
                const rowH = detailH + 25;

                // Granular check for each recommendation
                y = this.checkPageBreak(doc, y, rowH, subtitle);

                // Bullet dot
                doc.circle(INNER_LEFT + 4, y + 8, 3.5).fill(this.colors.primary);

                // Title
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1e293b')
                    .text(title, INNER_LEFT + 14, y);
                y += 13;

                // Detail
                doc.font('Helvetica').fontSize(9).fillColor('#475569')
                    .text(detail, INNER_LEFT + 14, y, { width: TEXT_WIDTH - 45, lineGap: 1.5 });
                y += detailH + 8;
            }
        }

        // ── Risk Flags ───────────────────────────────────────────
        const riskFlags = (insights.riskFlags || []).filter(
            f => f && !f.toLowerCase().includes('no critical'));
        if (riskFlags.length > 0) {
            y = this.checkPageBreak(doc, y, 60, subtitle); // Ensure space for flags
            y += 4;
            doc.roundedRect(LEFT, y, boxWidth, 18, 4).fill('#fff7ed');
            doc.roundedRect(LEFT, y, boxWidth, 18, 4).strokeColor('#fed7aa').lineWidth(1).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#c2410c')
                .text('⚠  Risk Flag', LEFT + 10, y + 4);
            doc.font('Helvetica').fontSize(8).fillColor('#7c2d12')
                .text(riskFlags[0], LEFT + 80, y + 4, { width: boxWidth - 90 });
            y += 22;
            if (riskFlags.length > 1) {
                y = this.checkPageBreak(doc, y, 25, subtitle);
                doc.roundedRect(LEFT, y, boxWidth, 18, 4).fill('#fff7ed');
                doc.roundedRect(LEFT, y, boxWidth, 18, 4).strokeColor('#fed7aa').lineWidth(1).stroke();
                doc.font('Helvetica').fontSize(8).fillColor('#7c2d12')
                    .text(`⚠  ${riskFlags[1]}`, LEFT + 10, y + 4, { width: boxWidth - 20 });
                y += 22;
            }
        }

        return y + 14;
    }

    async generatePDFReport(userId, preExistingData = null) {
        const userDoc = await collections.users().doc(userId).get();
        const user = userDoc.data();
        
        const githubService = new GitHubService(getActiveGithubToken(user));
        
        let insights, repos, contributions, streak, recentActivity, aiInsights;

        if (preExistingData) {
            // Reconstruct from stored data
            insights = { stats: preExistingData.stats || {} };
            repos = []; // Not stored, but we can live without it for old reports or refactor
            contributions = { streak: preExistingData.stats?.streak || 0 };
            streak = contributions.streak;
            recentActivity = { totalEvents: (preExistingData.stats?.totalCommits || 0) + (preExistingData.stats?.totalPRs || 0) };
            aiInsights = preExistingData.aiInsights;
        } else {
            // Fresh generation
            [insights, repos, contributions] = await Promise.all([
                githubService.getGitHubInsights(user.githubUsername),
                githubService.getRepos(user.githubUsername, 10),
                githubService.getContributions(user.githubUsername)
            ]);

            streak = contributions?.streak || 0;

            try {
                recentActivity = await githubService.getActivitySummary(user.githubUsername);
                const groqService = getGroqService();
                aiInsights = await groqService.generateWeeklyInsights(recentActivity);
            } catch (e) {
                console.warn('Supplementary data failed:', e.message);
            }
        }

        const subtitle = preExistingData 
            ? new Date(preExistingData.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
            : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            
            // Footer drawing helper
            const drawFooter = (d) => {
                const footerY = d.page.height - 45;
                d.moveTo(50, footerY - 10).lineTo(d.page.width - 50, footerY - 10).strokeColor('#f1f5f9').lineWidth(1).stroke();
                d.font('Helvetica').fontSize(8).fillColor('#94a3b8')
                    .text('Confidential Weekly Performance Analysis • Generated by DevTrack Core AI Engine', 50, footerY, { align: 'center', width: d.page.width - 100 });
            };

            // Generate Impact Score early
            const activityBonus = (recentActivity?.totalEvents || 0) * 0.8;
            const impactScore = Math.min(99, Math.round((insights.rank?.score || 0) / 10 + activityBonus + (streak > 5 ? 10 : 0)));

            doc.on('end', () => {
                // Apply footer to all pages at the very end safely
                const range = doc.bufferedPageRange();
                for (let i = range.start; i < range.start + range.count; i++) {
                    doc.switchToPage(i);
                    
                    // Critical: temporarily disable margins to prevent auto-paging from the footer itself
                    const oldBottomMargin = doc.page.margins.bottom;
                    doc.page.margins.bottom = 0;
                    
                    drawFooter(doc);
                    
                    doc.page.margins.bottom = oldBottomMargin;
                }

                resolve({
                    pdfBuffer: Buffer.concat(chunks),
                    aiInsights: aiInsights,
                    stats: {
                        totalCommits: insights.stats?.totalCommits || 0,
                        totalPRs: insights.stats?.totalPRs || 0,
                        streak: streak,
                        impactScore: impactScore
                    }
                });
            });
            doc.on('error', reject);

            // Start first page
            this.drawHeader(doc, subtitle, false);
            // We draw footer at the very end of content for each page transition
            // and once more before doc.end()
            let currentY = 140;

            // 1. Profile & Impact Score
            doc.font('Helvetica-Bold').fontSize(20).fillColor('#1e293b').text(insights.profile?.name || user.name || user.githubUsername, 50, currentY);
            doc.font('Helvetica').fontSize(12).fillColor('#64748b').text(`@${user.githubUsername}`, 50, currentY + 24);

            // Circular Impact Score - Premium Look
            const centerX = doc.page.width - 80;
            const centerY = currentY + 15;
            doc.circle(centerX, centerY, 32).lineWidth(6).strokeColor('#f1f5f9').stroke();
            doc.circle(centerX, centerY, 32).lineWidth(6).strokeColor('#6366f1').stroke();
            
            // Center the text: X = Center - (BoxWidth / 2)
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#1e293b')
                .text(impactScore.toString(), centerX - 25, centerY - 9, { width: 50, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#6366f1')
                .text('IMPACT', centerX - 25, centerY + 11, { width: 50, align: 'center' });

            currentY += 85;

            // 2. Metrics Snapshot
            currentY = this.drawSectionHeader(doc, 'Performance Snapshot', currentY);
            const stats = insights.stats || {};
            const boxW = (doc.page.width - 130) / 4;
            this.drawStatBox(doc, 'Commits', stats.totalCommits || 0, 50, currentY, boxW, '#6366f1');
            this.drawStatBox(doc, 'PRs', stats.totalPRs || 0, 50 + boxW + 10, currentY, boxW, '#10b981');
            this.drawStatBox(doc, 'Streak', `${streak}d`, 50 + (boxW + 10) * 2, currentY, boxW, '#f59e0b');
            this.drawStatBox(doc, 'Solved', stats.totalIssuesSolved || 0, 50 + (boxW + 10) * 3, currentY, boxW, '#ef4444');
            currentY += 100;

            // 3. Strategic AI Insights
            if (aiInsights) {
                // Reduced guard to 200 so it can start on page 1 if there is space
                currentY = this.checkPageBreak(doc, currentY, 200, subtitle);
                currentY = this.drawAIInsights(doc, aiInsights, currentY, subtitle);
            }

            // 4. Repository Intelligence (with Clones/Stars)
            if (recentActivity?.reposWorkedOn) {
                currentY = this.checkPageBreak(doc, currentY, 150, subtitle);
                currentY = this.drawSectionHeader(doc, 'Project Activity Intel', currentY);

                const reposToDraw = Array.isArray(recentActivity.reposWorkedOn) 
                    ? recentActivity.reposWorkedOn 
                    : Array.from(recentActivity.reposWorkedOn.values());

            for (const repoData of reposToDraw.slice(0, 5)) {
                    const repoName = repoData.name;
                    const commits = repoData.commitsThisWeek || 0;
                    const stars = repoData.stars || 0;
                    const clones = repoData.clones || 0;
                    const insightRaw = (aiInsights?.projectInsights)
                        ? aiInsights.projectInsights[repoName]
                        : null;

                    // Resolve rich object vs legacy string
                    let insightHeadline = null;
                    let insightBrief    = null;
                    let insightNext     = null;
                    if (insightRaw) {
                        if (typeof insightRaw === 'object') {
                            insightHeadline = insightRaw.headline || null;
                            insightBrief    = insightRaw.brief    || null;
                            insightNext     = insightRaw.nextStep || null;
                        } else {
                            insightBrief = String(insightRaw);
                        }
                    }

                    const hasInsight = !!(insightBrief);

                    // Calculate card height dynamically
                    const briefTextH = hasInsight
                        ? doc.heightOfString(insightBrief, { width: doc.page.width - 160, lineGap: 2 })
                        : 0;
                    const nextStepH = insightNext ? 18 : 0;
                    const aiBlockH  = hasInsight ? (24 + briefTextH + nextStepH + 16) : 0;
                    const cardH     = 75 + aiBlockH;

                    currentY = this.checkPageBreak(doc, currentY, cardH + 10);

                    // ── Card background ──────────────────────────────────
                    doc.roundedRect(50, currentY, doc.page.width - 100, cardH, 10).fill('#ffffff');
                    doc.roundedRect(50, currentY, doc.page.width - 100, cardH, 10)
                        .strokeColor('#e2e8f0').lineWidth(1.5).stroke();
                    // Left accent bar
                    doc.roundedRect(50, currentY, 4, cardH, 2).fill(this.colors.primary);

                    // ── Repo name ─────────────────────────────────────────
                    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e293b')
                        .text(repoName, 65, currentY + 14);

                    // ── Stats badges ──────────────────────────────────────
                    let badgeX = 65;
                    const drawBadge = (label, val, col) => {
                        const txt = `${label}: ${val}`;
                        const tw  = doc.widthOfString(txt) + 24; // Increased padding
                        doc.roundedRect(badgeX, currentY + 34, tw, 22, 11).fill(col === '#000000' ? '#1e293b' : col + '18');
                        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(col === '#000000' ? '#ffffff' : col)
                            .text(txt, badgeX + 12, currentY + 41);
                        badgeX += tw + 10;
                    };
                    drawBadge('Commits', commits, '#6366f1');
                    drawBadge('⭐ Stars', stars, '#f59e0b');
                    drawBadge('Clones 7d', clones, '#10b981');

                    // ── AI Brief block ────────────────────────────────────
                    if (hasInsight) {
                        const aiTop = currentY + 62;

                        // AI Brief background
                        doc.roundedRect(62, aiTop, doc.page.width - 124, aiBlockH - 8, 7).fill('#f8faff');
                        doc.roundedRect(62, aiTop, doc.page.width - 124, aiBlockH - 8, 7)
                            .strokeColor('#c7d2fe').lineWidth(0.8).stroke();

                        // "AI Brief" label pill
                        doc.roundedRect(70, aiTop + 7, 48, 14, 7).fill('#6366f1');
                        doc.font('Helvetica-Bold').fontSize(7).fillColor('#ffffff')
                            .text('AI BRIEF', 74, aiTop + 11);

                        // Headline
                        if (insightHeadline) {
                            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#3730a3')
                                .text(insightHeadline, 124, aiTop + 7);
                        }

                        // Brief text
                        doc.font('Helvetica').fontSize(9).fillColor('#334155')
                            .text(insightBrief, 72, aiTop + (insightHeadline ? 22 : 10),
                                { width: doc.page.width - 148, lineGap: 2 });

                        // Next Step badge
                        if (insightNext) {
                            const nextY = aiTop + (insightHeadline ? 22 : 10) + briefTextH + 4;
                            const nextLabel = `→ Next: ${insightNext}`;
                            doc.font('Helvetica-Bold').fontSize(8).fillColor('#059669')
                                .text(nextLabel, 72, nextY, { width: doc.page.width - 148 });
                        }
                    }

                    currentY += cardH + 8;
                }

            }

            // 5. Technology Stack Radar
            if (insights.languages?.length > 0) {
                currentY = this.checkPageBreak(doc, currentY, 120);
                currentY = this.drawSectionHeader(doc, 'Technology Ecosystem', currentY);
                currentY += 20;
                insights.languages.slice(0, 4).forEach((lang) => {
                    currentY = this.drawProgressBar(doc, lang.name, lang.percentage || 0, 60, currentY, 350);
                });
            }

            doc.end();
        });
    }

    async sendWeeklyReportEmail(userId) {
        try {
            const userDoc = await collections.users().doc(userId).get();
            if (!userDoc.exists) {
                console.log(`User ${userId} not found`);
                return { success: false, error: 'User not found' };
            }

            const user = userDoc.data();
            if (!user.email) {
                console.log(`User ${userId} has no email`);
                return { success: false, error: 'No email' };
            }

            if (!user.githubUsername) {
                console.log(`User ${userId} has no GitHub connected`);
                return { success: false, error: 'GitHub not connected' };
            }

            console.log(`Generating PDF report and AI Insights for ${user.email}...`);
            const reportData = await this.generatePDFReport(userId);
            const { pdfBuffer, aiInsights, stats } = reportData;

            const aiSummary = aiInsights ? aiInsights.executiveSummary || aiInsights.summary : '';

            // Store the report data in Firestore for historical tracking
            try {
                const reportRef = collections.reports().doc();
                await reportRef.set({
                    userId: userId,
                    createdAt: new Date().toISOString(),
                    stats: stats,
                    aiInsights: aiInsights || null
                });
                console.log(`Saved report history to Firestore for ${user.email}`);
            } catch (dbError) {
                console.error(`Failed to save report history to Firestore:`, dbError);
                // Continue sending email even if db save fails
            }

            console.log(`Sending report to ${user.email}...`);
            const result = await emailService.sendWeeklyReport(
                user.email,
                user.name || user.githubUsername,
                pdfBuffer,
                aiSummary
            );

            if (!result.success) {
                console.error(`Failed to send report to ${user.email}:`, result.error);
                return { success: false, error: result.error };
            }

            console.log(`Report sent to ${user.email}!`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`Error sending report to user ${userId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async sendAllWeeklyReports() {
        console.log('Starting weekly report distribution...');

        try {
            const usersSnapshot = await collections.users().get();
            let sent = 0;
            let failed = 0;

            for (const doc of usersSnapshot.docs) {
                const user = doc.data();

                if (user.email && user.githubUsername) {
                    const result = await this.sendWeeklyReportEmail(doc.id);
                    if (result.success) {
                        sent++;
                    } else {
                        failed++;
                    }

                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            console.log(`Weekly reports complete: ${sent} sent, ${failed} failed`);
            return { sent, failed };
        } catch (error) {
            console.error('Error in weekly report distribution:', error);
            return { sent: 0, failed: 0, error: error.message };
        }
    }
}

module.exports = new ReportService();
