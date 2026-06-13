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

// RPG Status Elements
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const xpBar = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');
const playerLevel = document.getElementById('player-level');
const focusPet = document.getElementById('focus-pet');

// Overlays
const damageOverlay = document.getElementById('damage-overlay');
const warningOverlay = document.getElementById('warning-overlay');
const resumeBtn = document.getElementById('resume-btn');
const levelupOverlay = document.getElementById('levelup-overlay');
const levelupCloseBtn = document.getElementById('levelup-close-btn');
const newLevelDisplay = document.getElementById('new-level-display');
const appBody = document.getElementById('app-body');

const feedList = document.getElementById('feed-list');

// Setup SVG Ring
const radius = timerRing.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
timerRing.style.strokeDasharray = `${circumference} ${circumference}`;
timerRing.style.strokeDashoffset = circumference;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    timerRing.style.strokeDashoffset = offset;
}

// Player State
let player = JSON.parse(localStorage.getItem('syncFocusV4Player')) || {
    hp: 100,
    maxHp: 100,
    xp: 0,
    level: 1
};
// Helper to calculate required XP for next level
function getNextLevelXp(level) { return level * 100; }

function savePlayer() { localStorage.setItem('syncFocusV4Player', JSON.stringify(player)); }

function updateStatusUI() {
    // HP
    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
    hpBar.style.width = `${hpPercent}%`;
    hpText.textContent = `${player.hp}/${player.maxHp}`;
    
    // XP
    const requiredXp = getNextLevelXp(player.level);
    const xpPercent = Math.min(100, (player.xp / requiredXp) * 100);
    xpBar.style.width = `${xpPercent}%`;
    xpText.textContent = `${player.xp}/${requiredXp}`;
    
    // Level
    playerLevel.textContent = player.level;
}
updateStatusUI();

// App State
let generatedSteps = [];
let currentStepIndex = 0;
let timerInterval;
let remainingTime = 0;
let originalTime = 5 * 60;
let isFocusModeActive = false;

// Mock AI Logic
aiBreakdownBtn.addEventListener('click', () => {
    const task = taskInput.value.trim();
    if (!task) return alert("クエストを入力してください！");
    
    aiBreakdownBtn.innerHTML = '<span class="material-symbols-rounded">sync</span> 魔法陣を展開中...';
    aiBreakdownBtn.style.opacity = '0.7';
    
    setTimeout(() => {
        generatedSteps = [
            { title: `「${task}」の準備をする（資料展開）`, time: 3 },
            { title: `最初の1歩だけ進める`, time: 5 },
            { title: `勢いに乗って5分集中する`, time: 5 }
        ];
        renderSteps();
        aiStepsContainer.classList.remove('hidden');
        aiBreakdownBtn.innerHTML = '<span class="material-symbols-rounded">auto_awesome</span> クエストを再生成する';
        aiBreakdownBtn.style.opacity = '1';
    }, 1000);
});

function renderSteps() {
    aiStepsList.innerHTML = '';
    generatedSteps.forEach((step, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="material-symbols-rounded">swords</span> ${step.title} (${step.time}分)`;
        aiStepsList.appendChild(li);
    });
}

// Timer Logic
startBtn.addEventListener('click', () => {
    if (generatedSteps.length === 0) return;
    if (player.hp <= 0) {
        alert("HPがゼロです！少し休憩して回復してください。（OKを押すとHP全回復します）");
        player.hp = player.maxHp;
        updateStatusUI();
        savePlayer();
    }
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
    
    addFeedItem('あなた', `【クエスト開始】${step.title}`, true);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        setProgress((remainingTime / originalTime) * 100);
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            // 完了待機
        }
    }, 1000);
}

// XP Gain Logic
completeStepBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    const step = generatedSteps[currentStepIndex];
    
    // XP calculation: 10 XP per minute
    const gainedXp = step.time * 10;
    gainXP(gainedXp);
    
    addFeedItem('あなた', `【クエストクリア🎉】+${gainedXp} XP 獲得！`, true);
    
    currentStepIndex++;
    if (currentStepIndex < generatedSteps.length) {
        startCurrentStep();
    } else {
        isFocusModeActive = false;
        alert("すべてのクエストが完了しました！よく頑張りました！");
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

function gainXP(amount) {
    player.xp += amount;
    const requiredXp = getNextLevelXp(player.level);
    if (player.xp >= requiredXp) {
        player.xp -= requiredXp;
        player.level++;
        player.maxHp += 10; // Max HP increases on level up
        player.hp = player.maxHp; // Heal to full
        
        // Show level up overlay
        newLevelDisplay.textContent = player.level;
        levelupOverlay.classList.remove('hidden');
    }
    updateStatusUI();
    savePlayer();
}

levelupCloseBtn.addEventListener('click', () => {
    levelupOverlay.classList.add('hidden');
});

// --- RPG Damage System (Page Visibility API) ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isFocusModeActive) {
        // User switched tabs - Take Damage!
        takeDamage(20);
        
        appBody.classList.add('strict-warning');
        warningOverlay.classList.remove('hidden');
        focusPet.classList.add('hurt');
        
        addFeedItem('システム', `「あなた」さんがよそ見をしてダメージを受けた！(-20 HP)`, false, true);
    }
});

function takeDamage(amount) {
    player.hp -= amount;
    // Flash damage overlay
    damageOverlay.classList.remove('hidden');
    setTimeout(() => { damageOverlay.classList.add('hidden'); }, 300);

    if (player.hp <= 0) {
        player.hp = 0;
        clearInterval(timerInterval);
        isFocusModeActive = false;
        document.getElementById('warning-title').textContent = "GAME OVER";
        document.getElementById('warning-msg').textContent = "HPが0になりました。集中クエストは失敗です...";
    }
    updateStatusUI();
    savePlayer();
}

resumeBtn.addEventListener('click', () => {
    warningOverlay.classList.add('hidden');
    appBody.classList.remove('strict-warning');
    focusPet.classList.remove('hurt');
    document.getElementById('warning-title').textContent = "ダメージを受けた！";
    document.getElementById('warning-msg').textContent = "よそ見をしたため、HPが減少しました。";
    
    if (player.hp <= 0) {
        resetToSetup();
    }
});

// Mock Feed
const mockNames = ['Alex', 'Yuki', 'Sam'];
const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];
function addFeedItem(name, task, isSelf = false, isWarning = false) {
    const item = document.createElement('div');
    item.className = `feed-item`;
    const initial = name.charAt(0).toUpperCase();
    const bg = isSelf ? colors[0] : (isWarning ? '#ef4444' : colors[Math.floor(Math.random()*colors.length)]);
    
    item.innerHTML = `
        <div class="feed-avatar" style="background: ${bg}">${isWarning ? '!' : initial}</div>
        <div class="feed-content">
            <div class="feed-user">${name} <span class="feed-time-indicator">Now</span></div>
            <div class="feed-task" style="${isWarning ? 'color: #fca5a5;' : ''}">${task}</div>
        </div>
    `;
    feedList.prepend(item);
    if (feedList.children.length > 15) feedList.removeChild(feedList.lastChild);
}
addFeedItem('システム', 'SyncFocus RPGの世界へようこそ！', false, false);
