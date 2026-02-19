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
        const foundIndex = celebrities.findIndex(c => c.id === parseInt(lastViewedId));
        if (foundIndex !== -1) {
            currentIndex = foundIndex;
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

    // Find first unvoted celebrity starting from current index
    let foundIndex = -1;

    // 1. Search forward
    for (let i = currentIndex; i < filtered.length; i++) {
        if (!userVotes.hasOwnProperty(filtered[i].id)) {
            foundIndex = i;
            break;
        }
    }

    // 2. If not found, search from beginning
    if (foundIndex === -1) {
        for (let i = 0; i < currentIndex; i++) {
            if (!userVotes.hasOwnProperty(filtered[i].id)) {
                foundIndex = i;
                break;
            }
        }
    }

    // 3. If still not found (ALL voted)
    if (foundIndex === -1) {
        console.log('Tüm ünlüler oylandı! Yeni ünlüler yükleniyor...');
        celebrityDisplay.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-secondary)">
                <div style="font-size:3rem; margin-bottom:20px;">🎉</div>
                <h3>Harika! Bu kategorideki herkesi oyladınız.</h3>
                <p>Yeni ünlüler ekleniyor...</p>
            </div>
        `;

        // Add new celebrities automatically
        addRandomCelebrities(5);

        // Wait for update then re-render
        setTimeout(() => {
            const newFiltered = getFilteredCelebrities();
            const newIndex = newFiltered.findIndex(c => !userVotes.hasOwnProperty(c.id));

            if (newIndex !== -1) {
                currentIndex = newIndex;
                renderCelebrity();
            } else {
                // Fallback: Just show the first one (voted) if fails
                currentIndex = 0;
                celebrityDisplay.innerHTML = '';
                celebrityDisplay.appendChild(createCelebrityCard(newFiltered[0]));
                updateNavigation();
            }
        }, 1200);
        return;
    }

    // Update current index to the unvoted one
    currentIndex = foundIndex;

    const celebrity = filtered[currentIndex];

    celebrityDisplay.innerHTML = '';
    const card = createCelebrityCard(celebrity);
    celebrityDisplay.appendChild(card);

    updateNavigation();
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

        const ratingWrapper = document.createElement('div');
        ratingWrapper.className = 'rating-wrapper';
        ratingWrapper.style.display = 'flex';
        ratingWrapper.style.flexDirection = 'column';
        ratingWrapper.style.alignItems = 'center';
        ratingWrapper.style.gap = '10px';
        ratingWrapper.style.width = '100%';

        const ratingValueDisplay = document.createElement('div');
        ratingValueDisplay.className = 'rating-value-display';
        ratingValueDisplay.textContent = '5.0 ⭐';
        ratingValueDisplay.style.fontSize = '1.5rem';
        ratingValueDisplay.style.fontWeight = 'bold';
        ratingValueDisplay.style.color = 'var(--accent-color)';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '10';
        slider.step = '0.1'; // Precise 0.1 steps
        slider.value = '5.0';
        slider.className = 'rating-slider';
        slider.style.width = '100%';

        // Function to update slider fill
        const updateSliderFill = (input) => {
            const val = parseFloat(input.value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            const percent = ((val - min) / (max - min)) * 100;

            // Dynamic gradient: Filled part (Gradient) + Empty part (Darker)
            input.style.background = `linear-gradient(90deg, #4facfe 0%, #00f2fe ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
        };

        // Initial fill
        updateSliderFill(slider);

        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value).toFixed(1);
            ratingValueDisplay.textContent = `${val} ⭐`;
            updateSliderFill(e.target);
        });

        const submitBtn = document.createElement('button');
        submitBtn.className = 'submit-rating-btn';
        submitBtn.textContent = 'OY VER';
        submitBtn.style.marginTop = '10px';
        submitBtn.style.padding = '8px 20px';
        submitBtn.style.background = 'var(--primary-gradient)';
        submitBtn.style.border = 'none';
        submitBtn.style.borderRadius = '20px';
        submitBtn.style.color = 'white';
        submitBtn.style.fontWeight = 'bold';
        submitBtn.style.cursor = 'pointer';

        submitBtn.addEventListener('click', () => {
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            submitBtn.textContent = '...';
            const rating = parseFloat(slider.value);
            rateCelebrity(celebrity.id, rating, card);
        });

        ratingWrapper.appendChild(ratingValueDisplay);
        ratingWrapper.appendChild(slider);
        ratingWrapper.appendChild(submitBtn);

        ratingSection.appendChild(ratingWrapper);
        cardContent.appendChild(ratingSection);
    } // End if (!hasVoted)

    card.appendChild(cardContent);

    return card;
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

