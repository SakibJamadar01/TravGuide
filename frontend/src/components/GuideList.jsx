import React from 'react';

const GuideList = ({ guides, loading }) => {
    if (loading) return <p>Loading guides...</p>;
    if (guides.length === 0) return <p>No guides found yet. Add some in the database!</p>;

    return (
        <section id="guide-list" className="guide-grid">
            {guides.map((guide) => (
                <div key={guide.id} className="guide-card">
                    <h3>{guide.name}</h3>
                    <p><strong>City:</strong> {guide.city}</p>
                    <p>{guide.bio}</p>
                    <p className="price">${guide.pricePerDay} / day</p>
                    <button className="book-btn">Contact Guide</button>
                </div>
            ))}
        </section>
    );
};

export default GuideList;
