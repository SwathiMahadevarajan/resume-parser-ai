export function createExtractionPrompt(resumeText) {
  return `Extract information from this resume and return ONLY a valid JSON object. No markdown, no explanations, just the JSON.

Resume text:
"""
${resumeText}
"""

Return this exact JSON structure (use null for missing fields):

{
  "personal": {
    "fullName": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string or null",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string or null",
      "endDate": "string or null",
      "current": true or false,
      "description": "string or null",
      "location": "string or null"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string or null",
      "field": "string or null",
      "graduationDate": "string or null",
      "gpa": "string or null"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

IMPORTANT:
- Return ONLY the JSON object, nothing else
- No markdown formatting, no \`\`\`json wrapper
- Use null for any missing information
- Extract ALL work experiences and education entries
- List ALL skills mentioned`;
}
