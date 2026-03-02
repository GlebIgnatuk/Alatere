import { DatabaseConfig } from '@/config'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class AddUserAndActivationCode1772394305038 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            name: 'username',
            type: 'text',
          },
          {
            name: 'password',
            type: 'text',
          },
          {
            name: 'public_key',
            type: 'text',
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
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'idx_users_deleted_at',
            columnNames: ['deleted_at'],
          },
        ],
        uniques: [
          {
            name: 'UQ_users_username',
            columnNames: ['username'],
          },
        ],
      }),
    )

    await queryRunner.createTable(
      new Table({
        name: 'user_activation_codes',
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
            name: 'code',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'used_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'used_by_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
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
            name: 'FK_user_activation_codes_used_by_id',
            columnNames: ['used_by_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'idx_user_activation_codes_code',
            columnNames: ['code'],
          },
        ],
        uniques: [
          {
            name: 'UQ_user_activation_codes_code',
            columnNames: ['code'],
          },
        ],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
