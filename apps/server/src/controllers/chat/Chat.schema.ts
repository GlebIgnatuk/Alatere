import { z } from 'zod'

/**
 * Create Chat
 */

export const CreatePrivateChatSchema = z.object({
  type: z.literal('private'),
  peerId: z.string(),
})

export const CreateChatSchema = z.discriminatedUnion('type', [CreatePrivateChatSchema])

export const ChatSearchSchema = z.object({
  page: z.coerce.number().min(0),
  limit: z.coerce.number().min(1),
})

/**
 * Delete Chat
 */

export const DeleteChatSchema = z.object({
  chatId: z.string(),
})

/**
 * Create Chat Message
 */

export const CreateChatMessageParamsSchema = z.object({
  chatId: z.string(),
})

const CreateChatMessageBaseSchema = z.object({
  repliedToMessageId: z.string().optional().nullable(),
})

export const CreateTextChatMessageSchema = CreateChatMessageBaseSchema.extend({
  type: z.literal('text'),
  text: z.string(),
})

export const CreateChatMessageSchema = z.discriminatedUnion('type', [CreateTextChatMessageSchema])

/**
 * Search Chat Messages
 */

export const SearchChatMessagesSchema = z.object({
  chatId: z.string(),
})

export const ChatMessageSearchSchema = z.object({
  text: z.string().optional(),
  beforeTimestamp: z.coerce.date().optional(),
  afterTimestamp: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
})

/**
 * Edit Chat Message
 */

export const EditChatMessageParamsSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
})

const EditChatMessageBaseSchema = z.object({})

export const EditTextChatMessageSchema = EditChatMessageBaseSchema.extend({
  type: z.literal('text'),
  text: z.string(),
})

export const EditChatMessageSchema = z.discriminatedUnion('type', [EditTextChatMessageSchema])

/**
 * Delete Chat Message
 */

export const DeleteChatMessageParamsSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
})

/**
 * Get Authorized Chat Member
 */

export const GetAuthorizedChatMemberSchema = z.object({
  chatId: z.string(),
})

/**
 * Restore Chat Member Encryption Key
 */

export const RestoreChatMemberEncryptionKeyParamsSchema = z.object({
  chatId: z.string(),
  memberId: z.string(),
})

export const RestoreChatMemberEncryptionKeyBodySchema = z.object({
  encryptionKey: z.string(),
})
