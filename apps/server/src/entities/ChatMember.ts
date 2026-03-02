import { DatabaseConfig } from '@/config'
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Chat } from './Chat'
import { User } from './User'

@Entity('chat_members', { schema: DatabaseConfig.schema })
export class ChatMember {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'bigint' })
  chatId!: string

  @Column({ type: 'bigint' })
  userId!: string

  @Column({ type: 'text' })
  status!: 'member' | 'left'

  @Column({ type: 'timestamptz', nullable: true })
  lastReadMessageTimestamp!: Date | null

  @Column({ type: 'integer', default: 0 })
  unreadMessageCount!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  /**
   * Relationships
   */
  @ManyToOne('Chat')
  @JoinColumn({ name: 'chat_id', referencedColumnName: 'id' })
  chat!: Chat

  @ManyToOne('User')
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User
}
