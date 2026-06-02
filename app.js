// UI Elements
const taskInput = document.getElementById('task-input');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const setupContainer = document.getElementById('setup-container');
const activeTimerContainer = document.getElementById('active-timer-container');
const timerDisplay = document.getElementById('timer-display');
const currentTaskDisplay = document.getElementById('current-task-display');
const timerRing = document.getElementById('timer-ring');
const feedList = document.getElementById('feed-list');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const timeBtns = document.querySelectorAll('.time-btn');
const customTimeSelector = document.getElementById('custom-time-selector');
const timerModeBadge = document.getElementById('timer-mode-badge');
const onlineCount = document.getElementById('online-count');
const ambientSoundBtn = document.getElementById('ambient-sound-btn');

// Stats Elements
const todayFocusTimeDisplay = document.getElementById('today-focus-time');
const todayTasksCompletedDisplay = document.getElementById('today-tasks-completed');

// SVG Ring setup
const radius = timerRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
timerRing.style.strokeDasharray = `${circumference} ${circumference}`;
timerRing.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    timerRing.style.strokeDashoffset = offset;
}

// State
let currentMode = 'pomodoro'; // 'pomodoro' or 'custom'
let pomodoroState = 'focus'; // 'focus' or 'break'
let selectedCustomTime = 30 * 60; // default 30 mins
let FOCUS_TIME = 25 * 60;
let BREAK_TIME = 5 * 60;

let originalTime = FOCUS_TIME;
let remainingTime = 0;
let timerInterval;

// Local Storage Stats
let todayStats = JSON.parse(localStorage.getItem('syncFocusV2Stats')) || {
    date: new Date().toDateString(),
    totalFocusMinutes: 0,
    tasksCompleted: 0
};

// Reset stats if it's a new day
if (todayStats.date !== new Date().toDateString()) {
    todayStats = {
        date: new Date().toDateString(),
        totalFocusMinutes: 0,
        tasksCompleted: 0
    };
    saveStats();
}
updateStatsDisplay();

// Event Listeners
toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        if (currentMode === 'custom') {
            customTimeSelector.classList.remove('hidden');
        } else {
            customTimeSelector.classList.add('hidden');
        }
    });
});

timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        timeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCustomTime = parseInt(btn.dataset.time) * 60;
    });
});

startBtn.addEventListener('click', startFocus);
stopBtn.addEventListener('click', () => stopFocus(false));
ambientSoundBtn.addEventListener('click', toggleAmbientSound);

// Functions
function startFocus() {
    const taskName = taskInput.value.trim() || '集中タイム';
    
    // UI Update
    currentTaskDisplay.textContent = taskName;
    setupContainer.classList.add('hidden');
    activeTimerContainer.classList.remove('hidden');
    
    // Initialize Timer
    if (currentMode === 'pomodoro') {
        pomodoroState = 'focus';
        originalTime = FOCUS_TIME;
        timerModeBadge.textContent = 'FOCUS MODE (25m)';
        timerModeBadge.className = 'timer-mode-badge';
    } else {
        originalTime = selectedCustomTime;
        timerModeBadge.textContent = 'CUSTOM FOCUS';
        timerModeBadge.className = 'timer-mode-badge';
    }
    
    remainingTime = originalTime;
    updateTimerDisplay();
    setProgress(100);
    
    // Add self to feed
    addFeedItem('あなた', taskName, true);
    
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        const percent = (remainingTime / originalTime) * 100;
        setProgress(percent);
        
        if (remainingTime <= 0) {
            handleTimerComplete();
        }
    }, 1000);
}

function stopFocus(completed = false) {
    clearInterval(timerInterval);
    
    if (completed && pomodoroState === 'focus' || (completed && currentMode === 'custom')) {
        // Record stats
        const minutes = Math.floor(originalTime / 60);
        todayStats.totalFocusMinutes += minutes;
        todayStats.tasksCompleted += 1;
        saveStats();
        updateStatsDisplay();
        
        addFeedItem('あなた', currentTaskDisplay.textContent + ' (達成🎉)', true, true);
    }
    
    setupContainer.classList.remove('hidden');
    activeTimerContainer.classList.add('hidden');
    taskInput.value = '';
}

