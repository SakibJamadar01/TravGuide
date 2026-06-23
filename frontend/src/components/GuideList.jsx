import React from 'react';

const GuideList = ({ guides, loading, selectedId, onSelect }) => {
    if (loading) {
        return (
            <>
                {[1, 2, 3].map((n) => (
                    <div key={n} className="guide-card skeleton" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        {/* Skeleton Avatar */}
                        <div className="skeleton-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eee', flexShrink: 0, animation: 'pulse 1.5s infinite' }}></div>
                        
                        <div style={{ flex: 1 }}>
                            <div className="card-top">
                                <div className="skeleton-text title" style={{ width: '60%' }}></div>
                                <div className="skeleton-text rating" style={{ width: '15%' }}></div>
                            </div>
                            <div className="skeleton-text city" style={{ width: '40%' }}></div>
                            <div className="skeleton-text bio-line-1"></div>
                            <div className="skeleton-text bio-line-2"></div>
                            <div className="card-bottom">
                                <div className="skeleton-text price" style={{ width: '30%' }}></div>
                                <div className="skeleton-btn"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </>
        );
    }
    
    if (guides.length === 0) {
        return (
            <div className="list-message">
                <p>No guides found.</p>
                <p style={{ fontSize: '0.85rem', color: '#999' }}>Try a different city.</p>
            </div>
        );
    }

    return (
        <>
            {guides.map((guide) => (
                <div 
                    key={guide.id} 
                    className={`guide-card ${selectedId === guide.id ? 'active' : ''}`}
                    onClick={() => onSelect(guide.id)}
                    style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                >
                    {/* Avatar */}
                    {guide.profilePictureUrl ? (
                        <img 
                            src={`http://localhost:8080/api/guides/files/${guide.profilePictureUrl}`} 
                            alt={guide.name} 
                            style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '50%', 
                                objectFit: 'cover', 
                                border: '1.5px solid rgba(157, 102, 56, 0.15)',
                                flexShrink: 0
                            }}
                        />
                    ) : (
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            background: 'var(--lp-primary)', 
                            color: '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '1.1rem', 
                            fontWeight: '800',
                            flexShrink: 0
                        }}>
                            {guide.name ? guide.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                    )}

                    {/* Card Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="card-top">
                            <h3 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{guide.name}</h3>
                            <span className="card-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#FF653F' }}>
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                                {guide.rating || '5.0'}
                            </span>
                        </div>
                        <p className="card-city" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-primary)', flexShrink: 0 }}>
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {guide.city}
                        </p>
                        <p className="card-bio" style={{ textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {guide.bio}
                        </p>
                        
                        {/* Preview tags for locations and services */}
                        {(guide.locationsShown || guide.servicesProvided) && (
                            <div className="card-preview-tags">
                                {guide.locationsShown && guide.locationsShown.split(',').slice(0, 2).map((loc, idx) => (
                                    <span key={`loc-${idx}`} className="card-preview-tag location-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        {loc.trim()}
                                    </span>
                                ))}
                                {guide.servicesProvided && guide.servicesProvided.split(',').slice(0, 2).map((service, idx) => (
                                    <span key={`srv-${idx}`} className="card-preview-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                        </svg>
                                        {service.trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="card-bottom">
                            <span className="card-price">${guide.pricePerDay}<span> / day</span></span>
                            <button className="card-contact-btn">Explore</button>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};

export default GuideList;
