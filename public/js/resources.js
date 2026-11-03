/**
 * MindHaven - Resource Library Interactive Modules
 * Includes: Breathing Exercise Guide (Box / 4-7-8), 5-4-3-2-1 Grounding Tool,
 * and Private Client-Side Journaling Scratchpad.
 */

// --- Tab Switching ---
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initBreathingExercise();
  initGroundingTool();
  initJournalingScratchpad();
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  // Check URL hash for direct tab linking
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const targetContent = document.getElementById(hash);
    const targetTab = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (targetContent && targetTab) {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      targetContent.classList.add('active');
      targetTab.classList.add('active');
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        window.location.hash = targetId;
      }
    });
  });
}

// ==========================================================================
// 1. Interactive Breathing Guide
// ==========================================================================
const BREATHING_PRESETS = {
  box: {
    name: 'Box Breathing (Navy SEAL / Anti-Panic)',
    phases: [
      { name: 'Inhale', duration: 4, scale: 1.35, color: '#bee3f8' },
      { name: 'Hold', duration: 4, scale: 1.35, color: '#b2f5ea' },
      { name: 'Exhale', duration: 4, scale: 0.9, color: '#fed7d7' },
      { name: 'Hold', duration: 4, scale: 0.9, color: '#e2e8f0' }
    ]
  },
  '478': {
    name: '4-7-8 Relaxing Breath (Deep Sleep & Calm)',
    phases: [
      { name: 'Inhale', duration: 4, scale: 1.35, color: '#bee3f8' },
      { name: 'Hold', duration: 7, scale: 1.35, color: '#b2f5ea' },
      { name: 'Exhale', duration: 8, scale: 0.9, color: '#fed7d7' }
    ]
  },
  calm: {
    name: 'Calm & Deep Breathing (General Stress)',
    phases: [
      { name: 'Inhale', duration: 4, scale: 1.3, color: '#bee3f8' },
      { name: 'Exhale', duration: 6, scale: 0.9, color: '#fed7d7' }
    ]
  }
};

let currentPresetKey = 'box';
let breathingRunning = false;
let currentPhaseIndex = 0;
let secondsRemaining = 0;
let breathingInterval = null;

function initBreathingExercise() {
  const techBtns = document.querySelectorAll('.tech-btn');
  techBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      techBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPresetKey = btn.dataset.preset;
      resetBreathing();
    });
  });

  const startBtn = document.getElementById('breathStartBtn');
  const resetBtn = document.getElementById('breathResetBtn');

  if (startBtn) {
    startBtn.addEventListener('click', toggleBreathing);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetBreathing);
  }
}

function toggleBreathing() {
  const startBtn = document.getElementById('breathStartBtn');
  if (!breathingRunning) {
    breathingRunning = true;
    startBtn.textContent = '⏸️ Pause';
    startBtn.classList.remove('btn-primary');
    startBtn.classList.add('btn-secondary');
    runPhase();
  } else {
    breathingRunning = false;
    startBtn.textContent = '▶️ Resume';
    startBtn.classList.remove('btn-secondary');
    startBtn.classList.add('btn-primary');
    clearInterval(breathingInterval);
  }
}

function resetBreathing() {
  breathingRunning = false;
  clearInterval(breathingInterval);
  currentPhaseIndex = 0;

  const startBtn = document.getElementById('breathStartBtn');
  if (startBtn) {
    startBtn.textContent = '▶️ Start Breathing';
    startBtn.classList.remove('btn-secondary');
    startBtn.classList.add('btn-primary');
  }

  const circle = document.getElementById('breathCircle');
  const instruction = document.getElementById('breathInstruction');
  const timer = document.getElementById('breathTimer');

  if (circle) {
    circle.style.transform = 'scale(1)';
    circle.style.background = 'radial-gradient(circle, #ebf8ff 0%, #bee3f8 100%)';
  }
  if (instruction) instruction.textContent = 'Ready?';
  if (timer) timer.textContent = '4s';
}

