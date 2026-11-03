/**
 * MindHaven - Crisis Support Chatbot ("HopeBot")
 * Features intelligent high-risk intent detection, crisis escalation,
 * emergency hotlines integration, and empathetic student support responses.
 */

// High-Risk Emergency Regex Triggers
const CRISIS_TRIGGERS = [
  /\b(suicid|kill\s*myself|end\s*my\s*life|end\s*it\s*all|want\s*to\s*die|better\s*off\s*dead)\b/i,
  /\b(hang\s*myself|shoot\s*myself|jump\s*off|slit\s*my\s*wrists|overdose)\b/i,
  /\b(self[-\s]?harm|cutting\s*myself|cut\s*my\s*wrists|hurt\s*myself|bleeding\s*out)\b/i,
  /\b(no\s*reason\s*to\s*live|can'?t\s*go\s*on\s*living|give\s*up\s*on\s*life)\b/i
];

// Response Knowledge Base for Student Mental Wellness
const TOPIC_RESPONSES = [
  {
    keywords: [/\b(panic|anxiety|anxious|heart\s*racing|hyperventilat|scared)\b/i],
    response: `
      <p>I can hear that things feel overwhelming and intense right now. Let's pause together for a moment.</p>
      <p><strong>First, take a gentle breath:</strong> Put both feet flat on the floor. Drop your shoulders down away from your ears. Unclench your jaw.</p>
      <p>Remember: <em>Panic is an adrenaline surge in your body. It is deeply uncomfortable, but it cannot harm you, and it will pass.</em></p>
      <p>Would you like to try the <strong>5-4-3-2-1 Grounding Technique</strong> or do a quick <strong>Box Breathing</strong> exercise?</p>
      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button class="chip-btn" onclick="sendPredefined('Walk me through 5-4-3-2-1 Grounding')">Start 5-4-3-2-1 Grounding</button>
        <a href="resources.html#breathing" class="chip-btn" style="color:var(--primary); font-weight:700;">Open Breathing Tool 🌬️</a>
      </div>
    `
  },
  {
    keywords: [/\b(grounding|5-4-3-2-1|ground\s*me)\b/i],
    response: `
      <p><strong>Let's do the 5-4-3-2-1 Grounding Exercise together:</strong></p>
      <p>👀 <strong>5 things you can SEE:</strong> Look around your room. Notice the texture of your desk, the color of a book, light coming through a window.</p>
      <p>✋ <strong>4 things you can TOUCH:</strong> Feel your feet against your shoes, the fabric of your sleeves, the cool surface of a water glass.</p>
      <p>👂 <strong>3 things you can HEAR:</strong> Listen closely. A fan humming? Traffic outside? The sound of your own quiet breath?</p>
      <p>👃 <strong>2 things you can SMELL:</strong> Coffee, fresh air, pencil shavings, or the scent of your sweater.</p>
      <p>👅 <strong>1 thing you can TASTE:</strong> Take a sip of cold water or notice the aftertaste of mint or tea.</p>
      <p>How does your body feel now compared to a moment ago?</p>
    `
  },
  {
    keywords: [/\b(exam|study|grades|deadline|gpa|homework|academic|burnout|fail|failing|test)\b/i],
    response: `
      <p>Academic stress can make you feel like your entire future is resting on a single exam or assignment. It's exhausting.</p>
      <p>Let's take a step back and ground in truth:</p>
      <ul style="padding-left:18px; margin: 8px 0; display:flex; flex-direction:column; gap:4px;">
        <li><strong>Your worth as a human is not defined by a GPA or letter grade.</strong></li>
        <li>Your brain cannot absorb information in a state of high cortisol panic.</li>
        <li>Rest is not something you "earn" after working; it is a prerequisite for thinking clearly.</li>
      </ul>
      <p><strong>Try the 15-Minute Rule:</strong> Pick just <em>one tiny sub-task</em> (e.g., outline 1 paragraph, or read 2 pages). Set a timer for 15 minutes. Once the timer rings, give yourself full permission to take a 5-minute break.</p>
    `
  },
  {
    keywords: [/\b(lonely|loneliness|alone|nobody|isolated|no\s*friends|homesick)\b/i],
    response: `
      <p>Feeling lonely in college or school is one of the most common yet least-talked-about student experiences. Walking across a crowded campus while feeling completely invisible is heartbreaking.</p>
      <p>Please know: <em>Feeling lonely does not mean there is something wrong with you, or that you are unlovable.</em></p>
      <p>Here are gentle ways to reconnect today:</p>
      <ul style="padding-left:18px; margin: 8px 0; display:flex; flex-direction:column; gap:4px;">
        <li><strong>Head to our Anonymous Peer Chat:</strong> Drop into the <em>Loneliness & Disconnection</em> room—there are students right now who feel the exact same way.</li>
        <li><strong>Micro-connections:</strong> Say thank you and smile at the campus barista, or sit in the library where other people are quietly working around you.</li>
        <li><strong>Send one low-stakes message:</strong> Text a friend or family member a silly meme or "thinking of you".</li>
      </ul>
    `
  },
  {
    keywords: [/\b(sleep|insomnia|can'?t\s*sleep|tired|awake|nightmare|racing\s*thoughts)\b/i],
    response: `
      <p>Racing thoughts in bed usually happen because nighttime is the first moment your brain gets silence after a hectic day.</p>
      <p><strong>A quick bedtime reset:</strong></p>
      <ol style="padding-left:18px; margin: 8px 0; display:flex; flex-direction:column; gap:4px;">
        <li><strong>Brain Dump:</strong> Keep a notebook by your bed. Write down every single worry, assignment, or thought. Tell yourself: <em>"This is safe on paper. I do not need to hold it until tomorrow."</em></li>
        <li><strong>Turn on our Ambient Rain:</strong> Click the 🌧️ Ambient Sound button in the top navigation for soft rain audio.</li>
        <li><strong>4-7-8 Breathing:</strong> Breathe in for 4 seconds, hold gently for 7 seconds, exhale slowly through your mouth for 8 seconds.</li>
      </ol>
    `
  },
  {
    keywords: [/\b(breathe|breathing|box\s*breathing)\b/i],
    response: `
      <p><strong>Let's do Box Breathing together:</strong></p>
      <p>1️⃣ <strong>Inhale</strong> slowly through your nose for 4 seconds... (1, 2, 3, 4)</p>
      <p>2️⃣ <strong>Hold</strong> that breath gently for 4 seconds... (1, 2, 3, 4)</p>
      <p>3️⃣ <strong>Exhale</strong> smoothly through your mouth for 4 seconds... (1, 2, 3, 4)</p>
      <p>4️⃣ <strong>Hold</strong> empty and relaxed for 4 seconds... (1, 2, 3, 4)</p>
      <p>You can also use our animated breathing guide in the Resource Library anytime!</p>
    `
  },
  {
    keywords: [/\b(hello|hi|hey|help|who\s*are\s*you)\b/i],
    response: `
      <p>Hello! I am <strong>HopeBot</strong>, an automated supportive companion designed for students.</p>
      <p>I'm here to offer grounding exercises, coping tips for academic stress and anxiety, or help you find verified crisis resources when things get heavy.</p>
      <p><em>How are you feeling right at this moment? What is on your mind?</em></p>
    `
  }
];

const DEFAULT_RESPONSE = `
  <p>Thank you for sharing that with me. It takes courage to put feelings into words.</p>
  <p>Whatever you are carrying right now, please take a moment to be gentle with yourself. You don't have to figure out the whole semester, year, or future today—you just need to take care of the next ten minutes.</p>
  <p>Would you like to try a grounding exercise, talk about study stress, or check out our verified resources?</p>
  <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
    <button class="chip-btn" onclick="sendPredefined('Help me with anxiety')">Anxiety Relief</button>
    <button class="chip-btn" onclick="sendPredefined('I am stressed about exams')">Exam Stress</button>
    <button class="chip-btn" onclick="sendPredefined('Walk me through 5-4-3-2-1 Grounding')">Grounding Exercise</button>
  </div>
`;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chatbotForm');
  const input = document.getElementById('chatbotInput');

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserSubmit();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserSubmit();
      }
    });
  }

  // Bind predefined chip buttons
  const chips = document.querySelectorAll('.chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.query || chip.textContent.trim();
      sendPredefined(text);
    });
  });
});

