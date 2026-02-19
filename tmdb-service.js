// TMDb API Service
class TMDbService {
    constructor() {
        this.apiKey = CONFIG.API_KEY;
        this.baseUrl = CONFIG.BASE_URL;
        this.imageBaseUrl = CONFIG.IMAGE_BASE_URL;
    }

    // Search for a person by name
    async searchPerson(name) {
        try {
            const url = `${this.baseUrl}/search/person?api_key=${this.apiKey}&query=${encodeURIComponent(name)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                return data.results[0]; // Return first match
            }

            return null;
        } catch (error) {
            console.error(`Error searching for ${name}:`, error);
            return null;
        }
    }

    // Get person details including images
    async getPersonDetails(personId) {
        try {
            const url = `${this.baseUrl}/person/${personId}?api_key=${this.apiKey}&append_to_response=images`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error getting person details for ID ${personId}:`, error);
            return null;
        }
    }

    // Get person images
    async getPersonImages(personId) {
        try {
            const url = `${this.baseUrl}/person/${personId}/images?api_key=${this.apiKey}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.profiles || [];
        } catch (error) {
            console.error(`Error getting images for person ID ${personId}:`, error);
            return [];
        }
    }

    // Get image URL
    getImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${this.imageBaseUrl}/${size}${path}`;
    }

    // Get multiple photos for a person (profile + additional images)
    // Returns null if no valid photos found (for filtering)
    async getPersonPhotos(name, count = 2) {
        try {
            // Search for person
            const person = await this.searchPerson(name);

            if (!person) {
                console.warn(`Person not found in TMDb: ${name}`);
                return null; // Return null to filter out
            }

            // Check if person has a profile photo (guaranteed to show face)
            if (!person.profile_path) {
                console.warn(`No profile photo for: ${name}`);
                return null; // Return null to filter out
            }

            // Get person images
            const images = await this.getPersonImages(person.id);

            const photos = [];

            // Sort images to prioritize profile photos (which show faces)
            // Profile photos are curated by TMDb to show the person's face
            const sortedImages = [...images].sort((a, b) => {
                // Prioritize images with higher vote average (popular photos)
                const voteA = a.vote_average || 0;
                const voteB = b.vote_average || 0;

                // Also consider aspect ratio - portrait photos (0.667) are more likely to show faces
                const aspectA = a.aspect_ratio || 1;
                const aspectB = b.aspect_ratio || 1;

                // Portrait photos have aspect ratio around 0.667 (2:3)
                const isPortraitA = Math.abs(aspectA - 0.667) < 0.15;
                const isPortraitB = Math.abs(aspectB - 0.667) < 0.15;

                // Combine vote average and portrait preference
                const scoreA = voteA * 10 + (isPortraitA ? 5 : 0);
                const scoreB = voteB * 10 + (isPortraitB ? 5 : 0);

                return scoreB - scoreA;
            });

            // Add profile photo first (highest resolution - original)
            // Profile photos are guaranteed to show the person's face
            photos.push(this.getImageUrl(person.profile_path, 'original'));

            // Add additional portrait images (likely to show faces)
            for (let i = 0; i < sortedImages.length && photos.length < count; i++) {
                const img = sortedImages[i];
                // Skip if it's the same as profile photo
                if (img.file_path && img.file_path !== person.profile_path) {
                    // Only add portrait-oriented images (more likely to show face)
                    const isPortrait = Math.abs((img.aspect_ratio || 1) - 0.667) < 0.15;
                    if (isPortrait) {
                        photos.push(this.getImageUrl(img.file_path, 'original'));
                    }
                }
            }

            // If we don't have enough photos, return what we have
            // Don't use placeholders - we want to filter out celebrities without enough photos
            if (photos.length === 0) {
                console.warn(`No valid photos found for: ${name}`);
                return null; // Return null to filter out
            }

            return photos;
        } catch (error) {
            console.error(`Error getting photos for ${name}:`, error);
            return null; // Return null to filter out on error
        }
    }

    // Get placeholder photo
    getPlaceholderPhoto() {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23667eea" width="200" height="200"/%3E%3Ctext fill="%23fff" font-family="Arial" font-size="60" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E';
    }

    // Get placeholder photos array
    getPlaceholderPhotos(count = 3) {
        return Array(count).fill(this.getPlaceholderPhoto());
    }

    // Get random celebrities from TMDb
    async getRandomCelebrities(count = 5) {
        try {
            const randomPage = Math.floor(Math.random() * 10) + 1;
            const response = await fetch(
                `${this.baseUrl}/person/popular?api_key=${this.apiKey}&page=${randomPage}`
            );

            if (!response.ok) throw new Error('Failed to fetch popular people');

            const data = await response.json();
            const people = data.results || [];
            const shuffled = people.sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, count);

            return selected.map(person => ({
                id: person.id,
                name: person.name,
                gender: person.gender === 1 ? 'female' : 'male',
                photos: [],
                ratings: [],
                loading: false
            }));
        } catch (error) {
            console.error('Error getting random celebrities:', error);
            return [];
        }
    }
}

// Create global instance
const tmdbService = new TMDbService();
