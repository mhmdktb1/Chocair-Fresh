import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { GoogleMap, useJsApiLoader, Circle, Marker } from "@react-google-maps/api";
import {
  MapPin, Crosshair, Building2, Layers, Check, X, AlertTriangle,
  Store, Loader2, Map, ArrowRight, Pencil, Plus, Home, Briefcase,
  CheckCircle2, Navigation, DoorOpen, Landmark, Move
} from "lucide-react";
import { toast } from "react-toastify";
import {
  STORE_COORDS,
  MAX_DELIVERY_RADIUS_KM,
  calculateDistanceKm,
  getNearestAreaName,
  extractAreaName,
  KNOWN_AREAS,
} from "../../utils/distanceHelper";
import "./LocationPicker.css";

const GOOGLE_LIBRARIES = ["places"];
const EMPTY_DETAILS = { building: "", floor: "", apartment: "", landmark: "" };

const TOKEN_FIELDS = [
  [/^bldg:\s*/i, "building"],
  [/^fl:\s*/i, "floor"],
  [/^apt:\s*/i, "apartment"],
  [/^note:\s*/i, "landmark"],
];

/** Splits a composed address ("Dbayeh, Bldg: A, Fl: 2") back into area + details. */
const parseAddressString = (str) => {
  const details = { ...EMPTY_DETAILS };
  const areaParts = [];
  String(str || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((part) => {
      const hit = TOKEN_FIELDS.find(([re]) => re.test(part));
      if (hit) details[hit[1]] = part.replace(hit[0], "").trim();
      else areaParts.push(part);
    });
  return { area: areaParts.join(", "), details };
};

const composeFullAddress = (area, d) => {
  const parts = [];
  if (area) parts.push(area);
  if (d.building?.trim()) parts.push(`Bldg: ${d.building.trim()}`);
  if (d.floor?.trim()) parts.push(`Fl: ${d.floor.trim()}`);
  if (d.apartment?.trim()) parts.push(`Apt: ${d.apartment.trim()}`);
  if (d.landmark?.trim()) parts.push(`Note: ${d.landmark.trim()}`);
  return parts.join(", ");
};

const iconForLabel = (label = "") => {
  const l = String(label).toLowerCase();
  if (/work|office/.test(l)) return Briefcase;
  if (/home|house/.test(l)) return Home;
  return MapPin;
};

const cleanChipLabel = (rawLabel = "") => {
  if (!rawLabel) return "Address";
  const str = String(rawLabel).trim();
  // Strip "Delivery (name)" or "Delivery(name)" -> "name"
  const match = str.match(/^Delivery\s*\((.*?)\)$/i);
  if (match && match[1]) {
    return match[1].trim() || "Address";
  }
  // Strip "Delivery -" or "Delivery:" or "Delivery "
  const stripped = str.replace(/^Delivery\s*[:-]?\s*/i, "").trim();
  return stripped || "Address";
};

const distanceTo = (coords) =>
  coords && coords.lat != null && coords.lng != null
    ? calculateDistanceKm(STORE_COORDS.lat, STORE_COORDS.lng, coords.lat, coords.lng)
    : null;

/**
 * Delivery address picker
 * Step 1: choose how to set the spot (GPS / map / saved address)
 * Step 2: confirm the spot, add Building & Floor (optional apartment / landmark)
 */
const LocationPicker = ({
  onLocationSelect,
  initialLocation,
  maxDeliveryRadiusKm = MAX_DELIVERY_RADIUS_KM,
  savedAddresses = [],
}) => {
  const radiusKm = Number(maxDeliveryRadiusKm || MAX_DELIVERY_RADIUS_KM);
  const storeCenter = useMemo(() => ({ lat: STORE_COORDS.lat, lng: STORE_COORDS.lng }), []);

  const [coords, setCoords] = useState(null);
  const [area, setArea] = useState("");
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [showExtras, setShowExtras] = useState(false);
  const [selectedSavedKey, setSelectedSavedKey] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [tempCoords, setTempCoords] = useState(storeCenter);
  const [tempArea, setTempArea] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [hasMovedMap, setHasMovedMap] = useState(false);
  const [isLocatingInMap, setIsLocatingInMap] = useState(false);

  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const geocodeSeqRef = useRef(0);
  const idleTimerRef = useRef(null);
  const cachedGeoPosRef = useRef(null);
  // Last address string we sent to the parent; used to ignore our own echo via `initialLocation`.
  const lastEmittedRef = useRef(null);

  // Background pre-warming: if geolocation permission is already granted,
  // pre-fetch coordinates silently so "Locate Me" resolves in 0ms when clicked.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((status) => {
          if (status.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                cachedGeoPosRef.current = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  timestamp: Date.now(),
                };
              },
              () => {},
              { enableHighAccuracy: false, maximumAge: 300000, timeout: 3000 }
            );
          }
        }).catch(() => {});
      }
    }
  }, []);

  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyA2sDabFv8XdkWGWQ6OBRFK17iDnDqcN9Y";

  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey, libraries: GOOGLE_LIBRARIES });

  const distanceKm = useMemo(() => distanceTo(coords), [coords]);
  const isOut = distanceKm != null && distanceKm > radiusKm;
  const tempDistanceKm = useMemo(() => distanceTo(tempCoords), [tempCoords]);
  const isTempOut = tempDistanceKm != null && tempDistanceKm > radiusKm;

  const hasLocation = Boolean(area);
  const hasRequired = Boolean(details.building.trim() && details.floor.trim());
  const isComplete = hasLocation && hasRequired && !isOut;

  const emit = useCallback(
    (nextArea, nextCoords, nextDetails, source) => {
      const dist = distanceTo(nextCoords);
      const out = dist != null && dist > radiusKm;
      const full = composeFullAddress(nextArea, nextDetails);
      lastEmittedRef.current = full;
      onLocationSelect?.({
        address: full,
        lat: nextCoords?.lat ?? null,
        lng: nextCoords?.lng ?? null,
        distanceKm: dist,
        isOutOfRange: out,
        source,
        details: nextDetails,
        building: nextDetails.building.trim(),
        floor: nextDetails.floor.trim(),
        apartment: nextDetails.apartment.trim(),
        landmark: nextDetails.landmark.trim(),
        isComplete: Boolean(nextArea && nextDetails.building.trim() && nextDetails.floor.trim() && !out),
      });
    },
    [onLocationSelect, radiusKm]
  );

  const applyParsed = useCallback((str) => {
    const parsed = parseAddressString(str);
    setArea(parsed.area);
    setDetails((prev) => ({
      building: parsed.details.building || prev.building,
      floor: parsed.details.floor || prev.floor,
      apartment: parsed.details.apartment || prev.apartment,
      landmark: parsed.details.landmark || prev.landmark,
    }));
    if (parsed.details.apartment || parsed.details.landmark) setShowExtras(true);
  }, []);

  useEffect(() => {
    if (!initialLocation) return;
    if (typeof initialLocation === "string") {
      const str = initialLocation.trim();
      if (!str || str === lastEmittedRef.current) return;
      applyParsed(str);
      return;
    }
    if (typeof initialLocation === "object") {
      if (initialLocation.address) applyParsed(initialLocation.address);
      if (typeof initialLocation.lat === "number" && typeof initialLocation.lng === "number") {
        const loc = { lat: initialLocation.lat, lng: initialLocation.lng };
        setCoords(loc);
        setTempCoords(loc);
      }
    }
  }, [initialLocation, applyParsed]);

  useEffect(() => {
    if (!showMap) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setShowMap(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [showMap]);

  const getGeocoder = useCallback(() => {
    if (geocoderRef.current) return geocoderRef.current;
    try {
      if (typeof window.google?.maps?.Geocoder === "function") {
        geocoderRef.current = new window.google.maps.Geocoder();
      }
    } catch {
      geocoderRef.current = null;
    }
    return geocoderRef.current;
  }, []);

  const reverseGeocode = useCallback(
    (loc, cb) => {
      const fallback = getNearestAreaName(loc?.lat, loc?.lng) || "Dbayeh";
      if (!loc || loc.lat == null || loc.lng == null) return cb?.(fallback);

      const geocoder = getGeocoder();
      if (!geocoder) return cb?.(fallback);

      const seq = ++geocodeSeqRef.current;
      let settled = false;
      const finish = (name) => {
        if (settled || seq !== geocodeSeqRef.current) return;
        settled = true;
        clearTimeout(timer);
        cb?.(name || fallback);
      };
      // Slow or blocked geocoding must never stall the flow; fall back to the nearest known area.
      const timer = setTimeout(() => finish(fallback), 2500);

      try {
        geocoder.geocode({ location: loc }, (results, status) => {
          if (status === "OK" && Array.isArray(results) && results.length > 0) {
            finish(extractAreaName(results, loc) || fallback);
          } else {
            finish(fallback);
          }
        });
      } catch {
        finish(fallback);
      }
    },
    [getGeocoder]
  );

  // ---- Map handlers ----
  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      getGeocoder();
      const start = tempCoords || coords || storeCenter;
      map.panTo(start);
      map.setZoom(coords ? 16 : 15);
      reverseGeocode(start, setTempArea);
    },
    [tempCoords, coords, storeCenter, reverseGeocode, getGeocoder]
  );

  const onMapDragStart = useCallback(() => {
    setIsDragging(true);
    setHasMovedMap(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, []);

  const onMapIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsDragging(false);
      const center = mapRef.current?.getCenter();
      if (!center) return;
      const loc = { lat: center.lat(), lng: center.lng() };
      setTempCoords(loc);
      reverseGeocode(loc, setTempArea);
    }, 120);
  }, [reverseGeocode]);

  const onMapClick = useCallback((e) => {
    if (e.latLng && mapRef.current) {
      setIsDragging(true);
      setHasMovedMap(true);
      mapRef.current.panTo(e.latLng);
    }
  }, []);

  // Fast position applicator: updates coordinates and computes local area immediately (0ms),
  // then refines with Google Geocoder in background without blocking the UI.
  const applyLocatePosition = useCallback(
    (loc, inMap) => {
      const instantArea = getNearestAreaName(loc.lat, loc.lng) || "Dbayeh";
      setTempCoords(loc);
      setTempArea(instantArea);
      setHasMovedMap(true);

      if (mapRef.current) {
        mapRef.current.panTo(loc);
        mapRef.current.setZoom(17);
      }

      if (!inMap) {
        setCoords(loc);
        setArea(instantArea);
        setSelectedSavedKey(null);
        emit(instantArea, loc, details, "gps");
      }

      // Background refinement for neighborhood / street name
      reverseGeocode(loc, (detailedName) => {
        if (detailedName && detailedName !== instantArea) {
          setTempArea(detailedName);
          if (!inMap) {
            setArea(detailedName);
            emit(detailedName, loc, details, "gps");
          }
        }
      });
    },
    [reverseGeocode, emit, details]
  );

  // ---- Actions ----
  const locateMe = useCallback(
    (inMap = false) => {
      if (!navigator.geolocation) {
        toast.warn("Location services are not available on this device.");
        return;
      }

      // 1. Instant check: if we have a fresh pre-warmed GPS cache (< 5 min old), apply immediately!
      const cached = cachedGeoPosRef.current;
      if (cached && Date.now() - cached.timestamp < 300000) {
        applyLocatePosition(cached, inMap);
        return;
      }

      const setBusy = inMap ? setIsLocatingInMap : setIsLocating;
      setBusy(true);

      const onPosSuccess = (pos) => {
        setBusy(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        cachedGeoPosRef.current = { ...loc, timestamp: Date.now() };
        applyLocatePosition(loc, inMap);
      };

      const onPosError = (err) => {
        // Fallback: try standard accuracy if high accuracy timed out
        if (err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            onPosSuccess,
            () => {
              setBusy(false);
              toast.error("Couldn't find your location. Try picking it on the map.");
            },
            { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
          );
          return;
        }
        setBusy(false);
        if (err.code === 1) toast.error("Location access is blocked. Allow it in your browser settings or pick on the map.");
        else toast.error("Couldn't find your location. Try picking it on the map.");
      };

      // Use fast cached / Wi-Fi position first with high-accuracy fallback
      navigator.geolocation.getCurrentPosition(onPosSuccess, onPosError, {
        enableHighAccuracy: true,
        timeout: 4500,
        maximumAge: 120000,
      });
    },
    [applyLocatePosition]
  );

  const openMap = () => {
    const start = coords || storeCenter;
    setTempCoords(start);
    setTempArea(coords ? area : "");
    setHasMovedMap(false);
    setShowMap(true);
  };

  const centerOnStore = () => {
    setTempCoords(storeCenter);
    setHasMovedMap(true);
    mapRef.current?.panTo(storeCenter);
    mapRef.current?.setZoom(15);
    reverseGeocode(storeCenter, setTempArea);
  };

  const confirmMap = () => {
    if (isTempOut) {
      toast.error(`We deliver within ${radiusKm} km of our store. Please choose a closer spot.`);
      return;
    }
    const chosen = tempArea || getNearestAreaName(tempCoords?.lat, tempCoords?.lng) || "Dbayeh";
    setCoords(tempCoords);
    setArea(chosen);
    setSelectedSavedKey(null);
    setShowMap(false);
    emit(chosen, tempCoords, details, "map");
  };

  const pickSaved = (saved, key) => {
    if (selectedSavedKey === key) {
      // Tapping active chip deselects it and resets back to clean empty state
      setArea("");
      setDetails(EMPTY_DETAILS);
      setCoords(null);
      setSelectedSavedKey(null);
      setShowExtras(false);
      emit("", null, EMPTY_DETAILS, "saved");
      return;
    }
    const parsed = parseAddressString(saved.address);
    const merged = {
      ...parsed.details,
      landmark: parsed.details.landmark || saved.notes || "",
    };

    // Assign pinned coordinates: from saved object OR by matching area in KNOWN_AREAS OR store location
    let assignedCoords = null;
    if (typeof saved.lat === "number" && typeof saved.lng === "number" && !isNaN(saved.lat) && !isNaN(saved.lng)) {
      assignedCoords = { lat: saved.lat, lng: saved.lng };
    } else if (parsed.area) {
      const parsedLower = parsed.area.toLowerCase();
      const matched = KNOWN_AREAS?.find((a) =>
        parsedLower.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(parsedLower)
      );
      if (matched) {
        assignedCoords = { lat: matched.lat, lng: matched.lng };
      } else {
        assignedCoords = { lat: STORE_COORDS.lat, lng: STORE_COORDS.lng };
      }
    } else {
      assignedCoords = { lat: STORE_COORDS.lat, lng: STORE_COORDS.lng };
    }

    setArea(parsed.area);
    setDetails(merged);
    setCoords(assignedCoords);
    if (assignedCoords) {
      setTempCoords(assignedCoords);
    }
    setSelectedSavedKey(key);
    if (merged.apartment || merged.landmark) setShowExtras(true);
    emit(parsed.area, assignedCoords, merged, "saved");
  };

  const changeDetail = (field, value) => {
    const next = { ...details, [field]: value };
    setDetails(next);
    emit(area, coords, next, "manual");
  };

  const changeTypedArea = (value) => {
    setArea(value);
    setCoords(null);
    setSelectedSavedKey(null);
    emit(value, null, details, "manual");
  };

  const fmtKm = (km) => (km != null ? `${Number(km).toFixed(1)} km` : "");

  // ---- Sub-renders ----
  const renderSavedChips = () =>
    savedAddresses.length > 0 && (
      <div className="addr-saved">
        <span className="addr-saved-label">Saved</span>
        <div className="addr-saved-chips">
          {savedAddresses.map((s, i) => {
            const key = s._id || s.id || `saved-${i}`;
            const cleanTitle = cleanChipLabel(s.label || s.building || s.address?.split(",")[0] || "Address");
            const Icon = iconForLabel(cleanTitle);
            return (
              <button
                key={key}
                type="button"
                className={`addr-chip ${selectedSavedKey === key ? "is-active" : ""}`}
                onClick={() => pickSaved(s, key)}
                title={s.address}
              >
                <Icon size={13} />
                <span>{cleanTitle}</span>
                {selectedSavedKey === key && <Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    );

  const renderChoiceButtons = (variant = "") => (
    <div className={`addr-choice-grid ${variant}`}>
      <button
        type="button"
        className={`addr-choice is-primary ${isLocating ? "is-busy" : ""}`}
        onClick={() => locateMe(false)}
        disabled={isLocating}
      >
        <span className="addr-choice-icon">
          {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Crosshair size={20} />}
        </span>
        <span className="addr-choice-text">
          <strong>{isLocating ? "Locating…" : "Locate Me"}</strong>
          <small>Fastest · 1-tap GPS</small>
        </span>
        <ArrowRight size={16} className="addr-choice-arrow" />
      </button>

      <button type="button" className="addr-choice" onClick={openMap}>
        <span className="addr-choice-icon is-map">
          <Map size={20} />
        </span>
        <span className="addr-choice-text">
          <strong>Pick on map</strong>
          <small>Drop a pin anywhere</small>
        </span>
        <ArrowRight size={16} className="addr-choice-arrow" />
      </button>
    </div>
  );

  const renderDetailFields = () => (
    <div className="addr-details">
      <div className="addr-fields-row">
        <label className="addr-field">
          <span className="addr-field-label">
            Building <i className="addr-req">*</i>
          </span>
          <span className={`addr-input-wrap ${details.building.trim() ? "is-filled" : ""}`}>
            <Building2 size={15} />
            <input
              type="text"
              required
              autoComplete="off"
              placeholder="Name or number"
              value={details.building}
              onChange={(e) => changeDetail("building", e.target.value)}
            />
          </span>
        </label>

        <label className="addr-field">
          <span className="addr-field-label">
            Floor <i className="addr-req">*</i>
          </span>
          <span className={`addr-input-wrap ${details.floor.trim() ? "is-filled" : ""}`}>
            <Layers size={15} />
            <input
              type="text"
              required
              autoComplete="off"
              placeholder="e.g. 3 or Ground"
              value={details.floor}
              onChange={(e) => changeDetail("floor", e.target.value)}
            />
          </span>
        </label>
      </div>

      {showExtras ? (
        <div className="addr-fields-row addr-fields-extra">
          <label className="addr-field">
            <span className="addr-field-label">Apartment</span>
            <span className={`addr-input-wrap ${details.apartment.trim() ? "is-filled" : ""}`}>
              <DoorOpen size={15} />
              <input
                type="text"
                autoComplete="off"
                placeholder="e.g. 4B"
                value={details.apartment}
                onChange={(e) => changeDetail("apartment", e.target.value)}
              />
            </span>
          </label>
          <label className="addr-field">
            <span className="addr-field-label">Landmark / note for the driver</span>
            <span className={`addr-input-wrap ${details.landmark.trim() ? "is-filled" : ""}`}>
              <Landmark size={15} />
              <input
                type="text"
                autoComplete="off"
                placeholder="e.g. Next to the pharmacy"
                value={details.landmark}
                onChange={(e) => changeDetail("landmark", e.target.value)}
              />
            </span>
          </label>
        </div>
      ) : (
        <button type="button" className="addr-more-btn" onClick={() => setShowExtras(true)}>
          <Plus size={14} /> Add apartment, landmark or note
        </button>
      )}
    </div>
  );

  // Google Maps failed to load → simple typed fallback
  if (loadError) {
    return (
      <div className="addr-picker">
        {renderSavedChips()}
        <div className="addr-card">
          <label className="addr-field">
            <span className="addr-field-label">
              Area / street <i className="addr-req">*</i>
            </span>
            <span className={`addr-input-wrap ${area.trim() ? "is-filled" : ""}`}>
              <MapPin size={15} />
              <input
                type="text"
                placeholder="e.g. Dbayeh, Main road"
                value={area}
                onChange={(e) => changeTypedArea(e.target.value)}
              />
            </span>
          </label>
          {renderDetailFields()}
        </div>
      </div>
    );
  }

  return (
    <div className="addr-picker">
      {renderSavedChips()}

      {!hasLocation ? (
        <div className="addr-empty">
          <div className="addr-empty-head">
            <h3>Where should we deliver?</h3>
            <p>
              <Store size={13} /> We deliver within {radiusKm} km of our store
            </p>
          </div>
          {renderChoiceButtons()}
        </div>
      ) : (
        <div className={`addr-card ${isOut ? "is-out" : isComplete ? "is-complete" : "is-set"}`}>
          <div className="addr-card-top">
            <div className="addr-pin">
              {isOut ? <AlertTriangle size={20} /> : isComplete ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
            </div>
            <div className="addr-card-text">
              <div className="addr-area" title={area}>{area}</div>
              <div className={`addr-status ${isOut ? "is-out" : (coords || selectedSavedKey) ? "is-ok" : "is-muted"}`}>
                {isOut ? (
                  <>Outside our {radiusKm} km delivery zone · {fmtKm(distanceKm)} away</>
                ) : selectedSavedKey ? (
                  <>
                    <Check size={12} strokeWidth={3} /> Saved delivery address{distanceKm != null ? ` · ${fmtKm(distanceKm)} from store` : " · In delivery zone"}
                  </>
                ) : coords ? (
                  <>
                    <Check size={12} strokeWidth={3} /> In delivery zone · {fmtKm(distanceKm)} from store
                  </>
                ) : (
                  <>
                    <Navigation size={12} /> Not pinned yet · tap Change to pin the exact spot
                  </>
                )}
              </div>
            </div>
            <button type="button" className="addr-change-btn" onClick={openMap}>
              <Pencil size={13} />
              <span>Change</span>
            </button>
          </div>

          {isOut ? (
            <div className="addr-out-actions">
              <p>Sorry, we can't reach this spot yet. Please pick a location closer to the store.</p>
              {renderChoiceButtons("is-compact")}
            </div>
          ) : (
            renderDetailFields()
          )}
        </div>
      )}

      {showMap &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="addr-modal-overlay" onClick={() => setShowMap(false)}>
            <div
              className="addr-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Pin your delivery location"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="addr-modal-head">
                <div className="addr-modal-title-wrap">
                  <h3>Pin your location</h3>
                  <span className="addr-zone-badge">
                    <Store size={11} /> {radiusKm} km zone
                  </span>
                </div>
                <button type="button" className="addr-close-btn" onClick={() => setShowMap(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="addr-map-frame">
                {!hasMovedMap && (
                  <div className="addr-map-hint">
                    <Move size={13} /> Drag the map to place the pin
                  </div>
                )}

                <div className="addr-center-pin" aria-hidden="true">
                  <div className={`addr-pin-svg ${isDragging ? "is-lifting" : "is-dropped"}`}>
                    <svg width="40" height="48" viewBox="0 0 42 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M21 0C9.402 0 0 9.402 0 21C0 34.125 18.375 48.825 20.097 50.169C20.6355 50.5895 21.3645 50.5895 21.903 50.169C23.625 48.825 42 34.125 42 21C42 9.402 32.598 0 21 0Z"
                        fill={isTempOut ? "#dc2626" : "#16a34a"}
                      />
                      <circle cx="21" cy="20" r="7.5" fill="#ffffff" />
                      <circle cx="21" cy="20" r="4" fill={isTempOut ? "#991b1b" : "#15803d"} />
                    </svg>
                  </div>
                  <div className="addr-pin-shadow" />
                </div>

                <div className="addr-map-actions">
                  <button
                    type="button"
                    className="addr-map-pill is-store"
                    onClick={centerOnStore}
                    title="Center on Store Hub"
                  >
                    <Store size={14} />
                    <span>Store</span>
                  </button>
                  <button
                    type="button"
                    className={`addr-map-pill is-locate ${isLocatingInMap ? "is-busy" : ""}`}
                    onClick={() => locateMe(true)}
                    disabled={isLocatingInMap}
                    title="Locate my position"
                  >
                    {isLocatingInMap ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Crosshair size={14} />
                    )}
                    <span>{isLocatingInMap ? "Locating…" : "Locate Me"}</span>
                  </button>
                </div>

                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={tempCoords}
                    zoom={15}
                    onLoad={onMapLoad}
                    onDragStart={onMapDragStart}
                    onIdle={onMapIdle}
                    onClick={onMapClick}
                    options={{
                      fullscreenControl: false,
                      streetViewControl: false,
                      mapTypeControl: false,
                      zoomControl: false,
                      gestureHandling: "greedy",
                      clickableIcons: false,
                    }}
                  >
                    <Circle
                      center={STORE_COORDS}
                      radius={radiusKm * 1000}
                      options={{
                        strokeColor: "#16a34a",
                        strokeOpacity: 0.85,
                        strokeWeight: 2,
                        fillColor: "#22c55e",
                        fillOpacity: 0.08,
                        clickable: false,
                      }}
                    />
                    <Marker position={STORE_COORDS} title="Choucair Fresh" />
                  </GoogleMap>
                ) : (
                  <div className="addr-map-loading">
                    <Loader2 size={26} className="animate-spin" />
                  </div>
                )}
              </div>

              <div className="addr-sheet">
                <div className="addr-sheet-row">
                  <div className={`addr-sheet-pin ${isTempOut ? "is-out" : ""}`}>
                    <MapPin size={18} />
                  </div>
                  <div className="addr-sheet-text">
                    <strong>{tempArea || "Locating…"}</strong>
                    {tempDistanceKm != null && (
                      <span className={isTempOut ? "is-out" : "is-ok"}>
                        {isTempOut
                          ? `Outside our ${radiusKm} km zone · ${fmtKm(tempDistanceKm)} away`
                          : `In delivery zone · ${fmtKm(tempDistanceKm)} from store`}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={`addr-confirm-btn ${isTempOut ? "is-out" : ""}`}
                  onClick={confirmMap}
                  disabled={isTempOut}
                >
                  {isTempOut ? (
                    <>
                      <AlertTriangle size={16} /> Move the pin closer to the store
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={3} /> Confirm this spot
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
