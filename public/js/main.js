/**
 * MindHaven - Core Client Logic
 * Handles anonymous user identity, emergency crisis modals,
 * ambient audio soundscape (Web Audio API), and common UI utilities.
 */

const ADJECTIVES = [
  'Calm', 'Gentle', 'Serene', 'Peaceful', 'Quiet', 'Patient', 'Mindful',
  'Kind', 'Hopeful', 'Brave', 'Steady', 'Warm', 'Resilient', 'Grounded',
  'Reflective', 'Compassionate', 'Thoughtful', 'Tranquil', 'Soft', 'Healing'
];

const NOUNS = [
  'Otter', 'Panda', 'Sparrow', 'River', 'Breeze', 'Forest', 'Harbor',
  'Cedar', 'Willow', 'Dolphin', 'Koala', 'Clover', 'Meadow', 'Horizon',
  'Starlight', 'Fern', 'Robin', 'Lagoon', 'Haven', 'Beacon'
];

const AVATAR_COLORS = [
  '#3182ce', '#38a169', '#805ad5', '#d69e2e', '#dd6b20',
  '#319795', '#e53e3e', '#4a5568', '#4299e1', '#48bb78'
];

// --- Anonymous User Identity Manager ---
const AnonymousUser = {
  get() {
    let stored = localStorage.getItem('mindhaven_user');
    if (!stored) {
      stored = this.generate();
    } else {
      try {
        stored = JSON.parse(stored);
      } catch (e) {
        stored = this.generate();
      }
    }
    return stored;
  },

  generate() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(10 + Math.random() * 90);
    const username = `${adj}${noun}${num}`;
    const id = 'anon_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = { id, username, color };
    localStorage.setItem('mindhaven_user', JSON.stringify(user));
    return user;
  },

  reset() {
    const user = this.generate();
    this.updateUI();
    return user;
  },

  updateUI() {
    const user = this.get();
    const badges = document.querySelectorAll('.current-user-badge');
    badges.forEach(b => {
      b.innerHTML = `
        <span class="author-dot" style="background:${user.color}"></span>
        <span>${user.username}</span>
      `;
    });
  }
};

// --- Web Audio Synthesized Ambient Rain & Ocean Soundscape ---
// Zero external files, works 100% offline and cross-browser!
const AmbientSound = {
  ctx: null,
  source: null,
  filter: null,
  gain: null,
  isPlaying: false,

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  },

  toggle(btnElement) {
    if (!this.isPlaying) {
      this.start();
      if (btnElement) {
        btnElement.classList.add('playing');
        btnElement.innerHTML = '🌧️ Sound: On';
      }
      showToast('Calming ambient rain sound activated', 'success');
    } else {
      this.stop();
      if (btnElement) {
        btnElement.classList.remove('playing');
        btnElement.innerHTML = '🎧 Ambient Sound';
      }
    }
  },

  start() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Generate 5 seconds of pink noise buffer
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = noiseBuffer;
    this.source.loop = true;

    // Low pass filter for soft rain / ocean sound
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 850;

    // Gentle gain
    this.gain = this.ctx.createGain();
    this.gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    this.gain.gain.exponentialRampToValueAtTime(0.3, this.ctx.currentTime + 1.5);

    this.source.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    this.source.start(0);
    this.isPlaying = true;
  },

  stop() {
    if (!this.isPlaying || !this.gain || !this.ctx) return;
    this.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    setTimeout(() => {
      try {
        if (this.source) this.source.stop();
      } catch (e) {}
      this.isPlaying = false;
    }, 850);
  }
};

// --- Emergency Crisis Modal Controller ---
const CrisisModal = {
  open() {
    let modal = document.getElementById('crisisModal');
    if (!modal) {
      this.createModal();
      modal = document.getElementById('crisisModal');
    }
    modal.classList.add('active');

    // Notify backend anonymously for crisis support metrics
    fetch('/api/crisis-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'emergency_modal_opened' })
    }).catch(() => {});
  },

  close() {
    const modal = document.getElementById('crisisModal');
    if (modal) modal.classList.remove('active');
  },

  createModal() {
    const div = document.createElement('div');
    div.id = 'crisisModal';
    div.className = 'modal-overlay';
    div.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header" style="background: #fff5f5; border-bottom: 2px solid #feb2b2;">
          <h3 style="color: #c53030; display:flex; align-items:center; gap:8px;">
            🚨 Urgent Crisis Support & Hotlines
          </h3>
          <button class="modal-close" onclick="CrisisModal.close()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-weight: 600; font-size: 1.05rem; margin-bottom: 12px; color:#2d3748;">
            You are not alone, and help is available right now. Free, confidential, and 24/7.
          </p>

          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
            <a href="tel:988" class="hotline-btn" style="border: 2px solid #e53e3e; background:#fff5f5; font-size:1.02rem;">
              <span>📞 <strong>988 Suicide & Crisis Lifeline (US & Canada)</strong></span>
              <span style="font-size:1.1rem; font-weight:800;">Call or Text 988</span>
            </a>

            <a href="sms:741741&body=HOME" class="hotline-btn">
              <span>💬 <strong>Crisis Text Line</strong></span>
              <span>Text HOME to 741741</span>
            </a>

            <a href="tel:18664887386" class="hotline-btn">
              <span>🏳️‍🌈 <strong>The Trevor Project (LGBTQ+ Youth)</strong></span>
              <span>1-866-488-7386</span>
            </a>

            <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" class="hotline-btn" style="border-color:#cbd5e0; color:#4a5568;">
              <span>🌍 <strong>International Crisis Helplines Directory</strong></span>
              <span>Find Your Country &rarr;</span>
            </a>
          </div>

          <div style="background:#edf2f7; padding:12px; border-radius:8px; font-size:0.85rem; color:#4a5568;">
            <strong>Are you a college or university student?</strong><br/>
            Most campuses have a 24/7 Student Health & Psychological Services hotline. Check your student ID card or campus security directory.
          </div>
        </div>
        <div class="modal-footer">
          <a href="resources.html#breathing" class="btn btn-secondary" onclick="CrisisModal.close()">
            🌬️ Open Grounding Exercise
          </a>
          <button class="btn btn-danger" onclick="CrisisModal.close()">
            I'm Safe for Now / Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    div.addEventListener('click', (e) => {
      if (e.target === div) CrisisModal.close();
    });
  }
};

