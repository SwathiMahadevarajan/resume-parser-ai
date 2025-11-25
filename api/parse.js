import multer from 'multer';
import { parseResume } from '../src/index.js';
import fs from 'fs/promises';
import path from 'path';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: { message: 'Method not allowed' } 
    });
  }

  try {
    await runMiddleware(req, res, upload.single('resume'));

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { type: 'FILE_ERROR', message: 'No file uploaded' }
      });
    }

    const ext = path.extname(req.file.originalname);
    const tempPath = `/tmp/resume-${Date.now()}${ext}`;
    await fs.writeFile(tempPath, req.file.buffer);

    const result = await parseResume(tempPath, {
      apiToken: process.env.GROQ_API_KEY
    });

    await fs.unlink(tempPath).catch(() => {});

    return res.status(200).json(result);

  } catch (error) {
    console.error('Parse error:', error);
    return res.status(500).json({
      success: false,
      error: {
        type: error.type || 'SERVER_ERROR',
        message: error.message || 'Failed to parse resume'
      }
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
