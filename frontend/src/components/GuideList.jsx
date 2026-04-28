import React from 'react';

const GuideList = ({ guides, loading, selectedId, onSelect }) => {
    if (loading) {
        return <div className="list-message">Finding guides...</div>;
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
                        <span className="card-rating">★ {guide.rating || '5.0'}</span>
                    </div>
                    <p className="card-city">📍 {guide.city}</p>
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
