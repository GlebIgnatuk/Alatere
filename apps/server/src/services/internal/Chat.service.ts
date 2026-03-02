import { AppDataSource } from '@/database/DataSource'
import { Chat } from '@/entities/Chat'
import { ChatMember } from '@/entities/ChatMember'
import { ChatMessage } from '@/entities/ChatMessage'
import { User } from '@/entities/User'
import { encryptAssymmetric } from '@/utils/crypto/asymmetric'
import { generateSymmetricKey } from '@/utils/crypto/symmetric'
import { paginate, paginateWithCursor } from '@/utils/db/pagination'
import { In, IsNull, Not } from 'typeorm'

/**
 * Chat
 */

export interface PrivateChatCreate {
  ownerId: string
  peerId: string
}

export interface ChatSearch {
  userId: string
  name?: string

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
  text: string
  repliedToMessageId?: string | null
}

export type ChatMessageCreate = TextChatMessageCreate & {
  senderId: string
  chatId: string
}

export interface TextChatMessageEdit {
  type: 'text'
  text: string
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

export interface ChatMemberGet {
  chatId: string
  userId: string
  consumeEncryptionKey?: boolean
}

export interface ChatMemberRestoreEncryptionKey {
  chatId: string
  userId: string
  memberId: string
  encryptionKey: string
}

export interface ChatMemberListWithInvalidPublicKey {
  chatId: string
  userId: string
}

export interface ChatMemberResetEncryptionKey {
  chatId: string
  userId: string
}

export interface ChatMemberKick {
  chatId: string
  userId: string
  memberId: string
}

export interface ChatMemberLeave {
  chatId: string
  userId: string
}

export interface GroupChatCreate {
  ownerId: string
  name: string
  peerIds: string[]
}

export interface ChatMemberAdd {
  chatId: string
  userId: string
  peerId: string
  encryptedKey: string
}

export interface ChatMemberList {
  chatId: string
  userId: string
}

export class ChatService {
  private static validateSenderMemberOrThrow = (member?: ChatMember | null) => {
    if (!member) {
      throw new Error('User is not a member of the chat')
    }

    if (member.status !== 'member') {
      throw new Error('User is not a member of the chat')
    }

    if (member.publicKey !== member.user.publicKey) {
      throw new Error('User public key mismatch')
    }

    if (!member.encryptedKeyConsumedAt && !member.encryptedKey) {
      throw new Error('Encryption key not consumed')
    }

    return member
  }

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

      const symmetricKey = generateSymmetricKey()

      const [ownerUser, peerUser] = await Promise.all([
        tx.getRepository(User).findOne({
          where: {
            id: payload.ownerId,
          },
        }),
        tx.getRepository(User).findOne({
          where: {
            id: payload.peerId,
          },
        }),
      ])

      if (!ownerUser) {
        throw new Error('Owner user not found')
      }
      if (!peerUser) {
        throw new Error('Peer user not found')
      }

      await Promise.all([
        chatMemberRepo.save(
          chatMemberRepo.create({
            chatId: chat.id,
            userId: ownerUser.id,
            publicKey: ownerUser.publicKey,
            status: 'member',
            encryptedKey: encryptAssymmetric(symmetricKey, ownerUser.publicKey),
          }),
        ),
        chatMemberRepo.save(
          chatMemberRepo.create({
            chatId: chat.id,
            userId: peerUser.id,
            publicKey: peerUser.publicKey,
            status: 'member',
            encryptedKey: encryptAssymmetric(symmetricKey, peerUser.publicKey),
          }),
        ),
      ])

