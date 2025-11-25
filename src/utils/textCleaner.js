/**
 * Clean extracted text from PDFs to remove garbage characters and metadata
 */
export function cleanExtractedText(text) {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove special tokens and metadata
  cleaned = cleaned.replace(/<\|[^|]+\|>/g, ''); // Remove <|special_token|>
  cleaned = cleaned.replace(/�/g, ''); // Remove replacement characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ''); // Remove control characters
  
  // Remove PDF metadata patterns (but be less aggressive)
  cleaned = cleaned.replace(/\/Type\s*\/[A-Za-z]+/g, ''); // Remove type declarations
  
  // Remove excessive whitespace but preserve some structure
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n'); // Max 3 newlines
  
  return cleaned.trim();
}

/**
 * Validate that extracted text looks like a resume
 */
export function validateResumeText(text) {
  if (!text || text.length < 100) {
    return { valid: false, reason: 'Text too short' };
  }
  
  const lowerText = text.toLowerCase();
  
  // Check for email pattern
  const hasEmail = /@[\w.-]+\.\w+/.test(text);
  
  // Check for phone pattern
  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{10}/.test(text);
  
  // Check for common resume sections (more lenient)
  const resumeSections = [
    'experience', 'education', 'skill', 'work', 'employment',
    'degree', 'university', 'college', 'bachelor', 'master',
    'developer', 'engineer', 'manager', 'analyst', 'designer',
    'project', 'responsibility', 'achievement'
  ];
  
  const foundSections = resumeSections.filter(section => lowerText.includes(section));
  
  // Very lenient: just need email OR phone OR 2+ resume keywords
  if (hasEmail || hasPhone || foundSections.length >= 2) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    reason: `Missing typical resume indicators. Found: ${foundSections.join(', ') || 'none'}. Has email: ${hasEmail}, Has phone: ${hasPhone}`,
    preview: text.substring(0, 500)
  };
}

/**
 * Truncate text to reasonable length for LLM processing
 */
export function truncateForLLM(text, maxChars = 8000) {
  if (text.length <= maxChars) return text;
  
  console.log(`   Text truncated from ${text.length} to ${maxChars} characters`);
  
  // Try to truncate at a sentence or paragraph boundary
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxChars * 0.8) {
    return truncated.substring(0, cutPoint + 1);
  }
  
  return truncated;
}
