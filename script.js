// Import celebrity data
// Note: This will be loaded via script tag in HTML

// Toast notification system
// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 16px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Add CSS animations for toast
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// DOM Elements
const celebrityDisplay = document.getElementById('celebrityDisplay');
const leaderboardList = document.getElementById('leaderboardList');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const resultModal = document.getElementById('resultModal');
const modalBody = document.getElementById('modalBody');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

const categoryBtns = document.querySelectorAll('.category-btn');
const themeSelect = document.getElementById('themeSelect');
const leaderboardSidebar = document.getElementById('leaderboardSidebar');
const leaderboardDragHandle = document.getElementById('leaderboardDragHandle');
const leaderboardResizeHandle = document.getElementById('leaderboardResizeHandle');
const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');




// ===== SOUND MANAGER (Web Audio API) =====
class SoundManager {
    constructor() {
        this.context = null;
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    }

    init() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Play a sound based on type
    play(type) {
        if (!this.enabled) return;
        if (!this.context) this.init();
        if (this.context.state === 'suspended') this.context.resume();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        const now = this.context.currentTime;

        if (type === 'vote') {
            // Plop sound (Sine wave, quick pitch drop)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'unlock') {
            // Success/Badge sound (Major chord arpeggio)
            this.playTone(523.25, now, 0.1, 'triangle'); // C5
            this.playTone(659.25, now + 0.1, 0.1, 'triangle'); // E5
            this.playTone(783.99, now + 0.2, 0.2, 'triangle'); // G5
            this.playTone(1046.50, now + 0.3, 0.4, 'triangle'); // C6
        } else if (type === 'click') {
            // Delicate click
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }

    playTone(freq, time, duration, type = 'sine') {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.start(time);
        osc.stop(time + duration);
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled);
        return this.enabled;
    }
}

const soundManager = new SoundManager();

// Get filtered celebrities based on category
function getFilteredCelebrities() {
    if (currentCategory === 'all') {
        return celebrities;
    }
    return celebrities.filter(c => c.gender === currentCategory);
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('celebrityRatings');
    const savedVotes = localStorage.getItem('userVotes');
    const savedCategory = localStorage.getItem('currentCategory');

    if (savedData) {
        const parsed = JSON.parse(savedData);
        parsed.forEach(saved => {
            const celeb = celebrities.find(c => c.id === saved.id);
            if (celeb) {
                celeb.ratings = saved.ratings || [];
            }
        });
    }

    if (savedVotes) {
        userVotes = JSON.parse(savedVotes);
    }

    if (savedCategory) {
        currentCategory = savedCategory;
        updateCategoryButtons();
    }

    // Load last viewed ID
    const lastViewedId = localStorage.getItem('lastViewedId');
    if (lastViewedId) {
        // IMPORTANT: We must find the index within the FILTERED list, not the global list
        const filtered = getFilteredCelebrities();
        const foundIndex = filtered.findIndex(c => c.id === parseInt(lastViewedId));

        if (foundIndex !== -1) {
            currentIndex = foundIndex;
        } else {
            // If not found in current filter, reset to 0 or stay at 0
            currentIndex = 0;
        }
    }

    // CLEANUP: Remove duplicates (Name-based) and Merge Data
    const uniqueCelebs = [];
    const seenNames = new Map();
    let duplicatesRemoved = false;

    celebrities.forEach(c => {
        const normName = c.name.trim().toLowerCase();

        if (!seenNames.has(normName)) {
            seenNames.set(normName, c);
            uniqueCelebs.push(c);
        } else {
            duplicatesRemoved = true;
            const kept = seenNames.get(normName);

            // 1. Merge ratings
            if (c.ratings && c.ratings.length > 0) {
                // Add ratings from the duplicate to the kept one
                kept.ratings = [...(kept.ratings || []), ...c.ratings];
            }

            // 2. Merge User Votes
            // If the user voted for the duplicate ID, move that vote to the kept ID
            if (userVotes.hasOwnProperty(c.id)) {
                const voteValue = userVotes[c.id];

                // Only transfer if we don't already have a vote for the kept ID
                if (!userVotes.hasOwnProperty(kept.id)) {
                    userVotes[kept.id] = voteValue;
                }

                // Remove the vote record for the deleted ID
                delete userVotes[c.id];
            }

            // 3. Merge Photos (if kept has none but duplicate does)
            if (c.photos && c.photos.length > 0 && (!kept.photos || kept.photos.length === 0)) {
                kept.photos = c.photos;
            }
        }
    });

    if (duplicatesRemoved) {
        console.log(`🧹 Temizlik: ${celebrities.length - uniqueCelebs.length} kopya ünlü birleştirildi ve temizlendi.`);
        celebrities = uniqueCelebs;
        saveData(); // Save clean version
    }
}

// Save data to localStorage
function saveData() {
    const dataToSave = celebrities.map(c => ({
        id: c.id,
        name: c.name,
        gender: c.gender,
        photos: c.photos,
        ratings: c.ratings
    }));

    localStorage.setItem('celebrityRatings', JSON.stringify(dataToSave));
    localStorage.setItem('userVotes', JSON.stringify(userVotes));
    localStorage.setItem('currentCategory', currentCategory);

    // Save current position
    if (celebrities[currentIndex]) {
        localStorage.setItem('lastViewedId', celebrities[currentIndex].id);
    }
}

// Initialize history after loading data
function initHistory() {
    navigationHistory.length = 0; // Clear
    navigationHistory.push(currentIndex);
    historyPointer = 0;
    updateNavigation();
}



// Get average rating
function getAverageRating(celebrity) {
    if (celebrity.ratings.length === 0) return 0;
    const sum = celebrity.ratings.reduce((a, b) => a + b, 0);
    return (sum / celebrity.ratings.length).toFixed(1);
}

// Get sorted celebrities
function getSortedCelebrities() {
    const filtered = getFilteredCelebrities();
    return filtered
        .filter(c => c.ratings.length > 0)
        .sort((a, b) => {
            const avgA = parseFloat(getAverageRating(a));
            const avgB = parseFloat(getAverageRating(b));
            return avgB - avgA;
        });
}

// Rate celebrity
async function rateCelebrity(celebrityId, rating, cardElement) {
    const celebrity = celebrities.find(c => c.id === celebrityId);

    if (!celebrity) return;

    // Check if user already voted
    if (userVotes.hasOwnProperty(celebrityId)) {
        showToast('Bu oyuncuya zaten oy verdiniz!', 'warning');
        return;
    }

    // Add rating locally
    celebrity.ratings.push(rating);
    userVotes[celebrityId] = rating;

    // Try to save to Supabase (optional - don't block if it fails)
    let supabaseSaved = false;
    try {
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            console.log('Supabase\'e kayıt gönderiliyor...');

            const { data, error } = await supabaseClient
                .from('ratings')
                .insert([
                    {
                        celebrity_id: celebrityId,
                        score: rating,
                        user_session: celebrityService.userSession
                    }
                ]);

            if (error) {
                console.warn('⚠️ Supabase kayıt hatası (localStorage kullanılıyor):', error.message);
            } else {
                console.log('✅ Oy Supabase\'e kaydedildi');
                supabaseSaved = true;
            }
        }
    } catch (err) {
        console.warn('⚠️ Supabase bağlantı hatası (localStorage kullanılıyor):', err.message);
    }

    // Save data to localStorage (always)
    saveData();

    // Show success message
    if (supabaseSaved) {
        showToast('Oyunuz başarıyla kaydedildi! 🎉', 'success', 1000);
    } else {
        showToast('Oyunuz cihazınıza kaydedildi 👍', 'info', 1000);
    }

    // Update carousel to show stats after voting
    if (cardElement) {
        const carousel = cardElement.querySelector('.photo-carousel');
        if (carousel) {
            // Calculate rank
            const sorted = getSortedCelebrities();
            const rank = sorted.findIndex(c => c.id === celebrity.id) + 1;

            // Fade out carousel
            carousel.style.opacity = '0';
            carousel.style.transition = 'opacity 0.3s ease';

            setTimeout(() => {
                carousel.innerHTML = `
                    <div class="voted-stats-display">
                        <div class="voted-stats-grid">
                            <div class="voted-stat-box">
                                <div class="voted-stat-label">Toplam Oy</div>
                                <div class="voted-stat-value">${celebrity.ratings.length} 👥</div>
                            </div>
                            <div class="voted-stat-box">
                                <div class="voted-stat-label">Ortalama Puan</div>
                                <div class="voted-stat-value">${getAverageRating(celebrity)} ⭐</div>
                            </div>
                            <div class="voted-stat-box">
                                <div class="voted-stat-label">Sıralama</div>
                                <div class="voted-stat-value">${rank}.</div>
                            </div>
                        </div>
                    </div>
                `;

                // Fade in stats
                carousel.style.opacity = '1';
            }, 300);
        }
    }

    // Update displays
    renderLeaderboard();
    updateNavigation();

    // Save current position for persistence
    localStorage.setItem('lastViewedId', celebrity.id);

    // Play sound
    soundManager.play('vote');

    // Check for badges
    checkBadges();
}


// Show result modal
function showResultModal(celebrity, userRating) {
    const avgRating = getAverageRating(celebrity);
    const totalVotes = celebrity.ratings.length;

    modalBody.innerHTML = `
        <div class="modal-stat">
            <div class="modal-stat-label">Sizin Puanınız</div>
            <div class="modal-stat-value">${userRating} ⭐</div>
        </div>
        <div class="modal-stat">
            <div class="modal-stat-label">Ortalama Puan</div>
            <div class="modal-stat-value">${avgRating} ⭐</div>
        </div>
        <div class="modal-stat">
            <div class="modal-stat-label">Toplam Oy</div>
            <div class="modal-stat-value">${totalVotes}</div>
        </div>
    `;

    resultModal.classList.add('active');
}

// Close modal
modalCloseBtn.addEventListener('click', () => {
    resultModal.classList.remove('active');
});

// Click outside modal to close
resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
        resultModal.classList.remove('active');
    }
});

// Render celebrity
function renderCelebrity() {
    const filtered = getFilteredCelebrities();

    if (filtered.length === 0) {
        // If empty, try adding some immediately
        addRandomCelebrities(5);
        setTimeout(renderCelebrity, 500);
        return;
    }

    // Ensure currentIndex is valid
    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= filtered.length) currentIndex = filtered.length - 1;

    const celebrity = filtered[currentIndex];

    if (!celebrity) return;

    celebrityDisplay.innerHTML = '';
    const card = createCelebrityCard(celebrity);
    celebrityDisplay.appendChild(card);

    updateNavigation();

    // SEO & Routing Updates
    if (typeof updateSEO === 'function') updateSEO(celebrity);
    if (typeof updateURL === 'function') updateURL(celebrity);
}