      return chat
    })
  }

  static createGroupChat = async (payload: GroupChatCreate) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatRepo = tx.getRepository(Chat)
      const chatMemberRepo = tx.getRepository(ChatMember)
      const chatMessageRepo = tx.getRepository(ChatMessage)

      const chat = chatRepo.create({
        type: 'group',
        createdById: payload.ownerId,
        name: payload.name,
      })
      await chatRepo.save(chat)

      const chatMessage = await chatMessageRepo.save(
        chatMessageRepo.create({
          type: 'chat_created',
          chatId: chat.id,
          senderId: payload.ownerId,
          createdAt: new Date(),
        }),
      )

      await tx.getRepository(Chat).update(chat.id, {
        lastMessageId: chatMessage.id,
      })

      const symmetricKey = generateSymmetricKey()

      const users = await tx.getRepository(User).find({
        where: {
          id: In([payload.ownerId, ...payload.peerIds]),
        },
      })
      if (users.length !== payload.peerIds.length + 1) {
        throw new Error('One or more users not found')
      }

      await Promise.all(
        users.map((user) =>
          chatMemberRepo.save(
            chatMemberRepo.create({
              chatId: chat.id,
              userId: user.id,
              publicKey: user.publicKey,
              status: 'member',
              encryptedKey: encryptAssymmetric(symmetricKey, user.publicKey),
              unreadMessageCount: 1,
            }),
          ),
        ),
      )

      return chat
    })
  }

  static searchChats = async (payload: ChatSearch) => {
    const chatMemberRepo = AppDataSource.getRepository(ChatMember)

    const qb = chatMemberRepo
      .createQueryBuilder('chatMember')
      .distinctOn(['lastMessage.createdAt', 'chat.createdAt', 'chatMember.chatId'])
      .innerJoinAndSelect('chatMember.chat', 'chat')
      .leftJoinAndSelect('chat.lastMessage', 'lastMessage')
      // Get the peer member of the private chat only, groups do not rely on peer
      .leftJoinAndSelect('chat.members', 'peer', 'chat.type = :type AND peer.userId != :userId', {
        type: 'private',
        userId: payload.userId,
      })
      .leftJoinAndSelect('peer.user', 'peerUser')
      .where('chatMember.userId = :userId', { userId: payload.userId })
      .andWhere('chatMember.status = :status', { status: 'member' })
      // Filter out deleted users
      .andWhere('(peerUser.id IS NULL OR peerUser.deletedAt IS NULL)')

    if (payload.name) {
      // Private chats
      qb.andWhere('(peerUser.id IS NULL OR peerUser.username ilike :name)', { name: `%${payload.name}%` })

      // Group chats
      qb.andWhere('(peerUser.id IS NOT NULL OR chat.name ilike :name)', { name: `%${payload.name}%` })
    }

    qb.orderBy('lastMessage.createdAt', 'DESC', 'NULLS LAST')
      .addOrderBy('chat.createdAt', 'DESC')
      .skip(payload.page * payload.limit)
      .take(payload.limit)

    const [items, nOfItems] = await qb.getManyAndCount()

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
      // replied to message data
      .leftJoinAndSelect('chatMessage.repliedToMessage', 'repliedToMessage')
      .leftJoinAndSelect('repliedToMessage.sender', 'repliedToSender')

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

      const chat = await chatRepo.findOne({
        where: {
          id: payload.chatId,
        },
      })
      if (!chat) {
        throw new Error('Chat not found')
      }

      const chatMembers = await chatMemberRepo.find({
        select: ['id', 'userId', 'status', 'publicKey', 'encryptedKeyConsumedAt', 'encryptedKey'],
        where: {
          chatId: payload.chatId,
        },
        relations: ['user'],
      })

      const senderMember = chatMembers.find((cm) => cm.userId === payload.senderId)
      this.validateSenderMemberOrThrow(senderMember)

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

      let chatMessage: ChatMessage

      switch (payload.type) {
        case 'text':
          {
            chatMessage = await chatMessageRepo.save(
              chatMessageRepo.create({
                type: payload.type,
                chatId: payload.chatId,
                senderId: payload.senderId,
                repliedToMessageId: payload.repliedToMessageId,
                text: payload.text,
                createdAt: new Date(),
              }),
            )
          }
          break

        default: {
          throw new Error('Unsupported message type')
        }
      }

      await Promise.all([
        // Update last message in the char
        chatRepo.update(payload.chatId, {
          lastMessageId: chatMessage.id,
        }),
        // Increment unread message count for all members except the sender
        chatMemberRepo.update(
          {
            chatId: payload.chatId,
            userId: In(
              chatMembers
                .filter((cm) => cm.userId !== payload.senderId && cm.status === 'member')
                .map((cm) => cm.userId),
            ),
          },
          {
            unreadMessageCount: () => 'unread_message_count + 1',
          },
        ),
      ])

      return chatMessage
    })
  }

  static editMessage = async (payload: ChatMessageEdit) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)
      const chatMessageRepo = tx.getRepository(ChatMessage)

      const chatMembers = await chatMemberRepo.find({
        select: ['id', 'userId', 'status'],
        where: {
          chatId: payload.chatId,
        },
      })

      const senderMember = chatMembers.find((cm) => cm.userId === payload.senderId)
      this.validateSenderMemberOrThrow(senderMember)

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

      switch (payload.type) {
        case 'text':
          {
            await chatMessageRepo.update(payload.messageId, {
              text: payload.text,
              editedAt: new Date(),
            })
          }
          break

        default: {
          throw new Error('Unsupported message type')
        }
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

  static getChatMember = async (payload: ChatMemberGet) => {
    const chatMember = await AppDataSource.getRepository(ChatMember).findOne({
      where: {
        chatId: payload.chatId,
        userId: payload.userId,
      },
    })

    if (!chatMember) {
      throw new Error('User is not a member of the chat')
    }

    if (payload.consumeEncryptionKey) {
      await AppDataSource.getRepository(ChatMember).update(
        {
          id: chatMember.id,
          encryptedKey: Not(IsNull()),
        },
        {
          encryptedKey: null,
          encryptedKeyConsumedAt: new Date(),
        },
      )
    }

    return chatMember
  }

  static resetChatMemberEncryptionKey = async (payload: ChatMemberResetEncryptionKey) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)

      const chatMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          userId: payload.userId,
        },
      })
      if (!chatMember) {
        throw new Error('User is not a member of the chat')
      }

      await chatMemberRepo.update(
        {
          id: chatMember.id,
        },
        {
          encryptedKey: null,
          encryptedKeyConsumedAt: null,
        },
      )
    })
  }

  static restoreChatMemberEncryptionKey = async (payload: ChatMemberRestoreEncryptionKey) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)

      const callerMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          userId: payload.userId,
        },
      })
      if (!callerMember) {
        throw new Error('User is not a member of the chat')
      }

      const targetMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          id: payload.memberId,
        },
        relations: ['user'],
      })
      if (!targetMember) {
        throw new Error('Member not found')
      }

      if (callerMember.id === targetMember.id) {
        throw new Error('Cannot restore own encryption key')
      }

      await chatMemberRepo.update(
        {
          id: targetMember.id,
        },
        {
          publicKey: targetMember.user.publicKey,
          encryptedKey: payload.encryptionKey,
          encryptedKeyConsumedAt: null,
        },
      )
    })
  }

  static listChatMembersWithInvalidPublicKey = async (payload: ChatMemberListWithInvalidPublicKey) => {
    const chatMemberRepo = AppDataSource.getRepository(ChatMember)

    const isChatMember = await chatMemberRepo.findOne({
      select: ['id'],
      where: {
        chatId: payload.chatId,
        userId: payload.userId,
      },
    })
    if (!isChatMember) {
      throw new Error('User is not a member of the chat')
    }

    const items = await chatMemberRepo
      .createQueryBuilder('chatMember')
      .innerJoinAndSelect('chatMember.user', 'user')
      .where('chatMember.chatId = :chatId', { chatId: payload.chatId })
      .andWhere(
        'chatMember.publicKey != user.publicKey OR (chatMember.encryptedKeyConsumedAt IS NULL AND chatMember.encryptedKey IS NULL)',
      )
      .getMany()

    return items
  }

  static kickGroupChatMember = async (payload: ChatMemberKick) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)

      const chat = await tx.getRepository(Chat).findOne({
        select: ['id', 'type'],
        where: {
          id: payload.chatId,
          type: 'group',
        },
      })
      if (!chat) {
        throw new Error('Chat not found')
      }

      const chatMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          userId: payload.userId,
          status: 'member',
        },
      })
      if (!chatMember) {
        throw new Error('User is not a member of the chat')
      }

      if (chat.createdById !== chatMember.userId) {
        throw new Error('User is not the owner of the chat')
      }

      const targetMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          id: payload.memberId,
        },
      })
      if (!targetMember) {
        throw new Error('Member not found')
      }

      if (chatMember.userId === targetMember.userId) {
        throw new Error('Cannot kick self')
      }

      if (targetMember.status !== 'member') {
        throw new Error('Member is not a member of the chat')
      }

      if (targetMember.userId === chat.createdById) {
        throw new Error('Cannot kick chat owner')
      }

      await chatMemberRepo.update(
        {
          id: targetMember.id,
        },
        {
          status: 'kicked',
        },
      )
    })
  }

  static leaveFromGroupChat = async (payload: ChatMemberLeave) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)

      const chat = await tx.getRepository(Chat).findOne({
        select: ['id', 'type'],
        where: {
          id: payload.chatId,
          type: 'group',
        },
      })
      if (!chat) {
        throw new Error('Chat not found')
      }

      const chatMember = await chatMemberRepo.findOne({
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

      await chatMemberRepo.update(
        {
          id: chatMember.id,
        },
        {
          status: 'left',
        },
      )
    })
  }

  static addUserToGroupChat = async (payload: ChatMemberAdd) => {
    return await AppDataSource.transaction(async (tx) => {
      const chatMemberRepo = tx.getRepository(ChatMember)

      const chat = await tx.getRepository(Chat).findOne({
        select: ['id', 'type'],
        where: {
          id: payload.chatId,
          type: 'group',
        },
      })
      if (!chat) {
        throw new Error('Chat not found')
      }

      const chatMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          userId: payload.userId,
          status: 'member',
        },
      })
      if (!chatMember) {
        throw new Error('User is not a member of the chat')
      }

      const targetMember = await chatMemberRepo.findOne({
        select: ['id', 'userId'],
        where: {
          chatId: payload.chatId,
          userId: payload.peerId,
        },
      })
      if (targetMember) {
        throw new Error('User is already a member of the chat')
      }

      const peer = await tx.getRepository(User).findOne({
        select: ['id', 'publicKey'],
        where: {
          id: payload.peerId,
        },
      })
      if (!peer) {
        throw new Error('Peer user not found')
      }

      await chatMemberRepo.save(
        chatMemberRepo.create({
          chatId: chat.id,
          userId: peer.id,
          publicKey: peer.publicKey,
          status: 'member',
          encryptedKey: payload.encryptedKey,
        }),
      )
    })
  }

  static listGroupChatMembers = async (payload: ChatMemberList) => {
    const chatMemberRepo = AppDataSource.getRepository(ChatMember)

    const chat = await AppDataSource.getRepository(Chat).findOne({
      select: ['id', 'type'],
      where: {
        id: payload.chatId,
        type: 'group',
      },
    })
    if (!chat) {
      throw new Error('Chat not found')
    }

    const chatMember = await chatMemberRepo.findOne({
      select: ['id', 'userId'],
      where: {
        chatId: payload.chatId,
        userId: payload.userId,
        status: 'member',
      },
    })
    if (!chatMember) {
      throw new Error('User is not a member of the chat')
    }

    const members = await chatMemberRepo.find({
      where: {
        chatId: payload.chatId,
      },
      relations: ['user'],
    })

    return members
  }
}
