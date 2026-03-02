import { createServer } from 'http'
import { handler, initializeApp } from './app'
import { shouldGetEnv } from './config/config'

const PORT = Number(shouldGetEnv('PORT', '3001'))

const server = createServer(handler)

initializeApp()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
