import dotenv from 'dotenv';
import { extractText } from './parsers/textExtractor.js';
import { parseWithGroq } from './llm/groq.js';
import { validateResumeData } from './schemas/resumeSchema.js';
import { formatError, ConfigError } from './utils/errors.js';

dotenv.config();

/**
 * Parse resume from file
 * @param {string} filePath - Path to resume file (PDF, DOCX, or TXT)
 * @param {object} options - Configuration options
 * @param {string} options.apiToken - Groq API token (optional if in .env)
 * @param {string} options.model - Groq model to use (optional)
 * @returns {Promise<object>} Parsed resume data
 */
export async function parseResume(filePath, options = {}) {
  try {
    // Get API token
    const apiToken = options.apiToken || process.env.GROQ_API_KEY;
    
    if (!apiToken) {
      throw new ConfigError(
        'Groq API key is required',
        { 
          suggestion: 'Set GROQ_API_KEY in .env file or pass via options.apiToken. Get free key at https://console.groq.com/'
        }
      );
    }
    
    const model = options.model || process.env.LLM_MODEL || 'llama-3.1-8b-instant';
    
    // Step 1: Extract text from file
    console.log('📄 Extracting text from resume...');
    const resumeText = await extractText(filePath);
    
    // Step 2: Parse with Groq
    console.log('🤖 Parsing resume with Groq...');
    const parsedData = await parseWithGroq(resumeText, apiToken, model);
    
    // Step 3: Validate data
    console.log('✅ Validating extracted data...');
    const validation = validateResumeData(parsedData);
    
    if (!validation.success) {
      console.warn('⚠️  Validation warnings:', validation.error);
    }
    
    return {
      success: true,
      data: parsedData,
      rawText: resumeText,
      model: model,
    };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return formatError(error);
  }
}

export { extractText } from './parsers/textExtractor.js';
export { validateResumeData, ResumeSchema } from './schemas/resumeSchema.js';
export * from './utils/errors.js';
