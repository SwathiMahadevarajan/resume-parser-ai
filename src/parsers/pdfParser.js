import { createRequire } from 'module';
import fs from 'fs/promises';
import { ExtractionError } from '../utils/errors.js';

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');

/**
 * Method 1: Try pdf2json first (fast)
 */
async function extractWithPDF2JSON(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error(`pdf2json failed: ${errData.parserError}`));
    });
    
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let text = '';
        if (pdfData.Pages) {
          pdfData.Pages.forEach(page => {
            if (page.Texts) {
              page.Texts.forEach(textItem => {
                if (textItem.R) {
                  textItem.R.forEach(run => {
                    const decoded = decodeURIComponent(run.T);
                    text += decoded + ' ';
                  });
                }
              });
            }
            text += '\n';
          });
        }
        resolve(text.trim());
      } catch (error) {
        reject(new Error(`pdf2json text extraction failed: ${error.message}`));
      }
    });
    
    pdfParser.loadPDF(filePath);
  });
}

/**
 * Method 2: Fallback - try pdf.js-extract (more robust)
 */
async function extractWithPDFJSExtract(filePath) {
  try {
    const PDFExtract = (await import('pdf.js-extract')).default;
    const pdfExtract = new PDFExtract();
    const options = {};
    
    const data = await pdfExtract.extract(filePath, options);
    
    let text = '';
    data.pages.forEach(page => {
      page.content.forEach(item => {
        if (item.str) {
          text += item.str + ' ';
        }
      });
      text += '\n';
    });
    
    return text.trim();
  } catch (error) {
    throw new Error(`pdf.js-extract failed: ${error.message}`);
  }
}

/**
 * Method 3: Final fallback - raw text extraction
 */
async function extractRawText(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString('utf-8', 0, buffer.length);
    
    // Extract text between stream markers (basic PDF text extraction)
    const textMatches = text.match(/\(([^)]+)\)/g);
    
    if (textMatches && textMatches.length > 0) {
      return textMatches
        .map(match => match.replace(/[()]/g, ''))
        .join(' ')
        .trim();
    }
    
    throw new Error('No text found in raw extraction');
  } catch (error) {
    throw new Error(`Raw extraction failed: ${error.message}`);
  }
}

/**
 * Extract text from PDF with multiple fallback methods
 */
export async function extractFromPDF(filePath) {
  const methods = [
    { name: 'pdf2json', fn: extractWithPDF2JSON },
    { name: 'pdf.js-extract', fn: extractWithPDFJSExtract },
    { name: 'raw extraction', fn: extractRawText },
  ];
  
  let lastError = null;
  
  for (const method of methods) {
    try {
      console.log(`   Trying ${method.name}...`);
      const text = await method.fn(filePath);
      
      if (text && text.trim().length > 50) { // At least 50 chars to be valid
        console.log(`   ✓ Extracted with ${method.name}: ${text.length} characters`);
        return text;
      } else if (text && text.trim().length > 0) {
        console.log(`   ⚠️  ${method.name} extracted only ${text.length} characters, trying next method...`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${method.name} failed: ${error.message}`);
      lastError = error;
    }
  }
  
  throw new ExtractionError(
    'PDF file appears to be empty, corrupted, or contains no extractable text',
    { 
      filePath,
      lastError: lastError?.message,
      suggestion: 'Try converting the PDF to a text-based format, or ensure it is not a scanned image. You can also try saving it from a different PDF viewer.'
    }
  );
}
