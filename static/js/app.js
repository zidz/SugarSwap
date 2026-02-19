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
    const cancelScanBtn = document = document.getElementById('cancel-scan-btn'); // Typo here
    const feedbackOkBtn = document.getElementById('feedback-ok-btn'); // New OK button

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
    const xpStat = document.getElementById('xp-stat');
    const xpToNextLevelStat = document.getElementById('xp-to-next-level-stat');
    const xpBar = document.getElementById('xp-bar');

    // --- App State ---
    let state = {};
    let html5QrCode;
    const NEMESIS_SUGAR_PER_100ML = 10.6;
    let saveDataTimeout;
    let feedbackQueue = []; // New feedback queue
    let isFeedbackShowing = false;


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
        xpForLevel: (level) => 3000, // All levels require 3000 XP now
        addXp: (xp) => {
            state.gamification_state.current_xp += xp;
            const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
            if (state.gamification_state.current_xp >= xpForNextLevel) {
                state.gamification_state.level++;
                state.gamification_state.current_xp -= xpForNextLevel; // Reset current XP for next level
                playSound('jackpot_win.mp3'); 
                // Add level up message to queue instead of direct display
                feedbackQueue.push({ title: 'LEVEL UP!', text: `You are now Level ${state.gamification_state.level}!` });
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
        updateStreak: () => {
            const today = new Date().toISOString().split('T')[0];
            const lastLog = state.gamification_state.streaks.last_log_date;
            
            if (lastLog !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (lastLog === yesterday) {
                    state.gamification_state.streaks.current_streak_days++;
                } else if (lastLog !== null) {
                    state.gamification_state.streaks.current_streak_days = Math.floor(state.gamification_state.streaks.current_streak_days * 0.8);
                }
                state.gamification_state.streaks.last_log_date = today;
            }
        }
    };
    
    const updateUI = () => {
        if (!state.gamification_state) return;
        levelBadge.textContent = state.gamification_state.level;
        sugarSavedStat.textContent = state.gamification_state.lifetime_stats.total_sugar_saved_g.toFixed(1);
        sugarCubesStat.textContent = Math.floor(state.gamification_state.lifetime_stats.total_sugar_saved_g / 4);
        streakStat.textContent = state.gamification_state.streaks.current_streak_days;
        const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
        xpStat.textContent = state.gamification_state.current_xp.toFixed(0);
        xpToNextLevelStat.textContent = xpForNextLevel;
        xpBar.style.width = `${(state.gamification_state.current_xp / xpForNextLevel) * 100}%`;
    };

    // --- Feedback Queue Management ---
    const showFeedback = (title, text) => {
        feedbackQueue.push({ title, text });
        processFeedbackQueue();
    };

    const processFeedbackQueue = () => {
        if (feedbackQueue.length > 0 && !isFeedbackShowing) {
            isFeedbackShowing = true;
            const feedback = feedbackQueue.shift(); // Get next message
            feedbackOverlay.querySelector('#feedback-title').textContent = feedback.title;
            feedbackOverlay.querySelector('#feedback-text').textContent = feedback.text;
            feedbackOverlay.classList.add('show');
        } else if (feedbackQueue.length === 0 && isFeedbackShowing) {
            // No more messages, hide overlay (if it's still showing)
            // This case should be handled by the OK button clicking and processing the queue.
            // If the queue is empty, isFeedbackShowing becomes false when OK is clicked.
            // And the next call to processFeedbackQueue will do nothing here.
            // So, no explicit hide needed here.
        }
    };


    const playSound = (soundFile) => {
        new Audio(`/static/audio/${soundFile}`).play().catch(e => console.error(`Audio play failed for ${soundFile}:`, e));
    };

    // --- Scanner Logic (unchanged) ---
    const startScanner = () => {
        showView('scanner');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support camera access. Please use manual entry.");
            return;
        }
        html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 150 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, (errorMessage) => console.log(`QR Scan Error: ${errorMessage}`))
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
        if (state.product_cache && state.product_cache[barcode]) {
            processProduct(state.product_cache[barcode]);
            return;
        }
        fetch(`/api/proxy/product/${barcode}`)
            .then(res => res.ok ? res.json() : Promise.reject('Product not found in database.'))
            .then(data => {
                if (data.status === "error" || !data.product) return Promise.reject('Product data is invalid.');
                if (!state.product_cache) state.product_cache = {};
                state.product_cache[barcode] = data.product;
                processProduct(data.product);
            })
            .catch(error => showFeedback('Error', error.toString()));
    };

    const processProduct = (product) => {
        const sugarSaved = gamification.calculateSugarSaving(product);
        if (sugarSaved > 0) {
            const xpGained = sugarSaved;
            state.gamification_state.lifetime_stats.total_sugar_saved_g += sugarSaved;
            gamification.addXp(xpGained); // addXp now queues level up message
            gamification.updateStreak();
            appContainer.classList.add('shake-animation');
            setTimeout(() => appContainer.classList.remove('shake-animation'), 500);
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
            playSound('scan_success.mp3');
            // Add critical hit message to queue
            feedbackQueue.push({ title: 'CRITICAL HIT!', text: `You avoided ${sugarSaved.toFixed(1)}g of sugar! +${xpGained.toFixed(0)} XP` });
            processFeedbackQueue(); // Attempt to show next from queue
        } else {
            const servingSize = parseFloat(product.serving_size?.match(/(\\d+)/)?.[0] || 330);
            const sugarAmount = product.nutriments?.sugars_100g || 0;
            const sugarCubes = Math.floor(sugarAmount * (servingSize / 100) / 4);
            showFeedback('Hazard Detected', `${product.product_name || 'Product'} contains ~${sugarCubes} sugar cubes.`);
        }
        updateUI();
        debouncedSave(); // Save data after processing
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
        if (!username || !password) {
            showLoginView('Username and password are required.');
            return;
        }
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

        if (!username || !password) {
            registerErrorMessageDiv.textContent = 'Username and password are required.';
            return;
        }

        registerErrorMessageDiv.textContent = ''; // Clear previous errors

        api.register(username, password)
            .then(data => {
                if (data.status === 'success') {
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    showLoginView();
                    alert('Registration successful! Please log in.');
                } else {
                    registerErrorMessageDiv.textContent = data.message || 'Registration failed.';
                }
            })
            .catch(err => {
                console.error("Registration API call failed:", err); // DEBUG
                registerErrorMessageDiv.textContent = 'An unexpected error occurred. Please try again.';
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
    cancelScanBtn.addEventListener('click', stopScanner);
    document.getElementById('manual-submit-btn').addEventListener('click', () => {
       const barcode = document.getElementById('manual-barcode-input').value;
       if(barcode) {
           stopScanner();
           handleBarcode(barcode);
       }
    });

    feedbackOkBtn.addEventListener('click', () => { // Event listener for new OK button
        feedbackOverlay.classList.remove('show');
        isFeedbackShowing = false;
        // Wait for the transition out to complete before processing the next message
        // This ensures the current overlay transitions out before the next one potentially transitions in
        setTimeout(() => {
            processFeedbackQueue();
        }, 500); // 500ms matches the CSS transition duration
    });

    // --- Initialization ---
    const init = () => {
        // Check session on load
        api.checkSession().then(data => {
            if (data.logged_in) {
                loadDashboard(data.username);
            } else {
                showLoginView();
            }
        });
        
        // Re-enabled Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker not registered', err));
        }
    };

    init();
});
