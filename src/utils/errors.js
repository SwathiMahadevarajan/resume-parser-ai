/**
 * Custom error classes for better error handling
 */

export class ResumeParserError extends Error {
  constructor(message, type, details = {}) {
    super(message);
    this.name = 'ResumeParserError';
    this.type = type;
    this.details = details;
  }
}

export class FileError extends ResumeParserError {
  constructor(message, details = {}) {
    super(message, 'FILE_ERROR', details);
    this.name = 'FileError';
  }
}

export class ExtractionError extends ResumeParserError {
  constructor(message, details = {}) {
    super(message, 'EXTRACTION_ERROR', details);
    this.name = 'ExtractionError';
  }
}

export class LLMError extends ResumeParserError {
  constructor(message, details = {}) {
    super(message, 'LLM_ERROR', details);
    this.name = 'LLMError';
  }
}

export class ValidationError extends ResumeParserError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConfigError extends ResumeParserError {
  constructor(message, details = {}) {
    super(message, 'CONFIG_ERROR', details);
    this.name = 'ConfigError';
  }
}

/**
 * Format error for user-friendly output
 */
export function formatError(error) {
  if (error instanceof ResumeParserError) {
    return {
      success: false,
      error: {
        type: error.type,
        message: error.message,
        details: error.details,
      },
    };
  }
  
  return {
    success: false,
    error: {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: {},
    },
  };
}
