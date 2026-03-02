import { User } from '@/entities/User'

export interface CreatedUserFromCodeDto {
  id: string
  username: string
  publicKey: string
}

export const toCreatedUserFromCodeDto = (user: User): CreatedUserFromCodeDto => {
  return {
    id: user.id,
    username: user.username,
    publicKey: user.publicKey,
  }
}
