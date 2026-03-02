import { decryptAssymmetric, encryptAssymmetric, generateAssymetricKeyPair } from '@/utils/crypto/asymmetric'
import { decryptSymmetric, encryptSymmetric, generateSymmetricKey } from '@/utils/crypto/symmetric'

const text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque a urna condimentum, tempus arcu id, fringilla quam. Nunc vestibulum condimentum dictum. Etiam scelerisque mi lorem, et tincidunt nisi ornare eget. In tristique dapibus quam nec ullamcorper. Sed vel tellus ac augue vestibulum ultrices. Donec convallis laoreet odio sit amet aliquam. Ut consectetur sem efficitur felis dictum tristique. Nunc hendrerit sodales arcu at laoreet. In vitae imperdiet neque. In maximus orci molestie arcu congue mollis.`
// const text = `hello world!`

function main() {
  const assymKey = generateAssymetricKeyPair()
  const symKey = generateSymmetricKey()

  const encryptedSymKey = encryptAssymmetric(symKey, assymKey.publicKey)
  console.log('encryptedSymKey', encryptedSymKey)
  const decryptedSymKey = decryptAssymmetric(assymKey.privateKey, encryptedSymKey)
  console.log('decryptedSymKey', symKey, decryptedSymKey, symKey === decryptedSymKey)
  const encryptedMessage = encryptSymmetric(decryptedSymKey, text)
  console.log('encryptedMessage', encryptedMessage)
  const decryptedMessage = decryptSymmetric(decryptedSymKey, encryptedMessage)
  console.log('decryptedMessage', decryptedMessage)
}

main()
