import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/config.css';

export default function ConfigPage() {
    const navigate = useNavigate();
    const { seriesId } = useParams();
    const isEditMode = Boolean(seriesId);

    const [step, setStep] = useState(0); // 0 = series info, 1 = show details, 2 = episodes
    const [seriesTitle, setSeriesTitle] = useState('');
    const [seriesDescription, setSeriesDescription] = useState('');
    const [seriesThumbnail, setSeriesThumbnail] = useState(null);
    const [seriesThumbnailPreview, setSeriesThumbnailPreview] = useState(null);
    const [episodeCount, setEpisodeCount] = useState(1);
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSeriesId, setCurrentSeriesId] = useState(seriesId);

    const seriesThumbnailInputRef = useRef(null);

    useEffect(() => {
        loadData();
    }, [seriesId]);

    const loadData = async () => {
        try {
            if (isEditMode) {
                const data = await api.getSeries(seriesId);
                setSeriesTitle(data.title || '');
                setSeriesDescription(data.description || '');
                setSeriesThumbnail(data.thumbnail);
                setEpisodeCount(data.episodeCount || 1);
                setEpisodes(data.episodes || []);
                setStep(1); // Skip to show details when editing
            }
        } catch (e) {
            console.error('Error loading data:', e);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleCountChange = (delta) => {
        const newCount = Math.max(1, Math.min(10, episodeCount + delta));
        setEpisodeCount(newCount);
    };

    const handleSeriesThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            setSeriesThumbnailPreview(event.target.result);
        };
        reader.readAsDataURL(file);

        // If we have a seriesId, upload immediately
        if (currentSeriesId) {
            try {
                const result = await api.uploadSeriesThumbnail(currentSeriesId, file);
                if (result.success) {
                    setSeriesThumbnail(result.filename);
                    setSeriesThumbnailPreview(null);
                }
            } catch (e) {
                console.error('Error uploading series thumbnail:', e);
            }
        }
    };

    const goToStep1 = async () => {
        const title = seriesTitle.trim() || 'The Story of My Life';
        setSeriesTitle(title);

        if (!currentSeriesId) {
            // Create new series
            try {
                const result = await api.createSeries({
                    title,
                    description: seriesDescription,
                    episodeCount
                });
                if (result.success) {
                    setCurrentSeriesId(result.series.id);
                    setEpisodes(result.series.episodes);

                    // Upload thumbnail if we have a preview
                    if (seriesThumbnailPreview && seriesThumbnailInputRef.current?.files?.[0]) {
                        const thumbResult = await api.uploadSeriesThumbnail(
                            result.series.id,
                            seriesThumbnailInputRef.current.files[0]
                        );
                        if (thumbResult.success) {
                            setSeriesThumbnail(thumbResult.filename);
                            setSeriesThumbnailPreview(null);
                        }
                    }
                }
            } catch (e) {
                console.error('Error creating series:', e);
                return;
            }
        } else {
            // Update existing series
            await api.updateSeries(currentSeriesId, {
                title,
                description: seriesDescription,
                episodeCount
            });

            const data = await api.getSeries(currentSeriesId);
            setEpisodes(data.episodes);
        }

        setStep(1);
    };

    const goToStep2 = async () => {
        await api.updateSeries(currentSeriesId, {
            title: seriesTitle,
            description: seriesDescription,
            episodeCount
        });

        const data = await api.getSeries(currentSeriesId);
        setEpisodes(data.episodes);
        setStep(2);
    };

    const handleThumbnailUpload = async (episodeIndex, file) => {
        try {
            const result = await api.uploadThumbnail(currentSeriesId, episodeIndex, file);
            if (result.success) {
                const data = await api.getSeries(currentSeriesId);
                setEpisodes(data.episodes);
            }
        } catch (e) {
            console.error('Error uploading thumbnail:', e);
        }
    };

    const handleMediaUpload = async (episodeIndex, files) => {
        try {
            const result = await api.uploadMedia(currentSeriesId, episodeIndex, Array.from(files));
            if (result.success) {
                const data = await api.getSeries(currentSeriesId);
                setEpisodes(data.episodes);
            }
        } catch (e) {
            console.error('Error uploading media:', e);
        }
    };

    const handleMusicUpload = async (episodeIndex, file) => {
        try {
            const result = await api.uploadMusic(currentSeriesId, episodeIndex, file);
            if (result.success) {
                const data = await api.getSeries(currentSeriesId);
                setEpisodes(data.episodes);
            }
        } catch (e) {
            console.error('Error uploading music:', e);
        }
    };

    const handleMusicDelete = async (episodeIndex) => {
        try {
            await api.deleteMusic(currentSeriesId, episodeIndex);
            const data = await api.getSeries(currentSeriesId);
            setEpisodes(data.episodes);
        } catch (e) {
            console.error('Error deleting music:', e);
        }
    };

    const handleTitleChange = (episodeIndex, title) => {
        setEpisodes(prev => {
            const updated = [...prev];
            updated[episodeIndex] = { ...updated[episodeIndex], title };
            return updated;
        });
    };

    const handleDescriptionChange = (episodeIndex, description) => {
        setEpisodes(prev => {
            const updated = [...prev];
            updated[episodeIndex] = { ...updated[episodeIndex], description };
            return updated;
        });
    };

    const handleDeleteMedia = async (episodeIndex, mediaId) => {
        try {
            await api.deleteMedia(currentSeriesId, episodeIndex, mediaId);
            const data = await api.getSeries(currentSeriesId);
            setEpisodes(data.episodes);
        } catch (e) {
            console.error('Error deleting media:', e);
        }
    };

    const handleReorderMedia = useCallback(async (episodeIndex, newMediaOrder) => {
        setEpisodes(prev => {
            const updated = [...prev];
            updated[episodeIndex] = {
                ...updated[episodeIndex],
                media: [...newMediaOrder]
            };
            return updated;
        });

        try {
            await api.reorderMedia(currentSeriesId, episodeIndex, newMediaOrder.map(m => m.id));
        } catch (e) {
            console.error('Error saving reorder:', e);
            const data = await api.getSeries(currentSeriesId);
            setEpisodes(data.episodes);
        }
    }, [currentSeriesId]);

    const createNetflix = async () => {
        await api.updateSeries(currentSeriesId, {
            title: seriesTitle,
            description: seriesDescription,
            episodeCount,
            episodes: episodes.map((ep, i) => ({
                ...ep,
                title: ep.title?.trim() || `Episode ${i + 1}`
            }))
        });
        navigate(`/series/${currentSeriesId}`);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    const seriesThumbUrl = seriesThumbnailPreview || (seriesThumbnail ? api.getSeriesThumbnailUrl(seriesThumbnail) : null);

    return (
        <div className="config-page">
            <header className="config-header">
                <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>MYFLIX</div>
            </header>

            <main className="config-main">
                <div className="config-card">
                    <h1 className="config-title">{isEditMode ? 'Edit Your Series' : 'Create Your Life Story'}</h1>
                    <p className="config-subtitle">Turn your memories into a Netflix-style experience</p>

                    <div className="steps">
                        <div className={`step ${step >= 0 ? 'active' : ''} ${step > 0 ? 'completed' : ''}`}>
                            <span className="step-number">1</span>
                            <span>Series Info</span>
                        </div>
                        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <span className="step-number">2</span>
                            <span>Show Details</span>
                        </div>
                        <div className={`step ${step >= 2 ? 'active' : ''}`}>
                            <span className="step-number">3</span>
                            <span>Episodes</span>
                        </div>
                    </div>

                    {/* Step 0: Series Info */}
                    {step === 0 && (
                        <div className="step-content">
                            <div className="series-info-section">
                                {/* Series Thumbnail */}
                                <div
                                    className="series-thumbnail-upload"
                                    onClick={() => seriesThumbnailInputRef.current?.click()}
                                >
                                    {seriesThumbUrl ? (
                                        <img src={seriesThumbUrl} alt="Series thumbnail" />
                                    ) : (
                                        <div className="thumbnail-placeholder">
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                            </svg>
                                            <span>Click to upload series cover</span>
                                        </div>
                                    )}
                                    <input
                                        ref={seriesThumbnailInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleSeriesThumbnailUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {/* Series Title */}
                                <div className="show-title-section">
                                    <label className="form-label">Series Title</label>
                                    <input
                                        type="text"
                                        className="show-title-input"
                                        placeholder="The Story of My Life"
                                        value={seriesTitle}
                                        onChange={(e) => setSeriesTitle(e.target.value)}
                                        maxLength={50}
                                    />
                                </div>

                                {/* Series Description */}
                                <div className="show-title-section">
                                    <label className="form-label">Description (optional)</label>
                                    <textarea
                                        className="show-description-input"
                                        placeholder="A personal journey through life's most precious memories..."
                                        value={seriesDescription}
                                        onChange={(e) => setSeriesDescription(e.target.value)}
                                        maxLength={200}
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="config-actions">
                                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                    ← Cancel
                                </button>
                                <button className="btn btn-netflix" onClick={goToStep1}>
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Show Details */}
                    {step === 1 && (
                        <div className="step-content">
                            <div className="episode-count-section">
                                <label className="form-label">Number of Episodes</label>
                                <div className="episode-counter">
                                    <button
                                        className="counter-btn"
                                        onClick={() => handleCountChange(-1)}
                                        disabled={episodeCount <= 1}
                                    >−</button>
                                    <span className="count-display">{episodeCount}</span>
                                    <button
                                        className="counter-btn"
                                        onClick={() => handleCountChange(1)}
                                        disabled={episodeCount >= 10}
                                    >+</button>
                                </div>
                            </div>

                            <div className="config-actions">
                                <button className="btn btn-secondary" onClick={() => setStep(0)}>
                                    ← Back
                                </button>
                                <button className="btn btn-netflix" onClick={goToStep2}>
                                    Continue →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Episodes */}
                    {step === 2 && (
                        <div className="step-content">
                            <div className="episodes-config">
                                {episodes.slice(0, episodeCount).map((episode, index) => (
                                    <EpisodeCard
                                        key={`episode-${index}`}
                                        index={index}
                                        episode={episode}
                                        onThumbnailUpload={(file) => handleThumbnailUpload(index, file)}
                                        onMediaUpload={(files) => handleMediaUpload(index, files)}
                                        onMusicUpload={(file) => handleMusicUpload(index, file)}
                                        onMusicDelete={() => handleMusicDelete(index)}
                                        onTitleChange={(title) => handleTitleChange(index, title)}
                                        onDescriptionChange={(desc) => handleDescriptionChange(index, desc)}
                                        onDeleteMedia={(mediaId) => handleDeleteMedia(index, mediaId)}
                                        onReorderMedia={(newOrder) => handleReorderMedia(index, newOrder)}
                                    />
                                ))}
                            </div>

                            <div className="config-actions">
                                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                    ← Back
                                </button>
                                <button className="btn btn-netflix" onClick={createNetflix}>
                                    {isEditMode ? 'Save Changes →' : 'Create My Netflix →'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="config-footer">
                <p>Netflix Life Story Generator • Made with ❤️</p>
            </footer>
        </div>
    );
}

function EpisodeCard({ index, episode, onThumbnailUpload, onMediaUpload, onMusicUpload, onMusicDelete, onTitleChange, onDescriptionChange, onDeleteMedia, onReorderMedia }) {
    const thumbnailInputRef = useRef(null);
    const mediaInputRef = useRef(null);
    const musicInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState(null);
    const [draggedIdx, setDraggedIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);

    const thumbnailUrl = episode.thumbnail
        ? api.getThumbnailUrl(episode.thumbnail)
        : null;

    const handleThumbnailSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setLocalPreview(event.target.result);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            await onThumbnailUpload(file);
        } finally {
            setIsUploading(false);
            setLocalPreview(null);
        }
    };

    const handleMediaSelect = async (e) => {
        const files = e.target.files;
        if (!files?.length) return;

        setIsUploading(true);
        try {
            await onMediaUpload(files);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleMusicSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await onMusicUpload(file);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleMoveMedia = (fromIndex, direction) => {
        const toIndex = fromIndex + direction;
        if (toIndex < 0 || toIndex >= episode.media.length) return;

        const newMedia = [...episode.media];
        const temp = newMedia[fromIndex];
        newMedia[fromIndex] = newMedia[toIndex];
        newMedia[toIndex] = temp;

        onReorderMedia(newMedia);
    };

    const onDragStart = (e, idx) => {
        setDraggedIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragEnd = () => {
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const onDragOver = (e, idx) => {
        e.preventDefault();
        if (draggedIdx !== idx) {
            setDragOverIdx(idx);
        }
    };

    const onDragLeave = () => {
        setDragOverIdx(null);
    };

    const onDrop = (e, dropIdx) => {
        e.preventDefault();

        if (draggedIdx === null || draggedIdx === dropIdx) {
            setDraggedIdx(null);
            setDragOverIdx(null);
            return;
        }

        const newMedia = [...episode.media];
        const [removed] = newMedia.splice(draggedIdx, 1);
        newMedia.splice(dropIdx, 0, removed);

        onReorderMedia(newMedia);
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    const displayUrl = localPreview || thumbnailUrl;
    const mediaList = episode.media || [];

    return (
        <div className="episode-config-card">
            <div
                className="episode-thumbnail-upload"
                onClick={() => !isUploading && thumbnailInputRef.current?.click()}
            >
                {isUploading ? (
                    <div className="thumbnail-placeholder">
                        <div className="spinner"></div>
                        <span>Uploading...</span>
                    </div>
                ) : displayUrl ? (
                    <img src={displayUrl} alt={`Episode ${index + 1} thumbnail`} />
                ) : (
                    <div className="thumbnail-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                        <span>Click to upload thumbnail</span>
                    </div>
                )}
                <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="episode-config-content">
                <span className="episode-number-badge">Episode {index + 1}</span>

                <input
                    type="text"
                    className="episode-title-input"
                    placeholder="Episode Title (e.g., College Days)"
                    value={episode.title || ''}
                    onChange={(e) => onTitleChange(e.target.value)}
                />

                <textarea
                    className="episode-description-input"
                    placeholder="Episode description (shown as overlay during playback)..."
                    value={episode.description || ''}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    rows={2}
                    maxLength={200}
                />

                {/* Music Upload */}
                <div className="music-upload-section">
                    <div
                        className="music-upload-label"
                        onClick={() => !isUploading && musicInputRef.current?.click()}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                        <span>{episode.music ? 'Change Music' : 'Add Background Music'}</span>
                    </div>

                    {episode.music && (
                        <div className="music-file-info">
                            <span className="music-filename">🎵 {episode.musicOriginalName || 'Music file'}</span>
                            <button
                                type="button"
                                className="remove-music-btn"
                                onClick={onMusicDelete}
                            >×</button>
                        </div>
                    )}

                    <input
                        ref={musicInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleMusicSelect}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Media Upload */}
                <div className="media-upload-section">
                    <div
                        className="media-upload-label"
                        onClick={() => !isUploading && mediaInputRef.current?.click()}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                        </svg>
                        <span>Add Photos & Videos</span>
                        <span className="media-count">{mediaList.length}</span>
                    </div>

                    <input
                        ref={mediaInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaSelect}
                        style={{ display: 'none' }}
                    />

                    {mediaList.length > 0 && (
                        <>
                            <div className="media-toolbar">
                                <p className="reorder-hint">Drag to reorder • Use arrows to move</p>
                                {mediaList.length > 1 && (
                                    <button
                                        type="button"
                                        className="shuffle-btn"
                                        onClick={() => {
                                            const shuffled = [...mediaList].sort(() => Math.random() - 0.5);
                                            onReorderMedia(shuffled);
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                                        </svg>
                                        Shuffle
                                    </button>
                                )}
                            </div>
                            <div className="media-preview-list reorderable">
                                {mediaList.map((media, i) => (
                                    <div
                                        key={media.id}
                                        className={`media-preview-item ${draggedIdx === i ? 'dragging' : ''} ${dragOverIdx === i ? 'drag-over' : ''}`}
                                        draggable="true"
                                        onDragStart={(e) => onDragStart(e, i)}
                                        onDragEnd={onDragEnd}
                                        onDragOver={(e) => onDragOver(e, i)}
                                        onDragLeave={onDragLeave}
                                        onDrop={(e) => onDrop(e, i)}
                                    >
                                        <span className="media-index">{i + 1}</span>

                                        {media.type === 'video' ? (
                                            <video src={media.url} muted />
                                        ) : (
                                            <img src={media.url} alt="" />
                                        )}

                                        {media.type === 'video' && <span className="media-type-badge">VIDEO</span>}

                                        <div className="media-controls">
                                            <button
                                                type="button"
                                                className="move-btn"
                                                onClick={() => handleMoveMedia(i, -1)}
                                                disabled={i === 0}
                                                title="Move up"
                                            >↑</button>
                                            <button
                                                type="button"
                                                className="move-btn"
                                                onClick={() => handleMoveMedia(i, 1)}
                                                disabled={i === mediaList.length - 1}
                                                title="Move down"
                                            >↓</button>
                                            <button
                                                type="button"
                                                className="remove-media"
                                                onClick={() => onDeleteMedia(media.id)}
                                                title="Remove"
                                            >×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
