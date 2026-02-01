import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { fileTypeFromFile } from "file-type";

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
try {
  await fs.mkdir(uploadsDir, { recursive: true });
} catch (error) {
  // Directory already exists
}

// Configure secure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `pengaduan-${uniqueSuffix}${ext}`);
  }
});

// Enhanced file filter with security checks
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

    cb(null, true);
  } catch (error) {
    cb(new Error('Error validasi file'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit (increased from 2MB)
    files: 1 // Max 1 file per request
  },
  fileFilter
});

// POST /api/uploads - Upload a file dengan security verification
router.post("/", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Additional security: Verify actual file type using magic numbers
    const filePath = req.file.path;
    const type = await fileTypeFromFile(filePath);
    
    if (!type || !type.mime.startsWith('image/')) {
      // Hapus file jika tidak valid
      await fs.unlink(filePath).catch(() => {});
      return res.status(400).json({ 
        message: "File tidak valid. Hanya image yang diperbolehkan" 
      });
    }

    // Return the file URL that can be accessed via /uploads/filename
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({ 
      message: "File uploaded successfully",
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Cleanup file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ message: "Failed to upload file" });
  }
});

// GET /api/uploads/:filename - Serve uploaded files dengan security checks
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 1. Validasi filename untuk path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(403).json({ error: 'Filename tidak valid' });
    }

    // 2. Validasi extension
    const ext = path.extname(filename).toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (!allowedExt.includes(ext)) {
      return res.status(403).json({ error: 'Tipe file tidak diizinkan' });
    }

    // 3. Cek apakah file ada
    const filePath = path.join(uploadsDir, filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File tidak ditemukan' });
    }

    // 4. Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 hari

    // 5. Kirim file
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
