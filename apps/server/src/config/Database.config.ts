import { mustGetEnv, shouldGetEnv } from './config'

export const DatabaseConfig = {
  url: mustGetEnv('DB_URL'),
  logging: shouldGetEnv('DB_LOGGING', 'false') === 'true',
  schema: mustGetEnv('DB_SCHEMA'),
}