function handleTimerComplete() {
    clearInterval(timerInterval);
    
    if (currentMode === 'pomodoro' && pomodoroState === 'focus') {
        // Switch to Break
        pomodoroState = 'break';
        originalTime = BREAK_TIME;
        remainingTime = originalTime;
        
        timerModeBadge.textContent = 'BREAK TIME (5m)';
        timerModeBadge.className = 'timer-mode-badge break';
        
        // Record stats for the focus session
        todayStats.totalFocusMinutes += 25;
        todayStats.tasksCompleted += 1;
        saveStats();
        updateStatsDisplay();
        
        addFeedItem('あなた', currentTaskDisplay.textContent + ' (25分達成🎉)', true, true);
        
        // Start break timer automatically
        timerInterval = setInterval(() => {
            remainingTime--;
            updateTimerDisplay();
            setProgress((remainingTime / originalTime) * 100);
            
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                alert("休憩終了！次のポモドーロを始めましょう。");
                stopFocus(false);
            }
        }, 1000);
        
    } else {
        // Custom mode completed or Break completed
        setTimeout(() => {
            alert("お疲れ様でした！");
            stopFocus(true);
        }, 500);
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function saveStats() {
    localStorage.setItem('syncFocusV2Stats', JSON.stringify(todayStats));
}

function updateStatsDisplay() {
    todayFocusTimeDisplay.innerHTML = `${todayStats.totalFocusMinutes}<span class="unit">分</span>`;
    todayTasksCompletedDisplay.innerHTML = `${todayStats.tasksCompleted}<span class="unit">個</span>`;
}

// Ambient Sound Fake Toggle
let isSoundOn = false;
function toggleAmbientSound() {
    isSoundOn = !isSoundOn;
    if (isSoundOn) {
        ambientSoundBtn.classList.add('active');
        ambientSoundBtn.innerHTML = '<span class="material-symbols-rounded">graphic_eq</span>';
        // In a real app, we would play a sound here
    } else {
        ambientSoundBtn.classList.remove('active');
        ambientSoundBtn.innerHTML = '<span class="material-symbols-rounded">headphones</span>';
    }
}

// --- Enhanced Mock Feed System ---
const mockNames = ['Alex', 'Yuki', 'Sam', 'Mika', 'Ken', 'Emma', 'Hiro', 'Sato', 'Takuya', 'Rin'];
const mockTasks = [
    'Reactのチュートリアル', 
    '英語の単語帳', 
    '読書 (デザイン思考)', 
    '課題レポート作成', 
    'ポートフォリオ更新',
    'Next.js 開発',
    'UIデザイン作成'
];
const colors = [
    'linear-gradient(135deg, #3b82f6, #2dd4bf)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #6366f1, #a855f7)'
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function addFeedItem(name, task, isSelf = false, isComplete = false) {
    const item = document.createElement('div');
    item.className = `feed-item`;
    
    const initial = name.charAt(0).toUpperCase();
    const bg = isSelf ? colors[0] : getRandomItem(colors);
    const timeStr = isComplete ? '<span style="color:var(--success)">達成 🎉</span>' : `${Math.floor(Math.random() * 45) + 5}分経過`;

    item.innerHTML = `
        <div class="feed-avatar" style="background: ${bg}">
            ${initial}
        </div>
        <div class="feed-content">
            <div class="feed-user">
                ${name} 
                <span class="feed-time-indicator">${isSelf && !isComplete ? 'Now' : timeStr}</span>
            </div>
            <div class="feed-task">${task}</div>
            ${!isSelf ? `
            <div class="feed-actions">
                <button class="cheer-btn" onclick="cheerUser(this)">
                    <span class="material-symbols-rounded" style="font-size: 16px;">local_fire_department</span> 応援
                </button>
            </div>
            ` : ''}
        </div>
    `;
    
    feedList.prepend(item);
    
    // Keep only last 15 items
    if (feedList.children.length > 15) {
        feedList.removeChild(feedList.lastChild);
    }
}

// Global function for inline onclick
window.cheerUser = function(btn) {
    if(btn.classList.contains('cheered')) return;
    
    btn.classList.add('cheered');
    btn.classList.add('cheer-pop');
    btn.innerHTML = '<span class="material-symbols-rounded" style="font-size: 16px;">favorite</span> 応援した！';
    
    // Play a tiny haptic feedback if available (mobile)
    if(navigator.vibrate) navigator.vibrate(50);
};

// Initial Mock Data
addFeedItem('Takuya', 'Pythonでスクレイピング', false, false);
setTimeout(() => addFeedItem('Rin', 'TOEICリスニング', false, false), 500);
setTimeout(() => addFeedItem('Yuki', 'UIデザイン作成', false, true), 1200);

// Randomly add new feed items and update online count
setInterval(() => {
    if (Math.random() > 0.6) {
        addFeedItem(
            getRandomItem(mockNames), 
            getRandomItem(mockTasks)
        );
    }
    
    // Fluctuate online count slightly
    if (Math.random() > 0.5) {
        let current = parseInt(onlineCount.textContent);
        current += Math.floor(Math.random() * 5) - 2; // -2 to +2
        if(current < 50) current = 50;
        onlineCount.textContent = current;
    }
}, 6000);
