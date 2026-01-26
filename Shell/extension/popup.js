// DevTrack Activity Logger - Popup Script
const BACKEND_URL = "http://localhost:5000";

const CATEGORY_COLORS = {
    learning: "#10b981",
    coding: "#3b82f6",
    productivity: "#8b5cf6",
    social: "#f59e0b",
    entertainment: "#ef4444",
    news: "#6366f1",
    shopping: "#ec4899",
    uncategorized: "#6b7280"
};

document.addEventListener("DOMContentLoaded", async () => {
    await loadStats();
});

async function loadStats() {
    const content = document.getElementById("content");
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");

    try {
        // Try to fetch from backend
        const response = await fetch(`${BACKEND_URL}/insights/daily`);

        if (response.ok) {
            const data = await response.json();
            statusDot.classList.remove("offline");
            statusText.textContent = "Tracking active";
            renderStats(data);
        } else {
            throw new Error("Backend error");
        }
    } catch (e) {
        // Fall back to local storage
        statusDot.classList.add("offline");
        statusText.textContent = "Offline mode";

        const local = await chrome.storage.local.get(["dailyStats"]);
        if (local.dailyStats) {
            renderLocalStats(local.dailyStats);
        } else {
            content.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: #888;">
          <p>No data yet today.</p>
          <p style="margin-top: 8px; font-size: 12px;">Start browsing to track activity!</p>
        </div>
      `;
        }
    }
}

function renderStats(data) {
    const content = document.getElementById("content");

    const totalMinutes = Math.round((data.summary.total_web_time_seconds || 0) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    const sitesCount = data.top_sites?.length || 0;
    const productivityScore = data.summary.productivity_score || 0;

    let categoriesHTML = "";
    for (const cat of data.web_by_category || []) {
        const minutes = Math.round(cat.total_time / 60);
        const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.uncategorized;
        categoriesHTML += `
      <div class="category-item">
        <span class="category-name">
          <span class="category-dot" style="background: ${color}"></span>
          ${cat.category}
        </span>
        <span class="category-time">${minutes}m</span>
      </div>
    `;
    }

    content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${timeDisplay}</div>
        <div class="stat-label">Total Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${sitesCount}</div>
        <div class="stat-label">Sites Visited</div>
      </div>
    </div>
    
    <div class="productivity-bar">
      <div class="productivity-header">
        <span class="productivity-label">Productivity Score</span>
        <span class="productivity-score">${productivityScore}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${productivityScore}%"></div>
      </div>
    </div>
    
    ${categoriesHTML ? `
      <div class="categories">
        <h3>Today's Categories</h3>
        ${categoriesHTML}
      </div>
    ` : ""}
    
    <div class="footer">
      <a href="http://localhost:5000/insights/daily" target="_blank">View Full Dashboard →</a>
    </div>
  `;
}

function renderLocalStats(stats) {
    const content = document.getElementById("content");

    const totalMinutes = Math.round(stats.totalTime / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    let categoriesHTML = "";
    for (const [cat, seconds] of Object.entries(stats.categories || {})) {
        const minutes = Math.round(seconds / 60);
        const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.uncategorized;
        categoriesHTML += `
      <div class="category-item">
        <span class="category-name">
          <span class="category-dot" style="background: ${color}"></span>
          ${cat}
        </span>
        <span class="category-time">${minutes}m</span>
      </div>
    `;
    }

    content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${timeDisplay}</div>
        <div class="stat-label">Total Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">-</div>
        <div class="stat-label">Offline</div>
      </div>
    </div>
    
    ${categoriesHTML ? `
      <div class="categories">
        <h3>Today's Categories</h3>
        ${categoriesHTML}
      </div>
    ` : ""}
    
    <div class="footer">
      <p style="font-size: 11px; color: #888;">Data will sync when backend is online</p>
    </div>
  `;
}
