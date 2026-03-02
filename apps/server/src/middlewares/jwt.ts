import jwt from 'jsonwebtoken'
import { NextFunction, Request, Response } from 'express'
import { ApplicationConfig } from '@/config'
import { ApiError } from '@/utils/http/response'

export interface DecodedJwtPayload {
  sub: string
}

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    throw new ApiError([{ code: 'no_token_provided', message: 'No token provided' }], 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, ApplicationConfig.jwtSecret)
    res.locals.user = decoded as DecodedJwtPayload
    next()
  } catch (err) {
    throw new ApiError([{ code: 'invalid_access_token', message: 'Invalid access token' }], 401)
  }
}

export const shouldGetAuthenticatedUser = (res: Response) => {
  return (res.locals.user ?? null) as DecodedJwtPayload | null
}

export const mustGetAuthenticatedUser = (res: Response) => {
  const user = shouldGetAuthenticatedUser(res)
  if (!user) {
    throw new ApiError([{ code: 'unauthorized', message: 'Unauthorized' }], 401)
  }

  return user
}
