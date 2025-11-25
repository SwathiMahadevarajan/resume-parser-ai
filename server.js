import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseResume } from './src/index.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
try {
  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory ready');
} catch (error) {
  console.error('❌ Failed to create uploads directory:', error.message);
}

// Configure multer with file extension preservation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'resume-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.mimetype === 'text/plain';
    
    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  }
});

// IMPORTANT: Serve static files BEFORE other routes
app.use(express.static('public'));

// Parse resume endpoint
app.post('/api/parse', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { 
        type: 'FILE_ERROR',
        message: 'No file uploaded' 
      }
    });
  }

  console.log('\n📁 Received file:', req.file.originalname);
  console.log('   Saved as:', req.file.filename);

  try {
    const result = await parseResume(req.file.path);
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    console.log('✅ Parse successful!\n');
    res.json(result);
  } catch (error) {
    console.error('❌ Parse failed:', error.message);
    
    // Clean up file on error
    try {
      await fs.unlink(req.file.path);
    } catch (e) {}
    
    res.status(500).json({
      success: false,
      error: {
        type: error.type || 'SERVER_ERROR',
        message: error.message || 'Failed to parse resume'
      }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Resume Parser API is running' });
});

// Catch-all route for SPA (serves index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (only for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('\n🚀 Resume Parser Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

// Export for Vercel
export default app;
