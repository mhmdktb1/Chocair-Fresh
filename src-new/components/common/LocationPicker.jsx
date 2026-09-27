import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { GoogleMap, useJsApiLoader, Autocomplete, Circle, Marker } from "@react-google-maps/api";
import { 
  MapPin, Navigation, Crosshair, Search, Building, 
  Layers, Home, Briefcase, Compass, Check, X, 
  AlertTriangle, Store, Loader2, ChevronDown, ChevronUp, 
  Edit3, Sparkles
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

// Preset popular delivery neighborhoods near Chocair Market store
const QUICK_NEIGHBORHOODS = [
  { name: "Dbayeh", lat: 33.9525, lng: 35.6020 },
  { name: "Antelias", lat: 33.9167, lng: 35.5900 },
  { name: "Naccache", lat: 33.9285, lng: 35.5955 },
  { name: "Rabieh", lat: 33.9350, lng: 35.6100 },
  { name: "Awkar", lat: 33.9380, lng: 35.6050 },
  { name: "Jal El Dib", lat: 33.9120, lng: 35.5800 },
  { name: "Zalka", lat: 33.9000, lng: 35.5700 },
  { name: "Store Hub", lat: STORE_COORDS.lat, lng: STORE_COORDS.lng },
];

const ADDRESS_TAGS = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "apt", label: "Apartment", icon: Building },
  { id: "other", label: "Other", icon: MapPin },
];

/**
 * Modern, Streamlined Location & Delivery Address Selector
 * Features:
 * - 1-Tap Quick Area / Neighborhood chips (Dbayeh, Antelias, Naccache, etc.)
 * - 1-Tap Instant GPS "Locate Me" button right on the card
 * - Address Tag pills (Home, Work, Apt, Other)
 * - Compact Inline & Modal Building / Floor / Apt / Note fields
 * - Interactive Google Map with live 4km radius & store pin
 * - Zero text clutter & clear visual status badges
 */
