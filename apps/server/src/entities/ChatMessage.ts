import { DatabaseConfig } from '@/config'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { User } from './User'
import { Chat } from './Chat'
import { EncryptedChatMessage } from './EncryptedChatMessage'

@Entity('chat_messages', { schema: DatabaseConfig.schema })
export class ChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string

  @Column({ type: 'text' })
  type!: 'text'

  @Column({ type: 'bigint' })
  chatId!: string

  @Column({ type: 'bigint' })
  senderId!: string

  @Column({ type: 'bigint', nullable: true })
  repliedToMessageId!: string | null

  @Column({ type: 'timestamptz' })
  createdAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  editedAt!: Date | null

  /**
   * Relationships
   */
  @ManyToOne('Chat')
  @JoinColumn({ name: 'chat_id', referencedColumnName: 'id' })
  chat!: Chat

  @ManyToOne('User')
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender!: User

  @ManyToOne('ChatMessage', { nullable: true })
  @JoinColumn({ name: 'replied_to_message_id', referencedColumnName: 'id' })
  repliedToMessage!: ChatMessage | null

  @OneToMany('EncryptedChatMessage', 'chatMessage')
  encryptedMessages!: EncryptedChatMessage[]
}
