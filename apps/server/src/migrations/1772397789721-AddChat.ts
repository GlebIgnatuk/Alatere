import { DatabaseConfig } from '@/config'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class AddChat1772397789721 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chats',
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
            name: 'type',
            type: 'text',
          },
          {
            name: 'last_message_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'created_by_id',
            type: 'bigint',
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
          {
            name: 'lookup_key',
            type: 'text',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_chats_created_by_id',
            columnNames: ['created_by_id'],
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
