import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

/**
 * Call OpenAI API with standardized request format
 */
export async function convertAndCallClaude(request: OpenAIRequest): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: request.model || 'gpt-4o-mini',
    messages: request.messages as any,
    max_tokens: request.max_tokens || 2000,
    temperature: request.temperature || 0.7,
    response_format: request.response_format as any,
  });

  const responseContent = completion.choices[0]?.message?.content;
  
  if (!responseContent) {
    throw new Error('No response from OpenAI service');
  }

  return responseContent;
}

/**
 * Extract JSON from AI response (handles cases where JSON is wrapped in text)
 */
export function extractJSON(response: string): any {
  try {
    // Try parsing as direct JSON first
    return JSON.parse(response);
  } catch {
    // If that fails, look for JSON within the text
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }
    return JSON.parse(jsonMatch[0]);
  }
}