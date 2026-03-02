import { DatabaseConfig } from '@/config'
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'
import { ChatMessage } from './ChatMessage'
import { Chat } from './Chat'

@Entity('encrypted_chat_messages', { schema: DatabaseConfig.schema })
export class EncryptedChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'text' })
  type!: 'text'

  @Column({ type: 'bigint' })
  chatId!: string

  @Column({ type: 'bigint' })
  chatMessageId!: string

  @Column({ type: 'bigint' })
  recipientId!: string

  @Column({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  editedAt!: Date | null

  /**
   * Common attributes
   */
  @Column({ type: 'text' })
  text!: string

  /**
   * Relationships
   */
  @ManyToOne('Chat')
  @JoinColumn({ name: 'chat_id', referencedColumnName: 'id' })
  chat!: Chat

  @ManyToOne('ChatMessage')
  @JoinColumn({ name: 'chat_message_id', referencedColumnName: 'id' })
  chatMessage!: ChatMessage

  @ManyToOne('User')
  @JoinColumn({ name: 'recipient_id', referencedColumnName: 'id' })
  recepient!: User
}
