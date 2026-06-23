import React, { useState, useEffect } from 'react';
import './styles/App.css';
import { getGuides } from './api/guideApi';
import GuideList from './components/GuideList';
import GuideMap from './components/GuideMap';
import RegisterGuide from './components/RegisterGuide';
import LandingPage from './components/LandingPage';
import TravelerGuideProfile from './components/TravelerGuideProfile';
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
                    <div className="search-icon-wrapper">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
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
                {/* Left: Guide List / Profile Details */}
                <aside className="sidebar">
                    {selectedId ? (
                        (() => {
                            const selectedGuide = guides.find(g => g.id === selectedId);
                            return selectedGuide ? (
                                <TravelerGuideProfile 
                                    guide={selectedGuide} 
                                    onBack={() => setSelectedId(null)} 
                                />
                            ) : (
                                <div style={{ padding: '24px', color: 'var(--lp-text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                                    Guide details not found.
                                </div>
                            );
                        })()
                    ) : (
                        <>
                            <div className="sidebar-header">
                                <h2>Explore Guides</h2>
                                <span className="sidebar-badge">{guides.length} available</span>
                            </div>
                            <div className="sidebar-list">
                                <GuideList 
                                    guides={guides} 
                                    loading={loading} 
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                />
                            </div>
                        </>
                    )}
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
