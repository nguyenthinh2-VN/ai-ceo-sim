// ============================================================
// openai-client.ts — OpenAI SDK implementation of LlmClient
// Server-only: reads OPENAI_API_KEY from environment.
// ============================================================

import OpenAI from 'openai';
import { LlmClient } from '../types';

export class OpenAiClient implements LlmClient {
  private client: OpenAI | null = null;
  private model: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    this.model = model || process.env.LLM_MODEL || 'gpt-4o-mini';
    const rawBaseUrl = baseUrl || process.env.OPENAI_BASE_URL;
    const baseURL = rawBaseUrl && rawBaseUrl.trim().length > 0 ? rawBaseUrl.trim() : undefined;

    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        ...(baseURL ? { baseURL } : {}),
      });
    }
  }

  async chat(systemPrompt: string, stateJson: string): Promise<string> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const res = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: stateJson },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return res.choices[0]?.message?.content ?? '';
  }
}
