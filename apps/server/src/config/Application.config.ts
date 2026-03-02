import { mustGetEnv, shouldGetEnv } from './config'

export interface IApplicationConfig {
  env: 'development' | 'production'
}

export const ApplicationConfig = {
  env: shouldGetEnv('NODE_ENV', 'development'),
  basePath: shouldGetEnv('BASE_PATH', '/'),

  jwtSecret: mustGetEnv('JWT_SECRET'),
}
