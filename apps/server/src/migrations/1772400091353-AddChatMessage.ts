import { DatabaseConfig } from '@/config'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChatMessage1772400091353 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE ${DatabaseConfig.schema}.chat_messages (
          id bigserial NOT NULL,
          type text NOT NULL,
          chat_id bigint NOT NULL,
          sender_id bigint NOT NULL,
          replied_to_message_id bigint NULL,
          created_at timestamptz NOT NULL,
          edited_at timestamptz NULL,
          text text NULL,
          CONSTRAINT "FK_chat_messages_chat_id" FOREIGN KEY (chat_id) REFERENCES ${DatabaseConfig.schema}.chats(id) ON DELETE CASCADE,
          CONSTRAINT "FK_chat_messages_sender_id" FOREIGN KEY (sender_id) REFERENCES ${DatabaseConfig.schema}.users(id) ON DELETE CASCADE,
          CONSTRAINT "PK_chat_messages" PRIMARY KEY (chat_id, created_at, id)
        )
        PARTITION BY HASH (chat_id);
    `)

    for (let i = 0; i < 8; i++) {
      await queryRunner.query(`
        CREATE TABLE ${DatabaseConfig.schema}.chat_messages_h${i}
        PARTITION OF ${DatabaseConfig.schema}.chat_messages
        FOR VALUES WITH (modulus 8, remainder ${i})
        PARTITION BY RANGE (created_at);    
      `)
    }

    await queryRunner.query(`
        CREATE INDEX idx_chat_messages_id
        ON ${DatabaseConfig.schema}.chat_messages (id);    
    `)

    await queryRunner.query(`
        CREATE INDEX idx_chat_messages_chat_id_created_at
        ON ${DatabaseConfig.schema}.chat_messages (chat_id, created_at);
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
