import React, { useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow
} from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const GuideMap = ({ guides, selectedId, onSelect, center = { lat: 20.5937, lng: 78.9629 }, zoom = 5 }) => {
  const [infoWindowData, setInfoWindowData] = useState(null);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        mapId={'bf50473b22538181'}
      >
        {guides.filter(g => g.latitude != null && g.longitude != null).map((guide) => (
          <AdvancedMarker
            key={guide.id}
            position={{ lat: Number(guide.latitude), lng: Number(guide.longitude) }}
            onClick={() => {
              setInfoWindowData(guide);
              onSelect(guide.id);
            }}
          >
            <div className={`signature-marker ${selectedId === guide.id ? 'selected' : ''}`}>
              ${guide.pricePerDay}
            </div>
          </AdvancedMarker>
        ))}

        {infoWindowData && (
          <InfoWindow
            position={{ lat: Number(infoWindowData.latitude), lng: Number(infoWindowData.longitude) }}
            onCloseClick={() => setInfoWindowData(null)}
          >
            <div className="map-popup-card">
              <h4 style={{ margin: '0 0 6px 0', fontFamily: 'Outfit', color: '#1E104E' }}>{infoWindowData.name}</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#452E5A' }}>📍 {infoWindowData.city}</p>
              <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', color: '#FF653F', fontFamily: 'Outfit' }}>
                ${infoWindowData.pricePerDay} <span style={{ fontWeight: 400, color: '#999' }}>/ day</span>
              </p>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default GuideMap;
