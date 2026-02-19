// Supabase Configuration
const SUPABASE_URL = 'https://jxebkcgoktffzxkztrdm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JW5mqFzRh9qHibG8Y_7wqQ_RZ1dgjqR';

// Initialize Supabase client (using CDN)
// Wait for window.supabase to be available from CDN
let supabaseClient = null;

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && window.supabase) {
        console.log('✅ Supabase CDN library yüklendi');
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client başarıyla oluşturuldu');

        // Initialize celebrity service with Supabase client
        if (typeof celebrityService !== 'undefined') {
            celebrityService.init(supabaseClient);
        }
    } else {
        console.error('❌ Supabase CDN library yüklenemedi');
    }
});


/*
Database Schema (Run this in Supabase SQL Editor):

-- Create celebrities table
CREATE TABLE celebrities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    added_at TIMESTAMP DEFAULT NOW()
);

-- Create celebrity_views table for tracking
CREATE TABLE celebrity_views (
    id SERIAL PRIMARY KEY,
    celebrity_id INTEGER REFERENCES celebrities(id),
    viewed_at TIMESTAMP DEFAULT NOW(),
    user_session TEXT
);

-- Create index for faster queries
CREATE INDEX idx_celebrity_views_celebrity_id ON celebrity_views(celebrity_id);
CREATE INDEX idx_celebrities_view_count ON celebrities(view_count);

-- Create ratings table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    celebrity_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    user_session TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for ratings
CREATE INDEX idx_ratings_celebrity_id ON ratings(celebrity_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrity_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access" ON celebrities FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON celebrity_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON celebrity_views FOR SELECT USING (true);
CREATE POLICY "Allow public read access on ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ratings" ON ratings FOR INSERT WITH CHECK (true);
*/

// supabaseClient is now globally available (no export needed for script tags)
