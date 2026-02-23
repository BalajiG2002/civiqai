import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const MAPS_KEY = process.env.REACT_APP_MAPS_KEY;

const PIN_COLORS = {
  open:        '#dc2626',
  in_progress: '#d97706',
  resolved:    '#16a34a'
};

export default function MapPanel({ complaints, onPinClick }) {
  const mapRef  = useRef(null);
  const gMapRef = useRef(null);
  const markers = useRef({});

  useEffect(() => {
    const loader = new Loader({
      apiKey: MAPS_KEY,
      version: 'weekly'
    });

    loader.load().then(() => {
      gMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 13.0827, lng: 80.2707 },
        zoom: 12,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
        ]
      });
    });
  }, []);

  // Sync markers with complaints
  useEffect(() => {
    if (!gMapRef.current) return;

    complaints.forEach(c => {
      if (!c.lat || !c.lng) return;

      if (markers.current[c.id]) {
        // Update existing marker color
        markers.current[c.id].setIcon(buildIcon(c.status));
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position: { lat: c.lat, lng: c.lng },
          map: gMapRef.current,
          icon: buildIcon(c.status),
          title: c.id
        });

        const info = new window.google.maps.InfoWindow({
          content: buildInfoContent(c)
        });

        marker.addListener('click', () => {
          info.open(gMapRef.current, marker);
          onPinClick?.(c);
        });

        markers.current[c.id] = marker;
      }
    });
  }, [complaints, onPinClick]);

  return (
    <div ref={mapRef}
         className="w-full h-full rounded-xl overflow-hidden" />
  );
}

function buildIcon(status) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: PIN_COLORS[status] || PIN_COLORS.open,
    fillOpacity: 0.9,
    strokeWeight: 2,
    strokeColor: '#ffffff',
    scale: 10
  };
}

function buildInfoContent(c) {
  return `
    <div style="font-family:sans-serif;padding:8px;max-width:200px">
      <b>${c.issue_type?.replace(/_/g,' ')}</b><br/>
      <small>${c.location}</small><br/>
      <span style="color:${PIN_COLORS[c.status]};font-weight:bold">
        ${c.status?.toUpperCase()}
      </span>
      ${c.priority ? `· <b>${c.priority}</b>` : ''}
    </div>
  `;
}
