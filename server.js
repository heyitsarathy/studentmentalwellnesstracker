const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Prevent browser caching for static files during development & demo
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0
}));

// Pre-configured peer support rooms
const ROOMS = [
  { id: 'anxiety', name: 'Anxiety & Panic', icon: '🧘', description: 'Techniques, grounding, and support for anxious moments.' },
  { id: 'academic', name: 'Academic Stress & Burnout', icon: '📚', description: 'Exams, deadlines, perfectionism, and study overwhelm.' },
  { id: 'loneliness', name: 'Loneliness & Disconnection', icon: '🌧️', description: 'A safe space when you feel unheard, isolated, or homesick.' },
  { id: 'relationships', name: 'Relationships & Social Life', icon: '💬', description: 'Friendships, family expectations, boundaries, and social anxiety.' },
  { id: 'grief', name: 'Grief & Loss', icon: '🕊️', description: 'Navigating bereavement, major life transitions, and healing.' },
  { id: 'general', name: 'General Peer Support', icon: '🤝', description: 'Open, compassionate conversation on daily student life.' }
];

// In-memory recent messages buffer (last 30 per room, never logs to disk for privacy)
const roomMessages = {};
ROOMS.forEach(r => { roomMessages[r.id] = []; });

// Active socket tracking
const activeSockets = new Map(); // socket.id -> { username, room, userId }

// Basic profanity / harmful language detection for safety
const HARMFUL_PATTERNS = [
  /\b(kill\s*yourself|kys|die\s*now|go\s*die)\b/i,
  /\b(hate\s*you|worthless\s*loser|freak)\b/i
];

const CRISIS_PATTERNS = [
  /\b(suicide|suicidal|end\s*my\s*life|kill\s*myself|hang\s*myself|want\s*to\s*die|cutting\s*myself|slit\s*my\s*wrists|overdose)\b/i
];

// --- REST API Endpoints ---

// Get list of rooms with real-time participant counts
app.get('/api/rooms', (req, res) => {
  const counts = {};
  ROOMS.forEach(r => { counts[r.id] = 0; });

  for (const [, user] of activeSockets) {
    if (user.room && counts[user.room] !== undefined) {
      counts[user.room]++;
    }
  }

  const roomList = ROOMS.map(r => ({
    ...r,
    activeUsers: counts[r.id] || 0
  }));

  res.json({
    rooms: roomList,
    totalOnline: activeSockets.size
  });
});

