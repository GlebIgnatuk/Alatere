import { Router } from 'express'
import { ChatController } from '@/controllers'

const router = Router()

router.post('/v1/chats', ChatController.createChat)
router.get('/v1/chats', ChatController.searchChats)
router.delete('/v1/chats/:chatId', ChatController.deleteChat)
router.post('/v1/chats/:chatId/messages', ChatController.createMessage)
router.get('/v1/chats/:chatId/messages', ChatController.searchMessages)
router.patch('/v1/chats/:chatId/messages/:messageId', ChatController.editMessage)
router.delete('/v1/chats/:chatId/messages/:messageId', ChatController.deleteMessage)
router.get('/v1/chats/:chatId/members/me', ChatController.getAuthorizedChatMember)
router.post('/v1/chats/:chatId/members/:memberId/encryption-keys', ChatController.restoreChatMemberEncryptionKey)

export { router as ChatRouter }
