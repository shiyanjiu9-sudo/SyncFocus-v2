// UI Elements
const taskInput = document.getElementById('task-input');
const aiBreakdownBtn = document.getElementById('ai-breakdown-btn');
const aiStepsContainer = document.getElementById('ai-steps-container');
const aiStepsList = document.getElementById('ai-steps-list');
const startBtn = document.getElementById('start-btn');

const setupSection = document.getElementById('setup-section');
const activeTimerContainer = document.getElementById('active-timer-container');
const currentStepDisplay = document.getElementById('current-step-display');
const remainingStepsDisplay = document.getElementById('remaining-steps-display');
const timerDisplay = document.getElementById('timer-display');
const timerRing = document.getElementById('timer-ring');
const completeStepBtn = document.getElementById('complete-step-btn');
const stopBtn = document.getElementById('stop-btn');

const warningOverlay = document.getElementById('warning-overlay');
const resumeBtn = document.getElementById('resume-btn');
const appBody = document.getElementById('app-body');

const feedList = document.getElementById('feed-list');
const onlineCount = document.getElementById('online-count');

// Stats Elements
const todayFocusTimeDisplay = document.getElementById('today-focus-time');
const todayTasksCompletedDisplay = document.getElementById('today-tasks-completed');

// Setup SVG Ring
const radius = timerRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
timerRing.style.strokeDasharray = `${circumference} ${circumference}`;
timerRing.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    timerRing.style.strokeDashoffset = offset;
}

// State
let generatedSteps = [];
let currentStepIndex = 0;
let timerInterval;
let remainingTime = 0;
let originalTime = 5 * 60; // 5 minutes per micro-step
let isFocusModeActive = false;

// Local Storage Stats
let todayStats = JSON.parse(localStorage.getItem('syncFocusV3Stats')) || {
    date: new Date().toDateString(),
    totalFocusMinutes: 0,
    stepsCompleted: 0
};
if (todayStats.date !== new Date().toDateString()) {
    todayStats = { date: new Date().toDateString(), totalFocusMinutes: 0, stepsCompleted: 0 };
    saveStats();
}
updateStatsDisplay();

// AI Task Breakdown (Mock API)
aiBreakdownBtn.addEventListener('click', () => {
    const task = taskInput.value.trim();
    if (!task) return alert("タスクを入力してください！");
    
    // Simulate API call
    aiBreakdownBtn.innerHTML = '<span class="material-symbols-rounded">sync</span> AIが分解中...';
    aiBreakdownBtn.style.opacity = '0.7';
    
    setTimeout(() => {
        generatedSteps = generateMockSteps(task);
        renderSteps();
        aiStepsContainer.classList.remove('hidden');
        aiBreakdownBtn.innerHTML = '<span class="material-symbols-rounded">auto_awesome</span> AIでタスクを極小化する';
        aiBreakdownBtn.style.opacity = '1';
    }, 1500);
});

function generateMockSteps(task) {
    // Simple mock logic depending on task length/keywords
    return [
        { title: `「${task}」の準備をする（資料・ツールを開く）`, time: 3 },
        { title: `最初の1行（または1つ目の作業）だけ手を付ける`, time: 5 },
        { title: `そのまま勢いで5分間だけ集中して進める`, time: 5 }
    ];
}

