import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { createGuide } from '../api/guideApi';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const RegisterGuide = ({ onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        city: '',
        bio: '',
        pricePerDay: '',
        latitude: null,
        longitude: null
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMapClick = (e) => {
        const lat = e.detail.latLng.lat;
        const lng = e.detail.latLng.lng;
        setFormData({ ...formData, latitude: lat, longitude: lng });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.latitude || !formData.longitude) {
            alert('Please click on the map to set your location');
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
        <div className="register-form-box">
            <h1>Host your expert services</h1>
            <p style={{ color: '#717171', marginBottom: '24px' }}>Join our community of local guides.</p>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>What's your name?</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Full Name" />
                </div>
                <div className="form-group">
                    <label>Email address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email" />
                </div>
                <div className="form-group">
                    <label>Where are you based?</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="City" />
                </div>
                <div className="form-group">
                    <label>Tell us about your expertise</label>
                    <textarea name="bio" value={formData.bio} onChange={handleChange} required placeholder="Bio..." />
                </div>

                <div className="form-group">
                    <label>Pin your exact location on the map:</label>
                    <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #dddddd', marginTop: '10px' }}>
                        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                            <Map
                                defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
                                defaultZoom={4}
                                mapId={'bf50473b22538181'}
                                onClick={handleMapClick}
                            >
                                {formData.latitude && (
                                    <AdvancedMarker position={{ lat: formData.latitude, lng: formData.longitude }} />
                                )}
                            </Map>
                        </APIProvider>
                    </div>
                    {formData.latitude && (
                        <p style={{ fontSize: '12px', color: '#059669', marginTop: '5px' }}>✓ Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>
                    )}
                </div>

                <div className="form-group">
                    <label>Price per day ($)</label>
                    <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} required placeholder="e.g. 50" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Complete Registration</button>
            </form>
        </div>
    );
};

export default RegisterGuide;
