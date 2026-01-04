import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Navigation } from "lucide-react";

/**
 * Props:
 * - onLocationSelect: (payload) => void
 *   payload = { address: string, lat: number|null, lng: number|null, source: "map"|"gps"|"manual" }
 * - initialLocation:
 *   - string (address)
 *   - or { address?: string, lat?: number, lng?: number }
 */
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const defaultCenter = useMemo(() => ({ lat: 33.8938, lng: 35.5018 }), []);
  const [selected, setSelected] = useState(null); // {lat, lng} | null
  const [address, setAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const lastGeocodeIdRef = useRef(0);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyA2sDabFv8XdkWGWQ6OBRFK17iDnDqcN9Y",
    // libraries: ["places"], // only if you use Places features
  });

  // Normalize initialLocation
  useEffect(() => {
    if (!initialLocation) return;

    if (typeof initialLocation === "string") {
      setAddress(initialLocation);
      onLocationSelect?.({
        address: initialLocation,
        lat: null,
        lng: null,
        source: "manual",
      });
      return;
    }

    const initAddr = initialLocation.address || "";
    const initLat = typeof initialLocation.lat === "number" ? initialLocation.lat : null;
    const initLng = typeof initialLocation.lng === "number" ? initialLocation.lng : null;

    if (initAddr) setAddress(initAddr);

    if (initLat != null && initLng != null) {
      const loc = { lat: initLat, lng: initLng };
      setSelected(loc);
      onLocationSelect?.({
        address: initAddr || "",
        lat: initLat,
        lng: initLng,
        source: "map",
      });
    } else if (initAddr) {
      onLocationSelect?.({
        address: initAddr,
        lat: null,
        lng: null,
        source: "manual",
      });
    }
  }, [initialLocation, onLocationSelect]);

  const reverseGeocode = useCallback(
    (loc, source) => {
      if (!geocoderRef.current || !window.google?.maps) {
        const coordAddress = `Lat: ${loc.lat.toFixed(5)}, Lng: ${loc.lng.toFixed(5)}`;
        setAddress(coordAddress);
        onLocationSelect?.({ address: coordAddress, lat: loc.lat, lng: loc.lng, source });
        return;
      }

      const geocodeId = ++lastGeocodeIdRef.current;

      geocoderRef.current.geocode({ location: loc }, (results, status) => {
        if (geocodeId !== lastGeocodeIdRef.current) return;

        if (status === "OK" && results?.[0]?.formatted_address) {
          const formatted = results[0].formatted_address;
          setAddress(formatted);
          onLocationSelect?.({ address: formatted, lat: loc.lat, lng: loc.lng, source });
        } else {
          const coordAddress = `Lat: ${loc.lat.toFixed(5)}, Lng: ${loc.lng.toFixed(5)}`;
          setAddress(coordAddress);
          onLocationSelect?.({ address: coordAddress, lat: loc.lat, lng: loc.lng, source });
        }
      });
    },
    [onLocationSelect]
  );

  const pickLocation = useCallback(
    (loc, source) => {
      setSelected(loc);
      reverseGeocode(loc, source);
    },
    [reverseGeocode]
  );

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();

    if (selected) {
      map.panTo(selected);
      map.setZoom(15);
    }
  }, [selected]);

  const onMapClick = useCallback(
    (e) => {
      if (!e?.latLng) return;
      pickLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() }, "map");
    },
    [pickLocation]
  );

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        pickLocation(loc, "gps");
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(17);
      },
      (err) => {
        setIsLocating(false);
        let msg = "Failed to get your location.";
        if (err.code === 1) msg = "Location permission denied. Allow it from the browser settings.";
        if (err.code === 2) msg = "Location unavailable. Check device/location settings.";
        if (err.code === 3) msg = "Location request timed out. Try again.";
        alert(msg);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
    );
  }, [pickLocation]);

  const center = useMemo(() => selected ?? defaultCenter, [selected, defaultCenter]);

  // Fallback: if map fails to load, provide manual entry
  if (loadError) {
    return (
      <div className="location-picker-error">
        <div className="form-group">
          <label>
            Location <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter your address manually"
            value={address}
            onChange={(e) => {
              const v = e.target.value;
              setAddress(v);
              onLocationSelect?.({ address: v, lat: null, lng: null, source: "manual" });
            }}
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />
          <small style={{ color: "orange", marginTop: "5px", display: "block" }}>
            Map could not be loaded. Check API key, billing, and referrer restrictions.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker">
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <label style={{ fontWeight: 600, color: "#333" }}>Pin your delivery location</label>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={!isLoaded || isLocating}
          style={{
            background: "none",
            border: "none",
            color: "#2e7d32",
            cursor: isLoaded ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.9rem",
            fontWeight: 600,
            opacity: isLoaded ? 1 : 0.6,
          }}
        >
          <Navigation size={16} />
          {isLocating ? "Locating..." : "Use Current Location"}
        </button>
      </div>

      <div
        style={{
          width: "100%",
          height: 320,
          borderRadius: 12,
          overflow: "hidden",
          border: "2px solid #e0e0e0",
          position: "relative",
        }}
      >
        {!isLoaded ? (
          <div style={{ padding: 12 }}>Loading map...</div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={selected ? 15 : 13}
            onLoad={onMapLoad}
            onClick={onMapClick}
            options={{
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: false,
              clickableIcons: false,
            }}
          >
            <MarkerF
              position={selected ?? defaultCenter}
              draggable
              onDragEnd={(e) => {
                if (!e?.latLng) return;
                pickLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() }, "map");
              }}
            />
          </GoogleMap>
        )}
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={address}
            readOnly
            placeholder="No location selected"
            style={{
              width: "100%",
              padding: "10px 10px 10px 35px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
            }}
          />
          <MapPin
            size={18}
            color="#2e7d32"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}
          />
        </div>

        <small style={{ display: "block", marginTop: 6, opacity: 0.75 }}>
          Tip: Click the map or drag the pin to adjust.
        </small>
      </div>
    </div>
  );
};

export default LocationPicker;