// Create celebrity card
function createCelebrityCard(celebrity) {
    const hasVoted = userVotes.hasOwnProperty(celebrity.id);
    const userRating = userVotes[celebrity.id];

    const card = document.createElement('div');
    card.className = 'celebrity-card';

    // Card content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    // Photo carousel or voted stats
    const carousel = document.createElement('div');
    carousel.className = 'photo-carousel';

    if (hasVoted) {
        // Show stats instead of photos
        const sorted = getSortedCelebrities();
        const rank = sorted.findIndex(c => c.id === celebrity.id) + 1;

        carousel.innerHTML = `
            <div class="voted-stats-display">
                <div class="voted-stats-grid">
                    <div class="voted-stat-box">
                        <div class="voted-stat-label">Toplam Oy</div>
                        <div class="voted-stat-value">${celebrity.ratings.length} 👥</div>
                    </div>
                    <div class="voted-stat-box">
                        <div class="voted-stat-label">Ortalama Puan</div>
                        <div class="voted-stat-value">${getAverageRating(celebrity)} ⭐</div>
                    </div>
                    <div class="voted-stat-box">
                        <div class="voted-stat-label">Sıralama</div>
                        <div class="voted-stat-value">${rank}.</div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // SAFETY CHECK: If photos are missing, trigger load and show placeholder
        if (!celebrity.photos || celebrity.photos.length === 0) {
            carousel.innerHTML = `
                <div style="display:flex; justify-content:center; align-items:center; height:100%; color:white; flex-direction:column; gap:10px;">
                    <div class="loading-spinner"></div>
                    <p>Fotoğraf yükleniyor...</p>
                </div>
            `;
            // Trigger emergency load
            if (!celebrity.loading) {
                celebrity.loading = true;
                tmdbService.getPersonPhotos(celebrity.name, 4).then(photos => {
                    celebrity.photos = photos;
                    celebrity.loading = false;
                    renderCelebrity(); // Re-render when done
                });
            }
        } else {
            // Show photo carousel
            const track = document.createElement('div');
            track.className = 'carousel-track';

            celebrity.photos.forEach(photo => {
                const photoElement = document.createElement('img');
                photoElement.className = 'carousel-photo';
                photoElement.src = photo;
                photoElement.alt = celebrity.name;
                photoElement.loading = 'lazy';
                track.appendChild(photoElement);
            });
            carousel.appendChild(track);
        }


        const controls = document.createElement('div');
        controls.className = 'carousel-controls';

        const prevCarouselBtn = document.createElement('button');
        prevCarouselBtn.className = 'carousel-btn';
        prevCarouselBtn.innerHTML = '‹';
        prevCarouselBtn.addEventListener('click', () => scrollCarousel(track, -1));

        const nextCarouselBtn = document.createElement('button');
        nextCarouselBtn.className = 'carousel-btn';
        nextCarouselBtn.innerHTML = '›';
        nextCarouselBtn.addEventListener('click', () => scrollCarousel(track, 1));

        controls.appendChild(prevCarouselBtn);
        controls.appendChild(nextCarouselBtn);

        // Indicators (Dots)
        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';

        const dots = [];

        celebrity.photos.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            dot.title = `Fotoğraf ${index + 1}`;


            dot.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card flip or other clicks
                const photoWidth = track.querySelector('.carousel-photo').offsetWidth;
                track.scrollTo({
                    left: index * photoWidth,
                    behavior: 'smooth'
                });
            });

            indicators.appendChild(dot);
            dots.push(dot);
        });

        // Update indicators on scroll
        track.addEventListener('scroll', () => {
            const photoWidth = track.querySelector('.carousel-photo').offsetWidth;
            const index = Math.round(track.scrollLeft / photoWidth);

            dots.forEach((dot, i) => {
                if (i === index) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        });

        // Navigation Arrows
        const prevArrow = document.createElement('button');
        prevArrow.className = 'carousel-arrow carousel-arrow-prev';
        prevArrow.innerHTML = '&#10094;'; // Left arrow entity
        prevArrow.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card flip if needed
            scrollCarousel(track, -1);
        });

        const nextArrow = document.createElement('button');
        nextArrow.className = 'carousel-arrow carousel-arrow-next';
        nextArrow.innerHTML = '&#10095;'; // Right arrow entity
        nextArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            scrollCarousel(track, 1);
        });

        carousel.appendChild(track);
        carousel.appendChild(controls); // Puan badge vs
        carousel.appendChild(indicators);
        carousel.appendChild(prevArrow);
        carousel.appendChild(nextArrow);
    }

    // Celebrity info
    const info = document.createElement('div');
    info.className = 'celebrity-info';

    const name = document.createElement('h2');
    name.className = 'celebrity-name';
    name.textContent = celebrity.name;

    const genderIcon = celebrity.gender === 'male' ? '👨' : '👩';
    const genderBadge = document.createElement('span');
    genderBadge.className = 'gender-badge';
    genderBadge.textContent = genderIcon;
    name.appendChild(genderBadge);

    info.appendChild(name);

    cardContent.appendChild(carousel);
    cardContent.appendChild(info);

    // Rating section (only show if not voted yet)
    if (!hasVoted) {
        const ratingSection = document.createElement('div');
        ratingSection.className = 'rating-section';

        // Star Rating Setup
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars';
        let currentRating = 0;

        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(starValue => {
            const star = document.createElement('span');
            star.className = 'star';
            star.innerHTML = '★';
            star.dataset.value = starValue;

            // Hover effects
            star.addEventListener('mouseenter', () => {
                highlightStars(starsContainer, starValue, false); // Use existing highlightStars
            });

            star.addEventListener('mouseleave', () => {
                highlightStars(starsContainer, currentRating, true); // Use existing highlightStars
            });

            // Click to select
            star.addEventListener('click', () => {
                currentRating = starValue;
                highlightStars(starsContainer, currentRating, true); // Make selection permanent
                checkVoteButtonState();
            });

            starsContainer.appendChild(star);
        });

        ratingSection.appendChild(starsContainer);

        // Turnstile Captcha Container
        const captchaContainer = document.createElement('div');
        captchaContainer.className = 'captcha-container';
        captchaContainer.style.margin = '10px 0';
        captchaContainer.style.display = 'flex';
        captchaContainer.style.justifyContent = 'center';
        captchaContainer.id = `captcha-${celebrity.id}`; // Unique ID

        ratingSection.appendChild(captchaContainer);

        // Render Captcha explicitly
        setTimeout(() => {
            if (window.turnstile) {
                try {
                    window.turnstile.render(`#captcha-${celebrity.id}`, {
                        sitekey: '1x00000000000000000000AA', // Dummy key for testing
                        callback: function (token) {
                            onCaptchaSuccess(token);
                            checkVoteButtonState();
                        },
                        'expired-callback': function () {
                            onCaptchaExpired();
                            checkVoteButtonState();
                        },
                        theme: 'dark'
                    });
                } catch (e) {
                    console.error("Turnstile render error:", e);
                }
            }
        }, 100);

        // Submit Button (Consolidated)
        const submitBtn = document.createElement('button');
        submitBtn.className = 'vote-btn'; // Use vote-btn class for styling
        submitBtn.textContent = 'OY VER';
        submitBtn.disabled = true; // Disabled initially
        submitBtn.style.marginTop = '10px';

        // Helper to check both conditions
        const checkVoteButtonState = () => {
            // We need access to isCaptchaVerified which is global
            // But simpler: just check if captcha token exists? 
            // Global isCaptchaVerified is set by the callback.

            if (currentRating > 0 && isCaptchaVerified) {
                submitBtn.disabled = false;
                submitBtn.classList.add('active');
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.disabled = true;
                submitBtn.classList.remove('active');
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
        };

        submitBtn.addEventListener('click', () => {
            if (submitBtn.disabled) {
                if (!isCaptchaVerified) showToast('Lütfen robot olmadığınızı doğrulayın.', 'warning');
                else if (currentRating === 0) showToast('Lütfen bir puan seçin.', 'warning');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '...';

            // Reset captcha state for next time
            isCaptchaVerified = false;

            rateCelebrity(celebrity.id, currentRating, card);
        });

        // Update slider logic to check button state
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value).toFixed(1);
            ratingValueDisplay.textContent = `${val} ⭐`;
            updateSliderFill(e.target);
        });

        // Update star click logic to check button state
        // (Note: event listeners for stars are defined above, need to make sure they call checkVoteButtonState)
        // redefining logic here is hard without changing above code.
        // Let's assume the above code calls checkVoteButtonState.
        // Wait, the above code calls checkVoteButtonState() but I just defined it inside this scope?
        // No, the above code (lines 653) calls checkVoteButtonState().
        // But that function was defined on line 695 in the OLD code.
        // I am replacing the block starting from line 661.
        // The stars loop (lines 634-657) is BEFORE my replacement start.
        // So lines 653 calls `checkVoteButtonState()`.
        // I MUST Ensure `checkVoteButtonState` is defined/hoisted or accessible.
        // `const` is not hoisted.
        // Use `function checkVoteButtonState() {}` to hoist it?
        // NO, I am inside a function `createCelebrityCard`. Hoisting works within function scope.
        // But the stars loop is already EXECUTED before I define this function if I place it here.
        // Actually, the EVENT LISTENER is triggered later. So as long as the function exists when CLICK happens, it's fine.
        // And `checkVoteButtonState` is const... so it's TDZ (Temporal Dead Zone).
        // If I use `function`, it is hoisted to top of `createCelebrityCard`.

        // BETTER: Move `checkVoteButtonState` definition TO THE TOP of `createCelebrityCard` or at least before usage?
        // I can't easily edit outside my replacement block efficiently.
        // But wait, the stars are created, events attached.
        // When user clicks star -> event fires -> calls checkVoteButtonState.
        // By that time, `createCelebrityCard` has finished executing?
        // Yes. So the function will be defined.
        // EXCEPT if `checkVoteButtonState` is defined using `const` inside a block that might not be the same scope?
        // It's all inside `if (!hasVoted)`.
        // The stars are inside `if (!hasVoted)`.
        // My replacement is inside `if (!hasVoted)`.
        // So it is the same scope.
        // However, `const` is block scoped. 
        // If I define `const checkVoteButtonState` on line ~700, acts effectively as a variable.
        // Using `var` or `function` is safer for "hoisting" visual style, but strictly speaking, since it's called on click, it's initialized.

        // BUT wait, `stars` are creating BEFORE this block.
        // `checkVoteButtonState` needs to be visible to them.
        // Since they are in the same block, `const` is fine provided the click happens AFTER declaration.

        // ISSUE: I am replacing lines 661-745.
        // The stars are created in lines 634-657 (which I am NOT modifying).
        // Line 653 calls `checkVoteButtonState()`.
        // If I define `checkVoteButtonState` in my new block, it is valid.

        ratingWrapper.appendChild(ratingValueDisplay);
        ratingWrapper.appendChild(slider);
        ratingWrapper.appendChild(submitBtn);

        ratingSection.appendChild(ratingWrapper);
        cardContent.appendChild(ratingSection);
    } // End if (!hasVoted)

    card.appendChild(cardContent);

    return card;
}

