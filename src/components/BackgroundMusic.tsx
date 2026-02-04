import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';



export const BackgroundMusic = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMusicPlaying = useGameStore(state => state.isMusicPlaying);

    // Pick a song ONCE when the component mounts
    // Using refs to ensure we don't pick a new song on re-renders
    const selectedSongRef = useRef<string>('');

    useEffect(() => {
        // Only select a song if we haven't already
        if (!selectedSongRef.current) {
            const songs = ['/sparkle.mp3', '/audio/romantic.mp3'];
            const randomIndex = Math.floor(Math.random() * songs.length);
            selectedSongRef.current = songs[randomIndex];
            console.log(`[Music] Selected startup track: ${selectedSongRef.current}`);
        }

        if (audioRef.current) {
            audioRef.current.src = selectedSongRef.current;
            audioRef.current.playbackRate = 1.05; // Copyright safety
        }
    }, []);

    // Handle Play/Pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isMusicPlaying) {
            // Only try to play if we're paused
            if (audio.paused) {
                console.log('[Music] Power: ON - Playing');
                audio.play().catch(e => console.error('[Music] Play failed:', e));
            }
        } else {
            console.log('[Music] Power: OFF - Pausing');
            audio.pause();
        }
    }, [isMusicPlaying]);

    // Handle visibility change (pause when tab is hidden, resume when visible if music is on)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (audioRef.current && !audioRef.current.paused) {
                    console.log('[Music] Tab hidden, pausing');
                    audioRef.current.pause();
                }
            } else {
                // Determine if we should resume
                if (isMusicPlaying && audioRef.current && audioRef.current.paused) {
                    console.log('[Music] Tab visible, resuming');
                    audioRef.current.play().catch(e => console.error('Resume failed:', e));
                }
            }
        };

        const handleInteraction = () => {
            if (isMusicPlaying && audioRef.current && audioRef.current.paused) {
                console.log('[Music] Interaction, resuming');
                audioRef.current.play().catch(e => console.error('Interaction play failed:', e));
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, [isMusicPlaying]);

    return (
        <audio
            ref={audioRef}
            loop
            preload="auto"
        />
    );
};
