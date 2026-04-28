import React, { useState, useEffect } from 'react';
import './styles/App.css';
import { getGuides } from './api/guideApi';
import GuideList from './components/GuideList';
import GuideMap from './components/GuideMap';
import RegisterGuide from './components/RegisterGuide';

function App() {
    const [guides, setGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
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
        loadGuides();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        loadGuides(searchTerm);
    };

    return (
        <div className="App">
            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">
                    <span style={{ fontSize: '2rem' }}>🌍</span>
                    <span>TravGuide</span>
                </div>

                <div className="search-bar-container">
                    <form onSubmit={handleSearch} className="airbnb-search">
                        <input 
                            type="text" 
                            placeholder="Start your search" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="search-icon-btn">
                            <span style={{ fontSize: '14px' }}>🔍</span>
                        </button>
                    </form>
                </div>

                <div className="nav-actions">
                    <button 
                        className="btn-secondary"
                        onClick={() => setIsRegistering(true)}
                        style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '0.9rem' }}
                    >
                        Switch to hosting
                    </button>
                </div>
            </nav>

            {/* Main Content (Split View) */}
            <main className="main-content">
                <div className="list-container">
                    <GuideList 
                        guides={guides} 
                        loading={loading} 
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </div>

                <div className="map-container-wrapper">
                    <GuideMap 
                        guides={guides} 
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        center={mapCenter} 
                        zoom={5} 
                    />
                </div>
            </main>

            {/* Registration Overlay */}
            {isRegistering && (
                <div className="register-overlay">
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <button 
                            className="btn-secondary" 
                            onClick={() => setIsRegistering(false)}
                            style={{ marginBottom: '20px' }}
                        >
                            ✕ Close
                        </button>
                        <RegisterGuide 
                            onRegisterSuccess={() => {
                                setIsRegistering(false);
                                loadGuides();
                            }} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