// Define checkVoteButtonState function clearly to avoid reference errors if possible
// actually I will use `var` or just `function` to be safe against TDZ if I moved it? 
// Nah, standard function decl is best.

function checkVoteButtonState() {
    // This will capture the submitBtn from closure if defined in same scope
    // But `submitBtn` is defined in my block.
    // `checkVoteButtonState` must be inside the `createCelebrityCard` scope to access `submitBtn` and `currentRating`.
    // So I will output it as a function declaration inside the replacement.
}


// Highlight stars on hover
function highlightStars(starsContainer, rating, permanent = false) {
    const starWrappers = starsContainer.querySelectorAll('.star-wrapper');
    starWrappers.forEach((wrapper, index) => {
        const star = wrapper.querySelector('.star');
        if (index < rating) {
            star.classList.add('highlighted');
            if (permanent) {
                star.classList.add('selected');
            }
        } else {
            star.classList.remove('highlighted');
            if (permanent) {
                star.classList.remove('selected');
            }
        }
    });
}

// Clear star highlight
function clearStarHighlight(starsContainer) {
    const stars = starsContainer.querySelectorAll('.star');
    stars.forEach(star => star.classList.remove('highlighted'));
}

// Scroll carousel
function scrollCarousel(track, direction) {
    const photoWidth = track.querySelector('.carousel-photo').offsetWidth;
    track.scrollBy({
        left: direction * photoWidth,
        behavior: 'smooth'
    });
}

// Update navigation
function updateNavigation() {
    const filtered = getFilteredCelebrities();

    progressIndicator.innerHTML = '';

    filtered.forEach((celebrity, index) => {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';

        if (index === currentIndex) {
            dot.classList.add('active');
        }

        if (userVotes.hasOwnProperty(celebrity.id)) {
            dot.classList.add('voted');
        }

        dot.addEventListener('click', () => {
            currentIndex = index;
            renderCelebrity();
        });

        progressIndicator.appendChild(dot);
    });

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === filtered.length - 1;
}

// Navigation history stack
const navigationHistory = [];
let historyPointer = -1;

// Update navigation buttons state
function updateNavigation() {
    const filtered = getFilteredCelebrities();

    // Enable/Disable Prev button based on history pointer
    // If pointer is 0 (start of history), disable prev
    prevBtn.disabled = historyPointer <= 0;

    // Next button always enabled unless empty list
    // It either goes to next history item or generates new one
    nextBtn.disabled = filtered.length <= 1;

    // Optional: Progress dots logic can stay or be removed if too cluttered
    // For now keeping it simple as per user request to just fix buttons
}

// Navigation buttons
prevBtn.addEventListener('click', () => {
    if (historyPointer > 0) {
        historyPointer--;
        const prevIndex = navigationHistory[historyPointer];

        // Safety check
        const filtered = getFilteredCelebrities();
        if (prevIndex >= 0 && prevIndex < filtered.length) {
            currentIndex = prevIndex;
            renderCelebrity();
        } else {
            // Invalid index in history (e.g. data changed), reset
            historyPointer = 0;
            navigationHistory.length = 0;
            navigationHistory.push(currentIndex);
            updateNavigation();
        }
    }
});

// Weighted random selection for next celebrity
function getNextBalancedIndex(filtered) {
    if (filtered.length <= 1) return 0;

    // 1. Separate into buckets
    const unvoted = [];
    const voted = [];

    filtered.forEach((c, index) => {
        // Don't pick current one again immediately
        if (index === currentIndex && filtered.length > 1) return;

        if (c.ratings.length === 0) {
            unvoted.push(index);
        } else {
            voted.push({ index, count: c.ratings.length });
        }
    });

    // 2. Prioritize unvoted (70% chance if available)
    if (unvoted.length > 0) {
        // If we have unvoted people, mostly show them
        if (Math.random() < 0.7) {
            const randomIdx = Math.floor(Math.random() * unvoted.length);
            return unvoted[randomIdx];
        }
    }

    // 3. Weighted selection for voted (favor less votes)
    // Calculate weights: 1 / (count + 1)
    let totalWeight = 0;
    const weightedItems = voted.map(item => {
        const weight = 1 / (item.count + 1); // +1 to avoid division by zero if count is 0 (though we separated them)
        totalWeight += weight;
        return { index: item.index, weight };
    });

    // Select based on weight
    let randomValue = Math.random() * totalWeight;
    for (const item of weightedItems) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
            return item.index;
        }
    }

    // Fallback
    return unvoted.length > 0 ? unvoted[0] : 0;
}

nextBtn.addEventListener('click', () => {
    const filtered = getFilteredCelebrities();

    // Check if we can go forward in history
    if (historyPointer < navigationHistory.length - 1) {
        historyPointer++;
        const nextIndex = navigationHistory[historyPointer];

        if (nextIndex >= 0 && nextIndex < filtered.length) {
            currentIndex = nextIndex;
            renderCelebrity();
        } else {
            // Invalid, reset to end
            historyPointer = navigationHistory.length - 1;
            // Try to generate new
            generateNewNext(filtered);
        }
    } else {
        // We are at the end, generate new
        generateNewNext(filtered);
    }
});

function generateNewNext(filtered) {
    const nextIndex = getNextBalancedIndex(filtered);

    currentIndex = nextIndex;

    // Add to history
    navigationHistory.push(currentIndex);
    historyPointer++;

    renderCelebrity();
}

// Leaderboard state
let currentLeaderboardMode = 'global'; // 'global' or 'personal'
let globalLeaderboardData = []; // Store fetched global data

// Fetch global leaderboard from Supabase
async function fetchGlobalLeaderboard() {
    if (!supabaseClient) {
        console.warn('Supabase client not initialized');
        return;
    }

    // 1. Fetch top rated celebrities (fallback to view_count if no ratings)
    // Ideally we would have a materialized view or function for average ratings
    // For now, we'll fetch all ratings (LIMIT to reasonable amount if needed) or just fetch celebrities with view_count
    // User wants "Global Leaderboard" -> usually means Ratings.
    // Let's try to fetch distinct celebrity_ids and their average scores.
    // Since we can't do complex aggregation easily without edge functions or views, we'll simulate it for now
    // by fetching 'celebrities' table which has 'view_count'.
    // BUT the user wants RATINGS.
    // Let's try to fetch 'ratings' and aggregate client-side (MVP approach).

    try {
        const { data: ratingsData, error } = await supabaseClient
            .from('ratings')
            .select('celebrity_id, score');

        if (error) throw error;

        // Aggregate ratings
        const aggregation = {};
        ratingsData.forEach(r => {
            if (!aggregation[r.celebrity_id]) {
                aggregation[r.celebrity_id] = { sum: 0, count: 0 };
            }
            aggregation[r.celebrity_id].sum += r.score;
            aggregation[r.celebrity_id].count += 1;
        });

        // Convert to array and sort
        globalLeaderboardData = Object.keys(aggregation).map(id => {
            const stats = aggregation[id];
            const celeb = celebrities.find(c => c.id === parseInt(id));
            if (!celeb) return null;
            return {
                ...celeb,
                globalAvg: (stats.sum / stats.count).toFixed(1),
                globalCount: stats.count
            };
        }).filter(c => c !== null)
            .sort((a, b) => parseFloat(b.globalAvg) - parseFloat(a.globalAvg) || b.globalCount - a.globalCount);

        console.log('Global leaderboard updated:', globalLeaderboardData.length);
        renderLeaderboard();
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
    }
}

// Initial fetch
fetchGlobalLeaderboard();

// Render leaderboard
function renderLeaderboard() {
    // ... capture current positions ...
    const capturePositions = (container) => {
        if (!container) return new Map();
        const positions = new Map();
        container.querySelectorAll('.leaderboard-item').forEach(item => {
            const id = item.dataset.id;
            if (id) positions.set(id, item.getBoundingClientRect());
        });
        return positions;
    };

    const prevPositions = capturePositions(leaderboardList);
    const mobileList = document.getElementById('mobileLeaderboardList');
    // const prevMobilePositions = capturePositions(mobileList); // Optional for mobile

    // Clear lists
    leaderboardList.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';

    let sortedCelebrities = [];
    let emptyMessage = '';

    if (currentLeaderboardMode === 'global') {
        // Use fetched data if available, otherwise fallback to local high ratings?
        // Actually, if we have fetched data, use it.
        if (globalLeaderboardData.length > 0) {
            sortedCelebrities = globalLeaderboardData;
        } else {
            // Fallback to local if fetch failed or empty
            sortedCelebrities = getSortedCelebrities();
        }
        emptyMessage = 'Henüz oy verilmedi (Veriler yükleniyor olabilir...)';
    } else {
        // Personal mode
        sortedCelebrities = celebrities
            .filter(c => userVotes.hasOwnProperty(c.id))
            .sort((a, b) => userVotes[b.id] - userVotes[a.id]);
        emptyMessage = 'Henüz hiç oy vermediniz';
    }

    // ... rest of rendering ...
    const top10 = sortedCelebrities.slice(0, 10);

    if (top10.length === 0) {
        const div = document.createElement('div');
        div.style.cssText = 'text-align: center; padding: var(--spacing-lg); color: var(--text-muted); font-size: 0.9rem;';
        div.textContent = emptyMessage;
        leaderboardList.appendChild(div);
        if (mobileList) mobileList.appendChild(div.cloneNode(true));
        return;
    }

    top10.forEach((celebrity, index) => {
        const rank = index + 1;
        // Use global stats if in global mode
        const isGlobal = currentLeaderboardMode === 'global';
        const displayScore = isGlobal && celebrity.globalAvg ? celebrity.globalAvg : getAverageRating(celebrity);
        const displayCount = isGlobal && celebrity.globalCount ? celebrity.globalCount : (celebrity.ratings ? celebrity.ratings.length : 0);

        const item = createLeaderboardItem(celebrity, rank, false, displayScore, displayCount);
        leaderboardList.appendChild(item);

        if (mobileList) {
            const mobileItem = createLeaderboardItem(celebrity, rank, false, displayScore, displayCount);
            mobileList.appendChild(mobileItem);
        }
    });

    // ... animate ...
    // FLIP Animation
    const newItems = leaderboardList.querySelectorAll('.leaderboard-item');
    newItems.forEach(item => {
        const id = item.dataset.id;
        if (prevPositions.has(id)) {
            const prevRect = prevPositions.get(id);
            const newRect = item.getBoundingClientRect();
            const dy = prevRect.top - newRect.top;
            if (dy !== 0) {
                item.style.transform = `translateY(${dy}px)`;
                item.style.transition = 'none';
                requestAnimationFrame(() => {
                    item.style.transform = '';
                    item.style.transition = 'transform 0.3s ease';
                });
            }
        } else {
            // New entry animation
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            requestAnimationFrame(() => {
                item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'none';
            });
        }
    });

    // Show remaining count if there are more than 10
    if (sortedCelebrities.length > 10) {
        const remainingItem = document.createElement('div');
        remainingItem.className = 'leaderboard-remaining';
        remainingItem.textContent = `+${sortedCelebrities.length - 10} diğer oyuncu`;
        leaderboardList.appendChild(remainingItem);
        if (mobileList) mobileList.appendChild(remainingItem.cloneNode(true));
    }
}

