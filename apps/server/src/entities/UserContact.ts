import { DatabaseConfig } from '@/config'
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'

@Entity('user_contacts', { schema: DatabaseConfig.schema })
export class UserContact {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'bigint' })
  ownerId!: string

  @Column({ type: 'bigint' })
  contactId!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  /**
   * Relationships
   */
  @ManyToOne('User')
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' })
  owner!: User

  @ManyToOne('User')
  @JoinColumn({ name: 'contact_id', referencedColumnName: 'id' })
  contact!: User
}
