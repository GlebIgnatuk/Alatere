import { Request, Response } from 'express'
import {
  AddUserToGroupChatBodySchema,
  AddUserToGroupChatParamsSchema,
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
  KickChatMemberParamsSchema,
  LeaveGroupChatParamsSchema,
  ListChatMembersWithInvalidPublicKeySchema,
  ListGroupChatMembersParamsSchema,
  MarkMessagesAsReadBodySchema,
  MarkMessagesAsReadParamsSchema,
  ResetMyEncryptionKeyParamsSchema,
  RestoreChatMemberEncryptionKeyBodySchema,
  RestoreChatMemberEncryptionKeyParamsSchema,
  SearchChatMessagesSchema,
} from './Chat.schema'
import { createOkResponse, createZodErrorResponse } from '@/utils/http/response'
import { ChatService } from '@/services/internal/Chat.service'
import { ChatMessage } from '@/entities/ChatMessage'
import { mustGetAuthenticatedUser } from '@/middlewares/jwt'
import { Chat } from '@/entities/Chat'

export class ChatController {
  static createChat = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const body = CreateChatSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    let chat: Chat
    switch (body.data.type) {
      case 'private':
        {
          chat = await ChatService.createPrivateChat({
            ownerId: authenticatedUser.sub,
            peerId: body.data.peerId,
          })
        }
        break

      case 'group':
        {
          chat = await ChatService.createGroupChat({
            ownerId: authenticatedUser.sub,
            name: body.data.name,
            peerIds: body.data.peerIds,
          })
        }
        break

      default: {
        throw new Error('unreachable')
      }
    }

    return res.status(200).json(createOkResponse(chat))
  }

  static searchChats = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const query = ChatSearchSchema.safeParse(req.query)
    if (!query.success) {
      return res.status(422).json(createZodErrorResponse(query.error.issues))
    }

    const chats = await ChatService.searchChats({
      userId: authenticatedUser.sub,
      page: Math.max(query.data.page, 1) - 1,
      limit: query.data.limit,
    })

    return res.status(200).json(createOkResponse(chats))
  }

  static deleteChat = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = DeleteChatSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.deletePrivateChat({
      chatId: params.data.chatId,
      ownerOrPeerId: authenticatedUser.sub,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static createMessage = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

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
            type: body.data.type,
            chatId: params.data.chatId,
            senderId: authenticatedUser.sub,
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
    const authenticatedUser = mustGetAuthenticatedUser(res)

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
      userId: authenticatedUser.sub,
      text: query.data.text,
      beforeTimestamp: query.data.beforeTimestamp,
      afterTimestamp: query.data.afterTimestamp,
      limit: query.data.limit,
    })

    return res.status(200).json(createOkResponse(messages))
  }

  static editMessage = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

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
            type: body.data.type,
            chatId: params.data.chatId,
            messageId: params.data.messageId,
            senderId: authenticatedUser.sub,
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
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = DeleteChatMessageParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.deleteMessage({
      chatId: params.data.chatId,
      messageId: params.data.messageId,
      senderId: authenticatedUser.sub,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static getAuthorizedChatMember = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = GetAuthorizedChatMemberSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const member = await ChatService.getChatMember({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
      consumeEncryptionKey: true,
    })

    return res.status(200).json(createOkResponse(member))
  }

  static restoreChatMemberEncryptionKey = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = RestoreChatMemberEncryptionKeyParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const body = RestoreChatMemberEncryptionKeyBodySchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    await ChatService.restoreChatMemberEncryptionKey({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
      memberId: params.data.memberId,
      encryptionKey: body.data.encryptionKey,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static listChatMembersWithInvalidPublicKey = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = ListChatMembersWithInvalidPublicKeySchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const members = await ChatService.listChatMembersWithInvalidPublicKey({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
    })

    return res.status(200).json(createOkResponse(members))
  }

  static resetMyEncryptionKey = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = ResetMyEncryptionKeyParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.resetChatMemberEncryptionKey({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static kickGroupChatMember = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = KickChatMemberParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.kickGroupChatMember({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
      memberId: params.data.memberId,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static leaveFromGroupChat = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = LeaveGroupChatParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    await ChatService.leaveFromGroupChat({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static addUserToGroupChat = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = AddUserToGroupChatParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const body = AddUserToGroupChatBodySchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    await ChatService.addUserToGroupChat({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
      peerId: body.data.peerId,
      encryptedKey: body.data.encryptedKey,
    })

    return res.status(200).json(createOkResponse(null))
  }

  static listGroupChatMembers = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = ListGroupChatMembersParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const members = await ChatService.listGroupChatMembers({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
    })

    return res.status(200).json(createOkResponse(members))
  }

  static markMessagesAsRead = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const params = MarkMessagesAsReadParamsSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const body = MarkMessagesAsReadBodySchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    await ChatService.markMessagesAsRead({
      chatId: params.data.chatId,
      userId: authenticatedUser.sub,
      lastReadMessageTimestamp: body.data.lastReadMessageTimestamp,
    })

    return res.status(200).json(createOkResponse(null))
  }
}
