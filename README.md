# Resume Parser AI 🤖

AI-powered resume parser using Groq's free LLM API to extract structured data from resumes.

## Features

- 📄 Supports PDF, DOCX, and TXT formats
- 🆓 Uses free Groq API (fast & reliable)
- 🎯 Extracts personal info, experience, education, and skills
- ✅ Schema validation with Zod
- 🚀 Easy to integrate as npm package or REST API
- 💪 Comprehensive error handling

## Installation

\`\`\`bash
npm install resume-parser-ai
\`\`\`

## Setup

1. Get a free Groq API key: https://console.groq.com/
2. Create a `.env` file:

\`\`\`bash
GROQ_API_KEY=gsk_your_key_here
\`\`\`

## Usage

\`\`\`javascript
import { parseResume } from 'resume-parser-ai';

const result = await parseResume('./resume.pdf');

if (result.success) {
  console.log(result.data);
  // {
  //   personal: { fullName, email, phone, ... },
  //   experience: [...],
  //   education: [...],
  //   skills: [...]
  // }
}
\`\`\`

## Supported Models

- `llama-3.1-8b-instant` (default) - Fast, good for most resumes
- `llama-3.3-70b-versatile` - More capable, better understanding
- `mixtral-8x7b-32768` - Long context window

## License

MIT
