import { onRequest } from 'firebase-functions/v2/https'

import { handler, initializeApp } from './app'

const devServer = onRequest(
  {
    region: 'europe-west3',
    memory: '256MiB',
    ingressSettings: 'ALLOW_ALL',
    maxInstances: 1,
  },
  async (request, response) => {
    try {
      await initializeApp()
    } catch (e) {
      const error = e as Error
      console.error(error)

      response.status(500).send('Server is not available')
    }

    return handler(request, response)
  },
)

const prodServer = onRequest(
  {
    region: 'europe-west3',
    memory: '512MiB',
    ingressSettings: 'ALLOW_ALL',
    minInstances: 1,
    maxInstances: 5,
  },
  async (request, response) => {
    try {
      await initializeApp()
    } catch (e) {
      const error = e as Error
      console.error(error)

      response.status(500).send('Server is not available')
    }

    return handler(request, response)
  },
)

export const tarrot_server = {
  dev: devServer,
  prod: prodServer,
}