function renderSteps() {
    aiStepsList.innerHTML = '';
    generatedSteps.forEach((step, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="material-symbols-rounded">radio_button_unchecked</span> ${step.title} (${step.time}分)`;
        aiStepsList.appendChild(li);
    });
}

// Timer Logic
startBtn.addEventListener('click', () => {
    if (generatedSteps.length === 0) return;
    currentStepIndex = 0;
    startCurrentStep();
    setupSection.classList.add('hidden');
    activeTimerContainer.classList.remove('hidden');
});

function startCurrentStep() {
    isFocusModeActive = true;
    const step = generatedSteps[currentStepIndex];
    currentStepDisplay.textContent = step.title;
    remainingStepsDisplay.textContent = `全${generatedSteps.length}ステップ中 ${currentStepIndex + 1}つ目`;
    
    originalTime = step.time * 60;
    remainingTime = originalTime;
    updateTimerDisplay();
    setProgress(100);
    
    // Post to feed
    addFeedItem('あなた', `【集中宣言】${step.title} を開始！`, true);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        setProgress((remainingTime / originalTime) * 100);
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            // Time is up, wait for user to click complete
        }
    }, 1000);
}

completeStepBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    const step = generatedSteps[currentStepIndex];
    
    // Record stats
    todayStats.totalFocusMinutes += step.time;
    todayStats.stepsCompleted += 1;
    saveStats();
    updateStatsDisplay();
    
    addFeedItem('あなた', `【達成🎉】${step.title} を完了！`, true, true);
    
    currentStepIndex++;
    if (currentStepIndex < generatedSteps.length) {
        startCurrentStep();
    } else {
        isFocusModeActive = false;
        alert("すべての極小ステップが完了しました！お疲れ様でした！");
        resetToSetup();
    }
});

stopBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isFocusModeActive = false;
    resetToSetup();
});

function resetToSetup() {
    activeTimerContainer.classList.add('hidden');
    setupSection.classList.remove('hidden');
    aiStepsContainer.classList.add('hidden');
    taskInput.value = '';
}

function updateTimerDisplay() {
    const m = Math.floor(remainingTime / 60);
    const s = remainingTime % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Strict Mode (Page Visibility API) ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isFocusModeActive) {
        // User switched tabs!
        warningOverlay.classList.remove('hidden');
        appBody.classList.add('strict-warning');
        addFeedItem('システム', `「あなた」さんがよそ見をしているようです👀`, false, false, true);
    }
});

resumeBtn.addEventListener('click', () => {
    warningOverlay.classList.add('hidden');
    appBody.classList.remove('strict-warning');
});

// Stats
function saveStats() { localStorage.setItem('syncFocusV3Stats', JSON.stringify(todayStats)); }
function updateStatsDisplay() {
    todayFocusTimeDisplay.innerHTML = `${todayStats.totalFocusMinutes}<span class="unit">分</span>`;
    todayTasksCompletedDisplay.innerHTML = `${todayStats.stepsCompleted}<span class="unit">個</span>`;
}

// Feed System (Mock)
const mockNames = ['Alex', 'Yuki', 'Sam', 'Mika', 'Ken', 'Emma', 'Hiro', 'Sato', 'Takuya', 'Rin'];
const mockTasks = ['最初の1行だけ書く', 'とりあえず参考書を開く', '5分だけコードを書く', '構成案を箇条書きにする'];
const colors = ['linear-gradient(135deg, #3b82f6, #2dd4bf)', 'linear-gradient(135deg, #f59e0b, #ef4444)', 'linear-gradient(135deg, #8b5cf6, #ec4899)', 'linear-gradient(135deg, #10b981, #3b82f6)'];

function getRandomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function addFeedItem(name, task, isSelf = false, isComplete = false, isWarning = false) {
    const item = document.createElement('div');
    item.className = `feed-item`;
    const initial = name.charAt(0).toUpperCase();
    const bg = isSelf ? colors[0] : (isWarning ? '#ef4444' : getRandomItem(colors));
    
    item.innerHTML = `
        <div class="feed-avatar" style="background: ${bg}">${isWarning ? '!' : initial}</div>
        <div class="feed-content">
            <div class="feed-user">${name} <span class="feed-time-indicator">Now</span></div>
            <div class="feed-task" style="${isWarning ? 'color: #fca5a5;' : ''}">${task}</div>
            ${!isSelf && !isWarning ? `<div class="feed-actions"><button class="cheer-btn" onclick="cheerUser(this)"><span class="material-symbols-rounded" style="font-size: 16px;">local_fire_department</span> 応援</button></div>` : ''}
        </div>
    `;
    feedList.prepend(item);
    if (feedList.children.length > 15) feedList.removeChild(feedList.lastChild);
}

window.cheerUser = function(btn) {
    if(btn.classList.contains('cheered')) return;
    btn.classList.add('cheered'); btn.classList.add('cheer-pop');
    btn.innerHTML = '<span class="material-symbols-rounded" style="font-size: 16px;">favorite</span> 応援した！';
};

// Initial Mock Data
addFeedItem('Takuya', '構成案を箇条書きにする (5分)');
setInterval(() => {
    if (Math.random() > 0.6) addFeedItem(getRandomItem(mockNames), getRandomItem(mockTasks) + ' (5分)');
    if (Math.random() > 0.5) {
        let current = parseInt(onlineCount.textContent);
        current += Math.floor(Math.random() * 5) - 2;
        if(current < 50) current = 50;
        onlineCount.textContent = current;
    }
}, 6000);
