import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';

// Konfigurasi storage dengan filename acak
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    // Generate random filename untuk security
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Validasi file filter
const fileFilter = async (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // 1. Validasi extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (!allowedExt.includes(ext)) {
      return cb(new Error('Hanya file .jpg, .jpeg, .png, .webp yang diperbolehkan'));
    }

    // 2. Validasi MIME type
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.mimetype)) {
      return cb(new Error('Tipe file tidak valid. Hanya image yang diperbolehkan'));
    }

    // 3. Verifikasi tipe file sebenarnya (magic number)
    const tempPath = file.path;
    const type = await fileTypeFromFile(tempPath);
    
    if (!type || !type.mime.startsWith('image/')) {
      // Hapus file jika tidak valid
      await fs.unlink(tempPath).catch(() => {});
      return cb(new Error('File tidak valid atau bukan image'));
    }

    cb(null, true);
  } catch (error) {
    cb(new Error('Error validasi file'));
  }
};

// Export secure upload middleware
export const secureUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1 // Max 1 file per request
  },
  fileFilter
});

// Middleware untuk verifikasi file setelah upload
export const verifyUploadedFile = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return next();
  }

  try {
    const filePath = req.file.path;
    const type = await fileTypeFromFile(filePath);
    
    if (!type || !type.mime.startsWith('image/')) {
      // Hapus file jika tidak valid
      await fs.unlink(filePath).catch(() => {});
      return res.status(400).json({ 
        error: 'File tidak valid. Hanya image yang diperbolehkan' 
      });
    }

    next();
  } catch (error) {
    // Hapus file jika terjadi error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Error validasi file' });
  }
};

// Helper untuk cleanup file lama (opsional)
export const cleanupOldFiles = async (maxAge: number = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const files = await fs.readdir('./uploads');
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join('./uploads', file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error cleanup old files:', error);
  }
};
