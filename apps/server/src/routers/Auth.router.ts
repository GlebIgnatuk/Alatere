import { Router } from 'express'
import { AuthController } from '@/controllers'

const router = Router()

router.post('/v1/auth/logins', AuthController.login)

export { router as AuthRouter }
