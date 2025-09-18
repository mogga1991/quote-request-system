import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
 * Convert OpenAI-style request to Claude and get response
 */
export async function convertAndCallClaude(request: OpenAIRequest): Promise<string> {
  // Combine system and user messages for Claude
  let combinedPrompt = '';
  
  for (const message of request.messages) {
    if (message.role === 'system') {
      combinedPrompt += `${message.content}\n\n`;
    } else if (message.role === 'user') {
      combinedPrompt += message.content;
    }
  }

  // Add JSON instruction if needed
  if (request.response_format?.type === 'json_object') {
    combinedPrompt += '\n\nPlease respond with valid JSON only.';
  }

  const completion = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: request.max_tokens || 2000,
    temperature: request.temperature || 0.7,
    messages: [
      {
        role: 'user',
        content: combinedPrompt
      }
    ]
  });

  const responseContent = completion.content[0]?.type === 'text' ? completion.content[0].text : null;
  
  if (!responseContent) {
    throw new Error('No response from Claude AI service');
  }

  return responseContent;
}

/**
 * Extract JSON from Claude's response (Claude sometimes adds explanatory text)
 */
export function extractJSON(response: string): any {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }
  return JSON.parse(jsonMatch[0]);
}