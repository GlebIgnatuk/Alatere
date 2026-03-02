import { initializeDataSource } from '@/database/DataSource'
import { UserService } from '@/services/internal/User.service'

const main = async () => {
  await initializeDataSource()

  const code = await UserService.generateUserActivationCode({
    expiresInSeconds: 7 * 24 * 60 * 60,
    // expiresInSeconds: 15,
  })

  console.log('Activation code:', code)
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

// expired: nUaV4PTvcw17RCmqvqHf-a73g6_J6DmktIAEAAy9wzUJZSIFiB8Hgkrc3PqHdY5-FqOb2Lm6R-TXzyzSyRIEjQ
// good   : lSmpGwWa5IQXXXXp77GPvoIkfDFOvbHNtT0N1ShTLxRP7BsDQZf1s-0t5vLns1Lj4fJ6XRGI__kwj4K_IUfiwA
