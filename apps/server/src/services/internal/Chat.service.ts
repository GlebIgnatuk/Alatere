import { AppDataSource } from '@/database/DataSource'
import { Chat } from '@/entities/Chat'
import { ChatMember } from '@/entities/ChatMember'
import { ChatMessage } from '@/entities/ChatMessage'
import { EncryptedChatMessage } from '@/entities/EncryptedChatMessage'
import { paginate, paginateWithCursor } from '@/utils/db/pagination'
import { In } from 'typeorm'

/**
 * Chat
 */

export interface PrivateChatCreate {
  ownerId: string
  peerId: string
}

export interface ChatSearch {
  userId?: string

  page: number
  limit: number
}

export interface PrivateChatDelete {
  chatId: string
  ownerOrPeerId: string
}

/**
 * Chat Message
 */

export interface ChatMessageSearch {
  chatId: string
  userId: string

  text?: string
  beforeTimestamp?: Date
  afterTimestamp?: Date

  limit: number
}

export interface TextChatMessageCreate {
  type: 'text'
  text: { recepientId: string; text: string }[]
  repliedToMessageId?: string | null
}

export type ChatMessageCreate = TextChatMessageCreate & {
  senderId: string
  chatId: string
}

export interface TextChatMessageEdit {
  type: 'text'
  text: { recepientId: string; text: string }[]
}

export interface TextChatMessageEdit {
  text: { recepientId: string; text: string }[]
}

export type ChatMessageEdit = TextChatMessageEdit & {
  chatId: string
  messageId: string
  senderId: string
}

export interface ChatMessageDelete {
  chatId: string
  messageId: string
  senderId: string
}

export class ChatService {
  static createPrivateChat = async (payload: PrivateChatCreate) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatRepo = tx.getRepository(Chat)
      const chatMemberRepo = tx.getRepository(ChatMember)

      const lookupKey = `${payload.ownerId}:${payload.peerId}`

      const existingChat = await chatRepo.findOne({
        where: {
          type: 'private',
          lookupKey,
        },
      })
      if (existingChat) {
        return existingChat
      }

      const chat = chatRepo.create({
        type: 'private',
        createdById: payload.ownerId,
        lookupKey,
      })
      await chatRepo.save(chat)

      const ownerMember = chatMemberRepo.create({
        chatId: chat.id,
        userId: payload.ownerId,
        status: 'member',
      })
      await chatMemberRepo.save(ownerMember)

      const peerMember = chatMemberRepo.create({
        chatId: chat.id,
        userId: payload.peerId,
        status: 'member',
      })
      await chatMemberRepo.save(peerMember)

