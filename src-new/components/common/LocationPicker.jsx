import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { 
  MapPin, Navigation, ChevronRight, X, Check, Building, 
  Layers, Compass, Edit3, Plus, ArrowRight
} from "lucide-react";
import { toast } from "react-toastify";
import "./LocationPicker.css";

/**
 * Toters-Style Clean Location & Building Details Selector
 * Props:
 * - onLocationSelect: (payload) => void
 *   payload = { address: string, lat: number|null, lng: number|null, source: "map"|"gps"|"manual" }
 * - initialLocation: string | { address?: string, lat?: number, lng?: number }
 */
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const defaultCenter = useMemo(() => ({ lat: 33.8938, lng: 35.5018 }), []); // Beirut default
  const [selectedCoords, setSelectedCoords] = useState(null); // { lat, lng }
  const [areaAddress, setAreaAddress] = useState(""); // Base location from map (e.g., "Verdun, Beirut")
  
  // Structured building & floor details (standard for delivery in Lebanon)
  const [buildingDetails, setBuildingDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });

  // Modals state
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  
  // Temp states for modals
  const [tempCoords, setTempCoords] = useState(defaultCenter);
  const [tempAddress, setTempAddress] = useState("");
  const [tempDetails, setTempDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });
  const [isLocating, setIsLocating] = useState(false);

  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const lastGeocodeIdRef = useRef(0);

  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyA2sDabFv8XdkWGWQ6OBRFK17iDnDqcN9Y";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
  });

  // Helper to compose the full formatted address
  const composeFullAddress = useCallback((baseArea, details) => {
    const parts = [];
    if (baseArea) parts.push(baseArea);
    if (details.building) parts.push(`Bldg: ${details.building}`);
    if (details.floor) parts.push(`Floor ${details.floor}`);
    if (details.apartment) parts.push(`Apt ${details.apartment}`);
    if (details.landmark) parts.push(`Landmark: ${details.landmark}`);
    return parts.join(", ");
  }, []);

  // Check if building details are filled
  const hasBuildingDetails = Boolean(
    buildingDetails.building || buildingDetails.floor || buildingDetails.apartment || buildingDetails.landmark
  );

  const buildingSummaryText = useMemo(() => {
    const parts = [];
    if (buildingDetails.building) parts.push(`Bldg: ${buildingDetails.building}`);
    if (buildingDetails.floor) parts.push(`Floor ${buildingDetails.floor}`);
    if (buildingDetails.apartment) parts.push(`Apt ${buildingDetails.apartment}`);
    if (buildingDetails.landmark) parts.push(`Near: ${buildingDetails.landmark}`);
    return parts.join(" • ");
  }, [buildingDetails]);

  // Parse initialLocation on mount/change
  useEffect(() => {
    if (!initialLocation) return;

    if (typeof initialLocation === "string") {
      setAreaAddress(initialLocation);
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

    if (initAddr) setAreaAddress(initAddr);

    if (initLat != null && initLng != null) {
      const loc = { lat: initLat, lng: initLng };
      setSelectedCoords(loc);
      setTempCoords(loc);
      onLocationSelect?.({
        address: initAddr || "",
        lat: initLat,
        lng: initLng,
        source: "map",
      });
    }
  }, [initialLocation, onLocationSelect]);

  // Reverse geocoding helper
  const reverseGeocode = useCallback((loc, callback) => {
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (!geocoderRef.current) {
      const coordStr = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
      callback?.(coordStr);
      return;
    }

    const geocodeId = ++lastGeocodeIdRef.current;
    geocoderRef.current.geocode({ location: loc }, (results, status) => {
      if (geocodeId !== lastGeocodeIdRef.current) return;

      if (status === "OK" && results?.[0]?.formatted_address) {
        callback?.(results[0].formatted_address);
      } else {
        const coordStr = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        callback?.(coordStr);
      }
    });
  }, []);

  // Map load callback
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
    const initialPos = selectedCoords || defaultCenter;
    map.panTo(initialPos);
    map.setZoom(16);
    reverseGeocode(initialPos, (addr) => setTempAddress(addr));
  }, [selectedCoords, defaultCenter, reverseGeocode]);

  // Map center change handler (smooth center-pin dragging)
  const onCameraIdle = useCallback(() => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    if (!center) return;

    const newLoc = { lat: center.lat(), lng: center.lng() };
    setTempCoords(newLoc);
    reverseGeocode(newLoc, (addr) => setTempAddress(addr));
  }, [reverseGeocode]);

  // GPS Locate Action inside Modal
  const handleGpsLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.warn("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTempCoords(loc);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(17);
        reverseGeocode(loc, (addr) => setTempAddress(addr));
      },
      (err) => {
        setIsLocating(false);
        let msg = "Failed to detect current GPS location.";
        if (err.code === 1) msg = "Location permission denied. Please allow location access.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  // Confirm Location from Map Modal -> Opens building details modal for seamless Toters flow
  const handleConfirmLocation = () => {
    setSelectedCoords(tempCoords);
    const chosenArea = tempAddress || `${tempCoords.lat.toFixed(4)}, ${tempCoords.lng.toFixed(4)}`;
    setAreaAddress(chosenArea);
    setShowMapModal(false);

    const full = composeFullAddress(chosenArea, buildingDetails);
    onLocationSelect?.({
      address: full,
      lat: tempCoords.lat,
      lng: tempCoords.lng,
      source: "map",
    });

    // Seamlessly prompt for building details if not yet filled
    if (!hasBuildingDetails) {
      setTempDetails(buildingDetails);
      setShowBuildingModal(true);
    }
  };

  // Open building details modal
  const handleOpenBuildingModal = () => {
    setTempDetails(buildingDetails);
    setShowBuildingModal(true);
  };

  // Save building details from modal
  const handleSaveBuildingDetails = (e) => {
    if (e) e.preventDefault();
    setBuildingDetails(tempDetails);
    setShowBuildingModal(false);

    const full = composeFullAddress(areaAddress, tempDetails);
    onLocationSelect?.({
      address: full,
      lat: selectedCoords?.lat ?? null,
      lng: selectedCoords?.lng ?? null,
      source: "manual",
    });
  };

  // Fallback for manual typing if Google map loader fails
  if (loadError) {
    return (
      <div className="location-picker-card-container">
        <input
          type="text"
          placeholder="Enter delivery address (Area, Building, Floor)..."
          value={areaAddress}
          onChange={(e) => {
            const v = e.target.value;
            setAreaAddress(v);
            onLocationSelect?.({ address: v, lat: null, lng: null, source: "manual" });
          }}
          className="details-input"
        />
      </div>
    );
  }

  return (
    <div className="location-picker-card-container">
      {/* 1. Toters-Style Main Location Selector Card */}
      <div 
        className={`toters-location-card ${areaAddress ? "has-selected" : ""}`}
        onClick={() => {
          setTempCoords(selectedCoords || defaultCenter);
          setTempAddress(areaAddress || "Beirut, Lebanon");
          setShowMapModal(true);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="toters-card-left">
          <div className="toters-pin-icon-wrap">
            <MapPin size={20} />
          </div>
          <div className="toters-card-text">
            <span className="toters-card-label">
              {areaAddress ? "Delivery Pin Set" : "1. Pin Location on Map"}
            </span>
            <div className={`toters-card-address ${!areaAddress ? "placeholder" : ""}`}>
              {areaAddress || "Tap to select your area on map..."}
            </div>
            <span className="toters-card-hint">
              {selectedCoords ? "📍 Exact GPS coordinates saved" : "Opens full interactive map"}
            </span>
          </div>
        </div>

        <div className="toters-card-right">
          {areaAddress ? (
            <span className="toters-change-pill">Change Pin</span>
          ) : (
            <ChevronRight size={18} className="toters-arrow-icon" />
          )}
        </div>
      </div>

      {/* 2. Toters-Style Clean Building & Apartment Card */}
      <div 
        className={`toters-location-card toters-building-card ${hasBuildingDetails ? "has-selected" : ""}`}
        onClick={handleOpenBuildingModal}
        role="button"
        tabIndex={0}
      >
        <div className="toters-card-left">
          <div className="toters-pin-icon-wrap building-icon-wrap">
            <Building size={20} />
          </div>
          <div className="toters-card-text">
            <span className="toters-card-label">
              {hasBuildingDetails ? "Building & Floor Set" : "2. Building & Floor Details"}
            </span>
            <div className={`toters-card-address ${!hasBuildingDetails ? "placeholder" : ""}`}>
              {hasBuildingDetails ? buildingSummaryText : "Add building, floor, apt & landmark..."}
            </div>
            <span className="toters-card-hint">
              {hasBuildingDetails ? "✅ Details saved for driver" : "Tap to add apartment details"}
            </span>
          </div>
        </div>

        <div className="toters-card-right">
          {hasBuildingDetails ? (
            <span className="toters-change-pill edit-pill">Edit Details</span>
          ) : (
            <span className="toters-add-pill">
              <Plus size={14} /> Add
            </span>
          )}
        </div>
      </div>

      {/* 3. Toters Fullscreen / Bottom Sheet Map Modal */}
      {showMapModal && (
        <div className="toters-map-modal-overlay">
          <div className="toters-map-modal-card">
            
            {/* Modal Header */}
            <div className="toters-modal-header">
              <div className="modal-header-info">
                <h3 className="modal-header-title">Pin Delivery Location</h3>
                <span className="modal-header-sub">Drag map to position pin at your exact door</span>
              </div>
              <button 
                type="button" 
                className="toters-modal-close-btn"
                onClick={() => setShowMapModal(false)}
                aria-label="Close Map"
              >
                <X size={18} />
              </button>
            </div>

            {/* Map Canvas Viewport */}
            <div className="toters-map-viewport">
              {/* Top Hint Badge */}
              <div className="toters-map-hint-pill">
                📍 Drag map under center pin
              </div>

              {/* Floating Center Pin Marker */}
              <div className="toters-center-pin-marker">
                <div className="center-pin-icon-box">
                  <div className="center-pin-inner">
                    <MapPin size={22} />
                  </div>
                </div>
                <div className="center-pin-pulse-shadow" />
              </div>

              {/* Floating Locate Me GPS button */}
              <button 
                type="button" 
                className={`toters-floating-locate-btn ${isLocating ? "locating" : ""}`}
                onClick={handleGpsLocate}
                disabled={isLocating}
              >
                <Navigation size={15} className="gps-icon" />
                <span>{isLocating ? "Locating..." : "Locate Me"}</span>
              </button>

              {/* Google Map */}
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={tempCoords}
                  zoom={16}
                  onLoad={onMapLoad}
                  onIdle={onCameraIdle}
                  options={{
                    fullscreenControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    zoomControl: true,
                    clickableIcons: false,
                  }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                  Loading map...
                </div>
              )}
            </div>

            {/* Modal Bottom Confirm Sheet */}
            <div className="toters-modal-footer">
              <div className="modal-address-preview-row">
                <MapPin size={20} className="preview-pin-icon" />
                <div className="preview-address-col">
                  <span className="preview-address-label">Selected Location</span>
                  <span className="preview-address-text">
                    {tempAddress || "Detecting address..."}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                className="toters-confirm-location-btn"
                onClick={handleConfirmLocation}
              >
                <Check size={18} />
                <span>Confirm Pin & Add Details</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. Toters-Style Building & Floor Details Modal */}
      {showBuildingModal && (
        <div className="toters-map-modal-overlay">
          <div className="toters-building-modal-card">
            
            {/* Modal Header */}
            <div className="toters-modal-header">
              <div className="modal-header-info">
                <h3 className="modal-header-title">Building & Apartment Details</h3>
                <span className="modal-header-sub">Helps our courier deliver straight to your door</span>
              </div>
              <button 
                type="button" 
                className="toters-modal-close-btn"
                onClick={() => setShowBuildingModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Area Reminder Banner */}
            {areaAddress && (
              <div className="building-modal-area-banner">
                <MapPin size={16} className="banner-icon" />
                <div className="banner-text">
                  <span className="banner-label">Delivering around:</span>
                  <strong className="banner-addr">{areaAddress}</strong>
                </div>
              </div>
            )}

            {/* Form Fields (div container to prevent nested form submissions) */}
            <div 
              className="building-modal-form"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveBuildingDetails();
                }
              }}
            >
              <div className="modal-input-field">
                <label className="modal-field-label">
                  <Building size={14} /> Building or Street Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Al-Rida Bldg, Facing Bank X"
                  value={tempDetails.building}
                  onChange={(e) => setTempDetails({ ...tempDetails, building: e.target.value })}
                  className="modal-field-input"
                  autoFocus
                />
              </div>

              <div className="modal-fields-grid-two">
                <div className="modal-input-field">
                  <label className="modal-field-label">
                    <Layers size={14} /> Floor #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3rd Floor"
                    value={tempDetails.floor}
                    onChange={(e) => setTempDetails({ ...tempDetails, floor: e.target.value })}
                    className="modal-field-input"
                  />
                </div>

                <div className="modal-input-field">
                  <label className="modal-field-label">Apartment #</label>
                  <input
                    type="text"
                    placeholder="e.g. Apt 5 / Right"
                    value={tempDetails.apartment}
                    onChange={(e) => setTempDetails({ ...tempDetails, apartment: e.target.value })}
                    className="modal-field-input"
                  />
                </div>
              </div>

              <div className="modal-input-field">
                <label className="modal-field-label">
                  <Compass size={14} /> Landmark / Gate Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next to Pharmacy, gray building gate"
                  value={tempDetails.landmark}
                  onChange={(e) => setTempDetails({ ...tempDetails, landmark: e.target.value })}
                  className="modal-field-input"
                />
              </div>

              <div className="building-modal-footer">
                <button 
                  type="button"
                  className="toters-confirm-location-btn"
                  onClick={handleSaveBuildingDetails}
                >
                  <Check size={18} />
                  <span>Save Building Details</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
