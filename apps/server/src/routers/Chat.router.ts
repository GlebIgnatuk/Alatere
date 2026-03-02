import { Router } from 'express'
import { ChatController } from '@/controllers'
import { jwtMiddleware } from '@/middlewares/jwt'

const router = Router()

router.post('/v1/chats', jwtMiddleware, ChatController.createChat)
router.get('/v1/chats', jwtMiddleware, ChatController.searchChats)
router.delete('/v1/chats/:chatId', jwtMiddleware, ChatController.deleteChat)
router.post('/v1/chats/:chatId/messages', jwtMiddleware, ChatController.createMessage)
router.get('/v1/chats/:chatId/messages', jwtMiddleware, ChatController.searchMessages)
router.patch('/v1/chats/:chatId/messages/:messageId', jwtMiddleware, ChatController.editMessage)
router.delete('/v1/chats/:chatId/messages/:messageId', jwtMiddleware, ChatController.deleteMessage)
router.get('/v1/chats/:chatId/members/me', jwtMiddleware, ChatController.getAuthorizedChatMember)
router.get('/v1/chats/:chatId/invalid-members', jwtMiddleware, ChatController.listChatMembersWithInvalidPublicKey)
router.post(
  '/v1/chats/:chatId/members/:memberId/encryption-keys',
  jwtMiddleware,
  ChatController.restoreChatMemberEncryptionKey,
)
router.post('/v1/chats/:chatId/members/me/encryption-key-resets', jwtMiddleware, ChatController.resetMyEncryptionKey)
router.post('/v1/chats/:chatId/members/:memberId/kicks', jwtMiddleware, ChatController.kickGroupChatMember)
router.post('/v1/chats/:chatId/members/me/leaves', jwtMiddleware, ChatController.leaveFromGroupChat)
router.post('/v1/chats/:chatId/members', jwtMiddleware, ChatController.addUserToGroupChat)
router.get('/v1/chats/:chatId/members', jwtMiddleware, ChatController.listGroupChatMembers)
router.post('/v1/chats/:chatId/message-reads', jwtMiddleware, ChatController.markMessagesAsRead)

export { router as ChatRouter }
