import { Request, Response } from 'express'
import {
  CreateUserFromCodeSchema,
  ExchangeUserActivationCodeSchema,
  SearchUsernamesSchema,
  UpdateMeSchema,
} from './User.schema'
import { createNotFoundError, createOkResponse, createZodErrorResponse } from '@/utils/http/response'
import { UserService } from '@/services/internal/User.service'
import { toCreatedUserFromCodeDto } from './User.dto'
import { mustGetAuthenticatedUser } from '@/middlewares/jwt'

export class UserController {
  static exchangeUserActivationCode = async (req: Request, res: Response) => {
    const body = ExchangeUserActivationCodeSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    const activationCode = await UserService.findUserActivationCode(body.data.code)
    if (!activationCode) {
      return res.status(404).json(createNotFoundError())
    }

    return res.status(200).json(createOkResponse(true))
  }

  static createUserFromCode = async (req: Request, res: Response) => {
    const body = CreateUserFromCodeSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    const user = await UserService.createUserFromCode(body.data)

    return res.status(201).json(createOkResponse(toCreatedUserFromCodeDto(user)))
  }

  static findUsernameUsage = async (req: Request, res: Response) => {
    const params = SearchUsernamesSchema.safeParse(req.params)
    if (!params.success) {
      return res.status(422).json(createZodErrorResponse(params.error.issues))
    }

    const isUsernameTaken = await UserService.findUsername(params.data.username)
    if (isUsernameTaken) {
      return res.status(200).json(createOkResponse({ isTaken: true }))
    }

    return res.status(200).json(createOkResponse({ isTaken: false }))
  }

  static getAuthorizedUser = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const user = await UserService.findUserById(authenticatedUser.sub)

    if (!user) {
      return res.status(404).json(createNotFoundError())
    }

    return res.status(200).json(
      createOkResponse({
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
      }),
    )
  }

  static updateMe = async (req: Request, res: Response) => {
    const authenticatedUser = mustGetAuthenticatedUser(res)

    const body = UpdateMeSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    const user = await UserService.updateUser({
      id: authenticatedUser.sub,
      password: body.data.password,
      publicKey: body.data.publicKey,
    })

    return res.status(200).json(
      createOkResponse({
        id: user.id,
        username: user.username,
        publicKey: user.publicKey,
      }),
    )
  }
}
