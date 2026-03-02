import { z } from 'zod'

export const ExchangeUserActivationCodeSchema = z.object({
  code: z.string().min(1),
})

export const CreateUserFromCodeSchema = z.object({
  code: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  publicKey: z.string().min(1),
})

export const SearchUsernamesSchema = z.object({
  username: z.string().min(1),
})