const LocationPicker = ({ onLocationSelect, initialLocation, autoLocate = true }) => {
  const defaultCenter = useMemo(() => ({ lat: STORE_COORDS.lat, lng: STORE_COORDS.lng }), []);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [areaAddress, setAreaAddress] = useState("");
  const [selectedTag, setSelectedTag] = useState("home");
  
  // Building & floor details
  const [buildingDetails, setBuildingDetails] = useState({
    building: "",
    floor: "",
    apartment: "",
    landmark: "",
  });

  // UI state
  const [showDetailsInline, setShowDetailsInline] = useState(false);
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  const [hasAutoLocated, setHasAutoLocated] = useState(false);
  const [isLocatingCard, setIsLocatingCard] = useState(false);

  // Modals state
  const [showMapModal, setShowMapModal] = useState(false);
  
  // Temp states for map modal
  const [tempCoords, setTempCoords] = useState(defaultCenter);
  const [tempAddress, setTempAddress] = useState("");
  const [isAddressResolving, setIsAddressResolving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocatingModal, setIsLocatingModal] = useState(false);
  const [tempTag, setTempTag] = useState("home");
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

  // Helper to compose full formatted address
  const composeFullAddress = useCallback((baseArea, details, tag) => {
    const parts = [];
    if (tag && tag !== "other") {
      const tagObj = ADDRESS_TAGS.find(t => t.id === tag);
      if (tagObj) parts.push(`[${tagObj.label}]`);
    }
    if (baseArea) parts.push(baseArea);
    if (details.building) parts.push(`Bldg: ${details.building}`);
    if (details.floor) parts.push(`Fl: ${details.floor}`);
    if (details.apartment) parts.push(`Apt: ${details.apartment}`);
    if (details.landmark) parts.push(`Note: ${details.landmark}`);
    return parts.join(", ");
  }, []);

  const hasBuildingDetails = Boolean(
    buildingDetails.building || buildingDetails.floor || buildingDetails.apartment || buildingDetails.landmark
  );

  const buildingSummary = useMemo(() => {
    const parts = [];
    if (buildingDetails.building) parts.push(buildingDetails.building);
    if (buildingDetails.floor) parts.push(`Fl ${buildingDetails.floor}`);
    if (buildingDetails.apartment) parts.push(`Apt ${buildingDetails.apartment}`);
    if (buildingDetails.landmark) parts.push(buildingDetails.landmark);
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
    onLocationSelect?.({
      address: full,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      distanceKm: dist,
      isOutOfRange: outOfRange,
      source: src,
      tag,
      details,
    });
  }, [composeFullAddress, onLocationSelect]);

  // Auto-detect GPS on initial mount if enabled
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
        return;
      }
    }

    if (autoLocate && !hasAutoLocated && navigator.geolocation) {
      setIsAutoLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsAutoLocating(false);
          setHasAutoLocated(true);
          const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, userLoc.lat, userLoc.lng);
          const outOfRange = dist != null && dist > MAX_DELIVERY_RADIUS_KM;

          setSelectedCoords(userLoc);
          setTempCoords(userLoc);

          reverseGeocode(userLoc, (addr) => {
            setAreaAddress(addr);
            setTempAddress(addr);
            notifyParent(addr, userLoc, buildingDetails, selectedTag, dist, outOfRange, "gps");
          });
        },
        () => {
          setIsAutoLocating(false);
          setHasAutoLocated(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, [initialLocation, autoLocate, hasAutoLocated, reverseGeocode, notifyParent, buildingDetails, selectedTag]);

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
    }, 120);
  }, [reverseGeocode]);

  const handleMapClick = useCallback((e) => {
    if (e.latLng && mapRef.current) {
      setIsDragging(true);
      mapRef.current.panTo(e.latLng);
    }
  }, []);

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
      }
    }
  }, []);

  // Quick preset area selection (Instant 1-Tap)
  const handleSelectQuickArea = (area) => {
    const loc = { lat: area.lat, lng: area.lng };
    const dist = calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, loc.lat, loc.lng);
    const outOfRange = dist != null && dist > MAX_DELIVERY_RADIUS_KM;

    setSelectedCoords(loc);
    setTempCoords(loc);
    setAreaAddress(`${area.name}, Lebanon`);
    setTempAddress(`${area.name}, Lebanon`);

    if (mapRef.current) {
      mapRef.current.panTo(loc);
      mapRef.current.setZoom(15);
    }

    notifyParent(`${area.name}, Lebanon`, loc, buildingDetails, selectedTag, dist, outOfRange, "preset");
    toast.success(`📍 ${area.name} selected (${dist ?? 0} km)`, { autoClose: 2000 });
  };

  // Instant 1-tap GPS locate from main card or modal
  const handleGpsLocate = useCallback((isModal = false) => {
    if (!navigator.geolocation) {
      toast.warn("Geolocation is not supported on this device.");
      return;
    }

    if (isModal) setIsLocatingModal(true);
    else setIsLocatingCard(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
          if (!isModal) {
            toast.success(`📍 Current location detected (${dist ?? 0} km)`, { autoClose: 2500 });
          }
        });
      },
      (err) => {
        if (isModal) setIsLocatingModal(false);
        else setIsLocatingCard(false);
        let msg = "Could not retrieve GPS location.";
        if (err.code === 1) msg = "Please enable location access in browser settings.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
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
    setTempAddress(areaAddress || "Locating...");
    setTempTag(selectedTag);
    setTempDetails({ ...buildingDetails });
    setShowMapModal(true);
  };

  // Confirm location from modal
  const handleConfirmModal = () => {
    if (isTempOutOfRange) {
      toast.error(
        `Delivery is only within 4 km of our store (${tempDistanceKm} km away). Please choose a closer spot.`,
        { autoClose: 4000 }
      );
      return;
    }

    const chosenArea = tempAddress || "Pinned Location";
    setSelectedCoords(tempCoords);
    setAreaAddress(chosenArea);
    setSelectedTag(tempTag);
    setBuildingDetails(tempDetails);
    setShowMapModal(false);

    notifyParent(chosenArea, tempCoords, tempDetails, tempTag, tempDistanceKm, false, "map");
    toast.success("Delivery location saved!", { autoClose: 2000 });
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
        <div className="loc-quick-chips">
          {QUICK_NEIGHBORHOODS.slice(0, 5).map((q) => (
            <button
              key={q.name}
              type="button"
              className="loc-chip-btn"
              onClick={() => handleSelectQuickArea(q)}
            >
              {q.name}
            </button>
          ))}
        </div>
        <div className="loc-fallback-input-wrap">
          <MapPin size={16} className="loc-fallback-icon" />
          <input
            type="text"
            placeholder="Type your area or street name..."
            value={areaAddress}
            onChange={(e) => {
              const v = e.target.value;
              setAreaAddress(v);
              notifyParent(v, null, buildingDetails, selectedTag, null, false, "manual");
            }}
            className="loc-fallback-input"
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
        
        {/* Card Header & Fast Action Buttons */}
        <div className="loc-card-header">
          <div className="loc-header-left">
            <span className="loc-badge-tag">
              <TagIcon size={12} />
              {ADDRESS_TAGS.find(t => t.id === selectedTag)?.label || "Delivery"}
            </span>
            {currentDistanceKm != null && (
              <span className={`loc-distance-chip ${isSelectedOutOfRange ? "dist-out" : "dist-in"}`}>
                {isSelectedOutOfRange ? `⚠️ ${currentDistanceKm} km (Max 4km)` : `✓ ${currentDistanceKm} km away`}
              </span>
            )}
          </div>

          <div className="loc-header-actions">
            {/* 1-Tap GPS locate button */}
            <button
              type="button"
              className={`loc-action-btn loc-gps-btn ${isLocatingCard ? "is-spinning" : ""}`}
              onClick={() => handleGpsLocate(false)}
              disabled={isLocatingCard || isAutoLocating}
              title="Locate my position automatically"
            >
              {isLocatingCard || isAutoLocating ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Crosshair size={13} />
              )}
              <span>Locate Me</span>
            </button>

            {/* Open Map Modal button */}
            <button
              type="button"
              className="loc-action-btn loc-map-btn"
              onClick={handleOpenMap}
              title="Choose on map"
            >
              <MapPin size={13} />
              <span>Map</span>
            </button>
          </div>
        </div>

        {/* Selected Address Display */}
        <div className="loc-address-row" onClick={handleOpenMap} role="button" tabIndex={0}>
          <div className={`loc-pin-box ${isSelectedOutOfRange ? "pin-box-out" : ""}`}>
            <MapPin size={18} />
          </div>
          <div className="loc-address-content">
            <div className={`loc-address-title ${!areaAddress ? "placeholder" : ""}`}>
              {isAutoLocating ? "Detecting GPS location..." : areaAddress || "Select delivery location..."}
            </div>
            {hasBuildingDetails ? (
              <div className="loc-address-subtitle">{buildingSummary}</div>
            ) : (
              <div className="loc-address-hint">Tap to adjust or add building/floor details</div>
            )}
          </div>
        </div>

        {/* 1-Tap Quick Area Preset Chips (Dbayeh, Antelias, etc.) */}
        <div className="loc-quick-areas-wrapper">
          <span className="loc-quick-label">Quick Areas:</span>
          <div className="loc-quick-chips-scroll">
            {QUICK_NEIGHBORHOODS.map((q) => {
              const isCurrent = areaAddress.toLowerCase().includes(q.name.toLowerCase());
              return (
                <button
                  key={q.name}
                  type="button"
                  className={`loc-chip-btn ${isCurrent ? "chip-active" : ""}`}
                  onClick={() => handleSelectQuickArea(q)}
                >
                  {q.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Address Tag & Building Toggle Bar */}
        <div className="loc-tags-toggle-bar">
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

          <button
            type="button"
            className="loc-details-toggle-btn"
            onClick={() => setShowDetailsInline(!showDetailsInline)}
          >
            <span>{hasBuildingDetails ? "Edit Details" : "+ Building/Floor"}</span>
            {showDetailsInline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Expandable Fast Building Details (Inline) */}
        {showDetailsInline && (
          <div className="loc-inline-details-drawer">
            <div className="loc-inline-grid">
              <input
                type="text"
                placeholder="Building / Street name"
                value={buildingDetails.building}
                onChange={(e) => handleDetailChange("building", e.target.value)}
                className="loc-input"
              />
              <div className="loc-inline-row-2">
                <input
                  type="text"
                  placeholder="Floor (e.g. 2nd)"
                  value={buildingDetails.floor}
                  onChange={(e) => handleDetailChange("floor", e.target.value)}
                  className="loc-input"
                />
                <input
                  type="text"
                  placeholder="Apt (e.g. 4B)"
                  value={buildingDetails.apartment}
                  onChange={(e) => handleDetailChange("apartment", e.target.value)}
                  className="loc-input"
                />
              </div>
              <input
                type="text"
                placeholder="Delivery note / Landmark (Optional)"
                value={buildingDetails.landmark}
                onChange={(e) => handleDetailChange("landmark", e.target.value)}
                className="loc-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Interactive Map Modal */}
      {showMapModal && typeof document !== "undefined" && createPortal(
        <div className="loc-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="loc-modal-dialog" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="loc-modal-head">
              <div className="loc-modal-title-group">
                <h3 className="loc-modal-title">Pin Delivery Location</h3>
                <span className="loc-radius-badge">4 km Radius</span>
              </div>
              <button 
                type="button" 
                className="loc-close-btn"
                onClick={() => setShowMapModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Places Autocomplete Search Bar */}
            {isLoaded && (
              <div className="loc-search-overlay">
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                  options={{ componentRestrictions: { country: "lb" } }}
                >
                  <div className="loc-search-input-box">
                    <Search size={15} className="loc-search-ico" />
                    <input
                      type="text"
                      placeholder="Search street, area or landmark..."
                      className="loc-search-field"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    />
                  </div>
                </Autocomplete>

                {/* Quick Area Chips in Search Bar */}
                <div className="loc-modal-quick-chips">
                  {QUICK_NEIGHBORHOODS.slice(0, 6).map((q) => (
                    <button
                      key={q.name}
                      type="button"
                      className="loc-modal-chip"
                      onClick={() => {
                        const loc = { lat: q.lat, lng: q.lng };
                        setTempCoords(loc);
                        setTempAddress(`${q.name}, Lebanon`);
                        mapRef.current?.panTo(loc);
                        mapRef.current?.setZoom(15);
                      }}
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Map Canvas Viewport */}
            <div className="loc-map-frame">
              {/* Center Pin & Animated Drop */}
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

              {/* Floating Map Action Buttons */}
              <div className="loc-map-floating-actions">
                <button
                  type="button"
                  className="loc-fab-btn"
                  onClick={handleCenterOnStore}
                  title="Center on Store Hub"
                >
                  <Store size={17} />
                </button>
                <button
                  type="button"
                  className={`loc-fab-btn ${isLocatingModal ? "is-locating" : ""}`}
                  onClick={() => handleGpsLocate(true)}
                  disabled={isLocatingModal}
                  title="My GPS Position"
                >
                  {isLocatingModal ? (
                    <Loader2 size={17} className="animate-spin text-blue-600" />
                  ) : (
                    <Crosshair size={17} />
                  )}
                </button>
              </div>

              {/* Real-time Distance Pill on Map */}
              <div className={`loc-map-dist-pill ${isTempOutOfRange ? "dist-out" : "dist-in"}`}>
                {isTempOutOfRange ? (
                  <>⚠️ {tempDistanceKm} km from store (Outside 4 km)</>
                ) : (
                  <>✓ {tempDistanceKm != null ? `${tempDistanceKm} km from store` : "Within 4 km zone"}</>
                )}
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
                  {/* Store Radius Ring */}
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

            {/* Modal Bottom Confirm Sheet */}
            <div className="loc-modal-footer">
              <div className="loc-footer-addr-row">
                <MapPin size={17} className={isTempOutOfRange ? "text-red-500" : "text-green-600"} />
                <div className="loc-footer-addr-info">
                  <span className="loc-footer-addr-text">
                    {isAddressResolving ? "Detecting area..." : tempAddress || "Pinned Location"}
                  </span>
                  <span className={`loc-footer-dist-sub ${isTempOutOfRange ? "sub-out" : "sub-in"}`}>
                    {isTempOutOfRange ? `Outside 4 km delivery range` : `${tempDistanceKm ?? 0} km from store`}
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

              {/* Building & Apt Optional Fields in Modal */}
              <div className="loc-modal-details-grid">
                <input
                  type="text"
                  placeholder="Bldg / Street"
                  value={tempDetails.building}
                  onChange={(e) => setTempDetails({ ...tempDetails, building: e.target.value })}
                  className="loc-input-sm"
                />
                <input
                  type="text"
                  placeholder="Floor / Apt"
                  value={tempDetails.floor ? `${tempDetails.floor}${tempDetails.apartment ? ` - Apt ${tempDetails.apartment}` : ""}` : tempDetails.apartment}
                  onChange={(e) => {
                    setTempDetails({ ...tempDetails, floor: e.target.value });
                  }}
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
                    <span>Outside 4 km Delivery Zone</span>
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