      return chat
    })
  }

  static searchChats = async (payload: ChatSearch) => {
    const chatMemberRepo = AppDataSource.getRepository(ChatMember)

    const [items, nOfItems] = await chatMemberRepo
      .createQueryBuilder('chatMember')
      .distinctOn(['lastMessage.createdAt', 'chat.createdAt', 'chatMember.chatId'])
      .innerJoinAndSelect('chatMember.chat', 'chat')
      .leftJoinAndSelect('chat.lastMessage', 'lastMessage')
      // Get the encrypted message for the current user only
      .leftJoinAndSelect(
        'lastMessage.encryptedMessages',
        'encryptedMessages',
        'encryptedMessages.recipientId = :userId',
        {
          userId: payload.userId,
        },
      )
      // Get the peer member of the private chat only, groups do not rely on peer
      .leftJoinAndSelect('chat.members', 'peer', 'chat.type = :type AND peer.userId != :userId', {
        type: 'private',
        userId: payload.userId,
      })
      .leftJoinAndSelect('peer.user', 'peerUser')
      .where('chatMember.userId = :userId', { userId: payload.userId })
      .andWhere('chatMember.status = :status', { status: 'member' })
      .andWhere('(peerUser.id is NULL OR peerUser.deletedAt IS NULL)')
      .orderBy('lastMessage.createdAt', 'DESC', 'NULLS LAST')
      .addOrderBy('chat.createdAt', 'DESC')
      .skip(payload.page * payload.limit)
      .take(payload.limit)
      .getManyAndCount()

    return paginate(
      items.map((i) => i.chat),
      payload.page,
      payload.limit,
      nOfItems,
    )
  }

  static deletePrivateChat = async (payload: PrivateChatDelete) => {
    await AppDataSource.transaction(async (tx) => {
      const chatRepo = tx.getRepository(Chat)
      const chatMemberRepo = tx.getRepository(ChatMember)

      const chatMember = await chatMemberRepo.findOne({
        select: ['id'],
        where: {
          chatId: payload.chatId,
          userId: payload.ownerOrPeerId,
        },
      })
      if (!chatMember) {
        throw new Error('User is not a member of the chat')
      }

      const result = await chatRepo.delete({
        id: payload.chatId,
        type: 'private',
      })
      if (result.affected === 0) {
        throw new Error('Failed to delete chat')
      }
    })
  }

  static searchChatMessages = async (payload: ChatMessageSearch) => {
    const chatMember = await AppDataSource.getRepository(ChatMember).findOne({
      select: ['id'],
      where: {
        chatId: payload.chatId,
        userId: payload.userId,
        status: 'member',
      },
    })
    if (!chatMember) {
      throw new Error('User is not a member of the chat')
    }

    const qb = AppDataSource.getRepository(ChatMessage)
      .createQueryBuilder('chatMessage')
      // base message data
      .innerJoinAndSelect('chatMessage.sender', 'sender')
      .leftJoinAndSelect(
        'chatMessage.encryptedMessages',
        'encryptedMessages',
        'encryptedMessages.recipientId = :userId',
        {
          userId: payload.userId,
        },
      )
      // replied to message data
      .leftJoinAndSelect('chatMessage.repliedToMessage', 'repliedToMessage')
      .leftJoinAndSelect('repliedToMessage.sender', 'repliedToSender')
      .leftJoinAndSelect(
        'repliedToMessage.encryptedMessages',
        'repliedToEncryptedMessages',
        'repliedToEncryptedMessages.recipientId = :userId',
        {
          userId: payload.userId,
        },
      )

    qb.where('chatMessage.chatId = :chatId', { chatId: payload.chatId }).andWhere('sender.deletedAt IS NULL')

    if (payload.text) {
      qb.andWhere('chatMessage.text = :text', { text: payload.text })
    }

    if (payload.beforeTimestamp) {
      qb.andWhere('chatMessage.createdAt < :beforeTimestamp', { beforeTimestamp: payload.beforeTimestamp })
    }

    if (payload.afterTimestamp) {
      qb.andWhere('chatMessage.createdAt > :afterTimestamp', { afterTimestamp: payload.afterTimestamp })
    }

    qb.orderBy('chatMessage.createdAt', 'ASC')

    const items = await qb.take(payload.limit).getMany()

    const next = items.length === payload.limit ? items[items.length - 1].createdAt.toISOString() : null
    const prev = items.length > 0 ? items[0].createdAt.toISOString() : null

    return paginateWithCursor(items, next, prev)
  }

  static createMessage = async (payload: ChatMessageCreate) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatRepo = tx.getRepository(Chat)
      const chatMemberRepo = tx.getRepository(ChatMember)
      const chatMessageRepo = tx.getRepository(ChatMessage)
      const encryptedChatMessageRepo = tx.getRepository(EncryptedChatMessage)

      const chat = await chatRepo.findOne({
        where: {
          id: payload.chatId,
        },
      })
      if (!chat) {
        throw new Error('Chat not found')
      }

      if (payload.text.some((t) => t.recepientId === payload.senderId) === false) {
        throw new Error('Sender must be a recepient')
      }

      const chatMembers = await chatMemberRepo.find({
        select: ['id', 'userId', 'status'],
        where: {
          chatId: payload.chatId,
          userId: In(payload.text.map((t) => t.recepientId)),
        },
      })

      const isChatMember = chatMembers.some((cm) => cm.userId === payload.senderId && cm.status === 'member')
      if (!isChatMember) {
        throw new Error('User is not a member of the chat')
      }

      if (payload.repliedToMessageId) {
        const repliedToMessage = await chatMessageRepo.findOne({
          select: ['id'],
          where: {
            chatId: payload.chatId,
            id: payload.repliedToMessageId,
          },
        })
        if (!repliedToMessage) {
          throw new Error('Replied to message not found')
        }
      }

      const now = new Date()

      const chatMessage = await chatMessageRepo.save(
        chatMessageRepo.create({
          type: payload.type,
          chatId: payload.chatId,
          senderId: payload.senderId,
          repliedToMessageId: payload.repliedToMessageId,
          createdAt: now,
        }),
      )

      await chatRepo.update(payload.chatId, {
        lastMessageId: chatMessage.id,
      })

      const recepientIdToTextPayload = new Map(payload.text.map((t) => [t.recepientId, t]))

      for (const chatMember of chatMembers) {
        if (chatMember.status !== 'member') {
          continue
        }

        // Every recepient except the sender should have their unread message count incremented
        if (chatMember.userId !== payload.senderId) {
          await chatMemberRepo.update(
            {
              chatId: payload.chatId,
              userId: chatMember.userId,
            },
            {
              unreadMessageCount: () => 'unread_message_count + 1',
            },
          )
        }

        // Message contents can only be read by recepients
        const textPayload = recepientIdToTextPayload.get(chatMember.userId)
        if (!textPayload) {
          continue
        }

        const encryptedChatMessage = encryptedChatMessageRepo.create({
          type: payload.type,
          chatId: payload.chatId,
          chatMessageId: chatMessage.id,
          recipientId: textPayload.recepientId,
          text: textPayload.text,
          createdAt: now,
        })
        await encryptedChatMessageRepo.save(encryptedChatMessage)
      }

      return chatMessage
    })
  }

  static editMessage = async (payload: ChatMessageEdit) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)
      const chatMessageRepo = tx.getRepository(ChatMessage)
      const encryptedChatMessageRepo = tx.getRepository(EncryptedChatMessage)

      const chatMembers = await chatMemberRepo.find({
        select: ['id', 'userId', 'status'],
        where: {
          chatId: payload.chatId,
          userId: In(payload.text.map((t) => t.recepientId)),
        },
      })

      const isChatMember = chatMembers.some((cm) => cm.userId === payload.senderId && cm.status === 'member')
      if (!isChatMember) {
        throw new Error('User is not a member of the chat')
      }

      const chatMessage = await chatMessageRepo.findOne({
        where: {
          chatId: payload.chatId,
          id: payload.messageId,
          senderId: payload.senderId,
        },
      })
      if (!chatMessage) {
        throw new Error('Message not found')
      }

      if (chatMessage.type !== payload.type) {
        throw new Error('Message type mismatch')
      }

      if (chatMessage.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        throw new Error('Message is too old to edit')
      }

      await chatMessageRepo.update(payload.messageId, {
        editedAt: new Date(),
      })

      const recepientIdToTextPayload = new Map(payload.text.map((t) => [t.recepientId, t]))

      for (const chatMember of chatMembers) {
        if (chatMember.status !== 'member') {
          continue
        }

        const textPayload = recepientIdToTextPayload.get(chatMember.userId)
        if (!textPayload) {
          continue
        }

        await encryptedChatMessageRepo.update(
          {
            chatId: payload.chatId,
            chatMessageId: payload.messageId,
            recipientId: textPayload.recepientId,
          },
          {
            text: textPayload.text,
            editedAt: new Date(),
          },
        )
      }

      return chatMessage
    })
  }

  static deleteMessage = async (payload: ChatMessageDelete) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)
      const chatMessageRepo = tx.getRepository(ChatMessage)

      const chatMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          userId: payload.senderId,
          status: 'member',
        },
      })
      if (!chatMember) {
        throw new Error('User is not a member of the chat')
      }

      const result = await chatMessageRepo.delete({
        chatId: payload.chatId,
        id: payload.messageId,
        senderId: payload.senderId,
      })
      if (result.affected === 0) {
        throw new Error('Failed to delete message')
      }

      // Clear all replies to this message
      await chatMessageRepo.update(
        {
          chatId: payload.chatId,
          repliedToMessageId: payload.messageId,
        },
        {
          repliedToMessageId: null,
        },
      )

      // Set new last message after deletion
      const lastChatMessage = await chatMessageRepo.findOne({
        select: ['id'],
        where: {
          chatId: payload.chatId,
        },
        order: {
          createdAt: 'DESC',
        },
      })

      if (!lastChatMessage) {
        return
      }

      await tx.getRepository(Chat).update(payload.chatId, {
        lastMessageId: lastChatMessage?.id ?? null,
      })
    })
  }
}
