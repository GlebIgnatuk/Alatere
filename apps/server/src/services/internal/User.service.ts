import crypto from 'crypto'
import argon2 from 'argon2'
import { AppDataSource } from '@/database/DataSource'
import { User } from '@/entities/User'
import { UserActivationCode } from '@/entities/UserActivationCode'
import { EntityManager, IsNull, MoreThan } from 'typeorm'
import { paginate } from '@/utils/db/pagination'
import { UserContact } from '@/entities/UserContact'

export interface UserActivationCodeGenerate {
  expiresInSeconds: number
}

export interface UserCreate {
  username: string
  password: string
  publicKey: string

  code: string
}

export interface UserUpdate {
  id: string

  password?: string
  publicKey?: string
}

export interface UserSearch {
  username?: string

  page: number
  limit: number
}

export interface UserContactAdd {
  callerUserId: string
  contactId: string
}

export interface UserContactRemove {
  callerUserId: string
  contactId: string
}

export interface UserContactSearch {
  userId: string
  username?: string

  page: number
  limit: number
}

export class UserService {
  static async generateUserActivationCode(payload: UserActivationCodeGenerate) {
    return await AppDataSource.transaction(async (tx) => {
      const userActivationCodeRepo = tx.getRepository(UserActivationCode)

      const randomCode = crypto.randomBytes(64).toString('base64url')
      const hashedCode = crypto.createHash('sha256').update(randomCode).digest('hex')

      await userActivationCodeRepo.save(
        userActivationCodeRepo.create({
          code: hashedCode,
          expiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000),
        }),
      )

      return randomCode
    })
  }

  static async findUserActivationCode(code: string, tx?: EntityManager) {
    const manager = tx ?? AppDataSource.manager

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex')
    const userActivationCodeRepo = manager.getRepository(UserActivationCode)

    return await userActivationCodeRepo.findOne({
      where: {
        code: hashedCode,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    })
  }

  static async createUserFromCode(payload: UserCreate) {
    return await AppDataSource.transaction(async (tx) => {
      const activationCode = await this.findUserActivationCode(payload.code, tx)
      if (!activationCode) {
        throw new Error('Invalid activation code')
      }

      const userRepo = tx.getRepository(User)

      const hashedPassword = await argon2.hash(payload.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      })

      const user = await userRepo.save(
        userRepo.create({
          username: payload.username,
          password: hashedPassword,
          publicKey: payload.publicKey,
        }),
      )

      await tx.getRepository(UserActivationCode).update(activationCode.id, {
        usedAt: new Date(),
        usedById: user.id,
      })

      return user
    })
  }

  static async findUserById(id: string) {
    const userRepo = AppDataSource.getRepository(User)

    return await userRepo.findOne({
      where: {
        id,
      },
    })
  }

  static async findUsername(username: string) {
    const userRepo = AppDataSource.getRepository(User)

    const user = await userRepo.findOne({
      select: ['id'],
      where: {
        username,
      },
    })

    return user !== null
  }

  static async updateUser(payload: UserUpdate) {
    return await AppDataSource.transaction(async (tx) => {
      const userRepo = tx.getRepository(User)

      const user = await userRepo.findOne({
        where: {
          id: payload.id,
        },
      })
      if (!user) {
        throw new Error('User not found')
      }

      if (payload.password) {
        const hashedPassword = await argon2.hash(payload.password, {
          type: argon2.argon2id,
          memoryCost: 2 ** 16,
          timeCost: 3,
          parallelism: 1,
        })
        user.password = hashedPassword
      }

      if (payload.publicKey) {
        user.publicKey = payload.publicKey
      }

      return await userRepo.save(user)
    })
  }

  static async searchUsers(payload: UserSearch) {
    const userRepo = AppDataSource.getRepository(User)

    const [items, nOfItems] = await userRepo
      .createQueryBuilder('user')
      .where('user.username ilike :username', { username: `${payload.username}%` })
      .andWhere('user.deletedAt IS NULL')
      .orderBy('user.username', 'ASC')
      .skip(payload.page * payload.limit)
      .take(payload.limit)
      .getManyAndCount()

    return paginate(items, payload.page, payload.limit, nOfItems)
  }

  static async addToContacts(payload: UserContactAdd) {
    return await AppDataSource.transaction(async (tx) => {
      const userContactRepo = tx.getRepository(UserContact)

      await userContactRepo.save(
        userContactRepo.create({
          ownerId: payload.callerUserId,
          contactId: payload.contactId,
        }),
      )
    })
  }

  static async removeFromContacts(payload: UserContactRemove) {
    return await AppDataSource.transaction(async (tx) => {
      const userContactRepo = tx.getRepository(UserContact)

      await userContactRepo.delete({
        ownerId: payload.callerUserId,
        contactId: payload.contactId,
      })
    })
  }

  static async searchContacts(payload: UserContactSearch) {
    const userContactRepo = AppDataSource.getRepository(UserContact)

    const qb = userContactRepo
      .createQueryBuilder('userContact')
      .innerJoinAndSelect('userContact.contact', 'contact')
      .where('userContact.ownerId = :ownerId', { ownerId: payload.userId })

    if (payload.username) {
      qb.andWhere('contact.username ilike :username', { username: `%${payload.username}%` })
    }

    qb.andWhere('contact.deletedAt IS NULL')
      .orderBy('contact.username', 'ASC')
      .skip(payload.page * payload.limit)
      .take(payload.limit)

    const [items, nOfItems] = await qb.getManyAndCount()

    return paginate(
      items.map((i) => i.contact),
      payload.page,
      payload.limit,
      nOfItems,
    )
  }
}
