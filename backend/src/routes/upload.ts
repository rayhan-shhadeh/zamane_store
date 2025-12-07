import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// Helper to upload buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `zamane-store/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

// ===================
// UPLOAD PRODUCT IMAGE (Admin)
// ===================
router.post(
  '/product-image',
  authenticate,
  isAdmin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const result = await uploadToCloudinary(req.file.buffer, 'products');

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===================
// UPLOAD MULTIPLE PRODUCT IMAGES (Admin)
// ===================
router.post(
  '/product-images',
  authenticate,
  isAdmin,
  upload.array('images', 10),
  async (req, res, next) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images provided' });
      }

      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file.buffer, 'products')
      );

      const results = await Promise.all(uploadPromises);

      res.json({
        images: results.map((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===================
// UPLOAD CATEGORY IMAGE (Admin)
// ===================
router.post(
  '/category-image',
  authenticate,
  isAdmin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const result = await uploadToCloudinary(req.file.buffer, 'categories');

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===================
// UPLOAD USER AVATAR
// ===================
router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const result = await cloudinary.uploader.upload_stream(
        {
          folder: 'zamane-store/avatars',
          resource_type: 'image',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        }
      );

      // For now, use base64 upload since we're using buffer
      const base64 = req.file.buffer.toString('base64');
      const dataUri = `data:${req.file.mimetype};base64,${base64}`;
      
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: 'zamane-store/avatars',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        ],
      });

      res.json({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ===================
// DELETE IMAGE (Admin)
// ===================
router.delete('/image/:publicId', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { publicId } = req.params;
    
    await cloudinary.uploader.destroy(publicId);
    
    res.json({ message: 'Image deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
