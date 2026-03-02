import { ApplicationConfig, DatabaseConfig } from '@/config'
import { DataSource } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: DatabaseConfig.url,
  logging: DatabaseConfig.logging,
  schema: DatabaseConfig.schema,
  namingStrategy: new SnakeNamingStrategy(),
  // synchronize: ApplicationConfig.env === 'development',
  entities: [__dirname + '/../entities/**/*.{ts,js}'],
  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
  subscribers: [__dirname + '/../subscribers/**/*.{ts,js}'],
})

export const initializeDataSource = async () => {
  if (AppDataSource.isInitialized) return

  await AppDataSource.initialize()
  await AppDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${DatabaseConfig.schema}"`)
  await AppDataSource.runMigrations()
}
