// Celebrity Data - 200+ Celebrities from around the world
const celebritiesBase = [
    // ========== MALE CELEBRITIES (100) ==========

    // TRENDING MALE (10)
    { id: 1, name: "Glen Powell", gender: "male", photos: [], ratings: [], loading: false },
    { id: 2, name: "Jacob Elordi", gender: "male", photos: [], ratings: [], loading: false },
    { id: 3, name: "Austin Butler", gender: "male", photos: [], ratings: [], loading: false },
    { id: 4, name: "Jeremy Allen White", gender: "male", photos: [], ratings: [], loading: false },
    { id: 5, name: "Paul Mescal", gender: "male", photos: [], ratings: [], loading: false },
    { id: 6, name: "Barry Keoghan", gender: "male", photos: [], ratings: [], loading: false },
    { id: 7, name: "Pedro Pascal", gender: "male", photos: [], ratings: [], loading: false },
    { id: 8, name: "Timothée Chalamet", gender: "male", photos: [], ratings: [], loading: false },
    { id: 9, name: "Jonathan Majors", gender: "male", photos: [], ratings: [], loading: false },
    { id: 10, name: "Simu Liu", gender: "male", photos: [], ratings: [], loading: false },

    // NORTH AMERICA - USA/Canada (20)
    { id: 11, name: "Leonardo DiCaprio", gender: "male", photos: [], ratings: [], loading: false },
    { id: 12, name: "Tom Hanks", gender: "male", photos: [], ratings: [], loading: false },
    { id: 13, name: "Denzel Washington", gender: "male", photos: [], ratings: [], loading: false },
    { id: 14, name: "Robert Downey Jr.", gender: "male", photos: [], ratings: [], loading: false },
    { id: 15, name: "Brad Pitt", gender: "male", photos: [], ratings: [], loading: false },
    { id: 16, name: "Tom Cruise", gender: "male", photos: [], ratings: [], loading: false },
    { id: 17, name: "Morgan Freeman", gender: "male", photos: [], ratings: [], loading: false },
    { id: 18, name: "Will Smith", gender: "male", photos: [], ratings: [], loading: false },
    { id: 19, name: "Christian Bale", gender: "male", photos: [], ratings: [], loading: false },
    { id: 20, name: "Matt Damon", gender: "male", photos: [], ratings: [], loading: false },
    { id: 21, name: "Ryan Gosling", gender: "male", photos: [], ratings: [], loading: false },
    { id: 22, name: "Chris Evans", gender: "male", photos: [], ratings: [], loading: false },
    { id: 23, name: "Robert De Niro", gender: "male", photos: [], ratings: [], loading: false },
    { id: 24, name: "Johnny Depp", gender: "male", photos: [], ratings: [], loading: false },
    { id: 25, name: "Keanu Reeves", gender: "male", photos: [], ratings: [], loading: false },
    { id: 26, name: "Tom Holland", gender: "male", photos: [], ratings: [], loading: false },
    { id: 27, name: "Michael B. Jordan", gender: "male", photos: [], ratings: [], loading: false },
    { id: 28, name: "Jake Gyllenhaal", gender: "male", photos: [], ratings: [], loading: false },
    { id: 29, name: "Ryan Reynolds", gender: "male", photos: [], ratings: [], loading: false },
    { id: 30, name: "Dwayne Johnson", gender: "male", photos: [], ratings: [], loading: false },

    // ASIA / K-Pop / Drama (25)
    { id: 31, name: "V (Kim Tae-hyung)", gender: "male", photos: [], ratings: [], loading: false },
    { id: 32, name: "Jimin", gender: "male", photos: [], ratings: [], loading: false },
    { id: 33, name: "Song Kang", gender: "male", photos: [], ratings: [], loading: false },
    { id: 34, name: "Lee Min-ho", gender: "male", photos: [], ratings: [], loading: false },
    { id: 35, name: "Gong Yoo", gender: "male", photos: [], ratings: [], loading: false },
    { id: 36, name: "Song Joong-ki", gender: "male", photos: [], ratings: [], loading: false },
    { id: 37, name: "Park Seo-joon", gender: "male", photos: [], ratings: [], loading: false },
    { id: 38, name: "Hyun Bin", gender: "male", photos: [], ratings: [], loading: false },
    { id: 39, name: "Woo Do-hwan", gender: "male", photos: [], ratings: [], loading: false },
    { id: 40, name: "Rowoon", gender: "male", photos: [], ratings: [], loading: false },
    { id: 41, name: "Shah Rukh Khan", gender: "male", photos: [], ratings: [], loading: false },
    { id: 42, name: "Hrithik Roshan", gender: "male", photos: [], ratings: [], loading: false },
    { id: 43, name: "Ranveer Singh", gender: "male", photos: [], ratings: [], loading: false },
    { id: 44, name: "Ranbir Kapoor", gender: "male", photos: [], ratings: [], loading: false },
    { id: 45, name: "Aamir Khan", gender: "male", photos: [], ratings: [], loading: false },
    { id: 46, name: "Tony Leung", gender: "male", photos: [], ratings: [], loading: false },
    { id: 47, name: "Donnie Yen", gender: "male", photos: [], ratings: [], loading: false },
    { id: 48, name: "Andy Lau", gender: "male", photos: [], ratings: [], loading: false },
    { id: 49, name: "Takeshi Kaneshiro", gender: "male", photos: [], ratings: [], loading: false },
    { id: 50, name: "Ken Watanabe", gender: "male", photos: [], ratings: [], loading: false },
    { id: 51, name: "Mario Maurer", gender: "male", photos: [], ratings: [], loading: false },
    { id: 52, name: "Bright Vachirawit", gender: "male", photos: [], ratings: [], loading: false },
    { id: 53, name: "Alden Richards", gender: "male", photos: [], ratings: [], loading: false },
    { id: 54, name: "Daniel Padilla", gender: "male", photos: [], ratings: [], loading: false },
    { id: 55, name: "Iko Uwais", gender: "male", photos: [], ratings: [], loading: false },

    // EUROPE (20)
    { id: 56, name: "Daniel Craig", gender: "male", photos: [], ratings: [], loading: false },
    { id: 57, name: "Benedict Cumberbatch", gender: "male", photos: [], ratings: [], loading: false },
    { id: 58, name: "Tom Hiddleston", gender: "male", photos: [], ratings: [], loading: false },
    { id: 59, name: "Idris Elba", gender: "male", photos: [], ratings: [], loading: false },
    { id: 60, name: "Colin Firth", gender: "male", photos: [], ratings: [], loading: false },
    { id: 61, name: "Jean Dujardin", gender: "male", photos: [], ratings: [], loading: false },
    { id: 62, name: "Omar Sy", gender: "male", photos: [], ratings: [], loading: false },
    { id: 63, name: "Javier Bardem", gender: "male", photos: [], ratings: [], loading: false },
    { id: 64, name: "Antonio Banderas", gender: "male", photos: [], ratings: [], loading: false },
    { id: 65, name: "Cillian Murphy", gender: "male", photos: [], ratings: [], loading: false },
    { id: 66, name: "Til Schweiger", gender: "male", photos: [], ratings: [], loading: false },
    { id: 67, name: "Mads Mikkelsen", gender: "male", photos: [], ratings: [], loading: false },
    { id: 68, name: "Alexander Skarsgård", gender: "male", photos: [], ratings: [], loading: false },
    { id: 69, name: "Nikolaj Coster-Waldau", gender: "male", photos: [], ratings: [], loading: false },
    { id: 70, name: "Stellan Skarsgård", gender: "male", photos: [], ratings: [], loading: false },
    { id: 71, name: "Henry Cavill", gender: "male", photos: [], ratings: [], loading: false },
    { id: 72, name: "Robert Pattinson", gender: "male", photos: [], ratings: [], loading: false },
    { id: 73, name: "Andrew Garfield", gender: "male", photos: [], ratings: [], loading: false },
    { id: 74, name: "Taron Egerton", gender: "male", photos: [], ratings: [], loading: false },
    { id: 75, name: "Luke Evans", gender: "male", photos: [], ratings: [], loading: false },

    // LATIN AMERICA & TURKEY & OTHERS (25)
    { id: 76, name: "Bad Bunny", gender: "male", photos: [], ratings: [], loading: false },
    { id: 77, name: "Maluma", gender: "male", photos: [], ratings: [], loading: false },
    { id: 78, name: "Gael García Bernal", gender: "male", photos: [], ratings: [], loading: false },
    { id: 79, name: "Diego Luna", gender: "male", photos: [], ratings: [], loading: false },
    { id: 80, name: "Wagner Moura", gender: "male", photos: [], ratings: [], loading: false },
    { id: 81, name: "Rodrigo Santoro", gender: "male", photos: [], ratings: [], loading: false },
    { id: 82, name: "Ricardo Darín", gender: "male", photos: [], ratings: [], loading: false },
    { id: 83, name: "Chris Hemsworth", gender: "male", photos: [], ratings: [], loading: false },
    { id: 84, name: "Hugh Jackman", gender: "male", photos: [], ratings: [], loading: false },
    { id: 85, name: "Russell Crowe", gender: "male", photos: [], ratings: [], loading: false },
    { id: 86, name: "Kıvanç Tatlıtuğ", gender: "male", photos: [], ratings: [], loading: false },
    { id: 87, name: "Çağatay Ulusoy", gender: "male", photos: [], ratings: [], loading: false },
    { id: 88, name: "Burak Özçivit", gender: "male", photos: [], ratings: [], loading: false },
    { id: 89, name: "Can Yaman", gender: "male", photos: [], ratings: [], loading: false },
    { id: 90, name: "Aras Bulut İynemli", gender: "male", photos: [], ratings: [], loading: false },
    { id: 91, name: "Kerem Bürsin", gender: "male", photos: [], ratings: [], loading: false },
    { id: 92, name: "Mert Ramazan Demir", gender: "male", photos: [], ratings: [], loading: false },
    { id: 93, name: "Barış Arduç", gender: "male", photos: [], ratings: [], loading: false },
    { id: 94, name: "Tamer Hosny", gender: "male", photos: [], ratings: [], loading: false },
    { id: 95, name: "Mena Massoud", gender: "male", photos: [], ratings: [], loading: false },
    { id: 96, name: "Rami Malek", gender: "male", photos: [], ratings: [], loading: false },
    { id: 97, name: "Oscar Isaac", gender: "male", photos: [], ratings: [], loading: false },
    { id: 98, name: "Jason Momoa", gender: "male", photos: [], ratings: [], loading: false },
    { id: 99, name: "Dev Patel", gender: "male", photos: [], ratings: [], loading: false },
    { id: 100, name: "Riz Ahmed", gender: "male", photos: [], ratings: [], loading: false },


    // ========== FEMALE CELEBRITIES (100) ==========

    // TRENDING FEMALE (10)
    { id: 101, name: "Sydney Sweeney", gender: "female", photos: [], ratings: [], loading: false },
    { id: 102, name: "Jenna Ortega", gender: "female", photos: [], ratings: [], loading: false },
    { id: 103, name: "Florence Pugh", gender: "female", photos: [], ratings: [], loading: false },
    { id: 104, name: "Zendaya", gender: "female", photos: [], ratings: [], loading: false },
    { id: 105, name: "Anya Taylor-Joy", gender: "female", photos: [], ratings: [], loading: false },
    { id: 106, name: "Bella Ramsey", gender: "female", photos: [], ratings: [], loading: false },
    { id: 107, name: "Milly Alcock", gender: "female", photos: [], ratings: [], loading: false },
    { id: 108, name: "Mia Goth", gender: "female", photos: [], ratings: [], loading: false },
    { id: 109, name: "Ayo Edebiri", gender: "female", photos: [], ratings: [], loading: false },
    { id: 110, name: "Rachel Zegler", gender: "female", photos: [], ratings: [], loading: false },

    // NORTH AMERICA - USA/Canada (20)
    { id: 111, name: "Meryl Streep", gender: "female", photos: [], ratings: [], loading: false },
    { id: 112, name: "Scarlett Johansson", gender: "female", photos: [], ratings: [], loading: false },
    { id: 113, name: "Emma Stone", gender: "female", photos: [], ratings: [], loading: false },
    { id: 114, name: "Margot Robbie", gender: "female", photos: [], ratings: [], loading: false },
    { id: 115, name: "Jennifer Lawrence", gender: "female", photos: [], ratings: [], loading: false },
    { id: 116, name: "Natalie Portman", gender: "female", photos: [], ratings: [], loading: false },
    { id: 117, name: "Emma Watson", gender: "female", photos: [], ratings: [], loading: false },
    { id: 118, name: "Anne Hathaway", gender: "female", photos: [], ratings: [], loading: false },
    { id: 119, name: "Charlize Theron", gender: "female", photos: [], ratings: [], loading: false },
    { id: 120, name: "Angelina Jolie", gender: "female", photos: [], ratings: [], loading: false },
    { id: 121, name: "Brie Larson", gender: "female", photos: [], ratings: [], loading: false },
    { id: 122, name: "Emily Blunt", gender: "female", photos: [], ratings: [], loading: false },
    { id: 123, name: "Amy Adams", gender: "female", photos: [], ratings: [], loading: false },
    { id: 124, name: "Jessica Chastain", gender: "female", photos: [], ratings: [], loading: false },
    { id: 125, name: "Viola Davis", gender: "female", photos: [], ratings: [], loading: false },
    { id: 126, name: "Sandra Bullock", gender: "female", photos: [], ratings: [], loading: false },
    { id: 127, name: "Julia Roberts", gender: "female", photos: [], ratings: [], loading: false },
    { id: 128, name: "Reese Witherspoon", gender: "female", photos: [], ratings: [], loading: false },
    { id: 129, name: "Jennifer Aniston", gender: "female", photos: [], ratings: [], loading: false },
    { id: 130, name: "Miley Cyrus", gender: "female", photos: [], ratings: [], loading: false },

    // ASIA / K-Pop / Drama (25)
    { id: 131, name: "Lisa (Lalisa Manobal)", gender: "female", photos: [], ratings: [], loading: false },
    { id: 132, name: "Jennie Kim", gender: "female", photos: [], ratings: [], loading: false },
    { id: 133, name: "Jisoo", gender: "female", photos: [], ratings: [], loading: false },
    { id: 134, name: "Song Hye-kyo", gender: "female", photos: [], ratings: [], loading: false },
    { id: 135, name: "Han So-hee", gender: "female", photos: [], ratings: [], loading: false },
    { id: 136, name: "IU", gender: "female", photos: [], ratings: [], loading: false },
    { id: 137, name: "Bae Suzy", gender: "female", photos: [], ratings: [], loading: false },
    { id: 138, name: "Park Shin-hye", gender: "female", photos: [], ratings: [], loading: false },
    { id: 139, name: "Priyanka Chopra", gender: "female", photos: [], ratings: [], loading: false },
    { id: 140, name: "Deepika Padukone", gender: "female", photos: [], ratings: [], loading: false },
    { id: 141, name: "Aishwarya Rai", gender: "female", photos: [], ratings: [], loading: false },
    { id: 142, name: "Alia Bhatt", gender: "female", photos: [], ratings: [], loading: false },
    { id: 143, name: "Katrina Kaif", gender: "female", photos: [], ratings: [], loading: false },
    { id: 144, name: "Zhang Ziyi", gender: "female", photos: [], ratings: [], loading: false },
    { id: 145, name: "Gong Li", gender: "female", photos: [], ratings: [], loading: false },
    { id: 146, name: "Fan Bingbing", gender: "female", photos: [], ratings: [], loading: false },
    { id: 147, name: "Liu Yifei", gender: "female", photos: [], ratings: [], loading: false },
    { id: 148, name: "Satomi Ishihara", gender: "female", photos: [], ratings: [], loading: false },
    { id: 149, name: "Yui Aragaki", gender: "female", photos: [], ratings: [], loading: false },
    { id: 150, name: "Davika Hoorne", gender: "female", photos: [], ratings: [], loading: false },
    { id: 151, name: "Yaya Urassaya", gender: "female", photos: [], ratings: [], loading: false },
    { id: 152, name: "Kathryn Bernardo", gender: "female", photos: [], ratings: [], loading: false },
    { id: 153, name: "Liza Soberano", gender: "female", photos: [], ratings: [], loading: false },
    { id: 154, name: "Urassaya Sperbund", gender: "female", photos: [], ratings: [], loading: false },
    { id: 155, name: "Kim Go-eun", gender: "female", photos: [], ratings: [], loading: false },

    // EUROPE (20)
    { id: 156, name: "Cate Blanchett", gender: "female", photos: [], ratings: [], loading: false },
    { id: 157, name: "Keira Knightley", gender: "female", photos: [], ratings: [], loading: false },
    { id: 158, name: "Saoirse Ronan", gender: "female", photos: [], ratings: [], loading: false },
    { id: 159, name: "Emilia Clarke", gender: "female", photos: [], ratings: [], loading: false },
    { id: 160, name: "Marion Cotillard", gender: "female", photos: [], ratings: [], loading: false },
    { id: 161, name: "Léa Seydoux", gender: "female", photos: [], ratings: [], loading: false },
    { id: 162, name: "Penélope Cruz", gender: "female", photos: [], ratings: [], loading: false },
    { id: 163, name: "Monica Bellucci", gender: "female", photos: [], ratings: [], loading: false },
    { id: 164, name: "Sophia Loren", gender: "female", photos: [], ratings: [], loading: false },
    { id: 165, name: "Diane Kruger", gender: "female", photos: [], ratings: [], loading: false },
    { id: 166, name: "Alicia Vikander", gender: "female", photos: [], ratings: [], loading: false },
    { id: 167, name: "Noomi Rapace", gender: "female", photos: [], ratings: [], loading: false },
    { id: 168, name: "Gal Gadot", gender: "female", photos: [], ratings: [], loading: false },
    { id: 169, name: "Tilda Swinton", gender: "female", photos: [], ratings: [], loading: false },
    { id: 170, name: "Nicole Kidman", gender: "female", photos: [], ratings: [], loading: false },
    { id: 171, name: "Adele", gender: "female", photos: [], ratings: [], loading: false },
    { id: 172, name: "Dua Lipa", gender: "female", photos: [], ratings: [], loading: false },
    { id: 173, name: "Millie Bobby Brown", gender: "female", photos: [], ratings: [], loading: false },
    { id: 174, name: "Sophie Turner", gender: "female", photos: [], ratings: [], loading: false },
    { id: 175, name: "Daisy Edgar-Jones", gender: "female", photos: [], ratings: [], loading: false },

    // LATIN AMERICA & TURKEY & OTHERS (25)
    { id: 176, name: "Salma Hayek", gender: "female", photos: [], ratings: [], loading: false },
    { id: 177, name: "Eiza González", gender: "female", photos: [], ratings: [], loading: false },
    { id: 178, name: "Ana de Armas", gender: "female", photos: [], ratings: [], loading: false },
    { id: 179, name: "Alice Braga", gender: "female", photos: [], ratings: [], loading: false },
    { id: 180, name: "Sônia Braga", gender: "female", photos: [], ratings: [], loading: false },
    { id: 181, name: "Rosalía", gender: "female", photos: [], ratings: [], loading: false },
    { id: 182, name: "Karol G", gender: "female", photos: [], ratings: [], loading: false },
    { id: 183, name: "Shakira", gender: "female", photos: [], ratings: [], loading: false },
    { id: 184, name: "Anitta", gender: "female", photos: [], ratings: [], loading: false },
    { id: 185, name: "Naomi Watts", gender: "female", photos: [], ratings: [], loading: false },
    { id: 186, name: "Rose Byrne", gender: "female", photos: [], ratings: [], loading: false },
    { id: 187, name: "Hande Erçel", gender: "female", photos: [], ratings: [], loading: false },
    { id: 188, name: "Demet Özdemir", gender: "female", photos: [], ratings: [], loading: false },
    { id: 189, name: "Serenay Sarıkaya", gender: "female", photos: [], ratings: [], loading: false },
    { id: 190, name: "Beren Saat", gender: "female", photos: [], ratings: [], loading: false },
    { id: 191, name: "Tuba Büyüküstün", gender: "female", photos: [], ratings: [], loading: false },
    { id: 192, name: "Afra Saraçoğlu", gender: "female", photos: [], ratings: [], loading: false },
    { id: 193, name: "Pınar Deniz", gender: "female", photos: [], ratings: [], loading: false },
    { id: 194, name: "Neslihan Atagül", gender: "female", photos: [], ratings: [], loading: false },
    { id: 195, name: "Yousra", gender: "female", photos: [], ratings: [], loading: false },
    { id: 196, name: "Cyrine Abdelnour", gender: "female", photos: [], ratings: [], loading: false },
    { id: 197, name: "Lupita Nyong'o", gender: "female", photos: [], ratings: [], loading: false },
    { id: 198, name: "Thuso Mbedu", gender: "female", photos: [], ratings: [], loading: false },
    { id: 199, name: "Charlize Theron", gender: "female", photos: [], ratings: [], loading: false },
    { id: 200, name: "Michelle Yeoh", gender: "female", photos: [], ratings: [], loading: false },
];

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initialize celebrities with shuffle
function initializeCelebrities() {
    const savedOrder = localStorage.getItem('celebrityOrder');

    if (savedOrder) {
        // Use saved order
        const orderIds = JSON.parse(savedOrder);
        // Ensure new celebrities are added to the end if not in saved order
        const savedCelebs = orderIds.map(id => celebritiesBase.find(c => c.id === id)).filter(Boolean);
        const newCelebs = celebritiesBase.filter(c => !orderIds.includes(c.id));
        return [...savedCelebs, ...shuffleArray(newCelebs)];
    } else {
        // Create new random order
        const shuffled = shuffleArray(celebritiesBase);
        const orderIds = shuffled.map(c => c.id);
        localStorage.setItem('celebrityOrder', JSON.stringify(orderIds));
        return shuffled;
    }
}

// Initialize celebrities array with random order
let celebrities = initializeCelebrities();

let currentIndex = 0;
let userVotes = {}; // Track which celebrities the user has voted for
let currentCategory = 'all'; // 'all', 'male', 'female'

// Get filtered celebrities based on category
function getFilteredCelebrities() {
    if (currentCategory === 'all') {
        return celebrities;
    }
    return celebrities.filter(c => c.gender === currentCategory);
}
