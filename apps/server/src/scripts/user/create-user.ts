import { initializeDataSource } from '@/database/DataSource'
import { UserService } from '@/services/internal/User.service'

const main = async () => {
  await initializeDataSource()

  for (const username of ['alatere', 'okabe', 'shizuka', 'itako']) {
    const code = await UserService.generateUserActivationCode({
      expiresInSeconds: 60,
    })

    await UserService.createUserFromCode({
      code,
      username,
      password: username,
      publicKey: username,
    })

    console.log('Created user:', username)
  }

  console.log('Done')
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
