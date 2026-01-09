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

    drawHeader(doc, subtitle) {
        // Professional gradient-style header
        doc.rect(0, 0, doc.page.width, 110).fill(this.colors.dark);
        
        // Accent line at bottom of header
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

        doc.moveDown(5);
    }

    drawSectionHeader(doc, title, y) {
        // Section header with underline (no icon)
        doc.font('Helvetica-Bold').fontSize(13).fillColor(this.colors.primary).text(title, 50, y);
        doc.moveTo(50, y + 18).lineTo(doc.page.width - 50, y + 18).strokeColor(this.colors.light).lineWidth(1).stroke();
        return y + 28;
    }

    // Enhanced page break check - prevents blank pages
    checkPageBreak(doc, currentY, neededHeight = 100) {
        const pageHeight = doc.page.height;
        const bottomMargin = 90; // Increased to reserve space for footer
        const contentEnd = pageHeight - bottomMargin;

        // Only add page if we truly need more space AND have content to add
        if (currentY + neededHeight > contentEnd && neededHeight > 0) {
            doc.addPage();
            return 50; // Reset Y to top margin
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

            let currentY = 130;

            // Profile Section
            currentY = this.drawSectionHeader(doc, 'Developer Profile', currentY);

            doc.font('Helvetica-Bold').fontSize(18).fillColor(this.colors.text).text(insights.profile?.name || user.name || user.githubUsername, 50, currentY);
            doc.font('Helvetica').fontSize(11).fillColor(this.colors.muted).text(`@${user.githubUsername}`, 50, currentY + 22);

            // Rank badge on right - larger and more prominent
            const grade = insights.rank?.grade || 'C';
            const gradeColors = { 'S+': '#fbbf24', 'S': '#f59e0b', 'A+': '#10b981', 'A': '#22c55e', 'B+': '#6366f1', 'B': '#8b5cf6', 'C+': '#64748b', 'C': '#94a3b8' };
            doc.roundedRect(doc.page.width - 110, currentY - 5, 60, 40, 8).fill(gradeColors[grade] || this.colors.muted);
            doc.font('Helvetica-Bold').fontSize(22).fillColor(this.colors.white).text(grade, doc.page.width - 110, currentY + 5, { width: 60, align: 'center' });
            doc.font('Helvetica').fontSize(8).fillColor(this.colors.white).text('RANK', doc.page.width - 110, currentY + 28, { width: 60, align: 'center' });

            currentY += 80; // Increased spacing

            // Stats Grid - Key Metrics
            currentY = this.drawSectionHeader(doc, 'Key Performance Metrics', currentY);

            const stats = insights.stats || {};
            const statBoxWidth = (doc.page.width - 150) / 4;

            // Row 1 - Primary stats with accent colors - REORDERED FOR CONTRAST
            this.drawStatBox(doc, 'Contributions', stats.totalContributions?.toLocaleString() || '0', 50, currentY, statBoxWidth, this.colors.primary);
            this.drawStatBox(doc, 'Current Streak', `${streak}d`, 50 + statBoxWidth + 12, currentY, statBoxWidth, this.colors.accent); // Changed to Accent
            this.drawStatBox(doc, 'Pull Requests', stats.totalPRs || '0', 50 + (statBoxWidth + 12) * 2, currentY, statBoxWidth, this.colors.success); // Changed to Success
            this.drawStatBox(doc, 'Issues Closed', stats.totalIssuesSolved || '0', 50 + (statBoxWidth + 12) * 3, currentY, statBoxWidth, this.colors.warning);

            currentY += 90; // Increased spacing

            // Row 2 - Secondary stats
            this.drawStatBox(doc, 'Public Repos', stats.publicRepos || '0', 50, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Private Repos', stats.privateRepos || '0', 50 + statBoxWidth + 12, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Code Reviews', stats.totalReviews || '0', 50 + (statBoxWidth + 12) * 2, currentY, statBoxWidth);
            this.drawStatBox(doc, 'Stars Earned', stats.totalStars || '0', 50 + (statBoxWidth + 12) * 3, currentY, statBoxWidth);

            currentY += 100; // Increased spacing

            // Recent Activity
            if (recentActivity && (recentActivity.pushEvents || recentActivity.prEvents || recentActivity.issueEvents)) {
                currentY = this.checkPageBreak(doc, currentY, 140);
                currentY = this.drawSectionHeader(doc, 'Activity This Week', currentY);

                // Activity stats in a grid
                const activityBoxWidth = (doc.page.width - 140) / 3;
                
                this.drawStatBox(doc, 'Pushes', recentActivity.pushEvents || '0', 50, currentY, activityBoxWidth, this.colors.primary);
                this.drawStatBox(doc, 'Pull Requests', recentActivity.prEvents || '0', 50 + activityBoxWidth + 20, currentY, activityBoxWidth, this.colors.secondary);
                this.drawStatBox(doc, 'Issue Events', recentActivity.issueEvents || '0', 50 + (activityBoxWidth + 20) * 2, currentY, activityBoxWidth, this.colors.accent);
                
                currentY += 90; // Increased spacing

                // Active Repos as Mini Cards
                if (recentActivity.reposWorkedOn && recentActivity.reposWorkedOn.length > 0) {
                     doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.muted).text('ACTIVE REPOSITORIES', 50, currentY + 5);
                     
                     currentY += 30; // Increased spacing
                     
                     // Calculate widths for a grid of 3
                     const repoBoxWidth = (doc.page.width - 120) / 3;
                     let repoX = 50;
                     // Better color rotation
                     const repoColors = [this.colors.success, this.colors.warning, this.colors.primary, this.colors.accent];

                     recentActivity.reposWorkedOn.slice(0, 3).forEach((repo, index) => {
                        const color = repoColors[index % repoColors.length];
                        
                        // Card Background
                        doc.roundedRect(repoX, currentY, repoBoxWidth, 35, 6).fill(this.colors.lighter);
                        doc.roundedRect(repoX, currentY, repoBoxWidth, 35, 6).strokeColor(this.colors.light).lineWidth(1).stroke();
                        
                        // Left Accent Bar using path for precise corner handling
                        doc.save();
                        doc.path(`M ${repoX} ${currentY} L ${repoX} ${currentY + 35} L ${repoX + 4} ${currentY + 35} L ${repoX + 4} ${currentY} Z`);
                        doc.clip();
                        doc.rect(repoX, currentY, 4, 35).fill(color);
                        doc.restore();
                        
                        // Repo Name
                        doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text).text(repo, repoX + 15, currentY + 11, { width: repoBoxWidth - 25, align: 'left', lineBreak: false, ellipsis: true });
                        
                        repoX += repoBoxWidth + 10;
                     });
                     
                     currentY += 70; // Increased spacing
                } else {
                    currentY += 30;
                }
            }

            // Projects Section
            if (repos && repos.length > 0) {
                const topRepos = repos.slice(0, 5);
                const projectsHeight = (topRepos.length * 28) + 60; // Increased estimate
                currentY = this.checkPageBreak(doc, currentY, projectsHeight);
                currentY = this.drawSectionHeader(doc, 'Top Projects', currentY);

                topRepos.forEach((repo, index) => {
                    const yPos = currentY + (index * 28); // Increased line height
                    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.colors.text).text(repo.name, 60, yPos, { width: 200 });
                    doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(`Issues: ${repo.open_issues_count || 0}`, 280, yPos);
                    doc.font('Helvetica-Bold').fontSize(9).fillColor(this.colors.success).text(repo.language || '—', 380, yPos);
                    doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted).text(String(repo.stars || 0), 450, yPos);
                });

                currentY += (topRepos.length * 28) + 30; // Increased spacing
            }

            // Languages
            if (insights.languages && insights.languages.length > 0) {
                const langCount = Math.min(insights.languages.length, 4);
                const langHeight = (langCount * 35) + 60;
                currentY = this.checkPageBreak(doc, currentY, langHeight);
                currentY = this.drawSectionHeader(doc, 'Language Proficiency', currentY);

                currentY += 10; // Extra padding below header

                insights.languages.slice(0, 4).forEach((lang) => {
                    currentY = this.drawProgressBar(doc, lang.name, lang.percentage || 0, 60, currentY, 280);
                });

                currentY += 30; // Increased spacing
            }

            // Badges/Achievements
            if (insights.badges && insights.badges.length > 0) {
                currentY = this.checkPageBreak(doc, currentY, 100);
                currentY = this.drawSectionHeader(doc, 'Achievements', currentY);

                let badgeX = 60;
                insights.badges.slice(0, 4).forEach((badge) => {
                    this.drawBadge(doc, badge.name, badgeX, currentY);
                    badgeX += 125;
                });

                currentY += 60; // Increased spacing
            }

            // Professional Footer - fixed at bottom of page
            // Logic to prevent footer appearing on empty page is handled by checkPageBreak padding
            const footerY = doc.page.height - 50;
            
            // Draw footer line
            doc.moveTo(50, footerY - 10).lineTo(doc.page.width - 50, footerY - 10).strokeColor(this.colors.light).lineWidth(1).stroke();
            
            // Draw footer text
            doc.font('Helvetica').fontSize(9).fillColor(this.colors.muted);
            doc.text('Generated by DevTrack • Your Developer Consistency Tracker', 50, footerY, { align: 'center', width: doc.page.width - 100 });

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