function sendPredefined(text) {
  const input = document.getElementById('chatbotInput');
  if (input) {
    input.value = text;
    handleUserSubmit();
  }
}

function handleUserSubmit() {
  const input = document.getElementById('chatbotInput');
  const userText = (input.value || '').trim();
  if (!userText) return;

  // Add User Message
  appendUserMessage(userText);
  input.value = '';

  // Simulate typing delay for natural empathetic cadence
  showTypingPlaceholder();

  setTimeout(() => {
    removeTypingPlaceholder();
    processBotResponse(userText);
  }, 750);
}

function appendUserMessage(text) {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'user-msg';
  div.textContent = text;
  container.appendChild(div);
  scrollBotToBottom();
}

function showTypingPlaceholder() {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.id = 'botTyping';
  div.className = 'bot-msg';
  div.innerHTML = `
    <div class="bot-icon-small">🤖</div>
    <div class="bot-msg-bubble" style="color:var(--text-light); font-style:italic;">
      HopeBot is thinking...
    </div>
  `;
  container.appendChild(div);
  scrollBotToBottom();
}

function removeTypingPlaceholder() {
  const typing = document.getElementById('botTyping');
  if (typing) typing.remove();
}

function processBotResponse(userText) {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;

  // 1. High-Risk Crisis Check
  const isCrisis = CRISIS_TRIGGERS.some(trigger => trigger.test(userText));

  if (isCrisis) {
    // Notify server anonymously for crisis safety logs
    fetch('/api/crisis-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'chatbot_high_risk_trigger' })
    }).catch(() => {});

    const crisisDiv = document.createElement('div');
    crisisDiv.className = 'bot-msg';
    crisisDiv.innerHTML = `
      <div class="bot-icon-small" style="background:#fed7d7; color:#c53030;">🚨</div>
      <div class="bot-msg-bubble" style="border-color:#feb2b2; background:#fffafa;">
        <p style="font-weight:700; color:#c53030; font-size:1rem;">
          I hear how much pain you are experiencing right now, and I care deeply about your safety.
        </p>
        <p>
          Because I am an automated program, <strong>I cannot provide medical or crisis care</strong>. But there are trained, caring people ready to support you right this second. You do not have to carry this alone.
        </p>

        <div class="crisis-escalation-card">
          <div class="crisis-card-header">
            <span>🆘 Immediate Free & Confidential Crisis Hotlines (24/7)</span>
          </div>
          <div class="crisis-card-body">
            Please reach out to one of these verified resources immediately:
          </div>
          <div class="crisis-hotline-actions">
            <a href="tel:988" class="hotline-btn" style="background:#e53e3e; color:#fff;">
              <span>📞 <strong>Call or Text 988</strong> (US & Canada Suicide & Crisis Lifeline)</span>
              <span>Available 24/7 &rarr;</span>
            </a>
            <a href="sms:741741&body=HOME" class="hotline-btn">
              <span>💬 <strong>Crisis Text Line:</strong> Text HOME to 741741</span>
              <span>Text anytime &rarr;</span>
            </a>
            <a href="tel:18664887386" class="hotline-btn">
              <span>🏳️‍🌈 <strong>The Trevor Project (LGBTQ+ Youth):</strong> 1-866-488-7386</span>
              <span>Call now &rarr;</span>
            </a>
            <a href="https://findahelpline.com/" target="_blank" rel="noopener noreferrer" class="hotline-btn">
              <span>🌍 <strong>International Helplines Directory</strong> (Over 130 countries)</span>
              <span>Visit directory &rarr;</span>
            </a>
          </div>
        </div>

        <p style="margin-top:12px; font-size:0.85rem; color:#742a2a;">
          If you are on campus, you can also contact your <strong>Campus Counseling Center</strong> or campus emergency services. Please reach out to someone who can help keep you safe.
        </p>
      </div>
    `;
    container.appendChild(crisisDiv);
    scrollBotToBottom();
    return;
  }

  // 2. Knowledge base matching
  let matched = null;
  for (const item of TOPIC_RESPONSES) {
    if (item.keywords.some(k => k.test(userText))) {
      matched = item.response;
      break;
    }
  }

  const responseHTML = matched || DEFAULT_RESPONSE;

  const botDiv = document.createElement('div');
  botDiv.className = 'bot-msg';
  botDiv.innerHTML = `
    <div class="bot-icon-small">🤖</div>
    <div class="bot-msg-bubble">
      ${responseHTML}
    </div>
  `;
  container.appendChild(botDiv);
  scrollBotToBottom();
}

function scrollBotToBottom() {
  const container = document.getElementById('chatbotMessages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}
