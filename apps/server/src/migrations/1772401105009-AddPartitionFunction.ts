import { DatabaseConfig } from '@/config'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPartitionFunction1772401105009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE OR REPLACE FUNCTION ${DatabaseConfig.schema}.create_table_partition(table_name text, p_date date)
        RETURNS void
        LANGUAGE plpgsql
        AS $$
        DECLARE
            partition_name text;
            start_ts timestamptz;
            end_ts timestamptz;
        BEGIN
            partition_name :=
            table_name || '_' || to_char(p_date, 'YYYY_MM_DD');

            start_ts := p_date::timestamptz;
            end_ts := (p_date + INTERVAL '1 day')::timestamptz;

            EXECUTE format(
            'CREATE TABLE IF NOT EXISTS ${DatabaseConfig.schema}.%I
            PARTITION OF ${DatabaseConfig.schema}.%I
            FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            table_name,
            start_ts,
            end_ts
            );
        END;
        $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
