import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Local fallback upload directory
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Supabase Storage Client Initialization
let rawSupabaseUrl = (process.env.SUPABASE_URL || '').trim();
// Automatically sanitize URL if user passed /rest/v1 or trailing slashes
if (rawSupabaseUrl) {
  rawSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}
const supabaseUrl = rawSupabaseUrl;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_KEY || '').trim();
const supabaseBucket = (process.env.SUPABASE_BUCKET || 'Fresh.img').trim();

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log(`✅ Supabase Storage initialized (${supabaseBucket}) at ${supabaseUrl}`);
  } catch (err) {
    console.warn('⚠️ Failed to initialize Supabase client:', err.message);
  }
}

// Use Memory Storage so buffers can be uploaded directly to Supabase Storage or written locally
const storage = multer.memoryStorage();

function checkFileType(file, cb) {
  const allowedMimeTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/jpg', 
    'image/heic', 
    'image/heif'
  ];
  const filetypes = /jpg|jpeg|png|webp|heic|heif/i;
  const rawExt = path.extname(file.originalname).toLowerCase().replace('.', '');
  const extValid = !rawExt || filetypes.test(rawExt);
  const mimetypeValid = !file.mimetype || file.mimetype.startsWith('image/') || allowedMimeTypes.includes(file.mimetype);

  if (mimetypeValid && extValid) {
    return cb(null, true);
  } else {
    cb(new Error('Images only (jpg, jpeg, png, webp)!'));
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

/**
 * Generate a safe unique filename with correct extension
 */
function generateFilename(file) {
  let rawExt = path.extname(file.originalname).toLowerCase();
  if (!rawExt && file.mimetype) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') rawExt = '.jpg';
    else if (file.mimetype === 'image/png') rawExt = '.png';
    else if (file.mimetype === 'image/webp') rawExt = '.webp';
  }
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt) ? rawExt : '.jpg';
  return `image-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
}

// Authenticated users can upload images (e.g., profile avatars or admin product images)
router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400);
          return next(new Error('File size exceeds the 5MB limit'));
        }
        res.status(400);
        return next(new Error(`Upload error: ${err.message}`));
      }
      res.status(400);
      return next(new Error(err.message || 'Invalid image file'));
    }

    if (!req.file) {
      res.status(400);
      return next(new Error('No image file uploaded'));
    }

    const filename = generateFilename(req.file);
    const mimeType = req.file.mimetype || 'image/jpeg';

    // 1. If Supabase is configured, upload to Supabase Storage for permanent cloud persistence
    if (supabase) {
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(supabaseBucket)
          .upload(filename, req.file.buffer, {
            contentType: mimeType,
            cacheControl: '31536000', // 1 year cache
            upsert: true,
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError.message);
          // If error is bucket not found, try to create bucket once or fallback
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from(supabaseBucket)
          .getPublicUrl(filename);

        if (publicUrlData && publicUrlData.publicUrl) {
          return res.send(publicUrlData.publicUrl);
        }
      } catch (cloudErr) {
        console.warn('⚠️ Cloud upload to Supabase failed, falling back to local storage:', cloudErr.message);
        // Fallback to local storage if cloud fails
      }
    }

    // 2. Fallback to local disk storage
    try {
      const localFilePath = path.join(uploadDir, filename);
      fs.writeFileSync(localFilePath, req.file.buffer);
      const relativeUrl = `/uploads/${filename}`;
      return res.send(relativeUrl);
    } catch (diskErr) {
      console.error('Disk save error:', diskErr);
      res.status(500);
      return next(new Error('Failed to save uploaded image'));
    }
  });
});

export default router;
