import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import '../styles/home.css';

export default function HomePage() {
    const navigate = useNavigate();
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [featuredSeries, setFeaturedSeries] = useState(null);

    useEffect(() => {
        loadSeries();
    }, []);

    const loadSeries = async () => {
        try {
            const data = await api.getAllSeries();
            setSeries(data);
            // Set the most recent series as featured
            if (data.length > 0) {
                setFeaturedSeries(data[data.length - 1]);
            }
        } catch (e) {
            console.error('Error loading series:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSeriesClick = (seriesId) => {
        navigate(`/series/${seriesId}`);
    };

    const playSeriesDirectly = (e, seriesId) => {
        e.stopPropagation();
        navigate(`/series/${seriesId}/player/0`);
    };

    const handleCreateNew = () => {
        navigate('/series/new');
    };

    const handleDeleteSeries = async (e, seriesId) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this series?')) {
            try {
                await api.deleteSeries(seriesId);
                loadSeries();
            } catch (e) {
                console.error('Error deleting series:', e);
            }
        }
    };

    const getPlaceholderGradient = (index) => {
        const gradients = [
            'linear-gradient(135deg, #E50914 0%, #831010 100%)',
            'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            'linear-gradient(135deg, #4a0e0e 0%, #2d0a0a 100%)',
            'linear-gradient(135deg, #2C3E50 0%, #1a252f 100%)',
            'linear-gradient(135deg, #7f0000 0%, #240000 100%)',
            'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)',
        ];
        return gradients[index % gradients.length];
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="home-page">
            {/* Header */}
            <header className="home-header">
                <div className="header-logo">MYFLIX</div>
                <nav className="header-nav">
                    <span className="nav-item active">Home</span>
                    <span className="nav-item">My List</span>
                </nav>
                <div className="header-actions">
                    <button className="create-btn" onClick={handleCreateNew}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                        Create New
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            {featuredSeries ? (
                <section className="hero-section" onClick={() => handleSeriesClick(featuredSeries.id)}>
                    <div className="hero-background">
                        {featuredSeries.thumbnail ? (
                            <img src={api.getSeriesThumbnailUrl(featuredSeries.thumbnail)} alt={featuredSeries.title} />
                        ) : (
                            <div className="hero-gradient-fallback" style={{ background: getPlaceholderGradient(0) }} />
                        )}
                    </div>
                    <div className="hero-overlay">
                        <div className="hero-vignette" />
                        <div className="hero-gradient-bottom" />
                    </div>
                    <div className="hero-content">
                        <span className="hero-badge">LATEST SERIES</span>
                        <h1 className="hero-title">{featuredSeries.title}</h1>
                        <p className="hero-description">{featuredSeries.description || 'A personal documentary'}</p>
                        <div className="hero-meta">
                            <span className="meta-item">{featuredSeries.episodeCount} Episode{featuredSeries.episodeCount !== 1 ? 's' : ''}</span>
                            <span className="meta-divider">•</span>
                            <span className="meta-item">{new Date(featuredSeries.createdAt).getFullYear()}</span>
                            <span className="meta-divider">•</span>
                            <span className="rating-badge">HD</span>
                        </div>
                        <div className="hero-actions">
                            <button className="btn btn-play" onClick={(e) => playSeriesDirectly(e, featuredSeries.id)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                                Play
                            </button>
                            <button className="btn btn-info" onClick={(e) => { e.stopPropagation(); handleSeriesClick(featuredSeries.id); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                                More Info
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="hero-empty">
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                            </svg>
                        </div>
                        <h2>Create Your First Series</h2>
                        <p>Turn your memories into a Netflix-style experience</p>
                        <button className="btn btn-primary" onClick={handleCreateNew}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                            Get Started
                        </button>
                    </div>
                </section>
            )
            }

            {/* Series Grid */}
            {
                series.length > 0 && (
                    <section className="series-section">
                        <h2 className="section-title">My Series</h2>
                        <div className="series-row">
                            {/* Add New Series Card */}
                            <div className="series-card add-card" onClick={handleCreateNew}>
                                <div className="add-card-content">
                                    <div className="add-icon">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                        </svg>
                                    </div>
                                    <span>Create New Series</span>
                                </div>
                            </div>

                            {/* Series Cards */}
                            {series.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="series-card"
                                >
                                    <div
                                        className="card-thumbnail"
                                        onClick={(e) => playSeriesDirectly(e, item.id)}
                                    >
                                        {item.thumbnail ? (
                                            <img src={api.getSeriesThumbnailUrl(item.thumbnail)} alt={item.title} />
                                        ) : (
                                            <div className="card-placeholder" style={{ background: getPlaceholderGradient(index) }}>
                                                <span className="placeholder-text">{item.title.charAt(0)}</span>
                                            </div>
                                        )}
                                        <div className="card-overlay">
                                            <div className="play-icon">
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5,3 19,12 5,21" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="card-info"
                                        onClick={() => handleSeriesClick(item.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <h3 className="card-title">{item.title}</h3>
                                        <div className="card-meta">
                                            <span>{item.episodeCount} Episode{item.episodeCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/series/${item.id}/edit`); }}
                                            title="Edit"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={(e) => handleDeleteSeries(e, item.id)}
                                            title="Delete"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Footer */}
            <footer className="home-footer">
                <div className="footer-content">
                    <p>MYFLIX • Created with ❤️</p>
                </div>
            </footer>
        </div >
    );
}
