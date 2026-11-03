/**
 * MindHaven - Basic Mood Tracker
 * Provides daily 5-emoji check-in, emotional context tags,
 * backend API persistence with anonymous ID, SVG 7-day trend chart,
 * and user data privacy purge.
 */

const MOOD_CONFIG = {
  5: { name: 'Great', emoji: '😄', color: '#38a169' },
  4: { name: 'Good', emoji: '🙂', color: '#48bb78' },
  3: { name: 'Okay', emoji: '😐', color: '#4a5568' },
  2: { name: 'Down', emoji: '😔', color: '#dd6b20' },
  1: { name: 'Struggling', emoji: '😣', color: '#e53e3e' }
};

let selectedRating = 3;
let selectedTags = new Set();
let moodHistory = [];

document.addEventListener('DOMContentLoaded', () => {
  initMoodTracker();
});

function initMoodTracker() {
  setupEmojiSelector();
  setupTagChips();
  setupFormSubmit();
  setupClearDataBtn();
  loadUserMoodHistory();
}

function setupEmojiSelector() {
  const emojiBtns = document.querySelectorAll('.emoji-btn');
  emojiBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      emojiBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedRating = Number(btn.dataset.rating) || 3;
    });
  });
}

function setupTagChips() {
  const chips = document.querySelectorAll('.tag-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        chip.classList.remove('active');
      } else {
        selectedTags.add(tag);
        chip.classList.add('active');
      }
    });
  });
}

function setupFormSubmit() {
  const form = document.getElementById('moodForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const noteInput = document.getElementById('moodNote');
    const note = noteInput ? noteInput.value.trim() : '';
    const user = AnonymousUser.get();
    const moodMeta = MOOD_CONFIG[selectedRating] || MOOD_CONFIG[3];

    const payload = {
      userId: user.id,
      rating: selectedRating,
      moodName: moodMeta.name,
      emoji: moodMeta.emoji,
      tags: Array.from(selectedTags),
      note: note
    };

    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Daily mood check-in logged safely.', 'success');
        if (noteInput) noteInput.value = '';
        selectedTags.clear();
        document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
        loadUserMoodHistory();
      } else {
        fallbackLocalSave(payload);
      }
    } catch (err) {
      console.warn('API unavailable, falling back to local storage:', err);
      fallbackLocalSave(payload);
    }
  });
}

function fallbackLocalSave(payload) {
  const localList = JSON.parse(localStorage.getItem('mindhaven_local_moods') || '[]');
  const entry = {
    ...payload,
    id: 'loc_' + Date.now(),
    timestamp: new Date().toISOString()
  };
  localList.unshift(entry);
  localStorage.setItem('mindhaven_local_moods', JSON.stringify(localList));
  showToast('Mood check-in saved locally.', 'success');
  loadUserMoodHistory();
}

async function loadUserMoodHistory() {
  const user = AnonymousUser.get();
  try {
    const res = await fetch(`/api/mood/${user.id}`);
    if (res.ok) {
      const data = await res.json();
      moodHistory = data.moods || [];
    } else {
      moodHistory = JSON.parse(localStorage.getItem('mindhaven_local_moods') || '[]');
    }
  } catch (err) {
    moodHistory = JSON.parse(localStorage.getItem('mindhaven_local_moods') || '[]');
  }

  renderHistoryList();
  renderSummaryStats();
  renderTrendChart();
}

