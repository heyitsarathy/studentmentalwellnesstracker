# 🌱 MindHaven — Student Mental Wellness & Anonymous Peer Support Platform

> **A safe, judgment-free, and 100% anonymous peer support ecosystem built for students experiencing academic burnout, anxiety, and isolation.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-blue.svg)](https://socket.io/)
[![Express](https://img.shields.io/badge/Backend-Express.js-black.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Anonymous-success.svg)](#privacy--safety-model)

---

## 📌 1. The Problem

The college mental health crisis is at an all-time peak:
- **Over 60% of college students** meet the criteria for at least one mental health challenge (Healthy Minds Study).
- **The Stigma Barrier:** Many students fear seeking on-campus care due to worries that therapy records will leak into their academic standing, athletic eligibility, or visa status.
- **The Waitlist Crisis:** Campus counseling centers regularly report **3 to 6-week waitlists** during midterm and finals weeks.
- **Invasive Sign-ups:** Commercial mental health apps require email addresses, phone numbers, location tracking, and expensive subscriptions, alienating students who need immediate, low-barrier support.

---

## 💡 2. The Solution: MindHaven

**MindHaven** is an immediate-access, zero-onboarding mental wellness sanctuary engineered specifically for student needs:

- **Complete Anonymity:** No accounts, no emails, no passwords, and zero personal telemetry. Students join with randomly generated friendly pseudonyms (e.g., `CalmOtter42`, `GentleSparrow18`).
- **Real-Time Peer Solidarity:** Topic-focused chat rooms where students can connect with peers navigating the exact same struggles.
- **Crisis De-escalation & HopeBot:** An empathetic AI/rule-based assistant trained to recognize acute distress and high-risk language, immediately escalating users to certified human hotlines (988 Lifeline, Crisis Text Line 741741).
- **Somatic Grounding & Regulation:** Interactive guided breathing (Box & 4-7-8 Breathing), the 5-4-3-2-1 sensory grounding protocol, and a private local reflection scratchpad.
- **Daily Mood Tracker:** A 10-second daily pause with context tags and a visual 7-day trend curve to help students identify triggers between exams, sleep, and mood.

---

## ✨ 3. Core Features (MVP)

### 💬 1. Anonymous Peer-to-Peer Chat
- **Instant Pseudonyms:** Automatically assigns an uplifting anonymous identity (`KindBreeze56`) with a single-click re-roll option.
- **6 Topic-Specific Rooms:**
  - 🧘 **Anxiety & Panic Support:** Grounding techniques and shared breathing in moments of panic.
  - 📚 **Academic Stress & Burnout:** Midterm overwhelm, thesis panic, perfectionism, and imposter syndrome.
  - 🌧️ **Loneliness & Disconnection:** A warm space for homesick or isolated students.
  - 💬 **Relationships & Social Life:** Family pressure, roommate conflict, and social anxiety.
  - 🕊️ **Grief & Loss:** Navigating loss, breakups, and major transitions.
  - 🤝 **General Peer Support:** Open, compassionate daily student conversation.
- **Real-Time Communication:** Powered by **Socket.io** with live participant counters, active room indicators, and typing feedback.
- **Community Safety:** In-chat message reporting modal (`POST /api/report`), profanity/harassment filtering, and private crisis de-escalation alerts.

### 🤖 2. Crisis Support Chatbot ("HopeBot")
- **Prominent Medical Disclaimer:** Clearly states on every view that HopeBot is a supportive assistant and **not** a replacement for licensed medical or psychiatric care.
- **Intelligent High-Risk Detection:** Monitors for suicidal ideation, self-harm keywords, and acute crisis expressions.
- **Instant Crisis Escalation Card:** When high-risk intent is identified, HopeBot immediately presents click-to-call action buttons for:
  - **988 Suicide & Crisis Lifeline** (Call/Text 988, 24/7)
  - **Crisis Text Line** (Text `HOME` to `741741`)
  - **The Trevor Project** (LGBTQ+ youth crisis lifeline: `1-866-488-7386`)
  - **International Helplines Directory** (Direct search for 130+ nations)
- **Empathetic Guidance:** Answers student queries on panic attacks, 5-4-3-2-1 grounding, insomnia protocols, and study fatigue.

### 🌿 3. Interactive Resource Library
- **Visual Breathing Coach:**
  - Presets: **Box Breathing (4-4-4-4 Anti-Panic)**, **4-7-8 Deep Sleep**, and **Calm & Deep Flow**.
  - Animated pulsating circle with real-time countdown timers and visual phase prompts (Inhale, Hold, Exhale).
- **5-4-3-2-1 Sensory Grounding Tool:**
  - Interactive inputs and progress tracker for 5 things seen, 4 felt, 3 heard, 2 smelled, and 1 tasted.
- **Private Journaling Scratchpad:**
  - Pre-curated prompts for academic burnout, self-compassion, and emotional venting.
  - **Zero Server Storage:** Notes are stored strictly in the client's `localStorage` and can be downloaded as `.txt` files or wiped with a single click.
- **Evidence-Based Coping Cards:**
  - Acute Panic First-Aid Card (mammalian dive reflex, temperature changes).
  - The 15-Minute Study Rule for executive dysfunction.
  - Student Insomnia Bed Rule.

### 📊 4. Daily Mood Tracker
- **5-Scale Emoji Check-In:** 😄 Great, 🙂 Good, 😐 Okay, 😔 Down, 😣 Struggling.
- **Contextual Drivers:** Tags for Academics, Exams, Sleep, Social, Exercise, Family, Solitude, Health, and Burnout.
- **Visual Trend Curve:** Dynamic SVG 7-day trend chart calculating average wellness score and top emotional factor.
- **User Privacy Sovereignty:** Complete data wipe button (`DELETE /api/mood/:userId`) allowing students to purge their history anytime.

### 🎧 5. Web Audio Ambient Soundscape
- **Synthesized Rain & Ocean Waves:** Built using the native **Web Audio API** (pink noise buffer + low-pass resonant filtering).
- **100% Offline & Lightweight:** Requires zero heavy MP3 assets or streaming bandwidth.

### 📞 6. Verified Crisis Directory
- Verified hotlines, availability badges, click-to-call links, and practical instructions on accessing campus counseling centers.

---

## 🛠️ 4. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3 (Custom Calming Design System), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Real-time** | Socket.io |
| **Persistence** | Resilient JSON Persistent Store / SQLite (`data/db.json`), Client `localStorage` |
| **Audio** | Web Audio API (real-time pink-noise synthesis) |
| **Safety Engine** | Rule-based regex crisis triage & harassment filters |

---

## 📁 5. Project Structure

```
Student Mental Welness Tracker/
├── server.js               # Express server, Socket.io events, REST API endpoints
├── database.js             # Atomic persistent data layer (moods, reports, crisis metrics)
├── package.json            # Node.js dependencies and run scripts
├── data/                   # Persistent data store (auto-generated)
│   └── db.json
├── public/                 # Static web client
│   ├── index.html          # Landing page with crisis banner and feature overview
│   ├── chat.html           # Real-time anonymous peer chat rooms
│   ├── chatbot.html        # HopeBot crisis support companion
│   ├── resources.html      # Breathing coach, grounding, and journaling scratchpad
│   ├── mood.html           # 5-emoji daily check-in and SVG trend chart
│   ├── hotlines.html       # Verified crisis hotlines and campus directory
│   ├── css/
│   │   └── style.css       # Clean, accessible, calming responsive design system
│   └── js/
│       ├── main.js         # Anonymous identity manager, crisis modal, ambient audio
│       ├── chat.js         # Socket.io client, room switching, typing, reporting
│       ├── chatbot.js      # HopeBot AI dialogue, crisis keyword triage, 988 cards
│       ├── resources.js    # Interactive breathing circle, 5-4-3-2-1, local scratchpad
│       └── mood.js         # Mood tracker, SVG graph renderer, history sync
└── README.md               # Project documentation
```

---

## 🚀 6. Quick Start & How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (comes bundled with Node.js)

### Step 1: Clone or Navigate to the Directory
```bash
cd "Student Mental Welness Tracker"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the Platform
```bash
npm start
```

### Step 4: Open in Your Browser
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🎯 7. Hackathon Demo Walkthrough (For Judges)

When presenting MindHaven to judges, follow this 3-minute demo flow:

1. **Landing Page (`/index.html`)**:
   - Highlight the **Universal Crisis Banner** at the very top.
   - Click the **"🎧 Ambient Sound"** button to play real-time synthesized soothing rain via Web Audio.
   - Point out the **Anonymous User Badge** (`👤 CalmOtter42`) generated without requiring an account.

2. **Real-Time Peer Chat (`/chat.html`)**:
   - Open two browser tabs (or an incognito window).
   - Show both tabs joining the **"Anxiety & Panic"** or **"Academic Stress"** room.
   - Notice the live user count update (`2 students here`) and instant message broadcasting.
   - Type a harmful word or distress phrase to demonstrate the built-in safety filter and private crisis check.
   - Click the **"🚩 Report"** button on any message to showcase community moderation.

3. **Crisis Support Chatbot (`/chatbot.html`)**:
   - Note the mandatory **medical disclaimer banner**.
   - Click a quick chip like *"I am having an acute panic attack"* to see guided de-escalation.
   - Type a high-risk phrase such as *"I am thinking about suicide"* to demonstrate the **instant crisis escalation card** with direct 988 call links.

4. **Resource Library (`/resources.html`)**:
   - Navigate to **"🌬️ Guided Breathing"** and click **Start Breathing** to demonstrate the expanding/contracting SVG breath circle.
   - Switch to **"✋ 5-4-3-2-1 Grounding"** and fill in items to see the sensory anchor progress bar.
   - Switch to **"✍️ Journaling Scratchpad"** and click a prompt to demonstrate the private local scratchpad.

5. **Daily Mood Tracker (`/mood.html`)**:
   - Select an emoji (e.g. 🙂 Good), choose context tags (📚 Academics, 😴 Sleep), and add a short note.
   - Click **Log Daily Check-In** to see the entry appear and the **7-Day Trend Curve** update dynamically.
   - Click **"🗑️ Wipe My Logs"** to prove user data sovereignty.

---

## 🔒 8. Privacy, Safety & Ethical Framework

- **Zero PII (Personally Identifiable Information):** No names, emails, IPs, student IDs, or cookies are stored.
- **Client-Side Scratchpad Isolation:** Journal reflections are saved strictly in browser `localStorage`, never transmitted to any database or third party.
- **Safety Reporting Pipeline:** All reported chat messages are logged into `data/db.json` with a timestamp and room context for administrative auditing.
- **Clear Legal Disclaimer:** Prominently featured on every page to prevent user confusion with licensed emergency medical services.

---

## 🔮 9. Future Roadmap

1. **Campus Counseling LMS Integration:** Optional LTI plug-in allowing universities to embed MindHaven directly into Canvas or Blackboard without exposing student identities.
2. **AI Toxicity Classification:** Fine-tuned lightweight local NLP model to classify nuanced harassment or covert self-harm prompts with sub-100ms latency.
3. **Anonymized Peer Voice Rooms:** Audio-based drop-in voice rooms with real-time pitch-shifting and voice masking for students who prefer speaking over typing.
4. **Campus Resource Geolocation:** Automatic detection of campus counseling triage numbers based on institutional `.edu` domains or voluntary zip-code selection.

---

## 📄 10. License

This project is licensed under the MIT License — open-source and free for educational and mental health advocacy initiatives.
