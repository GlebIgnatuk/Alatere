import { initializeDataSource } from '@/database/DataSource'
import { UserService } from '@/services/internal/User.service'
import { generateAssymetricKeyPair } from '@/utils/crypto/asymmetric'

const main = async () => {
  await initializeDataSource()

  for (const username of ['alatere', 'okabe', 'shizuka', 'itako']) {
    const code = await UserService.generateUserActivationCode({
      expiresInSeconds: 60,
    })

    const keyPair = generateAssymetricKeyPair()

    await UserService.createUserFromCode({
      code,
      username,
      password: username,
      publicKey: keyPair.publicKey,
    })

    console.log(
      `Created user: ${username}\n\n  code: ${code}\n  public key: ${keyPair.publicKey}\n  private key: ${keyPair.privateKey}\n`,
    )
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
