import React from 'react';

const LandingPage = ({ onSelectMode }) => {
    return (
        <div className="landing-container">
            <div className="split-panel traveler-panel" onClick={() => onSelectMode('traveler')}>
                <div className="panel-overlay"></div>
                <div className="panel-content">
                    <h1>I am a Traveler</h1>
                    <p>Find the best local experts to guide your journey.</p>
                    <button className="landing-btn">Explore</button>
                </div>
            </div>
            <div className="split-panel guide-panel" onClick={() => onSelectMode('guide')}>
                <div className="panel-overlay"></div>
                <div className="panel-content">
                    <h1>I am a Guide</h1>
                    <p>Share your local knowledge and earn money.</p>
                    <button className="landing-btn">Start Hosting</button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
