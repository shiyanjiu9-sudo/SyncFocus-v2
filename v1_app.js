// UI Elements
const timeBtns = document.querySelectorAll('.time-btn');
const taskInput = document.getElementById('task-input');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const setupContainer = document.getElementById('setup-container');
const activeTimerContainer = document.getElementById('active-timer-container');
const timerDisplay = document.getElementById('timer-display');
const currentTaskDisplay = document.getElementById('current-task-display');
const progressBar = document.getElementById('progress-bar');
const feedList = document.getElementById('feed-list');

// State
let selectedTime = 15 * 60; // default 15 mins in seconds
let originalTime = 15 * 60;
let timerInterval;
let remainingTime;

// Event Listeners
timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        timeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTime = parseInt(btn.dataset.time) * 60;
        originalTime = selectedTime;
    });
});

startBtn.addEventListener('click', startFocus);
stopBtn.addEventListener('click', stopFocus);

// Functions
function startFocus() {
    const taskName = taskInput.value.trim() || '集中タイム';
    
    // UI Update
    currentTaskDisplay.textContent = taskName;
    setupContainer.classList.add('hidden');
    activeTimerContainer.classList.remove('hidden');
    
    // Initialize Timer
    remainingTime = originalTime;
    updateTimerDisplay();
    updateProgressBar();
    
    // Add self to feed
    addFeedItem('あなた', taskName, true);
    
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        updateProgressBar();
        
        if (remainingTime <= 0) {
            completeFocus();
        }
    }, 1000);
}

function stopFocus() {
    clearInterval(timerInterval);
    setupContainer.classList.remove('hidden');
    activeTimerContainer.classList.add('hidden');
    taskInput.value = '';
}

function completeFocus() {
    clearInterval(timerInterval);
    addFeedItem('あなた', currentTaskDisplay.textContent + ' (完了!)', true, true);
    // Play sound or show alert in a real app
    setTimeout(() => {
        alert("お疲れ様でした！目標時間を達成しました。");
        stopFocus();
    }, 500);
}

function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateProgressBar() {
    const percentage = (remainingTime / originalTime) * 100;
    progressBar.style.width = `${percentage}%`;
}

// --- Mock Feed System ---
const mockNames = ['Alex', 'Yuki', 'Sam', 'Mika', 'Ken', 'Emma', 'Hiro', 'Sato'];
const mockTasks = [
    'Reactのチュートリアル', 
    '英語の単語帳', 
    '読書 (デザイン思考)', 
    '課題レポート作成', 
    '筋トレ', 
    '技術ブログ執筆',
    'ポートフォリオ更新'
];
const colors = [
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)'
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function addFeedItem(name, task, isSelf = false, isComplete = false) {
    const item = document.createElement('div');
    item.className = `feed-item ${isComplete ? 'completed' : ''}`;
    
    const initial = name.charAt(0).toUpperCase();
    const bg = isSelf ? colors[0] : getRandomItem(colors);
    const timeStr = isComplete ? '達成 🎉' : `${Math.floor(Math.random() * 45) + 5}分`;

    item.innerHTML = `
        <div class="feed-avatar" style="${isSelf ? '' : `background: ${bg}`}">
            ${initial}
        </div>
        <div class="feed-content">
            <div class="feed-user">${name}</div>
            <div class="feed-task">${task}</div>
        </div>
        <div class="feed-time">
            ${isSelf && !isComplete ? 'Now' : timeStr}
        </div>
    `;
    
    feedList.prepend(item);
    
    // Keep only last 10 items
    if (feedList.children.length > 10) {
        feedList.removeChild(feedList.lastChild);
    }
}

// Initial Mock Data
addFeedItem('Takuya', 'Pythonでスクレイピング', false, false);
setTimeout(() => addFeedItem('Rin', 'TOEICリスニング', false, false), 500);
setTimeout(() => addFeedItem('Yuki', '読書 2章', false, true), 1000);

// Randomly add new feed items to simulate active community
setInterval(() => {
    // 30% chance every 5 seconds to add a new activity
    if (Math.random() > 0.7) {
        addFeedItem(
            getRandomItem(mockNames), 
            getRandomItem(mockTasks)
        );
    }
}, 5000);
