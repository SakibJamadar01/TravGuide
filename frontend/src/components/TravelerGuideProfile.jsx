import React, { useState, useEffect } from 'react';
import { getGuidePosts, likeGuidePost } from '../api/guideApi';

const TravelerGuideProfile = ({ guide, onBack }) => {
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [postCarouselIndices, setPostCarouselIndices] = useState({});

    useEffect(() => {
        const fetchPosts = async () => {
            setLoadingPosts(true);
            try {
                const data = await getGuidePosts(guide.id);
                setPosts(data);
            } catch (error) {
                console.error('Failed to load gallery posts:', error);
            } finally {
                setLoadingPosts(false);
            }
        };

        if (guide && guide.id) {
            fetchPosts();
        }
    }, [guide]);

    const isVideoFile = (fileName) => {
        if (!fileName) return false;
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.quicktime'];
        return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    const handleNextImage = (postId, totalImages) => {
        setPostCarouselIndices(prev => {
            const current = prev[postId] || 0;
            return {
                ...prev,
                [postId]: (current + 1) % totalImages
            };
        });
    };

    const handlePrevImage = (postId, totalImages) => {
        setPostCarouselIndices(prev => {
            const current = prev[postId] || 0;
            return {
                ...prev,
                [postId]: (current - 1 + totalImages) % totalImages
            };
        });
    };

    const handleLike = async (postId) => {
        try {
            const result = await likeGuidePost(postId);
            setPosts(prev => prev.map(post => 
                post.id === postId ? { ...post, likesCount: result.likesCount } : post
            ));
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    // Helper to split text by commas, removing empty strings and trimming spaces
    const parseTags = (tagStr) => {
        if (!tagStr) return [];
        return tagStr.split(',').map(s => s.trim()).filter(Boolean);
    };

    const isVerified = guide.verificationStatus === 'VERIFIED';

    return (
        <div className="traveler-profile-container">
            {/* Back Button */}
            <button className="traveler-profile-back-btn" onClick={onBack}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to suggestions
            </button>

            {/* Profile Header */}
            <div className="traveler-profile-header">
                <div className="traveler-profile-avatar-wrapper">
                    {guide.profilePictureUrl ? (
                        <img 
                            src={`http://localhost:8080/api/guides/files/${guide.profilePictureUrl}`} 
                            alt={guide.name} 
                            className="traveler-profile-avatar"
                        />
                    ) : (
                        <div className="traveler-profile-avatar" style={{ background: 'var(--lp-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '800' }}>
                            {guide.name ? guide.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                    )}
                    {isVerified && (
                        <div className="traveler-profile-verified-badge" title="Verified Local Guide">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    )}
                </div>

                <h1 className="traveler-profile-name">{guide.name}</h1>
                
                <div className="traveler-profile-rating-price">
                    <span className="traveler-profile-rating">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {guide.rating || '5.0'}
                    </span>
                    <span className="traveler-profile-price">
                        ${guide.pricePerDay}<span>/day</span>
                    </span>
                </div>
            </div>

            {/* Quick Actions (Contact Info) */}
            <div className="traveler-profile-contact-section">
                {guide.mobileNumber && (
                    <a href={`tel:${guide.mobileNumber}`} className="traveler-profile-contact-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        Call
                    </a>
                )}
                {guide.email && (
                    <a href={`mailto:${guide.email}`} className="traveler-profile-contact-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Email
                    </a>
                )}
            </div>

            {/* Bio Section */}
            <div className="traveler-profile-section">
                <h3 className="traveler-profile-section-title">About Guide</h3>
                <p className="traveler-profile-bio">{guide.bio || 'No bio description provided.'}</p>
            </div>

            {/* Locations Section */}
            {guide.locationsShown && (
                <div className="traveler-profile-section">
                    <h3 className="traveler-profile-section-title">Destinations & Places</h3>
                    <div className="traveler-profile-chips">
                        {parseTags(guide.locationsShown).map((loc, idx) => (
                            <span key={idx} className="traveler-profile-chip location-chip">📍 {loc}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Services Section */}
            {guide.servicesProvided && (
                <div className="traveler-profile-section">
                    <h3 className="traveler-profile-section-title">Included Services</h3>
                    <div className="traveler-profile-chips">
                        {parseTags(guide.servicesProvided).map((service, idx) => (
                            <span key={idx} className="traveler-profile-chip">⚡ {service}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience Gallery */}
            <div className="traveler-gallery-container">
                <h3 className="traveler-profile-section-title">Experience Gallery</h3>
                
                {loadingPosts ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[1, 2].map(n => (
                            <div key={n} style={{ height: '280px', borderRadius: '12px', background: '#eee', animation: 'pulse 1.5s infinite' }} />
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--lp-text-muted)', fontSize: '0.9rem' }}>
                        No experience posts uploaded yet.
                    </div>
                ) : (
                    <div>
                        {posts.map(post => {
                            const imageUrlsStr = post.imageUrls || post.imageUrl || '';
                            const images = imageUrlsStr ? imageUrlsStr.split(',').filter(Boolean) : [];
                            const activeIndex = postCarouselIndices[post.id] || 0;
                            const currentImage = images[activeIndex];

                            return (
                                <div key={post.id} className="traveler-gallery-post-card">
                                    {/* Post Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid rgba(157, 102, 56, 0.08)' }}>
                                        {post.location ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--lp-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                                    <circle cx="12" cy="10" r="3"/>
                                                </svg>
                                                <span>{post.location}</span>
                                            </div>
                                        ) : (
                                            <div style={{ color: 'var(--lp-text-muted)', fontSize: '0.85rem' }}>Experience Trip</div>
                                        )}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--lp-text-muted)' }}>
                                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                    </div>

                                    {/* Post Slide Area */}
                                    <div style={{ position: 'relative', width: '100%', height: '260px', background: '#f5f5f5', overflow: 'hidden' }}>
                                        {currentImage ? (
                                            isVideoFile(currentImage) ? (
                                                <video 
                                                    src={`http://localhost:8080/api/guides/files/${currentImage}`} 
                                                    controls 
                                                    playsInline
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                            ) : (
                                                <img 
                                                    src={`http://localhost:8080/api/guides/files/${currentImage}`} 
                                                    alt="Post Slide" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                            )
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Media</div>
                                        )}

                                        {images.length > 1 && (
                                            <>
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.stopPropagation(); handlePrevImage(post.id, images.length); }}
                                                    style={{
                                                        position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                                                        background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '50%',
                                                        width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                        zIndex: 2
                                                    }}
                                                >
                                                    ←
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.stopPropagation(); handleNextImage(post.id, images.length); }}
                                                    style={{
                                                        position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                                                        background: 'rgba(255, 255, 255, 0.8)', border: 'none', borderRadius: '50%',
                                                        width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', color: '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                                                        zIndex: 2
                                                    }}
                                                >
                                                    →
                                                </button>
                                                <div style={{
                                                    position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex',
                                                    justifyContent: 'center', gap: '6px', zIndex: 2
                                                }}>
                                                    {images.map((_, idx) => (
                                                        <span 
                                                            key={idx}
                                                            style={{
                                                                width: '6px', height: '6px', borderRadius: '50%',
                                                                background: idx === activeIndex ? '#FF653F' : 'rgba(255, 255, 255, 0.6)',
                                                                transition: 'background 0.2s'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Post Footer */}
                                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* Likes Actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <button 
                                                type="button"
                                                onClick={() => handleLike(post.id)}
                                                style={{
                                                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d4d'
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                                                </svg>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--lp-text-dark)' }}>{post.likesCount || 0}</span>
                                            </button>
                                        </div>

                                        {/* Caption */}
                                        {post.caption && (
                                            <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', lineHeight: '1.45', color: 'var(--lp-text-dark)' }}>
                                                {post.caption}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        {post.tags && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                                                {parseTags(post.tags).map((tag, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        style={{ 
                                                            fontSize: '0.8rem', 
                                                            fontWeight: 600, 
                                                            color: 'var(--lp-primary)', 
                                                            background: 'rgba(157, 102, 56, 0.05)', 
                                                            padding: '2px 8px', 
                                                            borderRadius: '4px' 
                                                        }}
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TravelerGuideProfile;
