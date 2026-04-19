import { useState, useRef, useMemo, useEffect } from 'react';
import { Send, MapPin, Loader2, Search } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to recenter map
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 15);
  }, [coords, map]);
  return null;
}

export default function Report() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { currentUser } = useAuth();

  // Location states
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState({ lat: 20.5937, lng: 78.9629 }); // Default India
  const [isLocating, setIsLocating] = useState(false);
  const markerRef = useRef(null);

  // Reverse Geocoding: Get text address from Lat/Lng
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        // clean up the long string slightly
        const shortAddr = data.display_name.split(',').slice(0, 3).join(',');
        setLocationText(shortAddr);
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  };

  // Forward Geocoding: Get Lat/Lng from text address search
  const handleSearchAddress = async () => {
    if (!locationText) return;
    setIsLocating(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        setLocationText(result.display_name.split(',').slice(0, 3).join(','));
      } else {
        alert("Location not found! Try dragging the pin instead.");
      }
    } catch (e) {
      console.error("Search failed", e);
    }
    setIsLocating(false);
  };

  // HTML5 GPS Geolocation
  const handleAutoDetect = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(newCoords);
        reverseGeocode(newCoords.lat, newCoords.lng);
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        alert('Failed to get GPS location. Please allow permissions or search manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Marker drag event
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const position = marker.getLatLng();
          setCoords({ lat: position.lat, lng: position.lng });
          reverseGeocode(position.lat, position.lng);
        }
      },
    }),
    [],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const reportData = {
      clinicName: formData.get('clinicName'),
      location: locationText, // Save the updated accurate location
      status: formData.get('status'),
      comment: formData.get('comment'),
      reportedBy: currentUser ? currentUser.email : 'Anonymous',
      timestamp: serverTimestamp(),
      lat: coords.lat,
      lng: coords.lng
    };

    try {
      await addDoc(collection(db, 'reports'), reportData);
      
      setShowSuccess(true);
      e.target.reset();
      setLocationText('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to save report.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div className="bg-white px-6 py-6 shadow-sm rounded-xl border border-gray-100 bg-primary">
          <h3 className="text-xl leading-6 font-bold text-white">Report Clinic Status</h3>
          <p className="mt-1 text-sm text-blue-100">Pinpoint accurate data helps ensure maximum rural healthcare transparency.</p>
      </div>

      {showSuccess && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200 shadow-sm animate-fade-in-up">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Successfully submitted exact coordinates to Firebase!</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column 1: Map Picker */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden flex flex-col h-[500px]">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
             <h4 className="font-semibold text-gray-800 flex items-center">
               <MapPin className="w-5 h-5 mr-2 text-primary" /> Select Exact Location
             </h4>
             <button 
                type="button" 
                onClick={handleAutoDetect} 
                disabled={isLocating}
                className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 flex items-center shadow-sm text-primary font-medium"
             >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : '📍 Use My GPS'}
             </button>
           </div>

           <div className="flex-grow z-0 relative">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[400] bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold shadow text-gray-700 border border-gray-200">
                Drag the pin to exactly where the clinic is!
              </div>

              <MapContainer center={[coords.lat, coords.lng]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker 
                  draggable={true} 
                  eventHandlers={eventHandlers} 
                  position={[coords.lat, coords.lng]} 
                  ref={markerRef}
                >
                  <Popup>Drag me to the clinic!</Popup>
                </Marker>
                <RecenterMap coords={coords} />
              </MapContainer>
           </div>
        </div>

        {/* Column 2: Form Details */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 h-[500px] flex flex-col">
          <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between">
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Matched Address</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input 
                    type="text" 
                    required 
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchAddress();
                      }
                    }}
                    className="focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 border p-2.5 rounded-l-md" 
                    placeholder="Search city or drag map..." 
                  />
                  <button 
                    type="button" 
                    onClick={handleSearchAddress}
                    className="-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">Clinic Name</label>
                <input type="text" name="clinicName" id="clinicName" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2.5" placeholder="e.g. Riverside District Hospital" />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select id="status" name="status" className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border">
                  <option value="Open">✅ Open & Active</option>
                  <option value="Closed">❌ Closed</option>
                  <option value="No Doctor">⚠️ No Doctor Available</option>
                  <option value="No Medicine">⚠️ No Medicines Available</option>
                </select>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Comment (Optional)</label>
                <textarea id="comment" name="comment" rows="2" className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md p-2.5" placeholder="Additional details..."></textarea>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={isSubmitting || isLocating} 
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow text-sm font-bold text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
               >
                {isSubmitting ? 'Sumitting Safely...' : <><Send className="w-5 h-5 mr-2" /> Report & Lock Location</>}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

// Quick component for success checkmark missing above
function CheckCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
