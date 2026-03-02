import { Router } from 'express'
import { UserController } from '@/controllers'

const router = Router()

router.post('/v1/users/activation-code-exchanges', UserController.exchangeUserActivationCode)
router.post('/v1/users', UserController.createUserFromCode)
router.get('/v1/username-usages/:username', UserController.findUsernameUsage)

export { router as UserRouter }
