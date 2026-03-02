import { Router } from 'express'
import { IndexController } from '@/controllers'

const router = Router()

router.get('/', IndexController.getIndex)

export { router as IndexRouter }
