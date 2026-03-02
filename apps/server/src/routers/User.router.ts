import { Router } from 'express'
import { UserController } from '@/controllers'
import { jwtMiddleware } from '@/middlewares/jwt'

const router = Router()

router.post('/v1/users/activation-code-exchanges', UserController.exchangeUserActivationCode)
router.post('/v1/users', UserController.createUserFromCode)
router.get('/v1/users', jwtMiddleware, UserController.searchUsers)
router.get('/v1/users/me', jwtMiddleware, UserController.getAuthorizedUser)
router.get('/v1/username-usages/:username', UserController.findUsernameUsage)
router.patch('/v1/users/me', jwtMiddleware, UserController.updateMe)
router.post('/v1/users/me/contacts', jwtMiddleware, UserController.addContact)
router.delete('/v1/users/me/contacts/:contactId', jwtMiddleware, UserController.removeContact)
router.get('/v1/users/me/contacts', jwtMiddleware, UserController.searchContacts)

export { router as UserRouter }
