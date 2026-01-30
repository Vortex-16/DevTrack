// DevTrack Activity Logger - Background Service Worker
// Tracks active tab changes and sends duration data to backend

const BACKEND_URL = "https://devtrack-api.onrender.com";
const MIN_DURATION = 3; // Minimum seconds to log (ignore quick switches)

let currentTab = null;
let startTime = Date.now();

// ============== TAB TRACKING ==============
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        handleTabChange(tab);
    } catch (e) {
        console.error("Tab activation error:", e);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active) {
        handleTabChange(tab);
    }
});

// When window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // Browser lost focus - log current tab
        logCurrentTab();
        currentTab = null;
    } else {
        // Browser gained focus - get active tab
        try {
            const [tab] = await chrome.tabs.query({ active: true, windowId });
            if (tab) handleTabChange(tab);
        } catch (e) {
            console.error("Window focus error:", e);
        }
    }
});

// ============== CORE LOGIC ==============
function handleTabChange(tab) {
    // Skip internal browser pages
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
        return;
    }

    const now = Date.now();

    // Log previous tab if exists
    if (currentTab && currentTab.url) {
        const duration = Math.round((now - startTime) / 1000);
        if (duration >= MIN_DURATION) {
            sendToBackend({
                url: currentTab.url,
                title: currentTab.title || "",
                duration: duration
            });
        }
    }

    // Set new current tab
    currentTab = {
        url: tab.url,
        title: tab.title
    };
    startTime = now;
}

function logCurrentTab() {
    if (currentTab && currentTab.url) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        if (duration >= MIN_DURATION) {
            sendToBackend({
                url: currentTab.url,
                title: currentTab.title || "",
                duration: duration
            });
        }
    }
}

// ============== BACKEND COMMUNICATION ==============
async function sendToBackend(data) {
    try {
        const response = await fetch(`${BACKEND_URL}/log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Logged: ${data.title} (${data.duration}s) → ${result.category}`);

            // Store locally for popup stats
            updateLocalStats(data, result.category);
        }
    } catch (e) {
        console.error("Backend connection failed:", e);
        // Store offline for later sync
        storeOffline(data);
    }
}

// ============== LOCAL STORAGE ==============
async function updateLocalStats(data, category) {
    const today = new Date().toISOString().split("T")[0];
    const stats = await chrome.storage.local.get(["dailyStats"]) || {};

    if (!stats.dailyStats || stats.dailyStats.date !== today) {
        stats.dailyStats = { date: today, totalTime: 0, categories: {} };
    }

    stats.dailyStats.totalTime += data.duration;
    stats.dailyStats.categories[category] = (stats.dailyStats.categories[category] || 0) + data.duration;

    await chrome.storage.local.set(stats);
}

async function storeOffline(data) {
    const offline = await chrome.storage.local.get(["offlineQueue"]) || {};
    offline.offlineQueue = offline.offlineQueue || [];
    offline.offlineQueue.push({ ...data, timestamp: Date.now() });
    await chrome.storage.local.set(offline);
}

// Sync offline data when backend becomes available
async function syncOfflineData() {
    const offline = await chrome.storage.local.get(["offlineQueue"]);
    if (offline.offlineQueue && offline.offlineQueue.length > 0) {
        for (const item of offline.offlineQueue) {
            await sendToBackend(item);
        }
        await chrome.storage.local.set({ offlineQueue: [] });
    }
}

// Try to sync every 5 minutes
setInterval(syncOfflineData, 5 * 60 * 1000);

console.log("🚀 DevTrack Activity Logger initialized");
