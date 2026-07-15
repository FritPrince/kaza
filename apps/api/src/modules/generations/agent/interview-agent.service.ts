import { Injectable } from '@nestjs/common';
import { agentTurnSchema, type AgentTurn } from '@kaza/shared';
import type { TasteProfile } from '@prisma/client';

export interface InterviewContext {
  roomType: string;
  constraints: string[];
  tasteProfile: TasteProfile | null;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const SYSTEM_PROMPT = `You are Kaza's interior design interviewer. You interview the user
like a professional decorator would: 3 to 6 short, adaptive questions about room usage,
style, palette, budget and constraints (§B2). Skip anything already answered by the taste
profile. Reply in the user's language (French by default). Always answer with JSON matching
the provided schema: either {"kind":"question",...} with up to 6 quick replies, or
{"kind":"ready-to-generate",...} with the final structured prompt once you have enough.`;

/**
 * Conversational agent backed by the Claude API with structured JSON output
 * driving the mobile UI — quick replies and generation parameters (§7.4).
 */
@Injectable()
export class InterviewAgentService {
  async nextTurn(context: InterviewContext): Promise<AgentTurn> {
    if (!process.env.ANTHROPIC_API_KEY) {
      // Development fallback: deterministic first question so the mobile flow is testable offline.
      return {
        kind: 'question',
        message: 'Quelle ambiance recherchez-vous pour cette pièce ?',
        quickReplies: [
          { label: 'Moderne & épuré', value: 'modern' },
          { label: 'Chaleureux & bohème', value: 'bohemian' },
          { label: 'Afro-contemporain', value: 'afro-contemporary' },
        ],
      };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: `${SYSTEM_PROMPT}\n\nRoom type: ${context.roomType}\nConstraints: ${context.constraints.join('; ') || 'none'}\nTaste profile: ${JSON.stringify(context.tasteProfile?.favoriteStyles ?? [])}`,
        messages: context.history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(`Claude API failed with status ${response.status}`);
    }
    const payload = (await response.json()) as { content: Array<{ type: string; text?: string }> };
    const text = payload.content.find((block) => block.type === 'text')?.text ?? '{}';
    return agentTurnSchema.parse(JSON.parse(text));
  }
}
