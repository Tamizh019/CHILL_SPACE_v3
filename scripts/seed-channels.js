const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cmriyjrqkvpdchvbpnne.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcml5anJxa3ZwZGNodmJwbm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzcyODYsImV4cCI6MjA2ODQxMzI4Nn0.wWRO5jZuUfrMPV8A3J7j36yweLe4o-uIcSZYaMhY4O8';

const supabase = createClient(supabaseUrl, supabaseKey);

const channels = [
    { name: 'General', description: 'The main hangout spot for everyone.' },
    { name: 'Announcements', description: 'Important updates and news.' },
    { name: 'Coding & Dev', description: 'Talk about code, bugs, and tech.' },
    { name: 'Music Lounge', description: 'Share your playlists and jams.' },
    { name: 'Exam Prep', description: 'Study together and crush those exams.' }
];

async function seedChannels() {
    console.log('🌱 Seeding channels...');

    for (const channel of channels) {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .eq('name', channel.name)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" (JSON) or similar
            console.error(`Error checking channel ${channel.name}:`, error.message);
            continue;
        }

        if (!data) {
            const { error: insertError } = await supabase
                .from('channels')
                .insert([channel]);

            if (insertError) {
                console.error(`Error inserting ${channel.name}:`, insertError.message);
            } else {
                console.log(`✅ Created channel: ${channel.name}`);
            }
        } else {
            console.log(`ℹ️ Channel already exists: ${channel.name}`);
        }
    }
    console.log('✨ Seeding complete!');
}

seedChannels();
