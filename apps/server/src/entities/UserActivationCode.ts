import { DatabaseConfig } from '@/config'
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity('user_activation_codes', { schema: DatabaseConfig.schema })
export class UserActivationCode {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'text' })
  code!: string

  @Column({ type: 'timestamptz', nullable: true })
  usedAt!: Date | null

  @Column({ type: 'bigint', nullable: true })
  usedById!: string | null

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  /**
   * Relationships
   */
  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'used_by_id', referencedColumnName: 'id' })
  usedBy!: User | null
}
