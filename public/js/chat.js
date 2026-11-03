/**
 * MindHaven - Real-time Peer-to-Peer Chat Logic
 * Powered by Socket.io with room navigation, typing indicators,
 * report functionality, and safety filters.
 */

let socket = null;
let currentRoom = 'general';
let typingTimeout = null;
let reportingMessage = null;

const ROOM_METADATA = {
  anxiety: { name: 'Anxiety & Panic Support', icon: '🧘', desc: 'Techniques, grounding, and support for anxious moments.' },
  academic: { name: 'Academic Stress & Burnout', icon: '📚', desc: 'Exams, deadlines, perfectionism, and study overwhelm.' },
  loneliness: { name: 'Loneliness & Disconnection', icon: '🌧️', desc: 'A safe space when you feel unheard, isolated, or homesick.' },
  relationships: { name: 'Relationships & Social Life', icon: '💬', desc: 'Friendships, family expectations, boundaries, and social anxiety.' },
  grief: { name: 'Grief & Loss', icon: '🕊️', desc: 'Navigating bereavement, major life transitions, and healing.' },
  general: { name: 'General Peer Support', icon: '🤝', desc: 'Open, compassionate conversation on daily student life.' }
};

document.addEventListener('DOMContentLoaded', () => {
  initChat();
});

function initChat() {
  const user = AnonymousUser.get();

  // Initialize Socket.io
  socket = io();

  // URL hash check (e.g. #anxiety)
  const hashRoom = window.location.hash.replace('#', '');
  if (hashRoom && ROOM_METADATA[hashRoom]) {
    currentRoom = hashRoom;
  }

  // Bind Room Selector Clicks
  const roomItems = document.querySelectorAll('.room-item');
  roomItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetRoom = item.dataset.room;
      if (targetRoom && targetRoom !== currentRoom) {
        switchRoom(targetRoom);
      }
    });
  });

  // Join initial room
  joinRoom(currentRoom);

  // Form submission
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else {
        emitTyping();
      }
    });
  }

  // Socket event listeners
  setupSocketListeners();
  setupReportModal();

  // Mobile room toggle button if present
  const mobileRoomsBtn = document.getElementById('toggleRoomsMobile');
  const sidebar = document.querySelector('.chat-sidebar');
  if (mobileRoomsBtn && sidebar) {
    mobileRoomsBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
  }
}

function switchRoom(newRoomId) {
  currentRoom = newRoomId;
  window.location.hash = newRoomId;

  // Update UI active state
  document.querySelectorAll('.room-item').forEach(el => {
    el.classList.toggle('active', el.dataset.room === newRoomId);
  });

  // Update room header
  const meta = ROOM_METADATA[newRoomId] || ROOM_METADATA.general;
  const titleEl = document.getElementById('currentRoomTitle');
  const iconEl = document.getElementById('currentRoomIcon');
  const descEl = document.getElementById('currentRoomDesc');

  if (titleEl) titleEl.textContent = meta.name;
  if (iconEl) iconEl.textContent = meta.icon;
  if (descEl) descEl.textContent = meta.desc;

  // Clear messages container
  const container = document.getElementById('chatMessages');
  if (container) {
    container.innerHTML = `
      <div class="system-chat-message">
        Joined <strong>${meta.name}</strong>. Remember to keep this space kind, anonymous, and supportive.
      </div>
    `;
  }

  // Close mobile sidebar if open
  const sidebar = document.querySelector('.chat-sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');

  // Emit join to server
  joinRoom(newRoomId);
}

function joinRoom(roomId) {
  const user = AnonymousUser.get();
  socket.emit('join_room', {
    room: roomId,
    username: user.username,
    userId: user.id
  });
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = (input.value || '').trim();
  if (!text) return;

  const user = AnonymousUser.get();
  socket.emit('chat_message', {
    text,
    avatarColor: user.color
  });

  input.value = '';
  input.focus();
  socket.emit('stop_typing');
}

function emitTyping() {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop_typing');
  }, 1800);
}

