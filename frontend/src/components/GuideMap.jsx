import React, { useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow,
  Pin
} from '@vis.gl/react-google-maps';

// Get your API key from Google Cloud Console
// For now, this is a placeholder
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Airbnb-like Map Style
const mapStyle = [
  { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] },
  { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
  { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
  { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#c8d7d4" }, { "visibility": "on" }] }
];

const GuideMap = ({ guides, selectedId, onSelect, center = { lat: 20.5937, lng: 78.9629 }, zoom = 5 }) => {
  const [infoWindowData, setInfoWindowData] = useState(null);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        mapId={'bf50473b22538181'} // Use a Map ID for Advanced Markers
        styles={mapStyle}
      >
        {guides.map((guide) => (
          <AdvancedMarker
            key={guide.id}
            position={{ lat: guide.latitude, lng: guide.longitude }}
            onClick={() => {
                setInfoWindowData(guide);
                onSelect(guide.id);
            }}
          >
            <div className={`price-marker ${selectedId === guide.id ? 'selected' : ''}`}>
              ${guide.pricePerDay}
            </div>
          </AdvancedMarker>
        ))}

        {infoWindowData && (
          <InfoWindow
            position={{ lat: infoWindowData.latitude, lng: infoWindowData.longitude }}
            onCloseClick={() => setInfoWindowData(null)}
          >
            <div className="map-popup-card">
              <div className="image-placeholder" style={{ height: '100px', marginBottom: '8px' }}></div>
              <h4 style={{ margin: '0 0 4px 0' }}>{infoWindowData.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#717171' }}>{infoWindowData.city}</p>
              <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>${infoWindowData.pricePerDay}<span> / day</span></p>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default GuideMap;
