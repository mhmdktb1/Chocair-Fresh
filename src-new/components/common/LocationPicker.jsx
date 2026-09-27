import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { GoogleMap, useJsApiLoader, Autocomplete, Circle, Marker } from "@react-google-maps/api";
import { 
  MapPin, Navigation, ChevronRight, X, Check, Building, 
  Layers, Compass, Plus, Search, Loader2, Sparkles, Crosshair,
  AlertTriangle, ShieldCheck, Store
} from "lucide-react";
import { toast } from "react-toastify";
import {
  STORE_COORDS,
  MAX_DELIVERY_RADIUS_KM,
  calculateDistanceKm,
  isWithinDeliveryRadius,
  extractCoordsFromUrl
} from "../../utils/distanceHelper";
import "./LocationPicker.css";

const GOOGLE_LIBRARIES = ["places"];

/**
 * Google Maps Style Interactive Location & Building Details Selector
 * Props:
 * - onLocationSelect: (payload) => void
 *   payload = { address: string, lat: number|null, lng: number|null, distanceKm: number|null, isOutOfRange: boolean, source: "map"|"gps"|"manual" }
 * - initialLocation: string | { address?: string, lat?: number, lng?: number }
 * - autoLocate: boolean (default true) - automatically detects GPS coordinates on mount
 */
