import React from 'react';

const GuideList = ({ guides, loading, selectedId, onSelect }) => {
    if (loading) {
        return (
            <>
                {[1, 2, 3].map((n) => (
                    <div key={n} className="guide-card skeleton">
                        <div className="card-top">
                            <div className="skeleton-text title"></div>
                            <div className="skeleton-text rating"></div>
                        </div>
                        <div className="skeleton-text city"></div>
                        <div className="skeleton-text bio-line-1"></div>
                        <div className="skeleton-text bio-line-2"></div>
                        <div className="card-bottom">
                            <div className="skeleton-text price"></div>
                            <div className="skeleton-btn"></div>
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
                >
                    <div className="card-top">
                        <h3>{guide.name}</h3>
                        <span className="card-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                    <p className="card-bio">{guide.bio}</p>
                    <div className="card-bottom">
                        <span className="card-price">${guide.pricePerDay}<span> / day</span></span>
                        <button className="card-contact-btn">Contact</button>
                    </div>
                </div>
            ))}
        </>
    );
};

export default GuideList;
