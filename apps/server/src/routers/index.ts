import { Router } from 'express'

import { ApplicationConfig } from '@/config'
import { HealthRouter } from './Health.router'
import { IndexRouter } from './Index.router'
import { UserRouter } from './User.router'
import { ChatRouter } from './Chat.router'

const router = Router()

router.get('/', (_, res, next) => {
  if (ApplicationConfig.basePath === '/') {
    next()
  } else {
    res.redirect(ApplicationConfig.basePath)
  }
})

router.use(ApplicationConfig.basePath, IndexRouter, HealthRouter, UserRouter, ChatRouter)

export { router as AppRouter }
