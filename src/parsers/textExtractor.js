import { extractFromPDF } from './pdfParser.js';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';
import { FileError, ExtractionError } from '../utils/errors.js';
import { cleanExtractedText, validateResumeText, truncateForLLM } from '../utils/textCleaner.js';

/**
 * Extract text from DOCX file
 */
export async function extractFromDOCX(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new ExtractionError(
        'DOCX file appears to be empty or contains no extractable text',
        { filePath }
      );
    }
    
    return result.value;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    
    throw new ExtractionError(
      'Failed to parse DOCX file',
      { 
        filePath,
        originalError: error.message,
        suggestion: 'Ensure the file is a valid DOCX document'
      }
    );
  }
}

/**
 * Extract text from TXT file
 */
export async function extractFromTXT(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    
    if (!text.trim()) {
      throw new ExtractionError(
        'TXT file is empty',
        { filePath }
      );
    }
    
    return text;
  } catch (error) {
    if (error instanceof ExtractionError) throw error;
    
    throw new ExtractionError(
      'Failed to read TXT file',
      { 
        filePath,
        originalError: error.message
      }
    );
  }
}

/**
 * Auto-detect file type and extract text
 */
export async function extractText(filePath) {
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new FileError(
      `File not found: ${filePath}`,
      { 
        filePath,
        suggestion: 'Verify the file path is correct'
      }
    );
  }
  
  // Check file size
  try {
    const stats = await fs.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 10) {
      throw new FileError(
        `File too large: ${fileSizeMB.toFixed(2)}MB (max 10MB)`,
        { 
          filePath,
          size: stats.size,
          suggestion: 'Try compressing the file or splitting into smaller files'
        }
      );
    }
    
    if (stats.size === 0) {
      throw new FileError(
        'File is empty',
        { filePath }
      );
    }
  } catch (error) {
    if (error instanceof FileError) throw error;
    throw new FileError(
      'Failed to read file information',
      { filePath, originalError: error.message }
    );
  }
  
  const ext = path.extname(filePath).toLowerCase();
  
  console.log(`   File type: ${ext}`);
  
  let rawText = '';
  
  switch (ext) {
    case '.pdf':
      rawText = await extractFromPDF(filePath);
      break;
    case '.docx':
      rawText = await extractFromDOCX(filePath);
      break;
    case '.txt':
      rawText = await extractFromTXT(filePath);
      break;
    default:
      throw new FileError(
        `Unsupported file format: ${ext}`,
        { 
          filePath,
          extension: ext,
          supportedFormats: ['.pdf', '.docx', '.txt'],
          suggestion: 'Convert your file to PDF, DOCX, or TXT format'
        }
      );
  }
  
  // Clean the extracted text
  console.log(`   Cleaning extracted text (${rawText.length} chars)...`);
  const cleanedText = cleanExtractedText(rawText);
  console.log(`   Cleaned to ${cleanedText.length} chars`);
  
  // Validate it looks like a resume
  const validation = validateResumeText(cleanedText);
  if (!validation.valid) {
    throw new ExtractionError(
      `Extracted text does not appear to be a resume: ${validation.reason}`,
      { filePath }
    );
  }
  
  // Truncate if too long
  const finalText = truncateForLLM(cleanedText, 8000);
  
  return finalText;
}