// Mood Tracker: Save daily check-in
app.post('/api/mood', async (req, res) => {
  try {
    const { userId, rating, moodName, emoji, tags, note } = req.body;
    if (!userId || !rating) {
      return res.status(400).json({ error: 'Missing userId or rating' });
    }
    const saved = await db.saveMood({ userId, rating, moodName, emoji, tags, note });
    res.status(201).json({ success: true, mood: saved });
  } catch (err) {
    console.error('Error saving mood:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mood Tracker: Get user history
app.get('/api/mood/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await db.getMoodsByUser(userId);
    res.json({ moods: history });
  } catch (err) {
    console.error('Error getting moods:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mood Tracker: Delete user history (User privacy right)
app.delete('/api/mood/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await db.deleteMoodsByUser(userId);
    res.json({ success: true, message: 'All mood data wiped for this anonymous ID.' });
  } catch (err) {
    console.error('Error deleting moods:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mood Tracker: Aggregate stats for platform pulse
app.get('/api/mood-stats', async (req, res) => {
  try {
    const stats = await db.getMoodStats();
    res.json(stats);
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report chat message
app.post('/api/report', async (req, res) => {
  try {
    const report = await db.saveReport(req.body);
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get reports (for demo / hackathon presentation)
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await db.getReports();
    res.json({ reports });
  } catch (err) {
    console.error('Error getting reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crisis trigger event tracker
app.post('/api/crisis-trigger', async (req, res) => {
  try {
    const { type } = req.body;
    await db.logCrisisTrigger(type || 'manual_emergency_click');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log crisis trigger' });
  }
});

// --- Real-time Socket.io Handling ---

io.on('connection', (socket) => {
  // Join Room
  socket.on('join_room', ({ room, username, userId }) => {
    const validRoom = ROOMS.find(r => r.id === room);
    const targetRoom = validRoom ? validRoom.id : 'general';

    // Leave any existing room
    const prev = activeSockets.get(socket.id);
    if (prev && prev.room) {
      socket.leave(prev.room);
      io.to(prev.room).emit('system_message', {
        text: `${prev.username} has left the room.`,
        type: 'user_leave',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      broadcastRoomUsers(prev.room);
    }

    // Join new room
    socket.join(targetRoom);
    activeSockets.set(socket.id, {
      username: username || 'CalmPeer',
      room: targetRoom,
      userId: userId || 'anon_' + socket.id.slice(0, 5)
    });

    // Send history of this room to the joining user
    socket.emit('room_history', {
      room: targetRoom,
      messages: roomMessages[targetRoom] || []
    });

    // Notify room of new user
    socket.to(targetRoom).emit('system_message', {
      text: `${username} has joined the conversation with kindness.`,
      type: 'user_join',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    broadcastRoomUsers(targetRoom);
    emitAllRoomCounts();
  });

  // Chat Message
  socket.on('chat_message', (data) => {
    const user = activeSockets.get(socket.id);
    if (!user || !user.room) return;

    const rawText = (data.text || '').trim();
    if (!rawText) return;

    // Check for cyberbullying / harmful harassment
    const isHarmful = HARMFUL_PATTERNS.some(pat => pat.test(rawText));
    if (isHarmful) {
      socket.emit('message_warning', {
        warning: 'Your message could not be sent because it violates our Community Kindness & Safety guidelines.'
      });
      return;
    }

    // Check for high-risk crisis keywords in peer chat
    const isCrisis = CRISIS_PATTERNS.some(pat => pat.test(rawText));
    if (isCrisis) {
      // Send immediate private safety alert to the sender
      socket.emit('crisis_alert_private', {
        message: 'It sounds like you may be going through intense distress. You are not alone. Please consider reaching out to the 988 Suicide & Crisis Lifeline (call/text 988) or pressing the red "Get Help Now" button above.'
      });
    }

    const messageObj = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      room: user.room,
      username: user.username,
      userId: user.userId,
      text: rawText.slice(0, 1000), // Max length
      avatarColor: data.avatarColor || '#3182ce',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Store in memory buffer (max 30)
    if (!roomMessages[user.room]) roomMessages[user.room] = [];
    roomMessages[user.room].push(messageObj);
    if (roomMessages[user.room].length > 30) {
      roomMessages[user.room].shift();
    }

    // Broadcast to room
    io.to(user.room).emit('new_message', messageObj);
  });

  // Typing indicator
  socket.on('typing', () => {
    const user = activeSockets.get(socket.id);
    if (user && user.room) {
      socket.to(user.room).emit('user_typing', { username: user.username });
    }
  });

  socket.on('stop_typing', () => {
    const user = activeSockets.get(socket.id);
    if (user && user.room) {
      socket.to(user.room).emit('user_stop_typing', { username: user.username });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = activeSockets.get(socket.id);
    if (user && user.room) {
      socket.to(user.room).emit('system_message', {
        text: `${user.username} has stepped away.`,
        type: 'user_leave',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      activeSockets.delete(socket.id);
      broadcastRoomUsers(user.room);
      emitAllRoomCounts();
    } else {
      activeSockets.delete(socket.id);
    }
  });
});

function broadcastRoomUsers(roomId) {
  const usersInRoom = [];
  for (const [, user] of activeSockets) {
    if (user.room === roomId) {
      usersInRoom.push(user.username);
    }
  }
  io.to(roomId).emit('room_users', {
    room: roomId,
    count: usersInRoom.length,
    users: usersInRoom
  });
}

function emitAllRoomCounts() {
  const counts = {};
  ROOMS.forEach(r => { counts[r.id] = 0; });
  for (const [, user] of activeSockets) {
    if (user.room && counts[user.room] !== undefined) {
      counts[user.room]++;
    }
  }
  io.emit('all_room_counts', {
    counts,
    totalOnline: activeSockets.size
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🌱 MindHaven - Student Mental Wellness Platform`);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`🔒 Anonymous mode: Active (No user PII collected)`);
  console.log(`=================================================`);
});
