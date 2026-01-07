/**
 * Report Service
 * Generates beautiful weekly GitHub PDF reports and sends via email using Resend
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { Resend } = require('resend');
const { collections } = require('../config/firebase');
const GitHubService = require('./githubService');

class ReportService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        // Path to logo
        this.logoPath = path.join(__dirname, '../../../client/public/DevTrack.png');
    }

    // Color palette
    colors = {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        dark: '#0f172a',
        text: '#1e293b',
        muted: '#64748b',
        light: '#f1f5f9',
        success: '#10b981',
        warning: '#f59e0b',
    };

    drawHeader(doc, subtitle) {
        // Dark header background
        doc.rect(0, 0, doc.page.width, 100).fill(this.colors.dark);

        // Logo
        if (fs.existsSync(this.logoPath)) {
            doc.image(this.logoPath, 50, 20, { width: 50 });
        }

        // Title
        doc.font('Helvetica-Bold').fontSize(24).fillColor('#ffffff').text('DevTrack Weekly Report', 110, 30);

        // Subtitle
        doc.font('Helvetica').fontSize(11).fillColor(this.colors.muted).text(subtitle, 110, 60);

        doc.moveDown(4);
    }

    drawSectionHeader(doc, title, y) {
        doc.font('Helvetica-Bold').fontSize(14).fillColor(this.colors.primary).text(title, 50, y);
        doc.moveTo(50, y + 20).lineTo(doc.page.width - 50, y + 20).strokeColor(this.colors.light).lineWidth(1).stroke();
        return y + 32;
    }

    // Check if we need a page break and add one if needed
    checkPageBreak(doc, currentY, neededHeight = 100) {
        const pageHeight = doc.page.height;
        const bottomMargin = 60;

        if (currentY + neededHeight > pageHeight - bottomMargin) {
            doc.addPage();
            return 50; // Reset Y to top margin
        }
        return currentY;
    }

    drawStatBox(doc, label, value, x, y, width = 120) {
        // Box background
        doc.roundedRect(x, y, width, 50, 6).fill(this.colors.light);

        // Value
        doc.font('Helvetica-Bold').fontSize(18).fillColor(this.colors.primary).text(String(value), x, y + 10, { width, align: 'center' });

        // Label
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(label, x, y + 34, { width, align: 'center' });
    }

    drawProgressBar(doc, label, percentage, x, y, width = 220) {
        const barHeight = 8;

        // Label
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.text).text(label, x, y);
        doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text(`${percentage}%`, x + width - 30, y);

        // Background bar
        doc.roundedRect(x, y + 14, width, barHeight, 4).fill(this.colors.light);

        // Progress bar
        const progressWidth = (percentage / 100) * width;
        if (progressWidth > 0) {
            doc.roundedRect(x, y + 14, Math.max(progressWidth, 8), barHeight, 4).fill(this.colors.primary);
        }

        return y + 28;
    }

    drawBadge(doc, name, x, y) {
        doc.roundedRect(x, y, 110, 26, 13).fill(this.colors.light);
        doc.font('Helvetica').fontSize(9).fillColor(this.colors.text).text(name, x + 5, y + 8, { width: 100, align: 'center' });
    }

    async generatePDFReport(userId) {
        // Get user data
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }
        const user = userDoc.data();

        if (!user.githubUsername) {
            throw new Error('GitHub not connected');
        }

        // Get GitHub insights
        const githubService = new GitHubService(user.githubAccessToken);
        const insights = await githubService.getGitHubInsights(user.githubUsername);

        // Get recent activity
        let recentActivity = null;
        try {
            recentActivity = await githubService.getActivitySummary(user.githubUsername);
        } catch (e) {
            console.warn('Could not fetch activity summary:', e.message);
        }

        // Get streak from commits data
        let streak = 0;
        try {
            const commitsData = await githubService.getRecentCommits(user.githubUsername, 30);
            streak = commitsData.streak || 0;
        } catch (e) {
            console.warn('Could not fetch streak:', e.message);
        }

        // Get repos for projects section
        let repos = [];
        try {
            repos = await githubService.getRepos(user.githubUsername, 10);
        } catch (e) {
            console.warn('Could not fetch repos:', e.message);
        }

        // Create PDF
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header with logo
            this.drawHeader(doc, new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }));

            let currentY = 120;

            // Profile Section
            currentY = this.drawSectionHeader(doc, 'Developer Profile', currentY);

            doc.font('Helvetica-Bold').fontSize(16).fillColor(this.colors.text).text(insights.profile?.name || user.name || user.githubUsername, 50, currentY);
            doc.font('Helvetica').fontSize(11).fillColor(this.colors.muted).text(`@${user.githubUsername}`, 50, currentY + 20);

            // Rank badge on right
            const grade = insights.rank?.grade || 'C';
            const gradeColors = { 'S+': '#fbbf24', 'S': '#f59e0b', 'A+': '#10b981', 'A': '#22c55e', 'B+': '#6366f1', 'B': '#8b5cf6', 'C+': '#64748b', 'C': '#94a3b8' };
            doc.roundedRect(doc.page.width - 100, currentY, 50, 32, 6).fill(gradeColors[grade] || this.colors.muted);
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text(grade, doc.page.width - 100, currentY + 7, { width: 50, align: 'center' });

            currentY += 55;

            // Stats Grid
            currentY = this.drawSectionHeader(doc, 'Weekly Statistics', currentY);

            const stats = insights.stats || {};
            const statBoxWidth = (doc.page.width - 140) / 4;

            this.drawStatBox(doc, 'Contributions', stats.totalContributions?.toLocaleString() || '0', 50, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Current Streak', `${streak}d`, 50 + statBoxWidth + 10, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Pull Requests', stats.totalPRs || '0', 50 + (statBoxWidth + 10) * 2, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Issues', stats.totalIssuesSolved || '0', 50 + (statBoxWidth + 10) * 3, currentY, statBoxWidth);

            currentY += 65;

            this.drawStatBox(doc, 'Public Repos', stats.publicRepos || '0', 50, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Private Repos', stats.privateRepos || '0', 50 + statBoxWidth + 10, currentY, statBoxWidth);
            this.drawStatBox(doc, 'PR Reviews', stats.totalReviews || '0', 50 + (statBoxWidth + 10) * 2, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Stars Earned', stats.totalStars || '0', 50 + (statBoxWidth + 10) * 3, currentY, statBoxWidth);

            currentY += 75;

            // Recent Activity
            if (recentActivity) {
                currentY = this.checkPageBreak(doc, currentY, 100);
                currentY = this.drawSectionHeader(doc, 'Recent Activity (Last 7 Days)', currentY);

                doc.font('Helvetica').fontSize(11).fillColor(this.colors.text);
                doc.text(`Push Events: ${recentActivity.pushEvents || 0}`, 60, currentY);
                doc.text(`Pull Request Events: ${recentActivity.prEvents || 0}`, 60, currentY + 16);
                doc.text(`Issue Events: ${recentActivity.issueEvents || 0}`, 60, currentY + 32);

                if (recentActivity.reposWorkedOn && recentActivity.reposWorkedOn.length > 0) {
                    doc.font('Helvetica').fontSize(10).fillColor(this.colors.muted).text(`Active repos: ${recentActivity.reposWorkedOn.slice(0, 3).join(', ')}`, 60, currentY + 52);
                }

                currentY += 75;
            }

            // Projects Section
            if (repos && repos.length > 0) {
                const projectsHeight = (Math.min(repos.length, 5) * 22) + 50;
                currentY = this.checkPageBreak(doc, currentY, projectsHeight);
                currentY = this.drawSectionHeader(doc, 'Active Projects', currentY);

                const topRepos = repos.slice(0, 5);
                topRepos.forEach((repo, index) => {
                    const yPos = currentY + (index * 22);
                    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text).text(repo.name, 60, yPos, { width: 200 });

                    const openIssues = repo.open_issues_count || 0;
                    doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(`Open Issues: ${openIssues}`, 270, yPos);
                    doc.font('Helvetica').fontSize(9).fillColor(this.colors.success).text(repo.language || 'N/A', 400, yPos);
                });

                currentY += (topRepos.length * 22) + 15;
            }

            // Issues Summary
            currentY = this.checkPageBreak(doc, currentY, 80);
            currentY = this.drawSectionHeader(doc, 'Issues Summary', currentY);
            const issuesSolved = stats.totalIssuesSolved || 0;
            const openIssues = repos ? repos.reduce((sum, r) => sum + (r.open_issues_count || 0), 0) : 0;

            doc.font('Helvetica').fontSize(11).fillColor(this.colors.text);
            doc.text(`Issues Solved: ${issuesSolved}`, 60, currentY);
            doc.text(`Open Issues (across repos): ${openIssues}`, 60, currentY + 16);

            currentY += 50;

            // Languages
            if (insights.languages && insights.languages.length > 0) {
                const langHeight = (Math.min(insights.languages.length, 4) * 30) + 50;
                currentY = this.checkPageBreak(doc, currentY, langHeight);
                currentY = this.drawSectionHeader(doc, 'Top Languages', currentY);

                insights.languages.slice(0, 4).forEach((lang) => {
                    currentY = this.drawProgressBar(doc, lang.name, lang.percentage || 0, 60, currentY, 250);
                });

                currentY += 15;
            }

            // Badges
            if (insights.badges && insights.badges.length > 0) {
                currentY = this.checkPageBreak(doc, currentY, 80);
                currentY = this.drawSectionHeader(doc, 'Achievements Unlocked', currentY);

                let badgeX = 60;
                insights.badges.slice(0, 4).forEach((badge) => {
                    this.drawBadge(doc, badge.name, badgeX, currentY);
                    badgeX += 120;
                });

                currentY += 45;
            }

            // Footer
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted);
            doc.text('Generated by DevTrack - Your Developer Consistency Tracker', 50, doc.page.height - 50, { align: 'center', width: doc.page.width - 100 });

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

            console.log(`Generating PDF report for ${user.email}...`);
            const pdfBuffer = await this.generatePDFReport(userId);

            console.log(`Sending report to ${user.email}...`);
            const { data, error } = await this.resend.emails.send({
                from: 'DevTrack <reports@resend.dev>',
                to: user.email,
                subject: `Your Weekly GitHub Report - ${new Date().toLocaleDateString()}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; padding: 40px; border-radius: 16px;">
                        <h1 style="color: #6366f1; margin-bottom: 8px;">Weekly DevTrack Report</h1>
                        <p style="color: #94a3b8; margin-bottom: 24px;">Hi ${user.name || user.githubUsername},</p>
                        <p style="color: #e2e8f0;">Your weekly GitHub activity report is attached as a PDF.</p>
                        <p style="color: #e2e8f0;">Keep up the great work and maintain your coding streak!</p>
                        <hr style="border: 1px solid #1e293b; margin: 24px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Generated by DevTrack - Your Developer Consistency Tracker
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `devtrack-report-${new Date().toISOString().split('T')[0]}.pdf`,
                        content: pdfBuffer.toString('base64'),
                    }
                ]
            });

            if (error) {
                console.error(`Failed to send report to ${user.email}:`, error);
                return { success: false, error: error.message };
            }

            console.log(`Report sent to ${user.email}!`);
            return { success: true, emailId: data?.id };
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