// Navigation buttons
prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        renderCelebrity();
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

    // Use balanced algorithm instead of linear next
    // logic: Randomly pick next based on vote count weights
    const nextIndex = getNextBalancedIndex(filtered);

    currentIndex = nextIndex;
    renderCelebrity();
});

// Leaderboard state
let currentLeaderboardMode = 'global'; // 'global' or 'personal'

// Render leaderboard
function renderLeaderboard() {
    leaderboardList.innerHTML = '';

    let sortedCelebrities = [];
    let emptyMessage = '';

    if (currentLeaderboardMode === 'global') {
        sortedCelebrities = getSortedCelebrities();
        emptyMessage = 'Henüz oy verilmedi';
    } else {
        // Personal mode: Filter only voted celebrities and sort by user rating
        sortedCelebrities = celebrities
            .filter(c => userVotes.hasOwnProperty(c.id))
            .sort((a, b) => userVotes[b.id] - userVotes[a.id]);
        emptyMessage = 'Henüz hiç oy vermediniz';
    }

    const top10 = sortedCelebrities.slice(0, 10);

    if (top10.length === 0) {
        leaderboardList.innerHTML = `<div style="text-align: center; padding: var(--spacing-lg); color: var(--text-muted); font-size: 0.9rem;">${emptyMessage}</div>`;
        return;
    }

    top10.forEach((celebrity, index) => {
        // For personal mode, rank is just the index + 1
        // For global mode, it's already sorted by average
        const rank = index + 1;
        const item = createLeaderboardItem(celebrity, rank, false);
        leaderboardList.appendChild(item);
    });

    // Show remaining count if there are more than 10
    if (sortedCelebrities.length > 10) {
        const remainingItem = document.createElement('div');
        remainingItem.className = 'leaderboard-remaining';
        remainingItem.textContent = `+${sortedCelebrities.length - 10} diğer oyuncu`;
        leaderboardList.appendChild(remainingItem);
    }
}

// Create leaderboard item
function createLeaderboardItem(celebrity, rank, isUnvoted) {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';

    if (isUnvoted) {
        item.classList.add('unvoted');
    }

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
    name.textContent = celebrity.name;

    const score = document.createElement('div');
    score.className = 'leaderboard-score';

    if (isUnvoted) {
        score.textContent = 'Henüz oylanmadı';
    } else {
        if (currentLeaderboardMode === 'global') {
            const avgRating = getAverageRating(celebrity);
            score.innerHTML = `Ortalama: <span class="leaderboard-score-value">${avgRating} ⭐</span> (${celebrity.ratings.length} oy)`;
        } else {
            const userRating = userVotes[celebrity.id];
            score.innerHTML = `Puanın: <span class="leaderboard-score-value">${userRating} ⭐</span>`;
        }
    }

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
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }

    try {
        // Load photos for all celebrities
        const photoPromises = celebrities.map(async (celebrity) => {
            celebrity.loading = true;
            const photos = await tmdbService.getPersonPhotos(celebrity.name, 4);
            celebrity.photos = photos;
            celebrity.loading = false;
            return celebrity;
        });

        await Promise.all(photoPromises);

        // Filter out celebrities without valid photos (null photos)
        const validCelebrities = celebrities.filter(c => c.photos !== null && c.photos.length > 0);
        const removedCount = celebrities.length - validCelebrities.length;

        if (removedCount > 0) {
            console.log(`Filtered out ${removedCount} celebrities without valid photos`);
            console.log(`Remaining celebrities: ${validCelebrities.length}`);
        }

        // Update celebrities array with only valid ones
        celebrities = validCelebrities;

        // Update saved order to only include valid celebrities
        const validOrderIds = validCelebrities.map(c => c.id);
        localStorage.setItem('celebrityOrder', JSON.stringify(validOrderIds));

        console.log('All celebrity photos loaded and validated successfully');
    } catch (error) {
        console.error('Error loading celebrity photos:', error);
    } finally {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }
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
    console.log('Sayfa yüklendi, uygulama başlatılıyor...');

    // Initialize celebrity service with Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        celebrityService.init(supabaseClient);
        console.log('✅ Supabase başarıyla başlatıldı');
        showToast('Supabase bağlantısı kuruldu', 'success');
    } else {
        console.warn('⚠️ Supabase client bulunamadı! Sadece localStorage kullanılacak.');
        showToast('Supabase bağlantısı kurulamadı', 'warning');
    }

    loadData();
    loadTheme();
    loadLeaderboardPosition();
    loadLeaderboardHeight();
    loadLeaderboardWidth();

    // Load celebrity photos from TMDb
    await loadCelebrityPhotos();

    renderCelebrity();
    renderLeaderboard();


    console.log('✅ Uygulama başarıyla başlatıldı');

    // Hide loading overlay
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(() => overlay.remove(), 600);
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
