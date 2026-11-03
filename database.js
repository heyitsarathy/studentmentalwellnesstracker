const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB schema
const initialSchema = {
  moods: [],
  reports: [],
  crisisLogs: []
};

// Load or initialize DB
function loadDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2), 'utf-8');
      return initialSchema;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[DB] Error loading database file, reinitializing fallback:', err.message);
    return initialSchema;
  }
}

// Memory cache
let dbCache = loadDb();
let writePromise = Promise.resolve();

// Persist to disk asynchronously with write queue
function persistDb() {
  writePromise = writePromise.then(async () => {
    try {
      await fs.promises.writeFile(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error persisting to disk:', err.message);
    }
  });
  return writePromise;
}

// --- Mood Tracking Methods ---
async function saveMood(entry) {
  const newEntry = {
    id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: entry.userId || 'anonymous',
    rating: Number(entry.rating) || 3,
    moodName: entry.moodName || 'Neutral',
    emoji: entry.emoji || '😐',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    note: (entry.note || '').trim().slice(0, 500),
    timestamp: new Date().toISOString()
  };

  dbCache.moods.push(newEntry);
  await persistDb();
  return newEntry;
}

async function getMoodsByUser(userId) {
  if (!userId) return [];
  return dbCache.moods
    .filter(m => m.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function deleteMoodsByUser(userId) {
  if (!userId) return false;
  dbCache.moods = dbCache.moods.filter(m => m.userId !== userId);
  await persistDb();
  return true;
}

async function getMoodStats() {
  const total = dbCache.moods.length;
  if (total === 0) {
    return {
      total: 0,
      averageRating: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      topTags: []
    };
  }

  const sum = dbCache.moods.reduce((acc, curr) => acc + (curr.rating || 3), 0);
  const avg = (sum / total).toFixed(1);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const tagCounts = {};

  dbCache.moods.forEach(m => {
    const r = m.rating || 3;
    if (distribution[r] !== undefined) distribution[r]++;
    if (Array.isArray(m.tags)) {
      m.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  return {
    total,
    averageRating: Number(avg),
    distribution,
    topTags
  };
}

// --- Safety & Reporting Methods ---
async function saveReport(report) {
  const newReport = {
    id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    reporterId: report.reporterId || 'anonymous',
    reportedUser: report.reportedUser || 'Unknown User',
    messageContent: report.messageContent || '',
    room: report.room || 'General Support',
    reason: report.reason || 'Inappropriate content',
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  dbCache.reports.push(newReport);
  await persistDb();
  return newReport;
}

async function getReports() {
  return [...dbCache.reports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// --- Crisis Log (Anonymous metrics only) ---
async function logCrisisTrigger(type = 'general_crisis') {
  dbCache.crisisLogs.push({
    type,
    timestamp: new Date().toISOString()
  });
  // Keep only last 1000 anonymous events
  if (dbCache.crisisLogs.length > 1000) {
    dbCache.crisisLogs = dbCache.crisisLogs.slice(-1000);
  }
  await persistDb();
}

module.exports = {
  saveMood,
  getMoodsByUser,
  deleteMoodsByUser,
  getMoodStats,
  saveReport,
  getReports,
  logCrisisTrigger
};
