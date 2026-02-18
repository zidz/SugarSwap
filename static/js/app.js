document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const views = {
        onboarding: document.getElementById('onboarding-view'),
        dashboard: document.getElementById('dashboard-view'),
        scanner: document.getElementById('scanner-view')
    };
    const startBtn = document.getElementById('start-btn');
    const scanBtn = document.getElementById('scan-btn-fab');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const appContainer = document.getElementById('app-container');

    // Stats
    const levelBadge = document.getElementById('level-badge');
    const sugarSavedStat = document.getElementById('sugar-saved-stat');
    const sugarCubesStat = document.getElementById('sugar-cubes-stat');
    const streakStat = document.getElementById('streak-stat');
    const xpStat = document.getElementById('xp-stat');
    const xpToNextLevelStat = document.getElementById('xp-to-next-level-stat');
    const xpBar = document.getElementById('xp-bar');

    // --- App State ---
    let state = {};
    const NEMESIS_SUGAR_PER_100ML = 10.6; // e.g., Coca-Cola

    // --- Database (LocalStorage for simplicity) ---
    const db = {
        load: () => {
            const data = localStorage.getItem('sugarSwapState');
            if (data) {
                state = JSON.parse(data);
            } else {
                // Default initial state
                state = {
                    meta: { version: "1.0.0", created_at_timestamp: Date.now() },
                    user_profile: { nickname: "SugarSlayer" },
                    gamification_state: {
                        level: 1,
                        current_xp: 0,
                        lifetime_stats: { total_sugar_saved_g: 0 },
                        streaks: { current_streak_days: 0, last_log_date: null }
                    },
                    scan_log: [],
                    product_cache: {}
                };
            }
            updateUI();
        },
        save: () => {
            localStorage.setItem('sugarSwapState', JSON.stringify(state));
        }
    };

    // --- View Management ---
    const showView = (viewName) => {
        Object.values(views).forEach(view => view.classList.remove('active'));
        views[viewName].classList.add('active');
    };

    // --- Gamification Logic ---
    const gamification = {
        xpForLevel: (level) => Math.pow(level, 2) * 100,
        addXp: (xp) => {
            state.gamification_state.current_xp += xp;
            const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
            if (state.gamification_state.current_xp >= xpForNextLevel) {
                state.gamification_state.level++;
                // state.gamification_state.current_xp -= xpForNextLevel; // Resetting XP on level up can be demotivating
                playSound('jackpot_win.mp3'); 
                showFeedback('LEVEL UP!', `You are now Level ${state.gamification_state.level}!`);
            }
        },
        calculateSugarSaving: (product) => {
            const servingSizeMl = parseFloat(product.serving_size?.match(/(\d+)/)?.[0] || 330);
            const sugarPer100g = product.nutriments?.sugars_100g || 0;
            if (sugarPer100g < 0.5) { // Considered sugar-free
                return (servingSizeMl / 100) * NEMESIS_SUGAR_PER_100ML;
            }
            return 0; // It's a sugary drink, no "saving"
        },
        updateStreak: () => {
            const today = new Date().toISOString().split('T')[0];
            const lastLog = state.gamification_state.streaks.last_log_date;
            
            if (lastLog !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (lastLog === yesterday) {
                    state.gamification_state.streaks.current_streak_days++;
                } else {
                    // Soft reset: reduce by 20%
                    state.gamification_state.streaks.current_streak_days = Math.floor(state.gamification_state.streaks.current_streak_days * 0.8);
                }
                state.gamification_state.streaks.last_log_date = today;
            }
        }
    };

    // --- UI Updates ---
    const updateUI = () => {
        // Dashboard
        levelBadge.textContent = state.gamification_state.level;
        sugarSavedStat.textContent = state.gamification_state.lifetime_stats.total_sugar_saved_g.toFixed(1);
        sugarCubesStat.textContent = Math.floor(state.gamification_state.lifetime_stats.total_sugar_saved_g / 4);
        streakStat.textContent = state.gamification_state.streaks.current_streak_days;
        
        // XP Bar
        const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
        xpStat.textContent = state.gamification_state.current_xp.toFixed(0);
        xpToNextLevelStat.textContent = xpForNextLevel;
        xpBar.style.width = `${(state.gamification_state.current_xp / xpForNextLevel) * 100}%`;

        // Animate numbers
        [sugarSavedStat, sugarCubesStat, xpStat, levelBadge].forEach(el => {
            el.classList.add('odometer-animation');
            setTimeout(() => el.classList.remove('odometer-animation'), 300);
        });
    };

    const showFeedback = (title, text) => {
        feedbackOverlay.querySelector('#feedback-title').textContent = title;
        feedbackOverlay.querySelector('#feedback-text').textContent = text;
        feedbackOverlay.classList.add('show');
        setTimeout(() => feedbackOverlay.classList.remove('show'), 4000);
    };

    const playSound = (soundFile) => {
        const audio = new Audio(`/static/audio/${soundFile}`);
        audio.play().catch(e => console.log("Audio play failed:", e));
    };

    // --- Scanner Logic ---
    let html5QrCode;
    const startScanner = () => {
        showView('scanner');
        html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 150 } };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanError);
    };

    const stopScanner = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => showView('dashboard')).catch(err => console.error(err));
        } else {
            showView('dashboard');
        }
    };

    const onScanSuccess = (decodedText, decodedResult) => {
        stopScanner();
        handleBarcode(decodedText);
    };
    
    const onScanError = (errorMessage) => {
        // handle scan error, usually ignore.
    };
    
    const handleBarcode = (barcode) => {
        // Check cache first
        if (state.product_cache[barcode]) {
            processProduct(state.product_cache[barcode]);
            return;
        }

        // Fetch from API
        fetch(`/api/proxy/product/${barcode}`)
            .then(response => {
                if (!response.ok) throw new Error('Product not found');
                return response.json();
            })
            .then(data => {
                if (data.status === "error" || !data.product) {
                    throw new Error('Product not in database');
                }
                state.product_cache[barcode] = data.product; // Cache it
                processProduct(data.product);
            })
            .catch(error => {
                showFeedback('Error', error.message);
            });
    };

    const processProduct = (product) => {
        const sugarSaved = gamification.calculateSugarSaving(product);
        const productName = product.product_name || 'Unknown Product';

        if (sugarSaved > 0) {
            const xpGained = sugarSaved; // 1g sugar saved = 1 XP
            state.gamification_state.lifetime_stats.total_sugar_saved_g += sugarSaved;
            
            gamification.addXp(xpGained);
            gamification.updateStreak();
            
            // Juicy feedback
            appContainer.classList.add('shake-animation');
            setTimeout(() => appContainer.classList.remove('shake-animation'), 500);
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            playSound('scan_success.mp3');
            showFeedback('CRITICAL HIT!', `You avoided ${sugarSaved.toFixed(1)}g of sugar! +${xpGained.toFixed(0)} XP`);

        } else {
            const sugarAmount = product.nutriments?.sugars_100g || 0;
            const sugarCubes = Math.floor(sugarAmount * ( (parseFloat(product.serving_size?.match(/(\d+)/)?.[0] || 330)) / 100) / 4);
            showFeedback('Hazard Detected', `${productName} contains ~${sugarCubes} sugar cubes. Try a sugar-free option!`);
        }
        
        state.scan_log.push({ barcode: product.code, timestamp: Date.now(), sugarSaved });
        db.save();
        updateUI();
    };

    // --- Event Listeners ---
    startBtn.addEventListener('click', () => {
        const nemesisDrink = document.getElementById('nemesis-drink-input').value;
        if (nemesisDrink) {
            state.user_profile.nemesis_drink = nemesisDrink;
            db.save();
        }
        showView('dashboard');
    });

    scanBtn.addEventListener('click', startScanner);
    cancelScanBtn.addEventListener('click', stopScanner);
    
    document.getElementById('manual-submit-btn').addEventListener('click', () => {
       const barcode = document.getElementById('manual-barcode-input').value;
       if(barcode) {
           stopScanner();
           handleBarcode(barcode);
       }
    });

    // --- Initialization ---
    const init = () => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker not registered', err));
        }

        db.load(); // Load state from storage
        
        // Decide initial view
        if (localStorage.getItem('sugarSwapState')) {
            showView('dashboard');
        } else {
            showView('onboarding');
        }
    };

    init();
});