const LocationPicker = ({ onLocationSelect, initialLocation, autoLocate = true }) => {
  const defaultCenter = useMemo(() => ({ lat: STORE_COORDS.lat, lng: STORE_COORDS.lng }), []); // Beirut store location
  const [selectedCoords, setSelectedCoords] = useState(null); // { lat, lng }
  const [areaAddress, setAreaAddress] = useState(""); // Base location from map (e.g., "Hamra, Beirut")
  
  // Structured building & floor details (standard for delivery in Lebanon)
  const [buildingDetails, setBuildingDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });

  // Auto-locating initial state
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  const [hasAutoLocated, setHasAutoLocated] = useState(false);

  // Modals state
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  
  // Temp states for map modal
  const [tempCoords, setTempCoords] = useState(defaultCenter);
  const [tempAddress, setTempAddress] = useState("");
  const [isAddressResolving, setIsAddressResolving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Temp states for building details modal
  const [tempDetails, setTempDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });

  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
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

  // Reverse geocoding helper
  const reverseGeocode = useCallback((loc, callback) => {
    if (!geocoderRef.current && window.google?.maps) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    if (!geocoderRef.current) {
      callback?.("Pinned Location");
      return;
    }

    setIsAddressResolving(true);
    const geocodeId = ++lastGeocodeIdRef.current;
    
    geocoderRef.current.geocode({ location: loc }, (results, status) => {
      if (geocodeId !== lastGeocodeIdRef.current) return;
      setIsAddressResolving(false);

      if (status === "OK" && results?.[0]?.formatted_address) {
        // Strip plus codes or leading numbers like "8GV3+8Q Beirut" or coordinates
        let formatted = results[0].formatted_address;
        formatted = formatted.replace(/^[A-Z0-9\+]{4,}\+?[A-Z0-9]*,?\s*/i, '');
        callback?.(formatted || "Pinned Location");
      } else {
        callback?.("Pinned Location");
      }
    });
  }, []);

  // Auto-detect GPS location on mount (Auto-locate user upon reaching checkout)
  useEffect(() => {
    // If initialLocation is already given, initialize with it
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
        return;
      }
    }

    // Otherwise, auto-locate the user via browser Geolocation if enabled
    if (autoLocate && !hasAutoLocated && navigator.geolocation) {
      setIsAutoLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsAutoLocating(false);
          setHasAutoLocated(true);
          const userLoc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, userLoc.lat, userLoc.lng);
          const outOfRange = dist != null && dist > MAX_DELIVERY_RADIUS_KM;

          setSelectedCoords(userLoc);
          setTempCoords(userLoc);

          // Reverse geocode to human-readable address
          reverseGeocode(userLoc, (addr) => {
            setAreaAddress(addr);
            setTempAddress(addr);
            const full = composeFullAddress(addr, buildingDetails);
            
            if (outOfRange) {
              toast.warn(`GPS location detected is ${dist} km away (outside our 5 km delivery radius).`, {
                autoClose: 5000
              });
            }

            onLocationSelect?.({
              address: full,
              lat: userLoc.lat,
              lng: userLoc.lng,
              distanceKm: dist,
              isOutOfRange: outOfRange,
              source: "gps",
            });
          });
        },
        (err) => {
          setIsAutoLocating(false);
          setHasAutoLocated(true);
          console.log("Auto-location skipped or permission not granted:", err.message);
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
      );
    }
  }, [initialLocation, autoLocate, hasAutoLocated, reverseGeocode, composeFullAddress, buildingDetails, onLocationSelect]);

  // Map load callback
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
    const initialPos = selectedCoords || tempCoords || defaultCenter;
    map.panTo(initialPos);
    map.setZoom(15);
    reverseGeocode(initialPos, (addr) => setTempAddress(addr));
  }, [selectedCoords, tempCoords, defaultCenter, reverseGeocode]);

  // Google Maps Style Camera Drag & Idle Center-pin tracking
  const handleMapDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMapDrag = useCallback(() => {
    setIsDragging(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  }, []);

  const onCameraIdle = useCallback(() => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    
    // Give a brief moment for smooth pin drop animation before geocoding
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
      if (!mapRef.current) return;
      const center = mapRef.current.getCenter();
      if (!center) return;

      const newLoc = { lat: center.lat(), lng: center.lng() };
      setTempCoords(newLoc);
      reverseGeocode(newLoc, (addr) => setTempAddress(addr));
    }, 120);
  }, [reverseGeocode]);

  // Map click handler (clicking anywhere pans center to that point smoothly)
  const handleMapClick = useCallback((e) => {
    if (e.latLng && mapRef.current) {
      setIsDragging(true);
      mapRef.current.panTo(e.latLng);
    }
  }, []);

  // Google Places Autocomplete handler
  const onAutocompleteLoad = useCallback((autocomplete) => {
    autocompleteRef.current = autocomplete;
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const loc = { lat, lng };
        setTempCoords(loc);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(16);
        const resolved = place.formatted_address || place.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setTempAddress(resolved);

        const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, lat, lng);
        if (dist != null && dist > MAX_DELIVERY_RADIUS_KM) {
          toast.warning(`Selected area is ${dist} km away (outside our 5 km delivery zone).`);
        }
      }
    }
  }, []);

  // GPS Locate Action (Locate Me FAB)
  const handleGpsLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.warn("Geolocation is not supported on this device.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setTempCoords(loc);
        setIsDragging(true);
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(16);
        reverseGeocode(loc, (addr) => setTempAddress(addr));

        const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, loc.lat, loc.lng);
        if (dist != null && dist > MAX_DELIVERY_RADIUS_KM) {
          toast.warn(`Your GPS location is ${dist} km away (outside our 5 km delivery zone).`);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not retrieve GPS location.";
        if (err.code === 1) msg = "Location permission denied. Please allow location in your browser settings.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  // Open Map Modal
  const handleOpenMapModal = () => {
    const startPos = selectedCoords || defaultCenter;
    setTempCoords(startPos);
    setTempAddress(areaAddress || "Locating...");
    setShowMapModal(true);

    // If we have no selected coords yet, trigger a GPS locate right away in the modal
    if (!selectedCoords && navigator.geolocation) {
      handleGpsLocate();
    }
  };

  // Center on store location
  const handleCenterOnStore = () => {
    const storeLoc = { lat: STORE_COORDS.lat, lng: STORE_COORDS.lng };
    setTempCoords(storeLoc);
    setIsDragging(true);
    mapRef.current?.panTo(storeLoc);
    mapRef.current?.setZoom(15);
    reverseGeocode(storeLoc, (addr) => setTempAddress(addr));
  };

  // Confirm Location from Map Modal -> Rejects if out of 5km range
  const handleConfirmLocation = () => {
    if (isTempOutOfRange) {
      toast.error(
        `Delivery is only available within 5 km of our store. Selected location is ${tempDistanceKm} km away. Please choose a location within the highlighted 5 km zone.`,
        { autoClose: 5000 }
      );
      return;
    }

    setSelectedCoords(tempCoords);
    const chosenArea = tempAddress || "Pinned Location";
    setAreaAddress(chosenArea);
    setShowMapModal(false);

    const full = composeFullAddress(chosenArea, buildingDetails);
    onLocationSelect?.({
      address: full,
      lat: tempCoords.lat,
      lng: tempCoords.lng,
      distanceKm: tempDistanceKm,
      isOutOfRange: false,
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
      distanceKm: currentDistanceKm,
      isOutOfRange: isSelectedOutOfRange,
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
            onLocationSelect?.({ address: v, lat: null, lng: null, distanceKm: null, isOutOfRange: false, source: "manual" });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="details-input"
        />
        <div className="delivery-range-note">
          <Store size={13} /> We deliver within 5 km of our store in Beirut.
        </div>
      </div>
    );
  }

  return (
    <div className="location-picker-card-container">
      {/* 1. Main Location Selector Card */}
      <div 
        className={`toters-location-card ${areaAddress ? "has-selected" : ""} ${isAutoLocating ? "is-auto-locating" : ""} ${isSelectedOutOfRange ? "is-out-of-range" : ""}`}
        onClick={handleOpenMapModal}
        role="button"
        tabIndex={0}
      >
        <div className="toters-card-left">
          <div className={`toters-pin-icon-wrap ${isAutoLocating ? "pulse-locating" : ""} ${isSelectedOutOfRange ? "pin-out-range" : ""}`}>
            {isAutoLocating ? (
              <Loader2 size={18} className="animate-spin text-green-600" />
            ) : isSelectedOutOfRange ? (
              <AlertTriangle size={18} />
            ) : (
              <MapPin size={18} />
            )}
          </div>
          <div className="toters-card-text">
            <div className="toters-card-label-row">
              <span className={`toters-card-label ${isSelectedOutOfRange ? "label-out-range" : ""}`}>
                {isAutoLocating ? "Locating..." : isSelectedOutOfRange ? "Out of 5 km Delivery Zone" : "Delivery Location"}
              </span>
              {currentDistanceKm != null && (
                <span className={`toters-distance-chip ${isSelectedOutOfRange ? "chip-out-range" : "chip-in-range"}`}>
                  {isSelectedOutOfRange ? (
                    <>⚠️ {currentDistanceKm} km (Max 5 km)</>
                  ) : (
                    <>✓ {currentDistanceKm} km from store</>
                  )}
                </span>
              )}
            </div>

            <div className={`toters-card-address ${!areaAddress ? "placeholder" : ""} ${isSelectedOutOfRange ? "address-out-range" : ""}`}>
              {isAutoLocating ? (
                <span className="locating-text-shimmer">Detecting GPS location...</span>
              ) : (
                areaAddress || "Pin your location on map (Max 5 km)..."
              )}
            </div>

            {/* Delivery zone micro hint */}
            {!isAutoLocating && (
              <div className="toters-card-range-hint">
                {isSelectedOutOfRange ? (
                  <span className="text-range-error">
                    🚫 Address is {currentDistanceKm} km away. We only deliver within 5 km.
                  </span>
                ) : currentDistanceKm != null ? (
                  <span className="text-range-success">
                    <ShieldCheck size={12} className="inline-icon" /> Within 5 km delivery zone — Eligible for delivery
                  </span>
                ) : (
                  <span className="text-range-neutral">
                    <Store size={12} className="inline-icon" /> We deliver exclusively within 5 km of our store in Beirut
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="toters-card-right">
          {isAutoLocating ? (
            <span className="toters-locating-pill">
              <Loader2 size={12} className="animate-spin" /> Locating
            </span>
          ) : isSelectedOutOfRange ? (
            <span className="toters-change-pill out-range-pill">Change</span>
          ) : areaAddress ? (
            <span className="toters-change-pill">Change Pin</span>
          ) : (
            <ChevronRight size={18} className="toters-arrow-icon" />
          )}
        </div>
      </div>

      {/* 2. Clean Building & Apartment Card */}
      <div 
        className={`toters-location-card toters-building-card ${hasBuildingDetails ? "has-selected" : ""}`}
        onClick={handleOpenBuildingModal}
        role="button"
        tabIndex={0}
      >
        <div className="toters-card-left">
          <div className="toters-pin-icon-wrap building-icon-wrap">
            <Building size={18} />
          </div>
          <div className="toters-card-text">
            <span className="toters-card-label">
              Building details (Optional)
            </span>
            {hasBuildingDetails ? (
              <div className="toters-card-address">
                {buildingSummaryText}
              </div>
            ) : (
              <div className="toters-card-hint">
                Add building name, floor number, or landmark
              </div>
            )}
          </div>
        </div>

        <div className="toters-card-right">
          {hasBuildingDetails ? (
            <span className="toters-change-pill edit-pill">Edit</span>
          ) : (
            <span className="toters-add-pill">
              <Plus size={13} /> Add
            </span>
          )}
        </div>
      </div>

      {/* 3. Fullscreen / Bottom Sheet Google Maps Modal */}
      {showMapModal && typeof document !== "undefined" && createPortal(
        <div className="toters-map-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="toters-map-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="toters-modal-header">
              <div className="modal-header-info">
                <div className="modal-header-title-row">
                  <h3 className="modal-header-title">Pin Delivery Location</h3>
                  <span className="modal-5km-badge">5 km Delivery Zone</span>
                </div>
                <span className="modal-header-sub">
                  We deliver within a 5 km radius of our store in Beirut
                </span>
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

            {/* Google Maps Search Bar Overlay (Top) */}
            {isLoaded && (
              <div className="gmaps-search-bar-wrapper">
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    componentRestrictions: { country: "lb" },
                  }}
                >
                  <div className="gmaps-search-box">
                    <Search size={16} className="gmaps-search-icon" />
                    <input
                      type="text"
                      placeholder="Search street or area in Beirut..."
                      className="gmaps-search-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>
                </Autocomplete>
              </div>
            )}

            {/* Map Canvas Viewport */}
            <div className="toters-map-viewport">
              {/* Google Maps Center Pin & Dynamic Physics */}
              <div className="gmaps-center-pin-container">
                {/* Lifting & Bouncing Center Pin */}
                <div className={`gmaps-center-pin ${isDragging ? "is-lifting" : "is-dropped"}`}>
                  <svg 
                    className="gmaps-svg-pin"
                    width="42" 
                    height="50" 
                    viewBox="0 0 42 50" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M21 0C9.402 0 0 9.402 0 21C0 34.125 18.375 48.825 20.097 50.169C20.6355 50.5895 21.3645 50.5895 21.903 50.169C23.625 48.825 42 34.125 42 21C42 9.402 32.598 0 21 0Z" 
                      fill={isTempOutOfRange ? "#DC2626" : "#16A34A"}
                    />
                    <circle cx="21" cy="20" r="8" fill="#FFFFFF"/>
                    <circle cx="21" cy="20" r="4.5" fill={isTempOutOfRange ? "#991B1B" : "#15803D"}/>
                  </svg>
                </div>

                {/* Ground Target Dot / Crosshair */}
                <div className="gmaps-ground-target">
                  <div className={`gmaps-target-dot ${isTempOutOfRange ? "target-dot-out" : ""}`} />
                  <div className={`gmaps-pin-shadow ${isDragging ? "is-lifting" : "is-dropped"}`} />
                </div>
              </div>

              {/* Map Floating Control Actions (Right Side) */}
              <div className="gmaps-floating-controls">
                {/* Store Center Button */}
                <button
                  type="button"
                  className="gmaps-fab-store-btn"
                  onClick={handleCenterOnStore}
                  title={`Center on Store (${STORE_COORDS.name})`}
                  aria-label="Center on Store Location"
                >
                  <Store size={18} />
                </button>

                {/* Locate Me GPS FAB */}
                <button 
                  type="button" 
                  className={`gmaps-fab-locate-btn ${isLocating ? "locating" : ""}`}
                  onClick={handleGpsLocate}
                  disabled={isLocating}
                  title="Locate my position"
                  aria-label="Locate my current position"
                >
                  {isLocating ? (
                    <Loader2 size={18} className="animate-spin text-blue-600" />
                  ) : (
                    <Crosshair size={20} className="gps-crosshair-icon" />
                  )}
                </button>
              </div>

              {/* Real-time Floating Delivery Zone Indicator */}
              <div className={`gmaps-delivery-zone-pill ${isTempOutOfRange ? "zone-pill-out" : "zone-pill-in"} ${isDragging ? "is-dragging" : ""}`}>
                {isTempOutOfRange ? (
                  <>
                    <AlertTriangle size={14} />
                    <span>Outside 5 km Delivery Zone ({tempDistanceKm} km away)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Within 5 km Delivery Zone ({tempDistanceKm != null ? `${tempDistanceKm} km` : 'Valid'})</span>
                  </>
                )}
              </div>

              {/* Top Hint Badge */}
              <div className={`gmaps-map-hint-pill ${isDragging ? "dragging" : ""}`}>
                {isDragging ? "Release pin to check location" : "Drag map under pin to choose your location"}
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
                    zoomControl: true,
                    gestureHandling: "greedy",
                    clickableIcons: false,
                    disableDefaultUI: false,
                  }}
                >
                  {/* 5 KM Delivery Radius Circle */}
                  <Circle
                    center={STORE_COORDS}
                    radius={5000} // 5 km in meters
                    options={{
                      strokeColor: "#16a34a",
                      strokeOpacity: 0.85,
                      strokeWeight: 2.5,
                      fillColor: "#22c55e",
                      fillOpacity: 0.1,
                      clickable: false,
                      zIndex: 1,
                    }}
                  />

                  {/* Store Position Marker */}
                  <Marker
                    position={STORE_COORDS}
                    title="Chocair Fresh - Store Hub"
                  />
                </GoogleMap>
              ) : (
                <div className="gmaps-loading-state">
                  <Loader2 size={28} className="animate-spin text-green-600" />
                  <span>Loading map...</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Confirm Sheet */}
            <div className="toters-modal-footer">
              {/* Out of Range Alert Card */}
              {isTempOutOfRange && (
                <div className="modal-out-of-range-banner">
                  <AlertTriangle size={18} className="banner-alert-icon" />
                  <div className="banner-alert-text">
                    <strong>Outside 5 km Delivery Radius ({tempDistanceKm} km away)</strong>
                    <span>
                      We exclusively deliver within 5 km of our store in Beirut. Please move the pin inside the green zone on the map to place an order.
                    </span>
                  </div>
                </div>
              )}

              <div className="modal-address-preview-row">
                <div className={`preview-pin-icon-box ${isTempOutOfRange ? "preview-pin-out" : ""}`}>
                  {isTempOutOfRange ? <AlertTriangle size={18} /> : <MapPin size={18} />}
                </div>
                <div className="preview-address-col">
                  <div className="preview-address-header">
                    <span className="preview-address-label">Delivery Location</span>
                    {isAddressResolving ? (
                      <span className="preview-resolving-indicator">
                        <Loader2 size={11} className="animate-spin" /> Updating...
                      </span>
                    ) : tempDistanceKm != null ? (
                      <span className={`preview-distance-pill ${isTempOutOfRange ? "dist-out" : "dist-in"}`}>
                        {tempDistanceKm} km from store
                      </span>
                    ) : null}
                  </div>
                  <span className={`preview-address-text ${isAddressResolving ? "resolving" : ""}`}>
                    {tempAddress || "Detecting address..."}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                className={`toters-confirm-location-btn ${isTempOutOfRange ? "btn-out-of-range" : ""}`}
                onClick={handleConfirmLocation}
              >
                {isTempOutOfRange ? (
                  <>
                    <AlertTriangle size={18} />
                    <span>Out of 5 km Range ({tempDistanceKm} km)</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>Confirm Pin ({tempDistanceKm != null ? `${tempDistanceKm} km` : 'In Range'})</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* 4. Building & Floor Details Modal */}
      {showBuildingModal && typeof document !== "undefined" && createPortal(
        <div className="toters-map-modal-overlay" onClick={() => setShowBuildingModal(false)}>
          <div className="toters-building-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="toters-modal-header">
              <div className="modal-header-info">
                <h3 className="modal-header-title">Building Details (Optional)</h3>
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
                <MapPin size={15} className="banner-icon" />
                <div className="banner-text">
                  <span className="banner-label">Area</span>
                  <strong className="banner-addr">{areaAddress}</strong>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div 
              className="building-modal-form"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSaveBuildingDetails();
                }
              }}
            >
              <div className="modal-input-field">
                <label className="modal-field-label">
                  <Building size={14} /> Building / Street
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunrise Bldg, Hamra St"
                  value={tempDetails.building}
                  onChange={(e) => setTempDetails({ ...tempDetails, building: e.target.value })}
                  className="modal-field-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveBuildingDetails();
                    }
                  }}
                />
              </div>

              <div className="modal-fields-grid-two">
                <div className="modal-input-field">
                  <label className="modal-field-label">
                    <Layers size={14} /> Floor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3rd"
                    value={tempDetails.floor}
                    onChange={(e) => setTempDetails({ ...tempDetails, floor: e.target.value })}
                    className="modal-field-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveBuildingDetails();
                      }
                    }}
                  />
                </div>

                <div className="modal-input-field">
                  <label className="modal-field-label">Apartment</label>
                  <input
                    type="text"
                    placeholder="e.g. Apt 4B"
                    value={tempDetails.apartment}
                    onChange={(e) => setTempDetails({ ...tempDetails, apartment: e.target.value })}
                    className="modal-field-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSaveBuildingDetails();
                      }
                    }}
                  />
                </div>
              </div>

              <div className="modal-input-field">
                <label className="modal-field-label">
                  <Compass size={14} /> Landmark / Gate (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near pharmacy, black gate"
                  value={tempDetails.landmark}
                  onChange={(e) => setTempDetails({ ...tempDetails, landmark: e.target.value })}
                  className="modal-field-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveBuildingDetails();
                    }
                  }}
                />
              </div>

              <div className="building-modal-footer">
                <button 
                  type="button"
                  className="toters-confirm-location-btn"
                  onClick={handleSaveBuildingDetails}
                >
                  <Check size={18} />
                  <span>Save Details</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LocationPicker;