function renderHistoryList() {
  const container = document.getElementById('moodHistoryList');
  if (!container) return;

  if (moodHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px 10px; color:var(--text-light); font-size:0.9rem;">
        No check-ins logged yet. Log your first check-in above to begin tracking your wellness patterns.
      </div>
    `;
    return;
  }

  container.innerHTML = moodHistory.map(item => {
    const dateObj = new Date(item.timestamp);
    const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const tagsHtml = (item.tags || []).map(t => `<span class="history-tag-mini">${escapeHtml(t)}</span>`).join('');
    const noteHtml = item.note ? `<div style="font-size:0.82rem; color:var(--text-muted); margin-top:6px; font-style:italic;">"${escapeHtml(item.note)}"</div>` : '';

    return `
      <div class="history-item">
        <div class="history-left">
          <span class="history-emoji">${item.emoji || '😐'}</span>
          <div>
            <div class="history-mood-name">${escapeHtml(item.moodName || 'Logged')}</div>
            <div class="history-date">${dateStr}</div>
            ${item.tags && item.tags.length > 0 ? `<div class="history-tags">${tagsHtml}</div>` : ''}
            ${noteHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderSummaryStats() {
  const totalCountEl = document.getElementById('statTotalCount');
  const avgScoreEl = document.getElementById('statAvgScore');
  const topTagEl = document.getElementById('statTopTag');

  if (!totalCountEl || !avgScoreEl || !topTagEl) return;

  const total = moodHistory.length;
  totalCountEl.textContent = total;

  if (total === 0) {
    avgScoreEl.textContent = '--';
    topTagEl.textContent = '--';
    return;
  }

  const sum = moodHistory.reduce((acc, m) => acc + (Number(m.rating) || 3), 0);
  const avg = (sum / total).toFixed(1);
  avgScoreEl.textContent = `${avg}/5`;

  const tagCounts = {};
  moodHistory.forEach(m => {
    (m.tags || []).forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  topTagEl.textContent = sortedTags.length > 0 ? sortedTags[0][0] : 'None yet';
}

// Generate interactive SVG 7-Day Trend Chart
function renderTrendChart() {
  const wrapper = document.getElementById('moodChartWrapper');
  if (!wrapper) return;

  if (moodHistory.length < 2) {
    wrapper.innerHTML = `
      <div style="text-align:center; color:var(--text-light); font-size:0.88rem; padding: 20px;">
        Log at least 2 check-ins to render your visual mood trend curve.
      </div>
    `;
    return;
  }

  // Get last 7 entries (chronological order)
  const recent = [...moodHistory].slice(0, 7).reverse();
  const width = 460;
  const height = 150;
  const paddingX = 40;
  const paddingY = 24;

  const stepX = (width - paddingX * 2) / (recent.length - 1);
  const points = recent.map((item, index) => {
    const x = paddingX + index * stepX;
    // Rating 1..5 mapped to height
    const normalized = (item.rating - 1) / 4; // 0 to 1
    const y = height - paddingY - normalized * (height - paddingY * 2);
    return { x, y, rating: item.rating, emoji: item.emoji, date: new Date(item.timestamp).toLocaleDateString([], { weekday: 'short' }) };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const circles = points.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="8" fill="rgba(66, 153, 225, 0.25)"/>
    <circle cx="${p.x}" cy="${p.y}" r="5" fill="#3182ce" stroke="#ffffff" stroke-width="2"/>
    <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" font-size="14">${p.emoji}</text>
    <text x="${p.x}" y="${height - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#64748b">${p.date}</text>
  `).join('');

  wrapper.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto; display:block; filter: drop-shadow(0 4px 12px rgba(66, 153, 225, 0.15));">
      <defs>
        <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3182ce" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3182ce" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <line x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}" stroke="rgba(226, 232, 240, 0.7)" stroke-dasharray="3,3"/>
      <line x1="${paddingX}" y1="${height / 2}" x2="${width - paddingX}" y2="${height / 2}" stroke="rgba(226, 232, 240, 0.7)" stroke-dasharray="3,3"/>
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="rgba(226, 232, 240, 0.7)" stroke-dasharray="3,3"/>

      <!-- Glowing Gradient Area -->
      <path d="${areaD}" fill="url(#trendAreaGradient)"/>

      <!-- Trend Line -->
      <path d="${pathD}" fill="none" stroke="#2b6cb0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${circles}
    </svg>
  `;
}

function setupClearDataBtn() {
  const btn = document.getElementById('clearMoodDataBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (confirm('Permanently delete all your mood check-in records? This action cannot be undone.')) {
      const user = AnonymousUser.get();
      try {
        await fetch(`/api/mood/${user.id}`, { method: 'DELETE' });
      } catch (e) {}
      localStorage.removeItem('mindhaven_local_moods');
      moodHistory = [];
      renderHistoryList();
      renderSummaryStats();
      renderTrendChart();
      showToast('All mood check-in history wiped successfully.', 'info');
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
