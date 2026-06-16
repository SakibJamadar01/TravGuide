import React, { useState, useEffect } from 'react';
import './styles/App.css';
import { getGuides } from './api/guideApi';
import GuideList from './components/GuideList';
import GuideMap from './components/GuideMap';
import RegisterGuide from './components/RegisterGuide';
import LandingPage from './components/LandingPage';
import travGuideLogo from './assets/TravGuideLogo.png';

function App() {
    const [currentView, setCurrentView] = useState('landing');
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });

    const loadGuides = async (city = '') => {
        setLoading(true);
        try {
            const data = await getGuides(city);
            setGuides(data);
            if (data.length > 0 && data[0].latitude) {
                setMapCenter({ lat: data[0].latitude, lng: data[0].longitude });
            }
        } catch (error) {
            console.error('Failed to load guides:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentView === 'traveler') {
            loadGuides();
        }
    }, [currentView]);

    const handleSearch = (e) => {
        e.preventDefault();
        loadGuides(searchTerm);
    };

    if (currentView === 'landing') {
        return <LandingPage onSelectMode={setCurrentView} />;
    }

    if (currentView === 'guide') {
        return (
            <RegisterGuide 
                onRegisterSuccess={() => setCurrentView('traveler')} 
                onCancel={() => setCurrentView('landing')}
            />
        );
    }

    return (
        <div className="traveler-layout">
            {/* Top Bar */}
            <header className="top-bar">
                <div className="top-bar-left">
                    <div className="logo-mini" onClick={() => setCurrentView('landing')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <img src={travGuideLogo} alt="TravGuide Logo" style={{ height: '36px' }} />
                        <span style={{ fontFamily: 'Chillax, sans-serif', fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.5px', color: 'var(--lp-text-dark)' }}>TravGuide</span>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <input 
                        type="text" 
                        className="search-input"
                        placeholder="Search by city..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-btn">Search</button>
                </form>

                <button className="host-btn" onClick={() => setCurrentView('guide')}>
                    Become a Guide
                </button>
            </header>

            {/* Split Content */}
            <div className="split-content">
                {/* Left: Guide List */}
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h2>{guides.length} guides available</h2>
                    </div>
                    <div className="sidebar-list">
                        <GuideList 
                            guides={guides} 
                            loading={loading} 
                            selectedId={selectedId}
                            onSelect={setSelectedId}
                        />
                    </div>
                </aside>

                {/* Right: Map */}
                <div className="map-area">
                    <GuideMap 
                        guides={guides} 
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        center={mapCenter} 
                        zoom={5} 
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