// Create leaderboard item
function createLeaderboardItem(celebrity, rank, isUnvoted, scoreOverride = null, countOverride = null) {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.dataset.id = celebrity.id;

    if (isUnvoted) item.classList.add('unvoted');

    const rankBadge = document.createElement('div');
    rankBadge.className = 'leaderboard-rank';
    rankBadge.textContent = rank;

    if (rank === 1) rankBadge.classList.add('rank-1');
    if (rank === 2) rankBadge.classList.add('rank-2');
    if (rank === 3) rankBadge.classList.add('rank-3');

    const photo = document.createElement('div');
    photo.className = 'leaderboard-photo';

    // Lazy load photo if missing
    if (!celebrity.photos || celebrity.photos.length === 0) {
        photo.textContent = '?';
        // Only fetch if not already loading/attempted recently to avoid spamming
        if (!celebrity.loadingPhoto) {
            ensureCelebrityPhotos(celebrity).then(updatedCeleb => {
                if (updatedCeleb && updatedCeleb.photos && updatedCeleb.photos.length > 0) {
                    // Update UI if still in DOM
                    const img = document.createElement('img');
                    img.src = updatedCeleb.photos[0];
                    img.alt = updatedCeleb.name;
                    photo.textContent = '';
                    photo.appendChild(img);
                }
            });
        }
    } else {
        const img = document.createElement('img');
        img.src = celebrity.photos[0];
        img.alt = celebrity.name;
        photo.appendChild(img);
    }

    const info = document.createElement('div');
    info.className = 'leaderboard-info';

    const name = document.createElement('div');
    name.className = 'leaderboard-name';
    const genderIcon = celebrity.gender === 'male' ? '👨' : '👩';
    name.textContent = `${celebrity.name} ${genderIcon}`;

    const votes = document.createElement('div');
    votes.className = 'leaderboard-votes';
    const count = countOverride !== null ? countOverride : (celebrity.ratings ? celebrity.ratings.length : 0);
    votes.textContent = `${count} oy`;

    info.appendChild(name);
    info.appendChild(score);

    item.appendChild(rankBadge);
    item.appendChild(photo);
    item.appendChild(info);

    return item;
}

// Tab Switching Logic
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update mode and render
        currentLeaderboardMode = btn.dataset.tab;
        renderLeaderboard();
    });
});

// Category filtering
function updateCategoryButtons() {
    const total = celebrities.length;
    const males = celebrities.filter(c => c.gender === 'male').length;
    const females = celebrities.filter(c => c.gender === 'female').length;

    categoryBtns.forEach(btn => {
        // Update active class
        btn.classList.remove('active');
        if (btn.dataset.category === currentCategory) {
            btn.classList.add('active');
        }

        // Update counts (Hidden as per user request, only names)
        if (btn.dataset.category === 'all') {
            btn.textContent = `Hepsi`;
        } else if (btn.dataset.category === 'male') {
            btn.textContent = `👨 Erkek`;
        } else if (btn.dataset.category === 'female') {
            btn.textContent = `👩 Kadın`;
        }
    });
}

function setCategory(category) {
    currentCategory = category;
    currentIndex = 0; // Reset to first celebrity in category
    updateCategoryButtons();
    saveData();

    // Reset History for new category
    initHistory();

    renderCelebrity();
    renderLeaderboard();
}

// Category button listeners
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setCategory(btn.dataset.category);
    });
});

// Load celebrity photos from TMDb
async function loadCelebrityPhotos() {
    // NO OVERLAY - Silent background loading
    // const loadingOverlay = document.getElementById('loadingOverlay');
    // if (loadingOverlay) loadingOverlay.classList.add('active');

    try {
        console.log("🚀 Arka plan fotoğraf yüklemesi başlatılıyor...");

        // 1. Prioritize: Valid photos from local storage OR first 5 celebrities
        // We actually want to check ALL for local storage first to be fast if data exists
        // But if not, we only fetch first 5 from API.

        // Let's filter those who need fetching
        const needsFetching = celebrities.filter(c => !c.photos || c.photos.length === 0);

        if (needsFetching.length === 0) {
            console.log("✅ Tüm fotoğraflar zaten yüklü.");
            return;
        }

        // 2. Identify Initial Batch (Prioritize Current + First 4)
        const initialBatchCount = 5;
        let initialBatch = [];

        // Find current celebrity if set
        let currentCeleb = null;
        const filtered = getFilteredCelebrities();
        if (currentIndex >= 0 && currentIndex < filtered.length) {
            currentCeleb = filtered[currentIndex];
        } else {
            // Check last viewed
            const lastId = localStorage.getItem('lastViewedId');
            if (lastId) {
                currentCeleb = celebrities.find(c => c.id === parseInt(lastId));
            }
        }

        // If current needs fetching, add it first
        if (currentCeleb && !currentCeleb.photos) { // Check if missing
            // Remove from needsFetching list to avoid double add (though unique check handles it)
            // simplified: just construct list
        }

        // Re-construct logic:
        // We want: [Current (if missing)] + [First N (if missing)]

        const setOfCelebsToLoad = new Set();

        // Add current if missing
        if (currentCeleb && (!currentCeleb.photos || currentCeleb.photos.length === 0)) {
            setOfCelebsToLoad.add(currentCeleb);
        }

        // Fill rest with top of list
        for (const c of needsFetching) {
            if (setOfCelebsToLoad.size >= initialBatchCount) break;
            setOfCelebsToLoad.add(c);
        }

        initialBatch = Array.from(setOfCelebsToLoad);

        // Remaining is everything in needsFetching that is NOT in initialBatch
        const initialIds = new Set(initialBatch.map(c => c.id));
        const remainingBatch = needsFetching.filter(c => !initialIds.has(c.id));

        console.log(`📦 İlk parti: ${initialBatch.length} kişi yükleniyor... (Dahil: ${currentCeleb ? currentCeleb.name : 'Yok'})`);

        // 3. Load Initial Batch
        const initialPromises = initialBatch.map(async (celebrity) => {
            celebrity.loading = true;
            const photos = await tmdbService.getPersonPhotos(celebrity.name, 4);
            celebrity.photos = photos;
            celebrity.loading = false;
            return celebrity;
        });

        await Promise.all(initialPromises);
        console.log("✨ İlk parti tamamlandı! Site açılıyor...");

        // 4. HIDE LOADING SCREEN IMMEDIATELY - ALREADY HANDLED IN INIT
        // if (loadingOverlay) {
        //     loadingOverlay.classList.remove('active');
        //     // Remove from DOM after animation
        //     setTimeout(() => loadingOverlay.remove(), 600);
        // }

        // 5. Load Remaining in Background (Slower pace to not freeze UI)
        if (remainingBatch.length > 0) {
            console.log(`⏳ Arka planda ${remainingBatch.length} kişi daha yüklenecek...`);
            loadRemainingPhotosInBackground(remainingBatch);
        }

    } catch (error) {
        console.error('Error loading celebrity photos:', error);
        // Ensure overlay is removed even on error
        // if (loadingOverlay) loadingOverlay.classList.remove('active');
    }
}

// Helper for background loading
async function loadRemainingPhotosInBackground(remainingCelebrities) {
    // Process in chunks of 3 to avoid network congestion
    const chunkSize = 3;

    for (let i = 0; i < remainingCelebrities.length; i += chunkSize) {
        const chunk = remainingCelebrities.slice(i, i + chunkSize);

        const chunkPromises = chunk.map(async (celebrity) => {
            if (celebrity.photos && celebrity.photos.length > 0) return; // Skip if somehow loaded

            try {
                const photos = await tmdbService.getPersonPhotos(celebrity.name, 4);
                celebrity.photos = photos;
                // Save progress periodically could be good, but standard save is on exit/vote
            } catch (err) {
                console.warn(`Background load failed for ${celebrity.name}`, err);
            }
        });

        await Promise.all(chunkPromises);

        // Small delay between chunks to yield to main thread
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("🎉 Tüm arka plan yüklemeleri tamamlandı!");

    // Filter out invalid ones only after EVERYTHING is done, or check on render
    // Updating global/local storage with new photos
    saveData();

    // Refresh current view if needed (e.g. if the current card didn't have photo but now does)
    // But usually user is voting on 1 person, logic handles 'current'.
}



// ===== THEME SWITCHER =====
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'gradient';
    applyTheme(savedTheme);
    themeSelect.value = savedTheme;
}

function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-gradient');

    // Add selected theme class (gradient is default, no class needed)
    if (theme === 'light') {
        document.body.classList.add('theme-light');
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
}

themeSelect.addEventListener('change', (e) => {
    applyTheme(e.target.value);
});

// ===== DRAGGABLE LEADERBOARD =====
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

function loadLeaderboardPosition() {
    const savedPosition = localStorage.getItem('leaderboardPosition');
    if (savedPosition) {
        const { x, y, isDraggable } = JSON.parse(savedPosition);

        if (isDraggable) {
            leaderboardSidebar.classList.add('draggable');
            xOffset = x;
            yOffset = y;
            setLeaderboardPosition(x, y);
        }
    }
}

function setLeaderboardPosition(x, y) {
    leaderboardSidebar.style.left = `${x}px`;
    leaderboardSidebar.style.top = `${y}px`;
}

function saveLeaderboardPosition() {
    const isDraggable = leaderboardSidebar.classList.contains('draggable');
    localStorage.setItem('leaderboardPosition', JSON.stringify({
        x: xOffset,
        y: yOffset,
        isDraggable
    }));
}

