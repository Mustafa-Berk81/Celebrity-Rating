// Celebrity View Tracking and Dynamic Addition Service

class CelebrityService {
    constructor() {
        this.userSession = this.getUserSession();
        this.supabase = null;
    }

    // Initialize with Supabase client
    init(supabaseClient) {
        this.supabase = supabaseClient;
        console.log('CelebrityService initialized');
    }

    // Get or create user session ID
    getUserSession() {
        let session = localStorage.getItem('userSession');
        if (!session) {
            session = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userSession', session);
        }
        return session;
    }

    // Track celebrity view
    async trackView(celebrityId) {
        if (!this.supabase) return;

        try {
            await this.supabase
                .from('celebrity_views')
                .insert({
                    celebrity_id: celebrityId,
                    user_session: this.userSession
                });

            const { data } = await this.supabase
                .from('celebrities')
                .select('view_count')
                .eq('id', celebrityId)
                .single();

            if (data) {
                await this.supabase
                    .from('celebrities')
                    .update({ view_count: (data.view_count || 0) + 1 })
                    .eq('id', celebrityId);
            }
        } catch (error) {
            console.error('Error tracking view:', error);
        }
    }

    // Get celebrities sorted by view count (ascending)
    async getCelebritiesByViewCount() {
        if (!this.supabase) return [];

        try {
            const { data, error } = await this.supabase
                .from('celebrities')
                .select('*')
                .order('view_count', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching celebrities:', error);
            return [];
        }
    }

    // Sync local celebrities to Supabase
    async syncCelebrities(localCelebrities) {
        if (!this.supabase) return;

        try {
            for (const celeb of localCelebrities) {
                const { data } = await this.supabase
                    .from('celebrities')
                    .select('id')
                    .eq('id', celeb.id)
                    .single();

                if (!data) {
                    await this.supabase
                        .from('celebrities')
                        .insert({
                            id: celeb.id,
                            name: celeb.name,
                            gender: celeb.gender,
                            view_count: 0
                        });
                }
            }
        } catch (error) {
            console.error('Error syncing celebrities:', error);
        }
    }

    // Get weighted random celebrity (prioritize less-viewed)
    getWeightedRandomIndex(celebrities) {
        const weights = celebrities.map(c => 1 / ((c.view_count || 0) + 1));
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        let random = Math.random() * totalWeight;
        for (let i = 0; i < celebrities.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return i;
            }
        }
        return 0;
    }

    // Add new celebrities from TMDb
    async addNewCelebrities(count = 5) {
        if (!this.supabase) return [];

        try {
            const newCelebs = await tmdbService.getRandomCelebrities(count);
            const addedCelebs = [];

            for (const celeb of newCelebs) {
                const photos = await tmdbService.getPersonPhotos(celeb.name, 2);
                if (photos && photos.length > 0) {
                    celeb.photos = photos;
                    celeb.ratings = [];
                    celeb.viewCount = 0;

                    await this.supabase
                        .from('celebrities')
                        .insert({
                            id: celeb.id,
                            name: celeb.name,
                            gender: celeb.gender,
                            view_count: 0
                        });

                    addedCelebs.push(celeb);
                }
            }

            return addedCelebs;
        } catch (error) {
            console.error('Error adding new celebrities:', error);
            return [];
        }
    }
}

// Create global instance
const celebrityService = new CelebrityService();
