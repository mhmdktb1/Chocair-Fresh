import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt) ? rawExt : '.png';
    const safeBase = `image-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBase}${safeExt}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
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

// Authenticated users can upload images (e.g., profile avatars or admin product images)
router.post('/', protect, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
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

    res.send(`/${req.file.path.replace(/\\/g, '/')}`);
  });
});

export default router;
