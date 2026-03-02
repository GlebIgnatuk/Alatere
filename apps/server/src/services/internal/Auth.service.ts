import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { AppDataSource } from '@/database/DataSource'
import { User } from '@/entities/User'
import { ApplicationConfig } from '@/config'

export interface Login {
  username: string
  password: string
}

export class AuthService {
  static async login(payload: Login) {
    const userRepo = AppDataSource.getRepository(User)

    const user = await userRepo.findOne({
      where: {
        username: payload.username,
      },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValid = await argon2.verify(user.password, payload.password)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    const accessToken = jwt.sign({ id: user.id }, ApplicationConfig.jwtSecret, { expiresIn: '15m' })

    return {
      user,
      accessToken,
    }
  }
}
