import { Request, Response } from 'express'
import {
  ChatMessageSearchSchema,
  ChatSearchSchema,
  CreateChatMessageParamsSchema,
  CreateChatMessageSchema,
  CreateChatSchema,
  DeleteChatMessageParamsSchema,
  DeleteChatSchema,
  EditChatMessageParamsSchema,
  EditChatMessageSchema,
  GetAuthorizedChatMemberSchema,
  RestoreChatMemberEncryptionKeyBodySchema,
  RestoreChatMemberEncryptionKeyParamsSchema,
  SearchChatMessagesSchema,
} from './Chat.schema'
import { createOkResponse, createZodErrorResponse } from '@/utils/http/response'
import { ChatService } from '@/services/internal/Chat.service'
import { ChatMessage } from '@/entities/ChatMessage'

export class ChatController {
  static createChat = async (req: Request, res: Response) => {
    const body = CreateChatSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    const chat = await ChatService.createPrivateChat({
      // @todo jwt
      ownerId: body.data.ownerId,
      peerId: body.data.peerId,
    })

    return res.status(200).json(createOkResponse(chat))
  }

  static searchChats = async (req: Request, res: Response) => {
    const query = ChatSearchSchema.safeParse(req.query)
    if (!query.success) {
      return res.status(422).json(createZodErrorResponse(query.error.issues))
    }

    const chats = await ChatService.searchChats({
      // @todo jwt
      userId: query.data.userId,
      page: Math.max(query.data.page, 1) - 1,
      limit: query.data.limit,
    })

    return res.status(200).json(createOkResponse(chats))
  }

  static deleteChat = async (req: Request, res: Response) => {
    const params = DeleteChatSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.deletePrivateChat({
      // @todo jwt
      chatId: params.data.chatId,
      ownerOrPeerId: req.query.ownerId as string,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static createMessage = async (req: Request, res: Response) => {
    const params = CreateChatMessageParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const body = CreateChatMessageSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    let message: ChatMessage

    switch (body.data.type) {
      case 'text':
        {
          message = await ChatService.createMessage({
            // @todo jwt
            type: body.data.type,
            chatId: params.data.chatId,
            senderId: body.data.senderId,
            text: body.data.text,
            repliedToMessageId: body.data.repliedToMessageId,
          })
        }
        break

      default: {
        throw new Error('unreachable')
      }
    }

    return res.status(200).json(createOkResponse(message))
  }

  static searchMessages = async (req: Request, res: Response) => {
    const params = SearchChatMessagesSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const query = ChatMessageSearchSchema.safeParse(req.query)
    if (!query.success) {
      return res.status(422).json(createZodErrorResponse(query.error.issues))
    }

    const messages = await ChatService.searchChatMessages({
      chatId: params.data.chatId,
      // @todo jwt
      userId: query.data.userId,
      text: query.data.text,
      beforeTimestamp: query.data.beforeTimestamp,
      afterTimestamp: query.data.afterTimestamp,
      limit: query.data.limit,
    })

    return res.status(200).json(createOkResponse(messages))
  }

  static editMessage = async (req: Request, res: Response) => {
    const params = EditChatMessageParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const body = EditChatMessageSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    let message: ChatMessage

    switch (body.data.type) {
      case 'text':
        {
          message = await ChatService.editMessage({
            // @todo jwt
            type: body.data.type,
            chatId: params.data.chatId,
            messageId: params.data.messageId,
            senderId: body.data.senderId,
            text: body.data.text,
          })
        }
        break

      default: {
        throw new Error('unreachable')
      }
    }

    return res.status(200).json(createOkResponse(message))
  }

  static deleteMessage = async (req: Request, res: Response) => {
    const params = DeleteChatMessageParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.deleteMessage({
      // @todo jwt
      chatId: params.data.chatId,
      messageId: params.data.messageId,
      senderId: req.query.senderId as string,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static getAuthorizedChatMember = async (req: Request, res: Response) => {
    const params = GetAuthorizedChatMemberSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const member = await ChatService.getChatMember({
      // @todo jwt
      chatId: params.data.chatId,
      userId: req.query.senderId as string,
      consumeEncryptionKey: true,
    })

    return res.status(200).json(createOkResponse(member))
  }

  static restoreChatMemberEncryptionKey = async (req: Request, res: Response) => {
    const params = RestoreChatMemberEncryptionKeyParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const body = RestoreChatMemberEncryptionKeyBodySchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    await ChatService.restoreChatMemberEncryptionKey({
      // @todo jwt
      chatId: params.data.chatId,
      userId: req.query.senderId as string,
      memberId: params.data.memberId,
      encryptionKey: body.data.encryptionKey,
    })

    return res.status(200).json(createOkResponse(null))
  }
}
