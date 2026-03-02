import { DatabaseConfig } from '@/config'
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class AddUserContact1772479130563 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_contacts',
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
            name: 'owner_id',
            type: 'bigint',
          },
          {
            name: 'contact_id',
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
        ],
        uniques: [
          {
            name: 'UQ_user_contacts_owner_id_contact_id',
            columnNames: ['owner_id', 'contact_id'],
          },
        ],
        foreignKeys: [
          {
            name: 'FK_user_contacts_owner_id',
            columnNames: ['owner_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_user_contacts_contact_id',
            columnNames: ['contact_id'],
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
