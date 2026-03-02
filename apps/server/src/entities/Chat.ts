import { DatabaseConfig } from '@/config'
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { ChatMessage } from './ChatMessage'
import { ChatMember } from './ChatMember'
import { User } from './User'

@Entity('chats', { schema: DatabaseConfig.schema })
export class Chat {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'text' })
  type!: 'private' | 'group'

  @Column({ type: 'bigint', nullable: true })
  lastMessageId!: string | null

  @Column({ type: 'bigint' })
  createdById!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  /**
   * Private chat
   */
  @Column({ type: 'text', nullable: true })
  lookupKey!: string

  /**
   * Relationships
   */
  @ManyToOne('ChatMessage', { nullable: true })
  @JoinColumn({ name: 'last_message_id', referencedColumnName: 'id' })
  lastMessage!: ChatMessage | null

  @OneToMany('ChatMember', 'chat')
  members!: ChatMember[]

  @ManyToOne('User')
  @JoinColumn({ name: 'created_by_id', referencedColumnName: 'id' })
  createdBy!: User
}
