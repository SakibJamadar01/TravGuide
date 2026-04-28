import React from 'react';

const GuideList = ({ guides, loading, selectedId, onSelect }) => {
    if (loading) return <div style={{ padding: '20px' }}>Searching for the best local experts...</div>;
    
    return (
        <div className="guide-grid">
            {guides.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                    <h2>No guides found in this area</h2>
                    <p>Try searching for a different city or zoom out on the map.</p>
                </div>
            ) : (
                guides.map((guide) => (
                    <div 
                        key={guide.id} 
                        className={`guide-card ${selectedId === guide.id ? 'active' : ''}`}
                        onClick={() => onSelect(guide.id)}
                        onMouseEnter={() => onSelect(guide.id)}
                    >
                        <div className="image-placeholder">
                            <div className="rating">
                                <span>★</span> {guide.rating || '5.0'}
                            </div>
                        </div>
                        <h3>{guide.name}</h3>
                        <p>{guide.city}</p>
                        <p className="bio-short" style={{ 
                            fontSize: '0.85rem', 
                            color: '#717171', 
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {guide.bio}
                        </p>
                        <p className="price">${guide.pricePerDay} <span>per day</span></p>
                    </div>
                ))
            )}
        </div>
    );
};

export default GuideList;
