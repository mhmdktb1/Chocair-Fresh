import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { GoogleMap, useJsApiLoader, Circle, Marker } from "@react-google-maps/api";
import { 
  MapPin, Crosshair, Building, Layers, Home, 
  Briefcase, Compass, Check, X, AlertTriangle, 
  Store, Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import {
  STORE_COORDS,
  MAX_DELIVERY_RADIUS_KM,
  calculateDistanceKm,
} from "../../utils/distanceHelper";
import "./LocationPicker.css";

const GOOGLE_LIBRARIES = ["places"];

const ADDRESS_TAGS = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "apt", label: "Apartment", icon: Building },
  { id: "other", label: "Other", icon: MapPin },
];

/**
 * Clean & Fast Delivery Location Picker
 * - Building & Floor are mandatory fields
 * - Fast GPS location only when user presses "Locate Me"
 * - No text clutter (no "detecting area", no distance from store)
 * - Map modal without search bar or quick areas
 */
const LocationPicker = ({ onLocationSelect, initialLocation, autoLocate = false }) => {
  const defaultCenter = useMemo(() => ({ lat: STORE_COORDS.lat, lng: STORE_COORDS.lng }), []);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [areaAddress, setAreaAddress] = useState("");
  const [selectedTag, setSelectedTag] = useState("home");
  
  // Building & floor details (Building and Floor are mandatory)
  const [buildingDetails, setBuildingDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });

  const [isLocatingCard, setIsLocatingCard] = useState(false);
  const [isLocatingModal, setIsLocatingModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Temp states for map modal
  const [tempCoords, setTempCoords] = useState(defaultCenter);
  const [tempAddress, setTempAddress] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [tempTag, setTempTag] = useState("home");
  const [tempDetails, setTempDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });

  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const lastGeocodeIdRef = useRef(0);
  const dragTimeoutRef = useRef(null);

  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyA2sDabFv8XdkWGWQ6OBRFK17iDnDqcN9Y";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: GOOGLE_LIBRARIES,
  });

  // Distance calculations
  const currentDistanceKm = useMemo(() => {
    if (!selectedCoords || selectedCoords.lat == null || selectedCoords.lng == null) return null;
    return calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, selectedCoords.lat, selectedCoords.lng);
  }, [selectedCoords]);

  const isSelectedOutOfRange = useMemo(() => {
    return currentDistanceKm != null && currentDistanceKm > MAX_DELIVERY_RADIUS_KM;
  }, [currentDistanceKm]);

  const tempDistanceKm = useMemo(() => {
    if (!tempCoords || tempCoords.lat == null || tempCoords.lng == null) return null;
    return calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, tempCoords.lat, tempCoords.lng);
  }, [tempCoords]);

  const isTempOutOfRange = useMemo(() => {
    return tempDistanceKm != null && tempDistanceKm > MAX_DELIVERY_RADIUS_KM;
  }, [tempDistanceKm]);

  // Helper to compose full formatted address
  const composeFullAddress = useCallback((baseArea, details, tag) => {
    const parts = [];
    if (tag && tag !== "other") {
      const tagObj = ADDRESS_TAGS.find(t => t.id === tag);
      if (tagObj) parts.push(`[${tagObj.label}]`);
    }
    if (baseArea) parts.push(baseArea);
    if (details.building?.trim()) parts.push(`Bldg: ${details.building.trim()}`);
    if (details.floor?.trim()) parts.push(`Fl: ${details.floor.trim()}`);
    if (details.apartment?.trim()) parts.push(`Apt: ${details.apartment.trim()}`);
    if (details.landmark?.trim()) parts.push(`Note: ${details.landmark.trim()}`);
    return parts.join(", ");
  }, []);

  // Reverse geocoding helper
  const reverseGeocode = useCallback((loc, callback) => {
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (!geocoderRef.current) {
      callback?.("Pinned Location");
      return;
    }

    const geocodeId = ++lastGeocodeIdRef.current;
    geocoderRef.current.geocode({ location: loc }, (results, status) => {
      if (geocodeId !== lastGeocodeIdRef.current) return;
      if (status === "OK" && results?.[0]?.formatted_address) {
        let formatted = results[0].formatted_address;
        formatted = formatted.replace(/^[A-Z0-9\+]{4,}\+?[A-Z0-9]*,?\s*/i, '');
        callback?.(formatted || "Pinned Location");
      } else {
        callback?.("Pinned Location");
      }
    });
  }, []);

  // Sync back to parent when details or address changes
  const notifyParent = useCallback((addr, coords, details, tag, dist, outOfRange, src = "map") => {
    const full = composeFullAddress(addr, details, tag);
    const hasRequired = Boolean(details.building?.trim() && details.floor?.trim());
    onLocationSelect?.({
      address: full,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      distanceKm: dist,
      isOutOfRange: outOfRange,
      source: src,
      tag,
      details,
      building: details.building?.trim() || "",
      floor: details.floor?.trim() || "",
      apartment: details.apartment?.trim() || "",
      landmark: details.landmark?.trim() || "",
      isComplete: Boolean(addr && hasRequired && !outOfRange),
    });
  }, [composeFullAddress, onLocationSelect]);

  // Initialize with initialLocation if given
  useEffect(() => {
    if (initialLocation) {
      if (typeof initialLocation === "string" && initialLocation.trim() !== "") {
        setAreaAddress(initialLocation);
        return;
      }
      if (typeof initialLocation === "object") {
        const initAddr = initialLocation.address || "";
        const initLat = typeof initialLocation.lat === "number" ? initialLocation.lat : null;
        const initLng = typeof initialLocation.lng === "number" ? initialLocation.lng : null;

        if (initAddr) setAreaAddress(initAddr);
        if (initLat != null && initLng != null) {
          const loc = { lat: initLat, lng: initLng };
          setSelectedCoords(loc);
          setTempCoords(loc);
        }
      }
    }
  }, [initialLocation]);

  // Map load callback
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
    const initialPos = tempCoords || selectedCoords || defaultCenter;
    map.panTo(initialPos);
    map.setZoom(15);
    reverseGeocode(initialPos, (addr) => setTempAddress(addr));
  }, [tempCoords, selectedCoords, defaultCenter, reverseGeocode]);

  const handleMapDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMapDrag = useCallback(() => {
    setIsDragging(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  }, []);

  const onCameraIdle = useCallback(() => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      if (!center) return;

      const newLoc = { lat: center.lat(), lng: center.lng() };
      setTempCoords(newLoc);
      reverseGeocode(newLoc, (addr) => setTempAddress(addr));
    }, 100);
  }, [reverseGeocode]);

  const handleMapClick = useCallback((e) => {
    if (e.latLng && mapRef.current) {
      setIsDragging(true);
      mapRef.current.panTo(e.latLng);
    }
  }, []);

  // Fast GPS locate ONLY when user presses button
  const handleGpsLocate = useCallback((isModal = false) => {
    if (!navigator.geolocation) {
      toast.warn("Geolocation is not supported on this device.");
      return;
    }

    if (isModal) setIsLocatingModal(true);
    else setIsLocatingCard(true);

    const onPosSuccess = (pos) => {
      if (isModal) setIsLocatingModal(false);
      else setIsLocatingCard(false);

      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, loc.lat, loc.lng);
      const outOfRange = dist != null && dist > MAX_DELIVERY_RADIUS_KM;

      setSelectedCoords(loc);
      setTempCoords(loc);

      if (mapRef.current) {
        mapRef.current.panTo(loc);
        mapRef.current.setZoom(16);
      }

      reverseGeocode(loc, (addr) => {
        setAreaAddress(addr);
        setTempAddress(addr);
        notifyParent(addr, loc, buildingDetails, selectedTag, dist, outOfRange, "gps");
      });
    };

    const onPosError = (err) => {
      if (err.code === 3) {
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          () => {
            if (isModal) setIsLocatingModal(false);
            else setIsLocatingCard(false);
            toast.error("Could not get GPS location. Please pin on map.");
          },
          { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
        );
        return;
      }

      if (isModal) setIsLocatingModal(false);
      else setIsLocatingCard(false);
      if (err.code === 1) toast.error("Please allow location access in browser settings.");
      else toast.error("Could not retrieve GPS location.");
    };

    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      onPosError,
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
    );
  }, [reverseGeocode, notifyParent, buildingDetails, selectedTag]);

  // Center on store
  const handleCenterOnStore = () => {
    const storeLoc = { lat: STORE_COORDS.lat, lng: STORE_COORDS.lng };
    setTempCoords(storeLoc);
    mapRef.current?.panTo(storeLoc);
    mapRef.current?.setZoom(15);
    reverseGeocode(storeLoc, (addr) => setTempAddress(addr));
  };

  // Open map modal
  const handleOpenMap = () => {
    const startPos = selectedCoords || defaultCenter;
    setTempCoords(startPos);
    setTempAddress(areaAddress || "Pinned Location");
    setTempTag(selectedTag);
    setTempDetails({ ...buildingDetails });
    setShowMapModal(true);
  };

  // Confirm location from modal
  const handleConfirmModal = () => {
    if (isTempOutOfRange) {
      toast.error("Delivery is only available within 4 km of our store. Please choose a closer location.");
      return;
    }

    if (!tempDetails.building?.trim() || !tempDetails.floor?.trim()) {
      toast.warn("Building and Floor are required.");
    }

    const chosenArea = tempAddress || "Pinned Location";
    setSelectedCoords(tempCoords);
    setAreaAddress(chosenArea);
    setSelectedTag(tempTag);
    setBuildingDetails(tempDetails);
    setShowMapModal(false);

    notifyParent(chosenArea, tempCoords, tempDetails, tempTag, tempDistanceKm, false, "map");
  };

  // Update inline building details
  const handleDetailChange = (field, value) => {
    const updated = { ...buildingDetails, [field]: value };
    setBuildingDetails(updated);
    notifyParent(areaAddress, selectedCoords, updated, selectedTag, currentDistanceKm, isSelectedOutOfRange, "manual");
  };

  // Update tag
  const handleTagChange = (tagId) => {
    setSelectedTag(tagId);
    notifyParent(areaAddress, selectedCoords, buildingDetails, tagId, currentDistanceKm, isSelectedOutOfRange, "manual");
  };

  // Fallback for manual typing if Google Map fails to load
  if (loadError) {
    return (
      <div className="loc-clean-card">
        <div className="loc-fallback-input-wrap">
          <MapPin size={16} className="loc-fallback-icon" />
          <input
            type="text"
            placeholder="Enter delivery area / street..."
            value={areaAddress}
            onChange={(e) => {
              const v = e.target.value;
              setAreaAddress(v);
              notifyParent(v, null, buildingDetails, selectedTag, null, false, "manual");
            }}
            className="loc-fallback-input"
          />
        </div>
        <div className="loc-inline-row-2">
          <input
            type="text"
            placeholder="Building *"
            required
            value={buildingDetails.building}
            onChange={(e) => handleDetailChange("building", e.target.value)}
            className="loc-input"
          />
          <input
            type="text"
            placeholder="Floor *"
            required
            value={buildingDetails.floor}
            onChange={(e) => handleDetailChange("floor", e.target.value)}
            className="loc-input"
          />
        </div>
      </div>
    );
  }

  const TagIcon = ADDRESS_TAGS.find(t => t.id === selectedTag)?.icon || MapPin;

  return (
    <div className="loc-delivery-selector">
      {/* 1. Main Clean Card */}
      <div className={`loc-clean-card ${isSelectedOutOfRange ? "is-out" : areaAddress ? "is-ready" : ""}`}>
        
        {/* Card Header: Address Tag Pills & Fast Action Buttons */}
        <div className="loc-card-header">
          <div className="loc-tags-list">
            {ADDRESS_TAGS.map((t) => {
              const Icon = t.icon;
              const active = selectedTag === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`loc-tag-pill ${active ? "active" : ""}`}
                  onClick={() => handleTagChange(t.id)}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="loc-header-actions">
            {/* Fast 1-Tap Locate Me Button */}
            <button
              type="button"
              className={`loc-action-btn loc-gps-btn ${isLocatingCard ? "is-spinning" : ""}`}
              onClick={() => handleGpsLocate(false)}
              disabled={isLocatingCard}
              title="Locate my position"
            >
              {isLocatingCard ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Crosshair size={13} />
              )}
              <span>Locate Me</span>
            </button>

            {/* Map Pin Button */}
            <button
              type="button"
              className="loc-action-btn loc-map-btn"
              onClick={handleOpenMap}
              title="Choose location on map"
            >
              <MapPin size={13} />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Selected Area / Pin Row */}
        <div className="loc-address-row" onClick={handleOpenMap} role="button" tabIndex={0}>
          <div className={`loc-pin-box ${isSelectedOutOfRange ? "pin-box-out" : ""}`}>
            <MapPin size={18} />
          </div>
          <div className="loc-address-content">
            <div className={`loc-address-title ${!areaAddress ? "placeholder" : ""}`}>
              {areaAddress || "Select delivery location on map..."}
            </div>
          </div>
        </div>

        {/* Mandatory Building & Floor Fields (Clean & Direct) */}
        <div className="loc-inline-details-drawer">
          <div className="loc-inline-grid">
            <div className="loc-inline-row-2">
              <div className="loc-field-wrap">
                <label className="loc-field-label">
                  <Building size={12} /> Building <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Building name"
                  value={buildingDetails.building}
                  onChange={(e) => handleDetailChange("building", e.target.value)}
                  className={`loc-input ${!buildingDetails.building ? "input-missing" : ""}`}
                />
              </div>

              <div className="loc-field-wrap">
                <label className="loc-field-label">
                  <Layers size={12} /> Floor <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Floor (e.g. 2nd)"
                  value={buildingDetails.floor}
                  onChange={(e) => handleDetailChange("floor", e.target.value)}
                  className={`loc-input ${!buildingDetails.floor ? "input-missing" : ""}`}
                />
              </div>
            </div>

            <div className="loc-inline-row-2">
              <div className="loc-field-wrap">
                <label className="loc-field-label">Apartment</label>
                <input
                  type="text"
                  placeholder="Apt (e.g. 4B)"
                  value={buildingDetails.apartment}
                  onChange={(e) => handleDetailChange("apartment", e.target.value)}
                  className="loc-input"
                />
              </div>

              <div className="loc-field-wrap">
                <label className="loc-field-label">
                  <Compass size={12} /> Landmark / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near pharmacy"
                  value={buildingDetails.landmark}
                  onChange={(e) => handleDetailChange("landmark", e.target.value)}
                  className="loc-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Map Modal (Clean, No Search, No Quick Areas) */}
      {showMapModal && typeof document !== "undefined" && createPortal(
        <div className="loc-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="loc-modal-dialog" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="loc-modal-head">
              <h3 className="loc-modal-title">Pin Delivery Location</h3>
              <button 
                type="button" 
                className="loc-close-btn"
                onClick={() => setShowMapModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Map Canvas Viewport */}
            <div className="loc-map-frame">
              {/* Center Pin */}
              <div className="loc-center-pin-hub">
                <div className={`loc-pin-svg-wrap ${isDragging ? "lifting" : "dropped"}`}>
                  <svg 
                    width="40" 
                    height="48" 
                    viewBox="0 0 42 50" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M21 0C9.402 0 0 9.402 0 21C0 34.125 18.375 48.825 20.097 50.169C20.6355 50.5895 21.3645 50.5895 21.903 50.169C23.625 48.825 42 34.125 42 21C42 9.402 32.598 0 21 0Z" 
                      fill={isTempOutOfRange ? "#dc2626" : "#16a34a"}
                    />
                    <circle cx="21" cy="20" r="7.5" fill="#ffffff"/>
                    <circle cx="21" cy="20" r="4" fill={isTempOutOfRange ? "#991b1b" : "#15803d"}/>
                  </svg>
                </div>
                <div className="loc-pin-shadow" />
              </div>

              {/* Floating Map Actions */}
              <div className="loc-map-floating-actions">
                <button
                  type="button"
                  className="loc-fab-btn"
                  onClick={handleCenterOnStore}
                  title="Store Location"
                >
                  <Store size={17} />
                </button>
                <button
                  type="button"
                  className={`loc-fab-btn ${isLocatingModal ? "is-locating" : ""}`}
                  onClick={() => handleGpsLocate(true)}
                  disabled={isLocatingModal}
                  title="Locate Me"
                >
                  {isLocatingModal ? (
                    <Loader2 size={17} className="animate-spin text-blue-600" />
                  ) : (
                    <Crosshair size={17} />
                  )}
                </button>
              </div>

              {/* Google Map */}
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={tempCoords}
                  zoom={15}
                  onLoad={onMapLoad}
                  onDragStart={handleMapDragStart}
                  onDrag={handleMapDrag}
                  onIdle={onCameraIdle}
                  onClick={handleMapClick}
                  options={{
                    fullscreenControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    zoomControl: false,
                    gestureHandling: "greedy",
                    clickableIcons: false,
                  }}
                >
                  {/* Delivery Radius Ring */}
                  <Circle
                    center={STORE_COORDS}
                    radius={4000}
                    options={{
                      strokeColor: "#16a34a",
                      strokeOpacity: 0.85,
                      strokeWeight: 2,
                      fillColor: "#22c55e",
                      fillOpacity: 0.08,
                      clickable: false,
                    }}
                  />
                  <Marker position={STORE_COORDS} title="Store Hub" />
                </GoogleMap>
              ) : (
                <div className="loc-map-loading">
                  <Loader2 size={24} className="animate-spin text-green-600" />
                </div>
              )}
            </div>

            {/* Modal Bottom Sheet */}
            <div className="loc-modal-footer">
              <div className="loc-footer-addr-row">
                <MapPin size={17} className={isTempOutOfRange ? "text-red-500" : "text-green-600"} />
                <div className="loc-footer-addr-info">
                  <span className="loc-footer-addr-text">
                    {tempAddress || "Pinned Location"}
                  </span>
                </div>
              </div>

              {/* Address Tag Selector */}
              <div className="loc-modal-tags-row">
                {ADDRESS_TAGS.map((t) => {
                  const Icon = t.icon;
                  const active = tempTag === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`loc-tag-pill ${active ? "active" : ""}`}
                      onClick={() => setTempTag(t.id)}
                    >
                      <Icon size={12} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mandatory Building & Floor inputs in modal */}
              <div className="loc-modal-details-grid">
                <input
                  type="text"
                  required
                  placeholder="Building *"
                  value={tempDetails.building}
                  onChange={(e) => setTempDetails({ ...tempDetails, building: e.target.value })}
                  className="loc-input-sm"
                />
                <input
                  type="text"
                  required
                  placeholder="Floor *"
                  value={tempDetails.floor}
                  onChange={(e) => setTempDetails({ ...tempDetails, floor: e.target.value })}
                  className="loc-input-sm"
                />
              </div>

              <button
                type="button"
                className={`loc-confirm-btn ${isTempOutOfRange ? "btn-out" : ""}`}
                onClick={handleConfirmModal}
              >
                {isTempOutOfRange ? (
                  <>
                    <AlertTriangle size={16} />
                    <span>Outside Delivery Zone</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Confirm Location</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LocationPicker;