function dragStart(e) {
    // Only allow dragging from the header
    if (e.target === leaderboardDragHandle || leaderboardDragHandle.contains(e.target)) {
        // Make leaderboard draggable on first drag
        if (!leaderboardSidebar.classList.contains('draggable')) {
            leaderboardSidebar.classList.add('draggable');

            // Get current position relative to viewport
            const rect = leaderboardSidebar.getBoundingClientRect();
            xOffset = rect.left;
            yOffset = rect.top;
            setLeaderboardPosition(xOffset, yOffset);
        }

        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        isDragging = true;
        leaderboardSidebar.classList.add('dragging');
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();

        if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setLeaderboardPosition(currentX, currentY);
    }
}

function dragEnd(e) {
    if (isDragging) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        leaderboardSidebar.classList.remove('dragging');
        saveLeaderboardPosition();
    }
}

// Add drag event listeners
leaderboardDragHandle.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

// Touch events for mobile
leaderboardDragHandle.addEventListener('touchstart', dragStart);
document.addEventListener('touchmove', drag);
document.addEventListener('touchend', dragEnd);

// ===== LEADERBOARD RESIZE =====
let isResizing = false;
let initialHeight;
let initialMouseY;

function loadLeaderboardHeight() {
    const savedHeight = localStorage.getItem('leaderboardHeight');
    if (savedHeight) {
        leaderboardList.style.height = savedHeight;
    }
}

function saveLeaderboardHeight() {
    localStorage.setItem('leaderboardHeight', leaderboardList.style.height);
}

function resizeStart(e) {
    if (e.target === leaderboardResizeHandle || leaderboardResizeHandle.contains(e.target)) {
        isResizing = true;
        leaderboardSidebar.classList.add('resizing');

        const rect = leaderboardList.getBoundingClientRect();
        initialHeight = rect.height;

        if (e.type === 'touchstart') {
            initialMouseY = e.touches[0].clientY;
        } else {
            initialMouseY = e.clientY;
        }

        e.preventDefault();
    }
}

function resize(e) {
    if (isResizing) {
        e.preventDefault();

        let currentMouseY;
        if (e.type === 'touchmove') {
            currentMouseY = e.touches[0].clientY;
        } else {
            currentMouseY = e.clientY;
        }

        const deltaY = currentMouseY - initialMouseY;
        const newHeight = Math.max(200, Math.min(window.innerHeight * 0.8, initialHeight + deltaY));

        leaderboardList.style.height = `${newHeight}px`;
    }
}

function resizeEnd(e) {
    if (isResizing) {
        isResizing = false;
        leaderboardSidebar.classList.remove('resizing');
        saveLeaderboardHeight();
    }
}

// Add resize event listeners
leaderboardResizeHandle.addEventListener('mousedown', resizeStart);
document.addEventListener('mousemove', resize);
document.addEventListener('mouseup', resizeEnd);

// Touch events for mobile resize
leaderboardResizeHandle.addEventListener('touchstart', resizeStart);
document.addEventListener('touchmove', resize);
document.addEventListener('touchend', resizeEnd);

// ===== LEADERBOARD HORIZONTAL RESIZE (WIDTH) =====

const leaderboardHorizontalResizeHandle = document.getElementById('leaderboardHorizontalResizeHandle');
let isResizingHorizontal = false;
let initialMouseX = 0;
let initialWidth = 0;

function horizontalResizeStart(e) {
    if (window.innerWidth <= 768) return;
    isResizingHorizontal = true;
    leaderboardSidebar.classList.add('resizing');
    initialMouseX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    initialWidth = leaderboardSidebar.offsetWidth;
    e.preventDefault();
}

function horizontalResize(e) {
    if (!isResizingHorizontal) return;
    const currentMouseX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const deltaX = initialMouseX - currentMouseX;
    const newWidth = Math.max(250, Math.min(600, initialWidth + deltaX));
    leaderboardSidebar.style.width = `${newWidth}px`;
}

function horizontalResizeEnd(e) {
    if (isResizingHorizontal) {
        isResizingHorizontal = false;
        leaderboardSidebar.classList.remove('resizing');
        saveLeaderboardWidth();
    }
}

function saveLeaderboardWidth() {
    const width = leaderboardSidebar.offsetWidth;
    localStorage.setItem('leaderboardWidth', width);
}

function loadLeaderboardWidth() {
    const savedWidth = localStorage.getItem('leaderboardWidth');
    if (savedWidth && window.innerWidth > 768) {
        leaderboardSidebar.style.width = `${savedWidth}px`;
    }
}

leaderboardHorizontalResizeHandle.addEventListener('mousedown', horizontalResizeStart);
document.addEventListener('mousemove', horizontalResize);
document.addEventListener('mouseup', horizontalResizeEnd);
leaderboardHorizontalResizeHandle.addEventListener('touchstart', horizontalResizeStart);
document.addEventListener('touchmove', horizontalResize);
document.addEventListener('touchend', horizontalResizeEnd);

// ===== LEADERBOARD RENDERING =====

// Render leaderboard
// Render leaderboard
// Render leaderboard with FLIP animation
function renderLeaderboard() {
    const mobileList = document.getElementById('mobileLeaderboardList');

    // 1. Capture current positions (FIRST)
    const currentPositions = new Map();
    const capturePositions = (container) => {
        if (!container) return;
        container.querySelectorAll('.leaderboard-item').forEach(item => {
            const id = item.dataset.id;
            if (id) {
                currentPositions.set(id, item.getBoundingClientRect());
            }
        });
    };

    capturePositions(leaderboardList);
    capturePositions(mobileList);

    // Clear both lists
    leaderboardList.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';

    const sorted = getSortedCelebrities();
    const top10 = sorted.slice(0, 10);

    if (top10.length === 0) {
        const emptyMsg = '<div style="text-align: center; padding: var(--spacing-lg); color: var(--text-muted);">Henüz oy verilmedi</div>';
        leaderboardList.innerHTML = emptyMsg;
        if (mobileList) mobileList.innerHTML = emptyMsg;
        return;
    }

    // Helper to create item
    const createItem = (celebrity, rank) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.dataset.id = celebrity.id; // Crucial for FLIP

        const rankDiv = document.createElement('div');
        rankDiv.className = 'leaderboard-rank';
        rankDiv.textContent = rank;

        const info = document.createElement('div');
        info.className = 'leaderboard-info';

        const name = document.createElement('div');
        name.className = 'leaderboard-name';
        const genderIcon = celebrity.gender === 'male' ? '👨' : '👩';
        name.textContent = `${celebrity.name} ${genderIcon}`;

        const votes = document.createElement('div');
        votes.className = 'leaderboard-votes';
        votes.textContent = `${celebrity.ratings.length} oy`;

        info.appendChild(name);
        info.appendChild(votes);

        const score = document.createElement('div');
        score.className = 'leaderboard-score';
        score.textContent = `${getAverageRating(celebrity)} ⭐`;

        item.appendChild(rankDiv);
        item.appendChild(info);
        item.appendChild(score);
        return item;
    };

    top10.forEach((celebrity, index) => {
        // Append to Desktop List
        leaderboardList.appendChild(createItem(celebrity, index + 1));

        // Append to Mobile List
        if (mobileList) {
            mobileList.appendChild(createItem(celebrity, index + 1));
        }
    });

    // 2. Play Animation (LAST, INVERT, PLAY)
    const animateItems = (container) => {
        if (!container) return;

        container.querySelectorAll('.leaderboard-item').forEach(item => {
            const id = item.dataset.id;
            const oldRect = currentPositions.get(id);

            if (oldRect) {
                const newRect = item.getBoundingClientRect();

                const deltaX = oldRect.left - newRect.left;
                const deltaY = oldRect.top - newRect.top;

                // INVERT: Move it back to where it was
                requestAnimationFrame(() => {
                    item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    item.style.transition = 'none';

                    // PLAY: Move it to new position
                    requestAnimationFrame(() => {
                        item.style.transform = '';
                        item.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    });
                });
            } else {
                // New item animation (Fade In)
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';

                requestAnimationFrame(() => {
                    item.style.transition = 'all 0.5s ease';
                    item.style.opacity = '1';
                    item.style.transform = '';
                });
            }
        });
    };

    animateItems(leaderboardList);
    animateItems(mobileList);
}

// ===== MOBILE BOTTOM NAVIGATION =====

// Mobile view switching
mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;

        if (view === 'badges') {
            // Rozetler modalını aç
            renderBadges();
            badgesModal.classList.add('active');
            return;
        }

        // Update active button
        mobileNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Switch view
        if (view === 'leaderboard') {
            document.body.classList.add('mobile-view-leaderboard');
            renderLeaderboard();
        } else {
            document.body.classList.remove('mobile-view-leaderboard');
        }
    });
});

// Update navigation
function updateNavigation() {
    const filtered = getFilteredCelebrities();
    // Prev button logic can remain (history based? currently linear decrement, maybe disable prev?)
    // For now, let's keep prev linear decrement if they want to go back, 
    // but random next means "currentIndex" jumping around.
    // If we want random navigation, "Previous" might not make sense unless we track history.
    // Let's just enable buttons always if we have celebs.

    prevBtn.disabled = filtered.length <= 1;
    nextBtn.disabled = filtered.length <= 1;
}

// Initialize app
async function init() {
    const overlay = document.getElementById('loadingOverlay');

    try {
        console.log('Sayfa yüklendi, uygulama başlatılıyor...');

        // Initialize celebrity service with Supabase
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            celebrityService.init(supabaseClient);
            console.log('✅ Supabase başarıyla başlatıldı');
        } else {
            console.warn('⚠️ Supabase client bulunamadı! Sadece localStorage kullanılacak.');
        }

        loadData();
        initHistory(); // Initialize navigation history
        loadTheme();
        loadLeaderboardPosition();
        loadLeaderboardHeight();
        loadLeaderboardWidth();

        // IMMEDIATELY render celebrity and leaderboard (don't wait for photos!)
        try {
            renderCelebrity();
            renderLeaderboard();
        } catch (renderError) {
            console.error("Render hatası:", renderError);
        }

        console.log('✅ Uygulama başarıyla başlatıldı');

        // Start background photo loading (non-blocking)
        loadCelebrityPhotos();

    } catch (error) {
        console.error("Kritik Başlatma Hatası:", error);
    } finally {
        // Hide loading overlay FORCEFULLY
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }, 600);
        }
    }
}

// Start the app
init();

