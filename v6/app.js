// ==========================================
// Web Audio API 8-bit Sound Engine (v6 新機能)
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// 8ビット風ビープ音ジェネレーター
function playTone(frequency, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type; // 'square', 'sawtooth', 'triangle' for retro sound
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

const SoundSystem = {
    playStart: () => {
        playTone(440, 'square', 0.1, 0.05);
        setTimeout(() => playTone(880, 'square', 0.2, 0.05), 100);
    },
    playDamage: () => {
        // ドスッというノイズに近い低い音
        playTone(100, 'sawtooth', 0.3, 0.2);
        setTimeout(() => playTone(50, 'square', 0.4, 0.3), 50);
    },
    playSuccess: () => {
        // ピロリン
        playTone(523.25, 'square', 0.1, 0.05); // C5
        setTimeout(() => playTone(659.25, 'square', 0.1, 0.05), 100); // E5
        setTimeout(() => playTone(783.99, 'square', 0.2, 0.05), 200); // G5
    },
    playLevelUp: () => {
        // ファンファーレ
        const notes = [
            { f: 523.25, t: 0 },   // C5
            { f: 523.25, t: 150 }, // C5
            { f: 523.25, t: 300 }, // C5
            { f: 698.46, t: 450 }, // F5
            { f: 783.99, t: 750 }, // G5
            { f: 698.46, t: 1050 },// F5
            { f: 1046.50, t: 1200 }// C6
        ];
        notes.forEach(note => {
            setTimeout(() => playTone(note.f, 'square', 0.3, 0.1), note.t);
        });
    }
};

// UI Elements
const audioInitOverlay = document.getElementById('audio-init-overlay');
const audioStartBtn = document.getElementById('audio-start-btn');

audioStartBtn.addEventListener('click', () => {
    initAudio();
    SoundSystem.playStart();
    audioInitOverlay.style.opacity = '0';
    setTimeout(() => audioInitOverlay.classList.add('hidden'), 500);
});

// 既存UI Elements
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
const campBtn = document.getElementById('camp-btn');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const xpBar = document.getElementById('xp-bar');
const xpText = document.getElementById('xp-text');
const playerLevel = document.getElementById('player-level');
const focusPet = document.getElementById('focus-pet');
const damageOverlay = document.getElementById('damage-overlay');
const warningOverlay = document.getElementById('warning-overlay');
const resumeBtn = document.getElementById('resume-btn');
const levelupOverlay = document.getElementById('levelup-overlay');
const levelupCloseBtn = document.getElementById('levelup-close-btn');
const newLevelDisplay = document.getElementById('new-level-display');
const campOverlay = document.getElementById('camp-overlay');
const endCampBtn = document.getElementById('end-camp-btn');
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
let player = JSON.parse(localStorage.getItem('syncFocusV6Player')) || {
    hp: 100, maxHp: 100, xp: 0, level: 1
};
function getNextLevelXp(level) { return level * 100; }
function savePlayer() { localStorage.setItem('syncFocusV6Player', JSON.stringify(player)); }

function updateStatusUI() {
    const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
    hpBar.style.width = `${hpPercent}%`;
    hpText.textContent = `${player.hp}/${player.maxHp}`;
    
    const requiredXp = getNextLevelXp(player.level);
    const xpPercent = Math.min(100, (player.xp / requiredXp) * 100);
    xpBar.style.width = `${xpPercent}%`;
    xpText.textContent = `${player.xp}/${requiredXp}`;
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
let isPaused = false;

// Mock AI Logic
aiBreakdownBtn.addEventListener('click', () => {
    const task = taskInput.value.trim();
    if (!task) return alert("クエストを入力してください！");
    
    aiBreakdownBtn.innerHTML = '<span class="material-symbols-rounded">sync</span> 魔法陣を展開中...';
    aiBreakdownBtn.style.opacity = '0.7';
    
    setTimeout(() => {
        generatedSteps = [
            { title: `「${task}」の準備をする`, time: 3 },
            { title: `最初の1歩だけ進める`, time: 5 },
            { title: `勢いに乗って集中する`, time: 5 }
        ];
        renderSteps();
        aiStepsContainer.classList.remove('hidden');
        aiBreakdownBtn.innerHTML = '<span class="material-symbols-rounded">auto_awesome</span> クエストを再生成する';
        aiBreakdownBtn.style.opacity = '1';
        SoundSystem.playStart();
    }, 1000);
});

function renderSteps() {
    aiStepsList.innerHTML = '';
    generatedSteps.forEach((step) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="material-symbols-rounded">swords</span> ${step.title} (${step.time}分)`;
        aiStepsList.appendChild(li);
    });
}

// Timer Logic
startBtn.addEventListener('click', () => {
    if (generatedSteps.length === 0) return;
    if (player.hp <= 0) {
        player.hp = player.maxHp;
        updateStatusUI();
        savePlayer();
    }
    SoundSystem.playStart();
    currentStepIndex = 0;
    isPaused = false;
    startCurrentStep();
    setupSection.classList.add('hidden');
    activeTimerContainer.classList.remove('hidden');
});

function startCurrentStep() {
    isFocusModeActive = true;
    const step = generatedSteps[currentStepIndex];
    currentStepDisplay.textContent = step.title;
    remainingStepsDisplay.textContent = `全${generatedSteps.length}ステップ中 ${currentStepIndex + 1}つ目`;
    
    if(!isPaused) {
        originalTime = step.time * 60;
        remainingTime = originalTime;
        addFeedItem('あなた', `【クエスト開始】${step.title}`, true);
    }
    
    updateTimerDisplay();
    setProgress((remainingTime / originalTime) * 100);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if(!isPaused) {
            remainingTime--;
            updateTimerDisplay();
            setProgress((remainingTime / originalTime) * 100);
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
            }
        }
    }, 1000);
}

// キャンプ（一時停止）処理
campBtn.addEventListener('click', () => {
    isPaused = true;
    campOverlay.classList.remove('hidden');
    addFeedItem('システム', `「あなた」さんがキャンプ（休憩）に入りました⛺`, false);
});

endCampBtn.addEventListener('click', () => {
    isPaused = false;
    campOverlay.classList.add('hidden');
    addFeedItem('システム', `「あなた」さんが冒険を再開しました！`, false);
});

// XP Gain Logic
completeStepBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    const step = generatedSteps[currentStepIndex];
    const gainedXp = step.time * 10;
    gainXP(gainedXp);
    
    SoundSystem.playSuccess();
    addFeedItem('あなた', `【クエストクリア🎉】+${gainedXp} XP 獲得！`, true);
    
    currentStepIndex++;
    if (currentStepIndex < generatedSteps.length) {
        isPaused = false;
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
    isPaused = false;
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
        player.maxHp += 10;
        player.hp = player.maxHp;
        newLevelDisplay.textContent = player.level;
        levelupOverlay.classList.remove('hidden');
        SoundSystem.playLevelUp();
    }
    updateStatusUI();
    savePlayer();
}

levelupCloseBtn.addEventListener('click', () => { levelupOverlay.classList.add('hidden'); });

// --- RPG Damage System (Page Visibility API) ---
document.addEventListener("visibilitychange", () => {
    if (document.hidden && isFocusModeActive && !isPaused) {
        takeDamage(20);
        appBody.classList.add('strict-warning');
        warningOverlay.classList.remove('hidden');
        focusPet.classList.add('hurt');
        SoundSystem.playDamage(); // サウンド再生
        addFeedItem('システム', `「あなた」さんがよそ見をしてダメージを受けた！(-20 HP)`, false, true);
    }
});

function takeDamage(amount) {
    player.hp -= amount;
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
    if (player.hp <= 0) resetToSetup();
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
addFeedItem('システム', 'SyncFocus v6 へようこそ！', false, false);
