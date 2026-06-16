import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom divIcon to match the old signature-marker
const createCustomIcon = (price, isSelected) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="signature-marker ${isSelected ? 'selected' : ''}">$${price}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const GuideMap = ({ guides, selectedId, onSelect, center = { lat: 20.5937, lng: 78.9629 }, zoom = 5 }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {guides.filter(g => g.latitude != null && g.longitude != null).map((guide) => (
          <Marker 
            key={guide.id}
            position={[Number(guide.latitude), Number(guide.longitude)]}
            icon={createCustomIcon(guide.pricePerDay, selectedId === guide.id)}
            eventHandlers={{
              click: () => onSelect(guide.id),
            }}
          >
            <Popup>
              <div className="map-popup-card">
                <h4 style={{ margin: '0 0 6px 0', fontFamily: 'Outfit', color: '#1E104E' }}>{guide.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#452E5A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--lp-primary)', flexShrink: 0 }}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {guide.city}
                </p>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', color: '#FF653F', fontFamily: 'Outfit' }}>
                  ${guide.pricePerDay} <span style={{ fontWeight: 400, color: '#999' }}>/ day</span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default GuideMap;

