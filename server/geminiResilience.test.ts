import { describe, it, expect, vi } from 'vitest';
import { 
  generateGroundedExcerptFallback, 
  generateContentWithResilience,
  GeminiCapacityExceededError
} from './geminiResilience';
import { GoogleGenAI } from '@google/genai';

describe('Gemini Resilience & Grounded Fallback Engine', () => {
  it('generates grounded excerpts and citations from retrieved chunks during high demand', () => {
    const query = 'What happens if I terminate the agreement early?';
    const documentTitle = 'Master Services Agreement';
    const sampleChunks = [
      'Section 9.2: Early Termination Penalties. Either party may terminate with 30 days notice. Early termination requires liquidated damages of $5,000.',
      'Section 4.1: Standard Invoicing and billing terms. Invoices must be settled within 14 calendar days.',
    ];

    const result = generateGroundedExcerptFallback(query, documentTitle, sampleChunks);

    expect(result.answer).toContain('Master Services Agreement');
    expect(result.answer).toContain('Section 9.2');
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.citations[0].quote).toContain('Early Termination');
    expect(result.disclaimer).toContain('LegalLens');
  });

  it('cascades to fallback model when primary model returns 503 UNAVAILABLE', async () => {
    const mockAi = {
      models: {
        generateContent: vi.fn().mockImplementation(async ({ model }) => {
          if (model === 'gemini-3.8-flash') {
            const err: any = new Error(
              JSON.stringify({
                error: {
                  code: 503,
                  message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.',
                  status: 'UNAVAILABLE',
                },
              })
            );
            throw err;
          }
          if (model === 'gemini-flash-latest') {
            return {
              text: JSON.stringify({ answer: 'Response from fallback model' }),
            };
          }
          throw new Error('Unexpected model called');
        }),
      },
    } as unknown as GoogleGenAI;

    const res = await generateContentWithResilience(
      mockAi,
      'Test Prompt',
      { temperature: 0.1 },
      'gemini-3.8-flash'
    );

    expect(res.modelUsed).toBe('gemini-flash-latest');
    expect(res.text).toContain('Response from fallback model');
  });

  it('throws GeminiCapacityExceededError if all candidate models are unavailable', async () => {
    const mockAi = {
      models: {
        generateContent: vi.fn().mockRejectedValue(
          new Error('503 Service Unavailable: High demand')
        ),
      },
    } as unknown as GoogleGenAI;

    await expect(
      generateContentWithResilience(mockAi, 'Test Prompt', {}, 'gemini-3.8-flash')
    ).rejects.toThrow(GeminiCapacityExceededError);
  });
});
