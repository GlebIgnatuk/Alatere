import { ApplicationConfig } from '@/config'
import { ApiError, createNokResponse } from '@/utils/http/response'
import { NextFunction, Request, Response } from 'express'

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    const response = createNokResponse(err.errors)
    return res.status(err.code).json(response)
  } else {
    console.error(err)

    const response = createNokResponse([
      {
        code: 'internal_server_error',
        message: 'Internal server error',
        details:
          ApplicationConfig.env === 'development'
            ? {
                message: err.message,
                stack: err.stack,
              }
            : undefined,
      },
    ])
    return res.status(500).json(response)
  }
}