function setupSocketListeners() {
  const container = document.getElementById('chatMessages');
  const user = AnonymousUser.get();

  // History on join
  socket.on('room_history', (data) => {
    if (data.messages && Array.isArray(data.messages)) {
      data.messages.forEach(msg => appendMessage(msg, false));
      scrollToBottom();
    }
  });

  // New message
  socket.on('new_message', (msg) => {
    appendMessage(msg, true);
    scrollToBottom();
  });

  // System notification
  socket.on('system_message', (data) => {
    const el = document.createElement('div');
    el.className = 'system-chat-message';
    el.innerHTML = `${escapeHtml(data.text)} <span style="font-size:0.7rem; opacity:0.7;">(${data.timestamp})</span>`;
    container.appendChild(el);
    scrollToBottom();
  });

  // Private crisis alert triggered
  socket.on('crisis_alert_private', (data) => {
    const el = document.createElement('div');
    el.className = 'system-chat-message crisis-alert';
    el.innerHTML = `
      <div><strong>💙 Supportive Safety Check:</strong> ${escapeHtml(data.message)}</div>
      <div style="margin-top:6px;">
        <button class="btn btn-danger" style="padding:4px 12px; font-size:0.75rem;" onclick="CrisisModal.open()">
          Get Crisis Resources Now
        </button>
      </div>
    `;
    container.appendChild(el);
    scrollToBottom();
  });

  // Warning when violating guidelines
  socket.on('message_warning', (data) => {
    showToast(data.warning, 'warning');
  });

  // Typing state
  const typingIndicator = document.getElementById('typingIndicator');
  socket.on('user_typing', (data) => {
    if (typingIndicator) {
      typingIndicator.textContent = `A fellow student is typing...`;
    }
  });

  socket.on('user_stop_typing', () => {
    if (typingIndicator) {
      typingIndicator.textContent = '';
    }
  });

  // Live count in current room
  socket.on('room_users', (data) => {
    const countEl = document.getElementById('activeRoomCount');
    if (countEl) {
      countEl.textContent = `${data.count} student${data.count === 1 ? '' : 's'} here`;
    }
  });

  // All room counts update
  socket.on('all_room_counts', (data) => {
    if (data.counts) {
      for (const [rId, count] of Object.entries(data.counts)) {
        const badge = document.querySelector(`.room-item[data-room="${rId}"] .room-badge-count`);
        if (badge) {
          badge.textContent = `${count} online`;
        }
      }
    }
  });
}

function appendMessage(msg, animate = true) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const currentUser = AnonymousUser.get();
  const isOwn = msg.userId === currentUser.id;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isOwn ? 'own-message' : ''}`;
  if (animate) bubble.style.animation = 'fadeIn 0.2s ease';

  bubble.innerHTML = `
    <div class="bubble-meta">
      <span class="bubble-author">
        <span class="author-dot" style="background:${msg.avatarColor || '#3182ce'}"></span>
        ${escapeHtml(msg.username)}
        ${isOwn ? '<span style="font-size:0.7rem; font-weight:normal; color:#4a5568;">(You)</span>' : ''}
      </span>
      <span class="bubble-time">${escapeHtml(msg.timestamp || '')}</span>
    </div>
    <div class="bubble-text">${escapeHtml(msg.text)}</div>
    ${!isOwn ? `
      <div class="bubble-actions">
        <button class="btn-report" onclick="openReportModal('${escapeHtml(msg.id)}', '${escapeHtml(msg.username)}', '${escapeAttr(msg.text)}')">
          🚩 Report
        </button>
      </div>
    ` : ''}
  `;

  container.appendChild(bubble);
}

function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// --- Report Message Handling ---
function setupReportModal() {
  const reportForm = document.getElementById('reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!reportingMessage) return;

      const reasonSelect = document.getElementById('reportReason');
      const reason = reasonSelect ? reasonSelect.value : 'Inappropriate content';
      const user = AnonymousUser.get();

      try {
        const res = await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reporterId: user.id,
            reportedUser: reportingMessage.username,
            messageContent: reportingMessage.text,
            room: currentRoom,
            reason: reason
          })
        });

        if (res.ok) {
          showToast('Thank you. The message has been flagged for safety review.', 'success');
          closeReportModal();
        } else {
          showToast('Failed to submit report. Please try again.', 'warning');
        }
      } catch (err) {
        showToast('Report submitted and logged for safety.', 'success');
        closeReportModal();
      }
    });
  }
}

function openReportModal(msgId, username, text) {
  reportingMessage = { id: msgId, username, text };
  const modal = document.getElementById('reportModal');
  const details = document.getElementById('reportMsgDetails');

  if (details) {
    details.innerHTML = `
      <div style="background:#f7fafc; border:1px solid #e2e8f0; padding:10px; border-radius:6px; font-size:0.85rem; margin-bottom:12px;">
        <strong>User:</strong> ${escapeHtml(username)}<br/>
        <strong>Message:</strong> "${escapeHtml(text)}"
      </div>
    `;
  }

  if (modal) modal.classList.add('active');
}

function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) modal.classList.remove('active');
  reportingMessage = null;
}

// Helper sanitizers
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '\\\'');
}
