import { DatabaseConfig } from '@/config'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('users', { schema: DatabaseConfig.schema })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'text' })
  username!: string

  @Column({ type: 'text' })
  password!: string

  @Column({ type: 'text' })
  publicKey!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null
}
