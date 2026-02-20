// This script is intended to be run in a browser environment via test_runner.html

(function() {
    const resultsContainer = document.getElementById('results');
    let testsRun = 0;
    let testsFailed = 0;

    // --- Test Runner Helper ---
    const test = (description, fn) => {
        resultsContainer.innerHTML += `<div class="suite"><h3>${description}</h3></div>`;
        testsRun++;
        try {
            fn();
        } catch (e) {
            testsFailed++;
            resultsContainer.innerHTML += `<p class="fail">Test failed: ${e.message}</p>`;
            resultsContainer.innerHTML += `<pre>${e.stack}</pre>`;
        }
    };

    const assertEquals = (expected, actual, message) => {
        if (JSON.stringify(expected) !== JSON.stringify(actual)) {
            throw new Error(`${message}: Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
        }
        resultsContainer.innerHTML += `<p class="pass">✔ ${message}</p>`;
    };

    // --- Logic copied from app.js for isolated testing ---
    const NEMESIS_SUGAR_PER_100ML = 10.6;
    let state; // Will be reset for each test suite

    const gamification = {
        xpForLevel: (level) => Math.pow(level, 2) * 100,
        addXp: (xp) => {
            state.gamification_state.current_xp += xp;
            const xpForNextLevel = gamification.xpForLevel(state.gamification_state.level + 1);
            if (state.gamification_state.current_xp >= xpForNextLevel) {
                state.gamification_state.level++;
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
            const sugarServing = product.nutriments?.sugars_serving || 0;
            return sugarServing;
        },
        updateStreak: () => {
            const today = new Date(state.now).toISOString().split('T')[0];
            const lastLog = state.gamification_state.streaks.last_log_date;
            
            if (lastLog !== today) {
                const yesterday = new Date(state.now - 86400000).toISOString().split('T')[0];
                if (lastLog === yesterday) {
                    state.gamification_state.streaks.current_streak_days++;
                } else if (lastLog !== null) { // Don't reset on first ever log
                    state.gamification_state.streaks.current_streak_days = Math.floor(state.gamification_state.streaks.current_streak_days * 0.8);
                }
                 state.gamification_state.streaks.last_log_date = today;
            }
        }
    };
    
    const getBaseState = () => ({
        now: Date.now(),
        gamification_state: {
            level: 1,
            current_xp: 0,
            streaks: { current_streak_days: 0, last_log_date: null }
        }
    });

    // --- Test Suites ---

    test("XP Calculations", () => {
        state = getBaseState();
        assertEquals(400, gamification.xpForLevel(2), "XP for level 2 should be 400");
        assertEquals(10000, gamification.xpForLevel(10), "XP for level 10 should be 10000");

        gamification.addXp(50);
        assertEquals(50, state.gamification_state.current_xp, "Should add 50 XP");
        assertEquals(1, state.gamification_state.level, "Should still be level 1");
        
        gamification.addXp(400); // Total 450 XP
        assertEquals(450, state.gamification_state.current_xp, "Should have 450 XP");
        assertEquals(2, state.gamification_state.level, "Should level up to level 2 (400XP needed)");
    });

    test("Sugar Saving Calculation", () => {
        const sugarFreeDrink = { nutriments: { sugars_100g: 0 }, serving_size: "330ml" };
        const sugaryDrink = { nutriments: { sugars_100g: 11 }, serving_size: "500ml" };
        
        const expectedSaving = 3.3 * 10.6;
        assertEquals(expectedSaving, gamification.calculateSugarSaving(sugarFreeDrink), "Should calculate correct saving for 330ml sugar-free drink");
        assertEquals(0, gamification.calculateSugarSaving(sugaryDrink), "Should calculate zero saving for a sugary drink");
    });
    
    test("Streak Logic", () => {
        state = getBaseState();
        
        // First log
        state.now = new Date("2026-02-18T10:00:00Z").getTime();
        gamification.updateStreak();
        assertEquals(0, state.gamification_state.streaks.current_streak_days, "Streak should be 0 on first log");
        assertEquals("2026-02-18", state.gamification_state.streaks.last_log_date, "Last log date should be set to today");

        // Log next day
        state.now = new Date("2026-02-19T10:00:00Z").getTime();
        gamification.updateStreak();
        assertEquals(1, state.gamification_state.streaks.current_streak_days, "Streak should increment to 1 on consecutive day");
        
        // Log again on the same day
        gamification.updateStreak();
        assertEquals(1, state.gamification_state.streaks.current_streak_days, "Streak should not increment on same day");

        // Skip a day (soft reset)
        state.gamification_state.streaks.current_streak_days = 10;
        state.now = new Date("2026-02-21T10:00:00Z").getTime(); // last log was 19th
        gamification.updateStreak();
        assertEquals(8, state.gamification_state.streaks.current_streak_days, "Streak should be reduced by 20% after a missed day");
    });

    test("Sugar Intake Calculation", () => {
        const productWithSugarServing = { nutriments: { sugars_serving: 25 } };
        const productWithoutSugarServing = { nutriments: {} };
        const productWithZeroSugarServing = { nutriments: { sugars_serving: 0 } };

        assertEquals(25, gamification.calculateSugarIntake(productWithSugarServing), "Should return sugars_serving when available");
        assertEquals(0, gamification.calculateSugarIntake(productWithoutSugarServing), "Should return 0 when sugars_serving is missing");
        assertEquals(0, gamification.calculateSugarIntake(productWithZeroSugarServing), "Should return 0 when sugars_serving is 0");
    });

    // --- Final Results ---
    resultsContainer.innerHTML += `<hr><h3>Total Tests: ${testsRun}, Failed: ${testsFailed}</h3>`;
    if (testsFailed === 0) {
        resultsContainer.innerHTML += '<h2 class="pass">All tests passed!</h2>';
    } else {
         resultsContainer.innerHTML += '<h2 class="fail">Some tests failed.</h2>';
    }

})();
