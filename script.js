// ==========================================
// Game Configuration
// ==========================================
const LEVELS = {
    easy: {
        name: 'Easy',
        min: 1,
        max: 50,
        maxAttempts: 10,
        bonusThreshold: 5,
        baseScore: 10,
        bonusScore: 5
    },
    medium: {
        name: 'Medium',
        min: 1,
        max: 75,
        maxAttempts: 7,
        bonusThreshold: 4,
        baseScore: 10,
        bonusScore: 5
    },
    hard: {
        name: 'Hard',
        min: 1,
        max: 100,
        maxAttempts: 5,
        bonusThreshold: 3,
        baseScore: 10,
        bonusScore: 5
    }
};

// ==========================================
// Game State
// ==========================================
let gameState = {
    currentLevel: null,
    targetNumber: null,
    attemptsUsed: 0,
    totalScore: 0,
    guessHistory: [],
    isGameActive: false
};

// ==========================================
// Screen Management
// ==========================================
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });

    // Show the requested screen
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.remove('hidden');
    }
}

// ==========================================
// Game Initialization
// ==========================================
function startGame(level) {
    const config = LEVELS[level];

    gameState.currentLevel = level;
    gameState.targetNumber = getRandomNumber(config.min, config.max);
    gameState.attemptsUsed = 0;
    gameState.guessHistory = [];
    gameState.isGameActive = true;

    console.log(`🎯 Secret number: ${gameState.targetNumber}`); // Debug only

    updateScoreboard();
    updateGameUI(config);
    resetFeedback();
    clearGuessHistory();

    showScreen('gameScreen');

    // Focus input
    const input = document.getElementById('guessInput');
    input.value = '';
    input.focus();
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ==========================================
// Game UI Updates
// ==========================================
function updateScoreboard() {
    const config = LEVELS[gameState.currentLevel];

    document.getElementById('totalScore').textContent = gameState.totalScore;
    document.getElementById('currentLevel').textContent = config ? config.name : '-';

    const attemptsLeft = config ? (config.maxAttempts - gameState.attemptsUsed) : '-';
    document.getElementById('attemptsLeft').textContent = attemptsLeft;
}

function updateGameUI(config) {
    document.getElementById('rangeMin').textContent = config.min;
    document.getElementById('rangeMax').textContent = config.max;
    document.getElementById('attemptsUsed').textContent = gameState.attemptsUsed;
    document.getElementById('maxAttempts').textContent = config.maxAttempts;

    // Update input constraints
    const input = document.getElementById('guessInput');
    input.min = config.min;
    input.max = config.max;
}

function resetFeedback() {
    const feedback = document.getElementById('feedbackMessage');
    feedback.textContent = 'Make your first guess!';
    feedback.className = 'feedback-message';
}

function clearGuessHistory() {
    document.getElementById('guessHistory').innerHTML = '';
}

function addGuessToHistory(guess, hint) {
    const historyContainer = document.getElementById('guessHistory');
    const chip = document.createElement('div');
    chip.className = 'guess-chip';
    chip.textContent = `${guess} ${hint}`;
    historyContainer.appendChild(chip);
}

// ==========================================
// Guess Handling
// ==========================================
function makeGuess() {
    if (!gameState.isGameActive) return;

    const input = document.getElementById('guessInput');
    const guess = parseInt(input.value);
    const config = LEVELS[gameState.currentLevel];

    // Validate input
    if (isNaN(guess)) {
        showFeedback('Please enter a valid number!', 'error');
        return;
    }

    if (guess < config.min || guess > config.max) {
        showFeedback(`Number must be between ${config.min} and ${config.max}!`, 'error');
        return;
    }

    // Increment attempts
    gameState.attemptsUsed++;

    // Check guess
    if (guess === gameState.targetNumber) {
        handleCorrectGuess();
    } else {
        handleIncorrectGuess(guess, config);
    }

    // Update UI
    updateScoreboard();
    document.getElementById('attemptsUsed').textContent = gameState.attemptsUsed;

    // Clear input
    input.value = '';
    input.focus();
}

function handleCorrectGuess() {
    const config = LEVELS[gameState.currentLevel];
    gameState.isGameActive = false;

    // Play victory sound
    const victorySound = new Audio('public/mixkit-game-level-completed-2059.wav');
    victorySound.play().catch(err => console.log('Could not play sound:', err));

    // Calculate score
    let scoreEarned = config.baseScore;
    let bonusEarned = false;

    if (gameState.attemptsUsed <= config.bonusThreshold) {
        scoreEarned += config.bonusScore;
        bonusEarned = true;
    }

    gameState.totalScore += scoreEarned;

    // Show success feedback
    let message = `🎉 Correct! You guessed it in ${gameState.attemptsUsed} ${gameState.attemptsUsed === 1 ? 'attempt' : 'attempts'}!`;
    if (bonusEarned) {
        message += ` Bonus score earned! 🌟`;
    }
    showFeedback(message, 'success');

    // Add to history
    addGuessToHistory(gameState.targetNumber, '✓');

    // Show result screen after a delay
    setTimeout(() => {
        showResultScreen(true, scoreEarned, bonusEarned);
    }, 1500);
}

function handleIncorrectGuess(guess, config) {
    const attemptsLeft = config.maxAttempts - gameState.attemptsUsed;

    if (attemptsLeft === 0) {
        // Game over
        gameState.isGameActive = false;
        showFeedback(`❌ Game Over! The number was ${gameState.targetNumber}`, 'error');
        addGuessToHistory(guess, '✗');

        setTimeout(() => {
            showResultScreen(false, 0, false);
        }, 1500);
    } else {
        // Give hint
        const hint = guess < gameState.targetNumber ? '↑' : '↓';
        const comparison = guess < gameState.targetNumber ? 'lower' : 'higher';

        let feedbackClass = 'info';
        if (attemptsLeft <= 2) {
            feedbackClass = 'warning';
        }

        showFeedback(
            `Your guess (${guess}) is ${comparison} than the number! ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining`,
            feedbackClass
        );

        addGuessToHistory(guess, hint);
    }
}

function showFeedback(message, type) {
    const feedback = document.getElementById('feedbackMessage');
    feedback.textContent = message;
    feedback.className = `feedback-message ${type}`;
}

// ==========================================
// Result Screen
// ==========================================
function showResultScreen(won, scoreEarned, bonusEarned) {
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    const targetNumber = document.getElementById('targetNumber');
    const finalAttempts = document.getElementById('finalAttempts');
    const scoreEarnedEl = document.getElementById('scoreEarned');

    if (won) {
        resultIcon.textContent = '🎉';
        resultTitle.textContent = 'Congratulations!';

        if (bonusEarned) {
            resultMessage.textContent = `Amazing! You guessed the number quickly and earned a bonus!`;
        } else {
            resultMessage.textContent = 'You guessed the number correctly!';
        }

        scoreEarnedEl.textContent = `+${scoreEarned}`;
        scoreEarnedEl.parentElement.classList.add('highlight');
    } else {
        resultIcon.textContent = '😢';
        resultTitle.textContent = 'Game Over';
        resultMessage.textContent = `Don't give up! Try again to improve your score.`;

        scoreEarnedEl.textContent = '+0';
        scoreEarnedEl.parentElement.classList.remove('highlight');
    }

    targetNumber.textContent = gameState.targetNumber;
    finalAttempts.textContent = gameState.attemptsUsed;

    updateScoreboard();
    showScreen('resultScreen');
}

// ==========================================
// Game Controls
// ==========================================
function playAgain() {
    startGame(gameState.currentLevel);
}

function resetGame() {
    if (confirm('Are you sure you want to restart? Your progress will be lost.')) {
        startGame(gameState.currentLevel);
    }
}

function changeLevel() {
    gameState.currentLevel = null;
    gameState.isGameActive = false;
    updateScoreboard();
    showScreen('levelScreen');
}

// ==========================================
// Background Music & Volume Control
// ==========================================
let backgroundMusic = null;
let isMuted = false;

function initBackgroundMusic() {
    backgroundMusic = new Audio('public/WhatsApp Audio 2025-12-14 at 4.41.58 PM.wav');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5; // Default 50% volume

    // Load saved volume from localStorage
    const savedVolume = localStorage.getItem('musicVolume');
    if (savedVolume !== null) {
        backgroundMusic.volume = parseFloat(savedVolume);
        document.getElementById('volumeSlider').value = backgroundMusic.volume * 100;
        document.getElementById('volumePercentage').textContent = Math.round(backgroundMusic.volume * 100) + '%';
    }

    // Load muted state
    const savedMuted = localStorage.getItem('musicMuted');
    if (savedMuted === 'true') {
        isMuted = true;
        backgroundMusic.volume = 0;
        updateVolumeIcon();
    }

    // Try to play (browsers may block autoplay)
    backgroundMusic.play().catch(err => {
        console.log('Background music autoplay blocked. User interaction needed.');
        // Add a one-time click listener to start music
        document.addEventListener('click', function startMusic() {
            backgroundMusic.play().catch(e => console.log('Could not play music:', e));
            document.removeEventListener('click', startMusic);
        }, { once: true });
    });
}

function toggleVolumeSlider() {
    const sliderContainer = document.getElementById('volumeSliderContainer');
    sliderContainer.classList.toggle('active');
}

function adjustVolume(value) {
    if (!backgroundMusic) return;

    const volume = value / 100;
    backgroundMusic.volume = volume;
    document.getElementById('volumePercentage').textContent = value + '%';

    // Save to localStorage
    localStorage.setItem('musicVolume', volume);

    // Update muted state
    if (volume === 0) {
        isMuted = true;
        localStorage.setItem('musicMuted', 'true');
    } else {
        isMuted = false;
        localStorage.setItem('musicMuted', 'false');
    }

    updateVolumeIcon();
}

function updateVolumeIcon() {
    const volumeIcon = document.querySelector('.volume-icon');
    const muteIcon = document.querySelector('.mute-icon');

    if (isMuted || backgroundMusic.volume === 0) {
        volumeIcon.style.display = 'none';
        muteIcon.style.display = 'block';
    } else {
        volumeIcon.style.display = 'block';
        muteIcon.style.display = 'none';
    }
}

// ==========================================
// Theme Toggle
// ==========================================
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ==========================================
// Input Handling & Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const guessInput = document.getElementById('guessInput');

    // Initialize theme
    initTheme();

    // Initialize background music
    initBackgroundMusic();

    // Submit on Enter key
    if (guessInput) {
        guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                makeGuess();
            }
        });
    }

    // Initialize scoreboard
    updateScoreboard();
});

// ==========================================
// Utility Functions
// ==========================================
function resetTotalScore() {
    if (confirm('Are you sure you want to reset your total score?')) {
        gameState.totalScore = 0;
        updateScoreboard();
    }
}
