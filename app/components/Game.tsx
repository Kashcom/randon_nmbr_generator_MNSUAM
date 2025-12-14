"use client";

import React, { useState, useEffect, useRef } from 'react';

// ==========================================
// Game Configuration
// ==========================================
type Level = 'easy' | 'medium' | 'hard';

interface LevelConfig {
    name: string;
    min: number;
    max: number;
    maxAttempts: number;
    bonusThreshold: number;
    baseScore: number;
    bonusScore: number;
}

const LEVELS: Record<Level, LevelConfig> = {
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

interface GuessHistoryItem {
    guess: number;
    hint: string;
}

export default function Game() {
    // Game State
    const [currentScreen, setCurrentScreen] = useState<'level' | 'game' | 'result'>('level');
    const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
    const [targetNumber, setTargetNumber] = useState<number | null>(null);
    const [attemptsUsed, setAttemptsUsed] = useState(0);
    const [totalScore, setTotalScore] = useState(0);
    const [guessHistory, setGuessHistory] = useState<GuessHistoryItem[]>([]);
    const [guessInput, setGuessInput] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' | 'info' }>({ text: 'Make your first guess!', type: 'info' });

    // Result State
    const [resultData, setResultData] = useState<{ won: boolean; scoreEarned: number; bonusEarned: boolean }>({ won: false, scoreEarned: 0, bonusEarned: false });

    // Audio & Theme State
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    // Refs for Audio
    const bgMusicRef = useRef<HTMLAudioElement | null>(null);
    const victorySoundRef = useRef<HTMLAudioElement | null>(null);

    // ==========================================
    // Initialization & Effects
    // ==========================================
    useEffect(() => {
        // Initialize Audio
        bgMusicRef.current = new Audio('/WhatsApp Audio 2025-12-14 at 4.41.58 PM.wav');
        bgMusicRef.current.loop = true;

        victorySoundRef.current = new Audio('/mixkit-game-level-completed-2059.wav');

        // Load saved settings
        const savedVolume = localStorage.getItem('musicVolume');
        const savedMuted = localStorage.getItem('musicMuted');
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

        if (savedVolume !== null) setVolume(parseFloat(savedVolume));
        if (savedMuted === 'true') setIsMuted(true);
        if (savedTheme) setTheme(savedTheme);

        document.documentElement.setAttribute('data-theme', savedTheme || 'dark');

        // Note: Autoplay might be blocked, we handle play on logic or user interaction if needed
        // For this port, we'll respect the logic but might need user interaction to start audio context

        return () => {
            if (bgMusicRef.current) {
                bgMusicRef.current.pause();
                bgMusicRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (bgMusicRef.current) {
            bgMusicRef.current.volume = isMuted ? 0 : volume;
            if (!isMuted && volume > 0 && bgMusicRef.current.paused) {
                // Attempt to play if not playing
                bgMusicRef.current.play().catch(e => console.log("Audio autoplay blocked", e));
            }
        }
    }, [volume, isMuted]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // ==========================================
    // Game Logic
    // ==========================================
    const getRandomNumber = (min: number, max: number) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const startGame = (level: Level) => {
        const config = LEVELS[level];
        setCurrentLevel(level);
        setTargetNumber(getRandomNumber(config.min, config.max));
        setAttemptsUsed(0);
        setGuessHistory([]);
        setGuessInput('');
        setFeedbackMessage({ text: 'Make your first guess!', type: 'info' });
        setCurrentScreen('game');

        // Ensure music is playing if enabled
        if (bgMusicRef.current && !isMuted && volume > 0) {
            bgMusicRef.current.play().catch(() => { });
        }
    };

    const handleGuess = () => {
        if (!currentLevel || targetNumber === null) return;

        const config = LEVELS[currentLevel];
        const guess = parseInt(guessInput);

        // Validate
        if (isNaN(guess)) {
            setFeedbackMessage({ text: 'Please enter a valid number!', type: 'error' });
            return;
        }
        if (guess < config.min || guess > config.max) {
            setFeedbackMessage({ text: `Number must be between ${config.min} and ${config.max}!`, type: 'error' });
            return;
        }

        const newAttempts = attemptsUsed + 1;
        setAttemptsUsed(newAttempts);

        if (guess === targetNumber) {
            handleCorrectGuess(newAttempts, config);
        } else {
            handleIncorrectGuess(guess, newAttempts, config);
        }

        setGuessInput('');
    };

    const handleCorrectGuess = (attempts: number, config: LevelConfig) => {
        // Play Sound
        if (victorySoundRef.current) {
            victorySoundRef.current.currentTime = 0;
            victorySoundRef.current.play().catch(e => console.log('Sound error', e));
        }

        let score = config.baseScore;
        let bonus = false;

        if (attempts <= config.bonusThreshold) {
            score += config.bonusScore;
            bonus = true;
        }

        setTotalScore(prev => prev + score);

        let msg = `🎉 Correct! You guessed it in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`;
        if (bonus) msg += ` Bonus score earned! 🌟`;

        setFeedbackMessage({ text: msg, type: 'success' });
        setGuessHistory(prev => [...prev, { guess: targetNumber!, hint: '✓' }]);

        setTimeout(() => {
            setResultData({ won: true, scoreEarned: score, bonusEarned: bonus });
            setCurrentScreen('result');
        }, 1500);
    };

    const handleIncorrectGuess = (guess: number, attempts: number, config: LevelConfig) => {
        const attemptsLeft = config.maxAttempts - attempts;

        if (attemptsLeft === 0) {
            setFeedbackMessage({ text: `❌ Game Over! The number was ${targetNumber}`, type: 'error' });
            setGuessHistory(prev => [...prev, { guess, hint: '✗' }]);

            setTimeout(() => {
                setResultData({ won: false, scoreEarned: 0, bonusEarned: false });
                setCurrentScreen('result');
            }, 1500);
        } else {
            const comparison = guess < targetNumber! ? 'higher' : 'lower'; // Fixed logic: if guess < target, answer is higher
            const hintArrow = guess < targetNumber! ? '↑' : '↓';
            // Note: script.js had `guess < gameState.targetNumber ? 'lower' : 'higher'`, 
            // wait: if guess (10) < target (50), guess is LOWER than target. 
            // script.js said: `Your guess (${guess}) is ${comparison} than the number!` 
            // if input 10, target 50 -> 10 < 50 -> comparison = 'lower'. 
            // "Your guess (10) is lower than the number!" -> This implies user needs to guess higher.
            // script.js logic: `const comparison = guess < gameState.targetNumber ? 'lower' : 'higher';` is correct for that sentence structure.

            const comparisonText = guess < targetNumber! ? 'lower' : 'higher';

            let type: 'info' | 'warning' = 'info';
            if (attemptsLeft <= 2) type = 'warning';

            setFeedbackMessage({
                text: `Your guess (${guess}) is ${comparisonText} than the number! ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining`,
                type
            });
            setGuessHistory(prev => [...prev, { guess, hint: hintArrow }]);
        }
    };

    // ==========================================
    // UI Helpers
    // ==========================================
    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const adjustVolume = (val: string) => {
        const newVol = parseInt(val) / 100;
        setVolume(newVol);
        setIsMuted(newVol === 0);
        localStorage.setItem('musicVolume', newVol.toString());
        localStorage.setItem('musicMuted', (newVol === 0).toString());
    };

    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (newMuted) {
            // Effectively mute
            if (bgMusicRef.current) bgMusicRef.current.volume = 0;
        } else {
            if (bgMusicRef.current) bgMusicRef.current.volume = volume === 0 ? 0.5 : volume; // restore default if was 0
        }
        localStorage.setItem('musicMuted', newMuted.toString());
    };

    // ==========================================
    // Render
    // ==========================================
    const renderScoreboard = () => (
        <div className="scoreboard">
            <div className="score-item">
                <span className="score-label">Total Score</span>
                <span className="score-value">{totalScore}</span>
            </div>
            <div className="score-divider"></div>
            <div className="score-item">
                <span className="score-label">Current Level</span>
                <span className="score-value">{currentLevel ? LEVELS[currentLevel].name : '-'}</span>
            </div>
            <div className="score-divider"></div>
            <div className="score-item">
                <span className="score-label">Attempts Left</span>
                <span className="score-value">
                    {currentLevel ? (LEVELS[currentLevel].maxAttempts - attemptsUsed) : '-'}
                </span>
            </div>
        </div>
    );

    return (
        <div className="container">
            {/* Theme Toggle */}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? (
                    <svg className="sun-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="5"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                ) : (
                    <svg className="moon-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                    </svg>
                )}
            </button>

            {/* Volume Control */}
            <div className="volume-control" id="volumeControl">
                <div className="volume-slider-container active" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="range"
                        className="volume-slider"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume * 100}
                        onChange={(e) => adjustVolume(e.target.value)}
                    />
                    <span className="volume-percentage">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                </div>
            </div>

            {/* Scoreboard */}
            {renderScoreboard()}

            {/* Screen: Level Selection */}
            {currentScreen === 'level' && (
                <div className="screen" id="levelScreen">
                    <div className="header">
                        <h1 className="title">
                            <span className="title-gradient">Number Guessing</span>
                            <span className="title-sub">Game</span>
                        </h1>
                        <p className="subtitle">Choose your challenge level and test your luck!</p>
                    </div>

                    <div className="levels-grid">
                        {(['easy', 'medium', 'hard'] as Level[]).map((lvl) => (
                            <div key={lvl} className={`level-card ${lvl}`} onClick={() => startGame(lvl)}>
                                <div className="level-icon">
                                    {lvl === 'easy' ? '🎯' : lvl === 'medium' ? '🎲' : '🔥'}
                                </div>
                                <h2 className="level-title">{LEVELS[lvl].name}</h2>
                                <div className="level-details">
                                    <div className="detail-item">
                                        <span className="detail-label">Range:</span>
                                        <span className="detail-value">{LEVELS[lvl].min} - {LEVELS[lvl].max}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Attempts:</span>
                                        <span className="detail-value">{LEVELS[lvl].maxAttempts}</span>
                                    </div>
                                    <div className="detail-item bonus">
                                        <span className="detail-label">Bonus:</span>
                                        <span className="detail-value">+5 for ≤{LEVELS[lvl].bonusThreshold} attempts</span>
                                    </div>
                                </div>
                                <button className="level-btn">Start {LEVELS[lvl].name}</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Screen: Game */}
            {currentScreen === 'game' && currentLevel && (
                <div className="screen" id="gameScreen">
                    <div className="game-header">
                        <h2 className="game-title">Guess the Number!</h2>
                        <p className="game-info">
                            Number is between <span id="rangeMin">{LEVELS[currentLevel].min}</span> and <span id="rangeMax">{LEVELS[currentLevel].max}</span>
                        </p>
                    </div>

                    <div className="game-content">
                        <div className="feedback-area">
                            <div className={`feedback-message ${feedbackMessage.type}`}>
                                {feedbackMessage.text}
                            </div>
                            <div className="attempts-badge">
                                <span>{attemptsUsed}</span> / <span>{LEVELS[currentLevel].maxAttempts}</span> attempts
                            </div>
                        </div>

                        <div className="input-area">
                            <input
                                type="number"
                                className="guess-input"
                                placeholder="Enter your guess"
                                value={guessInput}
                                onChange={(e) => setGuessInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                            />
                            <button className="submit-btn" onClick={handleGuess}>
                                <span>Submit Guess</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>

                        <div className="guess-history">
                            {guessHistory.map((item, idx) => (
                                <div key={idx} className="guess-chip">
                                    {item.guess} {item.hint}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="game-actions">
                        <button className="action-btn secondary" onClick={() => { if (confirm('Restart?')) startGame(currentLevel); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            Restart
                        </button>
                        <button className="action-btn" onClick={() => setCurrentScreen('level')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Change Level
                        </button>
                    </div>
                </div>
            )}

            {/* Screen: Result */}
            {currentScreen === 'result' && (
                <div className="screen" id="resultScreen">
                    <div className="result-content">
                        <div className="result-icon">{resultData.won ? '🎉' : '😢'}</div>
                        <h2 className="result-title">{resultData.won ? 'Congratulations!' : 'Game Over'}</h2>
                        <p className="result-message">
                            {resultData.won
                                ? (resultData.bonusEarned ? 'Amazing! You guessed quickly!' : 'You guessed the number correctly!')
                                : "Don't give up! Try again."}
                        </p>

                        <div className="result-stats">
                            <div className="stat-card">
                                <span className="stat-label">Target Number</span>
                                <span className="stat-value">{targetNumber}</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">Attempts Used</span>
                                <span className="stat-value">{attemptsUsed}</span>
                            </div>
                            <div className={`stat-card ${resultData.won ? 'highlight' : ''}`}>
                                <span className="stat-label">Score Earned</span>
                                <span className="stat-value">+{resultData.scoreEarned}</span>
                            </div>
                        </div>

                        <div className="result-actions">
                            <button className="result-btn primary" onClick={() => currentLevel && startGame(currentLevel)}>
                                Play Again
                            </button>
                            <button className="result-btn secondary" onClick={() => setCurrentScreen('level')}>
                                Change Level
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
