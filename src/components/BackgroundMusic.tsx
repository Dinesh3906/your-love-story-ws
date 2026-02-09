import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { App } from '@capacitor/app';

export const BackgroundMusic = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isMusicPlaying = useGameStore(state => state.isMusicPlaying);

    // Pick a song ONCE when the component mounts
    const selectedSongRef = useRef<string>('');

    useEffect(() => {
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
            if (audio.paused) {
                console.log('[Music] Power: ON - Playing');
                audio.play().catch(e => console.error('[Music] Play failed:', e));
            }
        } else {
            console.log('[Music] Power: OFF - Pausing');
            audio.pause();
        }
    }, [isMusicPlaying]);

    // Handle visibility & App state change (for mobile backgrounding)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (audioRef.current && !audioRef.current.paused) {
                    audioRef.current.pause();
                }
            } else {
                if (isMusicPlaying && audioRef.current && audioRef.current.paused) {
                    audioRef.current.play().catch(e => console.error('Resume failed:', e));
                }
            }
        };

        // Capacitor App State Change (Critical for Mobile)
        const appStateListener = App.addListener('appStateChange', (state: { isActive: boolean }) => {
            console.log('[Music] App state changed. IsActive:', state.isActive);
            if (!state.isActive) {
                if (audioRef.current && !audioRef.current.paused) {
                    audioRef.current.pause();
                }
            } else {
                if (isMusicPlaying && audioRef.current && audioRef.current.paused) {
                    audioRef.current.play().catch(e => console.error('App resume play failed:', e));
                }
            }
        });

        const handleInteraction = () => {
            if (isMusicPlaying && audioRef.current && audioRef.current.paused) {
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
            appStateListener.then((l: any) => l.remove());
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
