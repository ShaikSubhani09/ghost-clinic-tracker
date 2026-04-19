import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// SVG generator for colored pins
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-colored-icon',
    html: `<svg width="34" height="46" viewBox="0 0 24 36" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.25));">
             <path d="M12 0C5.372 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.372-12-12-12zm0 17c-2.761 0-5-2.239-5-5s2.239-5 5-5 5 2.239 5 5-2.239 5-5 5z" />
           </svg>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -46]
  });
};

const iconRed = createCustomIcon('#dc2626');     // Closed
const iconGreen = createCustomIcon('#16a34a');   // Open
const iconYellow = createCustomIcon('#f59e0b');  // Issues (No Doctor/Medicine)

export default function MapView() {
  const [reports, setReports] = useState([]);
  
  // Center roughly on India, or dynamic if you prefer
  const defaultPosition = [20.5937, 78.9629]; 
  
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newReports = [];
      snapshot.forEach(doc => {
         const data = doc.data();
         
         // If physical coordinates don't exist from the Geolocation update, generate arbitrary offset
         const hash = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
         const latOffset = (hash % 100) / 1000 - 0.05;
         const lngOffset = (hash % 50) / 1000 - 0.025;
         
         const lat = data.lat || 20.5937 + latOffset;
         const lng = data.lng || 78.9629 + lngOffset;
         
         let timeString = 'Just now';
         if (data.timestamp?.toDate) {
            timeString = data.timestamp.toDate().toLocaleString();
         }

         let renderIcon = iconGreen; // Default to Open
         if (data.status === 'Closed') renderIcon = iconRed;
         if (data.status === 'No Doctor' || data.status === 'No Medicine') renderIcon = iconYellow;

         newReports.push({
            id: doc.id,
            clinic: data.clinicName || 'Unknown',
            status: data.status || 'Unknown',
            time: timeString,
            lat,
            lng,
            icon: renderIcon
         });
      });
      setReports(newReports);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white p-4 shadow-sm rounded-xl border border-gray-100 h-[80vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Live Clinic Map</h2>
        
        {/* Legend */}
        <div className="flex space-x-4 text-sm font-medium">
           <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-600 mr-2"></span>Open</div>
           <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-600 mr-2"></span>Closed</div>
           <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Issues</div>
        </div>
      </div>
      
      <div className="h-[calc(100%-3rem)] rounded-lg overflow-hidden border border-gray-200 z-0">
        <MapContainer center={defaultPosition} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {reports.map((clinic) => (
            <Marker key={clinic.id} position={[clinic.lat, clinic.lng]} icon={clinic.icon}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-gray-900">{clinic.clinic}</h3>
                  <p className="text-sm text-gray-600 mb-1">Status: <span className={`font-semibold ${clinic.status === 'Closed' ? 'text-red-600' : 'text-gray-900'}`}>{clinic.status}</span></p>
                  <p className="text-xs text-gray-400">Reported {clinic.time}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