// ===== SEARCH FUNCTIONALITY =====
(function initSearchBar() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchClearBtn = document.getElementById('searchClearBtn');

    if (!searchInput) return;

    let debounceTimer;

    // Close results when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });

    // Helper: Ensure celebrity has photos (Lazy Load)
    async function ensureCelebrityPhotos(celebrity) {
        if (celebrity.photos && celebrity.photos.length > 0) return celebrity;

        try {
            celebrity.loadingPhoto = true;
            // Clean name: remove emojis and extra spaces
            const cleanName = celebrity.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]/gu, '').trim();
            // console.log(`📸 Fotoğraf aranıyor: ${cleanName}`);
            const photos = await tmdbService.getPersonPhotos(cleanName, 2);

            if (photos && photos.length > 0) {
                celebrity.photos = photos;
                saveData(); // Save immediately
                return celebrity;
            }
        } catch (err) {
            console.warn(`Fotoğraf bulunamadı: ${celebrity.name}`);
        } finally {
            celebrity.loadingPhoto = false;
        }
        return null;
    }

    // Helper: Add found person to celebrities list
    async function addPersonToCelebrities(person) {
        if (!person) return null;

        // Check if already exists
        const existing = celebrities.find(c => c.name.toLowerCase() === person.name.toLowerCase());
        if (existing) return existing;

        try {
            // Get photos
            const photos = await tmdbService.getPersonPhotos(person.name, 2);
            if (!photos || photos.length === 0) return null;

            const newCeleb = {
                id: person.id,
                name: person.name,
                gender: person.gender === 1 ? 'female' : 'male',
                photos: photos,
                ratings: [],
                loading: false
            };

            // Add to local list
            celebrities.push(newCeleb);
            saveData();

            // Sync to Supabase for global sharing
            if (celebrityService) {
                celebrityService.syncCelebrities([newCeleb]);
            }

            return newCeleb;
        } catch (err) {
            console.error('Error adding person:', err);
            return null;
        }
    }

    // Extended search logic with TMDB integration
    searchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        clearTimeout(debounceTimer);

        if (query.length === 0) {
            searchResults.style.display = 'none';
            searchClearBtn.style.display = 'none';
            return;
        }

        searchClearBtn.style.display = 'flex';

        debounceTimer = setTimeout(async () => {
            // 1. Local Search
            const localResults = celebrities.filter(c =>
                c.name.toLowerCase().includes(query)
            );

            let html = '';

            // Show local results first
            if (localResults.length > 0) {
                html += localResults.slice(0, 5).map(c => createSearchResultItem(c)).join('');
            }

            // 2. If few local results, search TMDB
            if (localResults.length < 3) {
                // Show "Searching online..." indicator if no local results
                if (localResults.length === 0) {
                    searchResults.innerHTML = '<div class="search-no-results">🌐 İnternette aranıyor...</div>';
                    searchResults.style.display = 'block';
                }

                try {
                    const onlinePerson = await tmdbService.searchPerson(query);
                    if (onlinePerson) {
                        // Check if not already in local results (avoid duplicates)
                        const alreadyInLocal = localResults.some(c => c.id === onlinePerson.id);
                        if (!alreadyInLocal) {
                            // Add a special "Add from Web" item
                            html += `
                                <div class="search-result-item online-result" data-tmdb-id="${onlinePerson.id}" data-tmdb-name="${onlinePerson.name}">
                                    <span class="search-result-gender">🌐</span>
                                    <span class="search-result-name">${onlinePerson.name} (Ekle)</span>
                                    <span class="search-result-voted not-voted">+ Listeye Ekle</span>
                                </div>
                             `;
                        }
                    }
                } catch (err) {
                    console.warn('Online search failed:', err);
                }
            }

            if (html === '') {
                searchResults.innerHTML = '<div class="search-no-results">Sonuç bulunamadı 😕</div>';
            } else {
                searchResults.innerHTML = html;
            }

            searchResults.style.display = 'block';
        }, 500); // Increased debounce for API limit
    });

    // Helper to create search result HTML
    function createSearchResultItem(c) {
        const hasVoted = userVotes.hasOwnProperty(c.id);
        const genderIcon = c.gender === 'male' ? '👨' : '👩';
        const votedBadge = hasVoted
            ? `<span class="search-result-voted voted">✓ Oy verildi</span>`
            : `<span class="search-result-voted not-voted">Oy ver</span>`;

        return `
            <div class="search-result-item" data-celebrity-id="${c.id}">
                <span class="search-result-gender">${genderIcon}</span>
                <span class="search-result-name">${c.name}</span>
                ${votedBadge}
            </div>
        `;
    }

    // Handle clicks on search results (Local & Online)
    searchResults.addEventListener('click', async function (e) {
        // 1. Handle "Online Result" click - Add to list
        const onlineItem = e.target.closest('.online-result');
        if (onlineItem) {
            const name = onlineItem.dataset.tmdbName;
            const originalText = onlineItem.innerHTML;

            onlineItem.innerHTML = '<span class="search-result-name">⏳ Ekleniyor...</span>';

            // Re-fetch full person data to get details
            const person = await tmdbService.searchPerson(name);
            const newCeleb = await addPersonToCelebrities(person);

            if (newCeleb) {
                showToast(`${newCeleb.name} listeye eklendi! 🎉`, 'success');
                // Navigate to new celeb
                navigateToCelebrity(newCeleb.id);
            } else {
                showToast('Hata: Fotoğraf bulunamadı.', 'error');
                onlineItem.innerHTML = originalText;
            }
            return;
        }

        // 2. Handle Local Result click
        const item = e.target.closest('.search-result-item');
        if (item) {
            const celebId = parseInt(item.dataset.celebrityId);
            navigateToCelebrity(celebId);
        }
    });

    function navigateToCelebrity(celebId) {
        const filteredCelebs = getFilteredCelebrities();
        let index = filteredCelebs.findIndex(c => c.id === celebId);

        if (index !== -1) {
            currentIndex = index;
            renderCelebrity();
            renderLeaderboard(); // In case it was just added
            showToast(`${filteredCelebs[index].name} gösteriliyor`, 'info', 2000);
        } else {
            // Celebrity might be in another category
            currentCategory = 'all';
            updateCategoryButtons();
            const allIndex = celebrities.findIndex(c => c.id === celebId);
            if (allIndex !== -1) {
                currentIndex = allIndex;
                renderCelebrity();
                renderLeaderboard();
                showToast(`${celebrities[allIndex].name} gösteriliyor`, 'info', 2000);
            }
        }

        // Close search
        searchInput.value = '';
        searchResults.style.display = 'none';
        searchClearBtn.style.display = 'none';
    }

})();


// ===== BADGE SYSTEM =====
// ===== BADGE SYSTEM =====
const badges = [
    { id: 'newbie', name: 'Mısır Çırağı', icon: '🍿', description: 'İlk oyunu verdin! Yolun başındasın.', threshold: 1 },
    { id: 'watcher', name: 'Koltuk Isıtıcısı', icon: '💺', description: '10 oyuncuya oy verdin. Yerini ısıttın.', threshold: 10 },
    { id: 'critic', name: 'Kumanda Efendisi', icon: '🎮', description: '50 oyuncuya oy verdin. Kanal senin.', threshold: 50 },
    { id: 'expert', name: 'Spoiler Savar', icon: '🛡️', description: '100 oy! Kimse sana spoiler veremez.', threshold: 100 },
    { id: 'master', name: 'Hollywood Muhtarı', icon: '👑', description: '200 oy! Sektör senden sorulur.', threshold: 200 }
];

const badgesModal = document.getElementById('badgesModal');
const badgesList = document.getElementById('badgesList');
const viewBadgesBtn = document.getElementById('viewBadgesBtn');
const badgesCloseBtn = document.getElementById('badgesCloseBtn');

if (viewBadgesBtn) {
    viewBadgesBtn.addEventListener('click', () => {
        renderBadges();
        badgesModal.classList.add('active');
    });
}

if (badgesCloseBtn) {
    badgesCloseBtn.addEventListener('click', () => {
        badgesModal.classList.remove('active');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === badgesModal) {
        badgesModal.classList.remove('active');
    }
});

function renderBadges() {
    const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
    const totalVotes = Object.keys(userVotes).length;

    badgesList.innerHTML = '';

    badges.forEach(badge => {
        const isUnlocked = earnedBadges.includes(badge.id);
        const item = document.createElement('div');
        item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;

        // Mask content if locked
        const displayIcon = isUnlocked ? badge.icon : '🔒';
        const displayName = isUnlocked ? badge.name : '???';
        const displayDesc = isUnlocked ? badge.description : 'Bu rozetin gizemi henüz çözülmedi...';

        // Progress for locked badges
        let progressText = '';
        if (!isUnlocked) {
            progressText = `<div style="margin-top:8px; font-size:11px; color:#555; font-weight:bold;">${Math.min(totalVotes, badge.threshold)} / ${badge.threshold}</div>`;
        }

        item.innerHTML = `
            <span class="badge-item-icon">${displayIcon}</span>
            <div class="badge-item-name">${displayName}</div>
            <div class="badge-item-desc">${displayDesc}</div>
            ${progressText}
        `;

        badgesList.appendChild(item);
    });
}

function checkBadges() {
    const totalVotes = Object.keys(userVotes).length;
    const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');
    let newBadgeEarned = false;

    badges.forEach(badge => {
        if (totalVotes >= badge.threshold && !earnedBadges.includes(badge.id)) {
            earnedBadges.push(badge.id);
            newBadgeEarned = true;

            // Celebration
            showBadgeNotification(badge);
            soundManager.play('unlock');
        }
    });

    if (newBadgeEarned) {
        localStorage.setItem('earnedBadges', JSON.stringify(earnedBadges));
    }
}

function showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-content">
            <div class="badge-title">Yeni Rozet Kazanıldı!</div>
            <div class="badge-name">${badge.name}</div>
            <div class="badge-desc">${badge.description}</div>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => notification.classList.add('show'));

    // Remove after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

