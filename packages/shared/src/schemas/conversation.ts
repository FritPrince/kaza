import { z } from 'zod';
import { idSchema } from './common';
import { structuredPromptSchema } from './generation';

export const messageRoleSchema = z.enum(['user', 'assistant']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

/**
 * Quick-reply button rendered by the mobile UI. The conversational agent
 * returns these as structured output so the user answers by tapping (§B2).
 */
export const quickReplySchema = z.object({
  label: z.string().max(40),
  value: z.string().max(200),
});
export type QuickReply = z.infer<typeof quickReplySchema>;

export const chatMessageSchema = z.object({
  id: idSchema,
  role: messageRoleSchema,
  content: z.string(),
  quickReplies: z.array(quickReplySchema).nullable(),
  createdAt: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Agent turn: either the next question (with quick replies), or the final
 * structured prompt when the interview is complete (§B2 → §B3).
 */
export const agentTurnSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('question'),
    message: z.string(),
    quickReplies: z.array(quickReplySchema).max(6),
  }),
  z.object({
    kind: z.literal('ready-to-generate'),
    message: z.string(),
    structuredPrompt: structuredPromptSchema,
  }),
]);
export type AgentTurn = z.infer<typeof agentTurnSchema>;
