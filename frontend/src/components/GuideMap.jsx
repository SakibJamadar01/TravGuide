import React, { useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// Note: For production, you should get your own free API key from mapbox.com
// This is a placeholder for demonstration
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2FraWI3NzciLCJhIjoiY2x3bm16NjljMDBreTJqcXp6NHR6NHR6biJ9.placeholder'; 

const GuideMap = ({ guides, center = { lat: 20.5937, lng: 78.9629 }, zoom = 4 }) => {
    const [viewState, setViewState] = useState({
        longitude: center.lng,
        latitude: center.lat,
        zoom: zoom
    });

    const [selectedGuide, setSelectedGuide] = useState(null);

    // Update view when center changes (e.g. on search)
    useEffect(() => {
        setViewState({
            longitude: center.lng,
            latitude: center.lat,
            zoom: zoom
        });
    }, [center, zoom]);

    return (
        <div style={{ height: '400px', width: '90%', margin: '20px auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                <NavigationControl position="top-right" />

                {guides.map((guide) => (
                    guide.latitude && guide.longitude && (
                        <Marker 
                            key={guide.id} 
                            longitude={guide.longitude} 
                            latitude={guide.latitude} 
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                setSelectedGuide(guide);
                            }}
                        >
                            <div style={{ cursor: 'pointer', fontSize: '24px' }}>📍</div>
                        </Marker>
                    )
                ))}

                {selectedGuide && (
                    <Popup
                        anchor="top"
                        longitude={selectedGuide.longitude}
                        latitude={selectedGuide.latitude}
                        onClose={() => setSelectedGuide(null)}
                    >
                        <div style={{ padding: '5px' }}>
                            <h3 style={{ margin: '0 0 5px 0', color: '#2563eb' }}>{selectedGuide.name}</h3>
                            <p style={{ margin: 0, fontSize: '14px' }}>{selectedGuide.city}</p>
                            <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>${selectedGuide.pricePerDay}/day</p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

export default GuideMap;