// ===== AUTO-ADD & BULK ADD CELEBRITIES =====
(function initCelebrityAdder() {
    const addCelebsBtn = document.getElementById('addCelebsBtn');

    // Manual "Add 10 Random" Button
    if (addCelebsBtn) {
        addCelebsBtn.addEventListener('click', async () => {
            addCelebsBtn.disabled = true;
            addCelebsBtn.textContent = '⏳ Yükleniyor...';

            await addRandomCelebrities(10);

            addCelebsBtn.disabled = false;
            addCelebsBtn.textContent = '🎲 Rastgele 10 Ünlü Ekle';
        });
    }

    // Auto-add every 5 minutes
    const AUTO_ADD_INTERVAL = 5 * 60 * 1000;

    async function addRandomCelebrities(count) {
        try {
            console.log(`🔄 ${count} yeni ünlü ekleniyor...`);

            // Use existing service if available to sync with Supabase
            if (typeof celebrityService !== 'undefined') {
                const added = await celebrityService.addNewCelebrities(count);

                if (added.length > 0) {
                    // Start managing these new celebs locally
                    added.forEach(c => {
                        if (!celebrities.some(existing => existing.id === c.id || existing.name.toLowerCase() === c.name.toLowerCase())) {
                            celebrities.push(c);
                        }
                    });

                    saveData();
                    updateCategoryButtons();
                    renderLeaderboard();

                    showToast(`${added.length} yeni ünlü eklendi! 🌟`, 'success', 3000);
                } else {
                    showToast('Yeni ünlü bulunamadı veya hepsi zaten ekli.', 'info');
                }
            } else {
                // Fallback if celebrityService is missing (should verify imports)
                const newCelebs = await tmdbService.getRandomCelebrities(count);
                // ... (fallback logic similar to previous auto-add) ...
            }

        } catch (error) {
            console.error('Add celebrities error:', error);
            showToast('Ünlü eklenirken hata oluştu', 'error');
        }
    }

    // Start auto-add timer
    setInterval(() => addRandomCelebrities(5), AUTO_ADD_INTERVAL);
    console.log('⏱️ Otomatik ünlü ekleme aktif');
})();

// ===== MOBILE NAVIGATION =====
mobileNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active state
        mobileNavBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const view = btn.dataset.view;
        if (view === 'leaderboard') {
            document.body.classList.add('mobile-view-leaderboard');
            renderLeaderboard(); // FORCE RENDER

            // Scroll to top
            const sb = document.getElementById('leaderboardSidebar');
            if (sb) sb.scrollTop = 0;

        } else {
            document.body.classList.remove('mobile-view-leaderboard');
        }
    });
});


// ===== FULL LEADERBOARD LOGIC =====
const fullLeaderboardModal = document.getElementById('fullLeaderboardModal');
const fullLeaderboardList = document.getElementById('fullLeaderboardList');
const viewFullLeaderboardBtn = document.getElementById('viewFullLeaderboardBtn');
const fullLeaderboardCloseBtn = document.getElementById('fullLeaderboardCloseBtn');

// New Elements for Filters/Tabs
const modalFilterBtns = document.querySelectorAll('.modal-filter-btn');
const modalTabBtns = document.querySelectorAll('.tab-btn[data-modal-tab]');

let currentModalFilter = 'all';
let currentModalMode = 'global'; // 'global' or 'personal'

if (viewFullLeaderboardBtn) {
    viewFullLeaderboardBtn.addEventListener('click', () => {
        // Sync modal filter with main category
        currentModalFilter = currentCategory;
        currentModalMode = 'global'; // Default to global on open

        updateModalFilterButtons();
        updateModalTabButtons();

        renderFullLeaderboard();
        fullLeaderboardModal.classList.add('active');
    });
}

// Mobile "See All" Button
const viewFullLeaderboardBtnMobile = document.getElementById('viewFullLeaderboardBtnMobile');
if (viewFullLeaderboardBtnMobile) {
    viewFullLeaderboardBtnMobile.addEventListener('click', () => {
        currentModalFilter = currentCategory;
        currentModalMode = 'global';

        updateModalFilterButtons();
        updateModalTabButtons();

        renderFullLeaderboard();
        fullLeaderboardModal.classList.add('active');
    });
}

// Modal Filter Buttons Logic (All, Male, Female)
if (modalFilterBtns) {
    modalFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentModalFilter = btn.dataset.filter;
            updateModalFilterButtons();
            renderFullLeaderboard();
        });
    });
}

// Modal Tab Buttons Logic (Global, Personal)
if (modalTabBtns) {
    modalTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentModalMode = btn.dataset.modalTab;
            updateModalTabButtons();
            renderFullLeaderboard();
        });
    });
}

function updateModalFilterButtons() {
    modalFilterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === currentModalFilter) {
            btn.classList.add('active');
        }
    });
}

function updateModalTabButtons() {
    modalTabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.modalTab === currentModalMode) {
            btn.classList.add('active');
        }
    });
}

if (fullLeaderboardCloseBtn) {
    fullLeaderboardCloseBtn.addEventListener('click', () => {
        fullLeaderboardModal.classList.remove('active');
    });
}

// Close on outside click
window.addEventListener('click', (e) => {
    if (e.target === fullLeaderboardModal) {
        fullLeaderboardModal.classList.remove('active');
    }
});


function renderFullLeaderboard() {
    fullLeaderboardList.innerHTML = '';

    let filtered = [];

    // 1. Filter by Mode (Global vs Personal)
    if (currentModalMode === 'personal') {
        filtered = celebrities.filter(c => userVotes.hasOwnProperty(c.id));
    } else {
        filtered = celebrities.filter(c => c.ratings.length > 0);
    }

    // 2. Filter by Category (All, Male, Female)
    if (currentModalFilter !== 'all') {
        filtered = filtered.filter(c => c.gender === currentModalFilter);
    }

    // 3. Sort
    const sorted = [...filtered].sort((a, b) => {
        // For Personal: Sort by User's Rating
        if (currentModalMode === 'personal') {
            return userVotes[b.id] - userVotes[a.id];
        }
        // For Global: Sort by Average Rating
        else {
            const avgA = parseFloat(getAverageRating(a));
            const avgB = parseFloat(getAverageRating(b));
            return avgB - avgA;
        }
    });

    // We show all results in the modal, mainly up to 100
    const finalDisplay = sorted.slice(0, 100);

    if (finalDisplay.length === 0) {
        let msg = 'Bu kategoride henüz oy verilmiş oyuncu yok.';
        if (currentModalMode === 'personal') msg = 'Bu kategoride henüz hiç oy vermediniz.';

        fullLeaderboardList.innerHTML = `<div style="text-align:center; padding:20px; color:#aaa;">${msg}</div>`;
        return;
    }

    finalDisplay.forEach((celeb, index) => {
        const item = document.createElement('div');
        item.className = 'full-leaderboard-item';

        const photoUrl = (celeb.photos && celeb.photos.length > 0) ? celeb.photos[0] : '';
        const photoImg = photoUrl ? `<img src="${photoUrl}" class="full-leaderboard-photo" alt="${celeb.name}">` : `<div class="full-leaderboard-photo" style="background:#333; display:flex; align-items:center; justify-content:center;">?</div>`;

        // Determine score display based on mode
        let scoreDisplay = '';
        if (currentModalMode === 'personal') {
            scoreDisplay = `Senin Puanın: ${userVotes[celeb.id]} ⭐`;
        } else {
            scoreDisplay = `${getAverageRating(celeb)}`;
        }

        item.innerHTML = `
            <div class="full-leaderboard-rank">#${index + 1}</div>
            ${photoImg}
            <div class="full-leaderboard-info">
                <div class="full-leaderboard-name">${celeb.name}</div>
                <div class="full-leaderboard-votes">${currentModalMode === 'personal' ? '' : celeb.ratings.length + ' oy'}</div>
            </div>
            <div class="full-leaderboard-score">${scoreDisplay}</div>
        `;

        item.addEventListener('click', () => {
            // Navigate to that celebrity when clicked in the full list
            const actualIndex = celebrities.findIndex(c => c.id === celeb.id);
            if (actualIndex !== -1) {
                currentIndex = actualIndex;

                // If category mismatch, switch to 'all' safely
                if (currentCategory !== 'all' && currentCategory !== celeb.gender) {
                    setCategory('all');
                } else {
                    // Just render if category aligns
                    renderCelebrity();
                }

                fullLeaderboardModal.classList.remove('active');
                document.body.classList.remove('mobile-view-leaderboard');
            }
        });

        fullLeaderboardList.appendChild(item);
    });
}


// ===== DAILY DUEL SYSTEM =====
(function initDailyDuel() {
    const openDuelBtn = document.getElementById('openDuelBtn');
    const duelModal = document.getElementById('duelModal');
    const duelCloseBtn = document.getElementById('duelCloseBtn');
    const duelContainer = document.getElementById('duelContainer');
    const duelCountdown = document.getElementById('duelCountdown');

    // Get today's unique seed (YYYYMMDD)
    function getTodaySeed() {
        const now = new Date();
        return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    }

    // Pseudo-random number generator with seed
    function seededRandom(seed) {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    // Get daily duel pair
    function getDailyDuelPair() {
        if (celebrities.length < 2) return null;

        const seed = getTodaySeed();

        // 1. Select Gender for the day (Odd/Even seed or another random)
        // Let's use a random generator for gender too so it's not just alternating
        const randGender = seededRandom(seed + 99);
        const targetGender = randGender > 0.5 ? 'female' : 'male';

        // 2. Filter by Gender
        const pool = celebrities.filter(c => c.gender === targetGender);

        // If not enough in that gender, fallback to all (shouldn't happen with balanced data)
        const finalPool = pool.length >= 2 ? pool : celebrities;

        // 3. Select 2 distinct from pool
        const rand1 = seededRandom(seed);
        const rand2 = seededRandom(seed + 12345);

        let idx1 = Math.floor(rand1 * finalPool.length);
        let idx2 = Math.floor(rand2 * finalPool.length);

        if (idx1 === idx2) {
            idx2 = (idx2 + 1) % finalPool.length;
        }

        return [finalPool[idx1], finalPool[idx2]];
    }

    function checkDailyVote() {
        const today = getTodaySeed();
        const voteRecord = JSON.parse(localStorage.getItem('dailyDuelVote') || '{}');
        return voteRecord.date === today ? voteRecord : null;
    }

    function saveDailyVote(selectedId) {
        const record = {
            date: getTodaySeed(),
            selectedId: selectedId,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('dailyDuelVote', JSON.stringify(record));
    }

    function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(24, 0, 0, 0);

        const diff = tomorrow - now;

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (duelCountdown) {
            duelCountdown.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    function renderDuel() {
        const pair = getDailyDuelPair();
        if (!pair) {
            duelContainer.innerHTML = '<p class="text-center">Yeterli ünlü yok.</p>';
            return;
        }

        const [celeb1, celeb2] = pair;
        const voteRecord = checkDailyVote();
        const hasVoted = !!voteRecord;

        // Mock percentages (since we don't have a real backend for duel votes yet)
        const seed = getTodaySeed();
        const ratio = seededRandom(seed + 999);
        const pct1 = Math.round(ratio * 100);
        const pct2 = 100 - pct1;

        duelContainer.innerHTML = `
            <div class="duel-card ${hasVoted && voteRecord.selectedId === celeb1.id ? 'selected voted' : ''} ${hasVoted && voteRecord.selectedId !== celeb1.id ? 'loser voted' : ''}" data-id="${celeb1.id}">
                ${hasVoted && voteRecord.selectedId === celeb1.id ? '<div class="winner-crown">👑</div>' : ''}
                <div class="duel-image-container">
                    <img src="${celeb1.photos[0]}" class="duel-image" alt="${celeb1.name}">
                </div>
                <div class="duel-info">
                    <div class="duel-name">${celeb1.name}</div>
                    ${hasVoted ? `<div class="duel-vote-percentage">%${voteRecord.selectedId === celeb1.id ? (pct1 > pct2 ? pct1 : pct2) : (pct1 < pct2 ? pct1 : pct2)}</div>` : ''} 
                    <!-- Simple logic: Winner gets higher pct for demo -->
                </div>
            </div>

            <div class="duel-vs-badge">VS</div>

            <div class="duel-card ${hasVoted && voteRecord.selectedId === celeb2.id ? 'selected voted' : ''} ${hasVoted && voteRecord.selectedId !== celeb2.id ? 'loser voted' : ''}" data-id="${celeb2.id}">
                ${hasVoted && voteRecord.selectedId === celeb2.id ? '<div class="winner-crown">👑</div>' : ''}
                <div class="duel-image-container">
                    <img src="${celeb2.photos[0]}" class="duel-image" alt="${celeb2.name}">
                </div>
                <div class="duel-info">
                    <div class="duel-name">${celeb2.name}</div>
                    ${hasVoted ? `<div class="duel-vote-percentage">%${voteRecord.selectedId === celeb2.id ? (pct1 > pct2 ? pct1 : pct2) : (pct1 < pct2 ? pct1 : pct2)}</div>` : ''}
                </div>
            </div>
        `;

        if (!hasVoted) {
            const cards = duelContainer.querySelectorAll('.duel-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    const selectedId = parseInt(card.dataset.id);
                    // Vote logic
                    saveDailyVote(selectedId);

                    // Also rate the celebrity 10/10 in main list because you picked them?
                    // rateCelebrity(selectedId, 10, null); // Optional: don't auto rate? 
                    // Let's just track duel vote separately for now as requested.

                    soundManager.play('vote');
                    showToast('Harika seçim! Yarın yeni bir düello için gel.', 'success');

                    // Re-render to show results
                    renderDuel();
                });
            });
        }
    }

    if (openDuelBtn) {
        openDuelBtn.addEventListener('click', () => {
            renderDuel();
            duelModal.classList.add('active');
        });
    }

    if (duelCloseBtn) {
        duelCloseBtn.addEventListener('click', () => {
            duelModal.classList.remove('active');
        });
    }

    // Modal outside click
    window.addEventListener('click', (e) => {
        if (e.target === duelModal) {
            duelModal.classList.remove('active');
        }
    });

})();

