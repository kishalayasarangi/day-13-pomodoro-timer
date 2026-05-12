const CIRCUMFERENCE = 2 * Math.PI * 96;

const durations = {
  pomodoro: 25,
  short: 5,
  long: 15
};

const modeLabels = {
  pomodoro: 'Focus Time',
  short: 'Short Break',
  long: 'Long Break'
};

let currentMode = 'pomodoro';
let timeLeft = durations.pomodoro * 60;
let totalTime = durations.pomodoro * 60;
let isRunning = false;
let interval = null;
let pomodoroCount = 0;
let totalFocusSeconds = 0;
let streak = 0;
let sessionLog = [];
let longBreakAfter = 4;

function updateSettings() {
  durations.pomodoro = parseInt(document.getElementById('setPomodoro').value) || 25;
  durations.short = parseInt(document.getElementById('setShort').value) || 5;
  durations.long = parseInt(document.getElementById('setLong').value) || 15;
  longBreakAfter = parseInt(document.getElementById('setLongAfter').value) || 4;
  if (!isRunning) resetTimer();
}

function switchMode(mode) {
  if (isRunning) stopTimer();
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`btn-${mode}`).classList.add('active');
  timeLeft = durations[mode] * 60;
  totalTime = timeLeft;
  updateDisplay();
  updateRing();
  document.getElementById('timerMode').textContent = modeLabels[mode];
}

function toggleTimer() {
  isRunning ? stopTimer() : startTimer();
}

function startTimer() {
  isRunning = true;
  document.getElementById('startBtn').textContent = 'Pause';
  document.getElementById('startBtn').classList.add('running');
  interval = setInterval(() => {
    timeLeft--;
    if (currentMode === 'pomodoro') totalFocusSeconds++;
    updateDisplay();
    updateRing();
    updateStats();
    if (timeLeft <= 0) sessionComplete();
  }, 1000);
}

function stopTimer() {
  isRunning = false;
  clearInterval(interval);
  document.getElementById('startBtn').textContent = 'Start';
  document.getElementById('startBtn').classList.remove('running');
}

function resetTimer() {
  stopTimer();
  timeLeft = durations[currentMode] * 60;
  totalTime = timeLeft;
  updateDisplay();
  updateRing();
}

function skipSession() {
  stopTimer();
  sessionComplete();
}

function sessionComplete() {
  stopTimer();
  const label = modeLabels[currentMode];
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (currentMode === 'pomodoro') {
    pomodoroCount++;
    streak++;
    addLog(`🍅 Pomodoro #${pomodoroCount} completed`, time, 'log-pomodoro');
    if (pomodoroCount % longBreakAfter === 0) {
      switchMode('long');
    } else {
      switchMode('short');
    }
  } else {
    addLog(`☕ ${label} done`, time, 'log-break');
    switchMode('pomodoro');
  }

  updateStats();
  playBeep();
}

function addLog(text, time, cls) {
  sessionLog.unshift({ text, time, cls });
  renderLog();
}

function renderLog() {
  const ul = document.getElementById('sessionLog');
  if (sessionLog.length === 0) {
    ul.innerHTML = '<li class="log-empty">No sessions yet — start your first pomodoro!</li>';
    return;
  }
  ul.innerHTML = sessionLog.slice(0, 8).map(s =>
    `<li class="${s.cls}"><span>${s.text}</span><span>${s.time}</span></li>`
  ).join('');
}

function updateDisplay() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
  document.title = `${m}:${s} — Pomodoro`;
}

function updateRing() {
  const progress = timeLeft / totalTime;
  const offset = CIRCUMFERENCE * (1 - progress);
  document.getElementById('ringProgress').style.strokeDashoffset = offset;
  document.getElementById('ringProgress').style.strokeDasharray = CIRCUMFERENCE;

  const color = currentMode === 'pomodoro' ? '#7c3aed' : currentMode === 'short' ? '#10b981' : '#3b82f6';
  document.getElementById('ringProgress').style.stroke = color;
}

function updateStats() {
  document.getElementById('pomodoroCount').textContent = pomodoroCount;
  const mins = Math.floor(totalFocusSeconds / 60);
  document.getElementById('focusTime').textContent = `${mins}m`;
  document.getElementById('currentStreak').textContent = streak;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch(e) {}
}

window.onload = () => {
  updateDisplay();
  updateRing();
};
