import 'reflect-metadata'

import express from 'express'
import { initializeDataSource } from './database/DataSource'
import { AppRouter } from './routers'
import { errorMiddleware } from './middlewares/error'

const app = express()

app.use(express.json())
app.use(AppRouter)
app.use(errorMiddleware)

export const initializeApp = async () => {
  await initializeDataSource()
}

export { app as handler }
