import { Request, Response } from 'express'
import { LoginSchema } from './Auth.schema'
import { AuthService } from '@/services/internal/Auth.service'
import { createZodErrorResponse } from '@/utils/http/response'

export class AuthController {
  static login = async (req: Request, res: Response) => {
    const body = LoginSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(422).json(createZodErrorResponse(body.error.issues))
    }

    const { user, accessToken } = await AuthService.login(body.data)

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          publicKey: user.publicKey,
        },
        accessToken,
        refreshToken: '@todo',
      },
    })
  }
}
