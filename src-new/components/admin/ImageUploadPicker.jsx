import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Trash2, Link as LinkIcon, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api, { getAssetUrl } from '../../utils/api';
import { compressImageFile } from '../../utils/imageCompressor';
import './ImageUploadPicker.css';

/**
 * ImageUploadPicker component for Admin Product & Category management.
 * Provides direct Camera capture (environment/rear camera on mobile),
 * Gallery/Photo Library selection, client compression, and manual URL input.
 */
const ImageUploadPicker = ({ 
  value = '', 
  onChange, 
  label = 'Product Image',
  fallbackPlaceholder = '/assets/images/products/placeholder.jpg'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same photo can be re-selected if desired
    e.target.value = '';

    setUploadError('');
    setIsUploading(true);

    try {
      // 1. Client-side compression (resizes large 10MP+ mobile shots in milliseconds)
      const compressedFile = await compressImageFile(file, {
        maxWidth: 1400,
        maxHeight: 1400,
        quality: 0.85
      });

      // 2. Prepare FormData payload
      const uploadData = new FormData();
      uploadData.append('image', compressedFile);

      // 3. Post to backend
      const res = await api.post('/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // res.data is the relative path (e.g., '/uploads/image-12345.jpg')
      const uploadedUrl = res.data;
      if (onChange) {
        onChange(uploadedUrl);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload photo. Please try again.';
      setUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerCamera = () => {
    setUploadError('');
    cameraInputRef.current?.click();
  };

  const handleTriggerGallery = () => {
    setUploadError('');
    galleryInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    if (onChange) {
      onChange('');
    }
  };

  const hasImage = Boolean(value && value.trim());
  const resolvedPreviewUrl = hasImage ? getAssetUrl(value) : '';

  return (
    <div className="image-picker-container">
      {/* Hidden file inputs for Mobile Camera & Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <div className="image-picker-label-row">
        <label className="image-picker-label">
          <ImageIcon size={15} color="#16a34a" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          className="image-picker-toggle-url-btn"
          onClick={() => setShowManualUrl(prev => !prev)}
        >
          <LinkIcon size={12} />
          <span>{showManualUrl ? 'Hide URL link' : 'Enter URL manually'}</span>
        </button>
      </div>

      <div className={`image-picker-card ${hasImage ? 'has-image' : ''} ${isUploading ? 'is-uploading' : ''}`}>
        {/* Uploading Banner */}
        {isUploading && (
          <div className="image-uploading-banner">
            <div className="image-spinner" />
            <span>Uploading & optimizing photo...</span>
          </div>
        )}

        {/* Upload Error Alert */}
        {uploadError && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <AlertCircle size={15} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Active Image Preview */}
        {hasImage && !isUploading && (
          <div className="image-preview-box">
            <div className="image-preview-thumb-wrap">
              <img
                src={resolvedPreviewUrl}
                alt="Selected preview"
                className="image-preview-thumb"
                onError={(e) => {
                  e.currentTarget.src = fallbackPlaceholder;
                }}
              />
            </div>
            <div className="image-preview-info">
              <span className="image-preview-status">
                <CheckCircle2 size={14} color="#16a34a" /> Image Ready
              </span>
              <span className="image-preview-path" title={value}>
                {value}
              </span>
              <button
                type="button"
                className="image-preview-remove-btn"
                onClick={handleRemoveImage}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        )}

        {/* Camera & Gallery Action Buttons */}
        <div className="image-picker-actions-grid">
          <button
            type="button"
            className="image-picker-btn btn-camera"
            onClick={handleTriggerCamera}
            disabled={isUploading}
            title="Open camera to take a photo"
          >
            <Camera size={22} color="#059669" />
            <span>Take Photo</span>
            <span className="image-picker-btn-sub">Use Phone Camera</span>
          </button>

          <button
            type="button"
            className="image-picker-btn btn-gallery"
            onClick={handleTriggerGallery}
            disabled={isUploading}
            title="Choose from photo gallery or files"
          >
            <ImageIcon size={22} color="#0284c7" />
            <span>From Gallery</span>
            <span className="image-picker-btn-sub">Choose File / Photos</span>
          </button>
        </div>

        {/* Optional Manual URL Input */}
        {showManualUrl && (
          <div className="image-url-manual-wrap">
            <input
              type="text"
              className="admin-form-input"
              style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
              placeholder="https://... or /assets/images/..."
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              disabled={isUploading}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadPicker;
