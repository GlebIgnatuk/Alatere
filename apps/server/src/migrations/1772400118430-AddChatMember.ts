import { DatabaseConfig } from '@/config'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class AddChatMember1772400118430 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chat_members',
        schema: DatabaseConfig.schema,
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'chat_id',
            type: 'bigint',
          },
          {
            name: 'user_id',
            type: 'bigint',
          },
          {
            name: 'status',
            type: 'text',
          },
          {
            name: 'last_read_message_timestamp',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'unread_message_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_chat_members_chat_id',
            columnNames: ['chat_id'],
            referencedTableName: 'chats',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_chat_members_user_id',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
