import { z } from 'zod'

/**
 * Exchange User Activation Code
 */

export const ExchangeUserActivationCodeSchema = z.object({
  code: z.string().min(1),
})

/**
 * Create User From Code
 */

export const CreateUserFromCodeSchema = z.object({
  code: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  publicKey: z.string().min(1),
})

/**
 * Search Usernames
 */

export const SearchUsernamesSchema = z.object({
  username: z.string().min(1),
})

/**
 * Update Me
 */

export const UpdateMeSchema = z.object({
  password: z.string().min(1).optional(),
  publicKey: z.string().min(1).optional(),
})
