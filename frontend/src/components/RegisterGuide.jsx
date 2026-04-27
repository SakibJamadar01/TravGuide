import React, { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createGuide } from '../api/guideApi';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FraWI3NzciLCJhIjoiY2x3bm16NjljMDBreTJqcXp6NHR6NHR6biJ9.placeholder';

const RegisterGuide = ({ onRegisterSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        city: '',
        bio: '',
        pricePerDay: '',
        latitude: null,
        longitude: null
    });

    const [viewState, setViewState] = useState({
        longitude: 78.9629,
        latitude: 20.5937,
        zoom: 4
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMapClick = (e) => {
        const { lng, lat } = e.lngLat;
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) {
            alert('Please select your location on the map');
            return;
        }
        try {
            await createGuide({
                ...formData,
                pricePerDay: parseFloat(formData.pricePerDay),
                rating: 5.0
            });
            alert('Guide registered successfully!');
            onRegisterSuccess();
        } catch (error) {
            console.error('Error registering guide:', error);
            alert('Error registering guide.');
        }
    };

    return (
        <main className="register-container">
            <header>
                <h1>Become a Local Expert</h1>
                <p onClick={onCancel} style={{ cursor: 'pointer', textDecoration: 'underline' }}>← Back to Home</p>
            </header>

            <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Bio</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>Click on the map to set your location:</label>
                    <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: '5px' }}>
                        <Map
                            {...viewState}
                            onMove={evt => setViewState(evt.viewState)}
                            onClick={handleMapClick}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            mapboxAccessToken={MAPBOX_TOKEN}
                        >
                            <NavigationControl position="top-right" />
                            {formData.latitude && formData.longitude && (
                                <Marker longitude={formData.longitude} latitude={formData.latitude} anchor="bottom">
                                    <div style={{ fontSize: '24px' }}>📍</div>
                                </Marker>
                            )}
                        </Map>
                    </div>
                </div>

                <div className="form-group">
                    <label>Price per Day ($)</label>
                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} required />
                </div>
                <button type="submit" className="submit-btn">Register as Guide</button>
            </form>
        </main>
    );
};

export default RegisterGuide;
