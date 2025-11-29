/**
 * ==========================================
 * FILE UPLOAD UTILITY
 * ==========================================
 * 
 * Handles file uploads using Multer and Cloudinary.
 * Used for product images and user avatars.
 */

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==========================================
// MULTER STORAGE CONFIGURATION
// ==========================================

// Storage in memory (for direct upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter - Accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

// Multer upload configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// ==========================================
// CLOUDINARY UPLOAD FUNCTION
// ==========================================

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadToCloudinary = (fileBuffer, folder = 'chocair-fresh') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public ID of the image
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary image URL
 * @returns {String} - Public ID
 */
export const extractPublicId = (url) => {
  if (!url) return null;
  
  const parts = url.split('/');
  const fileWithExt = parts[parts.length - 1];
  const publicId = fileWithExt.split('.')[0];
  
  return `${parts[parts.length - 2]}/${publicId}`;
};

export default { upload, uploadToCloudinary, deleteFromCloudinary, extractPublicId };
