import { DatabaseConfig } from '@/config'
import { AppDataSource, initializeDataSource } from '@/database/DataSource'

const main = async () => {
  await initializeDataSource()

  for (let i = 0; i < 8; i++) {
    await AppDataSource.query(`
      SELECT ${DatabaseConfig.schema}.create_table_partition('chat_messages_h${i}', d::date)
      FROM generate_series(current_date, current_date + 30, interval '1 day') as d;
    `)
    await AppDataSource.query(`
      SELECT ${DatabaseConfig.schema}.create_table_partition('encrypted_chat_messages_h${i}', d::date)
      FROM generate_series(current_date, current_date + 30, interval '1 day') as d;
    `)
  }
}

main()
  .then(() => {
    console.log('Done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