// ===== SHAREABLE STATS SYSTEM =====
(function initShareSystem() {
    const shareModal = document.getElementById('shareModal');
    const shareCloseBtn = document.getElementById('shareCloseBtn');
    const shareBtnMobile = document.getElementById('shareStatsBtnMobile'); // Mobile button

    const shareCardToCapture = document.getElementById('shareCardToCapture');
    const downloadShareBtn = document.getElementById('downloadShareBtn');

    // Stats Elements
    const shareTotalVotes = document.getElementById('shareTotalVotes');
    const shareBadgesCount = document.getElementById('shareBadgesCount');
    const shareFavList = document.getElementById('shareFavList');
    const shareDate = document.querySelector('.share-card-date');

    // Open Modal Function
    function openShareModal() {
        populateShareCard();
        shareModal.classList.add('active');
    }

    // Populate Data
    function populateShareCard() {
        if (!shareCardToCapture) return;

        // Date
        const now = new Date();
        if (shareDate) {
            shareDate.textContent = now.toLocaleDateString('tr-TR');
        }

        // Stats
        const totalVotes = Object.keys(userVotes).length;
        const earnedBadges = JSON.parse(localStorage.getItem('earnedBadges') || '[]');

        if (shareTotalVotes) shareTotalVotes.textContent = totalVotes;
        if (shareBadgesCount) shareBadgesCount.textContent = earnedBadges.length;

        // Top 3 Favorites (Based on user ratings -> high score)
        // Logic: Get voted celebs, sort by score desc.
        const votedCelebs = [];
        for (const [idStr, score] of Object.entries(userVotes)) {
            const id = parseInt(idStr);
            const celeb = celebrities.find(c => c.id === id);
            if (celeb) {
                votedCelebs.push({ celeb, score });
            }
        }

        // Sort by Score DESC, then Name
        votedCelebs.sort((a, b) => b.score - a.score || a.celeb.name.localeCompare(b.celeb.name));
        const top3 = votedCelebs.slice(0, 3);

        // Render List
        if (shareFavList) {
            shareFavList.innerHTML = '';
            if (top3.length === 0) {
                shareFavList.innerHTML = '<div style="opacity:0.6; font-style:italic;">Henüz favori yok</div>';
            } else {
                top3.forEach((item, index) => {
                    const html = `
                        <div class="share-fav-item">
                            <span class="share-fav-rank">#${index + 1}</span>
                            <img src="${item.celeb.photos[0]}" class="share-fav-img" crossorigin="anonymous">
                            <span class="share-fav-name">${item.celeb.name}</span>
                            <span style="margin-left:auto; color:#ffd700; font-weight:bold;">${item.score}</span>
                        </div>
                    `;
                    shareFavList.innerHTML += html;
                });
            }
        }
    }

    // Capture and Download
    async function downloadCard() {
        if (!shareCardToCapture) return;

        downloadShareBtn.disabled = true;
        downloadShareBtn.textContent = '⏳ Hazırlanıyor...';

        try {
            const canvas = await html2canvas(shareCardToCapture, {
                scale: 2, // Retina quality
                backgroundColor: null,
                useCORS: true, // Important for external images
                logging: false
            });

            // Convert to blob/url
            const image = canvas.toDataURL("image/png");

            // Trigger download
            const link = document.createElement('a');
            link.href = image;
            link.download = `unlu-oylama-istatistik-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Kart indirildi! Hikayende paylaşmayı unutma 📸', 'success');

        } catch (err) {
            console.error('Screenshot failed:', err);
            showToast('Görsel oluşturulamadı. Tarayıcı izinlerini kontrol et.', 'error');
        } finally {
            downloadShareBtn.disabled = false;
            downloadShareBtn.textContent = '⬇️ İndir';
        }
    }

    // Event Listeners
    if (shareBtnMobile) {
        shareBtnMobile.addEventListener('click', openShareModal);
    }

    // Let's add it next to "Rozetlerim" in sidebar footer for completeness
    const sidebarFooter = document.querySelector('.leaderboard-footer');
    if (sidebarFooter && !document.getElementById('shareStatsBtnDesktop')) {
        const btn = document.createElement('button');
        btn.id = 'shareStatsBtnDesktop';
        btn.className = 'view-all-btn';
        btn.innerHTML = '📤 İstatistik Paylaş';
        btn.style.marginTop = '8px';
        btn.style.background = '#667eea';
        btn.addEventListener('click', openShareModal);
        sidebarFooter.insertBefore(btn, sidebarFooter.lastElementChild);
    }

    if (shareCloseBtn) {
        shareCloseBtn.addEventListener('click', () => {
            shareModal.classList.remove('active');
        });
    }

    if (downloadShareBtn) {
        downloadShareBtn.addEventListener('click', downloadCard);
    }

    // Close on outside
    window.addEventListener('click', (e) => {
        if (e.target === shareModal) {
            shareModal.classList.remove('active');
        }
    });

})();
// ===== CAPTCHA CALLBACKS =====
var isCaptchaVerified = false;

window.onCaptchaSuccess = function (token) {
    console.log('Captcha Success:', token);
    isCaptchaVerified = true;
    if (typeof window.updateVoteButton === 'function') {
        window.updateVoteButton();
    }
};

window.onCaptchaExpired = function () {
    console.log('Captcha Expired');
    isCaptchaVerified = false;
    if (typeof window.updateVoteButton === 'function') {
        window.updateVoteButton();
    }
};

// ===== SEO & ROUTING (History API) =====
function updateSEO(celebrity) {
    // 1. Update Title & Meta Tags
    document.title = `${celebrity.name} - Ünlü Oyuncu Puanlama`;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = `${celebrity.name} için güncel puanlama ve yorumlar. Sen de ${celebrity.name} profilini incele ve oy ver!`;
    }

    // Update Open Graph tags for social sharing
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `${celebrity.name} | Ünlü Oyuncu Puanlama`;

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = `Türkiye'nin en popüler oyuncu sıralamasında ${celebrity.name} için sende oy ver! ${celebrity.ratings.length > 0 ? 'Ortalama puanı: ' + getAverageRating(celebrity) + '⭐' : ''}`;

    if (celebrity.photos && celebrity.photos.length > 0) {
        let ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.content = celebrity.photos[0];
    }

    // 2. Structured Data (JSON-LD) for Rich Snippets
    let script = document.getElementById('seo-structured-data');
    if (!script) {
        script = document.createElement('script');
        script.id = 'seo-structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }

    const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Person",
        "name": celebrity.name,
        "url": window.location.href,
        "image": (celebrity.photos && celebrity.photos.length > 0) ? celebrity.photos[0] : ''
    };

    if (celebrity.ratings && celebrity.ratings.length > 0) {
        structuredData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": getAverageRating(celebrity),
            "bestRating": "10",
            "ratingCount": celebrity.ratings.length
        };
    }

    script.textContent = JSON.stringify(structuredData);
}

function updateURL(celebrity) {
    if (history.pushState) {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?celeb=${celebrity.id}`;
        // Prevent pushing duplicate state if jumping rapidly
        const currentUrl = window.location.href;
        if (currentUrl !== newUrl) {
            window.history.replaceState({ path: newUrl }, '', newUrl); // Use replaceState to avoid cluttering history back button during normal browsing
        }
    }
}

// Initial Routing check on load
window.addEventListener('DOMContentLoaded', () => {
    // Run after a short delay to ensure categories and basic data are loaded
    setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const celebIdParam = urlParams.get('celeb');

        if (celebIdParam) {
            const celebId = parseInt(celebIdParam);
            const filteredCelebs = getFilteredCelebrities();
            const index = filteredCelebs.findIndex(c => c.id === celebId);

            if (index !== -1) {
                currentIndex = index;
                renderCelebrity();
            } else {
                // Look in all category if not found in current (maybe default 'all' already covers this)
                const globalIndex = celebrities.findIndex(c => c.id === celebId);
                if (globalIndex !== -1) {
                    setCategory('all');
                    currentIndex = globalIndex;
                    renderCelebrity();
                }
            }
        }
    }, 100);
});