function runPhase() {
  if (!breathingRunning) return;

  const preset = BREATHING_PRESETS[currentPresetKey];
  const phase = preset.phases[currentPhaseIndex];
  secondsRemaining = phase.duration;

  const circle = document.getElementById('breathCircle');
  const instruction = document.getElementById('breathInstruction');
  const timer = document.getElementById('breathTimer');

  if (circle) {
    circle.style.transition = `transform ${phase.duration}s ease-in-out, background ${phase.duration}s ease-in-out`;
    circle.style.transform = `scale(${phase.scale})`;
    circle.style.backgroundColor = phase.color;
  }

  if (instruction) instruction.textContent = phase.name + '...';
  if (timer) timer.textContent = `${secondsRemaining}s`;

  clearInterval(breathingInterval);
  breathingInterval = setInterval(() => {
    secondsRemaining--;
    if (timer) timer.textContent = `${secondsRemaining}s`;

    if (secondsRemaining <= 0) {
      clearInterval(breathingInterval);
      currentPhaseIndex = (currentPhaseIndex + 1) % preset.phases.length;
      runPhase();
    }
  }, 1000);
}

// ==========================================================================
// 2. Interactive 5-4-3-2-1 Grounding Tool
// ==========================================================================
function initGroundingTool() {
  const inputs = document.querySelectorAll('.grounding-items-input');
  const progressBar = document.getElementById('groundingProgress');
  const countDisplay = document.getElementById('groundingCount');

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      let filled = 0;
      inputs.forEach(i => {
        if (i.value.trim().length > 0) filled++;
      });

      const total = inputs.length;
      const pct = Math.round((filled / total) * 100);

      if (progressBar) progressBar.style.width = pct + '%';
      if (countDisplay) countDisplay.textContent = `${filled} of ${total} anchored`;

      if (filled === total) {
        showToast('🌟 Wonderful job. You have grounded all 5 senses in the present moment.', 'success');
      }
    });
  });

  const clearBtn = document.getElementById('clearGroundingBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      inputs.forEach(i => (i.value = ''));
      if (progressBar) progressBar.style.width = '0%';
      if (countDisplay) countDisplay.textContent = `0 of ${inputs.length} anchored`;
      showToast('Grounding inputs cleared', 'info');
    });
  }
}

// ==========================================================================
// 3. Private Client-Side Journaling Scratchpad
// ==========================================================================
function initJournalingScratchpad() {
  const textarea = document.getElementById('journalText');
  const promptCards = document.querySelectorAll('.prompt-card');

  // Load saved local entry
  const saved = localStorage.getItem('mindhaven_journal_text');
  if (textarea && saved) {
    textarea.value = saved;
  }

  // Autosave locally
  if (textarea) {
    textarea.addEventListener('input', () => {
      localStorage.setItem('mindhaven_journal_text', textarea.value);
    });
  }

  // Insert prompt on click
  promptCards.forEach(card => {
    card.addEventListener('click', () => {
      promptCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const promptText = card.dataset.prompt || card.textContent.trim();
      if (textarea) {
        const header = `\n\n--- Prompt: ${promptText} ---\n`;
        textarea.value += header;
        textarea.focus();
        textarea.scrollTop = textarea.scrollHeight;
        localStorage.setItem('mindhaven_journal_text', textarea.value);
        showToast('Prompt added to your private scratchpad', 'info');
      }
    });
  });

  // Action: Copy to clipboard
  const copyBtn = document.getElementById('copyJournalBtn');
  if (copyBtn && textarea) {
    copyBtn.addEventListener('click', async () => {
      if (!textarea.value.trim()) {
        showToast('Your scratchpad is empty.', 'warning');
        return;
      }
      try {
        await navigator.clipboard.writeText(textarea.value);
        showToast('Journal copied to clipboard!', 'success');
      } catch (err) {
        showToast('Unable to copy directly; please select all and copy.', 'warning');
      }
    });
  }

  // Action: Download text file
  const downloadBtn = document.getElementById('downloadJournalBtn');
  if (downloadBtn && textarea) {
    downloadBtn.addEventListener('click', () => {
      if (!textarea.value.trim()) {
        showToast('Your scratchpad is empty.', 'warning');
        return;
      }
      const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MindHaven_Private_Journal_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Journal saved to your device as text file', 'success');
    });
  }

  // Action: Clear scratchpad
  const clearJournalBtn = document.getElementById('clearJournalBtn');
  if (clearJournalBtn && textarea) {
    clearJournalBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your scratchpad?')) {
        textarea.value = '';
        localStorage.removeItem('mindhaven_journal_text');
        showToast('Scratchpad cleared', 'info');
      }
    });
  }
}
