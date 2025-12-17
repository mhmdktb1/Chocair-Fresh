import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);

  // Default location (Beirut)
  const defaultCenter = { lat: 33.8938, lng: 35.5018 };

  useEffect(() => {
    // Handle Google Maps Auth Failure
    window.gm_authFailure = () => {
      console.error("Google Maps authentication failed");
      setMapError(true);
      setLoading(false);
    };

    const initMap = () => {
      if (!window.google) {
        return;
      }

      try {
        const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
          center: defaultCenter,
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        const marker = new window.google.maps.Marker({
          position: defaultCenter,
          map: mapInstance,
          draggable: true,
          animation: window.google.maps.Animation.DROP
        });

        markerRef.current = marker;
        setMap(mapInstance);
        setLoading(false);

        // Listen for drag end
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          geocodePosition(position);
        });

        // Listen for map click
        mapInstance.addListener('click', (e) => {
          marker.setPosition(e.latLng);
          geocodePosition(e.latLng);
        });
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError(true);
        setLoading(false);
      }
    };

    if (!window.google) {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initMap();
        }
      }, 100);
      
      // Timeout after 5 seconds if google maps never loads
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.google) {
          setMapError(true);
          setLoading(false);
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      initMap();
    }
  }, []);

  const geocodePosition = (pos) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const newAddress = results[0].formatted_address;
        setAddress(newAddress);
        onLocationSelect(newAddress);
      }
    });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (map) {
            map.setCenter(pos);
            map.setZoom(15);
            markerRef.current.setPosition(pos);
            geocodePosition(pos);
          }
          setLoading(false);
        },
        () => {
          alert("Error: The Geolocation service failed.");
          setLoading(false);
        }
      );
    } else {
      alert("Error: Your browser doesn't support geolocation.");
    }
  };

  if (mapError) {
    return (
      <div className="location-picker-error">
        <div className="form-group">
          <label>Location <span style={{color: 'red'}}>*</span></label>
          <input
            type="text"
            placeholder="Enter your address manually (e.g. Beirut, Hamra St.)"
            value={initialLocation || address}
            onChange={(e) => {
              setAddress(e.target.value);
              onLocationSelect(e.target.value);
            }}
            className="form-input"
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }}
          />
          <small style={{ color: 'orange', marginTop: '5px', display: 'block' }}>
            Map could not be loaded. Please enter address manually.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker">
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, color: '#333' }}>Pin your delivery location</label>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          style={{
            background: 'none',
            border: 'none',
            color: '#2e7d32',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          <Navigation size={16} /> Use Current Location
        </button>
      </div>
      
      <div 
        id="map" 
        style={{ 
          width: '100%', 
          height: '300px', 
          borderRadius: '12px', 
          marginBottom: '15px',
          border: '2px solid #e0e0e0'
        }}
      ></div>

      {address && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '8px', 
          display: 'flex', 
          gap: '10px',
          alignItems: 'center',
          fontSize: '0.9rem',
          color: '#555'
        }}>
          <MapPin size={18} color="#2e7d32" />
          {address}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
