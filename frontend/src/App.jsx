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
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [mapZoom, setMapZoom] = useState(5);

    const loadGuides = async (city = '') => {
        setLoading(true);
        try {
            const data = await getGuides(city);
            setGuides(data);
            if (data.length > 0 && data[0].latitude) {
                setMapCenter([data[0].latitude, data[0].longitude]);
                setMapZoom(10);
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

    if (isRegistering) {
        return (
            <RegisterGuide 
                onRegisterSuccess={() => {
                    setIsRegistering(false);
                    loadGuides();
                }} 
                onCancel={() => setIsRegistering(false)} 
            />
        );
    }

    return (
        <div className="App">
            <header>
                <h1>TravGuide</h1>
                <p>Explore the world with local experts</p>
                <br />
                <button 
                    style={{ backgroundColor: 'white', color: 'var(--primary)' }}
                    onClick={() => setIsRegistering(true)}
                >
                    Join as a Guide
                </button>
            </header>

            <main>
                <section className="search-section">
                    <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Enter city (e.g. Paris)" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Search Guides</button>
                    </form>
                </section>

                <GuideMap guides={guides} center={mapCenter} zoom={mapZoom} />

                <GuideList guides={guides} loading={loading} />
            </main>
        </div>
    );
}

export default App;