// --- Guidelines Modal ---
const GuidelinesModal = {
  open() {
    let modal = document.getElementById('guidelinesModal');
    if (!modal) {
      this.create();
      modal = document.getElementById('guidelinesModal');
    }
    modal.classList.add('active');
  },
  close() {
    const modal = document.getElementById('guidelinesModal');
    if (modal) modal.classList.remove('active');
  },
  create() {
    const div = document.createElement('div');
    div.id = 'guidelinesModal';
    div.className = 'modal-overlay';
    div.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 style="display:flex; align-items:center; gap:8px;">🤝 Community Kindness & Safety Guidelines</h3>
          <button class="modal-close" onclick="GuidelinesModal.close()">&times;</button>
        </div>
        <div class="modal-body">
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 10px; color: #2d3748;">
            <li><strong>Stay 100% Anonymous:</strong> Never share real names, emails, phone numbers, dorm numbers, or social handles.</li>
            <li><strong>Practice Empathy:</strong> Listen without judging. Remember that everyone is fighting battles you cannot see.</li>
            <li><strong>No Medical Advice or Diagnosis:</strong> Offer peer listening, not medical prescriptions or clinical diagnoses.</li>
            <li><strong>Zero Tolerance for Harm:</strong> Harassment, hate speech, bullying, or encouraging self-harm will result in message removal.</li>
            <li><strong>Not for Medical Emergencies:</strong> If you or someone else is in immediate physical danger, contact emergency services (988 or 911) immediately.</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="GuidelinesModal.close()">I Understand & Agree</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    div.addEventListener('click', (e) => {
      if (e.target === div) GuidelinesModal.close();
    });
  }
};

// --- Toast Notification Helper ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// --- Theme Manager (Midnight Aurora Glass / Daylight Crystal Glass) ---
const ThemeManager = {
  init() {
    const saved = localStorage.getItem('mindhaven_theme') || 'dark';
    this.apply(saved);
    this.injectAurora();
    this.injectToggleBtn();
  },

  apply(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mindhaven_theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️ Light Glass' : '🌙 Midnight Glass';
      btn.title = `Switch to ${theme === 'dark' ? 'Daylight Crystal' : 'Midnight Aurora'} Glass`;
    }
  },

  toggle() {
    const current = document.documentElement.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    showToast(`Switched to ${next === 'dark' ? 'Midnight Aurora' : 'Daylight Crystal'} Glass`, 'info');
  },

  injectAurora() {
    if (document.querySelector('.aurora-canvas')) return;
    const canvas = document.createElement('div');
    canvas.className = 'aurora-canvas';
    canvas.innerHTML = `
      <div class="aurora-orb orb-1"></div>
      <div class="aurora-orb orb-2"></div>
      <div class="aurora-orb orb-3"></div>
    `;
    document.body.prepend(canvas);
  },

  injectToggleBtn() {
    const navRight = document.querySelector('.nav-right');
    if (!navRight || document.getElementById('themeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className = 'btn-theme-toggle';
    const current = document.documentElement.dataset.theme || 'dark';
    btn.innerHTML = current === 'dark' ? '☀️ Light Glass' : '🌙 Midnight Glass';
    btn.onclick = () => ThemeManager.toggle();

    // Insert right before user badge
    const userBadge = navRight.querySelector('.user-badge');
    if (userBadge) {
      navRight.insertBefore(btn, userBadge);
    } else {
      navRight.appendChild(btn);
    }
  }
};

// --- Initialize Common Nav and Components on DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme & Background Orbs
  ThemeManager.init();

  // Update user badge
  AnonymousUser.updateUI();

  // Mobile menu button
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
    });
  }

  // Bind ambient sound toggle button
  const ambientBtn = document.getElementById('ambientToggle');
  if (ambientBtn) {
    ambientBtn.addEventListener('click', () => {
      AmbientSound.toggle(ambientBtn);
    });
  }

  // Bind user badge click to re-roll username
  const userBadge = document.querySelector('.user-badge');
  if (userBadge) {
    userBadge.addEventListener('click', () => {
      const newUser = AnonymousUser.reset();
      showToast(`Switched anonymous identity to ${newUser.username}`, 'success');
    });
  }
});
