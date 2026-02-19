document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const views = {
        login: document.getElementById('login-view'),
        dashboard: document.getElementById('dashboard-view'),
        scanner: document.getElementById('scanner-view')
    };
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');
    
    // Buttons
    const logoutBtn = document.getElementById('logout-btn');
    const scanBtn = document.getElementById('scan-btn-fab');
    const addWaterBtn = document.getElementById('add-water-btn');
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    const feedbackOkBtn = document.getElementById('feedback-ok-btn');
    const feedbackConfirmBtn = document.getElementById('feedback-confirm-btn');
    const feedbackCancelBtn = document.getElementById('feedback-cancel-btn');


    // Inputs
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const registerUsernameInput = document.getElementById('register-username-input');
    const registerPasswordInput = document.getElementById('register-password-input');

    // Display
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const appContainer = document.getElementById('app-container');
    const welcomeMessage = document.getElementById('welcome-message');
    const errorMessageDiv = document.getElementById('error-message');
    const registerErrorMessageDiv = document.getElementById('register-error-message');

    // Stats
    const levelBadge = document.getElementById('level-badge');
    const sugarSavedStat = document.getElementById('sugar-saved-stat');
    const sugarCubesStat = document.getElementById('sugar-cubes-stat');
    const streakStat = document.getElementById('streak-stat');
    const fireEmoji = document.querySelector('.fire-emoji');
    const sugarConsumedStat = document.getElementById('sugar-consumed-stat');
    const sugarCubesConsumedStat = document.getElementById('sugar-cubes-consumed-stat');
    const dailySugarPercentStat = document.getElementById('daily-sugar-percent-stat');
    const xpStat = document.getElementById('xp-stat');
    const xpToNextLevelStat = document.getElementById('xp-to-next-level-stat');
    const xpBar = document.getElementById('xp-bar');
    const xpText = document.getElementById('xp-text');

    // --- App State ---
    let state = {};
    let html5QrCode;
    const NEMESIS_SUGAR_PER_100ML = 10.6;
    const DAILY_RECOMMENDED_SUGAR_G = 75; // 75 grams as per user's recommendation
    let saveDataTimeout;
    let feedbackQueue = [];
    let isFeedbackShowing = false;
    let confirmationCallback = null;


    // --- API Communication ---
    const api = {
        checkSession: () => fetch('/api/session/check').then(res => res.json()),
        login: (username, password) => fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password })
        }).then(res => res.json()),
        register: (username, password) => fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, password })
        }).then(res => res.json()),
        logout: () => fetch('/api/auth/logout', { method: 'POST' }),
        getData: () => fetch('/api/user/data').then(res => res.json()),
        saveData: (data) => fetch('/api/user/data', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
    };
    
    // Debounced save function
    const debouncedSave = () => {
        clearTimeout(saveDataTimeout);
        saveDataTimeout = setTimeout(() => {
            const dataToSave = {
                gamification_state: state.gamification_state,
                product_cache: state.product_cache
            };
            api.saveData(dataToSave).catch(err => console.error("Failed to save data:", err));
        }, 2000);
    };

    // --- View Management ---
    const showView = (viewName) => {
        Object.values(views).forEach(view => view.classList.remove('active'));
        views[viewName].classList.add('active');
    };

    // --- Main App Logic ---
    const loadDashboard = (username) => {
        welcomeMessage.textContent = `Welcome, ${username}!`;
        api.getData().then(data => {
            state.gamification_state = data.gamification_state;
            state.product_cache = data.product_cache || {};
            // Ensure new stats field exists for older users
            if (!state.gamification_state.lifetime_stats.total_sugar_consumed_g) {
                state.gamification_state.lifetime_stats.total_sugar_consumed_g = 0;
            }
            if (!state.gamification_state.lifetime_stats.daily_sugar_consumed_g) {
                state.gamification_state.lifetime_stats.daily_sugar_consumed_g = 0;
            }
            if (!state.gamification_state.lifetime_stats.last_consumed_date) {
                state.gamification_state.lifetime_stats.last_consumed_date = new Date().toISOString().split('T')[0];
            }
            updateUI();
            showView('dashboard');
        }).catch(err => {
            console.error("Could not load user data:", err);
            showLoginView("Could not load user data.");
        });
    };

    const showLoginView = (errorMessage = '') => {
        errorMessageDiv.textContent = errorMessage;
        registerErrorMessageDiv.textContent = '';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        showView('login');
    };


    // --- Gamification & UI ---
    const gamification = {
        xpForLevel: (level) => 3000,
        addXp: (xp) => {
            state.gamification_state.current_xp += xp;
            const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
            if (state.gamification_state.current_xp >= xpForNextLevel) {
                state.gamification_state.level++;
                state.gamification_state.current_xp -= xpForNextLevel;
                playSound('jackpot_win.mp3'); 
                feedbackQueue.push({ title: 'LEVEL UP!', text: `You are now Level ${state.gamification_state.level}!`, type: 'ok' });
            }
        },
        calculateSugarSaving: (product) => {
             const servingSizeMl = parseFloat(product.serving_size?.match(/(\\d+)/)?.[0] || 330);
            const sugarPer100g = product.nutriments?.sugars_100g || 0;
            if (sugarPer100g < 0.5) {
                return (servingSizeMl / 100) * NEMESIS_SUGAR_PER_100ML;
            }
            return 0;
        },
        calculateSugarIntake: (product) => {
            const servingSizeMl = parseFloat(product.serving_size?.match(/(\\d+)/)?.[0] || 330);
            const sugarPer100g = product.nutriments?.sugars_100g || 0;
            return (servingSizeMl / 100) * sugarPer100g;
        },
        updateStreak: () => {
            const today = new Date().toISOString().split('T')[0];
            const lastLog = state.gamification_state.streaks.last_log_date;
            
            if (lastLog !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (lastLog === yesterday) {
                    state.gamification_state.streaks.current_streak_days++;
                } else if (lastLog === null) {
                    state.gamification_state.streaks.current_streak_days = 1;
                } else {
                    state.gamification_state.streaks.current_streak_days = 0;
                }
                state.gamification_state.streaks.last_log_date = today;
            }
        }
    };
    
    const updateUI = () => {
        if (!state.gamification_state) return;
        levelBadge.textContent = state.gamification_state.level;
        sugarSavedStat.textContent = state.gamification_state.lifetime_stats.total_sugar_saved_g.toFixed(1);
        sugarCubesStat.textContent = Math.floor(state.gamification_state.lifetime_stats.total_sugar_saved_g / 3);
        streakStat.textContent = state.gamification_state.streaks.current_streak_days;
        sugarConsumedStat.textContent = state.gamification_state.lifetime_stats.total_sugar_consumed_g.toFixed(1);
        sugarCubesConsumedStat.textContent = Math.floor(state.gamification_state.lifetime_stats.total_sugar_consumed_g / 3);
        
        // Calculate and display daily percentage
        const dailyPercentage = (state.gamification_state.lifetime_stats.daily_sugar_consumed_g / DAILY_RECOMMENDED_SUGAR_G) * 100;
        dailySugarPercentStat.textContent = dailyPercentage.toFixed(0);

        if (state.gamification_state.streaks.current_streak_days >= 2) {
            fireEmoji.style.display = 'inline';
        } else {
            fireEmoji.style.display = 'none';
        }
        
        const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
        xpText.innerHTML = `<span id="xp-stat">${state.gamification_state.current_xp.toFixed(0)}</span> / <span id="xp-to-next-level-stat">${xpForNextLevel}</span> Level XP`;
        xpBar.style.width = `${(state.gamification_state.current_xp / xpForNextLevel) * 100}%`;
    };

    // --- Feedback Queue Management ---
    const showFeedback = (title, text, type = 'ok', onConfirm = null) => {
        feedbackQueue.push({ title, text, type, onConfirm });
        processFeedbackQueue();
    };

    const processFeedbackQueue = () => {
        if (feedbackQueue.length > 0 && !isFeedbackShowing) {
            isFeedbackShowing = true;
            const feedback = feedbackQueue.shift();
            
            feedbackOverlay.querySelector('#feedback-title').textContent = feedback.title;
            feedbackOverlay.querySelector('#feedback-text').textContent = feedback.text;

            feedbackOkBtn.style.display = 'none';
            feedbackConfirmBtn.style.display = 'none';
            feedbackCancelBtn.style.display = 'none';

            if (feedback.type === 'ok') {
                feedbackOkBtn.style.display = 'block';
                confirmationCallback = null;
            } else if (feedback.type === 'confirm') {
                feedbackConfirmBtn.style.display = 'inline-block';
                feedbackCancelBtn.style.display = 'inline-block';
                confirmationCallback = feedback.onConfirm;
            }

            feedbackOverlay.classList.add('show');
        }
    };

    const hideFeedback = () => {
        feedbackOverlay.classList.remove('show');
        isFeedbackShowing = false;
        confirmationCallback = null; // Clear callback
        setTimeout(processFeedbackQueue, 500); // Check for next after transition
    };

    const playSound = (soundFile) => {
        new Audio(`/static/audio/${soundFile}`).play().catch(e => console.error(`Audio play failed for ${soundFile}:`, e));
    };

    const logWater = () => {
        const sugarSaved = (330 / 100) * NEMESIS_SUGAR_PER_100ML; // Equivalent to 33cl sugar-free drink
        const xpGained = sugarSaved;

        state.gamification_state.lifetime_stats.total_sugar_saved_g += sugarSaved;
        gamification.addXp(xpGained);
        gamification.updateStreak();
        
        showFeedback('Healthy Choice!', `You logged 33cl of water. +${xpGained.toFixed(0)} XP`, 'ok');
        playSound('scan_success.mp3');
        
        updateUI();
        debouncedSave();
    };

    // --- Scanner Logic ---
    const startScanner = () => {
        showView('scanner');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support camera access. Please use manual entry.");
            return;
        }
        html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 150 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, (errorMessage) => {})
            .catch((err) => {
                alert(`Error starting camera: ${err}. Please grant camera permissions.`);
                stopScanner();
            });
    };

    const stopScanner = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => showView('dashboard')).catch(err => showView('dashboard'));
        } else {
            showView('dashboard');
        }
    };
    
    const onScanSuccess = (decodedText, decodedResult) => {
        stopScanner();
        handleBarcode(decodedText);
    };
    
    const handleBarcode = (barcode) => {
        if (!/^\d+$/.test(barcode)) {
            showFeedback('Invalid Barcode', 'Please scan or enter a valid numerical barcode.');
            return;
        }
        
        const process = (product) => {
            // This is now called after confirmation
            processProduct(product);
        };
        
        const showConfirmation = (product) => {
            const sugarIntake = gamification.calculateSugarIntake(product);
            const title = 'Confirm Scan';
            const text = `Add '${product.product_name || 'this product'}'? It contains ~${sugarIntake.toFixed(1)}g of sugar.`;
            showFeedback(title, text, 'confirm', () => process(product));
        };

        if (state.product_cache && state.product_cache[barcode]) {
            showConfirmation(state.product_cache[barcode]);
            return;
        }
        fetch(`/api/proxy/product/${barcode}`)
            .then(res => res.ok ? res.json() : Promise.reject('Product not found in database.'))
            .then(data => {
                if (data.status === "error" || !data.product) return Promise.reject('Product data is invalid.');
                if (!state.product_cache) state.product_cache = {};
                state.product_cache[barcode] = data.product;
                showConfirmation(data.product);
            })
            .catch(error => showFeedback('Error', error.toString(), 'ok'));
    };

    const processProduct = (product) => {
        const sugarSaved = gamification.calculateSugarSaving(product);
        const sugarIntake = gamification.calculateSugarIntake(product);
        
        if (sugarSaved > 0) { // Sugar-free choice
            const xpGained = sugarSaved;
            state.gamification_state.lifetime_stats.total_sugar_saved_g += sugarSaved;
            gamification.addXp(xpGained);
            showFeedback('CRITICAL HIT!', `You avoided ${sugarSaved.toFixed(1)}g of sugar! +${xpGained.toFixed(0)} XP`, 'ok');
            playSound('scan_success.mp3');
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        } else { // Sugary choice
             if (!state.gamification_state.lifetime_stats.total_sugar_consumed_g) {
                state.gamification_state.lifetime_stats.total_sugar_consumed_g = 0;
            }
            if (!state.gamification_state.lifetime_stats.daily_sugar_consumed_g) {
                state.gamification_state.lifetime_stats.daily_sugar_consumed_g = 0;
            }
            state.gamification_state.lifetime_stats.total_sugar_consumed_g += sugarIntake;
            state.gamification_state.lifetime_stats.daily_sugar_consumed_g += sugarIntake;
            showFeedback('Hazard Detected', `You consumed ~${sugarIntake.toFixed(1)}g of sugar.`, 'ok');
        }
        
        gamification.updateStreak();
        updateUI();
        debouncedSave();
    };


    // --- Event Listeners ---
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        api.login(username, password).then(data => {
            if (data.status === 'success') {
                loadDashboard(data.username);
            } else {
                showLoginView(data.message || 'Login failed.');
            }
        });
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value;
        const password = registerPasswordInput.value;
        api.register(username, password)
            .then(data => {
                if (data.status === 'success') {
                    showLoginView();
                    alert('Registration successful! Please log in.');
                } else {
                    registerErrorMessageDiv.textContent = data.message || 'Registration failed.';
                }
            })
            .catch(err => {
                registerErrorMessageDiv.textContent = 'An unexpected error occurred.';
            });
    });

    logoutBtn.addEventListener('click', () => {
        api.logout().then(() => {
            state = {};
            usernameInput.value = '';
            passwordInput.value = '';
            showLoginView();
        });
    });

    scanBtn.addEventListener('click', startScanner);
    addWaterBtn.addEventListener('click', logWater);
    cancelScanBtn.addEventListener('click', stopScanner);
    document.getElementById('manual-submit-btn').addEventListener('click', () => {
       const barcode = document.getElementById('manual-barcode-input').value;
       if(barcode) {
           stopScanner();
           handleBarcode(barcode);
       }
    });

    feedbackOkBtn.addEventListener('click', hideFeedback);
    feedbackCancelBtn.addEventListener('click', hideFeedback);
    feedbackConfirmBtn.addEventListener('click', () => {
        if (typeof confirmationCallback === 'function') {
            confirmationCallback();
        }
        hideFeedback();
    });

    // --- Initialization ---
    const init = () => {
        api.checkSession().then(data => {
            if (data.logged_in) {
                loadDashboard(data.username);
            } else {
                showLoginView();
            }
        });
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker not registered', err));
        }
    };

    init();
});
