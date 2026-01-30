import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function GreetingSection() {
    const [greeting, setGreeting] = useState('Good evening');
    const [userName, setUserName] = useState('User');
    const supabase = createClient();

    useEffect(() => {
        // Set Greeting
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good morning');
        } else if (hour < 17) {
            setGreeting('Good afternoon');
        } else {
            setGreeting('Good evening');
        }

        // Fetch User
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to get profile
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('username')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('GreetingSection: Error fetching user profile:', error.message);
                    setUserName(user.email?.split('@')[0] || 'User');
                } else if (profile?.username) {
                    setUserName(profile.username);
                } else {
                    setUserName(user.email?.split('@')[0] || 'User');
                }
            }
        };

        fetchUser();
    }, []);

    return (
        <div className="relative rounded-2xl overflow-hidden p-8 border border-white/5 min-h-[160px] flex flex-col justify-center">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 via-black to-black opacity-80 z-0" />

            {/* Starfield Pattern */}
            <div
                className="absolute inset-0 opacity-30 z-0"
                style={{
                    backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0))
          `,
                    backgroundRepeat: 'repeat',
                    backgroundSize: '200px 200px',
                }}
            />

            {/* Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Content */}
            <div className="relative z-10">
                <h1 className="text-4xl font-light text-white tracking-tight">
                    {greeting}, {userName}.
                </h1>
                <p className="text-lg text-slate-400 mt-2 font-light">Ready to focus?</p>
            </div>
        </div>
    );
}
