import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/browse.css';

export default function BrowsePage() {
    const navigate = useNavigate();
    const { seriesId } = useParams();
    const [seriesData, setSeriesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewEpisode, setPreviewEpisode] = useState(null);

    useEffect(() => {
        loadData();
    }, [seriesId]);

    const loadData = async () => {
        try {
            const data = await api.getSeries(seriesId);
            setSeriesData(data);
        } catch (e) {
            console.error('Error loading data:', e);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const playEpisode = (index) => {
        navigate(`/series/${seriesId}/player/${index}`);
    };

    const showEpisodePreview = (episode, index) => {
        setPreviewEpisode({ ...episode, index });
    };

    const closePreview = () => {
        setPreviewEpisode(null);
    };

    const getTagline = (title) => {
        const taglines = [
            `"Every moment tells a story worth remembering..."`,
            `"A journey through life's most precious memories..."`,
            `"Where every chapter reveals a new adventure..."`,
        ];
        return taglines[Math.floor(Math.random() * taglines.length)];
    };

    const getPlaceholder = (index) => {
        const colors = [
            ['#E50914', '#831010'],
            ['#1a1a2e', '#16213e'],
            ['#4a0e0e', '#2d0a0a'],
            ['#2C3E50', '#1a252f'],
        ];
        const [c1, c2] = colors[index % colors.length];
        return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">
        <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${c1}"/>
          <stop offset="100%" style="stop-color:${c2}"/>
        </linearGradient></defs>
        <rect fill="url(#g)" width="320" height="180"/>
        <text x="160" y="90" fill="rgba(255,255,255,0.2)" font-size="72" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${index + 1}</text>
      </svg>
    `)}`;
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    const heroThumbnail = seriesData?.thumbnail || seriesData?.episodes?.find(ep => ep.thumbnail)?.thumbnail;
    const heroUrl = seriesData?.thumbnail
        ? api.getSeriesThumbnailUrl(seriesData.thumbnail)
        : heroThumbnail
            ? api.getThumbnailUrl(heroThumbnail)
            : null;

    return (
        <div className="browse-page">
            {/* Header */}
            <header className="netflix-header">
                <div className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>MYFLIX</div>
                <div className="header-actions">
                    <button className="back-home-btn" onClick={() => navigate('/')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                        </svg>
                        Home
                    </button>
                    <div className="profile-avatar">
                        {seriesData?.title?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                </div>
            </header>

            {/* Hero Section - Cinematic */}
            <section className="hero-section">
                {/* Background */}
                <div className="hero-background">
                    {heroUrl ? (
                        <img src={heroUrl} alt="Hero" />
                    ) : (
                        <div className="hero-gradient-fallback" />
                    )}
                </div>

                {/* Overlays */}
                <div className="hero-overlay">
                    <div className="hero-vignette" />
                    <div className="hero-gradient-top" />
                    <div className="hero-gradient-left" />
                    <div className="hero-gradient-bottom" />
                    <div className="cinematic-bars" />
                </div>

                {/* Content */}
                <div className="hero-content">
                    <div className="hero-type">
                        <svg className="hero-type-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v16h16V4H4zm10 3.5l-5 3v-6l5 3z" />
                        </svg>
                        <span className="hero-type-text">A Personal Documentary</span>
                    </div>

                    <h1 className="hero-title">{seriesData?.title || 'My Life Story'}</h1>

                    <p className="hero-tagline">{seriesData?.description || getTagline(seriesData?.title)}</p>

                    <p className="hero-description">
                        Journey through the chapters of a life filled with laughter, love, and unforgettable memories.
                        Each episode is a window into moments that shaped who we are.
                    </p>

                    <div className="hero-meta">
                        <span className="hero-meta-item highlight">
                            {seriesData?.episodeCount || seriesData?.episodes?.length || 0} Episode{(seriesData?.episodeCount || 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="hero-meta-divider" />
                        <span className="hero-meta-item">{new Date(seriesData?.createdAt || Date.now()).getFullYear()}</span>
                        <span className="hero-meta-divider" />
                        <span className="hero-meta-item">
                            <span className="rating-badge">HD</span>
                        </span>
                    </div>

                    <div className="hero-actions">
                        <button className="btn btn-primary" onClick={() => playEpisode(0)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 19,12 5,21" />
                            </svg>
                            Play
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate(`/series/${seriesId}/edit`)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                            Edit
                        </button>
                    </div>
                </div>
            </section>

            {/* Episodes Section */}
            <section className="episodes-section">
                <div className="section-header">
                    <h2 className="section-title">Episodes</h2>
                </div>
                <div className="episodes-row">
                    {seriesData?.episodes?.map((episode, index) => (
                        <div
                            key={index}
                            className="episode-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div
                                className="episode-thumbnail-wrapper"
                                onClick={() => playEpisode(index)}
                            >
                                <img
                                    className="episode-thumbnail"
                                    src={episode.thumbnail ? api.getThumbnailUrl(episode.thumbnail) : getPlaceholder(index)}
                                    alt={episode.title}
                                    onError={(e) => { e.target.src = getPlaceholder(index); }}
                                />
                                <span className="episode-number">{index + 1}</span>
                                <div className="episode-play-btn" />
                            </div>
                            <div
                                className="episode-overlay"
                                onClick={() => showEpisodePreview(episode, index)}
                            >
                                <div className="episode-info">
                                    <h3 className="episode-title">{episode.title || `Episode ${index + 1}`}</h3>
                                    <p className="episode-duration">
                                        {episode.media?.length || 0} items
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Episode Preview Modal */}
            {previewEpisode && (
                <div className="episode-preview-modal" onClick={closePreview}>
                    <div className="preview-backdrop">
                        <img
                            src={previewEpisode.thumbnail ? api.getThumbnailUrl(previewEpisode.thumbnail) : getPlaceholder(previewEpisode.index)}
                            alt=""
                        />
                    </div>
                    <div className="preview-overlay" />
                    <div className="preview-content" onClick={(e) => e.stopPropagation()}>
                        <button className="preview-close" onClick={closePreview}>✕</button>
                        <div className="preview-header">
                            <span className="preview-badge">Episode {previewEpisode.index + 1}</span>
                            <h2 className="preview-title">{previewEpisode.title || `Episode ${previewEpisode.index + 1}`}</h2>
                        </div>
                        {previewEpisode.description && (
                            <p className="preview-description">{previewEpisode.description}</p>
                        )}
                        <div className="preview-meta">
                            <span>{previewEpisode.media?.length || 0} photos/videos</span>
                            {previewEpisode.music && <span>• Background music</span>}
                        </div>
                        <div className="preview-actions">
                            <button className="btn btn-play-large" onClick={() => playEpisode(previewEpisode.index)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                                Play Episode
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="browse-footer">
                <div className="footer-created">Created With Love</div>
                <p>Netflix Life Story Generator</p>
            </footer>
        </div>
    );
}
