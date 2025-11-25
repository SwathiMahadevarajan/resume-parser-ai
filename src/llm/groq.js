import { createExtractionPrompt } from './prompt.js';
import { LLMError, ConfigError } from '../utils/errors.js';

export async function parseWithGroq(resumeText, apiToken, model = 'llama-3.1-8b-instant') {
  if (!apiToken) {
    throw new ConfigError(
      'Groq API key is required',
      { suggestion: 'Get a free API key at https://console.groq.com/' }
    );
  }
  
  if (!resumeText || resumeText.trim().length === 0) {
    throw new LLMError(
      'Resume text is empty',
      { suggestion: 'Ensure the file contains extractable text' }
    );
  }
  
  const prompt = createExtractionPrompt(resumeText);
  
  console.log(`   Using Groq model: ${model}`);
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Return ONLY valid JSON, no markdown, no explanations.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" }, // Force JSON mode
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      if (response.status === 401) {
        throw new ConfigError(
          'Invalid Groq API key',
          { statusCode: 401, suggestion: 'Verify your API key at https://console.groq.com/' }
        );
      }
      
      if (response.status === 429) {
        throw new LLMError(
          'Rate limit exceeded',
          { statusCode: 429, suggestion: 'Wait a moment and try again' }
        );
      }
      
      throw new LLMError(
        `Groq API error: ${errorData.error?.message || errorText}`,
        { statusCode: response.status, response: errorData }
      );
    }
    
    const result = await response.json();
    
    if (!result.choices || !result.choices[0]) {
      throw new LLMError('Invalid response from Groq API', { response: result });
    }
    
    let text = result.choices[0].message.content;
    console.log(`   Received ${text.length} characters from Groq`);
    
    // Clean up the response
    text = text.trim();
    
    // Remove markdown code blocks if present
    text = text.replace(/``````\s*/g, '');
    
    // Remove special tokens
    text = text.replace(/<\|[^|]+\|>/g, '');
    
    // Try to parse directly first
    try {
      const parsed = JSON.parse(text);
      console.log('   ✅ Successfully parsed resume with Groq');
      return parsed;
    } catch (directParseError) {
      // If direct parse fails, try to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.log('   Response preview:', text.substring(0, 500));
        throw new LLMError(
          'Could not extract JSON from Groq response',
          { responsePreview: text.substring(0, 500) }
        );
      }
      
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('   ✅ Successfully parsed resume with Groq');
        return parsed;
      } catch (parseError) {
        throw new LLMError(
          'Failed to parse JSON from Groq response',
          { jsonString: jsonMatch[0].substring(0, 500), originalError: parseError.message }
        );
      }
    }
    
  } catch (error) {
    if (error instanceof LLMError || error instanceof ConfigError) {
      throw error;
    }
    
    throw new LLMError(`Groq parsing failed: ${error.message}`, { originalError: error.message });
  }
}
