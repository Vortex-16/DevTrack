# server.py - Activity Intelligence System Backend
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "activity.db")

# ============== DATABASE SETUP ==============
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Auto-create tables if they don't exist
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS web_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT,
            domain TEXT,
            duration REAL DEFAULT 0,
            category TEXT DEFAULT 'uncategorized',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            duration REAL DEFAULT 0,
            category TEXT DEFAULT 'application',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    
    # Web activity from browser extension
    cur.execute("""
        CREATE TABLE IF NOT EXISTS web_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            title TEXT,
            domain TEXT,
            duration REAL DEFAULT 0,
            category TEXT DEFAULT 'uncategorized',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # App activity from shell tracker
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            duration REAL DEFAULT 0,
            category TEXT DEFAULT 'application',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

# ============== CLASSIFICATION ==============
CATEGORY_KEYWORDS = {
    "learning": ["udemy", "coursera", "stackoverflow", "docs", "tutorial", "learn", "education", "course", "documentation", "mdn", "w3schools"],
    "coding": ["github", "gitlab", "vscode", "replit", "codepen", "leetcode", "hackerrank", "code", "developer"],
    "social": ["twitter", "facebook", "instagram", "linkedin", "reddit", "discord", "whatsapp", "telegram", "x.com"],
    "entertainment": ["youtube", "netflix", "spotify", "twitch", "gaming", "movie", "music", "video"],
    "news": ["news", "bbc", "cnn", "times", "guardian", "blog"],
    "shopping": ["amazon", "flipkart", "ebay", "shop", "store", "buy"],
    "productivity": ["notion", "trello", "asana", "calendar", "drive", "sheets", "docs"]
}

def classify_activity(text):
    """Classify activity intent using keyword matching"""
    text_lower = text.lower() if text else ""
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return category
    
    return "uncategorized"

def extract_domain(url):
    """Extract domain from URL"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except:
        return url

# ============== API ENDPOINTS ==============
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})

@app.route("/log", methods=["POST"])
def log_web_activity():
    """Log website activity from browser extension"""
    data = request.json
    
    url = data.get("url", "")
    title = data.get("title", "")
    duration = data.get("duration", 0)
    
    domain = extract_domain(url)
    category = classify_activity(f"{url} {title}")
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO web_activity (url, title, domain, duration, category)
        VALUES (?, ?, ?, ?, ?)
    """, (url, title, domain, duration, category))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "ok", "category": category})

@app.route("/app_log", methods=["POST"])
def log_app_activity():
    """Log application activity from shell tracker"""
    data = request.json
    
    app_name = data.get("app", "")
    duration = data.get("duration", 0)
    category = data.get("category", classify_activity(app_name))
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO app_activity (app_name, duration, category)
        VALUES (?, ?, ?)
    """, (app_name, duration, category))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "ok", "category": category})

@app.route("/insights/daily", methods=["GET"])
def daily_insights():
    """Get daily productivity insights"""
    conn = get_db()
    cur = conn.cursor()
    
    # Web activity summary
    cur.execute("""
        SELECT category, SUM(duration) as total_time, COUNT(*) as visits
        FROM web_activity
        WHERE date(timestamp) = date('now')
        GROUP BY category
        ORDER BY total_time DESC
    """)
    web_by_category = [dict(row) for row in cur.fetchall()]
    
    # Top websites
    cur.execute("""
        SELECT domain, title, SUM(duration) as total_time
        FROM web_activity
        WHERE date(timestamp) = date('now')
        GROUP BY domain
        ORDER BY total_time DESC
        LIMIT 10
    """)
    top_sites = [dict(row) for row in cur.fetchall()]
    
    # App activity summary
    cur.execute("""
        SELECT category, SUM(duration) as total_time
        FROM app_activity
        WHERE date(timestamp) = date('now')
        GROUP BY category
        ORDER BY total_time DESC
    """)
    apps_by_category = [dict(row) for row in cur.fetchall()]
    
    # Top apps
    cur.execute("""
        SELECT app_name, SUM(duration) as total_time
        FROM app_activity
        WHERE date(timestamp) = date('now')
        GROUP BY app_name
        ORDER BY total_time DESC
        LIMIT 10
    """)
    top_apps = [dict(row) for row in cur.fetchall()]
    
    conn.close()
    
    # Calculate totals
    total_web_time = sum(c["total_time"] or 0 for c in web_by_category)
    total_app_time = sum(c["total_time"] or 0 for c in apps_by_category)
    
    # Productivity score (learning + coding vs entertainment + social)
    productive_time = sum(
        c["total_time"] or 0 for c in web_by_category + apps_by_category
        if c["category"] in ["learning", "coding", "productivity"]
    )
    distraction_time = sum(
        c["total_time"] or 0 for c in web_by_category + apps_by_category
        if c["category"] in ["entertainment", "social"]
    )
    
    total_tracked = productive_time + distraction_time
    productivity_score = int((productive_time / total_tracked * 100)) if total_tracked > 0 else 0
    
    return jsonify({
        "date": datetime.now().strftime("%Y-%m-%d"),
        "summary": {
            "total_web_time_seconds": total_web_time,
            "total_app_time_seconds": total_app_time,
            "productivity_score": productivity_score
        },
        "web_by_category": web_by_category,
        "apps_by_category": apps_by_category,
        "top_sites": top_sites,
        "top_apps": top_apps
    })

@app.route("/insights/history", methods=["GET"])
def history():
    """Get recent activity history"""
    limit = request.args.get("limit", 50, type=int)
    
    conn = get_db()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 'web' as type, url as name, title, domain, duration, category, timestamp
        FROM web_activity
        UNION ALL
        SELECT 'app' as type, app_name as name, '' as title, '' as domain, duration, category, timestamp
        FROM app_activity
        ORDER BY timestamp DESC
        LIMIT ?
    """, (limit,))
    
    history = [dict(row) for row in cur.fetchall()]
    conn.close()
    
    return jsonify({"history": history})

# ============== MAIN ==============
if __name__ == "__main__":
    init_db()
    print("🚀 Activity Intelligence Server running on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
