import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/player.css';

export default function PlayerPage() {
    const { seriesId, episodeIndex } = useParams();
    const navigate = useNavigate();
    const [series, setSeries] = useState(null);
    const [episode, setEpisode] = useState(null);
    const [mediaIndex, setMediaIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('playerVolume');
        return saved !== null ? parseFloat(saved) : 1;
    });
    const [isMuted, setIsMuted] = useState(() => {
        return localStorage.getItem('playerMuted') === 'true';
    });
    const [animClass, setAnimClass] = useState('');
    const [audioSource, setAudioSource] = useState('music'); // 'music' or 'video'
    const [showEndScreen, setShowEndScreen] = useState(false);
    const [totalEpisodes, setTotalEpisodes] = useState(0);
    const [countdown, setCountdown] = useState(10);

    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const containerRef = useRef(null);
    const timerRef = useRef(null);
    const controlsTimeoutRef = useRef(null);
    const countdownRef = useRef(null);

    const mediaIndexRef = useRef(mediaIndex);
    const isPlayingRef = useRef(isPlaying);
    const episodeRef = useRef(episode);
    const audioSourceRef = useRef(audioSource);

    useEffect(() => { mediaIndexRef.current = mediaIndex; }, [mediaIndex]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { episodeRef.current = episode; }, [episode]);
    useEffect(() => { audioSourceRef.current = audioSource; }, [audioSource]);

    const PHOTO_DURATION = 5000;
    const TRANSITION_TIME = 300;
    const transitions = ['fade', 'slide-left', 'slide-up', 'zoom', 'blur'];

    useEffect(() => {
        loadData();
        return () => stopTimer();
    }, [seriesId, episodeIndex]);

    // Handle music playback
    useEffect(() => {
        if (audioRef.current && episode?.music) {
            if (isPlaying) {
                const currentMedia = episode.media?.[mediaIndex];
                const isVideo = currentMedia?.type === 'video';

                if (isVideo && audioSource === 'video') {
                    audioRef.current.pause();
                } else {
                    audioRef.current.play().catch(() => { });
                }
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, mediaIndex, audioSource, episode]);

    // Handle volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
        if (videoRef.current) {
            videoRef.current.volume = isMuted ? 0 : volume;
        }
        localStorage.setItem('playerVolume', volume.toString());
        localStorage.setItem('playerMuted', isMuted.toString());
    }, [volume, isMuted]);

    // Start timer for photos
    useEffect(() => {
        if (isPlaying && episode?.media?.length > 0) {
            const media = episode.media[mediaIndex];
            if (media?.type !== 'video') {
                startTimer();
            }
        }
        return () => stopTimer();
    }, [isPlaying, mediaIndex, episode]);

    const loadData = async () => {
        try {
            const data = await api.getSeries(seriesId);
            setSeries(data);
            const idx = parseInt(episodeIndex) || 0;
            setEpisode(data.episodes[idx]);
            setTotalEpisodes(data.episodes.length);
        } catch (e) {
            console.error('Error loading data:', e);
            navigate(`/series/${seriesId}`);
        }
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        stopTimer();
        const startTime = Date.now();
        const currentIdx = mediaIndexRef.current;

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / PHOTO_DURATION) * 100, 100);

            const ep = episodeRef.current;
            if (ep?.media?.length) {
                const itemWidth = 100 / ep.media.length;
                const totalProgress = currentIdx * itemWidth + (pct / 100) * itemWidth;
                setProgress(totalProgress);
            }

            if (elapsed >= PHOTO_DURATION) {
                stopTimer();
                advanceToNext();
            }
        }, 50);
    };

    const advanceToNext = () => {
        const ep = episodeRef.current;
        const idx = mediaIndexRef.current;

        if (!ep || idx >= ep.media.length - 1) {
            setIsPlaying(false);
            setProgress(100);
            setShowEndScreen(true);
            startCountdown();
            return;
        }

        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        setAnimClass(`exit-${transition}`);

        setTimeout(() => {
            const newIdx = idx + 1;
            setMediaIndex(newIdx);
            setAnimClass(`enter-${transition}`);

            setTimeout(() => {
                setAnimClass('');
            }, TRANSITION_TIME);
        }, TRANSITION_TIME);
    };

    const startCountdown = () => {
        setCountdown(10);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    stopCountdown();
                    playNextEpisode();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopCountdown = () => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    };

    const replayEpisode = () => {
        stopCountdown();
        setShowEndScreen(false);
        setMediaIndex(0);
        setProgress(0);
        setIsPlaying(true);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const playNextEpisode = () => {
        stopCountdown();
        const currentIdx = parseInt(episodeIndex) || 0;
        if (currentIdx < totalEpisodes - 1) {
            navigate(`/series/${seriesId}/player/${currentIdx + 1}`);
        } else {
            navigate(`/series/${seriesId}`);
        }
    };

    const goToMedia = (newIdx) => {
        if (newIdx === mediaIndex || newIdx < 0 || newIdx >= (episode?.media?.length || 0)) return;

        stopTimer();
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        setAnimClass(`exit-${transition}`);

        setTimeout(() => {
            setMediaIndex(newIdx);
            setAnimClass(`enter-${transition}`);

            setTimeout(() => {
                setAnimClass('');
            }, TRANSITION_TIME);
        }, TRANSITION_TIME);
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            stopTimer();
            if (videoRef.current) videoRef.current.pause();
            if (audioRef.current) audioRef.current.pause();
        } else {
            const media = episode?.media?.[mediaIndex];
            if (media?.type === 'video' && videoRef.current) {
                videoRef.current.play();
            }
        }
        setIsPlaying(!isPlaying);
    };

    const toggleAudioSource = () => {
        setAudioSource(prev => prev === 'music' ? 'video' : 'music');
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlayingRef.current) setShowControls(false);
        }, 3000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleKey = (e) => {
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'ArrowLeft':
                    goToMedia(mediaIndex - 1);
                    break;
                case 'ArrowRight':
                    goToMedia(mediaIndex + 1);
                    break;
                case 'KeyM':
                    setIsMuted(m => !m);
                    break;
                case 'KeyA':
                    toggleAudioSource();
                    break;
                case 'KeyF':
                    toggleFullscreen();
                    break;
                case 'Escape':
                    navigate(`/series/${seriesId}`);
                    break;
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [mediaIndex, seriesId]);

    if (!episode) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    const currentMedia = episode.media?.[mediaIndex];
    // Use the stored URL directly (works for both S3 URLs and legacy local paths)
    const mediaUrl = currentMedia?.url || null;
    // For music, use getMusicUrl helper which handles both S3 URLs and legacy filenames
    const musicUrl = episode.music ? api.getMusicUrl(episode.music) : null;
    const isCurrentVideo = currentMedia?.type === 'video';

    return (
        <div
            ref={containerRef}
            className={`player-container ${showControls ? 'show-controls' : ''}`}
            onMouseMove={handleMouseMove}
        >
            {/* Background Music */}
            {musicUrl && (
                <audio
                    ref={audioRef}
                    src={musicUrl}
                    loop
                    preload="auto"
                />
            )}

            {/* Intro */}
            {showIntro && (
                <div className="player-intro" onClick={() => { setShowIntro(false); setIsPlaying(true); }}>
                    <video
                        className="intro-video"
                        src="https://the-ps-aws-bucket.s3.ap-south-1.amazonaws.com/assets/Netflix-Intro.mp4"
                        autoPlay
                        playsInline
                        onEnded={() => { setShowIntro(false); setIsPlaying(true); }}
                    />
                    <div className="intro-overlay">
                        <h1 className="intro-title">Episode {parseInt(episodeIndex) + 1}</h1>
                        <p className="intro-subtitle">{episode.title}</p>
                    </div>
                    <div className="intro-skip">Click to skip</div>
                </div>
            )}

            {/* Media Display */}
            {!showIntro && (
                <div className={`media-display ${animClass}`}>
                    {episode.media?.length > 0 ? (
                        currentMedia?.type === 'video' ? (
                            <video
                                ref={videoRef}
                                key={`video-${mediaIndex}`}
                                src={mediaUrl}
                                autoPlay={isPlaying}
                                muted={isMuted || audioSource === 'music'}
                                onEnded={() => goToMedia(mediaIndex + 1)}
                                onTimeUpdate={() => {
                                    if (videoRef.current?.duration) {
                                        const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                                        const itemWidth = 100 / episode.media.length;
                                        setProgress(mediaIndex * itemWidth + (pct / 100) * itemWidth);
                                    }
                                }}
                                className="media-item"
                            />
                        ) : (
                            <>
                                <div
                                    className="media-bg-blur"
                                    style={{ backgroundImage: `url(${mediaUrl})` }}
                                />
                                <img
                                    key={`img-${mediaIndex}`}
                                    src={mediaUrl}
                                    alt=""
                                    className="media-item ken-burns"
                                />
                            </>
                        )
                    ) : (
                        <div className="no-media">
                            <h2>No Media</h2>
                            <p>Add photos or videos to this episode</p>
                            <button className="btn btn-primary" onClick={() => navigate(`/series/${seriesId}/edit`)}>
                                Add Media
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Episode Description Overlay */}
            {!showIntro && episode.description && (
                <div className="episode-description-overlay">
                    <div className="description-content">
                        <p className="description-text">{episode.description}</p>
                    </div>
                </div>
            )}

            {/* Progress dots */}
            {!showIntro && episode.media?.length > 1 && (
                <div className="media-dots">
                    {episode.media.map((_, idx) => (
                        <button
                            key={idx}
                            className={`media-dot ${idx === mediaIndex ? 'active' : ''} ${idx < mediaIndex ? 'viewed' : ''}`}
                            onClick={() => goToMedia(idx)}
                        />
                    ))}
                </div>
            )}

            {/* Audio Source Indicator */}
            {!showIntro && musicUrl && isCurrentVideo && (
                <div className="audio-source-indicator" onClick={toggleAudioSource}>
                    <span className={`audio-option ${audioSource === 'music' ? 'active' : ''}`}>🎵 Music</span>
                    <span className="audio-divider">|</span>
                    <span className={`audio-option ${audioSource === 'video' ? 'active' : ''}`}>🎬 Video</span>
                </div>
            )}

            {/* Music Indicator */}
            {!showIntro && musicUrl && !isCurrentVideo && (
                <div className="music-playing-indicator">
                    <span className="music-note">🎵</span>
                    <span className="music-label">{episode.musicOriginalName || 'Background Music'}</span>
                </div>
            )}

            {/* Controls */}
            {!showIntro && (
                <div className="player-controls">
                    <div className="controls-top">
                        <button className="control-btn back-btn" onClick={() => navigate(`/series/${seriesId}`)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                            </svg>
                        </button>
                        <div className="player-title">
                            <span>Episode {parseInt(episodeIndex) + 1}</span>
                            <span className="title-separator">•</span>
                            <span>{episode.title}</span>
                        </div>
                    </div>

                    <div className="controls-center">
                        <button className="control-btn skip-btn" onClick={() => goToMedia(mediaIndex - 1)} disabled={mediaIndex === 0}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" transform="scale(-1,1) translate(-24,0)" />
                            </svg>
                            <span>Prev</span>
                        </button>

                        <button className="control-btn play-btn" onClick={togglePlayPause}>
                            {isPlaying ? (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                </svg>
                            ) : (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <button className="control-btn skip-btn" onClick={() => goToMedia(mediaIndex + 1)} disabled={mediaIndex >= episode.media.length - 1}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                            </svg>
                            <span>Next</span>
                        </button>
                    </div>

                    <div className="controls-bottom">
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                            <div className="progress-segments">
                                {episode.media?.map((_, idx) => (
                                    <div key={idx} className="progress-segment" />
                                ))}
                            </div>
                        </div>

                        <div className="controls-row">
                            <div className="controls-left">
                                <button className="control-btn" onClick={togglePlayPause}>
                                    {isPlaying ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </button>

                                <div className="volume-control">
                                    <button className="control-btn" onClick={() => setIsMuted(!isMuted)}>
                                        {isMuted ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                            </svg>
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={isMuted ? 0 : volume * 100}
                                        onChange={(e) => {
                                            setVolume(e.target.value / 100);
                                            setIsMuted(false);
                                        }}
                                        className="volume-slider"
                                    />
                                </div>

                                <span className="media-counter">
                                    {mediaIndex + 1} / {episode.media?.length || 0}
                                </span>
                            </div>

                            <div className="controls-right">
                                {musicUrl && isCurrentVideo && (
                                    <button
                                        className={`control-btn audio-toggle-btn ${audioSource}`}
                                        onClick={toggleAudioSource}
                                        title={audioSource === 'music' ? 'Using background music (Press A to switch)' : 'Using video audio (Press A to switch)'}
                                    >
                                        {audioSource === 'music' ? '🎵' : '🎬'}
                                    </button>
                                )}

                                <button className="control-btn" onClick={toggleFullscreen}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* End Screen */}
            {showEndScreen && (
                <div className="end-screen">
                    <div className="end-screen-content">
                        <div className="end-episode-info">
                            <h2 className="end-title">Episode {parseInt(episodeIndex) + 1}</h2>
                            <p className="end-subtitle">{episode.title}</p>
                        </div>

                        <div className="end-actions">
                            <button className="end-btn replay-btn" onClick={replayEpisode}>
                                <div className="end-btn-icon">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                                    </svg>
                                </div>
                                <span className="end-btn-text">Watch Again</span>
                            </button>

                            {parseInt(episodeIndex) < totalEpisodes - 1 ? (
                                <button className="end-btn next-btn" onClick={playNextEpisode}>
                                    <div className="end-btn-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                        </svg>
                                    </div>
                                    <span className="end-btn-text">Next Episode</span>
                                    <div className="countdown-ring">
                                        <svg viewBox="0 0 36 36">
                                            <circle className="countdown-bg" cx="18" cy="18" r="16" />
                                            <circle
                                                className="countdown-progress"
                                                cx="18" cy="18" r="16"
                                                style={{ strokeDashoffset: 100 - (countdown / 10) * 100 }}
                                            />
                                        </svg>
                                        <span className="countdown-number">{countdown}</span>
                                    </div>
                                </button>
                            ) : (
                                <button className="end-btn browse-btn" onClick={() => navigate(`/series/${seriesId}`)}>
                                    <div className="end-btn-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                                        </svg>
                                    </div>
                                    <span className="end-btn-text">Back to Series</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
